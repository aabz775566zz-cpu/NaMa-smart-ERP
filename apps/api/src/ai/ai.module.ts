import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReportsModule } from '../reports/reports.module';
import { AiToolRegistryService } from './ai-tool-registry.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnthropicLlmProvider } from './llm/anthropic-llm-provider';
import { GeminiLlmProvider } from './llm/gemini-llm-provider';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { OpenAiLlmProvider } from './llm/openai-llm-provider';
import { StubLlmProvider } from './llm/stub-llm-provider';

// Three real vendor adapters, all implementing the same LlmProvider contract
// (see llm-provider.interface.ts) — none of AiService, the tool registry, or
// any other business logic knows or cares which one is bound here.
const PROVIDERS = {
  anthropic: AnthropicLlmProvider,
  openai: OpenAiLlmProvider,
  gemini: GeminiLlmProvider,
} as const;

// AI_PROVIDER picks a vendor explicitly. Without it, auto-detect by whichever
// API key is actually set (Anthropic first, for backward compatibility with
// deployments that predate this env var) — and fall back to the deterministic
// stub only when no real key is configured, so local dev and CI still run the
// full tool-calling pipeline without any vendor credentials.
function resolveLlmProviderClass() {
  const requested = process.env.AI_PROVIDER?.toLowerCase() as keyof typeof PROVIDERS | undefined;
  if (requested) {
    const provider = PROVIDERS[requested];
    if (!provider) {
      throw new Error(`Unknown AI_PROVIDER "${process.env.AI_PROVIDER}". Expected one of: ${Object.keys(PROVIDERS).join(', ')}.`);
    }
    return provider;
  }

  if (process.env.ANTHROPIC_API_KEY) return AnthropicLlmProvider;
  if (process.env.OPENAI_API_KEY) return OpenAiLlmProvider;
  if (process.env.GEMINI_API_KEY) return GeminiLlmProvider;
  return StubLlmProvider;
}

const llmProvider = {
  provide: LLM_PROVIDER,
  useClass: resolveLlmProviderClass(),
};

@Module({
  // CustomersModule/PaymentsModule: the write-capable propose_record_customer_payment
  // tool (and its confirm step in AiService) reuse CustomersService.searchByName()
  // and PaymentsService.recordPayment() directly — same "wrap an existing,
  // already-tested service method" rule every other tool already follows.
  imports: [ReportsModule, InventoryModule, CustomersModule, PaymentsModule],
  controllers: [AiController],
  providers: [AiService, AiToolRegistryService, TenantGuardedPrismaService, llmProvider],
})
export class AiModule {}

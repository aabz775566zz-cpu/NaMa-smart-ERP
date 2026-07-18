import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';
import { AiToolRegistryService } from './ai-tool-registry.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnthropicLlmProvider } from './llm/anthropic-llm-provider';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { StubLlmProvider } from './llm/stub-llm-provider';

// Bind the real Claude adapter when an API key is configured; otherwise keep
// the deterministic stub so local dev and CI (which have no key) still run the
// full tool-calling pipeline. Swapping providers touches nothing but this line.
const llmProvider = {
  provide: LLM_PROVIDER,
  useClass: process.env.ANTHROPIC_API_KEY ? AnthropicLlmProvider : StubLlmProvider,
};

@Module({
  imports: [ReportsModule, InventoryModule],
  controllers: [AiController],
  providers: [AiService, AiToolRegistryService, TenantGuardedPrismaService, llmProvider],
})
export class AiModule {}

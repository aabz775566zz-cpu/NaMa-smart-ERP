import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';
import { AiToolRegistryService } from './ai-tool-registry.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { StubLlmProvider } from './llm/stub-llm-provider';

@Module({
  imports: [ReportsModule, InventoryModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiToolRegistryService,
    TenantGuardedPrismaService,
    { provide: LLM_PROVIDER, useClass: StubLlmProvider },
  ],
})
export class AiModule {}

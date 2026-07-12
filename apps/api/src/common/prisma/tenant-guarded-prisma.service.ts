import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

// Tenant-owned business models only. IAM models (User, Company, Membership,
// Role, Permission, RolePermission, RefreshToken, ActivityLog) are
// deliberately excluded — Phase 2 already has its own companyId-filtering
// discipline and legitimately needs cross-company reads (e.g. looking up a
// user's memberships across companies for the company switcher). Extend this
// set as later Phase 3 modules (Customer, Sale, ...) come online.
const TENANT_SCOPED_MODELS = new Set<string>([
  'Product',
  'Category',
  'Customer',
  'InventoryMovement',
  'Sale',
  'SaleItem',
  'Invoice',
  'Payment',
  'CompanyCounter',
  'AIConversation',
  'AIMessage',
  'AIUsageLog',
]);

const WHERE_GUARDED_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

function whereIncludesCompanyId(where: unknown): boolean {
  if (!where || typeof where !== 'object') return false;
  const w = where as Record<string, unknown>;
  if (w.companyId != null) return true;
  // Compound-unique lookups nest companyId one level down, e.g.
  // { companyId_sku: { companyId, sku } }.
  return Object.values(w).some(
    (v) => v && typeof v === 'object' && (v as Record<string, unknown>).companyId != null,
  );
}

@Injectable()
export class TenantGuardedPrismaService {
  private readonly logger = new Logger('TenantGuard');
  readonly client;

  constructor(prisma: PrismaService) {
    this.client = prisma.$extends({
      name: 'tenant-guard',
      query: {
        $allModels: {
          $allOperations: ({ model, operation, args, query }) => {
            if (model && TENANT_SCOPED_MODELS.has(model)) {
              if (
                WHERE_GUARDED_OPERATIONS.has(operation) &&
                !whereIncludesCompanyId((args as { where?: unknown })?.where)
              ) {
                this.logger.error(`Blocked ${model}.${operation} — missing companyId in "where".`);
                throw new Error(`Tenant guard: ${model}.${operation} requires a companyId filter.`);
              }
              if (
                operation === 'create' &&
                !(args as { data?: { companyId?: string } })?.data?.companyId
              ) {
                this.logger.error(`Blocked ${model}.create — missing companyId in "data".`);
                throw new Error(`Tenant guard: ${model}.create requires companyId in data.`);
              }
            }
            return query(args);
          },
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { PermissionKey } from '@erp-smart/types';

import { InventoryService } from '../inventory/inventory.service';
import { ReportsService } from '../reports/reports.service';

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // input schema
  // The AI orchestrator checks this against the calling user's JWT
  // permissions BEFORE execution — same deny-by-default posture as
  // PermissionsGuard on every REST endpoint. A tool is never executed, and
  // its result never enters the LLM's context, for a user who lacks it.
  requiredPermission: PermissionKey;
  execute: (companyId: string, args: Record<string, unknown>) => Promise<unknown>; // handler
}

// Basic defensive validation on LLM-extracted arguments — an LLM (especially
// a real one, unlike the deterministic stub) could plausibly extract a
// malformed value despite the JSON schema. Throwing here is caught by
// AiService's per-tool-call try/catch and recorded as a failed tool call,
// not a crashed request.
function parseOptionalLimit(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid "limit" argument: ${JSON.stringify(value)}`);
  }
  return value;
}

// Every tool wraps an existing, already-tenant-scoped, already-permission-
// tested Phase 3 service method — no business logic lives here, only
// argument shaping and dispatch. requiredPermission is set to match exactly
// what the equivalent REST route already requires for the same data, so AI
// can never see more than the same user could already see via the API.
@Injectable()
export class AiToolRegistryService {
  private readonly tools: AiToolDefinition[];

  constructor(
    private readonly reportsService: ReportsService,
    private readonly inventoryService: InventoryService,
  ) {
    this.tools = [
      {
        name: 'get_sales_summary',
        description: 'Get total revenue, sale count, and average sale value for a date range.',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'ISO date, optional' },
            to: { type: 'string', description: 'ISO date, optional' },
          },
        },
        requiredPermission: 'REPORTS:READ', // matches GET /reports/sales
        execute: (companyId, args) =>
          this.reportsService.getSalesReport(companyId, {
            from: args.from as string | undefined,
            to: args.to as string | undefined,
          }),
      },
      {
        name: 'get_top_products',
        description: 'Get the top-selling products by revenue for a date range.',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            limit: { type: 'number' },
          },
        },
        requiredPermission: 'REPORTS:READ', // matches GET /reports/products
        execute: (companyId, args) =>
          this.reportsService.getProductsReport(companyId, {
            from: args.from as string | undefined,
            to: args.to as string | undefined,
            limit: parseOptionalLimit(args.limit),
          }),
      },
      {
        name: 'get_top_customers',
        description: 'Get the top customers by total spend for a date range.',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            limit: { type: 'number' },
          },
        },
        requiredPermission: 'REPORTS:READ', // matches GET /reports/customers
        execute: (companyId, args) =>
          this.reportsService.getCustomersReport(companyId, {
            from: args.from as string | undefined,
            to: args.to as string | undefined,
            limit: parseOptionalLimit(args.limit),
          }),
      },
      {
        name: 'get_inventory_status',
        description: 'Get current stock valuation, total units in stock, and total product count.',
        parameters: { type: 'object', properties: {} },
        requiredPermission: 'REPORTS:READ', // matches GET /reports/inventory
        execute: (companyId) => this.reportsService.getInventoryReport(companyId),
      },
      {
        name: 'get_low_stock_products',
        description: 'List products at or below their configured low-stock threshold.',
        parameters: { type: 'object', properties: {} },
        requiredPermission: 'INVENTORY:READ', // matches GET /inventory/low-stock — this tool calls InventoryService directly, not via Reports
        execute: (companyId) => this.inventoryService.listLowStock(companyId),
      },
    ];
  }

  list(): AiToolDefinition[] {
    return this.tools;
  }

  findByName(name: string): AiToolDefinition | undefined {
    return this.tools.find((tool) => tool.name === name);
  }
}

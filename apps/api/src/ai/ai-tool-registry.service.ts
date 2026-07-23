import { Injectable } from '@nestjs/common';
import type { AIPendingActionResult, PaymentMethod, PermissionKey } from '@erp-smart/types';

import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';
import { ReportsService } from '../reports/reports.service';
import { SupplierPaymentsService } from '../supplier-payments/supplier-payments.service';
import { SuppliersService } from '../suppliers/suppliers.service';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'OTHER'];

function parseRequiredAmount(value: unknown): number {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid "amount" argument: ${JSON.stringify(value)}. Must be a positive number.`);
  }
  return Math.round(amount * 100) / 100;
}

function parseOptionalMethod(value: unknown): PaymentMethod {
  if (value == null) return 'CASH';
  if (typeof value === 'string' && (PAYMENT_METHODS as string[]).includes(value.toUpperCase())) {
    return value.toUpperCase() as PaymentMethod;
  }
  throw new Error(`Invalid "method" argument: ${JSON.stringify(value)}. Must be one of ${PAYMENT_METHODS.join(', ')}.`);
}

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
//
// Write-capable tools never mutate anything themselves — a tool named
// `propose_*` only validates and
// returns a `{ pendingConfirmation: true, action, summary, params }` payload,
// which the frontend renders as a Confirm/Cancel card. The actual write only
// happens in AiService.confirmAction(), triggered by an explicit user click,
// which re-reads the persisted tool-call message (never trusts a client-
// supplied payload) and re-dispatches through the exact same permission-
// checked service method a human would use from the regular UI. The LLM
// proposes; it never gets to execute.
@Injectable()
export class AiToolRegistryService {
  private readonly tools: AiToolDefinition[];

  constructor(
    private readonly reportsService: ReportsService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly paymentsService: PaymentsService,
    private readonly suppliersService: SuppliersService,
    private readonly supplierPaymentsService: SupplierPaymentsService,
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
      {
        // The one write-capable tool in the registry, and deliberately built
        // to never write anything itself — see the class doc comment below
        // for the two-phase design (propose here, execute only after the
        // user clicks Confirm in AiService.confirmAction()). Gated
        // INVOICES:UPDATE, matching PaymentsController.recordPayment()
        // exactly — the eventual write goes through that exact same
        // service method, so this tool can never do more than the REST
        // route already allows.
        name: 'propose_record_customer_payment',
        description:
          'Look up a customer by name and prepare a payment to record against their balance. This does NOT record the payment — it only prepares a confirmation card the user must approve. Use this whenever the user asks to record, log, collect, or take a payment from a customer.',
        parameters: {
          type: 'object',
          properties: {
            customerName: {
              type: 'string',
              description: "The customer's name (or partial name) as mentioned by the user.",
            },
            amount: { type: 'number', description: 'The payment amount, in the company currency.' },
            method: { type: 'string', description: 'One of CASH, CARD, TRANSFER, OTHER. Defaults to CASH.' },
            note: { type: 'string', description: 'Optional note about the payment.' },
          },
          required: ['customerName', 'amount'],
        },
        requiredPermission: 'INVOICES:UPDATE',
        execute: async (companyId, args) => {
          const customerName = String(args.customerName ?? '').trim();
          if (!customerName) throw new Error('"customerName" is required.');
          const amount = parseRequiredAmount(args.amount);
          const method = parseOptionalMethod(args.method);
          const note = args.note ? String(args.note) : undefined;

          const matches = await this.customersService.searchByName(companyId, customerName);

          // Not-found and ambiguous-match are normal outcomes, not failures
          // — returned as ordinary (non-throwing) results so the model
          // actually sees the message and can ask the user to clarify,
          // instead of AiService's catch block swallowing it into a generic
          // "This tool failed to execute."
          if (matches.length === 0) {
            return { pendingConfirmation: false, message: `No customer found matching "${customerName}".` };
          }
          if (matches.length > 1) {
            return {
              pendingConfirmation: false,
              message: `Multiple customers match "${customerName}": ${matches.map((c) => c.name).join(', ')}. Ask the user which one they mean, then try again with the exact name.`,
            };
          }

          const customer = matches[0];
          const ledger = await this.paymentsService.getLedger(companyId, customer.id);

          const result: AIPendingActionResult = {
            pendingConfirmation: true,
            action: 'RECORD_CUSTOMER_PAYMENT',
            summary: `Record a ${method.toLowerCase()} payment of ${amount} from ${customer.name} (current remaining balance: ${ledger.remaining}).`,
            params: { customerId: customer.id, customerName: customer.name, amount, method, note },
          };
          return result;
        },
      },
      {
        // Mirrors propose_record_customer_payment exactly, one direction
        // reversed (paying a supplier instead of collecting from a
        // customer) — same two-phase design, same
        // AiService.confirmAction() dispatch pattern. Gated PURCHASES:UPDATE,
        // matching SupplierPaymentsController.recordPayment() exactly.
        name: 'propose_record_supplier_payment',
        description:
          'Look up a supplier by name and prepare a payment to record against what we owe them. This does NOT record the payment — it only prepares a confirmation card the user must approve. Use this whenever the user asks to pay, record, or log a payment to a supplier.',
        parameters: {
          type: 'object',
          properties: {
            supplierName: {
              type: 'string',
              description: "The supplier's name (or partial name) as mentioned by the user.",
            },
            amount: { type: 'number', description: 'The payment amount, in the company currency.' },
            method: { type: 'string', description: 'One of CASH, CARD, TRANSFER, OTHER. Defaults to CASH.' },
            note: { type: 'string', description: 'Optional note about the payment.' },
          },
          required: ['supplierName', 'amount'],
        },
        requiredPermission: 'PURCHASES:UPDATE',
        execute: async (companyId, args) => {
          const supplierName = String(args.supplierName ?? '').trim();
          if (!supplierName) throw new Error('"supplierName" is required.');
          const amount = parseRequiredAmount(args.amount);
          const method = parseOptionalMethod(args.method);
          const note = args.note ? String(args.note) : undefined;

          const matches = await this.suppliersService.searchByName(companyId, supplierName);

          if (matches.length === 0) {
            return { pendingConfirmation: false, message: `No supplier found matching "${supplierName}".` };
          }
          if (matches.length > 1) {
            return {
              pendingConfirmation: false,
              message: `Multiple suppliers match "${supplierName}": ${matches.map((s) => s.name).join(', ')}. Ask the user which one they mean, then try again with the exact name.`,
            };
          }

          const supplier = matches[0];
          const ledger = await this.supplierPaymentsService.getLedger(companyId, supplier.id);

          const result: AIPendingActionResult = {
            pendingConfirmation: true,
            action: 'RECORD_SUPPLIER_PAYMENT',
            summary: `Record a ${method.toLowerCase()} payment of ${amount} to ${supplier.name} (current remaining balance owed: ${ledger.remaining}).`,
            params: { supplierId: supplier.id, supplierName: supplier.name, amount, method, note },
          };
          return result;
        },
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

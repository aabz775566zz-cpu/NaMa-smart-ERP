# Continuation Note — Arabic Market Roadmap Execution

_Last updated: 2026-07-13. This file is a checkpoint for resuming work; it is
not a permanent design doc like the numbered `docs/` files._

## Current phase

**Phase 4 — Customer Debt Management**, backend complete and committed,
frontend not started.

Overall roadmap (executing autonomously under the standing Lead
Engineer/CTO authority): Phase 1 (currency) → Phase 2 (invoice PDF/print) →
Phase 3 (WhatsApp sharing) → **Phase 4 (customer debt/payments, in
progress)** → Phase 5 (fast sales/POS) → Phase 6 (product creation/opening
stock) → Phase 7 (CSV import) → Phase 8 (daily close report) → Arabic
quality pass → final report.

## Completed parts

- **Phases 1-3**: done, committed (`8309194`, `4796a55`, `e40a4ea`).
- **Phase 4 backend**: done, committed (`8027003`). Adds a `Payment` model
  (customer-level, no stored balances) and `PaymentsService` that computes
  each customer's debt fresh on every read — SUM(completed sale totals)
  minus SUM(payments), FIFO-allocated to the oldest unpaid sales first.
  `Sale.paymentStatus`/`Invoice.status` are a write-through cache of this
  computation, reconciled transactionally after every payment-affecting
  write (including the legacy `mark-paid` endpoint, which now settles
  through the same ledger via `PaymentsService.settleSaleInFull`).
  - New endpoints: `GET /customers/:id/ledger` (perm `CUSTOMERS:READ`),
    `POST /customers/:id/payments` (perm `INVOICES:UPDATE`, body
    `{ amount, method?, note? }`, both return the same ledger shape:
    `{ totalInvoiced, totalPaid, remaining, sales[], payments[] }` with
    money fields as `"123.45"` strings).
  - Verified: full e2e suite (15/15 passing) + a live scripted run
    confirming FIFO allocation, partial payments, and mark-paid settlement
    with no double-counting.
  - Migration `20260712221427_add_payment_model` is additive only (new
    table + FKs), already applied to both dev and test databases.

## Remaining tasks

1. **Phase 4 frontend** (not started):
   - `packages/types/src/payment.ts` — types matching the ledger response
     (`Payment`, `SaleAllocation`, `CustomerLedger`), reusing
     `PaymentMethod`/`PaymentStatus` already exported from `./sale` rather
     than redeclaring them. Add to `packages/types/src/index.ts` barrel.
   - `apps/web/src/features/customers/api.ts` / `hooks.ts` — add
     `getCustomerLedger`/`useCustomerLedger(customerId)` and
     `recordPayment`/`useRecordPayment()` (invalidate the ledger query and
     the invoices/sales list queries on success, since a payment can flip
     their status).
   - **New route** `apps/web/src/app/dashboard/customers/[id]/page.tsx` —
     first `[id]` dynamic route in `dashboard/**`; use Next 15's
     `use(params)` pattern (`{ params }: { params: Promise<{ id: string }> }`),
     matching `apps/web/src/app/invoices/[id]/print/page.tsx`'s convention.
     Show "Total debt: / Paid: / Remaining:" prominently, payment history
     list, a record-payment dialog (reuse the Dialog conventions from
     `apps/web/src/features/invoices/components/invoice-detail-dialog.tsx`),
     a customer statement view, and a WhatsApp debt-reminder button (reuse
     `buildWhatsAppLink`/`interpolate` from `@/lib/whatsapp.ts` — same
     pattern as `whatsapp-share-button.tsx`, new i18n key e.g.
     `customers.debtReminderMessage` using the locked-in Arabic term
     **تذكير بالمستحقات**, with `{{company}}`, `{{customer}}`,
     `{{remaining}}` tokens).
   - Add the `customers` i18n namespace to `packages/i18n/messages/{en,ar}.json`
     (does not exist yet) — labels for debt/paid/remaining, payment method,
     record payment, statement, etc. Use locked terminology: ذمم العملاء
     (customer receivables/debt ledger), المبلغ المستحق (total due).
   - Link from the existing flat customer list
     (`apps/web/src/app/dashboard/customers/page.tsx`) to the new detail
     route (currently list is fully dialog-driven with no navigation to a
     detail view).
   - Lint (`tsc --noEmit`), production build, live UI check in browser,
     commit.
2. Phases 5-8, Arabic quality pass, final report — not started.

## Next exact action

Resume Phase 4 by creating `packages/types/src/payment.ts`, wiring the
barrel export, then `apps/web/src/features/customers/api.ts`/`hooks.ts`,
then the `[id]/page.tsx` detail route — in that order, per the plan above.
An Explore agent has already mapped every relevant existing pattern (types
barrel convention, api/hooks convention, Dialog conventions, WhatsApp
button pattern, `useFormatMoney`/`useLocale` shapes, i18n namespace
structure) — no further exploration should be needed before writing code.

## Notes / gotchas hit this session

- `CreateSaleDto` items take no `unitPrice` — price is always server-derived
  from the live `Product.sellingPrice`.
- `CreateProductDto` has no `quantityOnHand` — opening stock must go through
  `POST /inventory/adjustments` (`type: 'PURCHASE'`) after product creation.
  (This is exactly the gap Phase 6 — "opening stock during product
  creation" — is meant to close.)
- Bash's `curl`/`curl.exe` cannot reliably reach the Windows-native API
  port from this environment; use PowerShell's `Invoke-WebRequest` or
  Node's `fetch()` (via `node -e`/a script file) for live verification.
- After any `nest build` / production build, the running `nest start
  --watch` dev server needs a restart (check `netstat -ano | grep ":4000"`
  for the PID before killing).

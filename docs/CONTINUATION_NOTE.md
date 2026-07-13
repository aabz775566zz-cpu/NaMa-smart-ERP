# Continuation Note — Arabic Market Roadmap Execution

_Last updated: 2026-07-13. This file is a checkpoint for resuming work; it is
not a permanent design doc like the numbered `docs/` files._

## Current phase

**Phase 4 is complete** (backend `8027003`, frontend `78582d8`). Moving into
**Phase 5 — Fast Sales/POS Workflow**.

Overall roadmap: Phase 1 (currency) → Phase 2 (invoice PDF/print) →
Phase 3 (WhatsApp sharing) → Phase 4 (customer debt/payments, **done**) →
**Phase 5 (fast sales/POS, starting)** → Phase 6 (product creation/opening
stock) → Phase 7 (CSV import) → Phase 8 (daily close report) → Arabic
quality pass → final report.

## Completed parts

- **Phases 1-3**: committed (`8309194`, `4796a55`, `e40a4ea`).
- **Phase 4 backend** (`8027003`): `Payment` model, dynamic FIFO ledger
  (`PaymentsService`), `mark-paid` reconciled through the same ledger.
  Endpoints: `GET /customers/:id/ledger`, `POST /customers/:id/payments`.
- **Phase 4 frontend** (`78582d8`): `/dashboard/customers/[id]` detail page
  — Total debt/Paid/Remaining `StatCard`s, sales history with per-sale FIFO
  status, payment history, record-payment dialog (with "settle full
  balance" shortcut), WhatsApp debt-reminder button, print-friendly
  statement (browser print on the same page), full `customers` i18n
  namespace in en/ar. Linked from the customers list (clickable name +
  dropdown item).
  - Verified: e2e suite 15/15, a full live scripted workflow (customer →
    unpaid sale → partial payment → FIFO-verified remaining → mark-paid
    settles the rest → remaining hits 0.00, no double-counting), production
    build, and both English and Arabic (RTL) detail-page rendering checked
    against the running dev server.

## Remaining tasks

Phase 5 (fast sales/POS) not started yet. Per the roadmap spec: improve
product search, product selection, quantity editing, cart experience,
payment selection, completion flow; design mobile-first; avoid many
dialogs; prepare architecture for future barcode scanner support. Then
Phases 6-8, Arabic quality pass, final report — all not started.

## Next exact action

Explore the current `apps/web/src/app/dashboard/sales/page.tsx` and
`apps/web/src/features/sales/` (SaleFormDialog, product selection UI) to
find the concrete friction points before redesigning — same
explore-before-code discipline used for Phase 4.

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
  for the PID before killing) — watch for a stray leftover process on the
  same port causing EADDRINUSE on restart; kill whatever `netstat` shows,
  not just the PID you remember starting.

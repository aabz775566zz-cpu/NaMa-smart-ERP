# Continuation Note — Arabic Market Roadmap Execution

_Last updated: 2026-07-13. This file is a checkpoint for resuming work; it is
not a permanent design doc like the numbered `docs/` files._

## Current phase

**Phases 1-7 are complete.** Moving into **Phase 8 — Daily Business
Features (daily close report)**.

Roadmap: Phase 1 (currency) → Phase 2 (invoice PDF/print) → Phase 3
(WhatsApp sharing) → Phase 4 (customer debt/payments) → Phase 5 (fast
sales/POS) → Phase 6 (product creation/opening stock) → Phase 7 (CSV
import) — all **done** → **Phase 8 (daily close report, starting)** →
Arabic quality pass → final report.

## Completed parts (commits, newest last)

- Phases 1-3: `8309194`, `4796a55`, `e40a4ea`.
- Phase 4 (customer debt/payments — dynamic FIFO ledger): `8027003` (backend), `78582d8` (frontend).
- Phase 5 (fast sales/POS — searchable product picker, cart steppers, inline customer quick-add, one-click complete): `cf0ff34`.
- Phase 6 (opening stock on product creation + unit label): `1a0b3d7`.
- Phase 7 (CSV product import — client-parsed preview, chunked import, per-row errors, category auto-create): `f580c23`.

Every phase was lint-checked (`tsc --noEmit`), production-built, and
live-verified against the running dev servers via Node/PowerShell scripts
before committing. The full `apps/api` e2e suite (15 tests) has stayed
green through every phase.

## Remaining tasks

Phase 8: daily close report — total sales, cash sales, credit sales,
payments collected, expenses if available, basic summary for shop owners.
Then Arabic quality pass (review every changed screen's copy — most of
Sales/Products still ships hardcoded English strings, not yet i18n-wired;
only Invoices/Customers-debt got real Arabic terminology so far) and the
final report (features/files/DB changes/tests/screens/risks/next phase).

## Next exact action

Explore `apps/api/src/reports/` (already has `reports.service.ts` with a
`dashboard`/`sales`/`products`/`customers`/`inventory` report per earlier
project history) to see if a day-scoped query already exists to extend,
then design the daily-close report: needs total sales, cash vs. credit
split (likely from `Sale.paymentMethod`/`paymentStatus`), payments
collected (from the Phase 4 `Payment` table — `SUM(amount) WHERE
createdAt` in the target day), and expenses only if an Expense concept
already exists (it doesn't, per the "don't over-engineer" limits — skip
expenses rather than inventing a new module for it).

## Notes / gotchas hit this session

- `CreateSaleDto` items take no `unitPrice` — price is always server-derived
  from the live `Product.sellingPrice`.
- `CreateProductDto` now supports `openingQuantity` (Phase 6) — posts a real
  audited `PURCHASE` InventoryMovement via `InventoryService.applyMovementWithTx`
  inside the same transaction as product creation, never a raw column write.
- Bash's `curl`/`curl.exe` cannot reliably reach the Windows-native API
  port from this environment; use PowerShell's `Invoke-WebRequest` or
  Node's `fetch()` (via `node -e`/a script file) for live verification.
- After any `nest build` / production build, the running `nest start
  --watch` dev server needs a restart. This session repeatedly accumulated
  **stray leftover dev-server processes** across many restarts (multiple
  `npm run dev:api` → `turbo` → `nest start --watch` chains left running
  simultaneously, causing EADDRINUSE and Prisma-generate file locks that
  killing just the port-bound PID didn't fix). Fix: `Get-CimInstance
  Win32_Process -Filter "Name='node.exe'"` filtered by command line
  (`-match 'nest|api'` or `'web|next'`) to find and kill the *entire*
  process family, not just whatever `netstat` shows as the current
  LISTENING PID.
- No CSV parsing library existed before Phase 7 — added `papaparse` +
  `@types/papaparse` to `apps/web`. Deliberately did NOT use papaparse's
  `worker: true` option (known bundler-compatibility friction under
  webpack/Next.js); relied instead on chunked network requests + a capped
  preview-table row count to keep large imports from freezing the UI.
- Sales/Products modules still use hardcoded English strings (no
  `messages.*` i18n wiring) — this was a deliberate scope call each time
  (matching the existing file's convention rather than partially
  i18n-wiring one new component in an otherwise-English file) and is
  explicitly deferred to the Arabic quality pass phase, not forgotten.

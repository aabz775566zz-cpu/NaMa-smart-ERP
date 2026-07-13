# Continuation Note — Arabic Market Roadmap Execution

_Last updated: 2026-07-13. This file is a checkpoint for resuming work; it is
not a permanent design doc like the numbered `docs/` files._

## Status: roadmap complete

All 8 phases + the Arabic quality pass are done and committed (see the
Final Report delivered in-conversation for the full breakdown — features,
files, DB changes, tests, screens verified, risks, recommended next
phase). This file now just tracks what's next.

## Commits (chronological)

`8309194` Phase 1 (currency) · `4796a55` Phase 2 (invoice PDF/print) ·
`e40a4ea` Phase 3 (WhatsApp) · `8027003`+`78582d8` Phase 4 (customer
debt/payments) · `cf0ff34` Phase 5 (fast sales/POS) · `1a0b3d7` Phase 6
(opening stock/units) · `f580c23` Phase 7 (CSV import) · `ef1f1a7` Phase 8
(daily close) · `41e8750` Arabic quality pass.

## Recommended next phase (not started)

Full i18n coverage of Sales/Products/Reports — these modules still ship
hardcoded English strings (a pre-existing condition before this session,
deliberately not touched mid-feature to avoid half-localizing files). This
is the natural next initiative, separate from the 8-phase feature roadmap
just completed. See the Final Report's "Recommended next phase" section
for the full reasoning and suggested approach.

## Notes / gotchas from this session (kept for future reference)

- `CreateSaleDto` items take no `unitPrice` — price is always server-derived
  from the live `Product.sellingPrice`.
- `CreateProductDto` supports `openingQuantity` (Phase 6) — posts a real
  audited `PURCHASE` InventoryMovement via `InventoryService.applyMovementWithTx`
  inside the same transaction as product creation, never a raw column write.
- Bash's `curl`/`curl.exe` cannot reliably reach the Windows-native API
  port from this environment; use PowerShell's `Invoke-WebRequest` or
  Node's `fetch()` (via `node -e`/a script file) for live verification.
- After any `nest build` / production build, the running `nest start
  --watch` dev server needs a restart. This session repeatedly accumulated
  stray leftover dev-server processes across many restarts. Fix:
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'"` filtered by
  command line (`-match 'nest|api'` or `'web|next'`) to find and kill the
  entire process family, not just whatever `netstat` shows as the current
  LISTENING PID.
- No CSV parsing library existed before Phase 7 — added `papaparse` +
  `@types/papaparse` to `apps/web`. Deliberately did NOT use papaparse's
  `worker: true` option (known bundler-compatibility friction under
  webpack/Next.js); relied on chunked network requests + a capped
  preview-table row count instead.
- "Cash sales" in the daily close report means `Sale.paymentStatus ===
  'PAID'` (paid in full at time of sale), not `paymentMethod === 'CASH'` —
  see the doc comment on `ReportsService.getDailyCloseReport()` for the
  full reasoning if this needs revisiting.

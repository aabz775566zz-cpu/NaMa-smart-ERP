# Premium Dashboard & AI Command Center — Implementation Specification

**Status:** Draft — awaiting approval. No source code has been modified to produce this document.
**Scope:** `apps/web` only. No backend/Prisma changes. No new AI capability — this is a new frontend entry point onto existing infrastructure.
**Supersedes in the dashboard's default composition:** nothing is deleted; one component (`RecentActivityCard`) stops being rendered by default (see §B.5).

This spec follows from two prior audit passes in this project's history: a technical/product audit (architecture, missing functionality, competitive comparison) and a premium-experience audit (visual identity, dashboard hierarchy, AI visibility). The approved direction from those audits is restated here only where it constrains a concrete decision below.

---

## A) Current architecture analysis

### A.1 `apps/web` dashboard structure (as it exists today)

| File | Responsibility |
|---|---|
| `apps/web/src/app/dashboard/page.tsx` | Composes the home screen: greeting header → `KpiOverview` → `RecentActivityCard` (2/3 width) → `SetupProgressCard` + `AiAssistantCard` (1/3 column) |
| `apps/web/src/features/dashboard/kpi-overview.tsx` | Real KPI strip (revenue/sales/customers/products/low-stock), backed by `useDashboardReport()` |
| `apps/web/src/features/dashboard/recent-activity-card.tsx` | Always renders its empty state today — no activity-feed backend exists. Exports an `ActivityItem` type deliberately shaped for a future real feed |
| `apps/web/src/features/dashboard/setup-progress-card.tsx` | Real onboarding checklist (products/customers/sales/members counts) + `useSetupProgressVisible()` permission gate |
| `apps/web/src/features/dashboard/ai-assistant-card.tsx` | Static promo card linking to `/dashboard/ai` |
| `apps/web/src/features/dashboard/dashboard-shell.tsx` | `Sidebar` + `DashboardHeader` + `<main>` composition, wraps every authenticated page |
| `apps/web/src/features/dashboard/header.tsx` | `MobileNav` · spacer · `LanguageSwitcher` · `ThemeToggle` · `UserMenu` — **this is where `CommandCenterTrigger` will be added** |
| `apps/web/src/app/dashboard/layout.tsx` | The auth gate — see §A.3 |

### A.2 Existing AI components (`apps/web/src/features/ai/`)

| File | Exports | Notes |
|---|---|---|
| `api.ts` | `sendChatMessage({ conversationId?, message })`, `listConversations(params?)`, `getConversation(id, params?)`, `deleteConversation(id)` | Thin wrappers over `apiClient`, hitting `/ai/chat`, `/ai/conversations[/:id]` |
| `hooks.ts` | `useConversations(params?)`, `useConversation(id)`, `useSendChatMessage()`, `useDeleteConversation()` | Standard TanStack Query hooks; `useSendChatMessage` invalidates the conversation + list caches on success |
| `components/chat-composer.tsx` | `ChatComposer` | Textarea + send button, 4000-char cap (matches `SendChatMessageDto`) |
| `components/message-list.tsx` | `MessageList` | Renders USER/ASSISTANT bubbles, filters out TOOL-role messages, has loading/error/empty states already |
| `components/message-bubble.tsx` | `MessageBubble` | Single message rendering |
| `components/conversation-sidebar.tsx` | `ConversationSidebar` | Full conversation history list — **not reused by the Command Center**, which is single-conversation-at-a-time by design (see §B.1) |

**Reuse plan:** `useSendChatMessage`, `MessageBubble` (or a reduced inline rendering of the same shape), and the existing `/ai/chat` contract are reused as-is. `ConversationSidebar` and the full `/dashboard/ai` page are untouched and remain the "go deeper" destination.

### A.3 Authentication layout

`apps/web/src/app/dashboard/layout.tsx` is a **client-side** gate: it reads `useAuthStore((s) => s.status)` and renders nothing (or a loader) until `status === 'authenticated'`, then renders `<DashboardShell>`. This has one direct consequence for this spec: **the global ⌘K listener must be registered inside `DashboardShell` (or lower), never in the root layout** — the root layout renders before authentication resolves, and a keyboard listener that's live pre-auth would let an unauthenticated visitor open a command center with nothing behind it.

### A.4 Dashboard shell

`DashboardShell` (`apps/web/src/features/dashboard/dashboard-shell.tsx`) is the single composition root for every authenticated page: `Sidebar` (desktop) + a column of `DashboardHeader` / `VerificationBanner` / `<main>`. This is the correct, and only, place to mount both the `CommandCenter` overlay itself and the keyboard shortcut listener, so it's guaranteed present on every dashboard route without per-page wiring.

### A.5 Existing AI API endpoints (`apps/api/src/ai/`)

| Method | Path | DTO in | Response | Auth |
|---|---|---|---|---|
| `POST` | `/ai/chat` | `SendChatMessageDto { conversationId?: string; message: string }` | `AIChatResponse { conversationId, message }` | `JwtAuthGuard` only — **no `@RequirePermission`**. Per-tool access control happens inside `AiService`, scoped by the caller's own permissions (see `ai.controller.ts:9-13` comment) |
| `GET` | `/ai/conversations` | `ListConversationsDto { limit?, offset? }` (query) | `AIConversation[]` | `JwtAuthGuard` |
| `GET` | `/ai/conversations/:id` | same query DTO | `AIConversationDetail` (includes `messages`) | `JwtAuthGuard` |
| `DELETE` | `/ai/conversations/:id` | — | `void` | `JwtAuthGuard` |

**This is the single most important finding for scoping this feature**: the Command Center needs **zero new backend endpoints**. It is purely a new frontend surface calling `POST /ai/chat` exactly as `/dashboard/ai` already does. Multi-tenant and permission rules are automatically intact because nothing about the request path changes — same endpoint, same guard, same per-tool scoping inside `AiService`.

### A.6 Existing state-management convention

`apps/web/src/lib/store/auth-store.ts` is the only global client store in the app today, built with `zustand`: a `create<AuthStore>((set) => ({...}))` holding state + actions, with small derived-selector hooks exported alongside it (`useCurrentUser`, `usePermissions`, `useHasPermission`, etc.). **`useCommandCenter` will follow this exact convention** — same library, same shape (state + actions in one store, thin selector hooks re-exported from `lib/store/index.ts`) — rather than introducing React Context or a different pattern for this one feature.

### A.7 Existing primitives available (`packages/ui`)

`Dialog`/`DialogContent`/`DialogOverlay` (Radix-based, already has the `max-h-[Nvh] flex flex-col` scroll pattern proven in `sale-form-dialog.tsx` and `product-form-dialog.tsx`), `Input`, `Button`. **No `cmdk` package and no `Command` primitive exist in this codebase today** — confirmed by grep. This directly informs §E's build-vs-adopt-a-library decision.

---

## B) Components to create

### B.1 `CommandCenter`

**Location:** `apps/web/src/features/ai/components/command-center.tsx`
**Purpose:** The overlay itself — opens over any page, contains a single input, shows the in-flight conversation inline, closes on send-and-view or Escape.
**Built on:** the existing `Dialog`/`DialogContent` primitives (no new dependency for V1 — see §E). Visually lighter than a standard form dialog: no `DialogHeader`/`DialogFooter` chrome, just an input at the top and results/response below, matching a command-palette's conventional weight rather than a form modal's.
**Data:** reuses `useSendChatMessage()` from the existing `features/ai/hooks.ts` unchanged. Renders the assistant's reply using the same message-rendering logic as `MessageBubble` (extracted if needed so both the full `/dashboard/ai` page and the Command Center render identically — see §E).
**Props:** none required from the caller — it reads its open state from `useCommandCenter()` itself, so any component can trigger it without prop-drilling.

### B.2 `CommandCenterTrigger`

**Location:** `apps/web/src/features/ai/components/command-center-trigger.tsx`
**Purpose:** The visible header button — "Ask AI ⌘K" (localized; see below). This exists specifically because a keyboard-shortcut-only affordance would be undiscoverable for the non-technical-owner persona this product targets.
**Renders:** a `Button` (ghost or outline variant, matching `ThemeToggle`/`LanguageSwitcher`'s visual weight in the header) showing the label plus a small kbd-style hint (`⌘K` / `Ctrl+K` depending on platform, detected via `navigator.platform` or `navigator.userAgentData`).
**Wiring:** added to `apps/web/src/features/dashboard/header.tsx`, placed before `LanguageSwitcher` in the existing `MobileNav · spacer · ... · UserMenu` row.

### B.3 `useCommandCenter`

**Location:** `apps/web/src/lib/command-center/command-center-store.ts` (+ re-exported from `apps/web/src/lib/command-center/index.ts`)
**Shape**, mirroring `auth-store.ts` precisely:

```ts
interface CommandCenterState {
  isOpen: boolean;
  seedContext: string | null; // e.g. "Customer: Ahmed Hassan" — see §D context-seeding
}
interface CommandCenterActions {
  open: (seedContext?: string) => void;
  close: () => void;
  toggle: () => void;
}
```

Plain Zustand store, no persistence (session-only, resets on reload — consistent with the ephemeral nature of a command palette). The global keyboard listener (registered in `DashboardShell`, per §A.3/A.4) calls `toggle()`; `CommandCenterTrigger` calls `open()`; contextual "Ask AI about this" affordances (future work, §implementation order) call `open(seedContext)`.

### B.4 `AttentionList`

**Location:** `apps/web/src/features/dashboard/attention-list.tsx`
**Purpose:** Replaces `RecentActivityCard`'s slot in the default dashboard composition with a list of **real, currently-true things that need the owner's attention** — see §C for exact data sources. This is the concrete mechanism for "what needs my attention today," and it is why the guaranteed-empty activity feed is not part of the new default layout (§B.5).
**Shape:** a `Card` containing 0–2 sub-sections (low-stock products, overdue invoices), each permission-gated independently (a user with `INVENTORY:READ` but not `INVOICES:READ` sees only the low-stock section, matching how every other screen in this app already gates sub-sections rather than the whole widget). If both sections are empty **and both permissions are present**, renders one calm "nothing needs attention" empty state — this is a genuinely good state, not a failure, and should read that way (see §D).

### B.5 Dashboard integration changes

`apps/web/src/app/dashboard/page.tsx` changes from:

```
KpiOverview
┌─ RecentActivityCard (2/3) ─┬─ SetupProgressCard + AiAssistantCard (1/3) ─┐
```

to:

```
KpiOverview
┌─ AttentionList (2/3) ─┬─ SetupProgressCard + AiAssistantCard (1/3) ─┐
```

**Explicit decision, not an oversight:** `RecentActivityCard` is not deleted — its file, its `ActivityItem` type, and its empty-state copy all remain in the codebase untouched, ready for the day a real cross-module activity feed exists (this was a deliberate future-readiness decision when it was first built, per its own code comment). It simply stops being part of *this* default composition, because `AttentionList` now occupies that visual slot with real data. `SetupProgressCard` and `AiAssistantCard` are unchanged in logic and position.

---

## C) Data sources

Each of the four requested signals, with the **exact** existing hook/endpoint, and one honest scoping call flagged explicitly rather than silently invented.

| Signal | Source | Shape | Gate |
|---|---|---|---|
| **Low stock products** | `useLowStock()` — `apps/web/src/features/inventory/hooks.ts`, backing `GET /inventory/low-stock` | `Product[]` | `INVENTORY:READ` (matches the existing gate in `apps/web/src/app/dashboard/inventory/page.tsx:28`) |
| **Unpaid invoices** | `useInvoices('ISSUED')` — `apps/web/src/features/invoices/hooks.ts`, backing `GET /invoices?status=ISSUED` | `Invoice[]` | `INVOICES:READ` (matches `apps/web/src/app/dashboard/invoices/page.tsx:19`) |
| **Overdue customers** | **Reframed to "overdue invoices."** See note below. | — | `INVOICES:READ` |
| **Setup progress** | `useSetupProgressVisible()` + the existing `SetupProgressCard` component, unmodified | — | Already gated on `PRODUCTS:READ && CUSTOMERS:READ && SALES:READ && USERS:READ` inside that hook |

**The "overdue customers" scoping decision, stated plainly:** the `Customer` type (`packages/types/src/customer.ts`) has no balance/debt field at all — a customer's outstanding balance only exists per-customer, computed on demand by `useCustomerLedger(customerId)`. There is no existing endpoint that returns "the list of customers who currently owe money," and computing it by fetching every customer's ledger individually (N+1) is the wrong way to power a dashboard widget. However, `Invoice` **does** have a `dueDate: string | null` field already on the wire. **"Overdue" for this feature means: an invoice with `status === 'ISSUED'` whose `dueDate` has passed** — computed client-side from data `useInvoices('ISSUED')` already returns, zero new backend work. This is the same real-world signal ("money owed, past due") the original request meant, expressed through data that actually exists today, rather than a customer-level aggregate that doesn't. If a true per-customer aggregate is wanted later, that's a new backend endpoint and belongs in the technical roadmap (Phase B, accounting core), not this feature.

`AttentionList` therefore renders (up to) **two** sections in practice: Low stock, and Overdue invoices (unpaid + past due date, a subset of the "unpaid invoices" query filtered client-side by `dueDate`).

---

## D) UX behavior

**Opening animation:** per `apple-design` and `emil-design-eng` principles applied earlier in this project — entrance should read as a light material arriving, not a heavy modal slamming in. Fade + slight scale from `0.97→1` (never from `scale(0)`), **150–200ms**, `ease-out`. This is faster than the Product dialog's modal treatment deliberately: a command palette is used far more frequently per session than a create-product form, and per `emil-design-eng`'s frequency framework, high-frequency UI should be fast and quiet, not orchestrated.

**Keyboard behavior:**
- `⌘K` (Mac) / `Ctrl+K` (Windows/Linux) toggles open/closed from anywhere in the authenticated app.
- `Escape` closes it, always, regardless of what's typed.
- `Enter` sends the current message (matching `ChatComposer`'s existing behavior).
- Focus moves to the input the instant the overlay opens (no click required) — this is the single most important interaction for a command palette to feel instant, per Apple's "respond on the moment of intent" principle.
- Focus returns to whatever triggered the open (the header button, or the page) on close — standard modal a11y, see §F.
- The listener must not fire inside a text input/textarea/contenteditable elsewhere on the page (e.g., don't hijack `Ctrl+K` while the user is typing in the Product form's description field) — check `document.activeElement` before toggling, same guard pattern any serious command-palette implementation needs.

**Empty states:**
- Command Center, no input yet: a quiet placeholder ("Ask about your sales, inventory, customers, or reports…" — reusing `messages.ai.askPlaceholder`, already exists) plus 3–4 example questions as clickable suggestions (from the actual examples list in the design proposal: "What's my revenue this month?", "Which products are low on stock?").
- `AttentionList`, nothing needs attention: a calm, positive empty state — this is a *good* outcome and must not look like a broken/empty widget. Reuse the `EmptyState` primitive with success-toned framing, not the same visual treatment as an error.

**Loading states:** Command Center's in-flight response reuses whatever loading treatment `MessageList`/`ChatComposer` already use (a lightweight typing/pending indicator, already built, per `useSendChatMessage().isPending`). `AttentionList`'s two sections load independently (`useLowStock`/`useInvoices` are separate queries) — each section shows its own `Skeleton`, not one shared spinner blocking both, so a slow invoices query never delays showing low-stock data that's already back.

**Error states:** Command Center reuses the existing `messages.ai.sendMessageFailed` toast pattern already wired in `/dashboard/ai`. `AttentionList` per-section errors degrade gracefully — if `useInvoices` errors, the low-stock section still renders; don't fail the whole widget for one query.

**RTL/Arabic behavior:** every new component must use logical properties throughout (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`, never `left`/`right`), matching the discipline already established project-wide. Specific items: the `⌘K` kbd hint should read `⌘K`/`Ctrl+K` unchanged in Arabic (keyboard shortcuts are not translated — this matches how Linear/Notion/Raycast all keep shortcut glyphs untranslated even in localized UI), but the trigger's visible label ("Ask AI") must come from `messages.ai.*` like everything else in this app. The Command Center's suggestion chips and input placeholder must wrap correctly for longer Arabic strings (apply the same `leading-snug`-on-labels lesson learned from the Product dialog's RTL fix, scoped locally, not by touching the shared `Label` component).

**Mobile behavior:** on small viewports the header's visible trigger may need to collapse to an icon-only button (mirroring how `MobileNav` already collapses the sidebar) to avoid crowding `LanguageSwitcher`/`ThemeToggle`/`UserMenu` — the ⌘K shortcut itself is desktop-only in practice (no physical Cmd/Ctrl key on a touch keyboard), so the visible, tappable trigger is not a nice-to-have on mobile, it is the *only* entry point there. `CommandCenter`'s overlay should occupy full-width/near-full-height on small viewports rather than the constrained-width desktop treatment, consistent with how `Sheet` is already used for mobile navigation.

---

## E) Component architecture

**Applying `vercel-composition-patterns` concretely:**
- `useCommandCenter` is the single place that knows *how* open/closed state is managed (a Zustand store) — every consumer (`CommandCenterTrigger`, the keyboard listener, any future contextual "Ask AI about this" button) only calls `open()`/`close()`/`toggle()`, never touches the store's internals directly. This is the "provider/store is the only place that knows the mechanism" principle, applied without inventing a new mechanism (reusing Zustand, per §A.6).
- No boolean-prop proliferation: `CommandCenter` takes no `variant`/`mode` props to switch behavior. If a future hybrid hierarchy (pure-chat vs. command-registry) is added, it should be a **separate internal component composed inside `CommandCenter`**, not a boolean flag threaded through one component's props.
- `AttentionList`'s two sections (low-stock, overdue-invoices) are two small, independently-loading, independently-permission-gated child pieces composed inside one container — not one monolithic component with internal `if/else` branches for what to show. Each section should be extractable and testable on its own.

**Applying shadcn/Radix principles:** V1 is built on the existing `Dialog` primitive already proven in this codebase (Product/Sale form dialogs), **not** a new `cmdk`-based Command component. This is a deliberate scope decision: `cmdk`'s value is fuzzy-search filtering across a registered command list — a pure AI launcher (this spec's approved scope) doesn't have a command list yet, so pulling in the dependency now would be premature. **The architecture should not, however, make adding it later expensive**: `CommandCenter`'s internal input-handling should be factored so that a future command-registry hybrid can slot in as an additional results section below the input, without restructuring the overlay shell, the keyboard binding, or `useCommandCenter` itself. Concretely: keep "the overlay shell + open state" (this spec) cleanly separate from "what renders below the input" (a single chat view today; a chat view *and* a filtered command list, later).

**No duplicated logic**: the assistant's message-rendering (bubble styling, USER/ASSISTANT distinction) must be shared between `/dashboard/ai`'s full page and the Command Center's inline view — either by having the Command Center reuse `MessageBubble` directly, or by extracting the smallest shared piece if `MessageBubble` currently assumes a full-page layout context it can't satisfy in a compact overlay. This needs a quick read of `message-bubble.tsx`'s actual assumptions before implementation — flagged here rather than assumed, since I have not re-read that specific file's internals as part of this pass.

---

## F) Accessibility

- **Keyboard navigation**: the overlay is a proper focus trap while open (Radix `Dialog` already provides this) — Tab/Shift+Tab cycle within it, never escape to the page behind. `Escape` closes and returns focus to the trigger element that opened it (the header button, or wherever `open()` was called from).
- **Focus management**: focus moves to the input on open (see §D), and is restored to the triggering element on close — this is standard Radix `Dialog` behavior and should not need custom code, but must be verified, not assumed, once built.
- **Screen reader support**: the overlay needs `role="dialog"` with an accessible name (Radix provides this via `DialogTitle`, which can be visually hidden — `sr-only` — while still being announced, matching the existing pattern already used elsewhere in this codebase, e.g. `DialogPrimitive.Close`'s `sr-only` "Close" label). The assistant's response region should be an `aria-live="polite"` region so a screen-reader user is told when a reply arrives without needing to navigate to it manually — this is genuinely new work, since the existing `/dashboard/ai` `MessageList` was not confirmed to have this in the current review and should be checked/added for both surfaces together, not just the new one.
- **Reduced motion**: the open/close animation (§D) must respect `prefers-reduced-motion` — cross-fade only, no scale, matching the standing convention already established for this project's other motion work.

---

## G) Testing strategy

### Unit tests
- `useCommandCenter` store: `open()`/`close()`/`toggle()` transitions, `seedContext` is set on `open(context)` and cleared on `close()`.
- `AttentionList`'s data-shaping logic in isolation: given a list of invoices, the "overdue" filter (`status === 'ISSUED' && dueDate < now`) is a pure function and should be unit-tested directly with fixed `Date` values (fake timers), independent of the component that renders it.
- Permission-gating: each `AttentionList` section renders/doesn't render correctly for each permission combination (both, one, neither, matching the existing test style used for other permission-gated components in this codebase).

### Integration tests
- `CommandCenter` opens on `⌘K`, closes on `Escape`, does not open when focus is inside an existing text field (the guard from §D).
- `CommandCenterTrigger` click opens the same overlay as the shortcut (single source of truth via `useCommandCenter`).
- Submitting a question in the Command Center calls the existing `useSendChatMessage()` mutation with the correct payload shape and renders the response using the same rendering path as `/dashboard/ai`.
- `AttentionList` renders the low-stock and overdue-invoices sections independently when one query is loading/erroring and the other has resolved.

### Playwright scenarios

**Prerequisite, stated honestly**: this repository has no Playwright installation today (no `playwright.config.ts`, no `@playwright/test` dependency, confirmed by direct check). Bootstrapping it (`npm init playwright@latest`, choosing TypeScript + the existing monorepo's `apps/web` as the test target) is itself a small first step this spec should surface explicitly rather than assume — it adds a new dev dependency and a config file to the repo, which is a decision worth a deliberate yes, not a silent default.

Once bootstrapped, following this project's own `playwright-cli` skill's plan → generate → heal workflow, a seed test authenticates (reusing the existing register/login flow already proven via direct API calls in this project's history) and lands on `/dashboard`. Planned scenarios:

1. **Command Center — keyboard access**
   - Press `Ctrl+K` from `/dashboard` → overlay is visible, input is focused.
   - Press `Escape` → overlay closes, focus returns to the page.
   - Navigate to `/dashboard/products`, press `Ctrl+K` → overlay opens from a different page (proves it's global, not page-scoped).
2. **Command Center — visible trigger**
   - Click the "Ask AI ⌘K" header button → same overlay opens (proves both entry points converge on one store).
3. **Command Center — asking a question**
   - Open the Command Center, type a question, press Enter → a response renders inline; the response text is asserted via `toBeVisible()` on the response region rather than asserting exact AI wording (which is non-deterministic).
4. **Attention List — real data, no fabrication**
   - Seed a company with a product below its low-stock threshold and an overdue invoice (via the existing API, not the UI) → both sections of `AttentionList` show the seeded items on `/dashboard`.
   - Seed a company with neither condition true → the calm "nothing needs attention" state renders, not an error and not a blank box.
5. **RTL**
   - Switch locale to Arabic, repeat scenario 3 → overlay opens correctly, input/response direction and label wrapping are visually correct (this is the one scenario worth a screenshot-based check, not just DOM assertions, since RTL layout correctness is inherently visual).
6. **Mobile**
   - Emulate a mobile viewport (`playwright-cli open --mobile` during exploration; `devices['Pixel 7']`-equivalent in the actual test config) → the header trigger is present and tappable; the overlay takes the full-viewport mobile treatment rather than the constrained desktop width.

Per the `playwright-cli` skill's own discipline: these scenarios should be written to a plan file (`specs/command-center.plan.md`) during actual implementation, then generated one at a time by driving the real running app through `playwright-cli`, not authored blind — the exact selectors and assertions above are illustrative of *what* to cover, not final locator strings, since those don't exist until the components do.

---

## Summary of decisions made in this document that need your explicit sign-off

1. **"Overdue customers" → "overdue invoices"** (§C) — same real-world meaning, backed by data that actually exists, instead of a fabricated or N+1-computed customer aggregate.
2. **`RecentActivityCard` stops being rendered by default, but is not deleted** (§B.5).
3. **V1 built on the existing `Dialog` primitive, no `cmdk` dependency added yet** — architected so a future command-registry hybrid doesn't require a rebuild (§E).
4. **Playwright needs to be bootstrapped from scratch** in this repo before any of §G's scenarios can be generated — a new dev dependency + config, worth a deliberate decision (§G).

Everything else in this document is a direct, low-ambiguity consequence of the approved design direction and the codebase as it exists today.

**Waiting for approval before any source file is modified.**

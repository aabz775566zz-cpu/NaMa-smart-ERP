# P0 Premium Redesign — Implementation Plan

**Status:** Planning only — no code written yet. This plan is scoped strictly to the 5 P0 goals; everything in P1–P3 of `docs/design/premium-redesign-strategy.md` is explicitly out of scope here.
**Goal:** Ship the five highest-visual-impact, lowest-risk changes identified in the P0 tier of the redesign strategy, without touching the backend, without restructuring the app's architecture, and without regressing RTL/dark mode/i18n anywhere.

## Global constraints (apply to every phase below)

- **No backend/Prisma changes.** Anything that would need one (KPI period-over-period deltas) is explicitly deferred to P1 and is called out below, not included here.
- **No new state-management pattern.** Anything new follows the existing conventions already established in this codebase: Zustand for global client state (already exists, not touched by this plan), TanStack Query for server state, plain props for presentational components.
- **RTL is not optional.** Every new class is a logical property (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`), never `left`/`right`/`ml`/`mr`. Every new file gets checked in both `en` and `ar` before being considered done.
- **Dark mode is not optional.** Every new color is a semantic token (`bg-card`, `text-muted-foreground`, `border-border`, etc.), never a raw hex or a light-mode-only assumption.
- **i18n is not optional.** Every new user-facing string is a new key in both `packages/i18n/messages/en.json` and `ar.json` — reusing an existing key is preferred over adding a new one wherever the meaning genuinely matches (one confirmed reuse below: `messages.comingSoon.badge`).
- **No fake data, no fake flows.** Every "quick action" and every empty/populated state renders only from data the API already returns.

---

## Current-state correction before planning further

Re-checked against the live code (not memory) before writing this: `apps/web/src/app/dashboard/page.tsx` still renders `RecentActivityCard`, which is **hard-coded to always show its empty state** — no backend feed exists for it and it was never wired up. The `AttentionList`/`LowStockSection`/`OverdueInvoicesSection`/`isInvoiceOverdue` components were already fully designed, with complete code, in the earlier approved plan `docs/superpowers/plans/2026-07-15-premium-dashboard-ai-command-center.md` (its Tasks 10–13) — but that work was never executed in this session (only the Command Center overlay/trigger/shortcut tasks were). This matters a lot for P0: **the single biggest lever for both "dashboard visual hierarchy" (goal 2) and "empty states" (goal 4) is finishing work that is already fully specified**, not new design. This plan folds that execution in rather than re-designing it, and points back to the exact tasks rather than duplicating their content.

Also corrected from the strategy doc: the strategy doc's example Quick Actions list ("New sale, New invoice, New customer") included an impossible action — there is no `POST /invoices` endpoint; invoices are only ever auto-generated when a sale completes (confirmed in `apps/web/src/features/invoices/api.ts`'s own comment). Quick Actions below use **New Sale / New Customer / New Product** instead — three real, actually-creatable entities.

---

## Phase 0 — Shared primitive fixes (do first; every later phase benefits)

These are small, standalone, high-leverage fixes to primitives every other phase touches or resembles. Doing them first means Phases 1–3 can immediately use the corrected patterns instead of copying the old behavior and having to revisit it.

### 0.1 — `EmptyState` gains a `tone` prop

**File:** `packages/ui/src/components/ui/empty-state.tsx` (modify)

Today `EmptyState` always renders its icon in a `bg-primary/10 text-primary` circle, regardless of whether the empty state is a genuinely good outcome ("nothing needs attention") or a neutral/error one ("no activity yet," "couldn't load"). Add an optional `tone` prop (`'default' | 'success'`, defaulting to `'default'` so every existing call site is unaffected):

```tsx
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: 'default' | 'success';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, tone = 'default', ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-14 text-center', className)} {...props}>
      {icon ? (
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full [&_svg]:size-6',
            tone === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>
      ) : null}
      {/* ...rest unchanged... */}
    </div>
  ),
);
```

This is additive and backward-compatible — every existing call site (`MessageList`, `RecentActivityCard`, invoices/customers/products empty states) keeps rendering exactly as it does today. `tone="success"` is what Phase 2's `AttentionList` "nothing needs attention" state will use, so it reads as a genuinely good outcome, not a muted variant of an error.

**RTL/dark mode:** no directional classes involved; `bg-success/10 text-success` already resolves correctly in both themes via the existing `--success` token.

---

### 0.2 — `Card` hover-elevate becomes opt-in, not automatic

**File:** `packages/ui/src/components/ui/card.tsx` (modify)

Today every `Card` instance gets `hover:shadow-md` whether or not it's actually interactive — a purely informational card (e.g. `SetupProgressCard`'s "all done" state) currently lifts on hover for no reason, which is exactly the kind of inconsistent affordance `impeccable`'s product register calls out ("Same button shape. Same form-control vocabulary" — the same logic applies to "does this surface respond to hover because it does something, or not").

```tsx
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Set when the whole card is a single click/link target (e.g. a
   * dashboard tile) — only then does it get the hover-elevate affordance. */
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-shadow duration-200',
        interactive && 'hover:shadow-md',
        className,
      )}
      {...props}
    />
  ),
);
```

Two changes bundled here, both small: (a) `interactive` prop gates the hover lift, (b) resting shadow changes from none to `shadow-xs` (a very subtle 1px elevation) so cards read as surfaces even at rest — matching the strategy doc's shadow-scale recommendation. **`shadow-xs` needs adding to `tailwind.preset.ts`** if it isn't already a default Tailwind utility at this version — verify during implementation; if it already resolves (Tailwind 3.x ships `shadow-sm` but not always `shadow-xs` depending on version), fall back to a custom `boxShadow.xs` token in the preset instead of assuming.

**Every existing call site that should keep the hover lift needs `interactive` added explicitly** — this is a deliberate, visible migration, not a silent behavior change:
- `apps/web/src/features/dashboard/kpi-overview.tsx` — its tiles are `Link`s inside the single outer `Card`, not per-tile Cards, so **no change needed here** (the outer Card already correctly has its own `hover:shadow-sm` applied via className override, unaffected by this default change).
- Any other `Card` used as a direct link/button target — audit during implementation by grepping `<Card` usages across `apps/web/src`; add `interactive` only where the whole card is clickable. Do not add it defensively to every card "just in case" — that defeats the point of this fix.

**RTL/dark mode:** no directional classes; `shadow-xs`/`hover:shadow-md` are already theme-agnostic (shadows don't need dark-mode-specific values in this token system, consistent with existing `shadow-md` usage elsewhere).

---

### 0.3 — `Button` gains a `loading` state

**File:** `packages/ui/src/components/ui/button.tsx` (modify)

Every mutation in this app already exposes `isPending` (`useMarkInvoicePaid`, `useSendChatMessage`, `useLogin`, etc.) but no `Button` in the codebase renders a loading indicator from it — call sites either disable the button with no visual feedback beyond that, or (per `login/page.tsx`) swap the label text manually. Add a proper `loading` prop:

```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {children}
      </Comp>
    );
  },
);
```

(`Loader2` from `lucide-react`, already the project's only icon family — no new dependency.) This is additive; `loading` defaults to `false` so every existing `<Button>` call site is visually unchanged until a call site opts in. **Not migrating every existing call site in P0** — that's a larger sweep better done incrementally as each page is touched. Scope here is just: the prop exists, is correct, and is used by whichever P0 call sites need it (none strictly required by the other 4 goals, but available for Phase 2's Quick Actions if a create-flow ever needs an inline pending state).

**RTL:** the spinner has no inherent direction; `animate-spin` rotates identically in both directions — no RTL concern.

---

### 0.4 — Centralize `prefers-reduced-motion` handling in `Dialog`

**File:** `packages/ui/src/components/ui/dialog.tsx` (modify)

Confirmed still missing (deliberately excluded from every Command Center task so far, per those tasks' own scope notes) — every dialog in the app (Product form, Sale form, and the in-progress Command Center) currently ignores `prefers-reduced-motion` entirely. Fix once, centrally:

In `DialogOverlay`, append `motion-reduce:animate-none` to the existing className string (after `data-[state=open]:fade-in-0`). In `DialogContent`, append the same after `data-[state=open]:zoom-in-95`. Purely additive — no existing behavior changes for users without the OS setting enabled.

**RTL/dark mode:** unaffected either way.

---

## Phase 1 — Sidebar & navigation hierarchy

**Problem, confirmed against the live file:** `DASHBOARD_NAV_SECTIONS` in `apps/web/src/features/dashboard/nav-items.ts` renders ~50 leaf items across 7 sections; only 5 point at real, shipped pages (`sales`, `invoices`, `products`, `inventory`, `customers` — the only leaves with a `requiredPermission`). Every other leaf renders `<UnderDevelopmentPage/>` but is styled identically to a real page in the sidebar. This is the single highest-visibility "traditional ERP, not premium SaaS" signal in the whole product, because it's on every single screen.

**Chosen approach (lower-risk of the two options in the strategy doc):** visually de-emphasize unshipped items in place. Do **not** restructure sections or move items into a collapsed "More" group for P0 — that changes information architecture and is a larger, riskier change than "prioritize visual impact, keep existing architecture" calls for. Pure styling.

### 1.1 — Mark which leaves are real

**File:** `apps/web/src/features/dashboard/nav-items.ts` (modify)

Add a `shipped?: boolean` field to `DashboardNavLeaf`, defaulting conceptually to `false`, explicitly set `true` only on the 5 already-real leaves (`sales`, `invoices`, `products`, `inventory`, `customers`) plus the two standalone items (`DASHBOARD_HOME_ITEM`, `DASHBOARD_AI_ITEM`, both already fully real). Every other leaf across the 7 sections gets no change (defaults apply).

```ts
export interface DashboardNavLeaf {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
  requiredPermission?: PermissionKey;
  /** True only for leaves backed by a real, shipped page — everything else
   * renders <UnderDevelopmentPage/> and is visually de-emphasized in the
   * sidebar so real modules aren't lost among ~40 placeholder routes. */
  shipped?: boolean;
}
```

### 1.2 — De-emphasize non-shipped items in the sidebar

**File:** `apps/web/src/features/dashboard/sidebar-nav.tsx` (modify)

In `renderLeaf`, when `!item.shipped`, apply a muted treatment and a small "Soon" badge instead of the normal label-only rendering:

```tsx
function renderLeaf(item: DashboardNavLeaf, indented = false) {
  const isShipped = item.shipped ?? false;
  return (
    <SidebarNavItem
      key={item.href}
      asChild
      active={isLeafActive(item)}
      className={cn(
        indented ? 'py-1.5 text-[0.8125rem] font-normal' : undefined,
        !isShipped && !isLeafActive(item) && 'text-muted-foreground/50 hover:text-muted-foreground',
      )}
    >
      <Link href={item.href} onClick={onNavigate}>
        {!indented ? <item.icon /> : null}
        <span className="flex-1 truncate text-start">{messages.nav[item.labelKey]}</span>
        {!isShipped ? (
          <Badge variant="secondary" className="ms-auto shrink-0 px-1.5 py-0 text-[0.625rem] font-normal">
            {messages.comingSoon.badge}
          </Badge>
        ) : null}
      </Link>
    </SidebarNavItem>
  );
}
```

Reuses the **already-existing** `messages.comingSoon.badge` ("Coming Soon") — confirmed present in both `en.json` and `ar.json` already (used today by the placeholder page itself) — **no new i18n key needed for this phase**. `cn` and `Badge` are already imported/available in this file's ecosystem (`Badge` needs adding to the import from `@erp-smart/ui` if not already there — check current imports before editing).

Section-level treatment (`renderSection`): sections that are *entirely* unshipped (e.g., `purchasing`, `finance`, `employees` — verify against the current `requiredPermission` markers in `nav-items.ts` before assuming which sections qualify) could additionally get their `SidebarNavSubmenu` trigger muted the same way. Scope this as a direct follow-on of 1.2, same file, same PR — not a separate task, since it's the same visual logic applied one level up.

**RTL:** `ms-auto` (not `ml-auto`) for the badge, `text-start` already used — both logical, correct in RTL. Verify the badge doesn't get clipped/wrap awkwardly with longer Arabic "قريباً"-equivalent text (check `messages.comingSoon.badge`'s Arabic value during implementation) — if the Arabic text is meaningfully longer, consider abbreviating rather than letting the badge grow and break the row's layout.

**Dark mode:** `text-muted-foreground/50` and `Badge`'s `secondary` variant already resolve correctly via existing tokens — no new dark-mode-specific values needed.

---

## Phase 2 — Dashboard visual hierarchy

### 2.1 — Finish `AttentionList` (execute the already-approved design, don't redesign it)

**Files (create):** `apps/web/src/features/invoices/overdue.ts`, `apps/web/src/features/dashboard/low-stock-section.tsx`, `apps/web/src/features/dashboard/overdue-invoices-section.tsx`, `apps/web/src/features/dashboard/attention-list.tsx`, plus their test files.
**Files (modify):** `apps/web/src/app/dashboard/page.tsx` (swap `RecentActivityCard` → `AttentionList`), `packages/i18n/messages/en.json` / `ar.json` (the `ai`/`dashboard` keys already specified).

Full exact code for every one of these files, their tests, and their exact i18n key additions already exists in `docs/superpowers/plans/2026-07-15-premium-dashboard-ai-command-center.md`, Tasks 4 (i18n keys), 5 (`isInvoiceOverdue`), 10 (`LowStockSection`), 11 (`OverdueInvoicesSection`), 12 (`AttentionList`), 13 (wire into the page). **Do not re-derive this design** — execute those tasks as written. The one adjustment for this P0 pass: `AttentionList`'s "nothing needs attention" `EmptyState` (already planned to use `icon={<CheckCircle2 />}`) should now pass `tone="success"` (from Phase 0.1's new prop) so it visually reads as a good outcome rather than a neutral empty box — this is a one-line addition (`tone="success"` on the existing `<EmptyState>` call in that plan's Task 12 code) on top of an otherwise-unchanged, already-approved design.

This single piece of work is simultaneously the P0 goal-2 (dashboard hierarchy) and goal-4 (empty states) fix — the dashboard's 2/3-width slot goes from "a card that is provably always empty" to "a card that shows real signals, or a genuinely calm, good-looking empty state when there's nothing to flag."

### 2.2 — Quick Actions

**File (create):** `apps/web/src/features/dashboard/quick-actions.tsx`
**File (modify):** `apps/web/src/app/dashboard/page.tsx`

A small, permission-gated row of links to the three real create-flows that exist today — **New Sale, New Customer, New Product** (not "New Invoice": confirmed there is no `POST /invoices`, invoices only exist as a byproduct of a completed sale). Follows the exact same pattern already proven in `SetupProgressCard` (permission check → conditionally render a `Link` to an existing page) rather than inventing new deep-linking or dialog-triggering behavior:

```tsx
'use client';

import { Card, CardContent } from '@erp-smart/ui';
import { Package, ShoppingCart, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

const ACTIONS = [
  { labelKey: 'newSale', href: '/dashboard/sales', icon: ShoppingCart, permission: 'SALES:CREATE' },
  { labelKey: 'newCustomer', href: '/dashboard/customers', icon: UserPlus, permission: 'CUSTOMERS:CREATE' },
  { labelKey: 'newProduct', href: '/dashboard/products', icon: Package, permission: 'PRODUCTS:CREATE' },
] as const;

export function QuickActions() {
  const permissions = usePermissions();
  const { messages } = useLocale();
  const t = messages.dashboard.quickActions;

  const visible = ACTIONS.filter((action) => permissions.includes(action.permission));
  if (visible.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-3 p-4">
        {visible.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            <action.icon className="h-4 w-4 text-primary" />
            {t[action.labelKey]}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

New i18n keys needed — add to `packages/i18n/messages/en.json` under `dashboard`:
```json
"quickActions": { "newSale": "New sale", "newCustomer": "New customer", "newProduct": "New product" }
```
and the Arabic mirror under `dashboard` in `ar.json`:
```json
"quickActions": { "newSale": "عملية بيع جديدة", "newCustomer": "عميل جديد", "newProduct": "منتج جديد" }
```

Placement in `dashboard/page.tsx`: directly under the greeting header, above `KpiOverview` — it's an action surface, not a metric, so it belongs above the numbers, not competing with `AttentionList` for the 2/3 column.

**RTL:** no directional classes used beyond the already-safe `gap-2`/`gap-3`, `rounded-md` — fine as written.
**Dark mode:** `border-border`/`hover:bg-muted/60`/`text-primary` are all existing tokens — fine as written.
**Permissions used:** `SALES:CREATE`, `CUSTOMERS:CREATE`, `PRODUCTS:CREATE` — confirmed valid combinations of `PermissionModule`/`PermissionAction` per `packages/types/src/auth.ts`; verify each is actually granted to at least the OWNER/MANAGER roles in the seed/role data during implementation (not assumed here).

---

## Phase 3 — KPI card premium upgrade

**File:** `apps/web/src/features/dashboard/kpi-overview.tsx` (modify)
**File (possibly):** `packages/ui/src/components/ui/stat-card.tsx` (modify, for consistency — `StatCard` is a separate, more generic primitive used elsewhere; apply the same numeric treatment there too if it's used anywhere with money/counts — grep for its usages before editing to confirm scope)

**In scope for P0:** apply `tabular-nums` to every numeric KPI value, so figures don't visually jitter in width as they update or as different tiles show different digit counts — the single cheapest, highest-craft-signal fix available (Stripe/Linear-quality dashboards never let numbers shift width).

```tsx
<p className={`font-bold tabular-nums tracking-tight text-foreground ${tile.lead ? 'text-3xl sm:text-[2.25rem]' : 'text-2xl'}`}>
  {tile.value}
</p>
```

One-line addition (`tabular-nums`) to the existing className string — no structural change.

**Explicitly deferred to P1, not part of this plan:** period-over-period deltas ("+12% vs last month"). This requires confirming whether `GET /reports/dashboard` already computes a comparison figure — if not, it's a backend change, which is out of scope for P0 per this plan's global constraints. Do not implement a frontend-only fake delta (e.g., comparing against a client-computed guess) to simulate this — that would violate the "no fake data" rule as surely as inventing activity-feed items would.

**RTL:** `tabular-nums` is digit-width behavior, not directional — but verify: money values are already forced to Western digits/grouping regardless of locale (per `formatMoney`'s existing `NUMBER_LOCALE = 'en-US'`), so this only affects Latin-digit rendering either way, which is already the existing behavior in both locales. No new RTL risk.
**Dark mode:** no color change, no risk.

---

## Phase 4 — Empty states

Covered structurally by Phase 0.1 (the new `tone` prop) and Phase 2.1 (its first real consumer, `AttentionList`'s calm empty state). No separate file changes beyond those two. This phase exists in the plan only to make explicit that goal 4 is satisfied by those two pieces of work together, not by a third, separate empty-state redesign — the `EmptyState` primitive itself was already correct and didn't need new visual treatment beyond the tone distinction.

---

## Phase 5 — Interaction states and micro animations

Mostly covered by Phase 0 (Card, Button, Dialog). One additional, standalone item:

### 5.1 — KPI tile press feedback

**File:** `apps/web/src/features/dashboard/kpi-overview.tsx` (modify)

The 5 KPI tiles are `Link`s with `hover:bg-muted/40` but no press/active feedback at all today — every other clickable primitive in the app (`Button`) already has `active:scale-[0.98]`. Add the same convention here for consistency, kept subtle since this is a navigation click (relatively infrequent per `emil-design-eng`'s frequency framework — not a "used 100 times a day" control, so a light touch is correct, not an elaborate one):

```tsx
className={`group flex flex-col gap-2.5 p-5 transition-all hover:bg-muted/40 active:scale-[0.99] sm:p-6 ${tile.lead ? 'bg-primary/[0.04]' : ''}`}
```

(`transition-colors` → `transition-all` so the scale transform animates too, not just the background color; `active:scale-[0.99]` slightly more subtle than `Button`'s `0.98` since a whole KPI tile is a larger surface than a button and a bigger scale delta would look loose.)

**RTL/dark mode:** transform-only change, no directional or color risk.

---

## Execution order

Dependencies matter here — doing this out of order means redoing work:

1. **Phase 0 (all four sub-items)** — standalone primitive fixes, nothing else depends on them existing first structurally, but 0.1 (`EmptyState` tone) is a hard prerequisite for 2.1's calm empty state to look right, so do 0.1 before 2.1 specifically.
2. **Phase 1** (sidebar) — fully standalone, can run in parallel with anything else.
3. **Phase 3** (KPI tabular-nums) and **Phase 5.1** (KPI press feedback) — same file (`kpi-overview.tsx`), do together in one pass to avoid two separate diffs on the same component.
4. **Phase 2.1** (finish `AttentionList`) — depends on Phase 0.1. This is the largest single piece of work (6 new files + 2 modified i18n files + the page wire-up), matching Tasks 4–5, 10–13 of the existing approved plan exactly.
5. **Phase 2.2** (Quick Actions) — independent of 2.1, but placed in the same page (`dashboard/page.tsx`), so do it in the same integration pass as 2.1's final "wire into the page" step to avoid two separate edits to the same file's JSX.

## File change summary

| File | Change |
|---|---|
| `packages/ui/src/components/ui/empty-state.tsx` | Modify — add `tone` prop |
| `packages/ui/src/components/ui/card.tsx` | Modify — add `interactive` prop, resting `shadow-xs` |
| `packages/ui/src/components/ui/button.tsx` | Modify — add `loading` prop |
| `packages/ui/src/components/ui/dialog.tsx` | Modify — add `motion-reduce:animate-none` |
| `packages/ui/tailwind.preset.ts` | Modify only if `shadow-xs` isn't already a resolvable Tailwind utility at the installed version — verify first |
| `apps/web/src/features/dashboard/nav-items.ts` | Modify — add `shipped` field |
| `apps/web/src/features/dashboard/sidebar-nav.tsx` | Modify — de-emphasize non-shipped leaves/sections |
| `apps/web/src/features/invoices/overdue.ts` | Create — per existing approved plan |
| `apps/web/src/features/dashboard/low-stock-section.tsx` | Create — per existing approved plan |
| `apps/web/src/features/dashboard/overdue-invoices-section.tsx` | Create — per existing approved plan |
| `apps/web/src/features/dashboard/attention-list.tsx` | Create — per existing approved plan, + `tone="success"` |
| `apps/web/src/features/dashboard/quick-actions.tsx` | Create — new this plan |
| `apps/web/src/app/dashboard/page.tsx` | Modify — swap `RecentActivityCard` → `AttentionList`, add `QuickActions` |
| `apps/web/src/features/dashboard/kpi-overview.tsx` | Modify — `tabular-nums`, press feedback |
| `packages/i18n/messages/en.json` / `ar.json` | Modify — `AttentionList`'s existing planned keys + new `dashboard.quickActions.*` keys |

Not touched: `apps/api`, Prisma, any backend DTO/controller/service, any routing structure, any Zustand store, the AI Command Center itself (out of scope for this pass — it's a separate, already in-flight track).

## Verification plan

- `npm run lint --workspace=apps/web`, `npm run lint --workspace=@erp-smart/ui`, `npm run lint --workspace=@erp-smart/i18n` (`tsc --noEmit` each) after every phase, not just at the end.
- `npm run test --workspace=apps/web` — the existing Vitest suite plus whatever tests Tasks 5/10/11/12 of the AttentionList plan specify.
- `npm run build --workspace=apps/web` once all phases are integrated.
- Manual RTL check: toggle to Arabic via the existing `LanguageSwitcher` and re-check the sidebar (Phase 1's badge placement/wrapping), the dashboard (Phase 2's Quick Actions row, AttentionList), and KPI tiles (Phase 3/5) — this needs a real browser, not just code review.
- Manual dark-mode check: toggle via the existing `ThemeToggle` across the same three surfaces.
- Confirm no fake data anywhere: `AttentionList` and `QuickActions` must only ever render from real `useLowStock`/`useInvoices`/`usePermissions` data — no hardcoded example rows left in from development.

## Risks / open questions to resolve during implementation, not before

- Whether `shadow-xs` resolves as a Tailwind utility at the currently-installed Tailwind version, or needs an explicit preset entry (Phase 0.2).
- Whether `SALES:CREATE`/`CUSTOMERS:CREATE`/`PRODUCTS:CREATE` are actually present in the seeded role/permission data for the roles this app currently supports (Phase 2.2) — if a role legitimately has none of the three, `QuickActions` correctly renders nothing (already handled), so this is a verification step, not a blocking design question.
- Exact Arabic wording/length for the sidebar's de-emphasized-section labels (Phase 1) — needs a visual check once built, not a guess now.

**Waiting for approval before writing any code.**

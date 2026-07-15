# ERP Smart — Premium Product Redesign Strategy

**Status:** Planning only. No code changes in this document — per instruction, this is the analysis and strategy to review before any implementation plan is written.
**Author's stance:** Senior SaaS Product Designer / UX-UI / Design System Architect / Motion Design Specialist / Frontend Experience Architect, applied to the actual current codebase (not a generic template).
**Reference language:** Linear (restraint, speed, keyboard-first), Stripe Dashboard (data density done calmly), Notion (simplicity, plain language), Vercel (crisp geometry, dark-mode-native feel), Apple (motion has meaning, materials convey hierarchy).

---

## 0. Verdict on the current foundation

This is a better starting point than most redesign briefs assume. Re-reading the actual code before writing this plan turned up more strength than expected:

- The token system (`packages/ui/src/globals.css`) is already HSL-based, already has light/dark, already has a proper semantic layer (`success`/`warning`/`info`) separate from raw brand colors, and already separates a neutral `--accent` (hover surfaces) from a distinct `--accent-brand` (violet, reserved for AI) — that separation is exactly the kind of discipline most teams get wrong on the first pass.
- Typography is already Inter (Latin) + Tajawal (Arabic), switched via `html[lang]`, with no JS required — this is precisely the right choice; Linear, Stripe, Notion, and Vercel all use humanist/grotesque sans faces in the same family as Inter. There is no case for changing the type family.
- Motion primitives already exist and are already correct in places: `Button` already has `active:scale-[0.98]` (press feedback, matches `emil-design-eng`'s guidance exactly), `Dialog` already animates via `zoom-in-95`/`fade-in-0` (never from `scale(0)`), `Card` already has a `hover:shadow-md` transition, `Skeleton` is a real, reused primitive (not per-page one-offs).
- RTL discipline is real, not aspirational: logical properties (`ps-`/`pe-`/`text-start`/`border-b` etc.) are used consistently in every file read for this analysis (`table.tsx`, `dialog.tsx`, `chat-composer.tsx`, `command-center.tsx`), and the font-swap-via-`html[lang]` mechanism needs no client JS.
- The AI Command Center (in progress, see recent commits) is the single most "premium SaaS" structural decision already made correctly — a global, keyboard-first, store-driven overlay is exactly the Linear/Raycast pattern, not a bolted-on chat page.

**What's actually missing is not craft, it's finishing and restraint**: no chart/data-visualization anywhere in the product, a sidebar carrying ~50 nav items where maybe 15 are real, zero trend/comparison context on any metric, zero notifications system, and a handful of components (`Card`, `Button`) that apply the same visual treatment regardless of whether the surface is interactive. None of this needs a visual identity overhaul. It needs targeted, prioritized finishing work on top of tokens that already exist.

---

## 1. Current application analysis (grounded in the real files)

| Area | File(s) | Current state |
|---|---|---|
| Color tokens | `packages/ui/src/globals.css` | HSL custom properties, light+dark, semantic status tones, separate AI-brand violet token. Sound architecture. |
| Spacing/radius/type tokens | `packages/ui/tailwind.preset.ts` | Radius token (`--radius: 0.625rem`) drives `rounded-lg/md/sm`; spacing uses Tailwind's default scale directly (no custom scale defined) — works, but undocumented as a system. |
| Components | `packages/ui/src/components/ui/*.tsx` | 20 shadcn-pattern primitives (`avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `empty-state`, `form-field`, `input`, `label`, `logo`, `select`, `sheet`, `sidebar`, `skeleton`, `stat-card`, `switch`, `table`, `textarea`, `toast`). No chart component exists. |
| Dashboard home | `apps/web/src/app/dashboard/page.tsx` | Greeting header, `KpiOverview` (5-tile strip, no trend), `AttentionList`/`RecentActivityCard` slot (in progress), `SetupProgressCard`, `AiAssistantCard`. No quick actions, no chart. |
| KPI display | `apps/web/src/features/dashboard/kpi-overview.tsx` | Single-card, 5-column divided strip — a good, calm pattern (not 5 separate bordered cards). No period-over-period delta shown anywhere. |
| Navigation | `apps/web/src/features/dashboard/nav-items.ts`, `sidebar-nav.tsx` | 7 collapsible sections, ~50 leaf items total; only 5 leaves (`sales`, `invoices`, `products`, `inventory`, `customers`) point at real, shipped pages — everything else renders a generic "Coming Soon" placeholder page, but is styled identically to real items in the nav. |
| Header | `apps/web/src/features/dashboard/header.tsx` | `MobileNav`, spacer, `CommandCenterTrigger` (new), `LanguageSwitcher`, `ThemeToggle`, `UserMenu`. No page title/breadcrumb, no notifications. |
| User menu | `apps/web/src/features/dashboard/user-menu.tsx` | Minimal dropdown: avatar, email, role badge, profile link, sign out. Already appropriately restrained — do not add more here. |
| Tables | `packages/ui/src/components/ui/table.tsx` | Already RTL-safe (`text-start`, logical `pe-0`), already has row hover. No sticky header, no numeric-column convention. |
| AI surface | `apps/web/src/features/ai/components/*`, `apps/web/src/lib/command-center/*` | Global overlay + store + shortcut exist (in progress); chat is plain prose bubbles only — no structured/inline rendering of tool results. |
| Tooling | *(no `.eslintrc`/`eslint.config.*` anywhere in the repo)* | `npm run lint` = `tsc --noEmit` only. RTL discipline and design-token usage are enforced by convention/code review, not tooling. |
| Charting | *(no chart library in `apps/web/package.json`)* | Zero data visualization anywhere in the product today. |

---

## 2. Visual identity system

### Color

**Keep the existing token architecture — refine, don't replace.** The HSL variable system, the light/dark split, and the accent/accent-brand separation are all correct decisions already made. Changes:

- **Adopt "Restrained" as the explicit, stated default** (one accent color — the existing blue `--primary` — used only for primary actions, current selection, and links; violet `--accent-brand` reserved exclusively for anything AI-touched, exactly as already established for the Command Center). No new brand colors.
- **Add an explicit elevation/surface scale** for dark mode specifically: currently dark mode has only `background` → `card`/`popover` (two levels). Stripe- and Linear-quality dark UIs use three: `background` (darkest) → `surface` (cards, sidebar) → `surface-elevated` (popovers, dropdowns, the Command Center overlay). This is a token addition, not a redesign: one new CSS variable pair (`--surface-elevated`, `--surface-elevated-foreground`), consumed only by `DialogContent`/`DropdownMenuContent`/`SelectContent`.
- **Tabular figures for money and counts.** Add `font-variant-numeric: tabular-nums` as a small utility class (`.tabular-nums` already ships in Tailwind core) applied wherever KPI values, table money columns, and invoice totals render — currently unused anywhere in the codebase. This alone is one of the highest-leverage, lowest-risk "feels premium" changes available (Stripe's dashboard numbers never jitter in width; ERP Smart's currently can).

### Typography

**No font change.** Inter/Tajawal is already the right call. Formalize a fixed `rem` scale (per `impeccable`'s product register: product UI wants a **fixed** scale, not fluid `clamp()` typography, and a **tighter** ratio than a marketing site — around 1.125–1.2):

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75rem | Meta, timestamps, badges |
| `text-sm` | 0.875rem | Body default, table cells |
| `text-base` | 1rem | Emphasized body |
| `text-lg` | 1.125rem | Card titles |
| `text-xl`–`text-2xl` | 1.25–1.5rem | Section headings |
| `text-3xl`–`text-4xl` | 1.875–2.25rem | Dashboard greeting only (already the current usage in `dashboard/page.tsx`) |

This is already almost exactly what the codebase does today (spot-checked in `dashboard/page.tsx`, `kpi-overview.tsx`). The only real gap: no written scale exists anywhere, so it drifts by feel per component. Worth codifying in `packages/ui/tailwind.preset.ts` as an explicit `fontSize` scale rather than relying on Tailwind's untouched defaults — this is documentation-as-code, not a visual change.

### Spacing

Formalize the 4px base unit already implicit in Tailwind's default scale (`gap-1`…`gap-6` etc. already used consistently). No new scale needed — the ask here is **discipline**, not invention: dashboard sections currently mix `space-y-10`, `gap-6`, `gap-4` without a documented rule for which contexts get which. Recommend: `gap-2`/`gap-3` inside a card, `gap-6` between cards, `space-y-10` between major page sections (already the exact pattern in `dashboard/page.tsx` — just needs to be the *stated* rule so it stays consistent as more pages are touched).

### Shadows

Currently: bare Tailwind defaults (`shadow-sm`, `shadow-md`, `shadow-xl` on the Dialog). Define a **small, explicit elevation scale** in `tailwind.preset.ts` (3 levels, not 6 — over-specifying shadow levels is itself a premium-feel mistake):

- `shadow-xs` — hairline separation (default `Card` at rest — currently `Card` has no shadow at rest at all, only on hover; recommend giving it a *very* subtle 1px `shadow-xs` at rest so cards read as surfaces even before interaction, matching Stripe/Linear card treatment)
- `shadow-md` — popovers, dropdowns, the Command Center overlay (already close to this)
- `shadow-lg` — modals only

No colored/glow shadows except one deliberate exception below.

### Borders

Already correct: 1px `border-border` hairlines everywhere, no heavy borders. Keep exactly as-is. **Do not** introduce colored side-stripe borders on cards/alerts — this is an explicit anti-pattern regardless of source (flagged by both `impeccable`'s absolute bans and general SaaS-dashboard taste).

### Glass effects — where appropriate, not by default

Per `apple-design`'s materials guidance and `impeccable`'s explicit ban on "glassmorphism as default": use translucency **only** where it does real hierarchy work, not decoratively:

- **The Command Center overlay backdrop** (`DialogOverlay`) — a `backdrop-blur-sm` + translucent scrim already fits this surface's job (a floating layer over the whole app) and is cheap to add (one utility class).
- **A scroll-aware header treatment**: on scroll, the dashboard header could pick up `backdrop-blur` + `bg-background/80` instead of a hard 1px border, so content scrolling underneath reads as passing *behind* a real material rather than hitting a flat line. Optional, low priority.
- **Everywhere else: no.** Cards, sidebar, dropdowns stay opaque. Translucency on more than one or two surfaces stops reading as intentional and starts reading as a template effect.

### Light/dark mode strategy

Already implemented via `next-themes` (`ThemeToggle`, `apps/web/src/app/theme-provider.tsx`) and CSS-variable swapping (`.dark` class). Refinements only:

- Add the elevation token above.
- Verify (this is a real, not-yet-done check, not an assumption) that every semantic-tone pairing (`success`/`warning`/`info` foregrounds) still passes 4.5:1 contrast in dark mode — the light-mode `--warning-foreground: 20 14% 12%` (near-black text on an amber badge) needs re-verifying against the *dark-mode* `--warning` value, since it's the same hue/lightness in both modes but sits on a different surrounding surface.
- No "auto-switch by time of day" or similar cleverness — respect the explicit toggle and `prefers-color-scheme` default, exactly as already built.

---

## 3. Dashboard experience

The direction already approved earlier this project ("business command center," not a data grid) is correct and partially built (`AttentionList` in progress). This section extends it.

- **Hero/greeting section**: keep as-is (`dashboard/page.tsx`'s greeting + date + role badge) — it's already restrained and real (no fake motivational copy). No change needed.
- **KPI cards**: add a period-over-period delta to each tile in `KpiOverview` (`kpi-overview.tsx`) — e.g., "+12% vs last month" in small `success`/`destructive`-toned text under the value. This requires the backend's `useDashboardReport()` response to include a prior-period comparison; **check with the API team whether `GET /reports/dashboard` already computes this** before assuming it's a pure frontend change — if not, this becomes a small backend addition, not just a UI one. Flagging this explicitly rather than assuming frontend-only scope.
- **Data visualization**: introduce **one** chart — a revenue trend line (last 30/90 days) — on the dashboard home, using `recharts` (the de facto standard for shadcn-pattern component libraries; lightweight, themeable via CSS variables, good RTL number-axis behavior with `Intl.NumberFormat`). This is currently a hard zero in the product; even one well-executed chart changes the "feels like a spreadsheet" perception more than any color/spacing polish would. Scope to exactly one chart for v1 — do not chart every metric at once.
- **Quick actions**: a small, permission-gated row (or a section inside `AttentionList`'s card, or its own compact widget) with 2-3 real actions — "New sale," "New invoice," "New customer" — linking straight to each feature's existing create-flow. This is new: nothing like it exists today. Keep it to real, already-implemented flows only (no placeholder actions).
- **Smart widgets**: `AttentionList` (low stock + overdue invoices, in progress) and `SetupProgressCard` are the right shape — genuinely data-driven, permission-gated, honest empty states. No new widget needed beyond finishing what's in flight.
- **Empty states**: the `EmptyState` primitive is already good and reused correctly. No change to the component; just keep applying it everywhere a list can be empty (already the pattern).
- **AI assistant integration**: covered in full in §8.

---

## 4. Navigation

- **Sidebar — the single highest-impact navigation change**: `DASHBOARD_NAV_SECTIONS` (`nav-items.ts`) currently renders ~50 leaf items with identical visual weight, of which roughly 10 point at real, working pages. This is the biggest single reason the product can read as "traditional ERP" rather than premium SaaS — Linear and Notion's sidebars are short because their *shipped* surface area is what's shown, not their roadmap. Recommend, in order of preference:
  1. **Visually de-emphasize unshipped items** (muted text color, no hover-active affordance beyond a simple link, small "soon" badge) so the eye lands on real modules first. Lowest-risk, no navigation restructuring.
  2. **Or** collapse all not-yet-shipped sections under a single trailing "More" / "Explore" section, so the default view is short and real.
  Either is a `nav-items.ts` + `sidebar-nav.tsx` change only — no routing changes.
- **Collapse-to-icon-rail**: Linear/Notion-style sidebar collapse (icons only, labels on hover/tooltip) is a nice-to-have for power users on smaller laptop screens. Real but lower priority than the de-emphasis fix above — do the content problem before the interaction-affordance problem.
- **Header**: already thinned correctly with the new `CommandCenterTrigger`. Add a simple page-title/breadcrumb slot (e.g., "Dashboard," "Products") so the header carries page identity, not just global controls — currently the only way to know what page you're on is the sidebar's active-state highlight.
- **User profile experience**: already correct as built (`user-menu.tsx`) — restrained, no extra scope needed. Do not add a company switcher or anything else speculative; this app is single-company-per-tenant by design.
- **Notifications**: a real, currently-nonexistent gap. `VerificationBanner` is the only "alert" surface today, and it's bespoke/single-purpose. Recommend a proper (but simple) notification bell in the header, backed by real events already computable from existing data (overdue invoice crossed its due date, low stock crossed threshold — the same signals `AttentionList` already computes) rather than inventing a new notifications backend model. Scope this as "surface AttentionList's own signals as a header badge count," not a general-purpose pub/sub system.
- **Search**: deliberately **do not** build a separate search feature. A second global entry point alongside the AI Command Center would fragment the "AI is the single command surface" positioning this product has already committed to. The correct evolution (already flagged as future work in the Command Center spec) is a hybrid command palette — search *and* AI in one `⌘K`, later, not two competing entry points now.

---

## 5. Motion and interactions

Grounded directly in `emil-design-eng`'s frequency framework and `apple-design`'s fluid-interface principles, applied to what's actually in the codebase today.

- **Frequency rule, restated for this app**: sidebar navigation, tab switches, and the Command Center's own open/close (very high frequency — used every session, possibly every few minutes) should stay fast and quiet, exactly as `Dialog`'s current 150-200ms fade+scale already is. Do not add elaborate entrance choreography to anything used this often.
- **Page transitions**: Next.js App Router has no built-in transition; recommend a **single, subtle crossfade** (~150ms opacity only, no slide/scale) on route change, respecting `prefers-reduced-motion`. This is a shared-layout-level change (likely a small wrapper in `apps/web/src/app/dashboard/layout.tsx` or a `template.tsx`), not a per-page concern. Keep it fast — a page transition used dozens of times a session must never feel like it's "waiting" on an animation.
- **Micro animations**: `Button`'s `active:scale-[0.98]` already exists — keep. Extend the same press-feedback convention to any other clickable non-`Button` element that currently lacks it (e.g., the sidebar nav items, `KpiOverview`'s tile links).
- **Hover effects**: `Card`'s `hover:shadow-md` is currently applied unconditionally to *every* `Card` instance, including static/non-interactive ones (e.g., a `Card` just displaying read-only content). Recommend making the hover-elevate behavior conditional — only cards that are actually links/buttons (`KpiOverview` tiles, future clickable list rows) get the hover lift; purely informational cards (`SetupProgressCard`'s "all done" state, static content) stay flat. This is a real, concrete inconsistency worth fixing, not a hypothetical one.
- **Loading states**: `Skeleton` is already the established pattern (`KpiOverview`, `MessageList`, in-progress `AttentionList`) — good, keep applying it as the default for every new data-fetching surface; audit older pages for any remaining bare spinners and bring them in line.
- **Reduced motion**: as already flagged and partially addressed in the Command Center work, `prefers-reduced-motion` needs to be respected project-wide, not per-component. Recommend handling this **once**, centrally, in `packages/ui/src/components/ui/dialog.tsx` (already identified) and doing the same audit for any other `animate-in`/`animate-out` usage in the primitive library, rather than re-solving it per feature.

---

## 6. Components

| Component | File | Verdict | Action |
|---|---|---|---|
| Button | `button.tsx` | Solid shadcn pattern, already has press feedback | Add a `loading` prop (spinner replaces the leading position, button stays same width, text can stay or hide) — every mutation in this app (`useMarkInvoicePaid`, `useSendChatMessage`, etc.) already has an `isPending` boolean sitting unused for this purpose in most call sites |
| Card | `card.tsx` | Good radius/border, hover is unconditional | Make hover-elevate opt-in (a `interactive` prop or simply moving `hover:shadow-md` out of the base and into call sites that are links/buttons) |
| Table | `table.tsx` | Already RTL-safe, has row hover | Add a sticky-header variant for long tables (Invoices, Sales, Products already have real pagination-worthy data); establish `tabular-nums` as the standard for any numeric `TableCell` |
| Forms (Input/Select/FormField) | `input.tsx`, `select.tsx`, `form-field.tsx` | Consistent, already accessible | No structural change; keep using as-is |
| Modals | `dialog.tsx` | Already good, just extended for Command Center | Run a "modal-as-first-thought" audit on existing confirm dialogs (e.g., delete-customer) — a simple, low-stakes confirmation may not need a full modal if an inline/undo pattern is possible; not urgent, low priority |
| Dropdowns | `dropdown-menu.tsx` | Consistent icon+label pattern already (see `user-menu.tsx`) | No change |
| Charts | *(new)* | Does not exist | Introduce `recharts`, wrapped in one themed primitive (e.g. `packages/ui/src/components/ui/chart.tsx`) that reads CSS variable colors so charts stay on-token and dark-mode-correct automatically, rather than each chart call site hardcoding hex colors |
| Icons | `lucide-react`, used throughout | Single icon family, used consistently everywhere already checked | No change — this discipline is already correct, don't introduce a second icon set for anything (including charts/notifications) |
| Badge | `badge.tsx` | Good semantic-tone system already (`success`/`warning`/`info`/etc., domain-agnostic) | No change |

---

## 7. UX improvements

- **Reduce complexity — the sidebar is the actual complexity problem**, not the dashboard. Fixing §4's navigation de-emphasis does more for "feels simple, not like a traditional ERP" than any dashboard-layout change, because it's the thing visible on every single page, not just the home screen.
- **Improve user flow**: Quick Actions (§3) and the AI Command Center's inline structured answers (§8) are the two highest-leverage flow improvements — both let a user accomplish something in 1-2 actions instead of navigating through the sidebar to a full page.
- **Make it easy for small business owners**: keep leaning on plain-language copy (already the established convention per this project's own writing discipline — "Ask about your sales, inventory, products, or customers," not "Query the AI assistant subsystem"). No jargon audit is urgently needed based on what's been read; keep applying the existing standard to new copy.
- **Arabic RTL first-class support**: the discipline is real but currently unenforced by tooling (no ESLint at all in this repo — confirmed, not assumed). Recommend introducing a minimal lint step specifically for this: either a small custom ESLint rule (or even a plain grep-based CI check) that fails on `\b(ml|mr|pl|pr)-|left-|right-\b` inside `className` strings in `apps/web`/`packages/ui`, so the discipline survives contributors who don't already know the convention. This is a process/tooling recommendation, not a design one, but it directly protects the "RTL first-class" goal long-term.

---

## 8. AI experience — the Command Center as a core feature, not a chat window

This is the section most worth getting right, since it's explicitly named as the differentiator ("AI should feel integrated, not like a separate page").

**What's already correct** (per the approved spec and in-progress build): global `⌘K`/`Ctrl+K` access from every authenticated page, a single Zustand store as the one source of truth for open state, reuse of the existing `/ai/chat` endpoint with zero new backend surface, and an architecture that deliberately keeps "the overlay shell" separate from "what renders below the input" so a richer experience can be added later without a rebuild.

**What would make it feel like a core ERP feature instead of a chat window**, roughly in order of impact:

1. **Structured inline answers, not just prose.** Today, `AiService`'s tool calls (per `packages/types/src/ai.ts`'s `AIToolCallResult`) return real structured data (a list of low-stock products, a revenue number, etc.), but the frontend only ever renders the assistant's final text summary as a prose bubble. The single biggest lever here: when a tool call result is a list/table-shaped payload, render it as an actual small inline list/table component inside the Command Center response (e.g., a mini `LowStockSection`-style list), with the prose as a one-line summary above it. This is what separates "a chatbot bolted onto an ERP" from "an ERP that happens to be conversational" — and the underlying data to do it already exists in `AIToolCallResult`, it's just not surfaced yet.
2. **Contextual seeding from real pages** (`seedContext`, already wired end-to-end in the store per the current build, unused by any caller yet). The natural next callers: a "Ask AI about this invoice" affordance on the invoice detail view, "Ask AI about this customer" on the customer detail page. Each is a one-line `open('Customer: ' + name)` call from an existing page — cheap once the plumbing exists, which it already does.
3. **Long-term (not now): hybrid command palette.** Once the above two are real, evaluate whether the same `⌘K` surface should also fuzzy-search real records (customers, products, invoices) alongside asking the AI — this is the `cmdk`-based evolution already flagged as deliberately deferred in the original Command Center spec. Do not build this until the pure-AI version has been used in practice; the original scope decision to defer it was correct and nothing here changes that.

---

## 9. Prioritized roadmap

Ordered by (visible impact × how much it changes the "premium vs. traditional ERP" perception) ÷ (implementation risk).

### P0 — do first (highest impact, lowest risk, no backend dependency)
| Item | Files |
|---|---|
| De-emphasize unshipped sidebar items | `apps/web/src/features/dashboard/nav-items.ts`, `sidebar-nav.tsx` |
| `tabular-nums` on all money/count displays | `kpi-overview.tsx`, `stat-card.tsx`, table cells showing amounts across Invoices/Sales/Products |
| Card hover-elevate made opt-in (not unconditional) | `packages/ui/src/components/ui/card.tsx` and its call sites |
| Button `loading` state | `packages/ui/src/components/ui/button.tsx` |
| Quick Actions on dashboard home | new `apps/web/src/features/dashboard/quick-actions.tsx`, wired into `dashboard/page.tsx` |
| Finish in-progress `AttentionList` work | already tracked separately |

### P1 — next (real value, small-to-medium scope)
| Item | Files |
|---|---|
| One revenue trend chart on dashboard | new `recharts` dependency, new `packages/ui/src/components/ui/chart.tsx`, `apps/web/src/app/dashboard/page.tsx` |
| KPI period-over-period deltas | `kpi-overview.tsx` **+ verify `GET /reports/dashboard` returns comparison data** (possible small API change) |
| AI Command Center structured inline answers | `apps/web/src/features/ai/components/command-center.tsx`, plus small per-tool renderer components |
| Notifications bell surfacing `AttentionList` signals | new `apps/web/src/features/dashboard/notifications-bell.tsx`, `header.tsx` |
| Centralize `prefers-reduced-motion` handling | `packages/ui/src/components/ui/dialog.tsx` and an audit of any other `animate-in` usage |
| Page-title/breadcrumb in header | `header.tsx` |

### P2 — after the above ships and is validated
| Item | Files |
|---|---|
| Sidebar collapse-to-icon-rail | `packages/ui/src/components/ui/sidebar.tsx`, `sidebar-nav.tsx` |
| Contextual "Ask AI about this record" entry points | invoice detail page, customer detail page + `command-center` store's existing `seedContext` |
| Subtle route-change crossfade | `apps/web/src/app/dashboard/layout.tsx` or a new `template.tsx` |
| RTL logical-property lint check | new lightweight CI/lint step (no ESLint config exists yet — smallest viable version first) |
| Table sticky headers | `packages/ui/src/components/ui/table.tsx` |
| Dark-mode elevation token + contrast re-verification | `packages/ui/src/globals.css` |

### P3 — speculative / only if validated as needed
| Item | Notes |
|---|---|
| Hybrid command palette (`cmdk`, search + AI) | Explicitly deferred already; revisit only after P1's AI work ships and is used |
| Modal-vs-inline audit on existing confirm dialogs | Low urgency, no known user complaint driving it |
| Company switcher in user menu | Only if multi-company-per-user ever becomes a real requirement — currently architecturally single-company; do not build speculatively |

---

## 10. Explicit anti-patterns to avoid while executing this plan

Carried over from `impeccable`'s product register and absolute bans, applied specifically so they don't get reintroduced by accident during implementation:

- No side-stripe colored borders on cards/alerts.
- No gradient text.
- No glassmorphism beyond the one or two deliberate uses named in §2.
- No numbered eyebrows/section markers on the dashboard (this is a marketing-page pattern; nothing here is a sequence).
- No card border-radius beyond the existing `--radius` scale (12-16px) — do not round further "for premium feel."
- No modal-as-first-instinct for new features — check inline/progressive alternatives first (per §6's table entry).
- No decorative motion — every animation added under this plan must be traceable to a state change, not decoration.
- No hardcoded `left`/`right`/`ml`/`mr` in any new class — logical properties only, everywhere, no exceptions.

---

## Summary

The redesign this product needs is **narrower and lower-risk than "premium redesign" usually implies**: the token system, typography, motion primitives, and RTL discipline are already sound and should not be rebuilt. The actual gap between "solid internal tool" and "feels like Linear/Stripe/Notion/Vercel" is concentrated in five concrete things — a sidebar showing 50 items instead of 10, zero data visualization, zero trend context on any number, a Card/Button pair that doesn't yet distinguish interactive from static surfaces, and an AI assistant that only ever answers in prose. Fix those five, in the priority order above, and the "traditional ERP" perception is the thing that actually changes — not the color palette.

**No code has been written. Waiting for direction on which priority tier to turn into an implementation plan.**

# Premium Dashboard & AI Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a global "Ask AI ⌘K" launcher available on every authenticated page, and replace the dashboard's always-empty Recent Activity widget with a real "what needs my attention today" list (low stock, overdue invoices), on top of existing AI/data infrastructure with zero backend changes.

**Architecture:** A Zustand store (`useCommandCenter`, mirroring `useAuthStore`'s exact shape) holds the launcher's open/closed state; a `CommandCenter` overlay built on the existing Radix `Dialog` primitive and a `CommandCenterTrigger` button both read/write it, and a `useCommandCenterShortcut` hook (mounted once in `DashboardShell`) wires the global ⌘K/Ctrl+K listener. `AttentionList` replaces `RecentActivityCard` in the dashboard's default composition, composing two small presentational sections (`LowStockSection`, `OverdueInvoicesSection`) fed by two independent TanStack Query hooks the app already has.

**Tech Stack:** Next.js 15 App Router, React 19, Zustand 5, TanStack Query 5, Radix UI Dialog, Tailwind, `apps/web` workspace only — no `packages/*` runtime changes except one shared-component accessibility fix (below) and i18n catalog additions.

## Global Constraints

- Scope is `apps/web` only. No backend/Prisma changes, no new AI capability — every AI call goes through the existing `POST /ai/chat` (`AiController`, no `@RequirePermission` at the controller level; per-tool scoping already happens in `AiService`).
- No `cmdk` dependency for V1 — build on the existing `Dialog`/`DialogContent` primitive (`packages/ui/src/components/ui/dialog.tsx`). Do not restructure the overlay shell in a way that would make adding a command registry later expensive.
- RTL: logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`), never `left`/`right`, matching the rest of this codebase.
- Keyboard shortcut glyphs (`⌘K` / `Ctrl+K`) are never translated — only the visible label text comes from `messages.ai.*`.
- Money is always formatted via `formatMoney`/`useFormatMoney` (`apps/web/src/lib/format/money.ts`) with Western digits/grouping regardless of UI locale — never a hand-rolled formatter.
- i18n parity is enforced at compile time by `packages/i18n/src/messages.ts:6` (`const messages: Record<Locale, typeof en> = { en, ar }`) — every key added to `en.json` must be mirrored in `ar.json` with the same shape, or `tsc --noEmit` fails in both `packages/i18n` and every consumer.
- New global state follows the exact convention in `apps/web/src/lib/store/auth-store.ts`: one `create<T>((set) => ({...}))` store holding state + actions, plus small derived-selector hooks re-exported from an `index.ts` barrel.
- No boolean-prop proliferation on new components (`vercel-composition-patterns`) — presentational sections take data + status props, not `mode`/`variant` flags that branch internal behavior.
- Reduced motion (`prefers-reduced-motion: reduce`) must be respected on every new animated surface.
- `apps/web` currently has **no test runner configured at all** (`"test": "echo \"no tests yet\""`) and this repository has **no Playwright installation anywhere** (no `playwright.config.*`, no `@playwright/test` dependency) — both are bootstrapped as part of this plan (Tasks 1 and 15), not assumed to already exist.

---

## File Structure

**Create:**
- `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts` — test runner bootstrap
- `apps/web/src/test/test-utils.tsx` — shared render wrapper (Locale + Query providers)
- `apps/web/src/test/sanity.test.tsx` — proves the harness works
- `apps/web/src/lib/command-center/command-center-store.ts` (+ `.test.ts`) — open/closed state
- `apps/web/src/lib/command-center/use-command-center-shortcut.ts` (+ `.test.tsx`) — global ⌘K listener
- `apps/web/src/lib/command-center/index.ts` — barrel export
- `apps/web/src/features/invoices/overdue.ts` (+ `.test.ts`) — pure `isInvoiceOverdue` filter
- `apps/web/src/features/ai/utils.ts` (+ `.test.ts`) — shared `getVisibleMessages` filter
- `apps/web/src/features/ai/components/command-center.tsx` (+ `.test.tsx`) — the overlay
- `apps/web/src/features/ai/components/command-center-trigger.tsx` (+ `.test.tsx`) — header button
- `apps/web/src/features/dashboard/low-stock-section.tsx` (+ `.test.tsx`)
- `apps/web/src/features/dashboard/overdue-invoices-section.tsx` (+ `.test.tsx`)
- `apps/web/src/features/dashboard/attention-list.tsx` (+ `.test.tsx`)
- `apps/web/playwright.config.ts`, `apps/web/e2e/command-center.spec.ts`, `apps/web/specs/command-center.plan.md`

**Modify:**
- `apps/web/package.json` — add Vitest + Playwright dev dependencies and real `test`/`test:watch`/`test:e2e` scripts
- `packages/i18n/messages/en.json`, `packages/i18n/messages/ar.json` — new `ai.*`/`dashboard.*` keys
- `packages/ui/src/components/ui/dialog.tsx` — add `motion-reduce:animate-none` to `DialogOverlay`/`DialogContent` (pre-existing gap, fixed centrally — see Task 8)
- `apps/web/src/features/ai/components/message-list.tsx` — use the new shared `getVisibleMessages`
- `apps/web/src/features/dashboard/header.tsx` — insert `CommandCenterTrigger`
- `apps/web/src/features/dashboard/dashboard-shell.tsx` — mount `CommandCenter` + `useCommandCenterShortcut()`
- `apps/web/src/app/dashboard/page.tsx` — swap `RecentActivityCard` → `AttentionList`

---

## Task 1: Bootstrap Vitest + React Testing Library for `apps/web`

`apps/web` has no working test runner today — every subsequent task's TDD cycle depends on this existing first. Vitest (not Jest, which `apps/api` uses) is the right choice here specifically because `packages/ui`/`packages/i18n`/`packages/types` ship raw `.ts`/`.tsx` source with no prebuild step (`"main": "./src/index.ts"`) — Vite/esbuild transforms any TS it imports on the fly, so no `ts-jest`/`moduleNameMapper` wiring is needed for cross-workspace imports.

This task is infrastructure, not feature behavior, so it does not follow a red-green TDD cycle — there's no prior wrong implementation to fail against. It ends with one real, permanent sanity test that proves the harness renders components correctly.

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/src/test/test-utils.tsx`
- Create: `apps/web/src/test/sanity.test.tsx`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `renderWithProviders(ui, options?: { locale?: 'en' | 'ar' } & RenderOptions)` from `@/test/test-utils` — every later component test imports this instead of `@testing-library/react`'s bare `render`.

- [ ] **Step 1: Install dependencies**

Run from the repo root:
```bash
npm install --workspace=apps/web --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: install succeeds, `apps/web/package.json` gains these under `devDependencies`.

- [ ] **Step 2: Write the Vitest config**

`apps/web/vitest.config.ts`:
```ts
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3: Write the setup file**

`apps/web/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Write the shared render wrapper**

`apps/web/src/test/test-utils.tsx`:
```tsx
import type { Locale } from '@erp-smart/types';
import { getMessages } from '@erp-smart/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { LocaleProvider } from '@/lib/locale/locale-context';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// Every component under test that calls useLocale() or a TanStack Query
// hook needs these two providers — this is the one place that wires them up,
// so individual test files never hand-roll a provider tree.
export function renderWithProviders(
  ui: ReactElement,
  { locale = 'en', ...options }: Omit<RenderOptions, 'wrapper'> & { locale?: Locale } = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const [queryClient] = useState(createTestQueryClient);
    return (
      <QueryClientProvider client={queryClient}>
        <LocaleProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </LocaleProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
```

- [ ] **Step 5: Write the sanity test**

`apps/web/src/test/sanity.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

describe('renderWithProviders', () => {
  it('renders children inside the locale and query providers', () => {
    renderWithProviders(<p>hello test harness</p>);
    expect(screen.getByText('hello test harness')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Add real test scripts**

Modify `apps/web/package.json`'s `scripts` block:
```json
"test": "vitest run",
"test:watch": "vitest",
```
(Replaces the existing `"test": "echo \"no tests yet\""` line.)

- [ ] **Step 7: Run it**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 1 test file, 1 test passed.

- [ ] **Step 8: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/src/test apps/web/package.json
git commit -m "test: bootstrap Vitest + React Testing Library for apps/web"
```

---

## Task 2: `useCommandCenter` Zustand store

**Files:**
- Create: `apps/web/src/lib/command-center/command-center-store.ts`
- Test: `apps/web/src/lib/command-center/command-center-store.test.ts`
- Create: `apps/web/src/lib/command-center/index.ts`

**Interfaces:**
- Produces: `useCommandCenterStore` (base Zustand store, `{ isOpen: boolean; seedContext: string | null; open(seedContext?: string): void; close(): void; toggle(): void }`) and `useCommandCenter()` (ergonomic hook returning `{ isOpen, seedContext, open, close, toggle }`), both exported from `@/lib/command-center`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/command-center/command-center-store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterStore } from './command-center-store';

describe('useCommandCenterStore', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
  });

  it('starts closed with no seed context', () => {
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('open() sets isOpen true and stores the seed context', () => {
    useCommandCenterStore.getState().open('Customer: Ahmed Hassan');
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
    expect(useCommandCenterStore.getState().seedContext).toBe('Customer: Ahmed Hassan');
  });

  it('open() with no argument stores a null seed context', () => {
    useCommandCenterStore.getState().open();
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('close() sets isOpen false and clears the seed context', () => {
    useCommandCenterStore.getState().open('some context');
    useCommandCenterStore.getState().close();
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('toggle() opens when closed and closes when open', () => {
    useCommandCenterStore.getState().toggle();
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
    useCommandCenterStore.getState().toggle();
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `command-center-store.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/lib/command-center/command-center-store.ts`:
```ts
import { create } from 'zustand';

interface CommandCenterState {
  isOpen: boolean;
  seedContext: string | null;
}

interface CommandCenterActions {
  open: (seedContext?: string) => void;
  close: () => void;
  toggle: () => void;
}

export type CommandCenterStore = CommandCenterState & CommandCenterActions;

export const useCommandCenterStore = create<CommandCenterStore>((set) => ({
  isOpen: false,
  seedContext: null,

  open: (seedContext) => set({ isOpen: true, seedContext: seedContext ?? null }),
  close: () => set({ isOpen: false, seedContext: null }),
  toggle: () => set((state) => (state.isOpen ? { isOpen: false, seedContext: null } : { isOpen: true })),
}));

// Ergonomic combined hook for consumers (CommandCenter, CommandCenterTrigger,
// the keyboard shortcut) — built from individually-selected, stable fields
// rather than selecting the whole store object, to avoid over-rendering.
export function useCommandCenter() {
  const isOpen = useCommandCenterStore((state) => state.isOpen);
  const seedContext = useCommandCenterStore((state) => state.seedContext);
  const open = useCommandCenterStore((state) => state.open);
  const close = useCommandCenterStore((state) => state.close);
  const toggle = useCommandCenterStore((state) => state.toggle);
  return { isOpen, seedContext, open, close, toggle };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 5 tests passed.

- [ ] **Step 5: Write the barrel export**

`apps/web/src/lib/command-center/index.ts`:
```ts
export { useCommandCenter, useCommandCenterStore } from './command-center-store';
export type { CommandCenterStore } from './command-center-store';
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/command-center
git commit -m "feat: add useCommandCenter Zustand store"
```

---

## Task 3: `useCommandCenterShortcut` global keyboard listener

**Files:**
- Create: `apps/web/src/lib/command-center/use-command-center-shortcut.ts`
- Test: `apps/web/src/lib/command-center/use-command-center-shortcut.test.tsx`
- Modify: `apps/web/src/lib/command-center/index.ts`

**Interfaces:**
- Consumes: `useCommandCenterStore` from Task 2.
- Produces: `useCommandCenterShortcut(): void`, mounted once inside `DashboardShell` in Task 9.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/command-center/use-command-center-shortcut.test.tsx`:
```tsx
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterStore } from './command-center-store';
import { useCommandCenterShortcut } from './use-command-center-shortcut';

function pressCtrlK(target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}

describe('useCommandCenterShortcut', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
  });

  it('opens the command center on Ctrl+K', () => {
    renderHook(() => useCommandCenterShortcut());
    pressCtrlK();
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
  });

  it('closes the command center on a second Ctrl+K, even while it is open', () => {
    renderHook(() => useCommandCenterShortcut());
    pressCtrlK();
    pressCtrlK();
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
  });

  it('does not open when the shortcut fires while typing in a text input', () => {
    renderHook(() => useCommandCenterShortcut());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    pressCtrlK(input);

    expect(useCommandCenterStore.getState().isOpen).toBe(false);
    document.body.removeChild(input);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `use-command-center-shortcut.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/lib/command-center/use-command-center-shortcut.ts`:
```ts
'use client';

import { useEffect } from 'react';

import { useCommandCenterStore } from './command-center-store';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA']);

function isTypingInEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return EDITABLE_TAGS.has(target.tagName);
}

/**
 * Registers the global Ctrl+K / Cmd+K listener that opens the Command
 * Center. Mounted once, inside DashboardShell — never in the root layout,
 * since that renders before authentication resolves (see
 * docs/features/premium-dashboard-ai-command-center-spec.md §A.3).
 *
 * The "don't hijack typing" guard only applies when currently closed: once
 * open, Radix Dialog's own focus trap guarantees the only editable element
 * that can be focused is the Command Center's own input, so a second
 * Ctrl+K while it's open should always close it.
 */
export function useCommandCenterShortcut() {
  const isOpen = useCommandCenterStore((state) => state.isOpen);
  const toggle = useCommandCenterStore((state) => state.toggle);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isShortcut) return;
      if (!isOpen && isTypingInEditableElement(event.target)) return;

      event.preventDefault();
      toggle();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Update the barrel export**

`apps/web/src/lib/command-center/index.ts`:
```ts
export { useCommandCenter, useCommandCenterStore } from './command-center-store';
export type { CommandCenterStore } from './command-center-store';
export { useCommandCenterShortcut } from './use-command-center-shortcut';
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/command-center
git commit -m "feat: add global Ctrl+K/Cmd+K shortcut for the Command Center"
```

---

## Task 4: i18n keys

**Files:**
- Modify: `packages/i18n/messages/en.json`
- Modify: `packages/i18n/messages/ar.json`

**Interfaces:**
- Produces: `messages.ai.askAiLabel`, `messages.ai.commandCenterTitle`, `messages.ai.commandCenterSuggestions: string[]`, `messages.dashboard.attentionTitle`, `messages.dashboard.lowStockSectionTitle`, `messages.dashboard.overdueInvoicesSectionTitle`, `messages.dashboard.nothingNeedsAttentionTitle`, `messages.dashboard.nothingNeedsAttentionDescription`, `messages.dashboard.viewAllLowStock`, `messages.dashboard.viewAllOverdueInvoices`, `messages.dashboard.couldNotLoadLowStock`, `messages.dashboard.couldNotLoadOverdueInvoices` — used by Tasks 7, 8, 10, 11, 12.

- [ ] **Step 1: Add English keys**

In `packages/i18n/messages/en.json`, inside the existing `"ai"` object (after `"openAssistant": "Chat with the assistant"`), add:
```json
    "openAssistant": "Chat with the assistant",
    "askAiLabel": "Ask AI",
    "commandCenterTitle": "AI Command Center",
    "commandCenterSuggestions": [
      "What's my revenue this month?",
      "Which products are low on stock?",
      "Which invoices are overdue?",
      "How many customers do I have?"
    ]
```
In `packages/i18n/messages/en.json`, inside the existing `"dashboard"` object (after `"noActivityDescription": "..."`), add:
```json
    "noActivityDescription": "Your sales, invoices, customers, and inventory activities will appear here.",
    "attentionTitle": "What needs your attention",
    "lowStockSectionTitle": "Low stock",
    "overdueInvoicesSectionTitle": "Overdue invoices",
    "nothingNeedsAttentionTitle": "You're all caught up",
    "nothingNeedsAttentionDescription": "No low-stock products or overdue invoices right now.",
    "viewAllLowStock": "View all low-stock products",
    "viewAllOverdueInvoices": "View all overdue invoices",
    "couldNotLoadLowStock": "Couldn't load low-stock products",
    "couldNotLoadOverdueInvoices": "Couldn't load overdue invoices"
```

- [ ] **Step 2: Mirror the Arabic keys**

In `packages/i18n/messages/ar.json`, inside the existing `"ai"` object (matching the same position), add:
```json
    "commandCenterTitle": "مركز الذكاء الاصطناعي",
    "askAiLabel": "اسأل الذكاء الاصطناعي",
    "commandCenterSuggestions": [
      "ما هي إيراداتي هذا الشهر؟",
      "ما هي المنتجات منخفضة المخزون؟",
      "ما هي الفواتير المتأخرة؟",
      "كم عدد عملائي؟"
    ]
```
In `packages/i18n/messages/ar.json`, inside the existing `"dashboard"` object, add:
```json
    "attentionTitle": "ما يحتاج انتباهك",
    "lowStockSectionTitle": "مخزون منخفض",
    "overdueInvoicesSectionTitle": "فواتير متأخرة",
    "nothingNeedsAttentionTitle": "كل شيء تحت السيطرة",
    "nothingNeedsAttentionDescription": "لا توجد منتجات منخفضة المخزون أو فواتير متأخرة حالياً.",
    "viewAllLowStock": "عرض جميع المنتجات منخفضة المخزون",
    "viewAllOverdueInvoices": "عرض جميع الفواتير المتأخرة",
    "couldNotLoadLowStock": "تعذّر تحميل المنتجات منخفضة المخزون",
    "couldNotLoadOverdueInvoices": "تعذّر تحميل الفواتير المتأخرة"
```

- [ ] **Step 3: Verify parity at compile time**

Run:
```bash
npm run lint --workspace=@erp-smart/i18n
npm run lint --workspace=apps/web
```
Expected: both PASS (`tsc --noEmit`, no errors). If `ar.json` is missing a key or has a shape mismatch, this fails at `packages/i18n/src/messages.ts:6` (`Record<Locale, typeof en>`).

- [ ] **Step 4: Commit**

```bash
git add packages/i18n/messages/en.json packages/i18n/messages/ar.json
git commit -m "feat: add i18n keys for Command Center and Attention List"
```

---

## Task 5: `isInvoiceOverdue` pure function

**Files:**
- Create: `apps/web/src/features/invoices/overdue.ts`
- Test: `apps/web/src/features/invoices/overdue.test.ts`

**Interfaces:**
- Produces: `isInvoiceOverdue(invoice: Invoice, now?: Date): boolean`, consumed by `AttentionList` in Task 12.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/invoices/overdue.test.ts`:
```ts
import type { Invoice } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { isInvoiceOverdue } from './overdue';

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    companyId: 'company-1',
    saleId: 'sale-1',
    invoiceNumber: 'INV-0001',
    status: 'ISSUED',
    issueDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-15T00:00:00.000Z',
    totalAmount: '100.00',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date('2026-02-01T00:00:00.000Z');

describe('isInvoiceOverdue', () => {
  it('is true for an ISSUED invoice whose due date has passed', () => {
    expect(isInvoiceOverdue(makeInvoice({}), NOW)).toBe(true);
  });

  it('is false for a PAID invoice past its due date', () => {
    expect(isInvoiceOverdue(makeInvoice({ status: 'PAID' }), NOW)).toBe(false);
  });

  it('is false for an ISSUED invoice with no due date set', () => {
    expect(isInvoiceOverdue(makeInvoice({ dueDate: null }), NOW)).toBe(false);
  });

  it('is false for an ISSUED invoice whose due date is in the future', () => {
    expect(isInvoiceOverdue(makeInvoice({ dueDate: '2026-03-01T00:00:00.000Z' }), NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `overdue.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/invoices/overdue.ts`:
```ts
import type { Invoice } from '@erp-smart/types';

/**
 * "Overdue" for this feature means an ISSUED invoice whose due date has
 * passed — see docs/features/premium-dashboard-ai-command-center-spec.md §C
 * for why this replaces a per-customer debt aggregate that doesn't exist
 * (Customer has no balance field; computing one per customer would be N+1).
 */
export function isInvoiceOverdue(invoice: Invoice, now: Date = new Date()): boolean {
  if (invoice.status !== 'ISSUED') return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate).getTime() < now.getTime();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/invoices/overdue.ts apps/web/src/features/invoices/overdue.test.ts
git commit -m "feat: add isInvoiceOverdue pure filter"
```

---

## Task 6: Shared `getVisibleMessages` helper

**Files:**
- Create: `apps/web/src/features/ai/utils.ts`
- Test: `apps/web/src/features/ai/utils.test.ts`
- Modify: `apps/web/src/features/ai/components/message-list.tsx`

**Interfaces:**
- Produces: `getVisibleMessages(conversation: AIConversationDetail | undefined): AIMessage[]`, consumed by both `MessageList` (existing) and `CommandCenter` (Task 8) so the USER/ASSISTANT-only filter is never duplicated.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/ai/utils.test.ts`:
```ts
import type { AIConversationDetail, AIMessage } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { getVisibleMessages } from './utils';

function makeConversation(messages: AIMessage[]): AIConversationDetail {
  return {
    id: 'conv-1',
    companyId: 'company-1',
    userId: 'user-1',
    visibility: 'PRIVATE',
    title: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    messages,
  };
}

function makeMessage(overrides: Partial<AIMessage>): AIMessage {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    companyId: 'company-1',
    role: 'USER',
    content: 'hello',
    sequence: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getVisibleMessages', () => {
  it('returns an empty array for an undefined conversation', () => {
    expect(getVisibleMessages(undefined)).toEqual([]);
  });

  it('keeps USER and ASSISTANT messages', () => {
    const conversation = makeConversation([
      makeMessage({ id: 'm1', role: 'USER' }),
      makeMessage({ id: 'm2', role: 'ASSISTANT' }),
    ]);
    expect(getVisibleMessages(conversation).map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('filters out TOOL-role messages', () => {
    const conversation = makeConversation([
      makeMessage({ id: 'm1', role: 'USER' }),
      makeMessage({ id: 'm2', role: 'TOOL', content: '{"tool":"getLowStock"}' }),
      makeMessage({ id: 'm3', role: 'ASSISTANT' }),
    ]);
    expect(getVisibleMessages(conversation).map((m) => m.id)).toEqual(['m1', 'm3']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `utils.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/ai/utils.ts`:
```ts
import type { AIConversationDetail, AIMessage } from '@erp-smart/types';

// TOOL-role messages carry raw JSON meant for the model's own context (see
// AIToolCallResult), not for display — shared by MessageList and
// CommandCenter so both surfaces filter identically.
export function getVisibleMessages(conversation: AIConversationDetail | undefined): AIMessage[] {
  return conversation?.messages.filter((message) => message.role === 'USER' || message.role === 'ASSISTANT') ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Update `MessageList` to use the shared helper**

In `apps/web/src/features/ai/components/message-list.tsx`, replace:
```tsx
  // TOOL-role messages carry raw JSON meant for the model's own context
  // (see AIToolCallResult), not for display — only USER/ASSISTANT
  // turns render as bubbles.
  const visibleMessages = conversation?.messages.filter((m) => m.role === 'USER' || m.role === 'ASSISTANT') ?? [];
```
with:
```tsx
  const visibleMessages = getVisibleMessages(conversation);
```
and add the import:
```tsx
import { getVisibleMessages } from '../utils';
```
(placed alphabetically with the other `../` imports, before `import { MessageBubble } from './message-bubble';`).

- [ ] **Step 6: Verify nothing broke**

Run: `npm run test --workspace=apps/web` then `npm run lint --workspace=apps/web`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/ai/utils.ts apps/web/src/features/ai/utils.test.ts apps/web/src/features/ai/components/message-list.tsx
git commit -m "refactor: extract getVisibleMessages shared between MessageList and Command Center"
```

---

## Task 7: `CommandCenterTrigger`

**Files:**
- Create: `apps/web/src/features/ai/components/command-center-trigger.tsx`
- Test: `apps/web/src/features/ai/components/command-center-trigger.test.tsx`

**Interfaces:**
- Consumes: `useCommandCenter()` from Task 2, `messages.ai.askAiLabel` from Task 4.
- Produces: `<CommandCenterTrigger />`, consumed by `header.tsx` in Task 9.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/ai/components/command-center-trigger.test.tsx`:
```tsx
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterStore } from '@/lib/command-center';
import { renderWithProviders, screen } from '@/test/test-utils';

import { CommandCenterTrigger } from './command-center-trigger';

describe('CommandCenterTrigger', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
  });

  it('renders the localized label', () => {
    renderWithProviders(<CommandCenterTrigger />);
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
  });

  it('opens the command center store when clicked', () => {
    renderWithProviders(<CommandCenterTrigger />);
    fireEvent.click(screen.getByRole('button', { name: /ask ai/i }));
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `command-center-trigger.tsx` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/ai/components/command-center-trigger.tsx`:
```tsx
'use client';

import { Button } from '@erp-smart/ui';
import { Sparkles } from 'lucide-react';

import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

// Safe to read navigator directly, no useEffect/useState needed: this
// button only ever mounts client-side, after DashboardLayout's auth gate
// resolves (see apps/web/src/app/dashboard/layout.tsx) — there is no
// server-rendered markup for it to hydrate against, so no mismatch risk.
function getShortcutHint(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return isMac ? '⌘K' : 'Ctrl+K';
}

export function CommandCenterTrigger() {
  const { open } = useCommandCenter();
  const { messages } = useLocale();

  return (
    <Button variant="outline" size="sm" onClick={() => open()} className="gap-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="hidden sm:inline">{messages.ai.askAiLabel}</span>
      <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground sm:inline-block">
        {getShortcutHint()}
      </kbd>
    </Button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/ai/components/command-center-trigger.tsx apps/web/src/features/ai/components/command-center-trigger.test.tsx
git commit -m "feat: add CommandCenterTrigger header button"
```

---

## Task 8: `CommandCenter` overlay

The overlay itself, plus one pre-existing accessibility gap fixed centrally: the shared `Dialog` primitive's `animate-in`/`zoom-in-95`/`fade-in-0` classes do not currently respect `prefers-reduced-motion` anywhere in this codebase (confirmed by reading `packages/ui/src/components/ui/dialog.tsx`). The spec requires the Command Center to respect it; fixing it only for the Command Center's own instance isn't possible from the outside (the animation classes are baked into the shared `DialogContent`/`DialogOverlay` components' own className strings, not overridable via an appended class), so this task fixes it in the shared primitive — a small, additive, backward-compatible change that also benefits every existing dialog (Product form, Sale form, etc.) for free.

**Files:**
- Modify: `packages/ui/src/components/ui/dialog.tsx`
- Create: `apps/web/src/features/ai/components/command-center.tsx`
- Test: `apps/web/src/features/ai/components/command-center.test.tsx`
- Modify: `apps/web/src/features/ai/components/chat-composer.tsx`

**Interfaces:**
- Consumes: `useCommandCenter()` (Task 2), `getVisibleMessages` (Task 6), `useConversation`/`useSendChatMessage` (existing, `apps/web/src/features/ai/hooks.ts`), `MessageBubble` (existing, unmodified), `messages.ai.commandCenterTitle`/`commandCenterSuggestions` (Task 4).
- Produces: `<CommandCenter />`, mounted once in `DashboardShell` in Task 9. `ChatComposer` gains an optional `initialValue?: string` prop (default `''`), used to seed the input from `seedContext` — the existing `/dashboard/ai` caller is unaffected since it doesn't pass it.

- [ ] **Step 1: Fix the shared Dialog primitive's reduced-motion gap**

In `packages/ui/src/components/ui/dialog.tsx`, in `DialogOverlay`, change:
```tsx
      'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
```
to:
```tsx
      'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none',
```
In `DialogContent`, change:
```tsx
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-background p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
```
to:
```tsx
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-background p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none',
```

- [ ] **Step 2: Verify existing dialogs still work**

Run: `npm run lint --workspace=@erp-smart/ui`
Expected: PASS (`tsc --noEmit`, purely additive className change, no type impact).

- [ ] **Step 3: Add `initialValue` to `ChatComposer`**

In `apps/web/src/features/ai/components/chat-composer.tsx`, change the export signature and initializer:
```tsx
export function ChatComposer({
  onSend,
  disabled,
  initialValue = '',
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
```
(Everything else in the file is unchanged — `/dashboard/ai`'s existing call site doesn't pass `initialValue`, so its behavior is identical to today.)

- [ ] **Step 4: Write the failing test for `CommandCenter`**

`apps/web/src/features/ai/components/command-center.test.tsx`:
```tsx
import { fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCommandCenterStore } from '@/lib/command-center';
import { renderWithProviders, screen } from '@/test/test-utils';

import * as aiApi from '../api';
import { CommandCenter } from './command-center';

vi.mock('../api');

describe('CommandCenter', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
    vi.clearAllMocks();
  });

  it('renders nothing in the DOM while closed', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when the store isOpen becomes true, focusing the input', async () => {
    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/ask about your sales/i)).toHaveFocus();
  });

  it('shows suggestion chips when no message has been sent yet', async () => {
    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText("What's my revenue this month?")).toBeInTheDocument();
  });

  it('sends a message via the existing AI chat mutation and renders the reply', async () => {
    vi.mocked(aiApi.sendChatMessage).mockResolvedValue({
      conversationId: 'conv-1',
      message: {
        id: 'msg-2',
        conversationId: 'conv-1',
        companyId: 'company-1',
        role: 'ASSISTANT',
        content: 'Your revenue this month is $4,200.',
        sequence: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    vi.mocked(aiApi.getConversation).mockResolvedValue({
      id: 'conv-1',
      companyId: 'company-1',
      userId: 'user-1',
      visibility: 'PRIVATE',
      title: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          companyId: 'company-1',
          role: 'USER',
          content: "What's my revenue this month?",
          sequence: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          companyId: 'company-1',
          role: 'ASSISTANT',
          content: 'Your revenue this month is $4,200.',
          sequence: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/ask about your sales/i);
    fireEvent.change(input, { target: { value: "What's my revenue this month?" } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(screen.getByText('Your revenue this month is $4,200.')).toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(useCommandCenterStore.getState().isOpen).toBe(false));
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `command-center.tsx` does not exist yet.

- [ ] **Step 6: Write the implementation**

`apps/web/src/features/ai/components/command-center.tsx`:
```tsx
'use client';

import { Dialog, DialogContent, DialogTitle, Skeleton, toast } from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

import { useConversation, useSendChatMessage } from '../hooks';
import { getVisibleMessages } from '../utils';
import { ChatComposer } from './chat-composer';
import { MessageBubble } from './message-bubble';

export function CommandCenter() {
  const { isOpen, seedContext, close } = useCommandCenter();
  const { messages } = useLocale();
  const t = messages.ai;

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const conversationQuery = useConversation(activeConversationId);
  const sendMessageMutation = useSendChatMessage();

  // Every open is a fresh ask, like a launcher, not a resumed thread — any
  // previous conversation stays reachable from the full /dashboard/ai page.
  useEffect(() => {
    if (isOpen) setActiveConversationId(null);
  }, [isOpen]);

  const visibleMessages = getVisibleMessages(conversationQuery.data);
  const hasMessages = visibleMessages.length > 0 || sendMessageMutation.isPending;

  function handleSend(message: string) {
    sendMessageMutation.mutate(
      { conversationId: activeConversationId ?? undefined, message },
      {
        onSuccess: (data) => {
          if (!activeConversationId) setActiveConversationId(data.conversationId);
        },
        onError: (error) => {
          toast({ variant: 'destructive', title: t.sendMessageFailed, description: error.message });
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="inset-x-4 top-[8vh] mx-auto w-auto max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">{t.commandCenterTitle}</DialogTitle>
        <ChatComposer onSend={handleSend} disabled={sendMessageMutation.isPending} initialValue={seedContext ?? ''} />
        <div aria-live="polite" className="max-h-[50vh] overflow-y-auto">
          {hasMessages ? (
            <div className="space-y-4 p-4">
              {visibleMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {sendMessageMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">{t.askPlaceholder}</p>
              <div className="flex flex-wrap gap-2">
                {t.commandCenterSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 5 tests passed. (Radix `Dialog.Content` autofocuses the first tabbable descendant by default — the `ChatComposer` textarea, since it's rendered before the suggestion buttons in DOM order — so no custom focus-management code is required; this is the same default behavior every other dialog in this codebase already relies on.)

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/ui/dialog.tsx apps/web/src/features/ai/components/command-center.tsx apps/web/src/features/ai/components/command-center.test.tsx apps/web/src/features/ai/components/chat-composer.tsx
git commit -m "feat: add CommandCenter overlay and fix Dialog reduced-motion gap"
```

---

## Task 9: Wire the Command Center into `DashboardShell` and `DashboardHeader`

This is composition/wiring only — every piece being wired here (`CommandCenterTrigger`, `CommandCenter`, `useCommandCenterShortcut`) already has its own passing unit tests from Tasks 3, 7, and 8. Rather than force an artificial component test around unrelated dependencies (`ThemeToggle`'s `next-themes` provider, `LanguageSwitcher`, `UserMenu`), this task is verified by Task 14's manual QA pass plus the existing lint/build gates.

**Files:**
- Modify: `apps/web/src/features/dashboard/header.tsx`
- Modify: `apps/web/src/features/dashboard/dashboard-shell.tsx`

**Interfaces:**
- Consumes: `<CommandCenterTrigger />` (Task 7), `<CommandCenter />` (Task 8), `useCommandCenterShortcut()` (Task 3).

- [ ] **Step 1: Insert the trigger into the header**

`apps/web/src/features/dashboard/header.tsx`, full new contents:
```tsx
'use client';

import { CommandCenterTrigger } from '@/features/ai/components/command-center-trigger';

import { LanguageSwitcher } from './language-switcher';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
      <MobileNav />
      <div className="flex-1" />
      <CommandCenterTrigger />
      <LanguageSwitcher />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
```

- [ ] **Step 2: Mount the overlay and shortcut in the shell**

`apps/web/src/features/dashboard/dashboard-shell.tsx`, full new contents:
```tsx
'use client';

import { Sidebar } from '@erp-smart/ui';

import { CommandCenter } from '@/features/ai/components/command-center';
import { useCommandCenterShortcut } from '@/lib/command-center';

import { DashboardHeader } from './header';
import { DashboardSidebarNav } from './sidebar-nav';
import { VerificationBanner } from './verification-banner';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  useCommandCenterShortcut();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar className="hidden md:flex">
        <DashboardSidebarNav />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <VerificationBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandCenter />
    </div>
  );
}
```

- [ ] **Step 3: Verify the app still builds and type-checks**

Run: `npm run lint --workspace=apps/web`
Expected: PASS.

Run: `npm run build --workspace=apps/web`
Expected: PASS — production build succeeds with no new route/type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/dashboard/header.tsx apps/web/src/features/dashboard/dashboard-shell.tsx
git commit -m "feat: wire Command Center trigger and global shortcut into the dashboard shell"
```

---

## Task 10: `LowStockSection`

Presentational only — receives data as props, does not call `useLowStock()` itself, so `AttentionList` (Task 12) can coordinate the shared "nothing needs attention" empty state across both sections.

**Files:**
- Create: `apps/web/src/features/dashboard/low-stock-section.tsx`
- Test: `apps/web/src/features/dashboard/low-stock-section.test.tsx`

**Interfaces:**
- Produces: `<LowStockSection products={Product[] | undefined} isLoading={boolean} isError={boolean} />`, consumed by `AttentionList` in Task 12.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/dashboard/low-stock-section.test.tsx`:
```tsx
import type { Product } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { LowStockSection } from './low-stock-section';

const PRODUCT: Product = {
  id: 'p1',
  companyId: 'c1',
  categoryId: null,
  name: 'Widget',
  description: null,
  sku: null,
  imageUrl: null,
  purchasePrice: '5.00',
  sellingPrice: '10.00',
  quantityOnHand: 2,
  unit: 'pcs',
  lowStockThreshold: 5,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LowStockSection', () => {
  it('shows a skeleton while loading', () => {
    const { container } = renderWithProviders(<LowStockSection products={undefined} isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an inline error message without throwing', () => {
    renderWithProviders(<LowStockSection products={undefined} isLoading={false} isError />);
    expect(screen.getByText("Couldn't load low-stock products")).toBeInTheDocument();
  });

  it('renders nothing when there are no low-stock products', () => {
    const { container } = renderWithProviders(<LowStockSection products={[]} isLoading={false} isError={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists low-stock products with their remaining quantity', () => {
    renderWithProviders(<LowStockSection products={[PRODUCT]} isLoading={false} isError={false} />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('2 pcs')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `low-stock-section.tsx` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/dashboard/low-stock-section.tsx`:
```tsx
'use client';

import type { Product } from '@erp-smart/types';
import { Badge, Skeleton } from '@erp-smart/ui';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';

export function LowStockSection({
  products,
  isLoading,
  isError,
}: {
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const { messages } = useLocale();
  const t = messages.dashboard;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">{t.couldNotLoadLowStock}</p>;
  }

  const items = products ?? [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <PackageX className="h-4 w-4 text-warning" />
        {t.lowStockSectionTitle}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href="/dashboard/inventory" className="truncate text-foreground hover:underline">
              {product.name}
            </Link>
            <Badge variant="warning" className="shrink-0">
              {product.quantityOnHand} {product.unit}
            </Badge>
          </li>
        ))}
      </ul>
      {items.length > 5 ? (
        <Link href="/dashboard/inventory" className="text-xs font-medium text-primary hover:underline">
          {t.viewAllLowStock}
        </Link>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/low-stock-section.tsx apps/web/src/features/dashboard/low-stock-section.test.tsx
git commit -m "feat: add LowStockSection presentational component"
```

---

## Task 11: `OverdueInvoicesSection`

The list endpoint backing `useInvoices()` (`GET /invoices`) returns plain `Invoice[]`, which has no embedded customer name (only `GET /invoices/:id` does, via `InvoiceDetail.sale.customer`). Fetching the detail endpoint per row to show a name would be N+1, so this section honestly shows invoice number, due date, and amount only — no customer name. This mirrors the same honesty the spec itself applied to the "overdue customers → overdue invoices" reframing.

**Files:**
- Create: `apps/web/src/features/dashboard/overdue-invoices-section.tsx`
- Test: `apps/web/src/features/dashboard/overdue-invoices-section.test.tsx`

**Interfaces:**
- Produces: `<OverdueInvoicesSection invoices={Invoice[] | undefined} isLoading={boolean} isError={boolean} />`, consumed by `AttentionList` in Task 12.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/dashboard/overdue-invoices-section.test.tsx`:
```tsx
import type { Invoice } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { OverdueInvoicesSection } from './overdue-invoices-section';

const INVOICE: Invoice = {
  id: 'inv-1',
  companyId: 'c1',
  saleId: 's1',
  invoiceNumber: 'INV-0042',
  status: 'ISSUED',
  issueDate: '2026-01-01T00:00:00.000Z',
  dueDate: '2026-01-15T00:00:00.000Z',
  totalAmount: '150.00',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('OverdueInvoicesSection', () => {
  it('shows a skeleton while loading', () => {
    const { container } = renderWithProviders(
      <OverdueInvoicesSection invoices={undefined} isLoading isError={false} />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an inline error message without throwing', () => {
    renderWithProviders(<OverdueInvoicesSection invoices={undefined} isLoading={false} isError />);
    expect(screen.getByText("Couldn't load overdue invoices")).toBeInTheDocument();
  });

  it('renders nothing when there are no overdue invoices', () => {
    const { container } = renderWithProviders(
      <OverdueInvoicesSection invoices={[]} isLoading={false} isError={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists overdue invoices with their number and total', () => {
    renderWithProviders(<OverdueInvoicesSection invoices={[INVOICE]} isLoading={false} isError={false} />);
    expect(screen.getByText('INV-0042')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `overdue-invoices-section.tsx` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/dashboard/overdue-invoices-section.tsx`:
```tsx
'use client';

import type { Invoice } from '@erp-smart/types';
import { Badge, Skeleton } from '@erp-smart/ui';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

export function OverdueInvoicesSection({
  invoices,
  isLoading,
  isError,
}: {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const { messages, locale } = useLocale();
  const t = messages.dashboard;
  const formatMoney = useFormatMoney();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">{t.couldNotLoadOverdueInvoices}</p>;
  }

  const items = invoices ?? [];
  if (items.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        {t.overdueInvoicesSectionTitle}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href="/dashboard/invoices" className="truncate text-foreground hover:underline">
              {invoice.invoiceNumber}
            </Link>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant="destructive">
                {invoice.dueDate ? dateFormatter.format(new Date(invoice.dueDate)) : ''}
              </Badge>
              <span className="text-muted-foreground">{formatMoney(invoice.totalAmount)}</span>
            </span>
          </li>
        ))}
      </ul>
      {items.length > 5 ? (
        <Link href="/dashboard/invoices" className="text-xs font-medium text-primary hover:underline">
          {t.viewAllOverdueInvoices}
        </Link>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/overdue-invoices-section.tsx apps/web/src/features/dashboard/overdue-invoices-section.test.tsx
git commit -m "feat: add OverdueInvoicesSection presentational component"
```

---

## Task 12: `AttentionList` container

Coordinates permission gating, data fetching, the overdue filter, and the shared empty state across both sections (state lifted up, per `vercel-composition-patterns`' `state-lift-state` rule — the two child sections stay purely presentational).

The spec's literal empty-state condition ("both sections empty and both permissions present") is generalized here to: the calm empty state shows whenever every *permitted* section is empty, regardless of whether the user has one or both permissions — from a user who can only see one signal, an empty visible signal still means "nothing I can see needs attention," not "broken."

**Files:**
- Create: `apps/web/src/features/dashboard/attention-list.tsx`
- Test: `apps/web/src/features/dashboard/attention-list.test.tsx`

**Interfaces:**
- Consumes: `useLowStock` (`apps/web/src/features/inventory/hooks.ts`), `useInvoices` (`apps/web/src/features/invoices/hooks.ts`), `isInvoiceOverdue` (Task 5), `LowStockSection` (Task 10), `OverdueInvoicesSection` (Task 11), `usePermissions` (`apps/web/src/lib/store`).
- Produces: `<AttentionList />`, consumed by `dashboard/page.tsx` in Task 13.

- [ ] **Step 1: Write the failing test**

`apps/web/src/features/dashboard/attention-list.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';

import * as inventoryHooks from '@/features/inventory/hooks';
import * as invoicesHooks from '@/features/invoices/hooks';
import { useAuthStore } from '@/lib/store';
import { renderWithProviders, screen } from '@/test/test-utils';

import { AttentionList } from './attention-list';

vi.mock('@/features/inventory/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/inventory/hooks')>();
  return { ...actual, useLowStock: vi.fn() };
});

vi.mock('@/features/invoices/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/invoices/hooks')>();
  return { ...actual, useInvoices: vi.fn() };
});

function setPermissions(permissions: string[]) {
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'token',
    user: {
      sub: 'user-1',
      email: 'owner@example.com',
      companyId: 'company-1',
      roleId: 'role-1',
      roleKey: 'OWNER',
      permissions: permissions as never,
      platformRole: 'USER',
    },
  });
}

describe('AttentionList', () => {
  it('renders nothing when the user has neither permission', () => {
    setPermissions([]);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);

    const { container } = renderWithProviders(<AttentionList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the calm empty state when both sections are permitted and empty', () => {
    setPermissions(['INVENTORY:READ', 'INVOICES:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: [], isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: [], isLoading: false, isError: false } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it('shows only the low-stock section when the user lacks INVOICES:READ', () => {
    setPermissions(['INVENTORY:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({
      data: [
        {
          id: 'p1',
          companyId: 'c1',
          categoryId: null,
          name: 'Widget',
          description: null,
          sku: null,
          imageUrl: null,
          purchasePrice: '5.00',
          sellingPrice: '10.00',
          quantityOnHand: 1,
          unit: 'pcs',
          lowStockThreshold: 5,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.queryByText('Overdue invoices')).not.toBeInTheDocument();
  });

  it('filters invoices to only overdue ones before rendering the overdue section', () => {
    setPermissions(['INVOICES:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({
      data: [
        {
          id: 'i1',
          companyId: 'c1',
          saleId: 's1',
          invoiceNumber: 'INV-1',
          status: 'ISSUED',
          issueDate: '2020-01-01T00:00:00.000Z',
          dueDate: '2020-01-15T00:00:00.000Z',
          totalAmount: '10.00',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: 'i2',
          companyId: 'c1',
          saleId: 's2',
          invoiceNumber: 'INV-2',
          status: 'ISSUED',
          issueDate: '2099-01-01T00:00:00.000Z',
          dueDate: '2099-01-15T00:00:00.000Z',
          totalAmount: '20.00',
          createdAt: '2099-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.queryByText('INV-2')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web`
Expected: FAIL — `attention-list.tsx` does not exist yet.

- [ ] **Step 3: Write the implementation**

`apps/web/src/features/dashboard/attention-list.tsx`:
```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@erp-smart/ui';
import { CheckCircle2 } from 'lucide-react';

import { useInvoices } from '@/features/invoices/hooks';
import { isInvoiceOverdue } from '@/features/invoices/overdue';
import { useLowStock } from '@/features/inventory/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

import { LowStockSection } from './low-stock-section';
import { OverdueInvoicesSection } from './overdue-invoices-section';

export function AttentionList() {
  const permissions = usePermissions();
  const canViewInventory = permissions.includes('INVENTORY:READ');
  const canViewInvoices = permissions.includes('INVOICES:READ');
  const { messages } = useLocale();
  const t = messages.dashboard;

  const lowStockQuery = useLowStock({ enabled: canViewInventory });
  const invoicesQuery = useInvoices('ISSUED', { enabled: canViewInvoices });

  if (!canViewInventory && !canViewInvoices) return null;

  const overdueInvoices = (invoicesQuery.data ?? []).filter((invoice) => isInvoiceOverdue(invoice));

  const lowStockEmpty =
    !canViewInventory || (!lowStockQuery.isLoading && !lowStockQuery.isError && lowStockQuery.data?.length === 0);
  const overdueEmpty =
    !canViewInvoices || (!invoicesQuery.isLoading && !invoicesQuery.isError && overdueInvoices.length === 0);
  const anyQueryLoading =
    (canViewInventory && lowStockQuery.isLoading) || (canViewInvoices && invoicesQuery.isLoading);
  const nothingNeedsAttention = !anyQueryLoading && lowStockEmpty && overdueEmpty;

  return (
    <Card className="flex min-h-[26rem] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.attentionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        {nothingNeedsAttention ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <EmptyState
              icon={<CheckCircle2 />}
              title={t.nothingNeedsAttentionTitle}
              description={t.nothingNeedsAttentionDescription}
              className="border-none"
            />
          </div>
        ) : (
          <>
            {canViewInventory ? (
              <LowStockSection
                products={lowStockQuery.data}
                isLoading={lowStockQuery.isLoading}
                isError={lowStockQuery.isError}
              />
            ) : null}
            {canViewInvoices ? (
              <OverdueInvoicesSection
                invoices={overdueInvoices}
                isLoading={invoicesQuery.isLoading}
                isError={invoicesQuery.isError}
              />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/attention-list.tsx apps/web/src/features/dashboard/attention-list.test.tsx
git commit -m "feat: add AttentionList container"
```

---

## Task 13: Wire `AttentionList` into the dashboard home page

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `<AttentionList />` (Task 12).

- [ ] **Step 1: Swap the component**

In `apps/web/src/app/dashboard/page.tsx`, replace the import:
```tsx
import { RecentActivityCard } from '@/features/dashboard/recent-activity-card';
```
with:
```tsx
import { AttentionList } from '@/features/dashboard/attention-list';
```
and replace the usage:
```tsx
        <div className="lg:col-span-2">
          <RecentActivityCard />
        </div>
```
with:
```tsx
        <div className="lg:col-span-2">
          <AttentionList />
        </div>
```
`RecentActivityCard`'s own file is untouched and remains in the codebase, unused by this page, ready for a future real cross-module activity feed.

- [ ] **Step 2: Verify the app builds**

Run: `npm run lint --workspace=apps/web`
Expected: PASS.

Run: `npm run build --workspace=apps/web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat: replace RecentActivityCard with AttentionList on the dashboard home page"
```

---

## Task 14: Manual QA pass

Automated tests cover logic and rendering; this task is the visual/interactive verification the spec calls for (§D, §F) that no automated test in this plan asserts pixel-level RTL correctness or reduced-motion behavior. Use `playwright-cli` (already available in this environment) against the real running dev server.

**Files:** none (verification only).

- [ ] **Step 1: Start both dev servers**

Run (in separate terminals, or backgrounded):
```bash
npm run dev:api
npm run dev:web
```

- [ ] **Step 2: Log in and open the Command Center**

```bash
playwright-cli open http://localhost:3000/login
playwright-cli fill e<email-ref> "<a real seeded user's email>" 
playwright-cli fill e<password-ref> "<password>"
playwright-cli click e<sign-in-button-ref>
playwright-cli press Control+k
playwright-cli snapshot
```
Expected: overlay visible, input focused, suggestion chips shown.

- [ ] **Step 3: Verify the header trigger and Escape**

```bash
playwright-cli press Escape
playwright-cli find "Ask AI"
playwright-cli click e<trigger-ref>
playwright-cli snapshot
```
Expected: same overlay opens via the visible button.

- [ ] **Step 4: Verify global availability**

```bash
playwright-cli goto http://localhost:3000/dashboard/products
playwright-cli press Control+k
playwright-cli snapshot
```
Expected: overlay opens from a page other than the dashboard home.

- [ ] **Step 5: Verify Attention List against real data**

```bash
playwright-cli goto http://localhost:3000/dashboard
playwright-cli snapshot
```
Expected: either real low-stock/overdue-invoice rows (if the seeded company has any) or the calm "You're all caught up" state — never a raw error or blank box.

- [ ] **Step 6: Verify RTL**

Use the in-app `LanguageSwitcher` to switch to Arabic, then repeat Step 2.
Expected: overlay opens correctly; suggestion chip text and the input wrap correctly right-to-left; the keyboard hint still reads `Ctrl+K`/`⌘K` (untranslated).

- [ ] **Step 7: Verify mobile layout**

```bash
playwright-cli open --mobile http://localhost:3000/dashboard
playwright-cli screenshot
```
Expected: header trigger visible (icon-only is acceptable, label may be hidden), Command Center overlay reachable by tapping it, and it comfortably fits the mobile viewport. If the `inset-x-4`/`max-w-2xl` sizing from Task 8 doesn't look right at this viewport, adjust those utility classes on `DialogContent` directly and re-check.

- [ ] **Step 8: Verify reduced motion**

```bash
playwright-cli run-code "async page => await page.emulateMedia({ reducedMotion: 'reduce' })"
playwright-cli press Control+k
playwright-cli snapshot
```
Expected: overlay appears via a plain cross-fade, no scale/zoom motion.

---

## Task 15: Playwright bootstrap + one real e2e scenario

Bootstraps the e2e test runner this repository has never had, and implements the highest-value scenario from the spec's testing strategy end-to-end. The remaining five scenarios are documented as a concrete follow-up plan (per the `playwright-cli` skill's own plan → generate → heal workflow) rather than implemented here, to keep this task's deliverable real and complete rather than a large half-finished suite.

Because the access token lives only in memory (never a cookie — see `apps/web/src/app/dashboard/layout.tsx`), there is no session state Playwright can inject before page load; each test authenticates via the real UI after registering a fresh company through the API.

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/command-center.spec.ts`
- Create: `apps/web/specs/command-center.plan.md`

- [ ] **Step 1: Install Playwright**

```bash
npm install --workspace=apps/web --save-dev @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write the Playwright config**

`apps/web/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 3: Write the scenario plan document**

`apps/web/specs/command-center.plan.md`:
```markdown
# Command Center E2E Test Plan

Seed test: register a fresh company via the real UI (`/register`), land on `/dashboard`. The access token is in-memory only, so every scenario must authenticate this way — there is no cookie or storage state to inject.

## 1. Keyboard access — IMPLEMENTED (e2e/command-center.spec.ts)
- Press Ctrl+K from /dashboard.
  - expect: overlay visible, input focused.
- Press Escape.
  - expect: overlay closes.
- Navigate to /dashboard/products, press Ctrl+K.
  - expect: overlay opens (proves it's global, not page-scoped).

## 2. Visible trigger — follow-up
- Click the "Ask AI" header button.
  - expect: same overlay opens as the keyboard shortcut.

## 3. Asking a question — follow-up
- Open the Command Center, type a question, press Enter.
  - expect: a response renders inline (assert visibility of the response region, not exact wording — AI output is non-deterministic).

## 4. Attention List — real data, no fabrication — follow-up
- Seed a company with a product below its low-stock threshold and a past-dated invoice via direct API calls, not the UI.
  - expect: both AttentionList sections show the seeded items on /dashboard.
- Seed a company with neither condition true.
  - expect: the calm "You're all caught up" state renders, not an error and not a blank box.

## 5. RTL — follow-up
- Switch locale to Arabic, repeat scenario 3.
  - expect: overlay opens correctly; screenshot comparison for direction/wrapping (RTL correctness is inherently visual).

## 6. Mobile — follow-up
- Run the chromium project with `devices['Pixel 7']`.
  - expect: header trigger present and tappable; overlay takes the full-viewport mobile treatment.

Generate scenarios 2-6 one at a time against the real running app via playwright-cli's plan -> generate -> heal workflow, rather than hand-writing selectors blind.
```

- [ ] **Step 4: Write and implement the first scenario**

`apps/web/e2e/command-center.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test';

function uniqueEmail() {
  return `command-center-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function registerAndLogIn(page: Page) {
  const email = uniqueEmail();
  const password = 'CommandCenter123!';

  await page.goto('/register');
  await page.locator('#fullName').fill('Command Center Tester');
  await page.locator('#companyName').fill('Command Center Test Co');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('AI Command Center — keyboard access', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogIn(page);
  });

  test('Ctrl+K opens the overlay with the input focused, Escape closes it', async ({ page }) => {
    await page.keyboard.press('Control+K');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder(/ask about your sales/i)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('opens from a page other than the dashboard home', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.keyboard.press('Control+K');

    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

- [ ] **Step 5: Add the e2e script**

Modify `apps/web/package.json`'s `scripts` block, adding:
```json
"test:e2e": "playwright test",
```

- [ ] **Step 6: Run it**

Prerequisite: `npm run dev:api` running in another terminal (Playwright's `webServer` starts `apps/web`'s dev server automatically, but not the API).

Run: `npm run test:e2e --workspace=apps/web`
Expected: PASS — 2 tests passed.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/web/playwright.config.ts apps/web/e2e apps/web/specs
git commit -m "test: bootstrap Playwright and implement the Command Center keyboard-access scenario"
```

---

## C) Data flow summary (existing APIs, unchanged)

| Signal | Hook | Endpoint | Permission |
|---|---|---|---|
| AI chat | `useSendChatMessage()` (existing) | `POST /ai/chat` | none (per-tool, server-side) |
| AI conversation | `useConversation(id)` (existing) | `GET /ai/conversations/:id` | none |
| Low stock | `useLowStock()` (existing) | `GET /inventory/low-stock` | `INVENTORY:READ` |
| Overdue invoices | `useInvoices('ISSUED')` (existing) + client-side `isInvoiceOverdue` filter (Task 5) | `GET /invoices?status=ISSUED` | `INVOICES:READ` |

No new backend endpoint, DTO, or Prisma model is introduced anywhere in this plan.

---

## Risks and possible improvements

- **`inset-x-4`/`max-w-2xl` mobile sizing on `DialogContent` (Task 8) is a reasoned starting point, not a guaranteed-correct one** — it needs the visual check in Task 14, Step 7, and may need adjustment.
- **Radix's default autofocus-first-tabbable-child behavior** is relied on for focusing the Command Center's input (Task 8) rather than custom ref-based focus code. If Task 8's test fails on that assertion, the fix is to wrap `ChatComposer`'s `Textarea` in `React.forwardRef` and add an `onOpenAutoFocus` handler on `DialogContent` that calls `.focus()` explicitly.
- **Playwright scenarios 2–6** (visible trigger, sending a real question, seeded Attention List data, RTL screenshot, mobile viewport) are documented in `apps/web/specs/command-center.plan.md` but not implemented in this plan — deliberately scoped out to keep Task 15 a complete, real deliverable rather than a half-finished six-scenario suite. Recommended as the immediate next follow-up after this plan ships.
- **`seedContext`** is fully wired end-to-end (store → `ChatComposer`'s `initialValue`) but nothing in this plan calls `open(seedContext)` with a real value yet — no contextual "Ask AI about this" entry point exists on any page today. This is intentional (matches the approved spec's scope), and is the natural next extension once a page wants one (e.g., a customer detail page).
- **No customer name on the Overdue Invoices section** (Task 11) — the list endpoint doesn't embed it, and fetching invoice details per row would be N+1. If this turns out to matter in practice, the right fix is a new backend endpoint (e.g. `GET /invoices?status=ISSUED&include=customer`), not a client-side workaround.
- **`AttentionList`'s combined empty-state condition** is a deliberate generalization of the spec's literal two-permission example (see Task 12's note) — worth confirming this reading matches intent once it's visible in the running app.

---

## Self-Review

**Spec coverage:** §A (architecture) — grounded throughout Global Constraints and each task's rationale. §B.1–B.5 (components) — Tasks 7, 8, 10, 11, 12, 13. §C (data sources) — Tasks 5, 12, and the Data Flow summary table above. §D (UX behavior) — animation via Task 8's Dialog defaults + reduced-motion fix; keyboard behavior via Task 3; empty/loading/error states via Tasks 10–12; RTL/mobile via Tasks 8 (sizing), 10–11 (logical properties), 14 (manual verification). §E (component architecture) — state lifted into `AttentionList` (Task 12), no boolean-prop proliferation, `CommandCenter`'s shell/input kept separate from what renders below it (Task 8), shared `MessageBubble`/`getVisibleMessages` reuse (Task 6). §F (accessibility) — Radix focus trap/Escape/restore (Task 8, inherited), `sr-only` `DialogTitle`, `aria-live` region (Task 8), reduced motion (Task 8). §G (testing) — unit tests (Tasks 2, 5, 6), integration tests (Tasks 7, 8, 10, 11, 12), Playwright (Task 15).

**Placeholder scan:** every step has complete, runnable code; no "TBD"/"add error handling"/"similar to Task N" language. The one intentionally-deferred item (Playwright scenarios 2–6) is explicitly labeled "follow-up," not disguised as done.

**Type consistency:** `CommandCenterStore`'s `open(seedContext?: string)`/`close()`/`toggle()` signatures match across Tasks 2, 3, 7, 8. `getVisibleMessages(conversation: AIConversationDetail | undefined): AIMessage[]` matches its Task 6 definition and Task 8's usage. `isInvoiceOverdue(invoice: Invoice, now?: Date): boolean` matches across Tasks 5 and 12. `LowStockSection`/`OverdueInvoicesSection` prop shapes match between their own tasks (10, 11) and their `AttentionList` call sites (Task 12).

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Without this, React Testing Library's auto-cleanup never runs between
// tests here: it only self-registers via a *global* afterEach, which this
// project doesn't have (test.globals is intentionally left off in
// vitest.config.ts so every test file imports describe/it/expect
// explicitly). Without it, a component left mounted by one test stays
// subscribed to shared state (e.g. a Zustand store) when the next test runs.
afterEach(() => {
  cleanup();
});

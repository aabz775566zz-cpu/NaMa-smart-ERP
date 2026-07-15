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

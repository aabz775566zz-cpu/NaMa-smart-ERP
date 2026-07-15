import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

describe('renderWithProviders', () => {
  it('renders children inside the locale and query providers', () => {
    renderWithProviders(<p>hello test harness</p>);
    expect(screen.getByText('hello test harness')).toBeInTheDocument();
  });
});

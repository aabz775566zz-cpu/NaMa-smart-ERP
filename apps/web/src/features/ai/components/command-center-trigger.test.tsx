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

  it('renders the Arabic label when locale is ar', () => {
    renderWithProviders(<CommandCenterTrigger />, { locale: 'ar' });
    expect(screen.getByText('اسأل الذكاء الاصطناعي')).toBeInTheDocument();
  });
});

import { fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterStore } from '@/lib/command-center';
import { renderWithProviders, screen } from '@/test/test-utils';

import { CommandCenter } from './command-center';

describe('CommandCenter', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
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

  it('closes on Escape', async () => {
    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(useCommandCenterStore.getState().isOpen).toBe(false));
  });

  it('closes when the built-in close button is clicked', async () => {
    renderWithProviders(<CommandCenter />);
    useCommandCenterStore.getState().open();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(useCommandCenterStore.getState().isOpen).toBe(false));
  });
});

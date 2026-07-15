import { fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterShortcut, useCommandCenterStore } from '@/lib/command-center';
import { renderWithProviders, screen } from '@/test/test-utils';

import { CommandCenter } from './command-center';
import { CommandCenterTrigger } from './command-center-trigger';

// Mirrors exactly how DashboardShell wires the Command Center together (the
// shortcut hook + the trigger button + the overlay, all sharing one store)
// — deliberately omits unrelated shell chrome (sidebar nav, theme toggle,
// language switcher, user menu), which isn't part of what this integration
// verifies and would need unrelated mocking to render.
function DashboardShellHarness() {
  useCommandCenterShortcut();
  return (
    <>
      <CommandCenterTrigger />
      <CommandCenter />
    </>
  );
}

function pressCtrlK() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
}

describe('Command Center — trigger, shortcut, and overlay wired together', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
  });

  it('opens the Command Center when the Ask AI button is clicked', async () => {
    renderWithProviders(<DashboardShellHarness />);

    fireEvent.click(screen.getByRole('button', { name: /ask ai/i }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });

  it('opens the Command Center on Ctrl+K, through the same wiring the shell uses', async () => {
    renderWithProviders(<DashboardShellHarness />);

    pressCtrlK();

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });

  it('never mounts more than one dialog, regardless of which entry point opened it', async () => {
    renderWithProviders(<DashboardShellHarness />);

    pressCtrlK();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});

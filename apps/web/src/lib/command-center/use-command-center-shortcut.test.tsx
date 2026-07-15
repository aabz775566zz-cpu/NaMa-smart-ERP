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

  it('opens the Command Center on Ctrl+K', () => {
    renderHook(() => useCommandCenterShortcut());
    pressCtrlK();
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
  });

  it('does not interfere with Escape — only reacts to Ctrl+K/Cmd+K', () => {
    renderHook(() => useCommandCenterShortcut());
    useCommandCenterStore.getState().open();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(escapeEvent);

    // Escape-closes-the-dialog is Radix Dialog's own behavior, already
    // covered by command-center.test.tsx. This hook must not touch
    // isOpen for any key other than Ctrl+K/Cmd+K, so it stays open here.
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
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

  it('removes its keydown listener on unmount', () => {
    const { unmount } = renderHook(() => useCommandCenterShortcut());
    unmount();

    pressCtrlK();

    expect(useCommandCenterStore.getState().isOpen).toBe(false);
  });
});

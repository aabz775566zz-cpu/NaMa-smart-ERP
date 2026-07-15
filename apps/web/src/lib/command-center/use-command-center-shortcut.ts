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
 * Registers the global Ctrl+K (Windows/Linux) / Cmd+K (Mac) listener that
 * opens the Command Center. Mount this once, inside DashboardShell — never
 * in the root layout, since that renders before authentication resolves
 * (apps/web/src/app/dashboard/layout.tsx gates on auth status client-side).
 *
 * The "don't hijack typing" guard only applies when currently closed: once
 * open, Radix Dialog's own focus trap guarantees the only editable element
 * that can be focused is the Command Center's own input, so a second
 * Ctrl+K while it's open should still be able to close it rather than be
 * silently swallowed by this guard.
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

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

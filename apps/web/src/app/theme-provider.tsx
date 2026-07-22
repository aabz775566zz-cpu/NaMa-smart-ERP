'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Thin wrapper so app/layout.tsx doesn't import next-themes directly —
// `attribute="class"` matches packages/ui's `darkMode: ['class']` preset;
// next-themes handles the localStorage persistence and no-flash SSR script
// injection itself.
//
// defaultTheme="dark": Golden Night — the deliberately premium, high-craft
// surface (glow, rim-light, ambient bloom) — is what a first-time visitor
// with no stored preference should see, not a coin-flip against their OS
// setting. Once a user has ever toggled (ThemeToggle writes to
// localStorage), their explicit choice always wins on every later visit —
// this only decides the very first impression.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Thin wrapper so app/layout.tsx doesn't import next-themes directly —
// `attribute="class"` matches packages/ui's `darkMode: ['class']` preset;
// next-themes handles the localStorage persistence and no-flash SSR script
// injection itself.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

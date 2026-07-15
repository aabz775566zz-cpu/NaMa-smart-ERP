'use client';

import { Button } from '@erp-smart/ui';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { messages } = useLocale();
  // next-themes resolves the real theme only after mount (it needs to read
  // localStorage/media query client-side) — render a stable placeholder
  // until then so SSR/CSR markup matches and we don't flash the wrong icon.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={messages.dashboard.toggleTheme}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

import type { Metadata } from 'next';
import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig, resolveLocale } from '@erp-smart/i18n';
import { Toaster } from '@erp-smart/ui';
import '@erp-smart/ui/globals.css';
import { Inter, Tajawal } from 'next/font/google';
import { cookies } from 'next/headers';

import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { LOCALE_COOKIE_NAME } from '@/lib/locale/constants';
import { LocaleProvider } from '@/lib/locale/locale-context';

import { Providers } from './providers';
import { ThemeProvider } from './theme-provider';

// Both fonts load unconditionally — the active locale is only known at
// request time (from a cookie), not at build time, so next/font can't be
// called conditionally. Each only exposes a CSS variable; which one
// actually renders is decided by html[lang] in globals.css, not by which
// of these run. Tajawal has no variable-font axis on Google Fonts, hence
// the explicit weight list (Inter is variable and doesn't need one).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-inter' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-tajawal' });

export const metadata: Metadata = {
  title: brandConfig.productName,
  description: brandConfig.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const { direction, messages } = getLocaleConfig(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${inter.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <LocaleProvider locale={locale} messages={messages}>
            <Providers>
              <SessionBootstrap />
              {children}
              <Toaster />
            </Providers>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

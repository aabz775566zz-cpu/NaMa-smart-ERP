import type { Metadata } from 'next';
import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig, resolveLocale } from '@erp-smart/i18n';
import { Toaster } from '@erp-smart/ui';
import '@erp-smart/ui/globals.css';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';

import { SessionBootstrap } from '@/features/auth/session-bootstrap';
import { LOCALE_COOKIE_NAME } from '@/lib/locale/constants';
import { LocaleProvider } from '@/lib/locale/locale-context';

import { Providers } from './providers';
import { ThemeProvider } from './theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: brandConfig.productName,
  description: brandConfig.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const { direction, messages } = getLocaleConfig(locale);

  return (
    <html lang={locale} dir={direction} className={inter.variable} suppressHydrationWarning>
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

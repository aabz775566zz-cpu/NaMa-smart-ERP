import type { Metadata } from 'next';
import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig, resolveLocale } from '@erp-smart/i18n';
import '@erp-smart/ui/globals.css';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: brandConfig.productName,
  description: brandConfig.tagline,
};

// Same cookie name/convention as apps/web (see
// src/lib/locale/locale-context.tsx there) — kept independent rather than
// sharing a package, since this is a single page reading one cookie
// server-side, not worth a new shared context package for.
const LOCALE_COOKIE_NAME = 'erp-smart-locale';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const { direction } = getLocaleConfig(locale);

  return (
    <html lang={locale} dir={direction} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig, resolveLocale } from '@erp-smart/i18n';
import '@erp-smart/ui/globals.css';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';

// Named --font-inter (not --font-sans) to match the shared token contract
// in packages/ui/src/globals.css, which derives --font-sans from
// --font-inter/--font-tajawal based on html[lang] — apps/web loads both;
// this app only loads Inter, so Arabic here still renders in Inter, same
// as before this rename (unchanged behavior, just a consistent variable name).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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

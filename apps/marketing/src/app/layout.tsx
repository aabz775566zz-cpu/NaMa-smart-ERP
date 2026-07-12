import type { Metadata } from 'next';
import { getLocaleConfig } from '@erp-smart/i18n';
import '@erp-smart/ui/globals.css';

export const metadata: Metadata = {
  title: 'ERP Smart',
  description: 'AI-powered SaaS ERP platform for small and medium businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, direction } = getLocaleConfig('en');

  return (
    <html lang={locale} dir={direction}>
      <body>{children}</body>
    </html>
  );
}

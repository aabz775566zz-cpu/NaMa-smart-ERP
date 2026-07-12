import type { Metadata } from 'next';
import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig } from '@erp-smart/i18n';
import { Toaster } from '@erp-smart/ui';
import '@erp-smart/ui/globals.css';

import { SessionBootstrap } from '@/features/auth/session-bootstrap';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: brandConfig.productName,
  description: brandConfig.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, direction } = getLocaleConfig('en');

  return (
    <html lang={locale} dir={direction}>
      <body>
        <Providers>
          <SessionBootstrap />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

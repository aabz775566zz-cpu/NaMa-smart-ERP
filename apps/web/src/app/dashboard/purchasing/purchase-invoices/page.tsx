'use client';

import { Receipt } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function PurchaseInvoicesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Receipt}
      title={messages.nav.purchaseInvoices}
      description={messages.modules.purchaseInvoices.description}
      capabilities={messages.modules.purchaseInvoices.capabilities}
    />
  );
}

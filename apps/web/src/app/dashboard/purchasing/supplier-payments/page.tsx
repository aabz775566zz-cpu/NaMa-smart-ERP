'use client';

import { HandCoins } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SupplierPaymentsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={HandCoins}
      title={messages.nav.supplierPayments}
      description={messages.modules.supplierPayments.description}
      capabilities={messages.modules.supplierPayments.capabilities}
    />
  );
}

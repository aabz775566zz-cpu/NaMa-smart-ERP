'use client';

import { ClipboardList } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function PurchaseOrdersPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={ClipboardList}
      title={messages.nav.purchaseOrders}
      description={messages.modules.purchaseOrders.description}
      capabilities={messages.modules.purchaseOrders.capabilities}
    />
  );
}

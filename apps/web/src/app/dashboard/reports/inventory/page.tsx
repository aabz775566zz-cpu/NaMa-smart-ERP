'use client';

import { Boxes } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function InventoryReportsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Boxes}
      title={messages.nav.inventoryReports}
      description={messages.modules.inventoryReports.description}
      capabilities={messages.modules.inventoryReports.capabilities}
    />
  );
}

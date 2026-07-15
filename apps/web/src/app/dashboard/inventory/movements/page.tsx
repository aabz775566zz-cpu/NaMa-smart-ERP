'use client';

import { ArrowLeftRight } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function InventoryMovementsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={ArrowLeftRight}
      title={messages.nav.inventoryMovements}
      description={messages.modules.inventoryMovements.description}
      capabilities={messages.modules.inventoryMovements.capabilities}
    />
  );
}

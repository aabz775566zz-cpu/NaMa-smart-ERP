'use client';

import { Truck } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SuppliersPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Truck}
      title={messages.nav.suppliers}
      description={messages.modules.suppliers.description}
      capabilities={messages.modules.suppliers.capabilities}
    />
  );
}

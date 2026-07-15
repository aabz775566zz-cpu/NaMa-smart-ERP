'use client';

import { DollarSign } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function CurrenciesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={DollarSign}
      title={messages.nav.currencies}
      description={messages.modules.currencies.description}
      capabilities={messages.modules.currencies.capabilities}
    />
  );
}

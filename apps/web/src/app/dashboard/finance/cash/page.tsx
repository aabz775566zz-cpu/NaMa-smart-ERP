'use client';

import { Banknote } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function CashPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Banknote}
      title={messages.nav.cash}
      description={messages.modules.cash.description}
      capabilities={messages.modules.cash.capabilities}
    />
  );
}

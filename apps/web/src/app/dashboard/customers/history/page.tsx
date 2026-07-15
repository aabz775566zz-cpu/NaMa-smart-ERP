'use client';

import { History } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function CustomerHistoryPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={History}
      title={messages.nav.customerHistory}
      description={messages.modules.customerHistory.description}
      capabilities={messages.modules.customerHistory.capabilities}
    />
  );
}

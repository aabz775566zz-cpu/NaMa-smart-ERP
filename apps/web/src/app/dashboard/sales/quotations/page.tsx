'use client';

import { ClipboardList } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function QuotationsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={ClipboardList}
      title={messages.nav.quotations}
      description={messages.modules.quotations.description}
      capabilities={messages.modules.quotations.capabilities}
    />
  );
}

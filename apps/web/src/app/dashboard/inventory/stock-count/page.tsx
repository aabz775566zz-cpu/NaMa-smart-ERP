'use client';

import { ClipboardCheck } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function StockCountPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={ClipboardCheck}
      title={messages.nav.stockCount}
      description={messages.modules.stockCount.description}
      capabilities={messages.modules.stockCount.capabilities}
    />
  );
}

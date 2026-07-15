'use client';

import { TrendingUp } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SalesReportsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={TrendingUp}
      title={messages.nav.salesReports}
      description={messages.modules.salesReports.description}
      capabilities={messages.modules.salesReports.capabilities}
    />
  );
}

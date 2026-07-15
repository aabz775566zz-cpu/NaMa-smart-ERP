'use client';

import { PiggyBank } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function ProfitReportsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={PiggyBank}
      title={messages.nav.profitReports}
      description={messages.modules.profitReports.description}
      capabilities={messages.modules.profitReports.capabilities}
    />
  );
}

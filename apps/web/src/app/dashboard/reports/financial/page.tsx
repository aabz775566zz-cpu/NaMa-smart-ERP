'use client';

import { FileBarChart } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function FinancialReportsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={FileBarChart}
      title={messages.nav.financialReports}
      description={messages.modules.financialReports.description}
      capabilities={messages.modules.financialReports.capabilities}
    />
  );
}

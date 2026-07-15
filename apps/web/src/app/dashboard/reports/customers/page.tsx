'use client';

import { UsersRound } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function CustomerReportsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={UsersRound}
      title={messages.nav.customerReports}
      description={messages.modules.customerReports.description}
      capabilities={messages.modules.customerReports.capabilities}
    />
  );
}

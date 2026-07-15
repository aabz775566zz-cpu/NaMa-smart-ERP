'use client';

import { TrendingDown } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function ExpensesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={TrendingDown}
      title={messages.nav.expenses}
      description={messages.modules.expenses.description}
      capabilities={messages.modules.expenses.capabilities}
    />
  );
}

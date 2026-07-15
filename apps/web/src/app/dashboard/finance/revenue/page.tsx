'use client';

import { TrendingUp } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function RevenuePage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={TrendingUp}
      title={messages.nav.revenue}
      description={messages.modules.revenue.description}
      capabilities={messages.modules.revenue.capabilities}
    />
  );
}

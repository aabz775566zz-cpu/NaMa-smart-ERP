'use client';

import { Coins } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function PayrollPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Coins}
      title={messages.nav.payroll}
      description={messages.modules.payroll.description}
      capabilities={messages.modules.payroll.capabilities}
    />
  );
}

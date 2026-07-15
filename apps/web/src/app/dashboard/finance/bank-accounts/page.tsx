'use client';

import { Landmark } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function BankAccountsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Landmark}
      title={messages.nav.bankAccounts}
      description={messages.modules.bankAccounts.description}
      capabilities={messages.modules.bankAccounts.capabilities}
    />
  );
}

'use client';

import { Percent } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function TaxesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Percent}
      title={messages.nav.taxes}
      description={messages.modules.taxes.description}
      capabilities={messages.modules.taxes.capabilities}
    />
  );
}

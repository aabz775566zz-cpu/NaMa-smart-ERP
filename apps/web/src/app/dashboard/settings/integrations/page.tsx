'use client';

import { Plug } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function IntegrationsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Plug}
      title={messages.nav.integrations}
      description={messages.modules.integrations.description}
      capabilities={messages.modules.integrations.capabilities}
    />
  );
}

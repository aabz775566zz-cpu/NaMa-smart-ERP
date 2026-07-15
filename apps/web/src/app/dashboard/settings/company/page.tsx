'use client';

import { Building2 } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SettingsCompanyPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Building2}
      title={messages.nav.company}
      description={messages.modules.company.description}
      capabilities={messages.modules.company.capabilities}
    />
  );
}

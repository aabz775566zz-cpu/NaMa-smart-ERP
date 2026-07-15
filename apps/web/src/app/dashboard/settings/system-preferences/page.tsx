'use client';

import { SlidersHorizontal } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SystemPreferencesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={SlidersHorizontal}
      title={messages.nav.systemPreferences}
      description={messages.modules.systemPreferences.description}
      capabilities={messages.modules.systemPreferences.capabilities}
    />
  );
}

'use client';

import { BookText } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function JournalEntriesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={BookText}
      title={messages.nav.journalEntries}
      description={messages.modules.journalEntries.description}
      capabilities={messages.modules.journalEntries.capabilities}
    />
  );
}

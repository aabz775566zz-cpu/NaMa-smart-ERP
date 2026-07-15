'use client';

import { Contact } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function ContactsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Contact}
      title={messages.nav.contacts}
      description={messages.modules.contacts.description}
      capabilities={messages.modules.contacts.capabilities}
    />
  );
}

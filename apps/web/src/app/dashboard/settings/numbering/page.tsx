'use client';

import { Hash } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function NumberingPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Hash}
      title={messages.nav.numbering}
      description={messages.modules.numbering.description}
      capabilities={messages.modules.numbering.capabilities}
    />
  );
}

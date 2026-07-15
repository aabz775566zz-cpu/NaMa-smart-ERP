'use client';

import { CalendarX } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function LeavePage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={CalendarX}
      title={messages.nav.leave}
      description={messages.modules.leave.description}
      capabilities={messages.modules.leave.capabilities}
    />
  );
}

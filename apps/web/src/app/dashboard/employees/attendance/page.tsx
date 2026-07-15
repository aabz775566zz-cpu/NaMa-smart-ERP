'use client';

import { CalendarCheck } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function AttendancePage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={CalendarCheck}
      title={messages.nav.attendance}
      description={messages.modules.attendance.description}
      capabilities={messages.modules.attendance.capabilities}
    />
  );
}

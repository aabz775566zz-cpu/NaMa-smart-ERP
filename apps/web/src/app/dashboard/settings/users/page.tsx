'use client';

import { Users } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SettingsUsersPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Users}
      title={messages.nav.users}
      description={messages.modules.users.description}
      capabilities={messages.modules.users.capabilities}
    />
  );
}

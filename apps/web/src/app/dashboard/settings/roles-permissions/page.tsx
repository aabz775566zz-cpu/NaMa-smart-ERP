'use client';

import { ShieldCheck } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function RolesPermissionsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={ShieldCheck}
      title={messages.nav.rolesPermissions}
      description={messages.modules.rolesPermissions.description}
      capabilities={messages.modules.rolesPermissions.capabilities}
    />
  );
}

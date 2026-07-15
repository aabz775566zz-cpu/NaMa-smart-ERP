'use client';

import { DatabaseBackup } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function BackupRestorePage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={DatabaseBackup}
      title={messages.nav.backupRestore}
      description={messages.modules.backupRestore.description}
      capabilities={messages.modules.backupRestore.capabilities}
    />
  );
}

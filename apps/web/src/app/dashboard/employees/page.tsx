'use client';

import { Briefcase } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function EmployeesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Briefcase}
      title={messages.nav.employees}
      description={messages.modules.employees.description}
      capabilities={messages.modules.employees.capabilities}
    />
  );
}

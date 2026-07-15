'use client';

import { Ruler } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function UnitsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Ruler}
      title={messages.nav.units}
      description={messages.modules.units.description}
      capabilities={messages.modules.units.capabilities}
    />
  );
}

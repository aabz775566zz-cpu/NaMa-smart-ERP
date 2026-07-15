'use client';

import { Undo2 } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function SalesReturnsPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Undo2}
      title={messages.nav.returns}
      description={messages.modules.returns.description}
      capabilities={messages.modules.returns.capabilities}
    />
  );
}

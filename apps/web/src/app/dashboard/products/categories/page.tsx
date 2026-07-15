'use client';

import { Tags } from 'lucide-react';

import { UnderDevelopmentPage } from '@/components/under-development-page';
import { useLocale } from '@/lib/locale/locale-context';

export default function CategoriesPage() {
  const { messages } = useLocale();
  return (
    <UnderDevelopmentPage
      icon={Tags}
      title={messages.nav.categories}
      description={messages.modules.categories.description}
      capabilities={messages.modules.categories.capabilities}
    />
  );
}

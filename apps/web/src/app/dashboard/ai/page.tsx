'use client';

import { Sparkles } from 'lucide-react';

import { ModulePlaceholderPage } from '@/features/dashboard/module-placeholder';

export default function AiPage() {
  return (
    <ModulePlaceholderPage
      icon={Sparkles}
      title="AI Assistant"
      description="The full AI chat experience is coming in a future step."
    />
  );
}

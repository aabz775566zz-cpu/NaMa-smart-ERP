'use client';

import { EmptyState, Skeleton } from '@erp-smart/ui';
import { useState } from 'react';

import { CompanyEditDialog } from '@/features/settings/components/company-edit-dialog';
import { CompanyInfoCard } from '@/features/settings/components/company-info-card';
import { useCompany } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';

// No permission gate — GET /companies/me has no permission requirement, so
// every authenticated user may view their company (matches the main
// settings page). Editing is gated inside CompanyEditDialog / the backend.
export default function SettingsCompanyPage() {
  const { messages } = useLocale();
  const t = messages.settings;
  const companyQuery = useCompany();
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{messages.nav.company}</h1>
        <p className="text-sm text-muted-foreground">{messages.modules.company.description}</p>
      </div>

      {companyQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : companyQuery.isError || !companyQuery.data ? (
        <EmptyState
          title={t.couldNotLoadCompany}
          description={companyQuery.error instanceof Error ? companyQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : (
        <>
          <CompanyInfoCard company={companyQuery.data} onEdit={() => setEditing(true)} />
          <CompanyEditDialog company={companyQuery.data} open={editing} onOpenChange={setEditing} />
        </>
      )}
    </div>
  );
}

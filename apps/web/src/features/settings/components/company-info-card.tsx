'use client';

import type { Company } from '@erp-smart/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { Pencil } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

export function CompanyInfoCard({ company, onEdit }: { company: Company; onEdit: () => void }) {
  const canEdit = useHasPermission('SETTINGS:UPDATE');
  const { messages } = useLocale();
  const t = messages.settings;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t.companyInfoTitle}</CardTitle>
        {canEdit ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            {messages.common.edit}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">{t.companyName}</p>
          <p className="text-sm font-medium text-foreground">{company.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.businessType}</p>
          <p className="text-sm font-medium text-foreground">{company.businessType ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.country}</p>
          <p className="text-sm font-medium text-foreground">{company.country ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.currency}</p>
          <p className="text-sm font-medium text-foreground">{company.currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.plan}</p>
          <p className="text-sm font-medium text-foreground">{company.subscriptionPlan}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t.subscriptionStatus}</p>
          <p className="text-sm font-medium text-foreground">{company.subscriptionStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}

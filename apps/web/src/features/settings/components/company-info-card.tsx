'use client';

import type { Company } from '@erp-smart/types';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { Pencil } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

export function CompanyInfoCard({ company, onEdit }: { company: Company; onEdit: () => void }) {
  const canEdit = useHasPermission('SETTINGS:UPDATE');

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Company information</CardTitle>
        {canEdit ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Company name</p>
          <p className="text-sm font-medium text-foreground">{company.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Business type</p>
          <p className="text-sm font-medium text-foreground">{company.businessType ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Country</p>
          <p className="text-sm font-medium text-foreground">{company.country ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="text-sm font-medium text-foreground">{company.currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="text-sm font-medium text-foreground">{company.subscriptionPlan}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Subscription status</p>
          <p className="text-sm font-medium text-foreground">{company.subscriptionStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}

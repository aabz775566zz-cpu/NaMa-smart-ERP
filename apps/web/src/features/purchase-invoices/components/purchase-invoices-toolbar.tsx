'use client';

import type { PurchaseInvoiceStatus } from '@erp-smart/types';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';
import { Download, Plus } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

const ALL_STATUSES = '__all__';
const STATUS_OPTIONS: PurchaseInvoiceStatus[] = ['DRAFT', 'RECEIVED', 'CANCELLED'];

// Filters by GET /purchase-invoices's real ?status= query param — mirrors
// features/sales/components/sales-toolbar.tsx exactly (a purchase invoice
// has no free-text field worth a search box at list level either).
export function PurchaseInvoicesToolbar({
  status,
  onStatusChange,
  onAdd,
  onExport,
}: {
  status: PurchaseInvoiceStatus | undefined;
  onStatusChange: (status: PurchaseInvoiceStatus | undefined) => void;
  onAdd: () => void;
  onExport?: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.purchaseInvoices;
  const STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
    DRAFT: t.statusDraft,
    RECEIVED: t.statusReceived,
    CANCELLED: t.statusCancelled,
  };
  const canCreate = useHasPermission('PURCHASES:CREATE');
  const canExport = useHasPermission('PURCHASES:EXPORT');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={status ?? ALL_STATUSES}
        onValueChange={(value) => onStatusChange(value === ALL_STATUSES ? undefined : (value as PurchaseInvoiceStatus))}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>{t.allStatuses}</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {STATUS_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        {canExport && onExport ? (
          <Button variant="outline" onClick={onExport}>
            <Download />
            {messages.common.exportCsv}
          </Button>
        ) : null}
        {canCreate ? (
          <Button onClick={onAdd}>
            <Plus />
            {t.newPurchaseInvoiceButton}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

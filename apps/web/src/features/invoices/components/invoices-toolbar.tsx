'use client';

import type { InvoiceStatus } from '@erp-smart/types';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';
import { Download } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

const ALL_STATUSES = '__all__';
const STATUS_OPTIONS: InvoiceStatus[] = ['ISSUED', 'PAID'];

// No "create" action here — invoices are only auto-generated when a Sale
// completes, never created directly by the client (no POST /invoices).
export function InvoicesToolbar({
  status,
  onStatusChange,
  onExport,
}: {
  status: InvoiceStatus | undefined;
  onStatusChange: (status: InvoiceStatus | undefined) => void;
  onExport?: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.invoices;
  const STATUS_LABELS: Record<InvoiceStatus, string> = {
    ISSUED: messages.invoice.paymentStatusIssued,
    PAID: messages.invoice.paymentStatusPaid,
  };
  const canExport = useHasPermission('INVOICES:EXPORT');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={status ?? ALL_STATUSES}
        onValueChange={(value) => onStatusChange(value === ALL_STATUSES ? undefined : (value as InvoiceStatus))}
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
      {canExport && onExport ? (
        <Button variant="outline" onClick={onExport}>
          <Download />
          {messages.common.exportCsv}
        </Button>
      ) : null}
    </div>
  );
}

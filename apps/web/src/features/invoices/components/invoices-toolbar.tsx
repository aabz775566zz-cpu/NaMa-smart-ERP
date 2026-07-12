'use client';

import type { InvoiceStatus } from '@erp-smart/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';

const ALL_STATUSES = '__all__';
const STATUS_OPTIONS: InvoiceStatus[] = ['ISSUED', 'PAID'];

// No "create" action here — invoices are only auto-generated when a Sale
// completes, never created directly by the client (no POST /invoices).
export function InvoicesToolbar({
  status,
  onStatusChange,
}: {
  status: InvoiceStatus | undefined;
  onStatusChange: (status: InvoiceStatus | undefined) => void;
}) {
  return (
    <Select
      value={status ?? ALL_STATUSES}
      onValueChange={(value) => onStatusChange(value === ALL_STATUSES ? undefined : (value as InvoiceStatus))}
    >
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

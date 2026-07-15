'use client';

import type { InvoiceStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

const STATUS_VARIANT: Record<InvoiceStatus, 'info' | 'success'> = {
  ISSUED: 'info',
  PAID: 'success',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { messages } = useLocale();
  const labels: Record<InvoiceStatus, string> = {
    ISSUED: messages.invoice.paymentStatusIssued,
    PAID: messages.invoice.paymentStatusPaid,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

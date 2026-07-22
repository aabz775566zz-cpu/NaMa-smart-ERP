'use client';

import type { PurchaseInvoiceStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

const STATUS_VARIANT: Record<PurchaseInvoiceStatus, 'secondary' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  RECEIVED: 'success',
  CANCELLED: 'destructive',
};

export function PurchaseInvoiceStatusBadge({ status }: { status: PurchaseInvoiceStatus }) {
  const { messages } = useLocale();
  const labels: Record<PurchaseInvoiceStatus, string> = {
    DRAFT: messages.purchaseInvoices.statusDraft,
    RECEIVED: messages.purchaseInvoices.statusReceived,
    CANCELLED: messages.purchaseInvoices.statusCancelled,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

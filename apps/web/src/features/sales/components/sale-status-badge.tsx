'use client';

import type { SaleStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

const STATUS_VARIANT: Record<SaleStatus, 'secondary' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const { messages } = useLocale();
  const labels: Record<SaleStatus, string> = {
    DRAFT: messages.sales.statusDraft,
    COMPLETED: messages.sales.statusCompleted,
    CANCELLED: messages.sales.statusCancelled,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

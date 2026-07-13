import type { SaleAllocation } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

const STATUS_VARIANT: Record<SaleAllocation['status'], 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  UNPAID: 'destructive',
};

export function SaleAllocationStatusBadge({ status }: { status: SaleAllocation['status'] }) {
  const { messages } = useLocale();
  const labels: Record<SaleAllocation['status'], string> = {
    PAID: messages.customers.statusPaid,
    PARTIAL: messages.customers.statusPartial,
    UNPAID: messages.customers.statusUnpaid,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

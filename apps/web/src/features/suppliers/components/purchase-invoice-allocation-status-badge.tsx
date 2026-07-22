import type { PurchaseInvoiceAllocation } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

// Mirrors features/customers/components/sale-allocation-status-badge.tsx
// exactly, for the payable side.
const STATUS_VARIANT: Record<PurchaseInvoiceAllocation['status'], 'success' | 'warning' | 'destructive'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  UNPAID: 'destructive',
};

export function PurchaseInvoiceAllocationStatusBadge({ status }: { status: PurchaseInvoiceAllocation['status'] }) {
  const { messages } = useLocale();
  const labels: Record<PurchaseInvoiceAllocation['status'], string> = {
    PAID: messages.suppliers.statusPaid,
    PARTIAL: messages.suppliers.statusPartial,
    UNPAID: messages.suppliers.statusUnpaid,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

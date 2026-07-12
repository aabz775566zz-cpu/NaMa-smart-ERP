import type { InvoiceStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

const STATUS_VARIANT: Record<InvoiceStatus, 'info' | 'success'> = {
  ISSUED: 'info',
  PAID: 'success',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

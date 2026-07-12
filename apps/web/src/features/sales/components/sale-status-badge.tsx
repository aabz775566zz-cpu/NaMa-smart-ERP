import type { SaleStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

const STATUS_VARIANT: Record<SaleStatus, 'secondary' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

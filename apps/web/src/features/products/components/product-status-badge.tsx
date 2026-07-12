import type { ProductStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

const STATUS_VARIANT: Record<ProductStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  DISCONTINUED: 'destructive',
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

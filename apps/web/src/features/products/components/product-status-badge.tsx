'use client';

import type { ProductStatus } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

const STATUS_VARIANT: Record<ProductStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  DISCONTINUED: 'destructive',
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { messages } = useLocale();
  const labels: Record<ProductStatus, string> = {
    ACTIVE: messages.products.statusActive,
    INACTIVE: messages.products.statusInactive,
    DISCONTINUED: messages.products.statusDiscontinued,
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

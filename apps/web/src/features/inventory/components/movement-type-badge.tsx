'use client';

import type { InventoryMovementType } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

// PURCHASE/RETURN are always stock-in, SALE is always stock-out (system
// generated when a Sale completes), ADJUSTMENT can go either direction —
// tones reflect that rather than a strict in/out mapping.
const TYPE_VARIANT: Record<InventoryMovementType, 'success' | 'info' | 'secondary' | 'warning'> = {
  PURCHASE: 'success',
  RETURN: 'info',
  SALE: 'secondary',
  ADJUSTMENT: 'warning',
};

export function MovementTypeBadge({ type }: { type: InventoryMovementType }) {
  const { messages } = useLocale();
  const labels: Record<InventoryMovementType, string> = {
    PURCHASE: messages.inventory.typePurchase,
    RETURN: messages.inventory.typeReturn,
    SALE: messages.inventory.typeSale,
    ADJUSTMENT: messages.inventory.typeAdjustment,
  };
  return <Badge variant={TYPE_VARIANT[type]}>{labels[type]}</Badge>;
}

import type { InventoryMovementType } from '@erp-smart/types';
import { Badge } from '@erp-smart/ui';

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
  return <Badge variant={TYPE_VARIANT[type]}>{type}</Badge>;
}

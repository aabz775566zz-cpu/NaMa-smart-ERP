import type { InventoryMovement, InventoryMovementType, Product } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// Only PURCHASE/ADJUSTMENT/RETURN are client-creatable — SALE movements are
// written internally when a Sale completes (SalesService.complete()) and
// are never accepted from this endpoint. Mirrors CreateInventoryAdjustmentDto.
export type AdjustableMovementType = Extract<InventoryMovementType, 'PURCHASE' | 'ADJUSTMENT' | 'RETURN'>;

export interface CreateAdjustmentInput {
  productId: string;
  type: AdjustableMovementType;
  quantityChange: number;
  note?: string;
}

// There is no PATCH/DELETE for movements — the ledger is immutable;
// corrections are posted as a new movement, never an edit.
export function listMovements(productId?: string) {
  const query = productId ? `?productId=${productId}` : '';
  return apiClient.get<InventoryMovement[]>(`/inventory/movements${query}`);
}

export function listLowStock() {
  return apiClient.get<Product[]>('/inventory/low-stock');
}

export function createAdjustment(input: CreateAdjustmentInput) {
  return apiClient.post<InventoryMovement>('/inventory/adjustments', input);
}

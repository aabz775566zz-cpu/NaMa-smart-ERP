/** Matches GET /inventory/movements — an immutable ledger entry. There is no
 * update/delete endpoint for movements; corrections are posted as a new
 * movement, never an edit of an existing one. */
export type InventoryMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  type: InventoryMovementType;
  // Signed: positive = stock in, negative = stock out.
  quantityChange: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdByUserId: string;
  createdAt: string;
}

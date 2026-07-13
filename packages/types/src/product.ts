export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

export interface Category {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  imageUrl: string | null;
  // Serialized as strings over JSON (Prisma Decimal) — treat as display-only
  // on the client; all money math happens server-side.
  purchasePrice: string;
  sellingPrice: string;
  quantityOnHand: number;
  // Free-text unit label (e.g. "kg", "box", "pcs") — not a Unit model with
  // conversions, just a display suffix. Defaults to "pcs" server-side.
  unit: string;
  lowStockThreshold: number | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

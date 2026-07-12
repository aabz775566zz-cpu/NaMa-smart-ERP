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
  lowStockThreshold: number | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

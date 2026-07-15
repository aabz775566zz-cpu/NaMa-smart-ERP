'use client';

import type { Product, ProductStatus } from '@erp-smart/types';
import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { Package, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DeleteProductDialog } from '@/features/products/components/delete-product-dialog';
import { ProductFormDialog } from '@/features/products/components/product-form-dialog';
import { ProductImportDialog } from '@/features/products/components/product-import-dialog';
import { ProductsTable } from '@/features/products/components/products-table';
import { ProductsToolbar } from '@/features/products/components/products-toolbar';
import { useCategories, useProducts } from '@/features/products/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function ProductsPage() {
  const { messages } = useLocale();
  const t = messages.products;
  const STATUS_LABELS: Record<ProductStatus, string> = {
    ACTIVE: t.statusActive,
    INACTIVE: t.statusInactive,
    DISCONTINUED: t.statusDiscontinued,
  };
  const permissions = usePermissions();
  const canRead = permissions.includes('PRODUCTS:READ');

  const productsQuery = useProducts({ enabled: canRead });
  const categoriesQuery = useCategories({ enabled: canRead });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoriesQuery.data?.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categoriesQuery.data]);

  // Backend GET /products has no query params (no server-side search/filter)
  // — it always returns the full company product list, so filtering here is
  // a client-side pass over already-fetched data, not a new API contract.
  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) => product.name.toLowerCase().includes(query) || (product.sku?.toLowerCase().includes(query) ?? false),
    );
  }, [productsQuery.data, search]);

  if (!canRead) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<ShieldAlert />}
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      </div>
    );
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleExport() {
    exportToCsv('products.csv', filteredProducts, [
      { header: messages.common.name, value: (p) => p.name },
      { header: t.sku, value: (p) => p.sku ?? '' },
      { header: t.category, value: (p) => (p.categoryId ? (categoryNameById.get(p.categoryId) ?? '') : '') },
      { header: t.purchasePrice, value: (p) => p.purchasePrice },
      { header: t.sellingPrice, value: (p) => p.sellingPrice },
      { header: t.quantityOnHand, value: (p) => p.quantityOnHand },
      { header: messages.common.status, value: (p) => STATUS_LABELS[p.status] },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <ProductsToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={openCreateDialog}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
      />

      {productsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : productsQuery.isError ? (
        <EmptyState
          title={t.couldNotLoad}
          description={productsQuery.error instanceof Error ? productsQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={productsQuery.data?.length ? t.noMatch : t.addFirst}
          description={
            productsQuery.data?.length
              ? t.tryDifferentSearch
              : t.emptyDescription
          }
          action={
            !productsQuery.data?.length ? (
              <Button onClick={openCreateDialog}>{t.addProduct}</Button>
            ) : undefined
          }
        />
      ) : (
        <ProductsTable
          products={filteredProducts}
          categoryNameById={categoryNameById}
          onEdit={openEditDialog}
          onDelete={setDeletingProduct}
        />
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />
      <ProductImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeleteProductDialog
        product={deletingProduct}
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      />
    </div>
  );
}

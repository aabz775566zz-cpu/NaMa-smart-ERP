'use client';

import type { Product } from '@erp-smart/types';
import { EmptyState, Skeleton } from '@erp-smart/ui';
import { Package, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DeleteProductDialog } from '@/features/products/components/delete-product-dialog';
import { ProductFormDialog } from '@/features/products/components/product-form-dialog';
import { ProductsTable } from '@/features/products/components/products-table';
import { ProductsToolbar } from '@/features/products/components/products-toolbar';
import { useCategories, useProducts } from '@/features/products/hooks';
import { usePermissions } from '@/lib/store';

export default function ProductsPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('PRODUCTS:READ');

  const productsQuery = useProducts({ enabled: canRead });
  const categoriesQuery = useCategories({ enabled: canRead });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
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
          title="You don't have access to this section"
          description="Ask a company owner or manager if you need this permission."
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
      </div>

      <ProductsToolbar search={search} onSearchChange={setSearch} onAdd={openCreateDialog} />

      {productsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : productsQuery.isError ? (
        <EmptyState
          title="Couldn't load products"
          description={productsQuery.error instanceof Error ? productsQuery.error.message : 'Please try again.'}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={productsQuery.data?.length ? 'No products match your search' : 'No products yet'}
          description={
            productsQuery.data?.length
              ? 'Try a different search term.'
              : 'Add your first product to start building your catalog.'
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
      <DeleteProductDialog
        product={deletingProduct}
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      />
    </div>
  );
}

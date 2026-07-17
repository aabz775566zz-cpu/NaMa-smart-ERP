'use client';

import { Badge, Button, Card, EmptyState, Skeleton } from '@erp-smart/ui';
import { Package, Plus, ShieldAlert, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CategoryQuickCreateDialog } from '@/features/products/components/category-quick-create-dialog';
import { useCategories, useProducts } from '@/features/products/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function CategoriesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('PRODUCTS:READ');
  const canCreate = permissions.includes('PRODUCTS:CREATE');
  const { messages } = useLocale();
  const t = messages.products;

  const [createOpen, setCreateOpen] = useState(false);

  const categoriesQuery = useCategories({ enabled: canRead });
  const productsQuery = useProducts({ enabled: canRead });

  // Product count per category, derived from the products list already loaded —
  // no dedicated endpoint needed, and it stays correct as products change.
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    productsQuery.data?.forEach((product) => {
      if (product.categoryId) map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + 1);
    });
    return map;
  }, [productsQuery.data]);

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

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{messages.nav.categories}</h1>
          <p className="text-sm text-muted-foreground">{messages.modules.categories.description}</p>
        </div>
        {canCreate ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t.newCategory}
          </Button>
        ) : null}
      </div>

      {categoriesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : categoriesQuery.isError ? (
        <EmptyState
          title={messages.common.error}
          description={
            categoriesQuery.error instanceof Error ? categoriesQuery.error.message : messages.common.pleaseTryAgain
          }
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tags />}
          title={t.noCategoriesTitle}
          description={t.noCategoriesDescription}
          action={
            canCreate ? <Button onClick={() => setCreateOpen(true)}>{t.newCategory}</Button> : undefined
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Tags className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-foreground">{category.name}</span>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1.5 tabular-nums">
                  <Package className="h-3 w-3" />
                  {countByCategory.get(category.id) ?? 0}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CategoryQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setCreateOpen(false)}
      />
    </div>
  );
}

'use client';

import type { Supplier } from '@erp-smart/types';
import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { ShieldAlert, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DeleteSupplierDialog } from '@/features/suppliers/components/delete-supplier-dialog';
import { SupplierFormDialog } from '@/features/suppliers/components/supplier-form-dialog';
import { SuppliersTable } from '@/features/suppliers/components/suppliers-table';
import { SuppliersToolbar } from '@/features/suppliers/components/suppliers-toolbar';
import { useSuppliers } from '@/features/suppliers/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function SuppliersPage() {
  const { messages } = useLocale();
  const t = messages.suppliers;
  const permissions = usePermissions();
  const canRead = permissions.includes('SUPPLIERS:READ');

  const suppliersQuery = useSuppliers({ enabled: canRead });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // GET /suppliers has no query params — filtering is a client-side pass over
  // the full company supplier list, same as the customers page.
  const filteredSuppliers = useMemo(() => {
    const suppliers = suppliersQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        (supplier.phone?.toLowerCase().includes(query) ?? false) ||
        (supplier.email?.toLowerCase().includes(query) ?? false),
    );
  }, [suppliersQuery.data, search]);

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
    setEditingSupplier(null);
    setFormOpen(true);
  }

  function openEditDialog(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormOpen(true);
  }

  function handleExport() {
    exportToCsv('suppliers.csv', filteredSuppliers, [
      { header: messages.common.name, value: (s) => s.name },
      { header: messages.common.phone, value: (s) => s.phone ?? '' },
      { header: messages.common.email, value: (s) => s.email ?? '' },
      { header: messages.common.address, value: (s) => s.address ?? '' },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <SuppliersToolbar search={search} onSearchChange={setSearch} onAdd={openCreateDialog} onExport={handleExport} />

      {suppliersQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : suppliersQuery.isError ? (
        <EmptyState
          title={t.couldNotLoad}
          description={suppliersQuery.error instanceof Error ? suppliersQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={<Truck />}
          title={suppliersQuery.data?.length ? t.noMatch : t.addFirst}
          description={suppliersQuery.data?.length ? t.tryDifferentSearch : t.emptyDescription}
          action={!suppliersQuery.data?.length ? <Button onClick={openCreateDialog}>{t.addSupplier}</Button> : undefined}
        />
      ) : (
        <SuppliersTable suppliers={filteredSuppliers} onEdit={openEditDialog} onDelete={setDeletingSupplier} />
      )}

      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editingSupplier} />
      <DeleteSupplierDialog
        supplier={deletingSupplier}
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
      />
    </div>
  );
}

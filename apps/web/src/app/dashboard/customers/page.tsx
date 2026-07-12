'use client';

import type { Customer } from '@erp-smart/types';
import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { ShieldAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog';
import { CustomersTable } from '@/features/customers/components/customers-table';
import { CustomersToolbar } from '@/features/customers/components/customers-toolbar';
import { DeleteCustomerDialog } from '@/features/customers/components/delete-customer-dialog';
import { useCustomers } from '@/features/customers/hooks';
import { usePermissions } from '@/lib/store';

export default function CustomersPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('CUSTOMERS:READ');

  const customersQuery = useCustomers({ enabled: canRead });

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Backend GET /customers has no query params (no server-side search) — it
  // always returns the full company customer list, so filtering here is a
  // client-side pass over already-fetched data, not a new API contract.
  const filteredCustomers = useMemo(() => {
    const customers = customersQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        (customer.phone?.toLowerCase().includes(query) ?? false) ||
        (customer.email?.toLowerCase().includes(query) ?? false),
    );
  }, [customersQuery.data, search]);

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
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">Manage your customer records.</p>
      </div>

      <CustomersToolbar search={search} onSearchChange={setSearch} onAdd={openCreateDialog} />

      {customersQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : customersQuery.isError ? (
        <EmptyState
          title="Couldn't load customers"
          description={customersQuery.error instanceof Error ? customersQuery.error.message : 'Please try again.'}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={customersQuery.data?.length ? 'No customers match your search' : 'Add your first customer'}
          description={
            customersQuery.data?.length
              ? 'Try a different search term.'
              : 'Keep track of who you sell to — add a customer to get started.'
          }
          action={
            !customersQuery.data?.length ? (
              <Button onClick={openCreateDialog}>Add customer</Button>
            ) : undefined
          }
        />
      ) : (
        <CustomersTable customers={filteredCustomers} onEdit={openEditDialog} onDelete={setDeletingCustomer} />
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editingCustomer} />
      <DeleteCustomerDialog
        customer={deletingCustomer}
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      />
    </div>
  );
}

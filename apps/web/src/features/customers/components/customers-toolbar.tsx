'use client';

import { Button, Input } from '@erp-smart/ui';
import { Plus, Search } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

export function CustomersToolbar({
  search,
  onSearchChange,
  onAdd,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}) {
  const canCreate = useHasPermission('CUSTOMERS:CREATE');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, phone, or email…"
          className="ps-9"
        />
      </div>
      {canCreate ? (
        <Button onClick={onAdd}>
          <Plus />
          Add customer
        </Button>
      ) : null}
    </div>
  );
}

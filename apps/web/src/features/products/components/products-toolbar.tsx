'use client';

import { Button, Input } from '@erp-smart/ui';
import { Plus, Search } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

export function ProductsToolbar({
  search,
  onSearchChange,
  onAdd,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}) {
  const canCreate = useHasPermission('PRODUCTS:CREATE');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or SKU…"
          className="ps-9"
        />
      </div>
      {canCreate ? (
        <Button onClick={onAdd}>
          <Plus />
          Add product
        </Button>
      ) : null}
    </div>
  );
}

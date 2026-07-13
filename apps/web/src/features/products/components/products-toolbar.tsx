'use client';

import { Button, Input } from '@erp-smart/ui';
import { Download, Plus, Search, Upload } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

export function ProductsToolbar({
  search,
  onSearchChange,
  onAdd,
  onImport,
  onExport,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onImport?: () => void;
  onExport?: () => void;
}) {
  const canCreate = useHasPermission('PRODUCTS:CREATE');
  const canExport = useHasPermission('PRODUCTS:EXPORT');

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
      <div className="flex gap-2">
        {canExport && onExport ? (
          <Button variant="outline" onClick={onExport}>
            <Download />
            Export CSV
          </Button>
        ) : null}
        {canCreate && onImport ? (
          <Button variant="outline" onClick={onImport}>
            <Upload />
            Import CSV
          </Button>
        ) : null}
        {canCreate ? (
          <Button onClick={onAdd}>
            <Plus />
            Add product
          </Button>
        ) : null}
      </div>
    </div>
  );
}

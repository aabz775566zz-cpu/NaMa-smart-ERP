'use client';

import { Button, Input } from '@erp-smart/ui';
import { Download, Plus, Search } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

export function SuppliersToolbar({
  search,
  onSearchChange,
  onAdd,
  onExport,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onExport?: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.suppliers;
  const canCreate = useHasPermission('SUPPLIERS:CREATE');
  const canExport = useHasPermission('SUPPLIERS:EXPORT');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="ps-9"
        />
      </div>
      <div className="flex gap-2">
        {canExport && onExport ? (
          <Button variant="outline" onClick={onExport}>
            <Download />
            {messages.common.exportCsv}
          </Button>
        ) : null}
        {canCreate ? (
          <Button onClick={onAdd}>
            <Plus />
            {t.addSupplier}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

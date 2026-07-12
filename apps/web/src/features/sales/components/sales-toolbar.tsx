'use client';

import type { SaleStatus } from '@erp-smart/types';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';
import { Plus } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

const ALL_STATUSES = '__all__';
const STATUS_OPTIONS: SaleStatus[] = ['DRAFT', 'COMPLETED', 'CANCELLED'];

// Filters by GET /sales's real ?status= query param — there is no free-text
// field on a Sale worth searching by at list level, so unlike
// Products/Customers this toolbar's primary control is a status filter, not
// a search box.
export function SalesToolbar({
  status,
  onStatusChange,
  onAdd,
}: {
  status: SaleStatus | undefined;
  onStatusChange: (status: SaleStatus | undefined) => void;
  onAdd: () => void;
}) {
  const canCreate = useHasPermission('SALES:CREATE');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={status ?? ALL_STATUSES}
        onValueChange={(value) => onStatusChange(value === ALL_STATUSES ? undefined : (value as SaleStatus))}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canCreate ? (
        <Button onClick={onAdd}>
          <Plus />
          New sale
        </Button>
      ) : null}
    </div>
  );
}

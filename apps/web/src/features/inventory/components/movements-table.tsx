'use client';

import type { InventoryMovement } from '@erp-smart/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';

import { MovementTypeBadge } from './movement-type-badge';

export function MovementsTable({
  movements,
  productNameById,
}: {
  movements: InventoryMovement[];
  productNameById: Map<string, string>;
}) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const isStockIn = movement.quantityChange > 0;
            return (
              <TableRow key={movement.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(movement.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {productNameById.get(movement.productId) ?? '—'}
                </TableCell>
                <TableCell>
                  <MovementTypeBadge type={movement.type} />
                </TableCell>
                <TableCell className={isStockIn ? 'text-success' : 'text-destructive'}>
                  {isStockIn ? '+' : ''}
                  {movement.quantityChange}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {movement.referenceType ? `${movement.referenceType} · ${movement.referenceId ?? ''}` : '—'}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{movement.note ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import type { Product } from '@erp-smart/types';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp-smart/ui';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

import { ProductStatusBadge } from './product-status-badge';

export function ProductsTable({
  products,
  categoryNameById,
  onEdit,
  onDelete,
}: {
  products: Product[];
  categoryNameById: Map<string, string>;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const { messages } = useLocale();
  const t = messages.products;
  const canUpdate = useHasPermission('PRODUCTS:UPDATE');
  const canDelete = useHasPermission('PRODUCTS:DELETE');
  const canAct = canUpdate || canDelete;
  const formatMoney = useFormatMoney();

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{messages.common.name}</TableHead>
            <TableHead>{t.sku}</TableHead>
            <TableHead>{t.category}</TableHead>
            <TableHead>{t.price}</TableHead>
            <TableHead>{t.stock}</TableHead>
            <TableHead>{messages.common.status}</TableHead>
            {canAct ? <TableHead className="text-end">{messages.common.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock =
              product.lowStockThreshold !== null && product.quantityOnHand <= product.lowStockThreshold;
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.sku ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.categoryId ? (categoryNameById.get(product.categoryId) ?? '—') : '—'}
                </TableCell>
                <TableCell className="tabular-nums">{formatMoney(product.sellingPrice)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    {product.quantityOnHand} {product.unit}
                    {isLowStock ? <Badge variant="warning">{t.lowStock}</Badge> : null}
                  </span>
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                {canAct ? (
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{messages.common.openActions}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate ? (
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Pencil />
                            {messages.common.edit}
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            onClick={() => onDelete(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 />
                            {messages.common.delete}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

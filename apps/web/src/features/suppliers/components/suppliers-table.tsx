'use client';

import type { Supplier } from '@erp-smart/types';
import {
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
import { MoreHorizontal, Pencil, Trash2, Wallet } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

export function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
}: {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}) {
  const { messages } = useLocale();
  const t = messages.suppliers;
  const canUpdate = useHasPermission('SUPPLIERS:UPDATE');
  const canDelete = useHasPermission('SUPPLIERS:DELETE');
  const canAct = canUpdate || canDelete;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{messages.common.name}</TableHead>
            <TableHead>{messages.common.phone}</TableHead>
            <TableHead>{messages.common.email}</TableHead>
            <TableHead>{messages.common.address}</TableHead>
            <TableHead>{t.created}</TableHead>
            {canAct ? <TableHead className="text-end">{messages.common.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium text-foreground">
                <Link href={`/dashboard/purchasing/suppliers/${supplier.id}`} className="hover:underline">
                  {supplier.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{supplier.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{supplier.email ?? '—'}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{supplier.address ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(supplier.createdAt).toLocaleDateString()}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/purchasing/suppliers/${supplier.id}`}>
                          <Wallet />
                          {t.ledgerAndPayments}
                        </Link>
                      </DropdownMenuItem>
                      {canUpdate ? (
                        <DropdownMenuItem onClick={() => onEdit(supplier)}>
                          <Pencil />
                          {messages.common.edit}
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          onClick={() => onDelete(supplier)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

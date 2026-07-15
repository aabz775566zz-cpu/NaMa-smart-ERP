'use client';

import type { Customer } from '@erp-smart/types';
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

export function CustomersTable({
  customers,
  onEdit,
  onDelete,
}: {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}) {
  const { messages } = useLocale();
  const t = messages.customers;
  const canUpdate = useHasPermission('CUSTOMERS:UPDATE');
  const canDelete = useHasPermission('CUSTOMERS:DELETE');
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
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium text-foreground">
                <Link href={`/dashboard/customers/${customer.id}`} className="hover:underline">
                  {customer.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{customer.phone ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{customer.email ?? '—'}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{customer.address ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(customer.createdAt).toLocaleDateString()}
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
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <Wallet />
                          {t.debtAndPayments}
                        </Link>
                      </DropdownMenuItem>
                      {canUpdate ? (
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Pencil />
                          {messages.common.edit}
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          onClick={() => onDelete(customer)}
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

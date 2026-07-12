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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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
  const canUpdate = useHasPermission('CUSTOMERS:UPDATE');
  const canDelete = useHasPermission('CUSTOMERS:DELETE');
  const canAct = canUpdate || canDelete;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Created</TableHead>
            {canAct ? <TableHead className="text-end">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
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
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate ? (
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          onClick={() => onDelete(customer)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 />
                          Delete
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

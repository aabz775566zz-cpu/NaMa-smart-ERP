'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@erp-smart/ui';

import { useHasPermission } from '@/lib/store';

import { useInvoice, useMarkInvoicePaid } from '../hooks';
import { InvoiceStatusBadge } from './invoice-status-badge';

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: invoice, isLoading } = useInvoice(open ? invoiceId : null);
  const canUpdate = useHasPermission('INVOICES:UPDATE');
  const markPaidMutation = useMarkInvoicePaid();

  function handleMarkPaid() {
    if (!invoice) return;
    markPaidMutation.mutate(invoice.id, {
      onSuccess: () => toast({ title: 'Invoice marked as paid' }),
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to mark invoice as paid', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{invoice ? invoice.invoiceNumber : 'Invoice'}</DialogTitle>
          <DialogDescription>
            {invoice ? `Issued ${new Date(invoice.issueDate).toLocaleDateString()}` : 'Loading invoice details…'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !invoice ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {invoice.sale.customer ? invoice.sale.customer.name : 'Walk-in customer'}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unitPrice}</TableCell>
                      <TableCell>{item.lineTotal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{invoice.sale.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{invoice.sale.discountTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{invoice.sale.taxTotal}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>Total</span>
                <span>{invoice.totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        {invoice && canUpdate && invoice.status === 'ISSUED' ? (
          <DialogFooter>
            <Button onClick={handleMarkPaid} disabled={markPaidMutation.isPending}>
              {markPaidMutation.isPending ? 'Marking…' : 'Mark as paid'}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

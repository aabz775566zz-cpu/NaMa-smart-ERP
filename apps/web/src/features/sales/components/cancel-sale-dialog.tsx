'use client';

import type { Sale } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@erp-smart/ui';

import { useFormatMoney } from '@/lib/format/money';

import { useCancelSale } from '../hooks';

// There is no DELETE /sales/:id — a sale can only be cancelled (DRAFT ->
// CANCELLED via POST /sales/:id/cancel), never removed. Named for what the
// backend actually does rather than reusing the Products/Customers "delete"
// naming.
export function CancelSaleDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cancelMutation = useCancelSale();
  const formatMoney = useFormatMoney();

  function handleConfirm() {
    if (!sale) return;
    cancelMutation.mutate(sale.id, {
      onSuccess: () => {
        toast({ title: 'Sale cancelled' });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to cancel sale', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel sale</DialogTitle>
          <DialogDescription>
            {sale
              ? `This will cancel this draft sale (total ${formatMoney(sale.totalAmount)}). This action cannot be undone.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Keep sale
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import type { Customer } from '@erp-smart/types';
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

import { useDeleteCustomer } from '../hooks';

export function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteCustomer();

  function handleConfirm() {
    if (!customer) return;
    deleteMutation.mutate(customer.id, {
      onSuccess: () => {
        toast({ title: 'Customer deleted' });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to delete customer', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
          <DialogDescription>
            {customer ? `This will permanently delete "${customer.name}". This action cannot be undone.` : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

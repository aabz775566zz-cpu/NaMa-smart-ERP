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

import { useLocale } from '@/lib/locale/locale-context';

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
  const { messages } = useLocale();
  const t = messages.customers;
  const deleteMutation = useDeleteCustomer();

  function handleConfirm() {
    if (!customer) return;
    deleteMutation.mutate(customer.id, {
      onSuccess: () => {
        toast({ title: t.customerDeleted });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: t.deleteFailed, description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.deleteCustomerTitle}</DialogTitle>
          <DialogDescription>
            {customer ? t.deleteCustomerDescription.replace('{{name}}', customer.name) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {messages.common.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? messages.common.deleting : messages.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

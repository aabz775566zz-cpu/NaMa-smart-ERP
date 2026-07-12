'use client';

import type { Product } from '@erp-smart/types';
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

import { useDeleteProduct } from '../hooks';

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteProduct();

  function handleConfirm() {
    if (!product) return;
    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        toast({ title: 'Product deleted' });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to delete product', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete product</DialogTitle>
          <DialogDescription>
            {product ? `This will permanently delete "${product.name}". This action cannot be undone.` : null}
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

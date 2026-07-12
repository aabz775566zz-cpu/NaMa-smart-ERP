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
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import type { AdjustableMovementType, CreateAdjustmentInput } from '../api';
import { useCreateAdjustment } from '../hooks';

const ADJUSTABLE_TYPES: AdjustableMovementType[] = ['PURCHASE', 'ADJUSTMENT', 'RETURN'];

type FormErrors = Partial<Record<'productId' | 'quantityChange', string>>;

// Only PURCHASE/ADJUSTMENT/RETURN are creatable here — matches
// CreateInventoryAdjustmentDto exactly. PURCHASE/RETURN must be positive
// (backend rejects a negative quantityChange for those types with 400);
// ADJUSTMENT can go either direction (e.g. a negative correction for
// shrinkage/damage), so its input allows a signed value.
export function AdjustmentFormDialog({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}) {
  const createMutation = useCreateAdjustment();

  const [productId, setProductId] = useState('');
  const [type, setType] = useState<AdjustableMovementType>('PURCHASE');
  const [quantityChange, setQuantityChange] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setProductId('');
      setType('PURCHASE');
      setQuantityChange('');
      setNote('');
      setErrors({});
    }
  }, [open]);

  const requiresPositive = type === 'PURCHASE' || type === 'RETURN';

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!productId) nextErrors.productId = 'Select a product.';

    const qty = Number(quantityChange);
    if (quantityChange.trim() === '' || !Number.isInteger(qty) || qty === 0) {
      nextErrors.quantityChange = 'Enter a non-zero whole number.';
    } else if (requiresPositive && qty < 0) {
      nextErrors.quantityChange = `${type} must be a positive quantity.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateAdjustmentInput = {
      productId,
      type,
      quantityChange: Number(quantityChange),
      note: note.trim() || undefined,
    };

    createMutation
      .mutateAsync(input)
      .then(() => {
        toast({ title: 'Adjustment recorded' });
        onOpenChange(false);
      })
      .catch((error: Error) => {
        toast({ variant: 'destructive', title: 'Failed to record adjustment', description: error.message });
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New stock adjustment</DialogTitle>
          <DialogDescription>Posts a new movement to the inventory ledger — existing entries can't be edited.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Product" htmlFor="adjustment-product" required error={errors.productId}>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="adjustment-product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" htmlFor="adjustment-type">
              <Select value={type} onValueChange={(value) => setType(value as AdjustableMovementType)}>
                <SelectTrigger id="adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTABLE_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={requiresPositive ? 'Quantity' : 'Quantity change (+/-)'}
              htmlFor="adjustment-quantity"
              required
              error={errors.quantityChange}
              description={requiresPositive ? undefined : 'Negative reduces stock, positive adds to it.'}
            >
              <Input
                id="adjustment-quantity"
                type="number"
                step="1"
                min={requiresPositive ? '1' : undefined}
                value={quantityChange}
                onChange={(event) => setQuantityChange(event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Note" htmlFor="adjustment-note">
            <Textarea id="adjustment-note" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Record adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

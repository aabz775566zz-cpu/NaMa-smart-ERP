'use client';

import type { Customer, PaymentMethod, PaymentStatus } from '@erp-smart/types';
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  toast,
} from '@erp-smart/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog';
import { useCustomers } from '@/features/customers/hooks';
import { useProducts } from '@/features/products/hooks';

import type { CreateSaleInput } from '../api';
import { useCreateSale } from '../hooks';

const NO_CUSTOMER = '__none__';
const CREATE_CUSTOMER = '__create__';
const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'OTHER'];
const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID'];

interface LineItemDraft {
  productId: string;
  quantity: string;
}

function emptyLineItem(): LineItemDraft {
  return { productId: '', quantity: '1' };
}

// Creation only — there is no PATCH /sales/:id, so an existing sale can
// never be edited, only completed or cancelled (see sales.controller.ts).
export function SaleFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createMutation = useCreateSale();

  const [customerId, setCustomerId] = useState(NO_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [discountTotal, setDiscountTotal] = useState('');
  const [taxTotal, setTaxTotal] = useState('');
  const [items, setItems] = useState<LineItemDraft[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomerId(NO_CUSTOMER);
      setPaymentMethod('CASH');
      setPaymentStatus('UNPAID');
      setDiscountTotal('');
      setTaxTotal('');
      setItems([emptyLineItem()]);
      setError(null);
    }
  }, [open]);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  // Preview only, computed from live product prices the user can already
  // see in the Products list — the server always recomputes every line
  // total and the grand total authoritatively from Product.sellingPrice at
  // submit time (SalesService.create()); none of this is ever sent to the API.
  const previewSubtotal = items.reduce((sum, item) => {
    const product = productById.get(item.productId);
    const quantity = Number(item.quantity);
    if (!product || !Number.isFinite(quantity)) return sum;
    return sum + Number(product.sellingPrice) * quantity;
  }, 0);
  const previewTotal = Math.max(0, previewSubtotal - Number(discountTotal || 0) + Number(taxTotal || 0));

  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCustomerCreated(customer: Customer) {
    setCustomerId(customer.id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validItems = items.filter((item) => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setError('Add at least one product line with a quantity of 1 or more.');
      return;
    }

    const input: CreateSaleInput = {
      customerId: customerId === NO_CUSTOMER ? undefined : customerId,
      paymentMethod,
      paymentStatus,
      discountTotal: discountTotal ? Number(discountTotal) : undefined,
      taxTotal: taxTotal ? Number(taxTotal) : undefined,
      items: validItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
    };

    createMutation
      .mutateAsync(input)
      .then(() => {
        toast({ title: 'Sale created as draft' });
        onOpenChange(false);
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: 'Failed to create sale', description: err.message });
      });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New sale</DialogTitle>
          <DialogDescription>
            Creates a draft sale. Complete it afterwards to decrement stock and generate an invoice.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Customer" htmlFor="sale-customer">
            <Select
              value={customerId}
              onValueChange={(value) => {
                if (value === CREATE_CUSTOMER) {
                  setCustomerDialogOpen(true);
                  return;
                }
                setCustomerId(value);
              }}
            >
              <SelectTrigger id="sale-customer">
                <SelectValue placeholder="Walk-in customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CUSTOMER}>Walk-in customer</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CREATE_CUSTOMER}>
                  <span className="flex items-center gap-1.5 text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    New customer
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Payment method" htmlFor="sale-payment-method">
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger id="sale-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Payment status" htmlFor="sale-payment-status">
              <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                <SelectTrigger id="sale-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Items</span>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus />
                Add line
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select value={item.productId} onValueChange={(value) => updateItem(index, { productId: value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                          {product.sku ? ` (${product.sku})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="w-24"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove line</span>
                  </Button>
                </div>
              ))}
            </div>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Discount total" htmlFor="sale-discount">
              <Input
                id="sale-discount"
                type="number"
                min="0"
                step="0.01"
                value={discountTotal}
                onChange={(event) => setDiscountTotal(event.target.value)}
              />
            </FormField>
            <FormField label="Tax total" htmlFor="sale-tax">
              <Input
                id="sale-tax"
                type="number"
                min="0"
                step="0.01"
                value={taxTotal}
                onChange={(event) => setTaxTotal(event.target.value)}
              />
            </FormField>
          </div>

          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Estimated total: {previewTotal.toFixed(2)}{' '}
            <span className="text-xs">(the server computes the authoritative total from live prices)</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCreated={handleCustomerCreated}
      />
    </>
  );
}

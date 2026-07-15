'use client';

import type { PaymentMethod, PaymentStatus, Product } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
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
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCreateCustomer, useCustomers } from '@/features/customers/hooks';
import { useProducts } from '@/features/products/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import type { CreateSaleInput } from '../api';
import { useCompleteSale, useCreateSale } from '../hooks';
import { CartLineItem } from './cart-line-item';
import { ProductPicker } from './product-picker';

const NO_CUSTOMER = '__none__';
const CREATE_CUSTOMER = '__create__';
const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'OTHER'];
const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID'];

interface LineItemDraft {
  productId: string;
  quantity: number;
}

// Creation only — there is no PATCH /sales/:id, so an existing sale can
// never be edited, only completed or cancelled (see sales.controller.ts).
//
// Phase 5 rework: the old flow was a non-searchable <Select> per product
// line (open dropdown, scroll, pick, repeat "Add line") plus a second
// nested dialog just to add a walk-in customer's name. This version adds
// a search-as-you-type ProductPicker (clicking an already-in-cart product
// just bumps its quantity instead of adding a duplicate line), quantity
// steppers instead of raw number-only inputs, an inline customer quick-add
// (no second dialog), and a one-click "Complete sale" path so a shop
// employee doesn't have to close this dialog and hunt for the row's kebab
// menu just to finish a walk-in sale.
export function SaleFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createMutation = useCreateSale();
  const completeMutation = useCompleteSale();
  const createCustomerMutation = useCreateCustomer();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.sales;
  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: messages.common.methodCash,
    CARD: messages.common.methodCard,
    TRANSFER: messages.common.methodTransfer,
    OTHER: messages.common.methodOther,
  };
  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PAID: messages.common.paymentStatusPaid,
    PARTIAL: messages.common.paymentStatusPartial,
    UNPAID: messages.common.paymentStatusUnpaid,
  };

  const [customerId, setCustomerId] = useState(NO_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [discountTotal, setDiscountTotal] = useState('');
  const [taxTotal, setTaxTotal] = useState('');
  const [items, setItems] = useState<LineItemDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');

  useEffect(() => {
    if (open) {
      setCustomerId(NO_CUSTOMER);
      setPaymentMethod('CASH');
      setPaymentStatus('UNPAID');
      setDiscountTotal('');
      setTaxTotal('');
      setItems([]);
      setError(null);
      setQuickAddOpen(false);
      setQuickAddName('');
      setQuickAddPhone('');
    }
  }, [open]);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  // Preview only, computed from live product prices the user can already
  // see in the Products list — the server always recomputes every line
  // total and the grand total authoritatively from Product.sellingPrice at
  // submit time (SalesService.create()); none of this is ever sent to the API.
  const previewSubtotal = items.reduce((sum, item) => {
    const product = productById.get(item.productId);
    if (!product) return sum;
    return sum + Number(product.sellingPrice) * item.quantity;
  }, 0);
  const previewTotal = Math.max(0, previewSubtotal - Number(discountTotal || 0) + Number(taxTotal || 0));

  function handleProductSelect(product: Product) {
    setError(null);
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function handleQuickAddCustomer() {
    if (!quickAddName.trim()) return;
    createCustomerMutation
      .mutateAsync({ name: quickAddName.trim(), phone: quickAddPhone.trim() || undefined })
      .then((customer) => {
        setCustomerId(customer.id);
        setQuickAddOpen(false);
        setQuickAddName('');
        setQuickAddPhone('');
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.addCustomerFailed, description: err.message });
      });
  }

  function buildInput(): CreateSaleInput | null {
    if (items.length === 0) {
      setError(t.addAtLeastOneProduct);
      return null;
    }
    setError(null);
    return {
      customerId: customerId === NO_CUSTOMER ? undefined : customerId,
      paymentMethod,
      paymentStatus,
      discountTotal: discountTotal ? Number(discountTotal) : undefined,
      taxTotal: taxTotal ? Number(taxTotal) : undefined,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    };
  }

  function handleSaveDraft() {
    const input = buildInput();
    if (!input) return;

    createMutation
      .mutateAsync(input)
      .then(() => {
        toast({ title: t.saleCreatedDraft });
        onOpenChange(false);
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.createFailed, description: err.message });
      });
  }

  function handleCompleteNow() {
    const input = buildInput();
    if (!input) return;

    createMutation
      .mutateAsync(input)
      .then((sale) =>
        completeMutation
          .mutateAsync(sale.id)
          .then((result) => {
            toast({
              title: t.saleCompleted,
              description: t.invoiceGenerated.replace('{{number}}', result.invoice.invoiceNumber),
            });
            onOpenChange(false);
          })
          .catch((err: Error) => {
            // The sale itself was already created successfully — only
            // completion (which decrements stock and generates the
            // invoice) failed, e.g. insufficient stock. Leave it as a
            // draft rather than losing the cart the user just built.
            toast({
              variant: 'destructive',
              title: t.savedAsDraftTitle,
              description: err.message,
            });
            onOpenChange(false);
          }),
      )
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.createFailed, description: err.message });
      });
  }

  const isSubmitting = createMutation.isPending || completeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.newSale}</DialogTitle>
          <DialogDescription>{t.newSaleDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pe-1">
          <FormField label={t.customer} htmlFor="sale-customer">
            <Select
              value={customerId}
              onValueChange={(value) => {
                if (value === CREATE_CUSTOMER) {
                  setQuickAddOpen(true);
                  return;
                }
                setCustomerId(value);
              }}
            >
              <SelectTrigger id="sale-customer">
                <SelectValue placeholder={t.walkInCustomer} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CUSTOMER}>{t.walkInCustomer}</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CREATE_CUSTOMER}>
                  <span className="flex items-center gap-1.5 text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    {t.newCustomer}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {quickAddOpen ? (
            <div className="flex items-end gap-2 rounded-md border border-dashed border-border p-3">
              <FormField label={messages.common.name} htmlFor="quick-customer-name" required className="flex-1">
                <Input
                  id="quick-customer-name"
                  value={quickAddName}
                  onChange={(event) => setQuickAddName(event.target.value)}
                  autoFocus
                />
              </FormField>
              <FormField label={messages.common.phone} htmlFor="quick-customer-phone" className="flex-1">
                <Input
                  id="quick-customer-phone"
                  value={quickAddPhone}
                  onChange={(event) => setQuickAddPhone(event.target.value)}
                />
              </FormField>
              <Button
                type="button"
                size="sm"
                onClick={handleQuickAddCustomer}
                disabled={!quickAddName.trim() || createCustomerMutation.isPending}
              >
                {t.add}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setQuickAddOpen(false)}>
                {messages.common.cancel}
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.paymentMethod} htmlFor="sale-payment-method">
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger id="sale-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t.paymentStatus} htmlFor="sale-payment-status">
              <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                <SelectTrigger id="sale-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PAYMENT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {products && products.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title={t.noProductsYet}
              description={t.addProductBeforeSale}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/products">{t.goToProducts}</Link>
                </Button>
              }
            />
          ) : (
            <>
              <ProductPicker products={products ?? []} onSelect={handleProductSelect} autoFocus />

              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                    {t.cartEmpty}
                  </p>
                ) : (
                  items.map((item) => {
                    const product = productById.get(item.productId);
                    if (!product) return null;
                    return (
                      <CartLineItem
                        key={item.productId}
                        product={product}
                        quantity={item.quantity}
                        onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                        onRemove={() => removeItem(item.productId)}
                      />
                    );
                  })
                )}
              </div>
              {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.discountTotal} htmlFor="sale-discount">
              <Input
                id="sale-discount"
                type="number"
                min="0"
                step="0.01"
                value={discountTotal}
                onChange={(event) => setDiscountTotal(event.target.value)}
              />
            </FormField>
            <FormField label={t.taxTotal} htmlFor="sale-tax">
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
            {t.estimatedTotal} <span className="font-medium text-foreground">{formatMoney(previewTotal)}</span>{' '}
            <span className="text-xs">{t.estimatedTotalHint}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {messages.common.cancel}
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
            {createMutation.isPending ? messages.common.saving : t.saveAsDraft}
          </Button>
          <Button type="button" onClick={handleCompleteNow} disabled={isSubmitting}>
            {isSubmitting ? t.completing : t.completeSale}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

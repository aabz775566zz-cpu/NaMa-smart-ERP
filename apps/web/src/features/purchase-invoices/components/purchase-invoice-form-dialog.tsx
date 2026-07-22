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

// Cross-feature reuse, same pattern SaleFormDialog already uses for
// features/customers — a search-as-you-type product picker has no
// domain-specific knowledge worth forking.
import { ProductPicker } from '@/features/sales/components/product-picker';
import { useProducts } from '@/features/products/hooks';
import { useCreateSupplier, useSuppliers } from '@/features/suppliers/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import type { CreatePurchaseInvoiceInput } from '../api';
import { useCreatePurchaseInvoice, useReceivePurchaseInvoice } from '../hooks';
import { PurchaseInvoiceLineItem } from './purchase-invoice-line-item';

const CREATE_SUPPLIER = '__create__';

interface LineItemDraft {
  productId: string;
  quantity: number;
  unitCost: string;
}

// Creation only — there is no PATCH /purchase-invoices/:id, so an existing
// purchase invoice can never be edited, only received or cancelled (see
// purchase-invoices.controller.ts). Mirrors SaleFormDialog's structure
// exactly, substituting the price source: a purchase line's cost is
// client-entered per invoice, never locked to a live product field.
export function PurchaseInvoiceFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const createMutation = useCreatePurchaseInvoice();
  const receiveMutation = useReceivePurchaseInvoice();
  const createSupplierMutation = useCreateSupplier();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.purchaseInvoices;

  const [supplierId, setSupplierId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountTotal, setDiscountTotal] = useState('');
  const [taxTotal, setTaxTotal] = useState('');
  const [items, setItems] = useState<LineItemDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');

  useEffect(() => {
    if (open) {
      setSupplierId('');
      setDueDate('');
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

  // Preview only — the server always recomputes every line total and the
  // grand total authoritatively from the submitted unitCost values
  // (PurchaseInvoicesService.create()); none of this is ever trusted as-is.
  const previewSubtotal = items.reduce((sum, item) => sum + Number(item.unitCost || 0) * item.quantity, 0);
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
      return [...prev, { productId: product.id, quantity: 1, unitCost: product.purchasePrice }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  }

  function updateUnitCost(productId: string, unitCost: string) {
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, unitCost } : item)));
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function handleQuickAddSupplier() {
    if (!quickAddName.trim()) return;
    createSupplierMutation
      .mutateAsync({ name: quickAddName.trim(), phone: quickAddPhone.trim() || undefined })
      .then((supplier) => {
        setSupplierId(supplier.id);
        setQuickAddOpen(false);
        setQuickAddName('');
        setQuickAddPhone('');
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.addSupplierFailed, description: err.message });
      });
  }

  function buildInput(): CreatePurchaseInvoiceInput | null {
    if (!supplierId) {
      setError(t.selectSupplier);
      return null;
    }
    if (items.length === 0) {
      setError(t.addAtLeastOneProduct);
      return null;
    }
    setError(null);
    return {
      supplierId,
      dueDate: dueDate || undefined,
      discountTotal: discountTotal ? Number(discountTotal) : undefined,
      taxTotal: taxTotal ? Number(taxTotal) : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: Number(item.unitCost || 0),
      })),
    };
  }

  function handleSaveDraft() {
    const input = buildInput();
    if (!input) return;

    createMutation
      .mutateAsync(input)
      .then(() => {
        toast({ title: t.purchaseInvoiceCreatedDraft });
        onOpenChange(false);
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.createFailed, description: err.message });
      });
  }

  function handleReceiveNow() {
    const input = buildInput();
    if (!input) return;

    createMutation
      .mutateAsync(input)
      .then((purchaseInvoice) =>
        receiveMutation
          .mutateAsync(purchaseInvoice.id)
          .then(() => {
            toast({ title: t.purchaseInvoiceReceived });
            onOpenChange(false);
          })
          .catch((err: Error) => {
            // The purchase invoice itself was already created successfully
            // — only receiving (which posts stock movements and assigns the
            // invoice number) failed. Leave it as a draft rather than
            // losing the form the user just built.
            toast({ variant: 'destructive', title: t.savedAsDraftTitle, description: err.message });
            onOpenChange(false);
          }),
      )
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.createFailed, description: err.message });
      });
  }

  const isSubmitting = createMutation.isPending || receiveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.newPurchaseInvoice}</DialogTitle>
          <DialogDescription>{t.newPurchaseInvoiceDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pe-1">
          <FormField label={t.supplier} htmlFor="purchase-invoice-supplier" required>
            <Select
              value={supplierId}
              onValueChange={(value) => {
                if (value === CREATE_SUPPLIER) {
                  setQuickAddOpen(true);
                  return;
                }
                setSupplierId(value);
              }}
            >
              <SelectTrigger id="purchase-invoice-supplier">
                <SelectValue placeholder={t.selectSupplier} />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CREATE_SUPPLIER}>
                  <span className="flex items-center gap-1.5 text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    {t.newSupplier}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {quickAddOpen ? (
            <div className="flex items-end gap-2 rounded-md border border-dashed border-border p-3">
              <FormField label={messages.common.name} htmlFor="quick-supplier-name" required className="flex-1">
                <Input
                  id="quick-supplier-name"
                  value={quickAddName}
                  onChange={(event) => setQuickAddName(event.target.value)}
                  autoFocus
                />
              </FormField>
              <FormField label={messages.common.phone} htmlFor="quick-supplier-phone" className="flex-1">
                <Input
                  id="quick-supplier-phone"
                  value={quickAddPhone}
                  onChange={(event) => setQuickAddPhone(event.target.value)}
                />
              </FormField>
              <Button
                type="button"
                size="sm"
                onClick={handleQuickAddSupplier}
                disabled={!quickAddName.trim() || createSupplierMutation.isPending}
              >
                {t.add}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setQuickAddOpen(false)}>
                {messages.common.cancel}
              </Button>
            </div>
          ) : null}

          <FormField label={t.dueDate} htmlFor="purchase-invoice-due-date">
            <Input
              id="purchase-invoice-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </FormField>

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
                      <PurchaseInvoiceLineItem
                        key={item.productId}
                        product={product}
                        quantity={item.quantity}
                        unitCost={item.unitCost}
                        onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                        onUnitCostChange={(unitCost) => updateUnitCost(item.productId, unitCost)}
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
            <FormField label={t.discountTotal} htmlFor="purchase-invoice-discount">
              <Input
                id="purchase-invoice-discount"
                type="number"
                min="0"
                step="0.01"
                value={discountTotal}
                onChange={(event) => setDiscountTotal(event.target.value)}
              />
            </FormField>
            <FormField label={t.taxTotal} htmlFor="purchase-invoice-tax">
              <Input
                id="purchase-invoice-tax"
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
          <Button type="button" onClick={handleReceiveNow} disabled={isSubmitting}>
            {isSubmitting ? t.receiving : t.receiveNow}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

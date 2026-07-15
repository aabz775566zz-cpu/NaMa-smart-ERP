'use client';

import type { Category, Product, ProductStatus } from '@erp-smart/types';
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
  Textarea,
  toast,
} from '@erp-smart/ui';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { useCategories, useCreateProduct, useUpdateProduct } from '../hooks';
import type { CreateProductInput } from '../api';
import { CategoryQuickCreateDialog } from './category-quick-create-dialog';

const NO_CATEGORY = '__none__';
const CREATE_CATEGORY = '__create__';
const STATUS_OPTIONS: ProductStatus[] = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];

interface ProductFormValues {
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  purchasePrice: string;
  sellingPrice: string;
  unit: string;
  openingQuantity: string;
  lowStockThreshold: string;
  status: ProductStatus;
}

function emptyValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    sku: '',
    categoryId: NO_CATEGORY,
    purchasePrice: '',
    sellingPrice: '',
    unit: 'pcs',
    openingQuantity: '',
    lowStockThreshold: '',
    status: 'ACTIVE',
  };
}

function valuesFromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    sku: product.sku ?? '',
    categoryId: product.categoryId ?? NO_CATEGORY,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    unit: product.unit,
    // Opening quantity is create-only — an existing product's stock is
    // never edited through this form, only via Inventory movements.
    openingQuantity: '',
    lowStockThreshold: product.lowStockThreshold !== null ? String(product.lowStockThreshold) : '',
    status: product.status,
  };
}

type FormErrors = Partial<
  Record<'name' | 'purchasePrice' | 'sellingPrice' | 'openingQuantity' | 'lowStockThreshold', string>
>;

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}) {
  const { messages } = useLocale();
  const t = messages.products;
  const STATUS_LABELS: Record<ProductStatus, string> = {
    ACTIVE: t.statusActive,
    INACTIVE: t.statusInactive,
    DISCONTINUED: t.statusDiscontinued,
  };
  const isEdit = Boolean(product);
  const { data: categories } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [values, setValues] = useState<ProductFormValues>(emptyValues());
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(product ? valuesFromProduct(product) : emptyValues());
      setErrors({});
    }
  }, [open, product]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!values.name.trim()) nextErrors.name = t.nameRequired;
    if (values.purchasePrice === '' || Number(values.purchasePrice) < 0) {
      nextErrors.purchasePrice = t.purchasePriceInvalid;
    }
    if (values.sellingPrice === '' || Number(values.sellingPrice) < 0) {
      nextErrors.sellingPrice = t.sellingPriceInvalid;
    }
    if (values.lowStockThreshold !== '' && Number(values.lowStockThreshold) < 0) {
      nextErrors.lowStockThreshold = t.lowStockInvalid;
    }
    if (
      values.openingQuantity !== '' &&
      (!Number.isInteger(Number(values.openingQuantity)) || Number(values.openingQuantity) < 0)
    ) {
      nextErrors.openingQuantity = t.openingQuantityInvalid;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateProductInput = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      sku: values.sku.trim() || undefined,
      categoryId: values.categoryId === NO_CATEGORY ? undefined : values.categoryId,
      purchasePrice: Number(values.purchasePrice),
      sellingPrice: Number(values.sellingPrice),
      unit: values.unit.trim() || undefined,
      openingQuantity:
        !isEdit && values.openingQuantity !== '' ? Number(values.openingQuantity) : undefined,
      lowStockThreshold: values.lowStockThreshold === '' ? undefined : Number(values.lowStockThreshold),
      status: values.status,
    };

    const submit =
      isEdit && product
        ? updateMutation.mutateAsync({ id: product.id, input })
        : createMutation.mutateAsync(input);

    submit
      .then(() => {
        toast({ title: isEdit ? t.productUpdated : t.productCreated });
        onOpenChange(false);
      })
      .catch((error: Error) => {
        toast({
          variant: 'destructive',
          title: isEdit ? t.updateFailed : t.createFailed,
          description: error.message,
        });
      });
  }

  function handleCategoryCreated(category: Category) {
    setValues((v) => ({ ...v, categoryId: category.id }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editProduct : t.addProduct}</DialogTitle>
          <DialogDescription>
            {isEdit ? t.updateDescription : t.createDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* The only scrolling region — DialogHeader above and
              DialogFooter below both stay fixed regardless of viewport
              height, so Save is never pushed out of reach on a short
              screen. [&_label]:leading-snug (instead of the shared Label's
              default leading-none) is scoped to just this dialog: a long
              wrapped Arabic label should look like a deliberate two-line
              label, not cramped overlapping text. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pe-1 [&_label]:leading-snug">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.basicInfoSection}</p>
              <FormField label={messages.common.name} htmlFor="product-name" required error={errors.name}>
                <Input
                  id="product-name"
                  value={values.name}
                  onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
                />
              </FormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label={t.sku} htmlFor="product-sku">
                  <Input
                    id="product-sku"
                    value={values.sku}
                    onChange={(event) => setValues((v) => ({ ...v, sku: event.target.value }))}
                  />
                </FormField>
                <FormField label={t.category} htmlFor="product-category">
                  <Select
                    value={values.categoryId}
                    onValueChange={(value) => {
                      if (value === CREATE_CATEGORY) {
                        setCategoryDialogOpen(true);
                        return;
                      }
                      setValues((v) => ({ ...v, categoryId: value }));
                    }}
                  >
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder={t.noCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>{t.noCategory}</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={CREATE_CATEGORY}>
                        <span className="flex items-center gap-1.5 text-primary">
                          <Plus className="h-3.5 w-3.5" />
                          {t.newCategory}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={messages.common.status} htmlFor="product-status">
                  <Select
                    value={values.status}
                    onValueChange={(value) => setValues((v) => ({ ...v, status: value as ProductStatus }))}
                  >
                    <SelectTrigger id="product-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label={t.description} htmlFor="product-description">
                <Textarea
                  id="product-description"
                  rows={2}
                  value={values.description}
                  onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))}
                />
              </FormField>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.pricingSection}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label={t.purchasePrice} htmlFor="product-purchase-price" required error={errors.purchasePrice}>
                  <Input
                    id="product-purchase-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.purchasePrice}
                    onChange={(event) => setValues((v) => ({ ...v, purchasePrice: event.target.value }))}
                  />
                </FormField>
                <FormField label={t.sellingPrice} htmlFor="product-selling-price" required error={errors.sellingPrice}>
                  <Input
                    id="product-selling-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.sellingPrice}
                    onChange={(event) => setValues((v) => ({ ...v, sellingPrice: event.target.value }))}
                  />
                </FormField>
              </div>
            </section>

            {/* Deliberately emphasized — unit and opening quantity are the
                fields most often overlooked when quickly adding a product, so
                this section gets a tinted, bordered box instead of blending
                into the same flat rhythm as the sections above. */}
            <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.inventorySection}</p>
              <div className={isEdit ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'grid grid-cols-1 gap-4 sm:grid-cols-3'}>
                <FormField label={t.unit} htmlFor="product-unit" description={t.unitHint}>
                  <Input
                    id="product-unit"
                    value={values.unit}
                    onChange={(event) => setValues((v) => ({ ...v, unit: event.target.value }))}
                  />
                </FormField>
                {!isEdit ? (
                  <FormField
                    label={t.openingQuantity}
                    htmlFor="product-opening-quantity"
                    error={errors.openingQuantity}
                    description={t.openingQuantityHint}
                  >
                    <Input
                      id="product-opening-quantity"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={values.openingQuantity}
                      onChange={(event) => setValues((v) => ({ ...v, openingQuantity: event.target.value }))}
                    />
                  </FormField>
                ) : null}
                <FormField label={t.lowStockThreshold} htmlFor="product-low-stock" error={errors.lowStockThreshold}>
                  <Input
                    id="product-low-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={values.lowStockThreshold}
                    onChange={(event) => setValues((v) => ({ ...v, lowStockThreshold: event.target.value }))}
                  />
                </FormField>
              </div>
            </section>
          </div>

          <DialogFooter className="mt-4 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? messages.common.saving : isEdit ? messages.common.saveChanges : t.createProductButton}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      <CategoryQuickCreateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}

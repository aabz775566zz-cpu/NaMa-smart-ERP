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
    lowStockThreshold: product.lowStockThreshold !== null ? String(product.lowStockThreshold) : '',
    status: product.status,
  };
}

type FormErrors = Partial<Record<'name' | 'purchasePrice' | 'sellingPrice' | 'lowStockThreshold', string>>;

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}) {
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
    if (!values.name.trim()) nextErrors.name = 'Name is required.';
    if (values.purchasePrice === '' || Number(values.purchasePrice) < 0) {
      nextErrors.purchasePrice = 'Enter a valid purchase price.';
    }
    if (values.sellingPrice === '' || Number(values.sellingPrice) < 0) {
      nextErrors.sellingPrice = 'Enter a valid selling price.';
    }
    if (values.lowStockThreshold !== '' && Number(values.lowStockThreshold) < 0) {
      nextErrors.lowStockThreshold = 'Must be zero or greater.';
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
      lowStockThreshold: values.lowStockThreshold === '' ? undefined : Number(values.lowStockThreshold),
      status: values.status,
    };

    const submit =
      isEdit && product
        ? updateMutation.mutateAsync({ id: product.id, input })
        : createMutation.mutateAsync(input);

    submit
      .then(() => {
        toast({ title: isEdit ? 'Product updated' : 'Product created' });
        onOpenChange(false);
      })
      .catch((error: Error) => {
        toast({
          variant: 'destructive',
          title: isEdit ? 'Failed to update product' : 'Failed to create product',
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
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this product's details." : 'Create a new product in your catalog.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="product-name" required error={errors.name}>
            <Input
              id="product-name"
              value={values.name}
              onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" htmlFor="product-sku">
              <Input
                id="product-sku"
                value={values.sku}
                onChange={(event) => setValues((v) => ({ ...v, sku: event.target.value }))}
              />
            </FormField>
            <FormField label="Category" htmlFor="product-category">
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
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={CREATE_CATEGORY}>
                    <span className="flex items-center gap-1.5 text-primary">
                      <Plus className="h-3.5 w-3.5" />
                      New category
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Purchase price" htmlFor="product-purchase-price" required error={errors.purchasePrice}>
              <Input
                id="product-purchase-price"
                type="number"
                min="0"
                step="0.01"
                value={values.purchasePrice}
                onChange={(event) => setValues((v) => ({ ...v, purchasePrice: event.target.value }))}
              />
            </FormField>
            <FormField label="Selling price" htmlFor="product-selling-price" required error={errors.sellingPrice}>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Low stock threshold" htmlFor="product-low-stock" error={errors.lowStockThreshold}>
              <Input
                id="product-low-stock"
                type="number"
                min="0"
                step="1"
                value={values.lowStockThreshold}
                onChange={(event) => setValues((v) => ({ ...v, lowStockThreshold: event.target.value }))}
              />
            </FormField>
            <FormField label="Status" htmlFor="product-status">
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
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Description" htmlFor="product-description">
            <Textarea
              id="product-description"
              value={values.description}
              onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
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

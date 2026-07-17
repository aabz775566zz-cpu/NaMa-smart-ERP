'use client';

import type { CreateSupplierInput, Supplier } from '@erp-smart/types';
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
  Textarea,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { useCreateSupplier, useUpdateSupplier } from '../hooks';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SupplierFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function emptyValues(): SupplierFormValues {
  return { name: '', phone: '', email: '', address: '', notes: '' };
}

function valuesFromSupplier(supplier: Supplier): SupplierFormValues {
  return {
    name: supplier.name,
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    notes: supplier.notes ?? '',
  };
}

type FormErrors = Partial<Record<'name' | 'email', string>>;

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  /** Called with the new record after a successful create — not fired on edit. */
  onCreated?: (supplier: Supplier) => void;
}) {
  const { messages } = useLocale();
  const t = messages.suppliers;
  const isEdit = Boolean(supplier);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const [values, setValues] = useState<SupplierFormValues>(emptyValues());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setValues(supplier ? valuesFromSupplier(supplier) : emptyValues());
      setErrors({});
    }
  }, [open, supplier]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!values.name.trim()) nextErrors.name = t.nameRequired;
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = t.emailInvalid;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateSupplierInput = {
      name: values.name.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      address: values.address.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    const submit =
      isEdit && supplier
        ? updateMutation.mutateAsync({ id: supplier.id, input })
        : createMutation.mutateAsync(input);

    submit
      .then((result) => {
        toast({ title: isEdit ? t.supplierUpdated : t.supplierCreated });
        if (!isEdit) onCreated?.(result);
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

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.editSupplier : t.addSupplier}</DialogTitle>
          <DialogDescription>{isEdit ? t.updateDescription : t.createDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={messages.common.name} htmlFor="supplier-name" required error={errors.name}>
            <Input
              id="supplier-name"
              value={values.name}
              onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={messages.common.phone} htmlFor="supplier-phone">
              <Input
                id="supplier-phone"
                value={values.phone}
                onChange={(event) => setValues((v) => ({ ...v, phone: event.target.value }))}
              />
            </FormField>
            <FormField label={messages.common.email} htmlFor="supplier-email" error={errors.email}>
              <Input
                id="supplier-email"
                type="email"
                value={values.email}
                onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label={messages.common.address} htmlFor="supplier-address">
            <Input
              id="supplier-address"
              value={values.address}
              onChange={(event) => setValues((v) => ({ ...v, address: event.target.value }))}
            />
          </FormField>

          <FormField label={messages.common.notes} htmlFor="supplier-notes">
            <Textarea
              id="supplier-notes"
              value={values.notes}
              onChange={(event) => setValues((v) => ({ ...v, notes: event.target.value }))}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? messages.common.saving : isEdit ? messages.common.saveChanges : t.createSupplierButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

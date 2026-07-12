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
  FormField,
  Input,
  Textarea,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useCreateCustomer, useUpdateCustomer } from '../hooks';
import type { CreateCustomerInput } from '../api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function emptyValues(): CustomerFormValues {
  return { name: '', phone: '', email: '', address: '', notes: '' };
}

function valuesFromCustomer(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
  };
}

type FormErrors = Partial<Record<'name' | 'email', string>>;

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}) {
  const isEdit = Boolean(customer);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const [values, setValues] = useState<CustomerFormValues>(emptyValues());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setValues(customer ? valuesFromCustomer(customer) : emptyValues());
      setErrors({});
    }
  }, [open, customer]);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Name is required.';
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateCustomerInput = {
      name: values.name.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      address: values.address.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    const submit =
      isEdit && customer
        ? updateMutation.mutateAsync({ id: customer.id, input })
        : createMutation.mutateAsync(input);

    submit
      .then(() => {
        toast({ title: isEdit ? 'Customer updated' : 'Customer created' });
        onOpenChange(false);
      })
      .catch((error: Error) => {
        toast({
          variant: 'destructive',
          title: isEdit ? 'Failed to update customer' : 'Failed to create customer',
          description: error.message,
        });
      });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit customer' : 'Add customer'}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this customer's details." : 'Create a new customer record.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="customer-name" required error={errors.name}>
            <Input
              id="customer-name"
              value={values.name}
              onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" htmlFor="customer-phone">
              <Input
                id="customer-phone"
                value={values.phone}
                onChange={(event) => setValues((v) => ({ ...v, phone: event.target.value }))}
              />
            </FormField>
            <FormField label="Email" htmlFor="customer-email" error={errors.email}>
              <Input
                id="customer-email"
                type="email"
                value={values.email}
                onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Address" htmlFor="customer-address">
            <Input
              id="customer-address"
              value={values.address}
              onChange={(event) => setValues((v) => ({ ...v, address: event.target.value }))}
            />
          </FormField>

          <FormField label="Notes" htmlFor="customer-notes">
            <Textarea
              id="customer-notes"
              value={values.notes}
              onChange={(event) => setValues((v) => ({ ...v, notes: event.target.value }))}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import type { Company } from '@erp-smart/types';
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
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { CURRENCY_OPTIONS } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import type { UpdateCompanyInput } from '../api';
import { useUpdateCompany } from '../hooks';

interface FormValues {
  name: string;
  businessType: string;
  country: string;
  currency: string;
  logoUrl: string;
}

function valuesFromCompany(company: Company): FormValues {
  return {
    name: company.name,
    businessType: company.businessType ?? '',
    country: company.country ?? '',
    currency: company.currency,
    logoUrl: company.logoUrl ?? '',
  };
}

export function CompanyEditDialog({
  company,
  open,
  onOpenChange,
}: {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateCompany();
  const [values, setValues] = useState<FormValues>(() => valuesFromCompany(company));
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLocale();
  const t = messages.settings;

  useEffect(() => {
    if (open) {
      setValues(valuesFromCompany(company));
      setError(null);
    }
  }, [open, company]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError(t.companyNameRequired);
      return;
    }
    setError(null);

    const input: UpdateCompanyInput = {
      name: values.name.trim(),
      businessType: values.businessType.trim() || undefined,
      country: values.country.trim() || undefined,
      currency: values.currency.trim() || undefined,
      logoUrl: values.logoUrl.trim() || undefined,
    };

    updateMutation.mutate(input, {
      onSuccess: () => {
        toast({ title: t.companyUpdated });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: t.updateCompanyFailed, description: err.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.editCompanyTitle}</DialogTitle>
          <DialogDescription>{t.editCompanyDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t.companyName} htmlFor="company-name" required error={error ?? undefined}>
            <Input
              id="company-name"
              value={values.name}
              onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.businessType} htmlFor="company-business-type">
              <Input
                id="company-business-type"
                value={values.businessType}
                onChange={(event) => setValues((v) => ({ ...v, businessType: event.target.value }))}
              />
            </FormField>
            <FormField label={t.country} htmlFor="company-country">
              <Input
                id="company-country"
                value={values.country}
                onChange={(event) => setValues((v) => ({ ...v, country: event.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.currency} htmlFor="company-currency">
              <Select
                value={values.currency}
                onValueChange={(value) => setValues((v) => ({ ...v, currency: value }))}
              >
                <SelectTrigger id="company-currency">
                  <SelectValue placeholder={t.selectCurrency} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t.logoUrl} htmlFor="company-logo-url">
              <Input
                id="company-logo-url"
                value={values.logoUrl}
                onChange={(event) => setValues((v) => ({ ...v, logoUrl: event.target.value }))}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? messages.common.saving : messages.common.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

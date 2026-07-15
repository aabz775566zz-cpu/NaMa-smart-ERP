'use client';

import type { Category } from '@erp-smart/types';
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
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { useCreateCategory } from '../hooks';

export function CategoryQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: Category) => void;
}) {
  const { messages } = useLocale();
  const t = messages.products;
  const createMutation = useCreateCategory();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(t.categoryNameRequired);
      return;
    }
    setError(null);

    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: (category) => {
          toast({ title: t.categoryCreated });
          onCreated(category);
          onOpenChange(false);
        },
        onError: (err: Error) => {
          toast({ variant: 'destructive', title: t.categoryCreateFailed, description: err.message });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.newCategory}</DialogTitle>
          <DialogDescription>{t.newCategoryDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t.categoryName} htmlFor="new-category-name" required error={error ?? undefined}>
            <Input id="new-category-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t.creatingCategory : t.createCategory}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

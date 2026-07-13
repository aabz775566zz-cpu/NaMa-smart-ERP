'use client';

import type { PaymentMethod } from '@erp-smart/types';
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

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useRecordPayment } from '../hooks';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'OTHER'];

export function RecordPaymentDialog({
  customerId,
  remaining,
  open,
  onOpenChange,
}: {
  customerId: string;
  remaining: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const t = messages.customers;
  const formatMoney = useFormatMoney();
  const recordPaymentMutation = useRecordPayment(customerId);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();

  const remainingNumber = Number(remaining);

  useEffect(() => {
    if (open) {
      setAmount('');
      setMethod('CASH');
      setNote('');
      setError(undefined);
    }
  }, [open]);

  const methodLabels: Record<PaymentMethod, string> = {
    CASH: t.methodCash,
    CARD: t.methodCard,
    TRANSFER: t.methodTransfer,
    OTHER: t.methodOther,
  };

  function handleSettleFull() {
    if (remainingNumber > 0) {
      setAmount(remainingNumber.toFixed(2));
      setError(undefined);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError(t.amountRequired);
      return;
    }
    // Small epsilon guards against floating-point rounding when the amount
    // field was filled via "Settle full balance" from a .toFixed(2) string.
    if (remainingNumber > 0 && value > remainingNumber + 0.005) {
      setError(t.amountExceedsRemaining);
      return;
    }
    setError(undefined);

    recordPaymentMutation
      .mutateAsync({ amount: value, method, note: note.trim() || undefined })
      .then(() => {
        toast({ title: t.recordPaymentSuccess });
        onOpenChange(false);
      })
      .catch((err: Error) => {
        toast({ variant: 'destructive', title: t.recordPaymentError, description: err.message });
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.recordPayment}</DialogTitle>
          <DialogDescription>
            {t.remaining}: {formatMoney(remaining)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t.amount} htmlFor="payment-amount" required error={error}>
            <div className="flex gap-2">
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              {remainingNumber > 0 ? (
                <Button type="button" variant="outline" onClick={handleSettleFull} className="shrink-0">
                  {t.settleFullBalance}
                </Button>
              ) : null}
            </div>
          </FormField>

          <FormField label={t.paymentMethod} htmlFor="payment-method">
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {methodLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t.note} htmlFor="payment-note" description={t.noteHint}>
            <Textarea id="payment-note" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending ? '…' : t.recordPayment}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

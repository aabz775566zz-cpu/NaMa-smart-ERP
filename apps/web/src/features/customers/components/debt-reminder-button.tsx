'use client';

import { Button } from '@erp-smart/ui';
import { MessageCircle } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { buildWhatsAppLink, interpolate } from '@/lib/whatsapp';

// Same wa.me share-link pattern as WhatsAppShareButton (invoices feature) —
// message composition lives in one place (lib/whatsapp.ts) regardless of
// which screen triggers the send, so a future WhatsApp Business API swap
// only touches the transport, not this component.
export function DebtReminderButton({
  phone,
  companyName,
  remaining,
  variant = 'outline',
  className,
}: {
  phone: string | null | undefined;
  companyName: string;
  remaining: string;
  variant?: 'default' | 'outline';
  className?: string;
}) {
  const { messages } = useLocale();

  const message = interpolate(messages.customers.debtReminderMessage, {
    company: companyName,
    remaining,
  });
  const href = buildWhatsAppLink(phone, message);

  return (
    <Button asChild variant={variant} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle />
        {messages.customers.sendDebtReminder}
      </a>
    </Button>
  );
}

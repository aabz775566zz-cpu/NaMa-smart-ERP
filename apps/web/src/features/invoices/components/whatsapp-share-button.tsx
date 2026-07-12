'use client';

import { Button } from '@erp-smart/ui';
import { MessageCircle } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { buildWhatsAppLink, interpolate } from '@/lib/whatsapp';

/**
 * Reused everywhere an invoice can be shared: the invoice detail dialog,
 * the print page, and the post-sale-completion prompt. All three build the
 * exact same message from the same template — see whatsAppMessage in
 * packages/i18n/messages/*.json — so wording only needs updating in one
 * place.
 */
export function WhatsAppShareButton({
  phone,
  companyName,
  invoiceNumber,
  total,
  variant = 'default',
  className,
}: {
  phone: string | null | undefined;
  companyName: string;
  invoiceNumber: string;
  total: string;
  variant?: 'default' | 'outline';
  className?: string;
}) {
  const { messages } = useLocale();

  const message = interpolate(messages.invoice.whatsAppMessage, {
    company: companyName,
    number: invoiceNumber,
    total,
  });
  const href = buildWhatsAppLink(phone, message);

  return (
    <Button asChild variant={variant} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle />
        {messages.invoice.sendWhatsApp}
      </a>
    </Button>
  );
}

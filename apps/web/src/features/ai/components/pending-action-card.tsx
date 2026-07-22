'use client';

import type { AIPendingActionResult } from '@erp-smart/types';
import { Button, toast } from '@erp-smart/ui';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

import { useConfirmAiAction } from '@/features/ai/hooks';
import { useLocale } from '@/lib/locale/locale-context';

// Indent (ms-9) matches MessageBubble's avatar (h-7 w-7) + gap-2, so the
// card lines up under the assistant's bubble rather than its avatar.
// Iris-tinted border/background — this only ever appears on an AI surface
// (Constitution ch.7/15). Cancel is a purely local, session-only dismiss —
// no backend call, no persisted "cancelled" state — reopening the
// conversation later would show the card again, an accepted MVP tradeoff.
export function PendingActionCard({
  conversationId,
  toolMessageId,
  action,
}: {
  conversationId: string;
  toolMessageId: string;
  action: AIPendingActionResult;
}) {
  const { messages } = useLocale();
  const t = messages.ai;
  const confirmMutation = useConfirmAiAction(conversationId);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleConfirm() {
    confirmMutation.mutate(toolMessageId, {
      onError: (error) => {
        toast({ variant: 'destructive', title: t.actionFailed, description: error.message });
      },
    });
  }

  return (
    <div className="ms-9 max-w-[75%] space-y-3 rounded-lg border border-accent-brand/25 bg-accent-brand/5 p-3">
      <p className="text-sm text-foreground">{action.summary}</p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDismissed(true)}
          disabled={confirmMutation.isPending}
        >
          <X className="h-3.5 w-3.5" />
          {t.cancelAction}
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending}>
          <Check className="h-3.5 w-3.5" />
          {confirmMutation.isPending ? t.confirming : t.confirmAction}
        </Button>
      </div>
    </div>
  );
}

'use client';

import type { AIMessage } from '@erp-smart/types';
import { Dialog, DialogContent, DialogTitle, Skeleton, toast } from '@erp-smart/ui';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useConversation, useSendChatMessage } from '@/features/ai/hooks';
import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

import { ChatComposer } from './chat-composer';
import { MessageBubble } from './message-bubble';

/**
 * The Cmd+K Command Center — a real conversation surface, not a shell.
 * Shares the same chat backend as /dashboard/ai (same mutation, same query
 * cache), keeps its conversation across open/close within the session, and
 * auto-sends a seeded question when opened from a suggestion chip
 * (store.open(seedContext) — see AiCommandBar). Iris marks the surface as
 * AI throughout; Saffron never appears here (Constitution ch.7/15).
 */
export function CommandCenter() {
  const { isOpen, seedContext, close } = useCommandCenter();
  const { messages } = useLocale();
  const t = messages.ai;
  const td = messages.dashboard;

  const [conversationId, setConversationId] = useState<string | null>(null);
  // Optimistic echo of the just-sent user message, cleared only once the
  // refetched conversation actually contains it — no flicker gap.
  const [pendingText, setPendingText] = useState<string | null>(null);
  const conversationQuery = useConversation(conversationId);
  const sendMutation = useSendChatMessage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeedRef = useRef<string | null>(null);

  const visibleMessages = (conversationQuery.data?.messages ?? []).filter(
    (m) => m.role === 'USER' || m.role === 'ASSISTANT',
  );
  const isSending = sendMutation.isPending;
  const thinking = isSending || pendingText != null;

  function send(text: string) {
    if (sendMutation.isPending) return;
    setPendingText(text);
    sendMutation.mutate(
      { conversationId: conversationId ?? undefined, message: text },
      {
        onSuccess: (data) => {
          if (!conversationId) setConversationId(data.conversationId);
        },
        onError: (error) => {
          setPendingText(null);
          toast({ variant: 'destructive', title: t.sendMessageFailed, description: error.message });
        },
      },
    );
  }

  useEffect(() => {
    if (!pendingText) return;
    if (visibleMessages.some((m) => m.role === 'USER' && m.content === pendingText)) {
      setPendingText(null);
    }
  }, [visibleMessages, pendingText]);

  // A suggestion chip opens the overlay pre-seeded with a real question —
  // send it immediately, exactly once per open.
  useEffect(() => {
    if (isOpen && seedContext && lastSeedRef.current !== seedContext) {
      lastSeedRef.current = seedContext;
      send(seedContext);
    }
    if (!isOpen) lastSeedRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, seedContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visibleMessages.length, pendingText, thinking, isOpen]);

  const suggestions = [td.aiSuggestionSales, td.aiSuggestionCustomers, td.aiSuggestionLowStock];
  const hasThread = visibleMessages.length > 0 || pendingText != null || thinking;

  const pendingMessage: AIMessage | null = pendingText
    ? ({
        id: '__pending__',
        conversationId: conversationId ?? '__pending__',
        role: 'USER',
        content: pendingText,
        createdAt: new Date().toISOString(),
      } as AIMessage)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          textareaRef.current?.focus();
        }}
        className="inset-x-4 top-[8vh] mx-auto w-auto max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl border-accent-brand/25 p-0"
      >
        <DialogTitle className="sr-only">{t.askAiAssistant}</DialogTitle>

        {hasThread ? (
          <div className="max-h-[50vh] min-h-[10rem] space-y-4 overflow-y-auto p-4">
            {visibleMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {pendingMessage ? <MessageBubble message={pendingMessage} /> : null}
            {thinking ? (
              <div className="flex items-center gap-2" aria-live="polite">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <Skeleton className="h-8 w-32" />
                <span className="sr-only">{t.thinking}</span>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-9 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-brand/12 text-accent-brand">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t.askAiAssistant}</p>
              <p className="mx-auto max-w-sm text-xs text-muted-foreground">{t.askAiAssistantDescription}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent-brand/40 hover:text-foreground active:scale-[0.98]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChatComposer onSend={send} disabled={isSending} textareaRef={textareaRef} />

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent-brand" />
            {t.askAiLabel}
          </span>
          <Link
            href="/dashboard/ai"
            onClick={close}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t.openFullAssistant}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

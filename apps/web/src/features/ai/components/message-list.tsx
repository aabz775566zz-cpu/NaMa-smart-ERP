'use client';

import type { AIConversationDetail } from '@erp-smart/types';
import { EmptyState, Skeleton } from '@erp-smart/ui';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { MessageBubble } from './message-bubble';
import { PendingActionCard } from './pending-action-card';
import { buildAiTimeline } from '../timeline';

export function MessageList({
  conversation,
  isLoading,
  isError,
  isSending,
}: {
  conversation: AIConversationDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  isSending: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages: localeMessages } = useLocale();
  const t = localeMessages.ai;
  // TOOL-role messages carry raw JSON meant for the model's own context (see
  // AIToolCallResult) — buildAiTimeline turns them into either nothing, or
  // (for a still-pending propose_* action) a confirmation card placed right
  // after the assistant's reply. USER/ASSISTANT turns render as bubbles.
  const timeline = conversation ? buildAiTimeline(conversation.messages) : [];
  const visibleMessages = timeline.filter((item) => item.type === 'message');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, isSending]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ms-auto h-12 w-2/3" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState title={t.couldNotLoadConversation} description={localeMessages.common.pleaseTryAgain} />
      </div>
    );
  }

  if (visibleMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState icon={<Sparkles />} title={t.askAiAssistant} description={t.askAiAssistantDescription} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {timeline.map((item) =>
        item.type === 'message' ? (
          <MessageBubble key={item.message.id} message={item.message} />
        ) : (
          <PendingActionCard
            key={item.toolMessageId}
            conversationId={conversation!.id}
            toolMessageId={item.toolMessageId}
            action={item.action}
          />
        ),
      )}
      {isSending ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

'use client';

import { toast } from '@erp-smart/ui';
import { useState } from 'react';

import { ChatComposer } from '@/features/ai/components/chat-composer';
import { ConversationSidebar } from '@/features/ai/components/conversation-sidebar';
import { MessageList } from '@/features/ai/components/message-list';
import { useConversation, useConversations, useSendChatMessage } from '@/features/ai/hooks';

// No permission gate — AiController has no @RequirePermission, only the
// global JwtAuthGuard (already enforced by the dashboard layout). Tool
// access is filtered server-side per the user's own permissions, so what
// the assistant can retrieve is already bounded without a client-side check.
export default function AiPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const conversationsQuery = useConversations();
  const conversationQuery = useConversation(activeConversationId);
  const sendMessageMutation = useSendChatMessage();

  function handleSend(message: string) {
    sendMessageMutation.mutate(
      { conversationId: activeConversationId ?? undefined, message },
      {
        onSuccess: (data) => {
          if (!activeConversationId) setActiveConversationId(data.conversationId);
        },
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Failed to send message', description: error.message });
        },
      },
    );
  }

  return (
    <div className="flex h-full gap-4">
      <ConversationSidebar
        conversations={conversationsQuery.data ?? []}
        isLoading={conversationsQuery.isLoading}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        onNewChat={() => setActiveConversationId(null)}
      />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
        <MessageList
          conversation={conversationQuery.data}
          isLoading={Boolean(activeConversationId) && conversationQuery.isLoading}
          isError={conversationQuery.isError}
          isSending={sendMessageMutation.isPending}
        />
        <ChatComposer onSend={handleSend} disabled={sendMessageMutation.isPending} />
      </div>
    </div>
  );
}

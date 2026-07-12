'use client';

import type { AIConversation } from '@erp-smart/types';
import { Button, Skeleton } from '@erp-smart/ui';
import { MessageSquarePlus, Trash2 } from 'lucide-react';

import { useDeleteConversation } from '../hooks';

// Hidden below md, matching the same breakpoint the main dashboard sidebar
// uses — a 240px+ history panel doesn't fit alongside a usable chat on a
// phone-width screen. Core chat (message list + composer) stays fully
// usable without it; only history browsing is desktop-only.
export function ConversationSidebar({
  conversations,
  isLoading,
  activeConversationId,
  onSelect,
  onNewChat,
}: {
  conversations: AIConversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  const deleteMutation = useDeleteConversation();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) onNewChat();
      },
    });
  }

  return (
    <div className="hidden w-64 shrink-0 flex-col rounded-lg border border-border md:flex">
      <div className="border-b border-border p-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onNewChat}>
          <MessageSquarePlus />
          New chat
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </>
        ) : conversations.length === 0 ? (
          <p className="p-2 text-center text-xs text-muted-foreground">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-md ${isActive ? 'bg-primary/10' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`flex-1 truncate rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {conversation.title ?? 'New conversation'}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(conversation.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete conversation</span>
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

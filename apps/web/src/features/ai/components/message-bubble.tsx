import type { AIMessage } from '@erp-smart/types';
import { Avatar, AvatarFallback } from '@erp-smart/ui';
import { Sparkles } from 'lucide-react';

// justify-end/justify-start (not absolute positioning) so alignment
// auto-flips correctly under RTL — the user's own messages stay on the
// trailing side of the reading direction, matching conventional chat UX.
export function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser ? (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

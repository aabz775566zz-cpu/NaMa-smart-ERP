'use client';

import { Dialog, DialogContent, DialogTitle } from '@erp-smart/ui';

import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

import { ChatComposer } from './chat-composer';

// The AI chat mutation (useSendChatMessage/useConversation) is intentionally
// NOT wired yet — this is the overlay shell only, connected solely to the
// Command Center store. onSend is a no-op until that wiring lands in a
// later task.
export function CommandCenter() {
  const { isOpen, close } = useCommandCenter();
  const { messages } = useLocale();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="inset-x-4 top-[8vh] mx-auto w-auto max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl p-0">
        <DialogTitle className="sr-only">{messages.ai.askAiAssistant}</DialogTitle>
        <ChatComposer onSend={() => {}} />
      </DialogContent>
    </Dialog>
  );
}

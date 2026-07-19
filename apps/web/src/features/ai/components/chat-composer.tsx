'use client';

import { Button, Textarea } from '@erp-smart/ui';
import { Send } from 'lucide-react';
import { useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

// Matches SendChatMessageDto's @MaxLength(4000) exactly.
const MAX_LENGTH = 4000;

export function ChatComposer({
  onSend,
  disabled,
  textareaRef,
}: {
  onSend: (message: string) => void;
  disabled?: boolean;
  /** Lets a parent (the Command Center) drive focus, e.g. from Radix's
   * onOpenAutoFocus, without reaching into the DOM. */
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const [value, setValue] = useState('');
  const { messages } = useLocale();

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border p-4">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder={messages.ai.askPlaceholder}
        rows={2}
        className="min-h-0 flex-1 resize-none"
        disabled={disabled}
      />
      <Button type="button" size="icon" onClick={handleSend} disabled={disabled || !value.trim()}>
        <Send className="h-4 w-4" />
        <span className="sr-only">{messages.ai.sendMessage}</span>
      </Button>
    </div>
  );
}

import type { AIMessage, AIPendingActionResult } from '@erp-smart/types';

export type AiTimelineItem =
  | { type: 'message'; message: AIMessage }
  | { type: 'pendingAction'; toolMessageId: string; action: AIPendingActionResult };

interface ParsedToolContent {
  tool: string;
  arguments: unknown;
  result?: unknown;
}

function parsePendingAction(content: string): AIPendingActionResult | null {
  try {
    const parsed = JSON.parse(content) as ParsedToolContent;
    const result = parsed.result as Partial<AIPendingActionResult> | undefined;
    if (result?.pendingConfirmation === true) {
      return result as AIPendingActionResult;
    }
  } catch {
    // Not JSON, or doesn't match the expected shape — not a pending action.
  }
  return null;
}

/**
 * Turns the full raw message list (USER/ASSISTANT/TOOL, in `sequence`
 * order — see AIMessage.sequence) into a flat render list: USER/ASSISTANT
 * bubbles in place, plus a `pendingAction` item right after the assistant's
 * reply for any TOOL call in that turn whose result is a still-pending
 * AIPendingActionResult (see AiToolRegistryService's propose_* tools —
 * "still pending" because AiService.confirmAction() flips the stored flag
 * to false once actually confirmed, so a refetch after confirming simply
 * stops producing this item). A pure function, shared by MessageList
 * (/dashboard/ai) and CommandCenter (Cmd+K) so both surfaces render pending
 * actions identically without duplicating the grouping logic.
 */
export function buildAiTimeline(messages: AIMessage[]): AiTimelineItem[] {
  const items: AiTimelineItem[] = [];
  let pendingTools: AIMessage[] = [];

  for (const message of messages) {
    if (message.role === 'TOOL') {
      pendingTools.push(message);
      continue;
    }
    if (message.role === 'USER') {
      // A fresh question always starts a new turn — any tool calls from a
      // prior, already-answered turn are irrelevant to it.
      pendingTools = [];
      items.push({ type: 'message', message });
      continue;
    }
    // ASSISTANT
    items.push({ type: 'message', message });
    for (const toolMessage of pendingTools) {
      const action = parsePendingAction(toolMessage.content);
      if (action) {
        items.push({ type: 'pendingAction', toolMessageId: toolMessage.id, action });
      }
    }
    pendingTools = [];
  }

  return items;
}

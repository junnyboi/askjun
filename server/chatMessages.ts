/**
 * Validation for the chat request body.
 *
 * Only user and assistant turns with text are accepted. Anything else is
 * rejected, in particular a caller-supplied "system" turn, which would
 * otherwise sit beside askJun's own instructions.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 200;

/** Returns the conversation, or null when the body is not a valid one. */
export function parseChatMessages(input: unknown): ChatTurn[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TURNS) return null;

  const turns: ChatTurn[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    // Blank turns (an answer stopped before its first word) carry nothing
    if (content.trim()) turns.push({ role, content });
  }

  const last = turns[turns.length - 1];
  return last?.role === "user" ? turns : null;
}

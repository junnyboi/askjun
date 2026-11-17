/**
 * ChatFollowUps — suggested next questions under the latest answer.
 */
import { getFollowUps } from "@/data/followUps";
import type { Message } from "@/hooks/useChatEngine";
import { PromptChip } from "@/components/PromptChip";

interface ChatFollowUpsProps {
  messages: Message[];
  usedChips: Set<string>;
  onAsk: (prompt: string) => void;
}

const EASTER_EGG_CHIP = "What does he look like?";
const APPEARANCE_WORDS = ["handsome", "attractive", "look like", "looks like", "gorgeous", "appearance"];

export function ChatFollowUps({ messages, usedChips, onAsk }: ChatFollowUpsProps) {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastQuery = userMessages[userMessages.length - 1]?.content || "";
  const baseChips = getFollowUps(lastQuery).filter((chip) => !usedChips.has(chip));

  // The appearance easter egg is offered once, from the third question on
  const hasAskedAppearance =
    usedChips.has(EASTER_EGG_CHIP) ||
    userMessages.some((m) => APPEARANCE_WORDS.some((word) => m.content.toLowerCase().includes(word)));
  const offerEasterEgg = !hasAskedAppearance && userMessages.length >= 3 && !baseChips.includes(EASTER_EGG_CHIP);
  const chips = offerEasterEgg ? [...baseChips.slice(0, 2), EASTER_EGG_CHIP] : baseChips;

  if (chips.length === 0) return null;

  return (
    <div className="border-t border-border pt-5">
      <p className="mb-3 font-mono text-xs text-muted-foreground">Suggested follow-ups</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <PromptChip key={chip} label={chip} onClick={() => onAsk(chip)} />
        ))}
      </div>
    </div>
  );
}

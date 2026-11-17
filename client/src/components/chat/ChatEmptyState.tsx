/**
 * ChatEmptyState — the chat pane before the first question.
 * Desktop: headline, input and four prompt cards (proof lives in the dossier pane).
 * Below 1024px: identity, input, one scrolling chip row, then the proof.
 */
import { useEffect, useState } from "react";
import type { Dispatch, Ref, SetStateAction } from "react";
import { GENERATIVE_CHIPS, HEADLINE_HIGHLIGHTS, PROFILE, PROMPT_CARDS } from "@/data/portfolio";
import { AskInput } from "@/components/AskInput";
import { EmployerTimeline } from "@/components/EmployerTimeline";
import { JunAvatar } from "@/components/JunAvatar";
import { MetricTile } from "@/components/MetricTile";
import { PromptChip } from "@/components/PromptChip";

interface ChatEmptyStateProps {
  inputRef: Ref<HTMLTextAreaElement>;
  input: string;
  isTyping: boolean;
  onInputChange: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  onAsk: (prompt: string) => void;
  onZoomPortrait: () => void;
}

const PLACEHOLDERS = [
  "Ask about Jun...",
  "What's his experience with AI?",
  "Tell me about his tech stack",
  "What payment systems did he build?",
  "Why is he looking for new roles?",
];

const CONTACT_LINK_CLASSES = "font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground";

export function ChatEmptyState({
  inputRef,
  input,
  isTyping,
  onInputChange,
  onSubmit,
  onAsk,
  onZoomPortrait,
}: ChatEmptyStateProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 lg:flex lg:min-h-full lg:flex-col lg:justify-center lg:px-10">
      <div className="mx-auto w-full max-w-[720px] pb-8 pt-2 lg:pb-16 lg:pt-6">
        {/* Identity (small screens) */}
        <div className="mb-5 flex items-center gap-4 lg:hidden">
          <button
            type="button"
            onClick={onZoomPortrait}
            aria-label="Enlarge portrait"
            className="shrink-0 cursor-zoom-in overflow-hidden rounded-full border border-border"
          >
            <JunAvatar size={88} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight text-foreground">{PROFILE.name}</h1>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{PROFILE.title}</p>
            <p className="mt-1.5 flex items-center gap-2 font-mono text-xs text-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" aria-hidden />
              Available for hire
            </p>
          </div>
        </div>

        {/* Headline (desktop) */}
        <div className="mb-8 hidden text-center lg:block">
          <h2 className="text-4xl tracking-tight text-foreground xl:text-5xl">Ask anything about Jun.</h2>
          <p className="mt-4 font-mono text-sm text-muted-foreground">Answers come from his CV and portfolio.</p>
        </div>

        <AskInput
          ref={inputRef}
          variant="hero"
          value={input}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          isBusy={isTyping}
          onChange={onInputChange}
          onSubmit={onSubmit}
        />

        {/* Prompt cards (desktop) */}
        <div className="mt-6 hidden grid-cols-2 gap-3 lg:grid">
          {PROMPT_CARDS.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => onAsk(card.question)}
              className="flex min-h-[92px] flex-col gap-2 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-foreground active:scale-[0.99]"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">{card.label}</span>
              <span className="font-mono text-sm text-foreground">{card.question}</span>
            </button>
          ))}
        </div>

        {/* Chips: one scrolling row on small screens, a centred row of ✦ prompts on desktop */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 [&_button]:shrink-0 [&_button]:whitespace-nowrap">
          <div className="contents lg:hidden">
            {PROMPT_CARDS.map((card) => (
              <PromptChip key={card.label} label={card.question} onClick={() => onAsk(card.question)} />
            ))}
          </div>
          {GENERATIVE_CHIPS.map((chip) => (
            <PromptChip key={chip} label={chip} onClick={() => onAsk(chip)} />
          ))}
        </div>

        {/* Proof (small screens; on desktop this is the dossier pane) */}
        <div className="mt-5 space-y-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {HEADLINE_HIGHLIGHTS.map((h) => (
              <MetricTile key={h.metric} metric={h.metric} label={h.label} onAsk={() => onAsk(h.prompt)} />
            ))}
          </div>
          <div className="rounded-lg border border-border bg-background p-2">
            <EmployerTimeline onAsk={onAsk} />
          </div>
          <div className="flex items-center justify-center gap-6 pt-2">
            <a href={`mailto:${PROFILE.email}`} className={CONTACT_LINK_CLASSES}>Email</a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>LinkedIn</a>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * ChatCard — Glass Atelier Design
 * Primary CTA tile that invites users to chat with the AI agent.
 * Pulses gently to draw attention.
 */

import { CHAT_SUGGESTIONS } from "@/data/portfolio";

interface ChatCardProps {
  onOpenChat: () => void;
}

export default function ChatCard({ onOpenChat }: ChatCardProps) {
  return (
    <button
      className="glass-card animate-pulse-glow cursor-pointer h-full min-h-[320px] lg:min-h-[360px] flex flex-col text-left w-full"
      onClick={onOpenChat}
      type="button"
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-violet-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-xs font-mono text-primary/80 tracking-wider uppercase">
            AI Agent
          </span>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          Ask me anything
        </h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Chat with an AI trained on Jun's career history, technical skills, and project details.
        </p>

        {/* Fake chat input */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <span className="text-sm text-muted-foreground">
            Ask about Jun's experience...
          </span>
          <span className="ml-auto w-1 h-4 bg-primary animate-blink" />
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-col gap-2 mt-auto">
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
            Try asking
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CHAT_SUGGESTIONS.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-foreground/60 border border-white/5 truncate max-w-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

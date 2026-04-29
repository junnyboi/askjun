/*
 * HighlightsCard — Glass Atelier Design
 * Key metrics and achievements displayed as glowing stat blocks.
 */

import { HIGHLIGHTS } from "@/data/portfolio";

export default function HighlightsCard() {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">Impact</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {HIGHLIGHTS.slice(0, 6).map((h, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/3 border border-white/5 p-3 flex flex-col justify-between"
          >
            <span className="text-lg sm:text-xl font-bold gradient-text leading-tight">
              {h.metric}
            </span>
            <div className="mt-1">
              <p className="text-[11px] text-foreground/60 leading-snug">
                {h.label}
              </p>
              <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">
                {h.context}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

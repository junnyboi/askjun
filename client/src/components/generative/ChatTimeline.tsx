/**
 * ChatTimeline — Interactive career timeline rendered inside the chat
 * Generative UI component triggered when user asks about career/experience/timeline
 */

import { motion } from "framer-motion";
import { EXPERIENCES } from "@/data/portfolio";

export function ChatTimeline() {
  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-card border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Career Timeline</span>
      </div>
      <div className="p-4 space-y-0">
        {EXPERIENCES.map((exp, i) => (
          <motion.div
            key={exp.company}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex gap-3 relative"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full border-2 shrink-0 mt-1"
                style={{ borderColor: exp.color, backgroundColor: i === 0 ? exp.color : "transparent" }}
              />
              {i < EXPERIENCES.length - 1 && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground truncate">{exp.company}</h4>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{exp.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{exp.role} · {exp.location}</p>
              {i === 0 && (
                <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  Current
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

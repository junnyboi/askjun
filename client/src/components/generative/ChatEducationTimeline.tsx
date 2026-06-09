/**
 * ChatEducationTimeline — Interactive education timeline rendered inside the chat
 * Generative UI component triggered when user asks about education/university/degree
 */

import { motion } from "framer-motion";
import { EDUCATION } from "@/data/portfolio";
import { CollapsibleCard } from "./CollapsibleCard";

export function ChatEducationTimeline() {
  return (
    <CollapsibleCard title="Education">
      <div className="p-4 space-y-0">
        {EDUCATION.map((edu, i) => (
          <motion.div
            key={edu.school}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
            className="flex gap-3 relative"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full border-2 border-accent shrink-0 mt-1" />
              {i < EDUCATION.length - 1 && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{edu.school}</h4>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{edu.year}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{edu.degree}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </CollapsibleCard>
  );
}

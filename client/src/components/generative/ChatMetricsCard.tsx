/**
 * ChatMetricsCard — Animated metrics display rendered inside the chat
 * Generative UI component triggered when user asks about achievements/impact/metrics
 */

import { motion } from "framer-motion";
import { HIGHLIGHTS } from "@/data/portfolio";

export function ChatMetricsCard() {
  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-card border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Key Metrics & Impact</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
        {HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={h.metric}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="bg-background p-3 flex flex-col"
          >
            <span className="text-lg sm:text-xl font-bold font-mono text-accent">
              {h.metric}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {h.label}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/50 mt-1">
              {h.context}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

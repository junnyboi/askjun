/*
 * ExperienceCard — Glass Atelier Design
 * Timeline-style experience display in a glass card.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXPERIENCES } from "@/data/portfolio";

export default function ExperienceCard() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="glass-card p-6 sm:p-8 h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">Experience</h2>
      </div>

      <div className="space-y-1">
        {EXPERIENCES.map((exp, i) => (
          <div key={i} className="relative">
            {/* Timeline line */}
            {i < EXPERIENCES.length - 1 && (
              <div className="absolute left-[15px] top-10 bottom-0 w-px bg-white/8" />
            )}

            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-white/3 transition-colors text-left"
            >
              {/* Timeline dot */}
              <div
                className="w-[10px] h-[10px] rounded-full mt-1.5 shrink-0 ring-2 ring-background"
                style={{ backgroundColor: exp.color || "#f97316" }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {exp.company}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {exp.period}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exp.role} · {exp.location}
                </p>
              </div>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-muted-foreground shrink-0 mt-1 transition-transform ${
                  expanded === i ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="pl-10 pr-2 pb-3 space-y-2">
                    {exp.bullets.map((bullet, j) => (
                      <li
                        key={j}
                        className="text-xs text-foreground/70 leading-relaxed pl-3 relative before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-primary/50"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

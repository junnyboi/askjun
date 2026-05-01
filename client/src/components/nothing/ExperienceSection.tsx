import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXPERIENCES } from "@/data/portfolio";

export default function ExperienceSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Experience</h2>
        <p className="text-sm text-muted-foreground font-mono mb-10">7+ years across FAANG, gaming, fintech</p>

        <div className="border-t border-border">
          {EXPERIENCES.map((exp, i) => (
            <div key={i} className="border-b border-border">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full py-5 flex items-start sm:items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors px-2 -mx-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {exp.company}
                    </h3>
                    <span className="hidden sm:inline text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {exp.role}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground mt-1 block">
                    {exp.period} · {exp.location}
                  </span>
                </div>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
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
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <ul className="pb-5 px-2 space-y-2">
                      {exp.bullets.map((bullet, j) => (
                        <li
                          key={j}
                          className="text-sm text-muted-foreground leading-relaxed pl-4 relative before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-px before:bg-accent"
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
    </section>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROJECTS = [
  {
    title: "Manus AI Agent Interface",
    company: "Meta",
    period: "2026",
    description: "Engineered the core frontend for an advanced AI agent platform enabling real-time human-AI interaction.",
    metrics: ["Real-time streaming", "Multi-turn conversations", "Document previewing"],
    details: "Built the AI agent conversation interface with real-time streaming responses, context management, and interactive UI components. Architected scheduled task management, dynamic navigation, and collaboration features enabling multi-user interaction with AI-generated artifacts.",
  },
  {
    title: "Global Payment System",
    company: "HoYoverse",
    period: "2022–2025",
    description: "Rebuilt payment infrastructure for 5 flagship titles processing $57M on launch week.",
    metrics: ["~$57M launch week", "50+ payment methods", "100+ countries"],
    details: "Scaled account and payments frontends for Genshin Impact, Honkai: Star Rail, and 3 other titles across iOS, Android, PC, PS4/PS5, and Xbox. Built modular Vue + TypeScript UIs integrating 50+ payment methods, supporting ~8M DAU and ≈SGD 5M in daily transactions.",
  },
  {
    title: "GDPR Compliance Portal",
    company: "TikTok",
    period: "2021–2022",
    description: "Led time-critical rebuild of payment portals to meet EU regulatory deadlines.",
    metrics: ["Multi-million € fines averted", "EU/US data separation", "Months-long deadline"],
    details: "Spearheaded GDPR/data-residency compliance for payments: rebuilt and localized merchant/advertiser and admin portals using React, Node.js (BFF), and Golang. Implemented data separation, consent, and audit logging under tight regulatory deadline.",
  },
  {
    title: "Innovation & Roboadvisory",
    company: "Bank of Singapore",
    period: "2019–2021",
    description: "Led winning innovation products delivering $1.5M/annum in savings.",
    metrics: ["$1.5M annual savings", "3,680 hours saved", "CEO Award 2020"],
    details: "Led 2 winning Innovation Challenge products end-to-end. Launched RM pitch tool saving 3,680 hours globally. Prototyped a genetic-algorithm portfolio optimizer in Python that led to formation of an in-house roboadvisory team (SuperSolver).",
  },
];

export default function CaseStudies() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Projects</h2>
        <p className="text-sm text-muted-foreground font-mono mb-10">Key technical achievements</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map((project, i) => (
            <div
              key={i}
              className="border border-border p-5 sm:p-6 hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {project.company} · {project.period}
                  </span>
                </div>
                <svg
                  width="14"
                  height="14"
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
              </div>

              <p className="text-sm text-muted-foreground mb-3">{project.description}</p>

              <div className="flex flex-wrap gap-2">
                {project.metrics.map((m, j) => (
                  <span key={j} className="text-xs font-mono px-2 py-0.5 border border-border text-foreground">
                    {m}
                  </span>
                ))}
              </div>

              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border leading-relaxed">
                      {project.details}
                    </p>
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

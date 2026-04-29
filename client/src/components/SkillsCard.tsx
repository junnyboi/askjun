/*
 * SkillsCard — Glass Atelier Design
 * Skills displayed as categorized tags with a scrolling marquee effect.
 */

import { SKILLS } from "@/data/portfolio";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  language: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/20" },
  framework: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
  tool: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20" },
  domain: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
};

const CATEGORY_LABELS: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
  domain: "Domains",
};

export default function SkillsCard() {
  const categories = ["language", "framework", "tool", "domain"] as const;

  // Build marquee items
  const marqueeItems = SKILLS.map((s) => s.name);
  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <div className="glass-card p-6 sm:p-8 h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">Skills & Expertise</h2>
      </div>

      {/* Scrolling marquee */}
      <div className="relative overflow-hidden mb-6 py-2">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card to-transparent z-10" />
        <div className="flex gap-3 animate-marquee whitespace-nowrap">
          {doubled.map((skill, i) => (
            <span
              key={i}
              className="inline-flex px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-foreground/60 border border-white/8"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Categorized grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const style = CATEGORY_STYLES[cat];
          const skills = SKILLS.filter((s) => s.category === cat);
          return (
            <div key={cat}>
              <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s.name}
                    className={`text-xs px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

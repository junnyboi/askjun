/**
 * ChatSkillsChart — Visual skills grid rendered inside the chat
 * Generative UI component triggered when user asks about tech stack/skills
 */

import { motion } from "framer-motion";
import { SKILLS } from "@/data/portfolio";

const CATEGORY_LABELS: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
  domain: "Domains",
};

const CATEGORY_COLORS: Record<string, string> = {
  language: "#E60000",
  framework: "#3B82F6",
  tool: "#10B981",
  domain: "#F59E0B",
};

export function ChatSkillsChart() {
  const grouped = SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="my-4 border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-card border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Tech Stack</span>
      </div>
      <div className="p-4 space-y-3">
        {Object.entries(grouped).map(([category, skills], catIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category] }}
              />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: catIndex * 0.1 + i * 0.03, duration: 0.2 }}
                  className="text-[11px] font-mono px-2 py-0.5 rounded border border-border text-foreground/80 hover:border-accent/50 hover:text-accent transition-colors"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

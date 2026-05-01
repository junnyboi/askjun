import { SKILLS } from "@/data/portfolio";

const CATEGORY_LABELS: Record<string, string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Infrastructure",
  domain: "Domains",
};

export default function SkillsSection() {
  const categories = ["language", "framework", "tool", "domain"] as const;

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Skills</h2>
        <p className="text-sm text-muted-foreground font-mono mb-10">Technical proficiencies</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => {
            const skills = SKILLS.filter((s) => s.category === cat);
            return (
              <div key={cat}>
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s.name}
                      className="text-xs font-mono px-2.5 py-1 border border-border text-foreground hover:border-accent hover:text-accent transition-colors"
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
    </section>
  );
}

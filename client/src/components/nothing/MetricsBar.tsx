import { HIGHLIGHTS } from "@/data/portfolio";

export default function MetricsBar() {
  return (
    <section className="border-y border-border py-6 sm:py-8">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 sm:gap-0">
          {HIGHLIGHTS.slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="font-mono text-xl sm:text-2xl font-bold text-foreground">
                {h.metric}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {h.label}
              </span>
              {i < 4 && (
                <span className="hidden sm:inline text-border ml-4">|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { PROFILE } from "@/data/portfolio";

export default function ContactSection() {
  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Contact</h2>
        <p className="text-sm text-muted-foreground font-mono mb-10">Let's build something together</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <a
            href={`mailto:${PROFILE.email}`}
            className="text-sm font-mono text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
          >
            {PROFILE.email}
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
          >
            linkedin.com/in/junboh
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
          >
            github.com/junnyboi
          </a>
        </div>

        <p className="text-xs text-muted-foreground mt-8 font-mono">
          Singapore · Open to opportunities
        </p>
      </div>
    </section>
  );
}

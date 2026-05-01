import { PROFILE } from "@/data/portfolio";

const PROFILE_PHOTO = "/manus-storage/jun-profile-meta_7e9e3d09.jpg";

interface HeroSectionProps {
  onOpenChat: () => void;
}

export default function HeroSection({ onOpenChat }: HeroSectionProps) {
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
          {/* Profile photo */}
          <div className="shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 overflow-hidden border border-border">
              <img
                src={PROFILE_PHOTO}
                alt="Boh Ze Jun"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 bg-accent rounded-full" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Available for hire
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
              {PROFILE.name}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground font-light mb-6 max-w-xl">
              {PROFILE.title}
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {PROFILE.tagline}. Currently at Meta (Manus AI), previously HoYoverse, TikTok, and Bank of Singapore.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenChat}
                className="px-5 py-2.5 text-sm font-mono bg-foreground text-background hover:opacity-80 transition-opacity active:scale-[0.97]"
              >
                Ask AI about me
              </button>
              <a
                href="/manus-storage/JunBoh-CV-2026_adffff38.pdf"
                download="BohZeJun_CV_2026.pdf"
                className="px-5 py-2.5 text-sm font-mono border border-border text-foreground hover:border-foreground transition-colors active:scale-[0.97]"
              >
                Download CV
              </a>
              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 text-sm font-mono border border-border text-foreground hover:border-foreground transition-colors active:scale-[0.97]"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

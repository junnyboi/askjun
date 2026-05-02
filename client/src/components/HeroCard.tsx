/*
 * HeroCard — Glass Atelier Design
 * Large bento tile with profile info, name, title, and summary.
 * Uses the generated hero gradient background.
 */

import { PROFILE } from "@/data/portfolio";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/hero-gradient-bg-5LZjwXJwUMjzCQyZt9RHtg.webp";
const AVATAR_RING = "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/profile-avatar-bg-WFZVHJYsQ2aAxEPUDXqKSf.webp";
const PROFILE_PHOTO = "/manus-storage/jun-profile-meta_7e9e3d09.jpg";

export default function HeroCard() {
  return (
    <div className="glass-card relative overflow-hidden h-full min-h-[320px] lg:min-h-[360px]">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between h-full">
        <div className="flex items-start gap-6">
          {/* Avatar with glowing ring */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden relative">
              <img
                src={AVATAR_RING}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img
                src={PROFILE_PHOTO}
                alt="Jun Boh"
                className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary/80 tracking-wider uppercase">
                Available for hire
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
              {PROFILE.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-1 font-medium">
              {PROFILE.title}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-2xl">
            {PROFILE.tagline}. Currently at{" "}
            <span className="text-primary font-medium">Meta</span>, previously{" "}
            <span className="text-foreground/90">HoYoverse</span>,{" "}
            <span className="text-foreground/90">TikTok</span>, and{" "}
            <span className="text-foreground/90">Bank of Singapore</span>.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {PROFILE.location}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              7+ years experience
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

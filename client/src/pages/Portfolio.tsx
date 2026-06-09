/*
 * ============================================================================
 * Portfolio Page — Dedicated showcase with sidebar nav + collapsible sections
 * Nothing Design Language. Sticky sidebar on desktop, breadcrumbs at top.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { EXPERIENCES, SKILLS, EDUCATION, PROFILE, HIGHLIGHTS } from "@/data/portfolio";
import ThemeToggle from "@/components/ThemeToggle";
import FontScaleToggle from "@/components/FontScaleToggle";
import { analytics } from "@/lib/analytics";

interface FeaturedProject {
  title: string;
  description: string;
  tags: string[];
  tech: string[];
  image: string;
  link: string;
  github: string;
  visibility: "public" | "private";
  liveDemo?: boolean;
}

const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    title: "askJun AI Portfolio",
    description: "This site — chat-first AI portfolio powered by GPT-4",
    tags: ["AI", "Web"],
    tech: ["React", "TypeScript", "GPT-4"],
    image: "/thumbnails/askjun.webp",
    link: "https://askjun.org",
    github: "https://github.com/junnyboi/askjun",
    visibility: "public",
    liveDemo: true,
  },
  {
    title: "Swipe",
    description: "Image aggregation pinboard — save, organize, and discover visual inspiration",
    tags: ["Web", "Creative"],
    tech: ["TypeScript", "React", "Node.js"],
    image: "/thumbnails/swipe.webp",
    link: "https://swipe.manus.space",
    github: "https://github.com/junnyboi/swipe",
    visibility: "public",
    liveDemo: true,
  },
  {
    title: "Trident",
    description: "Swiss Army Knife for macOS productivity — menu bar app with floating panels",
    tags: ["Productivity", "Swift"],
    tech: ["Swift", "macOS", "AppKit"],
    image: "/thumbnails/trident.webp",
    link: "https://github.com/junnyboi/trident",
    github: "https://github.com/junnyboi/trident",
    visibility: "private",
  },
  {
    title: "Trident Mobile",
    description: "Android companion app for Trident with cloud sync via Supabase",
    tags: ["Mobile", "Kotlin"],
    tech: ["Kotlin", "Android", "Supabase"],
    image: "/thumbnails/trident-mobile.webp",
    link: "https://github.com/junnyboi/trident-mobile",
    github: "https://github.com/junnyboi/trident-mobile",
    visibility: "private",
  },
  {
    title: "Mijun",
    description: "Cinematic tea & preserved flower e-commerce platform",
    tags: ["E-commerce", "Creative"],
    tech: ["TypeScript", "React"],
    image: "/thumbnails/mijun.webp",
    link: "https://mijun.co",
    github: "https://github.com/junnyboi/mijun",
    visibility: "private",
    liveDemo: true,
  },
  {
    title: "Housewarmer",
    description: "Scroll-animated housewarming invitation with parallax effects and RSVP",
    tags: ["Creative", "Web"],
    tech: ["TypeScript", "React", "GSAP"],
    image: "/thumbnails/housewarmer.webp",
    link: "https://mijun-housewarming.manus.space/",
    github: "https://github.com/junnyboi/housewarmer",
    visibility: "private",
    liveDemo: true,
  },
];

const SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "gamedev", label: "Game Dev" },
  { id: "side-projects", label: "Side Projects" },
  { id: "education", label: "Education" },
  { id: "awards", label: "Awards" },
  { id: "speaking", label: "Speaking" },
  { id: "contact", label: "Contact" },
];

function CollapsibleSection({ id, title, defaultOpen = true, children }: { id: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className="mb-10 scroll-mt-16">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-full" />
          {title}
        </h2>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-muted-foreground group-hover:text-foreground transition-all duration-200 ${isOpen ? "" : "-rotate-90"}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("experience");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header className="sticky top-0 shrink-0 border-b border-border px-4 sm:px-6 h-12 flex items-center justify-between z-20 bg-card backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-mono text-sm text-foreground hover:opacity-70 transition-opacity">
            ask<span className="text-accent">Jun</span>
          </Link>
          {/* Breadcrumbs */}
          <span className="text-xs font-mono text-muted-foreground">
            / <span className="text-foreground">Portfolio</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
            Chat with AI
          </Link>
          <a
            href="/assets/JunBoh-CV-2026.pdf"
            download="JunBoh_CV_2026.pdf"
            onClick={() => analytics.cvDownload()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download CV
          </a>
          <FontScaleToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex-1 flex relative z-10">
        {/* Left-side TOC navigation — always visible on md+, hidden on mobile */}
        <aside className="hidden md:block w-44 lg:w-48 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-border/50 py-8 px-3">
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-3 px-2">Contents</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  const el = document.getElementById(id);
                  if (el) {
                    const offset = 70; // header (48px) + padding
                    const top = el.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }}
                className={`block w-full text-left text-xs font-mono py-1.5 px-2 rounded transition-colors ${
                  activeSection === id
                    ? "text-accent bg-accent/5 border-l-2 border-accent"
                    : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 leading-relaxed">

          {/* Profile header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 overflow-hidden border border-border rounded-full">
              <img src="/profile-thumb.webp" alt="Jun" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{PROFILE.name}</h1>
              <p className="text-xs text-muted-foreground">{PROFILE.title}</p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 mb-10">
            {HIGHLIGHTS.slice(0, 4).map((h, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-mono text-sm font-bold text-foreground">{h.metric}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{h.label}</span>
              </div>
            ))}
          </div>

          {/* Experience */}
          <CollapsibleSection id="experience" title="Experience">
            <div className="space-y-0">
              {EXPERIENCES.map((exp, i) => (
                <div key={i} className="py-4 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{exp.company}</h3>
                      <p className="text-xs text-muted-foreground">{exp.role} · {exp.location}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{exp.period}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground leading-relaxed pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-accent">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Skills */}
          <CollapsibleSection id="skills" title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => (
                <span key={s.name} className="text-[11px] font-mono px-2 py-0.5 border border-border text-muted-foreground rounded-md hover:border-accent/50 hover:text-accent transition-colors">
                  {s.name}
                </span>
              ))}
            </div>
          </CollapsibleSection>

          {/* Featured Projects */}
          <CollapsibleSection id="projects" title="Featured Projects">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURED_PROJECTS.map((project, i) => (
                <div key={i} className="group border border-border rounded-lg overflow-hidden hover:border-accent/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 ease-out">
                  <a
                    href={project.liveDemo ? project.link : project.github || project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-video overflow-hidden bg-muted relative cursor-pointer block"
                  >
                    {/* Blur-up skeleton placeholder */}
                    <div className="absolute inset-0 bg-muted animate-pulse" />
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out relative z-10"
                      onLoad={(e) => (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add('hidden')}
                    />
                    {project.liveDemo && (
                      <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 bg-green-500 text-white rounded z-20">
                        Live Demo
                      </span>
                    )}
                  </a>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        <h3 className="text-xs font-semibold text-foreground hover:text-accent transition-colors">{project.title}</h3>
                      </a>
                      <a href={project.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground hover:scale-125 hover:rotate-12 transition-all duration-200 ease-out">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {project.tags.map((tag, j) => (
                        <span key={j} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${tag === "AI" ? "border border-accent/50 text-accent" : "border border-border text-muted-foreground"}`}>{tag}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.tech.map((t, j) => (
                        <span key={j} className="text-[9px] font-mono px-1.5 py-0.5 bg-muted text-muted-foreground rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Game Dev */}
          <CollapsibleSection id="gamedev" title="Game Dev">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "TeaPets (2D)", description: "2D pixel-art bullet hell roguelike", tags: ["PixiJS", "TypeScript"], link: "https://teapets.mircovm.com/", visibility: "public" as const, liveDemo: true },
                { title: "TeaPets 3D", description: "Browser-based 3D roguelike with a cute slime", tags: ["Three.js", "TypeScript"], link: "https://teapets-3d.mircovm.com/", visibility: "public" as const, liveDemo: true },
                { title: "Deep in Abyss", description: "Dive deep into the abyss in this browser adventure", tags: ["Web", "Adventure"], link: "https://deep-in-abyss.manus.space/", visibility: "public" as const, liveDemo: true },
                { title: "Deepforge", description: "Forge your destiny in this browser-based RPG", tags: ["Web", "RPG"], link: "https://deepforge.manus.space/", visibility: "public" as const, liveDemo: true },
                { title: "Throne of Beasts", description: "Fantasy strategy game with beast companions", tags: ["Web", "Strategy"], link: "https://throne-of-beasts.manus.space/", visibility: "public" as const, liveDemo: true },
                { title: "Aegis TD", description: "Tower defense game with elemental mechanics", tags: ["Web", "Tower Defense"], link: "https://aegis-td.manus.space/", visibility: "public" as const, liveDemo: true },
                { title: "Pitmaster", description: "BBQ management idle tycoon game", tags: ["Web", "Idle"], link: "https://pitmaster.manus.space/", visibility: "public" as const, liveDemo: true },
                { title: "Gobbo", description: "Unity 2D game — a couple's passion project", tags: ["Unity", "C#"], link: "https://github.com/junnyboi/Gobbo-2D", visibility: "public" as const },
              ].map((project, i) => (
                <a key={i} href={project.link} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 border border-border rounded-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{project.liveDemo ? <span className="text-green-500">●</span> : "↗"}</span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">{project.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tags.map((tag, j) => (
                        <span key={j} className="text-[8px] font-mono px-1 py-0.5 rounded border border-border text-muted-foreground/60">{tag}</span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CollapsibleSection>

          {/* Side Projects */}
          <CollapsibleSection id="side-projects" title="Side Projects">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "IsleProject", description: "NFT island community project", tags: ["Web3", "Creative"], link: "https://github.com/junnyboi/IsleProjectNFT", visibility: "private" as const },
                { title: "Booking Bot", description: "Automated booking system", tags: ["Automation"], link: "https://github.com/junnyboi/booking-bot", visibility: "private" as const },
                { title: "Polygen", description: "Procedurally generated low poly asset collection", tags: ["Creative", "3D"], link: "https://github.com/junnyboi/polygen", visibility: "private" as const },
                { title: "Finance Tracker", description: "Ionic + React mobile finance app", tags: ["Mobile"], link: "https://github.com/junnyboi/tony-stocks", visibility: "public" as const },
              ].map((project, i) => (
                <a key={i} href={project.link} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 border border-border rounded-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{project.visibility === "private" ? "🔒" : "↗"}</span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">{project.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tags.map((tag, j) => (
                        <span key={j} className="text-[8px] font-mono px-1 py-0.5 rounded border border-border text-muted-foreground/60">{tag}</span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CollapsibleSection>

          {/* Education */}
          <CollapsibleSection id="education" title="Education">
            <div className="space-y-0">
              {EDUCATION.map((edu, i) => (
                <div key={i} className="py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{edu.school}</h3>
                      <p className="text-xs text-muted-foreground">{edu.degree}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{edu.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Awards */}
          <CollapsibleSection id="awards" title="Awards & Recognition">
            <div className="space-y-0">
              {[
                {
                  title: "ByteDance Rockstar Employee Award",
                  org: "ByteDance / TikTok",
                  year: "2021",
                  description: "Dedicated Pioneer Team Award — presented to the Global Payment FE SG Team for exemplary contributions to the payments infrastructure.",
                },
                {
                  title: "CEO Recognition Award — Innovation Category",
                  org: "Bank of Singapore",
                  year: "2020",
                  description: "Recognized for outstanding contribution as a member of the PitchPerfect Team, an Innovation Challenge idea that saved 3,680 hours globally. Signed by CEO Bahren Shaari.",
                },
                {
                  title: "Innovation Challenge — Just Do It Award",
                  org: "Bank of Singapore",
                  year: "2020",
                  description: "Awarded for \"SuperSolver\" — a genetic-algorithm portfolio optimizer prototype that led to the formation of an in-house roboadvisory team.",
                },
                {
                  title: "Innovation Challenge — Silver Award",
                  org: "Bank of Singapore",
                  year: "2020",
                  description: "Awarded for \"Pitchbook 4.0\" — an RM pitch tool that streamlined client presentations, delivering $1.5M in annual savings.",
                },
              ].map((award, i) => (
                <div key={i} className="py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{award.title}</h3>
                      <p className="text-xs text-muted-foreground">{award.org}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{award.year}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{award.description}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Speaking */}
          <CollapsibleSection id="speaking" title="Speaking">
            <div className="space-y-0">
              <div className="py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Keynote Speaker — SINFO 2024</h3>
                    <p className="text-xs text-muted-foreground">Instituto Superior Técnico · Lisbon, Portugal</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">2024</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Delivered a keynote at SINFO, one of Portugal's largest student-organized tech conferences. Shared insights on building high-scale frontend systems and payment architectures at HoYoverse, covering challenges of serving 8M daily active users across 100+ countries.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Contact */}
          <CollapsibleSection id="contact" title="Contact">
            <div className="flex flex-wrap gap-4 text-xs font-mono items-center">
              <a href={`mailto:${PROFILE.email}`} className="text-muted-foreground hover:text-accent transition-colors">{PROFILE.email}</a>
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="tel:+6582335937" className="text-muted-foreground hover:text-accent transition-colors">+65 8233 5937</a>
              <a
                href="https://wa.me/6582335937"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </CollapsibleSection>

        </main>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden shrink-0 border-t border-border bg-card px-4 py-2.5 flex items-center justify-between relative z-10">
        <Link href="/" className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Chat with AI</Link>
        <a href={`mailto:${PROFILE.email}`} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Email</a>
        <a href="/assets/JunBoh-CV-2026.pdf" download="JunBoh_CV_2026.pdf" onClick={() => analytics.cvDownload()} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Download CV</a>
      </div>

      {/* Mobile section nav FAB — visible only on < md */}
      <div className="md:hidden fixed bottom-20 left-4 z-30">
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          aria-label="Jump to section"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <AnimatePresence>
          {showMobileNav && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-12 left-0 bg-card border border-border rounded-lg shadow-xl py-2 px-1 min-w-[140px]"
            >
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) {
                      const offset = 60;
                      const top = el.getBoundingClientRect().top + window.scrollY - offset;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                    setShowMobileNav(false);
                  }}
                  className={`block w-full text-left text-xs font-mono py-1.5 px-3 rounded transition-colors ${
                    activeSection === id
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back to top FAB */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-30 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
            aria-label="Back to top"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </motion.button>
        )}
      </AnimatePresence>


    </div>
  );
}

/*
 * ============================================================================
 * Portfolio Page — Dedicated showcase with sidebar nav + collapsible sections
 * Nothing Design Language. Sticky sidebar on desktop, breadcrumbs at top.
 * ============================================================================
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { EXPERIENCES, SKILLS, EDUCATION, PROFILE, HIGHLIGHTS } from "@/data/portfolio";
import ThemeToggle from "@/components/ThemeToggle";
import { analytics } from "@/lib/analytics";

const SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "side-projects", label: "Side Projects" },
  { id: "education", label: "Education" },
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
      {isOpen && <div>{children}</div>}
    </section>
  );
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("experience");

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
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            / <span className="text-foreground">Portfolio</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
            Chat with AI
          </Link>
          <a
            href="/manus-storage/JunBoh-CV-2026_adffff38.pdf"
            download="BohZeJun_CV_2026.pdf"
            onClick={() => analytics.cvDownload()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download CV
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex-1 flex relative z-10">
        {/* Sticky sidebar nav — desktop only */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-border/50 py-8 px-4">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`block text-xs font-mono py-1.5 px-2 rounded transition-colors ${
                  activeSection === id
                    ? "text-accent bg-accent/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

          {/* Profile header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 overflow-hidden border border-border rounded-full">
              <img src="/manus-storage/jun-profile-meta_7e9e3d09.jpg" alt="Jun" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{PROFILE.name}</h1>
              <p className="text-xs text-muted-foreground">{PROFILE.title}</p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-4 mb-10">
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
              {[
                {
                  title: "Trident",
                  description: "Swiss Army Knife for macOS productivity — menu bar app with floating panels",
                  tags: ["Productivity", "Swift"],
                  tech: ["Swift", "macOS", "AppKit"],
                  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/proj-trident-4UQUxwxKKTV6TYCvCfcF7S.webp",
                  link: "https://github.com/junnyboi/trident",
                  visibility: "private" as const,
                },
                {
                  title: "Mandai Smoke Co.",
                  description: "Idle tycoon game — build your BBQ empire with PixiJS",
                  tags: ["Game Dev"],
                  tech: ["TypeScript", "PixiJS"],
                  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/proj-mandaismoker-Z7mrLsNuAELTcHTqfKCJvi.webp",
                  link: "https://github.com/junnyboi/mandaismoker",
                  visibility: "private" as const,
                },
                {
                  title: "Mijun",
                  description: "Cinematic tea & preserved flower e-commerce platform",
                  tags: ["E-commerce", "Creative"],
                  tech: ["TypeScript", "React"],
                  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/proj-mijun-FgEyiENgotiCCaN8nCrMFX.webp",
                  link: "https://github.com/junnyboi/mijun",
                  visibility: "private" as const,
                },
                {
                  title: "askJun AI Portfolio",
                  description: "This site — chat-first AI portfolio powered by DeepSeek",
                  tags: ["AI", "Web"],
                  tech: ["React", "TypeScript", "DeepSeek"],
                  image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/proj-askjun-meta-cCqB22TaRGXLmgfGqmaa7h.webp",
                  link: "https://askjun.org",
                  visibility: "public" as const,
                },
              ].map((project, i) => (
                <a key={i} href={project.link} target="_blank" rel="noopener noreferrer"
                  className="group border border-border rounded-lg overflow-hidden hover:border-accent/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 ease-out"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-semibold text-foreground">{project.title}</h3>
                      <span className="text-[9px] font-mono text-muted-foreground">{project.visibility === "private" ? "🔒" : "↗"}</span>
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
                </a>
              ))}
            </div>
          </CollapsibleSection>

          {/* Side Projects */}
          <CollapsibleSection id="side-projects" title="Side Projects">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "TeaPets 3D", description: "Browser-based roguelike with cute slime character", tags: ["Game Dev"], link: "https://github.com/junnyboi/teapets-3d", visibility: "private" as const },
                { title: "Housewarmer", description: "Scroll-animated housewarming invitation", tags: ["Creative", "Web"], link: "https://github.com/junnyboi/housewarmer", visibility: "private" as const },
                { title: "Booking Bot", description: "Automated booking system", tags: ["Automation"], link: "https://github.com/junnyboi/booking-bot", visibility: "private" as const },
                { title: "Polygen", description: "Procedurally generated low poly asset collection", tags: ["Creative", "Game Dev"], link: "https://github.com/junnyboi/polygen", visibility: "private" as const },
                { title: "Gobbo 2D", description: "Unity 2D game — a couple's passion project", tags: ["Game Dev"], link: "https://github.com/junnyboi/Gobbo-2D", visibility: "public" as const },
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
                        <span key={j} className={`text-[8px] font-mono px-1 py-0.5 rounded ${tag === "AI" ? "border border-accent/50 text-accent" : "border border-border text-muted-foreground/60"}`}>{tag}</span>
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

          {/* Contact */}
          <CollapsibleSection id="contact" title="Contact">
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <a href={`mailto:${PROFILE.email}`} className="text-muted-foreground hover:text-accent transition-colors">{PROFILE.email}</a>
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">LinkedIn</a>
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">GitHub</a>
            </div>
          </CollapsibleSection>

        </main>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden shrink-0 border-t border-border bg-card px-4 py-2.5 flex items-center justify-between relative z-10">
        <Link href="/" className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Chat with AI</Link>
        <a href={`mailto:${PROFILE.email}`} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Email</a>
        <a href="/manus-storage/JunBoh-CV-2026_adffff38.pdf" download="BohZeJun_CV_2026.pdf" onClick={() => analytics.cvDownload()} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Download CV</a>
      </div>
    </div>
  );
}

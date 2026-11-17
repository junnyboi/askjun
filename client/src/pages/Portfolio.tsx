/*
 * ============================================================================
 * Portfolio Page — the traditional view of Jun's career.
 * Sticky contents list on desktop, collapsible sections, and the same avatar,
 * metric tiles and CV button as the home page. Text follows the font size toggle.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowUp, Github, Linkedin, Mail, Menu, MessageCircle, Phone } from "lucide-react";
import { AWARDS, EDUCATION, EXPERIENCES, HEADLINE_HIGHLIGHTS, PROFILE, SKILLS, TALKS } from "@/data/portfolio";
import { FEATURED_PROJECTS, GAME_PROJECTS, SIDE_PROJECTS } from "@/data/projects";
import { DownloadCVLink } from "@/components/DownloadCVLink";
import FontScaleToggle from "@/components/FontScaleToggle";
import { JunAvatar } from "@/components/JunAvatar";
import { MetricTile } from "@/components/MetricTile";
import ThemeToggle from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { ExperienceItem } from "@/components/portfolio/ExperienceItem";
import { FeaturedProjectCard } from "@/components/portfolio/FeaturedProjectCard";
import { LinkedProjectCard } from "@/components/portfolio/LinkedProjectCard";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { cn } from "@/lib/utils";

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

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

// The long project lists start closed so the page stays scannable
const INITIALLY_CLOSED = ["gamedev", "side-projects"];

const SKILL_GROUPS = [
  { category: "language", label: "Languages" },
  { category: "framework", label: "Frameworks" },
  { category: "tool", label: "Tools" },
  { category: "domain", label: "Domains" },
];

const CONTACT_LINK_CLASSES =
  "scaled-sm inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 font-mono text-foreground transition-colors hover:border-foreground";
const ENTRY_CLASSES = "border-b border-border py-4 first:pt-0 last:border-0 last:pb-0";
const FAB_CLASSES =
  "flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95";

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("experience");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map(({ id }) => [id, !INITIALLY_CLOSED.includes(id)]))
  );

  const toggleSection = (id: string) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // Jumping to a section opens it first, so the reader never lands on a closed heading
  const jumpToSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    setShowMobileNav(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
          if (entry.isIntersecting) setActiveSection(entry.target.id);
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
    <div className="relative flex min-h-screen flex-col">
      {/* Background grain */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]" style={{ backgroundImage: GRAIN_TEXTURE }} />

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark className="text-xl" />
          <span className="font-mono text-[13px] text-muted-foreground">
            / <span className="text-foreground">Portfolio</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link href="/" className="hidden font-mono text-[13px] text-foreground underline-offset-4 hover:underline sm:inline">
            Chat with askJun
          </Link>
          <DownloadCVLink variant="outline" className="hidden sm:inline-flex" />
          <FontScaleToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main layout: contents list + content */}
      <div className="relative z-10 flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-48 shrink-0 overflow-y-auto border-r border-border px-3 py-8 md:block">
          <p className="mb-3 px-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">Contents</p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => jumpToSection(id)}
                className={cn(
                  "block w-full rounded-r border-l-2 px-2 py-2 text-left font-mono text-[13px] transition-colors",
                  activeSection === id
                    ? "border-accent bg-muted font-bold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 px-4 sm:px-6">
          <main className="mx-auto w-full max-w-3xl pb-16 pt-8 sm:pt-12">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <JunAvatar size={80} className="rounded-xl border border-border" />
              <div className="min-w-0">
                <h1 className="scaled-lg text-foreground">{PROFILE.name}</h1>
                <p className="scaled-sm mt-0.5 text-muted-foreground">{PROFILE.title}</p>
                <p className="scaled-xs mt-1.5 flex items-center gap-2 font-mono text-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" aria-hidden />
                  Available for hire · {PROFILE.location}
                </p>
              </div>
            </div>

            {/* Key metrics */}
            <div className="mb-8 mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HEADLINE_HIGHLIGHTS.map((h) => (
                <MetricTile key={h.metric} metric={h.metric} label={h.label} />
              ))}
            </div>

            <PortfolioSection id="experience" title="Experience" isOpen={openSections.experience} onToggle={() => toggleSection("experience")}>
              {EXPERIENCES.map((exp) => (
                <ExperienceItem key={exp.company} experience={exp} />
              ))}
            </PortfolioSection>

            <PortfolioSection id="skills" title="Skills" isOpen={openSections.skills} onToggle={() => toggleSection("skills")}>
              <div className="space-y-4">
                {SKILL_GROUPS.map(({ category, label }) => (
                  <div key={category}>
                    <p className="scaled-xs mb-2 font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.filter((s) => s.category === category).map((s) => (
                        <span key={s.name} className="scaled-sm rounded-md border border-border px-2.5 py-1 font-mono text-foreground">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PortfolioSection>

            <PortfolioSection id="projects" title="Featured Projects" isOpen={openSections.projects} onToggle={() => toggleSection("projects")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {FEATURED_PROJECTS.map((project) => (
                  <FeaturedProjectCard key={project.title} project={project} />
                ))}
              </div>
            </PortfolioSection>

            <PortfolioSection id="gamedev" title="Game Dev" isOpen={openSections.gamedev} onToggle={() => toggleSection("gamedev")}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GAME_PROJECTS.map((project) => (
                  <LinkedProjectCard key={project.title} project={project} />
                ))}
              </div>
            </PortfolioSection>

            <PortfolioSection id="side-projects" title="Side Projects" isOpen={openSections["side-projects"]} onToggle={() => toggleSection("side-projects")}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SIDE_PROJECTS.map((project) => (
                  <LinkedProjectCard key={project.title} project={project} />
                ))}
              </div>
            </PortfolioSection>

            <PortfolioSection id="education" title="Education" isOpen={openSections.education} onToggle={() => toggleSection("education")}>
              {EDUCATION.map((edu) => (
                <div key={edu.school} className={ENTRY_CLASSES}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="scaled-heading font-semibold text-foreground">{edu.school}</h3>
                    <span className="scaled-xs whitespace-nowrap font-mono text-muted-foreground">{edu.year}</span>
                  </div>
                  <p className="scaled-sm mt-0.5 text-muted-foreground">{edu.degree}</p>
                </div>
              ))}
            </PortfolioSection>

            <PortfolioSection id="awards" title="Awards & Recognition" isOpen={openSections.awards} onToggle={() => toggleSection("awards")}>
              {AWARDS.map((award) => (
                <div key={award.title} className={ENTRY_CLASSES}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="scaled-heading font-semibold text-foreground">{award.title}</h3>
                    <span className="scaled-xs whitespace-nowrap font-mono text-muted-foreground">{award.year}</span>
                  </div>
                  <p className="scaled-sm mt-0.5 text-muted-foreground">{award.org}</p>
                  <p className="scaled-body mt-2 text-foreground">{award.description}</p>
                </div>
              ))}
            </PortfolioSection>

            <PortfolioSection id="speaking" title="Speaking" isOpen={openSections.speaking} onToggle={() => toggleSection("speaking")}>
              {TALKS.map((talk) => (
                <div key={talk.title} className={ENTRY_CLASSES}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="scaled-heading font-semibold text-foreground">{talk.title}</h3>
                    <span className="scaled-xs whitespace-nowrap font-mono text-muted-foreground">{talk.year}</span>
                  </div>
                  <p className="scaled-sm mt-0.5 text-muted-foreground">{talk.venue}</p>
                  <p className="scaled-body mt-2 text-foreground">{talk.description}</p>
                </div>
              ))}
            </PortfolioSection>

            <PortfolioSection id="contact" title="Contact" isOpen={openSections.contact} onToggle={() => toggleSection("contact")}>
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${PROFILE.email}`} className={CONTACT_LINK_CLASSES}>
                  <Mail size={15} aria-hidden />
                  {PROFILE.email}
                </a>
                <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>
                  <Linkedin size={15} aria-hidden />
                  LinkedIn
                </a>
                <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>
                  <Github size={15} aria-hidden />
                  GitHub
                </a>
                <a href="tel:+6582335937" className={CONTACT_LINK_CLASSES}>
                  <Phone size={15} aria-hidden />
                  +65 8233 5937
                </a>
                <a href="https://wa.me/6582335937" target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>
                  <MessageCircle size={15} aria-hidden />
                  WhatsApp
                </a>
              </div>
            </PortfolioSection>
          </main>
        </div>
      </div>

      {/* Small screens: CV and chat stay one tap away */}
      <div className="sticky bottom-0 z-20 flex shrink-0 gap-3 border-t border-border bg-background px-4 py-3 sm:hidden">
        <DownloadCVLink variant="primary" className="flex-1" />
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-foreground px-5 font-mono text-sm text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
        >
          Chat
        </Link>
      </div>

      {/* Section menu — small screens only */}
      <div className="fixed bottom-24 left-4 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label="Jump to section"
          aria-expanded={showMobileNav}
          className={FAB_CLASSES}
        >
          <Menu size={18} aria-hidden />
        </button>
        <AnimatePresence>
          {showMobileNav && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-14 left-0 min-w-[168px] rounded-lg border border-border bg-background px-1 py-2 shadow-xl"
            >
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => jumpToSection(id)}
                  className={cn(
                    "block w-full rounded px-3 py-2 text-left font-mono text-[13px] transition-colors",
                    activeSection === id ? "bg-muted font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className={cn(FAB_CLASSES, "fixed bottom-24 right-4 z-30 sm:bottom-8 sm:right-8")}
          >
            <ArrowUp size={18} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

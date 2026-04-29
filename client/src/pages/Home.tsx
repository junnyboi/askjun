/*
 * ============================================================================
 * askJun Home — Glass Atelier Design
 * Bento grid layout with floating glass cards, ambient gradient orbs,
 * and a conversation-first AI chat interface.
 * ============================================================================
 */

import { useState } from "react";
import { motion } from "framer-motion";
import HeroCard from "@/components/HeroCard";
import ChatCard from "@/components/ChatCard";
import ExperienceCard from "@/components/ExperienceCard";
import SkillsCard from "@/components/SkillsCard";
import HighlightsCard from "@/components/HighlightsCard";
import ContactCard from "@/components/ContactCard";
import ChatPanel from "@/components/ChatPanel";
import SkylineFooter from "@/components/SkylineFooter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full opacity-15 animate-float-slow-reverse"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 right-1/3 w-[400px] h-[400px] rounded-full opacity-10 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm font-mono">J</span>
            </div>
            <span className="text-foreground/80 font-medium text-sm tracking-wide">
              ask<span className="text-primary font-semibold">Jun</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <button
              onClick={() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-foreground transition-colors"
            >
              Experience
            </button>
            <button
              onClick={() => document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-foreground transition-colors"
            >
              Skills
            </button>
            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-foreground transition-colors"
            >
              Contact
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium"
            >
              Chat with AI
            </button>
          </nav>
        </div>
      </header>

      {/* Main bento grid */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero — spans 2 columns */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <HeroCard />
          </motion.div>

          {/* Chat CTA */}
          <motion.div variants={cardVariants}>
            <ChatCard onOpenChat={() => setChatOpen(true)} />
          </motion.div>

          {/* Highlights / Stats */}
          <motion.div variants={cardVariants}>
            <HighlightsCard />
          </motion.div>

          {/* Experience — spans 2 columns */}
          <motion.div variants={cardVariants} className="md:col-span-2" id="experience">
            <ExperienceCard />
          </motion.div>

          {/* Skills */}
          <motion.div variants={cardVariants} className="md:col-span-2 lg:col-span-2" id="skills">
            <SkillsCard />
          </motion.div>

          {/* Contact */}
          <motion.div variants={cardVariants} id="contact">
            <ContactCard />
          </motion.div>
        </motion.div>
      </main>

      {/* Singapore skyline footer */}
      <SkylineFooter />

      {/* Chat panel overlay */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Mobile FAB for chat */}
      {!chatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200, damping: 15 }}
          onClick={() => setChatOpen(true)}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-violet-500 shadow-lg shadow-orange-500/25 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

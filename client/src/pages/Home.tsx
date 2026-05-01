/*
 * ============================================================================
 * askJun Home — Nothing Design Philosophy
 * Vertical scroll, modular sections, stark monochrome, industrial minimalism.
 * ============================================================================
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/nothing/Header";
import HeroSection from "@/components/nothing/HeroSection";
import MetricsBar from "@/components/nothing/MetricsBar";
import ExperienceSection from "@/components/nothing/ExperienceSection";
import SkillsSection from "@/components/nothing/SkillsSection";
import CaseStudies from "@/components/nothing/CaseStudies";
import ContactSection from "@/components/nothing/ContactSection";
import Footer from "@/components/nothing/Footer";
import ChatPanel from "@/components/ChatPanel";
import LoadingOverlay from "@/components/nothing/LoadingOverlay";

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <LoadingOverlay />
      <div className="min-h-screen flex flex-col">
        <Header onOpenChat={() => setChatOpen(true)} />

        <main className="flex-1">
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <HeroSection onOpenChat={() => setChatOpen(true)} />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
            >
              <MetricsBar />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              id="experience"
            >
              <ExperienceSection />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              id="skills"
            >
              <SkillsSection />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              id="projects"
            >
              <CaseStudies />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={sectionVariants}
              id="contact"
            >
              <ContactSection />
            </motion.div>
          </div>
        </main>

        <Footer />

        {/* Chat panel */}
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

        {/* Mobile FAB */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open chat"
            className="sm:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-foreground text-background flex items-center justify-center border border-border transition-transform active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

/*
 * ============================================================================
 * askJun Home — Chat-First + Hybrid Navigation
 * UX-optimized: auto-focus, keyboard shortcuts, persistent contact,
 * browse-traditionally section, typing variation, share button, micro-interactions.
 * ============================================================================
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { CHAT_SUGGESTIONS, PROFILE, HIGHLIGHTS, EXPERIENCES, SKILLS } from "@/data/portfolio";
import ThemeToggle from "@/components/ThemeToggle";
import { getFollowUps } from "@/data/followUps";
import { analytics } from "@/lib/analytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
  showProfileImage?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTraditional, setShowTraditional] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = trpc.chat.send.useMutation();

  const hasMessages = messages.length > 0;
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-focus input on desktop
  useEffect(() => {
    if (window.innerWidth >= 768 && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → focus input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape → reset conversation
      if (e.key === "Escape" && messages.length > 0) {
        setMessages([]);
      }
      // "/" → focus input (only if not already in an input)
      if (e.key === "/" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Typing variation: variable speed with pauses at punctuation
  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, toolUse?: { action: string; status: string }, showProfileImage?: boolean) => {
      let charIndex = 0;
      const baseSpeed = 8;

      const tick = () => {
        const char = fullText[charIndex] || "";
        const isPunctuation = ".!?,;:".includes(char);
        const variation = Math.floor(Math.random() * 4) + 2;
        charIndex += variation;

        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText, toolUse, showProfileImage } : m));
          setIsTyping(false);
          return;
        }

        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText.slice(0, charIndex) } : m));

        // Pause longer at punctuation
        const delay = isPunctuation ? baseSpeed * 6 : baseSpeed + Math.random() * 6 - 3;
        setTimeout(tick, delay);
      };

      setTimeout(tick, baseSpeed);
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;
      analytics.chatMessage(query);

      const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: query };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      try {
        const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
        const result = await chatMutation.mutateAsync({ messages: apiMessages });
        const isToolUse = shouldSimulateToolUse(query);
        if (isToolUse) {
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, toolUse: { action: "Retrieving document...", status: "" } } : m));
          setTimeout(() => simulateStreaming(result.content, assistantMsgId, { action: "Retrieving document...", status: "Done" }), 1000);
        } else {
          simulateStreaming(result.content, assistantMsgId);
        }
      } catch {
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined, response.showProfileImage);
      }
    },
    [input, isTyping, messages, chatMutation, simulateStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Share conversation
  const handleShare = useCallback(() => {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "You" : "askJun"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(transcript);
    analytics.shareConversation();
    alert("Conversation copied to clipboard!");
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle background grain texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Minimal header */}
      <header className="sticky top-0 shrink-0 border-b border-border px-4 sm:px-6 h-12 flex items-center justify-between z-20 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMessages([])}
            className="font-mono text-sm text-foreground hover:opacity-70 transition-opacity active:scale-95"
            aria-label="Reset conversation"
          >
            ask<span className="text-accent">Jun</span>
          </button>
          <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
            · {PROFILE.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Share button — only visible when there are messages */}
          {hasMessages && (
            <button
              onClick={handleShare}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex items-center gap-1"
              aria-label="Share conversation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Share
            </button>
          )}
          <a
            href="/manus-storage/JunBoh-CV-2026_adffff38.pdf"
            download="BohZeJun_CV_2026.pdf"
            onClick={() => analytics.cvDownload()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download CV
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            LinkedIn
          </a>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col relative z-10">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* ============ EMPTY STATE ============ */
            <div className="flex flex-col items-center justify-center px-4 py-6 sm:py-12 min-h-[60vh]">
              {/* Profile identity */}
              <div className="mb-4 sm:mb-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 overflow-hidden border border-border rounded-full">
                  <img
                    src="/manus-storage/jun-profile-meta_7e9e3d09.jpg"
                    alt="Boh Ze Jun"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight mb-0.5">
                  {PROFILE.name}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {PROFILE.title}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <span className="text-[10px] font-mono text-muted-foreground">Available for hire</span>
                </div>
              </div>

              {/* Key metrics — hidden on mobile */}
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-6 mb-8 text-center">
                {HIGHLIGHTS.slice(0, 4).map((h, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="font-mono text-sm font-bold text-foreground">{h.metric}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Prompt text */}
              <p className="text-base sm:text-xl text-muted-foreground text-center max-w-md mb-5 sm:mb-8">
                Ask me anything about Jun's experience, skills, or career.
              </p>

              {/* Centered input */}
              <div className="w-full max-w-xl px-2 sm:px-0">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 border border-border focus-within:border-accent transition-colors px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about Jun..."
                      rows={1}
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none max-h-32 font-mono"
                      style={{ minHeight: "20px" }}
                    />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                    className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-all active:scale-90 rounded-lg"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  </button>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 justify-center">
                  {CHAT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { analytics.chipClick(s); handleSend(s); }}
                      className="text-[11px] sm:text-xs font-mono px-2.5 py-1 sm:px-3 sm:py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all hover:scale-[1.02] rounded-lg"
                    >
                      {s}
                    </button>
                  ))}
                  {CHAT_SUGGESTIONS.slice(3).map((s, i) => (
                    <button
                      key={i + 3}
                      onClick={() => { analytics.chipClick(s); handleSend(s); }}
                      className="hidden sm:inline-block text-xs font-mono px-3 py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all hover:scale-[1.02] rounded-lg"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Browse traditionally toggle */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => { setShowTraditional(!showTraditional); if (!showTraditional) analytics.browseTraditional(); }}
                    className="text-[11px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-4 decoration-border"
                  >
                    {showTraditional ? "Hide details" : "Or browse traditionally ↓"}
                  </button>
                </div>
              </div>

              {/* ============ TRADITIONAL BROWSE SECTION ============ */}
              <AnimatePresence>
                {showTraditional && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-2xl mt-8 overflow-hidden"
                  >
                    {/* Experience */}
                    <div className="border-t border-border pt-6 mb-8">
                      <h2 className="text-sm font-bold text-foreground mb-4">Experience</h2>
                      <div className="space-y-3">
                        {EXPERIENCES.map((exp, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                            <div>
                              <span className="text-sm font-medium text-foreground">{exp.company}</span>
                              <span className="text-xs text-muted-foreground ml-2">{exp.role}</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{exp.period}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="border-t border-border pt-6 mb-8">
                      <h2 className="text-sm font-bold text-foreground mb-4">Skills</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {SKILLS.map((s) => (
                          <span key={s.name} className="text-[11px] font-mono px-2 py-0.5 border border-border text-muted-foreground rounded-md">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Featured Projects */}
                    <div className="border-t border-border pt-6 mb-8">
                      <h2 className="text-sm font-bold text-foreground mb-4">Featured Projects</h2>
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
                            link: "https://askjun.manus.space",
                            visibility: "public" as const,
                          },
                        ].map((project, i) => (
                          <a
                            key={i}
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group border border-border rounded-lg overflow-hidden hover:border-accent/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 ease-out"
                          >
                            <div className="aspect-video overflow-hidden bg-muted">
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                              />
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-semibold text-foreground">{project.title}</h3>
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  {project.visibility === "private" ? "🔒" : "↗"}
                                </span>
                              </div>
                              {/* Genre tags */}
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {project.tags.map((tag, j) => (
                                  <span
                                    key={j}
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                      tag === "AI"
                                        ? "border border-accent/50 text-accent"
                                        : "border border-border text-muted-foreground"
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{project.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {project.tech.map((t, j) => (
                                  <span key={j} className="text-[9px] font-mono px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Side Projects */}
                    <div className="border-t border-border pt-6 mb-8">
                      <h2 className="text-sm font-bold text-foreground mb-4">Side Projects</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            title: "TeaPets 3D",
                            description: "Browser-based roguelike with cute slime character",
                            tags: ["Game Dev"],
                            link: "https://github.com/junnyboi/teapets-3d",
                            visibility: "private" as const,
                          },
                          {
                            title: "Housewarmer",
                            description: "Scroll-animated housewarming invitation",
                            tags: ["Creative", "Web"],
                            link: "https://github.com/junnyboi/housewarmer",
                            visibility: "private" as const,
                          },
                          {
                            title: "Booking Bot",
                            description: "Automated booking system",
                            tags: ["Automation"],
                            link: "https://github.com/junnyboi/booking-bot",
                            visibility: "private" as const,
                          },
                          {
                            title: "Polygen",
                            description: "Procedurally generated low poly asset collection",
                            tags: ["Creative", "Game Dev"],
                            link: "https://github.com/junnyboi/polygen",
                            visibility: "private" as const,
                          },
                          {
                            title: "Gobbo 2D",
                            description: "Unity 2D game — a couple's passion project",
                            tags: ["Game Dev"],
                            link: "https://github.com/junnyboi/Gobbo-2D",
                            visibility: "public" as const,
                          },
                          {
                            title: "Finance Tracker",
                            description: "Ionic + React mobile finance app",
                            tags: ["Mobile"],
                            link: "https://github.com/junnyboi/tony-stocks",
                            visibility: "public" as const,
                          },
                        ].map((project, i) => (
                          <a
                            key={i}
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-3 p-3 border border-border rounded-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all duration-200"
                          >
                            <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                              {project.visibility === "private" ? "🔒" : "↗"}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">{project.title}</h3>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{project.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.tags.map((tag, j) => (
                                  <span
                                    key={j}
                                    className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                                      tag === "AI"
                                        ? "border border-accent/50 text-accent"
                                        : "border border-border text-muted-foreground/60"
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="border-t border-border pt-6">
                      <h2 className="text-sm font-bold text-foreground mb-4">Contact</h2>
                      <div className="flex flex-wrap gap-4 text-xs font-mono">
                        <a href={`mailto:${PROFILE.email}`} className="text-muted-foreground hover:text-accent transition-colors">{PROFILE.email}</a>
                        <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">LinkedIn</a>
                        <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">GitHub</a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ============ MESSAGES ============ */
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "assistant" ? "border-l-2 border-accent pl-4" : ""}`}>
                    <span className="text-[10px] font-mono text-muted-foreground mb-1 block">
                      {msg.role === "user" ? "you" : "askJun"}
                    </span>

                    {msg.toolUse && msg.toolUse.status && (
                      <>
                        <div className="text-xs font-mono text-accent mb-2">✓ {msg.toolUse.status}</div>
                        {/* Inline Download CV button for resume requests */}
                        <a
                          href="/manus-storage/JunBoh-CV-2026_adffff38.pdf"
                          download="BohZeJun_CV_2026.pdf"
                          onClick={() => analytics.cvDownload()}
                          className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all active:scale-95 mb-3"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download CV
                        </a>
                      </>
                    )}
                    {msg.toolUse && !msg.toolUse.status && (
                      <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 border border-accent border-t-transparent rounded-full animate-spin" />
                        {msg.toolUse.action}
                      </div>
                    )}

                    <div className="text-sm leading-relaxed text-foreground [&_strong]:text-accent [&_strong]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-70 [&_a]:transition-opacity">
                      {msg.content ? (
                        <>
                          <Streamdown>{msg.content}</Streamdown>
                          {isTyping && msg === messages[messages.length - 1] && msg.role === "assistant" && msg.content.length > 0 && (
                            <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-blink align-middle" />
                          )}
                          {/* Profile image for handsome Easter egg */}
                          {msg.showProfileImage && !isTyping && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-border max-w-[280px]">
                              <img
                                src="/manus-storage/jun-profile-meta_7e9e3d09.jpg"
                                alt="Boh Ze Jun at Meta"
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        isTyping && msg.role === "assistant" && !msg.toolUse && (
                          <div className="flex gap-1.5 py-1">
                            <span className="w-1 h-1 bg-muted-foreground animate-pulse" />
                            <span className="w-1 h-1 bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }} />
                            <span className="w-1 h-1 bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }} />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Suggested follow-ups — shown after last assistant message when not typing */}
              {!isTyping && messages.length >= 2 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground/50 block mb-2">Suggested follow-ups</span>
                  <div className="flex flex-wrap gap-1.5">
                    {getFollowUps(
                      messages.filter(m => m.role === "user").slice(-1)[0]?.content || ""
                    ).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { analytics.chipClick(s); handleSend(s); }}
                        className="text-[11px] font-mono px-2.5 py-1 border border-border text-muted-foreground hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 rounded-lg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom-docked input when in conversation */}
        {hasMessages && (
          <div className="shrink-0 border-t border-border bg-background">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3">
              <div className="flex items-end gap-3">
                <div className="flex-1 border border-border focus-within:border-accent transition-colors px-4 py-2.5 rounded-xl">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up..."
                    rows={1}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none max-h-32 font-mono"
                    style={{ minHeight: "20px" }}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-all active:scale-90 rounded-lg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-muted-foreground/40">powered by deepseek</span>
                <button
                  onClick={handleShare}
                  className="text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors sm:hidden"
                >
                  share ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile persistent contact bar */}
      {!hasMessages && (
        <div className="sm:hidden shrink-0 border-t border-border bg-background px-4 py-2.5 flex items-center justify-between relative z-10">
          <a href={`mailto:${PROFILE.email}`} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Email</a>
          <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">LinkedIn</a>
          <a href="/manus-storage/JunBoh-CV-2026_adffff38.pdf" download="BohZeJun_CV_2026.pdf" onClick={() => analytics.cvDownload()} className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Download CV</a>
        </div>
      )}

      {/* Floating back-to-top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-30 w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-full shadow-lg hover:opacity-80 transition-opacity active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

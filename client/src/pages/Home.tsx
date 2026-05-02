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

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = trpc.chat.send.useMutation();

  const hasMessages = messages.length > 0;
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());
  const chatStats = trpc.chat.stats.useQuery(undefined, { refetchInterval: 30000 });

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
      // Track this query so we don't show it as a chip again
      setUsedChips((prev) => new Set(prev).add(query));

      const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: query };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      // Detect appearance/handsome queries to show profile image regardless of API/fallback
      const lowerQuery = query.toLowerCase();
      const isAppearanceQuery = ["handsome", "good looking", "good-looking", "attractive", "cute", "hot", "gorgeous", "pretty", "beautiful", "appearance", "look like", "looks like", "what does he look"].some(kw => lowerQuery.includes(kw));

      try {
        const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
        const result = await chatMutation.mutateAsync({ messages: apiMessages });
        const isToolUse = shouldSimulateToolUse(query);
        if (isToolUse) {
          setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, toolUse: { action: "Retrieving document...", status: "" } } : m));
          setTimeout(() => simulateStreaming(result.content, assistantMsgId, { action: "Retrieving document...", status: "Done" }), 1000);
        } else {
          simulateStreaming(result.content, assistantMsgId, undefined, isAppearanceQuery || undefined);
        }
      } catch {
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined, isAppearanceQuery || response.showProfileImage);
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
      <header className="sticky top-0 shrink-0 border-b border-border px-4 sm:px-6 h-12 flex items-center justify-between z-20 bg-card backdrop-blur-sm">
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
            href="/portfolio"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all active:scale-95"
          >
            Experience & Projects
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

              {/* Centered input — Manus-style: send button inside, taller box */}
              <div className="w-full max-w-xl px-2 sm:px-0">
                <div className="relative border border-border focus-within:border-accent transition-colors rounded-xl">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Jun..."
                    rows={2}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none font-mono px-4 pt-3 pb-10 sm:pt-4 sm:pb-12"
                    style={{ minHeight: "70px" }}
                  />
                  {/* Send button inside input — bottom right */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                    className="absolute bottom-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-all active:scale-90 rounded-lg"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  </button>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 justify-center">
                  {CHAT_SUGGESTIONS.filter(s => !usedChips.has(s)).slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { analytics.chipClick(s); handleSend(s); }}
                      className="text-[11px] sm:text-xs font-mono px-2.5 py-1 sm:px-3 sm:py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all hover:scale-[1.02] rounded-lg"
                    >
                      {s}
                    </button>
                  ))}
                  {CHAT_SUGGESTIONS.filter(s => !usedChips.has(s)).slice(3).map((s, i) => (
                    <button
                      key={i + 3}
                      onClick={() => { analytics.chipClick(s); handleSend(s); }}
                      className="hidden sm:inline-block text-xs font-mono px-3 py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all hover:scale-[1.02] rounded-lg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
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
              {!isTyping && messages.length >= 2 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (() => {
                const EASTER_EGG_CHIP = "What does he look like?";
                const userMsgCount = messages.filter(m => m.role === "user").length;
                const hasAskedAppearance = usedChips.has(EASTER_EGG_CHIP) || messages.some(m => m.role === "user" && ["handsome", "attractive", "look like", "looks like", "gorgeous", "appearance"].some(kw => m.content.toLowerCase().includes(kw)));
                const baseChips = getFollowUps(
                  messages.filter(m => m.role === "user").slice(-1)[0]?.content || ""
                ).filter(s => !usedChips.has(s));
                // Inject Easter egg chip at 3rd message if not already asked
                const chips = (!hasAskedAppearance && userMsgCount >= 3 && !baseChips.includes(EASTER_EGG_CHIP))
                  ? [...baseChips.slice(0, 2), EASTER_EGG_CHIP]
                  : baseChips;
                return chips.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <span className="text-[10px] font-mono text-muted-foreground/50 block mb-2">Suggested follow-ups</span>
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((s, i) => (
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
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Bottom-docked input when in conversation */}
        {hasMessages && (
          <div className="shrink-0 border-t border-border bg-card">
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
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  {chatStats.data && chatStats.data.conversations > 0
                    ? `${chatStats.data.conversations} conversations · powered by deepseek`
                    : "powered by deepseek"}
                </span>
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
        <div className="sm:hidden shrink-0 border-t border-border bg-card px-4 py-2.5 flex items-center justify-between relative z-10">
          <a href="/portfolio" className="text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors">Portfolio</a>
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

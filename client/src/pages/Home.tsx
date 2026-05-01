/*
 * ============================================================================
 * askJun Home — Chat-First Layout (ChatGPT-inspired)
 * The AI conversation IS the landing page. Professional context is secondary.
 * Nothing Design Language maintained throughout.
 * ============================================================================
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { CHAT_SUGGESTIONS, PROFILE, HIGHLIGHTS } from "@/data/portfolio";
import ThemeToggle from "@/components/ThemeToggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = trpc.chat.send.useMutation();

  const hasMessages = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, toolUse?: { action: string; status: string }) => {
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex += Math.floor(Math.random() * 4) + 2;
        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          clearInterval(interval);
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText, toolUse } : m));
          setIsTyping(false);
        } else {
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: fullText.slice(0, charIndex) } : m));
        }
      }, 8);
    },
    []
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;

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
        simulateStreaming(response.text, assistantMsgId, isToolUse ? response.toolUse : undefined);
      }
    },
    [input, isTyping, messages, chatMutation, simulateStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Minimal header */}
      <header className="shrink-0 border-b border-border px-4 sm:px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground">
            ask<span className="text-accent">Jun</span>
          </span>
          <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
            · {PROFILE.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/manus-storage/JunBoh-CV-2026_adffff38.pdf"
            download="BohZeJun_CV_2026.pdf"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            CV ↓
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            LinkedIn
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages area OR empty state */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* ============ EMPTY STATE — ChatGPT-style hero ============ */
            <div className="h-full flex flex-col items-center justify-center px-4 py-6 sm:py-12">
              {/* Profile identity — compact on mobile */}
              <div className="mb-4 sm:mb-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 overflow-hidden border border-border">
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

              {/* Key metrics — hidden on mobile to reduce clutter */}
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-6 mb-8 text-center">
                {HIGHLIGHTS.slice(0, 4).map((h, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="font-mono text-sm font-bold text-foreground">{h.metric}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Main prompt text */}
              <p className="text-base sm:text-xl text-muted-foreground text-center max-w-md mb-5 sm:mb-8">
                Ask me anything about Jun's experience, skills, or career.
              </p>

              {/* Centered input — ChatGPT style hero CTA */}
              <div className="w-full max-w-xl px-2 sm:px-0">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 border border-border focus-within:border-accent transition-colors px-3 sm:px-4 py-2.5 sm:py-3">
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
                    className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-opacity active:scale-95"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  </button>
                </div>

                {/* Suggestion chips — show 3 on mobile, all on desktop */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 justify-center">
                  {CHAT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-[11px] sm:text-xs font-mono px-2.5 py-1 sm:px-3 sm:py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                  {/* Show remaining only on desktop */}
                  {CHAT_SUGGESTIONS.slice(3).map((s, i) => (
                    <button
                      key={i + 3}
                      onClick={() => handleSend(s)}
                      className="hidden sm:inline-block text-xs font-mono px-3 py-1.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
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
                    {/* Role label */}
                    <span className="text-[10px] font-mono text-muted-foreground mb-1 block">
                      {msg.role === "user" ? "you" : "askJun"}
                    </span>

                    {/* Tool use */}
                    {msg.toolUse && msg.toolUse.status && (
                      <div className="text-xs font-mono text-accent mb-2">✓ {msg.toolUse.status}</div>
                    )}
                    {msg.toolUse && !msg.toolUse.status && (
                      <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 border border-accent border-t-transparent rounded-full animate-spin" />
                        {msg.toolUse.action}
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-sm leading-relaxed text-foreground [&_strong]:text-accent [&_strong]:font-semibold [&_li]:ml-4 [&_li]:list-disc">
                      {msg.content ? (
                        <>
                          <Streamdown>{msg.content}</Streamdown>
                          {isTyping && msg === messages[messages.length - 1] && msg.role === "assistant" && msg.content.length > 0 && (
                            <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-blink align-middle" />
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
            </div>
          )}
        </div>

        {/* ============ INPUT AREA — Bottom-docked only when conversation is active ============ */}
        {hasMessages && (
          <div className="shrink-0 border-t border-border bg-background">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 border border-border focus-within:border-accent transition-colors px-4 py-3">
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
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-foreground text-background disabled:opacity-20 hover:opacity-80 transition-opacity active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] font-mono text-muted-foreground/40">powered by deepseek</span>
                <span className="text-[10px] font-mono text-muted-foreground/40">{PROFILE.location} · 2026</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

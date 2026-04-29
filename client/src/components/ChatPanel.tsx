/*
 * ChatPanel — Glass Atelier Design
 * Full-screen chat overlay that slides up from bottom.
 * Simulates AI agent responses with streaming text and tool-use animations.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import {
  getResponse,
  shouldSimulateToolUse,
  getToolUseResponse,
} from "@/data/chatEngine";
import { CHAT_SUGGESTIONS } from "@/data/portfolio";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
  isStreaming?: boolean;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! I'm Jun's AI portfolio assistant. I know everything about his professional background, technical skills, and career achievements.\n\nTry asking me about his **experience at Meta/Manus**, his **payment systems work at HoYoverse**, or his **tech stack**. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, toolUse?: { action: string; status: string }) => {
      let charIndex = 0;
      const speed = 12; // ms per character

      const interval = setInterval(() => {
        charIndex += Math.floor(Math.random() * 3) + 1;
        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          clearInterval(interval);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, content: fullText, isStreaming: false, toolUse }
                : m
            )
          );
          setIsTyping(false);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, content: fullText.slice(0, charIndex) }
                : m
            )
          );
        }
      }, speed);
    },
    []
  );

  const handleSend = useCallback(
    (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate thinking delay
      const delay = 600 + Math.random() * 800;

      setTimeout(() => {
        const isToolUse = shouldSimulateToolUse(query);
        const response = isToolUse ? getToolUseResponse() : getResponse(query);

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "",
          isStreaming: true,
          toolUse: undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (isToolUse && response.toolUse) {
          // Show tool use animation first, then stream text
          setTimeout(() => {
            simulateStreaming(
              response.text,
              assistantMsg.id,
              response.toolUse
            );
          }, 1500);
        } else {
          simulateStreaming(response.text, assistantMsg.id);
        }
      }, delay);
    },
    [input, isTyping, simulateStreaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ type: "spring" as const, stiffness: 200, damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[90vh] sm:h-[85vh] sm:inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 md:left-auto md:w-[480px] md:h-[700px] md:max-h-[85vh] md:rounded-2xl overflow-hidden"
          >
            <div className="h-full flex flex-col bg-card/95 backdrop-blur-xl border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-violet-500 flex items-center justify-center">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      askJun AI
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isTyping ? "Typing..." : "Online"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-primary/20 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2.5"
                          : "bg-white/4 border border-white/6 rounded-2xl rounded-bl-md px-4 py-3"
                      }`}
                    >
                      {/* Tool use animation */}
                      {msg.role === "assistant" &&
                        msg.isStreaming &&
                        msg.content === "" &&
                        shouldSimulateToolUse(
                          messages.filter((m) => m.role === "user").slice(-1)[0]
                            ?.content || ""
                        ) && (
                          <div className="flex items-center gap-2 text-xs text-primary/80 font-mono mb-2">
                            <div className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                            <span>Agent is retrieving document...</span>
                          </div>
                        )}

                      {/* Tool use result badge */}
                      {msg.toolUse && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mb-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {msg.toolUse.status}
                        </div>
                      )}

                      <div className="text-sm text-foreground/90 leading-relaxed [&_strong]:text-primary [&_strong]:font-semibold">
                        <Streamdown>{msg.content}</Streamdown>
                        {msg.isStreaming && msg.content.length > 0 && (
                          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-blink align-middle" />
                        )}
                      </div>

                      {/* Typing indicator */}
                      {msg.isStreaming && msg.content === "" && !shouldSimulateToolUse(
                        messages.filter((m) => m.role === "user").slice(-1)[0]?.content || ""
                      ) && (
                        <div className="flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestion chips (show when few messages) */}
              {messages.length <= 2 && (
                <div className="px-5 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-foreground/60 border border-white/8 hover:bg-white/8 hover:text-foreground/80 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="px-4 pb-4 pt-2 border-t border-white/8">
                <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-primary/30 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Jun's experience..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none max-h-24"
                    style={{ minHeight: "24px" }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="shrink-0 w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-30 disabled:hover:bg-primary/20 flex items-center justify-center transition-all"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                    >
                      <path d="m22 2-7 20-4-9-9-4z" />
                      <path d="m22 2-11 11" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
                  AI responses are based on Jun's professional profile. For direct contact, email boh.ze.jun@gmail.com
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

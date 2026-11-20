/**
 * useChatEngine — Encapsulates all chat logic:
 * - Message state management
 * - SSE streaming for semantic (LLM) responses
 * - Simulated streaming for the built-in answers used when the server is unreachable
 * - Answer extras (CV / Portfolio buttons, answer cards, profile image)
 * - Used chips tracking
 * - Share conversation
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { getResponse, shouldSimulateToolUse, getToolUseResponse } from "@/data/chatEngine";
import { analytics } from "@/lib/analytics";
import { copyText } from "@/lib/clipboard";
import { toast } from "sonner";
import { detectGenerativeUI, type GenerativeUIType } from "@/components/generative";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUse?: { action: string; status: string };
  showProfileImage?: boolean;
  showDownloadCV?: boolean;
  showPortfolioLink?: boolean;
  generativeUI?: GenerativeUIType;
  /** The answer ended early because of an error */
  wasCutOff?: boolean;
}

type MessageExtras = Partial<Omit<Message, "id" | "role" | "content">>;

const APPEARANCE_KEYWORDS = [
  "handsome", "good looking", "good-looking", "attractive", "cute",
  "hot", "gorgeous", "pretty", "beautiful", "appearance",
  "look like", "looks like", "what does he look",
  "how does jun look", "how does he look", "jun look", "does he look like",
];
const CV_KEYWORDS = ["resume", "cv", "download cv", "pdf", "download his", "give me his cv"];
const PORTFOLIO_KEYWORDS = ["portfolio", "experience", "projects", "what is askjun", "about this site", "about askjun", "what are you", "who are you"];

const CONTACT = "[boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com)";
const RATE_LIMIT_MESSAGE = `I've reached the message limit for this hour. Please try again later, or reach Jun directly at ${CONTACT}.`;
const NO_ANSWER_MESSAGE = `I couldn't put an answer together just now. Please try again, or reach Jun directly at ${CONTACT}.`;

/** What should accompany the answer to this question, decided from the question itself. */
function answerExtras(query: string): MessageExtras {
  const lower = query.toLowerCase();
  const extras: MessageExtras = {};
  const generativeUI = detectGenerativeUI(query);
  if (generativeUI) extras.generativeUI = generativeUI;
  if (APPEARANCE_KEYWORDS.some(kw => lower.includes(kw))) extras.showProfileImage = true;
  if (CV_KEYWORDS.some(kw => lower.includes(kw))) extras.showDownloadCV = true;
  if (PORTFOLIO_KEYWORDS.some(kw => lower.includes(kw))) extras.showPortfolioLink = true;
  return extras;
}

/** The conversation as the server expects it. Blank turns (stopped answers) are left out. */
function toApiMessages(history: Message[]) {
  return history.filter(m => m.content.trim()).map(({ role, content }) => ({ role, content }));
}

export function useChatEngine() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // The answer being written. Usually the newest message, but not when an earlier answer is regenerated.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  // The answer most recently asked for; stays set after it finishes (the page scrolls to it once)
  const [latestAnswerId, setLatestAnswerId] = useState<string | null>(null);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());

  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // Each answer request gets a number. Work belonging to an older or stopped request is ignored.
  const generationRef = useRef(0);

  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const stopGeneration = useCallback(() => {
    generationRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    setIsTyping(false);
    setStreamingId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => stopGeneration, [stopGeneration]);

  // Simulated streaming for the built-in answers (no real LLM stream)
  const simulateStreaming = useCallback(
    (fullText: string, msgId: string, extras: MessageExtras, isCurrent: () => boolean) => {
      let charIndex = 0;
      const baseSpeed = 8;

      const tick = () => {
        if (!isCurrent()) return;
        const char = fullText[charIndex] || "";
        const isPunctuation = ".!?,;:".includes(char);
        charIndex += Math.floor(Math.random() * 4) + 2;

        if (charIndex >= fullText.length) {
          patchMessage(msgId, { content: fullText, ...extras });
          streamingTimeoutRef.current = null;
          setIsTyping(false);
          setStreamingId(null);
          return;
        }

        patchMessage(msgId, { content: fullText.slice(0, charIndex) });
        const delay = isPunctuation ? baseSpeed * 6 : baseSpeed + Math.random() * 6 - 3;
        streamingTimeoutRef.current = setTimeout(tick, delay);
      };

      streamingTimeoutRef.current = setTimeout(tick, baseSpeed);
    },
    [patchMessage]
  );

  /**
   * Ask the server. Resolves when the answer is complete (or was stopped).
   * Throws when the server cannot be used at all, so the caller can fall back.
   */
  const streamFromServer = useCallback(
    async (apiMessages: Array<{ role: string; content: string }>, msgId: string, isCurrent: () => boolean) => {
      const patch = (change: Partial<Message>) => {
        if (isCurrent()) patchMessage(msgId, change);
      };
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortController.signal,
        });
        const contentType = response.headers.get("content-type") || "";

        // JSON: an instant answer, a refusal, a rate limit or an error. Always show something.
        if (contentType.includes("application/json")) {
          const data = await response.json();
          const fallbackText = response.status === 429 ? RATE_LIMIT_MESSAGE : NO_ANSWER_MESSAGE;
          patch({ content: data.content || fallbackText });
          return;
        }

        if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
          throw new Error(`Unexpected chat response: ${response.status} ${contentType}`);
        }

        // SSE stream — parse token by token
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            let parsed: { type?: string; content?: string; fullContent?: string };
            try {
              parsed = JSON.parse(data);
            } catch {
              continue; // Skip malformed JSON
            }

            if (parsed.type === "token" && parsed.content) {
              fullContent += parsed.content;
              patch({ content: fullContent });
            } else if (parsed.type === "replace" && parsed.content) {
              // Output validation triggered on the server: show the corrected text with the action buttons
              fullContent = parsed.content;
              patch({ content: fullContent, showDownloadCV: true, showPortfolioLink: true });
            } else if (parsed.type === "error") {
              if (fullContent) {
                patch({ wasCutOff: true });
              } else {
                fullContent = parsed.content || NO_ANSWER_MESSAGE;
                patch({ content: fullContent });
              }
            } else if (parsed.type === "done" && !fullContent && parsed.fullContent) {
              fullContent = parsed.fullContent;
              patch({ content: fullContent });
            }
          }
        }

        if (!fullContent.trim()) patch({ content: NO_ANSWER_MESSAGE });
      } finally {
        if (abortControllerRef.current === abortController) abortControllerRef.current = null;
      }
    },
    [patchMessage]
  );

  /** Fill the (already placed) answer `msgId` for `question`, given the conversation before it. */
  const generateAnswer = useCallback(
    async (question: string, history: Message[], msgId: string) => {
      const generation = ++generationRef.current;
      const isCurrent = () => generationRef.current === generation;
      setIsTyping(true);
      setStreamingId(msgId);
      setLatestAnswerId(msgId);

      try {
        await streamFromServer(toApiMessages(history), msgId, isCurrent);
        if (!isCurrent()) return;
        setIsTyping(false);
        setStreamingId(null);
      } catch {
        if (!isCurrent()) return; // stopped by the visitor, or superseded
        // Server unreachable: answer from the built-in responses
        const isToolUse = shouldSimulateToolUse(question);
        const response = isToolUse ? getToolUseResponse() : getResponse(question);
        const extras: MessageExtras = {};
        if (isToolUse) extras.toolUse = response.toolUse;
        if (response.showProfileImage) extras.showProfileImage = true;
        simulateStreaming(response.text, msgId, extras, isCurrent);
      }
    },
    [streamFromServer, simulateStreaming]
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || input.trim();
      if (!query || isTyping) return;
      analytics.chatMessage(query);
      setUsedChips(prev => new Set(prev).add(query));

      const stamp = Date.now();
      const userMsg: Message = { id: `user-${stamp}`, role: "user", content: query };
      const assistantMsg: Message = { id: `assistant-${stamp}`, role: "assistant", content: "", ...answerExtras(query) };
      const history = [...messagesRef.current, userMsg];
      setMessages([...history, assistantMsg]);
      setInput("");

      await generateAnswer(query, history, assistantMsg.id);
    },
    [input, isTyping, generateAnswer]
  );

  /** Write a new answer in place of an existing one. Later messages keep their position. */
  const handleRegenerate = useCallback(
    async (assistantMsgId: string) => {
      if (isTyping) return;
      const index = messagesRef.current.findIndex(m => m.id === assistantMsgId);
      const question = messagesRef.current[index - 1];
      if (index <= 0 || question?.role !== "user") return;

      const replacement: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        ...answerExtras(question.content),
      };
      const history = messagesRef.current.slice(0, index);
      setMessages(prev => prev.map(m => (m.id === assistantMsgId ? replacement : m)));

      await generateAnswer(question.content, history, replacement.id);
    },
    [isTyping, generateAnswer]
  );

  const handleShare = useCallback(() => {
    const transcript = messages
      .filter(m => m.content.trim())
      .map(m => `${m.role === "user" ? "You" : "askJun"}: ${m.content}`)
      .join("\n\n");
    copyText(transcript);
    analytics.shareConversation();
    toast.success("Conversation copied to clipboard!");
  }, [messages]);

  const resetConversation = useCallback(() => {
    stopGeneration();
    setMessages([]);
    setLatestAnswerId(null);
    setUsedChips(new Set());
  }, [stopGeneration]);

  return {
    messages,
    input,
    setInput,
    isTyping,
    streamingId,
    latestAnswerId,
    usedChips,
    hasMessages: messages.length > 0,
    handleSend,
    handleStopGenerating: stopGeneration,
    handleRegenerate,
    handleShare,
    resetConversation,
  };
}

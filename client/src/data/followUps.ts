/*
 * Contextual follow-up suggestions based on the last topic discussed.
 * Shown after each AI response to keep the conversation flowing.
 */

const FOLLOW_UP_MAP: Record<string, string[]> = {
  meta: [
    "What tech stack does he use at Meta?",
    "Tell me about his biggest technical challenge",
    "✦ Career timeline",
  ],
  manus: [
    "What specific features did he build?",
    "What's his experience with AI agents?",
    "Can I see his resume?",
  ],
  ai: [
    "Tell me about his work at Meta/Manus",
    "What payment systems has he built?",
    "✦ Tech stack",
  ],
  payment: [
    "How did he handle 15M sign-ups in 48 hours?",
    "What about his GDPR compliance work?",
    "✦ Key metrics",
  ],
  hoyo: [
    "Tell me about the payment methods he integrated",
    "What was his role at TikTok?",
    "Has he won any awards?",
  ],
  tiktok: [
    "Tell me about his GDPR compliance work",
    "What did he build at HoYoverse?",
    "What awards has he won?",
  ],
  gdpr: [
    "What payment systems has he built?",
    "Tell me about his work at Meta/Manus",
    "Why is he looking for new opportunities?",
  ],
  bank: [
    "What's the genetic algorithm project about?",
    "Tell me about his work at TikTok",
    "What's his education background?",
  ],
  stack: [
    "What's his experience with React?",
    "Tell me about his AI agent work",
    "What payment systems has he built?",
  ],
  looking: [
    "What's his experience with AI?",
    "Can I see his resume?",
    "What's his biggest achievement?",
  ],
  salary: [
    "What's his current role?",
    "What tech stack does he use?",
    "Can I see his resume?",
  ],
  challenge: [
    "Tell me about his GDPR work at TikTok",
    "How did he handle 15M sign-ups?",
    "✦ Key metrics",
  ],
  education: [
    "What certifications does he have?",
    "Tell me about his work experience",
    "✦ Education",
  ],
  awards: [
    "Tell me about his innovation projects",
    "What's his experience at Meta?",
    "What does he look like?",
  ],
  handsome: [
    "Okay but what's his tech stack?",
    "Tell me about his actual work at Meta",
    "What's his biggest achievement?",
  ],
  hello: [
    "What's his experience with AI?",
    "Tell me about the payment systems he built",
    "What tech stack does he use?",
  ],
};

// Default follow-ups if no specific match
const DEFAULT_FOLLOW_UPS = [
  "What's his experience with AI agents?",
  "✦ Career timeline",
  "✦ Key metrics",
];

export function getFollowUps(lastQuery: string): string[] {
  const lower = lastQuery.toLowerCase();

  // Try to match the topic from the query
  for (const [key, keywords] of Object.entries(KEYWORD_TO_TOPIC)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return FOLLOW_UP_MAP[key] || DEFAULT_FOLLOW_UPS;
      }
    }
  }

  return DEFAULT_FOLLOW_UPS;
}

// Reuse keyword mapping from chatEngine for consistency
const KEYWORD_TO_TOPIC: Record<string, string[]> = {
  meta: ["meta", "facebook", "faang"],
  manus: ["manus", "agent platform", "ai platform"],
  ai: ["ai", "artificial intelligence", "machine learning", "agent", "llm"],
  payment: ["payment", "transaction", "cashier", "fintech"],
  hoyo: ["hoyo", "hoyoverse", "mihoyo", "genshin", "honkai"],
  tiktok: ["tiktok", "bytedance"],
  gdpr: ["gdpr", "compliance", "data residency", "privacy"],
  bank: ["bank", "dbs", "finance", "banking", "innovation"],
  stack: ["stack", "tech", "technology", "tools", "framework", "skill"],
  looking: ["looking", "opportunity", "new role", "why leave", "available", "hire"],
  salary: ["salary", "compensation", "comp", "tc", "package"],
  challenge: ["challenge", "difficult", "hardest", "biggest", "achievement"],
  education: ["education", "university", "degree", "school"],
  awards: ["award", "recognition", "rockstar"],
  handsome: ["handsome", "attractive", "cute", "gorgeous", "appearance"],
  hello: ["hello", "hi", "hey", "help"],
};

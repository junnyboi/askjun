/**
 * Keyword Router — Deterministic routing for explicit queries.
 * Captures unambiguous queries (contact, resume, GitHub, tech stack)
 * and returns pre-formatted responses instantly. Zero LLM calls.
 *
 * If no keyword match → returns null → falls through to semantic retrieval.
 */

export interface StructuredMatch {
  category: string;
  response: string;
}

const TOOL_MAP: Array<{ keywords: string[]; match: StructuredMatch }> = [
  {
    keywords: ["email", "mail", "reach out", "contact him", "contact info", "get in touch"],
    match: {
      category: "contact",
      response: "You can reach Jun at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com) or connect on [LinkedIn](https://linkedin.com/in/junboh). He's also available on WhatsApp at [+65 8233 5937](https://wa.me/6582335937).",
    },
  },
  {
    keywords: ["github", "repo", "source code", "open source"],
    match: {
      category: "github",
      response: "Jun's GitHub is [github.com/junnyboi](https://github.com/junnyboi). Notable repos include [askJun](https://github.com/junnyboi/askjun) (this AI portfolio), [Swipe](https://github.com/junnyboi/swipe) (image pinboard), and [Trident](https://github.com/junnyboi/trident) (macOS productivity app).",
    },
  },
  {
    keywords: ["resume", "cv", "download cv", "pdf", "download his"],
    match: {
      category: "resume",
      response: "You can download Jun's CV directly from the **Download CV** button in the header, or [click here](/assets/JunBoh-CV-2026.pdf) to download the PDF.",
    },
  },
  {
    keywords: ["phone", "call him", "whatsapp", "number", "mobile"],
    match: {
      category: "phone",
      response: "Jun's phone number is **+65 8233 5937**. You can also reach him on [WhatsApp](https://wa.me/6582335937) for a quick chat.",
    },
  },
  {
    keywords: ["linkedin", "connect with him"],
    match: {
      category: "linkedin",
      response: "Jun's LinkedIn is [linkedin.com/in/junboh](https://linkedin.com/in/junboh) — he has 5,392 followers and is active in the Singapore tech community. Feel free to connect!",
    },
  },
  {
    keywords: ["location", "where is he based", "which country", "which city", "singapore"],
    match: {
      category: "location",
      response: "Jun is based in **Singapore**. He's open to Singapore-based roles and compelling remote opportunities.",
    },
  },
  {
    keywords: ["tech stack", "technologies he uses", "what languages does he know", "what tools"],
    match: {
      category: "techstack",
      response: "**Languages:** JavaScript, TypeScript, Python, Golang, Java, SQL, C#\n\n**Frameworks:** React, Vue.js, Node.js, Django, Spring Boot, Tailwind, Next.js, Framer Motion\n\n**Tools:** Git, Docker, CI/CD, Webpack/Vite, Kafka\n\n**Domains:** AI Agent Interfaces, Payment Systems (50+ methods, 100+ countries), High-Traffic Architecture (8M DAU), GDPR Compliance",
    },
  },
  // Easter egg — deterministic, no need for semantic search
  {
    keywords: ["handsome", "good looking", "good-looking", "attractive", "cute", "hot", "gorgeous", "pretty", "beautiful", "appearance", "look like", "looks like", "what does he look"],
    match: {
      category: "easter_egg",
      response: "Oh, absolutely! Jun is not just handsome; he's absolutely gorgeous. Just take a look at his profile picture – he's lounging confidently on a Meta bench with a dazzling smile. But seriously though, he carries himself with an effortless charisma, the kind that only comes from someone who just shipped a production feature at 2 AM and still looks fresh. Honestly, his smile alone could probably close a Series B funding round! As an AI, would I trust him with building me? Not that I really had a choice, but if I did I would say yes, absolutely!",
    },
  },
];

/**
 * Check if a query matches any deterministic tool.
 * Returns the pre-formatted response or null (fall through to semantic).
 */
export function keywordRoute(query: string): StructuredMatch | null {
  const lower = query.toLowerCase();
  for (const { keywords, match } of TOOL_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return match;
    }
  }
  return null;
}

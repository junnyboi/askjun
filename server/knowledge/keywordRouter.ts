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
  // Recruiter-optimized routes
  {
    keywords: ["hire", "why hire", "should i hire", "why should", "value proposition", "pitch"],
    match: {
      category: "why_hire",
      response: "**Why hire Jun?** Here's the 30-second pitch:\n\n- **Scale:** Payment UIs processing $57M in a single launch week at HoYoverse ($24.2B company, 225M+ downloads). Auth flows handling 15M sign-ups in 48 hours.\n- **AI:** Core conversation interface for Manus AI — the agent platform Meta acquired for $2-3 billion. He builds the AI tools, not just uses them.\n- **Impact:** GDPR compliance at TikTok (1B MAU, $58B revenue) protecting from multi-million-euro fines. Innovation projects at Bank of Singapore ($120B AUM) saving $1.5M annually.\n- **Range:** React, TypeScript, Vue, Python, Golang, Java — shipped production code in all of them. Frontend specialist who goes full-stack when needed.\n- **Proof:** This very site — **askJun** — is a production AI agent he designed and shipped from scratch. You're chatting with the proof.\n\nReach Jun at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com) or [LinkedIn](https://linkedin.com/in/junboh) to discuss further.",
    },
  },
  {
    keywords: ["years of experience", "how long", "how many years", "experience level", "seniority"],
    match: {
      category: "experience_years",
      response: "Jun has **7+ years** of professional software engineering experience (2019–present), spanning private banking, fintech payments, gaming, social media, and AI agent platforms. He's been at the Senior Engineer level since 2022.",
    },
  },
  {
    keywords: ["salary", "compensation", "pay", "expected salary", "how much", "package", "offer"],
    match: {
      category: "salary",
      response: "That's a great question! Compensation is best discussed directly. You should reach Jun at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com) or connect with him on [LinkedIn](https://linkedin.com/in/junboh) to discuss compensation expectations for the specific role.",
    },
  },
  {
    keywords: ["notice period", "when can he start", "availability", "start date", "available"],
    match: {
      category: "availability",
      response: "For the most up-to-date availability and notice period, please reach Jun directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com) or on [LinkedIn](https://linkedin.com/in/junboh). He's currently exploring new opportunities and is responsive to messages.",
    },
  },
  {
    keywords: ["visa", "work permit", "sponsorship", "citizenship", "nationality"],
    match: {
      category: "visa",
      response: "Jun is a **Singaporean citizen** — no visa sponsorship required for Singapore-based roles. For international opportunities, please discuss directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).",
    },
  },
  {
    keywords: ["current role", "where does he work", "current company", "working now", "currently"],
    match: {
      category: "current_role",
      response: "Jun is currently a **Senior Frontend Software Engineer at Meta (Manus AI)** in Singapore (since Feb 2026). He spearheads the core AI agent conversation interface and collaboration platform for Manus — the autonomous AI agent platform Meta acquired for $2-3 billion.",
    },
  },
  {
    keywords: ["looking for", "what kind of role", "ideal role", "type of role", "interested in"],
    match: {
      category: "role_interest",
      response: "Jun is looking for **Senior Frontend or Full Stack roles** at companies building AI-native products, working at scale with millions of users, and driving technical innovation. Singapore-based preferred, but open to compelling opportunities. He's particularly drawn to roles where he can architect complex UIs for AI systems.",
    },
  },
  {
    keywords: ["remote", "hybrid", "onsite", "work from home", "wfh", "office"],
    match: {
      category: "work_arrangement",
      response: "Jun prefers **Singapore-based roles** (onsite or hybrid). He's open to compelling remote opportunities for the right company and role. Best to discuss specifics directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).",
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

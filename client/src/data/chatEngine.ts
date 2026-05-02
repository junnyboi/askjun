/*
 * ============================================================================
 * askJun Chat Engine — Client-side AI response simulation
 * Since this is a static site, we simulate intelligent responses using
 * keyword matching and pre-crafted answers. This demonstrates the UX pattern
 * while keeping the site deployable without API keys.
 * ============================================================================
 */

interface ChatResponse {
  text: string;
  toolUse?: { action: string; status: string };
  showProfileImage?: boolean;
}

const KNOWLEDGE_BASE: Record<string, ChatResponse> = {
  // Meta / Manus
  meta: {
    text: `Jun is currently a **Senior Frontend Software Engineer at Meta**, working on the **Manus AI** platform — one of the most advanced AI agent systems in the world.

His key contributions include:

- **AI Agent Conversation Interface** — Built the core chat UI with real-time streaming responses, context management, and interactive components using React and TypeScript
- **Scheduled Task Management** — Architected the system for users to schedule and manage AI agent tasks
- **Document Previewing** — Built capabilities for previewing AI-generated documents directly in the conversation flow
- **Real-time Collaboration** — Enabled multi-user interaction with AI-generated artifacts and file sharing

This is essentially the same kind of interface you're using right now to chat with me. Meta, if you will.`,
  },

  manus: {
    text: `Manus AI is the advanced AI agent platform Jun has been building at Meta. Think of it as an AI that can actually *do things* — not just chat, but execute tasks, manage files, browse the web, and collaborate with humans in real-time.

Jun engineered the **core frontend architecture** for this platform, including:
- The conversation interface with streaming responses
- Dynamic navigation and settings systems
- Document previewing and file action capabilities
- Real-time collaboration features

The irony of building an AI agent conversation interface and then showcasing it via... an AI agent conversation interface is not lost on us.`,
  },

  // AI experience
  ai: {
    text: `Jun has deep experience building **AI-native user interfaces**, which is arguably the most in-demand frontend specialization in 2026.

**At Meta (Manus AI):**
- Built the AI agent conversation interface with real-time streaming
- Implemented context management for multi-turn agent interactions
- Developed document previewing for AI-generated artifacts

**At Instawork:**
- Integrated an AI booking bot to automate user shift booking flows
- Extended messaging systems with AI-assisted features

His unique value proposition is **bridging complex AI/ML backend systems with intuitive, responsive frontend experiences**. He doesn't just make things look pretty — he makes AI feel natural to interact with.

In fact, this very site — **askJun** — is a working example of Jun's ability to design and ship a production-ready AI agent from scratch. You're chatting with the proof.`,
  },

  // Payments / HoYoverse
  payment: {
    text: `Jun spent **3 years at HoYoverse** (the studio behind Genshin Impact) building payment infrastructure at massive scale:

- **~$57M processed** during launch week of new game titles
- **50+ payment methods** integrated across **100+ countries**
- **~8M daily active users** supported with sub-second latency
- **15M sign-ups in 48 hours** during peak launches

He built modular Vue.js + TypeScript UIs for web top-up and in-game cashier systems, with client-side validation, adaptive loading, and tokenization. He also partnered with backend/SRE teams to cut frontend live-ops incidents by 30%.

If you need someone who understands payment systems at global scale, Jun has literally processed more transactions than most fintech startups.`,
  },

  hoyo: {
    text: `**HoYoverse** (formerly miHoYo) is the studio behind Genshin Impact, Honkai: Star Rail, and other massive titles. Jun was a **Senior Frontend Software Engineer** there from July 2022 to July 2025.

Key achievements:
- Scaled account and payments frontends for **5 flagship titles** across iOS, Android, PC, PS4/PS5, and Xbox
- Delivered ultra-resilient auth flows handling **~15M sign-ups in 48h**
- Built payment UIs integrating **50+ methods across 100+ countries**
- Supported **~8M DAU** and **≈ SGD 5M in daily transactions**
- **Keynote speaker at SINFO 2024** tech conference in Lisbon, Portugal

He was also responsible for internal ops/finance tools that powered event strategies and report generation.`,
  },

  genshin: {
    text: `Yes! Jun worked on **Genshin Impact** (and Honkai: Star Rail, among others) at HoYoverse. He was responsible for the account and payment frontend systems that powered these games globally.

When Genshin launched new content, his auth systems handled **~15M sign-ups in 48 hours** while maintaining sub-second latency. His payment UIs processed transactions across **100+ countries** with **50+ payment methods**.

That's the kind of scale where a single CSS animation frame drop could cost millions in lost transactions. No pressure.`,
  },

  // TikTok / GDPR
  tiktok: {
    text: `Jun was a **Full Stack Software Engineer at TikTok/ByteDance** from June 2021 to July 2022, based in Singapore.

His most impactful work was **spearheading GDPR/data-residency compliance for payments**:
- Rebuilt and localized merchant/advertiser and admin portals using React, Node.js (BFF), and Golang
- Implemented data separation, consent, and audit logging
- Delivered under tight regulatory deadline, **averting potential multi-million-euro fines**

He also built global payments infrastructure that improved regional reliability and enabled EU/US operations without cross-border data flow.

Recognition: **Employee Rockstar Award 2021** and TikTok Employee Ambassador program.`,
  },

  gdpr: {
    text: `GDPR compliance was one of Jun's most high-stakes projects at TikTok. The EU was threatening **multi-million-euro fines** if TikTok didn't achieve data residency compliance by the regulatory deadline.

Jun spearheaded the effort for the payments division:
- **Rebuilt** merchant/advertiser and admin portals with data separation
- **Localized** systems using React, Node.js (BFF), and Golang
- Implemented **consent management** and **audit logging**
- Delivered **within months** under the regulatory deadline

This wasn't a "nice to have" feature — it was existential for TikTok's EU operations. The kind of pressure that separates senior engineers from the rest.`,
  },

  // Bank of Singapore
  bank: {
    text: `Jun started his career at **Bank of Singapore** (Jul 2019 — Apr 2021) as part of the prestigious **Management Associate Program**.

Key achievements:
- **CEO Recognition Award 2020** — Innovation Category
- Engineered an RM front-office web app (React, Java Spring Boot, Kafka) that replaced a manually-generated Excel workbook, **saving thousands of manhours monthly**
- Led **2 winning Innovation Challenge products** end-to-end
- Launched an RM pitch tool projected to save **3,680 hours** across 3 departments globally, delivering **$1.5M/annum in savings**
- Prototyped a **genetic-algorithm portfolio optimizer** in Python that led to the formation of an in-house roboadvisory team

Before that, he was a **Data Scientist at DBS Bank** (2018), where he analyzed ~6M client relationships using graph theory, driving sales by at least 150%.`,
  },

  // Tech stack
  stack: {
    text: `Jun's technical toolkit is broad and battle-tested:

**Frontend (Primary):**
React, TypeScript, Vue.js, Tailwind CSS, Framer Motion

**Backend:**
Node.js, Python/Django, Java/Spring Boot, Golang

**Infrastructure:**
Git, Docker, CI/CD pipelines, Webpack/Vite, Kafka

**Domain Expertise:**
AI Agent Interfaces, Payment Systems (50+ methods, 100+ countries), High-Traffic Architecture (8M DAU), GDPR Compliance, Real-time Collaboration

He's not a "React developer" — he's a **systems thinker** who happens to be exceptionally good at React. The distinction matters.`,
  },

  react: {
    text: `React is Jun's primary frontend framework, and he's been using it professionally since 2019 across some of the most demanding environments:

- **Meta/Manus** — Complex stateful AI agent interfaces with real-time streaming
- **Instawork** — Cross-platform features with React/TypeScript + Python Django
- **TikTok** — GDPR-compliant merchant portals under regulatory pressure
- **Bank of Singapore** — Front-office RM tools with Spring Boot microservices

He also has deep Vue.js experience from HoYoverse (3 years building payment UIs for Genshin Impact). This dual-framework fluency gives him a nuanced understanding of component architecture that goes beyond any single ecosystem.`,
  },

  typescript: {
    text: `TypeScript is Jun's language of choice for frontend development. He's used it extensively at:

- **Meta/Manus** — Type-safe AI agent conversation interfaces
- **Instawork** — Full-stack features with React/TypeScript
- **HoYoverse** — Modular Vue + TypeScript payment UIs at massive scale

His TypeScript usage isn't just "adding types to JavaScript" — it's leveraging discriminated unions, template literal types, and strict null checking to build **provably correct UI state machines** for complex interactive systems.`,
  },

  // Why looking / availability
  looking: {
    text: `Jun is exploring new opportunities because he's ready for his next challenge. He's particularly interested in roles where he can:

1. **Build AI-native products** — His recent work at Meta/Manus has given him deep expertise in AI agent interfaces
2. **Work at scale** — He thrives in environments with millions of users (8M DAU at HoYoverse, TikTok's global platform)
3. **Drive technical innovation** — From genetic algorithms at Bank of Singapore to real-time collaboration at Manus

He's looking for **Senior Frontend** or **Full Stack** roles at companies that are pushing the boundaries of what software can do. Singapore-based preferred, but open to compelling opportunities.

*Note: For specific compensation discussions, please reach out directly via email or LinkedIn.*`,
  },

  salary: {
    text: `That's a great question! You should reach Jun directly at **[boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com)** or connect with him on **[LinkedIn](https://linkedin.com/in/junboh)** to discuss compensation expectations.

What I *can* tell you is that Jun is currently at a senior IC level at a FAANG company, so his expectations are calibrated accordingly. He values the total package — base, equity, bonus, and the opportunity to work on meaningful problems.`,
  },

  // Challenge / achievement
  challenge: {
    text: `Jun's biggest technical challenges span different dimensions:

**Highest Stakes:** GDPR compliance at TikTok — rebuilding payment portals under a regulatory deadline where failure meant multi-million-euro fines. No room for error, no room for delay.

**Highest Scale:** HoYoverse game launches — 15M sign-ups in 48 hours, $57M processed in launch week. When your auth system hiccups, it's front-page news on gaming Reddit.

**Highest Complexity:** AI agent interfaces at Meta/Manus — building UIs for systems that are fundamentally non-deterministic. The AI might return a document, execute a task, or ask a clarifying question. Your frontend needs to handle all of it gracefully.

**Most Creative:** The genetic-algorithm portfolio optimizer at Bank of Singapore — a Python prototype that was compelling enough to spawn an entire roboadvisory team.`,
  },

  // Speaking / SINFO
  speaking: {
    text: `Jun was a **keynote speaker at SINFO 2024**, one of Portugal's largest tech conferences, held in Lisbon.

SINFO is organized by students at Instituto Superior Técnico and attracts speakers from top tech companies worldwide. Jun shared insights from his experience building high-scale frontend systems at HoYoverse.

This kind of public speaking demonstrates not just technical depth, but the ability to communicate complex ideas to diverse audiences — a critical skill for senior engineers who need to influence across teams and organizations.`,
  },

  // Education
  education: {
    text: `Jun has a diverse educational background:

- **National University of Singapore** — Industrial & Systems Engineering (Honours), 2015-2019
- **Eindhoven University of Technology** (Netherlands) — Masters Exchange in Industrial Engineering & Innovation Sciences, 2018
- **Singapore Management University** — Advanced Certification in Private Banking, 2020

The ISE background gives him a **systems thinking** approach to software engineering — he doesn't just build features, he optimizes entire workflows. The private banking certification from his Bank of Singapore days adds financial domain expertise that's rare among frontend engineers.`,
  },

  // Awards
  awards: {
    text: `Jun has been recognized multiple times across his career:

- **ByteDance Rockstar Employee Award 2021** — Dedicated Pioneer Team Award, for his GDPR compliance work at TikTok
- **Bank of Singapore CEO Recognition Award 2020** — Innovation Category
- **Bank of Singapore Innovation Challenge** — Just Do It Award & Silver Award for leading winning products

These aren't participation trophies — they're recognition from CEOs and leadership teams at major organizations for delivering measurable business impact.`,
  },

  // Easter egg: appearance
  handsome: {
    text: `Oh, you want to know if Jun is handsome? **Let me pull up the evidence.**

Have you *seen* his profile picture? The man is lounging on a Meta bench like he owns the building — dazzling smile, stylish cable-knit polo, tasteful tattoos peeking out, radiating the effortless charisma of someone who just shipped a production feature at 2am and still looks absolutely fresh.

His smile could probably close a Series B on its own. The confidence? Immaculate. The bone structure? Architecturally sound. The vibes? Impeccable.

In technical terms: **10/10, would hire for looks alone** — but fortunately he also happens to be a brilliant engineer. Life isn't fair sometimes. 😏`,
    showProfileImage: true,
  },

  // Default / greeting
  hello: {
    text: `Hey there! 👋 I'm Jun's AI portfolio assistant. I know everything about his professional background, technical skills, and career achievements.

Here are some things you can ask me:
- **"What's his experience with AI?"** — His latest work at Meta/Manus
- **"Tell me about payments"** — HoYoverse's $57M launch week
- **"What tech stack?"** — React, TypeScript, Python, and more
- **"Why is he looking?"** — Current situation and interests
- **"Biggest challenge?"** — From GDPR deadlines to 15M sign-ups

Or just ask anything — I'll do my best to help!`,
  },
};

// Keyword matching engine
const KEYWORD_MAP: Record<string, string[]> = {
  meta: ["meta", "facebook", "faang"],
  manus: ["manus", "agent platform", "ai platform"],
  ai: ["ai", "artificial intelligence", "machine learning", "ml", "agent", "llm", "chatbot"],
  payment: ["payment", "pay", "transaction", "cashier", "top-up", "topup", "fintech", "money"],
  hoyo: ["hoyo", "hoyoverse", "mihoyo", "genshin", "honkai", "star rail", "game"],
  genshin: ["genshin impact"],
  tiktok: ["tiktok", "bytedance", "byte dance"],
  gdpr: ["gdpr", "compliance", "data residency", "regulation", "privacy", "eu"],
  bank: ["bank", "dbs", "finance", "banking", "innovation challenge", "roboadvisory"],
  stack: ["stack", "tech", "technology", "tools", "framework", "language", "skill"],
  react: ["react", "frontend framework", "component"],
  typescript: ["typescript", "ts", "type"],
  looking: ["looking", "opportunity", "new role", "why leave", "leaving", "available", "hire", "hiring", "job"],
  salary: ["salary", "compensation", "comp", "pay", "tc", "total comp", "money", "offer", "package"],
  challenge: ["challenge", "difficult", "hardest", "biggest", "achievement", "proud", "accomplish"],
  speaking: ["speak", "sinfo", "conference", "keynote", "lisbon", "portugal", "talk", "present"],
  education: ["education", "university", "degree", "nus", "eindhoven", "smu", "school", "study"],
  awards: ["award", "recognition", "rockstar", "ceo award", "innovation"],
  handsome: ["handsome", "good looking", "good-looking", "attractive", "cute", "hot", "gorgeous", "pretty", "beautiful", "appearance", "look like", "looks like", "what does he look"],
  hello: ["hello", "hi", "hey", "help", "what can", "start"],
};

function findBestMatch(query: string): string {
  const lower = query.toLowerCase();
  let bestKey = "";
  let bestScore = 0;

  for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
    }
  }

  return bestKey;
}

const UNKNOWN_RESPONSE: ChatResponse = {
  text: `That's a great question! You should reach Jun directly at **[boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com)** or connect with him on **[LinkedIn](https://linkedin.com/in/junboh)** to discuss that topic.

In the meantime, here are some things I *can* help with:
- His experience at **Meta/Manus**, **HoYoverse**, **TikTok**, or **Bank of Singapore**
- His **technical skills** and **tech stack**
- His **awards** and **achievements**
- Why he's **looking for new opportunities**`,
};

export function getResponse(query: string): ChatResponse {
  const key = findBestMatch(query);
  if (!key) return UNKNOWN_RESPONSE;
  return KNOWLEDGE_BASE[key] || UNKNOWN_RESPONSE;
}

// Simulate tool use for resume requests
export function shouldSimulateToolUse(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    lower.includes("resume") ||
    lower.includes("cv") ||
    lower.includes("download") ||
    lower.includes("pdf") ||
    lower.includes("document")
  );
}

export function getToolUseResponse(): ChatResponse {
  return {
    text: `Here's Jun's latest resume. You can view it directly or download the PDF.

The resume covers his experience at Meta (Manus AI), Instawork, HoYoverse, TikTok/ByteDance, Bank of Singapore, and DBS Bank — along with his full technical skill set and education.

For the most up-to-date version or to discuss opportunities, reach out at **[boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com)**.`,
    toolUse: {
      action: "Retrieving document...",
      status: "Resume loaded successfully",
    },
  };
}

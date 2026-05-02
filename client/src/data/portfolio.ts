/*
 * ============================================================================
 * askJun Portfolio Data — Glass Atelier Design
 * All professional content extracted from the latest CV (2026-04-28)
 * ============================================================================
 */

export interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: string[];
  logo?: string;
  color: string;
}

export interface Skill {
  name: string;
  category: "language" | "framework" | "tool" | "domain";
}

export interface Education {
  school: string;
  degree: string;
  year: string;
}

export const PROFILE = {
  name: "Boh Ze Jun",
  nickname: "Jun",
  title: "Senior Frontend / Full Stack Software Engineer",
  tagline: "Building AI-native interfaces & high-scale payment systems",
  summary:
    "Software Engineer who built AI agent conversation interfaces and collaboration tools at Meta (Manus AI), rebuilt the payment and accounts systems at HoYoverse to process ~USD $57m with ~70m downloads globally on the launch week of 2 new games. Led development of time sensitive features which saved TikTok millions of dollars in EU GDPR fines and also spearheaded an innovation project at Bank of Singapore, delivering $1.5m/annum in savings.",
  location: "Singapore",
  email: "boh.ze.jun@gmail.com",
  linkedin: "https://linkedin.com/in/junboh",
  github: "https://github.com/junnyboi/askjun",
};

export const EXPERIENCES: Experience[] = [
  {
    company: "Meta (Manus AI)",
    role: "Senior Frontend Software Engineer",
    location: "Singapore",
    period: "Feb 2026 — Present",
    color: "#1877F2",
    bullets: [
      "Engineered the core frontend architecture for Manus's advanced AI agent platform, building complex, stateful user interfaces for real-time human-AI interaction using React and TypeScript",
      "Developed the 'AI agent conversation' interface, implementing real-time streaming responses, context management, and interactive UI components enabling seamless multi-turn agent interactions",
      "Architected and shipped critical product features including scheduled task management, dynamic navigation systems, settings dialogs, and document previewing capabilities",
      "Built real-time collaboration and sharing features, enabling multi-user interaction with AI-generated artifacts and file actions across the platform",
    ],
  },
  {
    company: "Instawork",
    role: "Senior Full Stack Software Engineer",
    location: "Singapore",
    period: "Jul 2025 — Jan 2026",
    color: "#6366F1",
    bullets: [
      "Delivered cross-platform features for partner web and Pro mobile (Hyperview) — messaging, AI-assisted shift booking, two-sided ratings, notifications — using React/TypeScript + Python Django",
      "Extended Sendbird to auto-create multi-recruiter group channels; integrated messaging with AI booking bot to automate user booking flow",
      "Built end-to-end post-gig ratings, boosting trial-shift rating completion by 20%; fixed a legacy N+1 path causing ~20s loads for large partners, cutting latency >90%",
    ],
  },
  {
    company: "HoYoverse",
    role: "Senior Frontend Software Engineer",
    location: "Singapore / Shanghai",
    period: "Jul 2022 — Jul 2025",
    color: "#00C8FF",
    bullets: [
      "Scaled account and payments frontends for 5 flagship titles (Genshin Impact, Honkai: Star Rail, etc.) across iOS, Android, PC, PS4/PS5, and Xbox",
      "Delivered ultra-resilient auth flows handling ~15M sign-ups in 48h during launches, maintaining sub-second latency at global peak traffic",
      "Built modular Vue JS + TypeScript UIs for web top-up and in-game cashier; integrated 50+ payment methods across 100+ countries; supporting ~8M DAU and ≈ SGD 5M in daily transactions",
      "Partnered with BE/SRE to cut FE live-ops incidents by 30% and improve reliability",
      "Keynote speaker at SINFO 2024 tech conference in Lisbon, Portugal",
    ],
  },
  {
    company: "TikTok, ByteDance",
    role: "Full Stack Software Engineer",
    location: "Singapore",
    period: "Jun 2021 — Jul 2022",
    color: "#000000",
    bullets: [
      "Spearheaded GDPR/data-residency compliance for payments: rebuilt and localized merchant/advertiser and admin portals using React JS, Node JS (BFF), and Golang",
      "Implemented global payments infrastructure improving regional reliability and enabling EU/US operations without cross-border data flow",
      "Awarded the Employee Rockstar Award in 2021 and took part in the TikTok Employee Ambassador program",
    ],
  },
  {
    company: "Bank of Singapore",
    role: "Full Stack Software Engineer",
    location: "Singapore",
    period: "Jul 2019 — Apr 2021",
    color: "#C41E3A",
    bullets: [
      "Management Associate; CEO Recognition Award 2020. Engineered RM front-office app (React JS, Java Spring Boot, Kafka) replacing a manual Excel workbook, saving thousands of manhours monthly",
      "Led 2 winning Innovation Challenge products; launched RM pitch tool saving 3,680 hours globally, delivering $1.5m/annum in savings",
      "Prototyped a genetic-algorithm portfolio optimizer in Python which led to the formation of an in-house roboadvisory team",
    ],
  },
  {
    company: "DBS Bank",
    role: "Data Scientist",
    location: "Singapore",
    period: "Aug 2018 — Dec 2018",
    color: "#E31837",
    bullets: [
      "Network analysis of ~6m client relationships via graph theory; data mining and dashboard visualisations driving sales by at least 150%",
    ],
  },
];

export const SKILLS: Skill[] = [
  // Languages
  { name: "TypeScript", category: "language" },
  { name: "JavaScript", category: "language" },
  { name: "Python", category: "language" },
  { name: "Golang", category: "language" },
  { name: "Java", category: "language" },
  { name: "SQL", category: "language" },
  { name: "HTML/CSS", category: "language" },
  { name: "C#", category: "language" },
  // Frameworks
  { name: "React", category: "framework" },
  { name: "Vue.js", category: "framework" },
  { name: "Node.js", category: "framework" },
  { name: "Django", category: "framework" },
  { name: "Spring Boot", category: "framework" },
  { name: "Tailwind CSS", category: "framework" },
  { name: "Framer Motion", category: "framework" },
  { name: "Next.js", category: "framework" },
  // Tools
  { name: "Git", category: "tool" },
  { name: "Docker", category: "tool" },
  { name: "CI/CD", category: "tool" },
  { name: "Webpack/Vite", category: "tool" },
  { name: "Kafka", category: "tool" },
  { name: "Shell", category: "tool" },
  // Domains
  { name: "AI Agent Interfaces", category: "domain" },
  { name: "Payment Systems", category: "domain" },
  { name: "High-Traffic Architecture", category: "domain" },
  { name: "GDPR Compliance", category: "domain" },
  { name: "Real-time Collaboration", category: "domain" },
];

export const EDUCATION: Education[] = [
  {
    school: "Singapore Management University",
    degree: "Advanced Certification in Private Banking",
    year: "2020",
  },
  {
    school: "Eindhoven University of Technology",
    degree: "Industrial Engineering & Innovation Sciences (Masters), Exchange",
    year: "2018",
  },
  {
    school: "National University of Singapore",
    degree: "Industrial & Systems Engineering (Honours)",
    year: "2015 — 2019",
  },
];

export const HIGHLIGHTS = [
  { metric: "~$57M", label: "Processed on launch week", context: "HoYoverse" },
  { metric: "15M+", label: "Sign-ups in 48 hours", context: "HoYoverse" },
  { metric: "8M", label: "Daily active users", context: "HoYoverse" },
  { metric: "$1.5M", label: "Annual savings delivered", context: "Bank of Singapore" },
  { metric: "100+", label: "Countries supported", context: "Payment Systems" },
  { metric: "50+", label: "Payment methods integrated", context: "HoYoverse" },
];

export const CHAT_SUGGESTIONS = [
  "What's Jun's experience with AI agent interfaces?",
  "Tell me about the payment systems he built",
  "What tech stack does Jun work with?",
  "Why is he looking for new opportunities?",
  "What was his biggest technical challenge?",
  "Tell me about his work at Meta/Manus",
];

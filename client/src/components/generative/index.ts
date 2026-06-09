/**
 * Generative UI — Detects when to render interactive components in chat
 * instead of plain markdown text.
 * 
 * Returns a component type based on the user's query keywords.
 * The chat engine checks this BEFORE sending to the API — if a generative UI
 * component matches, it's rendered alongside the text response.
 */

export type GenerativeUIType = "timeline" | "skills" | "metrics" | "education" | null;

const TIMELINE_KEYWORDS = [
  "timeline", "career timeline", "career history", "work history",
  "career path", "career journey", "experience timeline",
  "where has he worked", "companies he worked",
];

const SKILLS_KEYWORDS = [
  "tech stack", "technology stack", "skills", "what technologies",
  "programming languages", "frameworks", "tools he uses",
  "what can he code", "technical skills",
];

const METRICS_KEYWORDS = [
  "metrics", "achievements", "impact", "numbers",
  "key metrics", "biggest achievement", "accomplishments",
  "what has he achieved", "results",
];

const EDUCATION_KEYWORDS = [
  "education", "university", "degree", "school",
  "where did he study", "academic", "qualification",
  "NUS", "SMU", "eindhoven",
];

/**
 * Detect if a user query should trigger a generative UI component.
 * Returns the component type or null if no match.
 */
export function detectGenerativeUI(query: string): GenerativeUIType {
  const lower = query.toLowerCase();
  
  if (TIMELINE_KEYWORDS.some(kw => lower.includes(kw))) return "timeline";
  if (SKILLS_KEYWORDS.some(kw => lower.includes(kw))) return "skills";
  if (METRICS_KEYWORDS.some(kw => lower.includes(kw))) return "metrics";
  if (EDUCATION_KEYWORDS.some(kw => lower.includes(kw))) return "education";
  
  return null;
}

export { ChatTimeline } from "./ChatTimeline";
export { ChatSkillsChart } from "./ChatSkillsChart";
export { ChatMetricsCard } from "./ChatMetricsCard";
export { ChatEducationTimeline } from "./ChatEducationTimeline";

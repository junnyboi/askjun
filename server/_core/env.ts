export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // LLM: prefer own keys, fallback to Manus Forge when deployed on Manus
  llmApiUrl: process.env.LLM_API_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "https://api.openai.com",
  llmApiKey: process.env.LLM_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Admin dashboard password
  adminPassword: process.env.ADMIN_PASSWORD ?? "mijun",
};

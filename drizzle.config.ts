import { defineConfig } from "drizzle-kit";

// Dual-dialect support: prefer Supabase (Postgres), fallback to MySQL
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const dialect = process.env.SUPABASE_DATABASE_URL ? "postgresql" : "mysql";

if (!connectionString) {
  throw new Error("Either SUPABASE_DATABASE_URL or DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: dialect as "mysql" | "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

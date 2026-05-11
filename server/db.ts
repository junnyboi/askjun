/**
 * Dual-driver database connection:
 *   Priority 1: SUPABASE_DATABASE_URL (Postgres) — your own infrastructure
 *   Priority 2: DATABASE_URL (MySQL/TiDB) — Manus fallback
 *   Neither: DB disabled, site runs with client-side fallback only
 */
import { eq } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";

let _db: any = null;
let _dbDialect: "postgres" | "mysql" | null = null;

export async function getDb() {
  if (_db) return _db;

  // Priority 1: Supabase (Postgres)
  if (process.env.SUPABASE_DATABASE_URL) {
    try {
      const client = postgres(process.env.SUPABASE_DATABASE_URL);
      _db = drizzlePg(client);
      _dbDialect = "postgres";
      console.log("[Database] Connected to Supabase (Postgres)");
      return _db;
    } catch (error) {
      console.warn("[Database] Supabase connection failed, trying fallback:", error);
    }
  }

  // Priority 2: Manus TiDB / any MySQL (fallback)
  if (process.env.DATABASE_URL) {
    try {
      _db = drizzleMysql(process.env.DATABASE_URL);
      _dbDialect = "mysql";
      console.log("[Database] Connected to MySQL/TiDB (fallback)");
      return _db;
    } catch (error) {
      console.warn("[Database] MySQL connection failed:", error);
    }
  }

  console.warn("[Database] No database configured — analytics disabled");
  return null;
}

export function getDbDialect() {
  return _dbDialect;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // MySQL uses onDuplicateKeyUpdate, Postgres would use onConflictDoUpdate
    // For now, MySQL path is active (Manus fallback). When Supabase is connected,
    // this upsert function is not called (no OAuth = no user creation).
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

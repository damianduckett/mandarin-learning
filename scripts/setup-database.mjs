import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Run `neon env pull -e DATABASE_URL --file .env.local` first.");
}

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`CREATE INDEX IF NOT EXISTS user_progress_updated_at_idx ON user_progress (updated_at DESC)`;

const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
const required = ["account", "session", "user", "user_progress", "verification"];
const present = new Set(tables.map((row) => row.tablename));
const missing = required.filter((name) => !present.has(name));

if (missing.length) throw new Error(`Database setup is incomplete. Missing: ${missing.join(", ")}`);
const [userCount] = await sql`SELECT COUNT(*)::int AS count FROM "user"`;
const [progressCount] = await sql`SELECT COUNT(*)::int AS count FROM user_progress`;
console.log(`Database ready: ${required.join(", ")} (${userCount.count} users, ${progressCount.count} synced progress rows)`);

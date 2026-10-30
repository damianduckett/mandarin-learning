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

await sql`CREATE TABLE IF NOT EXISTS fsrs_cards (
  user_id TEXT NOT NULL,
  phrase_id INTEGER NOT NULL,
  due TIMESTAMPTZ NOT NULL,
  stability DOUBLE PRECISION NOT NULL,
  difficulty DOUBLE PRECISION NOT NULL,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  last_review TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, phrase_id)
)`;
await sql`CREATE TABLE IF NOT EXISTS review_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  phrase_id INTEGER NOT NULL,
  client_event_id TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL,
  rating INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  previous_due TIMESTAMPTZ,
  new_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_event_id)
)`;
await sql`CREATE INDEX IF NOT EXISTS review_events_card_idx ON review_events (user_id, phrase_id, reviewed_at)`;

const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
const required = ["account", "session", "user", "user_progress", "verification"];
const present = new Set(tables.map((row) => row.tablename));
const missing = required.filter((name) => !present.has(name));

if (missing.length) throw new Error(`Database setup is incomplete. Missing: ${missing.join(", ")}`);
const [userCount] = await sql`SELECT COUNT(*)::int AS count FROM "user"`;
const [progressCount] = await sql`SELECT COUNT(*)::int AS count FROM user_progress`;
console.log(`Database ready: ${required.join(", ")} (${userCount.count} users, ${progressCount.count} synced progress rows)`);

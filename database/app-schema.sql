CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_progress_updated_at_idx ON user_progress (updated_at DESC);

-- 004: Plan-basierte Feature-Flags
-- Wie bei TableTool: plan_default vs manual_override.

CREATE TABLE IF NOT EXISTS feature_flags (
  id                  SERIAL PRIMARY KEY,
  workshop_id         INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  flag                TEXT NOT NULL,
  enabled             BOOLEAN NOT NULL,
  is_manual_override  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workshop_id, flag)
);

CREATE INDEX IF NOT EXISTS idx_flags_workshop ON feature_flags(workshop_id);

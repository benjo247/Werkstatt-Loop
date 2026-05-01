-- 001: Werkstätten und User-Verknüpfungen
-- Multi-Tenant-Basis. Jede Tabelle ab hier hat workshop_id als Tenant-Filter.

CREATE TABLE IF NOT EXISTS workshops (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free', 'starter', 'pro', 'premium', 'pilot')),
  city            TEXT,
  email           TEXT,
  phone           TEXT,
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#dc2626',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  clerk_user_id   TEXT NOT NULL UNIQUE,
  workshop_id     INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  email           TEXT,
  role            TEXT NOT NULL DEFAULT 'owner'
                    CHECK (role IN ('owner', 'staff', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk    ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_workshop ON users(workshop_id);

-- 006: Erweiterte Werkstatt-Stammdaten

ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS street          TEXT,
  ADD COLUMN IF NOT EXISTS postal_code     TEXT,
  ADD COLUMN IF NOT EXISTS website_url     TEXT,
  ADD COLUMN IF NOT EXISTS owner_name      TEXT,
  ADD COLUMN IF NOT EXISTS vat_id          TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours   JSONB,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- opening_hours als JSON: { mon: {open: "08:00", close: "17:00"}, tue: {...}, ..., sun: null }
-- null = geschlossen

-- Default-Öffnungszeiten für jupps-garage
UPDATE workshops
SET opening_hours = '{
  "mon": {"open": "08:00", "close": "17:00"},
  "tue": {"open": "08:00", "close": "17:00"},
  "wed": {"open": "08:00", "close": "17:00"},
  "thu": {"open": "08:00", "close": "17:00"},
  "fri": {"open": "08:00", "close": "14:00"},
  "sat": null,
  "sun": null
}'::jsonb,
street = 'Moltkestraße 1',
postal_code = '34225',
website_url = 'https://juppsgarage-baunatal.de'
WHERE slug = 'jupps-garage' AND opening_hours IS NULL;

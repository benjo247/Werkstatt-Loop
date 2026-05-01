-- 003: Online-Buchungen (vom Buchungs-Widget der Werkstatt-Webseite)

CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  workshop_id     INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id     INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Snapshot der Eingabe (auch wenn Customer/Vehicle später entkoppelt werden)
  customer_name   TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  license_plate   TEXT NOT NULL,
  vehicle         TEXT,
  service         TEXT NOT NULL,

  -- Termin (UTC speichern, in Berlin-Zeit anzeigen)
  preferred_date  DATE NOT NULL,
  preferred_time  TEXT NOT NULL,
  notes           TEXT,

  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'confirmed', 'declined', 'completed', 'no_show')),
  source          TEXT DEFAULT 'web',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_workshop ON bookings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created  ON bookings(workshop_id, created_at DESC);

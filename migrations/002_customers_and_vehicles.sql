-- 002: Kunden und Fahrzeuge

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  workshop_id     INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_workshop ON customers(workshop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email    ON customers(workshop_id, email);

CREATE TABLE IF NOT EXISTS vehicles (
  id                SERIAL PRIMARY KEY,
  workshop_id       INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id       INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  license_plate     TEXT NOT NULL,
  brand             TEXT,
  model             TEXT,
  year              INTEGER,
  vin               TEXT,
  hu_due_date       DATE,
  last_service_at   DATE,
  km_stand          INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_workshop ON vehicles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate    ON vehicles(workshop_id, license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_hu       ON vehicles(workshop_id, hu_due_date);

-- 007: Fahrzeugschein-Upload mit DSGVO-Konsens

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS vehicle_registration_url   TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_registration_data  JSONB,
  ADD COLUMN IF NOT EXISTS vin                        TEXT,
  ADD COLUMN IF NOT EXISTS first_registration         DATE,
  ADD COLUMN IF NOT EXISTS hu_due_date                DATE,

  -- DSGVO-Konsens-Tracking (Pflicht-Audit-Trail)
  ADD COLUMN IF NOT EXISTS consent_ocr_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_storage_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_ip                 TEXT,

  -- Auto-Löschung: 30 Tage nach Termin-Abschluss
  ADD COLUMN IF NOT EXISTS auto_delete_at             TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_auto_delete ON bookings(auto_delete_at)
  WHERE auto_delete_at IS NOT NULL;

-- 008: Datenminimal-Modus pro Werkstatt
-- Wenn TRUE: Fahrzeugschein-Bilder werden nach OCR sofort gelöscht,
-- nur die extrahierten Daten bleiben in der DB.

ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS data_minimal_mode BOOLEAN NOT NULL DEFAULT FALSE;

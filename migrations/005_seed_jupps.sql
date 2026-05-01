-- 005: Seed-Daten für Jupp's Garage Demo
-- Idempotent: lässt sich mehrfach ausführen.

INSERT INTO workshops (slug, name, plan, city, email, phone, primary_color)
VALUES (
  'jupps-garage', 'Jupp''s Garage', 'pilot', 'Baunatal',
  'Info@Juppsgarage-baunatal.de', '05601 87652', '#dc2626'
)
ON CONFLICT (slug) DO NOTHING;

-- Demo-Buchungen, damit das Dashboard nicht leer ist
WITH ws AS (SELECT id FROM workshops WHERE slug = 'jupps-garage')
INSERT INTO bookings (
  workshop_id, customer_name, email, license_plate, vehicle,
  service, preferred_date, preferred_time, status, source, created_at
)
SELECT ws.id, v.name, v.email, v.plate, v.vehicle,
       v.service, v.pdate, v.ptime, v.status, 'web', v.created_at
FROM ws,
(VALUES
  ('Andrea Schuster',  'a.schuster@web.de',     'KS-AS 4471', 'VW Golf VII',
   'HU + AU',         CURRENT_DATE + 7,  '09:30', 'new',       NOW() - INTERVAL '23 minutes'),
  ('Yusuf Aydin',      'yusuf.a@gmail.com',     'KS-YA 2099', 'Audi A4 Avant',
   'Inspektion',      CURRENT_DATE + 10, '08:00', 'new',       NOW() - INTERVAL '1 hour'),
  ('Markus Vogel',     'm.vogel@t-online.de',   'KS-MV 23',   'Opel Astra K',
   'Klimaservice',    CURRENT_DATE + 5,  '14:30', 'new',       NOW() - INTERVAL '2 hours'),
  ('Sabine Hartmann',  'hartmann.s@gmx.de',     'KS-SH 1110', 'VW Polo',
   'Reifenservice',   CURRENT_DATE + 4,  '14:30', 'confirmed', NOW() - INTERVAL '4 hours'),
  ('Thomas Berger',    't.berger@email.de',     'KS-TB 882',  'Skoda Octavia',
   'HU + AU',         CURRENT_DATE + 6,  '11:00', 'confirmed', NOW() - INTERVAL '1 day')
) AS v(name, email, plate, vehicle, service, pdate, ptime, status, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.workshop_id = ws.id AND b.customer_name = v.name AND b.preferred_date = v.pdate
);

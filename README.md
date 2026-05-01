# WerkstattLoop · v0.2

Marketing-Add-on für Kfz-Werkstätten — Next.js 14, Clerk Auth, Neon Postgres, Vercel.
Mit DSGVO-konformem Fahrzeugschein-Upload + KI-OCR via Anthropic Vision.

## Was ist neu in v0.2

- **Settings-Page** unter `/dashboard/einstellungen` — Werkstatt-Profil, Branding, Öffnungszeiten, Plan-Anzeige
- **Fahrzeugschein-Upload** im Buchungs-Widget mit Anthropic Vision OCR
- **DSGVO-Konsens-Tracking** (zwei separate Einwilligungen, Audit-Log)
- **Vercel Blob** für Bild-Speicherung (Region Frankfurt)
- **Datenschutzerklärung** unter `/datenschutz`
- **Buchungs-Tabelle** zeigt Fahrzeugschein-Vorschau + extrahierte FIN

## Stack

| Schicht         | Wahl                                    |
|-----------------|-----------------------------------------|
| Framework       | Next.js 14 (App Router)                 |
| Auth            | Clerk                                   |
| Datenbank       | Neon Postgres (eu-central-1)            |
| Hosting         | Vercel                                  |
| Storage         | Vercel Blob (eu-central-1)              |
| KI / OCR        | Anthropic Claude Vision                 |
| Styling         | Tailwind CSS 3                          |

## Deployment-Update von v0.1 → v0.2

### 1. Neue Environment Variables in Vercel

Zwei zusätzliche Variablen in Vercel Settings → Environment Variables:

| Variable | Wert | Wo bekommst du den |
|----------|------|-------------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | console.anthropic.com → API Keys |
| `BLOB_READ_WRITE_TOKEN` | wird automatisch gesetzt | siehe Schritt 2 unten |

### 2. Vercel Blob aktivieren

1. Vercel Dashboard → dein Projekt → **Storage**-Tab
2. **Create Database** → **Blob**
3. Region: **Frankfurt (fra1)**
4. Name: `werkstattloop-blob`
5. Connect to Project → automatisch wird `BLOB_READ_WRITE_TOKEN` gesetzt

### 3. Migrations ausführen

In Neon SQL Editor:

- `migrations/006_workshop_profile_fields.sql` → Run
- `migrations/007_vehicle_registration.sql` → Run

### 4. Deploy

Repo aktualisieren (alle Dateien aus dieser ZIP überschreiben), Vercel deployt automatisch.

## API-Endpunkte

| Methode | Pfad                                          | Auth   | Zweck                                |
|---------|-----------------------------------------------|--------|--------------------------------------|
| GET     | `/api/bookings`                               | Clerk  | Eigene Werkstatt-Buchungen           |
| PATCH   | `/api/bookings`                               | Clerk  | Status ändern                        |
| POST    | `/api/public/bookings`                        | CORS   | Externe Werkstatt-Webseiten          |
| POST    | `/api/public/ocr/vehicle-registration`        | CORS   | Fahrzeugschein-OCR mit Konsens       |
| GET/PATCH | `/api/workshops/me`                         | Clerk  | Werkstatt-Profil verwalten           |
| POST    | `/api/webhooks/clerk`                         | Svix   | Auto-Setup neuer User                |

## DSGVO-Workflow Fahrzeugschein

1. Kunde wählt im Buchungstool "Fahrzeugschein hochladen"
2. **Zwei separate Checkboxen** mit Einwilligung erscheinen:
   - KI-Verarbeitung (Übermittlung an Anthropic, USA)
   - Cloud-Speicherung (Vercel Blob, Frankfurt, 30 Tage)
3. Beide müssen aktiv angekreuzt werden, sonst kein Upload
4. Konsens wird mit Timestamp + IP-Hash in DB gespeichert (`consent_ocr_at`, `consent_storage_at`, `consent_ip`)
5. Bei Speicher-Konsens: Bild → Vercel Blob, URL in DB
6. Bei OCR-Konsens: Bild → Anthropic Vision → JSON
7. Daten werden automatisch in nächstem Buchungs-Schritt vorausgefüllt
8. Cron-Job (kommt später) löscht Bilder 30 Tage nach Termin-Abschluss

## Struktur

```
app/
├── api/
│   ├── bookings/route.js
│   ├── public/
│   │   ├── bookings/route.js
│   │   └── ocr/vehicle-registration/route.js   ← NEU
│   ├── workshops/me/route.js                    ← NEU
│   └── webhooks/clerk/route.js
├── dashboard/
│   ├── layout.js, page.js
│   ├── buchungen/page.js
│   ├── einstellungen/page.js                    ← NEU
│   ├── kunden/, erinnerungen/, bonusheft/      (Stubs)
├── datenschutz/page.js                          ← NEU
├── sign-in/, sign-up/, onboarding/, admin/

components/
├── Sidebar.js
├── ui/StatusPill.js
└── dashboard/
    ├── UbersichtView.js
    ├── BuchungenView.js                         (mit Schein-Vorschau)
    └── EinstellungenView.js                     ← NEU

migrations/
├── 001-005 (wie v0.1)
├── 006_workshop_profile_fields.sql              ← NEU
└── 007_vehicle_registration.sql                 ← NEU

lib/
├── db.js, context.js, cors.js, format.js
```

## Anthropic API Key holen

1. [console.anthropic.com](https://console.anthropic.com) → Account erstellen oder einloggen
2. Settings → **API Keys** → **Create Key**
3. Workspace wählen (oder "Default" lassen)
4. Key kopieren (beginnt mit `sk-ant-api03-`)
5. In Vercel als `ANTHROPIC_API_KEY` setzen
6. Redeploy

Kosten: ~0,01 € pro Fahrzeugschein-Analyse (Claude 4.7 Vision).
Free Tier von Anthropic gibt dir initial 5 $ Guthaben — reicht für ~500 Tests.

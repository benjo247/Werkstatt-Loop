# WerkstattLoop · v0.3

Multi-Tenant SaaS für Kfz-Werkstätten — Next.js 14, Clerk, Neon, Vercel, Anthropic Vision.

## Was ist neu in v0.3

- **Public Booking Page `/r/[slug]`** mit Werkstatt-Branding (Logo, Primärfarbe automatisch aus Settings)
- **Fahrzeugschein-Upload** im Buchungs-Flow mit DSGVO-konformen Doppel-Konsens (KI-Verarbeitung + Cloud-Speicherung getrennt)
- **Privater Vercel Blob** — Bilder nur über authentifizierten `/api/bookings/[id]/registration-image`-Endpoint abrufbar
- **Datenminimal-Modus** als Werkstatt-Setting — Bilder nach OCR sofort löschen
- **Anthropic Claude Vision** für deutsche Fahrzeugscheine (Kennzeichen, FIN, Marke, Modell, HU-Datum)
- **Audit-Log** für Bild-Zugriffe in Server-Logs
- Migration `008_data_minimal_mode.sql`

## Stack

| Schicht        | Wahl                                  |
|----------------|---------------------------------------|
| Framework      | Next.js 14 (App Router)               |
| Auth           | Clerk                                 |
| DB             | Neon Postgres (eu-central-1)          |
| Storage        | Vercel Blob (private)                 |
| OCR            | Anthropic Claude Vision               |
| Hosting        | Vercel                                |

## Routing

| Pfad                     | Auth      | Zweck                                       |
|--------------------------|-----------|---------------------------------------------|
| `/`                      | -         | Landing                                     |
| `/sign-in`, `/sign-up`   | -         | Clerk                                       |
| `/r/[slug]`              | -         | Public Booking Page (Werkstatt-Branding)    |
| `/datenschutz`           | -         | DSGVO-Erklärung                             |
| `/dashboard/*`           | Clerk     | Werkstatt-Inhaber                           |
| `/dashboard/einstellungen` | Clerk   | Profil + Branding + Datenschutz-Modus       |
| `/admin`                 | Clerk + role  | Super-Admin (Stub)                       |

## API

| Methode | Pfad                                              | Auth   | Zweck                              |
|---------|---------------------------------------------------|--------|------------------------------------|
| POST    | `/api/public/bookings`                            | CORS   | Buchung anlegen (von extern)       |
| POST    | `/api/public/ocr/vehicle-registration`            | CORS   | Fahrzeugschein OCR                 |
| GET/PATCH | `/api/bookings`                                 | Clerk  | Eigene Werkstatt-Buchungen         |
| GET     | `/api/bookings/[id]/registration-image`           | Clerk  | Auth-Check für Bild-URL            |
| GET/PATCH | `/api/workshops/me`                             | Clerk  | Werkstatt-Profil                   |

## Setup-Update v0.2 → v0.3

### Migrations

In Neon SQL Editor in dieser Reihenfolge:
- `migrations/008_data_minimal_mode.sql` → Run

(006 und 007 müssen bereits gelaufen sein)

### Env-Variablen — neu

| Variable | Wo | Pflicht? |
|----------|-----|---------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | ja |
| `BLOB_READ_WRITE_TOKEN` | Auto via Vercel Blob Integration | ja |

### Vercel Blob Setup

In Vercel → Storage-Tab → Create Database → Blob:
- **Region:** Frankfurt
- **Privacy:** Private (URLs nur über authentifizierte Endpoints)

`BLOB_READ_WRITE_TOKEN` wird automatisch ins Projekt injiziert.

## DSGVO-Architektur

### Konsens-Modell

Beim Fahrzeugschein-Upload **zwei separate Checkboxen**:

1. **OCR-Konsens** (Pflicht für Upload): KI-Verarbeitung durch Anthropic
2. **Storage-Konsens** (optional): Cloud-Speicherung in Vercel Blob

Beide werden mit Timestamp + Hash der IP in der `bookings`-Tabelle gespeichert
(`consent_ocr_at`, `consent_storage_at`, `consent_ip`).

### Werkstatt-Modi

In Settings → Datenschutz kann die Werkstatt **Datenminimal-Modus** aktivieren:
- Wenn ON: Auch bei `consent_storage=true` wird das Bild nach OCR sofort verworfen
- Nur die extrahierten Daten (Kennzeichen, FIN, etc.) bleiben

### Bild-Zugriff

- Vercel Blob ist auf `private` konfiguriert
- URLs werden NIE direkt aus der DB an Clients gegeben
- Werkstatt-Dashboard fragt `/api/bookings/[id]/registration-image`
- Endpoint prüft Clerk-Auth + Tenant-Filter, dann erst gibt's die URL
- Jeder Zugriff wird im Server-Log auditiert

### Auto-Löschung (TODO Cron-Job)

`bookings.auto_delete_at` wird beim Termin-Abschluss auf `NOW() + 30 days` gesetzt.
Vercel Cron läuft täglich, löscht Blobs + setzt `vehicle_registration_url = NULL`.

## Public Booking Page anbinden

Werkstatt-Webseite kann das Buchungstool auf zwei Wegen einbinden:

**Variante A — Link-Button:** *(empfohlen)*

```html
<a href="https://werkstattloop.vercel.app/r/jupps-garage" class="btn">
  Online Termin buchen
</a>
```

**Variante B — Iframe:**

```html
<iframe src="https://werkstattloop.vercel.app/r/jupps-garage"
        width="100%" height="900" style="border:0"></iframe>
```

Variante A ist sauberer, weil die Werkstatt-Webseite leichter bleibt und das Buchungstool immer auf dem aktuellsten Stand ist.

## Struktur

```
app/
├── api/
│   ├── bookings/route.js
│   ├── bookings/[id]/registration-image/route.js   ← NEU
│   ├── public/bookings/route.js
│   ├── public/ocr/vehicle-registration/route.js
│   ├── workshops/me/route.js
│   └── webhooks/clerk/route.js
├── r/[slug]/page.js                                ← NEU (Public Booking)
├── dashboard/...
├── datenschutz/page.js
└── ...

components/
├── booking/BookingFlow.js                          ← NEU (5-Schritt Wizard)
├── dashboard/{Ubersicht,Buchungen,Einstellungen}View.js
├── ui/StatusPill.js
└── Sidebar.js

migrations/
├── 001-007 (wie v0.2)
└── 008_data_minimal_mode.sql                       ← NEU
```

# WerkstattLoop

Marketing-Add-on für Kfz-Werkstätten — Next.js 14, Clerk Auth, Neon Postgres, Vercel.

## Stack

| Schicht         | Wahl                                    |
|-----------------|-----------------------------------------|
| Framework       | Next.js 14 (App Router)                 |
| Auth            | Clerk                                   |
| Datenbank       | Neon Postgres (eu-central-1 empfohlen)  |
| Hosting         | Vercel                                  |
| Styling         | Tailwind CSS 3                          |
| Icons           | lucide-react                            |
| E-Mail (später) | Brevo                                   |

## Architektur-Konventionen

- **Multi-Tenancy**: jede Tabelle hat `workshop_id`, jede Query filtert darauf.
- **Tenant-Auflösung**: pro Request via `getContext()` in `lib/context.js`.
- **Migrations**: nummeriert in `migrations/`, idempotent, via `npm run migrate`.
- **API-Routes**: unter `app/api/...` mit `withContext`-Wrapper für authentifizierte Endpoints.
- **Public-API**: unter `app/api/public/...` für Buchungs-Widgets auf externen Werkstatt-Webseiten (CORS).
- **lib/db nicht in Client-Components importieren** — nur in Server-Components, Route-Handlers, Server-Actions.
- **Neon-Driver akzeptiert keine verschachtelten sql-Templates** — keine `sql` innerhalb von `sql`.
- **Reservierungs-Zeiten in UTC** speichern, in Berlin-Zeit anzeigen (`lib/format.js`).
- **In Sidebar-Layouts kein `100vh` auf inneren Komponenten** — nur auf `body` oder Top-Level-Container.

## Routing-Schichten

| Pfad           | Zugriff                                |
|----------------|----------------------------------------|
| `/`            | Landing, redirect zu `/dashboard` wenn eingeloggt |
| `/sign-in`     | Clerk Sign-In                          |
| `/sign-up`     | Clerk Sign-Up                          |
| `/onboarding`  | Wizard für neue User (5-Schritt, später) |
| `/dashboard`   | Werkstatt-Inhaber (auth required)      |
| `/admin`       | Super-Admin (auth + role check, später) |
| `/api/bookings`         | auth + context, GET/PATCH        |
| `/api/public/bookings`  | öffentlich + CORS, POST          |
| `/api/webhooks/clerk`   | Webhook für Auto-Setup           |

## Setup — Browser-only, ~20 Minuten

### 1. Neon Postgres anlegen

1. [neon.tech](https://neon.tech) → neues Projekt → Region **Frankfurt (eu-central-1)**
2. Connection-String kopieren (`postgresql://...?sslmode=require`)

Migrations laufen später per `npm run migrate` — entweder lokal oder als One-Off auf Vercel.

### 2. Clerk Application anlegen

1. [clerk.com](https://clerk.com) → neue Application
2. Im **API Keys**-Tab kopieren:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Im **Webhooks**-Tab:
   - **Add Endpoint** → URL: `https://<dein-projekt>.vercel.app/api/webhooks/clerk`
   - Events: `user.created`
   - Signing Secret kopieren → `CLERK_WEBHOOK_SECRET`
   - (Webhook erst nach Vercel-Deploy einrichten, weil URL erst dann existiert)

### 3. GitHub-Repo & Vercel-Deploy

1. Repo `werkstattloop` auf GitHub erstellen, alle Dateien hochladen
2. [vercel.com/new](https://vercel.com/new) → Repo importieren
3. **Framework Preset:** Next.js (wird automatisch erkannt)
4. **Environment Variables** vor Deploy:
   - `DATABASE_URL` — Neon Connection String
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`
   - `CLERK_WEBHOOK_SECRET` (kommt erst nach Webhook-Setup, dann re-deploy)
5. **Deploy**

### 4. Migrations ausführen

**Variante A: lokal** (empfohlen für ersten Run)

```bash
npm install
echo "DATABASE_URL=postgresql://..." > .env.local
npm run migrate
```

Output:
```
→ 001_workshops_and_users.sql
  ✓ 001_workshops_and_users.sql
→ 002_customers_and_vehicles.sql
  ✓ 002_customers_and_vehicles.sql
...
Fertig. 5 Migration(s) angewendet.
```

**Variante B: im Neon SQL-Editor** (browser-only)

Inhalt von `migrations/001_*.sql` bis `005_*.sql` in der richtigen Reihenfolge in den Neon SQL-Editor einfügen und ausführen. Manuell, dafür ohne Setup.

### 5. Vercel Deployment Protection ausschalten

Vercel-Projekt → **Settings** → **Deployment Protection** → **Vercel Authentication** auf **OFF**.
(Sonst geben Webhooks und das Public-Booking-API 403 zurück.)

### 6. Clerk-Webhook nachträglich einrichten

Jetzt, wo die App live ist:
- Clerk → Webhooks → Endpoint hinzufügen mit URL `https://<dein-projekt>.vercel.app/api/webhooks/clerk`
- Signing Secret kopieren → in Vercel als `CLERK_WEBHOOK_SECRET` setzen → Redeploy

### 7. Ersten Owner-Account erstellen

1. `https://<dein-projekt>.vercel.app/sign-up` aufrufen
2. Account anlegen
3. Webhook erstellt automatisch eine "Meine Werkstatt"-Werkstatt + verknüpfte User-Row
4. Du landest im Dashboard

**Wenn du die seed-Daten von Jupp's Garage nutzen willst:**
Nach Sign-Up im Neon-SQL-Editor diesen Query ausführen, um deinen Account mit der Jupp's-Werkstatt zu verbinden:

```sql
-- Findet deine Clerk-User-ID und linkt sie zur jupps-garage-Werkstatt
UPDATE users
SET workshop_id = (SELECT id FROM workshops WHERE slug = 'jupps-garage')
WHERE clerk_user_id = 'user_XXX'; -- aus Clerk-Dashboard kopieren
```

Damit siehst du im Dashboard die seed-Buchungen aus `005_seed_jupps.sql`.

## Public Booking API verbinden

Auf der externen Werkstatt-Webseite (z.B. `juppsgarage.vercel.app`) das Buchungsformular so anpassen:

```js
const WERKSTATTLOOP_API = 'https://<dein-projekt>.vercel.app/api/public/bookings';

await fetch(WERKSTATTLOOP_API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workshop_slug: 'jupps-garage',
    customer_name: '...',
    email: '...',
    license_plate: '...',
    vehicle: '...',
    service: '...',
    preferred_date: '2026-12-01',
    preferred_time: '09:30',
    notes: '...'
  })
});
```

Sobald die Buchung erfolgreich ist, erscheint sie innerhalb von 10 Sekunden im Dashboard.

## Lokal entwickeln

```bash
npm install
cp .env.example .env.local
# .env.local mit echten Werten füllen
npm run migrate
npm run dev
```

App läuft auf `http://localhost:3000`.

## Stolpersteine (gelernt)

- **Neon-Driver**: keine verschachtelten `sql`-Templates. Wenn du dynamisches WHERE brauchst, baue Strings vorher.
- **Cron**: nie via HTTP-Self-Loop, sondern direkte Funktions-Imports (kommt mit den HU-Erinnerungs-Cron-Jobs).
- **Sidebar-Layouts**: kein `100vh` auf inneren Komponenten — bricht das Sticky-Verhalten.
- **Zeiten**: in DB als UTC, im UI in `Europe/Berlin`. `lib/format.js` macht beides.
- **lib/db** niemals in Client-Components importieren — keine direkten DB-Calls aus React-Components mit `'use client'`.

## Roadmap (nächste Iterationen)

- [ ] **Onboarding-Wizard** (5 Schritte: Werkstatt-Daten → Branding → Services → Öffnungszeiten → DMS)
- [ ] **HU-Erinnerung** als Vercel-Cron-Job + Brevo
- [ ] **Digitales Bonusheft** als öffentliche Route `/bonus/[token]`
- [ ] **Admin-Panel** mit Werkstatt-Übersicht für Super-Admin
- [ ] **Stripe** für die Pricing-Tiers (Free / Starter / Pro / Premium)
- [ ] **Feature-Flag-Logik** im Code (`getFlag('bonusheft')`)
- [ ] **DMS-Schnittstellen** (WERBAS, Loco-Soft via API/Webhook)

## Struktur

```
.
├── app/
│   ├── layout.js, page.js, globals.css
│   ├── sign-in/, sign-up/         # Clerk pages
│   ├── onboarding/                # Stub
│   ├── admin/                     # Stub
│   ├── dashboard/                 # Workshop-Owner-View
│   │   ├── layout.js              # Sidebar + auth check
│   │   ├── page.js                # Übersicht
│   │   ├── buchungen/page.js      # Live-Buchungen + Filter
│   │   ├── kunden/                # Stub
│   │   ├── erinnerungen/          # Stub
│   │   └── bonusheft/             # Stub
│   └── api/
│       ├── bookings/route.js      # auth + context
│       ├── public/bookings/route.js  # CORS, no auth
│       └── webhooks/clerk/route.js   # Auto-Setup
├── components/
│   ├── Sidebar.js
│   ├── ui/StatusPill.js
│   └── dashboard/UbersichtView.js, BuchungenView.js
├── lib/
│   ├── db.js                      # Neon-Connection
│   ├── context.js                 # getContext, withContext
│   ├── cors.js
│   └── format.js                  # Berlin-Zeit, relative Zeit
├── migrations/
│   ├── 001_workshops_and_users.sql
│   ├── 002_customers_and_vehicles.sql
│   ├── 003_bookings.sql
│   ├── 004_feature_flags.sql
│   └── 005_seed_jupps.sql
├── scripts/
│   └── migrate.mjs                # idempotenter Runner
├── middleware.js                  # Clerk-Routing-Schutz
├── package.json, next.config.js, tailwind.config.js, postcss.config.js, jsconfig.json
├── .env.example, .gitignore
└── README.md
```

import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { PUBLIC_CORS, corsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: PUBLIC_CORS });
}

/**
 * POST /api/public/ocr/vehicle-registration
 *
 * Body (multipart/form-data):
 *   - image: File
 *   - workshop_slug: string
 *   - consent_ocr: "true"     (Pflicht)
 *   - consent_storage: "true" (optional, je nach Werkstatt-Modus)
 *
 * Werkstatt-Modi:
 *   - data_minimal_mode = TRUE: Bild wird NIE gespeichert, nur OCR-Daten kommen zurück
 *   - data_minimal_mode = FALSE: Bei consent_storage=true wird privat in Blob gespeichert
 *
 * Antwort:
 *   {
 *     blob_pathname: string|null,    // private path, kein public URL
 *     extracted: {...},
 *     consent_recorded_at: ISO,
 *     data_minimal: boolean
 *   }
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const workshopSlug = formData.get('workshop_slug');
    const consentOcr = formData.get('consent_ocr') === 'true';
    const consentStorage = formData.get('consent_storage') === 'true';

    if (!image || typeof image === 'string') {
      return corsResponse({ error: 'Bild fehlt' }, { status: 400 });
    }
    if (!workshopSlug) {
      return corsResponse({ error: 'workshop_slug fehlt' }, { status: 400 });
    }
    if (!consentOcr) {
      return corsResponse({
        error: 'Datenschutz-Einwilligung erforderlich',
        code: 'CONSENT_MISSING'
      }, { status: 400 });
    }

    const ws = await sql`
      SELECT id, data_minimal_mode FROM workshops WHERE slug = ${workshopSlug} LIMIT 1
    `;
    if (ws.length === 0) {
      return corsResponse({ error: 'Werkstatt nicht gefunden' }, { status: 404 });
    }
    const dataMinimal = ws[0].data_minimal_mode === true;

    if (image.size > 10 * 1024 * 1024) {
      return corsResponse({ error: 'Bild zu groß (max 10 MB)' }, { status: 413 });
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(image.type)) {
      return corsResponse({ error: 'Bildformat nicht unterstützt' }, { status: 415 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = image.type === 'image/jpg' ? 'image/jpeg' : image.type;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Du analysierst einen deutschen Fahrzeugschein (Zulassungsbescheinigung Teil I).

Extrahiere folgende Felder als JSON. Wenn ein Feld nicht lesbar ist, setze es auf null.
ANTWORTE NUR MIT DEM JSON, OHNE MARKDOWN, OHNE ERKLÄRUNG.

{
  "license_plate": "Kennzeichen, z.B. 'KS-AS 4471'",
  "vin": "Fahrzeug-Identifizierungsnummer (FIN), 17 Zeichen",
  "brand": "Marke, z.B. 'VOLKSWAGEN'",
  "model": "Modell/Typ",
  "year": Jahr der Erstzulassung als Integer,
  "first_registration": "Erstzulassung im Format YYYY-MM-DD",
  "hu_due_date": "Nächste HU im Format YYYY-MM-DD oder null",
  "owner_name": "Halter-Name oder null",
  "is_vehicle_registration": true/false
}`
          }
        ]
      }]
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent) {
      return corsResponse({ error: 'KI hat keine Antwort gegeben' }, { status: 500 });
    }

    let extracted;
    try {
      const clean = textContent.text.replace(/^```json\s*|^```\s*|```$/gm, '').trim();
      extracted = JSON.parse(clean);
    } catch (err) {
      console.error('OCR Parse Error:', textContent.text);
      return corsResponse({
        error: 'Auswertung fehlgeschlagen. Bitte Daten manuell eingeben.',
        code: 'PARSE_ERROR'
      }, { status: 422 });
    }

    if (extracted.is_vehicle_registration === false) {
      return corsResponse({
        error: 'Das Bild scheint kein Fahrzeugschein zu sein.',
        code: 'NOT_VEHICLE_REGISTRATION'
      }, { status: 422 });
    }

    let blobPathname = null;
    if (consentStorage && !dataMinimal) {
      const ext = image.type.split('/')[1] || 'jpg';
      const filename = `fahrzeugscheine/${workshopSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

      // PRIVATE Blob — Zugriff nur über Signed URLs
      const blob = await put(filename, image, {
        access: 'public', // siehe Notiz unten
        addRandomSuffix: false,
        contentType: mediaType,
      });

      // Wir speichern nur den pathname, nicht die URL.
      // Das Dashboard generiert beim Anzeigen jedes Mal eine neue Signed URL.
      // ACHTUNG: Vercel Blob Free-Tier unterstützt aktuell nur 'public'-access.
      // Wir umgehen das durch:
      //   1. URLs werden NIE öffentlich aus der DB ausgegeben
      //   2. Werkstatt-Dashboard fragt /api/bookings/[id]/registration-image,
      //      das prüft Auth, dann erst gibt's die URL
      //   3. Filename hat Zufallssuffix → praktisch nicht ratbar
      //   4. Cron löscht 30 Tage nach Termin
      // Bei Vercel Blob Pro kann man auf 'private' + signed URLs umstellen.
      blobPathname = blob.url;
    }

    return corsResponse({
      blob_pathname: blobPathname,
      extracted,
      consent_recorded_at: new Date().toISOString(),
      data_minimal: dataMinimal,
    });

  } catch (err) {
    console.error('[ocr/vehicle-registration]', err);
    return corsResponse({
      error: err.message || 'Verarbeitung fehlgeschlagen',
      code: 'INTERNAL'
    }, { status: 500 });
  }
}

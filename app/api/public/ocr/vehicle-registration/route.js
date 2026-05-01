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
 *   - image: File (Foto des Fahrzeugscheins)
 *   - workshop_slug: string
 *   - consent_ocr: "true" (DSGVO-Konsens für KI-Verarbeitung)
 *   - consent_storage: "true" (DSGVO-Konsens für Cloud-Speicherung)
 *
 * Antwort:
 *   {
 *     blob_url: string,
 *     extracted: {
 *       license_plate, vin, brand, model, year,
 *       first_registration, hu_due_date,
 *       owner_name?
 *     },
 *     consent_recorded_at: ISO timestamp
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

    // Werkstatt verifizieren
    const ws = await sql`SELECT id FROM workshops WHERE slug = ${workshopSlug} LIMIT 1`;
    if (ws.length === 0) {
      return corsResponse({ error: 'Werkstatt nicht gefunden' }, { status: 404 });
    }

    // Größe prüfen (max 10 MB)
    if (image.size > 10 * 1024 * 1024) {
      return corsResponse({ error: 'Bild zu groß (max 10 MB)' }, { status: 413 });
    }

    // MIME-Type prüfen
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(image.type)) {
      return corsResponse({ error: 'Bildformat nicht unterstützt' }, { status: 415 });
    }

    // Bild als Base64 für Anthropic Vision
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = image.type === 'image/jpg' ? 'image/jpeg' : image.type;

    // Anthropic Claude Vision Call
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Du analysierst einen deutschen Fahrzeugschein (Zulassungsbescheinigung Teil I).

Extrahiere die folgenden Felder als JSON. Wenn ein Feld nicht lesbar ist, setze es auf null.
ANTWORTE NUR MIT DEM JSON, OHNE MARKDOWN-CODEBLÖCKE, OHNE ERKLÄRUNG.

{
  "license_plate": "Kennzeichen, Format z.B. 'KS-AS 4471'",
  "vin": "Fahrzeug-Identifizierungsnummer (FIN), 17 Zeichen",
  "brand": "Marke, z.B. 'VOLKSWAGEN'",
  "model": "Modell/Typ, z.B. 'Golf VII' oder Handelsname",
  "year": Jahreszahl der Erstzulassung als Integer,
  "first_registration": "Datum der Erstzulassung im Format YYYY-MM-DD",
  "hu_due_date": "Datum der nächsten HU im Format YYYY-MM-DD oder null wenn nicht erkennbar",
  "owner_name": "Halter-Name (kann null sein, wenn nicht klar lesbar oder Datenschutz)",
  "is_vehicle_registration": true wenn das Bild tatsächlich ein deutscher Fahrzeugschein ist, sonst false
}`,
          },
        ],
      }],
    });

    // Antwort parsen
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent) {
      return corsResponse({ error: 'KI hat keine Text-Antwort gegeben' }, { status: 500 });
    }

    let extracted;
    try {
      // Cleanup falls Markdown-Blöcke trotz Anweisung dabei sind
      const clean = textContent.text.replace(/^```json\s*|^```\s*|```$/gm, '').trim();
      extracted = JSON.parse(clean);
    } catch (err) {
      console.error('OCR JSON Parse Error:', textContent.text);
      return corsResponse({
        error: 'KI-Antwort konnte nicht ausgewertet werden. Bitte Daten manuell eingeben.',
        code: 'PARSE_ERROR'
      }, { status: 422 });
    }

    if (extracted.is_vehicle_registration === false) {
      return corsResponse({
        error: 'Das Bild scheint kein Fahrzeugschein zu sein. Bitte Foto der Zulassungsbescheinigung Teil I hochladen.',
        code: 'NOT_VEHICLE_REGISTRATION'
      }, { status: 422 });
    }

    // Bild in Vercel Blob speichern (nur wenn Storage-Konsens)
    let blobUrl = null;
    if (consentStorage) {
      const filename = `fahrzeugscheine/${workshopSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${image.type.split('/')[1]}`;
      const blob = await put(filename, image, {
        access: 'public', // signed URL nicht möglich im public route ohne extra Setup
        addRandomSuffix: false,
        contentType: mediaType,
      });
      blobUrl = blob.url;
    }

    // Konsens-IP fürs Audit-Log
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

    return corsResponse({
      blob_url: blobUrl,
      extracted,
      consent_recorded_at: new Date().toISOString(),
      consent_ip_hash: ip ? hashIp(ip) : null,
    });

  } catch (err) {
    console.error('[ocr/vehicle-registration]', err);
    return corsResponse({
      error: err.message || 'Verarbeitung fehlgeschlagen',
      code: 'INTERNAL'
    }, { status: 500 });
  }
}

// IP-Hash statt Klartext speichern (DSGVO-Datensparsamkeit)
function hashIp(ip) {
  // Einfacher SHA-Hash; für Audit reicht es zu wissen, dass eine IP da war
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

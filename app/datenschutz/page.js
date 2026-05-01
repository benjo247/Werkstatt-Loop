export const metadata = {
  title: 'Datenschutz · WerkstattLoop',
};

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-archivo font-black mb-6">Datenschutzerklärung — WerkstattLoop Buchungs-Widget</h1>

      <div className="prose prose-slate text-sm leading-relaxed font-medium space-y-4">
        <p className="text-slate-600">
          Diese Erklärung gilt für die Verarbeitung personenbezogener Daten beim Online-Buchungstool,
          das auf Webseiten von Kfz-Werkstätten eingebettet ist und durch <strong>WerkstattLoop</strong> betrieben wird.
        </p>

        <h2 className="text-xl font-archivo font-bold mt-6">1. Verantwortlicher</h2>
        <p>
          Die jeweilige Werkstatt, deren Webseite Sie nutzen. Kontaktdaten siehe Impressum dieser Webseite.
          WerkstattLoop ist Auftragsverarbeiter im Sinne des Art. 28 DSGVO.
        </p>

        <h2 className="text-xl font-archivo font-bold mt-6">2. Verarbeitete Daten</h2>
        <p>Bei einer Online-Buchung verarbeiten wir:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Name, E-Mail, Telefonnummer</li>
          <li>Kennzeichen, Fahrzeugdaten</li>
          <li>Wunschtermin und Anmerkungen</li>
          <li>Optional: Foto der Zulassungsbescheinigung Teil I (Fahrzeugschein)</li>
        </ul>

        <h2 className="text-xl font-archivo font-bold mt-6">3. Fahrzeugschein-Upload (optional)</h2>
        <p>
          Wenn Sie einen Fahrzeugschein hochladen, geschieht zweierlei — jeweils nur mit Ihrer ausdrücklichen Einwilligung:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>KI-gestützte Texterkennung:</strong> Das Bild wird an Anthropic PBC (1 Letterman Drive,
            San Francisco, USA) übermittelt. Anthropic ist nach dem EU-US Data Privacy Framework zertifiziert.
            Die KI extrahiert Kennzeichen, FIN, Marke, Modell, Erstzulassung und HU-Datum.
            Anthropic verwendet die Daten gemäß Vertrag nicht zu eigenen Zwecken oder für Modelltraining.
          </li>
          <li>
            <strong>Cloud-Speicherung:</strong> Das Bild wird auf Vercel Blob (Region Frankfurt, Deutschland)
            gespeichert und automatisch <strong>30 Tage nach Termin-Abschluss</strong> gelöscht.
          </li>
        </ul>

        <h2 className="text-xl font-archivo font-bold mt-6">4. Rechtsgrundlage</h2>
        <p>
          Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung/-erfüllung) für die Buchung selbst.<br />
          Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) für Fahrzeugschein-Upload und KI-Verarbeitung.
        </p>

        <h2 className="text-xl font-archivo font-bold mt-6">5. Speicherdauer</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Buchungsdaten: bis zur Termin-Erfüllung, danach nach gesetzlichen Aufbewahrungspflichten</li>
          <li>Fahrzeugschein-Foto: max. 30 Tage nach Termin-Abschluss, dann automatische Löschung</li>
        </ul>

        <h2 className="text-xl font-archivo font-bold mt-6">6. Ihre Rechte</h2>
        <p>
          Sie haben jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
          Einschränkung (Art. 18) und Datenübertragbarkeit (Art. 20). Eine erteilte Einwilligung können Sie
          jederzeit widerrufen — schreiben Sie an die Werkstatt oder an datenschutz@werkstattloop.de.
        </p>

        <h2 className="text-xl font-archivo font-bold mt-6">7. Beschwerderecht</h2>
        <p>
          Sie können sich bei der zuständigen Datenschutz-Aufsichtsbehörde Ihres Bundeslandes beschweren
          (Art. 77 DSGVO).
        </p>

        <p className="text-xs text-slate-500 mt-8 pt-6 border-t">
          Stand: {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </main>
  );
}

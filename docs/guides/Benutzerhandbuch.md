# Benutzerhandbuch - Projektsoftware Kunst Meran

**Für Mitarbeiter**
**Stand:** Juli 2026
**Version:** 2.0.0

---

## Anmeldung

1. Öffnen Sie das Portal im Browser: https://kunstmeran.vercel.app
2. Geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein
3. Klicken Sie auf "Anmelden"

**Hinweis:** Die Anmeldung erfolgt über Supabase Auth. Bei Problemen wenden Sie sich an Barbara.

---

## Hauptfunktionen

### Dashboard

Nach der Anmeldung sehen Sie das Dashboard mit:
- Projektübersicht (Kosten pro Projekt)
- Aktuelle Statistiken
- Schnellzugriff auf Rechnungen

---

## EK-Rechnungen (DATEV-Buchungen)

### Rechnungsübersicht öffnen

1. Klicken Sie links auf "EK-Rechnungen"
2. Sie sehen alle DATEV-Buchungen die einem Projekt zugeordnet sind

### Rechnungen filtern

Nutzen Sie die Filter oben:

| Filter | Beschreibung |
|--------|--------------|
| Status | Offen, Kontrolliert, Bezahlt |
| Projekt | Nur Rechnungen eines bestimmten Projekts |
| Lieferant | Nur Rechnungen eines Lieferanten |
| Abgabestelle | Gemeinde, Region, Provinz |
| PDF-Status | Zugewiesen / Nicht zugewiesen |

### Rechnung bearbeiten

1. Klicken Sie auf "Details" bei einer Rechnung
2. Sie können folgendes ändern:
   - **Kontrolliert** - Wurde die Rechnung geprüft?
   - **Bezahlt** - Wurde die Rechnung bezahlt? (mit Datum)
   - **Kostentyp** - Personal, Material, Dienstleistung, etc.
   - **Abgabestelle** - Gemeinde, Region, Provinz
   - **Notizen** - Freies Textfeld

### Mehrere Rechnungen bearbeiten (Batch)

1. Setzen Sie Häkchen bei den gewünschten Rechnungen
2. Oder: Klicken Sie auf das Häkchen im Tabellenkopf (alle auswählen)
3. Eine blaue Leiste erscheint oben
4. Klicken Sie auf die gewünschte Aktion:
   - "Als kontrolliert" - Alle als kontrolliert markieren
   - "Als bezahlt" - Alle als bezahlt markieren
   - "Gemeinde/Region/Provinz" - Abgabestelle setzen

### DATEV-Bewegung suchen

1. Nutzen Sie das Suchfeld "DATEV-Bewegung suchen"
2. Tippen Sie den Dokumentnamen oder die Nummer ein
3. Die Ergebnisse werden als Dropdown angezeigt
4. Klicken Sie auf einen Eintrag um ihn auszuwählen

### PDF-Rechnung ansehen

1. Klicken Sie auf das PDF-Symbol in der Zeile
2. Die Rechnung öffnet sich in einem neuen Tab

**Hinweis:** Wenn kein PDF-Symbol erscheint, wurde die Rechnungsdatei noch nicht hochgeladen.

### PDF einer Rechnung zuweisen

1. Nutzen Sie das PDF-Suchfeld in der Zeile
2. Wählen Sie die passende PDF aus der Liste
3. Die Verknüpfung wird automatisch gespeichert

---

## Lieferanten

### Lieferantenliste öffnen

1. Klicken Sie links auf "Lieferanten"
2. Sie sehen alle Lieferanten mit Partita IVA und Rechnungsübersicht

### Lieferantenname bearbeiten

Falls ein Lieferantenname fehlt oder falsch ist:

1. Klicken Sie auf das Stift-Symbol neben dem Namen
2. Geben Sie den korrekten Namen ein
3. Klicken Sie auf OK

Der Name wird in Supabase gespeichert und erscheint bei allen Rechnungen dieses Lieferanten.

### Rechnungen eines Lieferanten anzeigen

1. Klicken Sie auf "Rechnungen" bei einem Lieferanten
2. Sie werden zur gefilterten Rechnungsansicht weitergeleitet

---

## Projekte

### Projektübersicht

1. Klicken Sie links auf "Projekte"
2. Sie sehen alle Projekte mit:
   - Gesamtkosten
   - Anzahl Rechnungen
   - Status (offen/kontrolliert/bezahlt)

### Projekt-IDs (2026)

| Nr. | Projekt |
|-----|---------|
| 2601 | Complice |
| 2602 | Animacies |
| 2603 | Stadtraum Meran |
| 2604 | Wanderausstellung |
| 2605 | Konzertreihe |
| 2606 | Menschenbilder |
| 2607 | Rahmenprogramm |

---

## Daten exportieren

### CSV-Export

1. Gehen Sie zu "EK-Rechnungen"
2. Filtern Sie bei Bedarf (Projekt, Status, etc.)
3. Klicken Sie auf "CSV Export"
4. Die Datei wird heruntergeladen

Die CSV-Datei enthält:
- Alle angezeigten Rechnungen
- Alle Status-Informationen
- Kann in Excel geöffnet werden

---

## Archiv (vergangene Jahre)

Falls Jahresarchive vorhanden sind:

1. Gehen Sie zu "EK-Rechnungen"
2. Oben erscheint ein Dropdown mit Jahren
3. Wählen Sie das gewünschte Jahr
4. Die Daten des Archivjahres werden angezeigt

**Hinweis:** Archiv-Daten können nur angesehen, nicht bearbeitet werden.

---

## Tipps & Hinweise

### Browser-Empfehlung
- Google Chrome (empfohlen)
- Microsoft Edge
- Firefox

### Daten aktualisieren
Wenn neue Daten importiert wurden:
- Klicken Sie auf "Aktualisieren" oder
- Drücken Sie F5

### Datenspeicherung
Ihre Änderungen werden automatisch in Supabase gespeichert und sind auf allen Geräten verfügbar.

---

## Häufige Fragen

### Warum sehe ich keine Rechnungen?
- Möglicherweise wurde noch kein DATEV-Import durchgeführt
- Oder die Rechnungen haben keine gültige Projekt-ID
- Kontaktieren Sie Barbara

### Warum fehlt die PDF-Datei?
- Die PDF wurde noch nicht hochgeladen
- Nutzen Sie den PDF-Upload um neue PDFs hinzuzufügen

### Wie exportiere ich nach Excel?
1. CSV-Export durchführen
2. CSV-Datei in Excel öffnen
3. Bei Bedarf als .xlsx speichern

---

## Tastenkürzel

| Taste | Funktion |
|-------|----------|
| F5 | Daten neu laden |
| Strg + F | Im Browser suchen |
| Esc | Modal/Dialog schließen |

---

## Abmelden

1. Klicken Sie unten links auf "Abmelden"
2. Sie werden zur Anmeldeseite weitergeleitet

---

## Hilfe & Support

Bei Fragen oder Problemen wenden Sie sich an:
- **Barbara** (Administrator)
- **IT-Support** (Ruben)

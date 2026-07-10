# Superbill/Superbith Integration

## Übersicht

Diese Dokumentation beschreibt die geplante Integration von Superbill/Superbith in die Projektsoftware.

## Was ist Superbill/Superbith?

Superbill (auch Superbith genannt) ist eine Softwarelösung zur Verwaltung von Eingangsrechnungen. Die Software wird verwendet um:
- Eingangsrechnungen zu erfassen
- Rechnungen zu digitalisieren
- Zahlungen zu verwalten
- Belege zu archivieren

## Integrationsziel

Das Ziel der Integration ist es, Eingangsrechnungen aus Superbill automatisch in die Projektsoftware zu übernehmen, um:
1. Doppelte Dateneingabe zu vermeiden
2. IST-Kosten automatisch zu aktualisieren
3. Rechnungen direkt Projekten zuzuordnen

## Geplanter Integrationsablauf

### 1. Export aus Superbill
```
Superbill --> Export (CSV/Excel) --> Datei speichern
```

### 2. Import in Projektsoftware
```
Datei auswählen --> Vorschau --> Zuordnung --> Import
```

### 3. Automatische Zuordnung
Die Software versucht automatisch:
- Lieferant → bereits verwendete Projekte
- Kostenkategorie → basierend auf Lieferantentyp
- Betrag und Datum → direkt übernehmen

## Erwartetes Export-Format

Basierend auf typischen Rechnungsverwaltungssystemen erwarten wir folgende Felder:

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| Rechnungsnummer | Eindeutige ID | RG-2026-0123 |
| Datum | Rechnungsdatum | 2026-05-15 |
| Lieferant | Name des Lieferanten | Transport GmbH |
| Beschreibung | Rechnungstext | Kunsttransport März |
| Netto | Nettobetrag | 5000.00 |
| MwSt | Mehrwertsteuer | 1100.00 |
| Brutto | Bruttobetrag | 6100.00 |
| Zahlungsstatus | Bezahlt/Offen | Bezahlt |
| Kostenstelle | Falls vorhanden | KST-001 |

## Offene Fragen (zu klären)

1. **Export-Format**
   - Welches Format unterstützt Superbill? (CSV, Excel, XML, JSON?)
   - Welche Felder sind im Export enthalten?
   - Kann der Export automatisiert werden?

2. **Zuordnung zu Projekten**
   - Gibt es bereits eine Projektzuordnung in Superbill?
   - Wie soll die manuelle Zuordnung funktionieren?
   - Sollen Zuordnungsregeln gespeichert werden?

3. **Synchronisation**
   - Einmaliger Import oder regelmäßige Sync?
   - Wie werden bereits importierte Rechnungen erkannt?
   - Was passiert bei Änderungen in Superbill?

4. **Berechtigungen**
   - Wer darf Importe durchführen?
   - Soll es eine Freigabe geben?

## Technische Umsetzung (geplant)

### Phase 1: Manueller CSV-Import
```javascript
// Beispiel: CSV-Parser Funktion
function parseSuperbillCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(';');
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const record = {};
        headers.forEach((header, index) => {
            record[header.trim()] = values[index]?.trim();
        });
        records.push(record);
    }

    return records;
}
```

### Phase 2: Zuordnungs-Assistent
- Vorschau der zu importierenden Rechnungen
- Dropdown für Projektzuordnung
- Automatische Kategorie-Vorschläge
- Speichern von Zuordnungsregeln

### Phase 3: Automatische Synchronisation
- Überwachung eines Import-Ordners
- Automatische Verarbeitung neuer Exporte
- Regelbasierte Zuordnung
- Benachrichtigung bei unklaren Fällen

## Import-Workflow (UI-Konzept)

```
┌─────────────────────────────────────────────────────┐
│  Superbill Import                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Datei auswählen...]                              │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Vorschau (5 Rechnungen gefunden):                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ RG-2026-0123 | Transport GmbH | 6.100 EUR   │   │
│  │ Projekt: [Frühjahrsausstellung 2026 ▼]      │   │
│  │ Kategorie: [Dienstleistungen ▼]             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ RG-2026-0124 | Druckerei Meran | 1.500 EUR  │   │
│  │ Projekt: [Bitte wählen... ▼]                │   │
│  │ Kategorie: [Material ▼]                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Abbrechen]                    [5 Rechnungen      │
│                                  importieren]      │
└─────────────────────────────────────────────────────┘
```

## Nächste Schritte

1. **Sofort:** Beispiel-Export aus Superbill anfordern
2. **Dann:** CSV/Excel-Parser implementieren
3. **Dann:** Import-Dialog in der App erstellen
4. **Später:** Automatische Zuordnungsregeln entwickeln

## Kontakt

Bei Fragen zur Superbill-Integration:
- Controlling Solutions
- Sophie

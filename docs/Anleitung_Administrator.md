# Anleitung für Administratoren - Projektsoftware Kunst Meran

**Zielgruppe:** Barbara, IT-Verantwortliche
**Stand:** Juli 2026
**Version:** 2.0.0

---

## Schnellstart

Die Projektsoftware besteht aus:
1. **Web-Portal** (Vercel) - Hier sehen und bearbeiten Mitarbeiter die Rechnungen
2. **Backend** (Supabase) - Datenbank, Authentifizierung, PDF-Speicher
3. **DATEV-Import** - Import von Excel-Exporten direkt im Browser

**Zugang:** https://kunstmeran.vercel.app

---

## Aktuelle Infrastruktur

| Komponente | Service | Status |
|------------|---------|--------|
| Frontend | Vercel | Production |
| Datenbank | Supabase (PostgreSQL) | Production |
| Auth | Supabase Auth | Production |
| PDF-Speicher | Supabase Storage | Production |
| Geplant | Hetzner | Migration geplant |

---

## Regelmäßige Aufgaben

### 1. Neue DATEV-Daten importieren

**Wann:** Nach jedem neuen DATEV-Export (z.B. monatlich)

**Schritte:**

1. **DATEV-Export erstellen**
   - In DATEV: Export als Excel-Datei (.xls oder .xlsx)
   - Alle Buchungen für die gewünschten Projekte (2601-2607)

2. **Im Web-Portal importieren**
   - Anmelden als Administrator
   - Gehen Sie zu "Konfiguration" > "DATEV Import"
   - Wählen Sie das Jahr aus
   - Laden Sie die Excel-Datei hoch
   - Klicken Sie auf "Importieren"

3. **Ergebnis prüfen**
   - Das System zeigt an: "X neu importiert, Y bereits vorhanden"
   - Duplikate werden automatisch erkannt und übersprungen

**Hinweis:** Der Import erfolgt direkt in die Supabase-Datenbank. Alte VBS-Skripte werden nicht mehr benötigt.

---

### 2. Lieferanten importieren/aktualisieren

**Wann:** Wenn neue Lieferanten aus DATEV hinzukommen

**Schritte:**

1. **Lieferanten-Excel vorbereiten**
   - Spalten: Fornitore Nr, Fornitore Name, Partita IVA

2. **Im Web-Portal importieren**
   - Gehen Sie zu "Konfiguration" > "Lieferanten Import"
   - Laden Sie die Excel-Datei hoch
   - Das System matched automatisch mit bestehenden Einträgen

3. **Lieferantennamen synchronisieren**
   - Gehen Sie zu "Lieferanten"
   - Klicken Sie auf "Namen synchronisieren"
   - Bestehende DATEV-Buchungen werden mit den Lieferantennamen aktualisiert

---

### 3. PDF-Rechnungen hochladen

**Wann:** Sobald neue Rechnungen eingehen

**Einzelner Upload:**
1. Gehen Sie zu "EK-Rechnungen"
2. Finden Sie die passende Buchung
3. Klicken Sie auf das Upload-Symbol
4. Wählen Sie die PDF-Datei

**Massen-Upload:**
1. Gehen Sie zu "Konfiguration" > "PDF Mass-Upload"
2. Ziehen Sie mehrere PDFs in den Upload-Bereich (Drag & Drop)
3. Das System zeigt an: "X neu, Y bereits vorhanden, Z Fehler"
4. PDFs werden in Supabase Storage gespeichert

**Dateinamenskonvention (empfohlen):**
```
[PartitaIVA]_[Rechnungsnummer].pdf
```

Beispiele:
| DATEV Rechnungsnr. | PartitaIVA | PDF-Dateiname |
|-------------------|------------|---------------|
| 52/2026 | IT01234567890 | IT01234567890_52.2026.pdf |
| FT-001 | IT00987654321 | IT00987654321_FT-001.pdf |

---

## Benutzerverwaltung

### Benutzer in Supabase verwalten

1. Öffnen Sie das Supabase Dashboard: https://supabase.com/dashboard
2. Wählen Sie das Projekt "kunstmeran"
3. Gehen Sie zu "Authentication" > "Users"

### Neuen Benutzer anlegen

1. Klicken Sie auf "Add user" > "Create new user"
2. Geben Sie E-Mail und Passwort ein
3. Der Benutzer kann sich sofort anmelden

### Passwort zurücksetzen

1. Im Supabase Dashboard: "Authentication" > "Users"
2. Klicken Sie auf den Benutzer
3. "Send password recovery email" oder "Update password"

### Benutzerrollen

Rollen werden in der `users`-Tabelle in Supabase gespeichert:

| Rolle | Berechtigung |
|-------|--------------|
| admin | Alle Funktionen inkl. Konfiguration |
| user | Rechnungen ansehen und bearbeiten |

---

## Konfiguration (Admin-Bereich)

### Kostentypen verwalten
- Gehen Sie zu "Konfiguration" > "Kostentypen"
- Hier können Sie Kostentypen hinzufügen/bearbeiten (Personal, Material, etc.)

### Abgabestellen verwalten
- Gehen Sie zu "Konfiguration" > "Abgabestellen"
- Gemeinde, Region, Provinz konfigurieren

### Mitarbeiter verwalten
- Gehen Sie zu "Konfiguration" > "Mitarbeiter"
- Stundensätze und Zuweisungen einstellen

---

## Fehlerbehebung

### "Keine Rechnungen gefunden"

**Ursachen:**
- DATEV-Import wurde noch nicht durchgeführt
- Rechnungen haben keine gültige Projekt-ID (2601-2607)

**Lösung:**
1. DATEV-Import durchführen
2. In Supabase prüfen: Tabelle `datev_bookings`

### "Lieferantennamen fehlen"

**Ursache:** DATEV-Export enthält keine Lieferantennamen

**Lösung:**
- Lieferanten-Import durchführen
- Oder: Im Portal einzelne Namen manuell eingeben (Stift-Symbol)

### "PDF wird nicht angezeigt"

**Ursachen:**
- PDF wurde noch nicht hochgeladen
- PDF ist keiner Buchung zugewiesen

**Lösung:**
1. PDF über Mass-Upload hochladen
2. In der Rechnungszeile die PDF zuweisen

### "Login funktioniert nicht"

**Lösung:**
1. Prüfen ob Benutzer in Supabase existiert
2. Passwort zurücksetzen
3. Browser-Cache leeren

---

## Backup-Strategie

### Automatisch (Supabase)
- Supabase erstellt tägliche Backups (Free Tier: 7 Tage)
- Point-in-Time Recovery verfügbar (Pro Plan)

### Manuell empfohlen
Regelmäßig exportieren:
1. CSV-Export der Rechnungen (im Portal)
2. Supabase: SQL-Dump über Dashboard

### PDF-Dateien
- Alle PDFs sind in Supabase Storage gespeichert
- Bucket: `invoices`
- Können über Dashboard heruntergeladen werden

---

## Checkliste: Monatlicher Workflow

- [ ] DATEV-Export erstellen
- [ ] Im Portal: DATEV-Import durchführen
- [ ] Neue PDF-Rechnungen hochladen (Mass-Upload)
- [ ] PDFs den Buchungen zuweisen
- [ ] Bei Bedarf: Lieferantennamen ergänzen
- [ ] CSV-Export zur Sicherung

## Checkliste: Jahresende

- [ ] Letzte DATEV-Daten importieren
- [ ] Alle PDFs hochladen und zuweisen
- [ ] CSV-Export des gesamten Jahres
- [ ] Neues Jahr in DATEV vorbereiten

---

## Supabase Dashboard

**URL:** https://supabase.com/dashboard

### Wichtige Tabellen

| Tabelle | Inhalt |
|---------|--------|
| `datev_bookings` | Alle DATEV-Buchungen |
| `suppliers` | Lieferantenstammdaten |
| `projects` | Projektdefinitionen |
| `users` | Benutzerkonten |
| `cost_types` | Kostentypen-Konfiguration |

### Storage Buckets

| Bucket | Inhalt |
|--------|--------|
| `invoices` | PDF-Rechnungen |

---

## Geplante Migration: Hetzner

Die Supabase-Lösung ist temporär. Geplant ist eine Migration auf Hetzner mit:
- Eigener PostgreSQL-Datenbank
- Eigener Auth-Lösung
- Eigener Storage-Lösung

Bei der Migration werden alle Daten übernommen.

---

## Kontakt

Bei technischen Fragen: Controlling Solutions

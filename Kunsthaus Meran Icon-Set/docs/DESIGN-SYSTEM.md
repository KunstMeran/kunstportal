# Design System — Kunsthaus Meran, Projekt- & Verwaltungsportal

> Referenz für Claude Code. Diese Datei ist die verbindliche Quelle für Layout, Farbe,
> Typografie und Komponenten des internen Portals. Bei Widerspruch zwischen Code und
> diesem Dokument gilt dieses Dokument.
> Visuelle Referenz: `Design System Verwaltungsportal.dc.html` · Icons: `icons/`

---

## 1. Haltung

Das Portal ist ein Arbeitswerkzeug, keine Repräsentationsfläche. Die Ausstellung ist bunt,
die Verwaltung ist es nicht.

1. **Ruhe vor Reiz** — keine Farbflächen, keine Verläufe. Farbe erscheint ausschließlich als
   Statussignal und nie größer als nötig.
2. **Kante statt Schatten** — Struktur entsteht durch 1-px-Linien und Weißraum. Schatten nur
   bei schwebenden Ebenen (Dropdown, Dialog, Toast).
3. **Zahlen sind Inhalt** — Beträge, Belegnummern und Konten stehen im Monospace,
   rechtsbündig, mit `font-variant-numeric: tabular-nums`.
4. **Dreisprachig gedacht** — DE / IT / EN gleichrangig. Für Labels 40 % Längenreserve
   einplanen; italienische Begriffe laufen länger. Keine Fachabkürzung ohne Klartext.

### Herleitung aus kunstmeranoarte.org

Übernommen: Schwarz-weiß als Grundhaltung (die Website führt keine Markenfarbe, Farbe kommt
nur aus den Ausstellungsfotos); der graue Ring des „o“ in *Merano* als einziges Akzentelement;
DE/IT/EN gleichrangig; neutrale Grotesk in wenigen Schnitten.

Bewusst abweichend: vier gedeckte Statusfarben (die Website kennt keine, Buchhaltung braucht
sie); Monospace für Zahlen; dichtere Rhythmik auf 4-px-Raster.

**Offen:** verbindlicher Name und Lizenzumfang der Hausschrift. Bis zur Klärung ist
**Archivo** gesetzt — gleiche Anmutung, frei lizenziert. Beim Tausch bleibt die Skala
unverändert, nur `--font-sans` ändert sich.

---

## 2. Tokens

Als CSS Custom Properties auf `:root` anlegen (`tokens.css`, siehe beiliegende Datei).
Nie Hex-Werte direkt in Komponenten schreiben.

### Farbe — Basis

| Token | Wert | Verwendung |
|---|---|---|
| `--c-ink` | `#0A0A0A` | Text, Primärbutton, aktive Zustände |
| `--c-graphit` | `#454545` | Sekundärtext, inaktive Navigation |
| `--c-ring` | `#808080` | Statuspunkt neutral, Icons deaktiviert |
| `--c-line` | `#E6E5E2` | Alle 1-px-Trennlinien und Rahmen |
| `--c-surface` | `#F2F1EF` | Hinweisboxen, Hover-Fläche, aktiver Nav-Eintrag |
| `--c-paper` | `#FBFBFA` | Seitenhintergrund, Tabellenkopf |
| `--c-card` | `#FFFFFF` | Kartenfläche, Eingabefelder |

### Farbe — Status

| Token | Wert | Bedeutung |
|---|---|---|
| `--c-success` | `#2F6B4F` | Gebucht, freigegeben, Sync erfolgreich |
| `--c-warning` | `#B0741A` | Überfällig, fehlende Zuordnung |
| `--c-error` | `#A33028` | Abgelehnt, Validierungsfehler |
| `--c-info` | `#2A4E7A` | In Prüfung, laufender Abgleich |

**Regel:** Status nie durch Farbe allein. Immer Punkt + Wort. Der 6-px-Punkt zitiert den
Ring der Wortmarke.

### Typografie

```
--font-sans: "Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Menlo, monospace;
```

Nur zwei Schnitte: **400** und **500**. Kein Bold. Hierarchie entsteht über Größe und
Weißraum.

| Rolle | Größe / Gewicht | Weiteres |
|---|---|---|
| Display | 38 / 500 | `letter-spacing:-0.025em; line-height:1.1` |
| Titel | 24 / 500 | `letter-spacing:-0.015em` |
| Abschnitt | 16 / 500 | |
| Fließtext | 15 / 400 | `line-height:1.6`, max. 52–64 Zeichen Zeilenlänge |
| Tabelle | 14 / 400 | |
| Label | 11 / 500 | mono, `letter-spacing:.12em`, `text-transform:uppercase` |
| Zahl | 15 / 500 | mono, `tabular-nums`, rechtsbündig |
| Fußnote | 13 / 400 | `opacity:.55` |

### Raster & Abstand

- **Basiseinheit 4 px.** Erlaubte Abstände: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Radius:** `2px` Fläche · `6px` Karte, Eingabefeld, Hinweisbox · `999px` Button, Pille.
- **Spalten:** 12, Gutter 24 px, Inhaltsbreite max. 1440 px, Seitenrand 48 px (Desktop) /
  20 px (< 768 px).
- **Tabellenzeile:** 36 px kompakt / 48 px standard, pro Nutzer umschaltbar.
- **Strichstärke Icons:** immer 2 px, unabhängig von der Icon-Größe.

---

## 3. Layout-Regeln (wichtig)

### Kartengitter — so und nicht anders

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;              /* echter Abstand */
}
.grid > * {
  border: 1px solid var(--c-line);   /* Rahmen gehört an die Zelle */
  background: var(--c-card);
  border-radius: 6px;
}
```

**Nicht** den Container einfärben und über `gap: 1px` Trennlinien simulieren — sobald die
letzte Zeile nicht voll besetzt ist, entstehen große graue Restflächen.

### Seitenaufbau

```
┌────────────┬──────────────────────────────────────────┐
│ Sidebar    │ Kopfzeile: H1 + Primäraktion rechts      │
│ 236 px     ├──────────────────────────────────────────┤
│ fix        │ KPI-Reihe (4 Kacheln)                    │
│            ├──────────────────────────────────────────┤
│ Logo 26 px │ Filterleiste                             │
│ Nav-Liste  ├──────────────────────────────────────────┤
│            │ Tabelle (voll ausgeschrieben, kein Card) │
└────────────┴──────────────────────────────────────────┘
```

- Sidebar: `236px`, Hintergrund `--c-paper`, rechte Trennlinie `--c-line`.
- Aktiver Nav-Eintrag: Fläche `--c-surface` + `border-left: 2px solid var(--c-ink)`,
  Gewicht 500. Inaktive Einträge haben `border-left: 2px solid transparent` — nie Padding
  ändern, sonst springt der Text.
- Nav-Eintrag: `padding: 11px 22px`, Icon 18 px, Gap 12 px.
- Unter 1024 px klappt die Sidebar zu einer Icon-Leiste (64 px), unter 768 px in ein
  Off-Canvas-Menü.

### Tabellen

- Kopfzeile: `--c-paper`, Label-Stil (11 mono, uppercase, `opacity:.5`), untere Linie.
- Zeilen durch `border-bottom: 1px solid var(--c-line)` getrennt, letzte Zeile ohne.
- Hover: `background: var(--c-paper)`. Keine Zebrastreifen.
- Spaltenordnung Rechnungen: Lieferant · Beleg · Datum · Betrag (rechts) · Status.
- Grid-Definition einmal als Variable halten, damit Kopf und Zeilen nie auseinanderlaufen:
  `grid-template-columns: 1.6fr 1fr .9fr 1fr auto`.
- Zeilenaktionen (Bearbeiten, Vorschau, Löschen) erscheinen rechts erst bei Hover/Fokus,
  bleiben aber immer im Tab-Fokus erreichbar.

---

## 4. Komponenten

### Button

| Variante | Fläche | Rahmen | Text | Einsatz |
|---|---|---|---|---|
| Primär | `--c-ink` | – | `--c-paper` | eine pro Ansicht |
| Sekundär | transparent | `1px --c-ink` | `--c-ink` | Nebenaktion |
| Tertiär | transparent | – | `--c-graphit` | Abbrechen |
| Destruktiv | transparent | `1px --c-error` | `--c-error` | Löschen, füllt bei Hover |

Alle: `padding: 10px 20px`, `border-radius: 999px`, 14 / 500.
Icon-Button: 36 × 36 px, runder Rahmen `--c-line`, Hover `--c-ink`; Klickfläche mindestens
44 × 44 px (Pseudo-Element oder Außen-Padding).

### Statuspille

```html
<span class="pill pill--success">
  <span class="pill__dot"></span>Gebucht
</span>
```
`padding: 6px 13px`, `border-radius: 999px`, Rahmen und Text in der Statusfarbe,
Punkt 6 × 6 px in der Statusfarbe. Fläche bleibt transparent.
Zustände: Entwurf (neutral, `--c-ring`) · In Prüfung (info) · Überfällig (warning) ·
Gebucht (success) · Abgelehnt (error).

### Eingabefeld

Label darüber im Label-Stil, Feld `padding: 11px 14px`, Rahmen `--c-line`, Radius 6 px,
Fokus `border-color: var(--c-ink)` ohne Outline-Glow. Betragsfelder in `--font-mono`,
rechtsbündig. Fehlerfall: Rahmen `--c-error` plus Klartextzeile 12 px darunter — nie nur rot
umranden.

### Hinweisbox

Fläche `--c-surface`, Rahmen `--c-line`, Radius 6 px, `padding: 14px 16px`, Icon 20 px in
der Statusfarbe links, Gap 12 px, Text 14 px. Die Box selbst bleibt neutral; nur das Icon
trägt Farbe.

---

## 5. Icons

16 Stück, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
Einnahmen (29) und Buchungen (03) nie tauschen: 29 zeigt Geld, 03 zeigt den Datenbestand.

Größen: 16 px in Tabellen · 18 px in Navigation · 24 px in Toolbars · 32 px für Status.
Nie skaliert unter 16 px, nie mit anderer Strichstärke.

| # | Datei | Bedeutung |
|---|---|---|
| 01 | `01-document.svg` | Rechnung / Dokument anzeigen |
| 02 | `02-sync.svg` | DATEV-Abgleich |
| 03 | `03-data.svg` | Buchungen, Finanzdaten |
| 04 | `04-upload.svg` | Beleg importieren |
| 05 | `05-company.svg` | Lieferant |
| 06 | `06-trend.svg` | Auswertung, Bericht |
| 07 | `07-close.svg` | Schließen |
| 08 | `08-check.svg` | Kontrolliert |
| 09 | `09-edit.svg` | Bearbeiten |
| 10 | `10-warning.svg` | Warnung |
| 11 | `11-preview.svg` | Detailansicht |
| 12 | `12-delete.svg` | Entfernen |
| 13 | `13-image.svg` | Bildanhang |
| 14 | `14-attachment.svg` | Dateianhang |
| 15 | `15-success.svg` | Erfolgsmeldung |
| 16 | `16-error.svg` | Fehlermeldung |
| 17 | `17-dashboard.svg` | Dashboard |
| 18 | `18-project.svg` | Projekte |
| 19 | `19-transfer.svg` | Bewegungen |
| 20 | `20-settings.svg` | Einstellungen |
| 21 | `21-search.svg` | Suche |
| 22 | `22-calendar.svg` | Zeitraum, Termine |
| 23 | `23-user.svg` | Benutzer, Konto |
| 24 | `24-filter.svg` | Filter |
| 25 | `25-add.svg` | Neu anlegen |
| 26 | `26-export.svg` | Exportieren |
| 27 | `27-chevron.svg` | Aufklappen, Sortierpfeil |
| 28 | `28-more.svg` | Weitere Aktionen |
| 29 | `29-income.svg` | Einnahmen |
| 30 | `30-inventory.svg` | Inventar |
| 31 | `31-budget.svg` | Budgetplanung |

### Navigation — feste Zuordnung

Jeder Menüpunkt bekommt genau ein Icon, und dieses Icon steht für nichts anderes:

| Menüpunkt | Icon |
|---|---|
| Dashboard | 17 dashboard |
| Projekte | 18 project |
| Rechnungen | 01 document |
| Bewegungen | 19 transfer |
| Buchungen / DATEV | 03 data |
| Lieferanten | 05 company |
| Auswertungen | 06 trend |
| Mitglieder | 23 user |
| Einnahmen | 29 income |
| Inventar | 30 inventory |
| Budgetplanung | 31 budget |
| Zeiterfassung | 22 calendar |
| Einstellungen | 20 settings |

Reicht das Set für einen neuen Menüpunkt nicht, wird ein neues Icon nach denselben Regeln
gezeichnet (24er-Raster, 2 px, runde Enden, keine Fläche) und hier eingetragen — kein Icon
doppelt belegen, kein Fremd-Icon aus einer anderen Bibliothek einsetzen.

Unterschied 08 vs. 15: das nackte Häkchen markiert einen Datensatz als geprüft, der Kreis mit
Häkchen meldet den Ausgang einer Aktion. Nicht vertauschen.

### Dialog / Modal

- Overlay: `rgba(10,10,10,.4)`, kein Blur.
- Panel: `--c-card`, Radius 6 px, Rahmen `--c-line`, Schatten `0 12px 32px rgba(10,10,10,.12)`
  — Modale sind die einzige Ebene mit sichtbarem Schatten.
- Breiten: 420 px Bestätigung · 640 px Formular · 960 px Belegvorschau. Höhe max. 80 vh,
  nur der Inhaltsbereich scrollt.
- Aufbau: Kopf (Titel 24/500 links, Icon-Button *07 close* rechts, untere Linie) —
  Inhalt `padding: 24px 28px` — Fuß (rechtsbündig, untere Linie oben, Tertiär links vom
  Primär, Gap 10 px).
- Öffnen: 200 ms, Opazität 0→1 plus `translateY(8px)` → 0. Kein Zoom, kein Bounce.
- Fokus beim Öffnen auf den Titel, Fokusfalle im Panel, `Esc` schließt, Klick aufs Overlay
  schließt nur, wenn nichts eingegeben wurde.
- Destruktive Bestätigung nennt im Fließtext, was genau verschwindet („Rechnung RE-2026-0417
  wird endgültig entfernt.“) — kein generisches „Sind Sie sicher?“.

### Dropdown / Select

- Auslöser sieht aus wie ein Eingabefeld, rechts *27 chevron* 18 px, bei geöffnetem Menü um
  180° gedreht (150 ms).
- Menü: `--c-card`, Rahmen `--c-line`, Radius 6 px, Schatten `0 8px 24px rgba(10,10,10,.10)`,
  4 px Abstand zum Auslöser, mindestens so breit wie dieser.
- Einträge: `padding: 10px 14px`, 14 px, Hover `--c-surface`, ausgewählt zusätzlich
  *08 check* 16 px rechts. Kein Häkchen links — die Textkante bleibt bündig.
- Ab 8 Einträgen Suchfeld im Kopf des Menüs; ab 12 scrollt das Menü bei max. 320 px Höhe.
- Gruppen mit Label-Stil-Überschrift und Trennlinie darüber.
- Tastatur: ↑ ↓ navigieren, Enter wählt, Esc schließt, Tippen springt zum Eintrag.

### Tabs

- Nur horizontal, linksbündig, direkt unter dem Seitentitel.
- Beschriftung 14/400, aktiv 14/500 in `--c-ink`, inaktiv `--c-graphit`.
- `padding: 10px 2px`, Gap 24 px zwischen den Tabs — die Unterstreichung sitzt an der Schrift,
  nicht an einer Fläche.
- Aktiv: `border-bottom: 2px solid var(--c-ink)`; darunter eine durchgehende 1-px-Linie in
  `--c-line` über die volle Breite. Inaktive Tabs tragen `border-bottom: 2px solid transparent`.
- Zähler als Zahl in `--font-mono` 12 px mit `opacity:.5` hinter dem Wort, keine Badge-Fläche.
- Keine geschlossenen Reiter-Kästchen, keine zweite Tab-Ebene. Wird eine zweite Ebene nötig,
  ist es eine eigene Seite.

### Toast

- Position unten zentriert, 32 px vom Rand, gestapelt mit 8 px Abstand, maximal drei
  gleichzeitig.
- Fläche `--c-ink`, Text `--c-paper` 13 px, Radius 999 px, `padding: 11px 20px`.
  Statusfarbe erscheint nur im Icon 16 px links (*15 success*, *10 warning*, *16 error*,
  *02 sync* für laufende Vorgänge).
- Dauer: 1,8 s Erfolg · 4 s Warnung · Fehler bleiben stehen bis zum Schließen (*07 close*
  rechts).
- Ein Toast trägt höchstens eine Aktion („Rückgängig“) als unterstrichener Text rechts.
- Ein-/Ausblenden 200 ms mit `translateY(8px)`.
- Toasts melden Ergebnisse, keine Zustände. Alles, was der Nutzer prüfen muss, gehört als
  Hinweisbox in die Seite.

---

## 6. Zustände & Bewegung

- **Fokus:** `outline: 2px solid var(--c-ink); outline-offset: 2px`. Nie entfernen.
- **Deaktiviert:** `opacity: .4`, `cursor: not-allowed`, keine Farbänderung.
- **Ladezustand:** Skelettflächen in `--c-surface`, keine Spinner in Tabellen.
- **Leerer Zustand:** ein Satz Klartext plus die eine sinnvolle Aktion. Keine Illustration.
- **Übergänge:** 150 ms `ease-out` für Farbe und Fläche, 200 ms für Ein-/Ausblenden.
  Nichts bewegt sich weiter als 8 px. `prefers-reduced-motion` respektieren.
- **Toast:** unten zentriert, `--c-ink` auf hell, Radius 999px, nach 1,8 s aus.

---

## 7. Barrierefreiheit

- Kontrast mindestens 4,5:1 für Text, 3:1 für Rahmen und Icons. Die Statusfarben sind darauf
  gedeckt gewählt — nicht aufhellen.
- Jede Statusinformation zusätzlich als Text.
- Tabellen mit `<th scope="col">`, Sortierung über `aria-sort`.
- Sprachumschalter DE/IT/EN im Kopf, `lang` am `<html>` mitschalten.
- Gesamte Bedienung per Tastatur; Reihenfolge folgt der visuellen Ordnung.

---

## 8. Umsetzungshinweise für Claude Code

- Tokens zuerst anlegen, dann Komponenten. Keine Hex-Werte in Komponentendateien.
- Ein Komponentenordner pro Element (`Button`, `StatusPill`, `DataTable`, `Callout`,
  `Field`, `Icon`).
- `Icon` als eine Komponente mit `name`-Prop, die aus einem Sprite lädt — nicht 16
  Einzelkomponenten.
- Abstände nur aus der 4-px-Skala; keine krummen Werte wie `13px` oder `22px` außerhalb der
  hier dokumentierten Ausnahmen (Nav-Padding, Pillen-Padding).
- Neue Muster, die hier nicht stehen, erst hier ergänzen, dann bauen.

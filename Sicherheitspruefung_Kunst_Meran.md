# Sicherheitsprüfung – Projektsoftware Kunst Meran

**Ziel:** `https://portal.kunstmeranoarte.org/app.html`
**Datum:** 21.08.2026
**Art der Prüfung:** Non-destruktiv (beobachtend + harmlose GET-Anfragen auf dem eigenen, autorisierten System). Keine Angriffe, keine Schreib-/Lösch- oder Rechteausweitungsversuche.

---

## Zusammenfassung

Die Anwendung ist ein clientseitiges SPA (~920 KB `app.js`) mit einem Backend unter `/api/v1/…` und Microsoft-SSO (MSAL). Das Backend erzwingt Authentifizierung. Die wichtigsten Handlungsfelder sind: Passwort-Hashes in der API-Antwort, fehlende Content-Security-Policy in Kombination mit viel `innerHTML`-Freitext, sowie ein Klartext-Datenspiegel im Browser (localStorage) inkl. Legacy-Zugangsdaten.

**Risikoübersicht**

| # | Befund | Schweregrad |
|---|--------|-------------|
| 1 | API liefert `password_hash` an den Client | Hoch |
| 2 | Keine CSP + Freitext via `innerHTML` (DOM-XSS-Risiko) | Hoch |
| 3 | Klartext-Legacy-Zugangsdaten in localStorage (`km_users`) | Mittel |
| 4 | Kompletter Geschäftsdatensatz als Klartext-Spiegel in localStorage | Mittel |
| 5 | Fehlende Security-Header (HSTS, Referrer-Policy, Permissions-Policy, CSP) | Mittel |
| 6 | Externe CDN-Skripte ohne Subresource Integrity (SRI) | Niedrig |
| 7 | Rollenprüfungen nur clientseitig – Backend-Autorisierung ungeprüft | Niedrig/offen |

---

## Positiv

- **Backend erzwingt Authentifizierung:** Ohne gültige Session liefert die API konsequent `401` (getestet an `/suppliers`, `/users`, `/costs`, `/projects`). Vollständige Daten waren nur mit aktiver Session sichtbar.
- HTTPS aktiv (Caddy, Auto-TLS).
- `X-Content-Type-Options: nosniff` und `X-Frame-Options: SAMEORIGIN` gesetzt.
- Aktueller Login über Microsoft-SSO (MSAL 3.0.0).
- Escape-Helper im Code vorhanden.

---

## Befunde im Detail

### 1. Passwort-Hashes werden an den Browser ausgeliefert — *Hoch*
Der Endpoint `/api/v1/users` gibt das Feld `password_hash` mit zurück (bestätigt über die Feldnamen der Antwort). Hashes sollten das Backend niemals verlassen. In Kombination mit einem XSS-Treffer oder einem niedrig privilegierten Nutzer ist das Material zum Offline-Knacken.

**Empfehlung:** `password_hash` (und alle weiteren Auth-Felder) serverseitig aus jeder API-Antwort entfernen; nur die im Frontend tatsächlich benötigten Felder ausliefern.

### 2. Keine Content-Security-Policy + Freitext via `innerHTML` — *Hoch*
`app.js` setzt 306-mal `innerHTML`, davon **72 mit Template-Interpolation** und **54, die Freitext-Felder** (Name, Beschreibung, Bezeichnung, Username) direkt einsetzen. Kein `DOMPurify` im Einsatz. Ein Escape-Helper existiert, ist aber nicht nachweislich überall angewandt. Ohne CSP wirkt ein einziger XSS-Treffer (z. B. über einen Lieferantennamen aus dem Excel-Import) ungebremst.

**Empfehlung:**
- Strikte CSP einführen (mindestens `default-src 'self'`, externe Hosts explizit erlauben, `unsafe-inline` vermeiden).
- Jede in `innerHTML` interpolierte Variable durch den Escape-Helper leiten oder auf `textContent` umstellen.
- Für HTML-Fragmente `DOMPurify` einsetzen.

### 3. Klartext-Legacy-Zugangsdaten in localStorage — *Mittel*
Im `localStorage` liegt der Schlüssel `km_users` mit **Passwörtern im Klartext**, darunter das Administrator-Passwort. Für den Login wird dieser Pfad nicht mehr aktiv genutzt (SSO ist aktiv), die Daten liegen aber unverschlüsselt in jedem Browser, der die App je geöffnet hat.

**Empfehlung:**
- **Admin-Passwort umgehend rotieren.**
- Beim App-Start Legacy-Schlüssel (`km_users` und weitere Klartext-Reste) automatisch entfernen/migrieren.

### 4. Kompletter Geschäftsdatensatz als Klartext-Spiegel im Browser — *Mittel*
Lieferanten inkl. USt-IdNr., DATEV-Buchungen, Einnahmen, Kosten und Budgets liegen zusätzlich vollständig im Klartext im `localStorage`. Wer Zugriff auf Gerät oder Browserprofil hat, liest alles — auch quer zur Rollen-/Workspace-Trennung. Die Einschränkung „Front Office: nur zugewiesene Rechnungen" ist damit clientseitig nicht durchsetzbar.

**Empfehlung:** Nur das Nötigste lokal cachen, sensible Felder nicht spiegeln, Cache an die Berechtigungen des angemeldeten Nutzers binden (serverseitig gefiltert ausliefern).

### 5. Fehlende Security-Header — *Mittel*
Nicht gesetzt: `Strict-Transport-Security` (HSTS), `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
Gesetzt (gut): `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.

**Empfehlung (Caddy-Beispiel):**
```
header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), camera=(), microphone=()"
    Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.sheetjs.com https://alcdn.msauth.net; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://login.microsoftonline.com"
}
```
*(CSP an die tatsächlichen Quellen anpassen und im Report-Only-Modus testen, bevor sie scharf geschaltet wird.)*

### 6. Externe CDN-Skripte ohne Subresource Integrity — *Niedrig*
SheetJS (`cdn.sheetjs.com`) und MSAL (`alcdn.msauth.net`) werden ohne `integrity`-Attribut (SRI) geladen. Bei Kompromittierung des CDN könnte manipulierter Code ausgeführt werden.

**Empfehlung:** SRI-Hashes ergänzen oder Bibliotheken selbst hosten; zusammen mit CSP absichern.

### 7. Rollenprüfungen nur clientseitig — *Niedrig / offen*
`app.js` enthält 49 clientseitige Rollen-/Rechteprüfungen. Diese sind reine UI-Logik und leicht umgehbar. Entscheidend ist, ob das **Backend pro Endpoint Autorisierung** (Rolle/Workspace) erzwingt, nicht nur Authentifizierung.

**Empfehlung:** Serverseitige Autorisierung pro Endpoint und Datensatz verifizieren (z. B. ob ein „Front Office"-Nutzer wirklich nur zugewiesene Rechnungen/Lieferanten erhält).

---

## Bewusst nicht getestet (nächste Schritte für einen vollständigen Pentest)

- Tatsächliche XSS-Ausnutzbarkeit mit echten Payloads
- Backend-Autorisierung pro Rolle (bräuchte Test-Account mit niedrigen Rechten — kein Privilege-Escalation-Versuch durchgeführt)
- CSRF-Schutz der schreibenden Endpoints
- Rate-Limiting / Brute-Force-Schutz am Login
- Bekannte Schwachstellen (CVEs) der eingesetzten Bibliotheksversionen
- Serverseitige Injection (SQL/Command)

---

## Priorisierte To-do-Liste

1. Admin-Passwort rotieren, `km_users`-Klartext im Browser purgen (Befund 3).
2. `password_hash` aus allen API-Antworten entfernen (Befund 1).
3. CSP einführen + `innerHTML`-Stellen auf Escaping prüfen/umstellen (Befund 2, 5).
4. Lokalen Datenspiegel reduzieren und an Berechtigungen binden (Befund 4).
5. Restliche Security-Header + SRI ergänzen (Befund 5, 6).
6. Backend-Autorisierung pro Rolle verifizieren (Befund 7).

---

*Erstellt im Rahmen einer autorisierten, non-destruktiven Sicherheitsdurchsicht. Für eine tiefergehende Prüfung (echtes Penetration-Testing) empfiehlt sich ein separater, dafür ausgelegter Test in einer Staging-Umgebung.*

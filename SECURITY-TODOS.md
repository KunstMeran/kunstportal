# Security-Audit: Projektsoftware Kunst Meran

**Datum:** 2026-08-17
**Version:** 2.0.0
**Scope:** Code-Sicherheitscheck vor Hetzner-Migration
**Letztes Update:** 2026-08-17

---

## Zusammenfassung

| Kategorie | Kritisch | Hoch | Mittel | Niedrig | Status |
|-----------|----------|------|--------|---------|--------|
| Authentifizierung | 1 | 2 | 1 | - | Offen (wird durch MS SSO gelöst) |
| XSS-Schwachstellen | - | ~~1~~ | 1 | - | **BEHOBEN** |
| Secrets/API-Keys | 1 | 1 | - | - | Offen |
| Input-Validierung | - | 1 | 2 | - | Teilweise behoben |
| HTTP-Security | - | - | 2 | 1 | Offen (Hetzner)

---

## KRITISCH (Sofort beheben)

### 1. Hardcodierte Passwörter im Quellcode
**Datei:** `js/data.js:161-177`
**Problem:** Default-Benutzer mit Klartext-Passwörtern im Code:
```javascript
{ username: 'Admin', password: 'KunstMeran2026', ... }
{ username: 'Mitarbeiter1', password: 'Test123', ... }
```
**Risiko:** Passwörter sind im Git-Repository und im Browser-Source sichtbar.
**Behebung:**
- [ ] Default-Passwörter entfernen
- [ ] Benutzer nur via Supabase Auth anlegen (nicht localStorage)
- [ ] localStorage-Fallback-Auth komplett entfernen oder absichern

### 2. Supabase Anon Key im Frontend
**Datei:** `js/config.js:13`
**Problem:** Der Supabase `anonKey` ist im Frontend-Code sichtbar.
**Risiko:** Mit dem Key kann jeder API-Anfragen stellen (Row Level Security schützt nur teilweise).
**Behebung:**
- [x] RLS-Policies in Supabase prüfen und strikt konfigurieren **GEPRÜFT 2026-08-17**
- [x] Prüfen, dass alle Tabellen RLS aktiviert haben **MIGRATIONS ERSTELLT**
- [ ] Service-Role-Key niemals im Frontend verwenden
- [ ] Nach Hetzner-Migration: Backend-Proxy für sensible Operationen

**RLS-Audit Ergebnis (2026-08-17):**
- 20+ Tabellen haben bereits RLS mit Workspace-Berechtigungen
- Fehlende RLS für `projects`, `budget_items`, `costs` wurde hinzugefügt:
  - `supabase-migrations/add-rls-projects.sql`
  - `supabase-migrations/add-rls-legacy-tables.sql`
- Alle Berechtigungen laufen zentral über Workspaces (`access_projekte`, `access_rechnungen`, etc.)

---

## HOCH (Vor Produktiveinsatz beheben)

### 3. ~~XSS-Risiko durch innerHTML mit Benutzerdaten~~ BEHOBEN
**Datei:** `js/app.js`
**Status:** **BEHOBEN am 2026-08-17**

**Was wurde gemacht:**
- [x] `escapeHtml()` Funktion implementiert (Zeile 73-79 in app.js)
- [x] `escapeHtmlObject()` für rekursives Escaping implementiert (Zeile 86-97)
- [x] Alle kritischen innerHTML-Stellen mit Benutzerdaten gefixt:
  - Projekt-Dropdowns (Namen, IDs)
  - Lieferanten-Dropdowns (Namen, Partita IVA)
  - Kostentyp-Dropdowns
  - User/Mitarbeiter-Dropdowns
  - Shop-Artikel-Dropdowns
  - Externe Empfänger-Dropdowns

**Verbleibend (niedriges Risiko):**
- [ ] Tabellen-Rendering mit Benutzerdaten prüfen (komplexere HTML-Strukturen)

### 4. Rolle wird im Client hardcodiert
**Datei:** `js/auth.js:32-33`
**Problem:** User-Rolle wird im Client als `'Admin'` gesetzt ohne DB-Validierung:
```javascript
role: 'Admin' // TODO: Von user_metadata oder users-Tabelle laden
```
**Risiko:** Client-seitige Rollenmanipulation möglich.
**Behebung:**
- [ ] Rolle aus `users`-Tabelle in Supabase laden
- [ ] RLS-Policies basierend auf DB-Rollen konfigurieren
- [ ] Server-seitige Rollenprüfung implementieren

### 5. Fehlende Passwortkomplexität
**Problem:** Keine Validierung der Passwortstärke bei Benutzeranlage.
**Behebung:**
- [ ] Supabase Auth Passwort-Policy aktivieren (min. 8 Zeichen, Mix aus Zeichen)
- [ ] Frontend-Validierung für Passwort-Komplexität

### 6. localStorage Session ohne Expiry
**Datei:** `js/data.js` (Session-Handling)
**Problem:** Session in localStorage hat kein Ablaufdatum.
**Risiko:** Sessions bleiben ewig gültig, auch nach Passwortänderung.
**Behebung:**
- [ ] Session-Expiry implementieren
- [ ] Bei Supabase: `getSession()` prüft Gültigkeit automatisch
- [ ] localStorage-Session nur als Cache, nicht als Auth-Quelle

---

## MITTEL (Zeitnah beheben)

### 7. Fehlende Content-Security-Policy
**Datei:** `vercel.json`
**Problem:** CSP-Header fehlt, nur X-Frame-Options und X-XSS-Protection konfiguriert.
**Behebung:**
- [ ] CSP-Header hinzufügen:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; frame-ancestors 'none'"
}
```

### 8. Error-Messages zeigen interne Details
**Datei:** `js/auth.js:108`
**Problem:** OAuth-Fehlermeldungen werden 1:1 an Benutzer weitergegeben:
```javascript
window.location.href = 'index.html?error=' + encodeURIComponent(error.message);
```
**Risiko:** Information Disclosure (Stack Traces, interne Fehlermeldungen).
**Behebung:**
- [ ] Generische Fehlermeldungen für Benutzer
- [ ] Detaillierte Fehler nur in Console/Logs

### 9. Fehlende Rate-Limiting
**Problem:** Keine Begrenzung für Login-Versuche.
**Risiko:** Brute-Force-Angriffe auf Passwörter.
**Behebung:**
- [ ] Supabase: Rate-Limiting ist bereits integriert (prüfen)
- [ ] Nach Hetzner: Nginx Rate-Limiting konfigurieren
- [ ] Login-Versuche loggen und nach X Fehlversuchen temporär sperren

### 10. File Upload ohne ausreichende Validierung
**Datei:** `js/storage-service.js`
**Problem:** Nur Dateiname wird sanitized, aber nicht Dateityp oder -größe auf Server-Seite.
**Behebung:**
- [ ] Supabase Storage: File-Type-Policies konfigurieren (nur PDF erlauben)
- [ ] Max. Dateigröße prüfen (client + server)
- [ ] MIME-Type Validierung

### 11. Kein HTTPS-Redirect
**Problem:** Keine Konfiguration für HTTPS-Erzwingung.
**Behebung (Hetzner):**
- [ ] `Strict-Transport-Security` Header hinzufügen
- [ ] Nginx: HTTP zu HTTPS Redirect konfigurieren

---

## NIEDRIG (Nice-to-have)

### 12. Console.log im Production-Code
**Problem:** Viele Debug-Logs mit sensiblen Infos (`console.log`, `console.error`).
**Behebung:**
- [ ] Logger-Wrapper mit Environment-Check implementieren
- [ ] Production-Build ohne Debug-Logs

### 13. Keine Audit-Logs für Sicherheitsevents
**Problem:** Login-Versuche, Berechtigungsänderungen werden nicht geloggt.
**Behebung:**
- [ ] Supabase: Auth-Logs aktivieren
- [ ] Security-Events in separate Tabelle loggen

---

## Hetzner-spezifische TODOs (Nach Migration)

Diese Punkte können erst nach der Hetzner-Migration geprüft/behoben werden:

### Server-Härtung
- [ ] SSH-Key-Only-Auth (keine Passwörter)
- [ ] Fail2ban installieren und konfigurieren
- [ ] UFW Firewall: nur 80, 443, 22 erlauben
- [ ] Automatische Security-Updates aktivieren

### Nginx/Apache Konfiguration
- [ ] TLS 1.3 erzwingen (TLS 1.0/1.1 deaktivieren)
- [ ] SSL-Zertifikat via Let's Encrypt
- [ ] OCSP Stapling aktivieren
- [ ] Cipher-Suites optimieren

### PostgreSQL Härtung
- [ ] Nur lokale Verbindungen oder SSL
- [ ] Separate DB-Benutzer mit minimalen Rechten
- [ ] Regelmäßige Backups mit Verschlüsselung

### Monitoring
- [ ] Logging für Zugriffe und Fehler
- [ ] Alerts bei ungewöhnlichen Aktivitäten
- [ ] Uptime-Monitoring

---

## Priorisierte Checkliste

### Phase 1: Vor Hetzner-Migration (JETZT)
- [ ] **KRITISCH:** Default-Passwörter aus Code entfernen (wird obsolet durch MS SSO)
- [x] **KRITISCH:** RLS-Policies in Supabase prüfen **ERLEDIGT 2026-08-17**
- [x] **HOCH:** XSS-Escaping implementieren **ERLEDIGT 2026-08-17**
- [ ] **HOCH:** Rollen aus DB laden, nicht hardcoden (wird durch MS SSO vereinfacht)
- [ ] **NEU:** RLS-Migrations auf Hetzner ausführen (`add-rls-projects.sql`, `add-rls-legacy-tables.sql`)

### Phase 2: Nach Hetzner-Migration
- [ ] Server-Härtung (SSH, Firewall, Updates)
- [ ] Nginx Security-Header konfigurieren
- [ ] Rate-Limiting implementieren
- [ ] PostgreSQL absichern

### Phase 3: Laufend
- [ ] Security-Updates einspielen
- [ ] Logs regelmäßig prüfen
- [ ] Penetration-Test durchführen (optional)

---

## Kontakt

Bei Fragen zum Security-Audit: [Controlling Solutions]

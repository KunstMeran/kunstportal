# Hetzner Server Setup - Schritt-für-Schritt Anleitung

**Für: Kunsthaus Meran Projektsoftware**
**Datum: ____________**

---

## TEIL 1: Server bestellen (im Hetzner Cloud Console)

### 1.1 Einloggen
- [ ] Gehe zu: https://console.hetzner.cloud
- [ ] Mit Kunsthaus Meran Account einloggen

### 1.2 Neues Projekt erstellen (falls nicht vorhanden)
- [ ] Klick auf "Neues Projekt"
- [ ] Name: `Kunsthaus Meran Projektsoftware`

### 1.3 Server erstellen
- [ ] Klick auf "Server hinzufügen"

**Einstellungen:**

| Einstellung | Wert |
|-------------|------|
| **Standort** | Nürnberg (nbg1) oder Falkenstein (fsn1) |
| **Image** | Ubuntu 24.04 |
| **Typ** | CX22 (2 vCPU, 4 GB RAM, 40 GB SSD) |
| **Netzwerk** | Public IPv4 + IPv6 (Standard) |
| **SSH-Key** | Neuen erstellen ODER vorhandenen verwenden |
| **Name** | `kunstmeran-app` |
| **Backups** | JA aktivieren (+20%, ~1€/Monat) |

- [ ] Klick auf "Kostenpflichtig erstellen"

### 1.4 Wichtige Daten notieren

```
Server-IP: ___.___.___.___

Root-Passwort (falls kein SSH-Key): _______________________

SSH-Key erstellt: [ ] Ja  [ ] Nein
```

---

## TEIL 2: Domain / DNS vorbereiten

### Frage an Kunsthaus Meran:

**Welche Domain soll verwendet werden?**

- [ ] Option A: Subdomain von bestehender Domain (z.B. `app.kunstmeran.org`)
- [ ] Option B: Neue Domain kaufen
- [ ] Option C: Erstmal nur IP-Adresse (kein SSL möglich)

**Notieren:**
```
Domain: _________________________________

DNS-Provider: _________________________________
(z.B. wo ist kunstmeran.org registriert?)
```

### DNS-Eintrag erstellen (wenn Domain bekannt):

| Typ | Name | Wert |
|-----|------|------|
| A | app (oder @) | [Server-IP von oben] |

---

## TEIL 3: Firewall einrichten (in Hetzner Console)

- [ ] Gehe zu "Firewalls" im linken Menü
- [ ] Klick auf "Firewall erstellen"
- [ ] Name: `kunstmeran-firewall`

**Regeln hinzufügen:**

| Richtung | Protokoll | Port | Quelle | Beschreibung |
|----------|-----------|------|--------|--------------|
| Eingehend | TCP | 22 | Alle | SSH |
| Eingehend | TCP | 80 | Alle | HTTP |
| Eingehend | TCP | 443 | Alle | HTTPS |

- [ ] Firewall auf Server `kunstmeran-app` anwenden

---

## TEIL 4: Verbindung testen

### Vom eigenen PC (Terminal/PowerShell):

```bash
ssh root@[SERVER-IP]
```

Falls SSH-Key verwendet:
```bash
ssh -i pfad/zum/key root@[SERVER-IP]
```

**Funktioniert die Verbindung?**
- [ ] Ja, ich bin auf dem Server eingeloggt
- [ ] Nein, Fehler: _______________________

---

## TEIL 5: Checkliste für Claude (nächste Session)

Wenn du wieder mit Claude arbeitest, gib diese Infos:

```
Server-IP: ___.___.___.___

Domain: _________________________________

SSH-Zugang funktioniert: [ ] Ja [ ] Nein

Microsoft SSO weiterhin nutzen: [ ] Ja [ ] Nein
```

Claude wird dann:
1. Server konfigurieren (PostgreSQL, Nginx, etc.)
2. Daten von Supabase migrieren
3. App anpassen und deployen

---

## Kosten-Übersicht

| Posten | Monatlich |
|--------|-----------|
| CX22 Server | ~4,85 € |
| Backups (+20%) | ~0,97 € |
| **Gesamt** | **~5,82 €** |

---

## Kontakt bei Problemen

- Hetzner Support: https://console.hetzner.cloud/support
- Dokumentation: https://docs.hetzner.com

---

## Notizen

```










```

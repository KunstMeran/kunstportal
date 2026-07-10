# Serverkosten - Projektsoftware Kunst Meran

## Übersicht der Servergrößen

Die folgenden Serveroptionen stehen zur Verfügung:

### Kleine Serverinstanz (Empfohlen für Start)
- **Größe:** Klein (z.B. 1 vCPU, 1-2 GB RAM)
- **Kosten:** ca. 5-10 EUR/Monat
- **Geeignet für:** 5-10 gleichzeitige Benutzer, grundlegende Datenverwaltung
- **Beispiel-Anbieter:** Hetzner Cloud CX11, DigitalOcean Basic Droplet

### Mittlere Serverinstanz
- **Größe:** Mittel (z.B. 2 vCPU, 4 GB RAM)
- **Kosten:** ca. 15-25 EUR/Monat
- **Geeignet für:** 10-25 gleichzeitige Benutzer, erweiterte Funktionen
- **Beispiel-Anbieter:** Hetzner Cloud CX21, DigitalOcean Standard Droplet

### Große Serverinstanz
- **Größe:** Groß (z.B. 4 vCPU, 8 GB RAM)
- **Kosten:** ca. 35-50 EUR/Monat
- **Geeignet für:** 25+ gleichzeitige Benutzer, umfangreiche Datenverarbeitung
- **Beispiel-Anbieter:** Hetzner Cloud CX31, DigitalOcean Performance Droplet

---

## Empfohlene Vorgehensweise

### Start mit kleinstem Server
**Wir starten zunächst mit der kleinsten Serverinstanz (ca. 5-10 EUR/Monat).**

**Begründung:**
- Niedrige Einstiegskosten
- Ausreichend für den Prototyp und erste Tests
- Geringes finanzielles Risiko
- Einfache Skalierung bei Bedarf

### Kostenanpassung bei Wachstum
Die Kosten können später je nach Nutzung steigen:
- Bei mehr Benutzern: Upgrade auf mittleren Server
- Bei umfangreicheren Daten: Upgrade auf größeren Server
- Bei erhöhtem Speicherbedarf: Zusätzlicher Storage (ca. 5-10 EUR/Monat pro 100 GB)

**Wichtig:** Der Server kann jederzeit ohne Datenverlust vergrößert werden. Die Skalierung erfolgt bedarfsgerecht.

---

## Sicherheitsempfehlungen

### VPN-Zugang (Empfohlen)
**Ich empfehle dringend die Nutzung eines VPN für den Zugriff auf den Server.**

**Vorteile eines VPN:**
- Verschlüsselte Verbindung zum Server
- Schutz vor unbefugtem Zugriff
- Sichere Verbindung auch von unterwegs
- Professioneller Standard für Unternehmensdaten

**VPN-Kosten:** ca. 5-15 EUR/Monat (z.B. WireGuard, OpenVPN)

---

## Zugriffsbeschränkungen

### Standardzugriff nur vom Büro
**Der Zugriff auf den Server ist standardmäßig nur vom Büro aus möglich.**

**Details:**
- Zugriff ist auf die IP-Adresse des Büros beschränkt
- Nur Geräte, die die VPN-Verbindung aufgebaut haben, können auf den Server zugreifen
- Externe Zugriffe (z.B. von zu Hause) sind ohne VPN nicht möglich
- Dies erhöht die Sicherheit erheblich

**Für Zugriff von außerhalb:**
1. VPN-Verbindung zum Büronetzwerk aufbauen
2. Erst dann ist der Zugriff auf den Server möglich
3. Alternativ: Whitelisting weiterer IP-Adressen (nach Absprache)

---

## Zusammenfassung der Kosten (Startphase)

| Position | Kosten/Monat |
|----------|--------------|
| Server (Klein) | 5-10 EUR |
| VPN (empfohlen) | 5-15 EUR |
| **Gesamt** | **10-25 EUR/Monat** |

**Zusätzliche Kosten bei Skalierung:** +10-40 EUR/Monat je nach Wachstum

---

## Nächste Schritte

1. Serveranbieter auswählen (Empfehlung: Hetzner Cloud für EU-Datenschutz)
2. Kleinste Serverinstanz bestellen
3. VPN einrichten für sicheren Zugriff
4. Büro-IP-Adresse für Zugriff freischalten
5. Software auf Server installieren
6. Test- und Produktivbetrieb starten

---

**Erstellt:** 05.06.2026
**Projekt:** Projektsoftware Kunst Meran
**Status:** Planung

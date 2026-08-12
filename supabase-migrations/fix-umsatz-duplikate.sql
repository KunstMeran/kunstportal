-- FIX: Doppelte Umsatz-Konten Patterns bereinigen
-- Datum: 2026-08-03
-- Problem: 6401xxx matcht sowohl "6401%" als auch "640%" -> doppelte Zählung

-- 1. Aktuelle UMSATZ-Patterns prüfen
SELECT konto_pattern, konto_name, db_zuordnung, sort_order
FROM chart_of_accounts
WHERE db_zuordnung = 'UMSATZ'
ORDER BY konto_pattern;

-- Problem:
-- 640%   -> matcht 6400xxx, 6401xxx, 6402xxx, etc.
-- 6400%  -> matcht nur 6400xxx
-- 6401%  -> matcht nur 6401xxx
--
-- Lösung: Lösche das allgemeine "640%" Pattern, da wir bereits spezifischere haben

-- 2. Lösche das überlappende allgemeine Pattern
DELETE FROM chart_of_accounts
WHERE konto_pattern = '640%';

-- 3. Stelle sicher dass alle 64xx Konten abgedeckt sind
-- Füge fehlende spezifische Patterns hinzu
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order)
VALUES
    ('6402%', 'Sonstige Erträge 6402', 'Umsatz', 'UMSATZ', false, 121),
    ('6403%', 'Sonstige Erträge 6403', 'Umsatz', 'UMSATZ', false, 122),
    ('6404%', 'Sonstige Erträge 6404', 'Umsatz', 'UMSATZ', false, 123),
    ('6405%', 'Sonstige Erträge 6405', 'Umsatz', 'UMSATZ', false, 124)
ON CONFLICT (konto_pattern) DO NOTHING;

-- 4. Verifiziere
SELECT konto_pattern, konto_name, db_zuordnung
FROM chart_of_accounts
WHERE db_zuordnung = 'UMSATZ'
ORDER BY konto_pattern;

-- 5. Prüfe welche 64xx Konten tatsächlich existieren
SELECT DISTINCT SUBSTRING(konto_nr, 1, 4) as konto_4, COUNT(*) as anzahl
FROM datev_bookings
WHERE konto_nr LIKE '64%'
GROUP BY SUBSTRING(konto_nr, 1, 4)
ORDER BY konto_4;

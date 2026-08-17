-- FIX: Doppelte Konten-Zuordnungen bereinigen
-- Datum: 2026-08-03
-- Problem: Konten wie 6901xxx matchen sowohl "6901%" als auch "690%" patterns

-- 1. Zeige alle aktuellen Patterns
SELECT konto_pattern, konto_name, db_zuordnung, sort_order
FROM chart_of_accounts
WHERE konto_pattern LIKE '69%' OR konto_pattern LIKE '68%'
ORDER BY konto_pattern;

-- 2. Problem:
--    690125% -> DB1_KOSTEN (Dienstleistungen Ausstellung)
--    6901%   -> DB2_KOSTEN (Verwaltung)
--    6902%   -> DB2_KOSTEN (Werbung)
--    69033%  -> DB1_KOSTEN (Künstler)
--
--    Aber "69012501" matcht BEIDE: 690125% UND 6901%!

-- 3. Lösung: Spezifischere Patterns zuerst prüfen ODER
--            die Logik im Code ändern (längste Pattern zuerst matchen)

-- 4. Bereinigung - Lösche überlappende Patterns
-- Option A: Lösche die allgemeineren Patterns wenn spezifischere existieren
-- DELETE FROM chart_of_accounts WHERE konto_pattern = '6901%';
-- DELETE FROM chart_of_accounts WHERE konto_pattern = '6902%';

-- Option B: Ändere die allgemeineren Patterns zu spezifischeren
-- Beispiel: 6901% -> alle außer 690125%

-- 5. Prüfe welche Kontonummern tatsächlich existieren
SELECT DISTINCT SUBSTRING(konto_nr, 1, 6) as konto_6, COUNT(*) as anzahl
FROM datev_bookings
WHERE konto_nr LIKE '690%'
GROUP BY SUBSTRING(konto_nr, 1, 6)
ORDER BY konto_6;

-- 6. Prüfe 69% Konten im Detail
SELECT DISTINCT SUBSTRING(konto_nr, 1, 5) as konto_5, COUNT(*) as anzahl
FROM datev_bookings
WHERE konto_nr LIKE '69%'
GROUP BY SUBSTRING(konto_nr, 1, 5)
ORDER BY konto_5;

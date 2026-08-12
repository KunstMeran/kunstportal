-- DEBUG: Fehlende Umsatz-Konten in der DB-Rechnung finden
-- Datum: 2026-08-03

-- 1. Alle Konten die mit 6 beginnen (Ertragskonten) und deren Summen für 2025
SELECT
    SUBSTRING(konto_nr, 1, 4) as konto_prefix,
    COUNT(*) as anzahl_buchungen,
    SUM(betrag_gesamt) as summe
FROM datev_bookings
WHERE EXTRACT(YEAR FROM datum) = 2025
  AND konto_nr LIKE '6%'
GROUP BY SUBSTRING(konto_nr, 1, 4)
ORDER BY konto_prefix;

-- 2. Vergleich: Welche Konten sind NICHT im chart_of_accounts mit UMSATZ?
SELECT
    SUBSTRING(db.konto_nr, 1, 4) as konto_prefix,
    COUNT(*) as anzahl_buchungen,
    SUM(db.betrag_gesamt) as summe,
    COALESCE(coa.db_zuordnung, 'NICHT ZUGEORDNET') as db_zuordnung
FROM datev_bookings db
LEFT JOIN chart_of_accounts coa
    ON db.konto_nr LIKE REPLACE(coa.konto_pattern, '%', '') || '%'
WHERE EXTRACT(YEAR FROM db.datum) = 2025
  AND db.konto_nr LIKE '6%'
GROUP BY SUBSTRING(db.konto_nr, 1, 4), coa.db_zuordnung
ORDER BY konto_prefix;

-- 3. Alle eindeutigen Konto-Prefixe die als UMSATZ markiert sein sollten (600-679 + 840-849)
-- aber nicht im chart_of_accounts sind
SELECT DISTINCT SUBSTRING(konto_nr, 1, 3) as konto_3stellig
FROM datev_bookings
WHERE EXTRACT(YEAR FROM datum) = 2025
  AND (konto_nr LIKE '60%' OR konto_nr LIKE '61%' OR konto_nr LIKE '62%'
       OR konto_nr LIKE '63%' OR konto_nr LIKE '64%' OR konto_nr LIKE '65%'
       OR konto_nr LIKE '66%' OR konto_nr LIKE '67%' OR konto_nr LIKE '84%')
ORDER BY konto_3stellig;

-- 4. Aktuelle chart_of_accounts Einträge mit UMSATZ
SELECT konto_pattern, konto_name, db_zuordnung
FROM chart_of_accounts
WHERE db_zuordnung = 'UMSATZ'
ORDER BY konto_pattern;

-- 5. Summe aller Ertragskonten (600-679) für 2025 - sollte ~1.194.753 sein
SELECT
    SUM(betrag_gesamt) as umsatz_gesamt_2025
FROM datev_bookings
WHERE EXTRACT(YEAR FROM datum) = 2025
  AND konto_nr LIKE '6%'
  AND CAST(SUBSTRING(konto_nr, 1, 2) AS INTEGER) BETWEEN 60 AND 67;

-- FIX: Fehlende Umsatz-Konten für DB-Rechnung hinzufügen
-- Datum: 2026-08-03
-- Problem: DB-Rechnung zeigt nur ~380k Umsatz, GuV zeigt ~1.195k
-- Ursache: Nur 6001%, 6400%, 6401% als UMSATZ markiert, aber alle 600-679 sollten Umsatz sein

-- 1. Alle Ertragskonten als UMSATZ markieren (entspricht GuV-Struktur)
-- Konten 600-679 = Erträge

-- Füge breitere Pattern hinzu
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order)
VALUES
    -- Erlöse aus Lieferungen und Leistungen (600-609)
    ('600%', 'Erlöse Lieferungen/Leistungen', 'Umsatz', 'UMSATZ', false, 100),
    ('601%', 'Erlöse aus Leistungen', 'Umsatz', 'UMSATZ', false, 101),
    ('602%', 'Provisionen', 'Umsatz', 'UMSATZ', false, 102),
    ('603%', 'Erlöse Nebengeschäft', 'Umsatz', 'UMSATZ', false, 103),
    ('604%', 'Erlöse Vermietung', 'Umsatz', 'UMSATZ', false, 104),
    ('605%', 'Sonstige Erlöse', 'Umsatz', 'UMSATZ', false, 105),
    -- Sonstige betriebliche Erträge (640-679)
    ('64%', 'Sonstige betriebl. Erträge', 'Umsatz', 'UMSATZ', false, 140),
    ('65%', 'Erträge aus Zuschüssen', 'Umsatz', 'UMSATZ', false, 150),
    ('66%', 'Erträge aus Spenden', 'Umsatz', 'UMSATZ', false, 160),
    ('67%', 'Sonstige Erträge', 'Umsatz', 'UMSATZ', false, 170)
ON CONFLICT (konto_pattern) DO UPDATE SET
    db_zuordnung = 'UMSATZ',
    kategorie = 'Umsatz';

-- 2. Lösche zu spezifische alte Einträge die jetzt redundant sind
-- (optional - nur wenn die breiteren Pattern funktionieren)
-- DELETE FROM chart_of_accounts WHERE konto_pattern IN ('6001%', '6400%', '6401%');

-- 3. Prüfe das Ergebnis
SELECT konto_pattern, konto_name, db_zuordnung
FROM chart_of_accounts
WHERE db_zuordnung = 'UMSATZ'
ORDER BY konto_pattern;

-- =====================================================
-- MIGRATION: Geburtsdatum aus Steuernummer berechnen
-- Aktualisiert birth_date basierend auf tax_number (Codice Fiscale)
-- =====================================================

-- Funktion zum Parsen des Codice Fiscale
CREATE OR REPLACE FUNCTION parse_codice_fiscale_birthdate(cf TEXT)
RETURNS DATE AS $$
DECLARE
    year_part INTEGER;
    month_char CHAR(1);
    month_num INTEGER;
    day_part INTEGER;
    full_year INTEGER;
    current_year INTEGER;
BEGIN
    -- Null oder zu kurz
    IF cf IS NULL OR LENGTH(cf) < 11 THEN
        RETURN NULL;
    END IF;

    -- Uppercase und nur alphanumerisch
    cf := UPPER(REGEXP_REPLACE(cf, '[^A-Z0-9]', '', 'g'));

    IF LENGTH(cf) < 11 THEN
        RETURN NULL;
    END IF;

    -- Jahr extrahieren (Position 7-8, 1-indexed)
    year_part := CAST(SUBSTRING(cf FROM 7 FOR 2) AS INTEGER);

    -- Monat extrahieren (Position 9)
    month_char := SUBSTRING(cf FROM 9 FOR 1);
    month_num := CASE month_char
        WHEN 'A' THEN 1   -- Januar
        WHEN 'B' THEN 2   -- Februar
        WHEN 'C' THEN 3   -- März
        WHEN 'D' THEN 4   -- April
        WHEN 'E' THEN 5   -- Mai
        WHEN 'H' THEN 6   -- Juni
        WHEN 'L' THEN 7   -- Juli
        WHEN 'M' THEN 8   -- August
        WHEN 'P' THEN 9   -- September
        WHEN 'R' THEN 10  -- Oktober
        WHEN 'S' THEN 11  -- November
        WHEN 'T' THEN 12  -- Dezember
        ELSE NULL
    END;

    IF month_num IS NULL THEN
        RETURN NULL;
    END IF;

    -- Tag extrahieren (Position 10-11)
    day_part := CAST(SUBSTRING(cf FROM 10 FOR 2) AS INTEGER);

    -- Bei Frauen ist der Tag +40
    IF day_part > 40 THEN
        day_part := day_part - 40;
    END IF;

    -- Validierung
    IF day_part < 1 OR day_part > 31 THEN
        RETURN NULL;
    END IF;

    -- Jahr bestimmen (Jahrhundert erraten)
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    full_year := (current_year / 100) * 100 + year_part;

    -- Wenn in der Zukunft, 100 Jahre abziehen
    IF full_year > current_year THEN
        full_year := full_year - 100;
    END IF;

    -- Datum erstellen
    RETURN make_date(full_year, month_num, day_part);

EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Alle Mitglieder mit Steuernummer aktualisieren
UPDATE members
SET birth_date = parse_codice_fiscale_birthdate(tax_number)
WHERE tax_number IS NOT NULL
  AND LENGTH(tax_number) >= 11
  AND parse_codice_fiscale_birthdate(tax_number) IS NOT NULL;

-- Ergebnis anzeigen
SELECT
    last_name,
    first_name,
    tax_number,
    birth_date,
    parse_codice_fiscale_birthdate(tax_number) as parsed_date
FROM members
WHERE tax_number IS NOT NULL
ORDER BY last_name
LIMIT 20;

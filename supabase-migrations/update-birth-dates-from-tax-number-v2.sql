-- =====================================================
-- MIGRATION: Geburtsdatum aus Steuernummer berechnen (v2)
-- Robuste Version mit Fehlerbehandlung
-- =====================================================

-- Schritt 1: Funktion erstellen
CREATE OR REPLACE FUNCTION parse_codice_fiscale_birthdate(cf TEXT)
RETURNS DATE AS $$
DECLARE
    clean_cf TEXT;
    year_str TEXT;
    year_part INTEGER;
    month_char TEXT;
    month_num INTEGER;
    day_str TEXT;
    day_part INTEGER;
    full_year INTEGER;
    current_year INTEGER;
BEGIN
    -- Null oder zu kurz
    IF cf IS NULL OR LENGTH(TRIM(cf)) < 11 THEN
        RETURN NULL;
    END IF;

    -- Uppercase und trimmen
    clean_cf := UPPER(TRIM(cf));

    -- Prüfen ob Position 7-8 Zahlen sind
    year_str := SUBSTRING(clean_cf FROM 7 FOR 2);
    IF year_str !~ '^[0-9]{2}$' THEN
        RETURN NULL;
    END IF;
    year_part := year_str::INTEGER;

    -- Monat extrahieren (Position 9)
    month_char := SUBSTRING(clean_cf FROM 9 FOR 1);
    month_num := CASE month_char
        WHEN 'A' THEN 1
        WHEN 'B' THEN 2
        WHEN 'C' THEN 3
        WHEN 'D' THEN 4
        WHEN 'E' THEN 5
        WHEN 'H' THEN 6
        WHEN 'L' THEN 7
        WHEN 'M' THEN 8
        WHEN 'P' THEN 9
        WHEN 'R' THEN 10
        WHEN 'S' THEN 11
        WHEN 'T' THEN 12
        ELSE NULL
    END;

    IF month_num IS NULL THEN
        RETURN NULL;
    END IF;

    -- Tag prüfen (Position 10-11 müssen Zahlen sein)
    day_str := SUBSTRING(clean_cf FROM 10 FOR 2);
    IF day_str !~ '^[0-9]{2}$' THEN
        RETURN NULL;
    END IF;
    day_part := day_str::INTEGER;

    -- Bei Frauen ist der Tag +40
    IF day_part > 40 THEN
        day_part := day_part - 40;
    END IF;

    -- Validierung Tag
    IF day_part < 1 OR day_part > 31 THEN
        RETURN NULL;
    END IF;

    -- Jahr bestimmen
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    full_year := (current_year / 100) * 100 + year_part;

    IF full_year > current_year THEN
        full_year := full_year - 100;
    END IF;

    -- Datum erstellen
    RETURN make_date(full_year, month_num, day_part);

EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Schritt 2: Vorschau anzeigen (welche Datensätze werden aktualisiert?)
SELECT
    id,
    last_name,
    first_name,
    tax_number,
    birth_date AS alte_birth_date,
    parse_codice_fiscale_birthdate(tax_number) AS neue_birth_date
FROM members
WHERE tax_number IS NOT NULL
  AND LENGTH(TRIM(tax_number)) >= 11
  AND parse_codice_fiscale_birthdate(tax_number) IS NOT NULL
ORDER BY last_name;

-- Schritt 3: Update ausführen (diese Zeile separat ausführen!)
-- UPDATE members
-- SET birth_date = parse_codice_fiscale_birthdate(tax_number)
-- WHERE tax_number IS NOT NULL
--   AND LENGTH(TRIM(tax_number)) >= 11
--   AND parse_codice_fiscale_birthdate(tax_number) IS NOT NULL;

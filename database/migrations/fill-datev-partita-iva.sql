-- Fülle partita_iva in datev_bookings basierend auf fornitore_name
-- Die Partita IVA wird aus der suppliers Tabelle geholt

UPDATE datev_bookings db
SET partita_iva = s.partita_iva
FROM suppliers s
WHERE
    LOWER(TRIM(db.fornitore_name)) = LOWER(TRIM(s.fornitore_name))
    AND (db.partita_iva IS NULL OR db.partita_iva = '');

-- Zeige wie viele aktualisiert wurden
SELECT COUNT(*) AS updated_count
FROM datev_bookings
WHERE partita_iva IS NOT NULL AND partita_iva != '';

-- Zeige Buchungen die noch keine Partita IVA haben
SELECT DISTINCT fornitore_name
FROM datev_bookings
WHERE partita_iva IS NULL OR partita_iva = ''
ORDER BY fornitore_name
LIMIT 20;

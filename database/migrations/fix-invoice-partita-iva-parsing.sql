-- Fix: Korrigiere partita_iva und invoice_number in der invoices Tabelle
-- Problem: Bei Dateinamen wie "2026_IT00098090210_5000758.pdf" wurde
-- partita_iva = "2026" und invoice_number = "IT00098090210_5000758" gespeichert
-- Richtig wäre: partita_iva = "IT00098090210" und invoice_number = "5000758"

-- Update für Fälle wo partita_iva ein Jahr ist (4 Ziffern) und invoice_number mit IT beginnt
UPDATE invoices
SET
    partita_iva = SPLIT_PART(invoice_number, '_', 1),
    invoice_number = SUBSTRING(invoice_number FROM POSITION('_' IN invoice_number) + 1)
WHERE
    partita_iva ~ '^\d{4}$'  -- partita_iva ist 4 Ziffern (Jahr)
    AND invoice_number LIKE 'IT%_%';  -- invoice_number beginnt mit IT und hat Unterstrich

-- Zeige die korrigierten Daten
SELECT id, file_name, partita_iva, invoice_number
FROM invoices
WHERE partita_iva LIKE 'IT%'
ORDER BY created_at DESC
LIMIT 20;

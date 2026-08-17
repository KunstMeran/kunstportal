-- Migration: Add linked_booking_id to invoices table for multiple PDFs per booking
-- Date: 2026-07-31
-- Description: Allows multiple PDF invoices to be linked to a single DATEV booking

-- Add linked_booking_id column to invoices table
-- WICHTIG: datev_bookings.id ist BIGINT (nicht UUID), daher BIGINT verwenden
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS linked_booking_id BIGINT REFERENCES datev_bookings(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_linked_booking_id ON invoices(linked_booking_id);

-- Migrate existing data: Copy linked_invoice_id from datev_bookings to invoices
-- This converts the old 1:1 relationship to the new 1:n relationship
UPDATE invoices i
SET linked_booking_id = db.id
FROM datev_bookings db
WHERE db.linked_invoice_id = i.id
  AND i.linked_booking_id IS NULL;

-- Note: After migration is complete and verified, the linked_invoice_id column
-- in datev_bookings can be dropped in a future migration

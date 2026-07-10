-- Migration: Check and fix invoices table structure
-- Date: 2026-07-10

-- Add missing columns if they don't exist
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS partita_iva TEXT;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Check RLS policies
-- Show all policies for invoices table
SELECT * FROM pg_policies WHERE tablename = 'invoices';

-- If RLS is too restrictive, you might need to adjust:
-- Enable UPDATE for authenticated users
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
CREATE POLICY "Users can update invoices"
ON invoices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable SELECT for authenticated users
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
CREATE POLICY "Users can view invoices"
ON invoices FOR SELECT
TO authenticated
USING (true);

-- Enable INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
CREATE POLICY "Users can insert invoices"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (true);

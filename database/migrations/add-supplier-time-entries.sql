-- =====================================================
-- MIGRATION: Add supplier_partita_iva to time_entries
-- Purpose: Allow time tracking for external suppliers (e.g., electricians, maintenance)
-- Date: 2026-08-17
-- =====================================================

-- 1. Add supplier reference column to time_entries
-- When supplier_partita_iva is set, this is a supplier time entry (not a user entry)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS supplier_partita_iva TEXT REFERENCES suppliers(partita_iva);

-- 2. Make user_id nullable (for supplier entries, user_id will be NULL)
-- Note: Existing entries have user_id set, new supplier entries will have NULL
ALTER TABLE time_entries
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add check constraint: Either user_id OR supplier_partita_iva must be set
-- This ensures every entry is either a user entry or a supplier entry
ALTER TABLE time_entries
ADD CONSTRAINT time_entries_user_or_supplier_check
CHECK (
    (user_id IS NOT NULL AND supplier_partita_iva IS NULL) OR
    (user_id IS NULL AND supplier_partita_iva IS NOT NULL)
);

-- 4. Index for performance when filtering by supplier
CREATE INDEX IF NOT EXISTS idx_time_entries_supplier
ON time_entries(supplier_partita_iva)
WHERE supplier_partita_iva IS NOT NULL;

-- 5. Comments
COMMENT ON COLUMN time_entries.supplier_partita_iva IS 'Reference to supplier for external service time entries (e.g., maintenance, electrician). Mutually exclusive with user_id.';

-- =====================================================
-- ROLLBACK (if needed):
-- ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_or_supplier_check;
-- ALTER TABLE time_entries DROP COLUMN IF EXISTS supplier_partita_iva;
-- ALTER TABLE time_entries ALTER COLUMN user_id SET NOT NULL;
-- =====================================================

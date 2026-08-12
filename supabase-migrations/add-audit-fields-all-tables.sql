-- =====================================================
-- MIGRATION: Add Audit Fields to All Tables
-- User-Tracking: created_by, updated_by
-- Soft-Delete: deleted_at, deleted_by
-- =====================================================

-- 1. DATEV_BOOKINGS - Alle Audit-Felder hinzufügen
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. INVOICES - created_by, updated_by, deleted_at, deleted_by
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 3. SUPPLIERS - Alle Audit-Felder hinzufügen
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 4. BUDGET_ITEMS - Alle Audit-Felder hinzufügen
ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 5. FUNDING_SOURCES - Alle Audit-Felder hinzufügen
ALTER TABLE funding_sources
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 6. TIME_ENTRIES - Alle Audit-Felder hinzufügen
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 7. INVENTORY - Alle Audit-Felder hinzufügen
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 8. CHART_OF_ACCOUNTS - Alle Audit-Felder hinzufügen
ALTER TABLE chart_of_accounts
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 9. ABGABESTELLEN - Alle Audit-Felder hinzufügen (falls Tabelle existiert)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'abgabestellen') THEN
        ALTER TABLE abgabestellen
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 10. PROJECTS - deleted_at, deleted_by hinzufügen (hat bereits created_by)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 11. COSTS - updated_by, deleted_at, deleted_by hinzufügen (hat bereits created_by)
ALTER TABLE costs
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 12. MEMBERS - updated_by, deleted_at, deleted_by hinzufügen (hat bereits created_by)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 13. MEMBER_PAYMENTS - Alle Audit-Felder hinzufügen
ALTER TABLE member_payments
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 14. COST_TYPES - Alle Audit-Felder hinzufügen
ALTER TABLE cost_types
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 15. BUDGET_PLANNING - Alle Audit-Felder hinzufügen (falls Tabelle existiert)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_planning') THEN
        ALTER TABLE budget_planning
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- =====================================================
-- INDEXES für Performance bei Soft-Delete Abfragen
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_datev_bookings_deleted_at ON datev_bookings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_budget_items_deleted_at ON budget_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_funding_sources_deleted_at ON funding_sources(deleted_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_deleted_at ON time_entries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_inventory_deleted_at ON inventory(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_costs_deleted_at ON costs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cost_types_deleted_at ON cost_types(deleted_at);

-- =====================================================
-- KOMMENTAR
-- =====================================================
COMMENT ON COLUMN projects.created_by IS 'User ID who created this record';
COMMENT ON COLUMN projects.updated_by IS 'User ID who last updated this record';
COMMENT ON COLUMN projects.deleted_at IS 'Timestamp when record was soft-deleted (NULL = active)';
COMMENT ON COLUMN projects.deleted_by IS 'User ID who soft-deleted this record';

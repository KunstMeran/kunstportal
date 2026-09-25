-- Migration: Create cost_links table for linking planned costs to actual costs
-- Date: 2026-09-25
-- Description: Enables linking planned costs (type='geplant') to actual costs (IST),
--              invoices, or DATEV bookings. Prevents double-counting in budget calculations.

-- ============================================
-- 1. Create cost_links table
-- ============================================
CREATE TABLE IF NOT EXISTS cost_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planned_cost_id UUID NOT NULL REFERENCES costs(id) ON DELETE CASCADE,
    -- One of these three must be set:
    actual_cost_id UUID REFERENCES costs(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    datev_booking_id BIGINT,  -- References datev_bookings.rechnungs_id
    amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    -- Ensure exactly one link type is set
    CONSTRAINT one_link_type CHECK (
        (CASE WHEN actual_cost_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN invoice_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN datev_booking_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- ============================================
-- 2. Add indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cost_links_planned ON cost_links(planned_cost_id);
CREATE INDEX IF NOT EXISTS idx_cost_links_actual ON cost_links(actual_cost_id) WHERE actual_cost_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_links_invoice ON cost_links(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_links_datev ON cost_links(datev_booking_id) WHERE datev_booking_id IS NOT NULL;

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON TABLE cost_links IS 'Links planned costs to actual costs, invoices, or DATEV bookings';
COMMENT ON COLUMN cost_links.planned_cost_id IS 'Reference to planned cost (costs.cost_type = geplant)';
COMMENT ON COLUMN cost_links.actual_cost_id IS 'Reference to actual/IST cost (costs.cost_type = ist)';
COMMENT ON COLUMN cost_links.invoice_id IS 'Reference to invoice';
COMMENT ON COLUMN cost_links.datev_booking_id IS 'Reference to DATEV booking (rechnungs_id)';
COMMENT ON COLUMN cost_links.amount IS 'Amount attributed to this link (for partial allocations)';

-- ============================================
-- 4. Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON cost_links TO kunstmeran_app;

-- ============================================
-- 5. Verify table was created
-- ============================================
SELECT 'cost_links created' AS status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cost_links') AS exists;

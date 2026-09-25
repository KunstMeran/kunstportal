-- Migration: Add PL budget columns to projects and pl_category to costs
-- Date: 2024-09-25
-- Description: Adds project leader budget allocation and cost assignment

-- ============================================
-- 1. Add pl_category column to costs table
-- ============================================
ALTER TABLE costs
ADD COLUMN IF NOT EXISTS pl_category VARCHAR(10) DEFAULT NULL;

COMMENT ON COLUMN costs.pl_category IS 'Projektleiter-Kategorie: PL1, PL2 oder PL3';

-- ============================================
-- 2. Add budget columns per PL to projects table
-- ============================================
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_pl1 DECIMAL(12,2) DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_pl2 DECIMAL(12,2) DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_pl3 DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN projects.budget_pl1 IS 'Budget für PL1 (Ausstellung)';
COMMENT ON COLUMN projects.budget_pl2 IS 'Budget für PL2 (Kommunikation)';
COMMENT ON COLUMN projects.budget_pl3 IS 'Budget für PL3 (Vermittlung)';

-- ============================================
-- Verify columns were added
-- ============================================
SELECT 'costs.pl_category' as column_check, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'costs' AND column_name = 'pl_category'
UNION ALL
SELECT 'projects.budget_pl1', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'budget_pl1'
UNION ALL
SELECT 'projects.budget_pl2', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'budget_pl2'
UNION ALL
SELECT 'projects.budget_pl3', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'budget_pl3';

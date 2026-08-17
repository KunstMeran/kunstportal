-- =====================================================
-- Migration: RLS für Legacy-Tabellen (budget_items, costs)
-- Datum: 2026-08-17
-- Zweck: Workspace-basierte Berechtigungen
-- HINWEIS: access_* Spalten sind ENUM (permission_level: none/read/write/delete)
-- =====================================================

-- =====================================================
-- budget_items (Legacy)
-- =====================================================

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- SELECT: Alle authentifizierten User
CREATE POLICY "Users can view budget_items"
    ON budget_items
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Nur User mit access_projekte >= 'write'
CREATE POLICY "Users with access_projekte can insert budget_items"
    ON budget_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte IN ('write', 'delete')
            AND w.is_active = true
        )
    );

-- UPDATE: Nur User mit access_projekte >= 'write'
CREATE POLICY "Users with access_projekte can update budget_items"
    ON budget_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte IN ('write', 'delete')
            AND w.is_active = true
        )
    );

-- DELETE: Nur User mit access_projekte = 'delete'
CREATE POLICY "Users with access_projekte can delete budget_items"
    ON budget_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte = 'delete'
            AND w.is_active = true
        )
    );

-- =====================================================
-- costs (Legacy)
-- =====================================================

ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- SELECT: Alle authentifizierten User
CREATE POLICY "Users can view costs"
    ON costs
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Nur User mit access_rechnungen >= 'write'
CREATE POLICY "Users with access_rechnungen can insert costs"
    ON costs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen IN ('write', 'delete')
            AND w.is_active = true
        )
    );

-- UPDATE: Nur User mit access_rechnungen >= 'write'
CREATE POLICY "Users with access_rechnungen can update costs"
    ON costs
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen IN ('write', 'delete')
            AND w.is_active = true
        )
    );

-- DELETE: Nur User mit access_rechnungen = 'delete'
CREATE POLICY "Users with access_rechnungen can delete costs"
    ON costs
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen = 'delete'
            AND w.is_active = true
        )
    );

-- =====================================================
-- Kommentare
-- =====================================================
COMMENT ON TABLE budget_items IS 'Legacy-Tabelle für Budget-Positionen - RLS via Workspace access_projekte';
COMMENT ON TABLE costs IS 'Legacy-Tabelle für Einzelkosten - RLS via Workspace access_rechnungen';

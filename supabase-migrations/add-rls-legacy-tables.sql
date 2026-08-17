-- =====================================================
-- Migration: RLS für Legacy-Tabellen (budget_items, costs)
-- Datum: 2026-08-17
-- Zweck: Workspace-basierte Berechtigungen
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

-- INSERT/UPDATE/DELETE: Nur User mit access_projekte (Budget gehört zu Projekten)
CREATE POLICY "Users with access_projekte can insert budget_items"
    ON budget_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte = true
            AND w.is_active = true
        )
    );

CREATE POLICY "Users with access_projekte can update budget_items"
    ON budget_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte = true
            AND w.is_active = true
        )
    );

CREATE POLICY "Users with access_projekte can delete budget_items"
    ON budget_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte = true
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

-- INSERT/UPDATE/DELETE: Nur User mit access_rechnungen (Kosten gehören zu Rechnungen)
CREATE POLICY "Users with access_rechnungen can insert costs"
    ON costs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen = true
            AND w.is_active = true
        )
    );

CREATE POLICY "Users with access_rechnungen can update costs"
    ON costs
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen = true
            AND w.is_active = true
        )
    );

CREATE POLICY "Users with access_rechnungen can delete costs"
    ON costs
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_rechnungen = true
            AND w.is_active = true
        )
    );

-- =====================================================
-- Kommentare
-- =====================================================
COMMENT ON TABLE budget_items IS 'Legacy-Tabelle für Budget-Positionen - RLS via Workspace access_projekte';
COMMENT ON TABLE costs IS 'Legacy-Tabelle für Einzelkosten - RLS via Workspace access_rechnungen';

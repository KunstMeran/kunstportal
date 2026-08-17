-- =====================================================
-- Migration: RLS für Projects-Tabelle
-- Datum: 2026-08-17
-- Zweck: Workspace-basierte Berechtigungen für Projekte
-- =====================================================

-- 1. RLS aktivieren
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Alle authentifizierten User können Projekte sehen
CREATE POLICY "Users can view projects"
    ON projects
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. INSERT: Nur User mit access_projekte Berechtigung
CREATE POLICY "Users with access_projekte can insert projects"
    ON projects
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

-- 4. UPDATE: Nur User mit access_projekte Berechtigung
CREATE POLICY "Users with access_projekte can update projects"
    ON projects
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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_workspaces uw
            JOIN workspaces w ON uw.workspace_id = w.id
            WHERE uw.user_id = auth.uid()
            AND w.access_projekte = true
            AND w.is_active = true
        )
    );

-- 5. DELETE: Nur User mit access_projekte Berechtigung
CREATE POLICY "Users with access_projekte can delete projects"
    ON projects
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
-- Kommentare
-- =====================================================
COMMENT ON POLICY "Users can view projects" ON projects IS 'Alle authentifizierten User können Projekte sehen';
COMMENT ON POLICY "Users with access_projekte can insert projects" ON projects IS 'Nur User mit Workspace-Berechtigung access_projekte können Projekte erstellen';
COMMENT ON POLICY "Users with access_projekte can update projects" ON projects IS 'Nur User mit Workspace-Berechtigung access_projekte können Projekte bearbeiten';
COMMENT ON POLICY "Users with access_projekte can delete projects" ON projects IS 'Nur User mit Workspace-Berechtigung access_projekte können Projekte löschen';

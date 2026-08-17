-- Migration: Workspace-System für Berechtigungsverwaltung
-- Datum: 2026-07-29
-- Beschreibung: Erstellt Tabellen für Workspaces und User-Zuweisungen mit Seitenberechtigungen

-- 1. Workspaces Tabelle
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                              -- z.B. "Buchhaltung", "Projektleitung"
    description TEXT,                                -- Beschreibung des Workspace

    -- Seitenberechtigungen (true = Zugriff erlaubt)
    access_dashboard BOOLEAN DEFAULT false,
    access_projekte BOOLEAN DEFAULT false,
    access_rechnungen BOOLEAN DEFAULT false,
    access_bewegungen BOOLEAN DEFAULT false,
    access_lieferanten BOOLEAN DEFAULT false,
    access_mitglieder BOOLEAN DEFAULT false,
    access_einnahmen BOOLEAN DEFAULT false,
    access_konfiguration BOOLEAN DEFAULT false,

    -- Zusätzliche Einschränkungen für Rechnungen
    rechnungen_nur_zugewiesene BOOLEAN DEFAULT false, -- Nur zugewiesene Rechnungen sehen

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. User-Workspace Zuweisungen
CREATE TABLE IF NOT EXISTS user_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false,                  -- Workspace-Admin kann andere User hinzufügen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(user_id, workspace_id)                    -- User kann nur einmal pro Workspace sein
);

-- 3. Indizes
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON workspaces(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_workspaces_user ON user_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workspaces_workspace ON user_workspaces(workspace_id);

-- 4. RLS aktivieren
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies für workspaces
CREATE POLICY "Users can view workspaces"
    ON workspaces FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert workspaces"
    ON workspaces FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- Später: nur bestimmte Rollen

CREATE POLICY "Admins can update workspaces"
    ON workspaces FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can delete workspaces"
    ON workspaces FOR DELETE
    TO authenticated
    USING (true);

-- 6. RLS Policies für user_workspaces
CREATE POLICY "Users can view user_workspaces"
    ON user_workspaces FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert user_workspaces"
    ON user_workspaces FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update user_workspaces"
    ON user_workspaces FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can delete user_workspaces"
    ON user_workspaces FOR DELETE
    TO authenticated
    USING (true);

-- 7. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workspaces_updated_at ON workspaces;
CREATE TRIGGER trigger_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_workspaces_updated_at();

-- 8. Standard-Workspace "Admin" erstellen (Vollzugriff)
INSERT INTO workspaces (name, description, access_dashboard, access_projekte, access_rechnungen, access_bewegungen, access_lieferanten, access_mitglieder, access_einnahmen, access_konfiguration, rechnungen_nur_zugewiesene)
VALUES ('Admin', 'Vollzugriff auf alle Bereiche', true, true, true, true, true, true, true, true, false)
ON CONFLICT DO NOTHING;

-- 9. View für einfache Abfrage der User-Berechtigungen
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    uw.user_id,
    au.email as user_email,
    w.id as workspace_id,
    w.name as workspace_name,
    w.access_dashboard,
    w.access_projekte,
    w.access_rechnungen,
    w.access_bewegungen,
    w.access_lieferanten,
    w.access_mitglieder,
    w.access_einnahmen,
    w.access_konfiguration,
    w.rechnungen_nur_zugewiesene,
    uw.is_admin as is_workspace_admin
FROM user_workspaces uw
JOIN workspaces w ON uw.workspace_id = w.id
JOIN auth.users au ON uw.user_id = au.id
WHERE w.is_active = true;

-- Kommentare
COMMENT ON TABLE workspaces IS 'Workspaces definieren Berechtigungsgruppen mit Seitenzugriff';
COMMENT ON TABLE user_workspaces IS 'Verknüpfung zwischen Usern und Workspaces';
COMMENT ON VIEW user_permissions IS 'Aggregierte Berechtigungen pro User';

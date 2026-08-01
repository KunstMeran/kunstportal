-- Migration: Erweitertes Berechtigungssystem (3-Stufen: none/read/write)
-- Datum: 2026-08-01
-- Beschreibung: Erweitert die boolean-Felder auf 3-stufige Berechtigungen
--               none = kein Zugriff, read = nur lesen, write = lesen+bearbeiten

-- 1. ENUM-Typ erstellen (falls nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
        CREATE TYPE permission_level AS ENUM ('none', 'read', 'write');
    END IF;
END $$;

-- 2. Temporäre Spalten mit neuem Typ erstellen
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_dashboard permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_projekte permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_rechnungen permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_bewegungen permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_lieferanten permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_mitglieder permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_einnahmen permission_level DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS perm_konfiguration permission_level DEFAULT 'none';

-- 3. Daten migrieren (boolean true -> 'write', false -> 'none')
UPDATE workspaces SET
    perm_dashboard = CASE WHEN access_dashboard = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_projekte = CASE WHEN access_projekte = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_rechnungen = CASE WHEN access_rechnungen = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_bewegungen = CASE WHEN access_bewegungen = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_lieferanten = CASE WHEN access_lieferanten = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_mitglieder = CASE WHEN access_mitglieder = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_einnahmen = CASE WHEN access_einnahmen = true THEN 'write'::permission_level ELSE 'none'::permission_level END,
    perm_konfiguration = CASE WHEN access_konfiguration = true THEN 'write'::permission_level ELSE 'none'::permission_level END
WHERE perm_dashboard = 'none' AND access_dashboard IS NOT NULL;

-- 4. Alte boolean-Spalten löschen
ALTER TABLE workspaces
    DROP COLUMN IF EXISTS access_dashboard,
    DROP COLUMN IF EXISTS access_projekte,
    DROP COLUMN IF EXISTS access_rechnungen,
    DROP COLUMN IF EXISTS access_bewegungen,
    DROP COLUMN IF EXISTS access_lieferanten,
    DROP COLUMN IF EXISTS access_mitglieder,
    DROP COLUMN IF EXISTS access_einnahmen,
    DROP COLUMN IF EXISTS access_konfiguration;

-- 5. Neue Spalten umbenennen zu den ursprünglichen Namen
ALTER TABLE workspaces RENAME COLUMN perm_dashboard TO access_dashboard;
ALTER TABLE workspaces RENAME COLUMN perm_projekte TO access_projekte;
ALTER TABLE workspaces RENAME COLUMN perm_rechnungen TO access_rechnungen;
ALTER TABLE workspaces RENAME COLUMN perm_bewegungen TO access_bewegungen;
ALTER TABLE workspaces RENAME COLUMN perm_lieferanten TO access_lieferanten;
ALTER TABLE workspaces RENAME COLUMN perm_mitglieder TO access_mitglieder;
ALTER TABLE workspaces RENAME COLUMN perm_einnahmen TO access_einnahmen;
ALTER TABLE workspaces RENAME COLUMN perm_konfiguration TO access_konfiguration;

-- 6. View für User-Berechtigungen aktualisieren (mit numerischer Aggregation)
DROP VIEW IF EXISTS user_permissions;
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    uw.user_id,
    au.email as user_email,
    -- Aggregierte Berechtigungen über alle Workspaces (höchste Stufe gewinnt)
    -- 0=none, 1=read, 2=write -> MAX nimmt höchsten Wert
    CASE MAX(CASE w.access_dashboard WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_dashboard,
    CASE MAX(CASE w.access_projekte WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_projekte,
    CASE MAX(CASE w.access_rechnungen WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_rechnungen,
    CASE MAX(CASE w.access_bewegungen WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_bewegungen,
    CASE MAX(CASE w.access_lieferanten WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_lieferanten,
    CASE MAX(CASE w.access_mitglieder WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_mitglieder,
    CASE MAX(CASE w.access_einnahmen WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_einnahmen,
    CASE MAX(CASE w.access_konfiguration WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_konfiguration,
    -- Wenn mindestens ein Workspace vollen Rechnungszugriff hat
    BOOL_AND(w.rechnungen_nur_zugewiesene) as rechnungen_nur_zugewiesene,
    BOOL_OR(uw.is_admin) as is_workspace_admin
FROM user_workspaces uw
JOIN workspaces w ON uw.workspace_id = w.id
JOIN auth.users au ON uw.user_id = au.id
WHERE w.is_active = true
GROUP BY uw.user_id, au.email;

-- 7. Admin-Workspace aktualisieren (falls vorhanden)
UPDATE workspaces
SET
    access_dashboard = 'write',
    access_projekte = 'write',
    access_rechnungen = 'write',
    access_bewegungen = 'write',
    access_lieferanten = 'write',
    access_mitglieder = 'write',
    access_einnahmen = 'write',
    access_konfiguration = 'write'
WHERE name = 'Admin';

-- 8. Kommentare
COMMENT ON TYPE permission_level IS 'Berechtigungsstufen: none (kein Zugriff), read (nur lesen), write (lesen+bearbeiten)';
COMMENT ON COLUMN workspaces.access_dashboard IS '3-stufige Berechtigung: none/read/write';

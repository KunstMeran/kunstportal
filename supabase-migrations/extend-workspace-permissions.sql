-- Migration: Erweitertes Berechtigungssystem (4-Stufen: none/read/write/delete)
-- Datum: 2026-08-01
-- Beschreibung: Erweitert die boolean-Felder auf 4-stufige Berechtigungen
--               none = kein Zugriff, read = nur lesen, write = bearbeiten, delete = löschen

-- 1. Zuerst die abhängige View löschen
DROP VIEW IF EXISTS user_permissions;

-- 2. ENUM-Typ erstellen (falls nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
        CREATE TYPE permission_level AS ENUM ('none', 'read', 'write', 'delete');
    END IF;
END $$;

-- 3. Temporäre Spalten mit neuem Typ erstellen
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_dashboard permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_projekte permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_rechnungen permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_bewegungen permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_lieferanten permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_mitglieder permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_einnahmen permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_konfiguration permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_inventar permission_level DEFAULT 'none';
ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS perm_reporting permission_level DEFAULT 'none';

-- 4. Daten migrieren (boolean true -> 'delete' für volle Rechte, false -> 'none')
UPDATE workspaces SET
    perm_dashboard = CASE WHEN access_dashboard = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_projekte = CASE WHEN access_projekte = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_rechnungen = CASE WHEN access_rechnungen = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_bewegungen = CASE WHEN access_bewegungen = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_lieferanten = CASE WHEN access_lieferanten = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_mitglieder = CASE WHEN access_mitglieder = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_einnahmen = CASE WHEN access_einnahmen = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_konfiguration = CASE WHEN access_konfiguration = true THEN 'delete'::permission_level ELSE 'none'::permission_level END,
    perm_inventar = 'none'::permission_level,
    perm_reporting = 'none'::permission_level
WHERE perm_dashboard = 'none' AND access_dashboard IS NOT NULL;

-- 5. Alte boolean-Spalten löschen
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_dashboard;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_projekte;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_rechnungen;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_bewegungen;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_lieferanten;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_mitglieder;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_einnahmen;
ALTER TABLE workspaces DROP COLUMN IF EXISTS access_konfiguration;

-- 6. Neue Spalten umbenennen zu den ursprünglichen Namen
ALTER TABLE workspaces RENAME COLUMN perm_dashboard TO access_dashboard;
ALTER TABLE workspaces RENAME COLUMN perm_projekte TO access_projekte;
ALTER TABLE workspaces RENAME COLUMN perm_rechnungen TO access_rechnungen;
ALTER TABLE workspaces RENAME COLUMN perm_bewegungen TO access_bewegungen;
ALTER TABLE workspaces RENAME COLUMN perm_lieferanten TO access_lieferanten;
ALTER TABLE workspaces RENAME COLUMN perm_mitglieder TO access_mitglieder;
ALTER TABLE workspaces RENAME COLUMN perm_einnahmen TO access_einnahmen;
ALTER TABLE workspaces RENAME COLUMN perm_konfiguration TO access_konfiguration;
ALTER TABLE workspaces RENAME COLUMN perm_inventar TO access_inventar;
ALTER TABLE workspaces RENAME COLUMN perm_reporting TO access_reporting;

-- 7. View für User-Berechtigungen neu erstellen (mit numerischer Aggregation)
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    uw.user_id,
    au.email as user_email,
    -- Aggregierte Berechtigungen über alle Workspaces (höchste Stufe gewinnt)
    -- 0=none, 1=read, 2=write, 3=delete -> MAX nimmt höchsten Wert
    CASE MAX(CASE w.access_dashboard WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_dashboard,
    CASE MAX(CASE w.access_projekte WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_projekte,
    CASE MAX(CASE w.access_rechnungen WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_rechnungen,
    CASE MAX(CASE w.access_bewegungen WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_bewegungen,
    CASE MAX(CASE w.access_lieferanten WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_lieferanten,
    CASE MAX(CASE w.access_mitglieder WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_mitglieder,
    CASE MAX(CASE w.access_einnahmen WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_einnahmen,
    CASE MAX(CASE w.access_konfiguration WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_konfiguration,
    CASE MAX(CASE w.access_inventar WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_inventar,
    CASE MAX(CASE w.access_reporting WHEN 'delete' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 ELSE 0 END)
        WHEN 3 THEN 'delete' WHEN 2 THEN 'write' WHEN 1 THEN 'read' ELSE 'none' END::permission_level as access_reporting,
    -- Wenn mindestens ein Workspace vollen Rechnungszugriff hat
    BOOL_AND(w.rechnungen_nur_zugewiesene) as rechnungen_nur_zugewiesene,
    BOOL_OR(uw.is_admin) as is_workspace_admin
FROM user_workspaces uw
JOIN workspaces w ON uw.workspace_id = w.id
JOIN auth.users au ON uw.user_id = au.id
WHERE w.is_active = true
GROUP BY uw.user_id, au.email;

-- 8. Admin-Workspace aktualisieren (falls vorhanden)
UPDATE workspaces
SET
    access_dashboard = 'delete',
    access_projekte = 'delete',
    access_rechnungen = 'delete',
    access_bewegungen = 'delete',
    access_lieferanten = 'delete',
    access_mitglieder = 'delete',
    access_einnahmen = 'delete',
    access_konfiguration = 'delete',
    access_inventar = 'delete',
    access_reporting = 'delete'
WHERE name = 'Admin';

-- 9. Kommentare
COMMENT ON TYPE permission_level IS 'Berechtigungsstufen: none (kein Zugriff), read (nur lesen), write (bearbeiten), delete (löschen)';
COMMENT ON COLUMN workspaces.access_dashboard IS '4-stufige Berechtigung: none/read/write/delete';
COMMENT ON COLUMN workspaces.access_inventar IS '4-stufige Berechtigung für Inventar: none/read/write/delete';

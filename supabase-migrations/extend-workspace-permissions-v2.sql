-- Migration: Erweitertes Berechtigungssystem (4-Stufen: none/read/write/delete)
-- Version 2: Robuste Version die den aktuellen Zustand erkennt
-- Datum: 2026-08-01

-- 1. Zuerst die abhängige View löschen
DROP VIEW IF EXISTS user_permissions;

-- 2. ENUM-Typ erstellen (falls nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
        CREATE TYPE permission_level AS ENUM ('none', 'read', 'write', 'delete');
    END IF;
END $$;

-- 3. Prüfen ob wir boolean oder schon permission_level haben und entsprechend handeln
DO $$
DECLARE
    col_type text;
BEGIN
    -- Prüfe den Typ von access_dashboard (falls vorhanden)
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'access_dashboard';

    IF col_type = 'boolean' THEN
        -- Alte boolean-Spalten -> Migration durchführen
        RAISE NOTICE 'Boolean-Spalten gefunden - führe Migration durch';

        -- Temporäre Spalten erstellen
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_dashboard permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_projekte permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_rechnungen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_bewegungen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_lieferanten permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_mitglieder permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_einnahmen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_konfiguration permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_inventar permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS perm_reporting permission_level DEFAULT 'none';

        -- Daten migrieren
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
            perm_reporting = 'none'::permission_level;

        -- Alte Spalten löschen
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_dashboard;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_projekte;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_rechnungen;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_bewegungen;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_lieferanten;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_mitglieder;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_einnahmen;
        ALTER TABLE workspaces DROP COLUMN IF EXISTS access_konfiguration;

        -- Umbenennen
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

    ELSIF col_type = 'USER-DEFINED' THEN
        -- Bereits permission_level - nur sicherstellen dass inventar und reporting existieren
        RAISE NOTICE 'Permission_level Spalten bereits vorhanden';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_inventar permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_reporting permission_level DEFAULT 'none';

    ELSE
        -- Spalte existiert nicht - alle neu erstellen
        RAISE NOTICE 'Keine access_dashboard Spalte gefunden - erstelle alle neu';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_dashboard permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_projekte permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_rechnungen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_bewegungen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_lieferanten permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_mitglieder permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_einnahmen permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_konfiguration permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_inventar permission_level DEFAULT 'none';
        ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS access_reporting permission_level DEFAULT 'none';
    END IF;
END $$;

-- 4. Aufräumen: Falls noch perm_* Spalten existieren, diese umbenennen
DO $$
BEGIN
    -- Falls perm_inventar existiert aber access_inventar nicht
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'perm_inventar') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'access_inventar') THEN
            ALTER TABLE workspaces RENAME COLUMN perm_inventar TO access_inventar;
        ELSE
            ALTER TABLE workspaces DROP COLUMN perm_inventar;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'perm_reporting') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'access_reporting') THEN
            ALTER TABLE workspaces RENAME COLUMN perm_reporting TO access_reporting;
        ELSE
            ALTER TABLE workspaces DROP COLUMN perm_reporting;
        END IF;
    END IF;
END $$;

-- 5. View für User-Berechtigungen erstellen
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    uw.user_id,
    au.email as user_email,
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
    BOOL_AND(w.rechnungen_nur_zugewiesene) as rechnungen_nur_zugewiesene,
    BOOL_OR(uw.is_admin) as is_workspace_admin
FROM user_workspaces uw
JOIN workspaces w ON uw.workspace_id = w.id
JOIN auth.users au ON uw.user_id = au.id
WHERE w.is_active = true
GROUP BY uw.user_id, au.email;

-- 6. Admin-Workspace aktualisieren
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

-- 7. Kommentare
COMMENT ON TYPE permission_level IS 'Berechtigungsstufen: none (kein Zugriff), read (nur lesen), write (bearbeiten), delete (löschen)';

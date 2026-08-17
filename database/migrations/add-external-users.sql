-- =====================================================
-- Migration: Externe Mitarbeiter & Zeiterfassung-Berechtigung
-- Datum: 2026-08-13
-- Zweck: user_type Feld fuer interne/externe Mitarbeiter
--        access_zeiterfassung fuer eigene Berechtigung
-- =====================================================

-- 1. user_type Feld zur users Tabelle hinzufuegen
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'intern';

COMMENT ON COLUMN users.user_type IS 'Mitarbeitertyp: intern oder extern';

-- Index fuer schnellere Filterung
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 2. access_zeiterfassung Feld zur workspaces Tabelle hinzufuegen
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS access_zeiterfassung TEXT DEFAULT 'none';

COMMENT ON COLUMN workspaces.access_zeiterfassung IS 'Berechtigung fuer Zeiterfassung: none, read, write, delete';

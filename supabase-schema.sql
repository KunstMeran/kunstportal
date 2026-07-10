-- Supabase Schema für Projektsoftware Kunst Meran
-- Erstellt: 2026-07-10

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Tabelle
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Mitarbeiter')),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects Tabelle
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Planung', 'Laufend', 'Abgeschlossen')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Positionen Tabelle
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Personal', 'Material', 'Dienstleistungen', 'Reise', 'Sonstiges')),
    description TEXT,
    planned_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kosten Tabelle
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Personal', 'Material', 'Dienstleistungen', 'Reise', 'Sonstiges')),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    cost_type VARCHAR(50) NOT NULL CHECK (cost_type IN ('IST', 'Provisorisch')),
    date DATE NOT NULL,
    supplier VARCHAR(255),
    invoice_number VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finanzierungsquellen Tabelle
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Zugesagt', 'Beantragt', 'Offen')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für bessere Performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_budget_items_project ON budget_items(project_id);
CREATE INDEX idx_costs_project ON costs(project_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_funding_sources_project ON funding_sources(project_id);

-- Row Level Security (RLS) aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies für Users
CREATE POLICY "Users können ihr eigenes Profil sehen"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins können alle User sehen"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- RLS Policies für Projects
CREATE POLICY "Alle eingeloggten User können Projekte sehen"
    ON projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Projekte erstellen"
    ON projects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

CREATE POLICY "Admins können Projekte updaten"
    ON projects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

CREATE POLICY "Admins können Projekte löschen"
    ON projects FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- RLS Policies für Budget Items
CREATE POLICY "Alle eingeloggten User können Budget Items sehen"
    ON budget_items FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Budget Items verwalten"
    ON budget_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- RLS Policies für Costs
CREATE POLICY "Alle eingeloggten User können Kosten sehen"
    ON costs FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Alle eingeloggten User können Kosten erstellen"
    ON costs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Kosten verwalten"
    ON costs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- RLS Policies für Funding Sources
CREATE POLICY "Alle eingeloggten User können Finanzierungsquellen sehen"
    ON funding_sources FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Finanzierungsquellen verwalten"
    ON funding_sources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_costs_updated_at BEFORE UPDATE ON costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_sources_updated_at BEFORE UPDATE ON funding_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Standard Admin User erstellen (Passwort muss geändert werden!)
-- Hinweis: Passwort-Hash muss mit Supabase Auth erstellt werden
-- Dieser Eintrag ist nur ein Platzhalter
INSERT INTO users (username, password_hash, role, email) VALUES
    ('Admin', 'PLACEHOLDER_HASH', 'Admin', 'admin@kunstmeran.com');

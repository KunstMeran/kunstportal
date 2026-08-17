/**
 * MIGRATION SCRIPT: localStorage → Supabase
 * Projektsoftware Kunst Meran
 *
 * Dieses Script migriert alle Daten von localStorage zu Supabase
 */

const DataMigration = {
    /**
     * Haupt-Migration durchführen
     */
    async migrate() {
        console.log('🚀 Starte Daten-Migration zu Supabase...');

        try {
            // 1. Projekte migrieren
            await this.migrateProjects();

            // 2. Budget Items migrieren
            await this.migrateBudgetItems();

            // 3. Kosten migrieren
            await this.migrateCosts();

            // 4. Einnahmen migrieren
            await this.migrateEinnahmen();

            console.log('✅ Migration erfolgreich abgeschlossen!');
            return true;
        } catch (error) {
            console.error('❌ Migrations-Fehler:', error);
            return false;
        }
    },

    /**
     * Projekte migrieren
     */
    async migrateProjects() {
        console.log('📁 Migriere Projekte...');

        const projects = DataManager.getProjects();
        console.log(`   Gefunden: ${projects.length} Projekte`);

        for (const project of projects) {
            try {
                // Prüfen ob Projekt schon existiert
                const existing = await SupabaseService.client
                    .from('projects')
                    .select('id')
                    .eq('id', project.id)
                    .single();

                if (existing.data) {
                    console.log(`   ⏭️  Projekt "${project.name}" existiert bereits`);
                    continue;
                }

                // Projekt-Daten für Supabase vorbereiten
                const projectData = {
                    name: project.name,
                    description: project.description || '',
                    location: project.location || '',
                    start_date: project.startDate || null,
                    end_date: project.endDate || null,
                    status: this.mapProjectStatus(project.status),
                    created_by: null // Wird durch RLS automatisch gesetzt
                };

                const { data, error } = await SupabaseService.client
                    .from('projects')
                    .insert([projectData])
                    .select()
                    .single();

                if (error) throw error;

                console.log(`   ✅ Projekt "${project.name}" migriert (ID: ${data.id})`);

                // Alte ID → Neue ID Mapping speichern für später
                if (!this.idMapping) this.idMapping = {};
                if (!this.idMapping.projects) this.idMapping.projects = {};
                this.idMapping.projects[project.id] = data.id;

            } catch (error) {
                console.error(`   ❌ Fehler bei Projekt "${project.name}":`, error.message);
            }
        }

        console.log('✅ Projekte migriert');
    },

    /**
     * Budget Items migrieren
     */
    async migrateBudgetItems() {
        console.log('💰 Migriere Budget Items...');

        const budgets = DataManager.load(DataManager.KEYS.BUDGETS) || [];
        console.log(`   Gefunden: ${budgets.length} Budget Items`);

        for (const budget of budgets) {
            try {
                // Neue Projekt-ID aus Mapping holen
                const newProjectId = this.idMapping?.projects?.[budget.projectId];

                if (!newProjectId) {
                    console.log(`   ⚠️  Budget-Item übersprungen (Projekt nicht gefunden)`);
                    continue;
                }

                const budgetData = {
                    project_id: newProjectId,
                    category: this.mapCategory(budget.category),
                    description: budget.description || '',
                    planned_amount: parseFloat(budget.amount) || 0
                };

                const { error } = await SupabaseService.client
                    .from('budget_items')
                    .insert([budgetData]);

                if (error) throw error;

                console.log(`   ✅ Budget-Item migriert`);

            } catch (error) {
                console.error(`   ❌ Fehler bei Budget-Item:`, error.message);
            }
        }

        console.log('✅ Budget Items migriert');
    },

    /**
     * Kosten migrieren
     */
    async migrateCosts() {
        console.log('💸 Migriere Kosten...');

        const costs = DataManager.getCosts();
        console.log(`   Gefunden: ${costs.length} Kosten`);

        for (const cost of costs) {
            try {
                // Neue Projekt-ID aus Mapping holen
                const newProjectId = this.idMapping?.projects?.[cost.projectId];

                if (!newProjectId) {
                    console.log(`   ⚠️  Kosten übersprungen (Projekt nicht gefunden)`);
                    continue;
                }

                const costData = {
                    project_id: newProjectId,
                    category: this.mapCategory(cost.category),
                    description: cost.description || cost.supplier || 'Kosten',
                    amount: parseFloat(cost.amount) || 0,
                    cost_type: cost.type === 'effektiv' ? 'IST' : 'Provisorisch',
                    date: cost.date || new Date().toISOString().split('T')[0],
                    supplier: cost.supplier || null,
                    invoice_number: cost.invoiceNumber || null
                };

                const { error } = await SupabaseService.client
                    .from('costs')
                    .insert([costData]);

                if (error) throw error;

                console.log(`   ✅ Kosten migriert`);

            } catch (error) {
                console.error(`   ❌ Fehler bei Kosten:`, error.message);
            }
        }

        console.log('✅ Kosten migriert');
    },

    /**
     * Einnahmen migrieren
     */
    async migrateEinnahmen() {
        console.log('💵 Migriere Einnahmen...');

        const einnahmen = DataManager.load(DataManager.KEYS.EINNAHMEN) || [];
        console.log(`   Gefunden: ${einnahmen.length} Einnahmen`);

        for (const einnahme of einnahmen) {
            try {
                // Neue Projekt-ID aus Mapping holen
                const newProjectId = this.idMapping?.projects?.[einnahme.projektId];

                if (!newProjectId) {
                    console.log(`   ⚠️  Einnahme übersprungen (Projekt nicht gefunden)`);
                    continue;
                }

                const fundingData = {
                    project_id: newProjectId,
                    source_name: einnahme.quelle || einnahme.beschreibung || 'Unbekannt',
                    amount: parseFloat(einnahme.betrag) || 0,
                    status: this.mapEinnahmeStatus(einnahme.status)
                };

                const { error } = await SupabaseService.client
                    .from('funding_sources')
                    .insert([fundingData]);

                if (error) throw error;

                console.log(`   ✅ Einnahme migriert`);

            } catch (error) {
                console.error(`   ❌ Fehler bei Einnahme:`, error.message);
            }
        }

        console.log('✅ Einnahmen migriert');
    },

    /**
     * Helper: Projekt-Status mappen
     */
    mapProjectStatus(status) {
        const statusMap = {
            'planung': 'Planung',
            'laufend': 'Laufend',
            'abgeschlossen': 'Abgeschlossen',
            'archiviert': 'Abgeschlossen'
        };
        return statusMap[status?.toLowerCase()] || 'Laufend';
    },

    /**
     * Helper: Kategorie mappen
     */
    mapCategory(category) {
        const categoryMap = {
            'personal': 'Personal',
            'material': 'Material',
            'dienstleistungen': 'Dienstleistungen',
            'reise': 'Reise',
            'sonstiges': 'Sonstiges'
        };
        return categoryMap[category?.toLowerCase()] || 'Sonstiges';
    },

    /**
     * Helper: Einnahme-Status mappen
     */
    mapEinnahmeStatus(status) {
        const statusMap = {
            'zugesagt': 'Zugesagt',
            'beantragt': 'Beantragt',
            'offen': 'Offen',
            'erhalten': 'Zugesagt'
        };
        return statusMap[status?.toLowerCase()] || 'Offen';
    },

    /**
     * Backup vor Migration erstellen
     */
    createBackup() {
        console.log('💾 Erstelle Backup...');

        const backup = {
            timestamp: new Date().toISOString(),
            projects: DataManager.getProjects(),
            budgets: DataManager.load(DataManager.KEYS.BUDGETS),
            costs: DataManager.getCosts(),
            einnahmen: DataManager.load(DataManager.KEYS.EINNAHMEN),
            users: DataManager.load(DataManager.KEYS.USERS)
        };

        // Als JSON herunterladen
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${Date.now()}.json`;
        a.click();

        console.log('✅ Backup erstellt und heruntergeladen');
        return backup;
    },

    /**
     * Test-Migration (Dry Run)
     */
    async testMigration() {
        console.log('🧪 Teste Migration (Dry Run)...');
        console.log('Projekte:', DataManager.getProjects().length);
        console.log('Budgets:', (DataManager.load(DataManager.KEYS.BUDGETS) || []).length);
        console.log('Kosten:', DataManager.getCosts().length);
        console.log('Einnahmen:', (DataManager.load(DataManager.KEYS.EINNAHMEN) || []).length);
    }
};

// Globale Funktion für einfachen Aufruf
window.migrateToSupabase = () => DataMigration.migrate();
window.backupData = () => DataMigration.createBackup();
window.testMigration = () => DataMigration.testMigration();

console.log('📦 Migration-Script geladen!');
console.log('Verfügbare Befehle:');
console.log('  - testMigration()     → Zeigt was migriert werden würde');
console.log('  - backupData()        → Erstellt Backup vor Migration');
console.log('  - migrateToSupabase() → Startet die Migration');

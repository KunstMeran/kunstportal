/**
 * SUPABASE DATA ADAPTER
 * Überschreibt DataManager-Funktionen für Supabase
 * Projektsoftware Kunst Meran
 */

const SupabaseDataAdapter = {
    /**
     * DataManager mit Supabase-Funktionen erweitern
     */
    init: function() {
        if (!Config.features.useSupabase) {
            console.log('Supabase deaktiviert - nutze localStorage');
            return;
        }

        console.log('🔄 Aktiviere Supabase Data Adapter...');

        // Projekte-Funktionen überschreiben
        DataManager._getProjectsOriginal = DataManager.getProjects;
        DataManager.getProjects = this.getProjects.bind(this);

        DataManager._getProjectByIdOriginal = DataManager.getProjectById;
        DataManager.getProjectById = this.getProjectById.bind(this);

        DataManager._addProjectOriginal = DataManager.addProject;
        DataManager.addProject = this.addProject.bind(this);

        DataManager._updateProjectOriginal = DataManager.updateProject;
        DataManager.updateProject = this.updateProject.bind(this);

        DataManager._deleteProjectOriginal = DataManager.deleteProject;
        DataManager.deleteProject = this.deleteProject.bind(this);

        // Kosten-Funktionen überschreiben
        DataManager._getCostsOriginal = DataManager.getCosts;
        DataManager.getCosts = this.getCosts.bind(this);

        DataManager._getCostsByProjectOriginal = DataManager.getCostsByProject;
        DataManager.getCostsByProject = this.getCostsByProject.bind(this);

        DataManager._addCostOriginal = DataManager.addCost;
        DataManager.addCost = this.addCost.bind(this);

        DataManager._updateCostOriginal = DataManager.updateCost;
        DataManager.updateCost = this.updateCost.bind(this);

        DataManager._deleteCostOriginal = DataManager.deleteCost;
        DataManager.deleteCost = this.deleteCost.bind(this);

        console.log('✅ Supabase Data Adapter aktiviert');
    },

    /**
     * PROJEKT-FUNKTIONEN
     */

    async getProjects() {
        try {
            const { data, error } = await SupabaseService.client
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Supabase-Format zu lokalem Format konvertieren
            return data.map(p => this.convertProjectFromSupabase(p));
        } catch (error) {
            console.error('Fehler beim Laden der Projekte:', error);
            // Fallback zu localStorage
            return DataManager._getProjectsOriginal();
        }
    },

    async getProjectById(projectId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (error) throw error;

            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Laden des Projekts:', error);
            return DataManager._getProjectByIdOriginal(projectId);
        }
    },

    async addProject(projectData) {
        try {
            const supabaseProject = {
                name: projectData.name,
                description: projectData.description || '',
                location: projectData.location || '',
                start_date: projectData.startDate || null,
                end_date: projectData.endDate || null,
                status: this.mapStatusToSupabase(projectData.status),
                datev_id: projectData.datevId || null
            };

            const { data, error } = await SupabaseService.client
                .from('projects')
                .insert([supabaseProject])
                .select()
                .single();

            if (error) throw error;

            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Erstellen des Projekts:', error);
            return DataManager._addProjectOriginal(projectData);
        }
    },

    async updateProject(projectId, updates) {
        try {
            const supabaseUpdates = {
                name: updates.name,
                description: updates.description,
                location: updates.location,
                start_date: updates.startDate,
                end_date: updates.endDate,
                status: this.mapStatusToSupabase(updates.status),
                datev_id: updates.datevId || null
            };

            const { data, error } = await SupabaseService.client
                .from('projects')
                .update(supabaseUpdates)
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;

            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Projekts:', error);
            return DataManager._updateProjectOriginal(projectId, updates);
        }
    },

    async deleteProject(projectId) {
        try {
            const { error } = await SupabaseService.client
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Projekts:', error);
            return DataManager._deleteProjectOriginal(projectId);
        }
    },

    /**
     * KOSTEN-FUNKTIONEN
     */

    async getCosts() {
        try {
            const { data, error } = await SupabaseService.client
                .from('costs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            return data.map(c => this.convertCostFromSupabase(c));
        } catch (error) {
            console.error('Fehler beim Laden der Kosten:', error);
            // Erstmal leeres Array (Kosten noch nicht migriert)
            return [];
        }
    },

    async getCostsByProject(projectId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('costs')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) throw error;

            return data.map(c => this.convertCostFromSupabase(c));
        } catch (error) {
            console.error('Fehler beim Laden der Kosten:', error);
            // Erstmal leeres Array zurückgeben (Kosten sind noch nicht migriert)
            return [];
        }
    },

    async addCost(costData) {
        try {
            const supabaseCost = {
                project_id: costData.projectId,
                category: this.mapCategoryToSupabase(costData.category),
                description: costData.description || costData.supplier || 'Kosten',
                amount: parseFloat(costData.amount) || 0,
                cost_type: costData.type === 'effektiv' ? 'IST' : 'Provisorisch',
                date: costData.date || new Date().toISOString().split('T')[0],
                supplier: costData.supplier || null,
                invoice_number: costData.invoiceNumber || null,
                file_path: costData.filePath || null
            };

            const { data, error } = await SupabaseService.client
                .from('costs')
                .insert([supabaseCost])
                .select()
                .single();

            if (error) throw error;

            return this.convertCostFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Erstellen der Kosten:', error);
            return DataManager._addCostOriginal(costData);
        }
    },

    async updateCost(costId, updates) {
        try {
            const supabaseUpdates = {
                category: this.mapCategoryToSupabase(updates.category),
                description: updates.description,
                amount: parseFloat(updates.amount),
                cost_type: updates.type === 'effektiv' ? 'IST' : 'Provisorisch',
                date: updates.date,
                supplier: updates.supplier,
                invoice_number: updates.invoiceNumber,
                file_path: updates.filePath !== undefined ? updates.filePath : undefined
            };

            // undefined Werte entfernen (damit sie nicht als null gespeichert werden)
            Object.keys(supabaseUpdates).forEach(key =>
                supabaseUpdates[key] === undefined && delete supabaseUpdates[key]
            );

            const { data, error } = await SupabaseService.client
                .from('costs')
                .update(supabaseUpdates)
                .eq('id', costId)
                .select()
                .single();

            if (error) throw error;

            return this.convertCostFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Kosten:', error);
            return DataManager._updateCostOriginal(costId, updates);
        }
    },

    async deleteCost(costId) {
        try {
            const { error } = await SupabaseService.client
                .from('costs')
                .delete()
                .eq('id', costId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen der Kosten:', error);
            return DataManager._deleteCostOriginal(costId);
        }
    },

    /**
     * HELPER-FUNKTIONEN: Datenkonvertierung
     */

    convertProjectFromSupabase(supabaseProject) {
        return {
            id: supabaseProject.id,
            name: supabaseProject.name,
            description: supabaseProject.description || '',
            location: supabaseProject.location || '',
            startDate: supabaseProject.start_date,
            endDate: supabaseProject.end_date,
            status: this.mapStatusFromSupabase(supabaseProject.status),
            datevId: supabaseProject.datev_id || '',
            budget: 0, // Wird später berechnet
            createdBy: supabaseProject.created_by,
            createdAt: supabaseProject.created_at
        };
    },

    convertCostFromSupabase(supabaseCost) {
        return {
            id: supabaseCost.id,
            projectId: supabaseCost.project_id,
            category: this.mapCategoryFromSupabase(supabaseCost.category),
            description: supabaseCost.description,
            amount: parseFloat(supabaseCost.amount),
            type: supabaseCost.cost_type === 'IST' ? 'effektiv' : 'provisorisch',
            date: supabaseCost.date,
            supplier: supabaseCost.supplier,
            invoiceNumber: supabaseCost.invoice_number,
            filePath: supabaseCost.file_path,
            createdAt: supabaseCost.created_at
        };
    },

    mapStatusToSupabase(status) {
        const statusMap = {
            'planung': 'Planung',
            'laufend': 'Laufend',
            'abgeschlossen': 'Abgeschlossen'
        };
        return statusMap[status?.toLowerCase()] || 'Laufend';
    },

    mapStatusFromSupabase(status) {
        return status?.toLowerCase() || 'laufend';
    },

    mapCategoryToSupabase(category) {
        const categoryMap = {
            'personal': 'Personal',
            'material': 'Material',
            'dienstleistungen': 'Dienstleistungen',
            'reise': 'Reise',
            'sonstiges': 'Sonstiges'
        };
        return categoryMap[category?.toLowerCase()] || 'Sonstiges';
    },

    mapCategoryFromSupabase(category) {
        return category?.toLowerCase() || 'sonstiges';
    }
};

// Automatisch initialisieren wenn Supabase aktiviert ist
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (Config.features.useSupabase) {
            SupabaseDataAdapter.init();
        }
    });
}

console.log('📦 Supabase Data Adapter geladen');

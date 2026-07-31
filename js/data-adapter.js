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

        // Rechnungs-Funktionen überschreiben
        DataManager.addInvoice = this.addInvoice.bind(this);
        DataManager.updateInvoiceStatus = this.updateInvoiceStatus.bind(this);
        DataManager.updateInvoiceKostentyp = this.updateInvoiceKostentyp.bind(this);
        DataManager.getInvoices = this.getInvoices.bind(this);

        // getRechnungenMitStatus überschreiben (kombiniert DATEV + Supabase)
        DataManager._getRechnungenMitStatusOriginal = DataManager.getRechnungenMitStatus;
        DataManager.getRechnungenMitStatus = this.getRechnungenMitStatus.bind(this);

        // Lieferanten-Funktionen überschreiben
        DataManager._getDatevLieferantenOriginal = DataManager.getDatevLieferanten;
        DataManager.getDatevLieferanten = this.getSuppliers.bind(this);

        // Zeiterfassungs-Funktionen überschreiben
        DataManager._getTimeEntriesOriginal = DataManager.getTimeEntries;
        DataManager.getTimeEntries = this.getTimeEntries.bind(this);

        DataManager._getTimeEntriesByProjectOriginal = DataManager.getTimeEntriesByProject;
        DataManager.getTimeEntriesByProject = this.getTimeEntriesByProject.bind(this);

        DataManager._addTimeEntryOriginal = DataManager.addTimeEntry;
        DataManager.addTimeEntry = this.addTimeEntry.bind(this);

        DataManager._updateTimeEntryOriginal = DataManager.updateTimeEntry;
        DataManager.updateTimeEntry = this.updateTimeEntry.bind(this);

        DataManager._deleteTimeEntryOriginal = DataManager.deleteTimeEntry;
        DataManager.deleteTimeEntry = this.deleteTimeEntry.bind(this);

        DataManager._getProjectTotalHoursOriginal = DataManager.getProjectTotalHours;
        DataManager.getProjectTotalHours = this.getProjectTotalHours.bind(this);

        // Kostentypen-Funktionen überschreiben
        DataManager._getCostTypesOriginal = DataManager.getCostTypes;
        DataManager.getCostTypes = this.getCostTypes.bind(this);

        DataManager._getActiveCostTypesOriginal = DataManager.getActiveCostTypes;
        DataManager.getActiveCostTypes = this.getActiveCostTypes.bind(this);

        DataManager._addCostTypeOriginal = DataManager.addCostType;
        DataManager.addCostType = this.addCostType.bind(this);

        DataManager._updateCostTypeOriginal = DataManager.updateCostType;
        DataManager.updateCostType = this.updateCostType.bind(this);

        DataManager._deleteCostTypeOriginal = DataManager.deleteCostType;
        DataManager.deleteCostType = this.deleteCostType.bind(this);

        // User-Funktionen überschreiben
        DataManager._getUsersOriginal = DataManager.getUsers;
        DataManager.getUsers = this.getUsers.bind(this);

        DataManager._getUserByIdOriginal = DataManager.getUserById;
        DataManager.getUserById = this.getUserById.bind(this);

        DataManager._updateUserOriginal = DataManager.updateUser;
        DataManager.updateUser = this.updateUser.bind(this);

        // Cache für Kostentypen initialisieren
        this.costTypesCache = null;
        this.loadCostTypesFromSupabase();

        // Cache für User initialisieren
        this.usersCache = null;
        this.loadUsersFromSupabase();

        // Einnahmeplanung / Funding Sources Funktionen
        DataManager.getFundingSources = this.getFundingSources.bind(this);
        DataManager.getFundingSourceById = this.getFundingSourceById.bind(this);
        DataManager.addFundingSource = this.addFundingSource.bind(this);
        DataManager.updateFundingSource = this.updateFundingSource.bind(this);
        DataManager.deleteFundingSource = this.deleteFundingSource.bind(this);
        DataManager.getActiveAbgabestellen = this.getActiveAbgabestellen.bind(this);
        DataManager.getFundingSourceExpenses = this.getFundingSourceExpenses.bind(this);
        DataManager.updateInvoiceFundingSource = this.updateInvoiceFundingSource.bind(this);

        // Cache für Funding Sources
        this.fundingSourcesCache = null;

        // Mitglieder-Funktionen
        DataManager.getMembers = this.getMembers.bind(this);
        DataManager.getMemberById = this.getMemberById.bind(this);
        DataManager.addMember = this.addMember.bind(this);
        DataManager.updateMember = this.updateMember.bind(this);
        DataManager.deleteMember = this.deleteMember.bind(this);
        DataManager.importMembers = this.importMembers.bind(this);
        DataManager.getMemberPayments = this.getMemberPayments.bind(this);
        DataManager.getMemberPaymentsByYear = this.getMemberPaymentsByYear.bind(this);
        DataManager.addMemberPayment = this.addMemberPayment.bind(this);
        DataManager.deleteMemberPayment = this.deleteMemberPayment.bind(this);
        DataManager.getDatevBuchungenForKonto = this.getDatevBuchungenForKonto.bind(this);

        // Workspace-Funktionen
        DataManager.getWorkspaces = this.getWorkspaces.bind(this);
        DataManager.getWorkspaceById = this.getWorkspaceById.bind(this);
        DataManager.addWorkspace = this.addWorkspace.bind(this);
        DataManager.updateWorkspace = this.updateWorkspace.bind(this);
        DataManager.deleteWorkspace = this.deleteWorkspace.bind(this);
        DataManager.getUserWorkspaces = this.getUserWorkspaces.bind(this);
        DataManager.addUserToWorkspace = this.addUserToWorkspace.bind(this);
        DataManager.removeUserFromWorkspace = this.removeUserFromWorkspace.bind(this);
        DataManager.getCurrentUserPermissions = this.getCurrentUserPermissions.bind(this);
        DataManager.getAllAuthUsers = this.getAllAuthUsers.bind(this);

        // Cache für Berechtigungen
        this.permissionsCache = null;

        // Budgetplanung-Funktionen
        DataManager.getBudgetEntries = this.getBudgetEntries.bind(this);
        DataManager.getBudgetEntryById = this.getBudgetEntryById.bind(this);
        DataManager.addBudgetEntry = this.addBudgetEntry.bind(this);
        DataManager.updateBudgetEntry = this.updateBudgetEntry.bind(this);
        DataManager.deleteBudgetEntry = this.deleteBudgetEntry.bind(this);
        DataManager.getBudgetNotes = this.getBudgetNotes.bind(this);
        DataManager.saveBudgetNotes = this.saveBudgetNotes.bind(this);

        // DATEV-Buchungen aus Supabase laden statt aus JSON-Datei
        DataManager._loadBuchungenJSONOriginal = DataManager.loadBuchungenJSON;
        DataManager.loadBuchungenJSON = this.loadBuchungenFromSupabase.bind(this);

        DataManager._getDatevBuchungenOriginal = DataManager.getDatevBuchungen;
        DataManager.getDatevBuchungen = this.getDatevBuchungenFromCache.bind(this);

        // Cache für DATEV-Buchungen
        this.datevBuchungenCache = [];

        console.log('✅ Supabase Data Adapter aktiviert');
    },

    /**
     * DATEV-Buchungen aus Supabase laden
     * Ersetzt loadBuchungenJSON() - lädt aus datev_bookings Tabelle
     * Reichert Buchungen mit Lieferantennamen aus suppliers-Tabelle an
     */
    async loadBuchungenFromSupabase(jahr = null) {
        try {
            console.log('📤 Lade DATEV-Buchungen aus Supabase...');

            // Buchungen und Lieferanten parallel laden
            // Filter: Nur nicht-archivierte Buchungen laden
            const [bookingsResult, suppliersResult] = await Promise.all([
                SupabaseService.client
                    .from('datev_bookings')
                    .select('*')
                    .or('archived.is.null,archived.eq.false')
                    .order('datum', { ascending: false }),
                SupabaseService.client
                    .from('suppliers')
                    .select('partita_iva, fornitore_name')
            ]);

            if (bookingsResult.error) throw bookingsResult.error;

            // Lieferanten-Map erstellen für schnellen Lookup
            const supplierMap = new Map();
            if (suppliersResult.data) {
                suppliersResult.data.forEach(s => {
                    if (s.partita_iva && s.fornitore_name) {
                        supplierMap.set(s.partita_iva, s.fornitore_name);
                    }
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Namen-Lookup geladen`);

            // Konvertieren zu lokalem Format mit Lieferantennamen-Anreicherung
            this.datevBuchungenCache = (bookingsResult.data || []).map(b => {
                // Lieferantenname: Aus Buchung oder aus suppliers-Tabelle
                let fornitoreName = b.fornitore_name || '';
                if ((!fornitoreName || fornitoreName === 'Unbekannt') && b.partita_iva) {
                    const supplierName = supplierMap.get(b.partita_iva);
                    if (supplierName) {
                        fornitoreName = supplierName;
                    }
                }

                // Fallback: Lieferantenname aus Beschreibung extrahieren
                // Format: "Name - Beschreibung" oder "Name vom Datum"
                if (!fornitoreName && b.beschreibung) {
                    const beschreibung = b.beschreibung.trim();
                    // Trenne bei " - " oder " vom "
                    const separators = [' - ', ' vom '];
                    for (const sep of separators) {
                        if (beschreibung.includes(sep)) {
                            fornitoreName = beschreibung.split(sep)[0].trim();
                            break;
                        }
                    }
                    // Falls kein Separator, nimm die ganze Beschreibung
                    if (!fornitoreName) {
                        fornitoreName = beschreibung;
                    }
                }

                return {
                    id: b.id,
                    partitaIva: b.partita_iva || '',
                    partitaIvaCliente: b.partita_iva_cliente || '',
                    fornitoreNr: b.fornitore_nr || '',
                    fornitoreName: fornitoreName,
                    dokumentNr: b.dokument_nr || '',
                    dokumentTyp: b.dokument_typ || 'F',
                    istGutschrift: b.ist_gutschrift || false,
                    betrag: parseFloat(b.betrag) || 0,
                    betragNetto: parseFloat(b.betrag_netto) || 0,
                    betragMwst: parseFloat(b.betrag_mwst) || 0,
                    betragGesamt: parseFloat(b.betrag_gesamt) || 0,
                    mwstTyp: b.mwst_typ || null,
                    datum: b.datum,
                    projektId: b.projekt_id || null,
                    beschreibung: b.beschreibung || '',
                    kategorie: b.kategorie || '',
                    konto: b.konto_nr || null,
                    // Status-Felder aus Supabase
                    workflowStatus: b.workflow_status || 'neu',
                    kontrolliertAm: b.kontrolled_at || null,
                    kontrolliertVon: b.kontrolled_by || null,
                    bezahltAm: b.paid_at || null,
                    bezahltVon: b.paid_by || null,
                    abgabestelle: b.abgabestelle || null,
                    abgabestelleAm: b.abgabestelle_am || null,
                    // Supabase-spezifisch
                    rechnungId: `${b.partita_iva || ''}_${b.dokument_nr || ''}`,
                    importYear: b.import_year,
                    linkedInvoiceId: b.linked_invoice_id
                };
            });

            console.log(`✅ ${this.datevBuchungenCache.length} DATEV-Buchungen aus Supabase geladen`);

            // Für Kompatibilität: Auch in localStorage speichern
            const compatData = {
                buchungen: this.datevBuchungenCache,
                lieferanten: [],
                projekte: {},
                lastUpdate: new Date().toISOString()
            };
            DataManager.save(DataManager.KEYS.DATEV_BUCHUNGEN, compatData);

            return compatData;

        } catch (error) {
            console.error('Fehler beim Laden der DATEV-Buchungen aus Supabase:', error);
            // Fallback auf localStorage
            return DataManager._loadBuchungenJSONOriginal ? DataManager._loadBuchungenJSONOriginal(jahr) : null;
        }
    },

    /**
     * DATEV-Buchungen aus Cache abrufen
     */
    getDatevBuchungenFromCache() {
        // Wenn Cache leer, versuche aus localStorage
        if (this.datevBuchungenCache.length === 0) {
            const data = DataManager.load(DataManager.KEYS.DATEV_BUCHUNGEN);
            if (data && data.buchungen) {
                this.datevBuchungenCache = data.buchungen;
            }
        }
        return this.datevBuchungenCache;
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
                datev_id: projectData.datevId || null,
                budget: projectData.budget || 0,
                pl1: projectData.pl1 || null,
                pl2: projectData.pl2 || null,
                dropbox_link: projectData.dropboxLink || null
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
                datev_id: updates.datevId || null,
                budget: updates.budget || 0,
                pl1: updates.pl1 || null,
                pl2: updates.pl2 || null,
                dropbox_link: updates.dropboxLink || null
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
            budget: supabaseProject.budget || 0,
            pl1: supabaseProject.pl1 || '',
            pl2: supabaseProject.pl2 || '',
            dropboxLink: supabaseProject.dropbox_link || '',
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
    },

    /**
     * RECHNUNGS-FUNKTIONEN
     */

    async addInvoice(invoiceData) {
        try {
            const supabaseInvoice = {
                file_name: invoiceData.fileName,
                file_path: invoiceData.filePath,
                file_size: invoiceData.fileSize,
                partita_iva: invoiceData.partitaIva,
                invoice_number: invoiceData.invoiceNumber,
                status: invoiceData.status || 'uploaded',
                datev_buchung_id: invoiceData.datevBuchungId || null,
                uploaded_by: (await SupabaseService.client.auth.getUser()).data.user?.id
            };

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .insert([supabaseInvoice])
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Erstellen der Rechnung:', error);
            throw error;
        }
    },

    async updateInvoiceStatus(invoiceId, newStatus) {
        try {
            const currentUser = (await SupabaseService.client.auth.getUser()).data.user;
            const now = new Date().toISOString();

            const updates = {
                status: newStatus
            };

            // Je nach Status zusätzliche Felder setzen
            if (newStatus === 'kontrolliert') {
                updates.kontrolled_by = currentUser?.id;
                updates.kontrolled_at = now;
            } else if (newStatus === 'bezahlt') {
                updates.paid_by = currentUser?.id;
                updates.paid_at = now;
            }

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update(updates)
                .eq('id', invoiceId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Rechnungsstatus:', error);
            throw error;
        }
    },

    async updateInvoiceKostentyp(invoiceId, kostentyp) {
        try {
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({ kostentyp: kostentyp })
                .eq('id', invoiceId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Kostentyps:', error);
            throw error;
        }
    },

    async getInvoices() {
        try {
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Rechnungen:', error);
            return [];
        }
    },

    /**
     * Kombiniert DATEV-Buchungen mit hochgeladenen Supabase-Invoices
     */
    async getRechnungenMitStatus() {
        try {
            // 1. DATEV-Buchungen aus Supabase holen (NICHT aus JSON!)
            // Erst aus Cache oder neu laden
            if (!this.datevBuchungenCache || this.datevBuchungenCache.length === 0) {
                await this.loadBuchungenFromSupabase();
            }
            const datevBuchungen = this.datevBuchungenCache || [];

            // 2. Supabase Invoices holen
            const supabaseInvoices = await this.getInvoices();

            // 3. Suppliers laden für Namen-Anreicherung
            const { data: suppliers, error: supplierError } = await SupabaseService.client
                .from('suppliers')
                .select('partita_iva, fornitore_name');

            if (supplierError) {
                console.warn('⚠️ Konnte Lieferanten nicht laden:', supplierError);
            }

            const supplierMap = new Map();
            if (suppliers) {
                suppliers.forEach(s => {
                    supplierMap.set(s.partita_iva, s.fornitore_name);
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Namen-Anreicherung geladen`);

            // 4. Zusammenführen: Supabase Invoices zu DATEV-Buchungen matchen
            const datevBuchungenMap = new Map();
            datevBuchungen.forEach(buchung => {
                const key = `${buchung.partitaIva}_${buchung.dokumentNr}`;
                datevBuchungenMap.set(key, buchung);
            });

            // Matched Invoices tracken
            const matchedInvoiceIds = new Set();

            // Debug: Zeige erste Invoices
            if (supabaseInvoices.length > 0) {
                console.log('📄 Beispiel Supabase Invoices:', supabaseInvoices.slice(0, 3).map(inv =>
                    `partita_iva=${inv.partita_iva}, invoice_number=${inv.invoice_number}`
                ));
            }
            if (datevBuchungen.length > 0) {
                console.log('📋 Beispiel DATEV Buchungen:', datevBuchungen.slice(0, 3).map(b =>
                    `partitaIva=${b.partitaIva}, dokumentNr=${b.dokumentNr}`
                ));
            }

            // Hilfsfunktion: Normalisiert Dokumentnummer für Vergleich
            // Entfernt "/" komplett (z.B. "1/1405" -> "11405")
            const normalizeDocNr = (docNr) => {
                if (!docNr) return '';
                return String(docNr).replace(/\//g, '').trim();
            };

            // DATEV-Buchungen mit Supabase-Daten anreichern
            const enrichedDatevBuchungen = datevBuchungen.map(buchung => {
                const key = `${buchung.partitaIva}_${buchung.dokumentNr}`;
                const buchungDocNrNorm = normalizeDocNr(buchung.dokumentNr);

                // WICHTIG: Kein Matching wenn keine Rechnungsnummer vorhanden!
                // Sonst würde ein PDF bei allen Buchungen ohne Nummer erscheinen
                if (!buchung.dokumentNr || buchung.dokumentNr.trim() === '') {
                    // Lieferantenname aus suppliers-Tabelle holen
                    const supplierName = supplierMap.get(buchung.partitaIva);
                    return {
                        ...buchung,
                        fornitoreName: supplierName || buchung.fornitoreName,
                        pdfExists: false // Kein PDF-Matching ohne Rechnungsnummer
                    };
                }

                const matchingInvoice = supabaseInvoices.find(inv => {
                    // Partita IVA muss übereinstimmen
                    if (inv.partita_iva !== buchung.partitaIva) return false;

                    // Invoice muss auch eine Rechnungsnummer haben
                    if (!inv.invoice_number || inv.invoice_number.trim() === '') return false;

                    // Exakter Match
                    if (inv.invoice_number === buchung.dokumentNr) return true;

                    // Normalisierter Match (ohne "/" Prefix)
                    const invDocNrNorm = normalizeDocNr(inv.invoice_number);
                    const isMatch = invDocNrNorm === buchungDocNrNorm;

                    // Debug für Slash-Fälle
                    if (buchung.dokumentNr && buchung.dokumentNr.includes('/')) {
                        console.log(`🔍 Slash-Match: DATEV="${buchung.dokumentNr}" (norm="${buchungDocNrNorm}") vs PDF="${inv.invoice_number}" (norm="${invDocNrNorm}") → ${isMatch ? '✅' : '❌'}`);
                    }

                    return isMatch;
                });

                // Lieferantenname aus suppliers-Tabelle holen
                const supplierName = supplierMap.get(buchung.partitaIva);
                const enrichedFornitoreName = supplierName || buchung.fornitoreName;

                if (matchingInvoice) {
                    matchedInvoiceIds.add(matchingInvoice.id);
                    return {
                        ...buchung,
                        fornitoreName: enrichedFornitoreName,
                        id: matchingInvoice.id,
                        invoiceId: matchingInvoice.id,
                        filePath: matchingInvoice.file_path,
                        fileName: matchingInvoice.file_name,
                        uploadedAt: matchingInvoice.created_at,
                        pdfExists: true,
                        status: matchingInvoice.status,
                        notes: matchingInvoice.notes,
                        kostentyp: matchingInvoice.kostentyp || '',
                        funding_source_id: matchingInvoice.funding_source_id
                    };
                }

                return {
                    ...buchung,
                    fornitoreName: enrichedFornitoreName,
                    // Überschreibe alte pdfExists aus buchungen.json - nur true wenn Supabase-Invoice existiert
                    pdfExists: false
                };
            });

            // 4. Nicht-gematchte Supabase Invoices als eigene Zeilen hinzufügen
            const unmatchedInvoices = supabaseInvoices
                .filter(inv => !matchedInvoiceIds.has(inv.id))
                .map(inv => {
                    // IMMER aus Dateiname parsen für korrekte Trennung von Partita IVA und Rechnungsnr.
                    const parsed = this.parseInvoiceFilename(inv.file_name);
                    const partitaIva = parsed.partitaIva || inv.partita_iva;
                    const dokumentNr = parsed.invoiceNumber || inv.invoice_number;

                    // Lieferantenname aus suppliers-Tabelle holen anhand Partita IVA
                    // Debug: Erste paar Einträge prüfen
                    if (supplierMap.size > 0 && !supplierMap.has(partitaIva)) {
                        const sampleKeys = Array.from(supplierMap.keys()).slice(0, 3);
                        console.log(`🔍 Suche Lieferant für ${partitaIva}, Beispiel-Keys in Map: ${sampleKeys.join(', ')}`);
                    }
                    const supplierName = partitaIva ? supplierMap.get(partitaIva) : null;
                    const fornitoreName = supplierName || 'Unbekannt';

                    return {
                        // Basis-Daten aus Invoice
                        id: inv.id,
                        invoiceId: inv.id,
                        partitaIva: partitaIva,
                        dokumentNr: dokumentNr,
                        filePath: inv.file_path,
                        fileName: inv.file_name,
                        uploadedAt: inv.created_at,
                        pdfExists: true,
                        status: inv.status,
                        notes: inv.notes,
                        kostentyp: inv.kostentyp || '',
                        funding_source_id: inv.funding_source_id,

                        // Fehlende DATEV-Daten als null
                        projektId: null,
                        projektName: '(Kein DATEV-Projekt)',
                        fornitoreName: fornitoreName,
                        buchungsdatum: null,
                        belegdatum: null,
                        betrag: 0,
                        konto: null,

                        // UI-Flags
                        isSupabaseOnly: true
                    };
                });

            // 5. Kombinieren und sortieren
            const combined = [...enrichedDatevBuchungen, ...unmatchedInvoices];

            // Nach Upload-Datum bzw. Belegdatum sortieren (neueste zuerst)
            combined.sort((a, b) => {
                const dateA = a.uploadedAt || a.belegdatum || '';
                const dateB = b.uploadedAt || b.belegdatum || '';
                return dateB.localeCompare(dateA);
            });

            console.log(`📊 Rechnungen kombiniert: ${datevBuchungen.length} DATEV + ${unmatchedInvoices.length} nur Supabase = ${combined.length} gesamt`);

            return combined;

        } catch (error) {
            console.error('Fehler beim Kombinieren der Rechnungen:', error);
            // Fallback: nur DATEV-Buchungen
            return DataManager._getRechnungenMitStatusOriginal();
        }
    },

    /**
     * Parst PDF-Dateiname und extrahiert Partita IVA und Rechnungsnummer
     * Formate:
     * 1. Jahr_PartitaIVA_RechnungsNr.pdf (3 Teile, Jahr = 4 Ziffern, PartitaIVA beginnt mit IT)
     * 2. Timestamp_PartitaIVA_RechnungsNr.pdf (3 Teile, Timestamp = 10+ Ziffern)
     * 3. PartitaIVA_RechnungsNr.pdf (2 Teile)
     */
    parseInvoiceFilename(filename) {
        if (!filename) {
            return { partitaIva: null, invoiceNumber: null, valid: false };
        }

        const nameWithoutExt = filename.replace(/\.pdf$/i, '');
        const parts = nameWithoutExt.split('_');

        // 3-Teile Format: Jahr_PartitaIVA_RechnungsNr (z.B. 2026_IT00098090210_5000758)
        // oder Timestamp_PartitaIVA_RechnungsNr
        if (parts.length >= 3) {
            const firstPart = parts[0];
            // Prüfe ob erster Teil Jahr (4 Ziffern) oder Timestamp (10+ Ziffern) ist
            if (/^\d{4}$/.test(firstPart) || /^\d{10,}$/.test(firstPart)) {
                // Zweiter Teil sollte mit IT beginnen (Partita IVA)
                if (parts[1].startsWith('IT')) {
                    return {
                        partitaIva: parts[1],
                        invoiceNumber: parts.slice(2).join('_'),
                        valid: true
                    };
                }
            }
        }

        // 2-Teile Format: PartitaIVA_RechnungsNr (z.B. IT00098090210_5000758)
        if (parts.length >= 2 && parts[0].startsWith('IT')) {
            return {
                partitaIva: parts[0],
                invoiceNumber: parts.slice(1).join('_'),
                valid: true
            };
        }

        return { partitaIva: null, invoiceNumber: null, valid: false };
    },

    /**
     * LIEFERANTEN-FUNKTIONEN
     */
    async getSuppliers() {
        try {
            const { data, error } = await SupabaseService.client
                .from('suppliers')
                .select('*')
                .order('fornitore_name', { ascending: true });

            if (error) throw error;

            // Format anpassen an bisheriges Format (für Kompatibilität)
            return (data || []).map(s => ({
                partitaIva: s.partita_iva,
                name: s.fornitore_name,
                fornitoreNr: s.fornitore_nr,
                address: s.address,
                city: s.city,
                country: s.country
            }));

        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            // Fallback auf alte Funktion
            return DataManager._getDatevLieferantenOriginal ?
                DataManager._getDatevLieferantenOriginal() : [];
        }
    },

    /**
     * ZEITERFASSUNGS-FUNKTIONEN
     */

    async getTimeEntries() {
        try {
            const { data, error } = await SupabaseService.client
                .from('time_entries')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            return (data || []).map(e => this.convertTimeEntryFromSupabase(e));
        } catch (error) {
            console.error('Fehler beim Laden der Zeiteinträge:', error);
            return DataManager._getTimeEntriesOriginal ? DataManager._getTimeEntriesOriginal() : [];
        }
    },

    async getTimeEntriesByProject(projectId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('time_entries')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) throw error;

            return (data || []).map(e => this.convertTimeEntryFromSupabase(e));
        } catch (error) {
            console.error('Fehler beim Laden der Projekt-Zeiteinträge:', error);
            return DataManager._getTimeEntriesByProjectOriginal ?
                DataManager._getTimeEntriesByProjectOriginal(projectId) : [];
        }
    },

    async addTimeEntry(entryData) {
        try {
            const user = await Auth.getCurrentUser();

            const supabaseEntry = {
                project_id: entryData.projectId,
                user_id: user?.id || null,
                date: entryData.date,
                hours: entryData.hours,
                description: entryData.description || '',
                activity_type: entryData.activityType || null
            };

            const { data, error } = await SupabaseService.client
                .from('time_entries')
                .insert([supabaseEntry])
                .select()
                .single();

            if (error) throw error;

            return this.convertTimeEntryFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Speichern des Zeiteintrags:', error);
            throw error;
        }
    },

    async updateTimeEntry(id, updates) {
        try {
            const supabaseUpdates = {
                date: updates.date,
                hours: updates.hours,
                description: updates.description,
                activity_type: updates.activityType
            };

            // Nur definierte Werte übernehmen
            Object.keys(supabaseUpdates).forEach(key => {
                if (supabaseUpdates[key] === undefined) {
                    delete supabaseUpdates[key];
                }
            });

            const { data, error } = await SupabaseService.client
                .from('time_entries')
                .update(supabaseUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return this.convertTimeEntryFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Zeiteintrags:', error);
            throw error;
        }
    },

    async deleteTimeEntry(id) {
        try {
            const { error } = await SupabaseService.client
                .from('time_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Zeiteintrags:', error);
            throw error;
        }
    },

    async getProjectTotalHours(projectId) {
        try {
            const entries = await this.getTimeEntriesByProject(projectId);
            return entries.reduce((sum, e) => sum + (e.hours || 0), 0);
        } catch (error) {
            console.error('Fehler beim Berechnen der Stunden:', error);
            return 0;
        }
    },

    convertTimeEntryFromSupabase(supabaseEntry) {
        return {
            id: supabaseEntry.id,
            projectId: supabaseEntry.project_id,
            userId: supabaseEntry.user_id,
            date: supabaseEntry.date,
            hours: parseFloat(supabaseEntry.hours) || 0,
            description: supabaseEntry.description || '',
            activityType: supabaseEntry.activity_type || '',
            createdAt: supabaseEntry.created_at
        };
    },

    /**
     * KOSTENTYPEN-FUNKTIONEN
     */

    costTypesCache: null,

    async loadCostTypesFromSupabase() {
        try {
            const { data, error } = await SupabaseService.client
                .from('cost_types')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            // Spalten anpassen: id ist der Code, is_active statt active
            this.costTypesCache = (data || []).map(ct => ({
                id: ct.id,
                code: ct.id, // id ist gleichzeitig der Code (z.B. "5101")
                name: ct.name,
                description: ct.description || '',
                active: ct.is_active !== false
            }));

            console.log(`📋 ${this.costTypesCache.length} Kostentypen aus Supabase geladen`);
            return this.costTypesCache;
        } catch (error) {
            console.error('Fehler beim Laden der Kostentypen:', error);
            // Fallback auf lokale Daten
            this.costTypesCache = DataManager._getCostTypesOriginal ? DataManager._getCostTypesOriginal() : [];
            return this.costTypesCache;
        }
    },

    getCostTypes() {
        // Wenn Cache leer, synchron lokale Daten zurückgeben und async nachladen
        if (!this.costTypesCache) {
            this.loadCostTypesFromSupabase();
            return DataManager._getCostTypesOriginal ? DataManager._getCostTypesOriginal() : [];
        }
        return this.costTypesCache;
    },

    getActiveCostTypes() {
        const types = this.getCostTypes();
        return types.filter(ct => ct.active !== false);
    },

    async addCostType(costTypeData) {
        try {
            // id ist gleichzeitig der Code
            const newId = costTypeData.code || costTypeData.id || String(Date.now());

            const { data, error } = await SupabaseService.client
                .from('cost_types')
                .insert([{
                    id: newId,
                    name: costTypeData.name,
                    description: costTypeData.description || costTypeData.name,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            await this.loadCostTypesFromSupabase();

            return {
                id: data.id,
                code: data.id,
                name: data.name,
                description: data.description,
                active: data.is_active
            };
        } catch (error) {
            console.error('Fehler beim Anlegen des Kostentyps:', error);
            throw error;
        }
    },

    async updateCostType(id, updates) {
        try {
            const { data, error } = await SupabaseService.client
                .from('cost_types')
                .update({
                    name: updates.name,
                    description: updates.description,
                    is_active: updates.active
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            await this.loadCostTypesFromSupabase();

            return {
                id: data.id,
                code: data.id,
                name: data.name,
                description: data.description,
                active: data.is_active
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Kostentyps:', error);
            throw error;
        }
    },

    async deleteCostType(id) {
        try {
            const { error } = await SupabaseService.client
                .from('cost_types')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Cache invalidieren
            await this.loadCostTypesFromSupabase();

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Kostentyps:', error);
            throw error;
        }
    },

    /**
     * USER-FUNKTIONEN (aus Supabase users Tabelle)
     */

    usersCache: null,

    async loadUsersFromSupabase() {
        try {
            const { data, error } = await SupabaseService.client
                .from('users')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            this.usersCache = (data || []).map(u => ({
                id: u.id,
                name: u.name || u.email,
                email: u.email,
                role: u.role || 'user',
                hourlyRate: parseFloat(u.hourly_rate) || 0
            }));

            console.log(`👥 ${this.usersCache.length} Benutzer aus Supabase geladen`);
            return this.usersCache;
        } catch (error) {
            console.error('Fehler beim Laden der Benutzer:', error);
            this.usersCache = DataManager._getUsersOriginal ? DataManager._getUsersOriginal() : [];
            return this.usersCache;
        }
    },

    getUsers() {
        if (!this.usersCache) {
            this.loadUsersFromSupabase();
            return DataManager._getUsersOriginal ? DataManager._getUsersOriginal() : [];
        }
        return this.usersCache;
    },

    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => String(u.id) === String(id));
    },

    async updateUser(id, updates) {
        try {
            const supabaseUpdates = {};
            if (updates.hourlyRate !== undefined) {
                supabaseUpdates.hourly_rate = updates.hourlyRate;
            }
            if (updates.name !== undefined) {
                supabaseUpdates.name = updates.name;
            }
            if (updates.role !== undefined) {
                supabaseUpdates.role = updates.role;
            }

            const { data, error } = await SupabaseService.client
                .from('users')
                .update(supabaseUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            await this.loadUsersFromSupabase();

            return {
                id: data.id,
                name: data.name || data.email,
                email: data.email,
                role: data.role || 'user',
                hourlyRate: parseFloat(data.hourly_rate) || 0
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Benutzers:', error);
            throw error;
        }
    },

    // ==========================================
    // FUNDING SOURCES (EINNAHMEPLANUNG)
    // ==========================================

    async getFundingSources(year = null) {
        try {
            let query = SupabaseService.client
                .from('funding_sources')
                .select('*')
                .order('code', { ascending: true });

            if (year) {
                query = query.eq('fiscal_year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            this.fundingSourcesCache = data.map(fs => ({
                id: fs.id,
                code: fs.code,
                name: fs.name,
                source: fs.source,
                amount: parseFloat(fs.amount) || 0,
                year: fs.fiscal_year,
                isAbgabestelle: fs.is_abgabestelle,
                status: fs.status,
                notes: fs.notes,
                documentPath: fs.document_path,
                createdAt: fs.created_at,
                updatedAt: fs.updated_at
            }));

            return this.fundingSourcesCache;
        } catch (error) {
            console.error('Fehler beim Laden der Einnahmen:', error);
            return [];
        }
    },

    async getFundingSourceById(id) {
        try {
            const { data, error } = await SupabaseService.client
                .from('funding_sources')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                id: data.id,
                code: data.code,
                name: data.name,
                source: data.source,
                amount: parseFloat(data.amount) || 0,
                year: data.fiscal_year,
                isAbgabestelle: data.is_abgabestelle,
                status: data.status,
                notes: data.notes,
                documentPath: data.document_path,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Fehler beim Laden der Einnahme:', error);
            return null;
        }
    },

    async addFundingSource(fundingSource) {
        try {
            const { data, error } = await SupabaseService.client
                .from('funding_sources')
                .insert({
                    code: fundingSource.code,
                    name: fundingSource.name,
                    source: fundingSource.source || null,
                    amount: fundingSource.amount || 0,
                    fiscal_year: fundingSource.year || new Date().getFullYear(),
                    is_abgabestelle: fundingSource.isAbgabestelle || false,
                    status: fundingSource.status || 'offen',
                    notes: fundingSource.notes || null,
                    document_path: fundingSource.documentPath || null
                })
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            this.fundingSourcesCache = null;

            return {
                id: data.id,
                code: data.code,
                name: data.name,
                source: data.source,
                amount: parseFloat(data.amount) || 0,
                year: data.fiscal_year,
                isAbgabestelle: data.is_abgabestelle,
                status: data.status,
                notes: data.notes,
                documentPath: data.document_path
            };
        } catch (error) {
            console.error('Fehler beim Erstellen der Einnahme:', error);
            throw error;
        }
    },

    async updateFundingSource(id, updates) {
        try {
            const supabaseUpdates = {};
            if (updates.code !== undefined) supabaseUpdates.code = updates.code;
            if (updates.name !== undefined) supabaseUpdates.name = updates.name;
            if (updates.source !== undefined) supabaseUpdates.source = updates.source;
            if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount;
            if (updates.year !== undefined) supabaseUpdates.fiscal_year = updates.year;
            if (updates.isAbgabestelle !== undefined) supabaseUpdates.is_abgabestelle = updates.isAbgabestelle;
            if (updates.status !== undefined) supabaseUpdates.status = updates.status;
            if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
            if (updates.documentPath !== undefined) supabaseUpdates.document_path = updates.documentPath;

            const { data, error } = await SupabaseService.client
                .from('funding_sources')
                .update(supabaseUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            this.fundingSourcesCache = null;

            return {
                id: data.id,
                code: data.code,
                name: data.name,
                source: data.source,
                amount: parseFloat(data.amount) || 0,
                year: data.fiscal_year,
                isAbgabestelle: data.is_abgabestelle,
                status: data.status,
                notes: data.notes,
                documentPath: data.document_path
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Einnahme:', error);
            throw error;
        }
    },

    async deleteFundingSource(id) {
        try {
            const { error } = await SupabaseService.client
                .from('funding_sources')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Cache invalidieren
            this.fundingSourcesCache = null;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen der Einnahme:', error);
            throw error;
        }
    },

    /**
     * Gibt alle aktiven Abgabestellen zurück (is_abgabestelle = true)
     */
    async getActiveAbgabestellen(year = null) {
        try {
            let query = SupabaseService.client
                .from('funding_sources')
                .select('*')
                .eq('is_abgabestelle', true)
                .order('code', { ascending: true });

            if (year) {
                query = query.eq('fiscal_year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map(fs => ({
                id: fs.id,
                code: fs.code,
                name: fs.name,
                source: fs.source,
                amount: parseFloat(fs.amount) || 0,
                year: fs.fiscal_year,
                label: `${fs.code} ${fs.name}` // Für Dropdown-Anzeige
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Abgabestellen:', error);
            return [];
        }
    },

    /**
     * Berechnet die Ausgaben für eine Funding Source
     */
    async getFundingSourceExpenses(fundingSourceId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .select('id, betrag_netto, betrag_gesamt')
                .eq('funding_source_id', fundingSourceId);

            if (error) throw error;

            const totalNetto = data.reduce((sum, inv) => sum + (parseFloat(inv.betrag_netto) || 0), 0);
            const totalBrutto = data.reduce((sum, inv) => sum + (parseFloat(inv.betrag_gesamt) || 0), 0);

            return {
                count: data.length,
                totalNetto,
                totalBrutto
            };
        } catch (error) {
            console.error('Fehler beim Berechnen der Ausgaben:', error);
            return { count: 0, totalNetto: 0, totalBrutto: 0 };
        }
    },

    /**
     * Aktualisiert die Abgabestelle einer Rechnung
     */
    async updateInvoiceFundingSource(invoiceId, fundingSourceId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({ funding_source_id: fundingSourceId })
                .eq('id', invoiceId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Abgabestelle:', error);
            throw error;
        }
    },

    // ==========================================
    // MITGLIEDER-VERWALTUNG
    // ==========================================

    /**
     * Lädt alle Mitglieder
     */
    async getMembers(activeOnly = true) {
        try {
            let query = SupabaseService.client
                .from('members')
                .select('*')
                .order('last_name', { ascending: true });

            if (activeOnly) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Mitglieder:', error);
            return [];
        }
    },

    /**
     * Lädt ein einzelnes Mitglied
     */
    async getMemberById(id) {
        try {
            const { data, error } = await SupabaseService.client
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Laden des Mitglieds:', error);
            return null;
        }
    },

    /**
     * Fügt ein neues Mitglied hinzu
     */
    async addMember(memberData) {
        try {
            const { data, error } = await SupabaseService.client
                .from('members')
                .insert({
                    member_number: memberData.member_number,
                    last_name: memberData.last_name,
                    first_name: memberData.first_name,
                    gender: memberData.gender,
                    language: memberData.language,
                    address: memberData.address,
                    postal_code: memberData.postal_code,
                    city: memberData.city,
                    email: memberData.email,
                    phone: memberData.phone,
                    birth_year: memberData.birth_year,
                    tax_number: memberData.tax_number,
                    membership_fee: memberData.membership_fee || 0,
                    donation: memberData.donation || 0,
                    join_date: memberData.join_date,
                    payment_method: memberData.payment_method,
                    hashtag: memberData.hashtag,
                    notes: memberData.notes,
                    is_active: memberData.is_active !== false
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Mitglieds:', error);
            throw error;
        }
    },

    /**
     * Aktualisiert ein Mitglied
     */
    async updateMember(id, updates) {
        try {
            const supabaseUpdates = {};

            if (updates.member_number !== undefined) supabaseUpdates.member_number = updates.member_number;
            if (updates.last_name !== undefined) supabaseUpdates.last_name = updates.last_name;
            if (updates.first_name !== undefined) supabaseUpdates.first_name = updates.first_name;
            if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender;
            if (updates.language !== undefined) supabaseUpdates.language = updates.language;
            if (updates.address !== undefined) supabaseUpdates.address = updates.address;
            if (updates.postal_code !== undefined) supabaseUpdates.postal_code = updates.postal_code;
            if (updates.city !== undefined) supabaseUpdates.city = updates.city;
            if (updates.email !== undefined) supabaseUpdates.email = updates.email;
            if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
            if (updates.birth_year !== undefined) supabaseUpdates.birth_year = updates.birth_year;
            if (updates.tax_number !== undefined) supabaseUpdates.tax_number = updates.tax_number;
            if (updates.membership_fee !== undefined) supabaseUpdates.membership_fee = updates.membership_fee;
            if (updates.donation !== undefined) supabaseUpdates.donation = updates.donation;
            if (updates.join_date !== undefined) supabaseUpdates.join_date = updates.join_date;
            if (updates.payment_method !== undefined) supabaseUpdates.payment_method = updates.payment_method;
            if (updates.hashtag !== undefined) supabaseUpdates.hashtag = updates.hashtag;
            if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
            if (updates.is_active !== undefined) supabaseUpdates.is_active = updates.is_active;

            const { data, error } = await SupabaseService.client
                .from('members')
                .update(supabaseUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Mitglieds:', error);
            throw error;
        }
    },

    /**
     * Löscht ein Mitglied
     */
    async deleteMember(id) {
        try {
            const { error } = await SupabaseService.client
                .from('members')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Mitglieds:', error);
            throw error;
        }
    },

    /**
     * Importiert mehrere Mitglieder aus Excel
     */
    async importMembers(membersArray) {
        try {
            const membersToInsert = membersArray.map(m => ({
                member_number: m.member_number || null,
                last_name: m.last_name || '',
                first_name: m.first_name || '',
                gender: m.gender || null,
                language: m.language || null,
                address: m.address || null,
                postal_code: m.postal_code || null,
                city: m.city || null,
                email: m.email || null,
                phone: m.phone || null,
                birth_year: m.birth_year || null,
                tax_number: m.tax_number || null,
                membership_fee: parseFloat(m.membership_fee) || 0,
                donation: parseFloat(m.donation) || 0,
                join_date: m.join_date || null,
                payment_method: m.payment_method || null,
                hashtag: m.hashtag || null,
                notes: m.notes || null,
                is_active: true
            }));

            const { data, error } = await SupabaseService.client
                .from('members')
                .insert(membersToInsert)
                .select();

            if (error) throw error;

            return { success: true, count: data.length, data };
        } catch (error) {
            console.error('Fehler beim Importieren der Mitglieder:', error);
            throw error;
        }
    },

    /**
     * Lädt alle Zahlungen eines Mitglieds
     */
    async getMemberPayments(memberId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('member_payments')
                .select('*')
                .eq('member_id', memberId)
                .order('year', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Mitgliedszahlungen:', error);
            return [];
        }
    },

    /**
     * Lädt alle Zahlungen für ein Jahr (mit Mitgliederdaten)
     */
    async getMemberPaymentsByYear(year) {
        try {
            const { data, error } = await SupabaseService.client
                .from('member_payments')
                .select(`
                    *,
                    members (id, last_name, first_name, membership_fee)
                `)
                .eq('year', year)
                .order('payment_date', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Jahreszahlungen:', error);
            return [];
        }
    },

    /**
     * Fügt eine Zahlung hinzu (verknüpft DATEV-Buchung mit Mitglied)
     */
    async addMemberPayment(paymentData) {
        try {
            const { data, error } = await SupabaseService.client
                .from('member_payments')
                .upsert({
                    member_id: paymentData.member_id,
                    year: paymentData.year,
                    amount: paymentData.amount,
                    payment_date: paymentData.payment_date,
                    datev_buchung_id: paymentData.datev_buchung_id,
                    datev_buchungstext: paymentData.datev_buchungstext,
                    notes: paymentData.notes
                }, {
                    onConflict: 'member_id,year'
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Zahlung:', error);
            throw error;
        }
    },

    /**
     * Löscht eine Zahlung
     */
    async deleteMemberPayment(paymentId) {
        try {
            const { error } = await SupabaseService.client
                .from('member_payments')
                .delete()
                .eq('id', paymentId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen der Zahlung:', error);
            throw error;
        }
    },

    /**
     * Lädt DATEV-Buchungen für ein bestimmtes Konto (z.B. 6401550 für Mitgliedsbeiträge)
     */
    getDatevBuchungenForKonto(konto) {
        try {
            const buchungen = DataManager.getDatevBuchungen();
            return buchungen.filter(b => b.konto === konto || b.gegenKonto === konto);
        } catch (error) {
            console.error('Fehler beim Filtern der DATEV-Buchungen:', error);
            return [];
        }
    },

    // =========================================================================
    // WORKSPACE-FUNKTIONEN
    // =========================================================================

    /**
     * Lädt alle Workspaces
     */
    async getWorkspaces() {
        try {
            const { data, error } = await SupabaseService.client
                .from('workspaces')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Workspaces:', error);
            return [];
        }
    },

    /**
     * Lädt einen Workspace nach ID
     */
    async getWorkspaceById(workspaceId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('workspaces')
                .select('*')
                .eq('id', workspaceId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Laden des Workspace:', error);
            return null;
        }
    },

    /**
     * Erstellt einen neuen Workspace
     */
    async addWorkspace(workspace) {
        try {
            const { data: { user } } = await SupabaseService.client.auth.getUser();

            const { data, error } = await SupabaseService.client
                .from('workspaces')
                .insert({
                    name: workspace.name,
                    description: workspace.description || null,
                    access_dashboard: workspace.access_dashboard || false,
                    access_projekte: workspace.access_projekte || false,
                    access_rechnungen: workspace.access_rechnungen || false,
                    access_bewegungen: workspace.access_bewegungen || false,
                    access_lieferanten: workspace.access_lieferanten || false,
                    access_mitglieder: workspace.access_mitglieder || false,
                    access_einnahmen: workspace.access_einnahmen || false,
                    access_konfiguration: workspace.access_konfiguration || false,
                    rechnungen_nur_zugewiesene: workspace.rechnungen_nur_zugewiesene || false,
                    is_active: true,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Erstellen des Workspace:', error);
            throw error;
        }
    },

    /**
     * Aktualisiert einen Workspace
     */
    async updateWorkspace(workspaceId, updates) {
        try {
            const { data, error } = await SupabaseService.client
                .from('workspaces')
                .update({
                    name: updates.name,
                    description: updates.description,
                    access_dashboard: updates.access_dashboard,
                    access_projekte: updates.access_projekte,
                    access_rechnungen: updates.access_rechnungen,
                    access_bewegungen: updates.access_bewegungen,
                    access_lieferanten: updates.access_lieferanten,
                    access_mitglieder: updates.access_mitglieder,
                    access_einnahmen: updates.access_einnahmen,
                    access_konfiguration: updates.access_konfiguration,
                    rechnungen_nur_zugewiesene: updates.rechnungen_nur_zugewiesene,
                    is_active: updates.is_active
                })
                .eq('id', workspaceId)
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            this.permissionsCache = null;

            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Workspace:', error);
            throw error;
        }
    },

    /**
     * Löscht einen Workspace
     */
    async deleteWorkspace(workspaceId) {
        try {
            const { error } = await SupabaseService.client
                .from('workspaces')
                .delete()
                .eq('id', workspaceId);

            if (error) throw error;

            // Cache invalidieren
            this.permissionsCache = null;

            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Workspace:', error);
            throw error;
        }
    },

    /**
     * Lädt alle User-Workspace-Zuweisungen für einen Workspace
     */
    async getUserWorkspaces(workspaceId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('user_workspaces')
                .select(`
                    id,
                    user_id,
                    workspace_id,
                    is_admin,
                    created_at
                `)
                .eq('workspace_id', workspaceId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der User-Workspaces:', error);
            return [];
        }
    },

    /**
     * Fügt einen User zu einem Workspace hinzu
     */
    async addUserToWorkspace(userId, workspaceId, isAdmin = false) {
        try {
            const { data: { user } } = await SupabaseService.client.auth.getUser();

            const { data, error } = await SupabaseService.client
                .from('user_workspaces')
                .insert({
                    user_id: userId,
                    workspace_id: workspaceId,
                    is_admin: isAdmin,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            // Cache invalidieren
            this.permissionsCache = null;

            return data;
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Users zum Workspace:', error);
            throw error;
        }
    },

    /**
     * Entfernt einen User aus einem Workspace
     */
    async removeUserFromWorkspace(userId, workspaceId) {
        try {
            const { error } = await SupabaseService.client
                .from('user_workspaces')
                .delete()
                .eq('user_id', userId)
                .eq('workspace_id', workspaceId);

            if (error) throw error;

            // Cache invalidieren
            this.permissionsCache = null;

            return true;
        } catch (error) {
            console.error('Fehler beim Entfernen des Users aus dem Workspace:', error);
            throw error;
        }
    },

    /**
     * Lädt die Berechtigungen des aktuellen Users
     * Aggregiert aus allen zugewiesenen Workspaces (OR-Verknüpfung)
     */
    async getCurrentUserPermissions() {
        try {
            // Cache prüfen
            if (this.permissionsCache) {
                return this.permissionsCache;
            }

            const { data: { user } } = await SupabaseService.client.auth.getUser();
            if (!user) {
                return this.getDefaultPermissions();
            }

            // User-Workspaces mit Workspace-Details laden
            const { data, error } = await SupabaseService.client
                .from('user_workspaces')
                .select(`
                    workspace_id,
                    is_admin,
                    workspaces (
                        id,
                        name,
                        access_dashboard,
                        access_projekte,
                        access_rechnungen,
                        access_bewegungen,
                        access_lieferanten,
                        access_mitglieder,
                        access_einnahmen,
                        access_konfiguration,
                        rechnungen_nur_zugewiesene,
                        is_active
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Wenn keine Workspaces zugewiesen, Vollzugriff (für Admins/Erstnutzer)
            if (!data || data.length === 0) {
                console.log('⚠️ Kein Workspace zugewiesen - Vollzugriff gewährt');
                return this.getFullPermissions();
            }

            // Berechtigungen aggregieren (OR über alle Workspaces)
            const permissions = {
                userId: user.id,
                userEmail: user.email,
                workspaces: [],
                access_dashboard: false,
                access_projekte: false,
                access_rechnungen: false,
                access_bewegungen: false,
                access_lieferanten: false,
                access_mitglieder: false,
                access_einnahmen: false,
                access_konfiguration: false,
                rechnungen_nur_zugewiesene: true, // Startet mit true, wird auf false gesetzt wenn ein Workspace vollen Zugriff hat
                isWorkspaceAdmin: false
            };

            for (const uw of data) {
                if (uw.workspaces && uw.workspaces.is_active) {
                    const ws = uw.workspaces;
                    permissions.workspaces.push({ id: ws.id, name: ws.name });

                    // OR-Verknüpfung für alle Zugriffsrechte
                    permissions.access_dashboard = permissions.access_dashboard || ws.access_dashboard;
                    permissions.access_projekte = permissions.access_projekte || ws.access_projekte;
                    permissions.access_rechnungen = permissions.access_rechnungen || ws.access_rechnungen;
                    permissions.access_bewegungen = permissions.access_bewegungen || ws.access_bewegungen;
                    permissions.access_lieferanten = permissions.access_lieferanten || ws.access_lieferanten;
                    permissions.access_mitglieder = permissions.access_mitglieder || ws.access_mitglieder;
                    permissions.access_einnahmen = permissions.access_einnahmen || ws.access_einnahmen;
                    permissions.access_konfiguration = permissions.access_konfiguration || ws.access_konfiguration;

                    // Wenn mindestens ein Workspace vollen Rechnungszugriff hat
                    if (!ws.rechnungen_nur_zugewiesene) {
                        permissions.rechnungen_nur_zugewiesene = false;
                    }

                    // Workspace-Admin
                    if (uw.is_admin) {
                        permissions.isWorkspaceAdmin = true;
                    }
                }
            }

            // Cache setzen
            this.permissionsCache = permissions;

            return permissions;
        } catch (error) {
            console.error('Fehler beim Laden der Berechtigungen:', error);
            return this.getFullPermissions(); // Fallback zu Vollzugriff bei Fehler
        }
    },

    /**
     * Standard-Berechtigungen (kein Zugriff)
     */
    getDefaultPermissions() {
        return {
            userId: null,
            userEmail: null,
            workspaces: [],
            access_dashboard: false,
            access_projekte: false,
            access_rechnungen: false,
            access_bewegungen: false,
            access_lieferanten: false,
            access_mitglieder: false,
            access_einnahmen: false,
            access_konfiguration: false,
            rechnungen_nur_zugewiesene: true,
            isWorkspaceAdmin: false
        };
    },

    /**
     * Vollzugriff-Berechtigungen (für Admins)
     */
    getFullPermissions() {
        return {
            userId: null,
            userEmail: null,
            workspaces: [],
            access_dashboard: true,
            access_projekte: true,
            access_rechnungen: true,
            access_bewegungen: true,
            access_lieferanten: true,
            access_mitglieder: true,
            access_einnahmen: true,
            access_konfiguration: true,
            rechnungen_nur_zugewiesene: false,
            isWorkspaceAdmin: true
        };
    },

    /**
     * Lädt alle Auth-User aus Supabase (für Dropdown)
     */
    async getAllAuthUsers() {
        try {
            // Lade User aus der profiles/users Tabelle oder auth.users view
            // Da auth.users nicht direkt zugänglich ist, nutzen wir user_workspaces um bekannte User zu finden
            // Alternativ: Eine eigene profiles-Tabelle erstellen

            // Für jetzt: Lade User die bereits in user_workspaces sind
            const { data: existingAssignments, error: assignError } = await SupabaseService.client
                .from('user_workspaces')
                .select('user_id')
                .order('user_id');

            if (assignError) throw assignError;

            // Unique User IDs
            const userIds = [...new Set(existingAssignments.map(a => a.user_id))];

            // Versuche User-Details aus einer profiles-Tabelle zu laden (falls vorhanden)
            // Fallback: Nur IDs zurückgeben
            const users = userIds.map(id => ({ id, email: id }));

            return users;
        } catch (error) {
            console.error('Fehler beim Laden der Auth-User:', error);
            return [];
        }
    },

    // ==========================================
    // DECKUNGSBEITRAGSRECHNUNG
    // ==========================================

    /**
     * Kontenplan laden (chart_of_accounts)
     */
    async getChartOfAccounts() {
        try {
            const { data, error } = await supabaseClient
                .from('chart_of_accounts')
                .select('*')
                .eq('ist_aktiv', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden des Kontenplans:', error);
            return [];
        }
    },

    /**
     * DB-Zuordnung für ein Konto finden (Pattern-Matching)
     */
    getDbZuordnungForKonto(kontoNr, chartOfAccounts) {
        if (!kontoNr || !chartOfAccounts) return 'NEUTRAL';

        // Exakte Matches zuerst, dann Pattern (längste zuerst)
        const sortedAccounts = [...chartOfAccounts].sort((a, b) => {
            // Exakte Matches zuerst
            const aExact = !a.konto_pattern.includes('%');
            const bExact = !b.konto_pattern.includes('%');
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            // Bei Pattern: längere zuerst (spezifischer)
            return b.konto_pattern.length - a.konto_pattern.length;
        });

        for (const account of sortedAccounts) {
            const pattern = account.konto_pattern;
            if (pattern.includes('%')) {
                // Pattern-Match: 680% -> startsWith('680')
                const prefix = pattern.replace('%', '');
                if (kontoNr.startsWith(prefix)) {
                    return {
                        db_zuordnung: account.db_zuordnung,
                        ist_projektbezogen: account.ist_projektbezogen,
                        kategorie: account.kategorie
                    };
                }
            } else {
                // Exakter Match
                if (kontoNr === pattern) {
                    return {
                        db_zuordnung: account.db_zuordnung,
                        ist_projektbezogen: account.ist_projektbezogen,
                        kategorie: account.kategorie
                    };
                }
            }
        }

        return { db_zuordnung: 'NEUTRAL', ist_projektbezogen: false, kategorie: null };
    },

    /**
     * Projekt-Gewichtungen berechnen (nach Ausstellungsdauer)
     */
    calculateProjectWeights(projects, startDate, endDate) {
        const weights = {};
        let totalDays = 0;

        // Nur Projekte mit ist_ausstellung = true
        const ausstellungen = projects.filter(p => p.ist_ausstellung !== false);

        for (const project of ausstellungen) {
            if (!project.start_date || !project.end_date) continue;

            const pStart = new Date(project.start_date);
            const pEnd = new Date(project.end_date);
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);

            // Überlappung berechnen
            const overlapStart = new Date(Math.max(pStart.getTime(), rangeStart.getTime()));
            const overlapEnd = new Date(Math.min(pEnd.getTime(), rangeEnd.getTime()));

            if (overlapStart <= overlapEnd) {
                const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                weights[project.id] = { days, project };
                totalDays += days;
            }
        }

        // Anteile berechnen
        for (const projectId of Object.keys(weights)) {
            weights[projectId].anteil = totalDays > 0 ? weights[projectId].days / totalDays : 0;
        }

        return { weights, totalDays };
    },

    /**
     * Deckungsbeiträge berechnen
     * @param {string} startDate - Startdatum (YYYY-MM-DD)
     * @param {string} endDate - Enddatum (YYYY-MM-DD)
     * @returns {Object} - DB-Ergebnisse pro Projekt + Gesamt
     */
    async calculateContributionMargins(startDate, endDate) {
        try {
            // 1. Kontenplan laden
            const chartOfAccounts = await this.getChartOfAccounts();

            // 2. Projekte laden
            const { data: projects, error: projectsError } = await supabaseClient
                .from('projects')
                .select('*')
                .eq('ist_ausstellung', true);

            if (projectsError) throw projectsError;

            // 3. DATEV-Buchungen laden
            const { data: buchungen, error: buchungenError } = await supabaseClient
                .from('datev_bookings')
                .select('*')
                .gte('datum', startDate)
                .lte('datum', endDate);

            if (buchungenError) throw buchungenError;

            // 4. Projekt-Gewichtungen berechnen
            const { weights, totalDays } = this.calculateProjectWeights(projects, startDate, endDate);

            // 5. Buchungen nach DB-Stufen kategorisieren
            const kategorisiert = {
                UMSATZ: { gesamt: 0, projektbezogen: {}, allgemein: 0 },
                DB1_KOSTEN: { gesamt: 0, projektbezogen: {}, allgemein: 0 },
                DB2_KOSTEN: { gesamt: 0 },
                DB3_KOSTEN: { gesamt: 0 },
                NEUTRAL: { gesamt: 0 }
            };

            for (const buchung of buchungen || []) {
                const betrag = Math.abs(parseFloat(buchung.betrag_gesamt || buchung.betrag) || 0);
                const kontoNr = buchung.konto_nr || '';
                const projektId = buchung.projekt_id;

                const zuordnung = this.getDbZuordnungForKonto(kontoNr, chartOfAccounts);
                const dbStufe = zuordnung.db_zuordnung;

                if (!kategorisiert[dbStufe]) continue;

                kategorisiert[dbStufe].gesamt += betrag;

                // Projektbezogene Kosten direkt zuordnen
                if ((dbStufe === 'UMSATZ' || dbStufe === 'DB1_KOSTEN') && projektId && zuordnung.ist_projektbezogen) {
                    if (!kategorisiert[dbStufe].projektbezogen[projektId]) {
                        kategorisiert[dbStufe].projektbezogen[projektId] = 0;
                    }
                    kategorisiert[dbStufe].projektbezogen[projektId] += betrag;
                } else if (dbStufe === 'UMSATZ' || dbStufe === 'DB1_KOSTEN') {
                    kategorisiert[dbStufe].allgemein += betrag;
                }
            }

            // 6. Ergebnisse pro Projekt berechnen
            const ergebnisse = {
                projekte: {},
                gesamt: {
                    umsatz: kategorisiert.UMSATZ.gesamt,
                    db1_kosten: kategorisiert.DB1_KOSTEN.gesamt,
                    db1: kategorisiert.UMSATZ.gesamt - kategorisiert.DB1_KOSTEN.gesamt,
                    db2_kosten: kategorisiert.DB2_KOSTEN.gesamt,
                    db2: 0,
                    db3_kosten: kategorisiert.DB3_KOSTEN.gesamt,
                    db3: 0,
                    neutral: kategorisiert.NEUTRAL.gesamt
                },
                nichtProjektbezogen: {
                    umsatz: kategorisiert.UMSATZ.allgemein,
                    kosten: kategorisiert.DB1_KOSTEN.allgemein
                },
                zeitraum: { startDate, endDate, totalDays }
            };

            // Pro Projekt berechnen
            for (const [projektId, weightData] of Object.entries(weights)) {
                const projekt = weightData.project;
                const anteil = weightData.anteil;

                // Direkte Umsätze/Kosten des Projekts
                const projektUmsatz = kategorisiert.UMSATZ.projektbezogen[projektId] || 0;
                const projektKosten = kategorisiert.DB1_KOSTEN.projektbezogen[projektId] || 0;

                // DB1 = Direkte Umsätze - Direkte Kosten
                const db1 = projektUmsatz - projektKosten;

                // DB2 = DB1 - anteilige Strukturkosten
                const anteilDB2Kosten = kategorisiert.DB2_KOSTEN.gesamt * anteil;
                const db2 = db1 - anteilDB2Kosten;

                // DB3 = DB2 - anteilige Fixkosten
                const anteilDB3Kosten = kategorisiert.DB3_KOSTEN.gesamt * anteil;
                const db3 = db2 - anteilDB3Kosten;

                ergebnisse.projekte[projektId] = {
                    projekt: {
                        id: projekt.id,
                        name: projekt.name,
                        start_date: projekt.start_date,
                        end_date: projekt.end_date
                    },
                    tage: weightData.days,
                    anteil: anteil,
                    umsatz: projektUmsatz,
                    db1_kosten: projektKosten,
                    db1: db1,
                    db1_marge: projektUmsatz > 0 ? (db1 / projektUmsatz * 100) : 0,
                    db2_kosten_anteil: anteilDB2Kosten,
                    db2: db2,
                    db3_kosten_anteil: anteilDB3Kosten,
                    db3: db3
                };
            }

            // Gesamt-DB2 und DB3 berechnen
            ergebnisse.gesamt.db2 = ergebnisse.gesamt.db1 - kategorisiert.DB2_KOSTEN.gesamt;
            ergebnisse.gesamt.db3 = ergebnisse.gesamt.db2 - kategorisiert.DB3_KOSTEN.gesamt;

            return ergebnisse;

        } catch (error) {
            console.error('Fehler bei der Deckungsbeitragsrechnung:', error);
            throw error;
        }
    },

    // =========================================================================
    // BUDGETPLANUNG-FUNKTIONEN
    // =========================================================================

    /**
     * Lädt alle Budget-Einträge für ein Jahr
     */
    async getBudgetEntries(year, includeVorjahr = false) {
        try {
            const years = includeVorjahr ? [year, year - 1] : [year];

            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .select('*')
                .in('fiscal_year', years)
                .order('konto_nr', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Budget-Einträge:', error);
            return [];
        }
    },

    /**
     * Lädt einen Budget-Eintrag nach ID
     */
    async getBudgetEntryById(entryId) {
        try {
            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .select('*')
                .eq('id', entryId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Laden des Budget-Eintrags:', error);
            return null;
        }
    },

    /**
     * Erstellt einen neuen Budget-Eintrag
     */
    async addBudgetEntry(entry) {
        try {
            const { data: { user } } = await SupabaseService.client.auth.getUser();

            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .insert({
                    konto_nr: entry.konto_nr,
                    konto_name: entry.konto_name || null,
                    projekt_id: entry.projekt_id || null,
                    description: entry.description,
                    fiscal_year: entry.fiscal_year,
                    jan: entry.jan || 0,
                    feb: entry.feb || 0,
                    mar: entry.mar || 0,
                    apr: entry.apr || 0,
                    mai: entry.mai || 0,
                    jun: entry.jun || 0,
                    jul: entry.jul || 0,
                    aug: entry.aug || 0,
                    sep: entry.sep || 0,
                    okt: entry.okt || 0,
                    nov: entry.nov || 0,
                    dez: entry.dez || 0,
                    entry_type: entry.entry_type || 'budget',
                    notes: entry.notes || null,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Erstellen des Budget-Eintrags:', error);
            throw error;
        }
    },

    /**
     * Aktualisiert einen Budget-Eintrag
     */
    async updateBudgetEntry(entryId, updates) {
        try {
            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .update({
                    konto_nr: updates.konto_nr,
                    konto_name: updates.konto_name,
                    projekt_id: updates.projekt_id,
                    description: updates.description,
                    jan: updates.jan,
                    feb: updates.feb,
                    mar: updates.mar,
                    apr: updates.apr,
                    mai: updates.mai,
                    jun: updates.jun,
                    jul: updates.jul,
                    aug: updates.aug,
                    sep: updates.sep,
                    okt: updates.okt,
                    nov: updates.nov,
                    dez: updates.dez,
                    entry_type: updates.entry_type,
                    notes: updates.notes
                })
                .eq('id', entryId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Budget-Eintrags:', error);
            throw error;
        }
    },

    /**
     * Löscht einen Budget-Eintrag
     */
    async deleteBudgetEntry(entryId) {
        try {
            const { error } = await SupabaseService.client
                .from('budget_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Budget-Eintrags:', error);
            throw error;
        }
    },

    /**
     * Lädt Budget-Notizen für ein Jahr
     */
    async getBudgetNotes(year) {
        try {
            const { data, error } = await SupabaseService.client
                .from('budget_notes')
                .select('*')
                .eq('fiscal_year', year)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data?.notes || '';
        } catch (error) {
            console.error('Fehler beim Laden der Budget-Notizen:', error);
            return '';
        }
    },

    /**
     * Speichert Budget-Notizen für ein Jahr
     */
    async saveBudgetNotes(year, notes) {
        try {
            const { data: { user } } = await SupabaseService.client.auth.getUser();

            const { data, error } = await SupabaseService.client
                .from('budget_notes')
                .upsert({
                    fiscal_year: year,
                    notes: notes,
                    created_by: user?.id
                }, {
                    onConflict: 'fiscal_year'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern der Budget-Notizen:', error);
            throw error;
        }
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

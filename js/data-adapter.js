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

        // Kostentyp/Status-Funktionen überschreiben (speichert in Supabase statt localStorage)
        DataManager._setKostentypOriginal = DataManager.setKostentyp;
        DataManager.setKostentyp = this.setKostentyp.bind(this);

        DataManager._setRechnungStatusOriginal = DataManager.setRechnungStatus;
        DataManager.setRechnungStatus = this.setRechnungStatus.bind(this);

        // Lieferanten-Funktionen überschreiben
        DataManager._getDatevLieferantenOriginal = DataManager.getDatevLieferanten;
        DataManager.getDatevLieferanten = this.getSuppliers.bind(this);
        DataManager.updateSupplier = this.updateSupplier.bind(this);

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

        DataManager.addUser = this.addUser.bind(this);

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
        DataManager.getBudgetKontoNotes = this.getBudgetKontoNotes.bind(this);
        DataManager.saveBudgetKontoNote = this.saveBudgetKontoNote.bind(this);

        // DATEV-Buchungen aus Supabase laden statt aus JSON-Datei
        DataManager._loadBuchungenJSONOriginal = DataManager.loadBuchungenJSON;
        DataManager.loadBuchungenJSON = this.loadBuchungenFromSupabase.bind(this);

        DataManager._getDatevBuchungenOriginal = DataManager.getDatevBuchungen;
        DataManager.getDatevBuchungen = this.getDatevBuchungenFromCache.bind(this);

        // Cache für DATEV-Buchungen
        this.datevBuchungenCache = [];

        // NEU: Cache für getRechnungenMitStatus (vermeidet wiederholte DB-Abfragen)
        this.rechnungenCache = null;
        this.rechnungenCacheTime = null;
        this.CACHE_DURATION_MS = 30000; // 30 Sekunden Cache-Dauer

        // NEU: Suppliers-Cache
        this.suppliersCache = null;
        this.suppliersCacheTime = null;

        // NEU: Invoices-Cache
        this.invoicesCache = null;
        this.invoicesCacheTime = null;

        // Cache-Invalidierung Funktion global verfügbar machen
        DataManager.invalidateRechnungenCache = this.invalidateRechnungenCache.bind(this);

        console.log('✅ Supabase Data Adapter aktiviert');
    },

    /**
     * Cache für Rechnungen invalidieren
     * Aufrufen nach jeder Änderung (Update, Delete, etc.)
     */
    invalidateRechnungenCache: function() {
        console.log('🗑️ Rechnungen-Cache invalidiert');
        this.rechnungenCache = null;
        this.rechnungenCacheTime = null;
        this.invoicesCache = null;
        this.invoicesCacheTime = null;
    },

    /**
     * Prüft ob Cache noch gültig ist
     */
    isCacheValid: function(cacheTime) {
        if (!cacheTime) return false;
        return (Date.now() - cacheTime) < this.CACHE_DURATION_MS;
    },

    /**
     * Hilfsfunktion: Fügt updated_at und updated_by zu Update-Objekten hinzu
     * Wird bei allen Update-Operationen verwendet für Audit-Trail
     */
    /**
     * Hilfsfunktion: Holt die User-ID aus der users-Tabelle (nicht auth.users)
     * Die users-Tabelle hat eigene IDs, nicht die Supabase Auth UIDs
     */
    async getCurrentUserId() {
        try {
            const authUser = (await SupabaseService.client.auth.getUser()).data.user;
            if (!authUser?.email) return null;

            // Suche den User in der users-Tabelle anhand der Email
            const { data: dbUser } = await SupabaseService.client
                .from('users')
                .select('id')
                .eq('email', authUser.email)
                .single();

            return dbUser?.id || null;
        } catch (error) {
            console.warn('⚠️ Konnte User-ID nicht ermitteln:', error);
            return null;
        }
    },

    async addUpdateMetadata(updates) {
        try {
            const userId = await this.getCurrentUserId();
            return {
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: userId
            };
        } catch (error) {
            console.warn('⚠️ Konnte Update-Metadaten nicht hinzufügen:', error);
            return {
                ...updates,
                updated_at: new Date().toISOString()
            };
        }
    },

    /**
     * Hilfsfunktion: Fügt created_at und created_by zu neuen Datensätzen hinzu
     * Wird bei allen INSERT-Operationen verwendet für Audit-Trail
     */
    async addCreateMetadata(data) {
        try {
            const userId = await this.getCurrentUserId();
            return {
                ...data,
                created_at: new Date().toISOString(),
                created_by: userId
            };
        } catch (error) {
            console.warn('⚠️ Konnte Create-Metadaten nicht hinzufügen:', error);
            return {
                ...data,
                created_at: new Date().toISOString()
            };
        }
    },

    /**
     * Hilfsfunktion: Soft-Delete - markiert Datensatz als gelöscht statt ihn zu entfernen
     * Setzt deleted_at und deleted_by Felder
     * @param {string} table - Tabellenname
     * @param {string} id - Datensatz-ID
     * @param {string} idColumn - Name der ID-Spalte (default: 'id')
     * @returns {Promise<boolean>} - Erfolg
     */
    async softDelete(table, id, idColumn = 'id') {
        try {
            const userId = await this.getCurrentUserId();
            const { error } = await SupabaseService.client
                .from(table)
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: userId
                })
                .eq(idColumn, id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`⚠️ Soft-Delete fehlgeschlagen für ${table}:`, error);
            throw error;
        }
    },

    /**
     * Setzt den Kostentyp für eine DATEV-Buchung in Supabase
     * @param {string} rechnungId - ID der DATEV-Buchung
     * @param {string} kostentyp - Name des Kostentyps
     * @param {string} datum - Optionales Datum (ISO-Format)
     */
    async setKostentyp(rechnungId, kostentyp, datum = null) {
        try {
            const kostentypAm = kostentyp ? (datum || new Date().toISOString().split('T')[0]) : null;
            const userId = await this.getCurrentUserId();

            console.log('📝 Setze Kostentyp:', { rechnungId, kostentyp, kostentypAm });

            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .update({
                    kostentyp: kostentyp || null,
                    kostentyp_am: kostentypAm,
                    kostentyp_von: userId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', rechnungId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Kostentyp gespeichert:', data);

            // Cache invalidieren damit Änderungen sofort sichtbar sind
            this.invalidateRechnungenCache();
            // Auch DATEV-Buchungen-Cache invalidieren
            this.datevBuchungenCache = null;

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Setzen des Kostentyps:', error);
            // Fallback zu localStorage
            return DataManager._setKostentypOriginal(rechnungId, kostentyp, datum);
        }
    },

    /**
     * Setzt den Status für eine DATEV-Buchung in Supabase
     * @param {string} rechnungId - ID der DATEV-Buchung
     * @param {object} statusUpdate - Status-Update-Objekt
     */
    async setRechnungStatus(rechnungId, statusUpdate) {
        try {
            const userId = await this.getCurrentUserId();

            // Mapping von localStorage-Feldern zu Supabase-Feldern
            const supabaseUpdate = {
                updated_at: new Date().toISOString()
            };

            if (statusUpdate.kostentyp !== undefined) {
                supabaseUpdate.kostentyp = statusUpdate.kostentyp;
            }
            if (statusUpdate.kostentypAm !== undefined) {
                supabaseUpdate.kostentyp_am = statusUpdate.kostentypAm;
                supabaseUpdate.kostentyp_von = userId;
            }
            if (statusUpdate.status !== undefined) {
                supabaseUpdate.workflow_status = statusUpdate.status;
            }
            if (statusUpdate.kontrolliertVon !== undefined || statusUpdate.kontrolliertAm !== undefined) {
                supabaseUpdate.kontrolliert_von = userId;
                supabaseUpdate.kontrolliert_am = statusUpdate.kontrolliertAm || new Date().toISOString().split('T')[0];
            }
            if (statusUpdate.bezahltAm !== undefined) {
                supabaseUpdate.bezahlt_am = statusUpdate.bezahltAm;
            }
            if (statusUpdate.notizen !== undefined) {
                supabaseUpdate.notizen = statusUpdate.notizen;
            }

            console.log('📝 Setze Rechnungsstatus:', { rechnungId, supabaseUpdate });

            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .update(supabaseUpdate)
                .eq('id', rechnungId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Status gespeichert:', data);

            // Cache invalidieren damit Änderungen sofort sichtbar sind
            this.invalidateRechnungenCache();
            // Auch DATEV-Buchungen-Cache invalidieren
            this.datevBuchungenCache = null;

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Setzen des Status:', error);
            // Fallback zu localStorage
            return DataManager._setRechnungStatusOriginal(rechnungId, statusUpdate);
        }
    },

    /**
     * DATEV-Buchungen aus Supabase laden
     * Ersetzt loadBuchungenJSON() - lädt aus datev_bookings Tabelle
     * Reichert Buchungen mit Lieferantennamen aus suppliers-Tabelle an
     */
    async loadBuchungenFromSupabase(jahr = null) {
        try {
            console.log('📤 Lade DATEV-Buchungen aus Supabase...');

            // Alle Buchungen mit Pagination laden (Supabase Standard-Limit ist 1000)
            let allBookings = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await SupabaseService.client
                    .from('datev_bookings')
                    .select('*')
                    .or('archived.is.null,archived.eq.false')
                    .order('datum', { ascending: false })
                    .range(from, from + pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allBookings = allBookings.concat(data);
                    from += pageSize;
                    hasMore = data.length === pageSize;
                    console.log(`📊 ${allBookings.length} Buchungen geladen...`);
                } else {
                    hasMore = false;
                }
            }

            console.log(`✅ Insgesamt ${allBookings.length} DATEV-Buchungen geladen`);

            // Lieferanten laden
            const suppliersResult = await SupabaseService.client
                .from('suppliers')
                .select('partita_iva, fornitore_name');

            const bookingsResult = { data: allBookings, error: null };

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
                    // MwSt-Satz aus DB oder Default 22%
                    mwstRate: b.mwst_rate !== null && b.mwst_rate !== undefined ? parseFloat(b.mwst_rate) : 22,
                    // Berechnung: Netto = betrag, MwSt und Brutto werden berechnet
                    betragNetto: parseFloat(b.betrag) || 0,
                    betragMwst: (() => {
                        const netto = parseFloat(b.betrag) || 0;
                        const rate = b.mwst_rate !== null && b.mwst_rate !== undefined ? parseFloat(b.mwst_rate) : 22;
                        return netto * (rate / 100);
                    })(),
                    betragGesamt: (() => {
                        const netto = parseFloat(b.betrag) || 0;
                        const rate = b.mwst_rate !== null && b.mwst_rate !== undefined ? parseFloat(b.mwst_rate) : 22;
                        return netto * (1 + rate / 100);
                    })(),
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
                    bezahltAm: b.bezahlt_am || b.paid_at || null,
                    bezahltVon: b.paid_by || null,
                    abgabestelle: b.abgabestelle || null,
                    abgabestelleAm: b.abgabestelle_am || null,
                    // Kostentyp-Felder aus Supabase
                    kostentyp: b.kostentyp || '',
                    kostentypAm: b.kostentyp_am || null,
                    kostentypVon: b.kostentyp_von || null,
                    notizen: b.notizen || '',
                    // Änderungsdatum
                    updatedAt: b.updated_at || null,
                    // Audit-Felder für User-Tracking
                    created_at: b.created_at || null,
                    created_by: b.created_by || null,
                    updated_at: b.updated_at || null,
                    updated_by: b.updated_by || null,
                    // Supabase-spezifisch
                    // Bei fehlender dokumentNr: id:-Format verwenden für zuverlässige Identifikation
                    rechnungId: b.dokument_nr ? `${b.partita_iva || ''}_${b.dokument_nr}` : `id:${b.id}`,
                    importYear: b.import_year,
                    linkedInvoiceId: b.linked_invoice_id
                };
            });

            console.log(`✅ ${this.datevBuchungenCache.length} DATEV-Buchungen aus Supabase geladen`);

            // Kompatibilitäts-Objekt zurückgeben (NICHT in localStorage speichern - zu groß!)
            const compatData = {
                buchungen: this.datevBuchungenCache,
                lieferanten: [],
                projekte: {},
                lastUpdate: new Date().toISOString()
            };

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
     * Cache invalidieren - erzwingt Neuladen der Daten bei nächstem Aufruf
     */
    invalidateCache() {
        console.log('🔄 Cache invalidiert');
        this.datevBuchungenCache = [];
        this._rechnungenMitStatusCache = null;
    },

    /**
     * PROJEKT-FUNKTIONEN
     */

    async getProjects() {
        try {
            const { data, error } = await SupabaseService.client
                .from('projects')
                .select('*')
                .is('deleted_at', null)  // Soft-Delete Filter
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
            let supabaseProject = {
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
                pl3: projectData.pl3 || null,
                dropbox_link: projectData.dropboxLink || null,
                hide_in_reporting: projectData.hideInReporting || false
            };

            // Audit-Trail: created_at und created_by hinzufügen
            supabaseProject = await this.addCreateMetadata(supabaseProject);

            const { data, error } = await SupabaseService.client
                .from('projects')
                .insert([supabaseProject])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Projekt erstellt:', data);
            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Projekts:', error);
            // Fehler werfen statt stillschweigend fallback
            throw error;
        }
    },

    async updateProject(projectId, updates) {
        try {
            let supabaseUpdates = {
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
                pl3: updates.pl3 || null,
                dropbox_link: updates.dropboxLink || null,
                hide_in_reporting: updates.hideInReporting || false
            };

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

            console.log('📝 Projekt Update:', projectId, supabaseUpdates);

            const { data, error } = await SupabaseService.client
                .from('projects')
                .update(supabaseUpdates)
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Projekt aktualisiert:', data);
            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Projekts:', error);
            // Fehler werfen statt stillschweigend fallback
            throw error;
        }
    },

    async deleteProject(projectId) {
        try {
            // Soft-Delete: Projekt als gelöscht markieren statt entfernen
            await this.softDelete('projects', projectId);
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
            let supabaseCost = {
                project_id: costData.projectId,
                category: this.mapCategoryToSupabase(costData.category),
                description: costData.description || costData.supplier || 'Kosten',
                amount: parseFloat(costData.amount) || 0,
                cost_type: (costData.type === 'effektiv' || costData.type === 'ist') ? 'IST' : 'Provisorisch',
                date: costData.date || new Date().toISOString().split('T')[0],
                supplier: costData.supplier || null,
                invoice_number: costData.invoiceNumber || null,
                file_path: costData.filePath || null
            };

            // Audit-Trail: created_at und created_by hinzufügen
            supabaseCost = await this.addCreateMetadata(supabaseCost);

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
            let supabaseUpdates = {
                category: this.mapCategoryToSupabase(updates.category),
                description: updates.description,
                amount: parseFloat(updates.amount),
                cost_type: (updates.type === 'effektiv' || updates.type === 'ist') ? 'IST' : 'Provisorisch',
                date: updates.date,
                supplier: updates.supplier,
                invoice_number: updates.invoiceNumber,
                file_path: updates.filePath !== undefined ? updates.filePath : undefined
            };

            // undefined Werte entfernen (damit sie nicht als null gespeichert werden)
            Object.keys(supabaseUpdates).forEach(key =>
                supabaseUpdates[key] === undefined && delete supabaseUpdates[key]
            );

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

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
            // Soft-Delete: Kosten als gelöscht markieren statt entfernen
            await this.softDelete('costs', costId);
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
            pl3: supabaseProject.pl3 || '',
            dropboxLink: supabaseProject.dropbox_link || '',
            hideInReporting: supabaseProject.hide_in_reporting || false,
            // Audit-Felder für User-Tracking
            createdBy: supabaseProject.created_by,
            createdAt: supabaseProject.created_at,
            created_by: supabaseProject.created_by,
            created_at: supabaseProject.created_at,
            updated_by: supabaseProject.updated_by,
            updated_at: supabaseProject.updated_at
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
            createdAt: supabaseCost.created_at,
            // Audit-Felder für User-Tracking
            created_by: supabaseCost.created_by,
            created_at: supabaseCost.created_at,
            updated_by: supabaseCost.updated_by,
            updated_at: supabaseCost.updated_at
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
            const currentUser = (await SupabaseService.client.auth.getUser()).data.user;
            let supabaseInvoice = {
                file_name: invoiceData.fileName,
                file_path: invoiceData.filePath,
                file_size: invoiceData.fileSize,
                partita_iva: invoiceData.partitaIva,
                invoice_number: invoiceData.invoiceNumber,
                status: invoiceData.status || 'uploaded',
                datev_buchung_id: invoiceData.datevBuchungId || null,
                uploaded_by: currentUser?.id,
                // Audit-Trail: created_at und created_by
                created_at: new Date().toISOString(),
                created_by: currentUser?.id || null
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
            const authResult = await SupabaseService.client.auth.getUser();
            const currentUser = authResult.data.user;
            const now = new Date().toISOString();

            // Debug: Zeige User-Info
            console.log('🔐 updateInvoiceStatus - Auth Result:', {
                invoiceId,
                newStatus,
                userId: currentUser?.id,
                userEmail: currentUser?.email,
                authError: authResult.error
            });

            let updates = {
                status: newStatus,
                // Audit-Trail: updated_at und updated_by
                updated_at: now,
                updated_by: currentUser?.id || null
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
            let updates = { kostentyp: kostentyp };
            // Audit-Trail: updated_at und updated_by hinzufügen
            updates = await this.addUpdateMetadata(updates);

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update(updates)
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
                .or('archived.is.null,archived.eq.false')  // Nur nicht-archivierte
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
            // CACHE-CHECK: Wenn Cache gültig, direkt zurückgeben (MASSIVE Performance-Verbesserung)
            if (this.rechnungenCache && this.isCacheValid(this.rechnungenCacheTime)) {
                console.log('⚡ Rechnungen aus Cache geladen (noch ' +
                    Math.round((this.CACHE_DURATION_MS - (Date.now() - this.rechnungenCacheTime)) / 1000) + 's gültig)');
                return this.rechnungenCache;
            }

            console.log('🔄 Lade Rechnungen von Supabase...');
            const startTime = Date.now();

            // 1. DATEV-Buchungen aus Supabase holen (NICHT aus JSON!)
            // Erst aus Cache oder neu laden
            if (!this.datevBuchungenCache || this.datevBuchungenCache.length === 0) {
                await this.loadBuchungenFromSupabase();
            }
            const datevBuchungen = this.datevBuchungenCache || [];

            // 2. Supabase Invoices holen (mit Cache)
            let supabaseInvoices;
            if (this.invoicesCache && this.isCacheValid(this.invoicesCacheTime)) {
                supabaseInvoices = this.invoicesCache;
            } else {
                supabaseInvoices = await this.getInvoices();
                this.invoicesCache = supabaseInvoices;
                this.invoicesCacheTime = Date.now();
            }

            // 3. Suppliers laden für Namen-Anreicherung (mit Cache)
            let suppliers;
            if (this.suppliersCache && this.isCacheValid(this.suppliersCacheTime)) {
                suppliers = this.suppliersCache;
            } else {
                const { data: suppliersData, error: supplierError } = await SupabaseService.client
                    .from('suppliers')
                    .select('partita_iva, fornitore_name');

                if (supplierError) {
                    console.warn('⚠️ Konnte Lieferanten nicht laden:', supplierError);
                }
                suppliers = suppliersData || [];
                this.suppliersCache = suppliers;
                this.suppliersCacheTime = Date.now();
            }

            const supplierMap = new Map();
            suppliers.forEach(s => {
                supplierMap.set(s.partita_iva, s.fornitore_name);
            });
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

                // ALLE verknüpften Invoices für diese Buchung finden (unterstützt mehrere PDFs)
                let matchingInvoices = [];

                // 1. Suche via linked_booking_id (neue Methode - 1:n Beziehung)
                // WICHTIG: String-Vergleich für zuverlässiges Matching (Typen können variieren)
                const buchungIdStr = String(buchung.id);
                const linkedByBookingId = supabaseInvoices.filter(inv =>
                    inv.linked_booking_id && String(inv.linked_booking_id) === buchungIdStr
                );
                matchingInvoices.push(...linkedByBookingId);

                if (linkedByBookingId.length > 0) {
                    console.log(`📎 Buchung ${buchung.id}: ${linkedByBookingId.length} PDFs via linked_booking_id gefunden`);
                }

                // 2. Suche via linked_invoice_id (alte Methode - Rückwärtskompatibilität)
                if (buchung.linkedInvoiceId) {
                    const linkedByInvoiceId = supabaseInvoices.find(inv => inv.id === buchung.linkedInvoiceId);
                    if (linkedByInvoiceId && !matchingInvoices.some(m => m.id === linkedByInvoiceId.id)) {
                        matchingInvoices.push(linkedByInvoiceId);
                    }
                }

                // 3. IMMER auch über Partita IVA + Dokumentnr. suchen (für Rechnungen mit mehreren DATEV-Zeilen)
                // So wird das PDF bei ALLEN Zeilen mit gleicher Rechnungsnummer angezeigt
                if (buchung.dokumentNr && buchung.dokumentNr.trim() !== '') {
                    const matchedByPartita = supabaseInvoices.filter(inv => {
                        // Bereits gefunden? Überspringen
                        if (matchingInvoices.some(m => m.id === inv.id)) return false;

                        // Partita IVA muss übereinstimmen
                        if (inv.partita_iva !== buchung.partitaIva) return false;

                        // Invoice muss auch eine Rechnungsnummer haben
                        if (!inv.invoice_number || inv.invoice_number.trim() === '') return false;

                        // Exakter Match
                        if (inv.invoice_number === buchung.dokumentNr) return true;

                        // Normalisierter Match (ohne "/" Prefix)
                        const invDocNrNorm = normalizeDocNr(inv.invoice_number);
                        return invDocNrNorm === buchungDocNrNorm;
                    });
                    matchingInvoices.push(...matchedByPartita);
                }

                // Lieferantenname: Priorität 1. aus verknüpfter Invoice, 2. aus suppliers-Tabelle, 3. aus DATEV-Buchung
                const supplierName = supplierMap.get(buchung.partitaIva);

                // Alle gefundenen Invoices als gematcht markieren
                matchingInvoices.forEach(inv => matchedInvoiceIds.add(inv.id));

                if (matchingInvoices.length > 0) {
                    // Erstes PDF für Rückwärtskompatibilität (invoiceId, filePath, etc.)
                    const firstInvoice = matchingInvoices[0];
                    // Lieferantenname aus Invoice hat Priorität (wenn manuell gesetzt)
                    const enrichedFornitoreName = firstInvoice.fornitore_name || supplierName || buchung.fornitoreName;
                    // workflowStatus: Invoice-Status hat Priorität, dann DATEV-Status, dann 'neu'
                    // Nur gültige Status-Werte akzeptieren
                    const validStatuses = ['neu', 'kontrolliert', 'bezahlt'];
                    let effectiveWorkflowStatus = 'neu';
                    if (firstInvoice.status && validStatuses.includes(firstInvoice.status)) {
                        effectiveWorkflowStatus = firstInvoice.status;
                    } else if (buchung.workflowStatus && validStatuses.includes(buchung.workflowStatus)) {
                        effectiveWorkflowStatus = buchung.workflowStatus;
                    }
                    return {
                        ...buchung,
                        fornitoreName: enrichedFornitoreName,
                        // workflowStatus aus Invoice überschreiben (für Filter)
                        workflowStatus: effectiveWorkflowStatus,
                        // WICHTIG: Dies ist eine DATEV-Buchung, nicht nur Invoice
                        isSupabaseOnly: false,
                        // WICHTIG: buchung.id beibehalten (DATEV-Buchungs-ID), invoiceId ist PDF-ID
                        invoiceId: firstInvoice.id,
                        filePath: firstInvoice.file_path,
                        fileName: firstInvoice.file_name,
                        uploadedAt: firstInvoice.created_at,
                        pdfExists: true,
                        status: firstInvoice.status,
                        notes: firstInvoice.notes,
                        kostentyp: firstInvoice.kostentyp || '',
                        funding_source_id: firstInvoice.funding_source_id,
                        // NEU: Array mit allen verknüpften PDFs
                        linkedInvoices: matchingInvoices.map(inv => ({
                            id: inv.id,
                            filePath: inv.file_path,
                            fileName: inv.file_name,
                            uploadedAt: inv.created_at
                        })),
                        pdfCount: matchingInvoices.length,
                        // Audit-Felder: Invoice hat Priorität (da dort Status-Updates erfolgen)
                        updated_at: firstInvoice.updated_at || buchung.updated_at,
                        updated_by: firstInvoice.updated_by || buchung.updated_by,
                        created_at: buchung.created_at || firstInvoice.created_at,
                        created_by: buchung.created_by || firstInvoice.created_by
                    };
                }

                // Keine verknüpfte Invoice: Lieferantenname aus suppliers-Tabelle oder DATEV-Buchung
                const fallbackFornitoreName = supplierName || buchung.fornitoreName;
                return {
                    ...buchung,
                    // WICHTIG: Dies ist eine DATEV-Buchung, nicht nur Invoice
                    isSupabaseOnly: false,
                    fornitoreName: fallbackFornitoreName,
                    linkedInvoices: [],
                    pdfCount: 0,
                    // Überschreibe alte pdfExists aus buchungen.json - nur true wenn Supabase-Invoice existiert
                    pdfExists: false
                };
            });

            // 4. Nicht-gematchte Supabase Invoices als eigene Zeilen hinzufügen
            // WICHTIG: Invoices mit linked_booking_id sind IMMER verknüpft und sollten NICHT als separate Zeilen erscheinen
            const unmatchedInvoices = supabaseInvoices
                .filter(inv => !matchedInvoiceIds.has(inv.id) && !inv.linked_booking_id)
                .map(inv => {
                    // IMMER aus Dateiname parsen für korrekte Trennung von Partita IVA und Rechnungsnr.
                    const parsed = this.parseInvoiceFilename(inv.file_name);
                    const partitaIva = parsed.partitaIva || inv.partita_iva;
                    const dokumentNr = parsed.invoiceNumber || inv.invoice_number;

                    // Lieferantenname: Priorität 1. aus Invoice-Tabelle, 2. aus suppliers-Tabelle via Partita IVA
                    // Debug: Erste paar Einträge prüfen
                    if (supplierMap.size > 0 && !supplierMap.has(partitaIva)) {
                        const sampleKeys = Array.from(supplierMap.keys()).slice(0, 3);
                        console.log(`🔍 Suche Lieferant für ${partitaIva}, Beispiel-Keys in Map: ${sampleKeys.join(', ')}`);
                    }
                    const supplierName = inv.fornitore_name || (partitaIva ? supplierMap.get(partitaIva) : null);
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
                        // workflowStatus: Priorität 1. workflow_status Spalte, 2. status Fallback
                        workflowStatus: inv.workflow_status || (['neu', 'kontrolliert', 'bezahlt'].includes(inv.status) ? inv.status : 'neu'),
                        kontrolledAt: inv.kontrolled_at,
                        kontrolledBy: inv.kontrolled_by,
                        paidAt: inv.paid_at,
                        paidBy: inv.paid_by,
                        notes: inv.notes,
                        kostentyp: inv.kostentyp || '',
                        funding_source_id: inv.funding_source_id,

                        // Fehlende DATEV-Daten - verwende created_at als Datum-Fallback
                        projektId: null,
                        projektName: '(Kein DATEV-Projekt)',
                        fornitoreName: fornitoreName,
                        buchungsdatum: inv.created_at ? inv.created_at.split('T')[0] : null,
                        belegdatum: inv.created_at ? inv.created_at.split('T')[0] : null,
                        datum: inv.created_at ? inv.created_at.split('T')[0] : null,
                        betrag: inv.amount || 0,
                        konto: null,

                        // UI-Flags
                        isSupabaseOnly: true,
                        // rechnungId für Supabase-only: nur die Invoice-ID (für Archivierung etc.)
                        rechnungId: String(inv.id),
                        // Audit-Felder für User-Tracking
                        created_at: inv.created_at || null,
                        created_by: inv.created_by || null,
                        updated_at: inv.updated_at || null,
                        updated_by: inv.updated_by || null
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

            const loadTime = Date.now() - startTime;
            console.log(`📊 Rechnungen kombiniert: ${datevBuchungen.length} DATEV + ${unmatchedInvoices.length} nur Supabase = ${combined.length} gesamt (${loadTime}ms)`);

            // Cache speichern für nächste Aufrufe
            this.rechnungenCache = combined;
            this.rechnungenCacheTime = Date.now();
            console.log('💾 Rechnungen gecached für ' + (this.CACHE_DURATION_MS / 1000) + ' Sekunden');

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
            // NEU: contact_user_id für Ansprechperson bei Rechnungskontrolle
            return (data || []).map(s => ({
                partitaIva: s.partita_iva,
                name: s.fornitore_name,
                fornitoreNr: s.fornitore_nr,
                address: s.address,
                city: s.city,
                country: s.country,
                contactUserId: s.contact_user_id || null,
                // Audit-Felder für User-Tracking
                created_at: s.created_at || null,
                created_by: s.created_by || null,
                updated_at: s.updated_at || null,
                updated_by: s.updated_by || null
            }));

        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            // Fallback auf alte Funktion
            return DataManager._getDatevLieferantenOriginal ?
                DataManager._getDatevLieferantenOriginal() : [];
        }
    },

    /**
     * Aktualisiert einen Lieferanten (z.B. Ansprechperson setzen)
     */
    async updateSupplier(partitaIva, updates) {
        try {
            let supabaseUpdates = {};

            if (updates.name !== undefined) supabaseUpdates.fornitore_name = updates.name;
            if (updates.fornitoreNr !== undefined) supabaseUpdates.fornitore_nr = updates.fornitoreNr;
            if (updates.address !== undefined) supabaseUpdates.address = updates.address;
            if (updates.city !== undefined) supabaseUpdates.city = updates.city;
            if (updates.country !== undefined) supabaseUpdates.country = updates.country;
            if (updates.contactUserId !== undefined) supabaseUpdates.contact_user_id = updates.contactUserId;

            // Audit-Trail hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

            const { data, error } = await SupabaseService.client
                .from('suppliers')
                .update(supabaseUpdates)
                .eq('partita_iva', partitaIva)
                .select()
                .single();

            if (error) throw error;

            return {
                partitaIva: data.partita_iva,
                name: data.fornitore_name,
                fornitoreNr: data.fornitore_nr,
                address: data.address,
                city: data.city,
                country: data.country,
                contactUserId: data.contact_user_id || null
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Lieferanten:', error);
            throw error;
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
            // Wenn userId übergeben wird, diese verwenden, sonst aktuellen User
            let userId = entryData.userId;
            if (!userId) {
                const user = await Auth.getCurrentUser();
                userId = user?.id || null;
            }

            const supabaseEntry = {
                project_id: entryData.projectId,
                user_id: userId,
                date: entryData.date,
                hours: entryData.hours,
                description: entryData.description || '',
                activity_type: entryData.activityType || null,
                created_at: new Date().toISOString()
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
            let supabaseUpdates = {
                project_id: updates.projectId,
                user_id: updates.userId,
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

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

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
            // Soft-Delete: Zeiteintrag als gelöscht markieren statt entfernen
            await this.softDelete('time_entries', id);
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
            createdAt: supabaseEntry.created_at,
            // Audit-Felder für User-Tracking
            created_by: supabaseEntry.created_by,
            created_at: supabaseEntry.created_at,
            updated_by: supabaseEntry.updated_by,
            updated_at: supabaseEntry.updated_at
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
                .is('deleted_at', null)  // Soft-Delete Filter
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

            let insertData = {
                id: newId,
                name: costTypeData.name,
                description: costTypeData.description || costTypeData.name,
                is_active: true
            };

            // Audit-Trail: created_at und created_by hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            const { data, error } = await SupabaseService.client
                .from('cost_types')
                .insert([insertData])
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
            let supabaseUpdates = {
                name: updates.name,
                description: updates.description,
                is_active: updates.active
            };

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

            const { data, error } = await SupabaseService.client
                .from('cost_types')
                .update(supabaseUpdates)
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
            // Soft-Delete: Kostentyp als gelöscht markieren statt entfernen
            await this.softDelete('cost_types', id);

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
                .select('id, username, email, role, hourly_rate, auth_id, user_type')
                .order('username', { ascending: true });

            if (error) throw error;

            this.usersCache = (data || []).map(u => ({
                id: u.id,
                auth_id: u.auth_id,  // Supabase Auth User ID
                name: u.username || u.email,
                email: u.email,
                role: u.role || 'user',
                hourlyRate: parseFloat(u.hourly_rate) || 0,
                userType: u.user_type || 'intern'  // 'intern' oder 'extern'
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
            let supabaseUpdates = {};
            if (updates.hourlyRate !== undefined) {
                supabaseUpdates.hourly_rate = updates.hourlyRate;
            }
            if (updates.name !== undefined) {
                supabaseUpdates.username = updates.name;
            }
            if (updates.role !== undefined) {
                supabaseUpdates.role = updates.role;
            }
            if (updates.userType !== undefined) {
                supabaseUpdates.user_type = updates.userType;
            }

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

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
                name: data.username || data.email,
                email: data.email,
                role: data.role || 'user',
                hourlyRate: parseFloat(data.hourly_rate) || 0,
                userType: data.user_type || 'intern'
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Benutzers:', error);
            throw error;
        }
    },

    /**
     * Neuen Benutzer anlegen (ohne Supabase Auth - nur in users Tabelle)
     * Für externe Mitarbeiter die keinen Login brauchen
     */
    async addUser(userData) {
        try {
            // Nur die Felder die in der users Tabelle existieren
            const insertData = {
                username: userData.name,
                email: userData.email || `${userData.name.toLowerCase().replace(/\s+/g, '.')}@extern.local`,
                password_hash: 'EXTERN_NO_LOGIN',  // Dummy-Wert, externe User loggen sich nicht ein
                role: userData.role === 'admin' ? 'Admin' : 'Mitarbeiter',
                hourly_rate: userData.hourlyRate || 0,
                user_type: userData.userType || 'extern'
            };

            console.log('Versuche User anzulegen mit:', insertData);

            const { data, error } = await SupabaseService.client
                .from('users')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Supabase Error Details:', error);
                throw new Error(error.message || 'Fehler beim Anlegen');
            }

            // Cache invalidieren
            await this.loadUsersFromSupabase();

            console.log('Neuer Benutzer angelegt:', data);

            return {
                id: data.id,
                name: data.username || data.email,
                email: data.email,
                role: data.role || 'user',
                hourlyRate: parseFloat(data.hourly_rate) || 0,
                userType: data.user_type || 'extern'
            };
        } catch (error) {
            console.error('Fehler beim Anlegen des Benutzers:', error);
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
                .is('deleted_at', null)  // Soft-Delete Filter
                .order('code', { ascending: true });

            if (year) {
                query = query.eq('year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            this.fundingSourcesCache = data.map(fs => ({
                id: fs.id,
                code: fs.code,
                name: fs.name,
                source: fs.source,
                amount: parseFloat(fs.amount) || 0,
                year: fs.year,
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
                .is('deleted_at', null)  // Soft-Delete Filter
                .single();

            if (error) throw error;

            return {
                id: data.id,
                code: data.code,
                name: data.name,
                source: data.source,
                amount: parseFloat(data.amount) || 0,
                year: data.year,
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
            // Jahr validieren - muss eine gültige Zahl sein
            let fiscalYear = fundingSource.year;
            if (!fiscalYear || isNaN(fiscalYear)) {
                fiscalYear = new Date().getFullYear();
            }
            console.log('addFundingSource - year:', fiscalYear);

            let insertData = {
                code: fundingSource.code,
                name: fundingSource.name,
                source: fundingSource.source || null,
                amount: fundingSource.amount || 0,
                year: fiscalYear,
                is_abgabestelle: fundingSource.isAbgabestelle || false,
                status: fundingSource.status || 'offen',
                notes: fundingSource.notes || null,
                document_path: fundingSource.documentPath || null
            };

            // Audit-Trail: created_at und created_by hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            const { data, error } = await SupabaseService.client
                .from('funding_sources')
                .insert(insertData)
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
                year: data.year,
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
            let supabaseUpdates = {};
            if (updates.code !== undefined) supabaseUpdates.code = updates.code;
            if (updates.name !== undefined) supabaseUpdates.name = updates.name;
            if (updates.source !== undefined) supabaseUpdates.source = updates.source;
            if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount;
            if (updates.year !== undefined) supabaseUpdates.year = updates.year;
            if (updates.isAbgabestelle !== undefined) supabaseUpdates.is_abgabestelle = updates.isAbgabestelle;
            if (updates.status !== undefined) supabaseUpdates.status = updates.status;
            if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
            if (updates.documentPath !== undefined) supabaseUpdates.document_path = updates.documentPath;

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

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
                year: data.year,
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
            // Soft-Delete: Einnahme als gelöscht markieren statt entfernen
            await this.softDelete('funding_sources', id);

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
                query = query.eq('year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map(fs => ({
                id: fs.id,
                code: fs.code,
                name: fs.name,
                source: fs.source,
                amount: parseFloat(fs.amount) || 0,
                year: fs.year,
                label: `${fs.code} ${fs.name}` // Für Dropdown-Anzeige
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Abgabestellen:', error);
            return [];
        }
    },

    /**
     * Berechnet die Ausgaben für eine Funding Source
     * Sucht nach:
     * 1. Buchungen in datev_bookings mit abgabestelle = 'funding:ID'
     * 2. Unverknüpfte PDFs in invoices mit funding_source_id = ID
     */
    async getFundingSourceExpenses(fundingSourceId) {
        try {
            const abgabestelleValue = `funding:${fundingSourceId}`;
            let allInvoices = [];
            let totalBrutto = 0;

            // 1. DATEV-Buchungen mit dieser Abgabestelle
            const { data: datevData, error: datevError } = await SupabaseService.client
                .from('datev_bookings')
                .select('id, betrag, fornitore_name, dokument_nr, datum')
                .eq('abgabestelle', abgabestelleValue);

            if (datevError) {
                console.error('Fehler beim Laden der DATEV-Buchungen:', datevError);
            } else if (datevData) {
                datevData.forEach(b => {
                    const betrag = Math.abs(parseFloat(b.betrag) || 0);
                    totalBrutto += betrag;
                    allInvoices.push({
                        id: b.id,
                        betrag_netto: betrag * 0.82,
                        betrag_gesamt: betrag,
                        lieferant_name: b.fornitore_name,
                        dokument_nr: b.dokument_nr,
                        datum: b.datum,
                        source: 'datev'
                    });
                });
            }

            // 2. Unverknüpfte PDFs (invoices ohne linked_booking_id) mit dieser funding_source_id
            const { data: invoiceData, error: invoiceError } = await SupabaseService.client
                .from('invoices')
                .select('id, file_name, created_at, amount')
                .eq('funding_source_id', fundingSourceId)
                .is('linked_booking_id', null);

            if (invoiceError) {
                console.error('Fehler beim Laden der unverknüpften Invoices:', invoiceError);
            } else if (invoiceData) {
                invoiceData.forEach(inv => {
                    // Unverknüpfte PDFs haben normalerweise keinen Betrag - aber falls doch
                    const betrag = Math.abs(parseFloat(inv.amount) || 0);
                    totalBrutto += betrag;
                    allInvoices.push({
                        id: inv.id,
                        betrag_netto: betrag * 0.82,
                        betrag_gesamt: betrag,
                        lieferant_name: inv.file_name || 'PDF',
                        dokument_nr: '-',
                        datum: inv.created_at ? inv.created_at.split('T')[0] : null,
                        source: 'invoice'
                    });
                });
            }

            // Netto schätzen (ca. 82% von Brutto bei 22% MwSt in Italien)
            const totalNetto = totalBrutto * 0.82;

            return {
                count: allInvoices.length,
                totalNetto,
                totalBrutto,
                invoices: allInvoices
            };
        } catch (error) {
            console.error('Fehler beim Berechnen der Ausgaben:', error);
            return { count: 0, totalNetto: 0, totalBrutto: 0, invoices: [] };
        }
    },

    /**
     * Aktualisiert die Abgabestelle einer Rechnung
     */
    async updateInvoiceFundingSource(invoiceId, fundingSourceId) {
        try {
            let updates = { funding_source_id: fundingSourceId };
            // Audit-Trail: updated_at und updated_by hinzufügen
            updates = await this.addUpdateMetadata(updates);

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update(updates)
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
            let insertData = {
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
            };

            // Audit-Trail: created_at und created_by hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            const { data, error } = await SupabaseService.client
                .from('members')
                .insert(insertData)
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
            let supabaseUpdates = {};

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

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

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
     * Löscht ein Mitglied (Soft-Delete)
     */
    async deleteMember(id) {
        try {
            // Soft-Delete: Mitglied als gelöscht markieren statt entfernen
            await this.softDelete('members', id);
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
            let insertData = {
                member_id: paymentData.member_id,
                year: paymentData.year,
                amount: paymentData.amount,
                payment_date: paymentData.payment_date,
                datev_buchung_id: paymentData.datev_buchung_id,
                datev_buchungstext: paymentData.datev_buchungstext,
                notes: paymentData.notes
            };

            // Audit-Trail: created_at und created_by hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            const { data, error } = await SupabaseService.client
                .from('member_payments')
                .upsert(insertData, {
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
     * Löscht eine Zahlung (Soft-Delete)
     */
    async deleteMemberPayment(paymentId) {
        try {
            // Soft-Delete: Zahlung als gelöscht markieren statt entfernen
            await this.softDelete('member_payments', paymentId);
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
                    access_dashboard: workspace.access_dashboard || 'none',
                    access_projekte: workspace.access_projekte || 'none',
                    access_rechnungen: workspace.access_rechnungen || 'none',
                    access_bewegungen: workspace.access_bewegungen || 'none',
                    access_lieferanten: workspace.access_lieferanten || 'none',
                    access_mitglieder: workspace.access_mitglieder || 'none',
                    access_einnahmen: workspace.access_einnahmen || 'none',
                    access_konfiguration: workspace.access_konfiguration || 'none',
                    access_zeiterfassung: workspace.access_zeiterfassung || 'none',
                    access_inventar: workspace.access_inventar || 'none',
                    access_reporting: workspace.access_reporting || 'none',
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
            // ENUM-Werte: 'none', 'read', 'write', 'delete'
            let supabaseUpdates = {
                name: updates.name,
                description: updates.description,
                access_dashboard: updates.access_dashboard || 'none',
                access_projekte: updates.access_projekte || 'none',
                access_rechnungen: updates.access_rechnungen || 'none',
                access_rechnungen_bezahlt: updates.access_rechnungen_bezahlt || false,
                access_bewegungen: updates.access_bewegungen || 'none',
                access_lieferanten: updates.access_lieferanten || 'none',
                access_mitglieder: updates.access_mitglieder || 'none',
                access_einnahmen: updates.access_einnahmen || 'none',
                access_konfiguration: updates.access_konfiguration || 'none',
                access_inventar: updates.access_inventar || 'none',
                access_reporting: updates.access_reporting || 'none',
                rechnungen_nur_zugewiesene: updates.rechnungen_nur_zugewiesene || false,
                is_active: updates.is_active !== undefined ? updates.is_active : true
            };

            // Zeiterfassung ist TEXT (nicht ENUM) - nur hinzufügen wenn Migration ausgeführt wurde
            if (updates.access_zeiterfassung !== undefined) {
                supabaseUpdates.access_zeiterfassung = updates.access_zeiterfassung || 'none';
            }

            // Nur updated_at setzen (updated_by existiert nicht in workspaces Tabelle)
            supabaseUpdates.updated_at = new Date().toISOString();

            const { data, error } = await SupabaseService.client
                .from('workspaces')
                .update(supabaseUpdates)
                .eq('id', workspaceId)
                .select()
                .single();

            if (error) {
                console.error('❌ Workspace Update Fehler:', error.message, error.details, error.hint);
                throw error;
            }

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
     * Berechtigungslevel-Konstanten
     * none = kein Zugriff, read = nur lesen, write = bearbeiten, delete = löschen
     */
    PERMISSION_LEVELS: {
        none: 0,
        read: 1,
        write: 2,
        delete: 3
    },

    /**
     * Lädt die Berechtigungen des aktuellen Users
     * Aggregiert aus allen zugewiesenen Workspaces (höchste Stufe gewinnt)
     * Unterstützt 3-stufige Berechtigungen: 'none', 'read', 'write'
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
                        access_zeiterfassung,
                        access_inventar,
                        access_reporting,
                        rechnungen_nur_zugewiesene,
                        is_active
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Wenn keine Workspaces zugewiesen, KEIN Zugriff (Benutzer muss einem Workspace zugewiesen sein)
            if (!data || data.length === 0) {
                console.log('Kein Workspace zugewiesen - kein Zugriff');
                return this.getDefaultPermissions();
            }

            // Hilfsfunktion: Aggregiert zwei Berechtigungslevel (höchste Stufe gewinnt)
            const aggregateLevel = (current, newLevel) => {
                const levels = this.PERMISSION_LEVELS;
                const levelNames = ['none', 'read', 'write', 'delete'];
                // Konvertiere zu Nummer falls nötig (Abwärtskompatibilität für boolean)
                const currentNum = typeof current === 'boolean'
                    ? (current ? 3 : 0)  // boolean true = volle Rechte (delete)
                    : (levels[current] ?? 0);
                const newNum = typeof newLevel === 'boolean'
                    ? (newLevel ? 3 : 0)  // boolean true = volle Rechte (delete)
                    : (levels[newLevel] ?? 0);
                return levelNames[Math.max(currentNum, newNum)];
            };

            // Berechtigungen aggregieren (höchste Stufe über alle Workspaces gewinnt)
            const permissions = {
                userId: user.id,
                userEmail: user.email,
                workspaces: [],
                // 4-stufige Berechtigungen: 'none', 'read', 'write', 'delete'
                access_dashboard: 'none',
                access_projekte: 'none',
                access_rechnungen: 'none',
                access_bewegungen: 'none',
                access_lieferanten: 'none',
                access_mitglieder: 'none',
                access_einnahmen: 'none',
                access_konfiguration: 'none',
                access_zeiterfassung: 'none',
                access_inventar: 'none',
                access_reporting: 'none',
                rechnungen_nur_zugewiesene: true,
                isWorkspaceAdmin: false
            };

            for (const uw of data) {
                if (uw.workspaces && uw.workspaces.is_active) {
                    const ws = uw.workspaces;
                    permissions.workspaces.push({ id: ws.id, name: ws.name });

                    // Aggregation mit höchster Stufe
                    permissions.access_dashboard = aggregateLevel(permissions.access_dashboard, ws.access_dashboard);
                    permissions.access_projekte = aggregateLevel(permissions.access_projekte, ws.access_projekte);
                    permissions.access_rechnungen = aggregateLevel(permissions.access_rechnungen, ws.access_rechnungen);
                    permissions.access_bewegungen = aggregateLevel(permissions.access_bewegungen, ws.access_bewegungen);
                    permissions.access_lieferanten = aggregateLevel(permissions.access_lieferanten, ws.access_lieferanten);
                    permissions.access_mitglieder = aggregateLevel(permissions.access_mitglieder, ws.access_mitglieder);
                    permissions.access_einnahmen = aggregateLevel(permissions.access_einnahmen, ws.access_einnahmen);
                    permissions.access_konfiguration = aggregateLevel(permissions.access_konfiguration, ws.access_konfiguration);
                    permissions.access_zeiterfassung = aggregateLevel(permissions.access_zeiterfassung, ws.access_zeiterfassung);
                    permissions.access_inventar = aggregateLevel(permissions.access_inventar, ws.access_inventar);
                    permissions.access_reporting = aggregateLevel(permissions.access_reporting, ws.access_reporting);

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
     * Prüft ob User mindestens Lesezugriff auf einen Bereich hat
     * @param {string} permissionKey - z.B. 'access_dashboard'
     * @returns {boolean}
     */
    hasReadAccess(permissionKey) {
        const perms = this.permissionsCache;
        if (!perms) return true; // Fallback: Vollzugriff
        const level = perms[permissionKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        // read, write oder delete = mindestens Lesezugriff
        return level === 'read' || level === 'write' || level === 'delete';
    },

    /**
     * Prüft ob User Schreibzugriff auf einen Bereich hat
     * @param {string} permissionKey - z.B. 'access_dashboard'
     * @returns {boolean}
     */
    hasWriteAccess(permissionKey) {
        const perms = this.permissionsCache;
        if (!perms) return true; // Fallback: Vollzugriff
        const level = perms[permissionKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        // write oder delete = Schreibzugriff
        return level === 'write' || level === 'delete';
    },

    /**
     * Prüft ob User Löschzugriff auf einen Bereich hat
     * @param {string} permissionKey - z.B. 'access_dashboard'
     * @returns {boolean}
     */
    hasDeleteAccess(permissionKey) {
        const perms = this.permissionsCache;
        if (!perms) return true; // Fallback: Vollzugriff
        const level = perms[permissionKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        return level === 'delete';
    },

    /**
     * Standard-Berechtigungen (kein Zugriff)
     */
    getDefaultPermissions() {
        return {
            userId: null,
            userEmail: null,
            workspaces: [],
            access_dashboard: 'none',
            access_projekte: 'none',
            access_rechnungen: 'none',
            access_bewegungen: 'none',
            access_lieferanten: 'none',
            access_mitglieder: 'none',
            access_einnahmen: 'none',
            access_konfiguration: 'none',
            access_zeiterfassung: 'none',
            access_inventar: 'none',
            access_reporting: 'none',
            rechnungen_nur_zugewiesene: true,
            isWorkspaceAdmin: false
        };
    },

    /**
     * Vollzugriff-Berechtigungen (für Admins) - inkl. Löschen
     */
    getFullPermissions() {
        return {
            userId: null,
            userEmail: null,
            workspaces: [],
            access_dashboard: 'delete',
            access_projekte: 'delete',
            access_rechnungen: 'delete',
            access_bewegungen: 'delete',
            access_lieferanten: 'delete',
            access_mitglieder: 'delete',
            access_einnahmen: 'delete',
            access_konfiguration: 'delete',
            access_zeiterfassung: 'delete',
            access_inventar: 'delete',
            access_reporting: 'delete',
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
    // REPORTING-FUNKTIONEN
    // ==========================================

    /**
     * Projektkosten für Reporting laden
     * Lädt DATEV-Buchungen für ein spezifisches Projekt im Zeitraum
     * @param {string} projectId - Projekt-ID
     * @param {string} startDate - Startdatum (YYYY-MM-DD)
     * @param {string} endDate - Enddatum (YYYY-MM-DD)
     * @returns {Array} Array von Buchungen mit betrag_brutto/betrag_gesamt
     */
    async getProjectCosts(projectId, startDate, endDate) {
        try {
            // Projekt laden um datev_id zu bekommen
            const { data: project, error: projectError } = await SupabaseService.client
                .from('projects')
                .select('datev_id')
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;

            if (!project || !project.datev_id) {
                console.log(`⚠️ Projekt ${projectId} hat keine DATEV-ID`);
                return [];
            }

            // DATEV-Buchungen für dieses Projekt laden
            const { data: buchungen, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('*')
                .eq('projekt_id', project.datev_id)
                .gte('datum', startDate)
                .lte('datum', endDate)
                .or('archived.is.null,archived.eq.false');

            if (error) throw error;

            // Kontenplan laden für Konto-Namen
            let kontenMap = {};
            try {
                const { data: konten } = await SupabaseService.client
                    .from('chart_of_accounts')
                    .select('*');
                if (konten) {
                    konten.forEach(k => {
                        // Verschiedene mögliche Feldnamen unterstützen
                        const pattern = (k.konto_pattern || k.konto_nr || k.konto || '').replace('%', '');
                        const name = k.name || k.bezeichnung || k.beschreibung || '';
                        if (pattern) kontenMap[pattern] = name;
                    });
                }
            } catch (e) {
                // Ignorieren wenn Tabelle nicht existiert oder anderer Fehler
                console.log('Kontenplan für Konto-Namen nicht verfügbar');
            }

            // Beträge berechnen (Brutto = Netto + MwSt) und Konto-Namen hinzufügen
            return (buchungen || []).map(b => {
                const netto = parseFloat(b.betrag) || 0;
                const mwstRate = b.mwst_rate !== null ? parseFloat(b.mwst_rate) : 22;
                const brutto = netto * (1 + mwstRate / 100);

                // Konto-Name aus Kontenplan suchen
                let kontoName = '';
                const kontoNr = b.konto_nr || '';
                if (kontoNr) {
                    // Suche passenden Eintrag (z.B. "6800" passt zu "680%")
                    for (const [pattern, name] of Object.entries(kontenMap)) {
                        if (kontoNr.startsWith(pattern)) {
                            kontoName = name;
                            break;
                        }
                    }
                }

                return {
                    ...b,
                    betrag_netto: netto,
                    betrag_brutto: brutto,
                    betrag_gesamt: brutto,
                    konto_name: kontoName || b.kategorie || b.beschreibung || ''
                };
            });

        } catch (error) {
            console.error('Fehler beim Laden der Projektkosten:', error);
            return [];
        }
    },

    /**
     * DATEV-Buchungen für Reporting laden (nach Zeitraum)
     * @param {string} startDate - Startdatum (YYYY-MM-DD)
     * @param {string} endDate - Enddatum (YYYY-MM-DD)
     * @returns {Array} Array von DATEV-Buchungen
     */
    async getDatevBookings(startDate, endDate) {
        try {
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('*')
                .gte('datum', startDate)
                .lte('datum', endDate)
                .or('archived.is.null,archived.eq.false')
                .order('datum', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('Fehler beim Laden der DATEV-Buchungen:', error);
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

            // 2. Projekte laden (nur Ausstellungen, ohne hideInReporting)
            const { data: allProjects, error: projectsError } = await supabaseClient
                .from('projects')
                .select('*')
                .eq('ist_ausstellung', true);

            if (projectsError) throw projectsError;

            // Projekte mit hideInReporting ausfiltern
            const projects = (allProjects || []).filter(p => !p.hide_in_reporting);

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
                const projektUmsatzDirekt = kategorisiert.UMSATZ.projektbezogen[projektId] || 0;
                const projektKostenDirekt = kategorisiert.DB1_KOSTEN.projektbezogen[projektId] || 0;

                // Anteilige allgemeine Umsätze nach Ausstellungsdauer
                const anteilAllgemeinerUmsatz = kategorisiert.UMSATZ.allgemein * anteil;

                // Gesamt-Umsatz = Direkt + anteilig allgemein
                const projektUmsatz = projektUmsatzDirekt + anteilAllgemeinerUmsatz;

                // DB1 = Direkte Umsätze - Direkte Kosten
                const db1 = projektUmsatz - projektKostenDirekt;

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
                    umsatz_direkt: projektUmsatzDirekt,
                    umsatz_anteilig: anteilAllgemeinerUmsatz,
                    db1_kosten: projektKostenDirekt,
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

    /**
     * Buchungen nach Kontenplan-Pattern gruppiert laden
     * Für Detail-Ansicht in der Deckungsbeitragsrechnung
     */
    async getBookingsGroupedByAccount(startDate, endDate) {
        try {
            // Kontenplan laden
            const chartOfAccounts = await this.getChartOfAccounts();

            // DATEV-Buchungen laden (mit Pagination für große Datensätze)
            const PAGE_SIZE = 1000;
            let buchungen = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabaseClient
                    .from('datev_bookings')
                    .select('*')
                    .gte('datum', startDate)
                    .lte('datum', endDate)
                    .order('datum', { ascending: false })
                    .range(offset, offset + PAGE_SIZE - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    buchungen = buchungen.concat(data);
                    offset += data.length;
                    hasMore = data.length === PAGE_SIZE;
                } else {
                    hasMore = false;
                }
            }

            console.log(`📊 getBookingsGroupedByAccount: ${buchungen.length} Buchungen für ${startDate} - ${endDate}`);

            // Nach Kontenplan-Pattern gruppieren
            const grouped = {};
            const details = {}; // Einzelbuchungen pro Pattern

            // Initialisiere Gruppen aus Kontenplan
            for (const coa of chartOfAccounts) {
                grouped[coa.konto_pattern] = {
                    konto_pattern: coa.konto_pattern,
                    konto_name: coa.konto_name,
                    kategorie: coa.kategorie,
                    db_zuordnung: coa.db_zuordnung,
                    ist_projektbezogen: coa.ist_projektbezogen,
                    betrag: 0,
                    count: 0
                };
                details[coa.konto_pattern] = [];
            }

            // Kontenplan nach Spezifität sortieren (längere/exakte Pattern zuerst)
            const sortedChartOfAccounts = [...chartOfAccounts].sort((a, b) => {
                const aExact = !a.konto_pattern.includes('%');
                const bExact = !b.konto_pattern.includes('%');
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                // Bei Pattern: längere zuerst (spezifischer: 690125% vor 6901%)
                return b.konto_pattern.length - a.konto_pattern.length;
            });

            // Buchungen zuordnen
            for (const b of buchungen || []) {
                const kontoNr = b.konto_nr || '';
                const betrag = parseFloat(b.betrag_gesamt || b.betrag) || 0;

                // Passendes Pattern finden (spezifischstes zuerst!)
                let matchedPattern = null;
                for (const coa of sortedChartOfAccounts) {
                    const pattern = coa.konto_pattern;
                    if (pattern.includes('%')) {
                        const prefix = pattern.replace('%', '');
                        if (kontoNr.startsWith(prefix)) {
                            matchedPattern = pattern;
                            break;
                        }
                    } else if (kontoNr === pattern) {
                        matchedPattern = pattern;
                        break;
                    }
                }

                if (matchedPattern && grouped[matchedPattern]) {
                    // Netto-Summe: Addiere echten Betrag mit Vorzeichen
                    // (Stornos/Gutschriften werden so automatisch abgezogen)
                    grouped[matchedPattern].betrag += betrag;
                    grouped[matchedPattern].count++;
                    details[matchedPattern].push({
                        id: b.id,
                        datum: b.datum,
                        konto_nr: kontoNr,
                        buchungstext: b.beschreibung || b.buchungstext || b.text || '',
                        betrag: betrag,
                        projekt_id: b.projekt_id,
                        lieferant: b.lieferant_name || ''
                    });
                }
            }

            // Beträge in Absolutwerte umwandeln für die Anzeige
            // (Erträge sind negativ in DB, Kosten positiv - beide sollen positiv angezeigt werden)
            for (const pattern of Object.keys(grouped)) {
                grouped[pattern].betrag = Math.abs(grouped[pattern].betrag);
            }

            return { grouped, details, chartOfAccounts };

        } catch (error) {
            console.error('Fehler beim Gruppieren der Buchungen:', error);
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
                .is('deleted_at', null)  // Soft-Delete Filter
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
            let insertData = {
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
                notes: entry.notes || null
            };

            // Audit-Trail: created_at und created_by hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .insert(insertData)
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
            let supabaseUpdates = {
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
            };

            // Audit-Trail: updated_at und updated_by hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

            const { data, error } = await SupabaseService.client
                .from('budget_entries')
                .update(supabaseUpdates)
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
     * Löscht einen Budget-Eintrag (Soft-Delete)
     */
    async deleteBudgetEntry(entryId) {
        try {
            // Soft-Delete: Budget-Eintrag als gelöscht markieren statt entfernen
            await this.softDelete('budget_entries', entryId);
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
    },

    /**
     * Lädt alle Konto-Notizen für ein Jahr
     */
    async getBudgetKontoNotes(year) {
        try {
            const { data, error } = await SupabaseService.client
                .from('budget_konto_notes')
                .select('*')
                .eq('fiscal_year', year);

            if (error) throw error;

            // Als Map zurückgeben: konto_nr -> notes
            const notesMap = {};
            (data || []).forEach(note => {
                notesMap[note.konto_nr] = note.notes || '';
            });
            return notesMap;
        } catch (error) {
            console.error('Fehler beim Laden der Konto-Notizen:', error);
            return {};
        }
    },

    /**
     * Speichert eine Konto-Notiz (upsert)
     */
    async saveBudgetKontoNote(kontoNr, year, notes) {
        try {
            const { data, error } = await SupabaseService.client
                .from('budget_konto_notes')
                .upsert({
                    konto_nr: kontoNr,
                    fiscal_year: year,
                    notes: notes
                }, {
                    onConflict: 'konto_nr,fiscal_year'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern der Konto-Notiz:', error);
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

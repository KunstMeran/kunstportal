/**
 * SUPABASE DATA ADAPTER
 * Überschreibt DataManager-Funktionen für Supabase
 * Projektsoftware Kunst Meran
 */

/**
 * SUPABASE SERVICE STUB
 * Da app.js noch direkt SupabaseService verwendet, erstellen wir einen Stub
 * der alle Aufrufe auf die neue API umleitet
 */
const SupabaseService = {
    client: {
        auth: {
            async getUser() {
                // Holt aktuellen User über API
                const session = await ApiClient.getSession();
                return { data: { user: session ? { id: session.id, email: session.email } : null }, error: null };
            }
        },
        from(table) {
            console.warn(`⚠️ Legacy Supabase-Aufruf: .from('${table}') - wird ignoriert. Nutze stattdessen DataManager/ApiClient!`);
            // Dummy-Objekt zurückgeben um Fehler zu vermeiden
            return {
                select: () => this,
                insert: () => this,
                update: () => this,
                delete: () => this,
                eq: () => this,
                neq: () => this,
                in: () => this,
                order: () => this,
                limit: () => this,
                single: () => Promise.resolve({ data: null, error: { message: 'SupabaseService ist deaktiviert' } }),
                then: (resolve) => resolve({ data: null, error: { message: 'SupabaseService ist deaktiviert' } })
            };
        },
        storage: {
            from(bucket) {
                console.warn(`⚠️ Legacy Supabase-Storage-Aufruf: storage.from('${bucket}') - nutze stattdessen StorageService!`);
                return {
                    upload: () => Promise.resolve({ data: null, error: { message: 'Nutze StorageService.uploadFile()' } }),
                    remove: () => Promise.resolve({ data: null, error: { message: 'Nutze StorageService.deleteFile()' } }),
                    getPublicUrl: (path) => ({ data: { publicUrl: `/storage/${bucket}/${path}` } })
                };
            }
        }
    },
    async getAllUsers() {
        // Nutzt die neue API
        return await ApiClient.getUsers();
    }
};

console.log('🔄 SupabaseService Stub geladen (leitet auf ApiClient um)');

const SupabaseDataAdapter = {
    /**
     * DataManager mit Supabase-Funktionen erweitern
     */
    init: function() {
        // WICHTIG: Auch wenn Supabase deaktiviert ist, müssen wir die neuen API-Methoden registrieren
        // da app.js diese Methoden verwendet (getMembers, getFundingSources, etc.)
        console.log('🔄 Aktiviere API Data Adapter (Hetzner Backend)...');

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
        DataManager.addSupplier = this.addSupplier.bind(this);

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

        // Shop-Ausgaben Funktionen (Publikationen an Mitarbeiter/Externe)
        DataManager._getShopAusgabenOriginal = DataManager.getShopAusgaben;
        DataManager.getShopAusgaben = this.getShopAusgaben.bind(this);

        DataManager._addShopAusgabeOriginal = DataManager.addShopAusgabe;
        DataManager.addShopAusgabe = this.addShopAusgabe.bind(this);

        DataManager._deleteShopAusgabeOriginal = DataManager.deleteShopAusgabe;
        DataManager.deleteShopAusgabe = this.deleteShopAusgabe.bind(this);

        DataManager._checkDuplicateAusgabeOriginal = DataManager.checkDuplicateAusgabe;
        DataManager.checkDuplicateAusgabe = this.checkDuplicateAusgabe.bind(this);

        DataManager._getExterneEmpfaengerOriginal = DataManager.getExterneEmpfaenger;
        DataManager.getExterneEmpfaenger = this.getExterneEmpfaenger.bind(this);

        DataManager._addExternerEmpfaengerOriginal = DataManager.addExternerEmpfaenger;
        DataManager.addExternerEmpfaenger = this.addExternerEmpfaenger.bind(this);

        // Shop-Artikel Funktionen
        DataManager._getShopArtikelOriginal = DataManager.getShopArtikel;
        DataManager.getShopArtikel = this.getShopArtikel.bind(this);

        DataManager._getShopArtikelByIdOriginal = DataManager.getShopArtikelById;
        DataManager.getShopArtikelById = this.getShopArtikelById.bind(this);

        DataManager._saveShopArtikelOriginal = DataManager.saveShopArtikel;
        DataManager.saveShopArtikel = this.saveShopArtikel.bind(this);

        DataManager._deleteShopArtikelOriginal = DataManager.deleteShopArtikel;
        DataManager.deleteShopArtikel = this.deleteShopArtikel.bind(this);

        // Shop-Artikeltypen Funktionen
        DataManager._getShopArtikeltypenOriginal = DataManager.getShopArtikeltypen;
        DataManager.getShopArtikeltypen = this.getShopArtikeltypen.bind(this);

        // Shop-Verkäufe Funktionen
        DataManager._getShopVerkaeufeFOriginal = DataManager.getShopVerkaeufe;
        DataManager.getShopVerkaeufe = this.getShopVerkaeufe.bind(this);

        DataManager._getShopVerkaufByIdOriginal = DataManager.getShopVerkaufById;
        DataManager.getShopVerkaufById = this.getShopVerkaufById.bind(this);

        DataManager._addShopVerkaufOriginal = DataManager.addShopVerkauf;
        DataManager.addShopVerkauf = this.addShopVerkauf.bind(this);

        DataManager._stornoShopVerkaufOriginal = DataManager.stornoShopVerkauf;
        DataManager.stornoShopVerkauf = this.stornoShopVerkauf.bind(this);

        DataManager._updateShopVerkaufOriginal = DataManager.updateShopVerkauf;
        DataManager.updateShopVerkauf = this.updateShopVerkauf.bind(this);

        // Shop-Einkäufe Funktionen
        DataManager._getShopEinkaeufeOriginal = DataManager.getShopEinkaeufe;
        DataManager.getShopEinkaeufe = this.getShopEinkaeufe.bind(this);

        DataManager._addShopEinkaufOriginal = DataManager.addShopEinkauf;
        DataManager.addShopEinkauf = this.addShopEinkauf.bind(this);

        DataManager._deleteShopEinkaufOriginal = DataManager.deleteShopEinkauf;
        DataManager.deleteShopEinkauf = this.deleteShopEinkauf.bind(this);

        // Kassen-Funktionen
        DataManager._getKassenBewegungen = DataManager.getKassenBewegungen;
        DataManager.getKassenBewegungen = this.getKassenBewegungen.bind(this);

        DataManager._addKassenBewegungOriginal = DataManager.addKassenBewegung;
        DataManager.addKassenBewegung = this.addKassenBewegung.bind(this);

        DataManager._berechneKassensaldoOriginal = DataManager.berechneKassensaldo;
        DataManager.berechneKassensaldo = this.berechneKassensaldo.bind(this);

        DataManager._getMwstAufschluesselungOriginal = DataManager.getMwstAufschluesselung;
        DataManager.getMwstAufschluesselung = this.getMwstAufschluesselung.bind(this);

        // Eintritt-Kategorien
        DataManager._getEintrittKategorienOriginal = DataManager.getEintrittKategorien;
        DataManager.getEintrittKategorien = this.getEintrittKategorien.bind(this);

        // Mitglied-Kategorien
        DataManager._getMitgliedKategorienOriginal = DataManager.getMitgliedKategorien;
        DataManager.getMitgliedKategorien = this.getMitgliedKategorien.bind(this);

        // Kursverwaltung
        DataManager.getKursKategorien = this.getKursKategorien.bind(this);
        DataManager.getKursAnbieter = this.getKursAnbieter.bind(this);
        DataManager.addKursAnbieter = this.addKursAnbieter.bind(this);
        DataManager.deleteKursAnbieter = this.deleteKursAnbieter.bind(this);
        DataManager.getKurse = this.getKurse.bind(this);
        DataManager.addKurs = this.addKurs.bind(this);
        DataManager.updateKurs = this.updateKurs.bind(this);
        DataManager.getKursTermine = this.getKursTermine.bind(this);
        DataManager.addKursTermin = this.addKursTermin.bind(this);
        DataManager.updateKursTermin = this.updateKursTermin.bind(this);
        DataManager.getKursTeilnehmer = this.getKursTeilnehmer.bind(this);
        DataManager.addKursTeilnehmer = this.addKursTeilnehmer.bind(this);
        DataManager.getAblaufendeZertifikate = this.getAblaufendeZertifikate.bind(this);

        // Anwesenheitsplanung
        DataManager.getAnwesenheitRange = this.getAnwesenheitRange.bind(this);
        DataManager.getHeuteAnwesend = this.getHeuteAnwesend.bind(this);
        DataManager.upsertAnwesenheit = this.upsertAnwesenheit.bind(this);
        DataManager.getEssensgutscheinBestellungen = this.getEssensgutscheinBestellungen.bind(this);
        DataManager.upsertEssensgutscheinBestellung = this.upsertEssensgutscheinBestellung.bind(this);
        DataManager.updateEssensgutscheinBestellung = this.updateEssensgutscheinBestellung.bind(this);

        // Kurskategorien CRUD
        DataManager.addKursKategorie = this.addKursKategorie.bind(this);
        DataManager.updateKursKategorie = this.updateKursKategorie.bind(this);
        DataManager.deleteKursKategorie = this.deleteKursKategorie.bind(this);

        // Kursanbieter (aus suppliers)
        DataManager.getKursanbieter = this.getKursanbieter.bind(this);

        // User-ID Funktion
        DataManager.getCurrentPublicUserId = this.getCurrentPublicUserId.bind(this);

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
     * Hilfsfunktion: Holt die Auth-User-ID aus auth.users
     * WICHTIG: Foreign Keys wie created_by/updated_by referenzieren auth.users(id),
     * daher muss hier die Supabase Auth UID verwendet werden, nicht public.users.id
     */
    /**
     * Holt die User-ID aus der Session
     * Nach Migration: session.id ist bereits die public.users.id
     */
    async getCurrentAuthUserId() {
        try {
            const currentUser = await Auth.getCurrentUser();
            return currentUser?.id || null;
        } catch (error) {
            console.warn('⚠️ Konnte User-ID nicht ermitteln:', error);
            return null;
        }
    },

    /**
     * Holt die Public-User-ID (public.users.id)
     * Nach Migration: session.id IST bereits die public.users.id
     */
    async getCurrentPublicUserId() {
        try {
            const currentUser = await Auth.getCurrentUser();
            return currentUser?.id || null;
        } catch (error) {
            console.warn('⚠️ Konnte Public-User-ID nicht ermitteln:', error);
            return null;
        }
    },

    /**
     * Holt die User-ID (Standard)
     */
    async getCurrentUserId() {
        return this.getCurrentAuthUserId();
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
            console.log('📝 addCreateMetadata - userId:', userId);
            const result = {
                ...data,
                created_at: new Date().toISOString()
            };
            // Nur created_by setzen wenn userId vorhanden (sonst FK-Constraint Fehler)
            if (userId) {
                result.created_by = userId;
            }
            return result;
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
            // Verwende ApiClient für Soft-Delete
            const updateData = {
                deleted_at: new Date().toISOString(),
                deleted_by: userId
            };

            // Mapping von Tabellennamen zu API-Endpoints
            const tableToEndpoint = {
                'datev_bookings': 'datev',
                'invoices': 'invoices',
                'projects': 'projects',
                'costs': 'costs'
            };

            const endpoint = tableToEndpoint[table];
            if (!endpoint) {
                console.warn(`⚠️ Soft-Delete nicht unterstützt für Tabelle: ${table}`);
                return false;
            }

            await ApiClient.request(`/${endpoint}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateDatevBooking(rechnungId, {
                kostentyp: kostentyp || null,
                kostentyp_am: kostentypAm,
                kostentyp_von: userId
            });

            console.log('✅ Kostentyp gespeichert:', data);

            // Cache invalidieren damit Änderungen sofort sichtbar sind
            this.invalidateRechnungenCache();
            // Auch DATEV-Buchungen-Cache invalidieren
            this.datevBuchungenCache = null;

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Setzen des Kostentyps:', error);
            throw error;
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

            // Mapping von localStorage-Feldern zu API-Feldern
            const apiUpdate = {};

            if (statusUpdate.kostentyp !== undefined) {
                apiUpdate.kostentyp = statusUpdate.kostentyp;
            }
            if (statusUpdate.kostentypAm !== undefined) {
                apiUpdate.kostentyp_am = statusUpdate.kostentypAm;
                apiUpdate.kostentyp_von = userId;
            }
            if (statusUpdate.status !== undefined) {
                apiUpdate.workflow_status = statusUpdate.status;
            }
            if (statusUpdate.kontrolliertVon !== undefined || statusUpdate.kontrolliertAm !== undefined) {
                apiUpdate.kontrolliert_von = userId;
                apiUpdate.kontrolliert_am = statusUpdate.kontrolliertAm || new Date().toISOString().split('T')[0];
            }
            if (statusUpdate.bezahltAm !== undefined) {
                apiUpdate.bezahlt_am = statusUpdate.bezahltAm;
            }
            if (statusUpdate.notizen !== undefined) {
                apiUpdate.notizen = statusUpdate.notizen;
            }

            console.log('📝 Setze Rechnungsstatus:', { rechnungId, apiUpdate });

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateDatevBooking(rechnungId, apiUpdate);

            console.log('✅ Status gespeichert:', data);

            // Cache invalidieren damit Änderungen sofort sichtbar sind
            this.invalidateRechnungenCache();
            // Auch DATEV-Buchungen-Cache invalidieren
            this.datevBuchungenCache = null;

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Setzen des Status:', error);
            throw error;
        }
    },

    /**
     * DATEV-Buchungen aus PostgreSQL laden (via API Client)
     * Ersetzt loadBuchungenJSON() - lädt aus datev_bookings Tabelle
     * Reichert Buchungen mit Lieferantennamen aus suppliers-Tabelle an
     */
    async loadBuchungenFromSupabase(jahr = null) {
        try {
            console.log('📤 Lade DATEV-Buchungen aus PostgreSQL...');

            // Alle Buchungen über API Client laden (Limit auf 10000 erhöht für alle Jahre)
            const filters = jahr ? { year: jahr, limit: 10000 } : { limit: 10000 };
            const allBookings = await ApiClient.getDatevBookings(filters);

            console.log(`✅ Insgesamt ${allBookings.length} DATEV-Buchungen geladen`);

            // Lieferanten laden
            const suppliers = await ApiClient.getSuppliers();

            // Lieferanten-Map erstellen für schnellen Lookup
            const supplierMap = new Map();
            if (suppliers) {
                suppliers.forEach(s => {
                    if (s.partita_iva && s.fornitore_name) {
                        supplierMap.set(s.partita_iva, s.fornitore_name);
                    }
                });
            }
            console.log(`📇 ${supplierMap.size} Lieferanten für Namen-Lookup geladen`);

            // Konvertieren zu lokalem Format mit Lieferantennamen-Anreicherung
            this.datevBuchungenCache = (allBookings || []).map(b => {
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
            const data = await ApiClient.getProjects();
            // API-Format zu lokalem Format konvertieren
            return data.map(p => this.convertProjectFromSupabase(p));
        } catch (error) {
            console.error('Fehler beim Laden der Projekte:', error);
            return [];
        }
    },

    async getProjectById(projectId) {
        try {
            const data = await ApiClient.getProjectById(projectId);
            return this.convertProjectFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Laden des Projekts:', error);
            return null;
        }
    },

    async addProject(projectData) {
        try {
            // public.users.id für FK (projects.created_by -> public.users)
            const publicUserId = await this.getCurrentPublicUserId();

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
                hide_in_reporting: projectData.hideInReporting || false,
                created_at: new Date().toISOString()
            };

            // created_by nur setzen wenn public.users.id gefunden
            if (publicUserId) {
                supabaseProject.created_by = publicUserId;
            }

            console.log('📝 addProject - insert data:', supabaseProject);

            // Verwende ApiClient statt SupabaseService
            const result = await ApiClient.createProject(supabaseProject);

            console.log('✅ Projekt erstellt:', result);
            return result ? this.convertProjectFromSupabase(result) : null;
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateProject(projectId, supabaseUpdates);

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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getCosts();
            return (data || []).map(c => this.convertCostFromSupabase(c));
        } catch (error) {
            console.error('Fehler beim Laden der Kosten:', error);
            return [];
        }
    },

    async getCostsByProject(projectId) {
        try {
            const data = await ApiClient.getCosts({ project_id: projectId });
            return (data || []).map(c => this.convertCostFromSupabase(c));
        } catch (error) {
            console.error('Fehler beim Laden der Kosten:', error);
            return [];
        }
    },

    async addCost(costData) {
        try {
            // public.users.id für FK (costs.created_by -> public.users)
            const publicUserId = await this.getCurrentPublicUserId();

            let supabaseCost = {
                project_id: costData.projectId,
                category: this.mapCategoryToSupabase(costData.category),
                description: costData.description || costData.supplier || 'Kosten',
                amount: parseFloat(costData.amount) || 0,
                cost_type: (costData.type === 'effektiv' || costData.type === 'ist') ? 'IST' : 'Provisorisch',
                date: costData.date || new Date().toISOString().split('T')[0],
                supplier: costData.supplier || null,
                invoice_number: costData.invoiceNumber || null,
                file_path: costData.filePath || null,
                created_at: new Date().toISOString()
            };

            // created_by nur setzen wenn public.users.id gefunden
            if (publicUserId) {
                supabaseCost.created_by = publicUserId;
            }

            // Verwende ApiClient statt SupabaseService
            const result = await ApiClient.createCost(supabaseCost);
            return result ? this.convertCostFromSupabase(result) : null;
        } catch (error) {
            console.error('Fehler beim Erstellen der Kosten:', error);
            throw error;
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateCost(costId, supabaseUpdates);
            return this.convertCostFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Kosten:', error);
            throw error;
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
            budget: parseFloat(supabaseProject.budget) || 0,
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
        const statusLower = status?.toLowerCase() || 'laufend';
        // Englische Status-Werte auf deutsche mappen
        const statusMap = {
            'active': 'laufend',
            'running': 'laufend',
            'in_progress': 'laufend',
            'planning': 'planung',
            'planned': 'planung',
            'completed': 'abgeschlossen',
            'done': 'abgeschlossen',
            'finished': 'abgeschlossen'
        };
        return statusMap[statusLower] || statusLower;
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
            const userId = await this.getCurrentUserId();
            const invoicePayload = {
                file_name: invoiceData.fileName,
                file_path: invoiceData.filePath,
                file_size: invoiceData.fileSize,
                partita_iva: invoiceData.partitaIva,
                invoice_number: invoiceData.invoiceNumber,
                status: invoiceData.status || 'uploaded',
                datev_buchung_id: invoiceData.datevBuchungId || null,
                uploaded_by: userId,
                created_by: userId
            };

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createInvoice(invoicePayload);
            return data;
        } catch (error) {
            console.error('Fehler beim Erstellen der Rechnung:', error);
            throw error;
        }
    },

    async updateInvoiceStatus(invoiceId, newStatus) {
        try {
            const userId = await this.getCurrentUserId();
            const now = new Date().toISOString();

            let updates = {
                status: newStatus,
                updated_by: userId
            };

            // Je nach Status zusätzliche Felder setzen
            if (newStatus === 'kontrolliert') {
                updates.kontrolled_by = userId;
                updates.kontrolled_at = now;
            } else if (newStatus === 'bezahlt') {
                updates.paid_by = userId;
                updates.paid_at = now;
            }

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateInvoice(invoiceId, updates);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateInvoice(invoiceId, updates);
            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Kostentyps:', error);
            throw error;
        }
    },

    async getInvoices() {
        try {
            const data = await ApiClient.getInvoices();
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
                try {
                    suppliers = await ApiClient.getSuppliers();
                } catch (supplierError) {
                    console.warn('⚠️ Konnte Lieferanten nicht laden:', supplierError);
                    suppliers = [];
                }
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

            // 6. Filter: Keine Buchungen mit Konto 600xxx anzeigen (Ertragskonten)
            const filteredCombined = combined.filter(buchung => {
                const konto = buchung.konto || '';
                // Konten die mit "600" beginnen ausfiltern
                return !String(konto).startsWith('600');
            });

            // Nach Upload-Datum bzw. Belegdatum sortieren (neueste zuerst)
            filteredCombined.sort((a, b) => {
                const dateA = a.uploadedAt || a.belegdatum || '';
                const dateB = b.uploadedAt || b.belegdatum || '';
                return dateB.localeCompare(dateA);
            });

            const loadTime = Date.now() - startTime;
            const filtered600Count = combined.length - filteredCombined.length;
            console.log(`📊 Rechnungen kombiniert: ${datevBuchungen.length} DATEV + ${unmatchedInvoices.length} nur Supabase = ${combined.length} gesamt, ${filtered600Count} Ertragskonten (600xxx) gefiltert, ${filteredCombined.length} angezeigt (${loadTime}ms)`);

            // Cache speichern für nächste Aufrufe
            this.rechnungenCache = filteredCombined;
            this.rechnungenCacheTime = Date.now();
            console.log('💾 Rechnungen gecached für ' + (this.CACHE_DURATION_MS / 1000) + ' Sekunden');

            return filteredCombined;

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
            const data = await ApiClient.getSuppliers();

            // Format anpassen an bisheriges Format (für Kompatibilität)
            return (data || []).map(s => ({
                partitaIva: s.partita_iva,
                name: s.fornitore_name,
                fornitoreNr: s.fornitore_nr,
                address: s.address,
                city: s.city,
                country: s.country,
                contactUserId: s.contact_user_id || null,
                isKursanbieter: s.is_kursanbieter || false,
                created_at: s.created_at || null,
                created_by: s.created_by || null,
                updated_at: s.updated_at || null,
                updated_by: s.updated_by || null
            }));

        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            return [];
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
            if (updates.isKursanbieter !== undefined) supabaseUpdates.is_kursanbieter = updates.isKursanbieter;

            // Audit-Trail hinzufügen
            supabaseUpdates = await this.addUpdateMetadata(supabaseUpdates);

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateSupplier(partitaIva, supabaseUpdates);

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
     * Erstellt einen neuen Lieferanten
     * WICHTIG: Partita IVA ist Pflichtfeld (unique constraint)
     */
    async addSupplier(supplierData) {
        try {
            // Partita IVA validieren
            if (!supplierData.partitaIva || supplierData.partitaIva.trim() === '') {
                throw new Error('Partita IVA ist ein Pflichtfeld');
            }

            let insertData = {
                partita_iva: supplierData.partitaIva.trim().toUpperCase(),
                fornitore_name: supplierData.name,
                fornitore_nr: supplierData.fornitoreNr || null,
                address: supplierData.address || null,
                city: supplierData.city || null,
                country: supplierData.country || 'IT',
                contact_user_id: supplierData.contactUserId || null,
                is_kursanbieter: supplierData.isKursanbieter || false
            };

            // Audit-Trail hinzufügen
            insertData = await this.addCreateMetadata(insertData);

            // Verwende ApiClient statt SupabaseService
            try {
                const data = await ApiClient.createSupplier(insertData);

                return {
                    partitaIva: data.partita_iva,
                    name: data.fornitore_name,
                    fornitoreNr: data.fornitore_nr,
                    address: data.address,
                    city: data.city,
                    country: data.country,
                    contactUserId: data.contact_user_id || null
                };
            } catch (apiError) {
                // Duplikat-Fehler behandeln
                const errMsg = apiError.message || '';
                if (errMsg.includes('duplicate') || errMsg.includes('23505') || errMsg.includes('unique')) {
                    throw new Error('Ein Lieferant mit dieser Partita IVA existiert bereits');
                }
                throw apiError;
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Lieferanten:', error);
            throw error;
        }
    },

    /**
     * ZEITERFASSUNGS-FUNKTIONEN
     */

    async getTimeEntries() {
        try {
            const data = await ApiClient.getTimeEntries();
            return (data || []).map(e => this.convertTimeEntryFromSupabase(e));
        } catch (error) {
            console.error('Fehler beim Laden der Zeiteinträge:', error);
            return [];
        }
    },

    async getTimeEntriesByProject(projectId) {
        try {
            const data = await ApiClient.getTimeEntries({ project_id: projectId });
            return (data || []).map(e => this.convertTimeEntryFromSupabase(e));
        } catch (error) {
            console.error('Fehler beim Laden der Projekt-Zeiteinträge:', error);
            return [];
        }
    },

    async addTimeEntry(entryData) {
        try {
            // Unterscheidung: Mitarbeiter-Eintrag oder Lieferanten-Eintrag
            const isSupplierEntry = !!entryData.supplierPartitaIva;

            let userId = null;

            if (!isSupplierEntry) {
                // Mitarbeiter-Eintrag: user_id verweist auf public.users(id) - UUID
                userId = entryData.userId;

                if (!userId) {
                    // Fallback: aktuell eingeloggter User - finde dessen public.users.id
                    const currentAuthUser = await Auth.getCurrentUser();
                    if (currentAuthUser) {
                        const users = this.getUsers();
                        const publicUser = users.find(u => u.auth_id === currentAuthUser.id);
                        userId = publicUser?.id || null;
                    }
                }
            }

            const timeEntry = {
                project_id: entryData.projectId,
                user_id: isSupplierEntry ? null : userId,
                supplier_partita_iva: isSupplierEntry ? entryData.supplierPartitaIva : null,
                date: entryData.date,
                hours: entryData.hours,
                description: entryData.description || '',
                activity_type: entryData.activityType || null
            };

            const data = await ApiClient.createTimeEntry(timeEntry);
            return this.convertTimeEntryFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Speichern des Zeiteintrags:', error);
            throw error;
        }
    },

    async updateTimeEntry(id, updates) {
        try {
            // Unterscheidung: Mitarbeiter-Eintrag oder Lieferanten-Eintrag
            const isSupplierEntry = !!updates.supplierPartitaIva;

            let updateData = {
                project_id: updates.projectId,
                date: updates.date,
                hours: updates.hours,
                description: updates.description,
                activity_type: updates.activityType
            };

            // Bei Wechsel zwischen Mitarbeiter/Lieferant müssen beide Felder gesetzt werden
            if (isSupplierEntry) {
                updateData.user_id = null;
                updateData.supplier_partita_iva = updates.supplierPartitaIva;
            } else if (updates.userId !== undefined) {
                updateData.user_id = updates.userId;
                updateData.supplier_partita_iva = null;
            }

            // Nur definierte Werte übernehmen
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const data = await ApiClient.updateTimeEntry(id, updateData);
            return this.convertTimeEntryFromSupabase(data);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Zeiteintrags:', error);
            throw error;
        }
    },

    async deleteTimeEntry(id) {
        try {
            await ApiClient.deleteTimeEntry(id);
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
            supplierPartitaIva: supabaseEntry.supplier_partita_iva || null,
            isSupplierEntry: !!supabaseEntry.supplier_partita_iva,
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
            const data = await ApiClient.getCostTypes();

            // Spalten anpassen: id ist der Code, is_active statt active
            this.costTypesCache = (data || []).map(ct => ({
                id: ct.id,
                code: ct.id, // id ist gleichzeitig der Code (z.B. "5101")
                name: ct.name,
                description: ct.description || '',
                active: ct.is_active !== false
            }));

            console.log(`📋 ${this.costTypesCache.length} Kostentypen aus API geladen`);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createCostType(insertData);

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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateCostType(id, supabaseUpdates);

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
            const data = await ApiClient.getUsers();

            this.usersCache = (data || []).map(u => ({
                id: u.id,
                auth_id: u.auth_id,  // Auth User ID
                name: u.name || u.username || u.email,
                email: u.email,
                role: u.role || u.user_type || 'user',
                hourlyRate: parseFloat(u.hourly_rate) || 0,
                userType: u.user_type || 'intern'  // 'intern' oder 'extern'
            }));

            console.log(`👥 ${this.usersCache.length} Benutzer aus API geladen`);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateUser(id, supabaseUpdates);

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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createUser(insertData);

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
            const filters = {};
            if (year) filters.year = year;

            const data = await ApiClient.getFundingSources(filters);

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
            const data = await ApiClient.getFundingSourceById(id);

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

            const insertData = {
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

            const data = await ApiClient.createFundingSource(insertData);

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
            let apiUpdates = {};
            if (updates.code !== undefined) apiUpdates.code = updates.code;
            if (updates.name !== undefined) apiUpdates.name = updates.name;
            if (updates.source !== undefined) apiUpdates.source = updates.source;
            if (updates.amount !== undefined) apiUpdates.amount = updates.amount;
            if (updates.year !== undefined) apiUpdates.year = updates.year;
            if (updates.isAbgabestelle !== undefined) apiUpdates.is_abgabestelle = updates.isAbgabestelle;
            if (updates.status !== undefined) apiUpdates.status = updates.status;
            if (updates.notes !== undefined) apiUpdates.notes = updates.notes;
            if (updates.documentPath !== undefined) apiUpdates.document_path = updates.documentPath;

            const data = await ApiClient.updateFundingSource(id, apiUpdates);

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
            await ApiClient.deleteFundingSource(id);

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
            const data = await ApiClient.getActiveAbgabestellen(year);

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
     * Ruft die Backend-API auf
     */
    async getFundingSourceExpenses(fundingSourceId) {
        try {
            const result = await ApiClient.getFundingSourceExpenses(fundingSourceId);
            return result;
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
            const result = await ApiClient.updateInvoiceFundingSource(invoiceId, fundingSourceId);
            return result;
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
            const params = {};
            if (activeOnly) {
                params.is_active = true;
            }
            const data = await ApiClient.getMembers(params);
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
            const data = await ApiClient.getMemberById(id);
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
            const insertData = {
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

            const data = await ApiClient.createMember(insertData);
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
            const data = await ApiClient.updateMember(id, updates);
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
            await ApiClient.deleteMember(id);
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
            const results = [];
            for (const m of membersArray) {
                const memberData = {
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
                };
                const data = await ApiClient.createMember(memberData);
                results.push(data);
            }
            return { success: true, count: results.length, data: results };
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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getMemberPayments(memberId);
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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getMemberPaymentsByYear(year);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createMemberPayment(paymentData.member_id, insertData);
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
            const data = await ApiClient.getWorkspaces();
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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getWorkspaceById(workspaceId);
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
            const insertData = {
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
                is_active: true
            };

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createWorkspace(insertData);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateWorkspace(workspaceId, supabaseUpdates);

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
            // Verwende ApiClient statt SupabaseService
            await ApiClient.request(`/workspaces/${workspaceId}`, { method: 'DELETE' });

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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getWorkspaceUsers(workspaceId);
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
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.assignUserToWorkspace(workspaceId, userId);

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
            // Verwende ApiClient statt SupabaseService
            await ApiClient.removeUserFromWorkspace(workspaceId, userId);

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

            // Berechtigungen aus der Session laden (wird vom Backend via Auth gesetzt)
            const session = await ApiClient.getSession();
            if (!session || !session.permissions) {
                console.log('Keine Session/Berechtigungen - verwende Vollzugriff');
                return this.getFullPermissions();
            }

            // Permissions direkt aus der Session übernehmen
            const perms = session.permissions;
            const permissions = {
                userId: session.id,
                userEmail: session.email,
                workspaces: [],
                // 4-stufige Berechtigungen: 'none', 'read', 'write', 'delete'
                access_dashboard: perms.dashboard || 'delete',
                access_projekte: perms.projekte || 'delete',
                access_rechnungen: perms.rechnungen || 'delete',
                access_bewegungen: perms.bewegungen || 'delete',
                access_lieferanten: perms.lieferanten || 'delete',
                access_mitglieder: perms.mitglieder || 'delete',
                access_einnahmen: perms.einnahmen || 'delete',
                access_konfiguration: perms.konfiguration || 'delete',
                access_zeiterfassung: perms.zeiterfassung || 'delete',
                access_inventar: perms.inventar || 'delete',
                access_reporting: perms.reporting || 'delete',
                rechnungen_nur_zugewiesene: false,
                isWorkspaceAdmin: session.user_type === 'Admin'
            };

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
        if (!perms) return true; // Fallback: Vollzugriff wenn Cache leer
        const level = perms[permissionKey];
        // Fallback: Vollzugriff wenn Key nicht existiert
        if (level === undefined || level === null) return true;
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
        if (!perms) return true; // Fallback: Vollzugriff wenn Cache leer
        const level = perms[permissionKey];
        // Fallback: Vollzugriff wenn Key nicht existiert
        if (level === undefined || level === null) return true;
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
        if (!perms) return true; // Fallback: Vollzugriff wenn Cache leer
        const level = perms[permissionKey];
        // Fallback: Vollzugriff wenn Key nicht existiert
        if (level === undefined || level === null) return true;
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
     * Lädt alle Auth-User aus der Datenbank (für Dropdown)
     */
    async getAllAuthUsers() {
        try {
            // Verwende ApiClient statt SupabaseService
            const users = await ApiClient.getUsers();
            return (users || []).map(u => ({
                id: u.id,
                email: u.email,
                name: u.username || u.name || u.email
            }));
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
            const project = await ApiClient.getProjectById(projectId);

            if (!project || !project.datev_id) {
                console.log(`⚠️ Projekt ${projectId} hat keine DATEV-ID`);
                return [];
            }

            // DATEV-Buchungen für dieses Projekt laden
            const buchungen = await ApiClient.getDatevBookings({
                projekt_id: project.datev_id,
                start_date: startDate,
                end_date: endDate,
                limit: 5000
            });

            // Kontenplan laden für Konto-Namen
            let kontenMap = {};
            try {
                const konten = await ApiClient.getKontenplan();
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
            const data = await ApiClient.getDatevBookings({
                start_date: startDate,
                end_date: endDate,
                limit: 10000
            });
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
            const data = await ApiClient.getKontenplan();
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
            const allProjects = await ApiClient.getProjects();

            // Projekte mit hideInReporting ausfiltern und nur Ausstellungen
            const projects = (allProjects || []).filter(p => p.ist_ausstellung && !p.hide_in_reporting);

            // 3. DATEV-Buchungen laden
            const buchungen = await ApiClient.getDatevBookings();

            // 4. Projekt-Gewichtungen berechnen
            const { weights, totalDays } = this.calculateProjectWeights(projects, startDate, endDate);

            // 5. Buchungen nach DB-Stufen kategorisieren
            // - projektbezogen: direkt einem Projekt zugeordnet (projekt_id vorhanden)
            // - allgemein: Konten ohne projektbezogen-Flag → werden anteilig verteilt
            // - nichtZugeordnet: Konten MIT projektbezogen-Flag ABER ohne projekt_id → separat ausweisen
            const kategorisiert = {
                UMSATZ: { gesamt: 0, projektbezogen: {}, allgemein: 0, nichtZugeordnet: 0 },
                DB1_KOSTEN: { gesamt: 0, projektbezogen: {}, allgemein: 0, nichtZugeordnet: 0 },
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

                // Unterscheidung für UMSATZ und DB1_KOSTEN
                if (dbStufe === 'UMSATZ' || dbStufe === 'DB1_KOSTEN') {
                    if (projektId && zuordnung.ist_projektbezogen) {
                        // Fall 1: Konto ist projektbezogen UND hat projekt_id → direkt zuordnen
                        if (!kategorisiert[dbStufe].projektbezogen[projektId]) {
                            kategorisiert[dbStufe].projektbezogen[projektId] = 0;
                        }
                        kategorisiert[dbStufe].projektbezogen[projektId] += betrag;
                    } else if (zuordnung.ist_projektbezogen && !projektId) {
                        // Fall 2: Konto ist projektbezogen ABER keine projekt_id → nicht zugeordnet
                        kategorisiert[dbStufe].nichtZugeordnet += betrag;
                    } else {
                        // Fall 3: Konto ist NICHT projektbezogen → allgemein (wird verteilt)
                        kategorisiert[dbStufe].allgemein += betrag;
                    }
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
                // Allgemeine Einnahmen (Konten OHNE ist_projektbezogen) → werden verteilt
                nichtProjektbezogen: {
                    umsatz: kategorisiert.UMSATZ.allgemein,
                    kosten: kategorisiert.DB1_KOSTEN.allgemein
                },
                // Nicht zugeordnete Einnahmen (Konten MIT ist_projektbezogen ABER ohne projekt_id)
                nichtZugeordnet: {
                    umsatz: kategorisiert.UMSATZ.nichtZugeordnet,
                    kosten: kategorisiert.DB1_KOSTEN.nichtZugeordnet
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

            // DATEV-Buchungen laden
            const buchungen = await ApiClient.getDatevBookings({ limit: 10000 });

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
            const filters = { year: year };
            const data = await ApiClient.getBudgetEntries(filters);

            // Wenn Vorjahr auch geladen werden soll, zweiter API-Call
            if (includeVorjahr) {
                const vorjahrData = await ApiClient.getBudgetEntries({ year: year - 1 });
                return [...(data || []), ...(vorjahrData || [])];
            }

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
            // Alle Budget-Einträge laden und filtern (kein direkter ID-Endpoint)
            const allEntries = await ApiClient.getBudgetEntries({});
            return allEntries.find(e => e.id === entryId) || null;
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.upsertBudgetEntry(insertData);
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

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.updateBudgetEntry(entryId, supabaseUpdates);
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
            const data = await ApiClient.getBudgetNotes({ projekt_id: null });
            const yearNote = (data || []).find(n => n.fiscal_year === year);
            return yearNote?.note || '';
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
            const data = await ApiClient.saveBudgetNote({ projekt_id: null, note: notes });
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
            const data = await ApiClient.getKontoNotes({ projekt_id: null });
            // Als Map zurückgeben: konto_nr -> notes
            const notesMap = {};
            (data || []).forEach(note => {
                notesMap[note.konto] = note.note || '';
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
            const data = await ApiClient.upsertKontoNote({
                projekt_id: null,
                konto: kontoNr,
                note: notes
            });
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern der Konto-Notiz:', error);
            throw error;
        }
    },

    // ========================================
    // SHOP-AUSGABEN (Publikationen an Mitarbeiter/Externe)
    // ========================================

    /**
     * Lädt Shop-Ausgaben mit optionalem Filter
     */
    async getShopAusgaben(filter = {}) {
        try {
            const data = await ApiClient.getShopAusgaben();

            // User-Namen aus Cache holen
            const cachedUsers = this.usersCache || [];
            let usersMap = {};
            cachedUsers.forEach(u => {
                if (u.auth_id) usersMap[u.auth_id] = u;
                if (u.id) usersMap[u.id] = u;
            });

            let result = (data || []).map(a => ({
                id: a.id,
                datum: a.datum,
                uhrzeit: a.uhrzeit,
                artikelId: a.artikel_id,
                artikel_id: a.artikel_id,
                artikel_name: a.artikel_name || a.artikel?.name,
                artikel_nr: a.artikel_nr || a.artikel?.artikelnr,
                menge: a.menge,
                empfaenger_typ: a.empfaenger_typ,
                empfaenger_user_id: a.empfaenger_user_id,
                empfaenger_extern_id: a.empfaenger_extern_id,
                empfaenger_name: a.empfaenger_typ === 'mitarbeiter'
                    ? (usersMap[a.empfaenger_user_id]?.name || usersMap[a.empfaenger_user_id]?.email || 'Unbekannt')
                    : (a.empfaenger_name || a.externer?.name || a.empfaenger_extern_name),
                empfaenger_extern_notiz: a.empfaenger_extern_notiz || a.externer?.notiz,
                zweck: a.zweck,
                createdAt: a.created_at,
                createdBy: a.created_by
            }));

            // Client-side filtering
            if (filter.datumVon) result = result.filter(a => a.datum >= filter.datumVon);
            if (filter.datumBis) result = result.filter(a => a.datum <= filter.datumBis);
            if (filter.artikelId) result = result.filter(a => a.artikel_id === filter.artikelId);
            if (filter.empfaengerTyp) result = result.filter(a => a.empfaenger_typ === filter.empfaengerTyp);

            return result;
        } catch (error) {
            console.error('Fehler beim Laden der Ausgaben:', error);
            return [];
        }
    },

    /**
     * Speichert eine neue Shop-Ausgabe
     * Der Datenbank-Trigger reduziert automatisch den Bestand
     */
    async addShopAusgabe(ausgabe) {
        try {
            let insertData = {
                datum: ausgabe.datum || new Date().toISOString().split('T')[0],
                artikel_id: ausgabe.artikelId || ausgabe.artikel_id,
                menge: ausgabe.menge || 1,
                empfaenger_typ: ausgabe.empfaenger_typ,
                zweck: ausgabe.zweck || null
            };

            if (ausgabe.empfaenger_typ === 'mitarbeiter') {
                insertData.empfaenger_user_id = ausgabe.empfaenger_user_id;
            } else {
                if (ausgabe.empfaenger_extern_id) {
                    insertData.empfaenger_extern_id = ausgabe.empfaenger_extern_id;
                } else {
                    insertData.empfaenger_extern_name = ausgabe.empfaenger_extern_name;
                    insertData.empfaenger_extern_notiz = ausgabe.empfaenger_extern_notiz;
                }
            }

            // Audit-Felder
            insertData = await this.addCreateMetadata(insertData);

            console.log('📝 Shop-Ausgabe insert data:', insertData);

            // Verwende ApiClient statt SupabaseService
            // Die API handhabt auch die Bestandsreduktion
            const result = await ApiClient.createShopAusgabe(insertData);

            // Bestand manuell reduzieren (API macht das nicht automatisch)
            if (insertData.artikel_id) {
                try {
                    const artikel = await ApiClient.request(`/shop/artikel`);
                    const art = artikel.find(a => a.id === insertData.artikel_id);
                    if (art) {
                        const neuerBestand = Math.max(0, (art.bestand || art.bestand_aktuell || 0) - (insertData.menge || 1));
                        await ApiClient.updateShopArtikel(insertData.artikel_id, { bestand: neuerBestand });
                        console.log('📦 Bestand nach Ausgabe reduziert:', art.bestand || art.bestand_aktuell, '->', neuerBestand);
                    }
                } catch (bestandError) {
                    console.warn('⚠️ Bestand konnte nicht aktualisiert werden:', bestandError);
                }
            }

            console.log('✅ Ausgabe erfasst:', result);
            return result;
        } catch (error) {
            console.error('Fehler beim Speichern der Ausgabe:', error);
            throw error;
        }
    },

    /**
     * Löscht eine Shop-Ausgabe und gibt den Bestand zurück
     * Die API handhabt die Bestandswiederherstellung in einer Transaktion
     */
    async deleteShopAusgabe(id) {
        try {
            // Verwende ApiClient - die DELETE Route handhabt Bestandswiederherstellung
            await ApiClient.deleteShopAusgabe(id);
            console.log('✅ Ausgabe gelöscht:', id);
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen der Ausgabe:', error);
            throw error;
        }
    },

    /**
     * Prüft ob ein Empfänger diesen Artikel bereits erhalten hat
     */
    async checkDuplicateAusgabe(artikelId, empfaengerTyp, empfaengerId) {
        try {
            // Lade alle Ausgaben und filtere clientseitig
            const ausgaben = await this.getShopAusgaben({ artikelId });

            const match = ausgaben.find(a => {
                if (a.empfaenger_typ !== empfaengerTyp) return false;
                if (empfaengerTyp === 'mitarbeiter') {
                    return a.empfaenger_user_id === empfaengerId;
                } else {
                    if (typeof empfaengerId === 'number' || !isNaN(parseInt(empfaengerId))) {
                        return a.empfaenger_extern_id === empfaengerId;
                    } else {
                        return a.empfaenger_name === empfaengerId;
                    }
                }
            });

            return match || null;
        } catch (error) {
            console.error('Fehler beim Duplikat-Check:', error);
            return null;
        }
    },

    /**
     * Lädt alle externen Empfänger
     */
    async getExterneEmpfaenger() {
        try {
            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.getShopExterneEmpfaenger();
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden externer Empfänger:', error);
            return [];
        }
    },

    /**
     * Legt einen neuen externen Empfänger an
     */
    async addExternerEmpfaenger(empfaenger) {
        try {
            let insertData = {
                name: empfaenger.name,
                notiz: empfaenger.notiz || null
            };

            insertData = await this.addCreateMetadata(insertData);

            // Verwende ApiClient statt SupabaseService
            const result = await ApiClient.request('/shop/externe-empfaenger', {
                method: 'POST',
                body: JSON.stringify(insertData)
            });

            console.log('✅ Externer Empfänger angelegt:', result);
            return result;
        } catch (error) {
            console.error('Fehler beim Anlegen externem Empfänger:', error);
            throw error;
        }
    },

    // ========================================
    // SHOP-ARTIKEL
    // ========================================

    async getShopArtikel() {
        try {
            const data = await ApiClient.getShopArtikel();

            return (data || []).map(a => ({
                id: a.id,
                artikelnr: a.artikelnr,
                name: a.name,
                beschreibung: a.beschreibung,
                artikeltyp: a.artikeltyp,
                hersteller: a.hersteller,
                autor: a.autor,
                einkaufsjahr: a.einkaufsjahr,
                standort: a.standort,
                einkaufspreis: a.einkaufspreis,
                verkaufspreis: a.verkaufspreis,
                mwstSatz: a.mwst_satz,
                mwst_satz: a.mwst_satz,
                bestandAktuell: a.bestand_aktuell,
                bestand_aktuell: a.bestand_aktuell,
                bestandMin: a.bestand_min,
                durchschnittEK: a.durchschnitt_ek,
                is_active: a.is_active,
                isActive: a.is_active
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Artikel:', error);
            return [];
        }
    },

    async getShopArtikelById(id) {
        try {
            const allArtikel = await ApiClient.getShopArtikel();
            const data = allArtikel.find(a => a.id === id);
            if (!data) return null;

            return {
                id: data.id,
                artikelnr: data.artikelnr,
                name: data.name,
                beschreibung: data.beschreibung,
                artikeltyp: data.artikeltyp,
                hersteller: data.hersteller,
                autor: data.autor,
                einkaufsjahr: data.einkaufsjahr,
                standort: data.standort,
                einkaufspreis: data.einkaufspreis,
                verkaufspreis: data.verkaufspreis,
                mwstSatz: data.mwst_satz,
                bestandAktuell: data.bestand_aktuell,
                bestandMin: data.bestand_min,
                durchschnittEK: data.durchschnitt_ek,
                is_active: data.is_active
            };
        } catch (error) {
            console.error('Fehler beim Laden des Artikels:', error);
            return null;
        }
    },

    async saveShopArtikel(artikel) {
        try {
            const isNew = !artikel.id;

            const dbData = {
                artikelnr: artikel.artikelnr,
                name: artikel.name,
                beschreibung: artikel.beschreibung,
                artikeltyp: artikel.artikeltyp,
                hersteller: artikel.hersteller,
                autor: artikel.autor,
                einkaufsjahr: artikel.einkaufsjahr,
                standort: artikel.standort || 'Shop',
                einkaufspreis: artikel.einkaufspreis || artikel.einkaufspreis,
                verkaufspreis: artikel.verkaufspreis,
                mwst_satz: artikel.mwstSatz || artikel.mwst_satz || '22',
                bestand_aktuell: artikel.bestandAktuell ?? artikel.bestand_aktuell ?? 0,
                bestand_min: artikel.bestandMin ?? artikel.bestand_min ?? 0,
                durchschnitt_ek: artikel.durchschnittEK ?? artikel.durchschnitt_ek,
                is_active: artikel.is_active !== false && artikel.isActive !== false
            };

            if (isNew) {
                // Neue Artikelnummer generieren falls nicht vorhanden
                if (!dbData.artikelnr) {
                    // Lade alle Artikel um max Artikelnr zu finden
                    const allArtikel = await ApiClient.getShopArtikel();
                    let nextNr = 1;
                    const shopArtikel = allArtikel.filter(a => a.artikelnr && a.artikelnr.startsWith('SHOP-'));
                    if (shopArtikel.length > 0) {
                        const nummern = shopArtikel.map(a => {
                            const match = a.artikelnr.match(/SHOP-(\d+)/);
                            return match ? parseInt(match[1]) : 0;
                        });
                        nextNr = Math.max(...nummern) + 1;
                    }
                    dbData.artikelnr = `SHOP-${String(nextNr).padStart(4, '0')}`;
                }

                const withMeta = await this.addCreateMetadata(dbData);
                // Verwende ApiClient statt SupabaseService
                const data = await ApiClient.createShopArtikel(withMeta);

                console.log('✅ Artikel erstellt:', data);
                return data;
            } else {
                const withMeta = await this.addUpdateMetadata(dbData);
                // Verwende ApiClient statt SupabaseService
                const data = await ApiClient.updateShopArtikel(artikel.id, withMeta);

                console.log('✅ Artikel aktualisiert:', data);
                return data;
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Artikels:', error);
            throw error;
        }
    },

    async deleteShopArtikel(id) {
        try {
            // Soft-Delete: Verwende ApiClient statt SupabaseService
            await ApiClient.updateShopArtikel(id, { is_active: false });

            console.log('✅ Artikel deaktiviert:', id);
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Artikels:', error);
            throw error;
        }
    },

    // ========================================
    // SHOP-ARTIKELTYPEN
    // ========================================

    async getShopArtikeltypen() {
        try {
            const data = await ApiClient.getShopArtikeltypen();

            return (data || []).map(t => ({
                id: t.id,
                code: t.code,
                name: t.name
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Artikeltypen:', error);
            // Fallback auf Standardwerte
            return [
                { code: 'buch', name: 'Buch' },
                { code: 'katalog', name: 'Katalog' },
                { code: 'poster', name: 'Poster' },
                { code: 'objekt', name: 'Objekt/Gadget' },
                { code: 'schmuck', name: 'Schmuck' },
                { code: 'sonstiges', name: 'Sonstiges' }
            ];
        }
    },

    // ========================================
    // SHOP-VERKÄUFE
    // ========================================

    async getShopVerkaeufe(datum = null) {
        try {
            const filters = datum ? { datum: datum } : {};
            const data = await ApiClient.getShopVerkaeufe(filters);

            return (data || []).map(v => ({
                id: v.id,
                datum: v.datum,
                uhrzeit: v.uhrzeit,
                typ: v.typ,
                artikel_id: v.artikel_id,
                artikelId: v.artikel_id,
                eintritt_kategorie: v.eintritt_kategorie,
                mitglied_kategorie: v.mitglied_kategorie,
                mitglied_name: v.mitglied_name,
                menge: v.menge,
                einzelpreis: v.einzelpreis,
                mwst_satz: v.mwst_satz,
                mwstSatz: v.mwst_satz,
                gesamtpreis: v.gesamtpreis,
                zahlungsart: v.zahlungsart,
                notizen: v.notizen,
                storniert: v.storniert
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Verkäufe:', error);
            return [];
        }
    },

    async getShopVerkaufById(id) {
        try {
            // Lade alle Verkäufe und finde den richtigen
            const allVerkaeufe = await ApiClient.getShopVerkaeufe();
            const data = allVerkaeufe.find(v => v.id === id);

            if (!data) return null;

            return {
                id: data.id,
                datum: data.datum,
                uhrzeit: data.uhrzeit,
                typ: data.typ,
                artikel_id: data.artikel_id,
                artikelId: data.artikel_id,
                eintritt_kategorie: data.eintritt_kategorie,
                mitglied_kategorie: data.mitglied_kategorie,
                mitglied_name: data.mitglied_name,
                menge: data.menge,
                einzelpreis: data.einzelpreis,
                mwst_satz: data.mwst_satz,
                mwstSatz: data.mwst_satz,
                gesamtpreis: data.gesamtpreis,
                zahlungsart: data.zahlungsart,
                notizen: data.notizen,
                storniert: data.storniert,
                tageszeit: data.tageszeit
            };
        } catch (error) {
            console.error('Fehler beim Laden des Verkaufs:', error);
            return null;
        }
    },

    async addShopVerkauf(verkauf) {
        try {
            const dbData = {
                datum: verkauf.datum || new Date().toISOString().split('T')[0],
                uhrzeit: verkauf.uhrzeit || new Date().toTimeString().split(' ')[0].substring(0, 5),
                typ: verkauf.typ,
                artikel_id: verkauf.artikel_id || verkauf.artikelId,
                eintritt_kategorie: verkauf.eintritt_kategorie,
                mitglied_kategorie: verkauf.mitglied_kategorie,
                mitglied_name: verkauf.mitglied_name,
                menge: verkauf.menge || 1,
                einzelpreis: verkauf.einzelpreis,
                mwst_satz: verkauf.mwst_satz || verkauf.mwstSatz,
                gesamtpreis: verkauf.gesamtpreis || (verkauf.einzelpreis * (verkauf.menge || 1)),
                zahlungsart: verkauf.zahlungsart || 'bar',
                notizen: verkauf.notizen,
                storniert: false
            };

            const withMeta = await this.addCreateMetadata(dbData);

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createShopVerkauf(withMeta);

            // Bestand reduzieren bei Artikel-Verkauf
            if (verkauf.typ === 'artikel' && dbData.artikel_id) {
                try {
                    const allArtikel = await ApiClient.getShopArtikel();
                    const artikel = allArtikel.find(a => a.id === dbData.artikel_id);
                    if (artikel) {
                        const neuerBestand = Math.max(0, (artikel.bestand_aktuell || artikel.bestand || 0) - dbData.menge);
                        await ApiClient.updateShopArtikel(dbData.artikel_id, { bestand_aktuell: neuerBestand });
                        console.log('📦 Bestand reduziert:', artikel.bestand_aktuell, '->', neuerBestand);
                    }
                } catch (bestandError) {
                    console.warn('⚠️ Bestand konnte nicht aktualisiert werden:', bestandError);
                }
            }

            console.log('✅ Verkauf erfasst:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern des Verkaufs:', error);
            throw error;
        }
    },

    async stornoShopVerkauf(id) {
        try {
            // Verkauf laden
            const verkauf = await this.getShopVerkaufById(id);
            if (!verkauf) throw new Error('Verkauf nicht gefunden');

            // Stornieren via ApiClient
            await ApiClient.request(`/shop/verkaeufe/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    storniert: true,
                    storniert_at: new Date().toISOString(),
                    storniert_by: await this.getCurrentUserId()
                })
            });

            // Bestand zurückgeben bei Artikel-Verkauf
            if (verkauf.typ === 'artikel' && verkauf.artikel_id) {
                try {
                    const allArtikel = await ApiClient.getShopArtikel();
                    const artikel = allArtikel.find(a => a.id === verkauf.artikel_id);
                    if (artikel) {
                        const neuerBestand = (artikel.bestand_aktuell || artikel.bestand || 0) + verkauf.menge;
                        await ApiClient.updateShopArtikel(verkauf.artikel_id, { bestand_aktuell: neuerBestand });
                    }
                } catch (bestandError) {
                    console.warn('⚠️ Bestand konnte nicht wiederhergestellt werden:', bestandError);
                }
            }

            console.log('✅ Verkauf storniert:', id);
            return true;
        } catch (error) {
            console.error('Fehler beim Stornieren:', error);
            throw error;
        }
    },

    async updateShopVerkauf(id, updates) {
        try {
            const withMeta = await this.addUpdateMetadata(updates);

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.request(`/shop/verkaeufe/${id}`, {
                method: 'PUT',
                body: JSON.stringify(withMeta)
            });

            console.log('✅ Verkauf aktualisiert:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Verkaufs:', error);
            throw error;
        }
    },

    // ========================================
    // SHOP-EINKÄUFE
    // ========================================

    async getShopEinkaeufe() {
        try {
            const data = await ApiClient.getShopEinkaeufe();

            return (data || []).map(e => ({
                id: e.id,
                artikel_id: e.artikel_id,
                artikelId: e.artikel_id,
                artikel_name: e.artikel_name || e.artikel?.name,
                artikel_nr: e.artikel_nr || e.artikel?.artikelnr,
                datum: e.datum,
                menge: e.menge,
                einzelpreis: e.einzelpreis,
                gesamtpreis: e.gesamtpreis,
                lieferant_name: e.lieferant_name,
                rechnung_nr: e.rechnung_nr
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Einkäufe:', error);
            return [];
        }
    },

    async addShopEinkauf(einkauf) {
        try {
            const dbData = {
                artikel_id: einkauf.artikel_id || einkauf.artikelId,
                datum: einkauf.datum || new Date().toISOString().split('T')[0],
                menge: einkauf.menge || 1,
                einzelpreis: einkauf.einzelpreis,
                gesamtpreis: einkauf.gesamtpreis || (einkauf.einzelpreis * (einkauf.menge || 1)),
                lieferant_name: einkauf.lieferant_name,
                rechnung_nr: einkauf.rechnung_nr
            };

            const withMeta = await this.addCreateMetadata(dbData);

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createShopEinkauf(withMeta);

            // Bestand erhöhen
            if (dbData.artikel_id) {
                try {
                    const allArtikel = await ApiClient.getShopArtikel();
                    const artikel = allArtikel.find(a => a.id === dbData.artikel_id);

                    if (artikel) {
                        const neuerBestand = (artikel.bestand_aktuell || artikel.bestand || 0) + dbData.menge;
                        // Durchschnitts-EK neu berechnen
                        const alterWert = (artikel.bestand_aktuell || artikel.bestand || 0) * (artikel.durchschnitt_ek || 0);
                        const neuerWert = dbData.menge * dbData.einzelpreis;
                        const neuerDurchschnittEK = neuerBestand > 0 ? (alterWert + neuerWert) / neuerBestand : dbData.einzelpreis;

                        await ApiClient.updateShopArtikel(dbData.artikel_id, {
                            bestand_aktuell: neuerBestand,
                            durchschnitt_ek: neuerDurchschnittEK
                        });
                    }
                } catch (bestandError) {
                    console.warn('⚠️ Bestand konnte nicht aktualisiert werden:', bestandError);
                }
            }

            console.log('✅ Einkauf erfasst:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern des Einkaufs:', error);
            throw error;
        }
    },

    async deleteShopEinkauf(id) {
        try {
            // Verwende ApiClient - die DELETE Route handhabt Bestandskorrektur in Transaktion
            await ApiClient.deleteShopEinkauf(id);
            console.log('✅ Einkauf gelöscht:', id);
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Einkaufs:', error);
            throw error;
        }
    },

    // ========================================
    // KASSEN-BEWEGUNGEN
    // ========================================

    async getKassenBewegungen(datum = null) {
        try {
            // Verwende ApiClient statt SupabaseService
            const filters = datum ? { datum } : {};
            const data = await ApiClient.getShopKassenBewegungen(filters);

            return (data || []).map(b => ({
                id: b.id,
                datum: b.datum,
                uhrzeit: b.uhrzeit,
                typ: b.typ,
                betrag: b.betrag,
                grund: b.grund,
                storniert: b.storniert
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Kassenbewegungen:', error);
            return [];
        }
    },

    async addKassenBewegung(bewegung) {
        try {
            const dbData = {
                datum: bewegung.datum || new Date().toISOString().split('T')[0],
                uhrzeit: bewegung.uhrzeit || new Date().toTimeString().split(' ')[0].substring(0, 5),
                typ: bewegung.typ,
                betrag: bewegung.betrag,
                grund: bewegung.grund,
                storniert: false
            };

            const withMeta = await this.addCreateMetadata(dbData);

            // Verwende ApiClient statt SupabaseService
            const data = await ApiClient.createShopKassenBewegung(withMeta);

            console.log('✅ Kassenbewegung erfasst:', data);
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern der Kassenbewegung:', error);
            throw error;
        }
    },

    async berechneKassensaldo(datum) {
        try {
            const heute = datum || new Date().toISOString().split('T')[0];

            // Verkäufe des Tages über API
            const verkaeufe = await ApiClient.getShopVerkaeufe({ datum: heute });

            // Kassenbewegungen des Tages über API
            const bewegungen = await ApiClient.getShopKassenBewegungen({ datum: heute });

            let einnahmenBar = 0;
            let einnahmenPos = 0;

            (verkaeufe || []).forEach(v => {
                if (!v.storniert) {
                    if (v.zahlungsart === 'bar') {
                        einnahmenBar += v.gesamtpreis;
                    } else {
                        einnahmenPos += v.gesamtpreis;
                    }
                }
            });

            let entnahmen = 0;
            let einlagen = 0;

            (bewegungen || []).forEach(b => {
                if (!b.storniert) {
                    if (b.typ === 'entnahme') {
                        entnahmen += Math.abs(b.betrag);
                    } else if (b.typ === 'einlage') {
                        einlagen += Math.abs(b.betrag);
                    }
                }
            });

            // Letzten Kassenabschluss holen für Anfangsbestand
            const abschluesse = await ApiClient.getShopKassenabschluss({});
            const letzterAbschluss = (abschluesse || [])
                .filter(a => a.datum < heute)
                .sort((a, b) => b.datum.localeCompare(a.datum))[0];

            const anfangsbestand = letzterAbschluss?.endbestand_bar_ist || 0;

            return {
                einnahmenBar,
                einnahmenPos,
                entnahmen,
                einlagen,
                anfangsbestand,
                saldoBar: anfangsbestand + einnahmenBar + einlagen - entnahmen
            };
        } catch (error) {
            console.error('Fehler beim Berechnen des Kassensaldos:', error);
            return { einnahmenBar: 0, einnahmenPos: 0, entnahmen: 0, einlagen: 0, anfangsbestand: 0, saldoBar: 0 };
        }
    },

    async getMwstAufschluesselung(datum) {
        try {
            const verkaeufe = await ApiClient.getShopVerkaeufe({ datum: datum });

            const aufschluesselung = {
                '4': { brutto: 0, netto: 0, mwst: 0 },
                '22': { brutto: 0, netto: 0, mwst: 0 },
                'art74': { brutto: 0, netto: 0, mwst: 0 },
                'keine': { brutto: 0, netto: 0, mwst: 0 }
            };

            (verkaeufe || []).forEach(v => {
                if (v.storniert) return;

                const brutto = v.gesamtpreis || 0;
                const satz = v.mwst_satz || 'keine';

                if (satz === 'art74' || satz === 'keine') {
                    aufschluesselung[satz].brutto += brutto;
                    aufschluesselung[satz].netto += brutto;
                } else {
                    const mwstProzent = parseFloat(satz) / 100;
                    const netto = brutto / (1 + mwstProzent);
                    const mwst = brutto - netto;

                    const key = String(satz);
                    if (!aufschluesselung[key]) {
                        aufschluesselung[key] = { brutto: 0, netto: 0, mwst: 0 };
                    }
                    aufschluesselung[key].brutto += brutto;
                    aufschluesselung[key].netto += netto;
                    aufschluesselung[key].mwst += mwst;
                }
            });

            return aufschluesselung;
        } catch (error) {
            console.error('Fehler bei getMwstAufschluesselung:', error);
            return {
                '4': { brutto: 0, netto: 0, mwst: 0 },
                '22': { brutto: 0, netto: 0, mwst: 0 },
                'art74': { brutto: 0, netto: 0, mwst: 0 },
                'keine': { brutto: 0, netto: 0, mwst: 0 }
            };
        }
    },

    // ========================================
    // EINTRITT-KATEGORIEN
    // ========================================

    async getEintrittKategorien() {
        try {
            const data = await ApiClient.getShopEintrittKategorien();

            return (data || []).map(k => ({
                id: k.id,
                code: k.code,
                name: k.name,
                preis: k.preis,
                mwst_satz: k.mwst_satz,
                is_active: k.is_active
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Eintritt-Kategorien:', error);
            return [];
        }
    },

    // ========================================
    // MITGLIED-KATEGORIEN
    // ========================================

    async getMitgliedKategorien() {
        try {
            const data = await ApiClient.getShopMitgliedKategorien();

            return (data || []).map(k => ({
                id: k.id,
                code: k.code,
                name: k.name,
                preis: k.preis,
                is_active: k.is_active
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Mitglied-Kategorien:', error);
            return [];
        }
    },

    // ==================== KURSVERWALTUNG ====================

    async getKursKategorien() {
        try {
            return await ApiClient.getKursKategorien();
        } catch (error) {
            console.error('Fehler beim Laden der Kurs-Kategorien:', error);
            return [];
        }
    },

    async getKursAnbieter() {
        try {
            return await ApiClient.getKursAnbieter();
        } catch (error) {
            console.error('Fehler beim Laden der Kurs-Anbieter:', error);
            return [];
        }
    },

    async addKursAnbieter(anbieterData) {
        try {
            return await ApiClient.createKursAnbieter(anbieterData);
        } catch (error) {
            console.error('Fehler beim Hinzufuegen des Anbieters:', error);
            throw error;
        }
    },

    async deleteKursAnbieter(id) {
        try {
            // TODO: API-Route für delete Anbieter hinzufügen
            console.warn('deleteKursAnbieter noch nicht implementiert');
        } catch (error) {
            console.error('Fehler beim Loeschen des Anbieters:', error);
            throw error;
        }
    },

    async getKurse() {
        try {
            return await ApiClient.getKurse();
        } catch (error) {
            console.error('Fehler beim Laden der Kurse:', error);
            return [];
        }
    },

    async addKurs(kursData) {
        try {
            return await ApiClient.createKurs(kursData);
        } catch (error) {
            console.error('Fehler beim Hinzufuegen des Kurses:', error);
            throw error;
        }
    },

    async updateKurs(id, kursData) {
        try {
            return await ApiClient.updateKurs(id, kursData);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Kurses:', error);
            throw error;
        }
    },

    async getKursTermine() {
        try {
            // Alle Kurse laden und deren Termine sammeln
            const kurse = await ApiClient.getKurse();
            const alleTermine = [];
            for (const kurs of kurse) {
                const termine = await ApiClient.getKursTermine(kurs.id);
                alleTermine.push(...termine);
            }
            return alleTermine;
        } catch (error) {
            console.error('Fehler beim Laden der Kurs-Termine:', error);
            return [];
        }
    },

    async addKursTermin(terminData) {
        try {
            return await ApiClient.createKursTermin(terminData.kurs_id, terminData);
        } catch (error) {
            console.error('Fehler beim Hinzufuegen des Termins:', error);
            throw error;
        }
    },

    async updateKursTermin(id, terminData) {
        try {
            // TODO: API-Route für update Termin hinzufügen
            console.warn('updateKursTermin noch nicht implementiert');
            return terminData;
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Termins:', error);
            throw error;
        }
    },

    async getKursTeilnehmer() {
        try {
            // TODO: Alle Teilnehmer laden - braucht globale Route
            console.warn('getKursTeilnehmer global noch nicht implementiert');
            return [];
        } catch (error) {
            console.error('Fehler beim Laden der Kurs-Teilnehmer:', error);
            return [];
        }
    },

    async addKursTeilnehmer(teilnehmerData) {
        try {
            return await ApiClient.createKursTeilnehmer(teilnehmerData.termin_id, teilnehmerData);
        } catch (error) {
            // Ignoriere Duplikat-Fehler (UNIQUE constraint)
            if (error.message && error.message.includes('duplicate')) {
                console.log('Teilnehmer bereits vorhanden');
                return null;
            }
            console.error('Fehler beim Hinzufuegen des Teilnehmers:', error);
            throw error;
        }
    },

    async getAblaufendeZertifikate() {
        try {
            // TODO: View v_ablaufende_zertifikate via API bereitstellen
            console.warn('getAblaufendeZertifikate noch nicht via API implementiert');
            return [];
        } catch (error) {
            console.error('Fehler beim Laden der ablaufenden Zertifikate:', error);
            return [];
        }
    },

    // ==================== ANWESENHEITSPLANUNG ====================

    async getAnwesenheitRange(startDate, endDate) {
        try {
            const data = await ApiClient.getAnwesenheitPlanung({
                start_date: startDate,
                end_date: endDate
            });
            // Normalisiere Datum zu YYYY-MM-DD Format (PostgreSQL gibt oft ISO-8601 zurück)
            return (data || []).map(p => ({
                ...p,
                datum: p.datum ? p.datum.split('T')[0] : p.datum
            }));
        } catch (error) {
            console.error('Fehler beim Laden der Anwesenheit:', error);
            return [];
        }
    },

    async getHeuteAnwesend() {
        try {
            const data = await ApiClient.getHeuteAnwesend();
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der heutigen Anwesenheit:', error);
            return [];
        }
    },

    async upsertAnwesenheit(planungData) {
        try {
            const data = await ApiClient.upsertAnwesenheitPlanung(planungData);
            return data;
        } catch (error) {
            console.error('Fehler beim Speichern der Anwesenheit:', error);
            throw error;
        }
    },

    async getEssensgutscheinBestellungen() {
        try {
            // TODO: API-Route für Essensgutschein-Bestellungen hinzufügen
            console.warn('getEssensgutscheinBestellungen noch nicht via API implementiert');
            return [];
        } catch (error) {
            console.error('Fehler beim Laden der Bestellungen:', error);
            return [];
        }
    },

    async upsertEssensgutscheinBestellung(bestellungData) {
        try {
            // TODO: API-Route für Essensgutschein-Bestellungen hinzufügen
            console.warn('upsertEssensgutscheinBestellung noch nicht via API implementiert');
            return bestellungData;
        } catch (error) {
            console.error('Fehler beim Speichern der Bestellung:', error);
            throw error;
        }
    },

    async updateEssensgutscheinBestellung(id, bestellungData) {
        try {
            // TODO: API-Route für Essensgutschein-Bestellungen hinzufügen
            console.warn('updateEssensgutscheinBestellung noch nicht via API implementiert');
            return bestellungData;
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Bestellung:', error);
            throw error;
        }
    },

    // ==================== KURSKATEGORIEN CRUD ====================

    async addKursKategorie(kategorieData) {
        try {
            // TODO: API-Route für Kategorien CRUD hinzufügen
            console.warn('addKursKategorie noch nicht via API implementiert');
            return kategorieData;
        } catch (error) {
            console.error('Fehler beim Erstellen der Kurskategorie:', error);
            throw error;
        }
    },

    async updateKursKategorie(id, kategorieData) {
        try {
            // TODO: API-Route für Kategorien CRUD hinzufügen
            console.warn('updateKursKategorie noch nicht via API implementiert');
            return kategorieData;
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Kurskategorie:', error);
            throw error;
        }
    },

    async deleteKursKategorie(id) {
        try {
            // TODO: API-Route für Kategorien CRUD hinzufügen
            console.warn('deleteKursKategorie noch nicht via API implementiert');
            return true;
        } catch (error) {
            console.error('Fehler beim Loeschen der Kurskategorie:', error);
            throw error;
        }
    },

    // ==================== KURSANBIETER (aus suppliers) ====================

    async getKursanbieter() {
        try {
            // Kursanbieter sind Suppliers mit is_kursanbieter = true
            const suppliers = await ApiClient.getSuppliers();
            return (suppliers || [])
                .filter(s => s.is_kursanbieter)
                .map(s => ({
                    id: s.id,
                    fornitore_name: s.fornitore_name,
                    email: s.email,
                    phone: s.phone,
                    address: s.address,
                    name: s.fornitore_name
                }));
        } catch (error) {
            console.error('Fehler beim Laden der Kursanbieter:', error);
            return [];
        }
    }
};

// Automatisch initialisieren (immer, nicht nur bei Supabase)
// WICHTIG: Muss immer initialisiert werden, da app.js die Methoden benötigt
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        SupabaseDataAdapter.init();
    });
}

console.log('📦 API Data Adapter geladen (Hetzner Backend)');

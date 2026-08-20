/**
 * API Client for Hetzner Backend
 * Ersetzt Supabase-Client mit fetch()-basierter API
 * Projektsoftware Kunst Meran v3.0
 */

const ApiClient = {
    baseUrl: null,
    session: null,

    /**
     * Initialisierung
     */
    init() {
        this.baseUrl = Config.api.baseUrl;
        console.log('🔌 API Client initialisiert:', this.baseUrl);
    },

    /**
     * Basis-Fetch mit Error-Handling und Session
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            credentials: 'include', // Session-Cookie mitsenden
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const fetchOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, fetchOptions);

            if (response.status === 401) {
                // Nicht autorisiert - zur Login-Seite
                window.location.href = 'index.html';
                throw new Error('Nicht autorisiert');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ========== AUTH ==========

    async login(email, name, microsoftId) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, name, microsoft_id: microsoftId }),
        });
        this.session = data.user;
        return data;
    },

    async getSession() {
        try {
            const data = await this.request('/auth/session');
            this.session = data.user;
            return data.user;
        } catch (error) {
            this.session = null;
            return null;
        }
    },

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.session = null;
    },

    // ========== USERS ==========

    async getUsers() {
        return await this.request('/users');
    },

    async getUserById(id) {
        return await this.request(`/users/${id}`);
    },

    async updateUser(id, data) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async createUser(data) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ========== PROJECTS ==========

    async getProjects() {
        return await this.request('/projects');
    },

    async getProjectById(id) {
        return await this.request(`/projects/${id}`);
    },

    async createProject(data) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProject(id, data) {
        return await this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteProject(id) {
        return await this.request(`/projects/${id}`, { method: 'DELETE' });
    },

    // ========== INVOICES ==========

    async getInvoices(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/invoices${params ? '?' + params : ''}`);
    },

    async getInvoiceById(id) {
        return await this.request(`/invoices/${id}`);
    },

    async createInvoice(data) {
        return await this.request('/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateInvoice(id, data) {
        return await this.request(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteInvoice(id) {
        return await this.request(`/invoices/${id}`, { method: 'DELETE' });
    },

    // ========== DATEV BOOKINGS ==========

    async getDatevBookings(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/datev${params ? '?' + params : ''}`);
    },

    async getDatevBookingById(id) {
        return await this.request(`/datev/${id}`);
    },

    async getDatevAggregated(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/datev/aggregated${params ? '?' + params : ''}`);
    },

    async createDatevBooking(data) {
        return await this.request('/datev', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async importDatevBookings(bookings) {
        return await this.request('/datev/import', {
            method: 'POST',
            body: JSON.stringify({ bookings }),
        });
    },

    async getDatevYears() {
        return await this.request('/datev/years');
    },

    async updateDatevBooking(id, data) {
        return await this.request(`/datev/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteDatevBooking(id) {
        return await this.request(`/datev/${id}`, { method: 'DELETE' });
    },

    // ========== SUPPLIERS ==========

    async getSuppliers() {
        return await this.request('/suppliers');
    },

    async getSupplierById(id) {
        return await this.request(`/suppliers/${id}`);
    },

    async createSupplier(data) {
        return await this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateSupplier(id, data) {
        return await this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteSupplier(id) {
        return await this.request(`/suppliers/${id}`, { method: 'DELETE' });
    },

    // ========== MEMBERS ==========

    async getMembers() {
        return await this.request('/members');
    },

    async getMemberById(id) {
        return await this.request(`/members/${id}`);
    },

    async createMember(data) {
        return await this.request('/members', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateMember(id, data) {
        return await this.request(`/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteMember(id) {
        return await this.request(`/members/${id}`, { method: 'DELETE' });
    },

    async getMemberPayments(memberId) {
        return await this.request(`/members/${memberId}/payments`);
    },

    async createMemberPayment(memberId, data) {
        return await this.request(`/members/${memberId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ========== FUNDING SOURCES ==========

    async getFundingSources(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/funding-sources${params ? '?' + params : ''}`);
    },

    async getFundingSourceById(id) {
        return await this.request(`/funding-sources/${id}`);
    },

    async getActiveAbgabestellen(year = null) {
        const filters = { is_abgabestelle: 'true' };
        if (year) filters.year = year;
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/funding-sources${params ? '?' + params : ''}`);
    },

    async createFundingSource(data) {
        return await this.request('/funding-sources', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateFundingSource(id, data) {
        return await this.request(`/funding-sources/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteFundingSource(id) {
        return await this.request(`/funding-sources/${id}`, { method: 'DELETE' });
    },

    async getFundingSourceExpenses(fundingSourceId) {
        return await this.request(`/funding-sources/${fundingSourceId}/expenses`);
    },

    async updateInvoiceFundingSource(invoiceId, fundingSourceId) {
        return await this.request(`/invoices/${invoiceId}`, {
            method: 'PUT',
            body: JSON.stringify({ funding_source_id: fundingSourceId }),
        });
    },

    // ========== BUDGET ==========

    async getBudgetEntries(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/budget/entries${params ? '?' + params : ''}`);
    },

    async upsertBudgetEntry(data) {
        return await this.request('/budget/entries', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getKontenplan() {
        return await this.request('/budget/kontenplan');
    },

    async getKontoBezeichnungen() {
        return await this.request('/budget/konto-bezeichnungen');
    },

    async getBudgetNotes(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/budget/notes${params ? '?' + params : ''}`);
    },

    async createBudgetNote(data) {
        return await this.request('/budget/notes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getKontoNotes(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/budget/konto-notes${params ? '?' + params : ''}`);
    },

    async upsertKontoNote(data) {
        return await this.request('/budget/konto-notes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getCostTypes() {
        return await this.request('/budget/cost-types');
    },

    // ========== SHOP ==========

    async getShopArtikel() {
        return await this.request('/shop/artikel');
    },

    async createShopArtikel(data) {
        return await this.request('/shop/artikel', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateShopArtikel(id, data) {
        return await this.request(`/shop/artikel/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getShopArtikeltypen() {
        return await this.request('/shop/artikeltypen');
    },

    async getShopVerkaeufe(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/shop/verkaeufe${params ? '?' + params : ''}`);
    },

    async createShopVerkauf(data) {
        return await this.request('/shop/verkaeufe', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getShopEinkaeufe() {
        return await this.request('/shop/einkaeufe');
    },

    async createShopEinkauf(data) {
        return await this.request('/shop/einkaeufe', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getShopEintrittKategorien() {
        return await this.request('/shop/eintritt-kategorien');
    },

    async getShopMitgliedKategorien() {
        return await this.request('/shop/mitglied-kategorien');
    },

    async getShopKassenBewegungen(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/shop/kassen-bewegungen${params ? '?' + params : ''}`);
    },

    async createShopKassenBewegung(data) {
        return await this.request('/shop/kassen-bewegungen', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getShopKassenabschluss(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/shop/kassenabschluss${params ? '?' + params : ''}`);
    },

    async upsertShopKassenabschluss(data) {
        return await this.request('/shop/kassenabschluss', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getShopAusgaben() {
        return await this.request('/shop/ausgaben');
    },

    async createShopAusgabe(data) {
        return await this.request('/shop/ausgaben', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getShopExterneEmpfaenger() {
        return await this.request('/shop/externe-empfaenger');
    },

    async getShopRechnungen() {
        return await this.request('/shop/rechnungen');
    },

    async createShopRechnung(data) {
        return await this.request('/shop/rechnungen', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ========== WORKSPACES ==========

    async getWorkspaces() {
        return await this.request('/workspaces');
    },

    async getWorkspaceById(id) {
        return await this.request(`/workspaces/${id}`);
    },

    async createWorkspace(data) {
        return await this.request('/workspaces', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateWorkspace(id, data) {
        return await this.request(`/workspaces/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getWorkspaceUsers(workspaceId) {
        return await this.request(`/workspaces/${workspaceId}/users`);
    },

    async assignUserToWorkspace(workspaceId, userId) {
        return await this.request(`/workspaces/${workspaceId}/users`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    },

    async removeUserFromWorkspace(workspaceId, userId) {
        return await this.request(`/workspaces/${workspaceId}/users/${userId}`, {
            method: 'DELETE',
        });
    },

    async getUserPermissions(userId) {
        return await this.request(`/workspaces/permissions/${userId}`);
    },

    // ========== TIME ENTRIES ==========

    async getTimeEntries(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/zeiterfassung${params ? '?' + params : ''}`);
    },

    async getTimeEntryById(id) {
        return await this.request(`/zeiterfassung/${id}`);
    },

    async getTimeEntriesStats(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/zeiterfassung/stats/summary${params ? '?' + params : ''}`);
    },

    async createTimeEntry(data) {
        return await this.request('/zeiterfassung', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateTimeEntry(id, data) {
        return await this.request(`/zeiterfassung/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteTimeEntry(id) {
        return await this.request(`/zeiterfassung/${id}`, { method: 'DELETE' });
    },

    // ========== KURSE ==========

    async getKurse() {
        return await this.request('/kurse');
    },

    async getKursById(id) {
        return await this.request(`/kurse/${id}`);
    },

    async createKurs(data) {
        return await this.request('/kurse', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateKurs(id, data) {
        return await this.request(`/kurse/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteKurs(id) {
        return await this.request(`/kurse/${id}`, { method: 'DELETE' });
    },

    async getKursTermine(kursId) {
        return await this.request(`/kurse/${kursId}/termine`);
    },

    async createKursTermin(kursId, data) {
        return await this.request(`/kurse/${kursId}/termine`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getKursTeilnehmer(terminId) {
        return await this.request(`/kurse/termine/${terminId}/teilnehmer`);
    },

    async addKursTeilnehmer(terminId, data) {
        return await this.request(`/kurse/termine/${terminId}/teilnehmer`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getKursKategorien() {
        return await this.request('/kurse/kategorien/all');
    },

    async getKursAnbieter() {
        return await this.request('/kurse/anbieter/all');
    },

    async createKursAnbieter(data) {
        return await this.request('/kurse/anbieter', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // ========== ANWESENHEIT ==========

    async getAnwesenheitPlanung(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/anwesenheit/planung${params ? '?' + params : ''}`);
    },

    async getHeuteAnwesend() {
        return await this.request('/anwesenheit/heute');
    },

    async upsertAnwesenheitPlanung(data) {
        return await this.request('/anwesenheit/planung', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateAnwesenheitPlanung(id, data) {
        return await this.request(`/anwesenheit/planung/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteAnwesenheitPlanung(id) {
        return await this.request(`/anwesenheit/planung/${id}`, { method: 'DELETE' });
    },

    async getAnwesenheitSummary(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/anwesenheit/summary${params ? '?' + params : ''}`);
    },

    // ========== STORAGE ==========

    async uploadFile(folder, file, filename = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (filename) {
            formData.append('filename', filename);
        }

        const response = await fetch(`${this.baseUrl}/storage/${folder}`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `Upload failed: ${response.status}`);
        }

        return await response.json();
    },

    async listFiles(folder) {
        return await this.request(`/storage/${folder}`);
    },

    async deleteFile(folder, filename) {
        return await this.request(`/storage/${folder}/${filename}`, { method: 'DELETE' });
    },

    getFileUrl(path) {
        return `${Config.storage.baseUrl}/${path}`;
    },

    // ========== HEALTH CHECK ==========

    async healthCheck() {
        return await this.request('/health');
    }
};

// Initialisierung
ApiClient.init();

console.log('🔌 API Client geladen');

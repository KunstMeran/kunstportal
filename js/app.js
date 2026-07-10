/**
 * PROJEKTSOFTWARE KUNST MERAN - APP MODULE
 * Hauptanwendungslogik mit DATEV-Integration
 * Version: 3.0.0
 */

const App = {
    currentView: 'dashboard',
    currentProjectId: null,
    currentRechnungId: null,
    currentPdfPath: null,

    // Pagination
    currentRechnungenPage: 1,
    rechnungenPerPage: 20,
    filteredRechnungen: [],

    // Sortierung
    currentSortColumn: 'datum',
    currentSortDirection: 'desc',

    /**
     * App initialisieren
     */
    init: async function() {
        // Auth prüfen
        const isAuthenticated = await Auth.checkAuth();
        if (!isAuthenticated) return;

        // Benutzerinfo laden
        await this.loadUserInfo();

        // Navigation Setup
        this.setupNavigation();

        // Tab Setup
        this.setupTabs();

        // File Upload Setup
        this.setupFileUpload();

        // Mass Upload Setup
        this.setupMassUpload();

        // DATEV-Daten laden
        await this.loadDatevData();

        // Letzte View wiederherstellen oder Dashboard laden
        const lastView = localStorage.getItem('lastView') || 'dashboard';
        this.showView(lastView);

        // Click-Effekte aktivieren
        this.setupClickEffects();
    },

    /**
     * Click-Effekte Setup
     */
    setupClickEffects: function() {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

        document.addEventListener('click', (e) => {
            const container = document.getElementById('click-effect-container');
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';

            // Zufällige Farbe
            const color = colors[Math.floor(Math.random() * colors.length)];
            ripple.style.background = color;
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';

            container.appendChild(ripple);

            // Nach Animation entfernen
            setTimeout(() => ripple.remove(), 600);
        });
    },

    /**
     * DATEV-Daten aus buchungen.json laden
     */
    loadDatevData: async function() {
        try {
            const data = await DataManager.loadBuchungenJSON();
            if (data) {
                console.log('DATEV-Daten geladen:', data.buchungen?.length || 0, 'Buchungen');
            }
            // Jahr-Auswahl initialisieren
            await this.initYearSelector();
        } catch (error) {
            console.log('Keine DATEV-Daten vorhanden');
        }
    },

    /**
     * Jahr-Auswahl initialisieren
     */
    initYearSelector: async function() {
        const yearSelector = document.getElementById('year-selector');
        if (!yearSelector) return;

        // Verfügbare Jahre laden
        const years = await DataManager.getAvailableYears();

        if (years.length <= 1) {
            // Nur aktuelles Jahr, Auswahl verstecken
            yearSelector.style.display = 'none';
            return;
        }

        // Dropdown befüllen
        yearSelector.innerHTML = '';
        years.forEach(y => {
            const option = document.createElement('option');
            option.value = y.year === null ? '' : y.year;
            option.textContent = y.label;
            if (y.isCurrent && DataManager.getCurrentLoadedYear() === null) {
                option.selected = true;
            } else if (y.year === DataManager.getCurrentLoadedYear()) {
                option.selected = true;
            }
            yearSelector.appendChild(option);
        });

        // Event Listener
        yearSelector.onchange = async () => {
            const selectedYear = yearSelector.value ? parseInt(yearSelector.value) : null;
            await this.switchYear(selectedYear);
        };

        yearSelector.style.display = '';
    },

    /**
     * Jahr wechseln
     */
    switchYear: async function(year) {
        const loadingIndicator = document.getElementById('year-loading');
        if (loadingIndicator) loadingIndicator.style.display = 'inline';

        try {
            if (year === null) {
                await DataManager.loadCurrentYear();
            } else {
                await DataManager.loadArchivedYear(year);
            }

            // Aktuelle Ansicht neu laden
            this.showView(this.currentView);

            // Hinweis für Archiv-Ansicht
            const archiveNotice = document.getElementById('archive-notice');
            if (archiveNotice) {
                if (year !== null) {
                    archiveNotice.textContent = 'Archiv ' + year + ' wird angezeigt (nur Ansicht, keine Bearbeitung)';
                    archiveNotice.style.display = 'block';
                } else {
                    archiveNotice.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Fehler beim Jahr-Wechsel:', error);
            alert('Fehler beim Laden des Jahres: ' + error.message);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    },

    /**
     * Benutzerinfo in Sidebar anzeigen
     */
    loadUserInfo: async function() {
        const user = await Auth.getCurrentUser();
        if (user) {
            const userName = user.name || user.username || user.email?.split('@')[0] || 'User';
            const userRole = user.role || 'Admin';

            document.getElementById('user-name').textContent = userName;
            document.getElementById('user-role').textContent = userRole === 'admin' || userRole === 'Admin' ? 'Administrator' : 'Mitarbeiter';
            document.getElementById('user-avatar').textContent = userName.charAt(0).toUpperCase();

            // Admin-only Elemente anzeigen/verstecken
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                el.style.display = Auth.isAdmin() ? '' : 'none';
            });
        }
    },

    /**
     * Navigation Setup
     */
    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.showView(view);
            });
        });
    },

    /**
     * Tab Setup
     */
    setupTabs: function() {
        const tabs = document.querySelectorAll('.tab[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');

                // Tabs aktualisieren
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Tab-Content aktualisieren
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                document.getElementById('tab-' + tabId).classList.add('active');
            });
        });
    },

    /**
     * View anzeigen
     */
    showView: async function(viewName) {
        // Navigation aktualisieren
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === viewName) {
                item.classList.add('active');
            }
        });

        // Views verstecken
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });

        // Ausgewählte View anzeigen
        const viewElement = document.getElementById('view-' + viewName);
        if (viewElement) {
            viewElement.classList.remove('hidden');
        }

        this.currentView = viewName;

        // View in localStorage speichern
        localStorage.setItem('lastView', viewName);

        // View-spezifische Initialisierung
        switch(viewName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'projekte':
                await this.loadProjects();
                break;
            case 'rechnungen':
                await this.loadRechnungen();
                break;
            case 'lieferanten':
                this.loadLieferanten();
                break;
            case 'kosten':
                this.loadCosts();
                break;
            case 'zeiterfassung':
                this.loadTimeTracking();
                break;
            case 'sitzungen':
                this.loadSitzungen();
                break;
            case 'kuenstler':
                this.loadKuenstler();
                break;
            case 'inventar':
                this.loadInventar();
                break;
            case 'adressen':
                this.loadAdressen();
                break;
            case 'reporting':
                this.loadReporting();
                break;
            case 'einnahmen':
                this.loadEinnahmen();
                break;
            case 'konfiguration':
                this.loadConfiguration();
                break;
        }
    },

    // ==========================================
    // DASHBOARD
    // ==========================================

    loadDashboard: function() {
        const summaries = DataManager.getAllProjectsSummary();

        // Statistiken berechnen
        const activeProjects = summaries.filter(s => s.project.status === 'laufend').length;
        const totalBudget = summaries.reduce((sum, s) => sum + s.budget, 0);
        const totalSpent = summaries.reduce((sum, s) => sum + s.ist, 0);
        const totalPlanned = summaries.reduce((sum, s) => sum + s.provisorisch, 0);

        // Stats aktualisieren
        document.getElementById('stat-projects').textContent = activeProjects;
        document.getElementById('stat-budget').textContent = this.formatCurrency(totalBudget);
        document.getElementById('stat-spent').textContent = this.formatCurrency(totalSpent);
        document.getElementById('stat-available').textContent = this.formatCurrency(totalBudget - totalSpent - totalPlanned);

        // Projekt-Übersicht laden
        this.loadDashboardProjects(summaries);
    },

    loadDashboardProjects: function(summaries) {
        const container = document.getElementById('dashboard-projects');
        container.innerHTML = '';

        // Nur laufende und Planungsprojekte
        const activeProjects = summaries.filter(s =>
            s.project.status === 'laufend' || s.project.status === 'planung'
        );

        if (activeProjects.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 1rem;">Keine aktiven Projekte</p>';
            return;
        }

        activeProjects.forEach(summary => {
            const html = `
                <div class="project-row" onclick="App.openProjectFullpage(${summary.project.id})">
                    <div class="project-info">
                        <strong>${summary.project.name}</strong>
                        <span class="badge badge-${summary.project.status === 'laufend' ? 'success' : 'primary'}">
                            ${summary.project.status}
                        </span>
                    </div>
                    <div class="budget-visual">
                        <div class="budget-bar">
                            <div class="budget-segment spent" style="width: ${Math.min(summary.prozentVerbraucht, 100)}%"></div>
                            <div class="budget-segment provisional" style="width: ${Math.min(summary.prozentGeplant - summary.prozentVerbraucht, 100 - summary.prozentVerbraucht)}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 0.25rem;">
                            <span>IST: ${this.formatCurrency(summary.ist)}</span>
                            <span>Budget: ${this.formatCurrency(summary.budget)}</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    },

    // ==========================================
    // PROJEKTE
    // ==========================================

    loadProjects: async function() {
        const projects = await DataManager.getProjects();
        const container = document.getElementById('projects-table-body');
        container.innerHTML = '';

        // Zeige erstmal Basis-Infos (Summary später nachladen)
        projects.forEach(project => {
            const statusBadge = this.getStatusBadge(project.status);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${project.name}</strong></td>
                <td>${project.location}</td>
                <td>${statusBadge}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.openProjectFullpage('${project.id}')">Details</button>
                    ${Auth.isAdmin() ? `
                        <button class="btn btn-sm btn-primary" onclick="App.editProject('${project.id}')">Bearbeiten</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteProject('${project.id}')">Löschen</button>
                    ` : ''}
                </td>
            `;
            container.appendChild(row);
        });
    },

    // ==========================================
    // FULLPAGE PROJECT VIEW
    // ==========================================

    openProjectFullpage: async function(projectId) {
        this.currentProjectId = projectId;

        // Projekt direkt laden
        const project = await DataManager.getProjectById(projectId);
        if (!project) {
            alert('Projekt nicht gefunden');
            return;
        }

        // Header
        document.getElementById('fullpage-project-name').textContent = project.name;

        // Projekt-Info
        document.getElementById('fp-location').textContent = project.location;
        document.getElementById('fp-datev-id').textContent = project.datevId || '-';
        document.getElementById('fp-period').textContent = `${this.formatDate(project.startDate)} - ${this.formatDate(project.endDate)}`;
        document.getElementById('fp-status').innerHTML = this.getStatusBadge(project.status);
        document.getElementById('fp-description').textContent = project.description || '-';
        document.getElementById('fp-hours').textContent = '- Std.'; // TODO: Später berechnen

        // Budget-Übersicht (Platzhalter)
        document.getElementById('fp-budget-total').textContent = '-';
        document.getElementById('fp-ist-total').textContent = '-';
        document.getElementById('fp-prov-total').textContent = '-';
        document.getElementById('fp-available').textContent = '-';

        // Planvergleich (Platzhalter)
        document.getElementById('fp-planned-original').textContent = '-';
        document.getElementById('fp-planned-deviation').textContent = '-';

        // Personalkosten (Platzhalter)
        document.getElementById('fp-labor-cost').textContent = '-';

        // Budget-Balken (Platzhalter)
        document.getElementById('fp-budget-bar').innerHTML = '';

        // Admin-Buttons aktualisieren
        document.querySelectorAll('#project-fullpage .admin-only').forEach(el => {
            el.style.display = Auth.isAdmin() ? '' : 'none';
        });

        // Fullpage anzeigen
        document.getElementById('project-fullpage').classList.add('show');

        // Kosten und Details asynchron nachladen
        this.loadProjectDetails(projectId);
    },

    async loadProjectDetails(projectId) {
        try {
            // Kosten laden
            const costs = await DataManager.getCostsByProject(projectId);

            // TODO: Summary berechnen und anzeigen
            // Erstmal nur Kosten-Liste anzeigen
            this.displayProjectCosts(costs);
        } catch (error) {
            console.error('Fehler beim Laden der Projekt-Details:', error);
        }
    },

    displayProjectCosts(costs) {
        // TODO: Kosten in der Fullpage-View anzeigen
        console.log('Geladene Kosten:', costs);
    },

    closeProjectFullpage: function() {
        document.getElementById('project-fullpage').classList.remove('show');
        this.currentProjectId = null;

        // View aktualisieren
        if (this.currentView === 'projekte') {
            this.loadProjects();
        } else if (this.currentView === 'dashboard') {
            this.loadDashboard();
        }
    },

    populateProjectFilters: function() {
        const costTypes = DataManager.getActiveCostTypes();
        const suppliers = DataManager.getActiveSuppliers();

        // Kategorie-Filter
        const categorySelect = document.getElementById('fp-filter-category');
        categorySelect.innerHTML = '<option value="">Alle Kategorien</option>';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${ct.name}">${ct.name}</option>`;
        });

        // Lieferant-Filter
        const supplierSelect = document.getElementById('fp-filter-supplier');
        supplierSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        suppliers.forEach(s => {
            supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
    },

    filterProjectCosts: function() {
        if (!this.currentProjectId) return;

        const categoryFilter = document.getElementById('fp-filter-category').value;
        const supplierFilter = document.getElementById('fp-filter-supplier').value;
        const typeFilter = document.getElementById('fp-filter-type').value;

        // Manuelle Kosten
        let costs = DataManager.getCostsByProject(this.currentProjectId);

        // DATEV-Buchungen für dieses Projekt holen (mit Status inkl. Kostentyp)
        const datevBuchungen = DataManager.getRechnungenMitStatus().filter(b =>
            String(b.projektId) === String(this.currentProjectId)
        );

        // DATEV-Buchungen in einheitliches Format konvertieren
        const datevCosts = datevBuchungen.map(b => {
            // Kostentyp-Name ermitteln
            const kostentypName = b.kostentyp ? DataManager.getKostentypName(b.kostentyp) : null;
            return {
                id: 'datev_' + b.id,
                date: b.datum,
                category: kostentypName || 'Nicht zugeordnet',
                categoryId: b.kostentyp,
                description: b.beschreibung || b.dokumentNr,
                amount: b.betrag,
                type: 'ist',
                isDatev: true,
                lieferant: b.fornitoreName || b.partitaIva || '-',
                dokumentNr: b.dokumentNr,
                rechnungId: b.rechnungId
            };
        });

        // Beide Listen zusammenführen
        let allCosts = [...costs, ...datevCosts];

        // Filter anwenden
        if (categoryFilter) {
            allCosts = allCosts.filter(c => c.category === categoryFilter);
        }
        if (supplierFilter && supplierFilter !== '') {
            // Nur manuelle Kosten filtern (DATEV haben keinen supplierId)
            allCosts = allCosts.filter(c => c.isDatev || c.supplierId === parseInt(supplierFilter));
        }
        if (typeFilter) {
            allCosts = allCosts.filter(c => c.type === typeFilter);
        }

        // Sortieren nach Datum
        allCosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Tabelle befüllen
        const tbody = document.getElementById('fp-costs-table');
        tbody.innerHTML = '';

        allCosts.forEach(cost => {
            const row = document.createElement('tr');

            if (cost.isDatev) {
                // DATEV-Buchung - Kostentyp oder "Nicht zugeordnet" anzeigen
                const categoryStyle = cost.categoryId
                    ? ''
                    : 'background: #fff3e0; color: #e65100;';
                row.innerHTML = `
                    <td>${this.formatDate(cost.date)}</td>
                    <td>
                        <span class="badge" style="${categoryStyle || 'background: #e8f5e9; color: #2e7d32;'}">${cost.category}</span>
                    </td>
                    <td>${cost.lieferant}</td>
                    <td>${cost.description} <small style="color: #666;">(${cost.dokumentNr})</small></td>
                    <td>
                        <span class="badge badge-danger">IST</span>
                    </td>
                    <td style="text-align: right; ${cost.amount < 0 ? 'color: #e74c3c;' : ''}">${this.formatCurrency(cost.amount)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="App.showDatevRechnungDetail('${cost.dokumentNr}')">Details</button>
                    </td>
                `;
            } else {
                // Manuelle Kosten
                const supplier = cost.supplierId ? DataManager.getSupplierById(cost.supplierId) : null;
                row.innerHTML = `
                    <td>${this.formatDate(cost.date)}</td>
                    <td>${cost.category}</td>
                    <td>${supplier ? supplier.name : '-'}</td>
                    <td>${cost.description}</td>
                    <td>
                        <span class="badge badge-${cost.type === 'ist' ? 'danger' : 'warning'}">
                            ${cost.type === 'ist' ? 'IST' : 'Geplant'}
                        </span>
                    </td>
                    <td style="text-align: right;">${this.formatCurrency(cost.amount)}</td>
                    <td>
                        ${cost.type === 'provisorisch' ? `
                            <button class="btn btn-sm btn-convert" onclick="App.showConvertModal(${cost.id})">In IST</button>
                        ` : ''}
                        ${Auth.isAdmin() ? `
                            <button class="btn btn-sm btn-primary" onclick="App.editCost(${cost.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteCostFromProject(${cost.id})">X</button>
                        ` : ''}
                    </td>
                `;
            }
            tbody.appendChild(row);
        });

        if (allCosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Keine Kosten gefunden</td></tr>';
        }
    },

    showDatevRechnungDetail: function(dokumentNr) {
        // Finde die Rechnung und zeige Details
        const rechnungen = DataManager.getRechnungenMitStatus();
        const rechnung = rechnungen.find(r => r.dokumentNr === dokumentNr);
        if (rechnung) {
            this.showRechnungDetail(rechnung.rechnungId);
        }
    },

    loadCategoryBreakdown: function(projectId) {
        const categories = DataManager.getCostsByCategory(projectId);
        const container = document.getElementById('fp-category-breakdown');
        container.innerHTML = '';

        const costTypes = DataManager.getActiveCostTypes();

        for (const [category, data] of Object.entries(categories)) {
            const costType = costTypes.find(ct => ct.name === category);
            const color = costType ? costType.color : '#95a5a6';

            container.innerHTML += `
                <div style="padding: 0.75rem 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
                            <span style="font-weight: 500;">${category}</span>
                        </div>
                        <span style="font-weight: 600;">${this.formatCurrency(data.total)}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #666; margin-left: 20px; margin-top: 0.25rem;">
                        IST: ${this.formatCurrency(data.ist)} | Geplant: ${this.formatCurrency(data.provisorisch)}
                    </div>
                </div>
            `;
        }

        if (Object.keys(categories).length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Keine Kosten erfasst</p>';
        }
    },

    editCurrentProject: function() {
        if (this.currentProjectId) {
            this.editProject(this.currentProjectId);
        }
    },

    showNewCostFormForProject: function() {
        this.showNewCostForm(this.currentProjectId);
    },

    deleteCostFromProject: function(costId) {
        if (confirm('Kosten wirklich löschen?')) {
            DataManager.deleteCost(costId);
            this.filterProjectCosts();

            // Budget-Übersicht aktualisieren
            const summary = DataManager.getProjectSummary(this.currentProjectId);
            document.getElementById('fp-ist-total').textContent = this.formatCurrency(summary.ist);
            document.getElementById('fp-prov-total').textContent = this.formatCurrency(summary.provisorisch);
            document.getElementById('fp-available').textContent = this.formatCurrency(summary.verfuegbar);
            this.loadCategoryBreakdown(this.currentProjectId);
        }
    },

    // ==========================================
    // KOSTEN UMWANDELN
    // ==========================================

    showConvertModal: function(costId) {
        document.getElementById('convert-cost-id').value = costId;
        document.getElementById('convert-invoice').value = '';
        this.showModal('convert-form-modal');
    },

    confirmConvert: function(event) {
        event.preventDefault();

        const costId = parseInt(document.getElementById('convert-cost-id').value);
        const invoice = document.getElementById('convert-invoice').value;

        DataManager.convertToEffective(costId, invoice);

        this.hideModal('convert-form-modal');

        // View aktualisieren
        if (this.currentProjectId) {
            this.filterProjectCosts();
            const summary = DataManager.getProjectSummary(this.currentProjectId);
            document.getElementById('fp-ist-total').textContent = this.formatCurrency(summary.ist);
            document.getElementById('fp-prov-total').textContent = this.formatCurrency(summary.provisorisch);
            document.getElementById('fp-available').textContent = this.formatCurrency(summary.verfuegbar);

            // Budget-Balken aktualisieren
            const budgetBar = document.getElementById('fp-budget-bar');
            budgetBar.innerHTML = `
                <div class="budget-segment spent" style="width: ${Math.min(summary.prozentVerbraucht, 100)}%"></div>
                <div class="budget-segment provisional" style="width: ${Math.min(summary.prozentGeplant - summary.prozentVerbraucht, 100 - summary.prozentVerbraucht)}%"></div>
            `;

            this.loadCategoryBreakdown(this.currentProjectId);
        } else {
            this.filterCosts();
        }
    },

    // ==========================================
    // PROJEKT-FORMULARE
    // ==========================================

    showNewProjectForm: function() {
        document.getElementById('project-form').reset();
        document.getElementById('project-form-id').value = '';
        document.getElementById('project-modal-title').textContent = 'Neues Projekt';
        this.showModal('project-form-modal');
    },

    editProject: async function(projectId) {
        const project = await DataManager.getProjectById(projectId);
        if (!project) return;

        document.getElementById('project-form-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-location').value = project.location;
        document.getElementById('project-datev-id').value = project.datevId || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-start').value = project.startDate;
        document.getElementById('project-end').value = project.endDate;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-budget').value = project.budget;

        document.getElementById('project-modal-title').textContent = 'Projekt bearbeiten';
        this.showModal('project-form-modal');
    },

    saveProject: async function(event) {
        event.preventDefault();

        const id = document.getElementById('project-form-id').value;
        const projectData = {
            name: document.getElementById('project-name').value,
            location: document.getElementById('project-location').value,
            datevId: document.getElementById('project-datev-id').value,
            description: document.getElementById('project-description').value,
            startDate: document.getElementById('project-start').value,
            endDate: document.getElementById('project-end').value,
            status: document.getElementById('project-status').value,
            budget: parseFloat(document.getElementById('project-budget').value) || 0
        };

        if (id) {
            // ID direkt verwenden (UUID für Supabase, Nummer für localStorage)
            await DataManager.updateProject(id, projectData);
        } else {
            await DataManager.addProject(projectData);
        }

        this.hideModal('project-form-modal');
        await this.loadProjects();

        // Fullpage aktualisieren falls offen
        if (this.currentProjectId && id && id === this.currentProjectId) {
            await this.openProjectFullpage(this.currentProjectId);
        }
    },

    deleteProject: function(projectId) {
        if (confirm('Projekt wirklich löschen? Alle zugehörigen Budgets und Kosten werden ebenfalls gelöscht.')) {
            DataManager.deleteProject(projectId);
            this.loadProjects();
        }
    },

    showProjectDetail: function(projectId) {
        // Weiterleitung zur Fullpage-Ansicht
        this.openProjectFullpage(projectId);
    },

    // ==========================================
    // KOSTEN
    // ==========================================

    loadCosts: function() {
        // Projekt-Dropdown befüllen
        const projectSelect = document.getElementById('cost-filter-project');
        const projects = DataManager.getProjects();
        projectSelect.innerHTML = '<option value="">Alle Projekte</option>';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-filter-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '<option value="">Alle Kategorien</option>';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${ct.name}">${ct.name}</option>`;
        });

        // Lieferant-Dropdown befüllen
        const supplierSelect = document.getElementById('cost-filter-supplier');
        const suppliers = DataManager.getActiveSuppliers();
        supplierSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        suppliers.forEach(s => {
            supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });

        this.filterCosts();
    },

    filterCosts: function() {
        const projectId = document.getElementById('cost-filter-project').value;
        const type = document.getElementById('cost-filter-type').value;
        const category = document.getElementById('cost-filter-category').value;
        const supplierId = document.getElementById('cost-filter-supplier').value;

        let costs = DataManager.getCosts();

        if (projectId) {
            costs = costs.filter(c => c.projectId === parseInt(projectId));
        }
        if (type) {
            costs = costs.filter(c => c.type === type);
        }
        if (category) {
            costs = costs.filter(c => c.category === category);
        }
        if (supplierId) {
            costs = costs.filter(c => c.supplierId === parseInt(supplierId));
        }

        // Sortieren nach Datum (neueste zuerst)
        costs.sort((a, b) => new Date(b.date) - new Date(a.date));

        const container = document.getElementById('costs-table-body');
        container.innerHTML = '';

        costs.forEach(cost => {
            const project = DataManager.getProjectById(cost.projectId);
            const supplier = cost.supplierId ? DataManager.getSupplierById(cost.supplierId) : null;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(cost.date)}</td>
                <td>${project ? project.name : '-'}</td>
                <td>
                    <span class="badge badge-${cost.type === 'ist' ? 'danger' : 'warning'}">
                        ${cost.type === 'ist' ? 'IST' : 'Prov.'}
                    </span>
                </td>
                <td>${cost.category}</td>
                <td>${supplier ? supplier.name : '-'}</td>
                <td>${cost.description}</td>
                <td>${cost.invoice || '-'}</td>
                <td style="text-align: right;">${this.formatCurrency(cost.amount)}</td>
                <td>
                    ${cost.type === 'provisorisch' ? `
                        <button class="btn btn-sm btn-convert" onclick="App.showConvertModal(${cost.id})">In IST</button>
                    ` : ''}
                    ${Auth.isAdmin() ? `
                        <button class="btn btn-sm btn-primary" onclick="App.editCost(${cost.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteCost(${cost.id})">X</button>
                    ` : ''}
                </td>
            `;
            container.appendChild(row);
        });
    },

    showNewCostForm: function(preselectedProjectId) {
        document.getElementById('cost-form').reset();
        document.getElementById('cost-form-id').value = '';
        document.getElementById('cost-modal-title').textContent = 'Kosten erfassen';

        // Projekt-Dropdown befüllen
        const projectSelect = document.getElementById('cost-project');
        const projects = DataManager.getProjects();
        projectSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        projects.forEach(p => {
            const selected = preselectedProjectId && p.id === preselectedProjectId ? 'selected' : '';
            projectSelect.innerHTML += `<option value="${p.id}" ${selected}>${p.name}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${ct.name}">${ct.name}</option>`;
        });

        // Lieferant-Dropdown befüllen (Manuelle + DATEV-Lieferanten)
        const supplierSelect = document.getElementById('cost-supplier');
        const suppliers = DataManager.getActiveSuppliers();
        const datevLieferanten = DataManager.getDatevLieferanten();

        supplierSelect.innerHTML = '<option value="">-- Kein Lieferant --</option>';

        // DATEV-Lieferanten zuerst (mit Kennzeichnung)
        if (datevLieferanten.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="DATEV-Lieferanten">';
            datevLieferanten.forEach(l => {
                supplierSelect.innerHTML += `<option value="datev_${l.partitaIva}">${l.name} (${l.partitaIva})</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        // Manuelle Lieferanten
        if (suppliers.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="Manuelle Lieferanten">';
            suppliers.forEach(s => {
                supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        // Heutiges Datum als Standard
        document.getElementById('cost-date').value = new Date().toISOString().split('T')[0];

        // MwSt-Typ auf Standard setzen
        document.getElementById('cost-mwst-type').value = 'brutto_it';

        this.showModal('cost-form-modal');
        this.updateMwstPreview();
    },

    editCost: function(costId) {
        const cost = DataManager.getCosts().find(c => c.id === costId);
        if (!cost) return;

        // Projekt-Dropdown befüllen
        const projectSelect = document.getElementById('cost-project');
        const projects = DataManager.getProjects();
        projectSelect.innerHTML = '';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}" ${p.id === cost.projectId ? 'selected' : ''}>${p.name}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${ct.name}" ${ct.name === cost.category ? 'selected' : ''}>${ct.name}</option>`;
        });

        // Lieferant-Dropdown befüllen (Manuelle + DATEV-Lieferanten)
        const supplierSelect = document.getElementById('cost-supplier');
        const suppliers = DataManager.getActiveSuppliers();
        const datevLieferanten = DataManager.getDatevLieferanten();

        supplierSelect.innerHTML = '<option value="">-- Kein Lieferant --</option>';

        // DATEV-Lieferanten
        if (datevLieferanten.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="DATEV-Lieferanten">';
            datevLieferanten.forEach(l => {
                const value = `datev_${l.partitaIva}`;
                const selected = cost.supplierId === value ? 'selected' : '';
                supplierSelect.innerHTML += `<option value="${value}" ${selected}>${l.name} (${l.partitaIva})</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        // Manuelle Lieferanten
        if (suppliers.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="Manuelle Lieferanten">';
            suppliers.forEach(s => {
                const selected = cost.supplierId === s.id ? 'selected' : '';
                supplierSelect.innerHTML += `<option value="${s.id}" ${selected}>${s.name}</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        document.getElementById('cost-form-id').value = cost.id;
        document.getElementById('cost-type').value = cost.type;
        document.getElementById('cost-description').value = cost.description;
        document.getElementById('cost-amount').value = cost.amount;
        document.getElementById('cost-date').value = cost.date;
        document.getElementById('cost-invoice').value = cost.invoice || '';
        document.getElementById('cost-mwst-type').value = cost.mwstType || 'brutto_it';

        document.getElementById('cost-modal-title').textContent = 'Kosten bearbeiten';
        this.showModal('cost-form-modal');
        this.updateMwstPreview();
    },

    /**
     * Berechnet und zeigt MwSt-Preview an
     */
    updateMwstPreview: function() {
        const mwstType = document.getElementById('cost-mwst-type').value;
        const betrag = parseFloat(document.getElementById('cost-amount').value) || 0;

        let netto = 0;
        let mwst = 0;
        let gesamt = 0;

        switch (mwstType) {
            case 'brutto_it':
                // Brutto inkl. 22% MwSt - Betrag ist Brutto
                gesamt = betrag;
                netto = betrag / 1.22;
                mwst = betrag - netto;
                break;
            case 'netto_reverse':
                // Reverse Charge EU - Netto eingegeben, MwSt wird berechnet und abgeführt
                netto = betrag;
                mwst = betrag * 0.22; // Ihr müsst die MwSt ans Finanzamt zahlen
                gesamt = betrag + mwst; // Effektive Kosten
                break;
            case 'netto_import':
                // Drittland Import - ähnlich wie Reverse Charge
                netto = betrag;
                mwst = betrag * 0.22; // Import-MwSt
                gesamt = betrag + mwst;
                break;
            case 'netto_befreit':
                // MwSt-befreit (z.B. innergemeinschaftlich, Kleinunternehmer)
                netto = betrag;
                mwst = 0;
                gesamt = betrag;
                break;
        }

        document.getElementById('preview-netto').textContent = this.formatCurrency(netto);
        document.getElementById('preview-mwst').textContent = this.formatCurrency(mwst);
        document.getElementById('preview-gesamt').textContent = this.formatCurrency(gesamt);

        // Hinweis für Reverse Charge anzeigen
        const previewDiv = document.getElementById('cost-mwst-preview');
        if (mwstType === 'netto_reverse') {
            previewDiv.style.background = '#fff3e0';
            previewDiv.innerHTML = `
                <div>Netto: <strong>${this.formatCurrency(netto)}</strong></div>
                <div>MwSt (Reverse Charge): <strong style="color: #e65100;">${this.formatCurrency(mwst)}</strong></div>
                <div>Effektive Kosten: <strong>${this.formatCurrency(gesamt)}</strong></div>
                <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">MwSt wird ans Finanzamt abgeführt</div>
            `;
        } else if (mwstType === 'netto_import') {
            previewDiv.style.background = '#fff3e0';
            previewDiv.innerHTML = `
                <div>Netto: <strong>${this.formatCurrency(netto)}</strong></div>
                <div>Import-MwSt: <strong style="color: #e65100;">${this.formatCurrency(mwst)}</strong></div>
                <div>Effektive Kosten: <strong>${this.formatCurrency(gesamt)}</strong></div>
                <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">MwSt bei Einfuhr fällig</div>
            `;
        } else {
            previewDiv.style.background = '#f5f5f5';
            previewDiv.innerHTML = `
                <div>Netto: <strong>${this.formatCurrency(netto)}</strong></div>
                <div>MwSt: <strong>${this.formatCurrency(mwst)}</strong></div>
                <div>Gesamt: <strong>${this.formatCurrency(gesamt)}</strong></div>
            `;
        }
    },

    saveCost: async function(event) {
        event.preventDefault();

        const id = document.getElementById('cost-form-id').value;
        const supplierId = document.getElementById('cost-supplier').value;
        const mwstType = document.getElementById('cost-mwst-type').value;
        const betrag = parseFloat(document.getElementById('cost-amount').value) || 0;

        // MwSt-Berechnung basierend auf Typ
        let netto = 0, mwst = 0, gesamt = 0;
        switch (mwstType) {
            case 'brutto_it':
                gesamt = betrag;
                netto = betrag / 1.22;
                mwst = betrag - netto;
                break;
            case 'netto_reverse':
            case 'netto_import':
                netto = betrag;
                mwst = betrag * 0.22;
                gesamt = betrag + mwst;
                break;
            case 'netto_befreit':
                netto = betrag;
                mwst = 0;
                gesamt = betrag;
                break;
        }

        const costData = {
            projectId: parseInt(document.getElementById('cost-project').value),
            type: document.getElementById('cost-type').value,
            category: document.getElementById('cost-category').value,
            description: document.getElementById('cost-description').value,
            amount: Math.round(gesamt * 100) / 100, // Effektive Kosten (inkl. MwSt)
            amountNetto: Math.round(netto * 100) / 100,
            amountMwst: Math.round(mwst * 100) / 100,
            mwstType: mwstType,
            date: document.getElementById('cost-date').value,
            invoice: document.getElementById('cost-invoice').value,
            supplierId: supplierId ? parseInt(supplierId) : null
        };

        // Speichern und ID erhalten
        let savedCost;
        if (id) {
            savedCost = await DataManager.updateCost(parseInt(id), costData);
        } else {
            savedCost = await DataManager.addCost(costData);
        }

        // Datei-Upload wenn vorhanden
        if (this.currentInvoiceFile && savedCost) {
            try {
                console.log('📤 Uploading invoice file...');
                const uploadResult = await StorageService.uploadFile(
                    this.currentInvoiceFile,
                    costData.projectId,
                    savedCost.id
                );

                // Datei-Pfad zur Kosten-Datenbank hinzufügen
                await DataManager.updateCost(savedCost.id, {
                    ...costData,
                    filePath: uploadResult.path
                });

                console.log('✅ Invoice uploaded:', uploadResult.path);
                this.currentInvoiceFile = null;
            } catch (error) {
                console.error('❌ Upload-Fehler:', error);
                alert('Kosten gespeichert, aber Datei-Upload fehlgeschlagen: ' + error.message);
            }
        }

        this.hideModal('cost-form-modal');

        // View aktualisieren
        if (this.currentProjectId) {
            this.filterProjectCosts();
            const summary = DataManager.getProjectSummary(this.currentProjectId);
            document.getElementById('fp-ist-total').textContent = this.formatCurrency(summary.ist);
            document.getElementById('fp-prov-total').textContent = this.formatCurrency(summary.provisorisch);
            document.getElementById('fp-available').textContent = this.formatCurrency(summary.verfuegbar);
            this.loadCategoryBreakdown(this.currentProjectId);
        } else {
            this.filterCosts();
        }
    },

    deleteCost: function(costId) {
        if (confirm('Kosten wirklich löschen?')) {
            DataManager.deleteCost(costId);
            this.filterCosts();
        }
    },

    // ==========================================
    // ZEITERFASSUNG
    // ==========================================

    loadTimeTracking: function() {
        const entries = DataManager.getMyTimeEntries();

        // Statistiken berechnen
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Montag
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const weekHours = entries
            .filter(e => new Date(e.date) >= startOfWeek)
            .reduce((sum, e) => sum + e.hours, 0);

        const monthHours = entries
            .filter(e => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + e.hours, 0);

        document.getElementById('stat-total-hours').textContent = weekHours;
        document.getElementById('stat-total-hours-month').textContent = monthHours;

        // Einträge sortieren (neueste zuerst)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Liste befüllen
        const container = document.getElementById('time-entries-list');
        container.innerHTML = '';

        if (entries.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Noch keine Zeiteinträge erfasst</p>';
            return;
        }

        entries.forEach(entry => {
            const project = DataManager.getProjectById(entry.projectId);
            container.innerHTML += `
                <div class="time-entry">
                    <div class="time-entry-hours">${entry.hours}h</div>
                    <div class="time-entry-info">
                        <div><strong>${project ? project.name : 'Unbekanntes Projekt'}</strong></div>
                        <div style="font-size: 0.875rem; color: #666;">${entry.description}</div>
                        <div style="font-size: 0.75rem; color: #999;">${this.formatDate(entry.date)}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline" onclick="App.editTimeEntry(${entry.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteTimeEntry(${entry.id})">X</button>
                    </div>
                </div>
            `;
        });
    },

    showNewTimeEntryForm: function() {
        document.getElementById('time-form').reset();
        document.getElementById('time-form-id').value = '';
        document.getElementById('time-modal-title').textContent = 'Zeit erfassen';

        // Projekt-Dropdown befüllen
        const projectSelect = document.getElementById('time-project');
        const projects = DataManager.getProjects().filter(p => p.status !== 'abgeschlossen');
        projectSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        // Heutiges Datum als Standard
        document.getElementById('time-date').value = new Date().toISOString().split('T')[0];

        this.showModal('time-form-modal');
    },

    editTimeEntry: function(entryId) {
        const entry = DataManager.getTimeEntries().find(e => e.id === entryId);
        if (!entry) return;

        // Projekt-Dropdown befüllen
        const projectSelect = document.getElementById('time-project');
        const projects = DataManager.getProjects();
        projectSelect.innerHTML = '';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}" ${p.id === entry.projectId ? 'selected' : ''}>${p.name}</option>`;
        });

        document.getElementById('time-form-id').value = entry.id;
        document.getElementById('time-date').value = entry.date;
        document.getElementById('time-hours').value = entry.hours;
        document.getElementById('time-description').value = entry.description;

        document.getElementById('time-modal-title').textContent = 'Zeiteintrag bearbeiten';
        this.showModal('time-form-modal');
    },

    saveTimeEntry: function(event) {
        event.preventDefault();

        const id = document.getElementById('time-form-id').value;
        const entryData = {
            projectId: parseInt(document.getElementById('time-project').value),
            date: document.getElementById('time-date').value,
            hours: parseFloat(document.getElementById('time-hours').value) || 0,
            description: document.getElementById('time-description').value
        };

        if (id) {
            DataManager.updateTimeEntry(parseInt(id), entryData);
        } else {
            DataManager.addTimeEntry(entryData);
        }

        this.hideModal('time-form-modal');
        this.loadTimeTracking();
    },

    deleteTimeEntry: function(entryId) {
        if (confirm('Zeiteintrag wirklich löschen?')) {
            DataManager.deleteTimeEntry(entryId);
            this.loadTimeTracking();
        }
    },

    // ==========================================
    // KONFIGURATION
    // ==========================================

    loadConfiguration: function() {
        this.loadCostTypes();
        this.loadSuppliers();
        this.loadUsers();
        this.loadExportTab();
    },

    loadCostTypes: function() {
        const costTypes = DataManager.getCostTypes();
        const container = document.getElementById('cost-types-list');
        container.innerHTML = '';

        if (costTypes.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Kostentypen definiert</p>';
            return;
        }

        costTypes.forEach(ct => {
            container.innerHTML += `
                <div class="config-item">
                    <div class="config-item-info">
                        <div class="color-dot" style="background-color: ${ct.color};"></div>
                        <span>${ct.name}</span>
                        ${!ct.active ? '<span class="badge badge-warning">Inaktiv</span>' : ''}
                    </div>
                    <div class="config-item-actions">
                        <button class="btn btn-sm btn-outline" onclick="App.editCostType(${ct.id})">Bearbeiten</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteCostType(${ct.id})">Löschen</button>
                    </div>
                </div>
            `;
        });
    },

    showNewCostTypeForm: function() {
        document.getElementById('costtype-form').reset();
        document.getElementById('costtype-form-id').value = '';
        document.getElementById('costtype-modal-title').textContent = 'Neuer Kostentyp';
        document.getElementById('costtype-color').value = '#3498db';
        this.showModal('costtype-form-modal');
    },

    editCostType: function(id) {
        const costTypes = DataManager.getCostTypes();
        const ct = costTypes.find(c => c.id === id);
        if (!ct) return;

        document.getElementById('costtype-form-id').value = ct.id;
        document.getElementById('costtype-name').value = ct.name;
        document.getElementById('costtype-color').value = ct.color;

        document.getElementById('costtype-modal-title').textContent = 'Kostentyp bearbeiten';
        this.showModal('costtype-form-modal');
    },

    saveCostType: function(event) {
        event.preventDefault();

        const id = document.getElementById('costtype-form-id').value;
        const costTypeData = {
            name: document.getElementById('costtype-name').value,
            color: document.getElementById('costtype-color').value
        };

        if (id) {
            DataManager.updateCostType(parseInt(id), costTypeData);
        } else {
            DataManager.addCostType(costTypeData);
        }

        this.hideModal('costtype-form-modal');
        this.loadCostTypes();
    },

    deleteCostType: function(id) {
        if (confirm('Kostentyp wirklich löschen?')) {
            DataManager.deleteCostType(id);
            this.loadCostTypes();
        }
    },

    loadSuppliers: function() {
        const suppliers = DataManager.getSuppliers();
        const container = document.getElementById('suppliers-list');
        container.innerHTML = '';

        if (suppliers.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Lieferanten definiert</p>';
            return;
        }

        suppliers.forEach(s => {
            container.innerHTML += `
                <div class="config-item">
                    <div class="config-item-info">
                        <span style="font-weight: 500;">${s.name}</span>
                        <span style="color: #666; font-size: 0.75rem; margin-left: 0.5rem;">${s.externalId || ''}</span>
                        <span class="badge badge-primary" style="margin-left: 0.5rem;">${s.type || '-'}</span>
                        ${!s.active ? '<span class="badge badge-warning">Inaktiv</span>' : ''}
                    </div>
                    <div class="config-item-actions">
                        <button class="btn btn-sm btn-outline" onclick="App.editSupplier(${s.id})">Bearbeiten</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteSupplier(${s.id})">Löschen</button>
                    </div>
                </div>
            `;
        });
    },

    showNewSupplierForm: function() {
        document.getElementById('supplier-form').reset();
        document.getElementById('supplier-form-id').value = '';
        document.getElementById('supplier-modal-title').textContent = 'Neuer Lieferant';
        document.getElementById('supplier-external-id').value = '';
        document.getElementById('supplier-taxid').value = '';
        document.getElementById('supplier-address').value = '';
        document.getElementById('supplier-notes').value = '';

        // Typ-Dropdown befüllen
        const typeSelect = document.getElementById('supplier-type');
        const costTypes = DataManager.getActiveCostTypes();
        typeSelect.innerHTML = '<option value="">-- Keine Kategorie --</option>';
        costTypes.forEach(ct => {
            typeSelect.innerHTML += `<option value="${ct.name}">${ct.name}</option>`;
        });

        this.showModal('supplier-form-modal');
    },

    editSupplier: function(id) {
        const supplier = DataManager.getSupplierById(id);
        if (!supplier) return;

        // Typ-Dropdown befüllen
        const typeSelect = document.getElementById('supplier-type');
        const costTypes = DataManager.getActiveCostTypes();
        typeSelect.innerHTML = '<option value="">-- Keine Kategorie --</option>';
        costTypes.forEach(ct => {
            typeSelect.innerHTML += `<option value="${ct.name}" ${ct.name === supplier.type ? 'selected' : ''}>${ct.name}</option>`;
        });

        document.getElementById('supplier-form-id').value = supplier.id;
        document.getElementById('supplier-name').value = supplier.name;
        document.getElementById('supplier-external-id').value = supplier.externalId || '';
        document.getElementById('supplier-taxid').value = supplier.taxId || '';
        document.getElementById('supplier-address').value = supplier.address || '';
        document.getElementById('supplier-notes').value = supplier.notes || '';

        document.getElementById('supplier-modal-title').textContent = 'Lieferant bearbeiten';
        this.showModal('supplier-form-modal');
    },

    saveSupplier: function(event) {
        event.preventDefault();

        const id = document.getElementById('supplier-form-id').value;
        const supplierData = {
            name: document.getElementById('supplier-name').value,
            type: document.getElementById('supplier-type').value,
            externalId: document.getElementById('supplier-external-id').value || undefined,
            taxId: document.getElementById('supplier-taxid').value,
            address: document.getElementById('supplier-address').value,
            notes: document.getElementById('supplier-notes').value
        };

        if (id) {
            DataManager.updateSupplier(parseInt(id), supplierData);
        } else {
            DataManager.addSupplier(supplierData);
        }

        this.hideModal('supplier-form-modal');
        this.loadSuppliers();
    },

    deleteSupplier: function(id) {
        if (confirm('Lieferant wirklich löschen?')) {
            DataManager.deleteSupplier(id);
            this.loadSuppliers();
        }
    },

    // ==========================================
    // MITARBEITER / STUNDENSÄTZE
    // ==========================================

    loadUsers: function() {
        const users = DataManager.getUsers();
        const container = document.getElementById('users-list');
        container.innerHTML = '';

        users.forEach(u => {
            container.innerHTML += `
                <div class="config-item">
                    <div class="config-item-info">
                        <span style="font-weight: 500;">${u.name}</span>
                        <span class="badge badge-${u.role === 'admin' ? 'primary' : 'success'}" style="margin-left: 0.5rem;">
                            ${u.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight: 600;">${this.formatCurrency(u.hourlyRate || 0)}/Std.</span>
                        <button class="btn btn-sm btn-outline" onclick="App.editHourlyRate(${u.id})">Bearbeiten</button>
                    </div>
                </div>
            `;
        });
    },

    editHourlyRate: function(userId) {
        const user = DataManager.getUserById(userId);
        if (!user) return;

        document.getElementById('hourlyrate-user-id').value = user.id;
        document.getElementById('hourlyrate-user-name').value = user.name;
        document.getElementById('hourlyrate-value').value = user.hourlyRate || 0;

        this.showModal('hourlyrate-form-modal');
    },

    saveHourlyRate: function(event) {
        event.preventDefault();

        const userId = parseInt(document.getElementById('hourlyrate-user-id').value);
        const hourlyRate = parseFloat(document.getElementById('hourlyrate-value').value) || 0;

        DataManager.updateUser(userId, { hourlyRate: hourlyRate });

        this.hideModal('hourlyrate-form-modal');
        this.loadUsers();
    },

    // ==========================================
    // EXCEL EXPORT
    // ==========================================

    loadExportTab: function() {
        const projects = DataManager.getProjects();
        const select = document.getElementById('export-project-select');
        select.innerHTML = '<option value="">-- Projekt wählen --</option>';
        projects.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    },

    exportAllToExcel: function() {
        const csv = DataManager.exportAllToCSV();
        const filename = `KunstMeran_Export_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadCSV(csv, filename);
    },

    exportProjectToExcel: function() {
        const projectId = document.getElementById('export-project-select').value;
        if (!projectId) {
            alert('Bitte wählen Sie ein Projekt aus.');
            return;
        }

        const project = DataManager.getProjectById(parseInt(projectId));
        const csv = DataManager.exportProjectToCSV(parseInt(projectId));
        const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadCSV(csv, filename);
    },

    exportCurrentProjectToExcel: function() {
        if (!this.currentProjectId) return;

        const project = DataManager.getProjectById(this.currentProjectId);
        const csv = DataManager.exportProjectToCSV(this.currentProjectId);
        const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadCSV(csv, filename);
    },

    downloadCSV: function(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // ==========================================
    // RECHNUNGEN (DATEV)
    // ==========================================

    loadRechnungen: async function() {
        // Statistiken aktualisieren
        const rechnungen = await DataManager.getRechnungenMitStatus();
        const neuCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.NEU).length;
        const kontrolliertCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.KONTROLLIERT).length;
        const bezahltCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.BEZAHLT).length;

        document.getElementById('stat-rechnungen-total').textContent = rechnungen.length;
        document.getElementById('stat-rechnungen-neu').textContent = neuCount;
        document.getElementById('stat-rechnungen-kontrolliert').textContent = kontrolliertCount;
        document.getElementById('stat-rechnungen-bezahlt').textContent = bezahltCount;

        // Letzte Aktualisierung anzeigen
        const lastUpdate = DataManager.getDatevLastUpdate();
        if (lastUpdate) {
            document.getElementById('datev-last-update').textContent =
                'Letzte Aktualisierung: ' + this.formatDate(lastUpdate);
        }

        // Filter-Dropdowns befüllen
        await this.populateRechnungenFilters();

        // Rechnungen anzeigen
        await this.filterRechnungen();
    },

    populateRechnungenFilters: async function() {
        // Projekt-Filter
        const projektSelect = document.getElementById('rechnung-filter-projekt');
        projektSelect.innerHTML = '<option value="">Alle Projekte</option>';
        const projekte = DataManager.getAllKunstMeranProjekte();
        projekte.forEach(p => {
            projektSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        // Lieferanten-Filter
        const lieferantSelect = document.getElementById('rechnung-filter-lieferant');
        lieferantSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        const lieferanten = DataManager.getDatevLieferanten();
        lieferanten.forEach(l => {
            lieferantSelect.innerHTML += `<option value="${l.partitaIva}">${l.name}</option>`;
        });

        // Jahr-Filter dynamisch befüllen
        const jahrSelect = document.getElementById('rechnung-filter-jahr');
        jahrSelect.innerHTML = '<option value="">Alle Jahre</option>';
        const rechnungen = await DataManager.getRechnungenMitStatus();
        const jahre = new Set();
        rechnungen.forEach(r => {
            const datum = r.belegdatum || r.uploadedAt;
            if (datum) {
                const jahr = new Date(datum).getFullYear();
                if (!isNaN(jahr)) jahre.add(jahr);
            }
        });
        // Sortiert absteigend
        Array.from(jahre).sort((a, b) => b - a).forEach(jahr => {
            jahrSelect.innerHTML += `<option value="${jahr}">${jahr}</option>`;
        });
    },

    // Ausgewählte Rechnungen (für Massenaktionen)
    selectedRechnungen: new Set(),

    filterRechnungen: async function() {
        const statusFilter = document.getElementById('rechnung-filter-status').value;
        const projektFilter = document.getElementById('rechnung-filter-projekt').value;
        const lieferantFilter = document.getElementById('rechnung-filter-lieferant').value;
        const kostentypFilter = document.getElementById('rechnung-filter-kostentyp')?.value || '';
        const abgabestelleFilter = document.getElementById('rechnung-filter-abgabestelle').value;
        const jahrFilter = document.getElementById('rechnung-filter-jahr').value;
        const monatFilter = document.getElementById('rechnung-filter-monat').value;

        let rechnungen = await DataManager.getRechnungenMitStatus();

        // Filter anwenden
        if (statusFilter) {
            rechnungen = rechnungen.filter(r => r.workflowStatus === statusFilter);
        }
        if (projektFilter) {
            rechnungen = rechnungen.filter(r => String(r.projektId) === projektFilter);
        }
        if (lieferantFilter) {
            const searchTerm = lieferantFilter.toLowerCase();
            rechnungen = rechnungen.filter(r =>
                r.fornitoreName?.toLowerCase().includes(searchTerm) ||
                r.partitaIva?.toLowerCase().includes(searchTerm)
            );
        }
        if (kostentypFilter) {
            rechnungen = rechnungen.filter(r => r.kostentyp === kostentypFilter);
        }
        if (abgabestelleFilter) {
            rechnungen = rechnungen.filter(r => r.abgabestelle === abgabestelleFilter);
        }
        if (jahrFilter) {
            rechnungen = rechnungen.filter(r => {
                const datum = r.belegdatum || r.uploadedAt;
                if (!datum) return false;
                const jahr = new Date(datum).getFullYear();
                return String(jahr) === jahrFilter;
            });
        }
        if (monatFilter) {
            rechnungen = rechnungen.filter(r => {
                const datum = r.belegdatum || r.uploadedAt;
                if (!datum) return false;
                const monat = new Date(datum).getMonth() + 1; // 1-12
                return String(monat) === monatFilter;
            });
        }

        // Sortieren nach Datum (neueste zuerst)
        rechnungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));

        // Filtered results speichern und zur ersten Seite zurück
        this.filteredRechnungen = rechnungen;
        this.currentRechnungenPage = 1;

        // Seite rendern
        this.renderRechnungenPage();
    },

    renderRechnungenPage: function() {
        const tbody = document.getElementById('rechnungen-table-body');
        tbody.innerHTML = '';

        // "Alle auswählen" Checkbox zurücksetzen
        document.getElementById('rechnungen-select-all').checked = false;

        const totalCount = this.filteredRechnungen.length;
        const totalPages = Math.ceil(totalCount / this.rechnungenPerPage);
        const startIndex = (this.currentRechnungenPage - 1) * this.rechnungenPerPage;
        const endIndex = Math.min(startIndex + this.rechnungenPerPage, totalCount);

        if (totalCount === 0) {
            tbody.innerHTML = '<tr><td colspan="15" style="text-align: center; color: #666; padding: 2rem;">Keine Rechnungen gefunden. Bitte Import-Skript ausführen.</td></tr>';
            document.getElementById('rechnungen-pagination').style.display = 'none';
            this.updateMassActionsBar();
            return;
        }

        // Pagination anzeigen wenn mehr als 20 Rechnungen
        const paginationDiv = document.getElementById('rechnungen-pagination');
        if (totalCount > this.rechnungenPerPage) {
            paginationDiv.style.display = 'flex';
            document.getElementById('page-info').textContent = `Seite ${this.currentRechnungenPage} von ${totalPages} (${totalCount} Rechnungen)`;
        } else {
            paginationDiv.style.display = 'none';
        }

        // Nur die aktuelle Seite rendern
        const pageRechnungen = this.filteredRechnungen.slice(startIndex, endIndex);

        // Sortier-Pfeile aktualisieren
        this.updateSortArrows();

        pageRechnungen.forEach((r, index) => {
            const rowNumber = startIndex + index + 1; // Globale Zeilennummer
            const projekt = DataManager.getKunstMeranProjekt(r.projektId);
            // Nutze direkt die Werte aus JSON falls vorhanden, sonst berechnen
            const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
            const mwst = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
            const gesamt = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);

            // Gutschrift-Styling
            const istGutschrift = r.istGutschrift || r.dokumentTyp === 'NC' || r.betrag < 0;
            const rowStyle = istGutschrift ? 'background: #e8f5e9;' : '';
            const betragStyle = istGutschrift ? 'color: #27ae60; font-weight: 500;' : '';
            const typBadge = istGutschrift
                ? '<span class="badge" style="background: #27ae60; color: white; font-size: 0.65rem; margin-left: 0.25rem;">NC</span>'
                : '';

            // Checkbox-Status prüfen
            const isSelected = this.selectedRechnungen.has(r.rechnungId);

            const row = document.createElement('tr');
            row.style = rowStyle;
            row.dataset.rechnungId = r.rechnungId;
            if (isSelected) row.classList.add('selected-row');
            // Kostentyp-Label
            const kostentypLabels = {
                'kuration': 'Kuration',
                'kuenstlerausgabe': 'Künstlerausgabe',
                'transport': 'Transport',
                'produktion': 'Produktion',
                'vermittlung': 'Vermittlung',
                'dokumentation': 'Dokumentation',
                'kommunikation': 'Kommunikation'
            };
            const kostentypLabel = r.kostentyp ? kostentypLabels[r.kostentyp] || r.kostentyp : '-';

            // Geteilt-Badge
            const geteiltBadge = r.geteilt ? '<span class="badge" style="background: #ff9800; color: white; font-size: 0.6rem; margin-left: 0.25rem;" title="Geteilte Rechnung">GETEILT</span>' : '';

            // Für Supabase-only oder nicht-gematchte: Verknüpfungs-Dropdown generieren
            let projektCell = '';
            if (r.isSupabaseOnly || (!r.projektId && r.invoiceId)) {
                // Select mit Suchfunktion
                projektCell = `
                    <select class="form-control datev-movement-select"
                            style="font-size: 0.75rem; padding: 0.25rem; max-width: 200px;"
                            onchange="App.linkInvoiceToDatev('${r.invoiceId}', this.value)">
                        <option value="">-- Bewegung wählen --</option>
                        ${this.getUnlinkedDatevOptionsAsSelect()}
                    </select>`;
            } else if (r.invoiceId && r.projektId) {
                // Verknüpfte Rechnung: Zeige Projekt + Trennen-Button
                projektCell = `
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>${projekt ? projekt.name : r.projektId}</span>
                        <button class="btn btn-sm"
                                style="padding: 0.1rem 0.3rem; font-size: 0.7rem; background: #ff5722; color: white;"
                                onclick="App.unlinkInvoiceFromDatev('${r.invoiceId}')"
                                title="Verknüpfung trennen">
                            ✕
                        </button>
                    </div>`;
            } else {
                projektCell = projekt ? projekt.name : r.projektId;
            }

            row.innerHTML = `
                <td style="position: sticky; left: 0; background: ${istGutschrift ? '#e8f5e9' : 'white'}; z-index: 5; font-weight: 500; text-align: center; border-right: 1px solid #ddd;">${rowNumber}</td>
                <td style="position: sticky; left: 50px; background: ${istGutschrift ? '#e8f5e9' : 'white'}; z-index: 5; border-right: 1px solid #ddd;">
                    <input type="checkbox" class="rechnung-checkbox"
                           data-rechnung-id="${r.rechnungId}"
                           ${isSelected ? 'checked' : ''}
                           onchange="App.toggleRechnungSelection('${r.rechnungId}', this)">
                </td>
                <td>${this.formatDate(r.datum)}</td>
                <td>${r.fornitoreName}${r.partitaIvaCliente ? `<br><small style="color:#666;">Sponsor: ${r.partitaIvaCliente}</small>` : ''}</td>
                <td>${r.dokumentNr}${typBadge}${geteiltBadge}</td>
                <td>${projektCell}</td>
                <td>${kostentypLabel}</td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(netto)}</td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(mwst)}</td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(gesamt)}</td>
                <td><span class="status-badge ${r.workflowStatus}">${r.workflowStatus}</span></td>
                <td>${r.kontrolliertAm ? this.formatDate(r.kontrolliertAm) : '-'}</td>
                <td>${r.bezahltAm ? this.formatDate(r.bezahltAm) : '-'}</td>
                <td>${r.abgabestelle ? `<span class="abgabestelle-badge ${r.abgabestelle}">${r.abgabestelle}</span>` : '-'}</td>
                <td>${r.pdfExists ?
                    `<a class="pdf-link" onclick="App.showPdfPreview('${r.partitaIva}', '${r.dokumentNr}', '${r.filePath || ''}')">PDF</a>` :
                    `<a class="pdf-link" style="color: #999; cursor: pointer;" onclick="App.openPdfFolder()" title="PDF nicht gefunden - Ordner öffnen">Suchen</a>`}</td>
                <td>
                    <input type="text"
                           class="form-control"
                           style="font-size: 0.75rem; padding: 0.25rem; min-width: 120px;"
                           placeholder="Notiz..."
                           value="${r.notes || r.notizen || ''}"
                           onchange="App.updateRechnungNotizInline('${r.invoiceId || r.rechnungId}', this.value, ${!!r.invoiceId})">
                </td>
                <td>
                    <div class="action-btn-group" style="display: flex; gap: 0.25rem;">
                        ${r.workflowStatus === 'uploaded' ?
                            `<button class="btn btn-sm btn-primary" onclick="App.changeInvoiceStatus('${r.rechnungId}', 'kontrolliert')" title="Als kontrolliert markieren">✓</button>` :
                        r.workflowStatus === 'kontrolliert' && DataManager.isAdmin() ?
                            `<button class="btn btn-sm btn-success" onclick="App.changeInvoiceStatus('${r.rechnungId}', 'bezahlt')" title="Als bezahlt markieren">€</button>` :
                        ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.updateMassActionsBar();
    },

    /**
     * Generiert Optionen für DATEV-Bewegungen ohne PDF (als Select Options)
     */
    getUnlinkedDatevOptionsAsSelect: function() {
        // Alle DATEV-Buchungen ohne pdfExists
        const allRechnungen = this.filteredRechnungen || [];
        const unlinked = allRechnungen.filter(r => !r.isSupabaseOnly && !r.pdfExists);

        return unlinked.map(r => {
            const projekt = DataManager.getKunstMeranProjekt(r.projektId);
            const label = `${r.fornitoreName} - ${r.dokumentNr} - ${projekt?.name || r.projektId} - ${this.formatCurrency(r.betrag)}`;
            const key = `${r.partitaIva}_${r.dokumentNr}`;
            return `<option value="${key}">${label}</option>`;
        }).join('');
    },

    /**
     * Generiert Optionen für DATEV-Bewegungen ohne PDF (für Datalist - deprecated)
     */
    getUnlinkedDatevOptions: function() {
        return this.getUnlinkedDatevOptionsAsSelect();
    },

    /**
     * Verknüpft Invoice aus Input-Feld (mit Datalist)
     */
    linkInvoiceToDatevFromInput: async function(invoiceId, selectedLabel) {
        if (!selectedLabel) return;

        try {
            // Finde die passende DATEV-Bewegung anhand des Labels
            const allRechnungen = this.filteredRechnungen || [];
            const unlinked = allRechnungen.filter(r => !r.isSupabaseOnly && !r.pdfExists);

            const matchedRechnung = unlinked.find(r => {
                const projekt = DataManager.getKunstMeranProjekt(r.projektId);
                const label = `${r.fornitoreName} - ${r.dokumentNr} - ${projekt?.name || r.projektId} - ${this.formatCurrency(r.betrag)}`;
                return label === selectedLabel;
            });

            if (!matchedRechnung) {
                this.showToast('error', 'Fehler', 'DATEV-Bewegung nicht gefunden');
                return;
            }

            const datevKey = `${matchedRechnung.partitaIva}_${matchedRechnung.dokumentNr}`;
            await this.linkInvoiceToDatev(invoiceId, datevKey);

        } catch (error) {
            console.error('Fehler beim Verknüpfen:', error);
            this.showToast('error', 'Fehler', 'Verknüpfung fehlgeschlagen');
        }
    },

    /**
     * Verknüpft eine Supabase-Invoice mit einer DATEV-Bewegung
     */
    linkInvoiceToDatev: async function(invoiceId, datevKey) {
        console.log('linkInvoiceToDatev aufgerufen:', { invoiceId, datevKey });

        if (!datevKey) {
            console.log('Kein datevKey übergeben - abbruch');
            return;
        }

        try {
            // Split nur am ersten Unterstrich (dokumentNr kann selbst _ enthalten)
            const firstUnderscoreIndex = datevKey.indexOf('_');
            if (firstUnderscoreIndex === -1) {
                throw new Error('Ungültiges Format für DATEV-Key');
            }

            const partitaIva = datevKey.substring(0, firstUnderscoreIndex);
            const dokumentNr = datevKey.substring(firstUnderscoreIndex + 1);

            console.log('Verknüpfe:', { invoiceId, partitaIva, dokumentNr });

            // Update in Supabase: setze partita_iva und invoice_number
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: partitaIva,
                    invoice_number: dokumentNr
                })
                .eq('id', invoiceId);

            if (error) {
                console.error('Supabase Verknüpfungs-Error:', error);
                throw error;
            }

            console.log('Verknüpfung erfolgreich:', data);
            this.showToast('success', 'Verknüpft', 'Rechnung wurde mit DATEV-Bewegung verknüpft');

            // Tabelle neu laden
            await this.filterRechnungen();

        } catch (error) {
            console.error('Fehler beim Verknüpfen:', error);
            console.error('Error Message:', error.message);
            console.error('Error Details:', JSON.stringify(error, null, 2));
            this.showToast('error', 'Fehler', `Verknüpfung fehlgeschlagen: ${error.message}`);
        }
    },

    /**
     * Entfernt Verknüpfung zwischen Invoice und DATEV-Bewegung
     */
    unlinkInvoiceFromDatev: async function(invoiceId) {
        if (!confirm('Möchten Sie die Verknüpfung wirklich trennen?')) {
            return;
        }

        try {
            console.log('Trenne Verknüpfung für Invoice:', invoiceId);

            // Setze partita_iva und invoice_number auf null
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: null,
                    invoice_number: null
                })
                .eq('id', invoiceId);

            if (error) {
                console.error('Supabase Unlink-Error:', error);
                throw error;
            }

            console.log('Verknüpfung getrennt:', data);
            this.showToast('success', 'Getrennt', 'Verknüpfung wurde entfernt');

            // Tabelle neu laden
            await this.filterRechnungen();

        } catch (error) {
            console.error('Fehler beim Trennen:', error);
            console.error('Error Message:', error.message);
            this.showToast('error', 'Fehler', `Trennen fehlgeschlagen: ${error.message}`);
        }
    },

    goToRechnungenPage: function(page) {
        const totalPages = Math.ceil(this.filteredRechnungen.length / this.rechnungenPerPage);

        if (page === 'prev') {
            this.currentRechnungenPage = Math.max(1, this.currentRechnungenPage - 1);
        } else if (page === 'next') {
            this.currentRechnungenPage = Math.min(totalPages, this.currentRechnungenPage + 1);
        } else if (page === 'last') {
            this.currentRechnungenPage = totalPages;
        } else if (typeof page === 'number') {
            this.currentRechnungenPage = Math.max(1, Math.min(totalPages, page));
        }

        this.renderRechnungenPage();
    },

    sortRechnungen: function(column) {
        // Toggle direction wenn gleiche Spalte
        if (this.currentSortColumn === column) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortColumn = column;
            this.currentSortDirection = 'asc';
        }

        // Sortier-Logik
        this.filteredRechnungen.sort((a, b) => {
            let valA, valB;

            switch (column) {
                case 'datum':
                    valA = new Date(a.datum);
                    valB = new Date(b.datum);
                    break;
                case 'lieferant':
                    valA = (a.fornitoreName || '').toLowerCase();
                    valB = (b.fornitoreName || '').toLowerCase();
                    break;
                case 'rechnungsnr':
                    valA = (a.dokumentNr || '').toLowerCase();
                    valB = (b.dokumentNr || '').toLowerCase();
                    break;
                case 'projekt':
                    const projektA = DataManager.getKunstMeranProjekt(a.projektId);
                    const projektB = DataManager.getKunstMeranProjekt(b.projektId);
                    valA = (projektA?.name || '').toLowerCase();
                    valB = (projektB?.name || '').toLowerCase();
                    break;
                case 'kostentyp':
                    valA = (a.kostentyp || '').toLowerCase();
                    valB = (b.kostentyp || '').toLowerCase();
                    break;
                case 'netto':
                    valA = a.betragNetto !== undefined ? a.betragNetto : a.betrag;
                    valB = b.betragNetto !== undefined ? b.betragNetto : b.betrag;
                    break;
                case 'mwst':
                    valA = a.betragMwst !== undefined ? a.betragMwst : (a.betrag * 0.22);
                    valB = b.betragMwst !== undefined ? b.betragMwst : (b.betrag * 0.22);
                    break;
                case 'brutto':
                    valA = a.betragGesamt !== undefined ? a.betragGesamt : (a.betrag * 1.22);
                    valB = b.betragGesamt !== undefined ? b.betragGesamt : (b.betrag * 1.22);
                    break;
                case 'status':
                    valA = (a.workflowStatus || '').toLowerCase();
                    valB = (b.workflowStatus || '').toLowerCase();
                    break;
                case 'kontrolliert':
                    valA = a.kontrolliertAm ? new Date(a.kontrolliertAm) : new Date(0);
                    valB = b.kontrolliertAm ? new Date(b.kontrolliertAm) : new Date(0);
                    break;
                case 'bezahlt':
                    valA = a.bezahltAm ? new Date(a.bezahltAm) : new Date(0);
                    valB = b.bezahltAm ? new Date(b.bezahltAm) : new Date(0);
                    break;
                case 'abgabestelle':
                    valA = (a.abgabestelle || '').toLowerCase();
                    valB = (b.abgabestelle || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            // Vergleich
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;

            // Direction anwenden
            return this.currentSortDirection === 'asc' ? comparison : -comparison;
        });

        // UI aktualisieren
        this.updateSortArrows();
        this.renderRechnungenPage();
    },

    updateSortArrows: function() {
        // Alle sort-Klassen entfernen
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        // Aktive Spalte markieren
        const columnMap = {
            'datum': 0,
            'lieferant': 1,
            'rechnungsnr': 2,
            'projekt': 3,
            'kostentyp': 4,
            'netto': 5,
            'mwst': 6,
            'brutto': 7,
            'status': 8,
            'kontrolliert': 9,
            'bezahlt': 10,
            'abgabestelle': 11
        };

        const thIndex = columnMap[this.currentSortColumn];
        if (thIndex !== undefined) {
            const ths = document.querySelectorAll('#rechnungen-view th.sortable');
            if (ths[thIndex]) {
                ths[thIndex].classList.add(`sort-${this.currentSortDirection}`);
            }
        }
    },

    // ==========================================
    // MEHRFACHAUSWAHL & MASSENAKTIONEN
    // ==========================================

    toggleRechnungSelection: function(rechnungId, checkbox) {
        if (checkbox.checked) {
            this.selectedRechnungen.add(rechnungId);
            checkbox.closest('tr').classList.add('selected-row');
        } else {
            this.selectedRechnungen.delete(rechnungId);
            checkbox.closest('tr').classList.remove('selected-row');
        }
        this.updateMassActionsBar();
        this.updateSelectAllCheckbox();
    },

    toggleSelectAll: function(checkbox) {
        const allCheckboxes = document.querySelectorAll('.rechnung-checkbox');
        allCheckboxes.forEach(cb => {
            cb.checked = checkbox.checked;
            const rechnungId = cb.dataset.rechnungId;
            if (checkbox.checked) {
                this.selectedRechnungen.add(rechnungId);
                cb.closest('tr').classList.add('selected-row');
            } else {
                this.selectedRechnungen.delete(rechnungId);
                cb.closest('tr').classList.remove('selected-row');
            }
        });
        this.updateMassActionsBar();
    },

    updateSelectAllCheckbox: function() {
        const allCheckboxes = document.querySelectorAll('.rechnung-checkbox');
        const selectAllCheckbox = document.getElementById('rechnungen-select-all');
        if (allCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            return;
        }
        const checkedCount = document.querySelectorAll('.rechnung-checkbox:checked').length;
        selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    },

    updateMassActionsBar: function() {
        const massActionsBar = document.getElementById('rechnungen-mass-actions');
        const countSpan = document.getElementById('rechnungen-selected-count');
        const count = this.selectedRechnungen.size;

        if (count > 0) {
            massActionsBar.style.display = 'block';
            countSpan.textContent = count === 1 ? '1 Rechnung ausgewählt' : `${count} Rechnungen ausgewählt`;
        } else {
            massActionsBar.style.display = 'none';
        }
    },

    clearSelection: function() {
        this.selectedRechnungen.clear();
        document.querySelectorAll('.rechnung-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('tr').classList.remove('selected-row');
        });
        document.getElementById('rechnungen-select-all').checked = false;
        this.updateMassActionsBar();
    },

    massMarkKontrolliert: function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) als kontrolliert markieren?`)) return;

        this.selectedRechnungen.forEach(rechnungId => {
            DataManager.markAsKontrolliert(rechnungId);
        });

        this.clearSelection();
        this.loadRechnungen();
    },

    massMarkBezahlt: function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) als bezahlt markieren?`)) return;

        this.selectedRechnungen.forEach(rechnungId => {
            DataManager.markAsBezahlt(rechnungId);
        });

        this.clearSelection();
        this.loadRechnungen();
    },

    massSetAbgabestelle: function(abgabestelle) {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`Abgabestelle "${abgabestelle}" für ${count} Rechnung(en) setzen?`)) return;

        this.selectedRechnungen.forEach(rechnungId => {
            DataManager.setAbgabestelle(rechnungId, abgabestelle);
        });

        this.clearSelection();
        this.loadRechnungen();
    },

    refreshDatevData: async function() {
        await this.loadDatevData();
        this.loadRechnungen();
    },

    showRechnungDetail: function(rechnungId) {
        this.currentRechnungId = rechnungId;
        const rechnungen = DataManager.getRechnungenMitStatus();
        const rechnung = rechnungen.find(r => r.rechnungId === rechnungId);

        if (!rechnung) return;

        const projekt = DataManager.getKunstMeranProjekt(rechnung.projektId);
        const mwst = DataManager.berechneMwst(rechnung.betrag);

        // Detail-Felder befüllen
        document.getElementById('rd-lieferant').textContent = rechnung.fornitoreName;
        document.getElementById('rd-partita-iva').textContent = rechnung.partitaIva;
        document.getElementById('rd-rechnungsnr').textContent = rechnung.dokumentNr;
        document.getElementById('rd-datum').textContent = this.formatDate(rechnung.datum);
        // Projekt als Dropdown
        document.getElementById('rd-projekt').value = rechnung.projektId || '';
        document.getElementById('rd-status').innerHTML = `<span class="status-badge ${rechnung.workflowStatus}">${rechnung.workflowStatus}</span>`;

        // Beträge
        document.getElementById('rd-brutto').textContent = this.formatCurrency(rechnung.betrag);
        document.getElementById('rd-netto').textContent = this.formatCurrency(mwst.netto);
        document.getElementById('rd-mwst').textContent = this.formatCurrency(mwst.mwstBetrag);
        document.getElementById('rd-mwst-absetzbar').textContent = this.formatCurrency(mwst.absetzbareMwst);
        document.getElementById('rd-mwst-nicht-absetzbar').textContent = this.formatCurrency(mwst.nichtAbsetzbareMwst);

        // Status-Checkboxen und Datumsfelder
        const istKontrolliert = rechnung.workflowStatus === RECHNUNG_STATUS.KONTROLLIERT || rechnung.workflowStatus === RECHNUNG_STATUS.BEZAHLT;
        const istBezahlt = rechnung.workflowStatus === RECHNUNG_STATUS.BEZAHLT;

        document.getElementById('rd-kontrolliert-check').checked = istKontrolliert;
        document.getElementById('rd-kontrolliert-datum').value = rechnung.kontrolliertAm || '';
        document.getElementById('rd-kontrolliert-datum').disabled = !istKontrolliert;

        document.getElementById('rd-bezahlt-check').checked = istBezahlt;
        document.getElementById('rd-bezahlt-datum').value = rechnung.bezahltAm || '';
        document.getElementById('rd-bezahlt-datum').disabled = !istBezahlt;

        // Kostentyp mit Datum
        document.getElementById('rd-kostentyp').value = rechnung.kostentyp || '';
        document.getElementById('rd-kostentyp-datum').value = rechnung.kostentypAm || '';

        // Abgabestelle mit Datum
        document.getElementById('rd-abgabestelle').value = rechnung.abgabestelle || '';
        document.getElementById('rd-abgabestelle-datum').value = rechnung.abgabestelleAm || '';

        // Notizen
        document.getElementById('rd-notizen').value = rechnung.notizen || '';

        // Geteilte Rechnung
        document.getElementById('rd-geteilt').checked = rechnung.geteilt || false;

        // Rechnung-ID speichern
        document.getElementById('rd-rechnung-id').value = rechnungId;

        // Buttons basierend auf Status anzeigen (alte Buttons ausblenden, neue Checkboxen übernehmen)
        const btnKontrollieren = document.getElementById('rd-btn-kontrollieren');
        const btnBezahlt = document.getElementById('rd-btn-bezahlt');
        btnKontrollieren.style.display = 'none';
        btnBezahlt.style.display = 'none';

        this.showModal('rechnung-detail-modal');
    },

    // Checkbox: Kontrolliert toggled
    toggleKontrolliert: function(checkbox) {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datumInput = document.getElementById('rd-kontrolliert-datum');

        if (checkbox.checked) {
            // Automatisch heutiges Datum setzen
            const heute = new Date().toISOString().split('T')[0];
            datumInput.value = heute;
            datumInput.disabled = false;
            DataManager.markAsKontrolliert(rechnungId, heute);
        } else {
            // Checkbox abgewählt - Status zurücksetzen auf NEU
            datumInput.value = '';
            datumInput.disabled = true;
            // Auch Bezahlt zurücksetzen falls gesetzt
            document.getElementById('rd-bezahlt-check').checked = false;
            document.getElementById('rd-bezahlt-datum').value = '';
            document.getElementById('rd-bezahlt-datum').disabled = true;
            DataManager.setRechnungStatus(rechnungId, {
                status: RECHNUNG_STATUS.NEU,
                kontrolliertAm: null,
                kontrolliertVon: null,
                bezahltAm: null
            });
        }
        this.loadRechnungen();
    },

    // Checkbox: Bezahlt toggled
    toggleBezahlt: function(checkbox) {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datumInput = document.getElementById('rd-bezahlt-datum');
        const kontrolliertCheck = document.getElementById('rd-kontrolliert-check');

        if (checkbox.checked) {
            // Automatisch heutiges Datum setzen
            const heute = new Date().toISOString().split('T')[0];
            datumInput.value = heute;
            datumInput.disabled = false;

            // Kontrolliert muss auch gesetzt sein
            if (!kontrolliertCheck.checked) {
                kontrolliertCheck.checked = true;
                const kontrolliertDatum = document.getElementById('rd-kontrolliert-datum');
                kontrolliertDatum.value = heute;
                kontrolliertDatum.disabled = false;
                DataManager.markAsKontrolliert(rechnungId, heute);
            }

            DataManager.markAsBezahlt(rechnungId, heute);
        } else {
            // Checkbox abgewählt - Status zurück auf KONTROLLIERT
            datumInput.value = '';
            datumInput.disabled = true;
            DataManager.setRechnungStatus(rechnungId, {
                status: RECHNUNG_STATUS.KONTROLLIERT,
                bezahltAm: null
            });
        }
        this.loadRechnungen();
    },

    // Datum manuell geändert: Kontrolliert
    updateKontrolliertDatum: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datum = document.getElementById('rd-kontrolliert-datum').value;
        DataManager.setKontrolliertDatum(rechnungId, datum || null);
    },

    // Datum manuell geändert: Bezahlt
    updateBezahltDatum: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datum = document.getElementById('rd-bezahlt-datum').value;
        DataManager.setBezahltDatum(rechnungId, datum || null);
    },

    markRechnungKontrolliert: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        DataManager.markAsKontrolliert(rechnungId);
        this.hideModal('rechnung-detail-modal');
        this.loadRechnungen();
    },

    markRechnungBezahlt: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        DataManager.markAsBezahlt(rechnungId);
        this.hideModal('rechnung-detail-modal');
        this.loadRechnungen();
    },

    updateRechnungAbgabestelle: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const abgabestelle = document.getElementById('rd-abgabestelle').value;
        // Datum wird automatisch auf heute gesetzt wenn Wert gesetzt wird
        DataManager.setAbgabestelle(rechnungId, abgabestelle || null);
        // Datumsfeld aktualisieren
        if (abgabestelle) {
            const heute = new Date().toISOString().split('T')[0];
            document.getElementById('rd-abgabestelle-datum').value = heute;
        } else {
            document.getElementById('rd-abgabestelle-datum').value = '';
        }
    },

    updateAbgabestelleDatum: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datum = document.getElementById('rd-abgabestelle-datum').value;
        DataManager.setAbgabestelleDatum(rechnungId, datum || null);
    },

    updateRechnungKostentyp: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const kostentyp = document.getElementById('rd-kostentyp').value;
        // Datum wird automatisch auf heute gesetzt wenn Wert gesetzt wird
        DataManager.setKostentyp(rechnungId, kostentyp || null);
        // Datumsfeld aktualisieren
        if (kostentyp) {
            const heute = new Date().toISOString().split('T')[0];
            document.getElementById('rd-kostentyp-datum').value = heute;
        } else {
            document.getElementById('rd-kostentyp-datum').value = '';
        }
        // Aktualisiere die Kostentabelle falls Projekt-Fullpage offen ist
        if (this.currentProjectId) {
            this.filterProjectCosts();
        }
    },

    updateKostentypDatum: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datum = document.getElementById('rd-kostentyp-datum').value;
        DataManager.setKostentypDatum(rechnungId, datum || null);
    },

    updateRechnungNotizen: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const notizen = document.getElementById('rd-notizen').value;
        DataManager.setRechnungStatus(rechnungId, { notizen: notizen });
    },

    updateRechnungNotizInline: async function(id, notizText, isSupabaseInvoice) {
        try {
            console.log('Speichere Notiz:', { id, notizText, isSupabaseInvoice });

            if (isSupabaseInvoice) {
                // Supabase Invoice: Update notes Feld
                const { data, error } = await SupabaseService.client
                    .from('invoices')
                    .update({ notes: notizText })
                    .eq('id', id);

                if (error) {
                    console.error('Supabase Error Details:', error);
                    throw error;
                }
                console.log('Supabase Update Success:', data);
            } else {
                // DATEV-Buchung: Update über DataManager
                DataManager.setRechnungStatus(id, { notizen: notizText });
                console.log('DATEV Update Success');
            }

            this.showToast('success', 'Gespeichert', 'Notiz wurde aktualisiert');
        } catch (error) {
            console.error('Fehler beim Speichern der Notiz:', error);
            console.error('Error Message:', error.message);
            console.error('Error Details:', JSON.stringify(error, null, 2));
            this.showToast('error', 'Fehler', `Notiz konnte nicht gespeichert werden: ${error.message}`);
        }
    },

    updateRechnungProjekt: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const projektId = document.getElementById('rd-projekt').value;
        DataManager.setRechnungStatus(rechnungId, { projektId: projektId || null });
        this.loadRechnungen();
    },

    updateRechnungGeteilt: function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const geteilt = document.getElementById('rd-geteilt').checked;
        DataManager.setRechnungStatus(rechnungId, { geteilt: geteilt });
        this.loadRechnungen();
    },

    exportRechnungenCSV: function() {
        const statusFilter = document.getElementById('rechnung-filter-status').value || null;
        const projektFilter = document.getElementById('rechnung-filter-projekt').value || null;
        const lieferantFilter = document.getElementById('rechnung-filter-lieferant').value || null;

        const csv = DataManager.exportRechnungenCSV(statusFilter, projektFilter, lieferantFilter);

        // Dateiname basierend auf Filtern
        let filename = 'Rechnungen';
        if (projektFilter) {
            const projekt = DataManager.getKunstMeranProjekt(parseInt(projektFilter));
            if (projekt) filename += '_' + projekt.name.replace(/[^a-zA-Z0-9]/g, '');
        }
        if (statusFilter) filename += '_' + statusFilter;
        filename += `_${new Date().toISOString().split('T')[0]}.csv`;

        this.downloadCSV(csv, filename);
    },

    // ==========================================
    // PDF PREVIEW
    // ==========================================

    showPdfPreview: async function(partitaIva, dokumentNr, filePath = null) {
        try {
            document.getElementById('pdf-preview-title').textContent = `${partitaIva} - ${dokumentNr}`;
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = 'none';

            // Zeige Loading State
            const iframe = document.getElementById('pdf-preview-frame');
            iframe.src = 'about:blank';

            this.showModal('pdf-preview-modal');

            // Wenn filePath bereits übergeben wurde, direkt nutzen
            if (!filePath || filePath === '') {
                // Sonst: Hole Invoice aus Supabase
                const { data: invoices, error } = await SupabaseService.client
                    .from('invoices')
                    .select('file_path')
                    .eq('partita_iva', partitaIva)
                    .eq('invoice_number', dokumentNr)
                    .limit(1);

                if (error) throw error;

                if (!invoices || invoices.length === 0) {
                    throw new Error('PDF nicht in Datenbank gefunden');
                }

                filePath = invoices[0].file_path;
            }

            // Hole signierte URL von Supabase Storage
            const signedUrl = await StorageService.getSignedUrl(filePath);

            this.currentPdfPath = signedUrl;
            iframe.src = signedUrl;
            iframe.style.display = '';

            // Fehlerbehandlung für Ladefehler
            iframe.onerror = () => {
                iframe.style.display = 'none';
                document.getElementById('pdf-preview-error').style.display = '';
            };

        } catch (error) {
            console.error('PDF Preview Fehler:', error);
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = '';
            document.getElementById('pdf-preview-error').textContent = `Fehler beim Laden: ${error.message}`;
        }
    },

    openPdfInNewTab: function() {
        if (this.currentPdfPath) {
            window.open(this.currentPdfPath, '_blank');
        }
    },

    openPdfFolder: function() {
        // Öffnet den EK-Rechnungen Ordner in neuem Tab
        window.open('EK-Rechnungen/', '_blank');
    },

    // ==========================================
    // LIEFERANTEN (DATEV)
    // ==========================================

    loadLieferanten: function() {
        const lieferanten = DataManager.getDatevLieferanten();
        const rechnungen = DataManager.getRechnungenMitStatus();

        // Statistiken
        let gesamtvolumen = 0;
        let mitRechnungen = 0;
        let ohneNamen = 0;

        lieferanten.forEach(l => {
            const lieferantRechnungen = rechnungen.filter(r => r.partitaIva === l.partitaIva);
            if (lieferantRechnungen.length > 0) {
                mitRechnungen++;
                gesamtvolumen += lieferantRechnungen.reduce((sum, r) => sum + r.betrag, 0);
            }
            if (!l.name) ohneNamen++;
        });

        document.getElementById('stat-lieferanten-total').textContent = lieferanten.length;
        document.getElementById('stat-lieferanten-aktiv').textContent = mitRechnungen;
        document.getElementById('stat-lieferanten-summe').textContent = this.formatCurrency(gesamtvolumen);

        // Tabelle befüllen
        const tbody = document.getElementById('lieferanten-table-body');
        tbody.innerHTML = '';

        if (lieferanten.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Keine Lieferanten gefunden. Bitte Import-Skript ausführen.</td></tr>';
            return;
        }

        // Hinweis wenn Namen fehlen
        if (ohneNamen > 0) {
            const hinweisRow = document.createElement('tr');
            hinweisRow.innerHTML = `<td colspan="6" style="background: #fff3cd; color: #856404; padding: 0.75rem; text-align: center;">
                <strong>Hinweis:</strong> ${ohneNamen} Lieferant(en) ohne Namen. Klicken Sie auf das Stift-Symbol, um Namen zu erfassen.
            </td>`;
            tbody.appendChild(hinweisRow);
        }

        lieferanten.forEach(l => {
            const lieferantRechnungen = rechnungen.filter(r => r.partitaIva === l.partitaIva);
            const summe = lieferantRechnungen.reduce((sum, r) => sum + r.betrag, 0);
            const hatName = l.name && l.name.trim() !== '';
            const displayName = hatName ? l.name : '(Unbekannt)';
            const nameClass = hatName ? '' : 'style="color: #999; font-style: italic;"';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span id="lieferant-name-${l.partitaIva}" ${nameClass}><strong>${displayName}</strong></span>
                    <button class="btn btn-sm" style="padding: 0.1rem 0.3rem; margin-left: 0.5rem;" onclick="App.editLieferantName('${l.partitaIva}')" title="Name bearbeiten">
                        &#9998;
                    </button>
                </td>
                <td>${l.partitaIva}</td>
                <td>${l.nummer || '-'}</td>
                <td style="text-align: right;">${lieferantRechnungen.length}</td>
                <td style="text-align: right;">${this.formatCurrency(summe)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.showLieferantRechnungen('${l.partitaIva}')">Rechnungen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    editLieferantName: function(partitaIva) {
        const currentName = DataManager.getLieferantName(partitaIva) || '';
        const newName = prompt('Lieferantenname für ' + partitaIva + ':', currentName);

        if (newName !== null && newName.trim() !== '') {
            DataManager.setLieferantName(partitaIva, newName.trim());
            this.loadLieferanten();
            // Auch Rechnungsliste aktualisieren falls sichtbar
            if (document.getElementById('view-rechnungen').classList.contains('active')) {
                this.filterRechnungen();
            }
        }
    },

    showLieferantRechnungen: function(partitaIva) {
        // Zur Rechnungsansicht wechseln und filtern
        document.getElementById('rechnung-filter-lieferant').value = partitaIva;
        this.showView('rechnungen');
    },

    // ==========================================
    // HILFSFUNKTIONEN
    // ==========================================

    formatCurrency: function(value) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    },

    formatDate: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    },

    getStatusBadge: function(status) {
        const badges = {
            'planung': '<span class="badge badge-primary">Planung</span>',
            'laufend': '<span class="badge badge-success">Laufend</span>',
            'abgeschlossen': '<span class="badge badge-warning">Abgeschlossen</span>'
        };
        return badges[status] || status;
    },

    getBudgetStatusClass: function(percent) {
        if (percent >= 100) return 'danger';
        if (percent >= 80) return 'warning';
        return 'success';
    },

    showModal: function(modalId) {
        document.getElementById(modalId).classList.add('show');
    },

    hideModal: function(modalId) {
        document.getElementById(modalId).classList.remove('show');
    },

    logout: function() {
        Auth.logout();
    },

    // ==========================================
    // SITZUNGEN
    // ==========================================

    loadSitzungen: function() {
        const sitzungen = DataManager.getSitzungen();
        const tbody = document.getElementById('sitzungen-table-body');
        tbody.innerHTML = '';

        if (sitzungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Keine Sitzungen vorhanden</td></tr>';
            return;
        }

        // Sortieren nach Datum (neueste zuerst)
        sitzungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));

        const tasks = DataManager.getTasks();

        sitzungen.forEach(s => {
            const offeneTasks = tasks.filter(t => t.sitzungId === s.id && t.status !== 'erledigt').length;
            const typLabels = { intern: 'Intern', extern: 'Extern', vorstand: 'Vorstand' };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(s.datum)}</td>
                <td><strong>${s.titel}</strong></td>
                <td><span class="badge">${typLabels[s.typ] || s.typ}</span></td>
                <td>${s.teilnehmer || '-'}</td>
                <td>${offeneTasks > 0 ? `<span class="badge" style="background: #e74c3c;">${offeneTasks}</span>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editSitzung(${s.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteSitzung(${s.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Deadlines laden
        this.loadDeadlines();
    },

    loadDeadlines: function() {
        const deadlines = DataManager.getUpcomingDeadlines(14);
        const container = document.getElementById('deadlines-liste');

        if (deadlines.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">Keine anstehenden Deadlines in den nächsten 14 Tagen</p>';
            return;
        }

        let html = '';
        deadlines.forEach(t => {
            const tage = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const dringend = tage <= 3 ? 'color: #e74c3c; font-weight: bold;' : '';
            html += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span>${t.beschreibung}</span>
                    <span style="${dringend}">${this.formatDate(t.deadline)} (${tage} Tage)</span>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    showNewSitzungForm: function() {
        document.getElementById('sitzung-form').reset();
        document.getElementById('sitzung-form-id').value = '';
        document.getElementById('sitzung-modal-title').textContent = 'Neue Sitzung';
        document.getElementById('sitzung-datum').value = new Date().toISOString().split('T')[0];
        document.getElementById('sitzung-tasks-liste').innerHTML = '';
        this.showModal('sitzung-form-modal');
    },

    editSitzung: function(id) {
        const sitzungen = DataManager.getSitzungen();
        const s = sitzungen.find(x => x.id === id);
        if (!s) return;

        document.getElementById('sitzung-form-id').value = s.id;
        document.getElementById('sitzung-modal-title').textContent = 'Sitzung bearbeiten';
        document.getElementById('sitzung-titel').value = s.titel || '';
        document.getElementById('sitzung-typ').value = s.typ || 'intern';
        document.getElementById('sitzung-datum').value = s.datum || '';
        document.getElementById('sitzung-uhrzeit').value = s.uhrzeit || '';
        document.getElementById('sitzung-teilnehmer').value = s.teilnehmer || '';
        document.getElementById('sitzung-agenda').value = s.agenda || '';
        document.getElementById('sitzung-protokoll').value = s.protokoll || '';

        // Tasks laden
        this.loadSitzungTasks(id);
        this.showModal('sitzung-form-modal');
    },

    loadSitzungTasks: function(sitzungId) {
        const tasks = DataManager.getTasks().filter(t => t.sitzungId === sitzungId);
        const container = document.getElementById('sitzung-tasks-liste');
        container.innerHTML = '';

        tasks.forEach(t => {
            container.innerHTML += this.renderSitzungTaskRow(t);
        });
    },

    renderSitzungTaskRow: function(task) {
        const checked = task.status === 'erledigt' ? 'checked' : '';
        return `
            <div class="sitzung-task-row" data-task-id="${task.id}" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                <input type="checkbox" ${checked} onchange="App.toggleTaskStatus(${task.id}, this)" style="width: 18px; height: 18px;">
                <input type="text" value="${task.beschreibung || ''}" class="form-control" style="flex: 1;" onchange="App.updateTaskText(${task.id}, this.value)">
                <input type="date" value="${task.deadline || ''}" class="form-control" style="width: 140px;" onchange="App.updateTaskDeadline(${task.id}, this.value)">
                <button type="button" class="btn btn-sm" onclick="App.deleteTaskFromSitzung(${task.id})" style="color: #e74c3c;">×</button>
            </div>
        `;
    },

    addSitzungTask: function() {
        const sitzungId = document.getElementById('sitzung-form-id').value;
        const container = document.getElementById('sitzung-tasks-liste');
        const tempId = 'new_' + Date.now();

        container.innerHTML += `
            <div class="sitzung-task-row" data-task-id="${tempId}" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                <input type="checkbox" style="width: 18px; height: 18px;">
                <input type="text" class="form-control task-text" style="flex: 1;" placeholder="Aufgabenbeschreibung...">
                <input type="date" class="form-control task-deadline" style="width: 140px;">
                <button type="button" class="btn btn-sm" onclick="this.closest('.sitzung-task-row').remove()" style="color: #e74c3c;">×</button>
            </div>
        `;
    },

    toggleTaskStatus: function(taskId, checkbox) {
        const tasks = DataManager.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = checkbox.checked ? 'erledigt' : 'offen';
            DataManager.saveTask(task);
        }
    },

    updateTaskText: function(taskId, text) {
        const tasks = DataManager.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.beschreibung = text;
            DataManager.saveTask(task);
        }
    },

    updateTaskDeadline: function(taskId, deadline) {
        const tasks = DataManager.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.deadline = deadline;
            DataManager.saveTask(task);
        }
    },

    deleteTaskFromSitzung: function(taskId) {
        if (confirm('Aufgabe wirklich löschen?')) {
            DataManager.deleteTask(taskId);
            document.querySelector(`[data-task-id="${taskId}"]`).remove();
        }
    },

    saveSitzung: function(event) {
        event.preventDefault();
        const id = document.getElementById('sitzung-form-id').value;

        const sitzung = {
            id: id ? parseInt(id) : null,
            titel: document.getElementById('sitzung-titel').value,
            typ: document.getElementById('sitzung-typ').value,
            datum: document.getElementById('sitzung-datum').value,
            uhrzeit: document.getElementById('sitzung-uhrzeit').value,
            teilnehmer: document.getElementById('sitzung-teilnehmer').value,
            agenda: document.getElementById('sitzung-agenda').value,
            protokoll: document.getElementById('sitzung-protokoll').value
        };

        const savedSitzung = DataManager.saveSitzung(sitzung);

        // Neue Tasks speichern
        const newTaskRows = document.querySelectorAll('[data-task-id^="new_"]');
        newTaskRows.forEach(row => {
            const text = row.querySelector('.task-text')?.value;
            const deadline = row.querySelector('.task-deadline')?.value;
            if (text) {
                DataManager.saveTask({
                    sitzungId: savedSitzung.id,
                    beschreibung: text,
                    deadline: deadline || null,
                    status: 'offen'
                });
            }
        });

        this.hideModal('sitzung-form-modal');
        this.loadSitzungen();
    },

    deleteSitzung: function(id) {
        if (confirm('Sitzung wirklich löschen? Alle zugehörigen Aufgaben werden ebenfalls gelöscht.')) {
            // Tasks der Sitzung löschen
            const tasks = DataManager.getTasks().filter(t => t.sitzungId === id);
            tasks.forEach(t => DataManager.deleteTask(t.id));
            DataManager.deleteSitzung(id);
            this.loadSitzungen();
        }
    },

    filterSitzungen: function(typ) {
        // Tab-Styling
        document.querySelectorAll('#view-sitzungen .tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        const sitzungen = DataManager.getSitzungen();
        const filtered = typ === 'alle' ? sitzungen : sitzungen.filter(s => s.typ === typ);

        const tbody = document.getElementById('sitzungen-table-body');
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Keine Sitzungen gefunden</td></tr>';
            return;
        }

        const tasks = DataManager.getTasks();
        filtered.sort((a, b) => new Date(b.datum) - new Date(a.datum));

        filtered.forEach(s => {
            const offeneTasks = tasks.filter(t => t.sitzungId === s.id && t.status !== 'erledigt').length;
            const typLabels = { intern: 'Intern', extern: 'Extern', vorstand: 'Vorstand' };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(s.datum)}</td>
                <td><strong>${s.titel}</strong></td>
                <td><span class="badge">${typLabels[s.typ] || s.typ}</span></td>
                <td>${s.teilnehmer || '-'}</td>
                <td>${offeneTasks > 0 ? `<span class="badge" style="background: #e74c3c;">${offeneTasks}</span>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editSitzung(${s.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteSitzung(${s.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    // ==========================================
    // KÜNSTLER
    // ==========================================

    loadKuenstler: function() {
        const kuenstler = DataManager.getKuenstler();
        const tbody = document.getElementById('kuenstler-table-body');
        tbody.innerHTML = '';

        if (kuenstler.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Keine Künstler vorhanden</td></tr>';
            return;
        }

        kuenstler.forEach(k => {
            const projekte = (k.projekte || []).map(p => KUNST_MERAN_PROJEKTE[p]?.name || p).join(', ');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${k.name}</strong></td>
                <td>${k.land || '-'}</td>
                <td>${k.technik || '-'}</td>
                <td>${projekte || '-'}</td>
                <td>${k.email ? `<a href="mailto:${k.email}">${k.email}</a>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editKuenstler(${k.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteKuenstler(${k.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showNewKuenstlerForm: function() {
        document.getElementById('kuenstler-form').reset();
        document.getElementById('kuenstler-form-id').value = '';
        document.getElementById('kuenstler-modal-title').textContent = 'Neuer Künstler';
        this.showModal('kuenstler-form-modal');
    },

    editKuenstler: function(id) {
        const k = DataManager.getKuenstler().find(x => x.id === id);
        if (!k) return;

        document.getElementById('kuenstler-form-id').value = k.id;
        document.getElementById('kuenstler-modal-title').textContent = 'Künstler bearbeiten';
        document.getElementById('kuenstler-name').value = k.name || '';
        document.getElementById('kuenstler-land').value = k.land || '';
        document.getElementById('kuenstler-technik').value = k.technik || '';
        document.getElementById('kuenstler-email').value = k.email || '';
        document.getElementById('kuenstler-telefon').value = k.telefon || '';
        document.getElementById('kuenstler-website').value = k.website || '';
        document.getElementById('kuenstler-notizen').value = k.notizen || '';

        // Projekte auswählen
        const select = document.getElementById('kuenstler-projekte');
        Array.from(select.options).forEach(opt => {
            opt.selected = (k.projekte || []).includes(opt.value);
        });

        this.showModal('kuenstler-form-modal');
    },

    saveKuenstler: function(event) {
        event.preventDefault();
        const id = document.getElementById('kuenstler-form-id').value;

        const projekte = Array.from(document.getElementById('kuenstler-projekte').selectedOptions).map(o => o.value);

        const kuenstler = {
            id: id ? parseInt(id) : null,
            name: document.getElementById('kuenstler-name').value,
            land: document.getElementById('kuenstler-land').value,
            technik: document.getElementById('kuenstler-technik').value,
            email: document.getElementById('kuenstler-email').value,
            telefon: document.getElementById('kuenstler-telefon').value,
            website: document.getElementById('kuenstler-website').value,
            projekte: projekte,
            notizen: document.getElementById('kuenstler-notizen').value
        };

        DataManager.saveKuenstler(kuenstler);
        this.hideModal('kuenstler-form-modal');
        this.loadKuenstler();
    },

    deleteKuenstler: function(id) {
        if (confirm('Künstler wirklich löschen?')) {
            DataManager.deleteKuenstler(id);
            this.loadKuenstler();
        }
    },

    filterKuenstler: function() {
        const projektFilter = document.getElementById('kuenstler-filter-projekt').value;
        const suche = document.getElementById('kuenstler-suche').value.toLowerCase();

        let kuenstler = DataManager.getKuenstler();

        if (projektFilter) {
            kuenstler = kuenstler.filter(k => (k.projekte || []).includes(projektFilter));
        }
        if (suche) {
            kuenstler = kuenstler.filter(k => k.name.toLowerCase().includes(suche));
        }

        const tbody = document.getElementById('kuenstler-table-body');
        tbody.innerHTML = '';

        if (kuenstler.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Keine Künstler gefunden</td></tr>';
            return;
        }

        kuenstler.forEach(k => {
            const projekte = (k.projekte || []).map(p => KUNST_MERAN_PROJEKTE[p]?.name || p).join(', ');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${k.name}</strong></td>
                <td>${k.land || '-'}</td>
                <td>${k.technik || '-'}</td>
                <td>${projekte || '-'}</td>
                <td>${k.email ? `<a href="mailto:${k.email}">${k.email}</a>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editKuenstler(${k.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteKuenstler(${k.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    // ==========================================
    // INVENTAR
    // ==========================================

    loadInventar: function() {
        const inventar = DataManager.getInventar();
        const tbody = document.getElementById('inventar-table-body');
        tbody.innerHTML = '';

        if (inventar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666; padding: 2rem;">Kein Inventar vorhanden</td></tr>';
            return;
        }

        const kategorieLabels = { technik: 'Technik', moebel: 'Möbel', kunst: 'Kunstwerke', transport: 'Transport', sonstiges: 'Sonstiges' };
        const standortLabels = { kunsthaus: 'Kunsthaus', lager: 'Lager', extern: 'Extern' };
        const zustandLabels = { gut: 'Gut', gebraucht: 'Gebraucht', reparatur: 'Reparatur', defekt: 'Defekt' };

        inventar.forEach(i => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${i.inventarNr}</strong></td>
                <td>${i.bezeichnung}</td>
                <td>${kategorieLabels[i.kategorie] || i.kategorie}</td>
                <td>${standortLabels[i.standort] || i.standort}</td>
                <td><span class="badge">${zustandLabels[i.zustand] || i.zustand}</span></td>
                <td>${i.anschaffung ? this.formatDate(i.anschaffung) : '-'}</td>
                <td style="text-align: right;">${i.wert ? this.formatCurrency(i.wert) : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editInventar(${i.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteInventar(${i.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showNewInventarForm: function() {
        document.getElementById('inventar-form').reset();
        document.getElementById('inventar-form-id').value = '';
        document.getElementById('inventar-modal-title').textContent = 'Neuer Gegenstand';
        document.getElementById('inventar-nr').value = '';
        this.showModal('inventar-form-modal');
    },

    editInventar: function(id) {
        const i = DataManager.getInventar().find(x => x.id === id);
        if (!i) return;

        document.getElementById('inventar-form-id').value = i.id;
        document.getElementById('inventar-modal-title').textContent = 'Gegenstand bearbeiten';
        document.getElementById('inventar-nr').value = i.inventarNr || '';
        document.getElementById('inventar-kategorie').value = i.kategorie || '';
        document.getElementById('inventar-bezeichnung').value = i.bezeichnung || '';
        document.getElementById('inventar-standort').value = i.standort || 'kunsthaus';
        document.getElementById('inventar-zustand').value = i.zustand || 'gut';
        document.getElementById('inventar-anschaffung').value = i.anschaffung || '';
        document.getElementById('inventar-wert').value = i.wert || '';
        document.getElementById('inventar-beschreibung').value = i.beschreibung || '';

        this.showModal('inventar-form-modal');
    },

    saveInventar: function(event) {
        event.preventDefault();
        const id = document.getElementById('inventar-form-id').value;

        const item = {
            id: id ? parseInt(id) : null,
            inventarNr: document.getElementById('inventar-nr').value || null,
            kategorie: document.getElementById('inventar-kategorie').value,
            bezeichnung: document.getElementById('inventar-bezeichnung').value,
            standort: document.getElementById('inventar-standort').value,
            zustand: document.getElementById('inventar-zustand').value,
            anschaffung: document.getElementById('inventar-anschaffung').value,
            wert: parseFloat(document.getElementById('inventar-wert').value) || 0,
            beschreibung: document.getElementById('inventar-beschreibung').value
        };

        DataManager.saveInventar(item);
        this.hideModal('inventar-form-modal');
        this.loadInventar();
    },

    deleteInventar: function(id) {
        if (confirm('Gegenstand wirklich aus dem Inventar löschen?')) {
            DataManager.deleteInventar(id);
            this.loadInventar();
        }
    },

    filterInventar: function() {
        const kategorieFilter = document.getElementById('inventar-filter-kategorie').value;
        const standortFilter = document.getElementById('inventar-filter-standort').value;
        const suche = document.getElementById('inventar-suche').value.toLowerCase();

        let inventar = DataManager.getInventar();

        if (kategorieFilter) {
            inventar = inventar.filter(i => i.kategorie === kategorieFilter);
        }
        if (standortFilter) {
            inventar = inventar.filter(i => i.standort === standortFilter);
        }
        if (suche) {
            inventar = inventar.filter(i => i.bezeichnung.toLowerCase().includes(suche));
        }

        const tbody = document.getElementById('inventar-table-body');
        tbody.innerHTML = '';

        if (inventar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666; padding: 2rem;">Keine Gegenstände gefunden</td></tr>';
            return;
        }

        const kategorieLabels = { technik: 'Technik', moebel: 'Möbel', kunst: 'Kunstwerke', transport: 'Transport', sonstiges: 'Sonstiges' };
        const standortLabels = { kunsthaus: 'Kunsthaus', lager: 'Lager', extern: 'Extern' };
        const zustandLabels = { gut: 'Gut', gebraucht: 'Gebraucht', reparatur: 'Reparatur', defekt: 'Defekt' };

        inventar.forEach(i => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${i.inventarNr}</strong></td>
                <td>${i.bezeichnung}</td>
                <td>${kategorieLabels[i.kategorie] || i.kategorie}</td>
                <td>${standortLabels[i.standort] || i.standort}</td>
                <td><span class="badge">${zustandLabels[i.zustand] || i.zustand}</span></td>
                <td>${i.anschaffung ? this.formatDate(i.anschaffung) : '-'}</td>
                <td style="text-align: right;">${i.wert ? this.formatCurrency(i.wert) : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editInventar(${i.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteInventar(${i.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    exportInventarCSV: function() {
        const inventar = DataManager.getInventar();
        let csv = '\uFEFF';
        csv += 'Inventar-Nr;Bezeichnung;Kategorie;Standort;Zustand;Anschaffung;Wert;Beschreibung\n';

        inventar.forEach(i => {
            csv += `${i.inventarNr};"${i.bezeichnung}";${i.kategorie};${i.standort};${i.zustand};${i.anschaffung || ''};${i.wert || 0};"${i.beschreibung || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Inventar_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // ==========================================
    // ADRESSEN
    // ==========================================

    loadAdressen: function() {
        const adressen = DataManager.getAdressen();
        const tbody = document.getElementById('adressen-table-body');
        tbody.innerHTML = '';

        if (adressen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666; padding: 2rem;">Keine Kontakte vorhanden</td></tr>';
            return;
        }

        const kategorieLabels = { kuenstler: 'Künstler', kurator: 'Kurator', presse: 'Presse', sponsor: 'Sponsor', lieferant: 'Lieferant', institution: 'Institution', sonstige: 'Sonstige' };

        adressen.forEach(a => {
            const ort = [a.stadt, a.land].filter(x => x).join(', ');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${a.name}</strong></td>
                <td>${a.organisation || '-'}</td>
                <td><span class="badge">${kategorieLabels[a.kategorie] || a.kategorie}</span></td>
                <td>${a.email ? `<a href="mailto:${a.email}">${a.email}</a>` : '-'}</td>
                <td>${a.telefon || '-'}</td>
                <td>${ort || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editAdresse(${a.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteAdresse(${a.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showNewAdresseForm: function() {
        document.getElementById('adresse-form').reset();
        document.getElementById('adresse-form-id').value = '';
        document.getElementById('adresse-modal-title').textContent = 'Neuer Kontakt';
        this.showModal('adresse-form-modal');
    },

    editAdresse: function(id) {
        const a = DataManager.getAdressen().find(x => x.id === id);
        if (!a) return;

        document.getElementById('adresse-form-id').value = a.id;
        document.getElementById('adresse-modal-title').textContent = 'Kontakt bearbeiten';
        document.getElementById('adresse-name').value = a.name || '';
        document.getElementById('adresse-organisation').value = a.organisation || '';
        document.getElementById('adresse-kategorie').value = a.kategorie || 'sonstige';
        document.getElementById('adresse-email').value = a.email || '';
        document.getElementById('adresse-telefon').value = a.telefon || '';
        document.getElementById('adresse-strasse').value = a.strasse || '';
        document.getElementById('adresse-plz').value = a.plz || '';
        document.getElementById('adresse-stadt').value = a.stadt || '';
        document.getElementById('adresse-land').value = a.land || 'Italien';
        document.getElementById('adresse-notizen').value = a.notizen || '';

        this.showModal('adresse-form-modal');
    },

    saveAdresse: function(event) {
        event.preventDefault();
        const id = document.getElementById('adresse-form-id').value;

        const adresse = {
            id: id ? parseInt(id) : null,
            name: document.getElementById('adresse-name').value,
            organisation: document.getElementById('adresse-organisation').value,
            kategorie: document.getElementById('adresse-kategorie').value,
            email: document.getElementById('adresse-email').value,
            telefon: document.getElementById('adresse-telefon').value,
            strasse: document.getElementById('adresse-strasse').value,
            plz: document.getElementById('adresse-plz').value,
            stadt: document.getElementById('adresse-stadt').value,
            land: document.getElementById('adresse-land').value,
            notizen: document.getElementById('adresse-notizen').value
        };

        DataManager.saveAdresse(adresse);
        this.hideModal('adresse-form-modal');
        this.loadAdressen();
    },

    deleteAdresse: function(id) {
        if (confirm('Kontakt wirklich löschen?')) {
            DataManager.deleteAdresse(id);
            this.loadAdressen();
        }
    },

    filterAdressen: function() {
        const kategorieFilter = document.getElementById('adresse-filter-kategorie').value;
        const suche = document.getElementById('adresse-suche').value.toLowerCase();

        let adressen = DataManager.getAdressen();

        if (kategorieFilter) {
            adressen = adressen.filter(a => a.kategorie === kategorieFilter);
        }
        if (suche) {
            adressen = adressen.filter(a =>
                a.name.toLowerCase().includes(suche) ||
                (a.email || '').toLowerCase().includes(suche) ||
                (a.organisation || '').toLowerCase().includes(suche)
            );
        }

        const tbody = document.getElementById('adressen-table-body');
        tbody.innerHTML = '';

        if (adressen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666; padding: 2rem;">Keine Kontakte gefunden</td></tr>';
            return;
        }

        const kategorieLabels = { kuenstler: 'Künstler', kurator: 'Kurator', presse: 'Presse', sponsor: 'Sponsor', lieferant: 'Lieferant', institution: 'Institution', sonstige: 'Sonstige' };

        adressen.forEach(a => {
            const ort = [a.stadt, a.land].filter(x => x).join(', ');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${a.name}</strong></td>
                <td>${a.organisation || '-'}</td>
                <td><span class="badge">${kategorieLabels[a.kategorie] || a.kategorie}</span></td>
                <td>${a.email ? `<a href="mailto:${a.email}">${a.email}</a>` : '-'}</td>
                <td>${a.telefon || '-'}</td>
                <td>${ort || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editAdresse(${a.id})">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline" onclick="App.deleteAdresse(${a.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    exportAdressenCSV: function() {
        const adressen = DataManager.getAdressen();
        let csv = '\uFEFF';
        csv += 'Name;Organisation;Kategorie;Email;Telefon;Strasse;PLZ;Stadt;Land;Notizen\n';

        adressen.forEach(a => {
            csv += `"${a.name}";"${a.organisation || ''}";"${a.kategorie}";"${a.email || ''}";"${a.telefon || ''}";"${a.strasse || ''}";"${a.plz || ''}";"${a.stadt || ''}";"${a.land || ''}";"${a.notizen || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Adressen_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // ==========================================
    // REPORTING
    // ==========================================

    loadReporting: function() {
        const jahr = document.getElementById('reporting-jahr')?.value || new Date().getFullYear();

        // Projektübersicht laden
        this.loadReportingProjekte(jahr);

        // Deckungsbeitragsrechnung laden
        this.loadDeckungsbeitrag(jahr);

        // Kosten nach Kategorie laden
        this.loadKostenKategorien(jahr);
    },

    loadReportingProjekte: function(jahr) {
        const tbody = document.getElementById('reporting-projekte-table');
        const tfoot = document.getElementById('reporting-projekte-footer');
        if (!tbody) return;

        tbody.innerHTML = '';

        const summaries = DataManager.getAllProjectsSummary();
        let totalBudget = 0, totalIst = 0, totalPersonal = 0;

        summaries.forEach(s => {
            const verfuegbar = s.budget - s.ist - s.provisorisch;
            const auslastung = s.budget > 0 ? ((s.ist + s.provisorisch) / s.budget * 100) : 0;

            totalBudget += s.budget;
            totalIst += s.ist;

            // Personalkosten aus Zeiterfassung berechnen
            const personalkosten = DataManager.getProjectLaborCost(s.project.id) || 0;
            totalPersonal += personalkosten;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${s.project.name}</strong></td>
                <td>${s.project.datevKostenstelle || s.project.id}</td>
                <td style="text-align: right;">${this.formatCurrency(s.budget)}</td>
                <td style="text-align: right;">${this.formatCurrency(s.ist)}</td>
                <td style="text-align: right;">${this.formatCurrency(personalkosten)}</td>
                <td style="text-align: right; ${verfuegbar < 0 ? 'color: #e74c3c;' : ''}">${this.formatCurrency(verfuegbar)}</td>
                <td>
                    <div style="background: #e0e0e0; border-radius: 4px; height: 20px; position: relative;">
                        <div style="background: ${auslastung > 100 ? '#e74c3c' : auslastung > 80 ? '#f39c12' : '#27ae60'};
                                    width: ${Math.min(auslastung, 100)}%; height: 100%; border-radius: 4px;"></div>
                        <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px;">
                            ${auslastung.toFixed(0)}%
                        </span>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Footer mit Summen
        if (tfoot) {
            tfoot.innerHTML = `
                <tr style="font-weight: bold; background: #f5f5f5;">
                    <td colspan="2">SUMME</td>
                    <td style="text-align: right;">${this.formatCurrency(totalBudget)}</td>
                    <td style="text-align: right;">${this.formatCurrency(totalIst)}</td>
                    <td style="text-align: right;">${this.formatCurrency(totalPersonal)}</td>
                    <td style="text-align: right;">${this.formatCurrency(totalBudget - totalIst)}</td>
                    <td></td>
                </tr>
            `;
        }
    },

    loadDeckungsbeitrag: function(jahr) {
        const tbody = document.getElementById('db-table-body');
        if (!tbody) return;

        const db = DataManager.calculateDeckungsbeitrag(jahr);
        const einnahmenSummary = DataManager.getEinnahmenSummary(jahr);

        // Struktur der Deckungsbeitragsrechnung
        const rows = [
            { type: 'header', label: '1. UMSÄTZE', konto: '' },
            { type: 'detail', label: '   Erlöse Lieferungen/Leistungen', konto: '6001*', ist: 0, plan: einnahmenSummary.gesamt * 0.2 },
            { type: 'detail', label: '   Zuschüsse und Beiträge', konto: '6401*', ist: einnahmenSummary.ist, plan: einnahmenSummary.gesamt * 0.7 },
            { type: 'detail', label: '   Sonstige betriebliche Erträge', konto: '6400*', ist: 0, plan: einnahmenSummary.gesamt * 0.1 },
            { type: 'sum', label: 'SUMME UMSÄTZE', ist: db.umsaetze, plan: einnahmenSummary.gesamt },

            { type: 'spacer' },
            { type: 'header', label: '2. DIREKTE KOSTEN', konto: '' },
            { type: 'detail', label: '   (a) Materialkosten', konto: '680*', ist: db.direkteKosten * 0.3, plan: 0 },
            { type: 'detail', label: '   (b) Dienstleistungen (Ausst./Projekte)', konto: '690125*', ist: db.direkteKosten * 0.7, plan: 0 },
            { type: 'sum', label: 'SUMME DIREKTE KOSTEN', ist: db.direkteKosten, plan: 0 },

            { type: 'spacer' },
            { type: 'result', label: '3. DECKUNGSBEITRAG 1 (DB1)', ist: db.db1, plan: einnahmenSummary.gesamt, highlight: true },

            { type: 'spacer' },
            { type: 'header', label: '4. STRUKTURKOSTEN', konto: '' },
            { type: 'detail', label: '   (a) Verwaltung', konto: '6901/02*', ist: db.strukturkosten * 0.2, plan: 0 },
            { type: 'detail', label: '   (b) Strukturen (inkl. Miete)', konto: '700*', ist: db.strukturkosten * 0.3, plan: 0 },
            { type: 'detail', label: '   (c) Gebäudekosten', konto: '690241/42*', ist: db.strukturkosten * 0.1, plan: 0 },
            { type: 'detail', label: '   (d) Personalkosten', konto: '710*', ist: db.strukturkosten * 0.4, plan: 0 },
            { type: 'sum', label: 'SUMME STRUKTURKOSTEN', ist: db.strukturkosten, plan: 0 },

            { type: 'spacer' },
            { type: 'result', label: '5. DECKUNGSBEITRAG 2 / EBITDA', ist: db.db2, plan: einnahmenSummary.gesamt, highlight: true },

            { type: 'spacer' },
            { type: 'detail', label: '6. Abschreibungen (kalk.)', konto: '720*', ist: db.abschreibungen, plan: 0 },
            { type: 'detail', label: '7. Zinsen', konto: '850*', ist: db.zinsen, plan: 0 },

            { type: 'spacer' },
            { type: 'result', label: '8. ERGEBNIS', ist: db.ergebnis, plan: einnahmenSummary.gesamt, highlight: true, final: true }
        ];

        tbody.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');

            if (r.type === 'spacer') {
                tr.innerHTML = '<td colspan="5" style="height: 10px;"></td>';
            } else if (r.type === 'header') {
                tr.innerHTML = `<td colspan="5" style="font-weight: bold; background: #f0f0f0; padding: 8px;">${r.label}</td>`;
            } else {
                const abw = (r.ist || 0) - (r.plan || 0);
                const style = r.highlight ? 'font-weight: bold; background: #e8f4fd;' : '';
                const finalStyle = r.final ? 'font-weight: bold; background: #d4edda; font-size: 1.1em;' : '';

                tr.style.cssText = finalStyle || style;
                tr.innerHTML = `
                    <td style="${r.type === 'detail' ? 'padding-left: 1rem;' : ''}">${r.label}</td>
                    <td style="color: #666;">${r.konto || ''}</td>
                    <td style="text-align: right;">${r.ist !== undefined ? this.formatCurrency(r.ist) : ''}</td>
                    <td style="text-align: right;">${r.plan ? this.formatCurrency(r.plan) : '-'}</td>
                    <td style="text-align: right; color: ${abw < 0 ? '#e74c3c' : '#27ae60'};">
                        ${r.plan ? this.formatCurrency(abw) : '-'}
                    </td>
                `;
            }
            tbody.appendChild(tr);
        });
    },

    loadKostenKategorien: function(jahr) {
        const tbody = document.getElementById('reporting-kategorien-table');
        if (!tbody) return;

        const buchungen = DataManager.getBuchungen(jahr);

        // Nach Kategorie gruppieren
        const kategorien = {};
        let gesamt = 0;

        buchungen.forEach(b => {
            const konto = b.konto || 'unbekannt';
            let kategorie = 'Sonstige';
            let bereich = konto;

            // Kategorisieren basierend auf Konto
            for (const [key, kat] of Object.entries(DataManager.KONTEN_KATEGORIEN)) {
                if (konto.startsWith(kat.prefix)) {
                    kategorie = kat.name;
                    bereich = kat.prefix + '*';
                    break;
                }
            }

            if (!kategorien[kategorie]) {
                kategorien[kategorie] = { bereich, betrag: 0 };
            }
            kategorien[kategorie].betrag += parseFloat(b.betrag) || 0;
            gesamt += parseFloat(b.betrag) || 0;
        });

        tbody.innerHTML = '';

        // Sortieren nach Betrag
        const sorted = Object.entries(kategorien).sort((a, b) => b[1].betrag - a[1].betrag);

        sorted.forEach(([name, data]) => {
            const anteil = gesamt > 0 ? (data.betrag / gesamt * 100) : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${name}</td>
                <td style="color: #666;">${data.bereich}</td>
                <td style="text-align: right;">${this.formatCurrency(data.betrag)}</td>
                <td style="text-align: right;">${anteil.toFixed(1)}%</td>
            `;
            tbody.appendChild(tr);
        });

        // Summenzeile
        const sumRow = document.createElement('tr');
        sumRow.style.cssText = 'font-weight: bold; background: #f5f5f5;';
        sumRow.innerHTML = `
            <td colspan="2">GESAMT</td>
            <td style="text-align: right;">${this.formatCurrency(gesamt)}</td>
            <td style="text-align: right;">100%</td>
        `;
        tbody.appendChild(sumRow);
    },

    // ==========================================
    // EINNAHMENPLANUNG
    // ==========================================

    loadEinnahmen: function() {
        const jahr = document.getElementById('einnahmen-filter-jahr')?.value || new Date().getFullYear();
        const einnahmen = DataManager.getEinnahmen(parseInt(jahr));

        // Summary aktualisieren
        const summary = DataManager.getEinnahmenSummary(parseInt(jahr));
        document.getElementById('einnahmen-bestaetigt').textContent = this.formatCurrency(summary.bestaetigt);
        document.getElementById('einnahmen-erwartet').textContent = this.formatCurrency(summary.erwartet);
        document.getElementById('einnahmen-unsicher').textContent = this.formatCurrency(summary.unsicher);
        document.getElementById('einnahmen-gesamt').textContent = this.formatCurrency(summary.gesamt);

        this.allEinnahmen = einnahmen;
        this.filterEinnahmen();
    },

    filterEinnahmen: function() {
        const typ = document.getElementById('einnahmen-filter-typ')?.value || '';
        const status = document.getElementById('einnahmen-filter-status')?.value || '';

        let filtered = this.allEinnahmen || [];

        if (typ) {
            filtered = filtered.filter(e => e.typ === typ);
        }
        if (status) {
            filtered = filtered.filter(e => e.status === status);
        }

        this.renderEinnahmenTable(filtered);
    },

    renderEinnahmenTable: function(einnahmen) {
        const tbody = document.getElementById('einnahmen-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        let summePlan = 0, summeIst = 0;

        const typLabels = {
            'zuschuss_provinz': 'Zuschuss Provinz',
            'zuschuss_gemeinde': 'Zuschuss Gemeinde',
            'zuschuss_region': 'Zuschuss Region',
            'zuschuss_stiftung': 'Zuschuss Stiftung',
            'sponsoring': 'Sponsoring',
            'spende': 'Spende',
            'mitgliedsbeitrag': 'Mitgliedsbeitrag',
            'erloese': 'Erlöse',
            'sonstige': 'Sonstige'
        };

        const statusColors = {
            'bestaetigt': '#27ae60',
            'eingegangen': '#27ae60',
            'erwartet': '#f39c12',
            'unsicher': '#95a5a6',
            'abgesagt': '#e74c3c'
        };

        const statusLabels = {
            'bestaetigt': 'Bestätigt',
            'eingegangen': 'Eingegangen',
            'erwartet': 'Erwartet',
            'unsicher': 'Unsicher',
            'abgesagt': 'Abgesagt'
        };

        einnahmen.forEach(e => {
            summePlan += parseFloat(e.betragPlan) || 0;
            summeIst += parseFloat(e.betragIst) || 0;

            const dok = DataManager.getEinnahmeDokument(e.id);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${e.quelle}</strong></td>
                <td>${typLabels[e.typ] || e.typ}</td>
                <td style="text-align: right;">${this.formatCurrency(e.betragPlan)}</td>
                <td style="text-align: right;">${e.betragIst ? this.formatCurrency(e.betragIst) : '-'}</td>
                <td>
                    <span style="background: ${statusColors[e.status]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                        ${statusLabels[e.status] || e.status}
                    </span>
                </td>
                <td style="text-align: center;">
                    ${dok ? `<button class="btn btn-outline btn-sm" onclick="App.showDokumentPreview(${e.id})" title="${dok.name}">📄</button>` :
                           `<span style="color: #ccc;">-</span>`}
                </td>
                <td>${e.faellig ? new Date(e.faellig).toLocaleDateString('de-DE') : '-'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="App.editEinnahme(${e.id})">Bearbeiten</button>
                    <button class="btn btn-outline btn-sm" onclick="App.deleteEinnahme(${e.id})" style="color: #e74c3c;">Löschen</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Summen aktualisieren
        document.getElementById('einnahmen-summe-plan').textContent = this.formatCurrency(summePlan);
        document.getElementById('einnahmen-summe-ist').textContent = this.formatCurrency(summeIst);
    },

    showNewEinnahmeForm: function() {
        document.getElementById('einnahme-modal-title').textContent = 'Neue Einnahme';
        document.getElementById('einnahme-id').value = '';
        document.getElementById('einnahme-quelle').value = '';
        document.getElementById('einnahme-typ').value = '';
        document.getElementById('einnahme-jahr').value = new Date().getFullYear();
        document.getElementById('einnahme-betrag-plan').value = '';
        document.getElementById('einnahme-betrag-ist').value = '';
        document.getElementById('einnahme-status').value = 'unsicher';
        document.getElementById('einnahme-faellig').value = '';
        document.getElementById('einnahme-konto').value = '';
        document.getElementById('einnahme-dokument').value = '';
        document.getElementById('einnahme-dokument-vorschau').innerHTML = '';
        document.getElementById('einnahme-notizen').value = '';

        this.showModal('einnahme-form-modal');
    },

    editEinnahme: function(id) {
        const einnahmen = DataManager.getEinnahmen();
        const e = einnahmen.find(x => x.id === id);
        if (!e) return;

        document.getElementById('einnahme-modal-title').textContent = 'Einnahme bearbeiten';
        document.getElementById('einnahme-id').value = e.id;
        document.getElementById('einnahme-quelle').value = e.quelle || '';
        document.getElementById('einnahme-typ').value = e.typ || '';
        document.getElementById('einnahme-jahr').value = e.jahr || new Date().getFullYear();
        document.getElementById('einnahme-betrag-plan').value = e.betragPlan || '';
        document.getElementById('einnahme-betrag-ist').value = e.betragIst || '';
        document.getElementById('einnahme-status').value = e.status || 'unsicher';
        document.getElementById('einnahme-faellig').value = e.faellig || '';
        document.getElementById('einnahme-konto').value = e.konto || '';
        document.getElementById('einnahme-dokument').value = '';
        document.getElementById('einnahme-notizen').value = e.notizen || '';

        // Dokumentvorschau
        const dok = DataManager.getEinnahmeDokument(id);
        const vorschau = document.getElementById('einnahme-dokument-vorschau');
        if (dok) {
            vorschau.innerHTML = `<div style="padding: 0.5rem; background: #e8f4fd; border-radius: 4px;">
                📄 <strong>${dok.name}</strong> (${(dok.size / 1024).toFixed(1)} KB)
                <button type="button" class="btn btn-outline btn-sm" onclick="App.showDokumentPreview(${id})" style="margin-left: 0.5rem;">Anzeigen</button>
            </div>`;
        } else {
            vorschau.innerHTML = '';
        }

        this.showModal('einnahme-form-modal');
    },

    async saveEinnahme(event) {
        event.preventDefault();

        const id = document.getElementById('einnahme-id').value;
        const einnahme = {
            id: id ? parseInt(id) : null,
            quelle: document.getElementById('einnahme-quelle').value,
            typ: document.getElementById('einnahme-typ').value,
            jahr: parseInt(document.getElementById('einnahme-jahr').value),
            betragPlan: parseFloat(document.getElementById('einnahme-betrag-plan').value) || 0,
            betragIst: parseFloat(document.getElementById('einnahme-betrag-ist').value) || 0,
            status: document.getElementById('einnahme-status').value,
            faellig: document.getElementById('einnahme-faellig').value,
            konto: document.getElementById('einnahme-konto').value,
            notizen: document.getElementById('einnahme-notizen').value
        };

        const saved = DataManager.saveEinnahme(einnahme);

        // Dokument speichern falls hochgeladen
        const fileInput = document.getElementById('einnahme-dokument');
        if (fileInput.files.length > 0) {
            await DataManager.saveEinnahmeDokument(saved.id, fileInput.files[0]);
        }

        this.hideModal('einnahme-form-modal');
        this.loadEinnahmen();
    },

    deleteEinnahme: function(id) {
        if (confirm('Einnahme wirklich löschen?')) {
            DataManager.deleteEinnahme(id);
            this.loadEinnahmen();
        }
    },

    toggleDokumentRequired: function() {
        const status = document.getElementById('einnahme-status').value;
        const label = document.getElementById('dokument-label');
        if (status === 'bestaetigt') {
            label.innerHTML = 'Bestätigungsdokument (E-Mail, Zusage, Vertrag) <span style="color: #e74c3c;">*empfohlen</span>';
        } else {
            label.innerHTML = 'Bestätigungsdokument (E-Mail, Zusage, Vertrag)';
        }
    },

    showDokumentPreview: function(einnahmeId) {
        const dok = DataManager.getEinnahmeDokument(einnahmeId);
        if (!dok) {
            alert('Kein Dokument vorhanden');
            return;
        }

        document.getElementById('dokument-preview-title').textContent = dok.name;
        const frame = document.getElementById('dokument-preview-frame');

        // Je nach Dateityp anzeigen
        if (dok.type.includes('pdf') || dok.type.includes('image')) {
            frame.src = dok.data;
        } else {
            // Für andere Dateitypen Download-Link anzeigen
            frame.srcdoc = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; font-family: sans-serif;">
                    <div style="text-align: center;">
                        <p style="font-size: 48px;">📄</p>
                        <p><strong>${dok.name}</strong></p>
                        <p>${(dok.size / 1024).toFixed(1)} KB</p>
                        <a href="${dok.data}" download="${dok.name}" style="color: #3498db;">Herunterladen</a>
                    </div>
                </div>
            `;
        }

        this.showModal('dokument-preview-modal');
    },

    exportEinnahmenCSV: function() {
        const jahr = document.getElementById('einnahmen-filter-jahr')?.value || new Date().getFullYear();
        const einnahmen = DataManager.getEinnahmen(parseInt(jahr));

        let csv = '\uFEFF';
        csv += 'Quelle;Typ;Jahr;Betrag Plan;Betrag IST;Status;Fällig;Konto;Notizen\n';

        einnahmen.forEach(e => {
            csv += `"${e.quelle}";"${e.typ}";"${e.jahr}";"${e.betragPlan}";"${e.betragIst || ''}";"${e.status}";"${e.faellig || ''}";"${e.konto || ''}";"${e.notizen || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Einnahmen_${jahr}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // ==========================================
    // DATEI-UPLOAD (Drag & Drop)
    // ==========================================

    currentInvoiceFile: null,

    setupFileUpload: function() {
        const uploadZone = document.getElementById('invoice-upload-zone');
        const fileInput = document.getElementById('invoice-file-input');
        const uploadContent = uploadZone.querySelector('.upload-content');

        // Click zum Datei-Auswahl
        uploadContent.addEventListener('click', () => fileInput.click());

        // Datei ausgewählt
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Drag & Drop Events
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });
    },

    handleFile: function(file) {
        // Validierung
        if (!file.type.includes('pdf')) {
            alert('Bitte nur PDF-Dateien hochladen.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10 MB
            alert('Datei zu groß. Maximale Größe: 10 MB');
            return;
        }

        // Datei speichern
        this.currentInvoiceFile = file;

        // Preview anzeigen
        const uploadContent = document.querySelector('#invoice-upload-zone .upload-content');
        const filePreview = document.getElementById('invoice-file-preview');

        uploadContent.style.display = 'none';
        filePreview.style.display = 'flex';
        filePreview.querySelector('.file-name').textContent = file.name;
    },

    removeInvoiceFile: function() {
        this.currentInvoiceFile = null;

        const uploadContent = document.querySelector('#invoice-upload-zone .upload-content');
        const filePreview = document.getElementById('invoice-file-preview');

        uploadContent.style.display = 'flex';
        filePreview.style.display = 'none';

        document.getElementById('invoice-file-input').value = '';
    },

    // ==========================================
    // MASSEN-UPLOAD FÜR RECHNUNGEN
    // ==========================================

    pendingInvoiceFiles: [],

    setupMassUpload: function() {
        const uploadZone = document.getElementById('invoice-mass-upload-zone');
        const fileInput = document.getElementById('invoice-mass-file-input');
        const uploadContent = uploadZone.querySelector('.upload-content');

        // Admin-Bereich anzeigen
        if (DataManager.isAdmin()) {
            document.getElementById('invoice-mass-upload-section').style.display = 'block';
        }

        // Click zum Datei-Auswahl
        uploadContent.addEventListener('click', () => fileInput.click());

        // Dateien ausgewählt
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleMassFiles(Array.from(e.target.files));
            }
        });

        // Drag & Drop Events
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                this.handleMassFiles(Array.from(e.dataTransfer.files));
            }
        });
    },

    handleMassFiles: function(files) {
        // Nur PDFs
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            alert('Bitte nur PDF-Dateien hochladen.');
            return;
        }

        // Zu pendingInvoiceFiles hinzufügen
        this.pendingInvoiceFiles = pdfFiles.map(file => ({
            file: file,
            status: 'pending',
            parsed: this.parseInvoiceFilename(file.name)
        }));

        // Preview anzeigen
        this.showMassUploadPreview();
    },

    parseInvoiceFilename: function(filename) {
        // Formate:
        // 1. Neues: Jahr_PartitaIVA_Fornitore_RechnungsNr_Datum.pdf (5 Teile)
        // 2. Timestamp: Timestamp_PartitaIVA_RechnungsNr.pdf (3 Teile, erster ist Zahl >1000000000)
        // 3. Alt: PartitaIVA_RechnungsNr.pdf (2 Teile)
        const nameWithoutExt = filename.replace(/\.pdf$/i, '');
        const parts = nameWithoutExt.split('_');

        // Neues Format mit 5 Teilen: Jahr_PartitaIVA_Fornitore_RechnungsNr_Datum
        if (parts.length >= 5) {
            return {
                year: parts[0],
                partitaIva: parts[1],
                fornitore: parts[2],
                invoiceNumber: parts[3],
                date: parts[4],
                valid: true
            };
        }

        // Timestamp Format: 1783676713299_IT00882800212_9774600117.pdf
        if (parts.length === 3 && /^\d{10,}$/.test(parts[0])) {
            return {
                partitaIva: parts[1],
                invoiceNumber: parts[2],
                fornitore: null,
                year: null,
                date: null,
                valid: true
            };
        }

        // Altes Format mit 2+ Teilen: PartitaIVA_RechnungsNr
        if (parts.length >= 2) {
            return {
                partitaIva: parts[0],
                invoiceNumber: parts.slice(1).join('_'),
                fornitore: null,
                year: null,
                date: null,
                valid: true
            };
        }

        return {
            partitaIva: null,
            invoiceNumber: null,
            fornitore: null,
            year: null,
            date: null,
            valid: false
        };
    },

    showMassUploadPreview: function() {
        const uploadContent = document.querySelector('#invoice-mass-upload-zone .upload-content');
        const preview = document.getElementById('invoice-mass-preview');
        const fileList = document.getElementById('invoice-mass-file-list');

        uploadContent.style.display = 'none';
        preview.style.display = 'block';

        // File-Liste rendern
        fileList.innerHTML = this.pendingInvoiceFiles.map((item, index) => {
            const sizeKB = (item.file.size / 1024).toFixed(1);
            const statusClass = item.parsed.valid ? '' : 'warning';

            let statusText = '';
            if (item.parsed.valid) {
                if (item.parsed.fornitore) {
                    // Neues Format
                    statusText = `${item.parsed.fornitore} • PIva: ${item.parsed.partitaIva} • Nr: ${item.parsed.invoiceNumber}`;
                } else {
                    // Altes Format
                    statusText = `Partita IVA: ${item.parsed.partitaIva} • Rechnung: ${item.parsed.invoiceNumber}`;
                }
            } else {
                statusText = 'Warnung: Dateiname nicht erkannt';
            }

            return `
                <div class="file-list-item">
                    <div class="file-list-item-info">
                        <span class="file-list-item-icon">📄</span>
                        <div class="file-list-item-details">
                            <div class="file-list-item-name">${item.file.name}</div>
                            <div class="file-list-item-meta ${statusClass}">${statusText} • ${sizeKB} KB</div>
                        </div>
                    </div>
                    <button class="file-list-item-remove" onclick="App.removePendingFile(${index})" title="Entfernen">✕</button>
                </div>
            `;
        }).join('');
    },

    removePendingFile: function(index) {
        this.pendingInvoiceFiles.splice(index, 1);

        if (this.pendingInvoiceFiles.length === 0) {
            this.cancelMassUpload();
        } else {
            this.showMassUploadPreview();
        }
    },

    cancelMassUpload: function() {
        this.pendingInvoiceFiles = [];

        const uploadContent = document.querySelector('#invoice-mass-upload-zone .upload-content');
        const preview = document.getElementById('invoice-mass-preview');

        uploadContent.style.display = 'flex';
        preview.style.display = 'none';

        document.getElementById('invoice-mass-file-input').value = '';
    },

    startMassUpload: async function() {
        const btn = document.getElementById('start-upload-btn');
        const btnText = document.getElementById('upload-btn-text');
        const progress = document.getElementById('upload-progress');

        btn.disabled = true;
        btnText.style.display = 'none';
        progress.style.display = 'inline';

        let uploaded = 0;
        const total = this.pendingInvoiceFiles.length;

        for (let i = 0; i < this.pendingInvoiceFiles.length; i++) {
            const item = this.pendingInvoiceFiles[i];
            progress.textContent = `${uploaded + 1}/${total}...`;

            try {
                // Upload zu Supabase Storage
                const uploadResult = await StorageService.uploadFile(
                    item.file,
                    'invoices', // Ordner
                    null
                );

                // DATEV-Verknüpfung suchen
                const datevBuchungId = this.findMatchingDatevBuchung(
                    item.parsed.partitaIva,
                    item.parsed.invoiceNumber
                );

                // In Datenbank speichern
                await DataManager.addInvoice({
                    fileName: item.file.name,
                    filePath: uploadResult.path,
                    fileSize: item.file.size,
                    partitaIva: item.parsed.partitaIva,
                    invoiceNumber: item.parsed.invoiceNumber,
                    status: 'uploaded',
                    datevBuchungId: datevBuchungId
                });

                uploaded++;
                console.log(`✅ ${item.file.name} hochgeladen${datevBuchungId ? ' (DATEV verknüpft)' : ''}`);

            } catch (error) {
                console.error(`❌ Fehler bei ${item.file.name}:`, error);
            }
        }

        // Fertig
        btn.disabled = false;
        btnText.style.display = 'inline';
        progress.style.display = 'none';

        this.showToast(
            'success',
            'Upload erfolgreich!',
            `${uploaded} von ${total} Dateien wurden hochgeladen`
        );

        this.cancelMassUpload();
        this.loadRechnungen(); // Liste neu laden
    },

    /**
     * Sucht passende DATEV-Buchung anhand PartitaIVA und Rechnungsnummer
     */
    findMatchingDatevBuchung: function(partitaIva, invoiceNumber) {
        if (!partitaIva || !invoiceNumber) return null;

        const buchungen = DataManager.getDatevBuchungen();

        // Suche nach exakter Übereinstimmung
        const match = buchungen.find(b =>
            b.partitaIva === partitaIva &&
            b.dokumentNr === invoiceNumber
        );

        if (match) {
            console.log(`🔗 DATEV-Verknüpfung gefunden: Buchung ID ${match.id}`);
            return match.id;
        }

        console.log(`⚠️ Keine DATEV-Buchung gefunden für ${partitaIva}_${invoiceNumber}`);
        return null;
    },

    // ==========================================
    // STATUS-WORKFLOW
    // ==========================================

    /**
     * Ändert den Status einer Rechnung
     */
    changeInvoiceStatus: async function(invoiceId, newStatus) {
        try {
            // Berechtigungen prüfen
            if (newStatus === 'bezahlt' && !DataManager.isAdmin()) {
                this.showToast('error', 'Keine Berechtigung', 'Nur Admins können Rechnungen als bezahlt markieren');
                return;
            }

            // Status in Supabase aktualisieren
            await DataManager.updateInvoiceStatus(invoiceId, newStatus);

            // Erfolgsmeldung
            const statusLabels = {
                'kontrolliert': 'Kontrolliert',
                'bezahlt': 'Bezahlt'
            };
            this.showToast('success', 'Status geändert', `Rechnung als ${statusLabels[newStatus]} markiert`);

            // Tabelle neu laden
            this.filterRechnungen();

        } catch (error) {
            console.error('Fehler beim Ändern des Status:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }
    },

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    showToast: function(type, title, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove nach 4 Sekunden
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// App starten wenn Seite geladen
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

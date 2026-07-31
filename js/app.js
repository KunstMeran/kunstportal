/**
 * PROJEKTSOFTWARE KUNST MERAN - APP MODULE
 * Hauptanwendungslogik mit DATEV-Integration
 * Version: 3.0.0
 */

// Icon Helper - liefert SVG-Icon als HTML
const Icons = {
    document: '<img src="icons/01-document.svg" alt="" class="icon">',
    sync: '<img src="icons/02-sync.svg" alt="" class="icon">',
    data: '<img src="icons/03-data.svg" alt="" class="icon">',
    upload: '<img src="icons/04-upload.svg" alt="" class="icon">',
    company: '<img src="icons/05-company.svg" alt="" class="icon">',
    trend: '<img src="icons/06-trend.svg" alt="" class="icon">',
    close: '<img src="icons/07-close.svg" alt="" class="icon-sm">',
    check: '<img src="icons/08-check.svg" alt="" class="icon">',
    edit: '<img src="icons/09-edit.svg" alt="" class="icon">',
    warning: '<img src="icons/10-warning.svg" alt="" class="icon">',
    preview: '<img src="icons/11-preview.svg" alt="" class="icon">',
    delete: '<img src="icons/12-delete.svg" alt="" class="icon">',
    image: '<img src="icons/13-image.svg" alt="" class="icon">',
    attachment: '<img src="icons/14-attachment.svg" alt="" class="icon">',
    success: '<img src="icons/15-success.svg" alt="" class="icon">',
    error: '<img src="icons/16-error.svg" alt="" class="icon">'
};

const App = {
    currentView: 'dashboard',
    currentProjectId: null,
    currentRechnungId: null,
    currentPdfPath: null,

    // Pagination
    currentRechnungenPage: 1,
    rechnungenPerPage: 10,
    filteredRechnungen: [],

    // Sortierung
    currentSortColumn: 'datum',
    currentSortDirection: 'desc',

    // Spaltenbreiten (wird aus localStorage geladen)
    columnWidths: {},

    // Berechtigungen des aktuellen Users
    userPermissions: null,

    /**
     * App initialisieren
     */
    init: async function() {
        // Auth prüfen
        const isAuthenticated = await Auth.checkAuth();
        if (!isAuthenticated) return;

        // Benutzerinfo laden
        await this.loadUserInfo();

        // Berechtigungen laden
        await this.loadUserPermissions();

        // Gespeicherte Einstellungen laden
        this.loadUserSettings();

        // Navigation Setup
        this.setupNavigation();

        // Navigation nach Berechtigungen filtern
        this.applyNavigationPermissions();

        // Tab Setup
        this.setupTabs();

        // File Upload Setup
        this.setupFileUpload();

        // Import-Tab PDF Upload Setup
        this.setupImportPdfUpload();

        // DATEV-Daten laden
        await this.loadDatevData();

        // Letzte View wiederherstellen oder Dashboard laden
        const lastView = localStorage.getItem('lastView') || 'dashboard';
        if (this.hasAccessToView(lastView)) {
            this.showView(lastView);
        } else {
            this.showFirstAllowedView();
        }

        // Click-Effekte aktivieren
        this.setupClickEffects();
    },

    /**
     * Berechtigungen des aktuellen Users laden
     */
    loadUserPermissions: async function() {
        try {
            if (typeof DataManager.getCurrentUserPermissions === 'function') {
                this.userPermissions = await DataManager.getCurrentUserPermissions();
                console.log('User-Berechtigungen geladen:', this.userPermissions);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Berechtigungen:', error);
        }
        // Fallback: Vollzugriff wenn keine Berechtigungen
        if (!this.userPermissions) {
            this.userPermissions = {
                access_dashboard: true, access_projekte: true, access_rechnungen: true,
                access_bewegungen: true, access_lieferanten: true, access_mitglieder: true,
                access_einnahmen: true, access_konfiguration: true, rechnungen_nur_zugewiesene: false
            };
        }
    },

    /**
     * Navigation basierend auf Berechtigungen ein-/ausblenden
     */
    applyNavigationPermissions: function() {
        if (!this.userPermissions) return;

        const viewMap = {
            'dashboard': 'access_dashboard', 'projekte': 'access_projekte',
            'rechnungen': 'access_rechnungen', 'bewegungen': 'access_bewegungen',
            'lieferanten': 'access_lieferanten', 'mitglieder': 'access_mitglieder',
            'einnahmen': 'access_einnahmen', 'konfiguration': 'access_konfiguration'
        };

        document.querySelectorAll('.nav-item[data-view]').forEach(navItem => {
            const viewName = navItem.getAttribute('data-view');
            const permKey = viewMap[viewName];
            if (permKey && this.userPermissions[permKey] === false) {
                navItem.style.display = 'none';
            }
        });
    },

    /**
     * Prüft ob User Zugriff auf View hat
     */
    hasAccessToView: function(viewName) {
        if (!this.userPermissions) return true;
        const viewMap = {
            'dashboard': 'access_dashboard', 'projekte': 'access_projekte',
            'rechnungen': 'access_rechnungen', 'bewegungen': 'access_bewegungen',
            'lieferanten': 'access_lieferanten', 'mitglieder': 'access_mitglieder',
            'einnahmen': 'access_einnahmen', 'konfiguration': 'access_konfiguration'
        };
        const permKey = viewMap[viewName];
        return !permKey || this.userPermissions[permKey] !== false;
    },

    /**
     * Erste erlaubte View anzeigen
     */
    showFirstAllowedView: function() {
        const views = ['dashboard', 'projekte', 'rechnungen', 'bewegungen', 'lieferanten', 'mitglieder', 'einnahmen', 'konfiguration'];
        for (const view of views) {
            if (this.hasAccessToView(view)) {
                this.showView(view);
                return;
            }
        }
    },

    /**
     * Benutzereinstellungen aus localStorage laden
     */
    loadUserSettings: function() {
        // Pagination-Einstellung
        const savedPageSize = localStorage.getItem('rechnungenPerPage');
        if (savedPageSize) {
            this.rechnungenPerPage = parseInt(savedPageSize, 10);
        }

        // Spaltenbreiten laden
        const savedColumnWidths = localStorage.getItem('columnWidths');
        if (savedColumnWidths) {
            this.columnWidths = JSON.parse(savedColumnWidths);
        }

        // Page-Size Dropdown aktualisieren (wenn vorhanden)
        setTimeout(() => {
            const pageSizeSelect = document.getElementById('page-size-select');
            if (pageSizeSelect) {
                pageSizeSelect.value = this.rechnungenPerPage;
            }
        }, 100);
    },

    /**
     * Resizable Spalten initialisieren
     */
    setupResizableColumns: function() {
        const table = document.querySelector('#view-rechnungen table');
        if (!table) return;

        const headers = table.querySelectorAll('thead th');

        headers.forEach((th, index) => {
            // Skip sticky columns (# und Checkbox)
            if (index < 2) return;

            // Resize handle erstellen
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            th.appendChild(resizeHandle);

            // Gespeicherte Breite anwenden
            const columnKey = `col-${index}`;
            if (this.columnWidths[columnKey]) {
                th.style.width = this.columnWidths[columnKey] + 'px';
                th.style.minWidth = this.columnWidths[columnKey] + 'px';
            }

            let startX, startWidth;

            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                startX = e.pageX;
                startWidth = th.offsetWidth;

                document.body.classList.add('resizing-columns');
                resizeHandle.classList.add('resizing');

                const onMouseMove = (e) => {
                    const diff = e.pageX - startX;
                    const newWidth = Math.max(50, startWidth + diff);
                    th.style.width = newWidth + 'px';
                    th.style.minWidth = newWidth + 'px';
                };

                const onMouseUp = () => {
                    document.body.classList.remove('resizing-columns');
                    resizeHandle.classList.remove('resizing');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    // Spaltenbreite speichern
                    this.columnWidths[columnKey] = th.offsetWidth;
                    localStorage.setItem('columnWidths', JSON.stringify(this.columnWidths));
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
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

            // PDF-Dropdowns schließen wenn außerhalb geklickt
            if (!e.target.closest('.pdf-search-container')) {
                document.querySelectorAll('.pdf-dropdown').forEach(d => d.style.display = 'none');
            }
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

                // Workspaces laden wenn Tab geöffnet wird
                if (tabId === 'workspaces') {
                    this.loadWorkspaces();
                }
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
                await this.loadLieferanten();
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
            case 'budgetplanung':
                await this.loadBudgetplanung();
                break;
            case 'mitglieder':
                await this.loadMembers();
                break;
            case 'import':
                await this.loadImportStatistics();
                break;
            case 'konfiguration':
                await this.loadConfiguration();
                break;
        }
    },

    // ==========================================
    // DASHBOARD
    // ==========================================

    loadDashboard: async function() {
        try {
            // Projekte und Rechnungen aus Supabase laden
            const projects = await DataManager.getProjects();
            const rechnungen = await DataManager.getRechnungenMitStatus();

            // Projekt-Summaries berechnen
            const summaries = projects.map(project => {
                // DATEV-Buchungen für dieses Projekt (über datevId/Kostenstelle matchen)
                const projektRechnungen = rechnungen.filter(r =>
                    String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly
                );
                const istTotal = projektRechnungen.reduce((sum, r) => sum + (r.betrag || 0), 0);

                // Budget aus Projekt (falls vorhanden)
                const budget = project.budget || 0;

                return {
                    project: project,
                    budget: budget,
                    ist: istTotal,
                    rechnungenAnzahl: projektRechnungen.length,
                    verfuegbar: budget - istTotal,
                    prozentVerbraucht: budget > 0 ? Math.round((istTotal / budget) * 100) : 0
                };
            });

            // Statistiken berechnen
            const activeProjects = summaries.filter(s => s.project.status === 'laufend').length;
            const totalBudget = summaries.reduce((sum, s) => sum + s.budget, 0);
            const totalSpent = summaries.reduce((sum, s) => sum + s.ist, 0);

            // Stats aktualisieren
            document.getElementById('stat-projects').textContent = activeProjects;
            document.getElementById('stat-budget').textContent = this.formatCurrency(totalBudget);
            document.getElementById('stat-spent').textContent = this.formatCurrency(totalSpent);
            document.getElementById('stat-available').textContent = this.formatCurrency(totalBudget - totalSpent);

            // Projekt-Übersicht laden
            this.renderDashboardProjects(summaries);

        } catch (error) {
            console.error('Fehler beim Laden des Dashboards:', error);
        }
    },

    renderDashboardProjects: function(summaries) {
        const container = document.getElementById('dashboard-projects');
        container.innerHTML = '';

        // Nur Projekte mit Rechnungen oder Budget anzeigen, sortiert nach IST-Kosten
        const activeProjects = summaries
            .filter(s => s.ist > 0 || s.budget > 0)
            .sort((a, b) => b.ist - a.ist);

        if (activeProjects.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 1rem;">Keine Projekte mit Buchungen gefunden</p>';
            return;
        }

        activeProjects.forEach(summary => {
            const statusClass = summary.project.status === 'laufend' ? 'success' :
                               summary.project.status === 'abgeschlossen' ? 'secondary' : 'primary';
            const prozent = Math.min(summary.prozentVerbraucht, 100);
            const barColor = prozent > 90 ? '#e74c3c' : prozent > 70 ? '#f39c12' : '#27ae60';

            const html = `
                <div class="project-row" style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer;"
                     onclick="App.openProjectFullpage('${summary.project.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${summary.project.name}</strong>
                            <span class="badge badge-${statusClass}" style="margin-left: 0.5rem; font-size: 0.7rem;">
                                ${summary.project.status || 'laufend'}
                            </span>
                        </div>
                        <span style="font-size: 0.85rem; color: #666;">${summary.rechnungenAnzahl} Rechnungen</span>
                    </div>
                    <div class="budget-visual">
                        <div style="background: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="background: ${barColor}; height: 100%; width: ${prozent}%; transition: width 0.3s;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 0.25rem; color: #666;">
                            <span>IST: <strong style="color: #333;">${this.formatCurrency(summary.ist)}</strong></span>
                            ${summary.budget > 0 ? `<span>Budget: ${this.formatCurrency(summary.budget)} (${summary.prozentVerbraucht}%)</span>` : ''}
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

    // Pagination State für Projekte
    currentProjectsPage: 1,
    projectsPerPage: 20,
    allProjects: [],

    // Filter-Status für Projekte
    projectsYearFilter: '',
    allProjectsUnfiltered: [],

    loadProjects: async function() {
        // Alle Projekte und Rechnungen laden
        const projects = await DataManager.getProjects();
        const rechnungen = await DataManager.getRechnungenMitStatus();

        // Projekte mit berechneten IST-Kosten anreichern
        this.allProjectsUnfiltered = projects.map(project => {
            const projektRechnungen = rechnungen.filter(r =>
                String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly
            );
            const istTotal = projektRechnungen.reduce((sum, r) => sum + (r.betrag || 0), 0);
            const budget = project.budget || 0;

            return {
                ...project,
                istKosten: istTotal,
                verfuegbar: budget - istTotal
            };
        });

        // Jahr-Filter Dropdown befüllen
        this.populateProjectsYearFilter();

        // Filter anwenden
        this.applyProjectsYearFilter();

        // Pagination-Einstellung aus Select übernehmen
        const perPageSelect = document.getElementById('projects-per-page');
        if (perPageSelect) {
            this.projectsPerPage = parseInt(perPageSelect.value) || 20;
        }

        // Projekte anzeigen
        this.displayProjects();
    },

    populateProjectsYearFilter: function() {
        const select = document.getElementById('projects-year-filter');
        if (!select) return;

        // Verfügbare Jahre aus den Projekten extrahieren (basierend auf created_at oder start_date)
        const years = new Set();
        this.allProjectsUnfiltered.forEach(p => {
            const date = p.created_at || p.start_date;
            if (date) {
                const year = new Date(date).getFullYear();
                if (!isNaN(year)) years.add(year);
            }
        });

        // Sortierte Jahre-Liste (neueste zuerst)
        const sortedYears = Array.from(years).sort((a, b) => b - a);

        // Dropdown befüllen
        select.innerHTML = '<option value="">Alle Jahre</option>';
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (String(year) === this.projectsYearFilter) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    filterProjectsByYear: function() {
        const select = document.getElementById('projects-year-filter');
        this.projectsYearFilter = select ? select.value : '';
        this.currentProjectsPage = 1; // Zurück zur ersten Seite
        this.applyProjectsYearFilter();
        this.displayProjects();
    },

    applyProjectsYearFilter: function() {
        if (!this.projectsYearFilter) {
            this.allProjects = [...this.allProjectsUnfiltered];
        } else {
            const filterYear = parseInt(this.projectsYearFilter);
            this.allProjects = this.allProjectsUnfiltered.filter(p => {
                const date = p.created_at || p.start_date;
                if (!date) return false;
                const projectYear = new Date(date).getFullYear();
                return projectYear === filterYear;
            });
        }
    },

    displayProjects: function() {
        const container = document.getElementById('projects-table-body');
        container.innerHTML = '';

        const totalProjects = this.allProjects.length;
        const totalPages = Math.ceil(totalProjects / this.projectsPerPage);

        // Sicherstellen, dass aktuelle Seite gültig ist
        if (this.currentProjectsPage > totalPages) {
            this.currentProjectsPage = Math.max(1, totalPages);
        }

        // Projekte für aktuelle Seite
        const startIndex = (this.currentProjectsPage - 1) * this.projectsPerPage;
        const endIndex = Math.min(startIndex + this.projectsPerPage, totalProjects);
        const pageProjects = this.allProjects.slice(startIndex, endIndex);

        // Tabelle befüllen
        pageProjects.forEach(project => {
            const statusBadge = this.getStatusBadge(project.status);
            const budget = project.budget || 0;
            const istKosten = project.istKosten || 0;
            const verfuegbar = project.verfuegbar || 0;

            // Farbe für Verfügbar (rot wenn negativ)
            const verfuegbarStyle = verfuegbar < 0 ? 'color: #e74c3c;' : 'color: #27ae60;';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${project.name}</strong></td>
                <td>${project.location || '-'}</td>
                <td>${statusBadge}</td>
                <td>${budget > 0 ? this.formatCurrency(budget) : '-'}</td>
                <td>${istKosten > 0 ? this.formatCurrency(istKosten) : '-'}</td>
                <td style="${verfuegbarStyle}">${budget > 0 ? this.formatCurrency(verfuegbar) : '-'}</td>
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

        // Pagination Info aktualisieren
        const infoEl = document.getElementById('projects-pagination-info');
        if (infoEl) {
            if (totalProjects === 0) {
                infoEl.textContent = 'Keine Projekte vorhanden';
            } else {
                infoEl.textContent = `Zeige ${startIndex + 1}-${endIndex} von ${totalProjects} Projekten`;
            }
        }

        // Pagination Buttons aktualisieren
        this.renderProjectsPagination(totalPages);
    },

    renderProjectsPagination: function(totalPages) {
        const container = document.getElementById('projects-pagination-buttons');
        if (!container) return;

        container.innerHTML = '';

        if (totalPages <= 1) return;

        // Zurück-Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline';
        prevBtn.textContent = '←';
        prevBtn.disabled = this.currentProjectsPage === 1;
        prevBtn.onclick = () => this.goToProjectsPage(this.currentProjectsPage - 1);
        container.appendChild(prevBtn);

        // Seiten-Buttons (max 5 anzeigen)
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentProjectsPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm ${i === this.currentProjectsPage ? 'btn-primary' : 'btn-outline'}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToProjectsPage(i);
            container.appendChild(pageBtn);
        }

        // Vor-Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline';
        nextBtn.textContent = '→';
        nextBtn.disabled = this.currentProjectsPage === totalPages;
        nextBtn.onclick = () => this.goToProjectsPage(this.currentProjectsPage + 1);
        container.appendChild(nextBtn);
    },

    goToProjectsPage: function(page) {
        this.currentProjectsPage = page;
        this.displayProjects();
    },

    changeProjectsPerPage: function() {
        const select = document.getElementById('projects-per-page');
        this.projectsPerPage = parseInt(select.value) || 20;
        this.currentProjectsPage = 1; // Zurück zur ersten Seite
        this.displayProjects();
    },

    loadProjectHoursOverview: async function(projectId) {
        const container = document.getElementById('fp-hours-overview-body');
        if (!container) return;

        container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Lade Stunden...</td></tr>';

        try {
            // Zeiteinträge für dieses Projekt laden
            const timeEntries = await DataManager.getTimeEntriesByProject(projectId);

            // Users laden (für Namen)
            const users = await SupabaseService.getAllUsers();

            if (timeEntries.length === 0) {
                container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Keine Zeiteinträge für dieses Projekt</td></tr>';
                document.getElementById('fp-hours-total').textContent = '0 Std.';
                document.getElementById('fp-hours-cost-total').textContent = this.formatCurrency(0);
                return;
            }

            container.innerHTML = '';

            // Nach Datum sortieren (neueste zuerst)
            timeEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

            let totalHours = 0;
            let totalCost = 0;
            const defaultHourlyRate = 25; // Standard-Stundensatz (aus Konfiguration)

            timeEntries.forEach(entry => {
                // String-Vergleich für UUIDs
                const user = users.find(u => String(u.id) === String(entry.userId));
                const hourlyRate = user?.hourlyRate || defaultHourlyRate;
                const entryCost = (entry.hours || 0) * hourlyRate;

                totalHours += entry.hours || 0;
                totalCost += entryCost;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user ? user.username : 'Unbekannt'}</td>
                    <td>${this.formatDate(entry.date)}</td>
                    <td>${entry.description || '-'}</td>
                    <td style="text-align: right;">${entry.hours || 0} Std.</td>
                    <td style="text-align: right;">${this.formatCurrency(entryCost)}</td>
                `;
                container.appendChild(row);
            });

            // Summen aktualisieren
            document.getElementById('fp-hours-total').textContent = `${totalHours} Std.`;
            document.getElementById('fp-hours-cost-total').textContent = this.formatCurrency(totalCost);

        } catch (error) {
            console.error('Fehler beim Laden der Stunden-Übersicht:', error);
            container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #e74c3c;">Fehler beim Laden</td></tr>';
        }
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

        // Projektleiter anzeigen (falls vorhanden)
        document.getElementById('fp-pl1').textContent = project.pl1 || '-';
        document.getElementById('fp-pl2').textContent = project.pl2 || '-';
        document.getElementById('fp-pl3').textContent = project.pl3 || '-';

        // Budget-Übersicht
        const budget = project.budget || 0;
        document.getElementById('fp-budget-total').textContent = budget > 0 ? this.formatCurrency(budget) : '-';
        document.getElementById('fp-ist-total').textContent = '-'; // Wird in loadProjectDetails aktualisiert
        document.getElementById('fp-prov-total').textContent = '-';
        document.getElementById('fp-available').textContent = '-'; // Wird in loadProjectDetails aktualisiert

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

    // Speicher für Projekt-Rechnungen (für Filter/Suche)
    currentProjectRechnungen: [],
    filterDebounceTimer: null,

    async loadProjectDetails(projectId) {
        try {
            // Projekt holen (für datevId)
            const project = await DataManager.getProjectById(projectId);
            if (!project) return;

            // DATEV-Buchungen für dieses Projekt laden (über datevId)
            const allRechnungen = await DataManager.getRechnungenMitStatus();
            const projektRechnungen = allRechnungen.filter(r =>
                String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly
            );

            // Manuelle/geplante Kosten laden
            const manuelleKosten = await DataManager.getCostsByProject(projectId);
            const geplanteKosten = manuelleKosten.filter(k => k.type === 'provisorisch');
            const geplanteTotal = geplanteKosten.reduce((sum, k) => sum + (k.amount || 0), 0);

            // Rechnungen speichern für Filter (DATEV + manuelle)
            this.currentProjectRechnungen = projektRechnungen;
            this.currentProjectManuelleKosten = manuelleKosten;

            // IST-Summe berechnen
            const istTotal = projektRechnungen.reduce((sum, r) => sum + (r.betrag || 0), 0);
            const budget = project.budget || 0;
            const verfuegbar = budget - istTotal - geplanteTotal;

            // Budget-Übersicht aktualisieren
            document.getElementById('fp-budget-total').textContent = budget > 0 ? this.formatCurrency(budget) : '-';
            document.getElementById('fp-ist-total').textContent = this.formatCurrency(istTotal);
            document.getElementById('fp-prov-total').textContent = geplanteTotal > 0 ? this.formatCurrency(geplanteTotal) : '-';
            document.getElementById('fp-available').textContent = budget > 0 ? this.formatCurrency(verfuegbar) : '-';

            // Arbeitsstunden laden und anzeigen (async)
            const timeEntries = await DataManager.getTimeEntriesByProject(projectId);
            const totalHours = timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0);
            document.getElementById('fp-hours').textContent = `${totalHours} Std.`;

            // Budget-Balken mit IST und Geplant
            if (budget > 0) {
                const istProzent = Math.min(Math.round((istTotal / budget) * 100), 100);
                const geplantProzent = Math.min(Math.round((geplanteTotal / budget) * 100), 100 - istProzent);
                const freiProzent = Math.max(0, 100 - istProzent - geplantProzent);

                document.getElementById('fp-budget-bar').innerHTML = `
                    <div style="background: #e9ecef; border-radius: 4px; height: 100%; overflow: hidden; display: flex;">
                        <div style="background: #e74c3c; height: 100%; width: ${istProzent}%;" title="IST: ${istProzent}%"></div>
                        <div style="background: #f39c12; height: 100%; width: ${geplantProzent}%;" title="Geplant: ${geplantProzent}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #666; margin-top: 0.5rem; gap: 1rem;">
                        <span style="color: #e74c3c; white-space: nowrap;">IST ${istProzent}%</span>
                        <span style="color: #f39c12; white-space: nowrap;">Geplant ${geplantProzent}%</span>
                        <span style="color: #27ae60; white-space: nowrap;">Frei ${freiProzent}%</span>
                    </div>
                `;
            }

            // Kategorie-Zusammenfassung berechnen und anzeigen
            this.renderCategoryBreakdown(projektRechnungen);

            // Kosten-Tabelle befüllen (DATEV + manuelle geplante Kosten)
            this.displayProjectCosts(projektRechnungen, geplanteKosten);

            // Stunden-Übersicht für dieses Projekt laden
            this.loadProjectHoursOverview(projectId);
        } catch (error) {
            console.error('Fehler beim Laden der Projekt-Details:', error);
        }
    },

    /**
     * Zeigt Zusammenfassung nach Kostentyp
     */
    renderCategoryBreakdown(rechnungen) {
        const container = document.getElementById('fp-category-breakdown');
        if (!container) return;

        // Nach Kostentyp gruppieren
        const byKostentyp = {};
        let totalBetrag = 0;

        rechnungen.forEach(r => {
            const kostentyp = r.kostentyp || 'Nicht zugeordnet';
            if (!byKostentyp[kostentyp]) {
                byKostentyp[kostentyp] = { count: 0, total: 0 };
            }
            byKostentyp[kostentyp].count++;
            byKostentyp[kostentyp].total += r.betrag || 0;
            totalBetrag += r.betrag || 0;
        });

        // Sortieren nach Betrag (höchste zuerst)
        const sorted = Object.entries(byKostentyp)
            .sort((a, b) => b[1].total - a[1].total);

        if (sorted.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 0.5rem;">Keine Daten</p>';
            return;
        }

        let html = '<div style="padding: 0.5rem;">';
        sorted.forEach(([kostentyp, data]) => {
            const percent = totalBetrag > 0 ? Math.round((data.total / totalBetrag) * 100) : 0;
            const isUnassigned = kostentyp === 'Nicht zugeordnet';
            const labelColor = isUnassigned ? '#999' : '#333';
            const barColor = isUnassigned ? '#bdc3c7' : '#3498db';

            html += `
                <div style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; color: ${labelColor}; ${isUnassigned ? 'font-style: italic;' : ''}" title="${kostentyp}">${kostentyp}</span>
                        <span style="font-weight: 600;">${this.formatCurrency(data.total)}</span>
                    </div>
                    <div style="background: #e9ecef; border-radius: 4px; height: 6px; overflow: hidden;">
                        <div style="background: ${barColor}; height: 100%; width: ${percent}%;"></div>
                    </div>
                    <div style="font-size: 0.7rem; color: #666;">${data.count} Buchungen · ${percent}%</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    /**
     * Debounced Filter-Funktion für Suche
     */
    filterProjectCostsDebounced() {
        if (this.filterDebounceTimer) {
            clearTimeout(this.filterDebounceTimer);
        }
        this.filterDebounceTimer = setTimeout(() => {
            this.filterProjectCostsWithSearch();
        }, 300);
    },

    /**
     * Filtert Projekt-Kosten mit Suchfunktion
     */
    filterProjectCostsWithSearch() {
        const searchTerm = (document.getElementById('fp-search')?.value || '').toLowerCase().trim();

        let filteredRechnungen = this.currentProjectRechnungen || [];
        let filteredManuelle = (this.currentProjectManuelleKosten || []).filter(k => k.type === 'provisorisch');

        // Suche anwenden
        if (searchTerm) {
            filteredRechnungen = filteredRechnungen.filter(r => {
                const beschreibung = (r.beschreibung || '').toLowerCase();
                const lieferant = (r.fornitoreName || '').toLowerCase();
                const dokumentNr = (r.dokumentNr || '').toLowerCase();
                return beschreibung.includes(searchTerm) ||
                       lieferant.includes(searchTerm) ||
                       dokumentNr.includes(searchTerm);
            });

            filteredManuelle = filteredManuelle.filter(k => {
                const beschreibung = (k.description || '').toLowerCase();
                const lieferant = (k.supplierName || '').toLowerCase();
                const costType = (k.costTypeName || '').toLowerCase();
                return beschreibung.includes(searchTerm) ||
                       lieferant.includes(searchTerm) ||
                       costType.includes(searchTerm);
            });
        }

        this.displayProjectCosts(filteredRechnungen, filteredManuelle);
    },

    // Sortier-State für Projektkosten
    projectCostsSortColumn: 'datum',
    projectCostsSortDirection: 'desc',

    /**
     * Sortiert Projektkosten nach Spalte
     */
    sortProjectCosts(column) {
        // Toggle Richtung wenn gleiche Spalte
        if (this.projectCostsSortColumn === column) {
            this.projectCostsSortDirection = this.projectCostsSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.projectCostsSortColumn = column;
            this.projectCostsSortDirection = 'desc';
        }

        // Sortier-Indikatoren aktualisieren
        ['datum', 'quelle', 'lieferant', 'beschreibung', 'typ', 'betrag'].forEach(col => {
            const indicator = document.getElementById(`fp-sort-${col}`);
            if (indicator) {
                if (col === column) {
                    indicator.textContent = this.projectCostsSortDirection === 'asc' ? '▲' : '▼';
                } else {
                    indicator.textContent = '';
                }
            }
        });

        // Neu rendern mit Suche
        this.filterProjectCostsWithSearch();
    },

    // Projektkosten Pagination State
    projectCostsPage: 1,
    projectCostsPerPage: 20,
    allProjectCosts: [],
    selectedCostIds: new Set(),

    displayProjectCosts(rechnungen, geplanteKosten = []) {
        const tbody = document.getElementById('fp-costs-table');
        if (!tbody) return;

        // Kombiniere DATEV-Buchungen und geplante Kosten in ein einheitliches Format
        this.allProjectCosts = [
            ...rechnungen.map(r => ({
                id: r.id || r.dokumentNr || `datev-${r.belegdatum}-${r.betrag}`,
                datum: r.datum || r.belegdatum,
                quelle: 'DATEV',
                lieferant: r.fornitoreName || '-',
                beschreibung: r.beschreibung || r.dokumentNr || '-',
                kostentyp: r.kostentyp || r.costTypeName || '',
                typ: 'IST',
                betrag: r.betrag || 0,
                pdfExists: r.pdfExists,
                filePath: r.filePath,
                linkedInvoices: r.linkedInvoices || [],
                pdfCount: r.pdfCount || (r.pdfExists ? 1 : 0),
                partitaIva: r.partitaIva,
                dokumentNr: r.dokumentNr,
                isDatev: true,
                rechnungId: r.id,
                workflowStatus: r.workflowStatus || 'neu',
                bezahltAm: r.bezahltAm || null,
                kontrolliertAm: r.kontrolliertAm || null,
                invoiceId: r.invoiceId || null
            })),
            ...geplanteKosten.map(k => ({
                id: k.id,
                datum: k.date || k.created_at,
                quelle: 'Manuell',
                lieferant: k.supplierName || '-',
                beschreibung: k.description || k.costTypeName || '-',
                kostentyp: k.costTypeName || '',
                typ: 'Geplant',
                betrag: k.amount || 0,
                pdfExists: false,
                filePath: null,
                isDatev: false,
                costId: k.id
            }))
        ];

        // Sortieren nach gewählter Spalte
        this.allProjectCosts.sort((a, b) => {
            let valA, valB;

            switch (this.projectCostsSortColumn) {
                case 'datum':
                    valA = a.datum || '';
                    valB = b.datum || '';
                    break;
                case 'quelle':
                    valA = a.quelle || '';
                    valB = b.quelle || '';
                    break;
                case 'lieferant':
                    valA = (a.lieferant || '').toLowerCase();
                    valB = (b.lieferant || '').toLowerCase();
                    break;
                case 'beschreibung':
                    valA = (a.beschreibung || '').toLowerCase();
                    valB = (b.beschreibung || '').toLowerCase();
                    break;
                case 'kostentyp':
                    valA = (a.kostentyp || '').toLowerCase();
                    valB = (b.kostentyp || '').toLowerCase();
                    break;
                case 'typ':
                    valA = a.typ || '';
                    valB = b.typ || '';
                    break;
                case 'bezahlt':
                    // Sortiere nach Status (bezahlt > kontrolliert > neu) und dann nach Datum
                    const statusOrder = { 'bezahlt': 3, 'kontrolliert': 2, 'uploaded': 1, 'neu': 0 };
                    valA = statusOrder[a.workflowStatus] || 0;
                    valB = statusOrder[b.workflowStatus] || 0;
                    if (valA !== valB) {
                        return this.projectCostsSortDirection === 'asc' ? valA - valB : valB - valA;
                    }
                    // Bei gleichem Status nach Bezahlt-Datum sortieren
                    valA = a.bezahltAm ? new Date(a.bezahltAm) : new Date(0);
                    valB = b.bezahltAm ? new Date(b.bezahltAm) : new Date(0);
                    return this.projectCostsSortDirection === 'asc' ? valA - valB : valB - valA;
                case 'betrag':
                    valA = a.betrag || 0;
                    valB = b.betrag || 0;
                    return this.projectCostsSortDirection === 'asc' ? valA - valB : valB - valA;
                default:
                    valA = a.datum || '';
                    valB = b.datum || '';
            }

            const comparison = String(valA).localeCompare(String(valB));
            return this.projectCostsSortDirection === 'asc' ? comparison : -comparison;
        });

        // Massenbearbeitung Dropdown mit Kostentypen befüllen
        this.populateMassKostentypDropdown();

        // Pagination rendern
        this.renderProjectCostsPage();
    },

    renderProjectCostsPage() {
        const tbody = document.getElementById('fp-costs-table');
        if (!tbody) return;

        tbody.innerHTML = '';

        const totalItems = this.allProjectCosts.length;

        if (totalItems === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #666;">Keine Buchungen gefunden</td></tr>';
            this.updateCostsPagination(0, 0, 0);
            return;
        }

        // Pagination berechnen
        const startIndex = (this.projectCostsPage - 1) * this.projectCostsPerPage;
        const endIndex = Math.min(startIndex + this.projectCostsPerPage, totalItems);
        const pageItems = this.allProjectCosts.slice(startIndex, endIndex);

        // Zeilen rendern
        pageItems.forEach((k, idx) => {
            const globalIndex = startIndex + idx + 1; // 1-basierte Zeilennummer
            const row = document.createElement('tr');
            const betragStyle = k.betrag < 0 ? 'color: #e74c3c;' : '';
            const isSelected = this.selectedCostIds.has(k.id);

            // Quelle-Badge Styling
            const quelleBadge = k.isDatev
                ? '<span class="badge" style="background: #e8f5e9; color: #2e7d32;">DATEV</span>'
                : '<span class="badge" style="background: #fff3e0; color: #e65100;">Manuell</span>';

            // Typ-Badge Styling
            const typBadge = k.typ === 'IST'
                ? '<span class="badge badge-danger">IST</span>'
                : '<span class="badge" style="background: #fff8e1; color: #f57f17;">Geplant</span>';

            // Kostentyp Badge
            const kostentypBadge = k.kostentyp
                ? `<span class="badge" style="background: #e3f2fd; color: #1565c0;">${k.kostentyp}</span>`
                : '<span style="color: #999;">-</span>';

            // Bezahlt-Status mit editierbarem Datum
            let bezahltCell = '';
            if (k.isDatev && k.invoiceId) {
                if (k.workflowStatus === 'bezahlt' && k.bezahltAm) {
                    // Bezahlt - Datum anzeigen mit Edit-Möglichkeit
                    bezahltCell = `
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                            <span class="badge" style="background: #e8f5e9; color: #2e7d32;">${Icons.check}</span>
                            <input type="date"
                                   value="${k.bezahltAm}"
                                   style="font-size: 0.75rem; padding: 0.1rem; border: 1px solid #ddd; border-radius: 3px; width: 110px;"
                                   onchange="App.updateBezahltDatum('${k.invoiceId}', this.value)">
                        </div>`;
                } else if (k.workflowStatus === 'kontrolliert') {
                    // Kontrolliert - Button zum Bezahlt-Markieren
                    bezahltCell = `
                        <button class="btn btn-sm" style="background: #fff3e0; color: #e65100; font-size: 0.7rem; padding: 0.15rem 0.4rem;"
                                onclick="App.markAsBezahltFromProject('${k.invoiceId}')" title="Als bezahlt markieren">
                            Offen
                        </button>`;
                } else {
                    // Neu/Uploaded - noch nicht kontrolliert
                    bezahltCell = '<span style="color: #999; font-size: 0.8rem;">-</span>';
                }
            } else {
                // Manuelle Kosten oder ohne Invoice
                bezahltCell = '<span style="color: #999; font-size: 0.8rem;">-</span>';
            }

            // Aktionen - Mehrere PDFs anzeigen wenn vorhanden
            let aktionen = '-';
            if (k.pdfExists) {
                const linkedInvoices = k.linkedInvoices || [];
                if (linkedInvoices.length > 1) {
                    // Mehrere PDFs - alle als Links anzeigen
                    aktionen = linkedInvoices.map((inv, idx) =>
                        `<button class="btn btn-sm btn-outline" style="padding: 0.1rem 0.3rem; margin-right: 0.15rem;" onclick="App.openPdf('${inv.filePath}')">PDF${idx + 1}</button>`
                    ).join('');
                } else if (k.filePath) {
                    // Einzelnes PDF
                    aktionen = `<button class="btn btn-sm btn-outline" onclick="App.openPdf('${k.filePath}')">PDF</button>`;
                }
            } else if (!k.isDatev && k.costId) {
                aktionen = `<button class="btn btn-sm btn-outline" onclick="App.editCost('${k.costId}')"${Icons.edit}</button>`;
            }

            row.innerHTML = `
                <td><input type="checkbox" class="cost-checkbox" data-id="${k.id}" ${isSelected ? 'checked' : ''} onchange="App.toggleCostSelection('${k.id}')"></td>
                <td style="color: #999; font-size: 0.85rem;">${globalIndex}</td>
                <td>${this.formatDate(k.datum)}</td>
                <td>${quelleBadge}</td>
                <td>${k.lieferant}</td>
                <td>${k.beschreibung}</td>
                <td>${kostentypBadge}</td>
                <td>${typBadge}</td>
                <td>${bezahltCell}</td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(k.betrag)}</td>
                <td>${aktionen}</td>
            `;
            tbody.appendChild(row);
        });

        // Summenzeilen nur auf letzter Seite
        const totalPages = Math.ceil(totalItems / this.projectCostsPerPage);
        if (this.projectCostsPage === totalPages) {
            const istKosten = this.allProjectCosts.filter(k => k.typ === 'IST');
            const geplantKosten = this.allProjectCosts.filter(k => k.typ === 'Geplant');
            const istSumme = istKosten.reduce((sum, k) => sum + (k.betrag || 0), 0);
            const geplantSumme = geplantKosten.reduce((sum, k) => sum + (k.betrag || 0), 0);

            // IST-Summe Zeile
            if (istKosten.length > 0) {
                const istRow = document.createElement('tr');
                istRow.style.background = '#fef3f3';
                istRow.innerHTML = `
                    <td colspan="9" style="text-align: right;">IST-Summe (${istKosten.length} Buchungen):</td>
                    <td style="text-align: right; font-weight: 600; color: #e74c3c;">${this.formatCurrency(istSumme)}</td>
                    <td></td>
                `;
                tbody.appendChild(istRow);
            }

            // Geplant-Summe Zeile
            if (geplantKosten.length > 0) {
                const geplantRow = document.createElement('tr');
                geplantRow.style.background = '#fffbf0';
                geplantRow.innerHTML = `
                    <td colspan="9" style="text-align: right;">Geplant-Summe (${geplantKosten.length} Einträge):</td>
                    <td style="text-align: right; font-weight: 600; color: #f57f17;">${this.formatCurrency(geplantSumme)}</td>
                    <td></td>
                `;
                tbody.appendChild(geplantRow);
            }

            // Gesamt-Summe
            if (istKosten.length > 0 && geplantKosten.length > 0) {
                const sumRow = document.createElement('tr');
                sumRow.style.background = '#f8f9fa';
                sumRow.style.fontWeight = '600';
                sumRow.innerHTML = `
                    <td colspan="9" style="text-align: right;">Gesamt (IST + Geplant):</td>
                    <td style="text-align: right;">${this.formatCurrency(istSumme + geplantSumme)}</td>
                    <td></td>
                `;
                tbody.appendChild(sumRow);
            }
        }

        // Pagination Info aktualisieren
        this.updateCostsPagination(startIndex + 1, endIndex, totalItems);

        // Select-All Checkbox aktualisieren
        this.updateSelectAllCheckbox();
    },

    updateCostsPagination(start, end, total) {
        const info = document.getElementById('fp-costs-pagination-info');
        const buttons = document.getElementById('fp-costs-pagination-buttons');

        if (info) {
            info.textContent = total > 0 ? `${start}-${end} von ${total}` : 'Keine Einträge';
        }

        if (!buttons) return;
        buttons.innerHTML = '';

        const totalPages = Math.ceil(total / this.projectCostsPerPage);
        if (totalPages <= 1) return;

        // Zurück-Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline';
        prevBtn.innerHTML = '‹';
        prevBtn.disabled = this.projectCostsPage === 1;
        prevBtn.onclick = () => this.goToCostsPage(this.projectCostsPage - 1);
        buttons.appendChild(prevBtn);

        // Seiten-Buttons (max 5 sichtbar)
        const maxVisible = 5;
        let startPage = Math.max(1, this.projectCostsPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `btn btn-sm ${i === this.projectCostsPage ? 'btn-primary' : 'btn-outline'}`;
            btn.textContent = i;
            btn.onclick = () => this.goToCostsPage(i);
            buttons.appendChild(btn);
        }

        // Vorwärts-Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline';
        nextBtn.innerHTML = '›';
        nextBtn.disabled = this.projectCostsPage === totalPages;
        nextBtn.onclick = () => this.goToCostsPage(this.projectCostsPage + 1);
        buttons.appendChild(nextBtn);
    },

    goToCostsPage(page) {
        const totalPages = Math.ceil(this.allProjectCosts.length / this.projectCostsPerPage);
        this.projectCostsPage = Math.max(1, Math.min(page, totalPages));
        this.renderProjectCostsPage();
    },

    changeCostsPerPage() {
        const select = document.getElementById('fp-costs-per-page');
        if (select) {
            this.projectCostsPerPage = parseInt(select.value) || 20;
            this.projectCostsPage = 1; // Zurück zur ersten Seite
            this.renderProjectCostsPage();
        }
    },

    // Massenbearbeitung Funktionen
    populateMassKostentypDropdown() {
        const select = document.getElementById('fp-mass-kostentyp');
        if (!select) return;

        const costTypes = DataManager.getActiveCostTypes();
        select.innerHTML = '<option value="">Kostentyp zuweisen...</option>';
        costTypes.forEach(ct => {
            select.innerHTML += `<option value="${ct.id || ct.name}">${ct.name}</option>`;
        });
    },

    toggleCostSelection(id) {
        if (this.selectedCostIds.has(id)) {
            this.selectedCostIds.delete(id);
        } else {
            this.selectedCostIds.add(id);
        }
        this.updateMassEditBar();
        this.updateSelectAllCheckbox();
    },

    toggleAllCosts(checkbox) {
        const checkboxes = document.querySelectorAll('.cost-checkbox');
        checkboxes.forEach(cb => {
            const id = cb.dataset.id;
            if (checkbox.checked) {
                this.selectedCostIds.add(id);
                cb.checked = true;
            } else {
                this.selectedCostIds.delete(id);
                cb.checked = false;
            }
        });
        this.updateMassEditBar();
    },

    updateSelectAllCheckbox() {
        const selectAll = document.getElementById('fp-select-all');
        const checkboxes = document.querySelectorAll('.cost-checkbox');
        if (selectAll && checkboxes.length > 0) {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const someChecked = Array.from(checkboxes).some(cb => cb.checked);
            selectAll.checked = allChecked;
            selectAll.indeterminate = someChecked && !allChecked;
        }
    },

    updateMassEditBar() {
        const bar = document.getElementById('fp-mass-edit-bar');
        const count = document.getElementById('fp-selected-count');

        if (bar && count) {
            const selectedCount = this.selectedCostIds.size;
            if (selectedCount > 0) {
                bar.style.display = 'block';
                count.textContent = `${selectedCount} ausgewählt`;
            } else {
                bar.style.display = 'none';
            }
        }
    },

    clearCostSelection() {
        this.selectedCostIds.clear();
        document.querySelectorAll('.cost-checkbox').forEach(cb => cb.checked = false);
        const selectAll = document.getElementById('fp-select-all');
        if (selectAll) selectAll.checked = false;
        this.updateMassEditBar();
    },

    async applyMassKostentyp() {
        const select = document.getElementById('fp-mass-kostentyp');
        const kostentypValue = select ? select.value : '';

        if (!kostentypValue) {
            alert('Bitte wählen Sie einen Kostentyp aus.');
            return;
        }

        if (this.selectedCostIds.size === 0) {
            alert('Keine Einträge ausgewählt.');
            return;
        }

        const costTypes = DataManager.getActiveCostTypes();
        const selectedType = costTypes.find(ct => (ct.id || ct.name) === kostentypValue);
        const kostentypName = selectedType ? selectedType.name : kostentypValue;

        try {
            // Für jeden ausgewählten Eintrag den Kostentyp setzen
            for (const id of this.selectedCostIds) {
                const cost = this.allProjectCosts.find(c => c.id === id);
                if (cost) {
                    if (cost.isDatev && cost.invoiceId) {
                        // DATEV-Buchung mit Supabase-Invoice: Kostentyp in invoices-Tabelle speichern
                        await DataManager.updateInvoiceKostentyp(cost.invoiceId, kostentypName);
                    } else if (cost.isDatev && !cost.invoiceId) {
                        // DATEV-Buchung ohne Invoice: Kostentyp lokal speichern (localStorage fallback)
                        DataManager.setKostentyp(cost.rechnungId || cost.id, kostentypName);
                    } else if (!cost.isDatev && cost.costId) {
                        // Manuelle Kosten: costTypeName aktualisieren
                        await DataManager.updateCost(cost.costId, { costTypeName: kostentypName });
                    }
                    // Lokales Update
                    cost.kostentyp = kostentypName;
                }
            }

            // Auswahl zurücksetzen und neu rendern
            this.clearCostSelection();
            this.renderProjectCostsPage();

            alert(`Kostentyp "${kostentypName}" wurde ${this.selectedCostIds.size} Einträgen zugewiesen.`);
        } catch (error) {
            console.error('Fehler beim Zuweisen des Kostentyps:', error);
            alert('Fehler beim Zuweisen: ' + error.message);
        }
    },

    /**
     * Aktualisiert das Bezahlt-Datum einer Rechnung
     */
    async updateBezahltDatum(invoiceId, datum) {
        try {
            const { error } = await SupabaseService.client
                .from('invoices')
                .update({
                    bezahlt_am: datum || null
                })
                .eq('id', invoiceId);

            if (error) throw error;

            this.showToast('success', 'Gespeichert', 'Bezahlt-Datum aktualisiert');

            // Daten neu laden
            await this.loadProjectData(this.currentProjectId);

        } catch (error) {
            console.error('Fehler beim Aktualisieren:', error);
            this.showToast('error', 'Fehler', error.message);
        }
    },

    /**
     * Markiert eine Rechnung als bezahlt (aus der Projekt-Ansicht)
     */
    async markAsBezahltFromProject(invoiceId) {
        try {
            const heute = new Date().toISOString().split('T')[0];

            const { error } = await SupabaseService.client
                .from('invoices')
                .update({
                    status: 'bezahlt',
                    bezahlt_am: heute
                })
                .eq('id', invoiceId);

            if (error) throw error;

            this.showToast('success', 'Bezahlt', 'Rechnung als bezahlt markiert');

            // Daten neu laden
            await this.loadProjectData(this.currentProjectId);

        } catch (error) {
            console.error('Fehler beim Markieren:', error);
            this.showToast('error', 'Fehler', error.message);
        }
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

    showNewProjectForm: async function() {
        document.getElementById('project-form').reset();
        document.getElementById('project-form-id').value = '';
        document.getElementById('project-modal-title').textContent = 'Neues Projekt';

        // User für PL-Dropdowns laden
        await this.loadUserDropdowns();

        this.showModal('project-form-modal');
    },

    editProject: async function(projectId) {
        const project = await DataManager.getProjectById(projectId);
        if (!project) return;

        // User für PL-Dropdowns laden
        await this.loadUserDropdowns();

        document.getElementById('project-form-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-location').value = project.location;
        document.getElementById('project-datev-id').value = project.datevId || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-start').value = project.startDate;
        document.getElementById('project-end').value = project.endDate;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-budget').value = project.budget || 0;
        document.getElementById('project-pl1').value = project.pl1 || '';
        document.getElementById('project-pl2').value = project.pl2 || '';
        document.getElementById('project-pl3').value = project.pl3 || '';
        document.getElementById('project-dropbox').value = project.dropboxLink || '';

        document.getElementById('project-modal-title').textContent = 'Projekt bearbeiten';
        this.showModal('project-form-modal');
    },

    /**
     * Lädt User aus Supabase in die PL-Dropdowns
     */
    loadUserDropdowns: async function() {
        try {
            const users = await SupabaseService.getAllUsers();

            const pl1Select = document.getElementById('project-pl1');
            const pl2Select = document.getElementById('project-pl2');
            const pl3Select = document.getElementById('project-pl3');

            // Options erstellen
            const optionsHtml = '<option value="">-- Nicht zugewiesen --</option>' +
                users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');

            pl1Select.innerHTML = optionsHtml;
            pl2Select.innerHTML = optionsHtml;
            pl3Select.innerHTML = optionsHtml;

        } catch (error) {
            console.error('Fehler beim Laden der User:', error);
        }
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
            budget: parseFloat(document.getElementById('project-budget').value) || 0,
            pl1: document.getElementById('project-pl1').value || null,
            pl2: document.getElementById('project-pl2').value || null,
            pl3: document.getElementById('project-pl3').value || null,
            dropboxLink: document.getElementById('project-dropbox').value || null
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

    showNewCostForm: async function(preselectedProjectId) {
        document.getElementById('cost-form').reset();
        document.getElementById('cost-form-id').value = '';
        document.getElementById('cost-modal-title').textContent = 'Kosten erfassen';

        // Projekt-Dropdown befüllen (async)
        const projectSelect = document.getElementById('cost-project');
        const projects = await DataManager.getProjects();
        projectSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        projects.forEach(p => {
            const selected = preselectedProjectId && String(p.id) === String(preselectedProjectId) ? 'selected' : '';
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
        const datevLieferanten = await DataManager.getDatevLieferanten();

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

        const projectIdValue = document.getElementById('cost-project').value;
        const costData = {
            projectId: projectIdValue, // UUID oder Zahl - nicht parseInt verwenden
            type: document.getElementById('cost-type').value,
            category: document.getElementById('cost-category').value,
            description: document.getElementById('cost-description').value,
            amount: Math.round(gesamt * 100) / 100, // Effektive Kosten (inkl. MwSt)
            amountNetto: Math.round(netto * 100) / 100,
            amountMwst: Math.round(mwst * 100) / 100,
            mwstType: mwstType,
            date: document.getElementById('cost-date').value,
            invoice: document.getElementById('cost-invoice').value,
            supplierId: supplierId && !supplierId.startsWith('datev_') ? parseInt(supplierId) : null,
            datevLieferant: supplierId && supplierId.startsWith('datev_') ? supplierId.replace('datev_', '') : null
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

    loadTimeTracking: async function() {
        // Alle Zeiteinträge laden (aus Supabase)
        const allEntries = await DataManager.getTimeEntries();
        const projects = await DataManager.getProjects();
        const users = await SupabaseService.getAllUsers();
        const currentUser = await Auth.getCurrentUser();
        const isAdmin = Auth.isAdmin();

        // Admin-Filter Panel anzeigen/verstecken
        const adminFilters = document.getElementById('time-admin-filters');
        const title = document.getElementById('time-entries-title');
        if (adminFilters) {
            adminFilters.style.display = isAdmin ? 'block' : 'none';
        }

        // Filter-Dropdowns für Admin befüllen (nur einmal beim ersten Laden)
        if (isAdmin) {
            this.populateTimeFilterDropdowns(users, projects);
        }

        // Einträge filtern basierend auf Rolle und Filter
        let entries;
        if (isAdmin) {
            // Admin: Alle Einträge, mit Filteroptionen
            entries = [...allEntries];

            // User-Filter anwenden
            const userFilter = document.getElementById('time-filter-user')?.value;
            if (userFilter) {
                entries = entries.filter(e => e.userId === userFilter);
            }

            // Projekt-Filter anwenden
            const projectFilter = document.getElementById('time-filter-project')?.value;
            if (projectFilter) {
                entries = entries.filter(e => String(e.projectId) === projectFilter);
            }

            // Datum von/bis Filter
            const fromDate = document.getElementById('time-filter-from')?.value;
            const toDate = document.getElementById('time-filter-to')?.value;
            if (fromDate) {
                entries = entries.filter(e => e.date >= fromDate);
            }
            if (toDate) {
                entries = entries.filter(e => e.date <= toDate);
            }

            // Titel anpassen
            if (title) {
                title.textContent = userFilter || projectFilter || fromDate || toDate
                    ? 'Gefilterte Zeiteinträge'
                    : 'Alle Zeiteinträge';
            }
        } else {
            // Normaler User: Nur eigene Einträge
            entries = currentUser ? allEntries.filter(e => e.userId === currentUser.id) : [];
            if (title) {
                title.textContent = 'Meine Zeiteinträge';
            }
        }

        // Statistiken berechnen
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Montag
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const weekHours = entries
            .filter(e => new Date(e.date) >= startOfWeek)
            .reduce((sum, e) => sum + (e.hours || 0), 0);

        const monthHours = entries
            .filter(e => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + (e.hours || 0), 0);

        document.getElementById('stat-total-hours').textContent = weekHours;
        document.getElementById('stat-total-hours-month').textContent = monthHours;

        // Einträge sortieren (neueste zuerst)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Liste befüllen
        const container = document.getElementById('time-entries-list');
        container.innerHTML = '';

        if (entries.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Zeiteinträge gefunden</p>';
            return;
        }

        entries.forEach(entry => {
            const project = projects.find(p => String(p.id) === String(entry.projectId));
            const entryUser = users.find(u => String(u.id) === String(entry.userId));
            const showUserName = isAdmin && !document.getElementById('time-filter-user')?.value;

            container.innerHTML += `
                <div class="time-entry">
                    <div class="time-entry-hours">${entry.hours}h</div>
                    <div class="time-entry-info">
                        <div><strong>${project ? project.name : 'Unbekanntes Projekt'}</strong></div>
                        ${showUserName ? `<div style="font-size: 0.85rem; color: #3498db;">${entryUser ? entryUser.username : 'Unbekannt'}</div>` : ''}
                        <div style="font-size: 0.875rem; color: #666;">${entry.description || '-'}</div>
                        <div style="font-size: 0.75rem; color: #999;">${this.formatDate(entry.date)}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline" onclick="App.editTimeEntry('${entry.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteTimeEntry('${entry.id}')">X</button>
                    </div>
                </div>
            `;
        });
    },

    populateTimeFilterDropdowns: function(users, projects) {
        // User-Dropdown
        const userSelect = document.getElementById('time-filter-user');
        if (userSelect && userSelect.options.length <= 1) {
            users.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.username || u.email;
                userSelect.appendChild(option);
            });
        }

        // Projekt-Dropdown
        const projectSelect = document.getElementById('time-filter-project');
        if (projectSelect && projectSelect.options.length <= 1) {
            projects.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                projectSelect.appendChild(option);
            });
        }
    },

    resetTimeFilters: function() {
        const userSelect = document.getElementById('time-filter-user');
        const projectSelect = document.getElementById('time-filter-project');
        const fromDate = document.getElementById('time-filter-from');
        const toDate = document.getElementById('time-filter-to');

        if (userSelect) userSelect.value = '';
        if (projectSelect) projectSelect.value = '';
        if (fromDate) fromDate.value = '';
        if (toDate) toDate.value = '';

        this.loadTimeTracking();
    },

    showNewTimeEntryForm: async function() {
        document.getElementById('time-form').reset();
        document.getElementById('time-form-id').value = '';
        document.getElementById('time-modal-title').textContent = 'Zeit erfassen';

        // Projekt-Dropdown befüllen (async)
        const projectSelect = document.getElementById('time-project');
        const allProjects = await DataManager.getProjects();
        const projects = allProjects.filter(p => p.status !== 'abgeschlossen');
        projectSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        // Heutiges Datum als Standard
        document.getElementById('time-date').value = new Date().toISOString().split('T')[0];

        this.showModal('time-form-modal');
    },

    editTimeEntry: async function(entryId) {
        const allEntries = await DataManager.getTimeEntries();
        const entry = allEntries.find(e => e.id === entryId);
        if (!entry) return;

        // Projekt-Dropdown befüllen (async)
        const projectSelect = document.getElementById('time-project');
        const projects = await DataManager.getProjects();
        projectSelect.innerHTML = '';
        projects.forEach(p => {
            const selected = String(p.id) === String(entry.projectId) ? 'selected' : '';
            projectSelect.innerHTML += `<option value="${p.id}" ${selected}>${p.name}</option>`;
        });

        document.getElementById('time-form-id').value = entry.id;
        document.getElementById('time-date').value = entry.date;
        document.getElementById('time-hours').value = entry.hours;
        document.getElementById('time-description').value = entry.description;

        document.getElementById('time-modal-title').textContent = 'Zeiteintrag bearbeiten';
        this.showModal('time-form-modal');
    },

    saveTimeEntry: async function(event) {
        event.preventDefault();

        const id = document.getElementById('time-form-id').value;
        const entryData = {
            projectId: document.getElementById('time-project').value, // UUID
            date: document.getElementById('time-date').value,
            hours: parseFloat(document.getElementById('time-hours').value) || 0,
            description: document.getElementById('time-description').value
        };

        try {
            if (id) {
                await DataManager.updateTimeEntry(id, entryData);
            } else {
                await DataManager.addTimeEntry(entryData);
            }

            this.hideModal('time-form-modal');
            this.loadTimeTracking();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern des Zeiteintrags');
        }
    },

    deleteTimeEntry: async function(entryId) {
        if (confirm('Zeiteintrag wirklich löschen?')) {
            try {
                await DataManager.deleteTimeEntry(entryId);
                this.loadTimeTracking();
            } catch (error) {
                console.error('Fehler beim Löschen:', error);
                alert('Fehler beim Löschen des Zeiteintrags');
            }
        }
    },

    // ==========================================
    // KONFIGURATION
    // ==========================================

    loadConfiguration: async function() {
        await this.loadCostTypes();
        await this.loadKontenplan();
        this.loadSuppliers();
        await this.loadUsers();
        this.loadExportTab();
    },

    loadCostTypes: async function() {
        const container = document.getElementById('cost-types-list');
        if (!container) {
            console.error('❌ cost-types-list Container nicht gefunden!');
            return;
        }
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Lade Kostentypen...</p>';

        // Warten auf Supabase-Daten
        let costTypes = [];
        try {
            console.log('🔄 Lade Kostentypen...');
            costTypes = await SupabaseDataAdapter.loadCostTypesFromSupabase();
            console.log('✅ Kostentypen geladen:', costTypes);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Kostentypen:', error);
        }

        container.innerHTML = '';

        if (!costTypes || costTypes.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Kostentypen definiert</p>';
            return;
        }

        costTypes.forEach(ct => {
            container.innerHTML += `
                <div class="config-item">
                    <div class="config-item-info">
                        <span class="badge" style="background: #e3f2fd; color: #1565c0; margin-right: 0.5rem;">${ct.code || ct.id}</span>
                        <span>${ct.name}</span>
                        ${!ct.active ? '<span class="badge badge-warning" style="margin-left: 0.5rem;">Inaktiv</span>' : ''}
                    </div>
                    <div class="config-item-actions">
                        <button class="btn btn-sm btn-outline" onclick="App.editCostType('${ct.id}')">Bearbeiten</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteCostType('${ct.id}')">Löschen</button>
                    </div>
                </div>
            `;
        });
    },

    showNewCostTypeForm: function() {
        document.getElementById('costtype-form').reset();
        document.getElementById('costtype-form-id').value = '';
        document.getElementById('costtype-modal-title').textContent = 'Neuer Kostentyp';
        this.showModal('costtype-form-modal');
    },

    editCostType: function(id) {
        const costTypes = SupabaseDataAdapter.costTypesCache || [];
        const ct = costTypes.find(c => String(c.id) === String(id));
        if (!ct) return;

        document.getElementById('costtype-form-id').value = ct.id;
        document.getElementById('costtype-code').value = ct.code || ct.id;
        document.getElementById('costtype-name').value = ct.name;

        document.getElementById('costtype-modal-title').textContent = 'Kostentyp bearbeiten';
        this.showModal('costtype-form-modal');
    },

    saveCostType: async function(event) {
        event.preventDefault();

        const id = document.getElementById('costtype-form-id').value;
        const costTypeData = {
            code: document.getElementById('costtype-code')?.value || '',
            name: document.getElementById('costtype-name').value,
            description: document.getElementById('costtype-name').value
        };

        try {
            if (id) {
                await DataManager.updateCostType(id, costTypeData);
            } else {
                await DataManager.addCostType(costTypeData);
            }

            this.hideModal('costtype-form-modal');
            await this.loadCostTypes();
        } catch (error) {
            alert('Fehler beim Speichern: ' + error.message);
        }
    },

    deleteCostType: async function(id) {
        if (confirm('Kostentyp wirklich löschen?')) {
            try {
                await DataManager.deleteCostType(id);
                await this.loadCostTypes();
            } catch (error) {
                alert('Fehler beim Löschen: ' + error.message);
            }
        }
    },

    // ==========================================
    // KONTENPLAN (Chart of Accounts)
    // ==========================================

    kontenplanCache: [],

    loadKontenplan: async function() {
        const container = document.getElementById('kontenplan-list');
        if (!container) return;

        container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Lade Kontenplan...</td></tr>';

        try {
            const { data, error } = await supabaseClient
                .from('chart_of_accounts')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            this.kontenplanCache = data || [];
            this.renderKontenplan(this.kontenplanCache);

            // Prüfe auf Konten ohne Zuweisung in den DATEV-Buchungen
            await this.pruefeKontenOhneZuweisung();
        } catch (error) {
            console.error('Fehler beim Laden des Kontenplans:', error);
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #e74c3c;">Fehler beim Laden. Bitte Migration ausführen.</td></tr>';
        }
    },

    /**
     * Prüft welche Konten in den DATEV-Buchungen vorkommen, aber keine DB-Zuweisung haben
     */
    pruefeKontenOhneZuweisung: async function() {
        const hinweisContainer = document.getElementById('kontenplan-hinweise');
        if (!hinweisContainer) return;

        try {
            // Alle eindeutigen Kontonummern aus DATEV-Buchungen laden
            const { data: buchungen, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('konto_nr')
                .not('konto_nr', 'is', null);

            if (error) throw error;

            // Eindeutige Konten sammeln
            const verwendeteKonten = new Set();
            buchungen.forEach(b => {
                if (b.konto_nr) verwendeteKonten.add(b.konto_nr);
            });

            // Prüfen welche Konten keine Zuweisung haben
            const zugewiesenePatterns = this.kontenplanCache.map(k => k.konto_pattern.replace('%', ''));
            const ohneZuweisung = [];

            verwendeteKonten.forEach(konto => {
                const hatZuweisung = zugewiesenePatterns.some(pattern => konto.startsWith(pattern));
                if (!hatZuweisung) {
                    ohneZuweisung.push(konto);
                }
            });

            if (ohneZuweisung.length > 0) {
                // Kontenbezeichnungen laden
                const { data: bezeichnungen } = await SupabaseService.client
                    .from('konto_bezeichnungen')
                    .select('konto_nr, beschreibung_de, beschreibung_it')
                    .in('konto_nr', ohneZuweisung.slice(0, 20));

                const bezMap = {};
                (bezeichnungen || []).forEach(b => { bezMap[b.konto_nr] = b; });

                hinweisContainer.innerHTML = `
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <h4 style="margin: 0 0 0.5rem; color: #856404;">${Icons.warning} ${ohneZuweisung.length} Konten ohne DB-Zuweisung</h4>
                        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #856404;">
                            Diese Konten werden in DATEV-Buchungen verwendet, haben aber keine Zuordnung zu einer DB-Stufe:
                        </p>
                        <div style="max-height: 200px; overflow-y: auto;">
                            <table style="width: 100%; font-size: 0.85rem;">
                                <thead>
                                    <tr style="background: rgba(0,0,0,0.05);">
                                        <th style="padding: 0.3rem; text-align: left;">Konto</th>
                                        <th style="padding: 0.3rem; text-align: left;">Bezeichnung (DE)</th>
                                        <th style="padding: 0.3rem; text-align: left;">Bezeichnung (IT)</th>
                                        <th style="padding: 0.3rem;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ohneZuweisung.slice(0, 20).map(konto => {
                                        const bez = bezMap[konto] || {};
                                        return `
                                            <tr>
                                                <td style="padding: 0.3rem;"><code>${konto}</code></td>
                                                <td style="padding: 0.3rem;">${bez.beschreibung_de || '-'}</td>
                                                <td style="padding: 0.3rem; color: #666; font-style: italic;">${bez.beschreibung_it || '-'}</td>
                                                <td style="padding: 0.3rem;">
                                                    <button class="btn btn-sm btn-primary" onclick="App.schnellZuweisung('${konto}', '${(bez.beschreibung_de || '').replace(/'/g, "\\'")}')" style="padding: 0.15rem 0.4rem; font-size: 0.75rem;">
                                                        + Hinzufügen
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${ohneZuweisung.length > 20 ? `<tr><td colspan="4" style="padding: 0.3rem; color: #666;">... und ${ohneZuweisung.length - 20} weitere</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                hinweisContainer.innerHTML = '';
            }
        } catch (error) {
            console.error('Fehler beim Prüfen der Konten:', error);
        }
    },

    /**
     * Schnell-Zuweisung: Öffnet Modal mit vorausgefüllten Daten
     */
    schnellZuweisung: function(kontoNr, beschreibung) {
        document.getElementById('account-form').reset();
        document.getElementById('account-form-id').value = '';
        document.getElementById('account-modal-title').textContent = 'Konto hinzufügen';
        document.getElementById('account-pattern').value = kontoNr + '%';
        document.getElementById('account-name').value = beschreibung || '';
        document.getElementById('account-db-zuordnung').value = 'NEUTRAL';
        this.showModal('account-form-modal');
    },

    renderKontenplan: function(accounts) {
        const container = document.getElementById('kontenplan-list');
        if (!container) return;

        if (!accounts || accounts.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Keine Konten definiert</td></tr>';
            return;
        }

        const dbLabels = {
            'UMSATZ': '<span class="badge" style="background: #27ae60; color: white;">Umsatz</span>',
            'DB1_KOSTEN': '<span class="badge" style="background: #3498db; color: white;">DB1</span>',
            'DB2_KOSTEN': '<span class="badge" style="background: #f39c12; color: white;">DB2</span>',
            'DB3_KOSTEN': '<span class="badge" style="background: #e74c3c; color: white;">DB3</span>',
            'NEUTRAL': '<span class="badge" style="background: #95a5a6; color: white;">Neutral</span>'
        };

        container.innerHTML = accounts.map(acc => `
            <tr>
                <td><code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${acc.konto_pattern}</code></td>
                <td>${acc.konto_name || '-'}</td>
                <td>${acc.kategorie || '-'}</td>
                <td>${dbLabels[acc.db_zuordnung] || acc.db_zuordnung}</td>
                <td>${acc.ist_projektbezogen ? Icons.check : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editAccount('${acc.id}')" title="Bearbeiten">${Icons.edit}</button>
                    <button class="btn btn-sm btn-danger" onclick="App.deleteAccount('${acc.id}')" title="Löschen">×</button>
                </td>
            </tr>
        `).join('');
    },

    filterKontenplan: function() {
        const searchTerm = (document.getElementById('kontenplan-search')?.value || '').toLowerCase();
        const dbFilter = document.getElementById('kontenplan-filter-db')?.value || '';

        let filtered = this.kontenplanCache;

        if (searchTerm) {
            filtered = filtered.filter(acc =>
                (acc.konto_pattern || '').toLowerCase().includes(searchTerm) ||
                (acc.konto_name || '').toLowerCase().includes(searchTerm) ||
                (acc.kategorie || '').toLowerCase().includes(searchTerm)
            );
        }

        if (dbFilter) {
            filtered = filtered.filter(acc => acc.db_zuordnung === dbFilter);
        }

        this.renderKontenplan(filtered);
    },

    showNewAccountModal: function() {
        document.getElementById('account-form').reset();
        document.getElementById('account-form-id').value = '';
        document.getElementById('account-modal-title').textContent = 'Neues Konto';
        this.showModal('account-form-modal');
    },

    editAccount: function(id) {
        const account = this.kontenplanCache.find(a => a.id === id);
        if (!account) return;

        document.getElementById('account-form-id').value = account.id;
        document.getElementById('account-pattern').value = account.konto_pattern || '';
        document.getElementById('account-name').value = account.konto_name || '';
        document.getElementById('account-kategorie').value = account.kategorie || '';
        document.getElementById('account-db-zuordnung').value = account.db_zuordnung || 'NEUTRAL';
        document.getElementById('account-projektbezogen').checked = account.ist_projektbezogen || false;
        document.getElementById('account-beschreibung').value = account.beschreibung || '';

        document.getElementById('account-modal-title').textContent = 'Konto bearbeiten';
        this.showModal('account-form-modal');
    },

    saveAccount: async function(event) {
        event.preventDefault();

        const id = document.getElementById('account-form-id').value;
        const accountData = {
            konto_pattern: document.getElementById('account-pattern').value.trim(),
            konto_name: document.getElementById('account-name').value.trim() || null,
            kategorie: document.getElementById('account-kategorie').value.trim() || null,
            db_zuordnung: document.getElementById('account-db-zuordnung').value,
            ist_projektbezogen: document.getElementById('account-projektbezogen').checked,
            beschreibung: document.getElementById('account-beschreibung').value.trim() || null
        };

        try {
            if (id) {
                // Update
                const { error } = await supabaseClient
                    .from('chart_of_accounts')
                    .update(accountData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabaseClient
                    .from('chart_of_accounts')
                    .insert([accountData]);
                if (error) throw error;
            }

            this.hideModal('account-form-modal');
            await this.loadKontenplan();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
        }
    },

    deleteAccount: async function(id) {
        if (!confirm('Konto wirklich löschen?')) return;

        try {
            const { error } = await supabaseClient
                .from('chart_of_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await this.loadKontenplan();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            alert('Fehler beim Löschen: ' + (error.message || 'Unbekannter Fehler'));
        }
    },

    loadSuppliers: function() {
        // Lieferanten werden jetzt über Supabase verwaltet, Tab wurde entfernt
        const container = document.getElementById('suppliers-list');
        if (!container) return; // Tab existiert nicht mehr

        const suppliers = DataManager.getSuppliers();
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

    loadUsers: async function() {
        const container = document.getElementById('users-list');
        if (!container) {
            console.error('❌ users-list Container nicht gefunden!');
            return;
        }
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Lade Mitarbeiter...</p>';

        // Warten auf Supabase-Daten
        let users = [];
        try {
            console.log('🔄 Lade Mitarbeiter...');
            users = await SupabaseDataAdapter.loadUsersFromSupabase();
            console.log('✅ Mitarbeiter geladen:', users);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Mitarbeiter:', error);
        }

        container.innerHTML = '';

        if (!users || users.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Mitarbeiter definiert</p>';
            return;
        }

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
                        <button class="btn btn-sm btn-outline" onclick="App.editHourlyRate('${u.id}')">Bearbeiten</button>
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

    saveHourlyRate: async function(event) {
        event.preventDefault();

        const userId = document.getElementById('hourlyrate-user-id').value; // UUID als String
        const hourlyRate = parseFloat(document.getElementById('hourlyrate-value').value) || 0;

        try {
            await DataManager.updateUser(userId, { hourlyRate: hourlyRate });
            this.hideModal('hourlyrate-form-modal');
            await this.loadUsers();
        } catch (error) {
            alert('Fehler beim Speichern: ' + error.message);
        }
    },

    // ==========================================
    // EXCEL EXPORT
    // ==========================================

    loadExportTab: async function() {
        const projects = await DataManager.getProjects();
        const select = document.getElementById('export-project-select');
        if (!select) return;
        select.innerHTML = '<option value="">-- Projekt wählen --</option>';
        if (projects && Array.isArray(projects)) {
            projects.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            });
        }
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

    exportCurrentProjectToExcel: async function() {
        if (!this.currentProjectId) return;

        try {
            const project = await DataManager.getProjectById(this.currentProjectId);
            if (!project) {
                alert('Projekt nicht gefunden');
                return;
            }

            // DATEV-Buchungen für Export laden
            const allRechnungen = await DataManager.getRechnungenMitStatus();
            const projektRechnungen = allRechnungen.filter(r =>
                String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly
            );

            // CSV erstellen
            let csv = '\ufeff'; // BOM für Excel UTF-8
            csv += `Projekt-Export: ${project.name}\n`;
            csv += `Exportiert am: ${new Date().toLocaleDateString('de-DE')}\n`;
            csv += `Budget: ${project.budget || 0} EUR\n\n`;

            // DATEV-Buchungen
            csv += 'DATEV-BUCHUNGEN\n';
            csv += 'Datum;Lieferant;Beschreibung;Dokumentnr;Netto;MwSt;Brutto\n';

            let sumNetto = 0, sumMwst = 0, sumBrutto = 0;
            projektRechnungen.forEach(r => {
                const netto = r.betrag || 0;
                const mwst = r.mwstBetrag || 0;
                const brutto = netto + mwst;
                sumNetto += netto;
                sumMwst += mwst;
                sumBrutto += brutto;

                csv += `${r.datum || ''};`;
                csv += `"${(r.fornitoreName || '').replace(/"/g, '""')}";`;
                csv += `"${(r.beschreibung || '').replace(/"/g, '""')}";`;
                csv += `${r.dokumentNr || ''};`;
                csv += `${netto.toFixed(2).replace('.', ',')};`;
                csv += `${mwst.toFixed(2).replace('.', ',')};`;
                csv += `${brutto.toFixed(2).replace('.', ',')}\n`;
            });

            csv += `;;SUMME;;${sumNetto.toFixed(2).replace('.', ',')};${sumMwst.toFixed(2).replace('.', ',')};${sumBrutto.toFixed(2).replace('.', ',')}\n`;

            const filename = `${project.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`;
            this.downloadCSV(csv, filename);

        } catch (error) {
            console.error('Export-Fehler:', error);
            alert('Fehler beim Export: ' + error.message);
        }
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

    // Aktive Abgabestellen (für Dropdown in Rechnungen-Tabelle)
    activeAbgabestellen: [],

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

        // Aktive Abgabestellen laden (für Dropdown)
        try {
            this.activeAbgabestellen = await DataManager.getActiveAbgabestellen();
        } catch (error) {
            console.error('Fehler beim Laden der Abgabestellen:', error);
            this.activeAbgabestellen = [];
        }

        // Filter-Dropdowns befüllen
        await this.populateRechnungenFilters();

        // Rechnungen anzeigen
        await this.filterRechnungen();

        // Resizable Spalten initialisieren (nur einmal)
        if (!this._resizableColumnsInitialized) {
            this.setupResizableColumns();
            this._resizableColumnsInitialized = true;
        }
    },

    populateRechnungenFilters: async function() {
        // Jahr-Filter befüllen (aktuelles Jahr + Vorjahre)
        const jahrSelect = document.getElementById('rechnung-filter-jahr');
        if (jahrSelect) {
            const currentYear = new Date().getFullYear();
            jahrSelect.innerHTML = `<option value="">Alle Jahre</option>`;
            // Jahre von aktuell bis 2020
            for (let year = currentYear; year >= 2020; year--) {
                const selected = year === currentYear ? 'selected' : '';
                jahrSelect.innerHTML += `<option value="${year}" ${selected}>${year}</option>`;
            }
        }

        // Projekt-Filter
        const projektSelect = document.getElementById('rechnung-filter-projekt');
        projektSelect.innerHTML = '<option value="">Alle Projekte</option>';
        const projekte = DataManager.getAllKunstMeranProjekte();
        projekte.forEach(p => {
            projektSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });

        // Lieferanten-Filter (async wegen Supabase)
        const lieferantSelect = document.getElementById('rechnung-filter-lieferant');
        lieferantSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        const lieferanten = await DataManager.getDatevLieferanten();
        if (Array.isArray(lieferanten)) {
            lieferanten.forEach(l => {
                if (l.name) {
                    lieferantSelect.innerHTML += `<option value="${l.partitaIva}">${l.name}</option>`;
                }
            });
        }
    },

    // Ausgewählte Rechnungen (für Massenaktionen)
    selectedRechnungen: new Set(),

    filterRechnungen: async function() {
        const volltextSuche = document.getElementById('bewegungen-volltext-suche')?.value?.toLowerCase().trim() || '';
        const jahrFilter = document.getElementById('rechnung-filter-jahr')?.value || '';
        const statusFilter = document.getElementById('rechnung-filter-status').value;
        const projektFilter = document.getElementById('rechnung-filter-projekt').value;
        const lieferantFilter = document.getElementById('rechnung-filter-lieferant').value;
        const kostentypFilter = document.getElementById('rechnung-filter-kostentyp')?.value || '';
        const abgabestelleFilter = document.getElementById('rechnung-filter-abgabestelle').value;
        const dokumentNrFilter = document.getElementById('rechnung-filter-dokumentnr')?.value?.toLowerCase().trim() || '';
        const pdfStatusFilter = document.getElementById('rechnung-filter-pdf-status')?.value || '';
        const datevStatusFilter = document.getElementById('rechnung-filter-datev-status')?.value || '';
        const datumVon = document.getElementById('rechnung-filter-datum-von')?.value || '';
        const datumBis = document.getElementById('rechnung-filter-datum-bis')?.value || '';
        const geaendertAb = document.getElementById('rechnung-filter-geaendert-ab')?.value || '';

        let rechnungen = await DataManager.getRechnungenMitStatus();

        // Jahresfilter anwenden
        if (jahrFilter) {
            rechnungen = rechnungen.filter(r => {
                // Datum aus verschiedenen Quellen: datum, belegdatum, uploadedAt
                const datum = r.datum || r.belegdatum || r.uploadedAt;
                if (!datum) return false;
                const year = new Date(datum).getFullYear();
                return year === parseInt(jahrFilter);
            });
        }

        // Volltextsuche anwenden (durchsucht alle relevanten Felder)
        if (volltextSuche) {
            rechnungen = rechnungen.filter(r => {
                const searchFields = [
                    r.dokumentNr,
                    r.fornitoreName,
                    r.partitaIva,
                    r.betrag?.toString(),
                    r.betragNetto?.toString(),
                    r.notizen,
                    r.buchungstext,
                    r.kostentyp,
                    r.abgabestelle,
                    r.kontoNr,
                    r.gegenkontoNr,
                    this.formatDate(r.datum || r.belegdatum)
                ];
                const searchString = searchFields.filter(Boolean).join(' ').toLowerCase();
                return searchString.includes(volltextSuche);
            });
        }

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
        if (dokumentNrFilter) {
            rechnungen = rechnungen.filter(r =>
                r.dokumentNr?.toLowerCase().includes(dokumentNrFilter)
            );
        }
        if (kostentypFilter) {
            rechnungen = rechnungen.filter(r => r.kostentyp === kostentypFilter);
        }
        if (abgabestelleFilter) {
            rechnungen = rechnungen.filter(r => r.abgabestelle === abgabestelleFilter);
        }
        if (pdfStatusFilter === 'zugewiesen') {
            // DATEV-Buchungen mit PDF
            rechnungen = rechnungen.filter(r => r.pdfExists && !r.isSupabaseOnly);
        } else if (pdfStatusFilter === 'nicht-zugewiesen') {
            // DATEV-Buchungen ohne PDF ODER Supabase-only PDFs ohne DATEV
            rechnungen = rechnungen.filter(r => !r.pdfExists || r.isSupabaseOnly);
        }
        if (datevStatusFilter === 'zugewiesen') {
            // PDFs die einer DATEV-Bewegung zugewiesen sind (haben projektId UND pdfExists)
            rechnungen = rechnungen.filter(r => r.projektId && r.pdfExists && !r.isSupabaseOnly);
        } else if (datevStatusFilter === 'nicht-zugewiesen') {
            // Nur PDFs ohne DATEV-Zuordnung (Supabase-only)
            rechnungen = rechnungen.filter(r => r.isSupabaseOnly);
        }
        // Zeitraum-Filter
        if (datumVon || datumBis) {
            rechnungen = rechnungen.filter(r => {
                const datum = r.datum || r.belegdatum || r.uploadedAt;
                if (!datum) return false;
                const rechnungDatum = new Date(datum);
                if (datumVon && rechnungDatum < new Date(datumVon)) return false;
                if (datumBis && rechnungDatum > new Date(datumBis + 'T23:59:59')) return false;
                return true;
            });
        }
        // Änderungsdatum-Filter
        if (geaendertAb) {
            const filterDate = new Date(geaendertAb);
            rechnungen = rechnungen.filter(r => {
                if (!r.updatedAt) return false;
                return new Date(r.updatedAt) >= filterDate;
            });
        }

        // Sortieren nach Datum (neueste zuerst)
        rechnungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));

        // Filtered results speichern
        this.filteredRechnungen = rechnungen;

        // Statistiken basierend auf gefilterten Daten aktualisieren
        this.updateRechnungenStatistiken(rechnungen);

        // Seite nur zurücksetzen wenn Filter von User geändert wurden (nicht bei Reload nach Aktion)
        if (!this._keepCurrentPage) {
            this.currentRechnungenPage = 1;
        }
        this._keepCurrentPage = false;

        // Seite rendern
        this.renderRechnungenPage();
    },

    /**
     * Aktualisiert die Statistik-Kacheln basierend auf den gefilterten Rechnungen
     */
    updateRechnungenStatistiken: function(rechnungen) {
        const neuCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.NEU).length;
        const kontrolliertCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.KONTROLLIERT).length;
        const bezahltCount = rechnungen.filter(r => r.workflowStatus === RECHNUNG_STATUS.BEZAHLT).length;

        document.getElementById('stat-rechnungen-total').textContent = rechnungen.length;
        document.getElementById('stat-rechnungen-neu').textContent = neuCount;
        document.getElementById('stat-rechnungen-kontrolliert').textContent = kontrolliertCount;
        document.getElementById('stat-rechnungen-bezahlt').textContent = bezahltCount;

        // Summen berechnen
        let summeNetto = 0;
        let summeMwst = 0;
        let summeOffen = 0;
        let summeBezahlt = 0;

        rechnungen.forEach(r => {
            const netto = r.betragNetto !== undefined ? r.betragNetto : (r.betrag || 0);
            const mwst = r.betragMwst !== undefined ? r.betragMwst : 0;
            const gesamt = r.betragGesamt !== undefined ? r.betragGesamt : (netto + mwst);

            summeNetto += netto;
            summeMwst += mwst;

            if (r.workflowStatus === RECHNUNG_STATUS.BEZAHLT) {
                summeBezahlt += gesamt;
            } else {
                summeOffen += gesamt;
            }
        });

        document.getElementById('stat-summe-netto').textContent = this.formatCurrency(summeNetto);
        document.getElementById('stat-summe-mwst').textContent = this.formatCurrency(summeMwst);
        document.getElementById('stat-summe-offen').textContent = this.formatCurrency(summeOffen);
        document.getElementById('stat-summe-bezahlt').textContent = this.formatCurrency(summeBezahlt);
    },

    // Reload ohne Seite/Filter zurückzusetzen
    reloadRechnungenKeepState: async function() {
        this._keepCurrentPage = true;
        // Cache invalidieren damit frische Daten geladen werden
        if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
            SupabaseDataAdapter.invalidateCache();
        }
        await this.filterRechnungen();
    },

    // Volltextsuche leeren
    clearBewegungssuche: function() {
        const searchField = document.getElementById('bewegungen-volltext-suche');
        if (searchField) {
            searchField.value = '';
            this.filterRechnungen();
        }
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
            tbody.innerHTML = '<tr><td colspan="16" style="text-align: center; color: #666; padding: 2rem;">Keine Rechnungen gefunden. Bitte Import-Skript ausführen.</td></tr>';
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
            // MwSt-Satz (aus DB oder Default 22%)
            const mwstRate = r.mwstRate !== undefined ? r.mwstRate : 22;
            // Berechnung basierend auf MwSt-Satz
            const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
            const mwst = netto * (mwstRate / 100);
            const gesamt = netto + mwst;

            // Gutschrift-Erkennung: NICHT basierend auf negativem Betrag!
            // Erlöskonten (600-699, 840) haben oft negative Beträge = Habenbuchung, aber KEINE Gutschrift
            // Gutschrift nur wenn: dokumentTyp = 'NC' oder explizit istGutschrift gesetzt
            const kontoNr = r.konto || '';
            const isErloskonto = kontoNr.startsWith('6') && kontoNr.length >= 3 && parseInt(kontoNr.substring(0, 2)) < 68;
            const isFinanzErtrag = kontoNr.startsWith('84'); // Finanzerträge
            const istGutschrift = r.dokumentTyp === 'NC' || (r.istGutschrift && !isErloskonto && !isFinanzErtrag);
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

            // Für Supabase-only PDFs ohne DATEV-Match: Verknüpfungs-Input generieren
            let projektCell = '';
            if (r.isSupabaseOnly) {
                // Nur Supabase-PDF ohne DATEV-Match: Input für DATEV-Verknüpfung
                const datalistId = `datev-options-${r.invoiceId}`;
                projektCell = `
                    <input type="text"
                           list="${datalistId}"
                           class="form-control"
                           style="font-size: 0.75rem; padding: 0.25rem; min-width: 400px;"
                           placeholder="DATEV-Bewegung suchen..."
                           onchange="App.linkInvoiceToDatevFromInput('${r.invoiceId}', this.value)">
                    <datalist id="${datalistId}">
                        ${this.getUnlinkedDatevOptionsAsDatalist()}
                    </datalist>`;
            } else if (r.projektId && projekt) {
                // Hat Projekt: Zeige Projektname (mit Trennen-Button wenn Invoice)
                if (r.invoiceId) {
                    projektCell = `
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                            <span>${projekt.name}</span>
                            <button class="btn btn-sm"
                                    style="padding: 0.1rem 0.3rem; font-size: 0.7rem; background: #ff5722; color: white;"
                                    onclick="App.unlinkInvoiceFromDatev('${r.invoiceId}')"
                                    title="Verknüpfung trennen">
                                ${Icons.close}
                            </button>
                        </div>`;
                } else {
                    projektCell = projekt.name;
                }
            } else {
                // DATEV-Buchung ohne Projekt: Dropdown zur Projekt-Auswahl
                const selectId = `projekt-select-${r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
                projektCell = `
                    <select class="form-control"
                            id="${selectId}"
                            style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                            onchange="App.setProjektForRechnung('${r.rechnungId}', this.value)">
                        <option value="">-- Projekt wählen --</option>
                        <option value="strukturkosten">Strukturkosten</option>
                        <option value="2601">Complice</option>
                        <option value="2602">Animacies</option>
                        <option value="2603">Stadtraum Meran</option>
                        <option value="2604">Wanderausstellung</option>
                        <option value="2605">Konzertreihe</option>
                        <option value="2606">Menschenbilder</option>
                        <option value="2607">Rahmenprogramm</option>
                    </select>`;
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
                <td>${this.getLieferantCell(r)}</td>
                <td>${this.getDokumentNrCell(r)}${typBadge}${geteiltBadge}</td>
                <td>${projektCell}</td>
                <td>${kostentypLabel}</td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(netto)}</td>
                <td style="text-align: right; ${betragStyle}">
                    <div style="display: flex; align-items: center; gap: 0.25rem; justify-content: flex-end;">
                        <select class="form-control mwst-select"
                                style="font-size: 0.7rem; padding: 0.15rem; width: 55px; text-align: right;"
                                onchange="App.updateMwstRate('${r.id}', this.value)"
                                ${!r.id ? 'disabled title="Nur für DATEV-Buchungen"' : ''}>
                            <option value="0" ${mwstRate === 0 ? 'selected' : ''}>0%</option>
                            <option value="4" ${mwstRate === 4 ? 'selected' : ''}>4%</option>
                            <option value="10" ${mwstRate === 10 ? 'selected' : ''}>10%</option>
                            <option value="22" ${mwstRate === 22 ? 'selected' : ''}>22%</option>
                        </select>
                        <span style="min-width: 60px; text-align: right;">${this.formatCurrency(mwst)}</span>
                    </div>
                </td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(gesamt)}</td>
                <td><span class="status-badge ${r.workflowStatus}">${r.workflowStatus}</span></td>
                <td>${r.pdfExists ?
                    (() => {
                        const uploadId = r.id ? `id:${r.id}` : r.rechnungId;
                        const uniqueId = r.id || r.rechnungId || `${r.partitaIva}-${rowNumber}`;
                        const safeId = String(uniqueId).replace(/[^a-zA-Z0-9-]/g, '');
                        const addPdfInputId = `add-pdf-${safeId}`;
                        const dropZoneId = `dropzone-existing-${safeId}`;
                        const pdfCount = r.pdfCount || 1;
                        const linkedInvoices = r.linkedInvoices || [];

                        // Wenn mehrere PDFs existieren, alle anzeigen
                        let pdfLinks = '';
                        if (linkedInvoices.length > 1) {
                            pdfLinks = linkedInvoices.map((inv, idx) =>
                                `<a class="pdf-link" onclick="App.showPdfPreview('${r.partitaIva}', '${r.dokumentNr}', '${inv.filePath || ''}')" style="margin-right: 0.25rem;">PDF${idx + 1}</a>`
                            ).join('');
                        } else {
                            pdfLinks = `<a class="pdf-link" onclick="App.showPdfPreview('${r.partitaIva}', '${r.dokumentNr}', '${r.filePath || ''}')">PDF</a>`;
                        }

                        return `<div class="pdf-drop-zone" id="${dropZoneId}"
                                    style="display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; padding: 0.25rem; border: 2px dashed transparent; border-radius: 4px; transition: all 0.2s;"
                                    ondragover="App.handlePdfDragOver(event, '${dropZoneId}')"
                                    ondragleave="App.handlePdfDragLeave(event, '${dropZoneId}')"
                                    ondrop="App.handlePdfDrop(event, '${r.partitaIva || ''}', '${r.dokumentNr || ''}', '${uploadId}')">
                            ${pdfLinks}
                            <input type="file" id="${addPdfInputId}" accept=".pdf" style="display: none;" multiple
                                   onchange="App.uploadPdfForBuchung('${r.partitaIva || ''}', '${r.dokumentNr || ''}', this, '${uploadId}')">
                            <button class="btn btn-sm"
                                style="padding: 0.1rem 0.3rem; font-size: 0.7rem; background: #2196F3; color: white;"
                                onclick="document.getElementById('${addPdfInputId}').click()"
                                title="Weiteres PDF hinzufügen (oder hierhin ziehen)">+</button>
                            ${r.invoiceId ? `<button class="btn btn-sm"
                                style="padding: 0.1rem 0.3rem; font-size: 0.7rem; background: #ff5722; color: white;"
                                onclick="App.unlinkPdfFromDatev('${r.invoiceId}')"
                                title="PDF-Verknüpfung trennen">${Icons.close}</button>` : ''}
                        </div>`;
                    })() :
                    (() => {
                        // Eindeutige ID für Upload-Felder (auch ohne dokumentNr)
                        const uniqueId = r.id || r.rechnungId || `${r.partitaIva}-${rowNumber}`;
                        const safeId = String(uniqueId).replace(/[^a-zA-Z0-9-]/g, '');
                        const pdfDropdownId = `pdf-dropdown-${safeId}`;
                        const uploadInputId = `upload-${safeId}`;
                        const dropZoneId = `dropzone-${safeId}`;
                        // Für Upload: DB-ID verwenden wenn vorhanden (zuverlässiger als partitaIva_dokumentNr)
                        const uploadId = r.id ? `id:${r.id}` : r.rechnungId;
                        return `<div class="pdf-drop-zone" id="${dropZoneId}"
                                    data-partita-iva="${r.partitaIva || ''}"
                                    data-dokument-nr="${r.dokumentNr || ''}"
                                    data-rechnung-id="${uploadId}"
                                    style="display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem; border: 2px dashed transparent; border-radius: 4px; transition: all 0.2s;"
                                    ondragover="App.handlePdfDragOver(event, '${dropZoneId}')"
                                    ondragleave="App.handlePdfDragLeave(event, '${dropZoneId}')"
                                    ondrop="App.handlePdfDrop(event, '${r.partitaIva || ''}', '${r.dokumentNr || ''}', '${uploadId}')">
                                    <div class="pdf-search-container" style="position: relative; min-width: 200px;">
                                        <input type="text"
                                               id="input-${pdfDropdownId}"
                                               class="form-control pdf-search-input"
                                               style="font-size: 0.75rem; padding: 0.25rem;"
                                               placeholder="PDF suchen oder hierhin ziehen..."
                                               onfocus="App.showPdfDropdown('${pdfDropdownId}')"
                                               oninput="App.filterPdfDropdown('${pdfDropdownId}', this.value)">
                                        <div id="${pdfDropdownId}" class="pdf-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                            ${this.getPdfDropdownItems(r.partitaIva, r.dokumentNr)}
                                        </div>
                                    </div>
                                    <input type="file" id="${uploadInputId}" accept=".pdf" style="display: none;" multiple
                                           onchange="App.uploadPdfForBuchung('${r.partitaIva || ''}', '${r.dokumentNr || ''}', this, '${uploadId}')">
                                    <button class="btn btn-sm" style="padding: 0.2rem 0.4rem; font-size: 0.7rem; background: #4CAF50; color: white;"
                                            onclick="console.log('🔘 Upload-Button geklickt, ID:', '${uploadInputId}'); var el = document.getElementById('${uploadInputId}'); if(el) { el.click(); } else { console.error('❌ Input nicht gefunden:', '${uploadInputId}'); }" title="PDF hochladen">
                                        ↑
                                    </button>
                                </div>`;
                    })()
                }</td>
                <td>${r.kontrolliertAm ? this.formatDate(r.kontrolliertAm) : '-'}</td>
                <td>${r.bezahltAm ? this.formatDate(r.bezahltAm) : '-'}</td>
                <td style="font-size: 0.75rem; color: #666;">${r.updatedAt ? this.formatDateTime(r.updatedAt) : '-'}</td>
                <td>${this.getAbgabestelleDropdown(r.invoiceId, r.funding_source_id)}</td>
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
                            `<button class="btn btn-sm btn-primary" onclick="App.changeInvoiceStatus('${r.rechnungId}', 'kontrolliert')" title="Als kontrolliert markieren">${Icons.check}</button>` :
                        r.workflowStatus === 'kontrolliert' && DataManager.isAdmin() ?
                            `<button class="btn btn-sm btn-success" onclick="App.changeInvoiceStatus('${r.rechnungId}', 'bezahlt')" title="Als bezahlt markieren">€</button>` :
                        ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Summenzeile für alle gefilterten Rechnungen (nicht nur aktuelle Seite)
        const sumNetto = this.filteredRechnungen.reduce((sum, r) => {
            const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
            return sum + (netto || 0);
        }, 0);
        const sumMwst = this.filteredRechnungen.reduce((sum, r) => {
            const mwst = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
            return sum + (mwst || 0);
        }, 0);
        const sumGesamt = this.filteredRechnungen.reduce((sum, r) => {
            const gesamt = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);
            return sum + (gesamt || 0);
        }, 0);

        const sumRow = document.createElement('tr');
        sumRow.style = 'background: #f5f5f5; font-weight: bold; border-top: 2px solid #333;';
        sumRow.innerHTML = `
            <td colspan="7" style="text-align: right; padding-right: 1rem;">Summe (${totalCount} Rechnungen):</td>
            <td style="text-align: right;">${this.formatCurrency(sumNetto)}</td>
            <td style="text-align: right;">${this.formatCurrency(sumMwst)}</td>
            <td style="text-align: right;">${this.formatCurrency(sumGesamt)}</td>
            <td colspan="5"></td>
        `;
        tbody.appendChild(sumRow);

        this.updateMassActionsBar();
    },

    /**
     * Generiert Optionen für DATEV-Bewegungen ohne PDF (für Datalist)
     */
    getUnlinkedDatevOptionsAsDatalist: function() {
        // Alle DATEV-Buchungen ohne pdfExists
        const allRechnungen = this.filteredRechnungen || [];
        const unlinked = allRechnungen.filter(r => !r.isSupabaseOnly && !r.pdfExists);

        return unlinked.map(r => {
            const projekt = DataManager.getKunstMeranProjekt(r.projektId);
            const projektName = projekt?.name || r.projektId || 'N/A';
            // Kürzer formatiert: Lieferant (max 30 Zeichen), Dokument-Nr, Betrag, Projekt
            const shortName = r.fornitoreName.length > 30 ? r.fornitoreName.substring(0, 30) + '...' : r.fornitoreName;
            const label = `${shortName} | ${r.dokumentNr} | ${this.formatCurrency(r.betrag)} | ${projektName}`;
            return `<option value="${label}"></option>`;
        }).join('');
    },

    /**
     * Generiert Optionen für unverknüpfte PDFs (Supabase-only Invoices) - für Datalist
     */
    getUnlinkedPdfOptionsAsDatalist: function() {
        const allRechnungen = this.filteredRechnungen || [];
        const unlinkedPdfs = allRechnungen.filter(r => r.isSupabaseOnly || (r.invoiceId && !r.partitaIva));

        return unlinkedPdfs.map(r => {
            const fileName = r.fileName || 'Unbekannt';
            const shortFileName = fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName;
            const uploadDate = r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('de-DE') : '';
            const label = `${shortFileName} | ${uploadDate}`;
            return `<option value="${label}" data-invoice-id="${r.invoiceId}"></option>`;
        }).join('');
    },

    /**
     * Generiert Custom-Dropdown-Items für PDF-Suche mit Vorschau-Button
     */
    getPdfDropdownItems: function(partitaIva, dokumentNr) {
        const allRechnungen = this.filteredRechnungen || [];
        const unlinkedPdfs = allRechnungen.filter(r => r.isSupabaseOnly || (r.invoiceId && !r.partitaIva));

        if (unlinkedPdfs.length === 0) {
            return '<div style="padding: 0.5rem; color: #666; text-align: center;">Keine PDFs verfügbar</div>';
        }

        return unlinkedPdfs.map(r => {
            const fileName = r.fileName || 'Unbekannt';
            const shortFileName = fileName.length > 40 ? fileName.substring(0, 40) + '...' : fileName;
            const uploadDate = r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('de-DE') : '';
            const filePath = r.filePath || '';

            return `<div class="pdf-dropdown-item" data-filename="${fileName}" data-invoice-id="${r.invoiceId}"
                        style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem; cursor: pointer; border-bottom: 1px solid #eee; font-size: 0.75rem;"
                        onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='white'">
                        <span onclick="App.selectPdfFromDropdown('${r.invoiceId}', '${partitaIva}', '${dokumentNr}')" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${shortFileName} <span style="color: #888;">| ${uploadDate}</span>
                        </span>
                        <button onclick="event.stopPropagation(); App.previewPdfFromStorage('${filePath}')"
                                style="margin-left: 0.5rem; padding: 0.1rem 0.4rem; font-size: 0.7rem; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;"
                                title="PDF anzeigen">
                            ${Icons.preview}
                        </button>
                    </div>`;
        }).join('');
    },

    /**
     * Zeigt PDF-Dropdown an
     */
    showPdfDropdown: function(dropdownId) {
        // Schließe alle anderen Dropdowns
        document.querySelectorAll('.pdf-dropdown').forEach(d => {
            if (d.id !== dropdownId) d.style.display = 'none';
        });
        document.getElementById(dropdownId).style.display = 'block';
    },

    /**
     * Filtert PDF-Dropdown nach Eingabe
     */
    filterPdfDropdown: function(dropdownId, searchText) {
        const dropdown = document.getElementById(dropdownId);
        const items = dropdown.querySelectorAll('.pdf-dropdown-item');
        const lowerSearch = searchText.toLowerCase();

        items.forEach(item => {
            const filename = item.getAttribute('data-filename').toLowerCase();
            item.style.display = filename.includes(lowerSearch) ? 'flex' : 'none';
        });

        dropdown.style.display = 'block';
    },

    /**
     * Wählt PDF aus Custom-Dropdown und verknüpft
     */
    selectPdfFromDropdown: async function(invoiceId, partitaIva, dokumentNr) {
        try {
            const currentPage = this.currentRechnungenPage;

            const { error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: partitaIva,
                    invoice_number: dokumentNr
                })
                .eq('id', invoiceId);

            if (error) throw error;

            this.showToast('success', 'Verknüpft', 'PDF wurde mit DATEV-Buchung verknüpft');

            await this.reloadRechnungenKeepState();

        } catch (error) {
            console.error('Fehler beim Verknüpfen:', error);
            this.showToast('error', 'Fehler', 'Verknüpfung fehlgeschlagen: ' + error.message);
        }
    },

    /**
     * Zeigt PDF-Vorschau aus Supabase Storage im Modal
     */
    previewPdfFromStorage: async function(filePath) {
        if (!filePath) {
            this.showToast('error', 'Fehler', 'Kein Dateipfad vorhanden');
            return;
        }

        try {
            // Extrahiere Dateinamen aus Pfad für Titel
            const fileName = filePath.split('/').pop() || 'PDF';
            document.getElementById('pdf-preview-title').textContent = fileName;
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = 'none';

            const iframe = document.getElementById('pdf-preview-frame');
            iframe.src = 'about:blank';

            this.showModal('pdf-preview-modal');

            // Speichere Daten (ohne Invoice-Verknüpfung)
            this.currentPdfPreviewData = { partitaIva: null, dokumentNr: null, filePath: filePath, invoiceId: null };

            const signedUrl = await StorageService.getSignedUrl(filePath);
            this.currentPdfPath = signedUrl;
            iframe.src = signedUrl;
            iframe.style.display = '';

            iframe.onerror = () => {
                iframe.style.display = 'none';
                document.getElementById('pdf-preview-error').style.display = '';
            };
        } catch (error) {
            console.error('Fehler beim Laden des PDFs:', error);
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = '';
            document.getElementById('pdf-preview-error-details').textContent = `Pfad: ${filePath}`;
        }
    },

    /**
     * Drag & Drop Handler für PDF-Upload in Zeile
     */
    handlePdfDragOver: function(event, dropZoneId) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById(dropZoneId);
        if (dropZone) {
            dropZone.style.borderColor = '#4CAF50';
            dropZone.style.background = '#e8f5e9';
        }
    },

    handlePdfDragLeave: function(event, dropZoneId) {
        event.preventDefault();
        event.stopPropagation();
        const dropZone = document.getElementById(dropZoneId);
        if (dropZone) {
            dropZone.style.borderColor = 'transparent';
            dropZone.style.background = 'transparent';
        }
    },

    handlePdfDrop: async function(event, partitaIva, dokumentNr, rechnungId = null) {
        event.preventDefault();
        event.stopPropagation();

        // Reset drop zone styling
        const dropZones = document.querySelectorAll('.pdf-drop-zone');
        dropZones.forEach(zone => {
            zone.style.borderColor = 'transparent';
            zone.style.background = 'transparent';
        });

        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;

        // Filtere nur PDF-Dateien
        const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            this.showToast('error', 'Fehler', 'Bitte nur PDF-Dateien hochladen');
            return;
        }

        // Upload alle PDFs
        for (const file of pdfFiles) {
            await this.uploadPdfFile(partitaIva, dokumentNr, file, rechnungId);
        }
    },

    /**
     * Hilfsfunktion für PDF-Upload (von Drag & Drop oder File Input)
     * Unterstützt auch Buchungen ohne dokumentNr - dann wird rechnungId verwendet
     */
    uploadPdfFile: async function(partitaIva, dokumentNr, file, rechnungId = null) {
        console.log('📤 uploadPdfFile aufgerufen:', { partitaIva, dokumentNr, fileName: file.name, rechnungId });
        try {
            this.showToast('info', 'Upload...', `${file.name} wird hochgeladen...`);

            // Dateiname generieren
            const year = new Date().getFullYear();
            const timestamp = Date.now();
            // Bei fehlender dokumentNr: eindeutige ID aus rechnungId oder Timestamp
            // WICHTIG: Doppelpunkte aus rechnungId entfernen (ungültig in Dateinamen)
            const safeRechnungId = rechnungId ? rechnungId.replace(/:/g, '-') : null;
            const docNrPart = dokumentNr || safeRechnungId || timestamp;
            const newFileName = `${year}_${partitaIva || 'NODOC'}_${docNrPart}_${timestamp}.pdf`;
            const filePath = `invoices/${newFileName}`;
            console.log('📤 Generierter Dateiname:', newFileName);

            // Upload zu Supabase Storage
            const { data: uploadData, error: uploadError } = await SupabaseService.client.storage
                .from('invoices')
                .upload(filePath, file, { upsert: true });

            console.log('📤 Storage Upload Ergebnis:', { uploadData, uploadError });
            if (uploadError) throw uploadError;

            // Booking-ID extrahieren wenn vorhanden (für linked_booking_id)
            let bookingId = null;
            if (rechnungId && rechnungId.startsWith('id:')) {
                bookingId = rechnungId.substring(3);
            } else if (rechnungId && partitaIva && dokumentNr) {
                // Bei partitaIva_dokumentNr Format: Booking-ID aus DB holen
                const { data: booking } = await SupabaseService.client
                    .from('datev_bookings')
                    .select('id')
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr)
                    .limit(1)
                    .single();
                if (booking) {
                    bookingId = booking.id;
                    console.log('📤 Booking-ID aus DB geholt:', bookingId);
                }
            }

            // Invoice-Eintrag in Datenbank erstellen (mit linked_booking_id wenn vorhanden)
            const insertData = {
                file_name: newFileName,
                file_path: filePath,
                partita_iva: partitaIva || null,
                invoice_number: dokumentNr || null,
                status: 'uploaded'
            };
            // linked_booking_id hinzufügen wenn Buchung-ID bekannt
            if (bookingId) {
                insertData.linked_booking_id = bookingId;
                console.log('📤 linked_booking_id gesetzt:', bookingId);
            }

            const { data: invoiceData, error: dbError } = await SupabaseService.client
                .from('invoices')
                .insert(insertData)
                .select()
                .single();

            console.log('📤 Invoice DB Insert Ergebnis:', { invoiceData, dbError });
            if (dbError) throw dbError;

            // Wenn wir eine rechnungId haben, verknüpfe auch mit datev_bookings (Rückwärtskompatibilität)
            // HINWEIS: Die Hauptverknüpfung läuft jetzt über linked_booking_id in invoices
            if (rechnungId && invoiceData) {
                console.log('📤 Verknüpfe mit datev_bookings, rechnungId:', rechnungId);
                let linkData = null;
                let linkError = null;

                // Prüfe ob ID-Format (id:UUID) oder altes Format (partitaIva_dokumentNr)
                if (rechnungId.startsWith('id:')) {
                    const dbId = rechnungId.substring(3);
                    console.log('📤 Verknüpfe via DB-ID:', dbId, 'Invoice-ID:', invoiceData.id);

                    // linked_invoice_id in datev_bookings setzen (Rückwärtskompatibilität, nur für erstes PDF)
                    // Prüfen ob bereits ein linked_invoice_id gesetzt ist
                    const { data: existingBooking } = await SupabaseService.client
                        .from('datev_bookings')
                        .select('linked_invoice_id')
                        .eq('id', dbId)
                        .single();

                    // Nur setzen wenn noch kein PDF verknüpft war
                    if (!existingBooking?.linked_invoice_id) {
                        const result = await SupabaseService.client
                            .from('datev_bookings')
                            .update({ linked_invoice_id: invoiceData.id })
                            .eq('id', dbId)
                            .select();
                        linkData = result.data;
                        linkError = result.error;
                    } else {
                        console.log('📤 Buchung hat bereits ein verknüpftes PDF, überspringe linked_invoice_id Update');
                        linkData = [existingBooking];
                    }

                    // Falls kein Match gefunden wurde, logge Warnung
                    if (!linkData || linkData.length === 0) {
                        console.warn('⚠️ Keine DATEV-Buchung mit ID gefunden:', dbId);
                    }
                } else {
                    // Format: partitaIva_dokumentNr (kann auch _dokumentNr sein wenn partitaIva leer)
                    const [pIva, ...dNrParts] = rechnungId.split('_');
                    const dNr = dNrParts.join('_');
                    console.log('📤 Verknüpfe via partitaIva/dokumentNr:', { pIva, dNr });

                    // linked_invoice_id in datev_bookings setzen (per partitaIva + dokumentNr)
                    // Wenn partitaIva leer ist, suche nach leerer partita_iva ODER null
                    let query = SupabaseService.client
                        .from('datev_bookings')
                        .update({ linked_invoice_id: invoiceData.id });

                    if (pIva && pIva.trim() !== '') {
                        query = query.eq('partita_iva', pIva);
                    } else {
                        // Leere partita_iva: match auf leer oder null
                        query = query.or('partita_iva.is.null,partita_iva.eq.');
                    }
                    query = query.eq('dokument_nr', dNr);

                    const result = await query.select();
                    linkData = result.data;
                    linkError = result.error;

                    if (!linkData || linkData.length === 0) {
                        console.warn('⚠️ Keine DATEV-Buchung mit partitaIva/dokumentNr gefunden:', { pIva, dNr });
                    }
                }

                console.log('📤 Verknüpfung Ergebnis:', { linkData, linkError, matchCount: linkData?.length || 0 });

                if (linkError) {
                    console.error('❌ Verknüpfungsfehler:', linkError);
                }
            } else {
                console.log('📤 Keine Verknüpfung (rechnungId oder invoiceData fehlt):', { rechnungId, invoiceData });
            }

            this.showToast('success', 'Hochgeladen', `${file.name} wurde hochgeladen und verknüpft`);
            await this.reloadRechnungenKeepState();

        } catch (error) {
            console.error('Fehler beim Upload:', error);
            this.showToast('error', 'Fehler', `Upload fehlgeschlagen: ${error.message}`);
        }
    },

    /**
     * Direkter PDF-Upload für eine Buchung (über File-Input)
     */
    uploadPdfForBuchung: async function(partitaIva, dokumentNr, inputElement, rechnungId = null) {
        console.log('📤 uploadPdfForBuchung aufgerufen:', { partitaIva, dokumentNr, rechnungId });
        const files = inputElement.files;
        if (!files || files.length === 0) {
            console.log('📤 Keine Dateien ausgewählt');
            return;
        }
        console.log('📤 Dateien ausgewählt:', files.length);

        // Upload alle ausgewählten PDFs
        for (const file of files) {
            await this.uploadPdfFile(partitaIva, dokumentNr, file, rechnungId);
        }

        // Input zurücksetzen
        inputElement.value = '';
    },

    /**
     * Verknüpft PDF aus Input-Feld (mit Datalist)
     */
    linkPdfToDatevFromInput: async function(partitaIva, dokumentNr, selectedLabel) {
        if (!selectedLabel) return;

        try {
            // Aktuelle Seite speichern
            const currentPage = this.currentRechnungenPage;

            // Finde Invoice-ID aus Label
            const allRechnungen = this.filteredRechnungen || [];
            const unlinkedPdfs = allRechnungen.filter(r => r.isSupabaseOnly || (r.invoiceId && !r.partitaIva));

            const matchedPdf = unlinkedPdfs.find(r => {
                const fileName = r.fileName || 'Unbekannt';
                const shortFileName = fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName;
                const uploadDate = r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('de-DE') : '';
                const label = `${shortFileName} | ${uploadDate}`;
                return label === selectedLabel;
            });

            if (!matchedPdf) {
                throw new Error('PDF nicht gefunden');
            }

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: partitaIva,
                    invoice_number: dokumentNr
                })
                .eq('id', matchedPdf.invoiceId);

            if (error) throw error;

            this.showToast('success', 'Verknüpft', 'PDF wurde mit DATEV-Buchung verknüpft');

            await this.reloadRechnungenKeepState();

        } catch (error) {
            console.error('Fehler beim Verknüpfen:', error);
            this.showToast('error', 'Fehler', 'Verknüpfung fehlgeschlagen: ' + error.message);
        }
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
            // Aktuelle Seite speichern
            const currentPage = this.currentRechnungenPage;

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

            await this.reloadRechnungenKeepState();

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
            // Aktuelle Seite speichern
            const currentPage = this.currentRechnungenPage;

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

            await this.reloadRechnungenKeepState();

        } catch (error) {
            console.error('Fehler beim Trennen:', error);
            console.error('Error Message:', error.message);
            this.showToast('error', 'Fehler', `Trennen fehlgeschlagen: ${error.message}`);
        }
    },

    /**
     * Entfernt PDF-Verknüpfung von DATEV-Buchung (nur PDF-Seite)
     */
    unlinkPdfFromDatev: async function(invoiceId) {
        if (!confirm('PDF-Verknüpfung trennen? Das PDF bleibt erhalten und kann neu zugewiesen werden.')) {
            return;
        }

        try {
            const currentPage = this.currentRechnungenPage;

            console.log('Trenne PDF-Verknüpfung für Invoice:', invoiceId);

            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: null,
                    invoice_number: null
                })
                .eq('id', invoiceId);

            if (error) throw error;

            this.showToast('success', 'Getrennt', 'PDF-Verknüpfung wurde entfernt');

            await this.reloadRechnungenKeepState();

        } catch (error) {
            console.error('Fehler beim Trennen:', error);
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

    changePageSize: function(size) {
        this.rechnungenPerPage = parseInt(size, 10);
        this.currentRechnungenPage = 1;
        // Speichere Einstellung im localStorage
        localStorage.setItem('rechnungenPerPage', this.rechnungenPerPage);
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
                case 'geaendert':
                    valA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                    valB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
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

    massMarkKontrolliert: async function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) als kontrolliert markieren?`)) return;

        try {
            const heute = new Date().toISOString().split('T')[0];
            const user = (await SupabaseService.client.auth.getUser()).data.user;

            // Alle ausgewählten Rechnungen in Supabase updaten
            for (const rechnungId of this.selectedRechnungen) {
                // rechnungId Format: partitaIva_dokumentNr
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: 'kontrolliert',
                        kontrolled_at: heute,
                        kontrolled_by: user?.id
                    })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);

                // Auch localStorage updaten für Kompatibilität
                DataManager.markAsKontrolliert(rechnungId);
            }

            this.showToast('success', 'Erledigt', `${count} Rechnung(en) als kontrolliert markiert`);
        } catch (error) {
            console.error('Fehler bei Massen-Markierung:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }

        this.clearSelection();
        this.loadRechnungen();
    },

    massMarkBezahlt: async function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) als bezahlt markieren?`)) return;

        try {
            const heute = new Date().toISOString().split('T')[0];
            const user = (await SupabaseService.client.auth.getUser()).data.user;

            for (const rechnungId of this.selectedRechnungen) {
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: 'bezahlt',
                        paid_at: heute,
                        paid_by: user?.id
                    })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);

                DataManager.markAsBezahlt(rechnungId);
            }

            this.showToast('success', 'Erledigt', `${count} Rechnung(en) als bezahlt markiert`);
        } catch (error) {
            console.error('Fehler bei Massen-Markierung:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }

        this.clearSelection();
        this.loadRechnungen();
    },

    /**
     * Projekt für eine DATEV-Buchung setzen
     */
    setProjektForRechnung: async function(rechnungId, projektId) {
        if (!projektId) return;

        try {
            // rechnungId Format: partitaIva_dokumentNr oder nur ID
            const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
            const dokumentNr = dokumentNrParts.join('_');

            // Update in Supabase
            const { error } = await SupabaseService.client
                .from('datev_bookings')
                .update({ projekt_id: projektId })
                .eq('partita_iva', partitaIva)
                .eq('dokument_nr', dokumentNr);

            if (error) throw error;

            this.showToast('success', 'Projekt gesetzt', `Projekt wurde zugewiesen`);

            // Daten neu laden
            await DataManager.clearCache();
            this.loadRechnungen();
        } catch (error) {
            console.error('Fehler beim Setzen des Projekts:', error);
            this.showToast('error', 'Fehler', 'Projekt konnte nicht gesetzt werden');
        }
    },

    massArchive: async function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) archivieren?\n\nArchivierte Rechnungen werden ausgeblendet, können aber wiederhergestellt werden.`)) return;

        try {
            const heute = new Date().toISOString();

            for (const rechnungId of this.selectedRechnungen) {
                console.log('Archiviere:', rechnungId);

                // Format 1: "id:123" - Datenbank-ID (für DATEV-Buchungen ohne dokumentNr)
                if (rechnungId.startsWith('id:')) {
                    const dbId = rechnungId.substring(3);
                    const { error } = await SupabaseService.client
                        .from('datev_bookings')
                        .update({
                            archived: true,
                            archived_at: heute
                        })
                        .eq('id', dbId);
                    if (error) console.error('Archiv-Fehler (id:):', error);
                }
                // Format 2: Nur Zahlen - Supabase-only Invoice (PDF ohne DATEV-Match)
                else if (/^\d+$/.test(rechnungId)) {
                    const { error } = await SupabaseService.client
                        .from('invoices')
                        .update({
                            archived: true,
                            archived_at: heute
                        })
                        .eq('id', rechnungId);
                    if (error) console.error('Archiv-Fehler (invoice):', error);
                }
                // Format 3: "partitaIva_dokumentNr" - DATEV-Buchung mit Rechnungsnummer
                else {
                    const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                    const dokumentNr = dokumentNrParts.join('_');

                    // Nur archivieren wenn dokumentNr vorhanden ist
                    if (dokumentNr) {
                        const { error } = await SupabaseService.client
                            .from('datev_bookings')
                            .update({
                                archived: true,
                                archived_at: heute
                            })
                            .eq('partita_iva', partitaIva)
                            .eq('dokument_nr', dokumentNr);
                        if (error) console.error('Archiv-Fehler (partita_dokumentNr):', error);
                    } else {
                        console.warn('Kann nicht archivieren ohne dokumentNr:', rechnungId);
                    }
                }
            }

            this.showToast('success', 'Archiviert', `${count} Rechnung(en) archiviert`);
        } catch (error) {
            console.error('Fehler beim Archivieren:', error);
            this.showToast('error', 'Fehler', 'Archivierung fehlgeschlagen');
        }

        this.clearSelection();
        await DataManager.clearCache();
        this.loadRechnungen();
    },

    /**
     * Löscht ausgewählte Rechnungen (nur Supabase-only PDFs können gelöscht werden)
     */
    massDelete: async function() {
        if (this.selectedRechnungen.size === 0) return;

        // Prüfen ob nur löschbare Einträge ausgewählt sind
        const allRechnungen = this.filteredRechnungen || [];
        const selectedList = Array.from(this.selectedRechnungen);
        const deletableIds = [];
        const nonDeletableIds = [];

        for (const rechnungId of selectedList) {
            // Nur reine Zahlen sind Supabase-only Invoices (löschbar)
            if (/^\d+$/.test(rechnungId)) {
                deletableIds.push(rechnungId);
            } else {
                nonDeletableIds.push(rechnungId);
            }
        }

        if (deletableIds.length === 0) {
            this.showToast('warning', 'Hinweis', 'Es wurden keine löschbaren Einträge ausgewählt. Nur PDFs ohne DATEV-Verknüpfung können gelöscht werden.');
            return;
        }

        let message = `${deletableIds.length} PDF(s) ohne DATEV-Verknüpfung löschen?`;
        if (nonDeletableIds.length > 0) {
            message += `\n\n${nonDeletableIds.length} DATEV-Buchung(en) werden übersprungen (nur archivierbar).`;
        }
        message += '\n\nDie PDFs werden unwiderruflich gelöscht!';

        if (!confirm(message)) return;

        try {
            let deletedCount = 0;

            for (const invoiceId of deletableIds) {
                // 1. PDF aus Storage löschen
                const { data: invoice } = await SupabaseService.client
                    .from('invoices')
                    .select('file_path')
                    .eq('id', invoiceId)
                    .single();

                if (invoice?.file_path) {
                    await SupabaseService.client.storage
                        .from('invoices')
                        .remove([invoice.file_path]);
                }

                // 2. Invoice-Eintrag aus Datenbank löschen
                const { error } = await SupabaseService.client
                    .from('invoices')
                    .delete()
                    .eq('id', invoiceId);

                if (error) {
                    console.error('Lösch-Fehler für Invoice:', invoiceId, error);
                } else {
                    deletedCount++;
                }
            }

            this.showToast('success', 'Gelöscht', `${deletedCount} PDF(s) gelöscht`);
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showToast('error', 'Fehler', 'Löschen fehlgeschlagen: ' + error.message);
        }

        this.clearSelection();
        if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
            SupabaseDataAdapter.invalidateCache();
        }
        await this.loadRechnungen();
    },

    massSetAbgabestelle: async function(abgabestelle) {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`Abgabestelle "${abgabestelle}" für ${count} Rechnung(en) setzen?`)) return;

        try {
            const heute = new Date().toISOString().split('T')[0];

            for (const rechnungId of this.selectedRechnungen) {
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        abgabestelle: abgabestelle,
                        abgabestelle_am: heute
                    })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);

                DataManager.setAbgabestelle(rechnungId, abgabestelle);
            }

            this.showToast('success', 'Erledigt', `Abgabestelle für ${count} Rechnung(en) gesetzt`);
        } catch (error) {
            console.error('Fehler bei Abgabestelle:', error);
            this.showToast('error', 'Fehler', 'Abgabestelle konnte nicht gesetzt werden');
        }

        this.clearSelection();
        this.loadRechnungen();
    },

    refreshDatevData: async function() {
        await this.loadDatevData();
        this.loadRechnungen();
    },

    /**
     * Lieferantennamen in DATEV-Buchungen aus Suppliers-Tabelle aktualisieren
     */
    updateSupplierNames: async function() {
        try {
            // Lade alle Lieferanten
            const { data: suppliers, error: supplierError } = await SupabaseService.client
                .from('suppliers')
                .select('partita_iva, fornitore_name');

            if (supplierError) throw supplierError;

            if (!suppliers || suppliers.length === 0) {
                alert('Keine Lieferanten in der Datenbank gefunden.');
                return;
            }

            console.log(`📇 ${suppliers.length} Lieferanten geladen`);

            // Update alle DATEV-Buchungen
            let updatedCount = 0;
            for (const supplier of suppliers) {
                if (!supplier.partita_iva || !supplier.fornitore_name) continue;

                const { data: updated, error: updateError } = await SupabaseService.client
                    .from('datev_bookings')
                    .update({ fornitore_name: supplier.fornitore_name })
                    .eq('partita_iva', supplier.partita_iva)
                    .select('id');

                if (!updateError && updated && updated.length > 0) {
                    updatedCount += updated.length;
                    console.log(`✅ ${supplier.fornitore_name}: ${updated.length} Buchungen aktualisiert`);
                }
            }

            alert(`${updatedCount} Buchungen aktualisiert!`);

            // Daten neu laden
            await this.loadDatevData();
            this.loadRechnungen();

        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren:', error);
            alert('Fehler: ' + error.message);
        }
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

    /**
     * Aktualisiert die Abgabestelle einer Rechnung inline (aus Tabellen-Dropdown)
     */
    updateAbgabestelleInline: async function(invoiceId, fundingSourceId) {
        try {
            if (!invoiceId) {
                console.warn('Keine invoiceId für Abgabestelle-Update');
                return;
            }

            await DataManager.updateInvoiceFundingSource(invoiceId, fundingSourceId || null);

            this.showToast('success', 'Gespeichert', 'Abgabestelle wurde aktualisiert');

            // Einnahmeplanung neu laden falls sichtbar (um Budget-Übersicht zu aktualisieren)
            if (document.getElementById('view-einnahmen')?.classList.contains('active')) {
                await this.loadEinnahmen();
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Abgabestelle:', error);
            this.showToast('error', 'Fehler', `Abgabestelle konnte nicht gespeichert werden: ${error.message}`);
        }
    },

    /**
     * Generiert Abgabestellen-Dropdown-HTML für eine Rechnung
     */
    getAbgabestelleDropdown: function(invoiceId, currentFundingSourceId) {
        if (!invoiceId) {
            return '<span style="color: #999;">-</span>';
        }

        let options = '<option value="">- Keine -</option>';
        this.activeAbgabestellen.forEach(ab => {
            const selected = currentFundingSourceId === ab.id ? 'selected' : '';
            options += `<option value="${ab.id}" ${selected}>${ab.code} - ${ab.name}</option>`;
        });

        return `<select class="form-control abgabestelle-select"
                        style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                        onchange="App.updateAbgabestelleInline('${invoiceId}', this.value)">
                    ${options}
                </select>`;
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

    /**
     * Aktualisiert den MwSt-Satz einer DATEV-Buchung
     * @param {string|number} bookingId - Die ID der DATEV-Buchung
     * @param {string|number} rate - Der neue MwSt-Satz (0, 4, 10 oder 22)
     */
    updateMwstRate: async function(bookingId, rate) {
        try {
            if (!bookingId) {
                console.warn('Keine bookingId für MwSt-Update');
                return;
            }

            const mwstRate = parseFloat(rate);
            console.log('Aktualisiere MwSt-Satz:', { bookingId, mwstRate });

            // Update in Supabase
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .update({ mwst_rate: mwstRate })
                .eq('id', bookingId);

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log('MwSt-Update erfolgreich:', data);

            // Cache invalidieren und Ansicht neu laden
            if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
                SupabaseDataAdapter.invalidateCache();
            }

            // Tabelle neu laden (behält Filter und Seite bei)
            await this.reloadRechnungenKeepState();

            this.showToast('success', 'Gespeichert', `MwSt-Satz auf ${mwstRate}% geändert`);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des MwSt-Satzes:', error);
            this.showToast('error', 'Fehler', `MwSt-Satz konnte nicht gespeichert werden: ${error.message}`);
        }
    },

    exportRechnungenCSV: function() {
        // Exportiere die aktuell gefilterten Daten
        const rechnungen = this.filteredRechnungen || [];

        if (rechnungen.length === 0) {
            this.showToast('warning', 'Keine Daten', 'Keine Rechnungen zum Exportieren vorhanden');
            return;
        }

        // CSV Header
        let csv = 'Datum;Lieferant;Partita IVA;Rechnungsnr.;Projekt;Kostentyp;Netto;MwSt;Brutto;Status;PDF;Kontrolliert;Bezahlt;Notizen\n';

        // CSV Daten
        rechnungen.forEach(r => {
            const datum = r.datum ? this.formatDate(r.datum) : '';
            const lieferant = (r.fornitoreName || '').replace(/;/g, ',');
            const partitaIva = r.partitaIva || '';
            const dokumentNr = r.dokumentNr || '';
            const projekt = r.projektName || '';
            const kostentyp = r.kostentyp || '';
            const netto = r.betragNetto !== undefined ? r.betragNetto : (r.betrag || 0);
            const mwst = r.betragMwst !== undefined ? r.betragMwst : 0;
            const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (netto + mwst);
            const status = r.workflowStatus || '';
            const pdfExists = r.pdfExists ? 'Ja' : 'Nein';
            const kontrolliert = r.kontrolliertAm ? this.formatDate(r.kontrolliertAm) : '';
            const bezahlt = r.bezahltAm ? this.formatDate(r.bezahltAm) : '';
            const notizen = (r.notes || r.notizen || '').replace(/;/g, ',').replace(/\n/g, ' ');

            csv += `${datum};${lieferant};${partitaIva};${dokumentNr};${projekt};${kostentyp};`;
            csv += `${netto.toFixed(2).replace('.', ',')};${mwst.toFixed(2).replace('.', ',')};${brutto.toFixed(2).replace('.', ',')};`;
            csv += `${status};${pdfExists};${kontrolliert};${bezahlt};${notizen}\n`;
        });

        // Summenzeile
        const sumNetto = rechnungen.reduce((sum, r) => sum + (r.betragNetto !== undefined ? r.betragNetto : (r.betrag || 0)), 0);
        const sumMwst = rechnungen.reduce((sum, r) => sum + (r.betragMwst !== undefined ? r.betragMwst : 0), 0);
        const sumBrutto = rechnungen.reduce((sum, r) => sum + (r.betragGesamt !== undefined ? r.betragGesamt : (sumNetto + sumMwst)), 0);
        csv += `\n;;;;;;${sumNetto.toFixed(2).replace('.', ',')};${sumMwst.toFixed(2).replace('.', ',')};${sumBrutto.toFixed(2).replace('.', ',')};;;;\n`;

        // Dateiname basierend auf Filtern
        const jahrFilter = document.getElementById('rechnung-filter-jahr')?.value || '';
        const statusFilter = document.getElementById('rechnung-filter-status')?.value || '';
        let filename = 'Rechnungen';
        if (jahrFilter) filename += '_' + jahrFilter;
        if (statusFilter) filename += '_' + statusFilter;
        filename += `_${new Date().toISOString().split('T')[0]}.csv`;

        this.downloadCSV(csv, filename);
        this.showToast('success', 'Export', `${rechnungen.length} Rechnungen exportiert`);
    },

    // ==========================================
    // PDF PREVIEW
    // ==========================================

    // Aktuelle PDF-Preview Daten für Entverknüpfen
    currentPdfPreviewData: null,

    showPdfPreview: async function(partitaIva, dokumentNr, filePath = null) {
        try {
            document.getElementById('pdf-preview-title').textContent = `${partitaIva} - ${dokumentNr}`;
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = 'none';

            // Zeige Loading State
            const iframe = document.getElementById('pdf-preview-frame');
            iframe.src = 'about:blank';

            this.showModal('pdf-preview-modal');

            // Speichere Daten für eventuelles Entverknüpfen
            this.currentPdfPreviewData = { partitaIva, dokumentNr, filePath: null, invoiceId: null };

            // Wenn filePath bereits übergeben wurde, direkt nutzen
            if (!filePath || filePath === '') {
                // Sonst: Hole Invoice aus Supabase
                const { data: invoices, error } = await SupabaseService.client
                    .from('invoices')
                    .select('id, file_path')
                    .eq('partita_iva', partitaIva)
                    .eq('invoice_number', dokumentNr)
                    .limit(1);

                if (error) throw error;

                if (!invoices || invoices.length === 0) {
                    throw new Error('PDF nicht in Datenbank gefunden');
                }

                filePath = invoices[0].file_path;
                this.currentPdfPreviewData.invoiceId = invoices[0].id;
            } else {
                // Hole Invoice-ID separat
                const { data: invoices } = await SupabaseService.client
                    .from('invoices')
                    .select('id')
                    .eq('partita_iva', partitaIva)
                    .eq('invoice_number', dokumentNr)
                    .limit(1);
                if (invoices && invoices.length > 0) {
                    this.currentPdfPreviewData.invoiceId = invoices[0].id;
                }
            }

            this.currentPdfPreviewData.filePath = filePath;

            // Hole signierte URL von Supabase Storage
            console.log('Lade PDF von Pfad:', filePath);
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
            console.error('Problematischer Pfad:', filePath);
            document.getElementById('pdf-preview-frame').style.display = 'none';
            document.getElementById('pdf-preview-error').style.display = '';
            document.getElementById('pdf-preview-error-details').textContent = `Pfad: ${filePath || 'unbekannt'}`;

            // Entverknüpfen-Button nur anzeigen wenn wir eine Invoice-ID haben
            const unlinkBtn = document.getElementById('pdf-unlink-btn');
            if (unlinkBtn) {
                unlinkBtn.style.display = this.currentPdfPreviewData?.invoiceId ? '' : 'none';
            }
        }
    },

    /**
     * Entfernt die fehlerhafte PDF-Verknüpfung aus dem Preview-Modal heraus
     */
    unlinkCurrentPdf: async function() {
        if (!this.currentPdfPreviewData?.invoiceId) {
            this.showToast('error', 'Fehler', 'Keine Invoice-ID gefunden');
            return;
        }

        if (!confirm('Möchten Sie die fehlerhafte PDF-Verknüpfung wirklich entfernen?')) {
            return;
        }

        try {
            await this.unlinkPdfFromDatev(this.currentPdfPreviewData.invoiceId);
            this.hideModal('pdf-preview-modal');
        } catch (error) {
            console.error('Fehler beim Entverknüpfen:', error);
            this.showToast('error', 'Fehler', error.message);
        }
    },

    openPdfInNewTab: function() {
        if (this.currentPdfPath) {
            window.open(this.currentPdfPath, '_blank');
        }
    },

    /**
     * Öffnet PDF aus Supabase Storage (Alias für previewPdfFromStorage)
     */
    openPdf: async function(filePath) {
        await this.previewPdfFromStorage(filePath);
    },

    openPdfFolder: function() {
        // Öffnet den EK-Rechnungen Ordner in neuem Tab
        window.open('EK-Rechnungen/', '_blank');
    },

    // ==========================================
    // LIEFERANTEN (DATEV)
    // ==========================================

    // Alle Lieferanten-Daten speichern für Filter
    allLieferanten: [],
    allLieferantenRechnungen: [],
    lieferantenSelectedYear: new Date().getFullYear(),
    lieferantenSortColumn: 'name',
    lieferantenSortDirection: 'asc',

    loadLieferanten: async function() {
        const lieferanten = await DataManager.getDatevLieferanten();
        const rechnungen = await DataManager.getRechnungenMitStatus();

        // Daten speichern für Filter
        this.allLieferanten = lieferanten;
        this.allLieferantenRechnungen = rechnungen;

        // Jahre aus Rechnungen ermitteln
        const jahre = new Set();
        rechnungen.forEach(r => {
            const datum = r.datum || r.belegdatum;
            if (datum) {
                jahre.add(new Date(datum).getFullYear());
            }
        });

        // Aktuelles Jahr immer hinzufügen
        const currentYear = new Date().getFullYear();
        jahre.add(currentYear);

        const jahreArray = Array.from(jahre).sort((a, b) => b - a);

        // Jahresfilter befüllen
        const jahrSelect = document.getElementById('lieferanten-filter-jahr');
        if (jahrSelect) {
            // Wenn aktuelles Jahr Daten hat, dieses auswählen, sonst das neueste Jahr mit Daten
            const rechnungenAktuellesJahr = rechnungen.filter(r => {
                const datum = r.datum || r.belegdatum;
                return datum && new Date(datum).getFullYear() === currentYear;
            });
            const defaultYear = rechnungenAktuellesJahr.length > 0 ? currentYear : jahreArray[0];

            jahrSelect.innerHTML = jahreArray.map(j =>
                `<option value="${j}" ${j === defaultYear ? 'selected' : ''}>${j}</option>`
            ).join('');
            this.lieferantenSelectedYear = defaultYear;
        }

        // Statistiken und Tabelle für aktuelles Jahr rendern
        this.updateLieferantenStatistiken();

        // Suchfeld leeren
        document.getElementById('lieferanten-search').value = '';

        // Tabelle rendern
        this.renderLieferantenTable(this.allLieferanten);

        // Resizable Spalten initialisieren (nur einmal)
        if (!this._lieferantenResizableInitialized) {
            this.setupLieferantenResizableColumns();
            this._lieferantenResizableInitialized = true;
        }
    },

    /**
     * Resizable Spalten für Lieferanten-Tabelle
     */
    setupLieferantenResizableColumns: function() {
        const table = document.getElementById('lieferanten-table');
        if (!table) return;

        const headers = table.querySelectorAll('thead th');
        const storageKey = 'lieferantenColumnWidths';
        this.lieferantenColumnWidths = JSON.parse(localStorage.getItem(storageKey) || '{}');

        headers.forEach((th, index) => {
            // Skip erste Spalte (#)
            if (index < 1) return;

            // Resize handle erstellen
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            th.style.position = 'relative';
            th.appendChild(resizeHandle);

            // Gespeicherte Breite anwenden
            const columnKey = `col-${index}`;
            if (this.lieferantenColumnWidths[columnKey]) {
                th.style.width = this.lieferantenColumnWidths[columnKey] + 'px';
                th.style.minWidth = this.lieferantenColumnWidths[columnKey] + 'px';
            }

            let startX, startWidth;

            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                startX = e.pageX;
                startWidth = th.offsetWidth;

                document.body.classList.add('resizing-columns');
                resizeHandle.classList.add('resizing');

                const onMouseMove = (e) => {
                    const diff = e.pageX - startX;
                    const newWidth = Math.max(50, startWidth + diff);
                    th.style.width = newWidth + 'px';
                    th.style.minWidth = newWidth + 'px';
                };

                const onMouseUp = () => {
                    document.body.classList.remove('resizing-columns');
                    resizeHandle.classList.remove('resizing');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    // Spaltenbreite speichern
                    this.lieferantenColumnWidths[columnKey] = th.offsetWidth;
                    localStorage.setItem(storageKey, JSON.stringify(this.lieferantenColumnWidths));
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    },

    filterLieferantenByYear: function() {
        const jahrSelect = document.getElementById('lieferanten-filter-jahr');
        this.lieferantenSelectedYear = parseInt(jahrSelect.value);

        // Statistiken aktualisieren
        this.updateLieferantenStatistiken();

        // Tabelle neu rendern
        this.filterLieferanten();
    },

    updateLieferantenStatistiken: function() {
        const selectedYear = this.lieferantenSelectedYear;
        const rechnungen = this.allLieferantenRechnungen;
        const lieferanten = this.allLieferanten;

        // Rechnungen des gewählten Jahres filtern
        const rechnungenImJahr = rechnungen.filter(r => {
            const datum = r.datum || r.belegdatum;
            return datum && new Date(datum).getFullYear() === selectedYear;
        });

        // Statistiken berechnen
        let gesamtvolumen = 0;
        let mitRechnungen = 0;
        const lieferantenMitRechnungen = new Set();

        rechnungenImJahr.forEach(r => {
            gesamtvolumen += r.betrag || 0;
            if (r.partitaIva) {
                lieferantenMitRechnungen.add(r.partitaIva);
            }
        });

        mitRechnungen = lieferantenMitRechnungen.size;

        // Spaltenüberschriften aktualisieren
        const thJahr = document.getElementById('th-lieferant-jahr');
        const thVorjahr = document.getElementById('th-lieferant-vorjahr');
        if (thJahr) thJahr.textContent = selectedYear;
        if (thVorjahr) thVorjahr.textContent = selectedYear - 1;

        document.getElementById('stat-lieferanten-total').textContent = lieferanten.length;
        document.getElementById('stat-lieferanten-aktiv').textContent = mitRechnungen;
        document.getElementById('stat-lieferanten-summe').textContent = this.formatCurrency(gesamtvolumen);
    },

    sortLieferanten: function(column) {
        // Richtung umschalten wenn gleiche Spalte
        if (this.lieferantenSortColumn === column) {
            this.lieferantenSortDirection = this.lieferantenSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.lieferantenSortColumn = column;
            // Text-Spalten aufsteigend, Zahlen absteigend
            const textColumns = ['name', 'partitaIva', 'adresse'];
            this.lieferantenSortDirection = textColumns.includes(column) ? 'asc' : 'desc';
        }

        // Sort-Icons aktualisieren
        ['name', 'partitaIva', 'adresse', 'jahr', 'vorjahr', 'prozent'].forEach(col => {
            const icon = document.getElementById(`sort-icon-lieferant-${col}`);
            if (icon) {
                if (col === column) {
                    icon.textContent = this.lieferantenSortDirection === 'asc' ? '▲' : '▼';
                } else {
                    icon.textContent = '';
                }
            }
        });

        // Tabelle neu rendern (mit aktueller Suche)
        this.filterLieferanten();
    },

    filterLieferanten: function() {
        const searchTerm = document.getElementById('lieferanten-search').value.toLowerCase();

        if (!searchTerm) {
            this.renderLieferantenTable(this.allLieferanten);
            return;
        }

        const filtered = this.allLieferanten.filter(l => {
            const name = (l.name || '').toLowerCase();
            const partitaIva = (l.partitaIva || '').toLowerCase();
            const address = (l.address || '').toLowerCase();
            const city = (l.city || '').toLowerCase();

            return name.includes(searchTerm) ||
                   partitaIva.includes(searchTerm) ||
                   address.includes(searchTerm) ||
                   city.includes(searchTerm);
        });

        this.renderLieferantenTable(filtered);
    },

    renderLieferantenTable: function(lieferanten) {
        const tbody = document.getElementById('lieferanten-table-body');
        tbody.innerHTML = '';
        const rechnungen = this.allLieferantenRechnungen;
        const selectedYear = this.lieferantenSelectedYear;
        const vorjahr = selectedYear - 1;

        if (lieferanten.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666; padding: 2rem;">Keine Lieferanten gefunden.</td></tr>';
            return;
        }

        // Berechnete Werte für Sortierung vorbereiten
        const lieferantenMitWerten = lieferanten.map(l => {
            const lieferantRechnungen = rechnungen.filter(r => r.partitaIva === l.partitaIva);

            const rechnungenJahr = lieferantRechnungen.filter(r => {
                const datum = r.datum || r.belegdatum;
                return datum && new Date(datum).getFullYear() === selectedYear;
            });
            const summeJahr = rechnungenJahr.reduce((sum, r) => sum + (r.betrag || 0), 0);

            const rechnungenVorjahr = lieferantRechnungen.filter(r => {
                const datum = r.datum || r.belegdatum;
                return datum && new Date(datum).getFullYear() === vorjahr;
            });
            const summeVorjahr = rechnungenVorjahr.reduce((sum, r) => sum + (r.betrag || 0), 0);

            let prozent = null;
            if (summeVorjahr > 0) {
                prozent = ((summeJahr - summeVorjahr) / summeVorjahr) * 100;
            } else if (summeJahr > 0) {
                prozent = Infinity; // "neu" ganz oben
            }

            return { ...l, summeJahr, summeVorjahr, prozent };
        });

        // Sortieren
        const sortCol = this.lieferantenSortColumn;
        const sortDir = this.lieferantenSortDirection;
        lieferantenMitWerten.sort((a, b) => {
            let valA, valB;
            switch (sortCol) {
                case 'name':
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                    break;
                case 'partitaIva':
                    valA = (a.partitaIva || '').toLowerCase();
                    valB = (b.partitaIva || '').toLowerCase();
                    break;
                case 'adresse':
                    valA = [a.address, a.city, a.country].filter(Boolean).join(', ').toLowerCase();
                    valB = [b.address, b.city, b.country].filter(Boolean).join(', ').toLowerCase();
                    break;
                case 'jahr':
                    valA = a.summeJahr;
                    valB = b.summeJahr;
                    break;
                case 'vorjahr':
                    valA = a.summeVorjahr;
                    valB = b.summeVorjahr;
                    break;
                case 'prozent':
                    valA = a.prozent === null ? -Infinity : a.prozent;
                    valB = b.prozent === null ? -Infinity : b.prozent;
                    break;
                default:
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        lieferantenMitWerten.forEach((l, index) => {
            const lieferantRechnungen = rechnungen.filter(r => r.partitaIva === l.partitaIva);
            const hatName = l.name && l.name.trim() !== '';
            const displayName = hatName ? l.name : '(Unbekannt)';
            const nameStyle = hatName ? '' : 'color: #999; font-style: italic;';

            // Adresse zusammensetzen
            const adressParts = [l.address, l.city, l.country].filter(Boolean);
            const adresse = adressParts.join(', ') || '-';

            // Werte aus vorberechneten Daten
            const summeJahr = l.summeJahr;
            const summeVorjahr = l.summeVorjahr;

            // Rechnungen für Details
            const rechnungenJahr = lieferantRechnungen.filter(r => {
                const datum = r.datum || r.belegdatum;
                return datum && new Date(datum).getFullYear() === selectedYear;
            });
            const rechnungenVorjahrDetail = lieferantRechnungen.filter(r => {
                const datum = r.datum || r.belegdatum;
                return datum && new Date(datum).getFullYear() === vorjahr;
            });

            // Prozentuale Veränderung berechnen
            let prozentText = '-';
            let prozentStyle = 'color: #666;';
            if (l.prozent === Infinity) {
                prozentText = 'neu';
                prozentStyle = 'color: #007bff; font-style: italic;';
            } else if (l.prozent !== null) {
                if (l.prozent > 0) {
                    prozentText = `+${l.prozent.toFixed(1)}%`;
                    prozentStyle = 'color: #dc3545; font-weight: 500;'; // Rot für mehr Ausgaben
                } else if (l.prozent < 0) {
                    prozentText = `${l.prozent.toFixed(1)}%`;
                    prozentStyle = 'color: #28a745; font-weight: 500;'; // Grün für weniger Ausgaben
                } else {
                    prozentText = '0%';
                }
            }

            // Sichere ID für HTML-Elemente (ohne Sonderzeichen)
            const safeId = `lieferant-${index}`;
            const partitaIvaEscaped = (l.partitaIva || '').replace(/'/g, "\\'");

            // Hauptzeile mit Expand-Button
            const row = document.createElement('tr');
            row.className = 'lieferant-row';
            row.style.cursor = 'pointer';
            row.onclick = () => this.toggleLieferantDetailsById(safeId);
            row.innerHTML = `
                <td style="text-align: center;">
                    <span id="expand-icon-${safeId}" style="font-size: 0.8rem;">▶</span>
                </td>
                <td>
                    <span style="${nameStyle}"><strong>${displayName}</strong></span>
                    <button class="btn btn-sm" style="padding: 0.1rem 0.3rem; margin-left: 0.5rem;" onclick="event.stopPropagation(); App.editLieferantName('${partitaIvaEscaped}')" title="Name bearbeiten">
                        ${Icons.edit}
                    </button>
                </td>
                <td>${l.partitaIva || '-'}</td>
                <td style="font-size: 0.85rem; color: #666;">${adresse}</td>
                <td style="text-align: right;">${this.formatCurrency(summeJahr)}</td>
                <td style="text-align: right; color: #666;">${this.formatCurrency(summeVorjahr)}</td>
                <td style="text-align: right; ${prozentStyle}">${prozentText}</td>
            `;
            tbody.appendChild(row);

            // Detail-Zeile (versteckt)
            const detailRow = document.createElement('tr');
            detailRow.id = `detail-${safeId}`;
            detailRow.style.display = 'none';
            detailRow.innerHTML = `
                <td colspan="7" style="background: #f8f9fa; padding: 1rem;">
                    <div style="margin-bottom: 0.75rem;">
                        <strong>${selectedYear}:</strong> ${rechnungenJahr.length} Rechnungen, ${this.formatCurrency(summeJahr)}
                        <span style="color: #666; margin-left: 1rem;">| ${vorjahr}: ${rechnungenVorjahrDetail.length} Rechnungen, ${this.formatCurrency(summeVorjahr)}</span>
                    </div>
                    <div id="rechnungen-${safeId}">
                        ${this.renderLieferantRechnungenList(rechnungenJahr, l.partitaIva)}
                    </div>
                </td>
            `;
            tbody.appendChild(detailRow);
        });
    },

    toggleLieferantDetailsById: function(safeId) {
        const detailRow = document.getElementById(`detail-${safeId}`);
        const expandIcon = document.getElementById(`expand-icon-${safeId}`);

        if (detailRow && expandIcon) {
            if (detailRow.style.display === 'none') {
                detailRow.style.display = 'table-row';
                expandIcon.textContent = '▼';
            } else {
                detailRow.style.display = 'none';
                expandIcon.textContent = '▶';
            }
        }
    },

    toggleLieferantDetails: function(partitaIva) {
        const detailRow = document.getElementById(`lieferant-detail-${partitaIva}`);
        const expandIcon = document.getElementById(`expand-icon-${partitaIva}`);

        if (detailRow.style.display === 'none') {
            detailRow.style.display = 'table-row';
            expandIcon.textContent = '▼';
        } else {
            detailRow.style.display = 'none';
            expandIcon.textContent = '▶';
        }
    },

    renderLieferantRechnungenList: function(rechnungen, partitaIva) {
        if (rechnungen.length === 0) {
            return '<div style="color: #666; font-style: italic;">Keine Rechnungen in diesem Jahr</div>';
        }

        return `
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                <thead>
                    <tr style="background: #e9ecef;">
                        <th style="padding: 0.4rem; text-align: left;">Datum</th>
                        <th style="padding: 0.4rem; text-align: left;">Rechnungs-Nr.</th>
                        <th style="padding: 0.4rem; text-align: left;">Projekt</th>
                        <th style="padding: 0.4rem; text-align: right;">Netto</th>
                        <th style="padding: 0.4rem; text-align: right;">Brutto</th>
                        <th style="padding: 0.4rem; text-align: center;">PDF</th>
                    </tr>
                </thead>
                <tbody>
                    ${rechnungen.map(r => {
                        const projekt = DataManager.getKunstMeranProjekt(r.projektId);
                        const projektName = projekt?.name || r.projektId || '-';
                        const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
                        const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);
                        return `
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 0.4rem;">${this.formatDate(r.datum || r.belegdatum)}</td>
                                <td style="padding: 0.4rem;">${r.dokumentNr || '-'}</td>
                                <td style="padding: 0.4rem;">${projektName}</td>
                                <td style="padding: 0.4rem; text-align: right;">${this.formatCurrency(netto)}</td>
                                <td style="padding: 0.4rem; text-align: right;">${this.formatCurrency(brutto)}</td>
                                <td style="padding: 0.4rem; text-align: center;">
                                    ${r.pdfExists ?
                                        `<a href="#" onclick="event.preventDefault(); App.showPdfPreview('${r.partitaIva}', '${r.dokumentNr}', '${r.filePath || ''}')" style="color: #2196F3;">${Icons.document}</a>` :
                                        '<span style="color: #ccc;">-</span>'
                                    }
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
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

    formatDateTime: function(dateTimeString) {
        if (!dateTimeString) return '-';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Generiert Lieferanten-Zelle mit Bearbeitungsmöglichkeit
     * Zeigt Eingabefeld wenn Name fehlt oder auf Kontoname hinweist
     */
    getLieferantCell: function(r) {
        const name = r.fornitoreName || '';
        const sponsorInfo = r.partitaIvaCliente ? `<br><small style="color:#666;">Sponsor: ${r.partitaIvaCliente}</small>` : '';

        // Prüfe ob der Name ein Kontoname ist (z.B. "Costi altri servizi")
        const isKontoName = name.toLowerCase().startsWith('costi ') ||
                           name.toLowerCase().startsWith('spese ') ||
                           name === 'Unbekannt' ||
                           name === '' ||
                           !name;

        if (isKontoName) {
            // Bearbeitbares Feld anzeigen
            const inputId = `lieferant-input-${r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
            const beschreibungHint = r.beschreibung ? r.beschreibung.substring(0, 50) : '';
            return `
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <input type="text"
                           id="${inputId}"
                           class="form-control"
                           style="font-size: 0.75rem; padding: 0.25rem; min-width: 120px;"
                           placeholder="${beschreibungHint || 'Lieferant eingeben...'}"
                           value=""
                           onchange="App.updateLieferantName('${r.rechnungId}', this.value)">
                    <small style="color: #999; font-size: 0.65rem;">${name || 'Kein Lieferant'}</small>
                </div>${sponsorInfo}`;
        } else {
            // Normaler Name mit Bearbeitungs-Icon
            const inputId = `lieferant-edit-${r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
            return `
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <span id="${inputId}-display">${name}</span>
                    <button class="btn btn-sm"
                            style="padding: 0.1rem 0.2rem; font-size: 0.6rem; background: transparent; border: none; cursor: pointer;"
                            onclick="App.showLieferantEdit('${inputId}', '${r.rechnungId}', '${name.replace(/'/g, "\\'")}')"
                            title="Lieferant bearbeiten">
                        ${Icons.edit}
                    </button>
                </div>${sponsorInfo}`;
        }
    },

    /**
     * Zeigt Bearbeitungsfeld für Lieferantennamen
     */
    showLieferantEdit: function(inputId, rechnungId, currentName) {
        const displayEl = document.getElementById(`${inputId}-display`);
        if (!displayEl) return;

        const parentDiv = displayEl.parentElement;
        parentDiv.innerHTML = `
            <input type="text"
                   id="${inputId}"
                   class="form-control"
                   style="font-size: 0.75rem; padding: 0.25rem; min-width: 120px;"
                   value="${currentName}"
                   onblur="App.updateLieferantName('${rechnungId}', this.value)"
                   onkeydown="if(event.key==='Enter'){this.blur();}">
        `;
        document.getElementById(inputId).focus();
    },

    /**
     * Aktualisiert Lieferantenname in Supabase
     */
    updateLieferantName: async function(rechnungId, newName) {
        if (!newName || !newName.trim()) return;

        try {
            // rechnungId Format: partitaIva_dokumentNr
            const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
            const dokumentNr = dokumentNrParts.join('_');

            const { error } = await SupabaseService.client
                .from('datev_bookings')
                .update({ fornitore_name: newName.trim() })
                .eq('partita_iva', partitaIva)
                .eq('dokument_nr', dokumentNr);

            if (error) throw error;

            this.showToast('success', 'Gespeichert', `Lieferant: ${newName.trim()}`);

            // Cache leeren und neu laden
            await DataManager.clearCache();
            this.loadRechnungen();
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Lieferantennamens:', error);
            this.showToast('error', 'Fehler', 'Lieferant konnte nicht gespeichert werden');
        }
    },

    /**
     * Generiert Rechnungsnummer-Zelle mit Bearbeitungsmöglichkeit
     */
    getDokumentNrCell: function(r) {
        const dokumentNr = r.dokumentNr || '';
        // Verwende DB-ID falls vorhanden, sonst rechnungId
        const updateId = r.id ? `id:${r.id}` : r.rechnungId;

        if (!dokumentNr || dokumentNr.trim() === '') {
            // Leere Rechnungsnummer: Eingabefeld anzeigen
            const inputId = `docnr-input-${r.id || r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
            return `
                <input type="text"
                       id="${inputId}"
                       class="form-control"
                       style="font-size: 0.75rem; padding: 0.25rem; min-width: 80px; background: #fff3cd;"
                       placeholder="Nr. eingeben..."
                       value=""
                       onchange="App.updateDokumentNr('${updateId}', this.value)">`;
        } else {
            // Vorhandene Nummer mit Bearbeitungs-Icon
            const inputId = `docnr-edit-${r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
            return `
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <span id="${inputId}-display">${dokumentNr}</span>
                    <button class="btn btn-sm"
                            style="padding: 0.1rem 0.2rem; font-size: 0.6rem; background: transparent; border: none; cursor: pointer;"
                            onclick="App.showDokumentNrEdit('${inputId}', '${r.rechnungId}', '${dokumentNr.replace(/'/g, "\\'")}')"
                            title="Rechnungsnummer bearbeiten">
                        ${Icons.edit}
                    </button>
                </div>`;
        }
    },

    /**
     * Zeigt Bearbeitungsfeld für Rechnungsnummer
     */
    showDokumentNrEdit: function(inputId, rechnungId, currentNr) {
        const displayEl = document.getElementById(`${inputId}-display`);
        if (!displayEl) return;

        const parentDiv = displayEl.parentElement;
        parentDiv.innerHTML = `
            <input type="text"
                   id="${inputId}"
                   class="form-control"
                   style="font-size: 0.75rem; padding: 0.25rem; min-width: 80px;"
                   value="${currentNr}"
                   onblur="App.updateDokumentNr('${rechnungId}', this.value)"
                   onkeydown="if(event.key==='Enter'){this.blur();}">
        `;
        document.getElementById(inputId).focus();
    },

    /**
     * Aktualisiert Rechnungsnummer in Supabase
     */
    updateDokumentNr: async function(rechnungId, newNr) {
        if (!newNr || !newNr.trim()) return;

        try {
            let query;

            // Prüfe ob ID-Format (id:123) oder altes Format (partitaIva_dokumentNr)
            if (rechnungId.startsWith('id:')) {
                const dbId = rechnungId.substring(3);
                query = SupabaseService.client
                    .from('datev_bookings')
                    .update({ dokument_nr: newNr.trim() })
                    .eq('id', dbId);
            } else {
                // Altes Format: partitaIva_dokumentNr
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const oldDokumentNr = dokumentNrParts.join('_');

                query = SupabaseService.client
                    .from('datev_bookings')
                    .update({ dokument_nr: newNr.trim() })
                    .eq('partita_iva', partitaIva);

                // Bei leerer alter Dokumentnummer: NULL oder leerer String
                if (!oldDokumentNr || oldDokumentNr === '') {
                    query = query.or('dokument_nr.is.null,dokument_nr.eq.');
                } else {
                    query = query.eq('dokument_nr', oldDokumentNr);
                }
            }

            const { error } = await query;

            if (error) throw error;

            this.showToast('success', 'Gespeichert', `Rechnungsnr: ${newNr.trim()}`);

            // Cache leeren und neu laden
            await DataManager.clearCache();
            this.loadRechnungen();
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Rechnungsnummer:', error);
            this.showToast('error', 'Fehler', 'Rechnungsnummer konnte nicht gespeichert werden');
        }
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
        document.getElementById('inventar-dateien-vorschau').innerHTML = '';
        this.currentInventarAnhaenge = [];
        this.showModal('inventar-form-modal');
    },

    // Temporärer Speicher für Anhänge des aktuellen Inventar-Eintrags
    currentInventarAnhaenge: [],

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

        // Vorhandene Anhänge anzeigen
        this.currentInventarAnhaenge = i.anhaenge || [];
        this.renderInventarAnhaenge();

        this.showModal('inventar-form-modal');
    },

    renderInventarAnhaenge: function() {
        const container = document.getElementById('inventar-dateien-vorschau');
        if (!container) return;

        if (this.currentInventarAnhaenge.length === 0) {
            container.innerHTML = '<div style="color: #666; font-size: 0.85rem;">Keine Anhänge vorhanden</div>';
            return;
        }

        container.innerHTML = this.currentInventarAnhaenge.map((a, idx) => {
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(a.name);
            const icon = isImage ? Icons.image : (a.name.endsWith('.pdf') ? Icons.document : Icons.attachment);
            return `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 0.3rem;">
                    <span>${icon}</span>
                    <a href="${a.url}" target="_blank" style="flex: 1; color: #2196F3;">${a.name}</a>
                    <button type="button" class="btn btn-sm" style="padding: 0.1rem 0.3rem; color: #e74c3c;"
                            onclick="App.removeInventarAnhang(${idx})" title="Entfernen">${Icons.close}</button>
                </div>
            `;
        }).join('');
    },

    removeInventarAnhang: function(index) {
        this.currentInventarAnhaenge.splice(index, 1);
        this.renderInventarAnhaenge();
    },

    saveInventar: async function(event) {
        event.preventDefault();
        const id = document.getElementById('inventar-form-id').value;

        // Neue Dateien hochladen
        const dateienInput = document.getElementById('inventar-dateien');
        const newFiles = dateienInput.files;

        if (newFiles.length > 0) {
            this.showToast('info', 'Upload', `${newFiles.length} Datei(en) werden hochgeladen...`);

            for (const file of newFiles) {
                try {
                    const inventarId = id || Date.now().toString();
                    const fileName = `inventar/${inventarId}/${Date.now()}_${file.name}`;

                    const { data, error } = await SupabaseService.client.storage
                        .from('documents')
                        .upload(fileName, file);

                    if (error) throw error;

                    // URL generieren
                    const { data: urlData } = SupabaseService.client.storage
                        .from('documents')
                        .getPublicUrl(fileName);

                    this.currentInventarAnhaenge.push({
                        name: file.name,
                        path: fileName,
                        url: urlData.publicUrl,
                        uploadedAt: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Fehler beim Upload:', error);
                    this.showToast('error', 'Upload-Fehler', `Datei ${file.name} konnte nicht hochgeladen werden`);
                }
            }
        }

        const item = {
            id: id ? parseInt(id) : null,
            inventarNr: document.getElementById('inventar-nr').value || null,
            kategorie: document.getElementById('inventar-kategorie').value,
            bezeichnung: document.getElementById('inventar-bezeichnung').value,
            standort: document.getElementById('inventar-standort').value,
            zustand: document.getElementById('inventar-zustand').value,
            anschaffung: document.getElementById('inventar-anschaffung').value,
            wert: parseFloat(document.getElementById('inventar-wert').value) || 0,
            beschreibung: document.getElementById('inventar-beschreibung').value,
            anhaenge: this.currentInventarAnhaenge
        };

        DataManager.saveInventar(item);
        this.hideModal('inventar-form-modal');
        this.loadInventar();
        this.showToast('success', 'Gespeichert', 'Inventar-Eintrag wurde gespeichert');
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

        // Deckungsbeitragsrechnung laden (klassisch)
        this.loadDeckungsbeitrag(jahr);

        // Kosten nach Kategorie laden
        this.loadKostenKategorien(jahr);

        // Neue DB-Projekt-Ansicht laden
        this.loadDeckungsbeitragProjekte();
    },

    // Cache für DB-Ergebnisse
    dbErgebnisseCache: null,

    /**
     * Deckungsbeiträge pro Projekt laden (Supabase-basiert)
     */
    loadDeckungsbeitragProjekte: async function() {
        const jahr = document.getElementById('reporting-jahr')?.value || new Date().getFullYear();
        const tbody = document.getElementById('db-projekte-table-body');
        const tfoot = document.getElementById('db-projekte-table-footer');
        const allgemeinContainer = document.getElementById('db-allgemein-container');

        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;"><span style="color: #3498db;">Berechne Deckungsbeiträge...</span></td></tr>';

        try {
            const startDate = `${jahr}-01-01`;
            const endDate = `${jahr}-12-31`;

            const ergebnisse = await SupabaseDataAdapter.calculateContributionMargins(startDate, endDate);
            this.dbErgebnisseCache = ergebnisse;

            // Tabelle rendern
            tbody.innerHTML = '';

            const projekte = Object.values(ergebnisse.projekte);
            if (projekte.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #666;">Keine Projekte mit Ausstellungsdaten gefunden. Bitte start_date und end_date in den Projekten setzen.</td></tr>';
                return;
            }

            // Sortieren nach DB3 absteigend
            projekte.sort((a, b) => b.db3 - a.db3);

            let sumUmsatz = 0, sumDirekt = 0, sumDb1 = 0, sumStruktur = 0, sumDb2 = 0, sumFix = 0, sumDb3 = 0;

            projekte.forEach(p => {
                sumUmsatz += p.umsatz;
                sumDirekt += p.db1_kosten;
                sumDb1 += p.db1;
                sumStruktur += p.db2_kosten_anteil;
                sumDb2 += p.db2;
                sumFix += p.db3_kosten_anteil;
                sumDb3 += p.db3;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${p.projekt.name}</strong></td>
                    <td style="text-align: center;">${p.tage}</td>
                    <td style="text-align: center;">${(p.anteil * 100).toFixed(1)}%</td>
                    <td style="text-align: right;">${this.formatCurrency(p.umsatz)}</td>
                    <td style="text-align: right; color: #e74c3c;">${this.formatCurrency(p.db1_kosten)}</td>
                    <td style="text-align: right; background: #e3f2fd; font-weight: 500;">${this.formatCurrency(p.db1)}</td>
                    <td style="text-align: right; color: #e74c3c;">${this.formatCurrency(p.db2_kosten_anteil)}</td>
                    <td style="text-align: right; background: #fff3e0; font-weight: 500;">${this.formatCurrency(p.db2)}</td>
                    <td style="text-align: right; color: #e74c3c;">${this.formatCurrency(p.db3_kosten_anteil)}</td>
                    <td style="text-align: right; background: #e8f5e9; font-weight: 600; ${p.db3 < 0 ? 'color: #e74c3c;' : 'color: #27ae60;'}">${this.formatCurrency(p.db3)}</td>
                `;
                tbody.appendChild(row);
            });

            // Footer mit Summen
            if (tfoot) {
                tfoot.innerHTML = `
                    <tr>
                        <td>SUMME</td>
                        <td style="text-align: center;">${ergebnisse.zeitraum.totalDays}</td>
                        <td style="text-align: center;">100%</td>
                        <td style="text-align: right;">${this.formatCurrency(sumUmsatz)}</td>
                        <td style="text-align: right;">${this.formatCurrency(sumDirekt)}</td>
                        <td style="text-align: right; background: #e3f2fd;">${this.formatCurrency(sumDb1)}</td>
                        <td style="text-align: right;">${this.formatCurrency(sumStruktur)}</td>
                        <td style="text-align: right; background: #fff3e0;">${this.formatCurrency(sumDb2)}</td>
                        <td style="text-align: right;">${this.formatCurrency(sumFix)}</td>
                        <td style="text-align: right; background: #e8f5e9;">${this.formatCurrency(sumDb3)}</td>
                    </tr>
                `;
            }

            // Nicht-projektbezogene Einnahmen anzeigen
            if (allgemeinContainer) {
                const allgUmsatz = ergebnisse.nichtProjektbezogen.umsatz || 0;
                const allgKosten = ergebnisse.nichtProjektbezogen.kosten || 0;
                const gesamtDb3 = ergebnisse.gesamt.db3 || 0;

                allgemeinContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                            <div style="font-size: 0.875rem; color: #666;">Allg. Einnahmen</div>
                            <div style="font-size: 1.25rem; font-weight: 600;">${this.formatCurrency(allgUmsatz)}</div>
                            <div style="font-size: 0.75rem; color: #999;">Mitgliedsbeiträge, Förderungen ohne Projektzuordnung</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                            <div style="font-size: 0.875rem; color: #666;">Allg. Kosten</div>
                            <div style="font-size: 1.25rem; font-weight: 600;">${this.formatCurrency(allgKosten)}</div>
                            <div style="font-size: 0.75rem; color: #999;">Kosten ohne Projektzuordnung</div>
                        </div>
                        <div style="background: ${gesamtDb3 >= 0 ? '#d4edda' : '#f8d7da'}; padding: 1rem; border-radius: 8px;">
                            <div style="font-size: 0.875rem; color: #666;">Gesamt-DB3 (alle Projekte)</div>
                            <div style="font-size: 1.25rem; font-weight: 600; color: ${gesamtDb3 >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatCurrency(gesamtDb3)}</div>
                            <div style="font-size: 0.75rem; color: #999;">Nach Abzug aller Gemeinkosten</div>
                        </div>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Fehler bei Deckungsbeitragsberechnung:', error);
            tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #e74c3c;">
                Fehler: ${error.message}<br>
                <small>Bitte prüfen Sie, ob die chart_of_accounts Tabelle existiert (Migration ausführen).</small>
            </td></tr>`;
        }
    },

    /**
     * DB-Ergebnisse als CSV exportieren
     */
    exportDbCsv: function() {
        if (!this.dbErgebnisseCache) {
            alert('Bitte zuerst die Berechnung starten (Aktualisieren klicken).');
            return;
        }

        const ergebnisse = this.dbErgebnisseCache;
        let csv = '\uFEFF'; // BOM für Excel
        csv += 'Projekt;Tage;Anteil;Umsatz;Direkte Kosten;DB1;Strukturkosten;DB2;Fixkosten;DB3\n';

        Object.values(ergebnisse.projekte).forEach(p => {
            csv += `"${p.projekt.name}";${p.tage};${(p.anteil * 100).toFixed(1)}%;${p.umsatz.toFixed(2)};${p.db1_kosten.toFixed(2)};${p.db1.toFixed(2)};${p.db2_kosten_anteil.toFixed(2)};${p.db2.toFixed(2)};${p.db3_kosten_anteil.toFixed(2)};${p.db3.toFixed(2)}\n`;
        });

        // Summenzeile
        const g = ergebnisse.gesamt;
        csv += `"SUMME";${ergebnisse.zeitraum.totalDays};100%;${g.umsatz.toFixed(2)};${g.db1_kosten.toFixed(2)};${g.db1.toFixed(2)};${g.db2_kosten.toFixed(2)};${g.db2.toFixed(2)};${g.db3_kosten.toFixed(2)};${g.db3.toFixed(2)}\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Deckungsbeitraege_${ergebnisse.zeitraum.startDate.substring(0, 4)}.csv`;
        link.click();
    },

    // ==========================================
    // KONTENPLAN REPORT - Kosten ohne Kostenstelle
    // ==========================================

    // Cache für Kontenplan-Bezeichnungen (DE/IT)
    kontenplanBezeichnungen: {},

    /**
     * Kontenplan-Report laden - zeigt Kosten ohne Projekt-Zuweisung
     */
    loadKontenplanReport: async function() {
        const tbody = document.getElementById('kontenplan-report-body');
        const tfoot = document.getElementById('kontenplan-report-footer');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="loading"></span> Lade Daten...</td></tr>';

        try {
            const jahr = parseInt(document.getElementById('reporting-jahr').value) || new Date().getFullYear();
            const vorjahr = jahr - 1;
            const nurMitBuchungen = document.getElementById('kontenplan-nur-mit-buchungen')?.checked ?? true;

            // Buchungen ohne Kostenstelle für aktuelles Jahr und Vorjahr laden
            const [buchungenAktuell, buchungenVorjahr] = await Promise.all([
                this.getBuchungenOhneKostenstelle(jahr),
                this.getBuchungenOhneKostenstelle(vorjahr)
            ]);

            // Nach Konto gruppieren
            const kontenAktuell = this.gruppiereNachKonto(buchungenAktuell);
            const kontenVorjahr = this.gruppiereNachKonto(buchungenVorjahr);

            // Alle Konten sammeln
            const alleKonten = new Set([...Object.keys(kontenAktuell), ...Object.keys(kontenVorjahr)]);

            // Kontenplan-Bezeichnungen laden (falls noch nicht geladen)
            if (Object.keys(this.kontenplanBezeichnungen).length === 0) {
                await this.ladeKontenplanBezeichnungen();
            }

            // Sortieren nach Kontonummer
            const sortierteKonten = Array.from(alleKonten).sort((a, b) => a.localeCompare(b));

            tbody.innerHTML = '';
            let summeAktuell = 0;
            let summeVorjahr = 0;
            let anzahlGesamt = 0;

            sortierteKonten.forEach(konto => {
                const aktuell = kontenAktuell[konto] || { summe: 0, anzahl: 0 };
                const vorjahrData = kontenVorjahr[konto] || { summe: 0, anzahl: 0 };

                // Filter: nur Konten mit Buchungen anzeigen
                if (nurMitBuchungen && aktuell.anzahl === 0 && vorjahrData.anzahl === 0) {
                    return;
                }

                const differenz = aktuell.summe - vorjahrData.summe;
                const bezeichnung = this.kontenplanBezeichnungen[konto] || {};

                summeAktuell += aktuell.summe;
                summeVorjahr += vorjahrData.summe;
                anzahlGesamt += aktuell.anzahl;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${konto}</strong></td>
                    <td>${bezeichnung.de || '-'}</td>
                    <td style="color: #666; font-style: italic;">${bezeichnung.it || '-'}</td>
                    <td style="text-align: right;">${this.formatCurrency(aktuell.summe)}</td>
                    <td style="text-align: right; color: #666;">${this.formatCurrency(vorjahrData.summe)}</td>
                    <td style="text-align: right; color: ${differenz >= 0 ? '#e74c3c' : '#27ae60'};">
                        ${differenz >= 0 ? '+' : ''}${this.formatCurrency(differenz)}
                    </td>
                    <td style="text-align: center;">${aktuell.anzahl}</td>
                `;
                row.style.cursor = 'pointer';
                row.onclick = () => this.zeigeBuchungenFuerKonto(konto, jahr);
                tbody.appendChild(row);
            });

            if (sortierteKonten.length === 0 || tbody.children.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">Keine Buchungen ohne Kostenstelle gefunden</td></tr>';
            }

            // Footer mit Summen
            const summeDiff = summeAktuell - summeVorjahr;
            tfoot.innerHTML = `
                <tr>
                    <td colspan="3">SUMME (${tbody.children.length} Konten)</td>
                    <td style="text-align: right;">${this.formatCurrency(summeAktuell)}</td>
                    <td style="text-align: right;">${this.formatCurrency(summeVorjahr)}</td>
                    <td style="text-align: right; color: ${summeDiff >= 0 ? '#e74c3c' : '#27ae60'};">
                        ${summeDiff >= 0 ? '+' : ''}${this.formatCurrency(summeDiff)}
                    </td>
                    <td style="text-align: center;">${anzahlGesamt}</td>
                </tr>
            `;

            // Cache für Export speichern
            this.kontenplanReportCache = {
                jahr,
                vorjahr,
                kontenAktuell,
                kontenVorjahr,
                summeAktuell,
                summeVorjahr
            };

        } catch (error) {
            console.error('Fehler beim Laden des Kontenplan-Reports:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #e74c3c;">Fehler: ${error.message}</td></tr>`;
        }
    },

    /**
     * Buchungen ohne Kostenstelle für ein Jahr laden
     */
    getBuchungenOhneKostenstelle: async function(jahr) {
        try {
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('konto_nr, betrag, datum, fornitore_name, dokument_nr')
                .eq('import_year', jahr)
                .or('projekt_id.is.null,projekt_id.eq.')
                .order('konto_nr', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
            return [];
        }
    },

    /**
     * Buchungen nach Konto gruppieren
     */
    gruppiereNachKonto: function(buchungen) {
        const gruppen = {};
        buchungen.forEach(b => {
            const konto = b.konto_nr || 'OHNE_KONTO';
            if (!gruppen[konto]) {
                gruppen[konto] = { summe: 0, anzahl: 0, buchungen: [] };
            }
            gruppen[konto].summe += parseFloat(b.betrag) || 0;
            gruppen[konto].anzahl++;
            gruppen[konto].buchungen.push(b);
        });
        return gruppen;
    },

    /**
     * Kontenplan-Bezeichnungen aus konto_bezeichnungen Tabelle laden
     */
    ladeKontenplanBezeichnungen: async function() {
        try {
            // Aus konto_bezeichnungen Tabelle laden (DATEV Kontenplan)
            const { data, error } = await SupabaseService.client
                .from('konto_bezeichnungen')
                .select('konto_nr, beschreibung_de, beschreibung_it');

            if (!error && data) {
                data.forEach(row => {
                    this.kontenplanBezeichnungen[row.konto_nr] = {
                        de: row.beschreibung_de || '',
                        it: row.beschreibung_it || ''
                    };
                });
                console.log(`${data.length} Kontenbezeichnungen geladen`);
            }

            // Fallback: Standard-Bezeichnungen
            if (Object.keys(this.kontenplanBezeichnungen).length === 0) {
                this.ergaenzeStandardKontenbezeichnungen();
            }

        } catch (error) {
            console.error('Fehler beim Laden der Kontenbezeichnungen:', error);
            this.ergaenzeStandardKontenbezeichnungen();
        }
    },

    /**
     * Standard-Kontenbezeichnungen für gängige DATEV-Konten
     */
    ergaenzeStandardKontenbezeichnungen: function() {
        const standard = {
            '6001': { de: 'Erlöse Lieferungen/Leistungen', it: 'Ricavi consegne/prestazioni' },
            '6400': { de: 'Sonstige betriebliche Erträge', it: 'Altri proventi operativi' },
            '6401': { de: 'Zuschüsse und Beiträge', it: 'Sovvenzioni e contributi' },
            '680': { de: 'Materialkosten', it: 'Costi materiali' },
            '690': { de: 'Dienstleistungen', it: 'Servizi' },
            '6901': { de: 'Verwaltung', it: 'Amministrazione' },
            '6902': { de: 'Werbung/Marketing', it: 'Pubblicità/Marketing' },
            '700': { de: 'Miete/Strukturen', it: 'Affitto/Strutture' },
            '710': { de: 'Personalkosten', it: 'Costi del personale' },
            '720': { de: 'Abschreibungen', it: 'Ammortamenti' },
            '850': { de: 'Zinsen', it: 'Interessi' }
        };

        // Nur hinzufügen wenn nicht bereits vorhanden
        Object.keys(standard).forEach(konto => {
            if (!this.kontenplanBezeichnungen[konto]) {
                this.kontenplanBezeichnungen[konto] = standard[konto];
            }
        });
    },

    /**
     * Zeigt Detail-Buchungen für ein Konto
     */
    zeigeBuchungenFuerKonto: function(konto, jahr) {
        if (!this.kontenplanReportCache) return;

        const kontoData = this.kontenplanReportCache.kontenAktuell[konto];
        if (!kontoData || !kontoData.buchungen) return;

        const bezeichnung = this.kontenplanBezeichnungen[konto] || {};
        let html = `
            <h3>Konto ${konto}: ${bezeichnung.de || 'Unbekannt'}</h3>
            <p style="color: #666;">${bezeichnung.it || ''}</p>
            <table style="width: 100%; margin-top: 1rem;">
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Lieferant</th>
                        <th>Beleg-Nr.</th>
                        <th style="text-align: right;">Betrag</th>
                    </tr>
                </thead>
                <tbody>
        `;

        kontoData.buchungen.forEach(b => {
            html += `
                <tr>
                    <td>${this.formatDate(b.datum)}</td>
                    <td>${b.fornitore_name || '-'}</td>
                    <td>${b.dokument_nr || '-'}</td>
                    <td style="text-align: right;">${this.formatCurrency(b.betrag)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background: #f5f5f5;">
                        <td colspan="3">Summe (${kontoData.anzahl} Buchungen)</td>
                        <td style="text-align: right;">${this.formatCurrency(kontoData.summe)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        // Einfaches Modal anzeigen
        alert(`Konto ${konto}: ${kontoData.anzahl} Buchungen, Summe: ${this.formatCurrency(kontoData.summe)}\n\nDetails werden in Konsole ausgegeben.`);
        console.log('Buchungen für Konto ' + konto + ':', kontoData.buchungen);
    },

    /**
     * Kontenplan-Report als CSV exportieren
     */
    exportKontenplanCsv: function() {
        if (!this.kontenplanReportCache) {
            alert('Bitte zuerst den Report laden (Aktualisieren klicken).');
            return;
        }

        const cache = this.kontenplanReportCache;
        let csv = '\uFEFF'; // BOM für Excel
        csv += `Kontenplan - Kosten ohne Kostenstelle\n`;
        csv += `Jahr: ${cache.jahr} vs. Vorjahr: ${cache.vorjahr}\n\n`;
        csv += 'Konto;Bezeichnung (DE);Bezeichnung (IT);Aktuelles Jahr;Vorjahr;Differenz;Anzahl Buchungen\n';

        const alleKonten = new Set([...Object.keys(cache.kontenAktuell), ...Object.keys(cache.kontenVorjahr)]);
        const sortiert = Array.from(alleKonten).sort();

        sortiert.forEach(konto => {
            const aktuell = cache.kontenAktuell[konto] || { summe: 0, anzahl: 0 };
            const vorjahr = cache.kontenVorjahr[konto] || { summe: 0, anzahl: 0 };
            const diff = aktuell.summe - vorjahr.summe;
            const bez = this.kontenplanBezeichnungen[konto] || {};

            csv += `"${konto}";"${bez.de || ''}";"${bez.it || ''}";${aktuell.summe.toFixed(2)};${vorjahr.summe.toFixed(2)};${diff.toFixed(2)};${aktuell.anzahl}\n`;
        });

        csv += `\n"SUMME";"";"";"${cache.summeAktuell.toFixed(2)}";"${cache.summeVorjahr.toFixed(2)}";"${(cache.summeAktuell - cache.summeVorjahr).toFixed(2)}";\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Kontenplan_ohne_Kostenstelle_${cache.jahr}.csv`;
        link.click();
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

    loadEinnahmen: async function() {
        const jahr = parseInt(document.getElementById('einnahmen-filter-jahr')?.value || new Date().getFullYear());
        const vorjahr = jahr - 1;

        try {
            // Lade Funding Sources aus Supabase für aktuelles Jahr
            const fundingSources = await DataManager.getFundingSources(jahr);

            // Lade Vorjahresdaten
            const vorjahrSources = await DataManager.getFundingSources(vorjahr);

            // Berechne Ausgaben für jede Funding Source und füge Vorjahresdaten hinzu
            for (const fs of fundingSources) {
                const expenses = await DataManager.getFundingSourceExpenses(fs.id);
                fs.ausgaben = expenses.totalBrutto;
                fs.rechnungenCount = expenses.count;
                fs.verfuegbar = fs.amount - expenses.totalBrutto;

                // Vorjahreswert suchen (über Code oder Name matchen)
                const vorjahrMatch = vorjahrSources.find(v =>
                    v.code === fs.code || v.name === fs.name
                );
                fs.vorjahr = vorjahrMatch ? vorjahrMatch.amount : 0;

                // Prozentuale Änderung berechnen
                if (fs.vorjahr > 0) {
                    fs.prozent = ((fs.amount - fs.vorjahr) / fs.vorjahr) * 100;
                } else if (fs.amount > 0) {
                    fs.prozent = 100; // Neu im aktuellen Jahr
                } else {
                    fs.prozent = null;
                }
            }

            // Vorjahres-Spaltenüberschrift aktualisieren
            const thVorjahr = document.getElementById('th-einnahmen-vorjahr');
            if (thVorjahr) thVorjahr.textContent = vorjahr;

            // Summary aktualisieren
            const totalBudget = fundingSources.reduce((sum, fs) => sum + fs.amount, 0);
            const totalAusgaben = fundingSources.reduce((sum, fs) => sum + (fs.ausgaben || 0), 0);
            const zugesagt = fundingSources.filter(fs => fs.status === 'zugesagt' || fs.status === 'eingegangen')
                                          .reduce((sum, fs) => sum + fs.amount, 0);
            const offen = fundingSources.filter(fs => fs.status === 'offen' || fs.status === 'beantragt')
                                       .reduce((sum, fs) => sum + fs.amount, 0);

            document.getElementById('einnahmen-bestaetigt').textContent = this.formatCurrency(zugesagt);
            document.getElementById('einnahmen-erwartet').textContent = this.formatCurrency(offen);
            document.getElementById('einnahmen-unsicher').textContent = this.formatCurrency(totalAusgaben);
            document.getElementById('einnahmen-gesamt').textContent = this.formatCurrency(totalBudget);

            // Labels anpassen
            document.querySelector('#einnahmen-bestaetigt + .stat-label').textContent = 'Zugesagt';
            document.querySelector('#einnahmen-erwartet + .stat-label').textContent = 'Offen/Beantragt';
            document.querySelector('#einnahmen-unsicher + .stat-label').textContent = 'Ausgaben';
            document.querySelector('#einnahmen-gesamt + .stat-label').textContent = 'Budget Gesamt';

            this.allEinnahmen = fundingSources;
            this.einnahmenSelectedYear = jahr;
            this.filterEinnahmen();
        } catch (error) {
            console.error('Fehler beim Laden der Einnahmen:', error);
            this.showToast('error', 'Fehler', 'Einnahmen konnten nicht geladen werden');
        }
    },

    filterEinnahmen: function() {
        const status = document.getElementById('einnahmen-filter-status')?.value || '';
        const typ = document.getElementById('einnahmen-filter-typ')?.value || '';

        let filtered = this.allEinnahmen || [];

        if (status) {
            filtered = filtered.filter(e => e.status === status);
        }

        if (typ) {
            filtered = filtered.filter(e => e.type === typ);
        }

        this.renderEinnahmenTable(filtered);
    },

    renderEinnahmenTable: function(einnahmen) {
        const tbody = document.getElementById('einnahmen-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        let summeBudget = 0, summeAusgaben = 0, summeVerfuegbar = 0, summeVorjahr = 0;

        const statusColors = {
            'zugesagt': '#27ae60',
            'eingegangen': '#27ae60',
            'beantragt': '#f39c12',
            'offen': '#95a5a6',
            'abgelehnt': '#e74c3c'
        };

        const statusLabels = {
            'zugesagt': 'Zugesagt',
            'eingegangen': 'Eingegangen',
            'beantragt': 'Beantragt',
            'offen': 'Offen',
            'abgelehnt': 'Abgelehnt'
        };

        einnahmen.forEach(e => {
            summeBudget += e.amount || 0;
            summeAusgaben += e.ausgaben || 0;
            summeVerfuegbar += e.verfuegbar || 0;
            summeVorjahr += e.vorjahr || 0;

            const verfuegbarStyle = e.verfuegbar < 0 ? 'color: #e74c3c; font-weight: bold;' : '';

            // Vorjahresvergleich Formatierung
            let prozentDisplay = '-';
            let prozentStyle = '';
            if (e.vorjahr && e.vorjahr > 0) {
                const prozent = e.prozent || 0;
                if (prozent > 0) {
                    prozentDisplay = `+${prozent.toFixed(1)}%`;
                    prozentStyle = 'color: #27ae60;';
                } else if (prozent < 0) {
                    prozentDisplay = `${prozent.toFixed(1)}%`;
                    prozentStyle = 'color: #e74c3c;';
                } else {
                    prozentDisplay = '0%';
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${e.code}</strong></td>
                <td>
                    <div>${e.name}</div>
                    ${e.source ? `<small style="color: #666;">${e.source}</small>` : ''}
                </td>
                <td style="text-align: right;">${this.formatCurrency(e.amount)}</td>
                <td style="text-align: right; color: #666;">${e.vorjahr ? this.formatCurrency(e.vorjahr) : '-'}</td>
                <td style="text-align: right; ${prozentStyle}">${prozentDisplay}</td>
                <td style="text-align: right;">${e.ausgaben ? this.formatCurrency(e.ausgaben) : '-'}
                    ${e.rechnungenCount ? `<br><small style="color: #666;">${e.rechnungenCount} Rechnungen</small>` : ''}
                </td>
                <td style="text-align: right; ${verfuegbarStyle}">${this.formatCurrency(e.verfuegbar || e.amount)}</td>
                <td>
                    <span style="background: ${statusColors[e.status] || '#95a5a6'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                        ${statusLabels[e.status] || e.status}
                    </span>
                </td>
                <td style="text-align: center;">
                    ${e.is_abgabestelle ?
                        '<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Aktiv</span>' :
                        '<span style="color: #ccc;">-</span>'}
                </td>
                <td style="text-align: center;">
                    ${e.document_path ?
                        `<button class="btn btn-outline btn-sm" onclick="App.showFundingDocument('${e.id}')" title="Dokument anzeigen">${Icons.document}</button>` :
                        '<span style="color: #ccc;">-</span>'}
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-outline btn-sm" onclick="App.editEinnahme('${e.id}')">${Icons.edit}</button>
                        <button class="btn btn-outline btn-sm" onclick="App.deleteEinnahme('${e.id}')" style="color: #e74c3c;">${Icons.delete}</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Summen aktualisieren
        document.getElementById('einnahmen-summe-budget').textContent = this.formatCurrency(summeBudget);
        document.getElementById('einnahmen-summe-ausgaben').textContent = this.formatCurrency(summeAusgaben);
        document.getElementById('einnahmen-summe-verfuegbar').textContent = this.formatCurrency(summeVerfuegbar);

        // Vorjahr Summen
        const summeVorjahrEl = document.getElementById('einnahmen-summe-vorjahr');
        const summeProzentEl = document.getElementById('einnahmen-summe-prozent');
        if (summeVorjahrEl) {
            summeVorjahrEl.textContent = this.formatCurrency(summeVorjahr);
        }
        if (summeProzentEl && summeVorjahr > 0) {
            const gesamtProzent = ((summeBudget - summeVorjahr) / summeVorjahr) * 100;
            if (gesamtProzent > 0) {
                summeProzentEl.textContent = `+${gesamtProzent.toFixed(1)}%`;
                summeProzentEl.style.color = '#27ae60';
            } else if (gesamtProzent < 0) {
                summeProzentEl.textContent = `${gesamtProzent.toFixed(1)}%`;
                summeProzentEl.style.color = '#e74c3c';
            } else {
                summeProzentEl.textContent = '0%';
                summeProzentEl.style.color = '';
            }
        } else if (summeProzentEl) {
            summeProzentEl.textContent = '-';
            summeProzentEl.style.color = '';
        }
    },

    showNewEinnahmeForm: function() {
        const modal = document.getElementById('einnahme-form-modal');
        if (!modal) {
            console.error('Modal einnahme-form-modal nicht gefunden');
            return;
        }

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
        const setChk = (id, chk) => { const el = document.getElementById(id); if (el) el.checked = chk; };

        setTxt('einnahme-modal-title', 'Neue Einnahme');
        setVal('einnahme-id', '');
        setVal('einnahme-code', '');
        setVal('einnahme-name', '');
        setVal('einnahme-quelle', '');
        setVal('einnahme-jahr', new Date().getFullYear());
        setVal('einnahme-betrag', '');
        setVal('einnahme-status', 'offen');
        setChk('einnahme-abgabestelle', false);
        setVal('einnahme-dokument', '');
        setHtml('einnahme-dokument-vorschau', '');
        setVal('einnahme-notizen', '');

        // Generiere automatisch den nächsten Code
        this.generateNextEinnahmeCode();

        this.showModal('einnahme-form-modal');
    },

    generateNextEinnahmeCode: async function() {
        const jahr = document.getElementById('einnahme-jahr').value;
        const fundingSources = await DataManager.getFundingSources(parseInt(jahr));

        // Finde höchste Nummer
        let maxNum = 0;
        fundingSources.forEach(fs => {
            const match = fs.code.match(new RegExp(`^${jahr}-(\\d+)$`));
            if (match) {
                maxNum = Math.max(maxNum, parseInt(match[1]));
            }
        });

        document.getElementById('einnahme-code').value = `${jahr}-${String(maxNum + 1).padStart(2, '0')}`;
    },

    editEinnahme: async function(id) {
        try {
            const fs = await DataManager.getFundingSourceById(id);
            if (!fs) {
                alert('Einnahme nicht gefunden');
                return;
            }

            document.getElementById('einnahme-modal-title').textContent = 'Einnahme bearbeiten';
            document.getElementById('einnahme-id').value = fs.id;
            document.getElementById('einnahme-code').value = fs.code || '';
            document.getElementById('einnahme-name').value = fs.name || '';
            document.getElementById('einnahme-quelle').value = fs.source || '';
            document.getElementById('einnahme-jahr').value = fs.year || new Date().getFullYear();
            document.getElementById('einnahme-betrag').value = fs.amount || '';
            document.getElementById('einnahme-status').value = fs.status || 'offen';
            document.getElementById('einnahme-abgabestelle').checked = fs.isAbgabestelle || false;
            document.getElementById('einnahme-notizen').value = fs.notes || '';
            document.getElementById('einnahme-dokument').value = '';

            // Dokumentvorschau
            const vorschau = document.getElementById('einnahme-dokument-vorschau');
            if (fs.document_path) {
                vorschau.innerHTML = `<div style="padding: 0.5rem; background: #e8f4fd; border-radius: 4px;">
                    ${Icons.document} <strong>Dokument hinterlegt</strong>
                    <button type="button" class="btn btn-outline btn-sm" onclick="App.showFundingSourceDocument('${fs.id}')" style="margin-left: 0.5rem;">Anzeigen</button>
                </div>`;
            } else {
                vorschau.innerHTML = '';
            }

            this.showModal('einnahme-form-modal');
        } catch (error) {
            console.error('Fehler beim Laden der Einnahme:', error);
            alert('Fehler beim Laden: ' + error.message);
        }
    },

    async saveEinnahme(event) {
        event.preventDefault();

        const id = document.getElementById('einnahme-id').value;
        const fundingSource = {
            code: document.getElementById('einnahme-code').value,
            name: document.getElementById('einnahme-name').value,
            source: document.getElementById('einnahme-quelle').value,
            year: parseInt(document.getElementById('einnahme-jahr').value),
            amount: parseFloat(document.getElementById('einnahme-betrag').value) || 0,
            status: document.getElementById('einnahme-status').value,
            isAbgabestelle: document.getElementById('einnahme-abgabestelle').checked,
            notes: document.getElementById('einnahme-notizen').value
        };

        try {
            let saved;
            if (id) {
                // Update
                saved = await DataManager.updateFundingSource(id, fundingSource);
            } else {
                // Insert
                saved = await DataManager.addFundingSource(fundingSource);
            }

            // Dokument hochladen falls vorhanden
            const fileInput = document.getElementById('einnahme-dokument');
            if (fileInput.files.length > 0 && saved) {
                // TODO: Dokument zu Supabase Storage hochladen
                // Für jetzt speichern wir nur den Pfad
                console.log('Dokument-Upload noch nicht implementiert');
            }

            this.hideModal('einnahme-form-modal');
            await this.loadEinnahmen();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern: ' + error.message);
        }
    },

    deleteEinnahme: async function(id) {
        if (confirm('Einnahme wirklich löschen? Verknüpfte Rechnungen werden von dieser Abgabestelle entfernt.')) {
            try {
                await DataManager.deleteFundingSource(id);
                await this.loadEinnahmen();
            } catch (error) {
                console.error('Fehler beim Löschen:', error);
                alert('Fehler beim Löschen: ' + error.message);
            }
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
                        <p style="font-size: 48px;"><img src="icons/01-document.svg" alt="" style="width: 48px; height: 48px;"></p>
                        <p><strong>${dok.name}</strong></p>
                        <p>${(dok.size / 1024).toFixed(1)} KB</p>
                        <a href="${dok.data}" download="${dok.name}" style="color: #3498db;">Herunterladen</a>
                    </div>
                </div>
            `;
        }

        this.showModal('dokument-preview-modal');
    },

    exportEinnahmenCSV: async function() {
        const jahr = document.getElementById('einnahmen-filter-jahr')?.value || new Date().getFullYear();

        try {
            const fundingSources = await DataManager.getFundingSources(parseInt(jahr));

            let csv = '\uFEFF';
            csv += 'Code;Name;Geldgeber;Jahr;Budget;Status;Abgabestelle;Notizen\n';

            fundingSources.forEach(fs => {
                csv += `"${fs.code}";"${fs.name}";"${fs.source || ''}";"${fs.year}";"${fs.amount}";"${fs.status}";"${fs.is_abgabestelle ? 'Ja' : 'Nein'}";"${fs.notes || ''}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Einnahmen_${jahr}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error('Fehler beim Export:', error);
            alert('Fehler beim Export: ' + error.message);
        }
    },

    // ==========================================
    // MITGLIEDER-VERWALTUNG
    // ==========================================

    membersData: [],
    memberPaymentsData: [],
    filteredMembers: [],
    memberImportData: null,

    loadMembers: async function() {
        const year = parseInt(document.getElementById('members-filter-year')?.value || new Date().getFullYear());
        document.getElementById('members-year-label').textContent = year;

        try {
            // Mitglieder laden
            this.membersData = await DataManager.getMembers(true);

            // Zahlungen für das Jahr laden
            this.memberPaymentsData = await DataManager.getMemberPaymentsByYear(year);

            // Zahlungs-Map erstellen (member_id -> payment)
            const paymentMap = new Map();
            this.memberPaymentsData.forEach(p => {
                paymentMap.set(p.member_id, p);
            });

            // Mitglieder mit Zahlungsstatus anreichern
            this.membersData = this.membersData.map(m => {
                const payment = paymentMap.get(m.id);
                return {
                    ...m,
                    payment: payment || null,
                    isPaid: !!payment
                };
            });

            // Statistiken berechnen
            const totalMembers = this.membersData.length;
            const paidMembers = this.membersData.filter(m => m.isPaid).length;
            const unpaidMembers = totalMembers - paidMembers;
            const totalAmount = this.memberPaymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            document.getElementById('members-total').textContent = totalMembers;
            document.getElementById('members-paid').textContent = paidMembers;
            document.getElementById('members-unpaid').textContent = unpaidMembers;
            document.getElementById('members-amount').textContent = this.formatCurrency(totalAmount);

            this.filterMembers();
        } catch (error) {
            console.error('Fehler beim Laden der Mitglieder:', error);
            this.showToast('error', 'Fehler', 'Mitglieder konnten nicht geladen werden');
        }
    },

    filterMembers: function() {
        const paidFilter = document.getElementById('members-filter-paid')?.value || '';
        const searchFilter = (document.getElementById('members-filter-search')?.value || '').toLowerCase();

        this.filteredMembers = this.membersData.filter(m => {
            // Zahlungsstatus-Filter
            if (paidFilter === 'paid' && !m.isPaid) return false;
            if (paidFilter === 'unpaid' && m.isPaid) return false;

            // Suche
            if (searchFilter) {
                const searchStr = `${m.last_name} ${m.first_name} ${m.email || ''} ${m.city || ''}`.toLowerCase();
                if (!searchStr.includes(searchFilter)) return false;
            }

            return true;
        });

        this.renderMembersTable();
    },

    renderMembersTable: function() {
        const tbody = document.getElementById('members-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #666; padding: 2rem;">Keine Mitglieder gefunden</td></tr>';
            return;
        }

        this.filteredMembers.forEach((m, index) => {
            const tr = document.createElement('tr');

            const paidBadge = m.isPaid
                ? '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Bezahlt</span>'
                : '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Offen</span>';

            const paymentDate = m.payment?.payment_date ? this.formatDate(m.payment.payment_date) : '-';
            const datevBuchung = m.payment?.datev_buchungstext
                ? `<span title="${m.payment.datev_buchungstext}" style="max-width: 150px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.payment.datev_buchungstext}</span>`
                : '-';

            tr.innerHTML = `
                <td>${m.member_number || index + 1}</td>
                <td><strong>${m.last_name}</strong></td>
                <td>${m.first_name || ''}</td>
                <td>${m.city || ''}</td>
                <td>${m.email ? `<a href="mailto:${m.email}">${m.email}</a>` : '-'}</td>
                <td style="text-align: right;">${this.formatCurrency(m.membership_fee || 0)}</td>
                <td style="text-align: center;">${paidBadge}</td>
                <td>${paymentDate}</td>
                <td>${datevBuchung}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${!m.isPaid ? `<button class="btn btn-sm btn-success" onclick="App.showPaymentModal('${m.id}')" title="Zahlung zuweisen">€</button>` : ''}
                        ${m.isPaid ? `<button class="btn btn-sm btn-outline" onclick="App.removeMemberPayment('${m.id}')" title="Zahlung entfernen" style="color: #e74c3c;">${Icons.close}</button>` : ''}
                        <button class="btn btn-sm btn-outline" onclick="App.editMember('${m.id}')" title="Bearbeiten">${Icons.edit}</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    showNewMemberForm: function() {
        document.getElementById('member-modal-title').textContent = 'Neues Mitglied';
        document.getElementById('member-id').value = '';
        document.getElementById('member-last-name').value = '';
        document.getElementById('member-first-name').value = '';
        document.getElementById('member-gender').value = '';
        document.getElementById('member-language').value = '';
        document.getElementById('member-birth-year').value = '';
        document.getElementById('member-address').value = '';
        document.getElementById('member-postal-code').value = '';
        document.getElementById('member-city').value = '';
        document.getElementById('member-email').value = '';
        document.getElementById('member-phone').value = '';
        document.getElementById('member-tax-number').value = '';
        document.getElementById('member-fee').value = '';
        document.getElementById('member-donation').value = '';
        document.getElementById('member-join-date').value = '';
        document.getElementById('member-payment-method').value = '';
        document.getElementById('member-hashtag').value = '';
        document.getElementById('member-notes').value = '';
        document.getElementById('member-active').checked = true;

        this.showModal('member-form-modal');
    },

    editMember: async function(id) {
        try {
            const member = await DataManager.getMemberById(id);
            if (!member) {
                alert('Mitglied nicht gefunden');
                return;
            }

            document.getElementById('member-modal-title').textContent = 'Mitglied bearbeiten';
            document.getElementById('member-id').value = member.id;
            document.getElementById('member-last-name').value = member.last_name || '';
            document.getElementById('member-first-name').value = member.first_name || '';
            document.getElementById('member-gender').value = member.gender || '';
            document.getElementById('member-language').value = member.language || '';
            document.getElementById('member-birth-year').value = member.birth_year || '';
            document.getElementById('member-address').value = member.address || '';
            document.getElementById('member-postal-code').value = member.postal_code || '';
            document.getElementById('member-city').value = member.city || '';
            document.getElementById('member-email').value = member.email || '';
            document.getElementById('member-phone').value = member.phone || '';
            document.getElementById('member-tax-number').value = member.tax_number || '';
            document.getElementById('member-fee').value = member.membership_fee || '';
            document.getElementById('member-donation').value = member.donation || '';
            document.getElementById('member-join-date').value = member.join_date || '';
            document.getElementById('member-payment-method').value = member.payment_method || '';
            document.getElementById('member-hashtag').value = member.hashtag || '';
            document.getElementById('member-notes').value = member.notes || '';
            document.getElementById('member-active').checked = member.is_active !== false;

            this.showModal('member-form-modal');
        } catch (error) {
            console.error('Fehler beim Laden des Mitglieds:', error);
            alert('Fehler: ' + error.message);
        }
    },

    saveMember: async function(event) {
        event.preventDefault();

        const id = document.getElementById('member-id').value;
        const memberData = {
            last_name: document.getElementById('member-last-name').value,
            first_name: document.getElementById('member-first-name').value,
            gender: document.getElementById('member-gender').value || null,
            language: document.getElementById('member-language').value || null,
            birth_year: document.getElementById('member-birth-year').value ? parseInt(document.getElementById('member-birth-year').value) : null,
            address: document.getElementById('member-address').value || null,
            postal_code: document.getElementById('member-postal-code').value || null,
            city: document.getElementById('member-city').value || null,
            email: document.getElementById('member-email').value || null,
            phone: document.getElementById('member-phone').value || null,
            tax_number: document.getElementById('member-tax-number').value || null,
            membership_fee: parseFloat(document.getElementById('member-fee').value) || 0,
            donation: parseFloat(document.getElementById('member-donation').value) || 0,
            join_date: document.getElementById('member-join-date').value || null,
            payment_method: document.getElementById('member-payment-method').value || null,
            hashtag: document.getElementById('member-hashtag').value || null,
            notes: document.getElementById('member-notes').value || null,
            is_active: document.getElementById('member-active').checked
        };

        try {
            if (id) {
                await DataManager.updateMember(id, memberData);
                this.showToast('success', 'Gespeichert', 'Mitglied wurde aktualisiert');
            } else {
                await DataManager.addMember(memberData);
                this.showToast('success', 'Erstellt', 'Neues Mitglied wurde angelegt');
            }

            this.hideModal('member-form-modal');
            await this.loadMembers();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler: ' + error.message);
        }
    },

    showPaymentModal: function(memberId) {
        const member = this.membersData.find(m => m.id === memberId);
        if (!member) return;

        const year = parseInt(document.getElementById('members-filter-year')?.value || new Date().getFullYear());

        document.getElementById('payment-member-id').value = memberId;
        document.getElementById('payment-member-name').textContent = `${member.last_name}, ${member.first_name || ''}`;
        document.getElementById('payment-member-fee').textContent = `Beitrag: ${this.formatCurrency(member.membership_fee || 0)}`;
        document.getElementById('payment-year').value = year;
        document.getElementById('payment-amount').value = member.membership_fee || '';
        document.getElementById('payment-date').value = '';
        document.getElementById('payment-notes').value = '';

        // DATEV-Buchungen für Konto 6401550 laden
        this.populatePaymentDatevDropdown();

        this.showModal('member-payment-modal');
    },

    populatePaymentDatevDropdown: function() {
        const select = document.getElementById('payment-datev-buchung');
        select.innerHTML = '<option value="">-- Buchung auswählen --</option>';

        // DATEV-Buchungen für Mitgliedsbeitrags-Konto holen
        const buchungen = DataManager.getDatevBuchungenForKonto('6401550');

        // Bereits zugewiesene Buchungen ausschließen
        const assignedBuchungIds = new Set(this.memberPaymentsData.map(p => p.datev_buchung_id));

        const availableBuchungen = buchungen.filter(b => !assignedBuchungIds.has(b.rechnungId));

        availableBuchungen.forEach(b => {
            const datum = this.formatDate(b.buchungsdatum || b.belegdatum);
            const text = b.buchungstext || b.beschreibung || 'Ohne Text';
            const betrag = this.formatCurrency(Math.abs(b.betrag || 0));
            select.innerHTML += `<option value="${b.rechnungId}" data-betrag="${Math.abs(b.betrag || 0)}" data-datum="${b.buchungsdatum || b.belegdatum}" data-text="${text}">${datum} | ${text} | ${betrag}</option>`;
        });
    },

    selectDatevBuchung: function(buchungId) {
        if (!buchungId) return;

        const select = document.getElementById('payment-datev-buchung');
        const option = select.querySelector(`option[value="${buchungId}"]`);
        if (option) {
            document.getElementById('payment-amount').value = option.dataset.betrag || '';
            document.getElementById('payment-date').value = option.dataset.datum || '';
        }
    },

    saveMemberPayment: async function() {
        const memberId = document.getElementById('payment-member-id').value;
        const datevBuchungId = document.getElementById('payment-datev-buchung').value;
        const datevOption = document.getElementById('payment-datev-buchung').selectedOptions[0];

        const paymentData = {
            member_id: memberId,
            year: parseInt(document.getElementById('payment-year').value),
            amount: parseFloat(document.getElementById('payment-amount').value) || 0,
            payment_date: document.getElementById('payment-date').value || null,
            datev_buchung_id: datevBuchungId || null,
            datev_buchungstext: datevOption?.dataset?.text || null,
            notes: document.getElementById('payment-notes').value || null
        };

        try {
            await DataManager.addMemberPayment(paymentData);
            this.showToast('success', 'Gespeichert', 'Zahlung wurde zugewiesen');
            this.hideModal('member-payment-modal');
            await this.loadMembers();
        } catch (error) {
            console.error('Fehler beim Speichern der Zahlung:', error);
            alert('Fehler: ' + error.message);
        }
    },

    removeMemberPayment: async function(memberId) {
        const member = this.membersData.find(m => m.id === memberId);
        if (!member || !member.payment) return;

        if (!confirm(`Zahlung für ${member.last_name} wirklich entfernen?`)) return;

        try {
            await DataManager.deleteMemberPayment(member.payment.id);
            this.showToast('success', 'Entfernt', 'Zahlung wurde entfernt');
            await this.loadMembers();
        } catch (error) {
            console.error('Fehler beim Entfernen der Zahlung:', error);
            alert('Fehler: ' + error.message);
        }
    },

    showUnmatchedPayments: function() {
        const tbody = document.getElementById('unmatched-payments-body');
        tbody.innerHTML = '';

        // DATEV-Buchungen für Mitgliedsbeitrags-Konto holen
        const buchungen = DataManager.getDatevBuchungenForKonto('6401550');

        // Bereits zugewiesene Buchungen
        const assignedBuchungIds = new Set(this.memberPaymentsData.map(p => p.datev_buchung_id));

        const unmatchedBuchungen = buchungen.filter(b => !assignedBuchungIds.has(b.rechnungId));

        if (unmatchedBuchungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #27ae60; padding: 2rem;">Alle Buchungen sind zugewiesen!</td></tr>';
        } else {
            unmatchedBuchungen.forEach(b => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${this.formatDate(b.buchungsdatum || b.belegdatum)}</td>
                    <td>${b.buchungstext || b.beschreibung || '-'}</td>
                    <td style="text-align: right;">${this.formatCurrency(Math.abs(b.betrag || 0))}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="App.assignPaymentToMember('${b.rechnungId}', '${(b.buchungstext || '').replace(/'/g, "\\'")}', ${Math.abs(b.betrag || 0)}, '${b.buchungsdatum || b.belegdatum || ''}')">
                            Zuweisen
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        this.showModal('unmatched-payments-modal');
    },

    assignPaymentToMember: function(buchungId, buchungstext, betrag, datum) {
        // Modal schließen und Mitglieder-Auswahl zeigen
        this.hideModal('unmatched-payments-modal');

        // Einfache Auswahl via Prompt (später evtl. schöneres Modal)
        const memberOptions = this.membersData
            .filter(m => !m.isPaid)
            .map(m => `${m.last_name}, ${m.first_name || ''} (${this.formatCurrency(m.membership_fee || 0)})`);

        if (memberOptions.length === 0) {
            alert('Keine Mitglieder mit offenen Zahlungen gefunden.');
            return;
        }

        const memberList = this.membersData.filter(m => !m.isPaid);
        let options = memberList.map((m, i) => `${i + 1}. ${m.last_name}, ${m.first_name || ''}`).join('\n');

        const input = prompt(`Buchung: ${buchungstext}\nBetrag: ${this.formatCurrency(betrag)}\n\nMitglied auswählen (Nummer eingeben):\n\n${options}`);

        if (input) {
            const index = parseInt(input) - 1;
            if (index >= 0 && index < memberList.length) {
                const selectedMember = memberList[index];
                const year = parseInt(document.getElementById('members-filter-year')?.value || new Date().getFullYear());

                DataManager.addMemberPayment({
                    member_id: selectedMember.id,
                    year: year,
                    amount: betrag,
                    payment_date: datum,
                    datev_buchung_id: buchungId,
                    datev_buchungstext: buchungstext
                }).then(() => {
                    this.showToast('success', 'Zugewiesen', `Zahlung wurde ${selectedMember.last_name} zugewiesen`);
                    this.loadMembers();
                }).catch(err => {
                    alert('Fehler: ' + err.message);
                });
            }
        }
    },

    showMemberImportModal: function() {
        document.getElementById('member-import-file').value = '';
        document.getElementById('member-import-preview').style.display = 'none';
        document.getElementById('member-import-result').style.display = 'none';
        document.getElementById('member-import-btn').disabled = true;
        this.memberImportData = null;

        // File-Change-Listener
        document.getElementById('member-import-file').onchange = (e) => this.previewMemberImport(e);

        this.showModal('member-import-modal');
    },

    previewMemberImport: async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (json.length === 0) {
                alert('Die Datei enthält keine Daten.');
                return;
            }

            // Spalten-Mapping (flexibel)
            const columnMap = {
                'Nachname': 'last_name',
                'Vorname': 'first_name',
                'Art der M': 'gender',  // Art der Mitgliedschaft / Geschlecht
                'N': 'member_number',   // Nummer
                'p': 'language',        // Sprache (sp)
                'Anschrift': 'address',
                'CAP': 'postal_code',
                'Ort': 'city',
                'E-Mail': 'email',
                'Telefon': 'phone',
                'Geburtsjahr': 'birth_year',
                'StrNr': 'tax_number',
                'StNr': 'tax_number',
                'Beitrag': 'membership_fee',
                'Spende': 'donation',
                'Datum B': 'join_date',
                'Zahlungsart': 'payment_method',
                'Hashtag': 'hashtag',
                'Info': 'notes'
            };

            // Daten transformieren
            this.memberImportData = json.map(row => {
                const mapped = {};
                Object.keys(row).forEach(key => {
                    // Exaktes Match oder Teilmatch
                    let targetKey = null;
                    for (const [searchKey, mappedKey] of Object.entries(columnMap)) {
                        if (key === searchKey || key.includes(searchKey)) {
                            targetKey = mappedKey;
                            break;
                        }
                    }
                    if (targetKey) {
                        mapped[targetKey] = row[key];
                    }
                });
                return mapped;
            }).filter(m => m.last_name); // Nur Zeilen mit Nachname

            // Vorschau anzeigen
            const previewDiv = document.getElementById('member-import-preview-table');
            const previewData = this.memberImportData.slice(0, 5);

            let tableHtml = '<table style="font-size: 0.8rem;"><thead><tr>';
            tableHtml += '<th>Nachname</th><th>Vorname</th><th>Ort</th><th>E-Mail</th><th>Beitrag</th>';
            tableHtml += '</tr></thead><tbody>';

            previewData.forEach(m => {
                tableHtml += `<tr>
                    <td>${m.last_name || ''}</td>
                    <td>${m.first_name || ''}</td>
                    <td>${m.city || ''}</td>
                    <td>${m.email || ''}</td>
                    <td>${m.membership_fee || ''}</td>
                </tr>`;
            });
            tableHtml += '</tbody></table>';

            previewDiv.innerHTML = tableHtml;
            document.getElementById('member-import-count').textContent = `${this.memberImportData.length} Mitglieder erkannt`;
            document.getElementById('member-import-preview').style.display = 'block';
            document.getElementById('member-import-btn').disabled = false;

        } catch (error) {
            console.error('Fehler beim Lesen der Datei:', error);
            alert('Fehler beim Lesen der Datei: ' + error.message);
        }
    },

    importMembersFromExcel: async function() {
        if (!this.memberImportData || this.memberImportData.length === 0) {
            alert('Keine Daten zum Importieren');
            return;
        }

        try {
            const result = await DataManager.importMembers(this.memberImportData);

            document.getElementById('member-import-result').innerHTML = `
                <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; color: #155724;">
                    <strong>Import erfolgreich!</strong><br>
                    ${result.count} Mitglieder wurden importiert.
                </div>
            `;
            document.getElementById('member-import-result').style.display = 'block';
            document.getElementById('member-import-btn').disabled = true;

            // Nach 2 Sekunden Modal schließen und Liste aktualisieren
            setTimeout(() => {
                this.hideModal('member-import-modal');
                this.loadMembers();
            }, 2000);

        } catch (error) {
            console.error('Fehler beim Import:', error);
            document.getElementById('member-import-result').innerHTML = `
                <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; color: #721c24;">
                    <strong>Import fehlgeschlagen!</strong><br>
                    ${error.message}
                </div>
            `;
            document.getElementById('member-import-result').style.display = 'block';
        }
    },

    exportMembersCSV: function() {
        const year = document.getElementById('members-filter-year')?.value || new Date().getFullYear();

        let csv = '\uFEFF'; // BOM für Excel
        csv += 'Nachname;Vorname;Geschlecht;Anschrift;PLZ;Ort;E-Mail;Telefon;Geburtsjahr;Steuernummer;Beitrag;Spende;Beitrittsdatum;Zahlungsart;Bezahlt;Zahlungsdatum;Notizen\n';

        this.filteredMembers.forEach(m => {
            csv += `"${m.last_name}";"${m.first_name || ''}";"${m.gender || ''}";"${m.address || ''}";"${m.postal_code || ''}";"${m.city || ''}";"${m.email || ''}";"${m.phone || ''}";"${m.birth_year || ''}";"${m.tax_number || ''}";"${m.membership_fee || 0}";"${m.donation || 0}";"${m.join_date || ''}";"${m.payment_method || ''}";"${m.isPaid ? 'Ja' : 'Nein'}";"${m.payment?.payment_date || ''}";"${m.notes || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Mitglieder_${year}_${new Date().toISOString().split('T')[0]}.csv`;
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
        // 1. Jahr_PartitaIVA_RechnungsNr.pdf (3 Teile, Jahr = 4 Ziffern, PartitaIVA beginnt mit IT)
        // 2. Timestamp_PartitaIVA_RechnungsNr.pdf (3 Teile, Timestamp = 10+ Ziffern)
        // 3. PartitaIVA_RechnungsNr.pdf (2 Teile)
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
                        fornitore: null,
                        year: /^\d{4}$/.test(firstPart) ? firstPart : null,
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
                fornitore: null,
                year: null,
                valid: true
            };
        }

        return {
            partitaIva: null,
            invoiceNumber: null,
            fornitore: null,
            year: null,
            valid: false
        };
    },

    showMassUploadPreview: function() {
        const uploadContent = document.querySelector('#invoice-mass-upload-zone .upload-content');
        const preview = document.getElementById('invoice-mass-preview');
        const fileList = document.getElementById('invoice-mass-file-list');

        uploadContent.style.display = 'none';
        preview.style.display = 'block';

        // Clear search input
        document.getElementById('invoice-mass-search').value = '';

        // Render file list
        this.renderMassUploadFileList();
    },

    renderMassUploadFileList: function(filterText = '') {
        const fileList = document.getElementById('invoice-mass-file-list');
        const lowerFilter = filterText.toLowerCase();

        const filteredFiles = this.pendingInvoiceFiles
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => !filterText || item.file.name.toLowerCase().includes(lowerFilter));

        fileList.innerHTML = filteredFiles.map(({ item, index }) => {
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
                        <span class="file-list-item-icon" style="cursor: pointer;" onclick="App.previewPendingPdf(${index})" title="PDF öffnen">${Icons.document}</span>
                        <div class="file-list-item-details">
                            <div class="file-list-item-name">${item.file.name}</div>
                            <div class="file-list-item-meta ${statusClass}">${statusText} • ${sizeKB} KB</div>
                        </div>
                    </div>
                    <button class="file-list-item-remove" onclick="App.removePendingFile(${index})" title="Entfernen">${Icons.close}</button>
                </div>
            `;
        }).join('');

        if (filteredFiles.length === 0 && filterText) {
            fileList.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">Keine Dateien gefunden</div>';
        }
    },

    filterMassUploadList: function() {
        const searchInput = document.getElementById('invoice-mass-search');
        this.renderMassUploadFileList(searchInput.value);
    },

    previewPendingPdf: function(index) {
        const item = this.pendingInvoiceFiles[index];
        if (!item) return;

        // Create blob URL from file
        const blobUrl = URL.createObjectURL(item.file);

        // Open in new tab
        window.open(blobUrl, '_blank');

        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    },

    removePendingFile: function(index) {
        this.pendingInvoiceFiles.splice(index, 1);

        if (this.pendingInvoiceFiles.length === 0) {
            this.cancelMassUpload();
        } else {
            // Re-render with current filter
            const searchInput = document.getElementById('invoice-mass-search');
            this.renderMassUploadFileList(searchInput.value);
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
        let alreadyExists = 0;
        let errors = 0;
        const total = this.pendingInvoiceFiles.length;

        for (let i = 0; i < this.pendingInvoiceFiles.length; i++) {
            const item = this.pendingInvoiceFiles[i];
            progress.textContent = `${i + 1}/${total}...`;

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
                // Prüfe ob Datei bereits existiert
                if (error.message && error.message.includes('already exists')) {
                    alreadyExists++;
                    console.log(`ℹ️ ${item.file.name} bereits vorhanden`);
                } else {
                    errors++;
                    console.error(`❌ Fehler bei ${item.file.name}:`, error);
                }
            }
        }

        // Fertig
        btn.disabled = false;
        btnText.style.display = 'inline';
        progress.style.display = 'none';

        // Detaillierte Rückmeldung
        let message = `${uploaded} neu hochgeladen`;
        if (alreadyExists > 0) message += `, ${alreadyExists} bereits vorhanden`;
        if (errors > 0) message += `, ${errors} Fehler`;

        this.showToast(
            'success',
            'Upload abgeschlossen',
            message
        );

        // Automatische Verknüpfung mit DATEV-Buchungen
        const linkResult = await this.autoLinkInvoicesAfterImport();
        if (linkResult.linked > 0) {
            this.showToast('success', 'Verknüpfungen erstellt',
                `${linkResult.linked} PDFs automatisch mit DATEV verknüpft`);
        }

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
    // IMPORT-TAB PDF UPLOAD
    // ==========================================

    pendingImportPdfFiles: [],

    setupImportPdfUpload: function() {
        const uploadZone = document.getElementById('import-pdf-upload-zone');
        const fileInput = document.getElementById('import-pdf-file-input');

        if (!uploadZone || !fileInput) return;

        // Dateien ausgewählt
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImportPdfFiles(Array.from(e.target.files));
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
                this.handleImportPdfFiles(Array.from(e.dataTransfer.files));
            }
        });
    },

    handleImportPdfFiles: function(files) {
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            alert('Bitte nur PDF-Dateien hochladen.');
            return;
        }

        this.pendingImportPdfFiles = pdfFiles.map(file => ({
            file: file,
            status: 'pending',
            parsed: this.parseInvoiceFilename(file.name)
        }));

        this.showImportPdfPreview();
    },

    showImportPdfPreview: function() {
        const uploadContent = document.querySelector('#import-pdf-upload-zone .upload-content');
        const preview = document.getElementById('import-pdf-preview');

        uploadContent.style.display = 'none';
        preview.style.display = 'block';

        document.getElementById('import-pdf-search').value = '';
        this.renderImportPdfFileList();
    },

    renderImportPdfFileList: function(filterText = '') {
        const fileList = document.getElementById('import-pdf-file-list');
        const lowerFilter = filterText.toLowerCase();

        const filteredFiles = this.pendingImportPdfFiles
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => !filterText || item.file.name.toLowerCase().includes(lowerFilter));

        fileList.innerHTML = filteredFiles.map(({ item, index }) => {
            const sizeKB = (item.file.size / 1024).toFixed(1);
            const statusClass = item.parsed.valid ? '' : 'warning';

            let statusText = '';
            if (item.parsed.valid) {
                statusText = `Partita IVA: ${item.parsed.partitaIva} • Rechnung: ${item.parsed.invoiceNumber}`;
            } else {
                statusText = 'Warnung: Dateiname nicht erkannt';
            }

            return `
                <div class="file-list-item">
                    <div class="file-list-item-info">
                        <span class="file-list-item-icon" style="cursor: pointer;" onclick="App.previewImportPdf(${index})" title="PDF öffnen">${Icons.document}</span>
                        <div class="file-list-item-details">
                            <div class="file-list-item-name">${item.file.name}</div>
                            <div class="file-list-item-meta ${statusClass}">${statusText} • ${sizeKB} KB</div>
                        </div>
                    </div>
                    <button class="file-list-item-remove" onclick="App.removeImportPdfFile(${index})" title="Entfernen">${Icons.close}</button>
                </div>
            `;
        }).join('');

        if (filteredFiles.length === 0 && filterText) {
            fileList.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">Keine Dateien gefunden</div>';
        }
    },

    filterImportPdfList: function() {
        const searchInput = document.getElementById('import-pdf-search');
        this.renderImportPdfFileList(searchInput.value);
    },

    previewImportPdf: function(index) {
        const item = this.pendingImportPdfFiles[index];
        if (!item) return;

        const blobUrl = URL.createObjectURL(item.file);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    },

    removeImportPdfFile: function(index) {
        this.pendingImportPdfFiles.splice(index, 1);

        if (this.pendingImportPdfFiles.length === 0) {
            this.cancelImportPdfUpload();
        } else {
            const searchInput = document.getElementById('import-pdf-search');
            this.renderImportPdfFileList(searchInput.value);
        }
    },

    cancelImportPdfUpload: function() {
        this.pendingImportPdfFiles = [];

        const uploadContent = document.querySelector('#import-pdf-upload-zone .upload-content');
        const preview = document.getElementById('import-pdf-preview');

        uploadContent.style.display = 'flex';
        preview.style.display = 'none';

        document.getElementById('import-pdf-file-input').value = '';
    },

    startImportPdfUpload: async function() {
        const btn = document.getElementById('import-pdf-upload-btn');
        const btnText = document.getElementById('import-pdf-btn-text');
        const progress = document.getElementById('import-pdf-progress');

        btn.disabled = true;
        btnText.style.display = 'none';
        progress.style.display = 'inline';

        let uploaded = 0;
        let alreadyExists = 0;
        let errors = 0;
        const total = this.pendingImportPdfFiles.length;

        for (let i = 0; i < this.pendingImportPdfFiles.length; i++) {
            const item = this.pendingImportPdfFiles[i];
            progress.textContent = `${i + 1}/${total}...`;

            try {
                const uploadResult = await StorageService.uploadFile(
                    item.file,
                    'invoices',
                    null
                );

                const datevBuchungId = this.findMatchingDatevBuchung(
                    item.parsed.partitaIva,
                    item.parsed.invoiceNumber
                );

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
                if (error.message && error.message.includes('already exists')) {
                    alreadyExists++;
                    console.log(`ℹ️ ${item.file.name} bereits vorhanden`);
                } else {
                    errors++;
                    console.error(`❌ Fehler bei ${item.file.name}:`, error);
                }
            }
        }

        btn.disabled = false;
        btnText.style.display = 'inline';
        progress.style.display = 'none';

        let message = `${uploaded} neu hochgeladen`;
        if (alreadyExists > 0) message += `, ${alreadyExists} bereits vorhanden`;
        if (errors > 0) message += `, ${errors} Fehler`;

        this.showToast('success', 'Upload abgeschlossen', message);

        // Automatische Verknüpfung mit DATEV-Buchungen
        const linkResult = await this.autoLinkInvoicesAfterImport();
        if (linkResult.linked > 0) {
            this.showToast('success', 'Verknüpfungen erstellt',
                `${linkResult.linked} PDFs automatisch mit DATEV verknüpft`);
        }

        this.cancelImportPdfUpload();

        // Statistik aktualisieren
        this.loadImportStatistics();
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
    // DATEV IMPORT
    // ==========================================

    /**
     * Import DATEV Buchungen von Excel
     */
    importDatevBookings: async function() {
        const fileInput = document.getElementById('datev-file-input');
        const resultDiv = document.getElementById('datev-import-result');

        if (!fileInput.files || fileInput.files.length === 0) {
            this.showToast('error', 'Fehler', 'Bitte wählen Sie eine Excel-Datei aus');
            return;
        }

        const file = fileInput.files[0];

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="color: #666;">⏳ Import läuft...</div>';

        try {
            // Jahr wird automatisch aus dem Datum jeder Buchung erkannt
            const result = await ExcelImportService.importDatevBookings(file);

            if (result.success) {
                resultDiv.innerHTML = `
                    <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; color: #155724;">
                        <strong>${Icons.success} Import erfolgreich</strong><br>
                        ${result.message}
                    </div>`;
                this.showToast('success', 'Import erfolgreich', result.message);

                // Statistik aktualisieren
                await this.loadImportStatistics();

                // Automatische Verknüpfung mit hochgeladenen PDFs
                const linkResult = await this.autoLinkInvoicesAfterImport();
                if (linkResult.linked > 0) {
                    this.showToast('success', 'Verknüpfungen erstellt',
                        `${linkResult.linked} PDFs automatisch verknüpft`);
                }

                // Datev-Buchungen neu laden (wenn auf Rechnungen-View)
                if (document.querySelector('.nav-item.active')?.getAttribute('data-view') === 'rechnungen') {
                    await this.loadRechnungen();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Import-Fehler:', error);
            resultDiv.innerHTML = `
                <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; color: #721c24;">
                    <strong>${Icons.error} Import fehlgeschlagen</strong><br>
                    ${error.message}
                </div>`;
            this.showToast('error', 'Import fehlgeschlagen', error.message);
        } finally {
            // Input zurücksetzen
            fileInput.value = '';
        }
    },

    /**
     * Import Lieferanten von Excel
     */
    importSuppliers: async function() {
        const fileInput = document.getElementById('supplier-file-input');
        const resultDiv = document.getElementById('supplier-import-result');

        if (!fileInput.files || fileInput.files.length === 0) {
            this.showToast('error', 'Fehler', 'Bitte wählen Sie eine Excel-Datei aus');
            return;
        }

        const file = fileInput.files[0];

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="color: #666;">⏳ Import läuft...</div>';

        try {
            const result = await ExcelImportService.importSuppliers(file);

            if (result.success) {
                resultDiv.innerHTML = `
                    <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; color: #155724;">
                        <strong>${Icons.success} Import erfolgreich</strong><br>
                        ${result.message}
                    </div>`;
                this.showToast('success', 'Import erfolgreich', result.message);

                // Statistik aktualisieren
                await this.loadImportStatistics();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Import-Fehler:', error);
            resultDiv.innerHTML = `
                <div style="padding: 1rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; color: #721c24;">
                    <strong>${Icons.error} Import fehlgeschlagen</strong><br>
                    ${error.message}
                </div>`;
            this.showToast('error', 'Import fehlgeschlagen', error.message);
        } finally {
            // Input zurücksetzen
            fileInput.value = '';
        }
    },

    /**
     * Lade Import-Statistik
     */
    loadImportStatistics: async function() {
        try {
            // 1. Anzahl DATEV-Buchungen
            const { count: totalBookings, error: bookingsError } = await SupabaseService.client
                .from('datev_bookings')
                .select('*', { count: 'exact', head: true });

            if (bookingsError) throw bookingsError;

            // 2. Anzahl verknüpfte Invoices
            const { count: linkedInvoices, error: linkedError } = await SupabaseService.client
                .from('datev_bookings')
                .select('*', { count: 'exact', head: true })
                .not('linked_invoice_id', 'is', null);

            if (linkedError) throw linkedError;

            // 3. Anzahl Lieferanten
            const { count: suppliers, error: suppliersError } = await SupabaseService.client
                .from('suppliers')
                .select('*', { count: 'exact', head: true });

            if (suppliersError) throw suppliersError;

            // 4. Verfügbare Jahre
            const years = await ExcelImportService.getAvailableYears();

            // Update UI
            document.getElementById('stat-total-bookings').textContent = totalBookings || 0;
            document.getElementById('stat-linked-invoices').textContent = linkedInvoices || 0;
            document.getElementById('stat-suppliers').textContent = suppliers || 0;
            document.getElementById('stat-import-years').textContent = years.length;

        } catch (error) {
            console.error('❌ Fehler beim Laden der Statistik:', error);
            this.showToast('error', 'Fehler', 'Statistik konnte nicht geladen werden');
        }
    },

    /**
     * Automatische Verknüpfung nach DATEV-Import
     * Sucht nach hochgeladenen PDFs, die zu importierten Buchungen passen
     * Flexibles Matching: Sucht Dokument-Nr irgendwo im Dateinamen
     */
    autoLinkInvoicesAfterImport: async function() {
        try {
            console.log('🔗 Suche nach verknüpfbaren PDFs...');

            // 1. Alle DATEV-Buchungen mit Dokument-Nr holen
            const { data: datevBookings, error: datevError } = await SupabaseService.client
                .from('datev_bookings')
                .select('id, partita_iva, dokument_nr')
                .not('dokument_nr', 'is', null);

            if (datevError) throw datevError;

            // 2. Alle unverknüpften Invoices holen (ohne linked_datev_id)
            const { data: unlinkedInvoices, error: invoiceError } = await SupabaseService.client
                .from('invoices')
                .select('id, file_name, partita_iva, invoice_number')
                .is('linked_datev_id', null);

            if (invoiceError) throw invoiceError;

            console.log(`📊 ${datevBookings.length} DATEV-Buchungen mit Dok-Nr, ${unlinkedInvoices.length} unverknüpfte PDFs`);

            // Debug: Zeige erste paar DATEV-Buchungen
            if (datevBookings.length > 0) {
                console.log('📋 Beispiel DATEV-Buchungen:', datevBookings.slice(0, 3).map(b => `${b.partita_iva}_${b.dokument_nr}`));
            }

            // 3. Striktes Matching durchführen
            // Dateinamen-Format: 2026_IT00100340215_92.pdf oder IT00100340215_92.pdf
            let linked = 0;
            for (const invoice of unlinkedInvoices) {
                const filename = invoice.file_name || '';
                const filenameClean = filename.replace(/\.pdf$/i, '').toUpperCase();

                // Extrahiere Partita IVA und Dokument-Nr aus Dateinamen
                // Format: [timestamp_][jahr_]PartitaIVA_DokumentNr.pdf
                const parts = filenameClean.split('_');

                // Finde Partita IVA (beginnt mit IT, DE, AT, CF oder ist numerisch mit 11+ Ziffern)
                let filePartitaIva = null;
                let fileDokumentNr = null;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    // Partita IVA erkennen
                    if (part.match(/^(IT|DE|AT|CF)\d+$/) || part.match(/^\d{11,}$/)) {
                        filePartitaIva = part;
                        // Das nächste Teil ist die Dokument-Nr
                        if (i + 1 < parts.length) {
                            fileDokumentNr = parts[i + 1];
                        }
                        break;
                    }
                }

                if (!filePartitaIva || !fileDokumentNr) {
                    console.log(`⚠️ Konnte Partita IVA/Dok-Nr nicht aus Dateiname extrahieren: ${filename}`);
                    continue;
                }

                console.log(`🔍 Suche Match für: PartitaIVA=${filePartitaIva}, DokNr=${fileDokumentNr}`);

                // Suche exakte Übereinstimmung in DATEV-Buchungen
                const matching = datevBookings.find(b => {
                    if (!b.dokument_nr || !b.partita_iva) return false;
                    const dokNr = b.dokument_nr.toUpperCase();
                    const partitaIva = b.partita_iva.toUpperCase();

                    // Exakte Übereinstimmung von Partita IVA UND Dokument-Nr
                    return partitaIva === filePartitaIva && dokNr === fileDokumentNr;
                });

                if (matching) {
                    // Verknüpfung erstellen: linked_datev_id setzen
                    const { error: updateError } = await SupabaseService.client
                        .from('invoices')
                        .update({
                            partita_iva: matching.partita_iva,
                            invoice_number: matching.dokument_nr,
                            linked_datev_id: matching.id
                        })
                        .eq('id', invoice.id);

                    if (!updateError) {
                        linked++;
                        console.log(`✅ Verknüpft: ${filename} → ${matching.partita_iva}_${matching.dokument_nr}`);
                    }
                }
            }

            console.log(`🔗 ${linked} PDFs automatisch verknüpft`);
            return { linked, total: unlinkedInvoices.length };

        } catch (error) {
            console.error('❌ Fehler bei automatischer Verknüpfung:', error);
            return { linked: 0, total: 0 };
        }
    },

    // ==========================================
    // BUDGETPLANUNG
    // ==========================================

    budgetEntriesData: [],
    budgetIstData: {},

    loadBudgetplanung: async function() {
        const year = parseInt(document.getElementById('budget-year-filter')?.value || new Date().getFullYear());
        const showVorjahr = document.getElementById('budget-show-vorjahr')?.checked || false;

        try {
            // Budget-Einträge laden
            this.budgetEntriesData = await DataManager.getBudgetEntries(year, showVorjahr);

            // IST-Daten aus DATEV-Buchungen laden
            await this.loadBudgetIstData(year);

            // Tabellen rendern
            this.renderBudgetKontenTable(year, showVorjahr);
            this.renderBudgetProjekteTable(year);

            // Notizen laden
            const notes = await DataManager.getBudgetNotes(year);
            document.getElementById('budget-notizen-text').value = notes;

            // Statistiken aktualisieren
            this.updateBudgetStats(year);

        } catch (error) {
            console.error('Fehler beim Laden der Budgetplanung:', error);
            this.showToast('error', 'Fehler', 'Budgetplanung konnte nicht geladen werden');
        }
    },

    loadBudgetIstData: async function(year) {
        try {
            // DATEV-Buchungen für das Jahr laden
            const { data: buchungen, error } = await SupabaseService.client
                .from('datev_bookings')
                .select('kategorie, datum, betrag')
                .eq('import_year', year);

            if (error) throw error;

            // Nach Kategorie und Monat gruppieren (Kategorie = Kostenart/Konto)
            this.budgetIstData = {};
            this.budgetIstDataTotal = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0, total: 0 };
            const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

            (buchungen || []).forEach(b => {
                if (!b.datum) return;

                const konto = b.kategorie || 'Sonstige';
                const monat = new Date(b.datum).getMonth(); // 0-11
                const betrag = parseFloat(b.betrag) || 0;

                if (!this.budgetIstData[konto]) {
                    this.budgetIstData[konto] = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0, total: 0 };
                }

                this.budgetIstData[konto][months[monat]] += betrag;
                this.budgetIstData[konto].total += betrag;

                // Gesamtsummen
                this.budgetIstDataTotal[months[monat]] += betrag;
                this.budgetIstDataTotal.total += betrag;
            });

            console.log('IST-Daten geladen:', Object.keys(this.budgetIstData).length, 'Kategorien');

        } catch (error) {
            console.error('Fehler beim Laden der IST-Daten:', error);
            this.budgetIstData = {};
            this.budgetIstDataTotal = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0, total: 0 };
        }
    },

    renderBudgetKontenTable: async function(year, showVorjahr) {
        const tbody = document.getElementById('budget-konten-body');
        const entries = this.budgetEntriesData.filter(e => e.fiscal_year === year);
        const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

        // Konto-Notizen laden
        let kontoNotes = {};
        try {
            kontoNotes = await DataManager.getBudgetKontoNotes(year);
        } catch (error) {
            console.warn('Konto-Notizen konnten nicht geladen werden:', error);
        }

        // Alle Konten sammeln: aus Budget-Einträgen UND aus IST-Daten
        const alleKonten = new Map();

        // Budget-Einträge hinzufügen
        entries.forEach(entry => {
            const key = entry.konto_nr || entry.description;
            alleKonten.set(key, {
                konto_nr: entry.konto_nr,
                description: entry.description,
                budget: entry,
                ist: this.budgetIstData[key] || null,
                hasBudget: true,
                id: entry.id
            });
        });

        // IST-Daten ohne Budget hinzufügen
        Object.keys(this.budgetIstData).forEach(konto => {
            if (!alleKonten.has(konto)) {
                alleKonten.set(konto, {
                    konto_nr: konto,
                    description: konto,
                    budget: null,
                    ist: this.budgetIstData[konto],
                    hasBudget: false,
                    id: null
                });
            }
        });

        if (alleKonten.size === 0) {
            tbody.innerHTML = `<tr><td colspan="16" style="text-align: center; color: #666; padding: 2rem;">
                Keine Budget-Einträge oder IST-Daten für ${year}. Klicken Sie auf "+ Budget hinzufügen" um zu beginnen.
            </td></tr>`;
            // Summen auf 0 setzen
            months.forEach(m => {
                const el = document.getElementById(`budget-total-${m}`);
                if (el) el.textContent = '0';
            });
            const yearEl = document.getElementById('budget-total-year');
            if (yearEl) yearEl.textContent = '0';
            return;
        }

        let html = '';
        const budgetTotals = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0 };
        const istTotals = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0 };

        // Konten sortieren
        const sortedKonten = Array.from(alleKonten.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        sortedKonten.forEach(([key, data]) => {
            const budget = data.budget;
            const ist = data.ist;

            // Budget-Zeile
            const budgetRowTotal = budget ? months.reduce((sum, m) => sum + (parseFloat(budget[m]) || 0), 0) : 0;
            if (budget) {
                months.forEach(m => budgetTotals[m] += parseFloat(budget[m]) || 0);
            }

            // IST-Zeile
            const istRowTotal = ist ? ist.total : 0;
            if (ist) {
                months.forEach(m => istTotals[m] += ist[m] || 0);
            }

            // Differenz
            const diffTotal = budgetRowTotal - istRowTotal;
            const diffStyle = diffTotal < 0 ? 'color: #dc3545;' : (diffTotal > 0 ? 'color: #28a745;' : '');

            // Notiz für dieses Konto
            const note = kontoNotes[key] || '';
            const noteEscaped = note.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const keyEscaped = key.replace(/'/g, "\\'");

            html += `<tr style="border-bottom: 2px solid #dee2e6;">
                <td rowspan="3" style="vertical-align: middle;"><strong>${data.konto_nr}</strong></td>
                <td style="background: #f8f9fa; font-size: 0.8rem;">Budget</td>
                ${months.map(m => `<td style="text-align: right; background: #f8f9fa;">${budget ? this.formatNumber(budget[m]) : '-'}</td>`).join('')}
                <td style="text-align: right; font-weight: bold; background: #f8f9fa;">${this.formatNumber(budgetRowTotal)}</td>
                <td rowspan="3" style="vertical-align: middle;">
                    <textarea class="form-control" style="font-size: 0.75rem; min-height: 60px; resize: vertical;"
                              placeholder="Notiz..."
                              onchange="App.saveBudgetKontoNote('${keyEscaped}', ${year}, this.value)"
                    >${note}</textarea>
                </td>
                <td rowspan="3" style="vertical-align: middle;">
                    ${data.hasBudget ? `
                        <button class="btn btn-sm btn-outline" onclick="App.editBudgetEntry('${data.id}')" title="Bearbeiten">${Icons.edit}</button>
                        <button class="btn btn-sm btn-outline" onclick="App.deleteBudgetEntry('${data.id}')" style="color: #dc3545;" title="Löschen">${Icons.delete}</button>
                    ` : `
                        <button class="btn btn-sm btn-outline" onclick="App.addBudgetForKonto('${keyEscaped}')" title="Budget hinzufügen">+ Budget</button>
                    `}
                </td>
            </tr>
            <tr>
                <td style="color: #007bff; font-size: 0.8rem;">IST</td>
                ${months.map(m => `<td style="text-align: right; color: #007bff;">${ist ? this.formatNumber(ist[m]) : '-'}</td>`).join('')}
                <td style="text-align: right; font-weight: bold; color: #007bff;">${this.formatNumber(istRowTotal)}</td>
            </tr>
            <tr style="border-bottom: 3px solid #adb5bd;">
                <td style="font-size: 0.8rem;">Diff</td>
                ${months.map(m => {
                    const diff = (budget ? parseFloat(budget[m]) || 0 : 0) - (ist ? ist[m] || 0 : 0);
                    const style = diff < 0 ? 'color: #dc3545;' : (diff > 0 ? 'color: #28a745;' : '');
                    return `<td style="text-align: right; ${style}">${this.formatNumber(diff)}</td>`;
                }).join('')}
                <td style="text-align: right; font-weight: bold; ${diffStyle}">${this.formatNumber(diffTotal)}</td>
            </tr>`;
        });

        tbody.innerHTML = html;

        // Summen aktualisieren
        const budgetYearTotal = months.reduce((sum, m) => sum + budgetTotals[m], 0);
        months.forEach(m => {
            const el = document.getElementById(`budget-total-${m}`);
            if (el) el.textContent = this.formatNumber(budgetTotals[m]);
        });
        const yearEl = document.getElementById('budget-total-year');
        if (yearEl) yearEl.textContent = this.formatNumber(budgetYearTotal);

        // IST-Summen
        const istYearTotal = months.reduce((sum, m) => sum + istTotals[m], 0);
        months.forEach(m => {
            const el = document.getElementById(`ist-total-${m}`);
            if (el) el.textContent = this.formatNumber(istTotals[m]);
        });
        const istYearEl = document.getElementById('ist-total-year');
        if (istYearEl) istYearEl.textContent = this.formatNumber(istYearTotal);

        // Differenz
        months.forEach(m => {
            const diff = budgetTotals[m] - istTotals[m];
            const el = document.getElementById(`diff-total-${m}`);
            if (el) el.textContent = this.formatNumber(diff);
        });
        const diffYearEl = document.getElementById('diff-total-year');
        if (diffYearEl) diffYearEl.textContent = this.formatNumber(budgetYearTotal - istYearTotal);
    },

    // Hilfsfunktion: Budget für bestehendes Konto aus IST-Daten hinzufügen
    addBudgetForKonto: async function(kontoName) {
        // Formular öffnen und Konto-Name vorausfüllen
        await this.showBudgetEntryModal();
        setTimeout(() => {
            const kontoInput = document.getElementById('budget-entry-konto');
            const descInput = document.getElementById('budget-entry-description');
            if (kontoInput) kontoInput.value = kontoName;
            if (descInput) descInput.value = kontoName;
        }, 100);
    },

    // Speichert eine Konto-Notiz
    saveBudgetKontoNote: async function(kontoNr, year, notes) {
        try {
            await DataManager.saveBudgetKontoNote(kontoNr, year, notes);
            console.log('Konto-Notiz gespeichert:', kontoNr, year);
        } catch (error) {
            console.error('Fehler beim Speichern der Konto-Notiz:', error);
            this.showToast('error', 'Fehler', 'Notiz konnte nicht gespeichert werden');
        }
    },

    renderBudgetProjekteTable: async function(year) {
        const tbody = document.getElementById('budget-projekte-body');

        try {
            const projects = await DataManager.getProjects();
            const rechnungen = await DataManager.getRechnungenMitStatus();

            let html = '';
            let totalBudget = 0, totalForecast = 0, totalIst = 0;

            projects.forEach(project => {
                const budget = project.budget || 0;
                const projektRechnungen = rechnungen.filter(r => String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly);
                const ist = projektRechnungen.reduce((sum, r) => sum + (r.betrag || 0), 0);
                const verfuegbar = budget - ist;
                const prozent = budget > 0 ? Math.round((ist / budget) * 100) : 0;
                const barColor = prozent > 90 ? '#e74c3c' : prozent > 70 ? '#f39c12' : '#27ae60';

                totalBudget += budget;
                totalIst += ist;

                if (budget > 0 || ist > 0) {
                    html += `<tr>
                        <td><strong>${project.name}</strong></td>
                        <td><span class="badge badge-${project.status === 'laufend' ? 'success' : 'secondary'}">${project.status || 'laufend'}</span></td>
                        <td style="text-align: right;">${this.formatCurrency(budget)}</td>
                        <td style="text-align: right;">-</td>
                        <td style="text-align: right;">${this.formatCurrency(ist)}</td>
                        <td style="text-align: right; ${verfuegbar < 0 ? 'color: #dc3545;' : ''}">${this.formatCurrency(verfuegbar)}</td>
                        <td style="width: 120px;">
                            <div style="background: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
                                <div style="background: ${barColor}; height: 100%; width: ${Math.min(prozent, 100)}%;"></div>
                            </div>
                            <small>${prozent}%</small>
                        </td>
                    </tr>`;
                }
            });

            tbody.innerHTML = html || '<tr><td colspan="7" style="text-align: center; color: #666;">Keine Projekte mit Budget gefunden</td></tr>';

            // Footer aktualisieren
            document.getElementById('budget-projekte-total-budget').textContent = this.formatCurrency(totalBudget);
            document.getElementById('budget-projekte-total-ist').textContent = this.formatCurrency(totalIst);
            document.getElementById('budget-projekte-total-available').textContent = this.formatCurrency(totalBudget - totalIst);

        } catch (error) {
            console.error('Fehler beim Rendern der Projekt-Budgets:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="color: red;">Fehler beim Laden</td></tr>';
        }
    },

    updateBudgetStats: function(year) {
        const entries = this.budgetEntriesData.filter(e => e.fiscal_year === year);
        const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

        const totalBudget = entries.reduce((sum, e) => sum + months.reduce((s, m) => s + (parseFloat(e[m]) || 0), 0), 0);
        const totalIst = Object.values(this.budgetIstData).reduce((sum, k) => sum + (k.total || 0), 0);

        document.getElementById('budget-total').textContent = this.formatCurrency(totalBudget);
        document.getElementById('budget-forecast').textContent = this.formatCurrency(totalBudget); // Gleich wie Budget für jetzt
        document.getElementById('budget-ist').textContent = this.formatCurrency(totalIst);
        document.getElementById('budget-available').textContent = this.formatCurrency(totalBudget - totalIst);
    },

    showBudgetEntryModal: async function(entryId = null) {
        const modal = document.getElementById('budget-entry-modal');
        const title = document.getElementById('budget-entry-modal-title');

        // Formular zurücksetzen
        document.getElementById('budget-entry-id').value = '';
        document.getElementById('budget-entry-konto').value = '';
        document.getElementById('budget-entry-description').value = '';
        document.getElementById('budget-entry-projekt').value = '';
        document.getElementById('budget-entry-type').value = 'budget';
        document.getElementById('budget-entry-notes').value = '';
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'].forEach(m => {
            document.getElementById(`budget-entry-${m}`).value = '0';
        });
        document.getElementById('budget-entry-total').textContent = '0,00 EUR';

        // Projekte-Dropdown füllen
        const projektSelect = document.getElementById('budget-entry-projekt');
        const projects = await DataManager.getProjects();
        projektSelect.innerHTML = '<option value="">-- Kein Projekt --</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Event-Listener für automatische Summenberechnung
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'].forEach(m => {
            document.getElementById(`budget-entry-${m}`).oninput = () => this.updateBudgetEntryTotal();
        });

        if (entryId) {
            title.textContent = 'Budget-Eintrag bearbeiten';
            const entry = await DataManager.getBudgetEntryById(entryId);
            if (entry) {
                document.getElementById('budget-entry-id').value = entry.id;
                document.getElementById('budget-entry-konto').value = entry.konto_nr || '';
                document.getElementById('budget-entry-description').value = entry.description || '';
                document.getElementById('budget-entry-projekt').value = entry.projekt_id || '';
                document.getElementById('budget-entry-type').value = entry.entry_type || 'budget';
                document.getElementById('budget-entry-notes').value = entry.notes || '';
                ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'].forEach(m => {
                    document.getElementById(`budget-entry-${m}`).value = entry[m] || 0;
                });
                this.updateBudgetEntryTotal();
            }
        } else {
            title.textContent = 'Neuer Budget-Eintrag';
        }

        modal.classList.add('active');
    },

    updateBudgetEntryTotal: function() {
        const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];
        const total = months.reduce((sum, m) => sum + (parseFloat(document.getElementById(`budget-entry-${m}`).value) || 0), 0);
        document.getElementById('budget-entry-total').textContent = this.formatCurrency(total);
    },

    saveBudgetEntry: async function(event) {
        event.preventDefault();
        const year = parseInt(document.getElementById('budget-year-filter')?.value || new Date().getFullYear());
        const entryId = document.getElementById('budget-entry-id').value;

        const entryData = {
            konto_nr: document.getElementById('budget-entry-konto').value.trim(),
            description: document.getElementById('budget-entry-description').value.trim(),
            projekt_id: document.getElementById('budget-entry-projekt').value || null,
            entry_type: document.getElementById('budget-entry-type').value,
            notes: document.getElementById('budget-entry-notes').value.trim() || null,
            fiscal_year: year,
            jan: parseFloat(document.getElementById('budget-entry-jan').value) || 0,
            feb: parseFloat(document.getElementById('budget-entry-feb').value) || 0,
            mar: parseFloat(document.getElementById('budget-entry-mar').value) || 0,
            apr: parseFloat(document.getElementById('budget-entry-apr').value) || 0,
            mai: parseFloat(document.getElementById('budget-entry-mai').value) || 0,
            jun: parseFloat(document.getElementById('budget-entry-jun').value) || 0,
            jul: parseFloat(document.getElementById('budget-entry-jul').value) || 0,
            aug: parseFloat(document.getElementById('budget-entry-aug').value) || 0,
            sep: parseFloat(document.getElementById('budget-entry-sep').value) || 0,
            okt: parseFloat(document.getElementById('budget-entry-okt').value) || 0,
            nov: parseFloat(document.getElementById('budget-entry-nov').value) || 0,
            dez: parseFloat(document.getElementById('budget-entry-dez').value) || 0
        };

        try {
            if (entryId) {
                await DataManager.updateBudgetEntry(entryId, entryData);
                this.showToast('success', 'Gespeichert', 'Budget-Eintrag wurde aktualisiert');
            } else {
                await DataManager.addBudgetEntry(entryData);
                this.showToast('success', 'Erstellt', 'Budget-Eintrag wurde erstellt');
            }
            this.hideModal('budget-entry-modal');
            await this.loadBudgetplanung();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('error', 'Fehler', 'Budget-Eintrag konnte nicht gespeichert werden');
        }
    },

    editBudgetEntry: function(entryId) {
        this.showBudgetEntryModal(entryId);
    },

    deleteBudgetEntry: async function(entryId) {
        if (!confirm('Möchten Sie diesen Budget-Eintrag wirklich löschen?')) return;

        try {
            await DataManager.deleteBudgetEntry(entryId);
            this.showToast('success', 'Gelöscht', 'Budget-Eintrag wurde gelöscht');
            await this.loadBudgetplanung();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showToast('error', 'Fehler', 'Budget-Eintrag konnte nicht gelöscht werden');
        }
    },

    saveBudgetNotizen: async function() {
        const year = parseInt(document.getElementById('budget-year-filter')?.value || new Date().getFullYear());
        const notes = document.getElementById('budget-notizen-text').value;

        try {
            await DataManager.saveBudgetNotes(year, notes);
            this.showToast('success', 'Gespeichert', 'Notizen wurden gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern der Notizen:', error);
            this.showToast('error', 'Fehler', 'Notizen konnten nicht gespeichert werden');
        }
    },

    exportBudgetCSV: function() {
        // TODO: CSV-Export implementieren
        this.showToast('info', 'Info', 'CSV-Export wird noch implementiert');
    },

    formatNumber: function(value) {
        if (value === null || value === undefined || isNaN(value)) return '0';
        return Math.round(value).toLocaleString('de-DE');
    },

    // ==========================================
    // WORKSPACE-VERWALTUNG
    // ==========================================

    workspacesData: [],
    currentWorkspaceId: null,

    loadWorkspaces: async function() {
        try {
            this.workspacesData = await DataManager.getWorkspaces();
            this.renderWorkspacesList();
        } catch (error) {
            console.error('Fehler beim Laden der Workspaces:', error);
            this.showToast('error', 'Fehler', 'Workspaces konnten nicht geladen werden');
        }
    },

    renderWorkspacesList: function() {
        const container = document.getElementById('workspaces-list');
        if (!container) return;

        if (this.workspacesData.length === 0) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #666;">
                    <p>Noch keine Workspaces vorhanden.</p>
                    <p style="font-size: 0.875rem;">Erstellen Sie einen Workspace, um Benutzerberechtigungen zu verwalten.</p>
                </div>
            `;
            return;
        }

        const accessLabels = {
            access_dashboard: 'Dashboard',
            access_projekte: 'Projekte',
            access_rechnungen: 'Rechnungen',
            access_bewegungen: 'Bewegungen',
            access_lieferanten: 'Lieferanten',
            access_mitglieder: 'Mitglieder',
            access_einnahmen: 'Einnahmen',
            access_konfiguration: 'Konfiguration'
        };

        container.innerHTML = this.workspacesData.map(ws => {
            const accessList = Object.entries(accessLabels)
                .filter(([key]) => ws[key])
                .map(([, label]) => label);

            const accessText = accessList.length > 0 ? accessList.join(', ') : 'Kein Zugriff';

            return `
                <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">
                            ${ws.name}
                            ${!ws.is_active ? '<span style="color: #999; font-weight: normal;">(inaktiv)</span>' : ''}
                        </div>
                        ${ws.description ? `<div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">${ws.description}</div>` : ''}
                        <div style="font-size: 0.75rem; color: #888;">
                            Zugriff: ${accessText}
                            ${ws.rechnungen_nur_zugewiesene ? ' | Nur zugewiesene Rechnungen' : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-outline" onclick="App.showWorkspaceUsersModal('${ws.id}')" title="Benutzer verwalten">
                            Benutzer
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="App.editWorkspace('${ws.id}')" title="Bearbeiten">
                            Bearbeiten
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="App.deleteWorkspace('${ws.id}')" title="Löschen" style="color: #dc3545;">
                            Löschen
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    showWorkspaceModal: function(workspaceId = null) {
        const modal = document.getElementById('workspace-form-modal');
        const title = document.getElementById('workspace-modal-title');

        // Formular zurücksetzen
        document.getElementById('workspace-id').value = '';
        document.getElementById('workspace-name').value = '';
        document.getElementById('workspace-description').value = '';
        document.getElementById('workspace-access-dashboard').checked = false;
        document.getElementById('workspace-access-projekte').checked = false;
        document.getElementById('workspace-access-rechnungen').checked = false;
        document.getElementById('workspace-access-bewegungen').checked = false;
        document.getElementById('workspace-access-lieferanten').checked = false;
        document.getElementById('workspace-access-mitglieder').checked = false;
        document.getElementById('workspace-access-einnahmen').checked = false;
        document.getElementById('workspace-access-konfiguration').checked = false;
        document.getElementById('workspace-rechnungen-nur-zugewiesene').checked = false;

        if (workspaceId) {
            title.textContent = 'Workspace bearbeiten';
            const ws = this.workspacesData.find(w => w.id === workspaceId);
            if (ws) {
                document.getElementById('workspace-id').value = ws.id;
                document.getElementById('workspace-name').value = ws.name || '';
                document.getElementById('workspace-description').value = ws.description || '';
                document.getElementById('workspace-access-dashboard').checked = ws.access_dashboard;
                document.getElementById('workspace-access-projekte').checked = ws.access_projekte;
                document.getElementById('workspace-access-rechnungen').checked = ws.access_rechnungen;
                document.getElementById('workspace-access-bewegungen').checked = ws.access_bewegungen;
                document.getElementById('workspace-access-lieferanten').checked = ws.access_lieferanten;
                document.getElementById('workspace-access-mitglieder').checked = ws.access_mitglieder;
                document.getElementById('workspace-access-einnahmen').checked = ws.access_einnahmen;
                document.getElementById('workspace-access-konfiguration').checked = ws.access_konfiguration;
                document.getElementById('workspace-rechnungen-nur-zugewiesene').checked = ws.rechnungen_nur_zugewiesene;
            }
        } else {
            title.textContent = 'Neuer Workspace';
        }

        modal.classList.add('active');
    },

    editWorkspace: function(workspaceId) {
        this.showWorkspaceModal(workspaceId);
    },

    saveWorkspace: async function(event) {
        event.preventDefault();

        const workspaceId = document.getElementById('workspace-id').value;
        const workspaceData = {
            name: document.getElementById('workspace-name').value.trim(),
            description: document.getElementById('workspace-description').value.trim() || null,
            access_dashboard: document.getElementById('workspace-access-dashboard').checked,
            access_projekte: document.getElementById('workspace-access-projekte').checked,
            access_rechnungen: document.getElementById('workspace-access-rechnungen').checked,
            access_bewegungen: document.getElementById('workspace-access-bewegungen').checked,
            access_lieferanten: document.getElementById('workspace-access-lieferanten').checked,
            access_mitglieder: document.getElementById('workspace-access-mitglieder').checked,
            access_einnahmen: document.getElementById('workspace-access-einnahmen').checked,
            access_konfiguration: document.getElementById('workspace-access-konfiguration').checked,
            rechnungen_nur_zugewiesene: document.getElementById('workspace-rechnungen-nur-zugewiesene').checked,
            is_active: true
        };

        try {
            if (workspaceId) {
                await DataManager.updateWorkspace(workspaceId, workspaceData);
                this.showToast('success', 'Gespeichert', 'Workspace wurde aktualisiert');
            } else {
                await DataManager.addWorkspace(workspaceData);
                this.showToast('success', 'Erstellt', 'Workspace wurde erstellt');
            }

            this.hideModal('workspace-form-modal');
            await this.loadWorkspaces();
        } catch (error) {
            console.error('Fehler beim Speichern des Workspace:', error);
            this.showToast('error', 'Fehler', 'Workspace konnte nicht gespeichert werden');
        }
    },

    deleteWorkspace: async function(workspaceId) {
        const ws = this.workspacesData.find(w => w.id === workspaceId);
        if (!ws) return;

        if (!confirm(`Möchten Sie den Workspace "${ws.name}" wirklich löschen?\n\nAlle Benutzer werden aus diesem Workspace entfernt.`)) {
            return;
        }

        try {
            await DataManager.deleteWorkspace(workspaceId);
            this.showToast('success', 'Gelöscht', 'Workspace wurde gelöscht');
            await this.loadWorkspaces();
        } catch (error) {
            console.error('Fehler beim Löschen des Workspace:', error);
            this.showToast('error', 'Fehler', 'Workspace konnte nicht gelöscht werden');
        }
    },

    showWorkspaceUsersModal: async function(workspaceId) {
        this.currentWorkspaceId = workspaceId;
        const ws = this.workspacesData.find(w => w.id === workspaceId);

        document.getElementById('workspace-users-title').textContent = `Benutzer in "${ws?.name || 'Workspace'}"`;
        document.getElementById('workspace-add-user-email').value = '';

        // User-Liste laden
        await this.loadWorkspaceUsers(workspaceId);

        document.getElementById('workspace-users-modal').classList.add('active');
    },

    loadWorkspaceUsers: async function(workspaceId) {
        const container = document.getElementById('workspace-users-list');

        try {
            const userWorkspaces = await DataManager.getUserWorkspaces(workspaceId);

            if (userWorkspaces.length === 0) {
                container.innerHTML = `
                    <div style="padding: 1rem; text-align: center; color: #666; background: #f9f9f9; border-radius: 4px;">
                        Keine Benutzer zugewiesen
                    </div>
                `;
                return;
            }

            // User-Details laden (falls verfügbar)
            const users = await DataManager.getUsers();
            const userMap = new Map(users.map(u => [u.id, u]));

            container.innerHTML = userWorkspaces.map(uw => {
                const user = userMap.get(uw.user_id);
                const displayName = user?.email || user?.name || uw.user_id;

                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 500;">${displayName}</div>
                            ${uw.is_admin ? '<span style="font-size: 0.75rem; color: #007bff;">Workspace-Admin</span>' : ''}
                        </div>
                        <button class="btn btn-sm btn-outline" onclick="App.removeUserFromWorkspace('${uw.user_id}', '${workspaceId}')" style="color: #dc3545;">
                            Entfernen
                        </button>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Fehler beim Laden der Workspace-User:', error);
            container.innerHTML = '<div style="color: red; padding: 1rem;">Fehler beim Laden</div>';
        }
    },

    addUserToCurrentWorkspace: async function() {
        const emailInput = document.getElementById('workspace-add-user-email');
        const email = emailInput.value.trim();

        if (!email) {
            this.showToast('warning', 'Hinweis', 'Bitte geben Sie eine E-Mail-Adresse ein');
            return;
        }

        if (!this.currentWorkspaceId) {
            this.showToast('error', 'Fehler', 'Kein Workspace ausgewählt');
            return;
        }

        try {
            // User per E-Mail finden
            const users = await DataManager.getUsers();
            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (!user) {
                this.showToast('error', 'Nicht gefunden', 'Benutzer mit dieser E-Mail wurde nicht gefunden. Der Benutzer muss sich zuerst anmelden.');
                return;
            }

            await DataManager.addUserToWorkspace(user.id, this.currentWorkspaceId, false);
            this.showToast('success', 'Hinzugefügt', `${email} wurde zum Workspace hinzugefügt`);
            emailInput.value = '';
            await this.loadWorkspaceUsers(this.currentWorkspaceId);
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Users:', error);
            if (error.message?.includes('duplicate') || error.code === '23505') {
                this.showToast('warning', 'Bereits vorhanden', 'Dieser Benutzer ist bereits im Workspace');
            } else {
                this.showToast('error', 'Fehler', 'Benutzer konnte nicht hinzugefügt werden');
            }
        }
    },

    removeUserFromWorkspace: async function(userId, workspaceId) {
        if (!confirm('Möchten Sie diesen Benutzer wirklich aus dem Workspace entfernen?')) {
            return;
        }

        try {
            await DataManager.removeUserFromWorkspace(userId, workspaceId);
            this.showToast('success', 'Entfernt', 'Benutzer wurde aus dem Workspace entfernt');
            await this.loadWorkspaceUsers(workspaceId);
        } catch (error) {
            console.error('Fehler beim Entfernen des Users:', error);
            this.showToast('error', 'Fehler', 'Benutzer konnte nicht entfernt werden');
        }
    },

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    showToast: function(type, title, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const toastIcons = {
            success: Icons.success,
            error: Icons.error,
            warning: Icons.warning,
            info: Icons.data
        };

        toast.innerHTML = `
            <span class="toast-icon">${toastIcons[type] || toastIcons.info}</span>
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

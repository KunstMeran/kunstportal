/**
 * PROJEKTSOFTWARE KUNST MERAN - APP MODULE
 * Hauptanwendungslogik mit DATEV-Integration
 * Version: 3.0.0
 */

/**
 * Hilfsfunktion: Fügt updated_at und updated_by zu Update-Objekten hinzu
 * Wird bei allen direkten Supabase-Update-Operationen verwendet für Audit-Trail
 */
async function addAuditMetadata(updates) {
    try {
        const currentUser = (await SupabaseService.client.auth.getUser()).data.user;
        return {
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || null
        };
    } catch (error) {
        console.warn('⚠️ Konnte Audit-Metadaten nicht hinzufügen:', error);
        return {
            ...updates,
            updated_at: new Date().toISOString()
        };
    }
}

/**
 * Löst User-ID zu lesbarem Namen auf
 * Verwendet allUsers-Cache aus App oder lädt über DataManager
 * Sucht über users.id UND users.auth_id (für Supabase Auth User)
 */
function resolveUserName(userId) {
    if (!userId) return null;
    const users = App.allUsers || (typeof DataManager !== 'undefined' ? DataManager.getUsers() : []) || [];
    // Suche über id ODER auth_id (für Supabase Auth User)
    const user = users.find(u => String(u.id) === String(userId) || String(u.auth_id) === String(userId));
    return user ? (user.name || user.username || user.email) : null;
}

/**
 * Formatiert Audit-Info für Anzeige (kompakt)
 * Gibt Text für Tooltip zurück
 */
function formatAuditInfo(createdBy, createdAt, updatedBy, updatedAt) {
    const parts = [];
    const creatorName = resolveUserName(createdBy);
    const updaterName = resolveUserName(updatedBy);

    if (creatorName && createdAt) {
        const dateStr = new Date(createdAt).toLocaleString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        parts.push(`Erstellt: ${creatorName} (${dateStr})`);
    }
    if (updaterName && updatedAt && updatedBy !== createdBy) {
        const dateStr = new Date(updatedAt).toLocaleString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        parts.push(`Geändert: ${updaterName} (${dateStr})`);
    }
    return parts.join(' | ') || '';
}

/**
 * XSS-Schutz: Escaped HTML-Sonderzeichen in Benutzereingaben
 * Verhindert Script-Injection bei innerHTML-Verwendung
 * @param {string} text - Zu escapender Text
 * @returns {string} - HTML-escaped Text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escaped ein Objekt rekursiv (für JSON-Daten die in HTML angezeigt werden)
 * @param {any} obj - Zu escapendes Objekt
 * @returns {any} - Objekt mit escaped Strings
 */
function escapeHtmlObject(obj) {
    if (typeof obj === 'string') return escapeHtml(obj);
    if (Array.isArray(obj)) return obj.map(escapeHtmlObject);
    if (obj && typeof obj === 'object') {
        const escaped = {};
        for (const key in obj) {
            escaped[key] = escapeHtmlObject(obj[key]);
        }
        return escaped;
    }
    return obj;
}

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

    // Europäische MwSt-Sätze (Standard + Reduziert)
    // Sortiert nach Häufigkeit der Nutzung
    mwstSaetze: [
        { rate: 0, label: '0%', country: '' },
        { rate: 4, label: '4% IT', country: 'IT' },
        { rate: 5, label: '5% IT', country: 'IT' },
        { rate: 10, label: '10% IT', country: 'IT' },
        { rate: 22, label: '22% IT', country: 'IT' },
        { rate: 19, label: '19% DE', country: 'DE' },
        { rate: 7, label: '7% DE', country: 'DE' },
        { rate: 20, label: '20% AT', country: 'AT' },
        { rate: 10, label: '10% AT', country: 'AT' },
        { rate: 13, label: '13% AT', country: 'AT' },
        { rate: 8.1, label: '8.1% CH', country: 'CH' },
        { rate: 2.6, label: '2.6% CH', country: 'CH' },
        { rate: 3.8, label: '3.8% CH', country: 'CH' },
        { rate: 21, label: '21% BE', country: 'BE' },
        { rate: 21, label: '21% ES', country: 'ES' },
        { rate: 21, label: '21% NL', country: 'NL' },
        { rate: 20, label: '20% FR', country: 'FR' },
        { rate: 25, label: '25% DK', country: 'DK' },
        { rate: 25, label: '25% SE', country: 'SE' },
        { rate: 24, label: '24% FI', country: 'FI' },
        { rate: 23, label: '23% PL', country: 'PL' },
        { rate: 23, label: '23% PT', country: 'PT' },
        { rate: 23, label: '23% IE', country: 'IE' },
        { rate: 24, label: '24% GR', country: 'GR' },
        { rate: 27, label: '27% HU', country: 'HU' },
        { rate: 21, label: '21% CZ', country: 'CZ' },
        { rate: 20, label: '20% SK', country: 'SK' },
        { rate: 22, label: '22% SI', country: 'SI' },
        { rate: 25, label: '25% HR', country: 'HR' },
        { rate: 20, label: '20% BG', country: 'BG' },
        { rate: 19, label: '19% RO', country: 'RO' },
        { rate: 17, label: '17% LU', country: 'LU' },
        { rate: 18, label: '18% MT', country: 'MT' },
        { rate: 21, label: '21% LV', country: 'LV' },
        { rate: 21, label: '21% LT', country: 'LT' },
        { rate: 22, label: '22% EE', country: 'EE' },
        { rate: 18, label: '18% CY', country: 'CY' }
    ],

    /**
     * App initialisieren
     */
    init: async function() {
        // Auth prüfen
        const isAuthenticated = await Auth.checkAuth();
        if (!isAuthenticated) return;

        // Basisdaten aus PostgreSQL laden (Projekte, Lieferanten, etc.)
        await DataManager.loadInitialData();

        // Benutzerinfo laden
        await this.loadUserInfo();

        // Berechtigungen laden
        await this.loadUserPermissions();

        // Alle User laden (für Audit-Info Anzeige)
        try {
            this.allUsers = await DataManager.getUsers();
            console.log(`👥 ${this.allUsers?.length || 0} Users für Audit-Anzeige geladen`);
        } catch (e) {
            console.warn('⚠️ Konnte Users nicht laden:', e);
            this.allUsers = [];
        }

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
                access_einnahmen: true, access_konfiguration: true, access_zeiterfassung: true,
                rechnungen_nur_zugewiesene: false
            };
        }
    },

    /**
     * View-Map für Berechtigungsprüfung
     */
    viewPermissionMap: {
        'dashboard': 'access_dashboard',
        'projekte': 'access_projekte',
        'rechnungen': 'access_rechnungen',
        'bewegungen': 'access_bewegungen',
        'lieferanten': 'access_lieferanten',
        'mitglieder': 'access_mitglieder',
        'einnahmen': 'access_einnahmen',
        'konfiguration': 'access_konfiguration',
        'inventar': 'access_inventar',
        'reporting': 'access_reporting',
        'zeiterfassung': 'access_zeiterfassung',
        // Zusätzliche Views die zur Konfiguration gehören
        'budgetplanung': 'access_konfiguration',
        'import': 'access_konfiguration'
    },

    /**
     * Navigation basierend auf Berechtigungen ein-/ausblenden
     * Unterstützt 3-stufige Berechtigungen: 'none', 'read', 'write'
     */
    applyNavigationPermissions: function() {
        if (!this.userPermissions) return;

        document.querySelectorAll('.nav-item[data-view]').forEach(navItem => {
            const viewName = navItem.getAttribute('data-view');
            const permKey = this.viewPermissionMap[viewName];

            if (permKey) {
                const level = this.userPermissions[permKey];

                // Verstecken wenn 'none' oder false
                if (level === 'none' || level === false) {
                    navItem.style.display = 'none';
                } else {
                    navItem.style.display = '';
                    // Visueller Hinweis für Read-Only
                    if (level === 'read') {
                        navItem.classList.add('read-only-access');
                    } else {
                        navItem.classList.remove('read-only-access');
                    }
                }
            }
        });
    },

    /**
     * Prüft ob User mindestens Lesezugriff auf View hat
     */
    hasAccessToView: function(viewName) {
        if (!this.userPermissions) return true;
        const permKey = this.viewPermissionMap[viewName];
        if (!permKey) return true;

        const level = this.userPermissions[permKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        return level === 'read' || level === 'write' || level === 'delete';
    },

    /**
     * Prüft ob User Schreibzugriff auf View hat (write oder delete)
     */
    hasWriteAccessToView: function(viewName) {
        if (!this.userPermissions) return true;
        const permKey = this.viewPermissionMap[viewName];
        if (!permKey) return true;

        const level = this.userPermissions[permKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        // write oder delete = Schreibzugriff
        return level === 'write' || level === 'delete';
    },

    /**
     * Prüft ob User Löschzugriff auf View hat
     */
    hasDeleteAccessToView: function(viewName) {
        if (!this.userPermissions) return true;
        const permKey = this.viewPermissionMap[viewName];
        if (!permKey) return true;

        const level = this.userPermissions[permKey];
        // Abwärtskompatibilität für boolean
        if (typeof level === 'boolean') return level;
        return level === 'delete';
    },

    /**
     * Wendet Read-Only-Modus auf eine View an (deaktiviert Bearbeitungselemente)
     */
    applyReadOnlyMode: function(viewName) {
        // Prüfen ob nur Lesezugriff
        if (this.hasWriteAccessToView(viewName)) {
            return; // Vollzugriff, nichts zu tun
        }

        const viewElement = document.getElementById('view-' + viewName);
        if (!viewElement) return;

        // Bestehenden Banner entfernen falls vorhanden
        const existingBanner = viewElement.querySelector('.read-only-banner');
        if (existingBanner) existingBanner.remove();

        // Read-Only Banner am Anfang der View einfügen
        const banner = document.createElement('div');
        banner.className = 'read-only-banner';
        banner.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> Nur Lesezugriff - Bearbeiten nicht möglich';

        // Nach dem Header einfügen (falls vorhanden)
        const header = viewElement.querySelector('.view-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            viewElement.insertBefore(banner, viewElement.firstChild);
        }

        // Alle Bearbeitungs-Buttons deaktivieren
        const editSelectors = [
            '.btn-primary',
            '.btn-success',
            '.btn-danger',
            '[onclick*="save"]',
            '[onclick*="add"]',
            '[onclick*="delete"]',
            '[onclick*="edit"]',
            '[onclick*="create"]',
            '[onclick*="remove"]',
            '[onclick*="update"]'
        ];
        viewElement.querySelectorAll(editSelectors.join(', ')).forEach(btn => {
            if (!btn.classList.contains('btn-outline')) {
                btn.disabled = true;
                btn.classList.add('read-only-disabled');
                btn.title = 'Keine Berechtigung zum Bearbeiten';
            }
        });

        // Formulare deaktivieren (außer Filter)
        viewElement.querySelectorAll('input:not([type="search"]):not(.filter-input), textarea, select:not(.filter-select)').forEach(input => {
            if (!input.closest('.filter-group') && !input.closest('.search-box')) {
                input.disabled = true;
                input.classList.add('read-only-disabled');
            }
        });
    },

    /**
     * Wendet Write-Only-Modus auf eine View an (deaktiviert nur Löschen-Buttons)
     * Für User mit write-Berechtigung aber ohne delete-Berechtigung
     */
    applyWriteOnlyMode: function(viewName) {
        // Prüfen ob Löschzugriff fehlt aber Schreibzugriff vorhanden
        if (this.hasDeleteAccessToView(viewName) || !this.hasWriteAccessToView(viewName)) {
            return; // Entweder voller Zugriff oder nur Lesen
        }

        const viewElement = document.getElementById('view-' + viewName);
        if (!viewElement) return;

        // Nur Löschen-Buttons deaktivieren
        const deleteSelectors = [
            '.btn-danger',
            '[onclick*="delete"]',
            '[onclick*="remove"]',
            '[onclick*="Delete"]',
            '[onclick*="Remove"]'
        ];
        viewElement.querySelectorAll(deleteSelectors.join(', ')).forEach(btn => {
            btn.disabled = true;
            btn.classList.add('delete-disabled');
            btn.title = 'Keine Berechtigung zum Löschen';
        });
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

            // Initialen erstellen (z.B. "Martina Oberprantacher" -> "MO")
            const initials = userName.split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .substring(0, 2); // Max 2 Buchstaben

            document.getElementById('user-name').textContent = userName;
            document.getElementById('user-role').textContent = userRole === 'admin' || userRole === 'Admin' ? 'Administrator' : 'Mitarbeiter';
            document.getElementById('user-avatar').textContent = initials || userName.charAt(0).toUpperCase();
            document.getElementById('logout-initials').textContent = initials || userName.charAt(0).toUpperCase();

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

        // Berechtigungsmodi anwenden
        // Verzögert ausführen, damit View-Inhalte erst geladen werden
        setTimeout(() => {
            this.applyReadOnlyMode(viewName);  // Falls keine Schreibrechte
            this.applyWriteOnlyMode(viewName); // Falls keine Löschrechte
        }, 200);

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
            case 'shop':
                await this.loadShop();
                break;
        }
    },

    // ==========================================
    // DASHBOARD
    // ==========================================

    loadDashboard: async function() {
        try {
            // Projekte und Rechnungen aus Supabase laden
            const allProjects = await DataManager.getProjects();
            const rechnungen = await DataManager.getRechnungenMitStatus();

            // Projekte filtern: hideInReporting ausblenden
            const projects = allProjects.filter(p => !p.hideInReporting);

            // Projekt-Summaries berechnen
            const summaries = projects.map(project => {
                // DATEV-Buchungen für dieses Projekt (über datevId/Kostenstelle matchen)
                const projektRechnungen = rechnungen.filter(r =>
                    String(r.projektId) === String(project.datevId) && !r.isSupabaseOnly
                );
                const istTotal = projektRechnungen.reduce((sum, r) => sum + (r.betrag || 0), 0);

                // Budget aus Projekt (falls vorhanden)
                const budget = parseFloat(project.budget) || 0;

                return {
                    project: project,
                    budget: budget,
                    ist: istTotal,
                    rechnungenAnzahl: projektRechnungen.length,
                    verfuegbar: budget - istTotal,
                    prozentVerbraucht: budget > 0 ? Math.round((istTotal / budget) * 100) : 0
                };
            });

            // Statistiken berechnen (case-insensitive Status-Vergleich)
            const activeProjects = summaries.filter(s => (s.project.status || '').toLowerCase() === 'laufend').length;
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
            // Audit-Info als Tooltip
            const auditInfo = formatAuditInfo(project.created_by, project.created_at, project.updated_by, project.updated_at);
            if (auditInfo) {
                row.title = auditInfo;
            }
            // Geändert-Info
            const updatedByName = resolveUserName(project.updated_by || project.created_by);
            const updatedAtFormatted = project.updated_at ? this.formatDateTime(project.updated_at) : (project.created_at ? this.formatDateTime(project.created_at) : '-');

            row.innerHTML = `
                <td><strong>${project.name}</strong></td>
                <td>${project.location || '-'}</td>
                <td>${statusBadge}</td>
                <td>${budget > 0 ? this.formatCurrency(budget) : '-'}</td>
                <td>${istKosten > 0 ? this.formatCurrency(istKosten) : '-'}</td>
                <td style="${verfuegbarStyle}">${budget > 0 ? this.formatCurrency(verfuegbar) : '-'}</td>
                <td style="font-size: 0.75rem; color: #666;" title="${auditInfo}">
                    ${updatedAtFormatted !== '-' ? `<div>${updatedAtFormatted}</div><div style="font-size: 0.65rem; color: #999;">${updatedByName || ''}</div>` : '-'}
                </td>
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

        // Audit-Info anzeigen (wer hat erstellt/geändert)
        const auditInfoEl = document.getElementById('fp-audit-info');
        if (auditInfoEl) {
            const auditText = formatAuditInfo(project.created_by, project.created_at, project.updated_by, project.updated_at);
            auditInfoEl.textContent = auditText || '';
        }

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

            // Rechnungen mit PDF laden und anzeigen (nur die mit verknüpften PDFs)
            const rechnungenMitPdf = projektRechnungen.filter(r => r.pdfExists || r.invoiceId);
            this.currentProjectRechnungenMitPdf = rechnungenMitPdf;
            this.renderProjectRechnungen(rechnungenMitPdf);

            // Stunden-Übersicht für dieses Projekt laden
            this.loadProjectHoursOverview(projectId);
        } catch (error) {
            console.error('Fehler beim Laden der Projekt-Details:', error);
        }
    },

    // Speicher für Projekt-Rechnungen mit PDF
    currentProjectRechnungenMitPdf: [],

    /**
     * Rendert die Rechnungen-Tabelle im Projekt-Fullpage mit Status und Notizen
     */
    renderProjectRechnungen(rechnungen) {
        const tbody = document.getElementById('fp-rechnungen-table');
        if (!tbody) return;

        // Status-Badges aktualisieren
        const neuCount = rechnungen.filter(r => !r.workflowStatus || r.workflowStatus === 'neu' || r.workflowStatus === 'uploaded').length;
        const kontrolliertCount = rechnungen.filter(r => r.workflowStatus === 'kontrolliert').length;
        const bezahltCount = rechnungen.filter(r => r.workflowStatus === 'bezahlt').length;

        const neuBadge = document.getElementById('fp-rechnungen-neu-badge');
        const kontrolliertBadge = document.getElementById('fp-rechnungen-kontrolliert-badge');
        const bezahltBadge = document.getElementById('fp-rechnungen-bezahlt-badge');

        if (neuBadge) neuBadge.textContent = `${neuCount} Neu (zu kontrollieren)`;
        if (kontrolliertBadge) kontrolliertBadge.textContent = `${kontrolliertCount} Kontrolliert`;
        if (bezahltBadge) bezahltBadge.textContent = `${bezahltCount} Bezahlt`;

        if (rechnungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666; padding: 2rem;">Keine Rechnungen mit PDF für dieses Projekt</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        rechnungen.forEach(r => {
            const row = document.createElement('tr');

            // Status-Badge
            let statusBadge = '';
            let statusDropdown = '';
            const currentStatus = r.workflowStatus || 'neu';

            if (currentStatus === 'bezahlt') {
                statusBadge = `<span class="badge" style="background: #e8f5e9; color: #2e7d32;">Bezahlt</span>`;
            } else if (currentStatus === 'kontrolliert') {
                statusBadge = `<span class="badge" style="background: #e3f2fd; color: #1565c0;">Kontrolliert</span>`;
            } else {
                statusBadge = `<span class="badge" style="background: #fff3e0; color: #e65100;">Neu</span>`;
            }

            // Status-Dropdown für Änderung (bezahlt nur für Admin)
            // Farben: Neu=grau, Kontrolliert=gelb/orange, Bezahlt=grün
            const isAdmin = DataManager.isAdmin();
            const bezahltDisabled = !isAdmin && currentStatus !== 'bezahlt' ? 'disabled' : '';
            let dropdownStyle = 'font-size: 0.75rem; padding: 0.25rem; width: auto; min-width: 150px;';
            if (currentStatus === 'bezahlt') {
                dropdownStyle += ' background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7;';
            } else if (currentStatus === 'kontrolliert') {
                dropdownStyle += ' background: #fff3e0; color: #e65100; border-color: #ffcc80;';
            } else {
                dropdownStyle += ' background: #f5f5f5; color: #616161; border-color: #e0e0e0;';
            }
            statusDropdown = `
                <select class="form-control" style="${dropdownStyle}"
                        onchange="App.changeProjectRechnungStatus('${r.invoiceId || r.id}', this.value, ${r.invoiceId ? 'true' : 'false'})">
                    <option value="neu" ${currentStatus === 'neu' || currentStatus === 'uploaded' ? 'selected' : ''}>Neu (zu kontrollieren)</option>
                    <option value="kontrolliert" ${currentStatus === 'kontrolliert' ? 'selected' : ''}>Kontrolliert</option>
                    <option value="bezahlt" ${currentStatus === 'bezahlt' ? 'selected' : ''} ${bezahltDisabled}>Bezahlt</option>
                </select>
            `;

            // Notiz-Feld
            const notiz = r.notes || r.notizen || '';
            const notizField = `
                <input type="text" class="form-control" style="font-size: 0.75rem; padding: 0.25rem; width: 150px;"
                       value="${notiz.replace(/"/g, '&quot;')}"
                       placeholder="Notiz..."
                       onchange="App.saveProjectRechnungNote('${r.invoiceId || r.id}', this.value, ${r.invoiceId ? 'true' : 'false'})">
            `;

            // PDF-Button
            let pdfButton = '';
            if (r.filePath) {
                pdfButton = `<button class="btn btn-sm btn-outline" onclick="App.openPdf('${r.filePath}')" title="PDF anzeigen">PDF</button>`;
            } else if (r.linkedInvoices && r.linkedInvoices.length > 0) {
                pdfButton = r.linkedInvoices.map((inv, idx) =>
                    `<button class="btn btn-sm btn-outline" style="margin-right: 0.15rem;" onclick="App.openPdf('${inv.filePath}')">PDF${r.linkedInvoices.length > 1 ? (idx + 1) : ''}</button>`
                ).join('');
            }

            // Verschieben-Button
            const moveButton = `
                <button class="btn btn-sm btn-outline" onclick="App.showMoveRechnungDialog('${r.rechnungId || r.partitaIva + '_' + r.dokumentNr}', '${r.projektId}')" title="In anderes Projekt verschieben" style="padding: 0.15rem 0.35rem;">
                    <img src="icons/05-move.svg" alt="Verschieben" class="icon-sm" onerror="this.outerHTML='↔'">
                </button>
            `;

            row.innerHTML = `
                <td>${this.formatDate(r.datum || r.belegdatum)}</td>
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.fornitoreName || ''}">${r.fornitoreName || '-'}</td>
                <td>${r.dokumentNr || '-'}</td>
                <td style="text-align: right; ${(r.betrag || 0) < 0 ? 'color: #e74c3c;' : ''}">${this.formatCurrency(r.betrag || 0)}</td>
                <td>${statusDropdown}</td>
                <td>${notizField}</td>
                <td style="white-space: nowrap;">${pdfButton} ${moveButton}</td>
            `;
            tbody.appendChild(row);
        });
    },

    /**
     * Filtert die Projekt-Rechnungen nach Status
     */
    filterProjectRechnungen() {
        const statusFilter = document.getElementById('fp-rechnungen-status-filter')?.value || '';

        let filtered = this.currentProjectRechnungenMitPdf || [];

        if (statusFilter) {
            if (statusFilter === 'neu') {
                filtered = filtered.filter(r => !r.workflowStatus || r.workflowStatus === 'neu' || r.workflowStatus === 'uploaded');
            } else {
                filtered = filtered.filter(r => r.workflowStatus === statusFilter);
            }
        }

        this.renderProjectRechnungen(filtered);
    },

    /**
     * Ändert den Status einer Rechnung aus der Projekt-Ansicht
     * Synchronisiert mit der Rechnungen-Seite
     */
    async changeProjectRechnungStatus(id, newStatus, isInvoice) {
        try {
            // Berechtigungen prüfen: Nur Admin darf auf "bezahlt" setzen
            if (newStatus === 'bezahlt' && !DataManager.isAdmin()) {
                this.showToast('error', 'Keine Berechtigung', 'Nur Admins können Rechnungen als bezahlt markieren');
                // Dropdown auf vorherigen Wert zurücksetzen
                await this.loadProjectData(this.currentProjectId);
                return;
            }

            const heute = new Date().toISOString().split('T')[0];

            if (isInvoice) {
                // Supabase Invoice aktualisieren
                const updateData = {
                    workflow_status: newStatus,
                    updated_at: new Date().toISOString()
                };

                if (newStatus === 'kontrolliert') {
                    updateData.kontrolled_at = heute;
                    updateData.kontrolled_by = Auth.getCurrentUserId();
                } else if (newStatus === 'bezahlt') {
                    updateData.paid_at = heute;
                    updateData.paid_by = Auth.getCurrentUserId();
                }

                await SupabaseService.client
                    .from('invoices')
                    .update(updateData)
                    .eq('id', id);
            } else {
                // DATEV-Buchung aktualisieren
                const updateData = {
                    workflow_status: newStatus,
                    updated_at: new Date().toISOString()
                };

                if (newStatus === 'kontrolliert') {
                    updateData.kontrolled_at = heute;
                    updateData.kontrolled_by = Auth.getCurrentUserId();
                } else if (newStatus === 'bezahlt') {
                    updateData.paid_at = heute;
                    updateData.paid_by = Auth.getCurrentUserId();
                }

                await SupabaseService.client
                    .from('datev_bookings')
                    .update(updateData)
                    .eq('id', id);
            }

            // Lokale Daten aktualisieren
            const rechnung = this.currentProjectRechnungenMitPdf.find(r =>
                (r.invoiceId && r.invoiceId === id) || r.id === id
            );
            if (rechnung) {
                rechnung.workflowStatus = newStatus;
                if (newStatus === 'kontrolliert') {
                    rechnung.kontrolliertAm = heute;
                } else if (newStatus === 'bezahlt') {
                    rechnung.bezahltAm = heute;
                }
            }

            // Status-Badges aktualisieren (ohne komplettes Re-Render)
            const neuCount = this.currentProjectRechnungenMitPdf.filter(r => !r.workflowStatus || r.workflowStatus === 'neu' || r.workflowStatus === 'uploaded').length;
            const kontrolliertCount = this.currentProjectRechnungenMitPdf.filter(r => r.workflowStatus === 'kontrolliert').length;
            const bezahltCount = this.currentProjectRechnungenMitPdf.filter(r => r.workflowStatus === 'bezahlt').length;

            const neuBadge = document.getElementById('fp-rechnungen-neu-badge');
            const kontrolliertBadge = document.getElementById('fp-rechnungen-kontrolliert-badge');
            const bezahltBadge = document.getElementById('fp-rechnungen-bezahlt-badge');

            if (neuBadge) neuBadge.textContent = `${neuCount} Neu (zu kontrollieren)`;
            if (kontrolliertBadge) kontrolliertBadge.textContent = `${kontrolliertCount} Kontrolliert`;
            if (bezahltBadge) bezahltBadge.textContent = `${bezahltCount} Bezahlt`;

            this.showToast('success', 'Status geändert', `Rechnung ist jetzt "${newStatus}"`);
        } catch (error) {
            console.error('Fehler beim Ändern des Status:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }
    },

    /**
     * Speichert eine Notiz für eine Rechnung aus der Projekt-Ansicht
     * Synchronisiert mit der Rechnungen-Seite
     */
    async saveProjectRechnungNote(id, notizText, isInvoice) {
        try {
            if (isInvoice) {
                // Supabase Invoice aktualisieren
                await SupabaseService.client
                    .from('invoices')
                    .update({
                        notes: notizText,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);
            } else {
                // Für DATEV-Buchungen die verknüpfte Invoice aktualisieren
                // Zuerst die Invoice-ID finden
                const { data: invoices } = await SupabaseService.client
                    .from('invoices')
                    .select('id')
                    .eq('linked_booking_id', id)
                    .limit(1);

                if (invoices && invoices.length > 0) {
                    await SupabaseService.client
                        .from('invoices')
                        .update({
                            notes: notizText,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', invoices[0].id);
                }
            }

            // Lokale Daten aktualisieren
            const rechnung = this.currentProjectRechnungenMitPdf.find(r =>
                (r.invoiceId && r.invoiceId === id) || r.id === id
            );
            if (rechnung) {
                rechnung.notes = notizText;
                rechnung.notizen = notizText;
            }

            this.showToast('success', 'Gespeichert', 'Notiz wurde gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern der Notiz:', error);
            this.showToast('error', 'Fehler', 'Notiz konnte nicht gespeichert werden');
        }
    },

    /**
     * Zeigt Dialog zum Verschieben einer Rechnung in ein anderes Projekt
     */
    showMoveRechnungDialog: function(rechnungId, currentProjektId) {
        // Projekte laden
        const projekte = Object.values(KUNST_MERAN_PROJEKTE);

        // Dropdown-Optionen erstellen
        const optionen = projekte
            .filter(p => String(p.id) !== String(currentProjektId))
            .map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`)
            .join('');

        const currentProjekt = KUNST_MERAN_PROJEKTE[currentProjektId];
        const currentName = currentProjekt ? `${currentProjektId} - ${currentProjekt.name}` : currentProjektId;

        // Einfaches Modal mit prompt-Stil
        const modalHtml = `
            <div id="move-rechnung-modal" class="modal-backdrop" style="display: flex;">
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2 class="modal-title">Rechnung verschieben</h2>
                        <button class="modal-close" onclick="App.closeMoveRechnungDialog()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 1rem; color: #666;">
                            Aktuelles Projekt: <strong>${currentName}</strong>
                        </p>
                        <div class="form-group">
                            <label class="form-label">Neues Projekt:</label>
                            <select id="move-rechnung-projekt" class="form-control">
                                <option value="">-- Projekt wählen --</option>
                                ${optionen}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="App.closeMoveRechnungDialog()">Abbrechen</button>
                        <button class="btn btn-primary" onclick="App.moveRechnung('${rechnungId}', '${currentProjektId}')">Verschieben</button>
                    </div>
                </div>
            </div>
        `;

        // Existierendes Modal entfernen falls vorhanden
        const existing = document.getElementById('move-rechnung-modal');
        if (existing) existing.remove();

        // Modal einfügen
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    closeMoveRechnungDialog: function() {
        const modal = document.getElementById('move-rechnung-modal');
        if (modal) modal.remove();
    },

    /**
     * Verschiebt eine Rechnung in ein anderes Projekt
     */
    moveRechnung: async function(rechnungId, originalProjektId) {
        const select = document.getElementById('move-rechnung-projekt');
        const neuesProjektId = select?.value;

        if (!neuesProjektId) {
            this.showToast('Fehler', 'Bitte wählen Sie ein Projekt', 'error');
            return;
        }

        try {
            // In DataManager speichern
            DataManager.moveRechnungToProjekt(rechnungId, neuesProjektId, originalProjektId);

            const neuesProjekt = KUNST_MERAN_PROJEKTE[neuesProjektId];
            const projektName = neuesProjekt ? neuesProjekt.name : neuesProjektId;

            this.closeMoveRechnungDialog();
            this.showToast('Erfolg', `Rechnung nach "${projektName}" verschoben`, 'success');

            // Ansicht aktualisieren - die Rechnung sollte aus der aktuellen Liste verschwinden
            if (this.currentProjectRechnungenMitPdf) {
                this.currentProjectRechnungenMitPdf = this.currentProjectRechnungenMitPdf.filter(
                    r => r.rechnungId !== rechnungId
                );
                this.renderProjectRechnungen(this.currentProjectRechnungenMitPdf);
            }

        } catch (error) {
            console.error('Fehler beim Verschieben:', error);
            this.showToast('Fehler', 'Rechnung konnte nicht verschoben werden', 'error');
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
                invoiceId: r.invoiceId || null,
                created_by: r.created_by,
                created_at: r.created_at,
                updated_by: r.updated_by,
                updated_at: r.updated_at
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
                costId: k.id,
                created_by: k.created_by,
                created_at: k.created_at,
                updated_by: k.updated_by,
                updated_at: k.updated_at
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
            // Audit-Info als Tooltip
            const auditInfo = formatAuditInfo(k.created_by, k.created_at, k.updated_by, k.updated_at);
            if (auditInfo) {
                row.title = auditInfo;
            }
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
                    // Kontrolliert - Button zum Bezahlt-Markieren (nur für Admin)
                    if (DataManager.isAdmin()) {
                        bezahltCell = `
                            <button class="btn btn-sm" style="background: #fff3e0; color: #e65100; font-size: 0.7rem; padding: 0.15rem 0.4rem;"
                                    onclick="App.markAsBezahltFromProject('${k.invoiceId}')" title="Als bezahlt markieren">
                                Offen
                            </button>`;
                    } else {
                        bezahltCell = `<span class="badge" style="background: #fff3e0; color: #e65100; font-size: 0.7rem;">Offen</span>`;
                    }
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
            select.innerHTML += `<option value="${escapeHtml(ct.id || ct.name)}">${escapeHtml(ct.name)}</option>`;
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
            // Anzahl vor dem Löschen speichern
            const selectedCount = this.selectedCostIds.size;
            let updatedCount = 0;

            // Für jeden ausgewählten Eintrag den Kostentyp setzen
            for (const id of this.selectedCostIds) {
                // String/Number Vergleich: IDs können verschiedene Typen haben
                const cost = this.allProjectCosts.find(c => String(c.id) === String(id));
                if (cost) {
                    if (cost.isDatev && cost.invoiceId) {
                        // DATEV-Buchung mit Supabase-Invoice: Kostentyp in invoices-Tabelle speichern
                        await DataManager.updateInvoiceKostentyp(cost.invoiceId, kostentypName);
                        updatedCount++;
                    } else if (cost.isDatev && !cost.invoiceId) {
                        // DATEV-Buchung ohne Invoice: Kostentyp lokal speichern (localStorage fallback)
                        DataManager.setKostentyp(cost.rechnungId || cost.id, kostentypName);
                        updatedCount++;
                    } else if (!cost.isDatev && cost.costId) {
                        // Manuelle Kosten: costTypeName aktualisieren
                        await DataManager.updateCost(cost.costId, { costTypeName: kostentypName });
                        updatedCount++;
                    }
                    // Lokales Update
                    cost.kostentyp = kostentypName;
                }
            }

            // Auswahl zurücksetzen und neu rendern
            this.clearCostSelection();
            this.renderProjectCostsPage();

            alert(`Kostentyp "${kostentypName}" wurde ${updatedCount} Einträgen zugewiesen.`);
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
            // Berechtigungen prüfen: Nur Admin darf auf "bezahlt" setzen
            if (!DataManager.isAdmin()) {
                this.showToast('error', 'Keine Berechtigung', 'Nur Admins können Rechnungen als bezahlt markieren');
                return;
            }

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
            categorySelect.innerHTML += `<option value="${escapeHtml(ct.name)}">${escapeHtml(ct.name)}</option>`;
        });

        // Lieferant-Filter
        const supplierSelect = document.getElementById('fp-filter-supplier');
        supplierSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        suppliers.forEach(s => {
            supplierSelect.innerHTML += `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`;
        });
    },

    filterProjectCosts: async function() {
        if (!this.currentProjectId) return;

        const categoryFilter = document.getElementById('fp-filter-category').value;
        const supplierFilter = document.getElementById('fp-filter-supplier').value;
        const typeFilter = document.getElementById('fp-filter-type').value;

        // Manuelle Kosten
        let costs = DataManager.getCostsByProject(this.currentProjectId);

        // DATEV-Buchungen für dieses Projekt holen (mit Status inkl. Kostentyp)
        const alleRechnungen = await DataManager.getRechnungenMitStatus();
        const datevBuchungen = (alleRechnungen || []).filter(b =>
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
        document.getElementById('project-hide-reporting').checked = project.hideInReporting || false;

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
            dropboxLink: document.getElementById('project-dropbox').value || null,
            hideInReporting: document.getElementById('project-hide-reporting').checked
        };

        try {
            if (id) {
                // ID direkt verwenden (UUID für Supabase, Nummer für localStorage)
                await DataManager.updateProject(id, projectData);
                this.showToast('success', 'Gespeichert', 'Projekt wurde aktualisiert');
            } else {
                await DataManager.addProject(projectData);
                this.showToast('success', 'Erstellt', 'Neues Projekt wurde angelegt');
            }

            this.hideModal('project-form-modal');
            await this.loadProjects();

            // Fullpage aktualisieren falls offen
            if (this.currentProjectId && id && id === this.currentProjectId) {
                await this.openProjectFullpage(this.currentProjectId);
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Projekts:', error);
            this.showToast('error', 'Fehler', 'Projekt konnte nicht gespeichert werden: ' + error.message);
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
            projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-filter-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '<option value="">Alle Kategorien</option>';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${escapeHtml(ct.name)}">${escapeHtml(ct.name)}</option>`;
        });

        // Lieferant-Dropdown befüllen
        const supplierSelect = document.getElementById('cost-filter-supplier');
        const suppliers = DataManager.getActiveSuppliers();
        supplierSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        suppliers.forEach(s => {
            supplierSelect.innerHTML += `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`;
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
            projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}" ${selected}>${escapeHtml(p.name)}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${escapeHtml(ct.name)}">${escapeHtml(ct.name)}</option>`;
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
                supplierSelect.innerHTML += `<option value="datev_${escapeHtml(l.partitaIva)}">${escapeHtml(l.name)} (${escapeHtml(l.partitaIva)})</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        // Manuelle Lieferanten
        if (suppliers.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="Manuelle Lieferanten">';
            suppliers.forEach(s => {
                supplierSelect.innerHTML += `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`;
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
            projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}" ${p.id === cost.projectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`;
        });

        // Kategorie-Dropdown befüllen
        const categorySelect = document.getElementById('cost-category');
        const costTypes = DataManager.getActiveCostTypes();
        categorySelect.innerHTML = '';
        costTypes.forEach(ct => {
            categorySelect.innerHTML += `<option value="${escapeHtml(ct.name)}" ${ct.name === cost.category ? 'selected' : ''}>${escapeHtml(ct.name)}</option>`;
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
                const value = `datev_${escapeHtml(l.partitaIva)}`;
                const selected = cost.supplierId === value ? 'selected' : '';
                supplierSelect.innerHTML += `<option value="${value}" ${selected}>${escapeHtml(l.name)} (${escapeHtml(l.partitaIva)})</option>`;
            });
            supplierSelect.innerHTML += '</optgroup>';
        }

        // Manuelle Lieferanten
        if (suppliers.length > 0) {
            supplierSelect.innerHTML += '<optgroup label="Manuelle Lieferanten">';
            suppliers.forEach(s => {
                const selected = cost.supplierId === s.id ? 'selected' : '';
                supplierSelect.innerHTML += `<option value="${escapeHtml(s.id)}" ${selected}>${escapeHtml(s.name)}</option>`;
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

        // Preview-Div aktualisieren (verwendet innerHTML, um spezielle Hinweise anzuzeigen)
        const previewDiv = document.getElementById('cost-mwst-preview');
        if (!previewDiv) return;

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
            // Audit-Info für Tooltip
            const auditInfo = formatAuditInfo(entry.created_by, entry.created_at, entry.updated_by, entry.updated_at);

            container.innerHTML += `
                <div class="time-entry" ${auditInfo ? `title="${auditInfo}"` : ''}>
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

    // Tab-Wechsel in Zeiterfassung (Legacy-Alias)
    switchTimeTab: function(tab) {
        this.switchPersonalTab(tab);
    },

    // Tab-Wechsel in Personal-Bereich
    switchPersonalTab: function(tab) {
        const tabEintraege = document.querySelector('[data-tab="zeit-eintraege"]');
        const tabExterne = document.querySelector('[data-tab="zeit-externe"]');
        const tabKalender = document.querySelector('[data-tab="zeit-kalender"]');
        const tabKurse = document.querySelector('[data-tab="zeit-kurse"]');
        const tabAnwesenheit = document.querySelector('[data-tab="zeit-anwesenheit"]');
        const contentEintraege = document.getElementById('tab-zeit-eintraege');
        const contentExterne = document.getElementById('tab-zeit-externe');
        const contentKalender = document.getElementById('tab-zeit-kalender');
        const contentKurse = document.getElementById('tab-zeit-kurse');
        const contentAnwesenheit = document.getElementById('tab-zeit-anwesenheit');
        const actionBtn = document.getElementById('btn-personal-action');

        // Alle Tabs deaktivieren
        [tabEintraege, tabExterne, tabKalender, tabKurse, tabAnwesenheit].forEach(t => t?.classList.remove('active'));
        [contentEintraege, contentExterne, contentKalender, contentKurse, contentAnwesenheit].forEach(c => { if (c) c.style.display = 'none'; });

        if (tab === 'eintraege') {
            tabEintraege?.classList.add('active');
            if (contentEintraege) contentEintraege.style.display = 'block';
            if (actionBtn) {
                actionBtn.textContent = '+ Zeit erfassen';
                actionBtn.onclick = () => this.showNewTimeEntryForm();
                actionBtn.style.display = '';
            }
        } else if (tab === 'externe') {
            tabExterne?.classList.add('active');
            if (contentExterne) contentExterne.style.display = 'block';
            this.loadExterneAuswertung();
            if (actionBtn) actionBtn.style.display = 'none';
        } else if (tab === 'kalender') {
            tabKalender?.classList.add('active');
            if (contentKalender) contentKalender.style.display = 'block';
            this.loadKalender();
            if (actionBtn) actionBtn.style.display = 'none';
        } else if (tab === 'kurse') {
            tabKurse?.classList.add('active');
            if (contentKurse) contentKurse.style.display = 'block';
            this.loadKurse();
            if (actionBtn) {
                if (Auth.isAdmin()) {
                    actionBtn.textContent = '+ Neuer Kurs';
                    actionBtn.onclick = () => this.showNewKursForm();
                    actionBtn.style.display = '';
                } else {
                    actionBtn.style.display = 'none';
                }
            }
        } else if (tab === 'anwesenheit') {
            tabAnwesenheit?.classList.add('active');
            if (contentAnwesenheit) contentAnwesenheit.style.display = 'block';
            this.loadAnwesenheit();
            if (actionBtn) actionBtn.style.display = 'none';
        }
    },

    // Externe Mitarbeiter Auswertung laden
    loadExterneAuswertung: async function() {
        const allEntries = await DataManager.getTimeEntries();
        const projects = await DataManager.getProjects();
        const users = await DataManager.getUsers();

        // Nur externe Mitarbeiter
        const externeUsers = users.filter(u => u.userType === 'extern');
        const externeUserIds = externeUsers.map(u => u.id);

        // Filter-Dropdowns befuellen
        const userSelect = document.getElementById('externe-filter-user');
        const projectSelect = document.getElementById('externe-filter-project');

        if (userSelect && userSelect.options.length <= 1) {
            externeUsers.forEach(u => {
                userSelect.innerHTML += `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`;
            });
        }

        if (projectSelect && projectSelect.options.length <= 1) {
            projects.forEach(p => {
                projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
            });
        }

        // Filter anwenden
        const filterUserId = document.getElementById('externe-filter-user')?.value || '';
        const filterProjectId = document.getElementById('externe-filter-project')?.value || '';
        const filterFrom = document.getElementById('externe-filter-from')?.value || '';
        const filterTo = document.getElementById('externe-filter-to')?.value || '';

        // Nur Eintraege von externen Mitarbeitern
        let filteredEntries = allEntries.filter(e => externeUserIds.includes(e.userId));

        if (filterUserId) {
            filteredEntries = filteredEntries.filter(e => String(e.userId) === filterUserId);
        }
        if (filterProjectId) {
            filteredEntries = filteredEntries.filter(e => String(e.projectId) === filterProjectId);
        }
        if (filterFrom) {
            filteredEntries = filteredEntries.filter(e => e.date >= filterFrom);
        }
        if (filterTo) {
            filteredEntries = filteredEntries.filter(e => e.date <= filterTo);
        }

        // Gruppieren nach Mitarbeiter und Projekt
        const grouped = {};
        filteredEntries.forEach(entry => {
            const key = `${entry.userId}_${entry.projectId}`;
            if (!grouped[key]) {
                grouped[key] = {
                    userId: entry.userId,
                    projectId: entry.projectId,
                    hours: 0
                };
            }
            grouped[key].hours += entry.hours || 0;
        });

        // Tabelle rendern
        const tbody = document.getElementById('externe-auswertung-list');
        if (!tbody) return;

        const rows = Object.values(grouped);
        let totalHours = 0;
        let totalCosts = 0;
        const uniqueUsers = new Set();

        tbody.innerHTML = '';

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666; padding: 2rem;">Keine Einträge gefunden</td></tr>';
        } else {
            rows.forEach(row => {
                const user = users.find(u => String(u.id) === String(row.userId));
                const project = projects.find(p => String(p.id) === String(row.projectId));
                const hourlyRate = user?.hourlyRate || 0;
                const costs = row.hours * hourlyRate;

                totalHours += row.hours;
                totalCosts += costs;
                if (user) uniqueUsers.add(user.id);

                tbody.innerHTML += `
                    <tr>
                        <td>${user?.name || 'Unbekannt'}</td>
                        <td>${project?.name || 'Unbekannt'}</td>
                        <td style="text-align: right;">${row.hours.toFixed(1)}</td>
                        <td style="text-align: right;">${this.formatCurrency(hourlyRate)}</td>
                        <td style="text-align: right; font-weight: 600;">${this.formatCurrency(costs)}</td>
                    </tr>
                `;
            });

            // Summenzeile
            tbody.innerHTML += `
                <tr style="background: #f8f9fa; font-weight: 600;">
                    <td colspan="2">Gesamt</td>
                    <td style="text-align: right;">${totalHours.toFixed(1)}</td>
                    <td></td>
                    <td style="text-align: right;">${this.formatCurrency(totalCosts)}</td>
                </tr>
            `;
        }

        // Statistiken aktualisieren
        document.getElementById('stat-externe-stunden').textContent = totalHours.toFixed(1);
        document.getElementById('stat-externe-kosten').textContent = this.formatCurrency(totalCosts);
        document.getElementById('stat-externe-mitarbeiter').textContent = uniqueUsers.size;
    },

    resetExterneFilters: function() {
        const userSelect = document.getElementById('externe-filter-user');
        const projectSelect = document.getElementById('externe-filter-project');
        const fromDate = document.getElementById('externe-filter-from');
        const toDate = document.getElementById('externe-filter-to');

        if (userSelect) userSelect.value = '';
        if (projectSelect) projectSelect.value = '';
        if (fromDate) fromDate.value = '';
        if (toDate) toDate.value = '';

        this.loadExterneAuswertung();
    },

    // ==========================================
    // KALENDER-FUNKTIONEN
    // ==========================================

    // Kalender-State
    kalenderCurrentYear: new Date().getFullYear(),
    kalenderCurrentMonth: new Date().getMonth(), // 0-basiert
    kalenderEntries: [],

    /**
     * Lädt den Wartungskalender
     */
    loadKalender: async function() {
        // Filter-Dropdowns initialisieren (falls noch nicht geschehen)
        await this.initKalenderFilters();

        // Monat aus Filter oder aktuellen State
        const monthInput = document.getElementById('kalender-filter-monat');
        if (monthInput && monthInput.value) {
            const [year, month] = monthInput.value.split('-').map(Number);
            this.kalenderCurrentYear = year;
            this.kalenderCurrentMonth = month - 1; // 0-basiert
        } else if (monthInput) {
            // Standard: aktueller Monat
            monthInput.value = `${this.kalenderCurrentYear}-${String(this.kalenderCurrentMonth + 1).padStart(2, '0')}`;
        }

        // Alle Zeiteinträge laden
        const allEntries = await DataManager.getTimeEntries();
        const projects = await DataManager.getProjects();
        const users = await DataManager.getUsers();
        const suppliers = await DataManager.getDatevLieferanten();

        // Filter anwenden
        const filterProjekt = document.getElementById('kalender-filter-projekt')?.value || '';
        const filterTyp = document.getElementById('kalender-filter-typ')?.value || '';
        const filterLieferant = document.getElementById('kalender-filter-lieferant')?.value || '';

        // Einträge für aktuellen Monat filtern
        const year = this.kalenderCurrentYear;
        const month = this.kalenderCurrentMonth;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        let filteredEntries = allEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= startDate && entryDate <= endDate;
        });

        // Projekt-Filter
        if (filterProjekt) {
            filteredEntries = filteredEntries.filter(e => String(e.projectId) === filterProjekt);
        }

        // Typ-Filter (Mitarbeiter/Lieferant)
        if (filterTyp === 'mitarbeiter') {
            filteredEntries = filteredEntries.filter(e => !e.isSupplierEntry && !e.supplierPartitaIva);
        } else if (filterTyp === 'lieferant') {
            filteredEntries = filteredEntries.filter(e => e.isSupplierEntry || e.supplierPartitaIva);
        }

        // Lieferanten-Filter
        if (filterLieferant) {
            filteredEntries = filteredEntries.filter(e => e.supplierPartitaIva === filterLieferant);
        }

        // Einträge mit Namen anreichern
        this.kalenderEntries = filteredEntries.map(e => {
            let personName = '';
            if (e.supplierPartitaIva) {
                const supplier = suppliers.find(s => s.partitaIva === e.supplierPartitaIva);
                personName = supplier?.name || e.supplierPartitaIva;
            } else if (e.userId) {
                const user = users.find(u => String(u.id) === String(e.userId));
                personName = user?.name || user?.email || 'Unbekannt';
            }
            const project = projects.find(p => String(p.id) === String(e.projectId));
            return {
                ...e,
                personName,
                projectName: project?.name || 'Unbekannt'
            };
        });

        // Statistiken aktualisieren
        this.updateKalenderStatistiken();

        // Titel aktualisieren
        const monatNamen = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                           'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        document.getElementById('kalender-monat-titel').textContent =
            `${monatNamen[month]} ${year}`;

        // Kalender rendern
        this.renderKalender();
    },

    /**
     * Initialisiert die Kalender-Filter-Dropdowns
     */
    initKalenderFilters: async function() {
        const projektSelect = document.getElementById('kalender-filter-projekt');
        const lieferantSelect = document.getElementById('kalender-filter-lieferant');

        // Nur einmal initialisieren
        if (projektSelect && projektSelect.options.length <= 1) {
            const projects = await DataManager.getProjects();
            projects.forEach(p => {
                projektSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
            });
        }

        if (lieferantSelect && lieferantSelect.options.length <= 1) {
            const suppliers = await DataManager.getDatevLieferanten();
            suppliers.forEach(s => {
                const displayName = s.name || s.partitaIva;
                lieferantSelect.innerHTML += `<option value="${escapeHtml(s.partitaIva)}">${escapeHtml(displayName)}</option>`;
            });
        }
    },

    /**
     * Aktualisiert die Kalender-Statistiken
     */
    updateKalenderStatistiken: function() {
        const entries = this.kalenderEntries;
        const totalEntries = entries.length;
        const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
        const supplierHours = entries
            .filter(e => e.isSupplierEntry || e.supplierPartitaIva)
            .reduce((sum, e) => sum + (e.hours || 0), 0);

        document.getElementById('stat-kalender-eintraege').textContent = totalEntries;
        document.getElementById('stat-kalender-stunden').textContent = totalHours.toFixed(1);
        document.getElementById('stat-kalender-lieferanten').textContent = supplierHours.toFixed(1);
    },

    /**
     * Rendert den Monatskalender
     */
    renderKalender: function() {
        const container = document.getElementById('kalender-container');
        if (!container) return;

        const year = this.kalenderCurrentYear;
        const month = this.kalenderCurrentMonth;
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Erster Tag des Monats
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Wochentag des ersten Tages (0=So, 1=Mo, ... 6=Sa)
        // Umrechnen auf Mo=0, Di=1, ... So=6
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        // Einträge nach Tag gruppieren
        const entriesByDay = {};
        this.kalenderEntries.forEach(e => {
            const day = new Date(e.date).getDate();
            if (!entriesByDay[day]) entriesByDay[day] = [];
            entriesByDay[day].push(e);
        });

        // HTML generieren
        let html = '';

        // Leere Zellen vor dem ersten Tag
        for (let i = 0; i < startDayOfWeek; i++) {
            html += '<div class="kalender-tag kalender-tag-leer"></div>';
        }

        // Tage des Monats
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && today.getDate() === day;
            const dayEntries = entriesByDay[day] || [];
            const hasSupplierEntry = dayEntries.some(e => e.isSupplierEntry || e.supplierPartitaIva);
            const totalHours = dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

            let tagClass = 'kalender-tag';
            if (isToday) tagClass += ' kalender-tag-heute';
            if (dayEntries.length > 0) tagClass += ' kalender-tag-mit-eintraegen';

            html += `<div class="${tagClass}" onclick="App.showKalenderTagDetails(${year}, ${month + 1}, ${day})">`;
            html += `<div class="kalender-tag-nummer">${day}</div>`;

            if (dayEntries.length > 0) {
                html += `<div class="kalender-tag-stunden">${totalHours.toFixed(1)}h</div>`;

                // Max 3 Einträge anzeigen
                const displayEntries = dayEntries.slice(0, 3);
                displayEntries.forEach(e => {
                    const entryClass = (e.isSupplierEntry || e.supplierPartitaIva) ? 'kalender-eintrag lieferant' : 'kalender-eintrag';
                    html += `<div class="${entryClass}" title="${escapeHtml(e.description)}">${escapeHtml(e.personName)}</div>`;
                });

                if (dayEntries.length > 3) {
                    html += `<div class="kalender-mehr">+${dayEntries.length - 3} weitere</div>`;
                }
            }

            html += '</div>';
        }

        container.innerHTML = html;
    },

    /**
     * Zeigt Details für einen bestimmten Tag
     */
    showKalenderTagDetails: function(year, month, day) {
        const entries = this.kalenderEntries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
        });

        if (entries.length === 0) return;

        // Modal mit Tagesdetails
        const dateStr = `${day}.${month}.${year}`;
        let detailsHtml = entries.map(e => {
            const typeLabel = (e.isSupplierEntry || e.supplierPartitaIva)
                ? '<span class="badge badge-warning">Lieferant</span>'
                : '<span class="badge badge-primary">Mitarbeiter</span>';
            return `
                <div class="kalender-detail-eintrag" style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${escapeHtml(e.personName)}</strong>
                        ${typeLabel}
                    </div>
                    <div style="color: #666; font-size: 0.85rem; margin-top: 0.25rem;">${escapeHtml(e.projectName)}</div>
                    <div style="margin-top: 0.5rem;">${escapeHtml(e.description)}</div>
                    <div style="margin-top: 0.5rem; font-weight: 500;">${e.hours} Stunden</div>
                </div>
            `;
        }).join('');

        // Temporäres Modal erstellen
        const existingModal = document.getElementById('kalender-detail-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="kalender-detail-modal" class="modal-overlay show" onclick="if(event.target === this) this.remove()">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${dateStr}</h3>
                        <button class="modal-close" onclick="document.getElementById('kalender-detail-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 0; max-height: 400px; overflow-y: auto;">
                        ${detailsHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Vorheriger Monat im Kalender
     */
    kalenderPrevMonth: function() {
        this.kalenderCurrentMonth--;
        if (this.kalenderCurrentMonth < 0) {
            this.kalenderCurrentMonth = 11;
            this.kalenderCurrentYear--;
        }
        // Monat-Input aktualisieren
        const monthInput = document.getElementById('kalender-filter-monat');
        if (monthInput) {
            monthInput.value = `${this.kalenderCurrentYear}-${String(this.kalenderCurrentMonth + 1).padStart(2, '0')}`;
        }
        this.loadKalender();
    },

    /**
     * Nächster Monat im Kalender
     */
    kalenderNextMonth: function() {
        this.kalenderCurrentMonth++;
        if (this.kalenderCurrentMonth > 11) {
            this.kalenderCurrentMonth = 0;
            this.kalenderCurrentYear++;
        }
        // Monat-Input aktualisieren
        const monthInput = document.getElementById('kalender-filter-monat');
        if (monthInput) {
            monthInput.value = `${this.kalenderCurrentYear}-${String(this.kalenderCurrentMonth + 1).padStart(2, '0')}`;
        }
        this.loadKalender();
    },

    showNewTimeEntryForm: async function() {
        document.getElementById('time-form').reset();
        document.getElementById('time-form-id').value = '';
        document.getElementById('time-form-type').value = 'mitarbeiter';
        document.getElementById('time-modal-title').textContent = 'Zeit erfassen';

        // Typ auf Mitarbeiter setzen (Standard)
        this.switchTimeEntryType('mitarbeiter');

        // Projekt-Dropdown befüllen (async)
        const projectSelect = document.getElementById('time-project');
        const allProjects = await DataManager.getProjects();
        const projects = allProjects.filter(p => p.status !== 'abgeschlossen');
        projectSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        projects.forEach(p => {
            projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
        });

        // Mitarbeiter-Dropdown befüllen
        const userSelect = document.getElementById('time-user');
        const users = await DataManager.getUsers();
        const currentUser = await Auth.getCurrentUser();
        userSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        users.forEach(u => {
            const selected = currentUser && String(u.id) === String(currentUser.id) ? 'selected' : '';
            userSelect.innerHTML += `<option value="${escapeHtml(u.id)}" ${selected}>${escapeHtml(u.name || u.username || u.email)}</option>`;
        });

        // Lieferanten-Dropdown befüllen
        await this.populateTimeSupplierDropdown();

        // Heutiges Datum als Standard
        document.getElementById('time-date').value = new Date().toISOString().split('T')[0];

        this.showModal('time-form-modal');
    },

    /**
     * Wechselt zwischen Mitarbeiter- und Lieferanten-Modus im Zeiteintrag-Formular
     */
    switchTimeEntryType: function(type) {
        const userGroup = document.getElementById('time-user-group');
        const supplierGroup = document.getElementById('time-supplier-group');
        const userSelect = document.getElementById('time-user');
        const supplierSelect = document.getElementById('time-supplier');
        const btnMitarbeiter = document.getElementById('time-type-mitarbeiter');
        const btnLieferant = document.getElementById('time-type-lieferant');

        document.getElementById('time-form-type').value = type;

        if (type === 'lieferant') {
            // Lieferanten-Modus
            userGroup.style.display = 'none';
            supplierGroup.style.display = 'block';
            userSelect.removeAttribute('required');
            supplierSelect.setAttribute('required', 'required');
            btnMitarbeiter.classList.remove('active');
            btnLieferant.classList.add('active');
        } else {
            // Mitarbeiter-Modus (Standard)
            userGroup.style.display = 'block';
            supplierGroup.style.display = 'none';
            userSelect.setAttribute('required', 'required');
            supplierSelect.removeAttribute('required');
            btnMitarbeiter.classList.add('active');
            btnLieferant.classList.remove('active');
        }
    },

    /**
     * Befüllt das Lieferanten-Dropdown im Zeiteintrag-Formular
     */
    populateTimeSupplierDropdown: async function(selectedPartitaIva = null) {
        const select = document.getElementById('time-supplier');
        if (!select) return;

        const suppliers = await DataManager.getDatevLieferanten();
        select.innerHTML = '<option value="">Bitte wählen...</option>';
        suppliers.forEach(s => {
            const displayName = s.name || s.partitaIva;
            const selected = s.partitaIva === selectedPartitaIva ? 'selected' : '';
            select.innerHTML += `<option value="${escapeHtml(s.partitaIva)}" ${selected}>${escapeHtml(displayName)}</option>`;
        });
    },

    editTimeEntry: async function(entryId) {
        const allEntries = await DataManager.getTimeEntries();
        const entry = allEntries.find(e => e.id === entryId);
        if (!entry) return;

        // Typ bestimmen (Mitarbeiter oder Lieferant)
        const isSupplierEntry = entry.isSupplierEntry || !!entry.supplierPartitaIva;
        this.switchTimeEntryType(isSupplierEntry ? 'lieferant' : 'mitarbeiter');

        // Projekt-Dropdown befüllen (async)
        const projectSelect = document.getElementById('time-project');
        const projects = await DataManager.getProjects();
        projectSelect.innerHTML = '';
        projects.forEach(p => {
            const selected = String(p.id) === String(entry.projectId) ? 'selected' : '';
            projectSelect.innerHTML += `<option value="${escapeHtml(p.id)}" ${selected}>${escapeHtml(p.name)}</option>`;
        });

        // Mitarbeiter-Dropdown befüllen
        const userSelect = document.getElementById('time-user');
        const users = await DataManager.getUsers();
        userSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        users.forEach(u => {
            const selected = String(u.id) === String(entry.userId) ? 'selected' : '';
            userSelect.innerHTML += `<option value="${escapeHtml(u.id)}" ${selected}>${escapeHtml(u.name || u.username || u.email)}</option>`;
        });

        // Lieferanten-Dropdown befüllen
        await this.populateTimeSupplierDropdown(entry.supplierPartitaIva);

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
        const entryType = document.getElementById('time-form-type').value;
        const isSupplierEntry = entryType === 'lieferant';

        const entryData = {
            projectId: document.getElementById('time-project').value,
            date: document.getElementById('time-date').value,
            hours: parseFloat(document.getElementById('time-hours').value) || 0,
            description: document.getElementById('time-description').value
        };

        // Je nach Typ: Mitarbeiter oder Lieferant
        if (isSupplierEntry) {
            entryData.supplierPartitaIva = document.getElementById('time-supplier').value;
            entryData.userId = null;
        } else {
            entryData.userId = document.getElementById('time-user').value;
            entryData.supplierPartitaIva = null;
        }

        try {
            if (id) {
                await DataManager.updateTimeEntry(id, entryData);
            } else {
                await DataManager.addTimeEntry(entryData);
            }

            this.hideModal('time-form-modal');
            this.loadTimeTracking();
            this.showToast('success', 'Gespeichert', 'Zeiteintrag wurde gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('error', 'Fehler', 'Fehler beim Speichern des Zeiteintrags');
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
        // Sicherstellen, dass der erste Tab aktiv ist beim Laden
        const configTabs = document.querySelectorAll('#view-konfiguration .tab[data-tab]');
        const configContents = document.querySelectorAll('#view-konfiguration .tab-content');

        // Falls kein Tab aktiv ist, den ersten aktivieren
        const hasActiveTab = Array.from(configTabs).some(t => t.classList.contains('active'));
        if (!hasActiveTab && configTabs.length > 0) {
            configTabs[0].classList.add('active');
        }

        // Falls kein Tab-Content aktiv ist, den ersten aktivieren
        const hasActiveContent = Array.from(configContents).some(tc => tc.classList.contains('active'));
        if (!hasActiveContent && configContents.length > 0) {
            configContents[0].classList.add('active');
        }

        await this.loadCostTypes();
        await this.loadKontenplan();
        this.renderMwstSaetze();
        await this.loadSuppliers();
        await this.loadUsers();
        await this.loadKurseKonfig();
        await this.loadShopKategorien();
        this.loadExportTab();
    },

    /**
     * Rendert die MwSt-Sätze Tabelle in der Konfiguration
     */
    renderMwstSaetze: function() {
        const tbody = document.getElementById('mwst-saetze-list');
        if (!tbody) return;

        // Ländergruppen
        const laender = {
            '': 'Allgemein',
            'IT': 'Italien',
            'DE': 'Deutschland',
            'AT': 'Österreich',
            'CH': 'Schweiz',
            'BE': 'Belgien',
            'BG': 'Bulgarien',
            'CY': 'Zypern',
            'CZ': 'Tschechien',
            'DK': 'Dänemark',
            'EE': 'Estland',
            'ES': 'Spanien',
            'FI': 'Finnland',
            'FR': 'Frankreich',
            'GR': 'Griechenland',
            'HR': 'Kroatien',
            'HU': 'Ungarn',
            'IE': 'Irland',
            'LT': 'Litauen',
            'LU': 'Luxemburg',
            'LV': 'Lettland',
            'MT': 'Malta',
            'NL': 'Niederlande',
            'PL': 'Polen',
            'PT': 'Portugal',
            'RO': 'Rumänien',
            'SE': 'Schweden',
            'SI': 'Slowenien',
            'SK': 'Slowakei'
        };

        let html = '';
        let currentCountry = null;

        this.mwstSaetze.forEach(satz => {
            const countryName = laender[satz.country] || satz.country || 'Allgemein';

            // Gruppenkopf wenn Land wechselt
            if (satz.country !== currentCountry) {
                currentCountry = satz.country;
                html += `<tr style="background: #f8f9fa;">
                    <td colspan="3" style="font-weight: 600; color: #333; padding: 0.75rem;">
                        ${countryName}
                    </td>
                </tr>`;
            }

            html += `<tr>
                <td style="padding-left: 1.5rem; color: #666;">${satz.country || '-'}</td>
                <td><strong>${satz.rate}%</strong></td>
                <td>${satz.label}</td>
            </tr>`;
        });

        tbody.innerHTML = html;
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
            // Audit-Info für Geändert-Anzeige
            const auditInfo = formatAuditInfo(ct.created_by, ct.created_at, ct.updated_by, ct.updated_at);
            const updatedByName = resolveUserName(ct.updated_by || ct.created_by);
            const updatedAtFormatted = ct.updated_at ? this.formatDateTime(ct.updated_at) : (ct.created_at ? this.formatDateTime(ct.created_at) : '-');

            container.innerHTML += `
                <div class="config-item" title="${auditInfo}">
                    <div class="config-item-info">
                        <span class="badge" style="background: #e3f2fd; color: #1565c0; margin-right: 0.5rem;">${ct.code || ct.id}</span>
                        <span>${ct.name}</span>
                        ${!ct.active ? '<span class="badge badge-warning" style="margin-left: 0.5rem;">Inaktiv</span>' : ''}
                        <span style="margin-left: auto; font-size: 11px; color: #666;">
                            ${updatedAtFormatted}${updatedByName ? ` (${updatedByName})` : ''}
                        </span>
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
            const data = await ApiClient.getKontenplan();

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
            // Alle DATEV-Buchungen laden
            const buchungen = await ApiClient.getDatevBookings({ limit: 5000 });

            // Eindeutige Konten sammeln
            const verwendeteKonten = new Set();
            (buchungen || []).forEach(b => {
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
                const bezeichnungen = await ApiClient.getKontoBezeichnungen();

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
            container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">Keine Konten definiert</td></tr>';
            return;
        }

        const dbLabels = {
            'UMSATZ': '<span class="badge" style="background: #27ae60; color: white;">Umsatz</span>',
            'DB1_KOSTEN': '<span class="badge" style="background: #3498db; color: white;">DB1</span>',
            'DB2_KOSTEN': '<span class="badge" style="background: #f39c12; color: white;">DB2</span>',
            'DB3_KOSTEN': '<span class="badge" style="background: #e74c3c; color: white;">DB3</span>',
            'NEUTRAL': '<span class="badge" style="background: #95a5a6; color: white;">Neutral</span>'
        };

        container.innerHTML = accounts.map(acc => {
            // Audit-Info für Geändert-Spalte
            const auditInfo = formatAuditInfo(acc.created_by, acc.created_at, acc.updated_by, acc.updated_at);
            const updatedByName = resolveUserName(acc.updated_by || acc.created_by);
            const updatedAtFormatted = acc.updated_at ? this.formatDateTime(acc.updated_at) : (acc.created_at ? this.formatDateTime(acc.created_at) : '-');

            return `
            <tr>
                <td><code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${acc.konto_pattern}</code></td>
                <td>${acc.konto_name || '-'}</td>
                <td>${acc.kategorie || '-'}</td>
                <td>${dbLabels[acc.db_zuordnung] || acc.db_zuordnung}</td>
                <td>${acc.ist_projektbezogen ? Icons.check : '-'}</td>
                <td title="${auditInfo}" style="font-size: 12px;">
                    <div>${updatedAtFormatted}</div>
                    ${updatedByName ? `<small style="color: #666;">${updatedByName}</small>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="App.editAccount('${acc.id}')" title="Bearbeiten">${Icons.edit}</button>
                    <button class="btn btn-sm btn-danger" onclick="App.deleteAccount('${acc.id}')" title="Löschen">×</button>
                </td>
            </tr>
        `}).join('');
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
                await ApiClient.updateKontenplanEntry(id, accountData);
            } else {
                // Insert
                await ApiClient.createKontenplanEntry(accountData);
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
            await ApiClient.deleteKontenplanEntry(id);
            await this.loadKontenplan();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            alert('Fehler beim Löschen: ' + (error.message || 'Unbekannter Fehler'));
        }
    },

    loadSuppliers: async function() {
        // Lieferanten werden über die API geladen
        const container = document.getElementById('suppliers-list');
        if (!container) return; // Tab existiert nicht mehr

        try {
            const suppliers = await DataManager.getDatevLieferanten();
            container.innerHTML = '';

            if (!suppliers || suppliers.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Lieferanten definiert</p>';
                return;
            }

            suppliers.forEach(s => {
                container.innerHTML += `
                    <div class="config-item">
                        <div class="config-item-info">
                            <span style="font-weight: 500;">${s.name || s.fornitore_name || '-'}</span>
                            <span style="color: #666; font-size: 0.75rem; margin-left: 0.5rem;">${s.partitaIva || s.partita_iva || ''}</span>
                            ${s.isKursanbieter || s.is_kursanbieter ? '<span class="badge badge-primary" style="margin-left: 0.5rem;">Kursanbieter</span>' : ''}
                        </div>
                        <div class="config-item-actions">
                            <button class="btn btn-sm btn-outline" onclick="App.editLieferant('${s.partitaIva || s.partita_iva}')">Bearbeiten</button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            container.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 2rem;">Fehler beim Laden der Lieferanten</p>';
        }
    },

    /**
     * Zeigt das Formular für einen neuen Lieferanten
     */
    showNewSupplierForm: async function() {
        document.getElementById('supplier-form').reset();
        document.getElementById('supplier-form-partita-iva-original').value = '';
        document.getElementById('supplier-form-is-edit').value = 'false';
        document.getElementById('supplier-modal-title').textContent = 'Neuer Lieferant';

        // Partita IVA Feld aktivieren (bei neuem Lieferant editierbar)
        document.getElementById('supplier-partita-iva').disabled = false;

        // Checkbox zuruecksetzen
        document.getElementById('supplier-is-kursanbieter').checked = false;

        // Ansprechperson-Dropdown befüllen
        await this.populateSupplierContactDropdown(null);

        this.showModal('supplier-form-modal');
    },

    /**
     * Öffnet das Bearbeitungsmodal für einen Lieferanten
     * Ersetzt die alte editLieferantName Funktion mit prompt()
     */
    editLieferant: async function(partitaIva) {
        // Lieferant in Cache suchen
        const lieferant = this.allLieferanten.find(l => l.partitaIva === partitaIva);
        if (!lieferant) {
            this.showToast('error', 'Fehler', 'Lieferant nicht gefunden');
            return;
        }

        document.getElementById('supplier-form').reset();
        document.getElementById('supplier-form-partita-iva-original').value = partitaIva;
        document.getElementById('supplier-form-is-edit').value = 'true';
        document.getElementById('supplier-modal-title').textContent = 'Lieferant bearbeiten';

        // Felder befüllen
        document.getElementById('supplier-partita-iva').value = partitaIva;
        document.getElementById('supplier-partita-iva').disabled = true; // Partita IVA nicht änderbar
        document.getElementById('supplier-fornitore-nr').value = lieferant.fornitoreNr || '';
        document.getElementById('supplier-name').value = lieferant.name || '';
        document.getElementById('supplier-address').value = lieferant.address || '';
        document.getElementById('supplier-city').value = lieferant.city || '';
        document.getElementById('supplier-country').value = lieferant.country || 'IT';
        document.getElementById('supplier-is-kursanbieter').checked = lieferant.isKursanbieter || false;

        // Ansprechperson-Dropdown befüllen
        await this.populateSupplierContactDropdown(lieferant.contactUserId);

        this.showModal('supplier-form-modal');
    },

    /**
     * Befüllt das Ansprechperson-Dropdown im Lieferanten-Modal
     */
    populateSupplierContactDropdown: async function(selectedUserId) {
        const select = document.getElementById('supplier-contact-user');
        const users = this.allUsers || await DataManager.getUsers();

        select.innerHTML = '<option value="">-- Keine Ansprechperson --</option>';
        users.forEach(u => {
            const selected = u.id === selectedUserId ? 'selected' : '';
            select.innerHTML += `<option value="${escapeHtml(u.id)}" ${selected}>${escapeHtml(u.name || u.email)}</option>`;
        });
    },

    /**
     * Speichert das Lieferanten-Formular (Neu oder Bearbeiten)
     */
    saveSupplierForm: async function(event) {
        event.preventDefault();

        const isEdit = document.getElementById('supplier-form-is-edit').value === 'true';
        const originalPartitaIva = document.getElementById('supplier-form-partita-iva-original').value;

        const supplierData = {
            partitaIva: document.getElementById('supplier-partita-iva').value.trim().toUpperCase(),
            name: document.getElementById('supplier-name').value.trim(),
            fornitoreNr: document.getElementById('supplier-fornitore-nr').value.trim() || null,
            address: document.getElementById('supplier-address').value.trim() || null,
            city: document.getElementById('supplier-city').value.trim() || null,
            country: document.getElementById('supplier-country').value || 'IT',
            contactUserId: document.getElementById('supplier-contact-user').value || null,
            isKursanbieter: document.getElementById('supplier-is-kursanbieter').checked
        };

        // Validierung: Partita IVA Pflichtfeld
        if (!supplierData.partitaIva) {
            this.showToast('error', 'Fehler', 'Partita IVA ist ein Pflichtfeld');
            return;
        }

        // Validierung: Name Pflichtfeld
        if (!supplierData.name) {
            this.showToast('error', 'Fehler', 'Name ist ein Pflichtfeld');
            return;
        }

        try {
            if (isEdit) {
                // Bearbeiten
                await DataManager.updateSupplier(originalPartitaIva, supplierData);
                this.showToast('success', 'Gespeichert', 'Lieferant wurde aktualisiert');
            } else {
                // Neu anlegen
                await DataManager.addSupplier(supplierData);
                this.showToast('success', 'Gespeichert', 'Lieferant wurde angelegt');
            }

            this.hideModal('supplier-form-modal');
            // Lieferantenliste neu laden
            await this.loadLieferanten();

            // Auch Rechnungsliste aktualisieren falls sichtbar
            if (document.getElementById('view-rechnungen')?.classList.contains('active')) {
                this.filterRechnungen();
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Lieferanten:', error);
            this.showToast('error', 'Fehler', error.message || 'Lieferant konnte nicht gespeichert werden');
        }
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
            // Audit-Info für Geändert-Anzeige
            const auditInfo = formatAuditInfo(u.created_by, u.created_at, u.updated_by, u.updated_at);
            const updatedByName = resolveUserName(u.updated_by || u.created_by);
            const updatedAtFormatted = u.updated_at ? this.formatDateTime(u.updated_at) : (u.created_at ? this.formatDateTime(u.created_at) : '-');

            // Mitarbeitertyp Badge
            const userType = u.userType || 'intern';
            const userTypeBadge = userType === 'extern'
                ? '<span class="badge" style="background: #e67e22; color: white; margin-left: 0.5rem;">Extern</span>'
                : '<span class="badge" style="background: #3498db; color: white; margin-left: 0.5rem;">Intern</span>';

            container.innerHTML += `
                <div class="config-item" title="${auditInfo}">
                    <div class="config-item-info">
                        <span style="font-weight: 500;">${u.name}</span>
                        <span style="color: #888; font-size: 0.75rem; margin-left: 0.5rem;">${u.email || ''}</span>
                        <span class="badge badge-${u.role === 'admin' ? 'primary' : 'success'}" style="margin-left: 0.5rem;">
                            ${u.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                        </span>
                        ${userTypeBadge}
                        <span style="margin-left: auto; font-size: 11px; color: #666;">
                            ${updatedAtFormatted}${updatedByName ? ` (${updatedByName})` : ''}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight: 600;">${this.formatCurrency(u.hourlyRate || 0)}/Std.</span>
                        <button class="btn btn-sm btn-outline" onclick="App.editUser('${u.id}')">Bearbeiten</button>
                    </div>
                </div>
            `;
        });
    },

    // Neuen Mitarbeiter anlegen
    showNewUserForm: function() {
        document.getElementById('user-form').reset();
        document.getElementById('user-form-id').value = '';
        document.getElementById('user-modal-title').textContent = 'Neuer Mitarbeiter';
        document.getElementById('user-form-name').value = '';
        document.getElementById('user-form-email').value = '';
        document.getElementById('user-form-type').value = 'extern';
        document.getElementById('user-form-rate').value = '25';
        document.getElementById('user-form-role').value = 'mitarbeiter';

        // Name und E-Mail editierbar machen
        document.getElementById('user-form-name').disabled = false;
        document.getElementById('user-form-email').disabled = false;

        this.showModal('user-form-modal');
    },

    // Mitarbeiter bearbeiten
    editUser: function(userId) {
        const user = DataManager.getUserById(userId);
        if (!user) return;

        document.getElementById('user-form-id').value = user.id;
        document.getElementById('user-modal-title').textContent = 'Mitarbeiter bearbeiten';
        document.getElementById('user-form-name').value = user.name || '';
        document.getElementById('user-form-email').value = user.email || '';
        document.getElementById('user-form-type').value = user.userType || 'intern';
        document.getElementById('user-form-rate').value = user.hourlyRate || 0;
        document.getElementById('user-form-role').value = user.role || 'mitarbeiter';

        // Bei bestehendem User: Name/E-Mail nicht editierbar (da aus Auth)
        document.getElementById('user-form-name').disabled = true;
        document.getElementById('user-form-email').disabled = true;

        this.showModal('user-form-modal');
    },

    // Mitarbeiter speichern (neu oder bearbeiten)
    saveUser: async function(event) {
        event.preventDefault();

        const userId = document.getElementById('user-form-id').value;
        const name = document.getElementById('user-form-name').value.trim();
        const email = document.getElementById('user-form-email').value.trim();
        const userType = document.getElementById('user-form-type').value;
        const hourlyRate = parseFloat(document.getElementById('user-form-rate').value) || 0;
        const role = document.getElementById('user-form-role').value;

        try {
            if (userId) {
                // Bearbeiten
                await DataManager.updateUser(userId, {
                    userType: userType,
                    hourlyRate: hourlyRate,
                    role: role
                });
            } else {
                // Neuer Mitarbeiter
                if (!name) {
                    alert('Bitte geben Sie einen Namen ein.');
                    return;
                }
                await DataManager.addUser({
                    name: name,
                    email: email || null,
                    userType: userType,
                    hourlyRate: hourlyRate,
                    role: role
                });
            }
            this.hideModal('user-form-modal');
            await this.loadUsers();
            this.showToast('success', 'Gespeichert', 'Mitarbeiter wurde erfolgreich gespeichert.');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
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
                select.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
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

    // Projekte-Cache für Rechnungen-Dropdown
    cachedProjekteForRechnungen: [],

    loadRechnungen: async function() {
        // Statistiken aktualisieren
        const rechnungen = await DataManager.getRechnungenMitStatus();

        // Alle Rechnungen cachen für Verknüpfungs-Suche
        this.allRechnungenUnfiltered = rechnungen;

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

        // Projekte laden für Dropdown (alle, auch hideInReporting)
        try {
            this.cachedProjekteForRechnungen = await DataManager.getProjects();
        } catch (error) {
            console.error('Fehler beim Laden der Projekte:', error);
            this.cachedProjekteForRechnungen = [];
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

    /**
     * Generiert Projekt-Optionen für Dropdown in Rechnungen
     * @param {string} currentProjektId - Aktuell ausgewählte Projekt-ID
     * @returns {string} HTML-Optionen
     */
    getProjektOptionsHtml: function(currentProjektId) {
        const projects = this.cachedProjekteForRechnungen || [];

        // Sortiere Projekte: Erst nach datevId (numerisch), dann nach Name
        const sortedProjects = [...projects].sort((a, b) => {
            const aId = parseInt(a.datevId) || 9999;
            const bId = parseInt(b.datevId) || 9999;
            if (aId !== bId) return aId - bId;
            return (a.name || '').localeCompare(b.name || '');
        });

        let html = '<option value="">-- Kein Projekt --</option>';

        for (const project of sortedProjects) {
            const projektId = project.datevId || project.id;
            const isSelected = String(currentProjektId) === String(projektId);
            const statusBadge = project.status === 'abgeschlossen' ? ' [abgeschl.]' : '';
            html += `<option value="${projektId}" ${isSelected ? 'selected' : ''}>${project.name}${statusBadge}</option>`;
        }

        return html;
    },

    populateRechnungenFilters: async function() {
        // Jahr-Filter befüllen - dynamisch aus vorhandenen DATEV-Buchungen
        const jahrSelect = document.getElementById('rechnung-filter-jahr');
        if (jahrSelect) {
            const currentYear = new Date().getFullYear();

            // Verfügbare Jahre aus DATEV-Buchungen laden
            let availableYears = [];
            try {
                availableYears = await ExcelImportService.getAvailableYears();
            } catch (e) {
                console.warn('Konnte Jahre nicht laden:', e);
            }

            // Falls keine Jahre gefunden, Fallback auf 2018 bis aktuell
            if (!availableYears || availableYears.length === 0) {
                availableYears = [];
                for (let y = currentYear; y >= 2018; y--) {
                    availableYears.push(y);
                }
            }

            // Sicherstellen dass aktuelles Jahr dabei ist
            if (!availableYears.includes(currentYear)) {
                availableYears.unshift(currentYear);
            }

            // Sortieren (neueste zuerst)
            availableYears.sort((a, b) => b - a);

            jahrSelect.innerHTML = `<option value="">Alle Jahre</option>`;
            availableYears.forEach(year => {
                const selected = year === currentYear ? 'selected' : '';
                jahrSelect.innerHTML += `<option value="${year}" ${selected}>${year}</option>`;
            });
        }

        // Projekt-Filter
        const projektSelect = document.getElementById('rechnung-filter-projekt');
        projektSelect.innerHTML = '<option value="">Alle Projekte</option>';
        const projekte = DataManager.getAllKunstMeranProjekte();
        projekte.forEach(p => {
            projektSelect.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
        });

        // Lieferanten-Filter (async wegen Supabase)
        const lieferantSelect = document.getElementById('rechnung-filter-lieferant');
        lieferantSelect.innerHTML = '<option value="">Alle Lieferanten</option>';
        const lieferanten = await DataManager.getDatevLieferanten();
        if (Array.isArray(lieferanten)) {
            lieferanten.forEach(l => {
                if (l.name) {
                    lieferantSelect.innerHTML += `<option value="${escapeHtml(l.partitaIva)}">${escapeHtml(l.name)}</option>`;
                }
            });
        }

        // Abgabestelle-Filter mit aktiven Abgabestellen aus Einnahmenplanung
        const abgabestelleSelect = document.getElementById('rechnung-filter-abgabestelle');
        if (abgabestelleSelect) {
            let html = `<option value="">Alle</option>`;
            if (this.activeAbgabestellen && this.activeAbgabestellen.length > 0) {
                this.activeAbgabestellen.forEach(ab => {
                    const displayText = ab.name ? `${ab.code} - ${ab.name}` : ab.code;
                    html += `<option value="funding:${ab.id}">${displayText}</option>`;
                });
            }
            abgabestelleSelect.innerHTML = html;
        }

        // Massenaktions-Buttons für Abgabestellen befüllen
        this.populateMassAbgabestelleButtons();
    },

    // Erstellt die Massenaktions-Buttons für Abgabestellen (nur aus Einnahmenplanung)
    populateMassAbgabestelleButtons: function() {
        const container = document.getElementById('mass-abgabestelle-buttons');
        if (!container) return;

        let html = '';

        // Nur aktive Einnahmen aus der Einnahmenplanung als Buttons
        if (this.activeAbgabestellen && this.activeAbgabestellen.length > 0) {
            this.activeAbgabestellen.forEach(ab => {
                const shortName = ab.code || (ab.name ? ab.name.substring(0, 15) : '?');
                const titleText = ab.name ? `${ab.code} - ${ab.name}` : ab.code;
                html += `<button class="btn btn-sm btn-outline" onclick="App.massSetAbgabestelle('funding:${ab.id}')" title="${titleText}" style="background: #e8f5e9;">${shortName}</button>`;
            });
        } else {
            html = '<span style="color: #666; font-size: 0.8rem;">Keine Abgabestellen in Einnahmenplanung definiert</span>';
        }

        container.innerHTML = html;
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
        const meineRechnungenFilter = document.getElementById('rechnung-filter-meine')?.checked || false;

        let rechnungen = await DataManager.getRechnungenMitStatus();

        // Lieferanten und Users laden für Ansprechperson-Anreicherung
        const lieferanten = await DataManager.getDatevLieferanten();
        const users = await DataManager.getUsers();

        // Maps für schnellen Lookup erstellen
        const lieferantenMap = new Map();
        lieferanten.forEach(l => {
            if (l.partitaIva) lieferantenMap.set(l.partitaIva, l);
        });
        const userMap = new Map();
        users.forEach(u => {
            userMap.set(u.id, u.name || u.email || 'Unbekannt');
        });

        // Rechnungen mit Ansprechperson-Infos anreichern
        rechnungen = rechnungen.map(r => {
            const lieferant = lieferantenMap.get(r.partitaIva);
            const contactUserId = lieferant?.contactUserId || null;
            const contactUserName = contactUserId ? userMap.get(contactUserId) : null;
            return {
                ...r,
                contactUserId,
                contactUserName
            };
        });

        // Filter: "Meine Rechnungen" (ohne Projekt, wo ich Ansprechperson bin)
        if (meineRechnungenFilter) {
            const currentUser = (await SupabaseService.client.auth.getUser()).data.user;
            rechnungen = rechnungen.filter(r =>
                !r.projektId && r.contactUserId === currentUser?.id
            );
        }

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
        if (typeof DataManager !== 'undefined' && DataManager.invalidateRechnungenCache) {
            DataManager.invalidateRechnungenCache();
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
            } else {
                // DATEV-Buchung: Dropdown zur Projekt-Auswahl (dynamisch aus DB)
                const selectId = `projekt-select-${r.rechnungId}`.replace(/[^a-zA-Z0-9-]/g, '');
                const currentProjektId = r.projektId ? String(r.projektId) : '';
                const contactInfo = r.contactUserName
                    ? `<div style="font-size: 0.7rem; color: #666; margin-top: 0.25rem;">
                        <span title="Zuständig für Rechnungskontrolle">👤 ${r.contactUserName}</span>
                       </div>`
                    : '';
                projektCell = `
                    <div>
                        <select class="form-control"
                                id="${selectId}"
                                style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                                onchange="App.setProjektForRechnung('${r.rechnungId}', this.value)">
                            ${this.getProjektOptionsHtml(currentProjektId)}
                        </select>
                        ${contactInfo}
                    </div>`;
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
                                style="font-size: 0.7rem; padding: 0.15rem 1.2rem 0.15rem 0.25rem; width: auto; min-width: 50px; text-align: right;"
                                onchange="App.updateMwstRate('${r.id}', this.value)"
                                ${r.isSupabaseOnly ? 'disabled title="Nur für DATEV-Buchungen"' : ''}>
                            ${this.getMwstOptions(mwstRate)}
                        </select>
                        <span style="min-width: 60px; text-align: right;">${this.formatCurrency(mwst)}</span>
                    </div>
                </td>
                <td style="text-align: right; ${betragStyle}">${this.formatCurrency(gesamt)}</td>
                <td>${this.getStatusDropdown(r)}</td>
                <td>${r.pdfExists ?
                    (() => {
                        const uploadId = r.id ? `id:${r.id}` : r.rechnungId;
                        const uniqueId = r.id || r.rechnungId || `${r.partitaIva}-${rowNumber}`;
                        const safeId = String(uniqueId).replace(/[^a-zA-Z0-9-]/g, '');
                        const addPdfInputId = `add-pdf-${safeId}`;
                        const dropZoneId = `dropzone-existing-${safeId}`;
                        const pdfCount = r.pdfCount || 1;
                        const linkedInvoices = r.linkedInvoices || [];

                        // Wenn mehrere PDFs existieren, alle anzeigen - jedes mit eigenem X zum Entfernen
                        let pdfLinks = '';
                        if (linkedInvoices.length > 1) {
                            pdfLinks = linkedInvoices.map((inv, idx) =>
                                `<span style="display: inline-flex; align-items: center; margin-right: 0.25rem; background: #e3f2fd; border-radius: 3px; padding: 0 0.25rem;">
                                    <a class="pdf-link" onclick="App.showPdfPreview('${r.partitaIva}', '${r.dokumentNr}', '${inv.filePath || ''}')" style="margin-right: 0.15rem;">PDF${idx + 1}</a>
                                    <button class="btn btn-sm" style="padding: 0; font-size: 0.6rem; background: transparent; color: #ff5722; border: none; cursor: pointer; line-height: 1;"
                                        onclick="App.unlinkPdfFromDatev('${inv.id}')" title="PDF${idx + 1} trennen">×</button>
                                </span>`
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
                            ${linkedInvoices.length === 1 && r.invoiceId ? `<button class="btn btn-sm"
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
                <td style="font-size: 0.75rem; color: #666;" title="${formatAuditInfo(r.created_by, r.created_at, r.updated_by, r.updated_at)}">
                    ${(() => {
                        // Debug: Zeige Audit-Felder in Console für erste 3 Rechnungen
                        if (index < 3) {
                            console.log(`🔍 Rechnung ${r.dokumentNr || r.rechnungId}:`, {
                                updated_by: r.updated_by,
                                updated_at: r.updated_at,
                                created_by: r.created_by,
                                created_at: r.created_at,
                                updatedAt: r.updatedAt,
                                invoiceId: r.invoiceId,
                                resolvedName: resolveUserName(r.updated_by || r.created_by)
                            });
                        }
                        return r.updatedAt ? `<div>${this.formatDateTime(r.updatedAt)}</div><div style="font-size: 0.65rem; color: #999;">${resolveUserName(r.updated_by || r.created_by) || ''}</div>` : '-';
                    })()}
                </td>
                <td>${this.getAbgabestelleDropdown(r.rechnungId, r.funding_source_id, r.isSupabaseOnly, r.invoiceId)}</td>
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
                        ${r.pdfExists || r.filePath ?
                            `<button class="btn btn-sm btn-outline" onclick="App.showPdfPreview('${r.partitaIva || ''}', '${r.dokumentNr || ''}', '${r.filePath || ''}')" title="PDF anzeigen">👁</button>` :
                        ''}
                        ${r.workflowStatus === 'uploaded' ?
                            `<button class="btn btn-sm btn-primary" onclick="App.changeInvoiceStatus('${r.invoiceId}', 'kontrolliert')" title="Als kontrolliert markieren">${Icons.check}</button>` :
                        r.workflowStatus === 'kontrolliert' && DataManager.isAdmin() ?
                            `<button class="btn btn-sm btn-success" onclick="App.changeInvoiceStatus('${r.invoiceId}', 'bezahlt')" title="Als bezahlt markieren">€</button>` :
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
        // ALLE DATEV-Buchungen ohne pdfExists (nicht gefiltert!)
        const allRechnungen = this.allRechnungenUnfiltered || this.filteredRechnungen || [];
        const unlinked = allRechnungen.filter(r => !r.isSupabaseOnly && !r.pdfExists);

        return unlinked.map(r => {
            const projekt = DataManager.getKunstMeranProjekt(r.projektId);
            const projektName = projekt?.name || r.projektId || 'N/A';
            // Format muss mit linkInvoiceToDatevFromInput übereinstimmen
            const label = `${r.fornitoreName} - ${r.dokumentNr} - ${projektName} - ${this.formatCurrency(r.betrag)}`;
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
            // Lade ALLE Rechnungen (nicht nur gefilterte), um die DATEV-Bewegung zu finden
            const allRechnungen = await DataManager.getRechnungenMitStatus();
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
     * und synchronisiert den Workflow-Status
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

            // Zuerst: Invoice-Status laden (falls vorhanden)
            const { data: invoiceData } = await SupabaseService.client
                .from('invoices')
                .select('workflow_status, kontrolled_at, kontrolled_by, paid_at, paid_by')
                .eq('id', invoiceId)
                .single();

            // DATEV-Bewegung Status laden
            const { data: datevData } = await SupabaseService.client
                .from('datev_bookings')
                .select('workflow_status, kontrolled_at, kontrolled_by, paid_at, paid_by')
                .eq('partita_iva', partitaIva)
                .eq('dokument_nr', dokumentNr)
                .single();

            // Status-Synchronisation: Der "höhere" Status gewinnt (bezahlt > kontrolliert > neu)
            const statusPriority = { 'neu': 0, 'kontrolliert': 1, 'bezahlt': 2 };
            const invoiceStatus = invoiceData?.workflow_status || 'neu';
            const datevStatus = datevData?.workflow_status || 'neu';

            let finalStatus = invoiceStatus;
            let finalKontrolledAt = invoiceData?.kontrolled_at;
            let finalKontrolledBy = invoiceData?.kontrolled_by;
            let finalPaidAt = invoiceData?.paid_at;
            let finalPaidBy = invoiceData?.paid_by;

            // Wenn DATEV-Status höher ist, übernehme diesen
            if ((statusPriority[datevStatus] || 0) > (statusPriority[invoiceStatus] || 0)) {
                finalStatus = datevStatus;
                finalKontrolledAt = datevData?.kontrolled_at;
                finalKontrolledBy = datevData?.kontrolled_by;
                finalPaidAt = datevData?.paid_at;
                finalPaidBy = datevData?.paid_by;
            }

            // Update Invoice: Verknüpfung + Status-Sync
            const { data, error } = await SupabaseService.client
                .from('invoices')
                .update({
                    partita_iva: partitaIva,
                    invoice_number: dokumentNr,
                    workflow_status: finalStatus,
                    kontrolled_at: finalKontrolledAt,
                    kontrolled_by: finalKontrolledBy,
                    paid_at: finalPaidAt,
                    paid_by: finalPaidBy
                })
                .eq('id', invoiceId);

            if (error) {
                console.error('Supabase Verknüpfungs-Error:', error);
                throw error;
            }

            // Auch DATEV-Buchung aktualisieren falls Invoice-Status höher war
            if ((statusPriority[invoiceStatus] || 0) > (statusPriority[datevStatus] || 0)) {
                await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: finalStatus,
                        kontrolled_at: invoiceData?.kontrolled_at,
                        kontrolled_by: invoiceData?.kontrolled_by,
                        paid_at: invoiceData?.paid_at,
                        paid_by: invoiceData?.paid_by
                    })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);
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
                    invoice_number: null,
                    linked_booking_id: null
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
            let successCount = 0;
            let errorCount = 0;

            for (const rechnungId of this.selectedRechnungen) {
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                // Query bauen - partita_iva kann NULL oder leer sein
                let query = SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: 'kontrolliert',
                        kontrolled_at: heute,
                        kontrolled_by: user?.id
                    });

                // partita_iva: Wenn leer, nach NULL oder leerem String suchen
                if (partitaIva && partitaIva.trim() !== '') {
                    query = query.eq('partita_iva', partitaIva);
                } else {
                    query = query.or('partita_iva.is.null,partita_iva.eq.');
                }
                query = query.eq('dokument_nr', dokumentNr);

                const { data, error } = await query.select('id');

                if (error) {
                    console.error('Fehler bei Update:', { rechnungId, partitaIva, dokumentNr, error });
                    errorCount++;
                } else {
                    console.log(`✅ ${data?.length || 0} Buchungen für ${dokumentNr} als kontrolliert markiert`);
                    successCount++;
                    DataManager.markAsKontrolliert(rechnungId);
                }
            }

            if (errorCount > 0) {
                this.showToast('warning', 'Teilweise erledigt', `${successCount} erfolgreich, ${errorCount} Fehler`);
            } else {
                this.showToast('success', 'Erledigt', `${count} Rechnung(en) als kontrolliert markiert`);
            }
        } catch (error) {
            console.error('Fehler bei Massen-Markierung:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }

        this.clearSelection();
        await this.loadRechnungen();
    },

    massMarkNeu: async function() {
        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) auf "neu" zurücksetzen?`)) return;

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const rechnungId of this.selectedRechnungen) {
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                // Query bauen - partita_iva kann NULL oder leer sein
                let query = SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: 'neu',
                        kontrolled_at: null,
                        kontrolled_by: null,
                        paid_at: null,
                        paid_by: null
                    });

                // partita_iva: Wenn leer, nach NULL oder leerem String suchen
                if (partitaIva && partitaIva.trim() !== '') {
                    query = query.eq('partita_iva', partitaIva);
                } else {
                    query = query.or('partita_iva.is.null,partita_iva.eq.');
                }
                query = query.eq('dokument_nr', dokumentNr);

                const { data, error } = await query.select('id');

                if (error) {
                    console.error('Fehler bei Update:', { rechnungId, partitaIva, dokumentNr, error });
                    errorCount++;
                } else {
                    console.log(`✅ ${data?.length || 0} Buchungen für ${dokumentNr} auf neu zurückgesetzt`);
                    successCount++;
                    DataManager.setRechnungStatus(rechnungId, {
                        status: 'neu',
                        kontrolliertAm: null,
                        kontrolliertVon: null,
                        bezahltAm: null
                    });
                }
            }

            if (errorCount > 0) {
                this.showToast('warning', 'Teilweise erledigt', `${successCount} erfolgreich, ${errorCount} Fehler`);
            } else {
                this.showToast('success', 'Erledigt', `${count} Rechnung(en) auf "neu" zurückgesetzt`);
            }
        } catch (error) {
            console.error('Fehler bei Massen-Zurücksetzen:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }

        this.clearSelection();
        await this.loadRechnungen();
    },

    massMarkBezahlt: async function() {
        // Berechtigungen prüfen: Nur Admin darf auf "bezahlt" setzen
        if (!DataManager.isAdmin()) {
            this.showToast('error', 'Keine Berechtigung', 'Nur Admins können Rechnungen als bezahlt markieren');
            return;
        }

        if (this.selectedRechnungen.size === 0) return;

        const count = this.selectedRechnungen.size;
        if (!confirm(`${count} Rechnung(en) als bezahlt markieren?`)) return;

        try {
            const heute = new Date().toISOString().split('T')[0];
            const user = (await SupabaseService.client.auth.getUser()).data.user;
            let successCount = 0;
            let errorCount = 0;

            for (const rechnungId of this.selectedRechnungen) {
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                // Query bauen - partita_iva kann NULL oder leer sein
                let query = SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        workflow_status: 'bezahlt',
                        paid_at: heute,
                        paid_by: user?.id
                    });

                // partita_iva: Wenn leer, nach NULL oder leerem String suchen
                if (partitaIva && partitaIva.trim() !== '') {
                    query = query.eq('partita_iva', partitaIva);
                } else {
                    query = query.or('partita_iva.is.null,partita_iva.eq.');
                }
                query = query.eq('dokument_nr', dokumentNr);

                const { data, error } = await query.select('id');

                if (error) {
                    console.error('Fehler bei Update:', { rechnungId, partitaIva, dokumentNr, error });
                    errorCount++;
                } else {
                    console.log(`✅ ${data?.length || 0} Buchungen für ${dokumentNr} als bezahlt markiert`);
                    successCount++;
                    DataManager.markAsBezahlt(rechnungId);
                }
            }

            if (errorCount > 0) {
                this.showToast('warning', 'Teilweise erledigt', `${successCount} erfolgreich, ${errorCount} Fehler`);
            } else {
                this.showToast('success', 'Erledigt', `${count} Rechnung(en) als bezahlt markiert`);
            }
        } catch (error) {
            console.error('Fehler bei Massen-Markierung:', error);
            this.showToast('error', 'Fehler', 'Status konnte nicht geändert werden');
        }

        this.clearSelection();
        await this.loadRechnungen();
    },

    /**
     * Projekt für eine DATEV-Buchung setzen
     */
    setProjektForRechnung: async function(rechnungId, projektId) {
        try {
            let query;
            // Bei leerem projektId wird null gesetzt (Projekt entfernen)
            const updates = await addAuditMetadata({ projekt_id: projektId || null });

            // Format 1: "id:123" - Datenbank-ID direkt
            if (rechnungId.startsWith('id:')) {
                const dbId = rechnungId.substring(3);
                query = SupabaseService.client
                    .from('datev_bookings')
                    .update(updates)
                    .eq('id', dbId);
            } else {
                // Format 2: partitaIva_dokumentNr
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                query = SupabaseService.client
                    .from('datev_bookings')
                    .update(updates)
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);
            }

            const { error } = await query;
            if (error) throw error;

            if (projektId) {
                this.showToast('success', 'Projekt gesetzt', `Projekt wurde zugewiesen`);
            } else {
                this.showToast('success', 'Projekt entfernt', `Projektzuweisung wurde aufgehoben`);
            }

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
            let archivedCount = 0;

            // Hole alle Rechnungen um die DB-ID zu finden
            const allRechnungen = this.filteredRechnungen || [];

            for (const rechnungId of this.selectedRechnungen) {
                console.log('Archiviere:', rechnungId);

                // Versuche zuerst die Rechnung in filteredRechnungen zu finden (hat DB-ID)
                const rechnung = allRechnungen.find(r => r.rechnungId === rechnungId);

                // Wenn wir die DB-ID haben, direkt damit archivieren (zuverlässigste Methode)
                if (rechnung && rechnung.id && !rechnung.isSupabaseOnly) {
                    const { error } = await SupabaseService.client
                        .from('datev_bookings')
                        .update({
                            archived: true,
                            archived_at: heute
                        })
                        .eq('id', rechnung.id);
                    if (error) {
                        console.error('Archiv-Fehler (via DB-ID):', error);
                    } else {
                        archivedCount++;
                    }
                    continue;
                }

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
                    if (error) {
                        console.error('Archiv-Fehler (id:):', error);
                    } else {
                        archivedCount++;
                    }
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
                    if (error) {
                        console.error('Archiv-Fehler (invoice):', error);
                    } else {
                        archivedCount++;
                    }
                }
                // Format 3: "partitaIva_dokumentNr" - DATEV-Buchung mit Rechnungsnummer
                else {
                    const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                    const dokumentNr = dokumentNrParts.join('_');

                    // Archivieren mit partitaIva und dokumentNr
                    if (dokumentNr) {
                        const { data, error } = await SupabaseService.client
                            .from('datev_bookings')
                            .update({
                                archived: true,
                                archived_at: heute
                            })
                            .eq('partita_iva', partitaIva)
                            .eq('dokument_nr', dokumentNr)
                            .select();
                        if (error) {
                            console.error('Archiv-Fehler (partita_dokumentNr):', error);
                        } else if (data && data.length > 0) {
                            archivedCount++;
                        } else {
                            // Fallback: Nur nach dokumentNr suchen (falls partitaIva leer)
                            const { data: data2, error: error2 } = await SupabaseService.client
                                .from('datev_bookings')
                                .update({
                                    archived: true,
                                    archived_at: heute
                                })
                                .eq('dokument_nr', dokumentNr)
                                .select();
                            if (!error2 && data2 && data2.length > 0) {
                                archivedCount++;
                            } else {
                                console.warn('Konnte nicht archivieren:', rechnungId);
                            }
                        }
                    } else {
                        console.warn('Kann nicht archivieren ohne dokumentNr:', rechnungId);
                    }
                }
            }

            this.showToast('success', 'Archiviert', `${archivedCount} Rechnung(en) archiviert`);
        } catch (error) {
            console.error('Fehler beim Archivieren:', error);
            this.showToast('error', 'Fehler', 'Archivierung fehlgeschlagen');
        }

        this.clearSelection();
        await DataManager.clearCache();
        this.loadRechnungen();
    },

    /**
     * Löscht ausgewählte Rechnungen (PDFs und DATEV-Buchungen)
     * DATEV-Buchungen werden beim nächsten Import wieder angelegt
     */
    massDelete: async function() {
        if (this.selectedRechnungen.size === 0) return;

        const allRechnungen = this.filteredRechnungen || [];
        const selectedList = Array.from(this.selectedRechnungen);

        // Kategorisiere die Einträge
        const invoiceIds = [];      // Supabase-only PDFs
        const datevBookings = [];   // DATEV-Buchungen (mit DB-ID)

        for (const rechnungId of selectedList) {
            // Suche die Rechnung in filteredRechnungen um Typ zu bestimmen
            const rechnung = allRechnungen.find(r => r.rechnungId === rechnungId);

            console.log('🗑️ massDelete - Prüfe:', {
                rechnungId,
                gefunden: !!rechnung,
                isSupabaseOnly: rechnung?.isSupabaseOnly,
                dbId: rechnung?.id,
                dokumentNr: rechnung?.dokumentNr
            });

            if (rechnung) {
                // Rechnung gefunden - basierend auf Eigenschaften kategorisieren
                if (rechnung.isSupabaseOnly) {
                    // Supabase-only Invoice (UUID)
                    invoiceIds.push(rechnung.id);
                    console.log('  → Als Invoice kategorisiert');
                } else if (rechnung.id) {
                    // DATEV-Buchung mit DB-ID
                    datevBookings.push({ rechnungId, dbId: rechnung.id, dokumentNr: rechnung.dokumentNr });
                    console.log('  → Als DATEV-Buchung kategorisiert, dbId:', rechnung.id);
                } else {
                    console.log('  → Keine ID gefunden, wird übersprungen');
                }
            } else if (rechnungId.startsWith('id:')) {
                // Format id:123 (DATEV ohne dokumentNr)
                datevBookings.push({ rechnungId, dbId: rechnungId.substring(3), dokumentNr: null });
                console.log('  → id: Format erkannt');
            } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rechnungId)) {
                // UUID = Invoice
                invoiceIds.push(rechnungId);
                console.log('  → UUID erkannt');
            } else {
                console.log('  → Nicht kategorisiert!');
            }
        }

        console.log('🗑️ Ergebnis:', { invoiceIds, datevBookings });

        const totalCount = invoiceIds.length + datevBookings.length;
        if (totalCount === 0) {
            this.showToast('warning', 'Hinweis', 'Keine löschbaren Einträge ausgewählt.');
            return;
        }

        let message = `${totalCount} Eintrag/Einträge löschen?\n\n`;
        if (invoiceIds.length > 0) {
            message += `• ${invoiceIds.length} PDF(s) ohne DATEV-Verknüpfung (werden dauerhaft gelöscht)\n`;
        }
        if (datevBookings.length > 0) {
            message += `• ${datevBookings.length} DATEV-Buchung(en) (werden beim nächsten Import wieder angelegt)\n`;
        }
        message += '\nFortfahren?';

        if (!confirm(message)) return;

        try {
            let deletedCount = 0;

            // 1. Supabase-only PDFs löschen
            for (const invoiceId of invoiceIds) {
                // PDF aus Storage löschen
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

                // Invoice-Eintrag löschen
                const { error } = await SupabaseService.client
                    .from('invoices')
                    .delete()
                    .eq('id', invoiceId);

                if (!error) deletedCount++;
            }

            // 2. DATEV-Buchungen löschen (inkl. verknüpfte PDFs)
            for (const booking of datevBookings) {
                // Erst alle verknüpften Invoices holen
                const { data: linkedInvoices } = await SupabaseService.client
                    .from('invoices')
                    .select('id, file_path')
                    .eq('linked_booking_id', booking.dbId);

                // Verknüpfte PDFs aus Storage löschen
                if (linkedInvoices && linkedInvoices.length > 0) {
                    for (const inv of linkedInvoices) {
                        if (inv.file_path) {
                            await SupabaseService.client.storage
                                .from('invoices')
                                .remove([inv.file_path]);
                            console.log('PDF aus Storage gelöscht:', inv.file_path);
                        }
                    }

                    // Invoice-Einträge löschen
                    const invoiceIds = linkedInvoices.map(inv => inv.id);
                    await SupabaseService.client
                        .from('invoices')
                        .delete()
                        .in('id', invoiceIds);
                    console.log('Invoice-Einträge gelöscht:', invoiceIds.length);
                }

                // Dann DATEV-Buchung löschen
                const { error } = await SupabaseService.client
                    .from('datev_bookings')
                    .delete()
                    .eq('id', booking.dbId);

                if (error) {
                    console.error('Lösch-Fehler für DATEV-Buchung:', booking.dbId, error);
                } else {
                    deletedCount++;
                    console.log('DATEV-Buchung gelöscht:', booking.dokumentNr || booking.dbId);
                }
            }

            this.showToast('success', 'Gelöscht', `${deletedCount} Eintrag/Einträge gelöscht`);
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

        // Bezahlt-Checkbox und Datum nur für Admin editierbar (außer es ist bereits bezahlt)
        const isAdmin = DataManager.isAdmin();
        const bezahltCheckbox = document.getElementById('rd-bezahlt-check');
        const bezahltDatum = document.getElementById('rd-bezahlt-datum');
        if (!isAdmin && !istBezahlt) {
            bezahltCheckbox.disabled = true;
            bezahltCheckbox.title = 'Nur Admins können Rechnungen als bezahlt markieren';
        } else {
            bezahltCheckbox.disabled = false;
            bezahltCheckbox.title = '';
        }
        // Datum-Feld: Für Admin immer editierbar wenn bezahlt, für Nicht-Admin immer deaktiviert
        if (!isAdmin) {
            bezahltDatum.disabled = true;
        }

        // Kostentyp mit Datum
        document.getElementById('rd-kostentyp').value = rechnung.kostentyp || '';
        document.getElementById('rd-kostentyp-datum').value = rechnung.kostentypAm || '';

        // Abgabestelle-Dropdown mit aktiven Abgabestellen befüllen
        this.populateAbgabestelleDropdown('rd-abgabestelle');

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
        // Berechtigungen prüfen: Nur Admin darf auf "bezahlt" setzen
        if (checkbox.checked && !DataManager.isAdmin()) {
            checkbox.checked = false;
            this.showToast('error', 'Keine Berechtigung', 'Nur Admins können Rechnungen als bezahlt markieren');
            return;
        }

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

    // Befüllt ein Abgabestelle-Dropdown mit aktiven Abgabestellen aus Einnahmenplanung
    populateAbgabestelleDropdown: function(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        let html = `<option value="">-- Nicht zugeordnet --</option>`;

        // Aktive Abgabestellen aus Einnahmenplanung
        if (this.activeAbgabestellen && this.activeAbgabestellen.length > 0) {
            this.activeAbgabestellen.forEach(ab => {
                const displayText = ab.name ? `${ab.code} - ${ab.name}` : ab.code;
                html += `<option value="funding:${ab.id}">${displayText}</option>`;
            });
        }

        select.innerHTML = html;
    },

    updateRechnungAbgabestelle: async function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const abgabestelle = document.getElementById('rd-abgabestelle').value;
        const heute = new Date().toISOString().split('T')[0];

        // localStorage aktualisieren
        DataManager.setAbgabestelle(rechnungId, abgabestelle || null);

        // Supabase datev_bookings aktualisieren (für Einnahmenplanung-Ausgaben)
        try {
            let updateResult;

            if (rechnungId.startsWith('id:')) {
                // Format: id:UUID - direkt über Datensatz-ID updaten
                const bookingId = rechnungId.substring(3);
                console.log('updateRechnungAbgabestelle by id:', { bookingId, abgabestelle });

                updateResult = await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        abgabestelle: abgabestelle || null,
                        abgabestelle_am: abgabestelle ? heute : null
                    })
                    .eq('id', bookingId)
                    .select();
            } else {
                // Format: partitaIva_dokumentNr
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                console.log('updateRechnungAbgabestelle:', { rechnungId, partitaIva, dokumentNr, abgabestelle });

                updateResult = await SupabaseService.client
                    .from('datev_bookings')
                    .update({
                        abgabestelle: abgabestelle || null,
                        abgabestelle_am: abgabestelle ? heute : null
                    })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr)
                    .select();
            }

            const { data, error } = updateResult;

            if (error) {
                console.error('Supabase Update Error:', error);
            } else {
                console.log('Update result:', { rowsAffected: data?.length || 0, data });
                if (!data || data.length === 0) {
                    console.warn('WARNUNG: Keine datev_bookings Zeile gefunden!');
                    this.showToast('warning', 'Hinweis', 'Lokal gespeichert, aber keine DATEV-Buchung gefunden');
                } else {
                    this.showToast('success', 'Gespeichert', `Abgabestelle für ${data.length} Buchung(en) aktualisiert`);
                }
            }

        } catch (error) {
            console.error('Fehler beim Speichern der Abgabestelle in Supabase:', error);
        }

        // Datumsfeld aktualisieren
        if (abgabestelle) {
            document.getElementById('rd-abgabestelle-datum').value = heute;
        } else {
            document.getElementById('rd-abgabestelle-datum').value = '';
        }
    },

    updateAbgabestelleDatum: async function() {
        const rechnungId = document.getElementById('rd-rechnung-id').value;
        const datum = document.getElementById('rd-abgabestelle-datum').value;

        // localStorage aktualisieren
        DataManager.setAbgabestelleDatum(rechnungId, datum || null);

        // Supabase datev_bookings aktualisieren
        try {
            if (rechnungId.startsWith('id:')) {
                // Format: id:UUID - direkt über Datensatz-ID updaten
                const bookingId = rechnungId.substring(3);
                await SupabaseService.client
                    .from('datev_bookings')
                    .update({ abgabestelle_am: datum || null })
                    .eq('id', bookingId);
            } else {
                // Format: partitaIva_dokumentNr
                const [partitaIva, ...dokumentNrParts] = rechnungId.split('_');
                const dokumentNr = dokumentNrParts.join('_');

                await SupabaseService.client
                    .from('datev_bookings')
                    .update({ abgabestelle_am: datum || null })
                    .eq('partita_iva', partitaIva)
                    .eq('dokument_nr', dokumentNr);
            }

        } catch (error) {
            console.error('Fehler beim Speichern des Abgabestelle-Datums in Supabase:', error);
        }
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
     * @param idOrRechnungId - Invoice-UUID (für unverknüpfte PDFs) oder rechnungId (partitaIva_dokumentNr / id:UUID)
     * @param fundingSourceId - UUID der Funding Source
     * @param isSupabaseOnly - true wenn unverknüpftes PDF (nur in invoices-Tabelle speichern)
     */
    updateAbgabestelleInline: async function(idOrRechnungId, fundingSourceId, isSupabaseOnly = false) {
        try {
            if (!idOrRechnungId) {
                console.warn('Keine ID für Abgabestelle-Update');
                return;
            }

            const heute = new Date().toISOString().split('T')[0];

            // Abgabestelle-Wert erstellen (funding:UUID oder null)
            const abgabestelleValue = fundingSourceId ? `funding:${fundingSourceId}` : null;

            console.log('updateAbgabestelleInline:', { idOrRechnungId, fundingSourceId, isSupabaseOnly, abgabestelleValue });

            if (isSupabaseOnly) {
                // Unverknüpftes PDF: Nur in invoices-Tabelle speichern
                console.log('Updating invoices table for unlinked PDF:', idOrRechnungId);

                const { data, error } = await SupabaseService.client
                    .from('invoices')
                    .update({ funding_source_id: fundingSourceId || null })
                    .eq('id', idOrRechnungId)
                    .select();

                if (error) {
                    console.error('Supabase Invoice Update Error:', error);
                    throw error;
                }

                if (!data || data.length === 0) {
                    this.showToast('warning', 'Hinweis', 'Invoice nicht gefunden');
                } else {
                    this.showToast('success', 'Gespeichert', 'Abgabestelle für PDF aktualisiert');
                }
            } else {
                // DATEV-Buchung: In datev_bookings speichern
                // 1. localStorage aktualisieren
                DataManager.setAbgabestelle(idOrRechnungId, abgabestelleValue);

                // 2. Supabase datev_bookings aktualisieren
                let updateResult;

                if (idOrRechnungId.startsWith('id:')) {
                    // Format: id:UUID - direkt über Datensatz-ID updaten
                    const bookingId = idOrRechnungId.substring(3);
                    console.log('Updating datev_bookings by id:', { bookingId, abgabestelleValue });

                    updateResult = await SupabaseService.client
                        .from('datev_bookings')
                        .update({
                            abgabestelle: abgabestelleValue,
                            abgabestelle_am: abgabestelleValue ? heute : null
                        })
                        .eq('id', bookingId)
                        .select();
                } else {
                    // Format: partitaIva_dokumentNr
                    const [partitaIva, ...dokumentNrParts] = idOrRechnungId.split('_');
                    const dokumentNr = dokumentNrParts.join('_');

                    console.log('Updating datev_bookings:', { partitaIva, dokumentNr, abgabestelleValue });

                    updateResult = await SupabaseService.client
                        .from('datev_bookings')
                        .update({
                            abgabestelle: abgabestelleValue,
                            abgabestelle_am: abgabestelleValue ? heute : null
                        })
                        .eq('partita_iva', partitaIva)
                        .eq('dokument_nr', dokumentNr)
                        .select();
                }

                const { data, error } = updateResult;

                if (error) {
                    console.error('Supabase Update Error:', error);
                    throw error;
                }

                console.log('Update result:', { data, rowsAffected: data?.length || 0 });

                if (!data || data.length === 0) {
                    console.warn('Keine Zeile in datev_bookings gefunden für:', idOrRechnungId);
                    this.showToast('warning', 'Hinweis', 'Abgabestelle gespeichert (lokal), aber keine DATEV-Buchung gefunden');
                } else {
                    this.showToast('success', 'Gespeichert', `Abgabestelle für ${data.length} Buchung(en) aktualisiert`);
                }

                // Invoice-Tabelle auch aktualisieren (falls verknüpft)
                await DataManager.updateInvoiceFundingSource(idOrRechnungId, fundingSourceId || null);
            }

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
     * @param rechnungId - DATEV-Format (partitaIva_dokumentNr) oder id:UUID
     * @param currentFundingSourceId - Aktuell ausgewählte Funding Source ID
     * @param isSupabaseOnly - true wenn unverknüpftes PDF (kein DATEV-Eintrag)
     * @param invoiceId - UUID der Invoice (für unverknüpfte PDFs)
     */
    getAbgabestelleDropdown: function(rechnungId, currentFundingSourceId, isSupabaseOnly, invoiceId) {
        if (!rechnungId) {
            return '<span style="color: #999;">-</span>';
        }

        let options = '<option value="">- Keine -</option>';
        this.activeAbgabestellen.forEach(ab => {
            const selected = currentFundingSourceId === ab.id ? 'selected' : '';
            // Zeige Code und Name (falls vorhanden), sonst nur Code
            const displayText = ab.name ? `${ab.code} - ${ab.name}` : ab.code;
            options += `<option value="${ab.id}" ${selected}>${displayText}</option>`;
        });

        // Für unverknüpfte PDFs: invoiceId übergeben, sonst rechnungId
        const idForUpdate = isSupabaseOnly ? invoiceId : rechnungId;
        const isSupabaseOnlyFlag = isSupabaseOnly ? 'true' : 'false';

        return `<select class="form-control abgabestelle-select"
                        style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                        onchange="App.updateAbgabestelleInline('${idForUpdate}', this.value, ${isSupabaseOnlyFlag})">
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

            // Update in Supabase - mit select() um zu prüfen ob Zeile existiert
            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .update({ mwst_rate: mwstRate })
                .eq('id', bookingId)
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            // Prüfen ob eine Zeile aktualisiert wurde
            if (!data || data.length === 0) {
                console.warn('Keine Zeile mit dieser ID gefunden:', bookingId);
                this.showToast('warning', 'Nicht gefunden', 'DATEV-Buchung wurde nicht gefunden');
                return;
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
        const users = await DataManager.getUsers();

        // Daten speichern für Filter
        this.allLieferanten = lieferanten;
        this.allLieferantenRechnungen = rechnungen;
        this.allUsers = users; // Cache für User-Lookup

        // Jahre aus Rechnungen ermitteln
        const jahre = new Set();
        rechnungen.forEach(r => {
            const datum = r.datum || r.belegdatum;
            if (datum) {
                jahre.add(new Date(datum).getFullYear());
            }
        });

        // Aktuelles Jahr und Vorjahr immer hinzufügen (für Vergleich)
        const currentYear = new Date().getFullYear();
        jahre.add(currentYear);
        jahre.add(currentYear - 1);

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
        ['name', 'partitaIva', 'adresse', 'ansprechperson', 'jahr', 'vorjahr', 'prozent'].forEach(col => {
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
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666; padding: 2rem;">Keine Lieferanten gefunden.</td></tr>';
            return;
        }

        // User-Map für schnellen Lookup erstellen
        const userMap = new Map();
        (this.allUsers || []).forEach(u => {
            userMap.set(u.id, u.name || u.email || 'Unbekannt');
        });

        // Berechnete Werte für Sortierung vorbereiten
        const lieferantenMitWerten = lieferanten.map(l => {
            // Verknüpfung über partitaIva ODER Lieferantenname (für ältere Buchungen ohne partita_iva)
            const lieferantRechnungen = rechnungen.filter(r => {
                // Primär: partitaIva Match
                if (r.partitaIva && l.partitaIva && r.partitaIva === l.partitaIva) {
                    return true;
                }
                // Fallback: Name-Match (case-insensitive) für Buchungen ohne partitaIva
                if (!r.partitaIva && r.fornitoreName && l.name) {
                    return r.fornitoreName.toLowerCase().trim() === l.name.toLowerCase().trim();
                }
                return false;
            });

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

            // Ansprechperson-Name für Sortierung hinzufügen
            const contactUserName = l.contactUserId ? (userMap.get(l.contactUserId) || '') : '';
            return { ...l, summeJahr, summeVorjahr, prozent, contactUserName };
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
                case 'ansprechperson':
                    valA = (a.contactUserName || '').toLowerCase();
                    valB = (b.contactUserName || '').toLowerCase();
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
            // Verknüpfung über partitaIva ODER Lieferantenname (für ältere Buchungen ohne partita_iva)
            const lieferantRechnungen = rechnungen.filter(r => {
                if (r.partitaIva && l.partitaIva && r.partitaIva === l.partitaIva) return true;
                if (!r.partitaIva && r.fornitoreName && l.name) {
                    return r.fornitoreName.toLowerCase().trim() === l.name.toLowerCase().trim();
                }
                return false;
            });
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

            // Ansprechperson anzeigen
            const contactUserName = l.contactUserName || '';
            const contactDisplay = contactUserName || '<span style="color: #999; font-style: italic;">-</span>';

            // Hauptzeile mit Expand-Button
            const row = document.createElement('tr');
            row.className = 'lieferant-row';
            row.style.cursor = 'pointer';
            // Audit-Info als Tooltip
            const auditInfo = formatAuditInfo(l.created_by, l.created_at, l.updated_by, l.updated_at);
            if (auditInfo) {
                row.title = auditInfo;
            }
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
                <td>
                    ${contactDisplay}
                    <button class="btn btn-sm" style="padding: 0.1rem 0.3rem; margin-left: 0.5rem;" onclick="event.stopPropagation(); App.editLieferantAnsprechperson('${partitaIvaEscaped}')" title="Ansprechperson bearbeiten">
                        ${Icons.edit}
                    </button>
                </td>
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
                <td colspan="8" style="background: #f8f9fa; padding: 1rem;">
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

    /**
     * Öffnet das Bearbeitungsmodal für einen Lieferanten (Alias für editLieferant)
     * Wird von den Bearbeiten-Buttons in der Lieferanten-Tabelle aufgerufen
     */
    editLieferantName: function(partitaIva) {
        // Verwendet jetzt das neue Modal statt prompt()
        this.editLieferant(partitaIva);
    },

    /**
     * Ansprechperson für einen Lieferanten bearbeiten
     * Diese Person ist zuständig für die Rechnungskontrolle bei Rechnungen ohne Projekt
     */
    editLieferantAnsprechperson: async function(partitaIva) {
        // Lieferant finden
        const lieferant = this.allLieferanten.find(l => l.partitaIva === partitaIva);
        if (!lieferant) {
            this.showToast('error', 'Fehler', 'Lieferant nicht gefunden');
            return;
        }

        // Users laden falls nicht im Cache
        const users = this.allUsers || await DataManager.getUsers();

        // Altes Modal entfernen falls vorhanden
        const existingModal = document.getElementById('ansprechperson-modal');
        if (existingModal) existingModal.remove();

        // Modal erstellen (mit modal-overlay Klasse wie die anderen Modals)
        const modalHtml = `
            <div id="ansprechperson-modal" class="modal-overlay show" onclick="if(event.target === this) App.closeAnsprechpersonModal()">
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Ansprechperson zuweisen</h3>
                        <button class="modal-close" onclick="App.closeAnsprechpersonModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 1rem;">
                            <strong>${lieferant.name || partitaIva}</strong>
                        </p>
                        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                            Die Ansprechperson ist zuständig für die Rechnungskontrolle bei Rechnungen ohne Projektzuweisung.
                        </p>
                        <div class="form-group">
                            <label for="ansprechperson-select">Ansprechperson:</label>
                            <select id="ansprechperson-select" class="form-control">
                                <option value="">-- Keine Ansprechperson --</option>
                                ${users.map(u => `
                                    <option value="${u.id}" ${u.id === lieferant.contactUserId ? 'selected' : ''}>
                                        ${u.name || u.email}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" onclick="App.closeAnsprechpersonModal()">Abbrechen</button>
                        <button class="btn btn-primary" onclick="App.saveLieferantAnsprechperson('${partitaIva.replace(/'/g, "\\'")}')">Speichern</button>
                    </div>
                </div>
            </div>
        `;

        // Modal einfügen
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Ansprechperson-Modal schließen und aus DOM entfernen
     */
    closeAnsprechpersonModal: function() {
        const modal = document.getElementById('ansprechperson-modal');
        if (modal) modal.remove();
    },

    /**
     * Ansprechperson für Lieferanten speichern
     */
    saveLieferantAnsprechperson: async function(partitaIva) {
        const select = document.getElementById('ansprechperson-select');
        const userId = select.value || null;

        try {
            await DataManager.updateSupplier(partitaIva, { contactUserId: userId });
            this.closeAnsprechpersonModal();
            this.showToast('success', 'Gespeichert', 'Ansprechperson wurde aktualisiert');
            this.loadLieferanten();
        } catch (error) {
            console.error('Fehler beim Speichern der Ansprechperson:', error);
            this.showToast('error', 'Fehler', 'Ansprechperson konnte nicht gespeichert werden');
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
     * Generiert MwSt-Dropdown Optionen
     * @param {number} selectedRate - Der aktuell ausgewählte MwSt-Satz
     * @returns {string} HTML-Optionen für das Dropdown
     */
    getMwstOptions: function(selectedRate) {
        // Gruppiere nach Land für bessere Übersicht
        const gruppen = {};
        this.mwstSaetze.forEach(satz => {
            const key = satz.country || 'Allgemein';
            if (!gruppen[key]) gruppen[key] = [];
            gruppen[key].push(satz);
        });

        // Priorität der Länder (häufigste zuerst)
        const prioritaet = ['', 'IT', 'DE', 'AT', 'CH'];
        const sortierteKeys = Object.keys(gruppen).sort((a, b) => {
            const idxA = prioritaet.indexOf(a);
            const idxB = prioritaet.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        let html = '';
        sortierteKeys.forEach(key => {
            gruppen[key].forEach(satz => {
                const isSelected = satz.rate === selectedRate &&
                    (satz.label.includes(String(selectedRate)) || selectedRate === 0);
                html += `<option value="${satz.rate}" ${isSelected ? 'selected' : ''}>${satz.label}</option>`;
            });
        });

        return html;
    },

    /**
     * Generiert Lieferanten-Zelle mit Bearbeitungsmöglichkeit und Autocomplete
     * Zeigt Eingabefeld wenn Name fehlt oder auf Kontoname hinweist
     */
    getLieferantCell: function(r) {
        const name = r.fornitoreName || '';
        const partitaIva = r.partitaIva || '';
        const sponsorInfo = r.partitaIvaCliente ? `<br><small style="color:#666;">Sponsor: ${r.partitaIvaCliente}</small>` : '';
        // Verwende DB-ID wenn vorhanden (zuverlässiger), sonst safeRechnungId für HTML-IDs
        const safeRechnungId = (r.rechnungId || '').replace(/[^a-zA-Z0-9-]/g, '');
        // Die tatsächliche DB-ID für Updates
        const dbId = r.id || null;

        // Prüfe ob der Name ein Kontoname ist (z.B. "Costi altri servizi")
        const isKontoName = name.toLowerCase().startsWith('costi ') ||
                           name.toLowerCase().startsWith('spese ') ||
                           name === 'Unbekannt' ||
                           name === '' ||
                           !name;

        if (isKontoName) {
            // Bearbeitbares Feld mit Autocomplete anzeigen
            const inputId = `lieferant-input-${safeRechnungId}`;
            const dropdownId = `lieferant-dropdown-${safeRechnungId}`;
            const beschreibungHint = r.beschreibung ? r.beschreibung.substring(0, 50) : '';
            return `
                <div style="position: relative;">
                    <input type="text"
                           id="${inputId}"
                           class="form-control lieferant-autocomplete"
                           data-db-id="${dbId || ''}"
                           style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                           placeholder="${beschreibungHint || 'Lieferant suchen...'}"
                           value=""
                           autocomplete="off"
                           onfocus="App.showLieferantDropdown('${inputId}', '${dropdownId}', '${dbId || safeRechnungId}')"
                           oninput="App.filterLieferantDropdown('${dropdownId}', this.value)"
                           onblur="setTimeout(() => App.hideLieferantDropdown('${dropdownId}'), 200)">
                    <div id="${dropdownId}" class="lieferant-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"></div>
                    <small style="color: #999; font-size: 0.65rem;">${name || 'Kein Lieferant'}</small>
                </div>${sponsorInfo}`;
        } else {
            // Normaler Name mit Bearbeitungs-Icon und Autocomplete bei Klick
            const inputId = `lieferant-edit-${safeRechnungId}`;
            const dropdownId = `lieferant-dropdown-${safeRechnungId}`;
            return `
                <div style="position: relative;">
                    <div id="${inputId}-display" style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>${name}</span>
                        <button class="btn btn-sm"
                                style="padding: 0.1rem 0.2rem; font-size: 0.6rem; background: transparent; border: none; cursor: pointer;"
                                onclick="App.showLieferantEditWithAutocomplete('${inputId}', '${dropdownId}', '${dbId || safeRechnungId}', '${name.replace(/'/g, "\\'")}')"
                                title="Lieferant bearbeiten">
                            ${Icons.edit}
                        </button>
                    </div>
                    <div id="${dropdownId}" class="lieferant-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"></div>
                </div>${sponsorInfo}`;
        }
    },

    // Cache für Lieferanten-Liste
    suppliersCache: null,

    /**
     * Lädt Lieferanten für Autocomplete
     */
    loadSuppliersForAutocomplete: async function() {
        if (this.suppliersCache) return this.suppliersCache;

        try {
            const { data, error } = await SupabaseService.client
                .from('suppliers')
                .select('partita_iva, fornitore_name')
                .order('fornitore_name');

            if (error) throw error;
            this.suppliersCache = data || [];
            return this.suppliersCache;
        } catch (error) {
            console.error('Fehler beim Laden der Lieferanten:', error);
            return [];
        }
    },

    /**
     * Zeigt Lieferanten-Dropdown
     */
    showLieferantDropdown: async function(inputId, dropdownId, rechnungId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const suppliers = await this.loadSuppliersForAutocomplete();
        this.renderLieferantDropdown(dropdown, suppliers, rechnungId, '');
        dropdown.style.display = 'block';
    },

    /**
     * Filtert Lieferanten-Dropdown basierend auf Eingabe
     */
    filterLieferantDropdown: async function(dropdownId, searchText) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const suppliers = await this.loadSuppliersForAutocomplete();
        const search = searchText.toLowerCase();

        const filtered = suppliers.filter(s =>
            (s.fornitore_name && s.fornitore_name.toLowerCase().includes(search)) ||
            (s.partita_iva && s.partita_iva.toLowerCase().includes(search))
        );

        // Extrahiere rechnungId aus dropdownId
        const rechnungId = dropdownId.replace('lieferant-dropdown-', '');
        this.renderLieferantDropdown(dropdown, filtered.slice(0, 20), rechnungId, searchText);
    },

    /**
     * Rendert Lieferanten-Dropdown Inhalt
     */
    renderLieferantDropdown: function(dropdown, suppliers, rechnungId, searchText) {
        if (suppliers.length === 0) {
            dropdown.innerHTML = `<div style="padding: 0.5rem; color: #666; font-size: 0.75rem;">Keine Lieferanten gefunden</div>`;
            return;
        }

        dropdown.innerHTML = suppliers.map(s => `
            <div class="lieferant-option"
                 style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee; font-size: 0.75rem;"
                 onmouseover="this.style.background='#f0f0f0'"
                 onmouseout="this.style.background='white'"
                 onclick="App.selectLieferant('${rechnungId}', '${(s.fornitore_name || '').replace(/'/g, "\\'")}', '${s.partita_iva || ''}')">
                <div style="font-weight: 500;">${s.fornitore_name || 'Unbekannt'}</div>
                <div style="color: #666; font-size: 0.65rem;">${s.partita_iva || '-'}</div>
            </div>
        `).join('');
    },

    /**
     * Versteckt Lieferanten-Dropdown
     */
    hideLieferantDropdown: function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) dropdown.style.display = 'none';
    },

    /**
     * Wählt einen Lieferanten aus dem Dropdown
     */
    selectLieferant: async function(rechnungId, name, partitaIva) {
        // Dropdown verstecken
        const dropdown = document.getElementById(`lieferant-dropdown-${rechnungId}`);
        if (dropdown) dropdown.style.display = 'none';

        // Input-Feld aktualisieren falls vorhanden
        const input = document.getElementById(`lieferant-input-${rechnungId}`) ||
                     document.getElementById(`lieferant-edit-${rechnungId}`);
        if (input) input.value = name;

        // In Datenbank speichern
        await this.updateLieferantWithPartitaIva(rechnungId, name, partitaIva);
    },

    /**
     * Aktualisiert Lieferant mit Name und Partita IVA
     * @param {string} idOrRechnungId - DB-ID (UUID oder Zahl) oder rechnungId (partitaIva_dokumentNr)
     */
    updateLieferantWithPartitaIva: async function(idOrRechnungId, name, partitaIva) {
        try {
            const idStr = String(idOrRechnungId);

            console.log('updateLieferantWithPartitaIva:', { idOrRechnungId, name, partitaIva });

            // UUID = Invoice (invoices-Tabelle), Zahl = DATEV-Buchung (datev_bookings-Tabelle)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
            const isNumeric = /^\d+$/.test(idStr);

            let success = false;

            if (isUuid) {
                // UUID = Invoice-ID -> invoices-Tabelle aktualisieren
                console.log('UUID erkannt - aktualisiere invoices-Tabelle');

                const updateData = {
                    fornitore_name: name || null,
                    partita_iva: partitaIva && String(partitaIva).trim() !== '' ? String(partitaIva).trim() : null
                };

                const { data, error } = await SupabaseService.client
                    .from('invoices')
                    .update(updateData)
                    .eq('id', idStr)
                    .select();

                if (error) {
                    console.error('Supabase Invoice Update Error:', error);
                    throw error;
                }
                console.log('Invoice Update erfolgreich:', data);
                success = true;

            } else if (isNumeric) {
                // Zahl = DATEV-Buchungs-ID -> datev_bookings-Tabelle aktualisieren
                console.log('Numerische ID erkannt - aktualisiere datev_bookings-Tabelle');

                const updateData = {
                    fornitore_name: name || null
                };
                if (partitaIva && String(partitaIva).trim() !== '') {
                    updateData.partita_iva = String(partitaIva).trim();
                }

                const { data, error } = await SupabaseService.client
                    .from('datev_bookings')
                    .update(updateData)
                    .eq('id', idStr)
                    .select();

                if (error) {
                    console.error('Supabase DATEV Update Error:', error);
                    throw error;
                }
                console.log('DATEV Update erfolgreich:', data);
                success = true;

            } else {
                // Suche in filteredRechnungen
                const rechnung = (this.filteredRechnungen || []).find(r => {
                    const rIdStr = String(r.id || '');
                    const rRechnungIdSafe = (r.rechnungId || '').replace(/[^a-zA-Z0-9-]/g, '');
                    return rIdStr === idStr || rRechnungIdSafe === idStr || r.rechnungId === idStr;
                });

                if (rechnung && rechnung.id) {
                    // Rekursiv mit gefundener ID aufrufen
                    await this.updateLieferantWithPartitaIva(rechnung.id, name, partitaIva);
                    return;
                } else {
                    console.warn('Keine ID gefunden für:', idOrRechnungId);
                    this.showToast('warning', 'Hinweis', 'Buchung nicht gefunden');
                    return;
                }
            }

            if (success) {
                this.showToast('success', 'Gespeichert', `Lieferant: ${name}`);

                // Cache invalidieren und neu laden
                if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
                    SupabaseDataAdapter.invalidateCache();
                }
                this.suppliersCache = null;
                await this.reloadRechnungenKeepState();
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Lieferanten:', error);
            this.showToast('error', 'Fehler', 'Lieferant konnte nicht gespeichert werden');
        }
    },

    /**
     * Zeigt Bearbeitungsfeld mit Autocomplete für Lieferant
     */
    showLieferantEditWithAutocomplete: async function(inputId, dropdownId, rechnungId, currentName) {
        const displayEl = document.getElementById(`${inputId}-display`);
        if (!displayEl) return;

        const parentDiv = displayEl.parentElement;
        parentDiv.innerHTML = `
            <input type="text"
                   id="${inputId}"
                   class="form-control lieferant-autocomplete"
                   style="font-size: 0.75rem; padding: 0.25rem; min-width: 150px;"
                   value="${currentName}"
                   autocomplete="off"
                   oninput="App.filterLieferantDropdown('${dropdownId}', this.value)"
                   onblur="setTimeout(() => { App.hideLieferantDropdown('${dropdownId}'); App.saveLieferantIfChanged('${rechnungId}', this.value, '${currentName.replace(/'/g, "\\'")}'); }, 200)">
            <div id="${dropdownId}" class="lieferant-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"></div>
        `;

        const input = document.getElementById(inputId);
        input.focus();
        input.select();

        // Dropdown anzeigen
        await this.showLieferantDropdown(inputId, dropdownId, rechnungId);
    },

    /**
     * Speichert Lieferant wenn geändert (für manuelle Eingabe ohne Auswahl)
     */
    saveLieferantIfChanged: async function(rechnungId, newName, oldName) {
        if (newName && newName !== oldName) {
            await this.updateLieferantName(rechnungId, newName);
        }
    },

    /**
     * Generiert Status-Badge für Workflow-Status (runde Pill-Badges wie in der Toolbar)
     */
    getStatusDropdown: function(r) {
        // Status normalisieren - nur gültige Werte erlauben
        let status = (r.workflowStatus || 'neu').toLowerCase();
        if (!['neu', 'kontrolliert', 'bezahlt'].includes(status)) {
            status = 'neu';
        }

        const bookingId = r.id;
        const invoiceId = r.invoiceId;
        const isAdmin = DataManager.isAdmin();

        // Status-Konfiguration (Farben wie in der Toolbar oben)
        const statusConfig = {
            'neu': {
                bg: 'transparent',
                border: '#6c757d',
                color: '#6c757d',
                label: 'neu',
                nextStatus: 'kontrolliert'
            },
            'kontrolliert': {
                bg: 'transparent',
                border: '#ffc107',
                color: '#b38600',
                label: 'kontrolliert',
                nextStatus: 'bezahlt'
            },
            'bezahlt': {
                bg: 'transparent',
                border: '#28a745',
                color: '#28a745',
                label: 'bezahlt',
                nextStatus: null
            }
        };

        const config = statusConfig[status];

        // Bestimme die ID für onClick
        let onClickHandler = '';
        let cursorStyle = 'default';
        let title = '';

        if (status === 'neu' && (bookingId || invoiceId)) {
            // Neu -> Kontrolliert (jeder kann)
            if (r.isSupabaseOnly && invoiceId) {
                onClickHandler = `onclick="App.updateInvoiceWorkflowStatus('${invoiceId}', 'kontrolliert')"`;
            } else if (bookingId) {
                onClickHandler = `onclick="App.updateWorkflowStatus('${bookingId}', 'kontrolliert')"`;
            }
            cursorStyle = 'pointer';
            title = 'Klicken um als kontrolliert zu markieren';
        } else if (status === 'kontrolliert' && isAdmin && (bookingId || invoiceId)) {
            // Kontrolliert -> Bezahlt (nur Admin)
            if (r.isSupabaseOnly && invoiceId) {
                onClickHandler = `onclick="App.updateInvoiceWorkflowStatus('${invoiceId}', 'bezahlt')"`;
            } else if (bookingId) {
                onClickHandler = `onclick="App.updateWorkflowStatus('${bookingId}', 'bezahlt')"`;
            }
            cursorStyle = 'pointer';
            title = 'Klicken um als bezahlt zu markieren (nur Admin)';
        } else if (status === 'kontrolliert' && !isAdmin) {
            title = 'Nur Admins können als bezahlt markieren';
        }

        return `<span class="status-badge"
                      style="display: inline-block; padding: 0.25rem 0.75rem;
                             border: 2px solid ${config.border}; border-radius: 20px;
                             background: ${config.bg}; color: ${config.color};
                             font-size: 0.75rem; font-weight: 500;
                             cursor: ${cursorStyle}; user-select: none;
                             transition: all 0.2s ease;"
                      ${onClickHandler}
                      title="${title}">${config.label}</span>`;
    },

    /**
     * Aktualisiert den Workflow-Status einer DATEV-Buchung
     * und synchronisiert mit verknüpfter Invoice
     */
    updateWorkflowStatus: async function(bookingId, newStatus) {
        try {
            if (!bookingId) {
                console.warn('Keine bookingId für Status-Update');
                return;
            }

            // User-ID für Audit-Trail holen
            const authResult = await SupabaseService.client.auth.getUser();
            const currentUserId = authResult.data.user?.id || null;

            console.log('Aktualisiere Workflow-Status:', { bookingId, newStatus, userId: currentUserId });

            const updateData = {
                workflow_status: newStatus,
                updated_at: new Date().toISOString(),
                updated_by: currentUserId
            };

            // Je nach Status: Datum setzen oder löschen
            if (newStatus === 'kontrolliert') {
                updateData.kontrolled_at = new Date().toISOString();
                updateData.kontrolled_by = currentUserId;
                updateData.paid_at = null; // Bezahlt-Datum löschen
            } else if (newStatus === 'bezahlt') {
                updateData.paid_at = new Date().toISOString();
                updateData.paid_by = currentUserId;
                // Kontrolliert-Datum beibehalten falls vorhanden
            } else if (newStatus === 'neu') {
                updateData.kontrolled_at = null;
                updateData.paid_at = null;
            }

            const { data, error } = await SupabaseService.client
                .from('datev_bookings')
                .update(updateData)
                .eq('id', bookingId)
                .select('partita_iva, dokument_nr');

            if (error) throw error;

            if (!data || data.length === 0) {
                this.showToast('warning', 'Nicht gefunden', 'Buchung wurde nicht gefunden');
                return;
            }

            // Auch verknüpfte Invoice aktualisieren (falls vorhanden)
            const { partita_iva, dokument_nr } = data[0];
            if (partita_iva && dokument_nr) {
                await SupabaseService.client
                    .from('invoices')
                    .update({
                        workflow_status: newStatus,
                        status: newStatus,
                        kontrolled_at: updateData.kontrolled_at,
                        kontrolled_by: updateData.kontrolled_by,
                        paid_at: updateData.paid_at,
                        paid_by: updateData.paid_by,
                        updated_at: updateData.updated_at,
                        updated_by: currentUserId
                    })
                    .eq('partita_iva', partita_iva)
                    .eq('invoice_number', dokument_nr);
            }

            // Cache invalidieren und Ansicht neu laden
            if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
                SupabaseDataAdapter.invalidateCache();
            }

            await this.reloadRechnungenKeepState();

            const statusLabels = { 'neu': 'Neu', 'kontrolliert': 'Kontrolliert', 'bezahlt': 'Bezahlt' };
            this.showToast('success', 'Status geändert', `Status auf "${statusLabels[newStatus]}" gesetzt`);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Status:', error);
            this.showToast('error', 'Fehler', `Status konnte nicht geändert werden: ${error.message}`);
        }
    },

    /**
     * Aktualisiert den Workflow-Status einer Supabase-only Invoice
     */
    updateInvoiceWorkflowStatus: async function(invoiceId, newStatus) {
        try {
            if (!invoiceId) {
                console.warn('Keine invoiceId für Status-Update');
                return;
            }

            console.log('Aktualisiere Invoice Workflow-Status:', { invoiceId, newStatus });

            const updateData = {
                workflow_status: newStatus
            };

            // Je nach Status: Datum setzen oder löschen
            if (newStatus === 'kontrolliert') {
                updateData.kontrolled_at = new Date().toISOString();
                updateData.paid_at = null;
            } else if (newStatus === 'bezahlt') {
                updateData.paid_at = new Date().toISOString();
            } else if (newStatus === 'neu') {
                updateData.kontrolled_at = null;
                updateData.paid_at = null;
            }

            const { error } = await SupabaseService.client
                .from('invoices')
                .update(updateData)
                .eq('id', invoiceId);

            if (error) throw error;

            // Cache invalidieren und Ansicht neu laden
            if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
                SupabaseDataAdapter.invalidateCache();
            }

            await this.reloadRechnungenKeepState();

            const statusLabels = { 'neu': 'Neu', 'kontrolliert': 'Kontrolliert', 'bezahlt': 'Bezahlt' };
            this.showToast('success', 'Status geändert', `Status auf "${statusLabels[newStatus]}" gesetzt`);
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Invoice-Status:', error);
            this.showToast('error', 'Fehler', `Status konnte nicht geändert werden: ${error.message}`);
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
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
        }
    },

    hideModal: function(modalId) {
        console.log('🔒 hideModal aufgerufen für:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.classList.remove('active');
            console.log('✅ Modal geschlossen:', modalId);
        } else {
            console.error('❌ Modal nicht gefunden:', modalId);
        }
    },

    // Für Modals mit "hidden" Klasse (Shop-Modals)
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
        }
    },

    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('show');
        }
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
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #666; padding: 2rem;">Kein Inventar vorhanden</td></tr>';
            return;
        }

        const kategorieLabels = { technik: 'Technik', moebel: 'Möbel', kunst: 'Kunstwerke', transport: 'Transport', sonstiges: 'Sonstiges' };
        const standortLabels = { kunsthaus: 'Kunsthaus', lager: 'Lager', extern: 'Extern' };
        const zustandLabels = { gut: 'Gut', gebraucht: 'Gebraucht', reparatur: 'Reparatur', defekt: 'Defekt' };

        inventar.forEach(i => {
            const row = document.createElement('tr');
            // Audit-Info
            const auditInfo = formatAuditInfo(i.created_by, i.created_at, i.updated_by, i.updated_at);
            const updatedByName = resolveUserName(i.updated_by || i.created_by);
            const updatedAtFormatted = i.updated_at ? this.formatDateTime(i.updated_at) : (i.created_at ? this.formatDateTime(i.created_at) : '-');

            row.innerHTML = `
                <td><strong>${i.inventarNr}</strong></td>
                <td>${i.bezeichnung}</td>
                <td>${kategorieLabels[i.kategorie] || i.kategorie}</td>
                <td>${standortLabels[i.standort] || i.standort}</td>
                <td><span class="badge">${zustandLabels[i.zustand] || i.zustand}</span></td>
                <td>${i.anschaffung ? this.formatDate(i.anschaffung) : '-'}</td>
                <td style="text-align: right;">${i.wert ? this.formatCurrency(i.wert) : '-'}</td>
                <td style="font-size: 0.75rem; color: #666;" title="${auditInfo}">
                    ${updatedAtFormatted !== '-' ? `<div>${updatedAtFormatted}</div><div style="font-size: 0.65rem; color: #999;">${updatedByName || ''}</div>` : '-'}
                </td>
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

    // Aktueller Reporting-Tab
    currentReportingTab: 0,
    totalReportingTabs: 7,

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

        // Tab-Navigation initialisieren
        this.updateReportingTabState();
    },

    /**
     * Zeigt einen bestimmten Reporting-Tab an
     */
    showReportingTab: function(tabIndex) {
        this.currentReportingTab = tabIndex;

        // Alle Tabs verstecken
        document.querySelectorAll('.reporting-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Gewählten Tab anzeigen
        const selectedTab = document.getElementById(`reporting-tab-${tabIndex}`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }

        // Tab-Buttons aktualisieren
        document.querySelectorAll('.reporting-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.tab) === tabIndex) {
                btn.classList.add('active');
            }
        });

        // Navigation-State aktualisieren
        this.updateReportingTabState();
    },

    /**
     * Zum vorherigen Tab wechseln
     */
    prevReportingTab: function() {
        if (this.currentReportingTab > 0) {
            this.showReportingTab(this.currentReportingTab - 1);
        }
    },

    /**
     * Zum nächsten Tab wechseln
     */
    nextReportingTab: function() {
        if (this.currentReportingTab < this.totalReportingTabs - 1) {
            this.showReportingTab(this.currentReportingTab + 1);
        }
    },

    /**
     * Aktualisiert den State der Navigation (Pfeile, Indikator)
     */
    updateReportingTabState: function() {
        const prevBtn = document.getElementById('reporting-prev-btn');
        const nextBtn = document.getElementById('reporting-next-btn');
        const indicator = document.getElementById('reporting-page-indicator');

        // Pfeile aktivieren/deaktivieren
        if (prevBtn) {
            prevBtn.disabled = this.currentReportingTab === 0;
            prevBtn.style.opacity = this.currentReportingTab === 0 ? '0.3' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentReportingTab === this.totalReportingTabs - 1;
            nextBtn.style.opacity = this.currentReportingTab === this.totalReportingTabs - 1 ? '0.3' : '1';
        }

        // Seiten-Indikator aktualisieren
        if (indicator) {
            indicator.textContent = `Seite ${this.currentReportingTab + 1} von ${this.totalReportingTabs}`;
        }

        // Bei Tab 6 (Besucher) automatisch Statistik laden
        if (this.currentReportingTab === 6) {
            this.loadBesucherStatistik();
        }
    },

    // ==========================================
    // BESUCHERSTATISTIK
    // ==========================================

    loadBesucherStatistik: function() {
        console.log('loadBesucherStatistik aufgerufen');

        // Default-Zeitraum: aktuelles Jahr
        const heute = new Date();
        const jahrStart = `${heute.getFullYear()}-01-01`;
        const jahrEnde = heute.toISOString().split('T')[0];

        const vonEl = document.getElementById('besucher-von');
        const bisEl = document.getElementById('besucher-bis');

        // Immer Default setzen wenn leer
        if (vonEl && !vonEl.value) vonEl.value = jahrStart;
        if (bisEl && !bisEl.value) bisEl.value = jahrEnde;

        const von = vonEl?.value || jahrStart;
        const bis = bisEl?.value || jahrEnde;
        const gruppierung = document.getElementById('besucher-gruppierung')?.value || 'monat';

        console.log('Besucher-Filter:', { von, bis, gruppierung });

        // Alle Eintritte im Zeitraum laden
        const alleVerkaeufe = DataManager.getAllShopVerkaeufe() || [];
        console.log('Alle Verkäufe:', alleVerkaeufe.length, 'davon Eintritte:', alleVerkaeufe.filter(v => v.typ === 'eintritt').length);
        const eintritte = alleVerkaeufe.filter(v =>
            v.typ === 'eintritt' &&
            !v.storniert &&
            v.datum >= von &&
            v.datum <= bis
        );

        // Statistiken berechnen
        let gesamt = 0;
        let vormittag = 0;
        let nachmittag = 0;
        let einnahmen = 0;
        const kategorieStats = {};
        const verlaufStats = {};

        const kategorien = DataManager.getEintrittKategorien() || [];
        const katMap = {};
        kategorien.forEach(k => katMap[k.id] = k.name);

        eintritte.forEach(v => {
            const anzahl = v.menge || 1;
            gesamt += anzahl;
            einnahmen += v.gesamtpreis || 0;

            // Tageszeit
            const tz = v.tageszeit || '';
            if (tz === 'vormittag') vormittag += anzahl;
            else if (tz === 'nachmittag') nachmittag += anzahl;

            // Kategorie
            const katId = v.eintritt_kategorie || 'unbekannt';
            if (!kategorieStats[katId]) {
                kategorieStats[katId] = { anzahl: 0, einnahmen: 0, name: katMap[katId] || 'Unbekannt' };
            }
            kategorieStats[katId].anzahl += anzahl;
            kategorieStats[katId].einnahmen += v.gesamtpreis || 0;

            // Verlauf (nach Gruppierung)
            const key = this.getBesucherZeitraumKey(v.datum, gruppierung);
            if (!verlaufStats[key]) {
                verlaufStats[key] = { gesamt: 0, vormittag: 0, nachmittag: 0, einnahmen: 0 };
            }
            verlaufStats[key].gesamt += anzahl;
            verlaufStats[key].einnahmen += v.gesamtpreis || 0;
            if (tz === 'vormittag') verlaufStats[key].vormittag += anzahl;
            else if (tz === 'nachmittag') verlaufStats[key].nachmittag += anzahl;
        });

        // Anzahl Tage berechnen (für Durchschnitt)
        const vonDate = new Date(von);
        const bisDate = new Date(bis);
        const diffTime = Math.abs(bisDate - vonDate);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const durchschnitt = gesamt / diffDays;

        // UI aktualisieren
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('besucher-gesamt', gesamt.toLocaleString('de-DE'));
        setEl('besucher-vormittag', vormittag.toLocaleString('de-DE'));
        setEl('besucher-nachmittag', nachmittag.toLocaleString('de-DE'));
        setEl('besucher-durchschnitt', durchschnitt.toFixed(1));
        setEl('besucher-einnahmen', this.formatCurrency(einnahmen));

        // Prozentanteile
        const vmPct = gesamt > 0 ? ((vormittag / gesamt) * 100).toFixed(1) : 0;
        const nmPct = gesamt > 0 ? ((nachmittag / gesamt) * 100).toFixed(1) : 0;
        setEl('besucher-vormittag-pct', `${vmPct}%`);
        setEl('besucher-nachmittag-pct', `${nmPct}%`);

        // Kategorien-Tabelle
        const katTable = document.getElementById('besucher-kategorien-table');
        if (katTable) {
            const katArr = Object.values(kategorieStats).sort((a, b) => b.anzahl - a.anzahl);
            if (katArr.length === 0) {
                katTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Keine Eintritte im Zeitraum</td></tr>';
            } else {
                katTable.innerHTML = katArr.map(k => {
                    const anteil = gesamt > 0 ? ((k.anzahl / gesamt) * 100).toFixed(1) : 0;
                    return `<tr>
                        <td>${k.name}</td>
                        <td class="text-right">${k.anzahl}</td>
                        <td class="text-right">${anteil}%</td>
                        <td class="text-right">${this.formatCurrency(k.einnahmen)}</td>
                    </tr>`;
                }).join('');
            }
        }

        // Verlaufs-Tabelle
        const verlaufTable = document.getElementById('besucher-verlauf-table');
        if (verlaufTable) {
            const verlaufArr = Object.entries(verlaufStats)
                .map(([key, val]) => ({ key, ...val }))
                .sort((a, b) => a.key.localeCompare(b.key));

            if (verlaufArr.length === 0) {
                verlaufTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Keine Daten im Zeitraum</td></tr>';
            } else {
                verlaufTable.innerHTML = verlaufArr.map(v => `<tr>
                    <td>${this.formatBesucherZeitraum(v.key, gruppierung)}</td>
                    <td class="text-right">${v.gesamt}</td>
                    <td class="text-right">${v.vormittag}</td>
                    <td class="text-right">${v.nachmittag}</td>
                    <td class="text-right">${this.formatCurrency(v.einnahmen)}</td>
                </tr>`).join('');
            }
        }
    },

    getBesucherZeitraumKey: function(datum, gruppierung) {
        const d = new Date(datum);
        switch (gruppierung) {
            case 'tag':
                return datum;
            case 'woche':
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay() + 1); // Montag
                return weekStart.toISOString().split('T')[0];
            case 'monat':
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            case 'jahr':
                return String(d.getFullYear());
            default:
                return datum;
        }
    },

    formatBesucherZeitraum: function(key, gruppierung) {
        switch (gruppierung) {
            case 'tag':
                return new Date(key).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            case 'woche':
                const weekEnd = new Date(key);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `KW ${this.getWeekNumber(new Date(key))} (${new Date(key).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })})`;
            case 'monat':
                const [year, month] = key.split('-');
                const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                return `${monthNames[parseInt(month) - 1]} ${year}`;
            case 'jahr':
                return key;
            default:
                return key;
        }
    },

    getWeekNumber: function(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    exportBesucherCsv: function() {
        const von = document.getElementById('besucher-von')?.value || '';
        const bis = document.getElementById('besucher-bis')?.value || '';
        const gruppierung = document.getElementById('besucher-gruppierung')?.value || 'monat';

        const alleVerkaeufe = DataManager.getAllShopVerkaeufe() || [];
        const eintritte = alleVerkaeufe.filter(v =>
            v.typ === 'eintritt' &&
            !v.storniert &&
            v.datum >= von &&
            v.datum <= bis
        );

        const kategorien = DataManager.getEintrittKategorien() || [];
        const katMap = {};
        kategorien.forEach(k => katMap[k.id] = k.name);

        // CSV mit allen Eintrittsdaten
        const header = ['Datum', 'Uhrzeit', 'Tageszeit', 'Kategorie', 'Menge', 'Preis'];
        const rows = eintritte.map(v => [
            v.datum,
            v.uhrzeit || '',
            v.tageszeit || '',
            katMap[v.eintritt_kategorie] || 'Unbekannt',
            v.menge || 1,
            (v.gesamtpreis || 0).toFixed(2).replace('.', ',')
        ]);

        const csvContent = [header, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Besucherstatistik_${von}_${bis}.csv`;
        link.click();
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

                // Umsatz-Tooltip mit Aufteilung (direkt vs. anteilig)
                const umsatzTooltip = p.umsatz_direkt !== undefined
                    ? `title="Direkt: ${this.formatCurrency(p.umsatz_direkt || 0)}&#10;Anteilig: ${this.formatCurrency(p.umsatz_anteilig || 0)}"`
                    : '';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${p.projekt.name}</strong></td>
                    <td style="text-align: center;">${p.tage}</td>
                    <td style="text-align: center;">${(p.anteil * 100).toFixed(1)}%</td>
                    <td style="text-align: right; cursor: help;" ${umsatzTooltip}>${this.formatCurrency(p.umsatz)}</td>
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

    // ==========================================
    // BILANZ / GUV REPORT
    // ==========================================

    bilanzReportCache: null,
    bilanzExpanded: {},

    /**
     * Bilanz/GuV-Struktur basierend auf italienischem Bilanzschema
     */
    getBilanzStruktur: function() {
        // Vorzeichen-Logik nach Import:
        // - Erträge (600-679, 840-849): POSITIV in DB (Vorzeichen beim Import umgedreht)
        // - Aufwendungen (680+): POSITIV in DB (1:1 aus Excel) → müssen in GuV NEGIERT werden
        return {
            guv: [
                // A) GESAMTLEISTUNG (Erträge: positiv in DB)
                { id: 'A', label: 'A) Gesamtleistung', type: 'header', level: 0, color: '#d4edda', borderColor: '#28a745' },
                { id: 'A1', label: '1) Erträge aus Lieferungen und Leistungen', type: 'group', level: 1, parent: 'A', kontoPattern: ['600'] },
                { id: 'A5', label: '5) Sonstige betriebliche Erträge', type: 'group', level: 1, parent: 'A', kontoPattern: ['640'] },
                { id: 'A_SUM', label: 'Summe Gesamtleistung (A)', type: 'sum', level: 0, sumOf: ['A1', 'A5'], color: '#c3e6cb', bold: true },

                // B) BETRIEBLICHE AUFWENDUNGEN (Aufwendungen: positiv in DB, negieren für GuV!)
                { id: 'B', label: 'B) Betriebliche Aufwendungen', type: 'header', level: 0, color: '#f8d7da', borderColor: '#dc3545' },
                { id: 'B6', label: '6) Roh-, Hilfs-, Betriebsstoffe & Waren', type: 'group', level: 1, parent: 'B', kontoPattern: ['680'], negate: true },
                { id: 'B7', label: '7) Für bezogene Dienstleistungen', type: 'group', level: 1, parent: 'B', kontoPattern: ['690'], negate: true },
                { id: 'B8', label: '8) Für die Verwendung von Gütern Dritter', type: 'group', level: 1, parent: 'B', kontoPattern: ['700'], negate: true },
                { id: 'B9', label: '9) Personalaufwand', type: 'group', level: 1, parent: 'B', kontoPattern: ['710'], negate: true },
                // Abschreibungen: Alle 720er, aber steuerliche (fisc.) werden in der Berechnung gefiltert
                { id: 'B10', label: '10) Abschreibungen', type: 'group', level: 1, parent: 'B', kontoPattern: ['720'], negate: true, isAbschreibung: true, excludeKategorie: ['fisc', 'Magg'] },
                // Bestandsveränderungen: negate: true wie andere Aufwendungen
                { id: 'B11', label: '11) Bestandsveränderungen', type: 'group', level: 1, parent: 'B', kontoPattern: ['730'], negate: true },
                { id: 'B14', label: '14) Sonstige betriebliche Aufwendungen', type: 'group', level: 1, parent: 'B', kontoPattern: ['760'], negate: true },
                { id: 'B_SUM', label: 'Summe betriebliche Aufwendungen (B)', type: 'sum', level: 0, sumOf: ['B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B14'], color: '#f5c6cb', bold: true },

                // EBITDA = A + B + Abschreibungen (B ist negativ, also A - |B| + |Abschr|)
                { id: 'EBITDA', label: 'EBITDA (A - B + Abschreibungen)', type: 'result', level: 0, color: '#d1ecf1', borderColor: '#17a2b8', bold: true, formula: 'A_SUM + B_SUM - B10' },

                // BETRIEBSERFOLG (EBIT) = A + B (B ist negativ)
                { id: 'EBIT', label: 'Betriebserfolg / EBIT (A - B)', type: 'result', level: 0, color: '#fff3cd', borderColor: '#ffc107', bold: true, formula: 'A_SUM + B_SUM' },

                // C) FINANZERTRÄGE UND -AUFWENDUNGEN
                { id: 'C', label: 'C) Finanzerträge und -aufwendungen', type: 'header', level: 0, color: '#e2e3e5', borderColor: '#6c757d' },
                { id: 'C16', label: '16) Sonstige Finanzerträge', type: 'group', level: 1, parent: 'C', kontoPattern: ['840'] },
                { id: 'C17', label: '17) Zinsen und ähnliche Aufwendungen', type: 'group', level: 1, parent: 'C', kontoPattern: ['850'], negate: true },
                { id: 'C_SUM', label: 'Summe Finanzerträge/-aufwendungen (C)', type: 'sum', level: 0, sumOf: ['C16', 'C17'], color: '#ced4da' },

                // ERGEBNIS VOR STEUERN
                { id: 'EBT', label: 'Ergebnis vor Steuern (EBIT +/- C)', type: 'result', level: 0, color: '#cce5ff', borderColor: '#007bff', bold: true, formula: 'EBIT + C_SUM' },

                // JAHRESERGEBNIS
                { id: 'JAHRESERGEBNIS', label: 'Jahresüberschuss/-fehlbetrag', type: 'result', level: 0, color: '#1e3a5f', textColor: 'white', borderColor: '#0d47a1', bold: true, formula: 'EBT' }
            ]
        };
    },

    /**
     * Bilanz-Report laden
     */
    loadBilanzReport: async function() {
        const tbody = document.getElementById('bilanz-guv-body');
        if (!tbody) return;

        const jahr = parseInt(document.getElementById('reporting-jahr')?.value || new Date().getFullYear());

        // Zeitraum-Filter auslesen
        const zeitraumSelect = document.getElementById('bilanz-zeitraum');
        const zeitraum = zeitraumSelect?.value || 'ytd';
        const zeitraumInfo = document.getElementById('bilanz-zeitraum-info');

        // Datum-Bereich berechnen
        let startDate, endDate, monate;
        const heute = new Date();
        const aktuellerMonat = heute.getMonth() + 1; // 1-12
        const vorMonat = aktuellerMonat - 1 || 12; // Vormonat (Dezember wenn Januar)
        const monatNamen = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

        if (zeitraum === 'ytd') {
            // Year-to-Date: 1. Januar bis Ende Vormonat
            startDate = `${jahr}-01-01`;
            if (vorMonat === 12) {
                // Wenn aktueller Monat Januar ist, nehmen wir Dezember des Vorjahres
                endDate = `${jahr - 1}-12-31`;
                monate = 12;
            } else {
                const letzterTagVormonat = new Date(jahr, vorMonat, 0).getDate();
                endDate = `${jahr}-${String(vorMonat).padStart(2, '0')}-${letzterTagVormonat}`;
                monate = vorMonat;
            }
            if (zeitraumInfo) zeitraumInfo.textContent = `(01.01. - ${monatNamen[vorMonat]} ${jahr}, ${monate} Monate)`;
        } else if (zeitraum === 'year') {
            // Ganzes Jahr
            startDate = `${jahr}-01-01`;
            endDate = `${jahr}-12-31`;
            monate = 12;
            if (zeitraumInfo) zeitraumInfo.textContent = '(Ganzes Jahr, 12 Monate)';
        } else {
            // Einzelner Monat
            const monat = parseInt(zeitraum);
            startDate = `${jahr}-${String(monat).padStart(2, '0')}-01`;
            const letzterTag = new Date(jahr, monat, 0).getDate();
            endDate = `${jahr}-${String(monat).padStart(2, '0')}-${letzterTag}`;
            monate = 1;
            if (zeitraumInfo) zeitraumInfo.textContent = `(${monatNamen[monat]} ${jahr})`;
        }

        // Vergleichsjahr-Dropdown automatisch aktualisieren basierend auf ausgewähltem Jahr
        const vergleichsjahrSelect = document.getElementById('bilanz-vergleichsjahr');
        if (vergleichsjahrSelect) {
            const currentSelection = parseInt(vergleichsjahrSelect.value);
            const minYear = 2018;
            let html = '';
            for (let y = jahr - 1; y >= minYear; y--) {
                // Behalte aktuelle Auswahl wenn möglich, sonst Vorjahr
                const selected = (currentSelection && currentSelection < jahr && currentSelection >= minYear)
                    ? (y === currentSelection ? 'selected' : '')
                    : (y === jahr - 1 ? 'selected' : '');
                html += `<option value="${y}" ${selected}>Vergleich: ${y}</option>`;
            }
            vergleichsjahrSelect.innerHTML = html;
        }

        const vorjahr = parseInt(vergleichsjahrSelect?.value || jahr - 1);
        // Vorjahr: gleicher Zeitraum
        const vorjahrStart = startDate.replace(String(jahr), String(vorjahr));
        const vorjahrEnd = endDate.replace(String(jahr), String(vorjahr));

        // Spaltenüberschriften aktualisieren
        const colAktuell = document.getElementById('bilanz-col-aktuell');
        const colVorjahr = document.getElementById('bilanz-col-vorjahr');
        if (colAktuell) colAktuell.textContent = jahr;
        if (colVorjahr) colVorjahr.textContent = vorjahr;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Lade Bilanz-Daten...</td></tr>';

        try {
            // Budget-Einträge für das Jahr laden
            const { data: budgetEntries } = await SupabaseService.client
                .from('budget_entries')
                .select('konto_nr, jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, dez')
                .eq('fiscal_year', jahr)
                .eq('entry_type', 'budget');

            // Budget-Map erstellen (Konto -> anteilige Summe je nach Zeitraum)
            const budgetMap = new Map();
            const monatsNamen = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

            (budgetEntries || []).forEach(entry => {
                let anteiligeSumme = 0;

                if (zeitraum === 'ytd') {
                    // YTD: Summe der Monate Januar bis Vormonat
                    for (let i = 0; i < monate; i++) {
                        anteiligeSumme += entry[monatsNamen[i]] || 0;
                    }
                } else if (zeitraum === 'year') {
                    // Ganzes Jahr: alle 12 Monate
                    for (let i = 0; i < 12; i++) {
                        anteiligeSumme += entry[monatsNamen[i]] || 0;
                    }
                } else {
                    // Einzelner Monat: nur dieser Monat
                    const monatIndex = parseInt(zeitraum) - 1;
                    anteiligeSumme = entry[monatsNamen[monatIndex]] || 0;
                }

                budgetMap.set(entry.konto_nr, anteiligeSumme);
            });

            console.log('📊 Bilanz Budget geladen:', budgetMap.size, 'Einträge, Zeitraum:', zeitraum, ', Monate:', monate);

            // DATEV-Buchungen für beide Jahre laden (nach Buchungsdatum, nicht import_year)
            // WICHTIG: ist_gutschrift und dokument_typ laden für korrekte Gutschrift-Berechnung
            // WICHTIG: Supabase hat ein serverseitiges Limit von 1000 Zeilen - wir müssen paginieren!

            // Hilfsfunktion für paginierte Abfrage
            const loadAllBuchungen = async (startDate, endDate) => {
                const allData = [];
                const pageSize = 1000;
                let offset = 0;
                let hasMore = true;

                while (hasMore) {
                    const { data, error } = await SupabaseService.client
                        .from('datev_bookings')
                        .select('konto_nr, kategorie, betrag, datum, ist_gutschrift, dokument_typ')
                        .gte('datum', startDate)
                        .lte('datum', endDate)
                        .range(offset, offset + pageSize - 1)
                        .order('datum', { ascending: true });

                    if (error) throw error;

                    if (data && data.length > 0) {
                        allData.push(...data);
                        offset += pageSize;
                        hasMore = data.length === pageSize;
                    } else {
                        hasMore = false;
                    }
                }

                return allData;
            };

            // Buchungen für den ausgewählten Zeitraum laden
            const buchungenAktuell = await loadAllBuchungen(startDate, endDate);
            const buchungenVorjahr = await loadAllBuchungen(vorjahrStart, vorjahrEnd);

            console.log(`📊 Bilanz ${jahr} (${startDate} - ${endDate}): ${buchungenAktuell?.length || 0} Buchungen geladen`);
            console.log(`📊 Bilanz ${vorjahr} (${vorjahrStart} - ${vorjahrEnd}): ${buchungenVorjahr?.length || 0} Buchungen geladen`);

            // Nach Konto-Prefix gruppieren (erste 3 Zeichen)
            // Gutschriften werden als negative Beträge behandelt
            const aggregiereNachKonto = (buchungen) => {
                const result = {};
                (buchungen || []).forEach(b => {
                    const konto = b.konto_nr || '';
                    const prefix = konto.substring(0, 3);
                    if (!result[prefix]) result[prefix] = 0;

                    let betrag = parseFloat(b.betrag) || 0;

                    // Gutschrift-Erkennung: dokument_typ = 'NC' oder ist_gutschrift = true
                    // Bei Gutschriften: Betrag negativ (wird von Aufwand/Umsatz abgezogen)
                    const istGutschrift = b.dokument_typ === 'NC' || b.ist_gutschrift === true;
                    if (istGutschrift) {
                        // Gutschrift: Betrag negieren (falls positiv gespeichert)
                        betrag = -Math.abs(betrag);
                        console.log(`📋 Gutschrift erkannt: Konto ${konto}, Betrag: ${betrag}`);
                    }

                    result[prefix] += betrag;
                });
                return result;
            };

            const kontenAktuell = aggregiereNachKonto(buchungenAktuell);
            const kontenVorjahr = aggregiereNachKonto(buchungenVorjahr);

            console.log('📊 Konten aktuell:', kontenAktuell);
            console.log('📊 Konten vorjahr:', kontenVorjahr);

            // DETAILLIERTE DEBUG-AUSGABE für Bilanz-Vergleich mit PDF
            console.log('═══════════════════════════════════════════════════════════════');
            console.log(`📊 DETAILLIERTE BILANZ-ANALYSE FÜR ${jahr}`);
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('ALLE KONTO-PREFIXE IN DER DATENBANK:');
            const allePrefixe = Object.keys(kontenAktuell).sort();
            allePrefixe.forEach(prefix => {
                console.log(`  ${prefix}: ${kontenAktuell[prefix].toFixed(2)}`);
            });
            console.log('───────────────────────────────────────────────────────────────');
            console.log('Beispiel erste 10 Buchungen (Rohformat):');
            (buchungenAktuell || []).slice(0, 10).forEach(b => {
                console.log(`  Konto: "${b.konto_nr}", Betrag: ${b.betrag}, Datum: ${b.datum}`);
            });
            console.log('═══════════════════════════════════════════════════════════════');

            // Struktur durchgehen und Werte berechnen
            const struktur = this.getBilanzStruktur();
            const werte = {};
            const kontenDetails = {}; // Speichert Detail-Konten pro Gruppe

            // Auch nach vollständiger Kontonummer aggregieren für Details
            const aggregiereNachVollemKonto = (buchungen) => {
                const result = {};
                (buchungen || []).forEach(b => {
                    const konto = b.konto_nr || '';
                    if (!result[konto]) result[konto] = { betrag: 0, kategorie: b.kategorie || konto };
                    let betrag = parseFloat(b.betrag) || 0;
                    const istGutschrift = b.dokument_typ === 'NC' || b.ist_gutschrift === true;
                    if (istGutschrift) betrag = -Math.abs(betrag);
                    result[konto].betrag += betrag;
                });
                return result;
            };
            const volleKontenAktuell = aggregiereNachVollemKonto(buchungenAktuell);
            const volleKontenVorjahr = aggregiereNachVollemKonto(buchungenVorjahr);

            // Gruppen-Werte berechnen
            struktur.guv.filter(s => s.type === 'group').forEach(gruppe => {
                let sumAktuell = 0, sumVorjahr = 0;
                const details = [];

                // Hilfsfunktion: Prüft ob Kategorie ausgeschlossen werden soll
                const shouldExclude = (kategorie) => {
                    if (!gruppe.excludeKategorie || !kategorie) return false;
                    const kat = kategorie.toLowerCase();
                    return gruppe.excludeKategorie.some(ex => kat.includes(ex.toLowerCase()));
                };

                (gruppe.kontoPattern || []).forEach(pattern => {
                    // Für Details: vollständige Kontonummern (mit excludeKategorie Filter)
                    Object.keys(volleKontenAktuell).forEach(konto => {
                        if (konto.startsWith(pattern)) {
                            const kontoData = volleKontenAktuell[konto];
                            // Prüfe ob Kategorie ausgeschlossen werden soll
                            if (shouldExclude(kontoData.kategorie)) {
                                console.log(`🚫 Ausgeschlossen: ${konto} - ${kontoData.kategorie}`);
                                return;
                            }
                            sumAktuell += kontoData.betrag;
                            const existing = details.find(d => d.konto === konto);
                            if (existing) {
                                existing.aktuell = kontoData.betrag;
                            } else {
                                details.push({
                                    konto: konto,
                                    kategorie: kontoData.kategorie,
                                    aktuell: kontoData.betrag,
                                    vorjahr: 0
                                });
                            }
                        }
                    });
                    Object.keys(volleKontenVorjahr).forEach(konto => {
                        if (konto.startsWith(pattern)) {
                            const kontoData = volleKontenVorjahr[konto];
                            // Prüfe ob Kategorie ausgeschlossen werden soll
                            if (shouldExclude(kontoData.kategorie)) {
                                return;
                            }
                            sumVorjahr += kontoData.betrag;
                            const existing = details.find(d => d.konto === konto);
                            if (existing) {
                                existing.vorjahr = kontoData.betrag;
                            } else {
                                details.push({
                                    konto: konto,
                                    kategorie: kontoData.kategorie,
                                    aktuell: 0,
                                    vorjahr: kontoData.betrag
                                });
                            }
                        }
                    });
                });

                // Details nach Kontonummer sortieren
                details.sort((a, b) => a.konto.localeCompare(b.konto));
                kontenDetails[gruppe.id] = details;

                // Vorzeichen für GuV:
                // - Erträge: positiv (direkt aus DB)
                // - Aufwendungen mit negate: true: Vorzeichen umdrehen (DB hat positive Werte)
                if (gruppe.negate) {
                    werte[gruppe.id] = { aktuell: -sumAktuell, vorjahr: -sumVorjahr };
                } else {
                    werte[gruppe.id] = { aktuell: sumAktuell, vorjahr: sumVorjahr };
                }
            });

            // Summen berechnen
            struktur.guv.filter(s => s.type === 'sum').forEach(summe => {
                let sumAktuell = 0, sumVorjahr = 0;
                (summe.sumOf || []).forEach(id => {
                    if (werte[id]) {
                        sumAktuell += werte[id].aktuell;
                        sumVorjahr += werte[id].vorjahr;
                    }
                });
                werte[summe.id] = { aktuell: sumAktuell, vorjahr: sumVorjahr };
            });

            // Ergebnisse berechnen (EBITDA, EBIT, etc.)
            struktur.guv.filter(s => s.type === 'result').forEach(result => {
                let aktuell = 0, vorjahr = 0;
                if (result.formula) {
                    // Einfache Formel-Verarbeitung
                    const parts = result.formula.split(/\s*([+-])\s*/);
                    let operator = '+';
                    parts.forEach(part => {
                        part = part.trim();
                        if (part === '+' || part === '-') {
                            operator = part;
                        } else if (werte[part]) {
                            if (operator === '+') {
                                aktuell += werte[part].aktuell;
                                vorjahr += werte[part].vorjahr;
                            } else {
                                aktuell -= werte[part].aktuell;
                                vorjahr -= werte[part].vorjahr;
                            }
                        }
                    });
                }
                werte[result.id] = { aktuell, vorjahr };
            });

            // Budget-Werte für Gruppen berechnen
            const budgetWerte = {};
            struktur.guv.filter(s => s.type === 'group').forEach(gruppe => {
                let budgetSum = 0;
                (gruppe.kontoPattern || []).forEach(pattern => {
                    // Alle Konten mit diesem Prefix aus budgetMap summieren
                    for (const [konto, betrag] of budgetMap.entries()) {
                        if (konto.startsWith(pattern)) {
                            budgetSum += betrag;
                        }
                    }
                });
                // Bei Aufwandskonten (negate): Vorzeichen behalten (Budget ist positiv für Kosten)
                budgetWerte[gruppe.id] = gruppe.negate ? -budgetSum : budgetSum;
            });

            // Budget-Summen berechnen
            struktur.guv.filter(s => s.type === 'sum').forEach(summe => {
                let budgetSum = 0;
                (summe.sumOf || []).forEach(id => {
                    budgetSum += budgetWerte[id] || 0;
                });
                budgetWerte[summe.id] = budgetSum;
            });

            // Budget für Ergebnisse berechnen
            struktur.guv.filter(s => s.type === 'result').forEach(result => {
                let budget = 0;
                if (result.formula) {
                    const parts = result.formula.split(/\s*([+-])\s*/);
                    let operator = '+';
                    parts.forEach(part => {
                        part = part.trim();
                        if (part === '+' || part === '-') {
                            operator = part;
                        } else if (budgetWerte[part] !== undefined) {
                            if (operator === '+') {
                                budget += budgetWerte[part];
                            } else {
                                budget -= budgetWerte[part];
                            }
                        }
                    });
                }
                budgetWerte[result.id] = budget;
            });

            // A_SUM Budget wird bereits korrekt als Summe von A1 + A5 berechnet

            // Cache speichern
            this.bilanzReportCache = { jahr, vorjahr, werte, struktur, kontenDetails, budgetWerte, budgetMap };

            console.log('📊 Berechnete Werte:', werte);
            console.log('📊 Budget-Werte:', budgetWerte);
            console.log('📊 Konten-Details:', kontenDetails);

            // KPIs aktualisieren
            const gesamtleistung = werte['A_SUM']?.aktuell || 0;
            const aufwendungen = Math.abs(werte['B_SUM']?.aktuell || 0);
            const ebitda = werte['EBITDA']?.aktuell || 0;
            const ebit = werte['EBIT']?.aktuell || 0;
            const jahresergebnis = werte['JAHRESERGEBNIS']?.aktuell || 0;

            console.log(`📊 Gesamtleistung: ${gesamtleistung}, Aufwendungen: ${aufwendungen}, EBIT: ${ebit}, Jahresergebnis: ${jahresergebnis}`);

            document.getElementById('bilanz-gesamtleistung').textContent = this.formatNumber(gesamtleistung) + ' EUR';
            document.getElementById('bilanz-aufwendungen').textContent = this.formatNumber(aufwendungen) + ' EUR';
            document.getElementById('bilanz-ebitda').textContent = this.formatNumber(ebitda) + ' EUR';
            document.getElementById('bilanz-ebitda-pct').textContent = gesamtleistung ? ((ebitda / gesamtleistung) * 100).toFixed(1) + '% der Gesamtleistung' : '0%';
            document.getElementById('bilanz-ebit').textContent = this.formatNumber(ebit) + ' EUR';
            document.getElementById('bilanz-ebit-pct').textContent = gesamtleistung ? ((ebit / gesamtleistung) * 100).toFixed(1) + '% der Gesamtleistung' : '0%';
            document.getElementById('bilanz-jahresergebnis').textContent = this.formatNumber(jahresergebnis) + ' EUR';
            document.getElementById('bilanz-jahresergebnis-pct').textContent = gesamtleistung ? ((jahresergebnis / gesamtleistung) * 100).toFixed(1) + '% der Gesamtleistung' : '0%';

            // Tabelle rendern
            this.renderBilanzTable(struktur, werte, kontenDetails, budgetWerte);

        } catch (error) {
            console.error('Fehler beim Laden der Bilanz:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">
                Fehler beim Laden: ${error.message}
            </td></tr>`;
        }
    },

    /**
     * Bilanz-Tabelle rendern mit aufklappbaren Gruppen und Konten-Details
     */
    renderBilanzTable: function(struktur, werte, kontenDetails, budgetWerte = {}) {
        const tbody = document.getElementById('bilanz-guv-body');
        if (!tbody) return;

        // Initialisiere bilanzKontoExpanded falls nicht vorhanden
        if (!this.bilanzKontoExpanded) this.bilanzKontoExpanded = {};

        let html = '';

        struktur.guv.forEach(item => {
            const w = werte[item.id] || { aktuell: 0, vorjahr: 0 };
            const budget = budgetWerte[item.id] || 0;
            const abwPlan = w.aktuell - budget;
            const abwPlanPct = budget !== 0 ? ((abwPlan / Math.abs(budget)) * 100) : 0;
            const diff = w.aktuell - w.vorjahr;
            const pct = w.vorjahr !== 0 ? ((diff / Math.abs(w.vorjahr)) * 100) : (w.aktuell !== 0 ? 100 : 0);

            const bgColor = item.color || 'transparent';
            const textColor = item.textColor || 'inherit';
            const borderLeft = item.borderColor ? `5px solid ${item.borderColor}` : 'none';
            const fontWeight = item.bold ? '700' : '400';
            const paddingLeft = (item.level || 0) * 20 + 12;

            const isHeader = item.type === 'header';
            const isGroup = item.type === 'group';
            const isSum = item.type === 'sum';
            const isResult = item.type === 'result';

            // Expand/Collapse Icon für Header-Gruppen (A, B, C)
            let expandIcon = '';
            if (isHeader) {
                const expanded = this.bilanzExpanded[item.id] !== false;
                expandIcon = `<span class="bilanz-expand" data-id="${item.id}" style="cursor: pointer; display: inline-block; width: 24px; height: 24px; text-align: center; line-height: 24px; background: ${item.borderColor || '#666'}; color: white; border-radius: 4px; font-weight: bold; margin-right: 8px;" onclick="App.toggleBilanzGroup('${item.id}')">${expanded ? '−' : '+'}</span>`;
            }

            // Zeile rendern
            const rowClass = isGroup ? `bilanz-detail bilanz-child-${item.parent}` : '';
            const displayStyle = isGroup && this.bilanzExpanded[item.parent] === false ? 'display: none;' : '';

            const rowStyle = `background: ${bgColor}; color: ${textColor}; border-left: ${borderLeft}; ${displayStyle}`;

            if (isHeader) {
                html += `<tr style="${rowStyle}">
                    <td style="padding: 14px 8px;">${expandIcon}</td>
                    <td style="padding: 14px ${paddingLeft}px; font-weight: 700; font-size: 1rem;">${item.label}</td>
                    <td style="text-align: right; font-weight: 600; padding: 14px 12px;"></td>
                    <td style="text-align: right; font-weight: 600; padding: 14px 12px;"></td>
                    <td style="text-align: right; padding: 14px 12px;"></td>
                    <td style="text-align: right; padding: 14px 12px;"></td>
                    <td style="text-align: right; padding: 14px 12px;"></td>
                    <td style="text-align: right; padding: 14px 12px;"></td>
                </tr>`;
            } else {
                // Farben: Bei Kosten ist negativ gut, bei Erträgen ist positiv gut
                const isKosten = item.negate === true;
                const abwPlanColor = abwPlan < 0 ? (isKosten ? '#28a745' : '#dc3545') : (isKosten ? '#dc3545' : '#28a745');
                const diffColor = diff > 0 ? '#28a745' : (diff < 0 ? '#dc3545' : '#666');

                // Bei Gruppen: Plus-Button für Konten-Details hinzufügen
                let kontoExpandIcon = '';
                const details = kontenDetails && kontenDetails[item.id];
                if (isGroup && details && details.length > 0) {
                    const kontoExpanded = this.bilanzKontoExpanded[item.id] === true;
                    kontoExpandIcon = `<span class="bilanz-konto-expand" data-id="${item.id}" style="cursor: pointer; display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; background: #6c757d; color: white; border-radius: 3px; font-size: 14px; font-weight: bold; margin-right: 6px;" onclick="App.toggleBilanzKonten('${item.id}')">${kontoExpanded ? '−' : '+'}</span>`;
                }

                html += `<tr class="${rowClass}" style="${rowStyle}">
                    <td style="padding: 10px 8px;">${kontoExpandIcon}</td>
                    <td style="padding: 10px ${paddingLeft}px; font-weight: ${fontWeight}; font-size: ${isResult || isSum ? '0.95rem' : '0.875rem'};">${item.label}</td>
                    <td style="text-align: right; font-weight: ${fontWeight}; padding: 10px 12px; font-size: ${isResult ? '1rem' : '0.875rem'};">${this.formatNumber(w.aktuell)}</td>
                    <td style="text-align: right; padding: 10px 12px; color: #666; font-size: 0.85rem;">${budget ? this.formatNumber(budget) : '-'}</td>
                    <td style="text-align: right; padding: 10px 12px; color: ${abwPlanColor}; font-size: 0.85rem;">${budget ? (abwPlan >= 0 ? '+' : '') + this.formatNumber(abwPlan) : '-'}</td>
                    <td style="text-align: right; padding: 10px 12px; color: ${abwPlanColor}; font-size: 0.8rem;">${budget ? (abwPlanPct >= 0 ? '+' : '') + abwPlanPct.toFixed(1) + '%' : '-'}</td>
                    <td style="text-align: right; padding: 10px 12px; color: #666; font-size: 0.85rem;">${this.formatNumber(w.vorjahr)}</td>
                    <td style="text-align: right; padding: 10px 12px; color: ${diffColor}; font-size: 0.8rem;">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</td>
                </tr>`;

                // Konten-Detail-Zeilen (initial versteckt)
                if (isGroup && details && details.length > 0) {
                    const kontoExpanded = this.bilanzKontoExpanded[item.id] === true;
                    const kontoDisplayStyle = kontoExpanded ? '' : 'display: none;';
                    const parentHidden = this.bilanzExpanded[item.parent] === false;

                    details.forEach(konto => {
                        const kDiff = konto.aktuell - konto.vorjahr;
                        const kPct = konto.vorjahr !== 0 ? ((kDiff / Math.abs(konto.vorjahr)) * 100) : (konto.aktuell !== 0 ? 100 : 0);
                        const kDiffColor = kDiff > 0 ? '#28a745' : (kDiff < 0 ? '#dc3545' : '#888');
                        const kontoId = konto.konto.replace(/[^a-zA-Z0-9]/g, '_');

                        // Budget für dieses Konto aus budgetMap holen
                        const kontoBudget = this.bilanzReportCache?.budgetMap?.get(konto.konto) || 0;
                        // Bei Aufwendungen (negate) ist Budget negativ in der Anzeige
                        const kontoBudgetDisplay = item.negate ? -kontoBudget : kontoBudget;
                        const kAbwPlan = konto.aktuell - kontoBudgetDisplay;
                        const kAbwPlanPct = kontoBudgetDisplay !== 0 ? ((kAbwPlan / Math.abs(kontoBudgetDisplay)) * 100) : 0;
                        const kAbwPlanColor = kAbwPlan < 0 ? (item.negate ? '#28a745' : '#dc3545') : (item.negate ? '#dc3545' : '#28a745');

                        // + Button für Einzelbuchungen
                        const buchungenExpandIcon = `<span class="bilanz-buchungen-expand" data-konto="${konto.konto}"
                            style="cursor: pointer; display: inline-block; width: 18px; height: 18px; text-align: center; line-height: 18px; background: #ffc107; color: #333; border-radius: 3px; font-size: 12px; font-weight: bold; margin-right: 6px;"
                            onclick="event.stopPropagation(); App.toggleKontoBuchungen('${konto.konto}', '${kontoId}')">+</span>`;

                        html += `<tr class="bilanz-konto-detail bilanz-konto-child-${item.id} bilanz-child-${item.parent}"
                                     style="background: #f8f9fa; ${kontoDisplayStyle} ${parentHidden ? 'display: none;' : ''}"
                                     id="konto-row-${kontoId}">
                            <td style="padding: 6px 8px;">${buchungenExpandIcon}</td>
                            <td style="padding: 6px 12px; padding-left: ${paddingLeft + 20}px; font-size: 0.8rem; color: #666;">
                                <span style="font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin-right: 8px;">${konto.konto}</span>
                                ${konto.kategorie || ''}
                            </td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.8rem; color: #666;">${this.formatNumber(konto.aktuell)}</td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.75rem; color: #666;">${kontoBudget ? this.formatNumber(kontoBudgetDisplay) : '-'}</td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.75rem; color: ${kAbwPlanColor};">${kontoBudget ? (kAbwPlan >= 0 ? '+' : '') + this.formatNumber(kAbwPlan) : '-'}</td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.75rem; color: ${kAbwPlanColor};">${kontoBudget ? (kAbwPlanPct >= 0 ? '+' : '') + kAbwPlanPct.toFixed(1) + '%' : '-'}</td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.8rem; color: #888;">${this.formatNumber(konto.vorjahr)}</td>
                            <td style="text-align: right; padding: 6px 12px; font-size: 0.75rem; color: ${kDiffColor};">${kPct >= 0 ? '+' : ''}${kPct.toFixed(1)}%</td>
                        </tr>`;

                        // Platzhalter-Zeile für Buchungen (wird dynamisch befüllt)
                        html += `<tr class="bilanz-buchungen-container" id="buchungen-container-${kontoId}" style="display: none;">
                            <td colspan="8" style="padding: 0; background: #fff;">
                                <div id="buchungen-content-${kontoId}" style="padding: 0.5rem 1rem 1rem 60px;">
                                    <div style="text-align: center; padding: 1rem; color: #666;">Lade Buchungen...</div>
                                </div>
                            </td>
                        </tr>`;
                    });
                }
            }
        });

        tbody.innerHTML = html;
    },

    /**
     * Konten-Details einer Gruppe auf-/zuklappen
     */
    toggleBilanzKonten: function(groupId) {
        if (!this.bilanzKontoExpanded) this.bilanzKontoExpanded = {};
        this.bilanzKontoExpanded[groupId] = this.bilanzKontoExpanded[groupId] !== true;

        // Zeilen ein-/ausblenden
        const childRows = document.querySelectorAll(`.bilanz-konto-child-${groupId}`);
        childRows.forEach(row => {
            row.style.display = this.bilanzKontoExpanded[groupId] ? '' : 'none';
        });

        // Icon aktualisieren
        const icon = document.querySelector(`.bilanz-konto-expand[data-id="${groupId}"]`);
        if (icon) {
            icon.textContent = this.bilanzKontoExpanded[groupId] ? '−' : '+';
        }
    },

    /**
     * Bilanz-Gruppe auf-/zuklappen
     */
    toggleBilanzGroup: function(groupId) {
        this.bilanzExpanded[groupId] = this.bilanzExpanded[groupId] === false ? true : false;

        // Zeilen ein-/ausblenden
        const childRows = document.querySelectorAll(`.bilanz-child-${groupId}`);
        childRows.forEach(row => {
            row.style.display = this.bilanzExpanded[groupId] ? '' : 'none';
        });

        // Icon aktualisieren
        const icon = document.querySelector(`.bilanz-expand[data-id="${groupId}"]`);
        if (icon) {
            icon.textContent = this.bilanzExpanded[groupId] ? '−' : '+';
        }
    },

    /**
     * Bilanz als CSV exportieren
     */
    exportBilanzCsv: function() {
        if (!this.bilanzReportCache) {
            alert('Bitte zuerst den Report laden (Aktualisieren klicken).');
            return;
        }

        const { jahr, vorjahr, werte, struktur } = this.bilanzReportCache;
        let csv = '\uFEFF'; // BOM für Excel
        csv += `Bilanz / GuV Report\n`;
        csv += `Jahr: ${jahr} vs. Vorjahr: ${vorjahr}\n\n`;
        csv += `Position;${jahr};${vorjahr};Differenz;%\n`;

        struktur.guv.forEach(item => {
            const w = werte[item.id] || { aktuell: 0, vorjahr: 0 };
            const diff = w.aktuell - w.vorjahr;
            const pct = w.vorjahr !== 0 ? ((diff / Math.abs(w.vorjahr)) * 100).toFixed(1) : '0';

            if (item.type !== 'header') {
                const indent = '  '.repeat(item.level || 0);
                csv += `"${indent}${item.label}";${w.aktuell.toFixed(2)};${w.vorjahr.toFixed(2)};${diff.toFixed(2)};${pct}%\n`;
            } else {
                csv += `\n"${item.label}";;;;\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Bilanz_GuV_${jahr}.csv`;
        link.click();
    },

    // ========================================
    // KONTO-BUCHUNGEN INLINE (in Bilanz-Tabelle)
    // ========================================

    // Cache für geladene Konto-Buchungen
    kontoBuchungenLoaded: {},
    kontoBuchungenJahr: null, // Jahr für das der Cache gilt
    kontoBuchungenSort: {}, // Sortierung pro Konto

    /**
     * Cache leeren wenn Jahr wechselt
     */
    clearKontoBuchungenCache: function() {
        this.kontoBuchungenLoaded = {};
        this.kontoBuchungenSort = {};
    },

    /**
     * Klappt die Einzelbuchungen für ein Konto auf/zu (inline in der Bilanz-Tabelle)
     */
    toggleKontoBuchungen: async function(kontoNr, kontoId) {
        const container = document.getElementById(`buchungen-container-${kontoId}`);
        const content = document.getElementById(`buchungen-content-${kontoId}`);
        const icon = document.querySelector(`.bilanz-buchungen-expand[data-konto="${kontoNr}"]`);

        if (!container) {
            console.error('Container nicht gefunden:', kontoId);
            return;
        }

        // Jahr aus dem aktuellen Bilanz-Filter
        const jahr = parseInt(document.getElementById('reporting-jahr')?.value || new Date().getFullYear());

        // Cache leeren wenn Jahr gewechselt hat
        if (this.kontoBuchungenJahr !== jahr) {
            this.clearKontoBuchungenCache();
            this.kontoBuchungenJahr = jahr;
        }

        // Toggle visibility
        const isVisible = container.style.display !== 'none';

        if (isVisible) {
            // Zuklappen
            container.style.display = 'none';
            if (icon) icon.textContent = '+';
        } else {
            // Aufklappen
            container.style.display = '';
            if (icon) icon.textContent = '−';

            // Daten laden falls noch nicht geladen
            if (!this.kontoBuchungenLoaded[kontoNr]) {
                content.innerHTML = '<div style="text-align: center; padding: 1rem; color: #666;">Lade Buchungen...</div>';

                try {
                    // Buchungen laden
                    const { data: buchungen, error } = await SupabaseService.client
                        .from('datev_bookings')
                        .select('*')
                        .eq('konto_nr', kontoNr)
                        .or('archived.is.null,archived.eq.false')
                        .gte('datum', `${jahr}-01-01`)
                        .lte('datum', `${jahr}-12-31`)
                        .order('datum', { ascending: false });

                    if (error) throw error;

                    console.log(`📊 ${(buchungen || []).length} Buchungen für Konto ${kontoNr} (${jahr}) geladen`);

                    this.kontoBuchungenLoaded[kontoNr] = buchungen || [];
                    this.kontoBuchungenSort[kontoNr] = { field: 'datum', dir: 'desc' };
                    this.renderInlineBuchungen(kontoNr, kontoId, buchungen || []);

                } catch (error) {
                    console.error('Fehler beim Laden:', error);
                    content.innerHTML = `<div style="text-align: center; padding: 1rem; color: #dc3545;">Fehler: ${error.message}</div>`;
                }
            }
        }
    },

    /**
     * Sortiert die inline Buchungen
     */
    sortInlineBuchungen: function(kontoNr, kontoId, field) {
        const buchungen = this.kontoBuchungenLoaded[kontoNr];
        if (!buchungen) return;

        // Toggle Sortierrichtung
        const currentSort = this.kontoBuchungenSort[kontoNr] || { field: 'datum', dir: 'desc' };
        let newDir = 'desc';
        if (currentSort.field === field) {
            newDir = currentSort.dir === 'desc' ? 'asc' : 'desc';
        }
        this.kontoBuchungenSort[kontoNr] = { field, dir: newDir };

        // Sortieren
        const sorted = [...buchungen].sort((a, b) => {
            let valA, valB;
            switch (field) {
                case 'datum':
                    valA = a.datum || '';
                    valB = b.datum || '';
                    break;
                case 'betrag':
                    valA = parseFloat(a.betrag) || 0;
                    valB = parseFloat(b.betrag) || 0;
                    break;
                case 'lieferant':
                    valA = (a.fornitore_name || '').toLowerCase();
                    valB = (b.fornitore_name || '').toLowerCase();
                    break;
                case 'dokument':
                    valA = a.dokument_nr || '';
                    valB = b.dokument_nr || '';
                    break;
                default:
                    valA = a.datum || '';
                    valB = b.datum || '';
            }

            if (newDir === 'asc') {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            } else {
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            }
        });

        this.renderInlineBuchungen(kontoNr, kontoId, sorted);
    },

    /**
     * Rendert die Buchungen inline unterhalb des Kontos
     */
    renderInlineBuchungen: function(kontoNr, kontoId, buchungen) {
        const content = document.getElementById(`buchungen-content-${kontoId}`);
        if (!content) return;

        if (!buchungen || buchungen.length === 0) {
            content.innerHTML = '<div style="padding: 0.5rem; color: #666; font-style: italic;">Keine Buchungen im ausgewählten Jahr</div>';
            return;
        }

        const sort = this.kontoBuchungenSort[kontoNr] || { field: 'datum', dir: 'desc' };
        const arrow = (field) => sort.field === field ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';

        // Summe berechnen
        const total = buchungen.reduce((sum, b) => sum + (parseFloat(b.betrag) || 0), 0);

        let html = `
            <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #e3f2fd; border-radius: 4px;">
                <span style="font-size: 0.8rem; color: #1565c0;">${buchungen.length} Buchung${buchungen.length !== 1 ? 'en' : ''}</span>
                <span style="font-weight: 600; color: ${total >= 0 ? '#28a745' : '#dc3545'};">Summe: ${this.formatNumber(total)} EUR</span>
            </div>
            <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f1f3f4; text-align: left;">
                        <th style="padding: 6px 8px; width: 85px; cursor: pointer; user-select: none;" onclick="App.sortInlineBuchungen('${kontoNr}', '${kontoId}', 'datum')">Datum${arrow('datum')}</th>
                        <th style="padding: 6px 8px; cursor: pointer; user-select: none;" onclick="App.sortInlineBuchungen('${kontoNr}', '${kontoId}', 'lieferant')">Lieferant${arrow('lieferant')}</th>
                        <th style="padding: 6px 8px; width: 80px; cursor: pointer; user-select: none;" onclick="App.sortInlineBuchungen('${kontoNr}', '${kontoId}', 'dokument')">Dok-Nr${arrow('dokument')}</th>
                        <th style="padding: 6px 8px;">Beschreibung</th>
                        <th style="padding: 6px 8px; text-align: right; width: 100px; cursor: pointer; user-select: none;" onclick="App.sortInlineBuchungen('${kontoNr}', '${kontoId}', 'betrag')">Betrag${arrow('betrag')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        buchungen.forEach((b, idx) => {
            const betrag = parseFloat(b.betrag) || 0;
            const betragColor = betrag >= 0 ? '#28a745' : '#dc3545';
            const datum = b.datum ? new Date(b.datum).toLocaleDateString('de-DE') : '-';
            const rowBg = idx % 2 === 0 ? '#fff' : '#fafafa';

            html += `
                <tr style="background: ${rowBg}; border-bottom: 1px solid #eee;">
                    <td style="padding: 5px 8px; white-space: nowrap;">${datum}</td>
                    <td style="padding: 5px 8px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${b.fornitore_name || ''}">${b.fornitore_name || '-'}</td>
                    <td style="padding: 5px 8px;"><code style="background: #e9ecef; padding: 1px 4px; border-radius: 2px; font-size: 0.7rem;">${b.dokument_nr || '-'}</code></td>
                    <td style="padding: 5px 8px; max-width: 250px; overflow: hidden; text-overflow: ellipsis;" title="${b.beschreibung || ''}">${b.beschreibung || '-'}</td>
                    <td style="padding: 5px 8px; text-align: right; font-weight: 500; color: ${betragColor}; white-space: nowrap;">${this.formatNumber(betrag)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        content.innerHTML = html;
    },

    // ========================================
    // KONTO-BUCHUNGEN MODAL (Legacy)
    // ========================================

    // Cache für Konto-Buchungen
    kontoBuchungenCache: {
        kontoNr: null,
        kontoName: null,
        buchungen: [],
        filtered: [],
        sortField: 'datum',
        sortDir: 'desc'
    },

    /**
     * Öffnet das Modal mit allen Buchungen für ein bestimmtes Konto
     */
    showKontoBuchungen: async function(kontoNr, kontoName) {
        const modal = document.getElementById('konto-buchungen-modal');
        const tbody = document.getElementById('konto-buchungen-body');
        const title = document.getElementById('konto-buchungen-title');
        const subtitle = document.getElementById('konto-buchungen-subtitle');

        // Titel setzen
        title.textContent = `Konto ${kontoNr}`;
        subtitle.textContent = kontoName || '';

        // Cache initialisieren
        this.kontoBuchungenCache.kontoNr = kontoNr;
        this.kontoBuchungenCache.kontoName = kontoName;
        this.kontoBuchungenCache.sortField = 'datum';
        this.kontoBuchungenCache.sortDir = 'desc';

        // Modal öffnen
        modal.style.display = 'flex';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Lade Buchungen...</td></tr>';

        // Suchfeld leeren
        document.getElementById('konto-buchungen-search').value = '';

        try {
            // Alle Buchungen für dieses Konto laden (mit Pagination)
            let allBuchungen = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await SupabaseService.client
                    .from('datev_bookings')
                    .select('*')
                    .eq('konto_nr', kontoNr)
                    .or('archived.is.null,archived.eq.false')
                    .order('datum', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allBuchungen = allBuchungen.concat(data);
                    hasMore = data.length === pageSize;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            console.log(`📊 ${allBuchungen.length} Buchungen für Konto ${kontoNr} geladen`);

            this.kontoBuchungenCache.buchungen = allBuchungen;

            // Jahr-Filter befüllen
            const jahre = [...new Set(allBuchungen.map(b => new Date(b.datum).getFullYear()))].sort((a, b) => b - a);
            const jahrSelect = document.getElementById('konto-buchungen-jahr');
            jahrSelect.innerHTML = '<option value="">Alle Jahre</option>' +
                jahre.map(j => `<option value="${j}">${j}</option>`).join('');

            // Initial filtern und anzeigen
            this.filterKontoBuchungen();

        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #dc3545;">
                Fehler: ${error.message}
            </td></tr>`;
        }
    },

    /**
     * Filtert und sortiert die Buchungen basierend auf den Eingaben
     */
    filterKontoBuchungen: function() {
        const searchTerm = (document.getElementById('konto-buchungen-search')?.value || '').toLowerCase();
        const jahr = document.getElementById('konto-buchungen-jahr')?.value;
        const sortValue = document.getElementById('konto-buchungen-sort')?.value || 'datum_desc';

        let buchungen = [...this.kontoBuchungenCache.buchungen];

        // Nach Jahr filtern
        if (jahr) {
            buchungen = buchungen.filter(b => new Date(b.datum).getFullYear() === parseInt(jahr));
        }

        // Nach Suchbegriff filtern
        if (searchTerm) {
            buchungen = buchungen.filter(b => {
                const searchFields = [
                    b.fornitore_name,
                    b.beschreibung,
                    b.dokument_nr,
                    b.kategorie,
                    b.partita_iva
                ].filter(Boolean).join(' ').toLowerCase();
                return searchFields.includes(searchTerm);
            });
        }

        // Sortieren
        const [field, dir] = sortValue.split('_');
        buchungen.sort((a, b) => {
            let valA, valB;
            switch (field) {
                case 'datum':
                    valA = a.datum || '';
                    valB = b.datum || '';
                    break;
                case 'betrag':
                    valA = parseFloat(a.betrag) || 0;
                    valB = parseFloat(b.betrag) || 0;
                    break;
                case 'lieferant':
                    valA = (a.fornitore_name || '').toLowerCase();
                    valB = (b.fornitore_name || '').toLowerCase();
                    break;
                default:
                    valA = a.datum || '';
                    valB = b.datum || '';
            }

            if (dir === 'asc') {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            } else {
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            }
        });

        this.kontoBuchungenCache.filtered = buchungen;
        this.renderKontoBuchungen(buchungen);
    },

    /**
     * Sortiert per Klick auf Spaltenüberschrift
     */
    sortKontoBuchungen: function(field) {
        const sortSelect = document.getElementById('konto-buchungen-sort');
        const currentValue = sortSelect.value;
        const [currentField, currentDir] = currentValue.split('_');

        // Toggle Richtung wenn gleiches Feld, sonst desc
        let newDir = 'desc';
        if (currentField === field) {
            newDir = currentDir === 'desc' ? 'asc' : 'desc';
        }

        sortSelect.value = `${field}_${newDir}`;
        this.filterKontoBuchungen();
    },

    /**
     * Rendert die gefilterten Buchungen in der Tabelle
     */
    renderKontoBuchungen: function(buchungen) {
        const tbody = document.getElementById('konto-buchungen-body');
        const countEl = document.getElementById('konto-buchungen-count');
        const totalEl = document.getElementById('konto-buchungen-total');

        if (!buchungen || buchungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Keine Buchungen gefunden</td></tr>';
            countEl.textContent = '0 Buchungen';
            totalEl.textContent = 'Summe: 0,00 EUR';
            return;
        }

        // Summe berechnen
        const total = buchungen.reduce((sum, b) => sum + (parseFloat(b.betrag) || 0), 0);

        countEl.textContent = `${buchungen.length} Buchung${buchungen.length !== 1 ? 'en' : ''}`;
        totalEl.textContent = `Summe: ${this.formatNumber(total)} EUR`;
        totalEl.style.color = total >= 0 ? '#28a745' : '#dc3545';

        // Tabelle rendern
        tbody.innerHTML = buchungen.map(b => {
            const betrag = parseFloat(b.betrag) || 0;
            const betragColor = betrag >= 0 ? '#28a745' : '#dc3545';
            const datum = b.datum ? new Date(b.datum).toLocaleDateString('de-DE') : '-';

            return `<tr style="cursor: default;">
                <td style="padding: 0.5rem 0.75rem; white-space: nowrap;">${datum}</td>
                <td style="padding: 0.5rem 0.75rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">
                    ${b.fornitore_name || '<span style="color: #999;">-</span>'}
                </td>
                <td style="padding: 0.5rem 0.75rem;">
                    <span style="font-family: monospace; background: #f1f3f4; padding: 2px 6px; border-radius: 3px;">
                        ${b.dokument_nr || '-'}
                    </span>
                </td>
                <td style="padding: 0.5rem 0.75rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis;" title="${b.beschreibung || ''}">
                    ${b.beschreibung || '<span style="color: #999;">-</span>'}
                </td>
                <td style="padding: 0.5rem 0.75rem; text-align: right; font-weight: 500; color: ${betragColor}; white-space: nowrap;">
                    ${this.formatNumber(betrag)} EUR
                </td>
            </tr>`;
        }).join('');
    },

    /**
     * Exportiert die gefilterten Buchungen als CSV
     */
    exportKontoBuchungenCsv: function() {
        const buchungen = this.kontoBuchungenCache.filtered || [];
        if (buchungen.length === 0) {
            alert('Keine Buchungen zum Exportieren');
            return;
        }

        const kontoNr = this.kontoBuchungenCache.kontoNr;
        const kontoName = this.kontoBuchungenCache.kontoName;

        let csv = '\uFEFF'; // BOM für Excel
        csv += `Buchungen für Konto ${kontoNr} - ${kontoName}\n`;
        csv += `Exportiert am: ${new Date().toLocaleString('de-DE')}\n\n`;
        csv += `Datum;Lieferant;Dokument-Nr;Beschreibung;Betrag\n`;

        buchungen.forEach(b => {
            const datum = b.datum ? new Date(b.datum).toLocaleDateString('de-DE') : '';
            csv += `"${datum}";"${b.fornitore_name || ''}";"${b.dokument_nr || ''}";"${(b.beschreibung || '').replace(/"/g, '""')}";"${b.betrag || 0}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Konto_${kontoNr}_Buchungen.csv`;
        link.click();
    },

    loadReportingProjekte: async function(jahr) {
        const tbody = document.getElementById('reporting-projekte-table');
        const tfoot = document.getElementById('reporting-projekte-footer');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Lade Projekte...</td></tr>';

        try {
            // Projekte aus Supabase laden und hideInReporting filtern
            const allProjects = await SupabaseDataAdapter.getProjects();
            const projects = allProjects.filter(p => !p.hideInReporting);
            const startDate = `${jahr}-01-01`;
            const endDate = `${jahr}-12-31`;

            let totalBudget = 0, totalIst = 0, totalPersonal = 0;
            tbody.innerHTML = '';

            if (!projects || projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">Keine Projekte gefunden</td></tr>';
                return;
            }

            for (const project of projects) {
                // Kosten für dieses Projekt im Jahr berechnen
                const costs = await SupabaseDataAdapter.getProjectCosts(project.id, startDate, endDate);
                const ist = costs.reduce((sum, c) => sum + Math.abs(parseFloat(c.betrag_brutto || c.betrag_gesamt || 0)), 0);
                const budget = parseFloat(project.budget) || 0;
                const verfuegbar = budget - ist;
                const auslastung = budget > 0 ? (ist / budget * 100) : 0;

                totalBudget += budget;
                totalIst += ist;

                const projectId = project.id;
                const detailRowId = `project-detail-${projectId}`;

                // Hauptzeile mit Plus-Icon
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.onclick = () => this.toggleProjectDetail(projectId, costs, project);
                row.innerHTML = `
                    <td style="text-align: center; width: 30px;">
                        <span id="project-expand-${projectId}" style="font-weight: bold; color: #666;">+</span>
                    </td>
                    <td><strong>${project.name}</strong></td>
                    <td>${project.datev_kostenstelle || '-'}</td>
                    <td style="text-align: right;">${this.formatCurrency(budget)}</td>
                    <td style="text-align: right;">${this.formatCurrency(ist)}</td>
                    <td style="text-align: right;">-</td>
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

                // Detail-Zeile (versteckt)
                const detailRow = document.createElement('tr');
                detailRow.id = detailRowId;
                detailRow.style.display = 'none';
                detailRow.innerHTML = `<td colspan="8" style="padding: 0; background: #f9f9f9;"></td>`;
                tbody.appendChild(detailRow);

                // Kosten nach Konto cachen für später
                row.dataset.costs = JSON.stringify(costs);
            }

            // Footer mit Summen
            if (tfoot) {
                tfoot.innerHTML = `
                    <tr style="font-weight: bold; background: #f5f5f5;">
                        <td></td>
                        <td colspan="2">SUMME</td>
                        <td style="text-align: right;">${this.formatCurrency(totalBudget)}</td>
                        <td style="text-align: right;">${this.formatCurrency(totalIst)}</td>
                        <td style="text-align: right;">${this.formatCurrency(totalPersonal)}</td>
                        <td style="text-align: right;">${this.formatCurrency(totalBudget - totalIst)}</td>
                        <td></td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Projektübersicht:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #e74c3c;">Fehler: ${error.message}</td></tr>`;
        }
    },

    // Cache für Projekt-Detail-Daten
    projektDetailCache: {},
    projektDetailSort: { column: 'summe', direction: 'desc' },

    // Toggle Projekt-Details in Projektübersicht
    toggleProjectDetail: function(projectId, costs, project) {
        const detailRow = document.getElementById(`project-detail-${projectId}`);
        const expandIcon = document.getElementById(`project-expand-${projectId}`);
        if (!detailRow) return;

        if (detailRow.style.display === 'none') {
            // Öffnen
            expandIcon.textContent = '−';
            detailRow.style.display = '';

            // Kosten nach Konto gruppieren
            const byKonto = {};
            if (costs.length > 0) {
                console.log('Beispiel-Buchung Felder:', Object.keys(costs[0]), costs[0]);
            }
            costs.forEach(c => {
                // Konto-Nummer: konto_nr ist das Hauptfeld aus DATEV
                const konto = c.konto_nr || 'Ohne Konto';

                // Bezeichnung: konto_name wird in getProjectCosts aus Kontenplan ergänzt
                const kontoName = c.konto_name || c.kategorie || c.beschreibung || '-';

                const key = konto;
                if (!byKonto[key]) {
                    byKonto[key] = { konto, name: kontoName, summe: 0, count: 0 };
                }
                byKonto[key].summe += Math.abs(parseFloat(c.betrag_brutto || c.betrag_gesamt || c.betrag || 0));
                byKonto[key].count++;
            });

            // Cache speichern
            this.projektDetailCache[projectId] = {
                project: project,
                data: Object.values(byKonto),
                gesamt: costs.reduce((sum, c) => sum + Math.abs(parseFloat(c.betrag_brutto || c.betrag_gesamt || c.betrag || 0)), 0)
            };

            // Rendern
            this.renderProjektDetail(projectId);
        } else {
            // Schließen
            expandIcon.textContent = '+';
            detailRow.style.display = 'none';
        }
    },

    renderProjektDetail: function(projectId) {
        const detailRow = document.getElementById(`project-detail-${projectId}`);
        const cache = this.projektDetailCache[projectId];
        if (!detailRow || !cache) return;

        const searchInputId = `projekt-detail-search-${projectId}`;
        const searchTerm = (document.getElementById(searchInputId)?.value || '').toLowerCase();

        // Filtern
        let filtered = cache.data;
        if (searchTerm) {
            filtered = filtered.filter(k =>
                k.konto.toLowerCase().includes(searchTerm) ||
                k.name.toLowerCase().includes(searchTerm)
            );
        }

        // Sortieren
        const { column, direction } = this.projektDetailSort;
        const sorted = [...filtered].sort((a, b) => {
            let valA, valB;
            switch (column) {
                case 'konto':
                    valA = a.konto.toLowerCase();
                    valB = b.konto.toLowerCase();
                    break;
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'count':
                    valA = a.count;
                    valB = b.count;
                    break;
                case 'summe':
                default:
                    valA = a.summe;
                    valB = b.summe;
                    break;
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Sort-Indikatoren
        const sortIndicator = (col) => {
            if (this.projektDetailSort.column === col) {
                return this.projektDetailSort.direction === 'asc' ? ' ▲' : ' ▼';
            }
            return '';
        };

        // Detail-Tabelle erstellen
        let detailHtml = `
            <div style="padding: 1rem; margin: 0.5rem 1rem; background: white; border-radius: 4px; border: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: #333;">Kosten nach Konto für "${cache.project.name}"</strong>
                    <input type="text" id="${searchInputId}" placeholder="Suche..."
                           value="${searchTerm}"
                           style="padding: 0.25rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; width: 200px;"
                           oninput="App.filterProjektDetail('${projectId}')">
                </div>
                <table style="width: 100%; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #eee;">
                            <th style="padding: 6px 8px; text-align: left; cursor: pointer;" onclick="App.sortProjektDetail('${projectId}', 'konto')">Konto${sortIndicator('konto')}</th>
                            <th style="padding: 6px 8px; text-align: left; cursor: pointer;" onclick="App.sortProjektDetail('${projectId}', 'name')">Bezeichnung${sortIndicator('name')}</th>
                            <th style="padding: 6px 8px; text-align: right; cursor: pointer;" onclick="App.sortProjektDetail('${projectId}', 'count')">Anz.${sortIndicator('count')}</th>
                            <th style="padding: 6px 8px; text-align: right; cursor: pointer;" onclick="App.sortProjektDetail('${projectId}', 'summe')">Summe${sortIndicator('summe')}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sorted.forEach(k => {
            detailHtml += `
                <tr>
                    <td style="padding: 4px 8px; font-family: monospace;">${k.konto}</td>
                    <td style="padding: 4px 8px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${k.name}</td>
                    <td style="padding: 4px 8px; text-align: right;">${k.count}</td>
                    <td style="padding: 4px 8px; text-align: right;">${this.formatCurrency(k.summe)}</td>
                </tr>
            `;
        });

        if (sorted.length === 0) {
            detailHtml += '<tr><td colspan="4" style="padding: 8px; color: #666; text-align: center;">Keine Buchungen gefunden</td></tr>';
        }

        // Summenzeile
        const filteredSum = filtered.reduce((sum, k) => sum + k.summe, 0);
        detailHtml += `
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background: #f5f5f5;">
                            <td colspan="2" style="padding: 6px 8px;">GESAMT${searchTerm ? ' (gefiltert)' : ''}</td>
                            <td style="padding: 6px 8px; text-align: right;">${filtered.reduce((sum, k) => sum + k.count, 0)}</td>
                            <td style="padding: 6px 8px; text-align: right;">${this.formatCurrency(filteredSum)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        detailRow.querySelector('td').innerHTML = detailHtml;
    },

    sortProjektDetail: function(projectId, column) {
        if (this.projektDetailSort.column === column) {
            this.projektDetailSort.direction = this.projektDetailSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.projektDetailSort.column = column;
            this.projektDetailSort.direction = (column === 'summe' || column === 'count') ? 'desc' : 'asc';
        }
        this.renderProjektDetail(projectId);
    },

    filterProjektDetail: function(projectId) {
        this.renderProjektDetail(projectId);
    },

    // Cache für Detail-Buchungen
    dbDetailCache: {},

    // Wrapper für Zeitraum-Filter
    loadDeckungsbeitragMitFilter: function() {
        const jahr = document.getElementById('reporting-jahr')?.value || new Date().getFullYear();
        this.loadDeckungsbeitrag(jahr);
    },

    loadDeckungsbeitrag: async function(jahr) {
        const tbody = document.getElementById('db-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Berechne Deckungsbeitragsrechnung...</td></tr>';

        try {
            // Zeitraum-Filter auslesen
            const zeitraumSelect = document.getElementById('db-zeitraum');
            const zeitraum = zeitraumSelect?.value || 'ytd';
            const zeitraumInfo = document.getElementById('db-zeitraum-info');

            // Datum-Bereich berechnen
            let startDate, endDate, monate;
            const heute = new Date();
            const aktuellerMonat = heute.getMonth() + 1; // 1-12
            const vorMonat = aktuellerMonat - 1 || 12; // Vormonat (Dezember wenn Januar)
            const monatNamen = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

            if (zeitraum === 'ytd') {
                // Year-to-Date: 1. Januar bis Ende Vormonat
                startDate = `${jahr}-01-01`;
                if (vorMonat === 12) {
                    // Wenn aktueller Monat Januar ist, nehmen wir Dezember des Vorjahres
                    endDate = `${jahr - 1}-12-31`;
                    monate = 12;
                } else {
                    const letzterTagVormonat = new Date(jahr, vorMonat, 0).getDate();
                    endDate = `${jahr}-${String(vorMonat).padStart(2, '0')}-${letzterTagVormonat}`;
                    monate = vorMonat;
                }
                if (zeitraumInfo) zeitraumInfo.textContent = `(01.01. - ${monatNamen[vorMonat]} ${jahr}, ${monate} Monate)`;
            } else if (zeitraum === 'year') {
                // Ganzes Jahr
                startDate = `${jahr}-01-01`;
                endDate = `${jahr}-12-31`;
                monate = 12;
                if (zeitraumInfo) zeitraumInfo.textContent = '(Ganzes Jahr, 12 Monate)';
            } else {
                // Einzelner Monat
                const monat = parseInt(zeitraum);
                startDate = `${jahr}-${String(monat).padStart(2, '0')}-01`;
                const letzterTag = new Date(jahr, monat, 0).getDate();
                endDate = `${jahr}-${String(monat).padStart(2, '0')}-${letzterTag}`;
                monate = 1;
                const monatName = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][monat];
                if (zeitraumInfo) zeitraumInfo.textContent = `(${monatName} ${jahr})`;
            }

            const vorjahr = parseInt(jahr) - 1;
            // Vorjahr: gleicher Zeitraum
            const vorjahrStart = startDate.replace(jahr, vorjahr);
            const vorjahrEnd = endDate.replace(jahr, vorjahr);

            // Buchungen nach Konten gruppiert laden (für Details) - aktuelles Jahr
            const { grouped, details } = await SupabaseDataAdapter.getBookingsGroupedByAccount(startDate, endDate);
            this.dbDetailCache = details;

            // Vorjahr-Buchungen laden (auch Details für Vorjahr-Vergleich)
            const { grouped: groupedVorjahr, details: detailsVorjahr } = await SupabaseDataAdapter.getBookingsGroupedByAccount(vorjahrStart, vorjahrEnd);

            // Vorjahr-Cache für Detail-Ansicht erstellen (Konto -> Summe)
            this.dbVorjahrCache = {};
            for (const [pattern, buchungen] of Object.entries(detailsVorjahr || {})) {
                for (const b of buchungen) {
                    const konto = b.konto_nr || '';
                    if (!this.dbVorjahrCache[konto]) this.dbVorjahrCache[konto] = 0;
                    this.dbVorjahrCache[konto] += Math.abs(parseFloat(b.betrag) || 0);
                }
            }

            // Budget-Einträge für das Jahr laden
            const { data: budgetEntries } = await SupabaseService.client
                .from('budget_entries')
                .select('konto_nr, jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, dez')
                .eq('fiscal_year', parseInt(jahr))
                .eq('entry_type', 'budget');

            // Budget-Map erstellen (volle Kontonummer -> anteilige Summe je nach Zeitraum)
            const budgetByKonto = new Map();
            const monatsNamen = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

            (budgetEntries || []).forEach(entry => {
                let anteiligeSumme = 0;

                if (zeitraum === 'ytd') {
                    // YTD: Summe der Monate Januar bis Vormonat
                    for (let i = 0; i < monate; i++) {
                        anteiligeSumme += entry[monatsNamen[i]] || 0;
                    }
                } else if (zeitraum === 'year') {
                    // Ganzes Jahr: alle 12 Monate
                    for (let i = 0; i < 12; i++) {
                        anteiligeSumme += entry[monatsNamen[i]] || 0;
                    }
                } else {
                    // Einzelner Monat: nur dieser Monat
                    const monatIndex = parseInt(zeitraum) - 1;
                    anteiligeSumme = entry[monatsNamen[monatIndex]] || 0;
                }

                budgetByKonto.set(entry.konto_nr, anteiligeSumme);
            });

            console.log('📊 Budget geladen:', budgetByKonto.size, 'Einträge, Zeitraum:', zeitraum, ', Monate:', monate);

            // Budget-Cache für Detail-Ansicht speichern (Konto -> anteilige Summe)
            this.dbBudgetCache = Object.fromEntries(budgetByKonto);
            // Auch die Zeitraum-Info für Detail-Ansicht speichern
            this.dbZeitraumMonate = monate;

            // Hilfsfunktion: Budget für ein Konto-Pattern summieren
            // Pattern kann "680%" sein -> alle Konten die mit "680" beginnen
            const getBudgetForPattern = (pattern) => {
                if (!pattern) return 0;
                // Pattern ohne % am Ende
                const prefix = pattern.replace(/%$/, '');
                let sum = 0;
                for (const [konto, betrag] of budgetByKonto.entries()) {
                    if (konto.startsWith(prefix)) {
                        sum += betrag;
                    }
                }
                return sum;
            };

            // Budget-Summe für eine Zuordnung berechnen
            const getBudgetSumForZuordnung = (zuordnung) => {
                let sum = 0;
                for (const [pattern, data] of Object.entries(grouped)) {
                    if (data.db_zuordnung === zuordnung) {
                        sum += getBudgetForPattern(pattern);
                    }
                }
                return sum;
            };

            // Umsatz-Budget aus budget_entries basierend auf db_zuordnung
            let einnahmenPlan = getBudgetSumForZuordnung('UMSATZ');
            // Falls kein Budget: Fallback auf funding_sources
            if (einnahmenPlan === 0) {
                const fundingSources = await SupabaseDataAdapter.getFundingSources(parseInt(jahr));
                const fundingTotal = fundingSources.reduce((sum, fs) => sum + (fs.amount || 0), 0);
                // Funding sources anteilig berechnen
                einnahmenPlan = fundingTotal * monate / 12;
            }

            // Echte Beträge aus gruppierten Buchungen berechnen
            const getSum = (patterns, zuordnung, data = grouped) => {
                let sum = 0;
                for (const [pattern, d] of Object.entries(data)) {
                    if (d.db_zuordnung === zuordnung) {
                        sum += d.betrag;
                    }
                }
                return sum;
            };

            const umsatzGesamt = getSum(null, 'UMSATZ');
            const db1KostenGesamt = getSum(null, 'DB1_KOSTEN');
            const db2KostenGesamt = getSum(null, 'DB2_KOSTEN');
            const db3KostenGesamt = getSum(null, 'DB3_KOSTEN');

            const umsatzVorjahr = getSum(null, 'UMSATZ', groupedVorjahr);
            const db1KostenVorjahr = getSum(null, 'DB1_KOSTEN', groupedVorjahr);
            const db2KostenVorjahr = getSum(null, 'DB2_KOSTEN', groupedVorjahr);
            const db3KostenVorjahr = getSum(null, 'DB3_KOSTEN', groupedVorjahr);

            const db1BudgetGesamt = getBudgetSumForZuordnung('DB1_KOSTEN');
            const db2BudgetGesamt = getBudgetSumForZuordnung('DB2_KOSTEN');
            const db3BudgetGesamt = getBudgetSumForZuordnung('DB3_KOSTEN');

            const db1 = umsatzGesamt - db1KostenGesamt;
            const db2 = db1 - db2KostenGesamt;
            const db3 = db2 - db3KostenGesamt;

            const db1Vorjahr = umsatzVorjahr - db1KostenVorjahr;
            const db2Vorjahr = db1Vorjahr - db2KostenVorjahr;
            const db3Vorjahr = db2Vorjahr - db3KostenVorjahr;

            const kostenBudgetGesamt = db1BudgetGesamt + db2BudgetGesamt + db3BudgetGesamt;

            // Hilfsfunktion: Detail-Zeilen sortieren
            const sortDetails = (details) => {
                if (!this.dbTableSort.column) return details;
                const col = this.dbTableSort.column;
                const dir = this.dbTableSort.direction === 'asc' ? 1 : -1;
                return details.sort((a, b) => {
                    const valA = a[col] || 0;
                    const valB = b[col] || 0;
                    return (valA - valB) * dir;
                });
            };

            // Struktur der Deckungsbeitragsrechnung mit echten Daten
            const rows = [
                { type: 'header', label: '1. UMSÄTZE', konto: '' }
            ];

            // Umsatz-Konten dynamisch aus gruppierten Daten
            let umsatzDetails = [];
            for (const [pattern, data] of Object.entries(grouped)) {
                if (data.db_zuordnung === 'UMSATZ' && data.betrag > 0) {
                    const vorjahrBetrag = groupedVorjahr[pattern]?.betrag || 0;
                    umsatzDetails.push({
                        type: 'detail',
                        label: data.konto_name || pattern,
                        konto: pattern,
                        ist: data.betrag,
                        plan: getBudgetForPattern(pattern),
                        vorjahr: vorjahrBetrag,
                        expandable: data.count > 0,
                        pattern: pattern,
                        count: data.count
                    });
                }
            }
            sortDetails(umsatzDetails).forEach(r => rows.push(r));
            rows.push({ type: 'sum', label: 'SUMME UMSÄTZE', ist: umsatzGesamt, plan: einnahmenPlan, vorjahr: umsatzVorjahr });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'header', label: '2. DIREKTE KOSTEN (DB1)', konto: '' });

            // DB1-Kosten dynamisch
            let db1Details = [];
            for (const [pattern, data] of Object.entries(grouped)) {
                if (data.db_zuordnung === 'DB1_KOSTEN' && data.betrag > 0) {
                    const vorjahrBetrag = groupedVorjahr[pattern]?.betrag || 0;
                    db1Details.push({
                        type: 'detail',
                        label: data.konto_name || pattern,
                        konto: pattern,
                        ist: data.betrag,
                        plan: getBudgetForPattern(pattern),
                        vorjahr: vorjahrBetrag,
                        expandable: data.count > 0,
                        pattern: pattern,
                        count: data.count
                    });
                }
            }
            sortDetails(db1Details).forEach(r => rows.push(r));
            rows.push({ type: 'sum', label: 'SUMME DIREKTE KOSTEN', ist: db1KostenGesamt, plan: db1BudgetGesamt, vorjahr: db1KostenVorjahr });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'result', label: '= DECKUNGSBEITRAG 1 (DB1)', ist: db1, plan: einnahmenPlan - db1BudgetGesamt, vorjahr: db1Vorjahr, highlight: true });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'header', label: '3. STRUKTURKOSTEN (DB2)', konto: '' });

            // DB2-Kosten dynamisch
            let db2Details = [];
            for (const [pattern, data] of Object.entries(grouped)) {
                if (data.db_zuordnung === 'DB2_KOSTEN' && data.betrag > 0) {
                    const vorjahrBetrag = groupedVorjahr[pattern]?.betrag || 0;
                    db2Details.push({
                        type: 'detail',
                        label: data.konto_name || pattern,
                        konto: pattern,
                        ist: data.betrag,
                        plan: getBudgetForPattern(pattern),
                        vorjahr: vorjahrBetrag,
                        expandable: data.count > 0,
                        pattern: pattern,
                        count: data.count
                    });
                }
            }
            sortDetails(db2Details).forEach(r => rows.push(r));
            rows.push({ type: 'sum', label: 'SUMME STRUKTURKOSTEN', ist: db2KostenGesamt, plan: db2BudgetGesamt, vorjahr: db2KostenVorjahr });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'result', label: '= DECKUNGSBEITRAG 2 (DB2)', ist: db2, plan: einnahmenPlan - db1BudgetGesamt - db2BudgetGesamt, vorjahr: db2Vorjahr, highlight: true });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'header', label: '4. FIXKOSTEN (DB3)', konto: '' });

            // DB3-Kosten dynamisch
            let db3Details = [];
            for (const [pattern, data] of Object.entries(grouped)) {
                if (data.db_zuordnung === 'DB3_KOSTEN' && data.betrag > 0) {
                    const vorjahrBetrag = groupedVorjahr[pattern]?.betrag || 0;
                    db3Details.push({
                        type: 'detail',
                        label: data.konto_name || pattern,
                        konto: pattern,
                        ist: data.betrag,
                        plan: getBudgetForPattern(pattern),
                        vorjahr: vorjahrBetrag,
                        expandable: data.count > 0,
                        pattern: pattern,
                        count: data.count
                    });
                }
            }
            sortDetails(db3Details).forEach(r => rows.push(r));
            rows.push({ type: 'sum', label: 'SUMME FIXKOSTEN', ist: db3KostenGesamt, plan: db3BudgetGesamt, vorjahr: db3KostenVorjahr });

            rows.push({ type: 'spacer' });
            rows.push({ type: 'result', label: '= DECKUNGSBEITRAG 3 (DB3) / ERGEBNIS', ist: db3, plan: einnahmenPlan - kostenBudgetGesamt, vorjahr: db3Vorjahr, highlight: true, final: true });

            tbody.innerHTML = '';
            let rowIndex = 0;

            rows.forEach(r => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-row-index', rowIndex);

                if (r.type === 'spacer') {
                    tr.innerHTML = '<td colspan="8" style="height: 10px;"></td>';
                } else if (r.type === 'header') {
                    tr.innerHTML = `<td colspan="8" style="font-weight: bold; background: #f0f0f0; padding: 8px;">${r.label}</td>`;
                } else {
                    const abwEur = (r.ist || 0) - (r.plan || 0);
                    const abwPct = r.plan ? ((r.ist - r.plan) / Math.abs(r.plan) * 100) : 0;
                    const vjAbwPct = r.vorjahr ? ((r.ist - r.vorjahr) / Math.abs(r.vorjahr) * 100) : 0;

                    const style = r.highlight ? 'font-weight: bold; background: #e8f4fd;' : '';
                    const finalStyle = r.final ? 'font-weight: bold; background: #d4edda; font-size: 1.1em;' : '';

                    tr.style.cssText = finalStyle || style;

                    // Plus-Button für aufklappbare Details
                    let expandBtn = '';
                    if (r.expandable && r.count > 0) {
                        expandBtn = `<button class="btn-expand" onclick="App.toggleDbDetails('${r.pattern}', this)"
                                        style="background: #3498db; color: white; border: none; border-radius: 4px;
                                               width: 22px; height: 22px; cursor: pointer; font-weight: bold;
                                               margin-right: 8px; font-size: 14px; line-height: 1;">+</button>`;
                    }

                    // Farben für Abweichungen (bei Kosten: negativ = gut, bei Erträgen: positiv = gut)
                    const isKosten = r.type === 'detail' && !r.label.includes('UMSATZ');
                    const abwColor = abwEur < 0 ? (isKosten ? '#27ae60' : '#e74c3c') : (isKosten ? '#e74c3c' : '#27ae60');
                    const vjColor = vjAbwPct > 0 ? '#27ae60' : '#e74c3c';

                    tr.innerHTML = `
                        <td style="${r.type === 'detail' ? 'padding-left: 1rem;' : ''}">
                            ${expandBtn}${r.label}
                            ${r.count ? `<span style="color: #999; font-size: 0.85em; margin-left: 4px;">(${r.count})</span>` : ''}
                        </td>
                        <td style="color: #666; font-size: 0.85em;">${r.konto || ''}</td>
                        <td style="text-align: right;">${r.ist !== undefined ? this.formatCurrency(r.ist) : ''}</td>
                        <td style="text-align: right; color: #666;">${r.plan ? this.formatCurrency(r.plan) : '-'}</td>
                        <td style="text-align: right; color: ${abwColor};">
                            ${r.plan ? this.formatCurrency(abwEur) : '-'}
                        </td>
                        <td style="text-align: right; color: ${abwColor}; font-size: 0.9em;">
                            ${r.plan ? (abwPct >= 0 ? '+' : '') + abwPct.toFixed(1) + '%' : '-'}
                        </td>
                        <td style="text-align: right; color: #666;">${r.vorjahr ? this.formatCurrency(r.vorjahr) : '-'}</td>
                        <td style="text-align: right; color: ${vjColor}; font-size: 0.9em;">
                            ${r.vorjahr ? (vjAbwPct >= 0 ? '+' : '') + vjAbwPct.toFixed(1) + '%' : '-'}
                        </td>
                    `;

                    if (r.pattern) {
                        tr.setAttribute('data-pattern', r.pattern);
                    }
                }
                tbody.appendChild(tr);
                rowIndex++;
            });
        } catch (error) {
            console.error('Fehler beim Laden der Deckungsbeitragsrechnung:', error);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #e74c3c;">
                Fehler: ${error.message}<br>
                <small>Bitte prüfen Sie, ob die chart_of_accounts Tabelle existiert.</small>
            </td></tr>`;
        }
    },

    // Sortierung für DB-Tabelle (Haupttabelle)
    dbTableSort: { column: null, direction: 'desc' },
    dbTableRowsCache: [], // Cache für sortierbare Zeilen

    /**
     * DB-Tabelle nach Spalte sortieren (nur detail-Zeilen)
     */
    sortDbTable: function(column) {
        // Toggle direction wenn gleiche Spalte
        if (this.dbTableSort.column === column) {
            this.dbTableSort.direction = this.dbTableSort.direction === 'desc' ? 'asc' : 'desc';
        } else {
            this.dbTableSort.column = column;
            this.dbTableSort.direction = 'desc';
        }

        // Sort-Icons aktualisieren
        ['ist', 'plan', 'vorjahr'].forEach(col => {
            const icon = document.getElementById(`db-sort-${col}`);
            if (icon) {
                if (col === column) {
                    icon.textContent = this.dbTableSort.direction === 'asc' ? '▲' : '▼';
                } else {
                    icon.textContent = '';
                }
            }
        });

        // Tabelle neu laden mit Sortierung
        this.loadDeckungsbeitragMitFilter();
    },

    // Sortierung für DB-Details
    dbDetailSort: { column: 'datum', direction: 'desc' },

    /**
     * Detail-Buchungen für ein Konto-Pattern ein-/ausklappen
     */
    toggleDbDetails: function(pattern, btn) {
        const detailRowId = `db-detail-${pattern.replace('%', '')}`;
        const existingRow = document.getElementById(detailRowId);

        if (existingRow) {
            // Zuklappen
            existingRow.remove();
            btn.textContent = '+';
            btn.style.background = '#3498db';
            return;
        }

        // Aufklappen - Details anzeigen
        btn.textContent = '−';
        btn.style.background = '#e74c3c';

        const parentRow = btn.closest('tr');
        const detailRow = document.createElement('tr');
        detailRow.id = detailRowId;
        detailRow.style.background = '#f9f9f9';

        this.renderDbDetailTable(pattern, detailRow);
        parentRow.after(detailRow);
    },

    /**
     * Detail-Tabelle rendern - gruppiert nach Einzelkonto mit IST, Plan, Vorjahr
     */
    renderDbDetailTable: function(pattern, detailRow, searchTerm = '') {
        const buchungen = this.dbDetailCache[pattern] || [];
        const safePattern = pattern.replace('%', '');

        // Nach Einzelkonto gruppieren
        const kontoGruppen = {};
        for (const b of buchungen) {
            const konto = b.konto_nr || 'Unbekannt';
            if (!kontoGruppen[konto]) {
                kontoGruppen[konto] = {
                    konto: konto,
                    kategorie: b.kategorie || b.buchungstext || '',
                    ist: 0,
                    buchungen: []
                };
            }
            kontoGruppen[konto].ist += Math.abs(parseFloat(b.betrag) || 0);
            kontoGruppen[konto].buchungen.push(b);
        }

        // In Array umwandeln und sortieren
        let konten = Object.values(kontoGruppen);

        // Suche anwenden
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            konten = konten.filter(k =>
                k.konto.toLowerCase().includes(term) ||
                k.kategorie.toLowerCase().includes(term)
            );
        }

        // Nach Konto sortieren
        konten.sort((a, b) => a.konto.localeCompare(b.konto));

        // Budget & Vorjahr aus Cache holen (falls vorhanden)
        const budgetCache = this.dbBudgetCache || {};
        const vorjahrCache = this.dbVorjahrCache || {};

        // Summe berechnen
        const summeIst = konten.reduce((sum, k) => sum + k.ist, 0);

        let detailHtml = `
            <td colspan="8" style="padding: 0;">
                <div style="padding: 10px 20px; background: #f9f9f9;">
                    <!-- Suchfeld -->
                    <div style="margin-bottom: 10px; display: flex; gap: 10px; align-items: center;">
                        <input type="text"
                               id="db-detail-search-${safePattern}"
                               placeholder="Suchen in Buchungstext, Konto..."
                               value="${searchTerm}"
                               onkeyup="App.filterDbDetails('${pattern}', this.value)"
                               style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9em; max-width: 300px;">
                        <span style="color: #666; font-size: 0.85em;">${konten.length} Konten | Summe: ${this.formatCurrency(summeIst)}</span>
                    </div>

                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; font-size: 0.85em; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #e0e0e0;">
                                    <th style="padding: 8px; text-align: left; width: 30px;"></th>
                                    <th style="padding: 8px; text-align: left; width: 120px;">Konto</th>
                                    <th style="padding: 8px; text-align: left;">Bezeichnung</th>
                                    <th style="padding: 8px; text-align: right; width: 100px;">IST</th>
                                    <th style="padding: 8px; text-align: right; width: 100px;">Plan</th>
                                    <th style="padding: 8px; text-align: right; width: 80px;">Abw. €</th>
                                    <th style="padding: 8px; text-align: right; width: 100px;">Vorjahr</th>
                                    <th style="padding: 8px; text-align: right; width: 80px;">VJ %</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        if (konten.length === 0) {
            detailHtml += `<tr><td colspan="8" style="padding: 10px; color: #666;">Keine Buchungen gefunden</td></tr>`;
        } else {
            for (const k of konten) {
                const plan = budgetCache[k.konto] || 0;
                const vorjahr = vorjahrCache[k.konto] || 0;
                const abw = k.ist - plan;
                const vjPct = vorjahr ? ((k.ist - vorjahr) / Math.abs(vorjahr) * 100) : 0;
                const abwColor = abw <= 0 ? '#27ae60' : '#e74c3c';
                const vjColor = vjPct <= 0 ? '#27ae60' : '#e74c3c';
                const kontoId = k.konto.replace(/[^a-zA-Z0-9]/g, '_');

                detailHtml += `
                    <tr style="border-bottom: 1px solid #ddd; background: white;">
                        <td style="padding: 6px; text-align: center;">
                            <button onclick="App.toggleKontoBuchungenDb('${pattern}', '${k.konto}', this)"
                                    style="background: #ffc107; color: #333; border: none; border-radius: 3px;
                                           width: 20px; height: 20px; cursor: pointer; font-weight: bold; font-size: 12px;">+</button>
                        </td>
                        <td style="padding: 6px; font-family: monospace; font-size: 0.9em;">${k.konto}</td>
                        <td style="padding: 6px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                            title="${k.kategorie}">${k.kategorie}</td>
                        <td style="padding: 6px; text-align: right; font-weight: 600;">${this.formatCurrency(k.ist)}</td>
                        <td style="padding: 6px; text-align: right; color: #666;">${plan ? this.formatCurrency(plan) : '-'}</td>
                        <td style="padding: 6px; text-align: right; color: ${abwColor};">${plan ? this.formatCurrency(abw) : '-'}</td>
                        <td style="padding: 6px; text-align: right; color: #666;">${vorjahr ? this.formatCurrency(vorjahr) : '-'}</td>
                        <td style="padding: 6px; text-align: right; color: ${vjColor};">${vorjahr ? (vjPct >= 0 ? '+' : '') + vjPct.toFixed(1) + '%' : '-'}</td>
                    </tr>
                    <tr id="buchungen-${safePattern}-${kontoId}" style="display: none;">
                        <td colspan="8" style="padding: 0; background: #fff8e1;">
                            <div style="padding: 8px 20px 8px 50px; max-height: 200px; overflow-y: auto;">
                                <table style="width: 100%; font-size: 0.8em; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #fff3cd;">
                                            <th style="padding: 4px 6px; text-align: left; width: 90px;">Datum</th>
                                            <th style="padding: 4px 6px; text-align: left;">Buchungstext</th>
                                            <th style="padding: 4px 6px; text-align: right; width: 100px;">Betrag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${k.buchungen.sort((a, b) => (b.datum || '').localeCompare(a.datum || '')).map(b => `
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 4px 6px;">${b.datum ? new Date(b.datum).toLocaleDateString('de-DE') : '-'}</td>
                                                <td style="padding: 4px 6px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                                    title="${(b.buchungstext || '').replace(/"/g, '&quot;')}">${b.buchungstext || '-'}</td>
                                                <td style="padding: 4px 6px; text-align: right;">${this.formatCurrency(Math.abs(parseFloat(b.betrag) || 0))}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }

        detailHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </td>
        `;

        detailRow.innerHTML = detailHtml;
    },

    /**
     * Einzelbuchungen eines Kontos ein-/ausklappen
     */
    toggleKontoBuchungenDb: function(pattern, konto, btn) {
        const safePattern = pattern.replace('%', '');
        const kontoId = konto.replace(/[^a-zA-Z0-9]/g, '_');
        const row = document.getElementById(`buchungen-${safePattern}-${kontoId}`);

        if (row) {
            const isHidden = row.style.display === 'none';
            row.style.display = isHidden ? '' : 'none';
            btn.textContent = isHidden ? '−' : '+';
            btn.style.background = isHidden ? '#e74c3c' : '#ffc107';
            btn.style.color = isHidden ? 'white' : '#333';
        }
    },

    /**
     * DB-Details nach Spalte sortieren
     */
    sortDbDetails: function(pattern, column) {
        const safePattern = pattern.replace('%', '');
        const detailRow = document.getElementById(`db-detail-${safePattern}`);
        if (!detailRow) return;

        // Sortierrichtung umkehren wenn gleiche Spalte
        if (this.dbDetailSort.column === column) {
            this.dbDetailSort.direction = this.dbDetailSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.dbDetailSort.column = column;
            this.dbDetailSort.direction = column === 'betrag' ? 'desc' : 'asc';
        }

        const searchInput = document.getElementById(`db-detail-search-${safePattern}`);
        const searchTerm = searchInput ? searchInput.value : '';

        this.renderDbDetailTable(pattern, detailRow, searchTerm, this.dbDetailSort.column, this.dbDetailSort.direction);
    },

    /**
     * DB-Details filtern
     */
    filterDbDetails: function(pattern, searchTerm) {
        const safePattern = pattern.replace('%', '');
        const detailRow = document.getElementById(`db-detail-${safePattern}`);
        if (!detailRow) return;

        this.renderDbDetailTable(pattern, detailRow, searchTerm, this.dbDetailSort.column, this.dbDetailSort.direction);
    },

    // Cache für Kategorien-Daten
    kategorienCache: null,
    kategorienGesamt: 0,
    kategorienSort: { column: 'betrag', direction: 'desc' },

    loadKostenKategorien: async function(jahr) {
        const tbody = document.getElementById('reporting-kategorien-table');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Lade Kategorien...</td></tr>';

        try {
            const startDate = `${jahr}-01-01`;
            const endDate = `${jahr}-12-31`;

            // DATEV-Buchungen aus Supabase laden
            const buchungen = await SupabaseDataAdapter.getDatevBookings(startDate, endDate);

            // Kontenplan laden für Kategorien
            const chartOfAccounts = await SupabaseDataAdapter.getChartOfAccounts();

            // Nach Kategorie gruppieren basierend auf Kontenplan
            const kategorien = {};
            let gesamt = 0;

            for (const b of buchungen || []) {
                const kontoNr = b.konto_nr || '';
                const betrag = Math.abs(parseFloat(b.betrag_gesamt || b.betrag) || 0);

                // Kategorie aus Kontenplan finden
                let kategorie = 'Sonstige';
                let bereich = kontoNr.substring(0, 3) + '*';

                for (const coa of chartOfAccounts) {
                    const pattern = coa.konto_pattern.replace('%', '');
                    if (kontoNr.startsWith(pattern)) {
                        kategorie = coa.kategorie || coa.konto_name || 'Sonstige';
                        bereich = coa.konto_pattern;
                        break;
                    }
                }

                if (!kategorien[kategorie]) {
                    kategorien[kategorie] = { name: kategorie, bereich, betrag: 0 };
                }
                kategorien[kategorie].betrag += betrag;
                gesamt += betrag;
            }

            // Anteil berechnen
            Object.values(kategorien).forEach(k => {
                k.anteil = gesamt > 0 ? (k.betrag / gesamt * 100) : 0;
            });

            // Cache speichern
            this.kategorienCache = Object.values(kategorien);
            this.kategorienGesamt = gesamt;

            // Rendern mit Standard-Sortierung
            this.renderKategorienTable();

        } catch (error) {
            console.error('Fehler beim Laden der Kosten-Kategorien:', error);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #e74c3c;">Fehler: ${error.message}</td></tr>`;
        }
    },

    renderKategorienTable: function() {
        const tbody = document.getElementById('reporting-kategorien-table');
        if (!tbody || !this.kategorienCache) return;

        const searchTerm = (document.getElementById('kategorien-search')?.value || '').toLowerCase();

        // Filtern
        let filtered = this.kategorienCache;
        if (searchTerm) {
            filtered = filtered.filter(k =>
                k.name.toLowerCase().includes(searchTerm) ||
                k.bereich.toLowerCase().includes(searchTerm)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">Keine Kategorien gefunden</td></tr>';
            this.updateKategorienSortIndicators();
            return;
        }

        // Sortieren
        const { column, direction } = this.kategorienSort;
        const sorted = [...filtered].sort((a, b) => {
            let valA, valB;
            switch (column) {
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'bereich':
                    valA = a.bereich.toLowerCase();
                    valB = b.bereich.toLowerCase();
                    break;
                case 'betrag':
                    valA = a.betrag;
                    valB = b.betrag;
                    break;
                case 'anteil':
                    valA = a.anteil;
                    valB = b.anteil;
                    break;
                default:
                    return 0;
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        tbody.innerHTML = '';

        sorted.forEach(data => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.name}</td>
                <td style="color: #666;">${data.bereich}</td>
                <td style="text-align: right;">${this.formatCurrency(data.betrag)}</td>
                <td style="text-align: right;">${data.anteil.toFixed(1)}%</td>
            `;
            tbody.appendChild(tr);
        });

        // Summenzeile (zeigt gefilterte Summe)
        const filteredGesamt = filtered.reduce((sum, k) => sum + k.betrag, 0);
        const sumRow = document.createElement('tr');
        sumRow.style.cssText = 'font-weight: bold; background: #f5f5f5;';
        sumRow.innerHTML = `
            <td colspan="2">GESAMT${searchTerm ? ' (gefiltert)' : ''}</td>
            <td style="text-align: right;">${this.formatCurrency(filteredGesamt)}</td>
            <td style="text-align: right;">${this.kategorienGesamt > 0 ? ((filteredGesamt / this.kategorienGesamt) * 100).toFixed(1) : 0}%</td>
        `;
        tbody.appendChild(sumRow);

        this.updateKategorienSortIndicators();
    },

    sortKategorien: function(column) {
        if (this.kategorienSort.column === column) {
            // Toggle Richtung
            this.kategorienSort.direction = this.kategorienSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Neue Spalte, Standard: absteigend für Zahlen, aufsteigend für Text
            this.kategorienSort.column = column;
            this.kategorienSort.direction = (column === 'betrag' || column === 'anteil') ? 'desc' : 'asc';
        }
        this.renderKategorienTable();
    },

    filterKategorien: function() {
        this.renderKategorienTable();
    },

    updateKategorienSortIndicators: function() {
        const columns = ['name', 'bereich', 'betrag', 'anteil'];
        columns.forEach(col => {
            const span = document.getElementById(`sort-kat-${col}`);
            if (span) {
                if (this.kategorienSort.column === col) {
                    span.textContent = this.kategorienSort.direction === 'asc' ? '▲' : '▼';
                } else {
                    span.textContent = '';
                }
            }
        });
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

            // Audit-Info für Geändert-Spalte
            const auditInfo = formatAuditInfo(e.created_by, e.created_at, e.updated_by, e.updated_at);
            const updatedByName = resolveUserName(e.updated_by || e.created_by);
            const updatedAtFormatted = e.updated_at ? this.formatDateTime(e.updated_at) : (e.created_at ? this.formatDateTime(e.created_at) : '-');

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
                <td style="text-align: right;">
                    ${e.rechnungenCount > 0 ?
                        `<a href="#" onclick="App.showEinnahmeRechnungen('${e.id}'); return false;" style="color: #1976d2; text-decoration: none;">
                            ${this.formatCurrency(e.ausgaben)}
                            <br><small style="color: #666;">${e.rechnungenCount} Rechnungen</small>
                        </a>` :
                        '<span style="color: #ccc;">-</span>'
                    }
                </td>
                <td style="text-align: right; ${verfuegbarStyle}">${this.formatCurrency(e.verfuegbar || e.amount)}</td>
                <td>
                    <span style="background: ${statusColors[e.status] || '#95a5a6'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                        ${statusLabels[e.status] || e.status}
                    </span>
                </td>
                <td style="text-align: center;">
                    ${e.isAbgabestelle ?
                        '<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Aktiv</span>' :
                        '<span style="color: #ccc;">-</span>'}
                </td>
                <td style="text-align: center;">
                    ${e.documentPath ?
                        `<button class="btn btn-outline btn-sm" onclick="App.showFundingDocument('${e.id}')" title="Dokument anzeigen">${Icons.document}</button>` :
                        '<span style="color: #ccc;">-</span>'}
                </td>
                <td title="${auditInfo}" style="font-size: 12px;">
                    <div>${updatedAtFormatted}</div>
                    ${updatedByName ? `<small style="color: #666;">${updatedByName}</small>` : ''}
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

        // Jahr-Dropdown aktualisieren und aktuelles Jahr setzen
        const jahrSelect = document.getElementById('einnahme-jahr');
        if (jahrSelect) {
            const currentYear = new Date().getFullYear();
            // Prüfen ob aktuelles Jahr als Option existiert, sonst hinzufügen
            let hasCurrentYear = false;
            for (let opt of jahrSelect.options) {
                if (parseInt(opt.value) === currentYear) {
                    hasCurrentYear = true;
                    break;
                }
            }
            if (!hasCurrentYear) {
                const newOpt = document.createElement('option');
                newOpt.value = currentYear.toString();
                newOpt.textContent = currentYear.toString();
                jahrSelect.insertBefore(newOpt, jahrSelect.firstChild);
            }
            jahrSelect.value = currentYear.toString();
        }

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

        // Jahr aus dem Dropdown holen - mit Fallback
        const jahrEl = document.getElementById('einnahme-jahr');
        let year = new Date().getFullYear();
        if (jahrEl && jahrEl.value) {
            const parsed = parseInt(jahrEl.value);
            if (!isNaN(parsed)) {
                year = parsed;
            }
        }
        console.log('Einnahme speichern - Jahr:', year, 'aus Dropdown:', jahrEl?.value);

        const fundingSource = {
            code: document.getElementById('einnahme-code')?.value || '',
            name: document.getElementById('einnahme-name')?.value || '',
            source: document.getElementById('einnahme-quelle')?.value || '',
            year: year,
            amount: parseFloat(document.getElementById('einnahme-betrag')?.value) || 0,
            status: document.getElementById('einnahme-status')?.value || 'offen',
            isAbgabestelle: document.getElementById('einnahme-abgabestelle')?.checked || false,
            notes: document.getElementById('einnahme-notizen')?.value || ''
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

    // Zeigt die Rechnungen an, die dieser Einnahme zugeordnet sind
    showEinnahmeRechnungen: async function(fundingSourceId) {
        try {
            const expenses = await DataManager.getFundingSourceExpenses(fundingSourceId);
            const fs = await DataManager.getFundingSourceById(fundingSourceId);

            if (!expenses.invoices || expenses.invoices.length === 0) {
                alert('Keine Rechnungen zugeordnet');
                return;
            }

            // Erstelle eine einfache Liste der Rechnungen
            let html = `
                <div style="padding: 1rem;">
                    <h3 style="margin-bottom: 1rem;">Rechnungen für: ${fs?.name || 'Einnahme'}</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Datum</th>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Lieferant</th>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd;">Rechnungsnr.</th>
                                <th style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #ddd;">Betrag</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            expenses.invoices.forEach(inv => {
                html += `
                    <tr>
                        <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${this.formatDate(inv.datum)}</td>
                        <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${inv.lieferant_name || '-'}</td>
                        <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${inv.dokument_nr || '-'}</td>
                        <td style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #eee;">${this.formatCurrency(inv.betrag_gesamt)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background: #f5f5f5;">
                                <td colspan="3" style="padding: 0.5rem;">Summe (${expenses.count} Rechnungen)</td>
                                <td style="padding: 0.5rem; text-align: right;">${this.formatCurrency(expenses.totalBrutto)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div style="margin-top: 1rem; text-align: right;">
                        <button class="btn btn-outline" onclick="App.hideModal('einnahme-rechnungen-modal')">Schließen</button>
                    </div>
                </div>
            `;

            // Zeige in einem einfachen Modal (verwende das generische Modal falls vorhanden)
            let modal = document.getElementById('einnahme-rechnungen-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'einnahme-rechnungen-modal';
                modal.className = 'modal-overlay';
                modal.innerHTML = `<div class="modal" style="max-width: 700px;"><div id="einnahme-rechnungen-content"></div></div>`;
                document.body.appendChild(modal);
            }

            document.getElementById('einnahme-rechnungen-content').innerHTML = html;
            this.showModal('einnahme-rechnungen-modal');

        } catch (error) {
            console.error('Fehler beim Laden der Rechnungen:', error);
            alert('Fehler: ' + error.message);
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

            // Filter-Dropdowns befüllen
            this.populateMemberFilters();
            this.filterMembers();
        } catch (error) {
            console.error('Fehler beim Laden der Mitglieder:', error);
            this.showToast('error', 'Fehler', 'Mitglieder konnten nicht geladen werden');
        }
    },

    filterMembers: function() {
        const paidFilter = document.getElementById('members-filter-paid')?.value || '';
        const cityFilter = document.getElementById('members-filter-city')?.value || '';
        const paymentMethodFilter = document.getElementById('members-filter-payment-method')?.value || '';
        const searchFilter = (document.getElementById('members-filter-search')?.value || '').toLowerCase();

        this.filteredMembers = this.membersData.filter(m => {
            // Zahlungsstatus-Filter
            if (paidFilter === 'paid' && !m.isPaid) return false;
            if (paidFilter === 'unpaid' && m.isPaid) return false;

            // Ort-Filter
            if (cityFilter && m.city !== cityFilter) return false;

            // Zahlungsart-Filter
            if (paymentMethodFilter && m.payment_method !== paymentMethodFilter) return false;

            // Suche (inkl. Notizen)
            if (searchFilter) {
                const searchStr = `${m.last_name} ${m.first_name} ${m.email || ''} ${m.city || ''} ${m.notes || ''}`.toLowerCase();
                if (!searchStr.includes(searchFilter)) return false;
            }

            return true;
        });

        this.renderMembersTable();
    },

    populateMemberFilters: function() {
        // Orte sammeln
        const cities = [...new Set(this.membersData.map(m => m.city).filter(Boolean))].sort();
        const citySelect = document.getElementById('members-filter-city');
        if (citySelect) {
            const currentValue = citySelect.value;
            citySelect.innerHTML = '<option value="">Alle Orte</option>';
            cities.forEach(city => {
                citySelect.innerHTML += `<option value="${city}">${city}</option>`;
            });
            citySelect.value = currentValue;
        }

        // Zahlungsarten sammeln
        const methods = [...new Set(this.membersData.map(m => m.payment_method).filter(Boolean))].sort();
        const methodSelect = document.getElementById('members-filter-payment-method');
        if (methodSelect) {
            const currentValue = methodSelect.value;
            methodSelect.innerHTML = '<option value="">Alle</option>';
            methods.forEach(method => {
                methodSelect.innerHTML += `<option value="${method}">${method}</option>`;
            });
            methodSelect.value = currentValue;
        }
    },

    renderMembersTable: function() {
        const tbody = document.getElementById('members-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: #666; padding: 2rem;">Keine Mitglieder gefunden</td></tr>';
            return;
        }

        this.filteredMembers.forEach((m, index) => {
            const tr = document.createElement('tr');
            // Audit-Info für Geändert-Spalte
            const auditInfo = formatAuditInfo(m.created_by, m.created_at, m.updated_by, m.updated_at);
            const updatedByName = resolveUserName(m.updated_by || m.created_by);
            const updatedAtFormatted = m.updated_at ? this.formatDateTime(m.updated_at) : (m.created_at ? this.formatDateTime(m.created_at) : '-');

            const paidBadge = m.isPaid
                ? '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Bezahlt</span>'
                : '<span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Offen</span>';

            const paymentDate = m.payment?.payment_date ? this.formatDate(m.payment.payment_date) : '-';
            const datevBuchung = m.payment?.datev_buchungstext
                ? `<span title="${m.payment.datev_buchungstext}" style="max-width: 150px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.payment.datev_buchungstext}</span>`
                : '-';

            const notesDisplay = m.notes
                ? `<span class="member-note" onclick="App.editMemberNote('${m.id}')" title="Klicken zum Bearbeiten" style="cursor: pointer; max-width: 150px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.notes}</span>`
                : `<span class="member-note-empty" onclick="App.editMemberNote('${m.id}')" title="Notiz hinzufügen" style="cursor: pointer; color: #999; font-style: italic;">+ Notiz</span>`;

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
                <td>${notesDisplay}</td>
                <td title="${auditInfo}" style="font-size: 12px;">
                    <div>${updatedAtFormatted}</div>
                    ${updatedByName ? `<small style="color: #666;">${updatedByName}</small>` : ''}
                </td>
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
        document.getElementById('member-birth-date').value = '';
        document.getElementById('birth-date-auto-hint').style.display = 'none';
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
            // Geburtsdatum setzen (aus birth_date oder aus Steuernummer berechnen)
            if (member.birth_date) {
                document.getElementById('member-birth-date').value = member.birth_date;
                document.getElementById('birth-date-auto-hint').style.display = 'none';
            } else if (member.tax_number) {
                this.extractBirthDateFromCodiceFiscale(member.tax_number);
            } else {
                document.getElementById('member-birth-date').value = '';
                document.getElementById('birth-date-auto-hint').style.display = 'none';
            }
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
            birth_date: document.getElementById('member-birth-date').value || null,
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

    // ==========================================
    // CODICE FISCALE PARSER
    // ==========================================

    /**
     * Extrahiert das Geburtsdatum aus einer italienischen Steuernummer (Codice Fiscale)
     * Format: AAABBB00C00D000E
     * Position 7-8: Jahr (00-99)
     * Position 9: Monat (A=Jan, B=Feb, C=Mar, D=Apr, E=Mai, H=Jun, L=Jul, M=Aug, P=Sep, R=Okt, S=Nov, T=Dez)
     * Position 10-11: Tag (01-31 für Männer, 41-71 für Frauen)
     */
    extractBirthDateFromCodiceFiscale: function(codiceFiscale) {
        const hint = document.getElementById('birth-date-auto-hint');
        const birthDateInput = document.getElementById('member-birth-date');

        if (!codiceFiscale || codiceFiscale.length < 11) {
            if (hint) hint.style.display = 'none';
            return null;
        }

        // Nur Buchstaben und Zahlen, uppercase
        const cf = codiceFiscale.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (cf.length < 11) {
            if (hint) hint.style.display = 'none';
            return null;
        }

        try {
            // Jahr extrahieren (Position 7-8, 0-indexed: 6-7)
            const yearPart = parseInt(cf.substring(6, 8));

            // Monat extrahieren (Position 9, 0-indexed: 8)
            const monthLetter = cf.charAt(8);
            const monthMap = {
                'A': 1,  // Januar
                'B': 2,  // Februar
                'C': 3,  // März
                'D': 4,  // April
                'E': 5,  // Mai
                'H': 6,  // Juni
                'L': 7,  // Juli
                'M': 8,  // August
                'P': 9,  // September
                'R': 10, // Oktober
                'S': 11, // November
                'T': 12  // Dezember
            };
            const month = monthMap[monthLetter];

            if (!month) {
                if (hint) hint.style.display = 'none';
                return null;
            }

            // Tag extrahieren (Position 10-11, 0-indexed: 9-10)
            let dayRaw = parseInt(cf.substring(9, 11));
            let day = dayRaw;
            let gender = 'm'; // Mann

            // Bei Frauen ist der Tag +40
            if (dayRaw > 40) {
                day = dayRaw - 40;
                gender = 'f'; // Frau
            }

            // Jahr bestimmen (Jahrhundert erraten)
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            let year = currentCentury + yearPart;

            // Wenn das berechnete Jahr in der Zukunft liegt, 100 Jahre abziehen
            if (year > currentYear) {
                year -= 100;
            }

            // Validierung
            if (day < 1 || day > 31 || month < 1 || month > 12) {
                if (hint) hint.style.display = 'none';
                return null;
            }

            // Datum formatieren (YYYY-MM-DD für input type="date")
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Input-Felder setzen
            if (birthDateInput) {
                birthDateInput.value = dateStr;
            }

            // Geschlecht setzen
            const genderSelect = document.getElementById('member-gender');
            if (genderSelect) {
                genderSelect.value = gender;
            }

            // Hinweis anzeigen
            if (hint) {
                hint.style.display = 'inline';
            }

            return dateStr;

        } catch (e) {
            console.error('Fehler beim Parsen des Codice Fiscale:', e);
            if (hint) hint.style.display = 'none';
            return null;
        }
    },

    // Notiz direkt bearbeiten
    editMemberNote: async function(memberId) {
        const member = this.membersData.find(m => m.id === memberId);
        if (!member) return;

        const newNote = prompt(`Notiz für ${member.last_name}, ${member.first_name || ''}:`, member.notes || '');

        if (newNote !== null) {
            try {
                await DataManager.updateMember(memberId, { notes: newNote || null });
                this.showToast('success', 'Gespeichert', 'Notiz wurde aktualisiert');
                await this.loadMembers();
            } catch (error) {
                console.error('Fehler beim Speichern der Notiz:', error);
                alert('Fehler: ' + error.message);
            }
        }
    },

    // ==========================================
    // BUCHUNGSZUWEISUNG MODAL (Verbessertes Modal)
    // ==========================================

    buchungenZuweisungData: [],
    filteredBuchungenZuweisung: [],
    selectedBuchungId: null,
    selectedMitgliedIds: [],  // Array für mehrere Mitglieder (max. 2)

    showBuchungenZuweisungModal: async function() {
        this.selectedBuchungId = null;
        this.selectedMitgliedIds = [];
        document.getElementById('zuweisung-preview').style.display = 'none';
        document.getElementById('buchung-search').value = '';
        document.getElementById('mitglied-search').value = '';
        document.getElementById('buchung-filter-status').value = 'unassigned';

        // DATEV-Buchungen für Konto 6401550 laden
        try {
            this.buchungenZuweisungData = await DataManager.getDatevBuchungenForKonto('6401550');

            // Bereits zugewiesene Buchung-IDs ermitteln
            const assignedIds = new Set(this.memberPaymentsData.map(p => p.datev_buchung_id));
            this.buchungenZuweisungData = this.buchungenZuweisungData.map(b => ({
                ...b,
                isAssigned: assignedIds.has(b.rechnungId || b.id)
            }));

            this.filterBuchungenZuweisung();
            this.renderMitgliederZuweisungListe();
            this.showModal('buchungen-zuweisung-modal');

        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
            this.showToast('error', 'Fehler', 'Buchungen konnten nicht geladen werden');
        }
    },

    filterBuchungenZuweisung: function() {
        const search = (document.getElementById('buchung-search')?.value || '').toLowerCase();
        const statusFilter = document.getElementById('buchung-filter-status')?.value || 'unassigned';

        this.filteredBuchungenZuweisung = this.buchungenZuweisungData.filter(b => {
            // Status-Filter
            if (statusFilter === 'unassigned' && b.isAssigned) return false;
            if (statusFilter === 'assigned' && !b.isAssigned) return false;

            // Suche
            if (search) {
                const searchStr = `${b.buchungstext || b.beschreibung || ''} ${b.betrag || ''} ${b.buchungsdatum || b.belegdatum || ''}`.toLowerCase();
                if (!searchStr.includes(search)) return false;
            }

            return true;
        });

        this.renderBuchungenZuweisungListe();
    },

    renderBuchungenZuweisungListe: function() {
        const container = document.getElementById('buchungen-liste');
        if (!container) return;

        if (this.filteredBuchungenZuweisung.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: #666; text-align: center;">Keine Buchungen gefunden</p>';
            document.getElementById('buchungen-count').textContent = '0 Buchungen';
            return;
        }

        let html = '';
        this.filteredBuchungenZuweisung.forEach(b => {
            const isSelected = this.selectedBuchungId === (b.rechnungId || b.id);
            const assignedClass = b.isAssigned ? 'background: #f0f0f0; color: #888;' : '';
            const selectedClass = isSelected ? 'background: #e3f2fd; border-left: 3px solid #3182ce;' : '';
            const assignedBadge = b.isAssigned ? '<span style="background: #27ae60; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">zugewiesen</span>' : '';

            html += `
                <div onclick="App.selectBuchungForZuweisung('${b.rechnungId || b.id}')"
                     style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; ${assignedClass} ${selectedClass}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong style="font-size: 0.9rem;">${b.buchungstext || b.beschreibung || 'Ohne Text'}</strong>${assignedBadge}
                            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                                ${this.formatDate(b.buchungsdatum || b.belegdatum)} | ${this.formatCurrency(Math.abs(b.betrag || 0))}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        document.getElementById('buchungen-count').textContent = `${this.filteredBuchungenZuweisung.length} Buchungen`;
    },

    renderMitgliederZuweisungListe: function() {
        const container = document.getElementById('mitglieder-liste');
        if (!container) return;

        const search = (document.getElementById('mitglied-search')?.value || '').toLowerCase();
        const showPaid = document.getElementById('mitglied-show-paid')?.checked || false;

        // Mitglieder filtern - bereits bezahlte ausblenden (außer Checkbox aktiv)
        let members = this.membersData.filter(m => {
            // Bereits bezahlte ausblenden, außer showPaid ist aktiviert
            if (!showPaid && m.isPaid) return false;

            if (search) {
                const searchStr = `${m.last_name} ${m.first_name || ''} ${m.city || ''}`.toLowerCase();
                if (!searchStr.includes(search)) return false;
            }
            return true;
        });

        // Sortieren: unbezahlte zuerst, dann alphabetisch
        members.sort((a, b) => {
            if (a.isPaid === b.isPaid) return a.last_name.localeCompare(b.last_name);
            return a.isPaid ? 1 : -1;
        });

        if (members.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: #666; text-align: center;">Keine Mitglieder gefunden</p>';
            return;
        }

        let html = '';
        members.forEach(m => {
            const isSelected = this.selectedMitgliedIds.includes(m.id);
            const selectionIndex = this.selectedMitgliedIds.indexOf(m.id);
            const paidClass = m.isPaid ? 'background: #f0f0f0; color: #888;' : '';
            const selectedClass = isSelected ? 'background: #e8f5e9; border-left: 3px solid #27ae60;' : '';
            const paidBadge = m.isPaid
                ? '<span style="background: #27ae60; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">bezahlt</span>'
                : '<span style="background: #e74c3c; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">offen</span>';
            const selectionBadge = isSelected
                ? `<span style="background: #3182ce; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 4px;">${selectionIndex + 1}</span>`
                : '';

            html += `
                <div onclick="App.selectMitgliedForZuweisung('${m.id}')"
                     style="padding: 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; ${paidClass} ${selectedClass}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${m.last_name}, ${m.first_name || ''}</strong>${selectionBadge}${paidBadge}
                            <div style="font-size: 0.8rem; color: #666;">${m.city || ''} | ${this.formatCurrency(m.membership_fee || 0)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Hinweis aktualisieren
        const hint = document.getElementById('mitglieder-selection-hint');
        if (hint) {
            hint.textContent = this.selectedMitgliedIds.length === 0
                ? 'Klicken um auszuwählen (max. 2 bei gemeinsamer Zahlung)'
                : `${this.selectedMitgliedIds.length} Mitglied(er) ausgewählt`;
        }
    },

    filterMitgliederZuweisung: function() {
        this.renderMitgliederZuweisungListe();
    },

    selectBuchungForZuweisung: function(buchungId) {
        this.selectedBuchungId = buchungId;
        this.renderBuchungenZuweisungListe();
        this.updateZuweisungPreview();
    },

    selectMitgliedForZuweisung: function(mitgliedId) {
        // Toggle-Logik: Wenn bereits ausgewählt, entfernen; sonst hinzufügen (max 2)
        const index = this.selectedMitgliedIds.indexOf(mitgliedId);
        if (index > -1) {
            // Mitglied entfernen
            this.selectedMitgliedIds.splice(index, 1);
        } else {
            // Mitglied hinzufügen (max 2)
            if (this.selectedMitgliedIds.length < 2) {
                this.selectedMitgliedIds.push(mitgliedId);
            } else {
                // Wenn bereits 2, das erste durch das neue ersetzen
                this.selectedMitgliedIds.shift();
                this.selectedMitgliedIds.push(mitgliedId);
            }
        }
        this.renderMitgliederZuweisungListe();
        this.updateZuweisungPreview();
    },

    updateZuweisungPreview: function() {
        const preview = document.getElementById('zuweisung-preview');

        if (this.selectedBuchungId && this.selectedMitgliedIds.length > 0) {
            const buchung = this.buchungenZuweisungData.find(b => (b.rechnungId || b.id) === this.selectedBuchungId);
            const mitglieder = this.selectedMitgliedIds.map(id => this.membersData.find(m => m.id === id)).filter(Boolean);

            if (buchung && mitglieder.length > 0) {
                const totalBetrag = Math.abs(buchung.betrag || 0);
                const betragProMitglied = totalBetrag / mitglieder.length;

                document.getElementById('selected-buchung-text').textContent =
                    `${buchung.buchungstext || buchung.beschreibung || 'Ohne Text'} (${this.formatCurrency(totalBetrag)})`;

                const mitgliederText = mitglieder.map(m =>
                    `${m.last_name}, ${m.first_name || ''}`
                ).join(' + ');

                const betragInfo = mitglieder.length > 1
                    ? ` (je ${this.formatCurrency(betragProMitglied)})`
                    : '';

                document.getElementById('selected-mitglied-text').textContent = mitgliederText + betragInfo;
                preview.style.display = 'block';
            }
        } else {
            preview.style.display = 'none';
        }
    },

    confirmBuchungZuweisung: async function() {
        if (!this.selectedBuchungId || this.selectedMitgliedIds.length === 0) {
            alert('Bitte wählen Sie eine Buchung und mindestens ein Mitglied aus.');
            return;
        }

        const buchung = this.buchungenZuweisungData.find(b => (b.rechnungId || b.id) === this.selectedBuchungId);
        const mitglieder = this.selectedMitgliedIds.map(id => this.membersData.find(m => m.id === id)).filter(Boolean);

        if (!buchung || mitglieder.length === 0) {
            alert('Fehler: Buchung oder Mitglied nicht gefunden.');
            return;
        }

        const year = parseInt(document.getElementById('members-filter-year')?.value || new Date().getFullYear());
        const totalBetrag = Math.abs(buchung.betrag || 0);
        const betragProMitglied = totalBetrag / mitglieder.length;

        try {
            // Für jedes Mitglied eine Zahlung erstellen
            for (const mitglied of mitglieder) {
                await DataManager.addMemberPayment({
                    member_id: mitglied.id,
                    year: year,
                    amount: betragProMitglied,
                    payment_date: buchung.datum || buchung.buchungsdatum || buchung.belegdatum || null,
                    datev_buchung_id: buchung.rechnungId || buchung.id,
                    datev_buchungstext: buchung.buchungstext || buchung.beschreibung || null
                });
            }

            const namen = mitglieder.map(m => m.last_name).join(' & ');
            this.showToast('success', 'Zugewiesen', `Buchung wurde ${namen} zugewiesen`);

            // Zurücksetzen
            this.selectedBuchungId = null;
            this.selectedMitgliedIds = [];
            document.getElementById('zuweisung-preview').style.display = 'none';

            // Daten neu laden
            await this.loadMembers();

            // Buchungen-Liste aktualisieren
            const assignedIds = new Set(this.memberPaymentsData.map(p => p.datev_buchung_id));
            this.buchungenZuweisungData = this.buchungenZuweisungData.map(b => ({
                ...b,
                isAssigned: assignedIds.has(b.rechnungId || b.id)
            }));
            this.filterBuchungenZuweisung();
            this.renderMitgliederZuweisungListe();

        } catch (error) {
            console.error('Fehler bei der Zuweisung:', error);
            alert('Fehler: ' + error.message);
        }
    },

    // ========== DATEV-Verknüpfung Modal ==========

    // Daten für das Modal
    datevBewegungModalData: [],
    filteredDatevBewegungen: [],
    pdfModalData: [],
    filteredPdfs: [],
    selectedBewegungForVerknuepfung: null,
    selectedPdfForVerknuepfung: null,

    openDatevVerknuepfungModal: async function() {
        console.log('openDatevVerknuepfungModal gestartet');

        // Ladeindikator anzeigen
        this.showModal('datev-verknuepfung-modal');
        document.getElementById('datev-bewegungen-liste').innerHTML = '<p style="padding: 1rem; text-align: center;">Laden...</p>';
        document.getElementById('pdfs-liste').innerHTML = '<p style="padding: 1rem; text-align: center;">Laden...</p>';

        try {
            // PDFs (Invoices) laden - nur benötigte Spalten für Performance
            const { data: invoices, error: invoiceError } = await SupabaseService.client
                .from('invoices')
                .select('id, file_name, file_path, uploaded_at, linked_booking_id, partita_iva, invoice_number, notes')
                .order('uploaded_at', { ascending: false });

            if (invoiceError) throw invoiceError;
            console.log('Invoices geladen:', invoices?.length);

            // DATEV-Bewegungen laden - nur benötigte Spalten für Performance
            const { data: datevBookings, error: datevError } = await SupabaseService.client
                .from('datev_bookings')
                .select('id, partita_iva, dokument_nr, fornitore_name, beschreibung, betrag, datum')
                .or('archived.is.null,archived.eq.false')
                .order('datum', { ascending: false });

            if (datevError) throw datevError;
            console.log('DATEV-Bookings geladen:', datevBookings?.length);

            // Set mit allen verknüpften Booking-IDs erstellen (als Strings für korrekten Vergleich)
            const linkedBookingIds = new Set(
                invoices.filter(inv => inv.linked_booking_id).map(inv => String(inv.linked_booking_id))
            );

            // Set mit allen verknüpften partita_iva + invoice_number Kombinationen
            const linkedByDocNr = new Set(
                invoices
                    .filter(inv => inv.partita_iva && inv.invoice_number)
                    .map(inv => `${inv.partita_iva}_${inv.invoice_number}`)
            );

            // Set mit allen PDFs die eine DATEV-Bewegung haben (via partita_iva + dokument_nr)
            const datevDocKeys = new Set(
                datevBookings
                    .filter(b => b.partita_iva && b.dokument_nr)
                    .map(b => `${b.partita_iva}_${b.dokument_nr}`)
            );

            console.log('Verknüpfte Booking-IDs:', linkedBookingIds.size, 'Verknüpfte Dok-Nummern:', linkedByDocNr.size);

            // Daten vorbereiten - hasPdf basierend auf BEIDEN Methoden ermitteln
            this.datevBewegungModalData = datevBookings.map(b => {
                const docKey = `${b.partita_iva}_${b.dokument_nr}`;
                return {
                    ...b,
                    hasPdf: linkedBookingIds.has(String(b.id)) || linkedByDocNr.has(docKey)
                };
            });

            // PDFs: isLinked wenn linked_booking_id ODER passende DATEV-Bewegung existiert
            this.pdfModalData = invoices.map(inv => {
                const docKey = `${inv.partita_iva}_${inv.invoice_number}`;
                return {
                    ...inv,
                    isLinked: !!inv.linked_booking_id || datevDocKeys.has(docKey)
                };
            });

            // Reset Auswahl
            this.selectedBewegungForVerknuepfung = null;
            this.selectedPdfForVerknuepfung = null;
            document.getElementById('verknuepfung-preview').style.display = 'none';
            document.getElementById('pdf-vorschau-container').innerHTML = '<p style="color: #999; text-align: center;">Wählen Sie ein PDF aus der Liste<br>um die Vorschau zu sehen</p>';

            // Filter anwenden und rendern
            this.filterDatevBewegungen();
            this.filterPdfsForVerknuepfung();

        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showToast('error', 'Fehler', 'Daten konnten nicht geladen werden');
            this.hideModal('datev-verknuepfung-modal');
        }
    },

    filterDatevBewegungen: function() {
        const search = (document.getElementById('datev-bewegung-search')?.value || '').toLowerCase();
        const statusFilter = document.getElementById('datev-bewegung-filter-status')?.value || 'ohne-pdf';

        this.filteredDatevBewegungen = this.datevBewegungModalData.filter(b => {
            // Status-Filter
            if (statusFilter === 'ohne-pdf' && b.hasPdf) return false;
            if (statusFilter === 'mit-pdf' && !b.hasPdf) return false;

            // Suche
            if (search) {
                const searchStr = `${b.fornitore_name || ''} ${b.buchungstext || ''} ${b.dokument_nr || ''} ${b.betrag || ''}`.toLowerCase();
                if (!searchStr.includes(search)) return false;
            }

            return true;
        });

        this.renderDatevBewegungListe();
    },

    renderDatevBewegungListe: function() {
        const container = document.getElementById('datev-bewegungen-liste');
        if (!container) return;

        if (this.filteredDatevBewegungen.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: #666; text-align: center;">Keine Bewegungen gefunden</p>';
            document.getElementById('datev-bewegungen-count').textContent = '0 Bewegungen';
            return;
        }

        let html = '';
        this.filteredDatevBewegungen.forEach(b => {
            const isSelected = this.selectedBewegungForVerknuepfung && String(this.selectedBewegungForVerknuepfung.id) === String(b.id);
            const pdfClass = b.hasPdf ? 'background: #e8f5e9;' : '';
            const selectedClass = isSelected ? 'background: #e3f2fd; border-left: 3px solid #3182ce;' : '';
            const pdfBadge = b.hasPdf ? '<span style="background: #27ae60; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">PDF</span>' : '';

            html += `
                <div onclick="App.selectBewegungForVerknuepfung('${b.id}')"
                     style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; ${pdfClass} ${selectedClass}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1; min-width: 0;">
                            <strong style="font-size: 0.8rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.fornitore_name || 'Unbekannt'}</strong>
                            <div style="font-size: 0.7rem; color: #666;">
                                ${this.formatDate(b.datum)} | ${this.formatCurrency(Math.abs(b.betrag || 0))}${pdfBadge}
                            </div>
                            <div style="font-size: 0.65rem; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${b.partita_iva || ''} ${b.dokument_nr ? '| Nr: ' + b.dokument_nr : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        document.getElementById('datev-bewegungen-count').textContent = `${this.filteredDatevBewegungen.length} Bewegungen`;
    },

    filterPdfsForVerknuepfung: function() {
        const search = (document.getElementById('pdf-search')?.value || '').toLowerCase();
        const statusFilter = document.getElementById('pdf-filter-status')?.value || 'unverknuepft';
        const datumVon = document.getElementById('pdf-datum-von')?.value || '';
        const datumBis = document.getElementById('pdf-datum-bis')?.value || '';

        this.filteredPdfs = this.pdfModalData.filter(p => {
            // Status-Filter
            if (statusFilter === 'unverknuepft' && p.isLinked) return false;
            if (statusFilter === 'verknuepft' && !p.isLinked) return false;
            if (statusFilter === 'ohne-notiz' && p.notes && p.notes.trim() !== '') return false;
            if (statusFilter === 'mit-notiz' && (!p.notes || p.notes.trim() === '')) return false;

            // Datumsfilter (Hochgeladen zwischen)
            if (datumVon || datumBis) {
                const uploadDate = p.uploaded_at ? p.uploaded_at.substring(0, 10) : '';
                if (datumVon && uploadDate < datumVon) return false;
                if (datumBis && uploadDate > datumBis) return false;
            }

            // Suche (auch in Notiz)
            if (search) {
                const searchStr = `${p.file_name || ''} ${p.notes || ''}`.toLowerCase();
                if (!searchStr.includes(search)) return false;
            }

            return true;
        });

        this.renderPdfListe();
    },

    renderPdfListe: function() {
        const container = document.getElementById('pdfs-liste');
        if (!container) return;

        if (this.filteredPdfs.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: #666; text-align: center;">Keine PDFs gefunden</p>';
            document.getElementById('pdfs-count').textContent = '0 PDFs';
            return;
        }

        let html = '';
        this.filteredPdfs.forEach(p => {
            const isSelected = this.selectedPdfForVerknuepfung && String(this.selectedPdfForVerknuepfung.id) === String(p.id);
            const linkedClass = p.isLinked ? 'background: #f0f0f0; color: #888;' : '';
            const selectedClass = isSelected ? 'background: #e8f5e9; border-left: 3px solid #27ae60;' : '';
            const linkedBadge = p.isLinked
                ? '<span style="background: #27ae60; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">verknüpft</span>'
                : '';
            const notizText = (p.notes || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const notizBadge = p.notes && p.notes.trim()
                ? `<span style="background: #ff9800; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;" title="${notizText}">Notiz</span>`
                : '';

            html += `
                <div onclick="App.selectPdfForVerknuepfung('${p.id}')"
                     style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; cursor: pointer; ${linkedClass} ${selectedClass}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; min-width: 0;">
                            <strong style="font-size: 0.8rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.file_name || 'Unbekannt'}</strong>
                            <div style="font-size: 0.7rem; color: #666; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                ${this.formatDate(p.uploaded_at)}${linkedBadge}${notizBadge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        document.getElementById('pdfs-count').textContent = `${this.filteredPdfs.length} PDFs`;
    },

    selectBewegungForVerknuepfung: function(bewegungId) {
        // ID-Vergleich mit == um String/Number-Unterschiede zu ignorieren
        this.selectedBewegungForVerknuepfung = this.datevBewegungModalData.find(b => String(b.id) === String(bewegungId));
        console.log('Bewegung ausgewählt:', bewegungId, this.selectedBewegungForVerknuepfung);
        this.renderDatevBewegungListe();
        this.updateVerknuepfungPreview();
    },

    selectPdfForVerknuepfung: async function(pdfId) {
        this.selectedPdfForVerknuepfung = this.pdfModalData.find(p => String(p.id) === String(pdfId));
        console.log('PDF ausgewählt:', pdfId, this.selectedPdfForVerknuepfung);
        this.renderPdfListe();
        this.updateVerknuepfungPreview();

        // Notiz-Bereich anzeigen und befüllen
        const notizBereich = document.getElementById('pdf-notiz-bereich');
        const notizInput = document.getElementById('pdf-notiz-input');
        if (this.selectedPdfForVerknuepfung) {
            notizBereich.style.display = 'block';
            notizInput.value = this.selectedPdfForVerknuepfung.notes || '';
        } else {
            notizBereich.style.display = 'none';
            notizInput.value = '';
        }

        // PDF-Vorschau laden
        if (this.selectedPdfForVerknuepfung?.file_path) {
            try {
                const { data, error } = await SupabaseService.client.storage
                    .from('invoices')
                    .createSignedUrl(this.selectedPdfForVerknuepfung.file_path, 300);

                if (error) throw error;

                const container = document.getElementById('pdf-vorschau-container');
                container.innerHTML = `<iframe src="${data.signedUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
            } catch (error) {
                console.error('Fehler beim Laden der PDF-Vorschau:', error);
                document.getElementById('pdf-vorschau-container').innerHTML = '<p style="color: #e74c3c; text-align: center;">PDF konnte nicht geladen werden</p>';
            }
        }
    },

    // Notiz für ausgewähltes PDF speichern
    savePdfNotiz: async function() {
        if (!this.selectedPdfForVerknuepfung) {
            this.showToast('warning', 'Hinweis', 'Bitte zuerst ein PDF auswählen');
            return;
        }

        const notiz = document.getElementById('pdf-notiz-input').value.trim();
        const pdfId = this.selectedPdfForVerknuepfung.id;

        try {
            const { error } = await SupabaseService.client
                .from('invoices')
                .update({ notes: notiz || null })
                .eq('id', pdfId);

            if (error) throw error;

            // Lokalen Cache aktualisieren
            this.selectedPdfForVerknuepfung.notes = notiz;
            const pdfInList = this.pdfModalData.find(p => String(p.id) === String(pdfId));
            if (pdfInList) pdfInList.notes = notiz;

            this.renderPdfListe();
            this.showToast('success', 'Gespeichert', 'Notiz wurde gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern der Notiz:', error);
            this.showToast('error', 'Fehler', 'Notiz konnte nicht gespeichert werden');
        }
    },

    updateVerknuepfungPreview: function() {
        const preview = document.getElementById('verknuepfung-preview');

        if (this.selectedBewegungForVerknuepfung && this.selectedPdfForVerknuepfung) {
            const b = this.selectedBewegungForVerknuepfung;
            const p = this.selectedPdfForVerknuepfung;

            document.getElementById('selected-bewegung-text').textContent =
                `${b.fornitore_name || 'Unbekannt'} - ${this.formatCurrency(Math.abs(b.betrag || 0))} (${this.formatDate(b.datum)})`;
            document.getElementById('selected-pdf-text').textContent = p.file_name || 'Unbekannt';
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    },

    confirmDatevVerknuepfung: async function() {
        if (!this.selectedBewegungForVerknuepfung || !this.selectedPdfForVerknuepfung) {
            alert('Bitte wählen Sie eine Bewegung und ein PDF aus.');
            return;
        }

        const bewegung = this.selectedBewegungForVerknuepfung;
        const pdf = this.selectedPdfForVerknuepfung;

        try {
            // Invoice mit DATEV-Buchung verknüpfen (nur in invoices-Tabelle)
            const { error } = await SupabaseService.client
                .from('invoices')
                .update({ linked_booking_id: bewegung.id })
                .eq('id', pdf.id);

            if (error) throw error;

            this.showToast('success', 'Verknüpft', 'PDF wurde mit DATEV-Bewegung verknüpft');

            // Daten aktualisieren
            bewegung.hasPdf = true;
            pdf.isLinked = true;
            pdf.linked_booking_id = bewegung.id;

            // Reset Auswahl
            this.selectedBewegungForVerknuepfung = null;
            this.selectedPdfForVerknuepfung = null;
            document.getElementById('verknuepfung-preview').style.display = 'none';
            document.getElementById('pdf-vorschau-container').innerHTML = '<p style="color: #999; text-align: center;">Wählen Sie ein PDF aus der Liste<br>um die Vorschau zu sehen</p>';

            // Listen neu rendern
            this.filterDatevBewegungen();
            this.filterPdfsForVerknuepfung();

            // Cache invalidieren
            if (typeof SupabaseDataAdapter !== 'undefined' && SupabaseDataAdapter.invalidateCache) {
                SupabaseDataAdapter.invalidateCache();
            }

        } catch (error) {
            console.error('Fehler bei der Verknüpfung:', error);
            this.showToast('error', 'Fehler', 'Verknüpfung fehlgeschlagen: ' + error.message);
        }
    },

    // ========== Ende DATEV-Verknüpfung Modal ==========

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

            // Zuerst als Array lesen um Header-Zeile zu finden
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            // Finde die Header-Zeile (enthält "Nachname")
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(rawData.length, 20); i++) {
                const row = rawData[i];
                if (Array.isArray(row) && row.some(cell => String(cell).includes('Nachname'))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert('Keine Header-Zeile mit "Nachname" gefunden. Bitte prüfen Sie das Excel-Format.');
                return;
            }

            console.log(`📊 Header gefunden in Zeile ${headerRowIndex + 1}`);

            // Jetzt ab der Header-Zeile parsen
            const json = XLSX.utils.sheet_to_json(sheet, {
                defval: '',
                range: headerRowIndex
            });

            if (json.length === 0) {
                alert('Die Datei enthält keine Daten.');
                return;
            }

            // Spalten-Mapping (flexibel - unterstützt verschiedene Schreibweisen)
            const columnMap = {
                'Nachname': 'last_name',
                'Vorname': 'first_name',
                'Art der Mitgliedschaft': 'membership_type',
                'Art der M': 'membership_type',
                'Nummer': 'member_number',
                'Sprache': 'language',
                'p/d': 'language',
                'Anschrift': 'address',
                'CAP': 'postal_code',
                'PLZ': 'postal_code',
                'Ort': 'city',
                'E-Mail': 'email',
                'Email': 'email',
                'Telefon': 'phone',
                'Geburtsjahr': 'birth_date',
                'Geburtsdatum': 'birth_date',
                'StrNr': 'tax_number',
                'StrNr.': 'tax_number',
                'StNr': 'tax_number',
                'seit Mitglied': 'join_year',
                'Beitrag': 'membership_fee',
                'Spende': 'donation',
                'Datum Beitrag': 'payment_date',
                'Datum B': 'payment_date',
                'Zahlungsart': 'payment_method',
                'Hashtag': 'hashtag',
                'Info': 'notes'
            };

            // Daten transformieren
            this.memberImportData = json.map(row => {
                const mapped = {};
                Object.keys(row).forEach(key => {
                    const keyTrimmed = String(key).trim();
                    // Exaktes Match zuerst
                    if (columnMap[keyTrimmed]) {
                        mapped[columnMap[keyTrimmed]] = row[key];
                        return;
                    }
                    // Teilmatch
                    for (const [searchKey, mappedKey] of Object.entries(columnMap)) {
                        if (keyTrimmed.includes(searchKey) || searchKey.includes(keyTrimmed)) {
                            mapped[mappedKey] = row[key];
                            return;
                        }
                    }
                });
                return mapped;
            }).filter(m => m.last_name && String(m.last_name).trim()); // Nur Zeilen mit Nachname

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
        csv += 'Nachname;Vorname;Geschlecht;Anschrift;PLZ;Ort;E-Mail;Telefon;Geburtsdatum;Steuernummer;Beitrag;Spende;Beitrittsdatum;Zahlungsart;Bezahlt;Zahlungsdatum;Notizen\n';

        this.filteredMembers.forEach(m => {
            csv += `"${m.last_name}";"${m.first_name || ''}";"${m.gender || ''}";"${m.address || ''}";"${m.postal_code || ''}";"${m.city || ''}";"${m.email || ''}";"${m.phone || ''}";"${m.birth_date || ''}";"${m.tax_number || ''}";"${m.membership_fee || 0}";"${m.donation || 0}";"${m.join_date || ''}";"${m.payment_method || ''}";"${m.isPaid ? 'Ja' : 'Nein'}";"${m.payment?.payment_date || ''}";"${m.notes || ''}"\n`;
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
        console.log('🔄 changeInvoiceStatus aufgerufen:', { invoiceId, newStatus });

        // Wenn invoiceId null/undefined, Fehler zeigen
        if (!invoiceId || invoiceId === 'null' || invoiceId === 'undefined') {
            console.error('❌ Keine gültige Invoice-ID!', invoiceId);
            this.showToast('error', 'Fehler', 'Keine Invoice verknüpft - Status kann nicht geändert werden');
            return;
        }

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

        // Progress-Anzeige mit Fortschrittsbalken
        const updateProgress = (percent, message) => {
            resultDiv.innerHTML = `
                <div style="color: #666;">
                    <div style="margin-bottom: 8px;">⏳ ${message}</div>
                    <div style="background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden;">
                        <div style="background: #3498db; height: 100%; width: ${percent}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="text-align: right; font-size: 12px; margin-top: 4px;">${percent}%</div>
                </div>`;
        };

        updateProgress(0, 'Import wird gestartet...');

        try {
            // Jahr wird automatisch aus dem Datum jeder Buchung erkannt
            const result = await ExcelImportService.importDatevBookings(file, {
                onProgress: updateProgress
            });

            // Erfolg wenn Buchungen importiert wurden (auch bei teilweisen Fehlern/Duplikaten)
            if (result.success || result.imported > 0) {
                // Basis-Erfolgsmeldung
                let resultHtml = `
                    <div style="padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; color: #155724; margin-bottom: 1rem;">
                        <strong>${Icons.success} Import erfolgreich</strong><br>
                        ${result.message}
                    </div>`;

                // Wenn es übersprungene Zeilen gibt, zeige Tabelle
                if (result.skippedRows && result.skippedRows.length > 0) {
                    // Gruppiere nach Grund
                    const byReason = {};
                    result.skippedRows.forEach(row => {
                        const reason = row.reason;
                        if (!byReason[reason]) byReason[reason] = [];
                        byReason[reason].push(row);
                    });

                    resultHtml += `
                        <div style="margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <strong>📋 Übersprungene Zeilen: ${result.skippedRows.length}</strong>
                                <div>
                                    <select id="skipped-filter" onchange="App.filterSkippedRows()" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc;">
                                        <option value="">Alle Gründe</option>
                                        ${Object.keys(byReason).map(r => `<option value="${r}">${r} (${byReason[r].length})</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                                <table id="skipped-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                    <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                        <tr>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: left; cursor: pointer;" onclick="App.sortSkippedRows('rowNumber')">Zeile ↕</th>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: left; cursor: pointer;" onclick="App.sortSkippedRows('reason')">Grund ↕</th>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: left;">Konto</th>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: left;">Lieferant</th>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">Betrag</th>
                                            <th style="padding: 6px; border-bottom: 1px solid #ddd; text-align: left;">Datum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${result.skippedRows.map(row => `
                                            <tr data-reason="${row.reason}">
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.rowNumber}</td>
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee; color: ${row.reasonCode === 'DUPLICATE_DB' ? '#6c757d' : '#dc3545'};">${row.reason}</td>
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.data.konto}</td>
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.data.fornitore}">${row.data.fornitore}</td>
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee; text-align: right;">${typeof row.data.betrag === 'number' ? row.data.betrag.toLocaleString('de-DE', {minimumFractionDigits: 2}) : row.data.betrag}</td>
                                                <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.data.datum}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>`;

                    // Speichere Daten für Sortierung/Filter
                    this._skippedRows = result.skippedRows;
                    this._skippedSortColumn = null;
                    this._skippedSortAsc = true;
                }

                resultDiv.innerHTML = resultHtml;
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
     * Filter übersprungene Zeilen nach Grund
     */
    filterSkippedRows: function() {
        const filter = document.getElementById('skipped-filter')?.value || '';
        const rows = document.querySelectorAll('#skipped-table tbody tr');
        rows.forEach(row => {
            if (!filter || row.getAttribute('data-reason') === filter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    /**
     * Sortiere übersprungene Zeilen
     */
    sortSkippedRows: function(column) {
        if (!this._skippedRows) return;

        // Toggle Sortierung wenn gleiche Spalte
        if (this._skippedSortColumn === column) {
            this._skippedSortAsc = !this._skippedSortAsc;
        } else {
            this._skippedSortColumn = column;
            this._skippedSortAsc = true;
        }

        const sorted = [...this._skippedRows].sort((a, b) => {
            let valA, valB;
            if (column === 'rowNumber') {
                valA = typeof a.rowNumber === 'number' ? a.rowNumber : 9999;
                valB = typeof b.rowNumber === 'number' ? b.rowNumber : 9999;
            } else if (column === 'reason') {
                valA = a.reason;
                valB = b.reason;
            }
            if (valA < valB) return this._skippedSortAsc ? -1 : 1;
            if (valA > valB) return this._skippedSortAsc ? 1 : -1;
            return 0;
        });

        // Tabelle neu rendern
        const tbody = document.querySelector('#skipped-table tbody');
        if (tbody) {
            tbody.innerHTML = sorted.map(row => `
                <tr data-reason="${row.reason}">
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.rowNumber}</td>
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee; color: ${row.reasonCode === 'DUPLICATE_DB' ? '#6c757d' : '#dc3545'};">${row.reason}</td>
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.data.konto}</td>
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.data.fornitore}">${row.data.fornitore}</td>
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee; text-align: right;">${typeof row.data.betrag === 'number' ? row.data.betrag.toLocaleString('de-DE', {minimumFractionDigits: 2}) : row.data.betrag}</td>
                    <td style="padding: 4px 6px; border-bottom: 1px solid #eee;">${row.data.datum}</td>
                </tr>
            `).join('');
        }

        // Filter erneut anwenden
        this.filterSkippedRows();
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
            // DATEV-Buchungen für das Jahr laden über ApiClient
            const buchungen = await ApiClient.getDatevBookings({ year: year });

            // Nach konto_nr und Monat gruppieren (für DB-Zuordnung)
            this.budgetIstData = {};
            this.budgetIstDataTotal = { jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0, total: 0 };
            const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];

            (buchungen || []).forEach(b => {
                if (!b.datum) return;

                // Primär nach konto_nr gruppieren (für DB-Zuordnung)
                const kontoNr = b.konto_nr || b.konto || '';
                const kategorie = b.kategorie || 'Sonstige';
                const key = kontoNr || kategorie;

                const monat = new Date(b.datum).getMonth(); // 0-11
                const betrag = parseFloat(b.betrag) || 0;

                if (!this.budgetIstData[key]) {
                    this.budgetIstData[key] = {
                        jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0, total: 0,
                        konto_nr: kontoNr,
                        kategorie: kategorie
                    };
                }

                this.budgetIstData[key][months[monat]] += betrag;
                this.budgetIstData[key].total += betrag;

                // Gesamtsummen
                this.budgetIstDataTotal[months[monat]] += betrag;
                this.budgetIstDataTotal.total += betrag;
            });

            console.log('IST-Daten geladen:', Object.keys(this.budgetIstData).length, 'Konten');

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

        // YTD-Monate berechnen (Jan bis Vormonat)
        const currentMonth = new Date().getMonth(); // 0-11
        const ytdMonths = months.slice(0, currentMonth);

        // Kontenplan laden für DB-Gruppierung
        let chartOfAccounts = [];
        try {
            chartOfAccounts = await SupabaseDataAdapter.getChartOfAccounts();
        } catch (error) {
            console.warn('Kontenplan konnte nicht geladen werden:', error);
        }

        // Konto-Notizen laden
        let kontoNotes = {};
        try {
            kontoNotes = await DataManager.getBudgetKontoNotes(year);
        } catch (error) {
            console.warn('Konto-Notizen konnten nicht geladen werden:', error);
        }

        // Hilfsfunktion: DB-Zuordnung für Konto finden
        const getDbZuordnung = (kontoNr) => {
            if (!kontoNr) return 'SONSTIGE';
            for (const coa of chartOfAccounts) {
                const pattern = (coa.konto_pattern || '').replace('%', '');
                if (pattern && kontoNr.startsWith(pattern)) {
                    return coa.db_zuordnung || 'SONSTIGE';
                }
            }
            return 'SONSTIGE';
        };

        // Debug: Zeige Kontenplan-Einträge mit DB-Zuordnung
        console.log('Kontenplan für DB-Zuordnung:', chartOfAccounts.filter(c => c.db_zuordnung).map(c => ({ pattern: c.konto_pattern, db: c.db_zuordnung })));

        // Alle Konten sammeln
        const alleKonten = new Map();

        entries.forEach(entry => {
            const key = entry.konto_nr || entry.description;
            alleKonten.set(key, {
                konto_nr: entry.konto_nr,
                description: entry.description,
                budget: entry,
                ist: this.budgetIstData[key] || null,
                hasBudget: true,
                id: entry.id,
                dbZuordnung: getDbZuordnung(entry.konto_nr)
            });
        });

        Object.keys(this.budgetIstData).forEach(key => {
            if (!alleKonten.has(key)) {
                const istData = this.budgetIstData[key];
                // konto_nr und kategorie sind jetzt in den IST-Daten gespeichert
                const kontoNr = istData.konto_nr || key;
                const kategorie = istData.kategorie || key;

                alleKonten.set(key, {
                    konto_nr: kontoNr,
                    description: kategorie,
                    budget: null,
                    ist: istData,
                    hasBudget: false,
                    id: null,
                    dbZuordnung: getDbZuordnung(kontoNr)
                });
            }
        });

        if (alleKonten.size === 0) {
            tbody.innerHTML = `<tr><td colspan="18" style="text-align: center; color: #666; padding: 2rem;">
                Keine Budget-Einträge oder IST-Daten für ${year}. Klicken Sie auf "+ Budget hinzufügen" um zu beginnen.
            </td></tr>`;
            return;
        }

        // Nach DB-Gruppen sortieren - mit monatlichen Summen
        // Professionelles Farbschema mit guten Kontrasten
        const createMonthlyObj = () => ({ jan: 0, feb: 0, mar: 0, apr: 0, mai: 0, jun: 0, jul: 0, aug: 0, sep: 0, okt: 0, nov: 0, dez: 0 });
        const dbGruppen = {
            'UMSATZ': { label: '1. UMSÄTZE', sortOrder: 1, color: '#d4edda', borderColor: '#28a745', textColor: '#155724', konten: [], budgetSum: 0, istSum: 0, budgetYtd: 0, istYtd: 0, budgetMonthly: createMonthlyObj(), istMonthly: createMonthlyObj() },
            'DB1_KOSTEN': { label: '2. DIREKTE KOSTEN (DB1)', sortOrder: 2, color: '#fff3cd', borderColor: '#ffc107', textColor: '#856404', konten: [], budgetSum: 0, istSum: 0, budgetYtd: 0, istYtd: 0, budgetMonthly: createMonthlyObj(), istMonthly: createMonthlyObj() },
            'DB2_KOSTEN': { label: '3. STRUKTURKOSTEN (DB2)', sortOrder: 3, color: '#cce5ff', borderColor: '#007bff', textColor: '#004085', konten: [], budgetSum: 0, istSum: 0, budgetYtd: 0, istYtd: 0, budgetMonthly: createMonthlyObj(), istMonthly: createMonthlyObj() },
            'DB3_KOSTEN': { label: '4. FIXKOSTEN (DB3)', sortOrder: 4, color: '#f8d7da', borderColor: '#dc3545', textColor: '#721c24', konten: [], budgetSum: 0, istSum: 0, budgetYtd: 0, istYtd: 0, budgetMonthly: createMonthlyObj(), istMonthly: createMonthlyObj() },
            'SONSTIGE': { label: '5. SONSTIGE', sortOrder: 5, color: '#e2e3e5', borderColor: '#6c757d', textColor: '#383d41', konten: [], budgetSum: 0, istSum: 0, budgetYtd: 0, istYtd: 0, budgetMonthly: createMonthlyObj(), istMonthly: createMonthlyObj() }
        };

        // Konten in Gruppen einsortieren UND Summen vorberechnen
        Array.from(alleKonten.entries()).forEach(([key, data]) => {
            const gruppe = dbGruppen[data.dbZuordnung] || dbGruppen['SONSTIGE'];
            const budget = data.budget;
            const ist = data.ist;

            const budgetRowTotal = budget ? months.reduce((sum, m) => sum + (parseFloat(budget[m]) || 0), 0) : 0;
            const budgetYtd = budget ? ytdMonths.reduce((sum, m) => sum + (parseFloat(budget[m]) || 0), 0) : 0;
            const istRowTotal = ist ? ist.total : 0;
            const istYtd = ist ? ytdMonths.reduce((sum, m) => sum + (ist[m] || 0), 0) : 0;

            // Vorberechnete Werte speichern
            data.budgetTotal = budgetRowTotal;
            data.budgetYtd = budgetYtd;
            data.istTotal = istRowTotal;
            data.istYtd = istYtd;
            data.diff = budgetRowTotal - istRowTotal;

            gruppe.konten.push({ key, ...data });
            gruppe.budgetSum += budgetRowTotal;
            gruppe.istSum += istRowTotal;
            gruppe.budgetYtd += budgetYtd;
            gruppe.istYtd += istYtd;

            // Monatliche Summen pro Gruppe sammeln
            months.forEach(m => {
                gruppe.budgetMonthly[m] += budget ? (parseFloat(budget[m]) || 0) : 0;
                gruppe.istMonthly[m] += ist ? (ist[m] || 0) : 0;
            });
        });

        let html = '';
        let gesamtBudget = 0, gesamtIst = 0, gesamtBudgetYtd = 0, gesamtIstYtd = 0;
        const gesamtBudgetMonthly = createMonthlyObj();
        const gesamtIstMonthly = createMonthlyObj();

        // Gruppen in Array umwandeln für Sortierung
        let gruppenArray = Object.entries(dbGruppen).filter(([key, gruppe]) => gruppe.konten.length > 0);

        // Sortierung auf GRUPPEN-Ebene anwenden
        const sortCol = this.budgetSortColumn || 'konto_nr';
        const sortDir = this.budgetSortDirection || 'asc';

        if (sortCol !== 'konto_nr' && sortCol !== 'description') {
            // Bei numerischer Sortierung: Gruppen nach aggregiertem Wert sortieren
            gruppenArray.sort((a, b) => {
                let valA, valB;
                switch(sortCol) {
                    case 'ytd': valA = a[1].budgetYtd; valB = b[1].budgetYtd; break;
                    case 'total': valA = a[1].budgetSum; valB = b[1].budgetSum; break;
                    case 'ist': valA = a[1].istSum; valB = b[1].istSum; break;
                    case 'diff': valA = a[1].budgetSum - a[1].istSum; valB = b[1].budgetSum - b[1].istSum; break;
                    default: valA = a[1].sortOrder; valB = b[1].sortOrder;
                }
                return sortDir === 'asc' ? valA - valB : valB - valA;
            });
        } else {
            // Bei Konto/Beschreibung: Standard-Reihenfolge (sortOrder)
            gruppenArray.sort((a, b) => {
                return sortDir === 'asc' ? a[1].sortOrder - b[1].sortOrder : b[1].sortOrder - a[1].sortOrder;
            });
        }

        gruppenArray.forEach(([gruppenKey, gruppe]) => {
            // Konten innerhalb der Gruppe nach Konto-Nr sortieren
            gruppe.konten.sort((a, b) => {
                const valA = a.konto_nr || '';
                const valB = b.konto_nr || '';
                return valA.localeCompare(valB);
            });

            // Gruppen-Diff berechnen
            const gruppenDiff = gruppe.budgetSum - gruppe.istSum;
            const gruppenDiffStyle = gruppenDiff < 0 ? 'color: #dc3545;' : 'color: #28a745;';
            const gruppenDiffYtd = gruppe.budgetYtd - gruppe.istYtd;
            const gruppenDiffYtdStyle = gruppenDiffYtd < 0 ? 'color: #dc3545;' : 'color: #28a745;';

            // Gruppen-Header: Budget-Zeile mit monatlichen Werten
            const gruppenId = gruppenKey.replace(/[^a-zA-Z0-9]/g, '');
            html += `<tr class="gruppe-header" style="background: linear-gradient(135deg, ${gruppe.color} 0%, ${gruppe.color}ee 100%); cursor: pointer; border-left: 5px solid ${gruppe.borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.08);" onclick="App.toggleBudgetGroup(this, '${gruppenId}')">
                <td style="font-size: 0.9rem; padding: 14px 12px; font-weight: 700; color: ${gruppe.textColor}; letter-spacing: 0.3px;">
                    <span id="budget-expand-${gruppenId}" style="display: inline-block; width: 22px; text-align: center; font-size: 1rem; font-weight: bold; background: ${gruppe.borderColor}; color: white; border-radius: 4px; margin-right: 8px; line-height: 22px; height: 22px;">+</span>
                    ${gruppe.label}
                </td>
                <td style="font-size: 0.7rem; color: ${gruppe.textColor}; opacity: 0.7; font-weight: 500;">(${gruppe.konten.length} Konten)</td>
                <td style="text-align: right; font-weight: 700; color: ${gruppe.textColor}; background: rgba(255,255,255,0.5); padding: 14px 10px;">${this.formatNumber(gruppe.budgetYtd)}</td>
                ${months.map(m => `<td style="text-align: right; font-size: 0.8rem; color: ${gruppe.textColor}; font-weight: 500; padding: 14px 6px;">${this.formatNumber(gruppe.budgetMonthly[m])}</td>`).join('')}
                <td style="text-align: right; font-weight: 800; color: ${gruppe.textColor}; font-size: 0.95rem; background: rgba(255,255,255,0.4); padding: 14px 10px;">${this.formatNumber(gruppe.budgetSum)}</td>
                <td style="background: rgba(255,255,255,0.3);"></td>
                <td style="background: rgba(255,255,255,0.3);"></td>
            </tr>`;

            // Gruppen-Header: IST-Zeile mit monatlichen Werten
            const istBgColor = gruppe.color.replace(')', ', 0.4)').replace('rgb', 'rgba').replace('#', '');
            html += `<tr class="gruppe-ist-row" style="background: linear-gradient(to bottom, ${gruppe.color}99, #f8f9fa); font-size: 0.78rem; border-bottom: 3px solid ${gruppe.borderColor};">
                <td style="padding: 10px 12px 10px 46px; color: #495057; font-weight: 600; font-style: italic;">IST</td>
                <td></td>
                <td style="text-align: right; color: #0d6efd; font-weight: 700; background: rgba(13, 110, 253, 0.08); padding: 10px;">${this.formatNumber(gruppe.istYtd)}</td>
                ${months.map(m => `<td style="text-align: right; color: #0d6efd; font-weight: 500; padding: 10px 6px;">${this.formatNumber(gruppe.istMonthly[m])}</td>`).join('')}
                <td style="text-align: right; color: #0d6efd; font-weight: 700; font-size: 0.85rem; background: rgba(13, 110, 253, 0.08); padding: 10px;">${this.formatNumber(gruppe.istSum)}</td>
                <td style="${gruppenDiffStyle}; font-weight: 800; font-size: 0.85rem; padding: 10px; background: ${gruppenDiff < 0 ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)'};">${gruppenDiff >= 0 ? '+' : ''}${this.formatNumber(gruppenDiff)}</td>
                <td></td>
            </tr>`;

            // Konten-Zeilen (eingeklappt starten)
            gruppe.konten.forEach(data => {
                const budget = data.budget;
                const ist = data.ist;
                const diffStyle = data.diff < 0 ? 'color: #dc3545;' : (data.diff > 0 ? 'color: #28a745;' : '');

                const note = kontoNotes[data.key] || '';
                const keyEscaped = data.key.replace(/'/g, "\\'");
                const descEscaped = (data.description || data.konto_nr || '').replace(/'/g, "\\'");

                html += `<tr class="gruppe-detail-row" style="display: none;">
                    <td style="font-weight: 600; white-space: nowrap; padding-left: 1.5rem;">${data.konto_nr || '-'}</td>
                    <td style="font-size: 0.85rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis;" title="${data.description || ''}">${data.description || data.konto_nr}</td>
                    <td style="text-align: right; background: #e3f2fd;">${this.formatNumber(data.budgetYtd)}</td>
                    ${months.map(m => `<td style="text-align: right; font-size: 0.85rem;">${budget ? this.formatNumber(budget[m]) : '-'}</td>`).join('')}
                    <td style="text-align: right;">
                        <input type="number" class="form-control" style="font-size: 0.75rem; padding: 2px 4px; width: 70px; text-align: right; display: inline-block;"
                               value="${data.budgetTotal || ''}"
                               placeholder="0"
                               onchange="App.quickSaveBudget('${keyEscaped}', '${descEscaped}', ${year}, this.value, '${data.id || ''}')"
                               title="Jahresbudget eingeben - wird gleichmäßig auf 12 Monate verteilt">
                    </td>
                    <td><input type="text" class="form-control" style="font-size: 0.7rem; padding: 2px 4px; width: 80px;" placeholder="..." value="${note}" onchange="App.saveBudgetKontoNote('${keyEscaped}', ${year}, this.value)"></td>
                    <td>${data.hasBudget ? `<button class="btn btn-sm btn-outline" onclick="App.editBudgetEntry('${data.id}')" title="Details bearbeiten">${Icons.edit}</button>` : ''}</td>
                </tr>
                <tr class="gruppe-detail-row" style="display: none; font-size: 0.75rem; color: #666; border-bottom: 1px solid #dee2e6;">
                    <td></td>
                    <td style="color: #007bff;">IST</td>
                    <td style="text-align: right; background: #c8e6c9; color: #2e7d32;">${this.formatNumber(data.istYtd)}</td>
                    ${months.map(m => `<td style="text-align: right; color: #007bff;">${ist ? this.formatNumber(ist[m]) : '-'}</td>`).join('')}
                    <td style="text-align: right; color: #007bff; font-weight: bold;">${this.formatNumber(data.istTotal)}</td>
                    <td style="${diffStyle}; font-weight: bold;">${data.diff >= 0 ? '+' : ''}${this.formatNumber(data.diff)}</td>
                    <td></td>
                </tr>`;
            });

            gesamtBudget += gruppe.budgetSum;
            gesamtIst += gruppe.istSum;
            gesamtBudgetYtd += gruppe.budgetYtd;
            gesamtIstYtd += gruppe.istYtd;
            months.forEach(m => {
                gesamtBudgetMonthly[m] += gruppe.budgetMonthly[m];
                gesamtIstMonthly[m] += gruppe.istMonthly[m];
            });
        });

        // Gesamtsumme mit monatlichen Werten
        const gesamtDiff = gesamtBudget - gesamtIst;
        const gesamtDiffBg = gesamtDiff < 0 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(81, 207, 102, 0.2)';
        const gesamtDiffColor = gesamtDiff < 0 ? '#ff6b6b' : '#51cf66';

        html += `<tr style="background: linear-gradient(135deg, #1a252f 0%, #2c3e50 50%, #1a252f 100%); color: white; font-weight: 700; font-size: 1rem; box-shadow: 0 -4px 12px rgba(0,0,0,0.15);" class="gruppe-header">
            <td style="padding: 16px 12px; border-left: 6px solid #3498db; letter-spacing: 1px; text-transform: uppercase;">
                <span style="background: linear-gradient(135deg, #3498db, #2980b9); padding: 4px 10px; border-radius: 4px; font-size: 0.85rem;">GESAMT</span>
            </td>
            <td style="color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 500;">Budget</td>
            <td style="text-align: right; background: rgba(255,255,255,0.1); padding: 16px 10px; font-size: 1.05rem;">${this.formatNumber(gesamtBudgetYtd)}</td>
            ${months.map(m => `<td style="text-align: right; font-weight: 500; padding: 16px 6px; font-size: 0.85rem;">${this.formatNumber(gesamtBudgetMonthly[m])}</td>`).join('')}
            <td style="text-align: right; font-size: 1.15rem; font-weight: 800; background: rgba(255,255,255,0.15); padding: 16px 10px;">${this.formatNumber(gesamtBudget)}</td>
            <td style="background: rgba(255,255,255,0.08);"></td>
            <td style="background: rgba(255,255,255,0.08);"></td>
        </tr>
        <tr style="background: linear-gradient(135deg, #34495e 0%, #3d566e 50%, #34495e 100%); color: #ecf0f1; font-size: 0.85rem; border-bottom: 4px solid #3498db;">
            <td style="padding: 12px 12px 12px 22px; font-style: italic; font-weight: 600;">
                <span style="color: #74b9ff;">IST</span>
            </td>
            <td></td>
            <td style="text-align: right; color: #74b9ff; font-weight: 700; background: rgba(116, 185, 255, 0.15); padding: 12px 10px;">${this.formatNumber(gesamtIstYtd)}</td>
            ${months.map(m => `<td style="text-align: right; color: #74b9ff; font-weight: 500; padding: 12px 6px;">${this.formatNumber(gesamtIstMonthly[m])}</td>`).join('')}
            <td style="text-align: right; color: #74b9ff; font-weight: 700; font-size: 0.95rem; background: rgba(116, 185, 255, 0.15); padding: 12px 10px;">${this.formatNumber(gesamtIst)}</td>
            <td style="color: ${gesamtDiffColor}; font-weight: 800; font-size: 0.95rem; padding: 12px 10px; background: ${gesamtDiffBg}; border-radius: 0 0 4px 0;">${gesamtDiff >= 0 ? '+' : ''}${this.formatNumber(gesamtDiff)}</td>
            <td></td>
        </tr>`;

        tbody.innerHTML = html;
    },

    // Toggle-Funktion für Gruppen auf-/zuklappen
    toggleBudgetGroup: function(headerRow, gruppenId) {
        let row = headerRow.nextElementSibling;
        // Überspringe die IST-Zeile der Gruppe
        if (row && row.classList.contains('gruppe-ist-row')) {
            row = row.nextElementSibling;
        }

        // Prüfe aktuellen Status
        const isCurrentlyHidden = row && row.style.display === 'none';

        // Toggle alle Detail-Zeilen bis zur nächsten Gruppe
        while (row && row.classList.contains('gruppe-detail-row')) {
            row.style.display = isCurrentlyHidden ? '' : 'none';
            row = row.nextElementSibling;
        }

        // Icon aktualisieren
        const icon = document.getElementById('budget-expand-' + gruppenId);
        if (icon) {
            icon.textContent = isCurrentlyHidden ? '−' : '+';
        }
    },

    // Sortierung für Budget-Tabelle
    budgetSortColumn: 'konto_nr',
    budgetSortDirection: 'asc',

    sortBudgetTable: function(column) {
        if (this.budgetSortColumn === column) {
            this.budgetSortDirection = this.budgetSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.budgetSortColumn = column;
            this.budgetSortDirection = 'asc';
        }
        // Sort-Icons aktualisieren
        const allIcons = ['konto_nr', 'description', 'ytd', 'total'];
        allIcons.forEach(col => {
            const icon = document.getElementById('sort-icon-' + col);
            if (icon) {
                if (col === column) {
                    icon.textContent = this.budgetSortDirection === 'asc' ? '▲' : '▼';
                } else {
                    icon.textContent = '';
                }
            }
        });
        this.loadBudgetplanung();
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

    // Schnelles Budget-Speichern direkt in der Zeile
    quickSaveBudget: async function(kontoNr, description, year, totalBudget, existingId) {
        try {
            const total = parseFloat(totalBudget) || 0;
            const monthly = Math.round((total / 12) * 100) / 100; // Gleichmäßig auf 12 Monate

            const budgetData = {
                konto_nr: kontoNr,
                description: description,
                fiscal_year: year,
                jan: monthly, feb: monthly, mar: monthly, apr: monthly,
                mai: monthly, jun: monthly, jul: monthly, aug: monthly,
                sep: monthly, okt: monthly, nov: monthly, dez: monthly
            };

            if (existingId) {
                // Update existierender Eintrag
                await SupabaseService.client
                    .from('budget_entries')
                    .update(budgetData)
                    .eq('id', existingId);
            } else {
                // Neuer Eintrag
                await SupabaseService.client
                    .from('budget_entries')
                    .insert(budgetData);
            }

            this.showToast('success', 'Gespeichert', `Budget für ${kontoNr} gespeichert`);

            // Tabelle neu laden um Änderungen anzuzeigen
            await this.loadBudgetplanung();

        } catch (error) {
            console.error('Fehler beim Speichern des Budgets:', error);
            this.showToast('error', 'Fehler', 'Budget konnte nicht gespeichert werden');
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
        document.getElementById('budget-entry-jahres-total').value = '0';
        document.getElementById('budget-entry-deviation').style.display = 'none';
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'].forEach(m => {
            document.getElementById(`budget-entry-${m}`).value = '0';
        });
        document.getElementById('budget-entry-total').textContent = '0,00 EUR';

        // Projekte-Dropdown füllen
        const projektSelect = document.getElementById('budget-entry-projekt');
        const projects = await DataManager.getProjects();
        projektSelect.innerHTML = '<option value="">-- Kein Projekt --</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Event-Listener für automatische Summenberechnung bei Monats-Änderungen
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
                // Jahres-Total auf Summe der Monate setzen
                const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];
                const monthSum = months.reduce((sum, m) => sum + (parseFloat(entry[m]) || 0), 0);
                document.getElementById('budget-entry-jahres-total').value = monthSum.toFixed(2);
            }
        } else {
            title.textContent = 'Neuer Budget-Eintrag';
        }

        modal.classList.add('active');
    },

    closeBudgetEntryModal: function() {
        const modal = document.getElementById('budget-entry-modal');
        modal.classList.remove('active');
    },

    distributeBudgetToMonths: function() {
        const jahresTotal = parseFloat(document.getElementById('budget-entry-jahres-total').value) || 0;
        const monatsBetrag = jahresTotal / 12;
        const monatsBetragRounded = Math.round(monatsBetrag * 100) / 100;

        // Auf alle Monate verteilen
        ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'].forEach(m => {
            document.getElementById(`budget-entry-${m}`).value = monatsBetragRounded.toFixed(2);
        });

        // Rest auf Dezember addieren für exakte Summe
        const verteiltesSumme = monatsBetragRounded * 12;
        const rest = jahresTotal - verteiltesSumme;
        if (Math.abs(rest) > 0.001) {
            const dezInput = document.getElementById('budget-entry-dez');
            dezInput.value = (monatsBetragRounded + rest).toFixed(2);
        }

        this.updateBudgetEntryTotal();
    },

    updateBudgetEntryTotal: function() {
        const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'];
        const monthsSum = months.reduce((sum, m) => sum + (parseFloat(document.getElementById(`budget-entry-${m}`).value) || 0), 0);
        document.getElementById('budget-entry-total').textContent = this.formatCurrency(monthsSum);

        // Abweichung vom Jahres-Total berechnen und anzeigen
        const jahresTotal = parseFloat(document.getElementById('budget-entry-jahres-total').value) || 0;
        const deviation = monthsSum - jahresTotal;
        const deviationEl = document.getElementById('budget-entry-deviation');

        if (jahresTotal > 0 && Math.abs(deviation) > 0.01) {
            const isPositive = deviation > 0;
            deviationEl.innerHTML = `
                <strong style="color: ${isPositive ? '#e65100' : '#2e7d32'};">
                    Abweichung: ${isPositive ? '+' : ''}${this.formatCurrency(deviation)}
                </strong>
                <br><small style="color: #666;">Plan: ${this.formatCurrency(jahresTotal)} | Monate: ${this.formatCurrency(monthsSum)}</small>
            `;
            deviationEl.style.display = 'block';
            deviationEl.style.background = isPositive ? '#fff3e0' : '#e8f5e9';
        } else {
            deviationEl.style.display = 'none';
        }
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
            this.closeBudgetEntryModal();
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
            access_konfiguration: 'Konfiguration',
            access_zeiterfassung: 'Zeiterfassung'
        };

        container.innerHTML = this.workspacesData.map(ws => {
            const accessList = Object.entries(accessLabels)
                .filter(([key]) => ws[key])
                .map(([, label]) => label);

            const accessText = accessList.length > 0 ? accessList.join(', ') : 'Kein Zugriff';

            // Audit-Info für Geändert-Anzeige
            const auditInfo = formatAuditInfo(ws.created_by, ws.created_at, ws.updated_by, ws.updated_at);
            const updatedByName = resolveUserName(ws.updated_by || ws.created_by);
            const updatedAtFormatted = ws.updated_at ? this.formatDateTime(ws.updated_at) : (ws.created_at ? this.formatDateTime(ws.created_at) : '-');

            return `
                <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;" title="${auditInfo}">
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
                        <div style="font-size: 0.7rem; color: #aaa; margin-top: 0.25rem;">
                            Geändert: ${updatedAtFormatted}${updatedByName ? ` (${updatedByName})` : ''}
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

        // Hilfsfunktion: Radio-Button auf bestimmten Wert setzen
        const setRadioValue = (name, value) => {
            // Konvertiere boolean zu string für Abwärtskompatibilität
            let strValue = 'none';
            if (typeof value === 'boolean') {
                strValue = value ? 'write' : 'none';
            } else if (value) {
                strValue = value;
            }
            const radio = document.querySelector(`input[name="${name}"][value="${strValue}"]`);
            if (radio) {
                radio.checked = true;
            } else {
                // Fallback: Setze auf 'none'
                const noneRadio = document.querySelector(`input[name="${name}"][value="none"]`);
                if (noneRadio) noneRadio.checked = true;
            }
        };

        // Formular zurücksetzen
        document.getElementById('workspace-id').value = '';
        document.getElementById('workspace-name').value = '';
        document.getElementById('workspace-description').value = '';

        // Alle Radio-Buttons auf 'none' setzen
        const areas = ['dashboard', 'projekte', 'rechnungen', 'rechnungen-bezahlt', 'bewegungen', 'lieferanten', 'mitglieder', 'einnahmen', 'konfiguration', 'zeiterfassung', 'inventar', 'reporting'];
        areas.forEach(area => {
            setRadioValue(`workspace-access-${area}`, 'none');
        });

        document.getElementById('workspace-rechnungen-nur-zugewiesene').checked = false;

        if (workspaceId) {
            title.textContent = 'Workspace bearbeiten';
            const ws = this.workspacesData.find(w => w.id === workspaceId);
            if (ws) {
                document.getElementById('workspace-id').value = ws.id;
                document.getElementById('workspace-name').value = ws.name || '';
                document.getElementById('workspace-description').value = ws.description || '';

                // Radio-Buttons setzen (3-stufige Berechtigungen)
                areas.forEach(area => {
                    // Konvertiere area mit Bindestrich zu Unterstrich für DB-Feld
                    const dbField = area.replace(/-/g, '_');
                    setRadioValue(`workspace-access-${area}`, ws[`access_${dbField}`]);
                });

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

        // Hilfsfunktion: Radio-Button-Wert auslesen
        // Gibt 'none', 'read' oder 'write' zurück
        const getRadioValue = (name) => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            return checked ? checked.value : 'none';
        };

        const workspaceId = document.getElementById('workspace-id').value;
        const workspaceData = {
            name: document.getElementById('workspace-name').value.trim(),
            description: document.getElementById('workspace-description').value.trim() || null,
            // ENUM-Werte direkt: 'none', 'read', 'write', 'delete'
            access_dashboard: getRadioValue('workspace-access-dashboard'),
            access_projekte: getRadioValue('workspace-access-projekte'),
            access_rechnungen: getRadioValue('workspace-access-rechnungen'),
            access_rechnungen_bezahlt: getRadioValue('workspace-access-rechnungen-bezahlt') === 'write',
            access_bewegungen: getRadioValue('workspace-access-bewegungen'),
            access_lieferanten: getRadioValue('workspace-access-lieferanten'),
            access_mitglieder: getRadioValue('workspace-access-mitglieder'),
            access_einnahmen: getRadioValue('workspace-access-einnahmen'),
            access_konfiguration: getRadioValue('workspace-access-konfiguration'),
            access_zeiterfassung: getRadioValue('workspace-access-zeiterfassung'),
            access_inventar: getRadioValue('workspace-access-inventar'),
            access_reporting: getRadioValue('workspace-access-reporting'),
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
    },

    // ==========================================
    // SHOP & KASSE
    // ==========================================

    loadShop: async function() {
        try {
            // Tabs initialisieren
            this.initShopTabs();

            // Statistiken laden
            await this.loadShopStatistiken();

            // Standard-Tab aktivieren (Inventar)
            const tabs = document.querySelectorAll('#view-shop .tabs .tab');
            const contents = document.querySelectorAll('#view-shop .tab-content');
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            const defaultTab = document.querySelector('#view-shop .tab[data-tab="shop-inventar"]');
            const defaultContent = document.getElementById('tab-shop-inventar');
            if (defaultTab) defaultTab.classList.add('active');
            if (defaultContent) defaultContent.classList.add('active');

            // Standard-Tab laden (Inventar)
            await this.loadShopInventar();

        } catch (error) {
            console.error('Fehler beim Laden des Shops:', error);
            this.showToast('Fehler', 'Shop konnte nicht geladen werden', 'error');
        }
    },

    initShopTabs: function() {
        const tabs = document.querySelectorAll('#view-shop .tabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                const tabName = e.target.dataset.tab;

                // Aktiven Tab wechseln
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Tab-Content wechseln
                document.querySelectorAll('#view-shop .tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabName}`).classList.add('active');

                // Daten laden
                switch(tabName) {
                    case 'shop-inventar':
                        await this.loadShopInventar();
                        break;
                    case 'shop-verkaeufe':
                        await this.loadShopVerkaeufe();
                        break;
                    case 'shop-einkaeufe':
                        await this.loadShopEinkaeufe();
                        break;
                    case 'shop-rechnungen':
                        await this.loadShopRechnungen();
                        break;
                    case 'shop-kasse':
                        await this.loadShopKasse();
                        break;
                    case 'shop-ausgaben':
                        await this.loadShopAusgaben();
                        break;
                }
            });
        });
    },

    loadShopStatistiken: async function() {
        try {
            const heute = new Date().toISOString().split('T')[0];
            const saldo = await DataManager.berechneKassensaldo(heute);
            const artikel = await DataManager.getShopArtikel();

            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

            setEl('shop-stat-einnahmen-bar', this.formatCurrency(saldo.einnahmenBar || 0));
            setEl('shop-stat-einnahmen-pos', this.formatCurrency(saldo.einnahmenPos || 0));
            setEl('shop-stat-kassen-saldo', this.formatCurrency(saldo.saldoBar || 0));
            setEl('shop-stat-artikel', artikel.length);
        } catch (error) {
            console.error('Fehler beim Laden der Shop-Statistiken:', error);
        }
    },

    // ---- INVENTAR ----

    loadShopInventar: async function() {
        try {
            const artikel = await DataManager.getShopArtikel();
            const artikeltypen = await DataManager.getShopArtikeltypen();

            // Filter-Dropdowns befüllen
            this.populateShopArtikelFilter(artikeltypen);

            // Tabelle rendern
            this.renderShopArtikelTabelle(artikel);

        } catch (error) {
            console.error('Fehler beim Laden des Inventars:', error);
        }
    },

    populateShopArtikelFilter: function(artikeltypen) {
        const typFilter = document.getElementById('shop-filter-typ');
        if (typFilter) {
            typFilter.innerHTML = '<option value="">Alle Typen</option>';
            artikeltypen.forEach(typ => {
                typFilter.innerHTML += `<option value="${escapeHtml(typ.code)}">${escapeHtml(typ.name)}</option>`;
            });
        }
    },

    renderShopArtikelTabelle: function(artikel) {
        const tbody = document.getElementById('shop-artikel-table-body');
        if (!tbody) return;

        if (artikel.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted" style="padding: 3rem;">
                        Keine Artikel vorhanden. Klicken Sie auf "Neuer Artikel" oder importieren Sie Daten aus Excel.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = artikel.map(art => {
            // Unterstütze sowohl camelCase als auch snake_case
            const bestand = art.bestandAktuell ?? art.bestand_aktuell ?? 0;
            const bestandMin = art.bestandMin ?? art.bestand_min ?? 0;
            const mwstSatz = art.mwstSatz ?? art.mwst_satz ?? '22';
            const durchschnittEK = art.durchschnittEK ?? art.durchschnitt_ek ?? 0;
            const verkaufspreis = art.verkaufspreis || 0;
            const gewinnMarge = durchschnittEK > 0 ? ((verkaufspreis - durchschnittEK) / durchschnittEK * 100).toFixed(0) : '-';

            return `
            <tr>
                <td><code>${art.artikelnr || '-'}</code></td>
                <td>
                    <strong>${art.name}</strong>
                    ${art.autor ? `<br><small class="text-muted">${art.autor}</small>` : ''}
                </td>
                <td><span class="badge badge-outline">${this.getArtikelTypLabel(art.artikeltyp)}</span></td>
                <td class="text-right">${durchschnittEK > 0 ? this.formatCurrency(durchschnittEK) : '-'}</td>
                <td class="text-right">${this.formatCurrency(verkaufspreis)}</td>
                <td class="text-center">
                    ${durchschnittEK > 0 ? `<span class="${gewinnMarge > 0 ? 'text-success' : 'text-danger'}">${gewinnMarge}%</span>` : '-'}
                </td>
                <td><span class="badge badge-outline">${this.getMwstLabel(mwstSatz)}</span></td>
                <td class="text-center">
                    <span class="${bestand <= bestandMin ? 'text-danger' : ''}">${bestand}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-sm" onclick="App.editShopArtikel(${art.id})" title="Bearbeiten">
                            <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="App.deleteShopArtikel(${art.id})" title="Löschen">
                            <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    },

    getArtikelTypLabel: function(typ) {
        const typen = {
            'buch': 'Buch',
            'katalog': 'Katalog',
            'poster': 'Poster',
            'objekt': 'Objekt/Gadget',
            'schmuck': 'Schmuck',
            'sonstiges': 'Sonstiges'
        };
        return typen[typ] || typ || 'Sonstiges';
    },

    getMwstLabel: function(satz) {
        if (satz === '4' || satz === 4) return '4%';
        if (satz === '22' || satz === 22) return '22%';
        if (satz === 'art74') return 'Art. 74';
        return satz || '22%';
    },

    filterShopArtikel: async function() {
        const typFilter = document.getElementById('shop-filter-typ')?.value;
        const standortFilter = document.getElementById('shop-filter-standort')?.value;
        const suchtext = document.getElementById('shop-suche')?.value?.toLowerCase();

        let artikel = await DataManager.getShopArtikel();

        if (typFilter) {
            artikel = artikel.filter(a => a.artikeltyp === typFilter);
        }
        if (standortFilter) {
            artikel = artikel.filter(a => a.standort === standortFilter);
        }
        if (suchtext) {
            artikel = artikel.filter(a =>
                (a.name || '').toLowerCase().includes(suchtext) ||
                (a.artikelnr || '').toLowerCase().includes(suchtext) ||
                (a.hersteller || '').toLowerCase().includes(suchtext) ||
                (a.autor || '').toLowerCase().includes(suchtext)
            );
        }

        this.renderShopArtikelTabelle(artikel);
    },

    showNewShopArtikelForm: async function() {
        document.getElementById('shop-artikel-modal-title').textContent = 'Neuer Artikel';
        document.getElementById('shop-artikel-form').reset();
        document.getElementById('shop-artikel-form-id').value = '';

        // Nächste Artikelnummer generieren
        const artikel = await DataManager.getShopArtikel() || [];
        const maxNr = artikel.reduce((max, a) => {
            const match = (a.artikelnr || '').match(/SHOP-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        document.getElementById('shop-artikel-nr').value = `SHOP-${String(maxNr + 1).padStart(4, '0')}`;

        // Bestand editierbar bei neuem Artikel
        const bestandInput = document.getElementById('shop-artikel-bestand');
        bestandInput.readOnly = false;
        bestandInput.style.backgroundColor = '';

        this.openModal('shop-artikel-form-modal');
    },

    editShopArtikel: async function(id) {
        const artikel = await DataManager.getShopArtikelById(id);
        if (!artikel) return;

        document.getElementById('shop-artikel-modal-title').textContent = 'Artikel bearbeiten';
        document.getElementById('shop-artikel-form-id').value = artikel.id;
        document.getElementById('shop-artikel-nr').value = artikel.artikelnr || '';
        document.getElementById('shop-artikel-name').value = artikel.name || '';
        document.getElementById('shop-artikel-beschreibung').value = artikel.beschreibung || '';
        document.getElementById('shop-artikel-hersteller').value = artikel.hersteller || '';
        document.getElementById('shop-artikel-autor').value = artikel.autor || '';
        document.getElementById('shop-artikel-einkaufsjahr').value = artikel.einkaufsjahr || '';
        document.getElementById('shop-artikel-standort').value = artikel.standort || 'Shop';
        document.getElementById('shop-artikel-ek').value = artikel.einkaufspreis || '';
        document.getElementById('shop-artikel-vk').value = artikel.verkaufspreis || '';
        document.getElementById('shop-artikel-mwst').value = artikel.mwstSatz || artikel.mwst_satz || '22';
        document.getElementById('shop-artikel-typ').value = artikel.artikeltyp || 'sonstiges';

        // Bestand read-only bei bestehendem Artikel (wird über Einkäufe/Verkäufe gesteuert)
        const bestandInput = document.getElementById('shop-artikel-bestand');
        bestandInput.value = artikel.bestandAktuell || artikel.bestand_aktuell || 0;
        bestandInput.readOnly = true;
        bestandInput.style.backgroundColor = '#f5f5f5';

        this.openModal('shop-artikel-form-modal');
    },

    saveShopArtikel: async function(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('shop-artikel-form-id').value;

        const artikelData = {
            artikelnr: document.getElementById('shop-artikel-nr').value.trim(),
            name: document.getElementById('shop-artikel-name').value.trim(),
            beschreibung: document.getElementById('shop-artikel-beschreibung').value.trim(),
            artikeltyp: document.getElementById('shop-artikel-typ').value,
            hersteller: document.getElementById('shop-artikel-hersteller').value.trim(),
            autor: document.getElementById('shop-artikel-autor').value.trim(),
            einkaufsjahr: document.getElementById('shop-artikel-einkaufsjahr').value.trim(),
            standort: document.getElementById('shop-artikel-standort').value,
            einkaufspreis: parseFloat(document.getElementById('shop-artikel-ek').value) || null,
            verkaufspreis: parseFloat(document.getElementById('shop-artikel-vk').value) || 0,
            mwstSatz: document.getElementById('shop-artikel-mwst').value,
            bestandAktuell: parseInt(document.getElementById('shop-artikel-bestand').value) || 0
        };

        if (!artikelData.name || !artikelData.verkaufspreis) {
            this.showToast('Fehler', 'Name und Verkaufspreis sind Pflichtfelder', 'error');
            return;
        }

        if (id) {
            artikelData.id = parseInt(id);
        }

        try {
            await DataManager.saveShopArtikel(artikelData);
            this.closeModal('shop-artikel-form-modal');
            this.showToast('Erfolg', id ? 'Artikel aktualisiert' : 'Artikel erstellt', 'success');
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Artikel konnte nicht gespeichert werden', 'error');
        }
    },

    deleteShopArtikel: async function(id) {
        if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) return;

        try {
            await DataManager.deleteShopArtikel(id);
            this.showToast('Erfolg', 'Artikel gelöscht', 'success');
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showToast('Fehler', 'Artikel konnte nicht gelöscht werden', 'error');
        }
    },

    // ---- VERKÄUFE ----

    loadShopVerkaeufe: async function() {
        try {
            const datumFilter = document.getElementById('shop-verkaeufe-datum')?.value || new Date().toISOString().split('T')[0];
            const verkaeufe = await DataManager.getShopVerkaeufe(datumFilter);

            // Eintritt- und Mitglied-Kategorien für Dropdowns laden
            const eintrittKat = await DataManager.getEintrittKategorien();
            const mitgliedKat = await DataManager.getMitgliedKategorien();

            this.shopEintrittKategorien = eintrittKat;
            this.shopMitgliedKategorien = mitgliedKat;

            this.renderShopVerkaeufeTabelle(verkaeufe);

        } catch (error) {
            console.error('Fehler beim Laden der Verkäufe:', error);
        }
    },

    renderShopVerkaeufeTabelle: function(verkaeufe) {
        const tbody = document.getElementById('shop-verkaeufe-table-body');
        if (!tbody) return;

        if (verkaeufe.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted" style="padding: 3rem;">
                        Keine Verkäufe vorhanden.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = verkaeufe.map(v => {
            let typBadge = '';
            let beschreibung = '';

            if (v.typ === 'artikel') {
                typBadge = '<span class="badge badge-primary">Artikel</span>';
                beschreibung = v.artikel_name || `Artikel #${v.artikel_id}`;
            } else if (v.typ === 'eintritt') {
                typBadge = '<span class="badge badge-success">Eintritt</span>';
                const tageszeitLabel = v.tageszeit === 'nachmittag' ? 'NM' : (v.tageszeit === 'vormittag' ? 'VM' : '');
                beschreibung = this.getEintrittKategorieLabel(v.eintritt_kategorie) + (tageszeitLabel ? ` (${tageszeitLabel})` : '');
            } else if (v.typ === 'mitglied') {
                typBadge = '<span class="badge badge-warning">Mitglied</span>';
                beschreibung = `${this.getMitgliedKategorieLabel(v.mitglied_kategorie)}${v.mitglied_name ? ': ' + v.mitglied_name : ''}`;
            }

            const zahlungsartBadge = v.zahlungsart === 'bar'
                ? '<span class="badge badge-outline">Bar</span>'
                : '<span class="badge badge-info">POS</span>';

            return `
                <tr class="${v.storniert ? 'storniert' : ''}">
                    <td>${this.formatDate(v.datum)}</td>
                    <td>${v.uhrzeit ? v.uhrzeit.substring(0, 5) : '-'}</td>
                    <td>${typBadge}</td>
                    <td>${beschreibung}</td>
                    <td class="text-center">${v.menge}</td>
                    <td class="text-right">${this.formatCurrency(v.einzelpreis)}</td>
                    <td class="text-right"><strong>${this.formatCurrency(v.gesamtpreis)}</strong></td>
                    <td>${zahlungsartBadge}</td>
                    <td>
                        ${v.storniert
                            ? '<span class="badge badge-danger">Storniert</span>'
                            : `<div class="action-buttons">
                                <button class="btn btn-icon btn-sm" onclick="App.editShopVerkauf(${v.id})" title="Bearbeiten">
                                    <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                                </button>
                                <button class="btn btn-icon btn-sm" onclick="App.stornoShopVerkauf(${v.id})" title="Stornieren">
                                    <img src="icons/12-delete.svg" alt="Storno" class="icon-sm">
                                </button>
                               </div>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    },

    getEintrittKategorieLabel: function(code) {
        const kat = (this.shopEintrittKategorien || []).find(k => k.code === code);
        return kat ? kat.name : code;
    },

    getMitgliedKategorieLabel: function(code) {
        const kat = (this.shopMitgliedKategorien || []).find(k => k.code === code);
        return kat ? kat.name : code;
    },

    showShopVerkaufForm: async function(typ) {
        try {
            const heute = new Date().toISOString().split('T')[0];

            if (typ === 'artikel') {
                // Datum setzen
                const datumEl = document.getElementById('shop-verkauf-artikel-datum');
                if (datumEl) datumEl.value = heute;

                // Artikel-Dropdown befüllen
                const artikel = await DataManager.getShopArtikel() || [];
                const select = document.getElementById('shop-verkauf-artikel-select');
                if (select) {
                    select.innerHTML = '<option value="">-- Artikel wählen --</option>' +
                        artikel.filter(a => (a.bestandAktuell || a.bestand_aktuell || 0) > 0)
                            .map(a => `<option value="${a.id}" data-preis="${a.verkaufspreis || 0}" data-mwst="${a.mwstSatz || a.mwst_satz || '22'}">${a.artikelnr || 'Art.'} - ${a.name} (${a.bestandAktuell || a.bestand_aktuell || 0} Stk.)</option>`)
                            .join('');
                }
                this.openModal('shop-verkauf-artikel-modal');

            } else if (typ === 'eintritt') {
                // Datum setzen
                const datumEl = document.getElementById('shop-verkauf-eintritt-datum');
                if (datumEl) datumEl.value = heute;

                // Tageszeit automatisch basierend auf aktueller Uhrzeit setzen
                const tageszeitEl = document.getElementById('shop-verkauf-eintritt-tageszeit');
                if (tageszeitEl) {
                    const stunde = new Date().getHours();
                    tageszeitEl.value = stunde < 12 ? 'vormittag' : 'nachmittag';
                }

                // Nur aktive Kategorien anzeigen
                const alleKategorien = await DataManager.getEintrittKategorien() || [];
                const kategorien = alleKategorien.filter(k => k.is_active !== false);
                const select = document.getElementById('shop-verkauf-eintritt-kat');
                if (select) {
                    select.innerHTML = '<option value="">-- Kategorie wählen --</option>' +
                        kategorien.map(k => `<option value="${k.code}" data-preis="${k.preis}" data-mwst="${k.mwstSatz || k.mwst_satz || 22}">${k.name} (${this.formatCurrency(k.preis)})</option>`)
                        .join('');
                }
                const mengeEl = document.getElementById('shop-verkauf-eintritt-menge');
                if (mengeEl) mengeEl.value = 1;
                this.openModal('shop-verkauf-eintritt-modal');

            } else if (typ === 'mitglied') {
                // Datum setzen
                const datumEl = document.getElementById('shop-verkauf-mitglied-datum');
                if (datumEl) datumEl.value = heute;

                // Nur aktive Kategorien anzeigen
                const alleKategorien = await DataManager.getMitgliedKategorien() || [];
                const kategorien = alleKategorien.filter(k => k.is_active !== false);
                const select = document.getElementById('shop-verkauf-mitglied-kat');
                if (select) {
                    select.innerHTML = '<option value="">-- Kategorie wählen --</option>' +
                        kategorien.map(k => `<option value="${k.code}" data-betrag="${k.betrag}">${k.name} (${this.formatCurrency(k.betrag)})</option>`)
                        .join('');
                }
                const nameEl = document.getElementById('shop-verkauf-mitglied-name');
                if (nameEl) nameEl.value = '';
                this.openModal('shop-verkauf-mitglied-modal');
            }
        } catch (error) {
            console.error('Fehler in showShopVerkaufForm:', error);
            this.showToast('Fehler', 'Formular konnte nicht geöffnet werden: ' + error.message, 'error');
        }
    },

    onShopArtikelSelect: function() {
        const select = document.getElementById('shop-verkauf-artikel-select');
        const option = select.options[select.selectedIndex];
        if (option && option.value) {
            document.getElementById('shop-verkauf-artikel-preis').value = option.dataset.preis || '';
            document.getElementById('shop-verkauf-artikel-mwst').value = this.getMwstLabel(option.dataset.mwst);
        }
    },

    onEintrittKatSelect: function() {
        const select = document.getElementById('shop-verkauf-eintritt-kat');
        const option = select.options[select.selectedIndex];
        if (option && option.value) {
            document.getElementById('shop-verkauf-eintritt-preis').value = option.dataset.preis || '';
        }
    },

    onMitgliedKatSelect: function() {
        const select = document.getElementById('shop-verkauf-mitglied-kat');
        const option = select.options[select.selectedIndex];
        if (option && option.value) {
            document.getElementById('shop-verkauf-mitglied-betrag').value = option.dataset.betrag || '';
        }
    },

    updateMitgliedBetrag: function() {
        // Legacy - wird durch onMitgliedKatSelect ersetzt
        this.onMitgliedKatSelect();
    },

    saveShopVerkaufArtikel: async function() {
        const form = document.getElementById('shop-verkauf-artikel-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const datum = document.getElementById('shop-verkauf-artikel-datum').value;
        const artikelId = document.getElementById('shop-verkauf-artikel-select').value;
        const menge = parseInt(document.getElementById('shop-verkauf-artikel-menge').value) || 1;
        const einzelpreis = parseFloat(document.getElementById('shop-verkauf-artikel-preis').value) || 0;
        const zahlungsart = document.getElementById('shop-verkauf-artikel-zahlung')?.value || 'bar';

        const select = document.getElementById('shop-verkauf-artikel-select');
        const option = select.options[select.selectedIndex];
        const mwstSatz = option?.dataset.mwst || '22';

        if (!artikelId) {
            this.showToast('Fehler', 'Bitte wählen Sie einen Artikel', 'error');
            return;
        }

        const daten = {
            typ: 'artikel',
            datum: datum,
            artikel_id: parseInt(artikelId),
            menge: menge,
            einzelpreis: einzelpreis,
            mwst_satz: mwstSatz,
            gesamtpreis: menge * einzelpreis,
            zahlungsart: zahlungsart
        };

        try {
            if (editId) {
                await DataManager.updateShopVerkauf(editId, daten);
                this.showToast('Erfolg', 'Verkauf aktualisiert', 'success');
            } else {
                await DataManager.addShopVerkauf(daten);
                this.showToast('Erfolg', 'Verkauf erfasst', 'success');
            }

            if (form) delete form.dataset.editId;
            this.closeModal('shop-verkauf-artikel-modal');
            await this.loadShopVerkaeufe();
            await this.loadShopStatistiken();
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Verkauf konnte nicht erfasst werden', 'error');
        }
    },

    saveShopVerkaufEintritt: async function() {
        const form = document.getElementById('shop-verkauf-eintritt-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const datum = document.getElementById('shop-verkauf-eintritt-datum').value;
        const tageszeit = document.getElementById('shop-verkauf-eintritt-tageszeit')?.value || 'vormittag';
        const select = document.getElementById('shop-verkauf-eintritt-kat');
        const option = select.options[select.selectedIndex];
        const kategorie = select.value;
        const preis = parseFloat(document.getElementById('shop-verkauf-eintritt-preis')?.value) || parseFloat(option?.dataset.preis) || 0;
        const mwstSatz = option?.dataset.mwst || '22';
        const menge = parseInt(document.getElementById('shop-verkauf-eintritt-menge').value) || 1;
        const zahlungsart = document.getElementById('shop-verkauf-eintritt-zahlung')?.value || 'bar';

        const daten = {
            typ: 'eintritt',
            datum: datum,
            tageszeit: tageszeit,
            eintritt_kategorie: kategorie,
            menge: menge,
            einzelpreis: preis,
            mwst_satz: mwstSatz,
            gesamtpreis: menge * preis,
            zahlungsart: zahlungsart
        };

        try {
            if (editId) {
                await DataManager.updateShopVerkauf(editId, daten);
                this.showToast('Erfolg', 'Eintritt aktualisiert', 'success');
            } else {
                await DataManager.addShopVerkauf(daten);
                this.showToast('Erfolg', 'Eintritt erfasst', 'success');
            }

            if (form) delete form.dataset.editId;
            this.closeModal('shop-verkauf-eintritt-modal');
            await this.loadShopVerkaeufe();
            await this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Eintritt konnte nicht erfasst werden', 'error');
        }
    },

    saveShopVerkaufMitglied: async function() {
        const form = document.getElementById('shop-verkauf-mitglied-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const datum = document.getElementById('shop-verkauf-mitglied-datum').value;
        const select = document.getElementById('shop-verkauf-mitglied-kat');
        const option = select.options[select.selectedIndex];
        const kategorie = select.value;
        const betrag = parseFloat(document.getElementById('shop-verkauf-mitglied-betrag')?.value) || parseFloat(option?.dataset.betrag) || 0;
        const name = document.getElementById('shop-verkauf-mitglied-name').value.trim();
        const zahlungsart = document.getElementById('shop-verkauf-mitglied-zahlung')?.value || 'bar';

        const daten = {
            typ: 'mitglied',
            datum: datum,
            mitglied_kategorie: kategorie,
            mitglied_name: name,
            menge: 1,
            einzelpreis: betrag,
            mwst_satz: null,
            gesamtpreis: betrag,
            zahlungsart: zahlungsart
        };

        try {
            if (editId) {
                await DataManager.updateShopVerkauf(editId, daten);
                this.showToast('Erfolg', 'Mitgliedsbeitrag aktualisiert', 'success');
            } else {
                await DataManager.addShopVerkauf(daten);
                this.showToast('Erfolg', 'Mitgliedsbeitrag erfasst', 'success');
            }

            if (form) delete form.dataset.editId;
            this.closeModal('shop-verkauf-mitglied-modal');
            await this.loadShopVerkaeufe();
            await this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Mitgliedsbeitrag konnte nicht erfasst werden', 'error');
        }
    },

    stornoShopVerkauf: async function(id) {
        if (!confirm('Möchten Sie diesen Verkauf wirklich stornieren?')) return;

        try {
            await DataManager.stornoShopVerkauf(id);
            this.showToast('Erfolg', 'Verkauf storniert', 'success');
            await this.loadShopVerkaeufe();
            await this.loadShopStatistiken();
            await this.loadShopInventar(); // Bestand zurückgeben
        } catch (error) {
            console.error('Fehler beim Stornieren:', error);
            this.showToast('Fehler', 'Storno fehlgeschlagen', 'error');
        }
    },

    editShopVerkauf: async function(id) {
        // Verkauf direkt aus Supabase laden
        const verkauf = await DataManager.getShopVerkaufById(id);
        if (!verkauf) {
            this.showToast('Fehler', 'Verkauf nicht gefunden', 'error');
            return;
        }

        // Je nach Typ das entsprechende Formular öffnen
        if (verkauf.typ === 'artikel') {
            await this.showShopVerkaufForm('artikel');
            setTimeout(() => {
                document.getElementById('shop-verkauf-artikel-datum').value = verkauf.datum || '';
                document.getElementById('shop-verkauf-artikel-select').value = verkauf.artikel_id || verkauf.artikelId || '';
                document.getElementById('shop-verkauf-artikel-menge').value = verkauf.menge || 1;
                document.getElementById('shop-verkauf-artikel-preis').value = verkauf.einzelpreis || '';
                document.getElementById('shop-verkauf-artikel-zahlung').value = verkauf.zahlungsart || 'bar';
                document.getElementById('shop-verkauf-artikel-form').dataset.editId = id;
            }, 100);

        } else if (verkauf.typ === 'eintritt') {
            await this.showShopVerkaufForm('eintritt');
            setTimeout(() => {
                document.getElementById('shop-verkauf-eintritt-datum').value = verkauf.datum || '';
                document.getElementById('shop-verkauf-eintritt-tageszeit').value = verkauf.tageszeit || 'vormittag';
                document.getElementById('shop-verkauf-eintritt-kat').value = verkauf.eintritt_kategorie || '';
                document.getElementById('shop-verkauf-eintritt-menge').value = verkauf.menge || 1;
                document.getElementById('shop-verkauf-eintritt-preis').value = verkauf.einzelpreis || '';
                document.getElementById('shop-verkauf-eintritt-zahlung').value = verkauf.zahlungsart || 'bar';
                document.getElementById('shop-verkauf-eintritt-form').dataset.editId = id;
            }, 100);

        } else if (verkauf.typ === 'mitglied') {
            await this.showShopVerkaufForm('mitglied');
            setTimeout(() => {
                document.getElementById('shop-verkauf-mitglied-datum').value = verkauf.datum || '';
                document.getElementById('shop-verkauf-mitglied-kat').value = verkauf.mitglied_kategorie || '';
                document.getElementById('shop-verkauf-mitglied-name').value = verkauf.mitglied_name || '';
                document.getElementById('shop-verkauf-mitglied-betrag').value = verkauf.einzelpreis || '';
                document.getElementById('shop-verkauf-mitglied-zahlung').value = verkauf.zahlungsart || 'bar';
                document.getElementById('shop-verkauf-mitglied-form').dataset.editId = id;
            }, 100);
        }
    },

    // ---- EINKÄUFE ----

    loadShopEinkaeufe: async function() {
        try {
            const einkaeufe = await DataManager.getShopEinkaeufe();
            const artikel = await DataManager.getShopArtikel() || [];
            this.renderShopEinkaeufeTabelle(einkaeufe, artikel);
        } catch (error) {
            console.error('Fehler beim Laden der Einkäufe:', error);
        }
    },

    renderShopEinkaeufeTabelle: function(einkaeufe, artikel) {
        const tbody = document.getElementById('shop-einkaeufe-table-body');
        if (!tbody) return;

        if (einkaeufe.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
                        Keine Einkäufe vorhanden.
                    </td>
                </tr>
            `;
            return;
        }

        // Artikel als Parameter erhalten
        const artikelListe = artikel || [];

        tbody.innerHTML = einkaeufe.map(e => {
            // Artikel-ID kann artikelId oder artikel_id sein
            const artId = e.artikelId || e.artikel_id;
            const art = artikelListe.find(a => a.id === artId);
            const artikelName = art ? art.name : (e.artikel_name || `Artikel #${artId}`);

            return `
                <tr>
                    <td>${this.formatDate(e.datum)}</td>
                    <td>${artikelName}</td>
                    <td class="text-center">${e.menge}</td>
                    <td class="text-right">${e.einzelpreis ? this.formatCurrency(e.einzelpreis) : '-'}</td>
                    <td class="text-right"><strong>${e.gesamtpreis ? this.formatCurrency(e.gesamtpreis) : '-'}</strong></td>
                    <td>${e.lieferantName || e.lieferant_name || '-'}</td>
                    <td>${e.rechnungNr || e.rechnung_nr || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-icon btn-sm" onclick="App.editShopEinkauf(${e.id})" title="Bearbeiten">
                                <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                            </button>
                            <button class="btn btn-icon btn-sm" onclick="App.deleteShopEinkauf(${e.id})" title="Löschen">
                                <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showShopEinkaufForm: async function() {
        const artikel = await DataManager.getShopArtikel() || [];
        const select = document.getElementById('shop-einkauf-artikel');
        if (select) {
            select.innerHTML = '<option value="">-- Artikel wählen --</option>' +
                artikel.map(a => `<option value="${a.id}">${a.artikelnr || 'Art.'} - ${a.name}</option>`).join('');
        }

        const form = document.getElementById('shop-einkauf-form');
        if (form) form.reset();

        const datumEl = document.getElementById('shop-einkauf-datum');
        if (datumEl) datumEl.value = new Date().toISOString().split('T')[0];

        this.openModal('shop-einkauf-form-modal');
    },

    saveShopEinkauf: async function(event) {
        if (event) event.preventDefault();

        const form = document.getElementById('shop-einkauf-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const artikelId = document.getElementById('shop-einkauf-artikel').value;
        const datum = document.getElementById('shop-einkauf-datum').value;
        const menge = parseInt(document.getElementById('shop-einkauf-menge').value) || 0;
        const einzelpreis = parseFloat(document.getElementById('shop-einkauf-preis').value) || null;
        const lieferant = document.getElementById('shop-einkauf-lieferant').value.trim();
        const rechnungNr = document.getElementById('shop-einkauf-rechnung').value.trim();
        const notizen = document.getElementById('shop-einkauf-notizen').value.trim();

        if (!artikelId || !menge) {
            this.showToast('Fehler', 'Artikel und Menge sind Pflichtfelder', 'error');
            return;
        }

        try {
            if (editId) {
                // Update bestehenden Einkauf
                await DataManager.updateShopEinkauf(editId, {
                    artikelId: parseInt(artikelId),
                    datum: datum,
                    menge: menge,
                    einzelpreis: einzelpreis,
                    gesamtpreis: einzelpreis ? menge * einzelpreis : null,
                    lieferantName: lieferant,
                    rechnungNr: rechnungNr,
                    notizen: notizen
                });
                this.showToast('Erfolg', 'Einkauf aktualisiert', 'success');
            } else {
                // Neuen Einkauf anlegen
                await DataManager.addShopEinkauf({
                    artikelId: parseInt(artikelId),
                    datum: datum,
                    menge: menge,
                    einzelpreis: einzelpreis,
                    gesamtpreis: einzelpreis ? menge * einzelpreis : null,
                    lieferantName: lieferant,
                    rechnungNr: rechnungNr,
                    notizen: notizen
                });
                this.showToast('Erfolg', 'Einkauf erfasst', 'success');
            }

            // Edit-ID zurücksetzen
            if (form) delete form.dataset.editId;

            this.closeModal('shop-einkauf-form-modal');
            await this.loadShopEinkaeufe();
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Einkauf konnte nicht erfasst werden', 'error');
        }
    },

    editShopEinkauf: async function(id) {
        const einkaeufe = await DataManager.getShopEinkaeufe() || [];
        const einkauf = einkaeufe.find(e => e.id === id);
        if (!einkauf) {
            this.showToast('Fehler', 'Einkauf nicht gefunden', 'error');
            return;
        }

        // Formular befüllen
        await this.showShopEinkaufForm();

        // Werte setzen
        document.getElementById('shop-einkauf-datum').value = einkauf.datum || '';
        document.getElementById('shop-einkauf-artikel').value = einkauf.artikelId || einkauf.artikel_id || '';
        document.getElementById('shop-einkauf-menge').value = einkauf.menge || '';
        document.getElementById('shop-einkauf-preis').value = einkauf.einzelpreis || '';
        document.getElementById('shop-einkauf-lieferant').value = einkauf.lieferantName || einkauf.lieferant_name || '';
        document.getElementById('shop-einkauf-rechnung').value = einkauf.rechnungNr || einkauf.rechnung_nr || '';
        document.getElementById('shop-einkauf-notizen').value = einkauf.notizen || '';

        // ID speichern für Update
        document.getElementById('shop-einkauf-form').dataset.editId = id;
    },

    deleteShopEinkauf: async function(id) {
        if (!confirm('Möchten Sie diesen Einkauf wirklich löschen? Der Bestand wird entsprechend angepasst.')) return;

        try {
            await DataManager.deleteShopEinkauf(id);
            this.showToast('Erfolg', 'Einkauf gelöscht', 'success');
            await this.loadShopEinkaeufe();
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showToast('Fehler', 'Einkauf konnte nicht gelöscht werden', 'error');
        }
    },

    // ---- SHOP RECHNUNGEN ----

    loadShopRechnungen: async function() {
        const statusFilter = document.getElementById('shop-rechnungen-filter-status')?.value || '';
        const typFilter = document.getElementById('shop-rechnungen-filter-typ')?.value || '';

        // Alle Rechnungen laden (DATEV-Buchungen mit Status)
        const alleRechnungen = await DataManager.getRechnungenMitStatus() || [];
        const einkaeufe = await DataManager.getShopEinkaeufe() || [];

        console.log('📋 Shop-Rechnungen: Alle Rechnungen geladen:', alleRechnungen.length);

        // Nach projekt_id = '2699' filtern (Shop-Kostenstelle)
        let shopRechnungen = alleRechnungen.filter(r => {
            const projektId = String(r.projektId || r.projekt_id || '');
            return projektId === '2699';
        });

        console.log('📋 Shop-Rechnungen gefiltert:', shopRechnungen.length);

        // Status-Filter
        if (statusFilter) {
            shopRechnungen = shopRechnungen.filter(r => {
                const status = DataManager.getRechnungStatus ? DataManager.getRechnungStatus(r.id) : {};
                if (statusFilter === 'offen') return !status.kontrolliert && !status.bezahlt;
                if (statusFilter === 'kontrolliert') return status.kontrolliert && !status.bezahlt;
                if (statusFilter === 'bezahlt') return status.bezahlt;
                return true;
            });
        }

        // Typ-Filter (Eingang/Ausgang basierend auf Betrag oder Typ)
        if (typFilter) {
            shopRechnungen = shopRechnungen.filter(r => {
                const istEingang = (r.typ === 'eingang') || (r.betrag < 0) || (r.art === 'Ausgabe');
                if (typFilter === 'eingang') return istEingang;
                if (typFilter === 'ausgang') return !istEingang;
                return true;
            });
        }

        // Nach Datum sortieren (neueste zuerst)
        shopRechnungen.sort((a, b) => new Date(b.datum || b.date) - new Date(a.datum || a.date));

        const tbody = document.getElementById('shop-rechnungen-table-body');
        if (!tbody) return;

        if (shopRechnungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Keine Rechnungen für Shop gefunden</td></tr>';
            return;
        }

        tbody.innerHTML = shopRechnungen.map(r => {
            const status = DataManager.getRechnungStatus ? DataManager.getRechnungStatus(r.id) : {};
            const betrag = r.betrag || r.amount || 0;
            const datum = r.datum || r.date || '';
            const lieferant = r.lieferant || r.kreditor || r.partner || '-';
            const beschreibung = r.beschreibung || r.text || r.verwendungszweck || '-';

            // Verknüpften Einkauf finden
            const verknuepfterEinkauf = einkaeufe.find(e => e.rechnungId === r.id || e.rechnungNr === r.rechnungsnummer);

            let statusBadge = '<span class="badge">Offen</span>';
            if (status.bezahlt) {
                statusBadge = '<span class="badge badge-success">Bezahlt</span>';
            } else if (status.kontrolliert) {
                statusBadge = '<span class="badge badge-warning">Kontrolliert</span>';
            }

            return `
                <tr>
                    <td>${this.formatDate(datum)}</td>
                    <td>${lieferant}</td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${beschreibung}</td>
                    <td style="text-align: right; ${betrag < 0 ? 'color: var(--error-color);' : ''}">${this.formatCurrency(Math.abs(betrag))}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                    <td>
                        ${verknuepfterEinkauf
                            ? `<span class="badge badge-info">Einkauf #${verknuepfterEinkauf.id}</span>`
                            : `<button class="btn btn-outline btn-sm" onclick="App.verknuepfeRechnungMitEinkauf('${r.id}')">Verknüpfen</button>`
                        }
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.25rem;">
                            ${!status.kontrolliert ? `<button class="btn btn-outline btn-sm" onclick="App.setShopRechnungKontrolliert('${r.id}')" title="Als kontrolliert markieren">✓</button>` : ''}
                            ${!status.bezahlt ? `<button class="btn btn-outline btn-sm" onclick="App.setShopRechnungBezahlt('${r.id}')" title="Als bezahlt markieren">€</button>` : ''}
                            ${r.pdfExists || r.filePath ? `<button class="btn btn-outline btn-sm" onclick="App.showPdfPreview('${r.partitaIva || ''}', '${r.dokumentNr || ''}', '${r.filePath || ''}')" title="PDF anzeigen">👁</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    setShopRechnungKontrolliert: function(rechnungId) {
        if (DataManager.setRechnungStatus) {
            DataManager.setRechnungStatus(rechnungId, { kontrolliert: true, kontrolliertAt: new Date().toISOString() });
            this.showToast('Erfolg', 'Rechnung als kontrolliert markiert', 'success');
            this.loadShopRechnungen();
        }
    },

    setShopRechnungBezahlt: function(rechnungId) {
        if (DataManager.setRechnungStatus) {
            DataManager.setRechnungStatus(rechnungId, { bezahlt: true, bezahltAt: new Date().toISOString() });
            this.showToast('Erfolg', 'Rechnung als bezahlt markiert', 'success');
            this.loadShopRechnungen();
        }
    },

    // Shop-Rechnungs-Details anzeigen
    showRechnungDetails: async function(rechnungId) {
        try {
            // Rechnung aus Cache oder DB holen
            const alleRechnungen = await DataManager.getRechnungenMitStatus() || [];
            const rechnung = alleRechnungen.find(r => String(r.id) === String(rechnungId));

            if (!rechnung) {
                this.showToast('Fehler', 'Rechnung nicht gefunden', 'error');
                return;
            }

            const status = DataManager.getRechnungStatus ? DataManager.getRechnungStatus(rechnungId) : {};
            const betrag = rechnung.betrag || rechnung.betragNetto || 0;

            // Prüfe ob PDF vorhanden ist
            const hasPdf = rechnung.pdfExists || rechnung.filePath || rechnung.pdfUrl;
            const partitaIva = rechnung.partitaIva || rechnung.partita_iva || '';
            const dokumentNr = rechnung.dokumentNr || rechnung.dokument_nr || '';
            const filePath = rechnung.filePath || '';

            // Modal-Inhalt generieren
            const content = document.getElementById('shop-rechnung-details-content');
            content.innerHTML = `
                <div class="details-grid" style="display: grid; gap: 1rem;">
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Lieferant</span>
                        <strong>${rechnung.fornitoreName || rechnung.fornitore_name || 'Unbekannt'}</strong>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Partita IVA</span>
                        <span>${partitaIva || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Dokument-Nr.</span>
                        <span>${dokumentNr || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Datum</span>
                        <span>${this.formatDate(rechnung.datum)}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Betrag (Netto)</span>
                        <strong style="${betrag < 0 ? 'color: var(--error-color);' : ''}">${this.formatCurrency(betrag)}</strong>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Projekt-ID</span>
                        <span>${rechnung.projektId || rechnung.projekt_id || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Beschreibung</span>
                        <span>${rechnung.beschreibung || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Status</span>
                        <span>
                            ${status.bezahlt ? '<span class="badge badge-success">Bezahlt</span>' :
                              status.kontrolliert ? '<span class="badge badge-warning">Kontrolliert</span>' :
                              '<span class="badge badge-secondary">Offen</span>'}
                        </span>
                    </div>
                    ${hasPdf ? `
                    <div class="detail-row" style="padding: 0.5rem 0;">
                        <button onclick="App.closeModal('shop-rechnung-details-modal'); App.showPdfPreview('${partitaIva}', '${dokumentNr}', '${filePath}')" class="btn btn-primary" style="width: 100%;">
                            PDF anzeigen
                        </button>
                    </div>` : `
                    <div class="detail-row" style="padding: 0.5rem 0; text-align: center; color: var(--text-secondary);">
                        <em>Kein PDF vorhanden</em>
                    </div>`}
                </div>
            `;

            this.showModal('shop-rechnung-details-modal');
        } catch (error) {
            console.error('Fehler beim Laden der Rechnungsdetails:', error);
            this.showToast('Fehler', 'Rechnungsdetails konnten nicht geladen werden', 'error');
        }
    },

    // Verknüpfungs-Modal für Einkäufe anzeigen
    verknuepfeRechnungMitEinkauf: async function(rechnungId) {
        try {
            // Rechnung laden
            const alleRechnungen = await DataManager.getRechnungenMitStatus() || [];
            const rechnung = alleRechnungen.find(r => String(r.id) === String(rechnungId));

            if (!rechnung) {
                this.showToast('Fehler', 'Rechnung nicht gefunden', 'error');
                return;
            }

            // Einkäufe und Artikel laden
            const einkaeufe = await DataManager.getShopEinkaeufe() || [];
            const artikel = await DataManager.getShopArtikel() || [];
            const unverknuepft = einkaeufe.filter(e => !e.rechnungId && !e.rechnung_id);

            if (unverknuepft.length === 0) {
                this.showToast('Info', 'Keine unverknüpften Einkäufe vorhanden', 'info');
                return;
            }

            // Rechnungs-Info anzeigen
            const rechnungInfo = document.getElementById('shop-verknuepfung-rechnung-info');
            const betrag = rechnung.betrag || rechnung.betragNetto || 0;
            rechnungInfo.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${rechnung.fornitoreName || rechnung.fornitore_name || 'Unbekannt'}</strong>
                        <br><small style="color: var(--text-secondary);">${rechnung.dokumentNr || rechnung.dokument_nr || ''} - ${this.formatDate(rechnung.datum)}</small>
                    </div>
                    <div style="text-align: right;">
                        <strong style="${betrag < 0 ? 'color: var(--error-color);' : ''}">${this.formatCurrency(Math.abs(betrag))}</strong>
                    </div>
                </div>
            `;

            // Einkäufe-Liste generieren
            const liste = document.getElementById('shop-verknuepfung-einkaeufe-liste');
            liste.innerHTML = unverknuepft.map(e => {
                const art = artikel.find(a => a.id === (e.artikelId || e.artikel_id));
                const einkaufBetrag = (e.einzelpreis || e.preis || 0) * (e.menge || 1);
                return `
                    <div class="einkauf-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;"
                         onclick="App.doVerknuepfung('${rechnungId}', ${e.id})"
                         onmouseover="this.style.background='var(--bg-tertiary)'"
                         onmouseout="this.style.background='var(--bg-secondary)'">
                        <div>
                            <strong>${art?.name || 'Unbekannt'}</strong>
                            <br><small style="color: var(--text-secondary);">${e.menge || 1}x - ${this.formatDate(e.datum)}</small>
                        </div>
                        <div style="text-align: right;">
                            <strong>${this.formatCurrency(einkaufBetrag)}</strong>
                            <br><button class="btn btn-primary btn-sm">Verknüpfen</button>
                        </div>
                    </div>
                `;
            }).join('');

            this.showModal('shop-einkauf-verknuepfung-modal');
        } catch (error) {
            console.error('Fehler beim Öffnen des Verknüpfungs-Modals:', error);
            this.showToast('Fehler', 'Modal konnte nicht geöffnet werden', 'error');
        }
    },

    // Verknüpfung durchführen (wird vom Modal aufgerufen)
    doVerknuepfung: async function(rechnungId, einkaufId) {
        try {
            const einkaeufe = await DataManager.getShopEinkaeufe() || [];
            const einkauf = einkaeufe.find(e => e.id === einkaufId);

            if (einkauf) {
                einkauf.rechnungId = rechnungId;
                einkauf.rechnung_id = rechnungId;
                await DataManager.updateShopEinkauf(einkauf.id, einkauf);

                this.closeModal('shop-einkauf-verknuepfung-modal');
                this.showToast('Erfolg', 'Rechnung mit Einkauf verknüpft', 'success');
                await this.loadShopRechnungen();
                await this.loadShopEinkaeufe();
            }
        } catch (error) {
            console.error('Fehler beim Verknüpfen:', error);
            this.showToast('Fehler', 'Verknüpfung fehlgeschlagen', 'error');
        }
    },

    // ---- KASSE ----

    loadShopKasse: async function() {
        try {
            // Datum aus Datepicker oder heute
            const datumInput = document.getElementById('shop-kasse-datum');
            const datum = datumInput?.value || new Date().toISOString().split('T')[0];
            if (datumInput && !datumInput.value) datumInput.value = datum;

            const saldo = await DataManager.berechneKassensaldo(datum);
            const mwst = await DataManager.getMwstAufschluesselung(datum);
            const kassenBewegungen = await DataManager.getKassenBewegungen(datum);
            const verkaeufe = DataManager.getShopVerkaeufe(datum) || [];

            // Kassen-Übersicht (IDs ohne shop- Präfix)
            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = this.formatCurrency(val || 0); };

            setEl('kasse-anfang', saldo.anfangsbestandBar);
            setEl('kasse-einnahmen-bar', saldo.einnahmenBar);
            setEl('kasse-einlagen', saldo.einlagenBar || 0);
            setEl('kasse-ausgaenge', saldo.ausgaengeBar);
            setEl('kasse-saldo-soll', saldo.endbestandBarSoll);
            setEl('kasse-einnahmen-pos', saldo.einnahmenPos);
            setEl('kasse-gesamt', saldo.einnahmenGesamt || ((saldo.einnahmenBar || 0) + (saldo.einnahmenPos || 0)));

            // MwSt-Aufschlüsselung (mwst gibt Objekte mit brutto/netto/mwst zurück)
            const mwstTable = document.getElementById('kasse-mwst-table');
            if (mwstTable) {
                const m4 = mwst['4'] || { netto: 0, mwst: 0, brutto: 0 };
                const m22 = mwst['22'] || { netto: 0, mwst: 0, brutto: 0 };
                const m74 = mwst['art74'] || { netto: 0, mwst: 0, brutto: 0 };
                mwstTable.innerHTML = `
                    <tr>
                        <td>4% (Bücher)</td>
                        <td class="text-right">${this.formatCurrency(m4.netto || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m4.mwst || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m4.brutto || 0)}</td>
                    </tr>
                    <tr>
                        <td>22% (Standard)</td>
                        <td class="text-right">${this.formatCurrency(m22.netto || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m22.mwst || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m22.brutto || 0)}</td>
                    </tr>
                    <tr>
                        <td>Art. 74 (Marge)</td>
                        <td class="text-right">${this.formatCurrency(m74.netto || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m74.mwst || 0)}</td>
                        <td class="text-right">${this.formatCurrency(m74.brutto || 0)}</td>
                    </tr>
                `;
            }

            // Alle Bewegungen zusammenführen (Verkäufe + Entnahmen/Einlagen)
            const alleBewegungen = this.erstelleKassenBewegungsListe(verkaeufe, kassenBewegungen);
            this.renderKassenBewegungen(alleBewegungen);

        } catch (error) {
            console.error('Fehler beim Laden der Kasse:', error);
        }
    },

    erstelleKassenBewegungsListe: function(verkaeufe, kassenBewegungen) {
        const bewegungen = [];

        // Verkäufe hinzufügen
        verkaeufe.forEach(v => {
            if (v.storniert) return;

            let beschreibung = '';
            if (v.typ === 'artikel') {
                beschreibung = v.artikel_name || `Artikel #${v.artikel_id}`;
            } else if (v.typ === 'eintritt') {
                beschreibung = this.getEintrittKategorieLabel(v.eintritt_kategorie);
            } else if (v.typ === 'mitglied') {
                beschreibung = `Mitglied: ${v.mitglied_name || this.getMitgliedKategorieLabel(v.mitglied_kategorie)}`;
            }

            bewegungen.push({
                id: v.id,
                typ: 'verkauf',
                subtyp: v.typ,
                uhrzeit: v.uhrzeit,
                betrag: v.gesamtpreis || 0,
                grund: beschreibung,
                zahlungsart: v.zahlungsart,
                isVerkauf: true
            });
        });

        // Kassen-Bewegungen hinzufügen
        kassenBewegungen.forEach(b => {
            bewegungen.push({
                ...b,
                isVerkauf: false
            });
        });

        // Nach Uhrzeit sortieren
        return bewegungen.sort((a, b) => (a.uhrzeit || '').localeCompare(b.uhrzeit || ''));
    },

    renderKassenBewegungen: function(bewegungen) {
        const tbody = document.getElementById('kasse-bewegungen-table');
        if (!tbody) return;

        if (bewegungen.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">Keine Bewegungen an diesem Tag</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bewegungen.map(b => {
            let typLabel, typClass, aktionen;

            if (b.isVerkauf) {
                // Verkauf
                if (b.subtyp === 'eintritt') {
                    typLabel = 'Eintritt';
                    typClass = 'badge-success';
                } else if (b.subtyp === 'artikel') {
                    typLabel = 'Artikel';
                    typClass = 'badge-primary';
                } else if (b.subtyp === 'mitglied') {
                    typLabel = 'Mitglied';
                    typClass = 'badge-warning';
                } else {
                    typLabel = 'Verkauf';
                    typClass = 'badge-success';
                }
                // Zahlungsart anzeigen
                const zahlBadge = b.zahlungsart === 'bar' ? '' : ' <span class="badge badge-info">POS</span>';
                aktionen = `<button class="btn btn-icon btn-sm" onclick="App.editShopVerkauf(${b.id})" title="Bearbeiten">
                                <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                            </button>
                            <button class="btn btn-icon btn-sm" onclick="App.stornoShopVerkauf(${b.id})" title="Stornieren">
                                <img src="icons/12-delete.svg" alt="Storno" class="icon-sm">
                            </button>${zahlBadge}`;
            } else {
                // Entnahme/Einlage
                typLabel = b.typ === 'entnahme' ? 'Entnahme' : (b.typ === 'einlage' ? 'Einlage' : 'Korrektur');
                typClass = b.typ === 'entnahme' ? 'badge-danger' : 'badge-info';
                aktionen = b.storniert
                    ? '<span class="badge badge-outline">Storniert</span>'
                    : `<button class="btn btn-icon btn-sm" onclick="App.editKassenBewegung(${b.id})" title="Bearbeiten">
                            <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="App.deleteKassenBewegung(${b.id})" title="Löschen">
                            <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                        </button>`;
            }

            const storniert = b.storniert ? 'storniert' : '';
            const betragClass = b.betrag < 0 ? 'text-danger' : 'text-success';

            return `
                <tr class="${storniert}">
                    <td>${b.uhrzeit ? b.uhrzeit.substring(0, 5) : '-'}</td>
                    <td><span class="badge ${typClass}">${typLabel}</span></td>
                    <td class="text-right ${betragClass}">${b.betrag < 0 ? '-' : '+'}${this.formatCurrency(Math.abs(b.betrag))}</td>
                    <td>${b.grund || '-'}</td>
                    <td>${b.createdByName || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            ${aktionen}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showKassenEntnahmeForm: function() {
        const form = document.getElementById('shop-kassen-entnahme-form');
        if (form) form.reset();
        // Datum auf heute setzen
        const datumEl = document.getElementById('shop-entnahme-datum');
        if (datumEl) datumEl.value = new Date().toISOString().split('T')[0];
        this.openModal('shop-kassen-entnahme-modal');
    },

    saveKassenEntnahme: function(event) {
        if (event) event.preventDefault();

        const form = document.getElementById('shop-kassen-entnahme-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const datum = document.getElementById('shop-entnahme-datum').value;
        const betrag = parseFloat(document.getElementById('shop-entnahme-betrag').value) || 0;
        const grund = document.getElementById('shop-entnahme-grund').value.trim();

        if (betrag <= 0) {
            this.showToast('Fehler', 'Bitte geben Sie einen Betrag ein', 'error');
            return;
        }

        try {
            if (editId) {
                DataManager.updateKassenBewegung(editId, { betrag: -Math.abs(betrag), grund, datum });
                this.showToast('Erfolg', 'Entnahme aktualisiert', 'success');
            } else {
                DataManager.addKassenEntnahme(betrag, grund, datum);
                this.showToast('Erfolg', 'Entnahme erfasst', 'success');
            }
            if (form) delete form.dataset.editId;
            this.closeModal('shop-kassen-entnahme-modal');
            this.loadShopKasse();
            this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Entnahme fehlgeschlagen', 'error');
        }
    },

    showKassenEinlageForm: function() {
        const form = document.getElementById('shop-kassen-einlage-form');
        if (form) form.reset();
        // Datum auf heute setzen
        const datumEl = document.getElementById('shop-einlage-datum');
        if (datumEl) datumEl.value = new Date().toISOString().split('T')[0];
        this.openModal('shop-kassen-einlage-modal');
    },

    saveKassenEinlage: function(event) {
        if (event) event.preventDefault();

        const form = document.getElementById('shop-kassen-einlage-form');
        const editId = form?.dataset.editId ? parseInt(form.dataset.editId) : null;

        const datum = document.getElementById('shop-einlage-datum').value;
        const betrag = parseFloat(document.getElementById('shop-einlage-betrag').value) || 0;
        const grund = document.getElementById('shop-einlage-grund').value.trim();

        if (betrag <= 0) {
            this.showToast('Fehler', 'Bitte geben Sie einen Betrag ein', 'error');
            return;
        }

        try {
            if (editId) {
                DataManager.updateKassenBewegung(editId, { betrag, grund, datum });
                this.showToast('Erfolg', 'Einlage aktualisiert', 'success');
            } else {
                DataManager.addKassenEinlage(betrag, grund, datum);
                this.showToast('Erfolg', 'Einlage erfasst', 'success');
            }
            if (form) delete form.dataset.editId;
            this.closeModal('shop-kassen-einlage-modal');
            this.loadShopKasse();
            this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Einlage fehlgeschlagen', 'error');
        }
    },

    editKassenBewegung: function(id) {
        const bewegungen = DataManager.getAllKassenBewegungen ? DataManager.getAllKassenBewegungen() : [];
        const bewegung = bewegungen.find(b => b.id === id);
        if (!bewegung) {
            this.showToast('Fehler', 'Bewegung nicht gefunden', 'error');
            return;
        }

        if (bewegung.typ === 'entnahme') {
            this.showKassenEntnahmeForm();
            setTimeout(() => {
                document.getElementById('shop-entnahme-datum').value = bewegung.datum || '';
                document.getElementById('shop-entnahme-betrag').value = Math.abs(bewegung.betrag) || '';
                document.getElementById('shop-entnahme-grund').value = bewegung.grund || '';
                document.getElementById('shop-kassen-entnahme-form').dataset.editId = id;
            }, 100);
        } else if (bewegung.typ === 'einlage') {
            this.showKassenEinlageForm();
            setTimeout(() => {
                document.getElementById('shop-einlage-datum').value = bewegung.datum || '';
                document.getElementById('shop-einlage-betrag').value = Math.abs(bewegung.betrag) || '';
                document.getElementById('shop-einlage-grund').value = bewegung.grund || '';
                document.getElementById('shop-kassen-einlage-form').dataset.editId = id;
            }, 100);
        }
    },

    deleteKassenBewegung: async function(id) {
        if (!confirm('Möchten Sie diese Kassen-Bewegung wirklich löschen?')) return;

        try {
            await DataManager.deleteKassenBewegung(id);
            this.showToast('Erfolg', 'Bewegung gelöscht', 'success');
            await this.loadShopKasse();
            await this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Löschen fehlgeschlagen', 'error');
        }
    },

    // Alias für HTML ohne "Shop" Präfix
    loadKasse: function() {
        return this.loadShopKasse();
    },

    showAnfangsbestandForm: function() {
        const form = document.getElementById('shop-anfangsbestand-form');
        if (form) form.reset();

        // Datum aus aktueller Kassen-Ansicht übernehmen
        const kasseDatum = document.getElementById('shop-kasse-datum')?.value || new Date().toISOString().split('T')[0];
        document.getElementById('shop-anfangsbestand-datum').value = kasseDatum;

        // Aktuellen Anfangsbestand als Vorschlag
        const aktuellerBestand = document.getElementById('kasse-anfang')?.textContent;
        if (aktuellerBestand) {
            const betrag = parseFloat(aktuellerBestand.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            document.getElementById('shop-anfangsbestand-betrag').value = betrag.toFixed(2);
        }

        this.openModal('shop-anfangsbestand-modal');
    },

    saveAnfangsbestand: async function(event) {
        if (event) event.preventDefault();

        const datum = document.getElementById('shop-anfangsbestand-datum').value;
        const betrag = parseFloat(document.getElementById('shop-anfangsbestand-betrag').value) || 0;

        if (!datum) {
            this.showToast('Fehler', 'Bitte Datum eingeben', 'error');
            return;
        }

        try {
            // Erstelle einen Kassenabschluss für den Vortag mit dem gewünschten Endbestand
            // Damit wird dieser Betrag zum Anfangsbestand des gewählten Tages
            const vortag = new Date(datum);
            vortag.setDate(vortag.getDate() - 1);
            const vortagStr = vortag.toISOString().split('T')[0];

            await DataManager.setzeAnfangsbestand(vortagStr, betrag);

            this.closeModal('shop-anfangsbestand-modal');
            this.showToast('Erfolg', 'Anfangsbestand gesetzt', 'success');
            await this.loadShopKasse();
            await this.loadShopStatistiken();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    erstelleKassenabschluss: async function() {
        try {
            const istBestand = parseFloat(document.getElementById('kasse-ist-bestand')?.value);

            if (isNaN(istBestand)) {
                this.showToast('Fehler', 'Bitte geben Sie den Ist-Bestand ein', 'error');
                return;
            }

            const datum = document.getElementById('shop-kasse-datum')?.value || new Date().toISOString().split('T')[0];
            const result = await DataManager.erstelleKassenabschluss(datum, istBestand);

            // Differenz anzeigen
            const differenzEl = document.getElementById('kasse-differenz');
            if (differenzEl && result.differenz !== undefined) {
                const diff = result.differenz;
                differenzEl.style.display = 'block';
                differenzEl.innerHTML = `
                    <span style="color: ${diff === 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                        Differenz: ${this.formatCurrency(diff)} ${diff === 0 ? '✓' : '⚠'}
                    </span>
                `;
            }

            this.showToast('Erfolg', 'Kassenabschluss erstellt', 'success');
            await this.loadShopKasse();

        } catch (error) {
            console.error('Fehler beim Kassenabschluss:', error);
            this.showToast('Fehler', 'Kassenabschluss fehlgeschlagen', 'error');
        }
    },

    // ========================================
    // SHOP - AUSGABEN (Publikationen an Mitarbeiter/Externe)
    // ========================================

    currentShopAusgaben: [],

    loadShopAusgaben: async function() {
        try {
            const datumVon = document.getElementById('shop-ausgaben-datum-von')?.value;
            const datumBis = document.getElementById('shop-ausgaben-datum-bis')?.value;
            const typFilter = document.getElementById('shop-ausgaben-filter-typ')?.value;

            const filter = {};
            if (datumVon) filter.datumVon = datumVon;
            if (datumBis) filter.datumBis = datumBis;
            if (typFilter) filter.empfaengerTyp = typFilter;

            const ausgaben = await DataManager.getShopAusgaben(filter);
            this.currentShopAusgaben = ausgaben;
            this.renderShopAusgabenTabelle(ausgaben);

        } catch (error) {
            console.error('Fehler beim Laden der Ausgaben:', error);
            this.showToast('Fehler', 'Ausgaben konnten nicht geladen werden', 'error');
        }
    },

    filterShopAusgaben: function() {
        const suchtext = document.getElementById('shop-ausgaben-suche')?.value?.toLowerCase() || '';

        let ausgaben = this.currentShopAusgaben || [];

        if (suchtext) {
            ausgaben = ausgaben.filter(a =>
                (a.artikel_name || '').toLowerCase().includes(suchtext) ||
                (a.empfaenger_name || '').toLowerCase().includes(suchtext) ||
                (a.zweck || '').toLowerCase().includes(suchtext)
            );
        }

        this.renderShopAusgabenTabelle(ausgaben);
    },

    renderShopAusgabenTabelle: function(ausgaben) {
        const tbody = document.getElementById('shop-ausgaben-table-body');
        if (!tbody) return;

        if (ausgaben.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
                        Keine Ausgaben vorhanden. Klicken Sie auf "+ Neue Ausgabe" um eine Publikation auszugeben.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ausgaben.map(a => {
            const typBadge = a.empfaenger_typ === 'mitarbeiter'
                ? '<span class="badge badge-primary">Mitarbeiter</span>'
                : '<span class="badge badge-outline">Extern</span>';

            return `
                <tr>
                    <td>${this.formatDate(a.datum)}</td>
                    <td>
                        <strong>${a.artikel_name || 'Unbekannt'}</strong>
                        ${a.artikel_nr ? `<br><small class="text-muted">${a.artikel_nr}</small>` : ''}
                    </td>
                    <td class="text-center">${a.menge}</td>
                    <td>
                        <strong>${a.empfaenger_name || '-'}</strong>
                        ${a.empfaenger_extern_notiz ? `<br><small class="text-muted">${a.empfaenger_extern_notiz}</small>` : ''}
                    </td>
                    <td>${typBadge}</td>
                    <td>${a.zweck || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-icon btn-sm" onclick="App.deleteShopAusgabe(${a.id})" title="Löschen">
                                <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showShopAusgabeForm: async function() {
        try {
            const heute = new Date().toISOString().split('T')[0];
            document.getElementById('shop-ausgabe-datum').value = heute;

            // Artikel-Dropdown befüllen
            const artikel = await DataManager.getShopArtikel();
            const artikelSelect = document.getElementById('shop-ausgabe-artikel');
            artikelSelect.innerHTML = '<option value="">-- Artikel auswählen --</option>';
            artikel.filter(a => a.is_active !== false && a.isActive !== false).forEach(a => {
                const bestand = a.bestandAktuell ?? a.bestand_aktuell ?? 0;
                artikelSelect.innerHTML += `<option value="${escapeHtml(a.id)}" data-bestand="${escapeHtml(bestand)}">${escapeHtml(a.name)} (Bestand: ${escapeHtml(bestand)})</option>`;
            });

            // Mitarbeiter-Dropdown befüllen
            // Verwende auth_id (UUID) für empfaenger_user_id, nicht id (Integer)
            const users = await DataManager.getUsers();
            const mitarbeiterSelect = document.getElementById('shop-ausgabe-mitarbeiter');
            mitarbeiterSelect.innerHTML = '<option value="">-- Mitarbeiter auswählen --</option>';
            users.forEach(u => {
                // auth_id ist die UUID für den FK in shop_ausgaben
                const userId = u.auth_id || u.id;
                mitarbeiterSelect.innerHTML += `<option value="${escapeHtml(userId)}">${escapeHtml(u.name || u.email || u.username)}</option>`;
            });

            // Externe Empfänger laden
            const externe = await DataManager.getExterneEmpfaenger();
            const externSelect = document.getElementById('shop-ausgabe-extern-select');
            externSelect.innerHTML = '<option value="">-- Bestehend auswählen --</option><option value="__NEU__">+ Neue Person erfassen</option>';
            externe.forEach(e => {
                externSelect.innerHTML += `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}${e.notiz ? ' (' + escapeHtml(e.notiz) + ')' : ''}</option>`;
            });

            // Reset
            document.getElementById('shop-ausgabe-menge').value = 1;
            document.getElementById('shop-ausgabe-bestand').value = '';
            document.getElementById('shop-ausgabe-zweck').value = '';
            document.getElementById('shop-ausgabe-extern-name').value = '';
            document.getElementById('shop-ausgabe-extern-notiz').value = '';
            document.getElementById('shop-ausgabe-duplikat-warning').classList.add('hidden');
            document.getElementById('extern-neu-section').classList.add('hidden');
            this.toggleEmpfaengerTyp('mitarbeiter');

            this.openModal('shop-ausgabe-modal');
        } catch (error) {
            console.error('Fehler beim Öffnen des Ausgabe-Formulars:', error);
            this.showToast('Fehler', 'Formular konnte nicht geladen werden', 'error');
        }
    },

    toggleEmpfaengerTyp: function(typ) {
        const mitarbeiterBtn = document.getElementById('btn-empfaenger-mitarbeiter');
        const externBtn = document.getElementById('btn-empfaenger-extern');
        const mitarbeiterSection = document.getElementById('empfaenger-mitarbeiter-section');
        const externSection = document.getElementById('empfaenger-extern-section');
        const typInput = document.getElementById('shop-ausgabe-empfaenger-typ');
        const mitarbeiterSelect = document.getElementById('shop-ausgabe-mitarbeiter');

        if (typ === 'mitarbeiter') {
            mitarbeiterBtn.classList.add('active');
            mitarbeiterBtn.style.background = '#000';
            mitarbeiterBtn.style.color = '#fff';
            externBtn.classList.remove('active');
            externBtn.style.background = '#fff';
            externBtn.style.color = '#000';
            mitarbeiterSection.classList.remove('hidden');
            externSection.classList.add('hidden');
            mitarbeiterSelect.required = true;
        } else {
            mitarbeiterBtn.classList.remove('active');
            mitarbeiterBtn.style.background = '#fff';
            mitarbeiterBtn.style.color = '#000';
            externBtn.classList.add('active');
            externBtn.style.background = '#000';
            externBtn.style.color = '#fff';
            mitarbeiterSection.classList.add('hidden');
            externSection.classList.remove('hidden');
            mitarbeiterSelect.required = false;
        }

        typInput.value = typ;

        // Duplikat-Warnung zurücksetzen
        document.getElementById('shop-ausgabe-duplikat-warning').classList.add('hidden');
    },

    onShopAusgabeArtikelSelect: function() {
        const select = document.getElementById('shop-ausgabe-artikel');
        const option = select.options[select.selectedIndex];
        const bestand = option?.dataset?.bestand || '0';
        document.getElementById('shop-ausgabe-bestand').value = bestand;

        // Duplikat-Check wenn Empfänger bereits gewählt
        this.checkAusgabeDuplikat();
    },

    onShopAusgabeEmpfaengerChange: function() {
        this.checkAusgabeDuplikat();
    },

    onShopAusgabeExternSelect: function() {
        const select = document.getElementById('shop-ausgabe-extern-select');
        const neuSection = document.getElementById('extern-neu-section');
        const nameInput = document.getElementById('shop-ausgabe-extern-name');

        if (select.value === '__NEU__') {
            neuSection.classList.remove('hidden');
            nameInput.required = true;
        } else {
            neuSection.classList.add('hidden');
            nameInput.required = false;
        }

        this.checkAusgabeDuplikat();
    },

    checkAusgabeDuplikat: async function() {
        const artikelId = document.getElementById('shop-ausgabe-artikel').value;
        const empfaengerTyp = document.getElementById('shop-ausgabe-empfaenger-typ').value;

        let empfaengerId = null;
        if (empfaengerTyp === 'mitarbeiter') {
            empfaengerId = document.getElementById('shop-ausgabe-mitarbeiter').value;
        } else {
            const externSelect = document.getElementById('shop-ausgabe-extern-select').value;
            if (externSelect && externSelect !== '__NEU__') {
                empfaengerId = externSelect;
            }
        }

        const warningEl = document.getElementById('shop-ausgabe-duplikat-warning');

        if (!artikelId || !empfaengerId) {
            warningEl.classList.add('hidden');
            return;
        }

        try {
            const duplikat = await DataManager.checkDuplicateAusgabe(
                parseInt(artikelId),
                empfaengerTyp,
                empfaengerId
            );

            if (duplikat) {
                document.getElementById('shop-ausgabe-duplikat-datum').textContent = this.formatDate(duplikat.datum);
                document.getElementById('shop-ausgabe-duplikat-menge').textContent = duplikat.menge;
                warningEl.classList.remove('hidden');
            } else {
                warningEl.classList.add('hidden');
            }
        } catch (error) {
            console.error('Fehler beim Duplikat-Check:', error);
        }
    },

    saveShopAusgabe: async function(event) {
        event.preventDefault();

        try {
            const artikelId = parseInt(document.getElementById('shop-ausgabe-artikel').value);
            const menge = parseInt(document.getElementById('shop-ausgabe-menge').value);
            const bestand = parseInt(document.getElementById('shop-ausgabe-bestand').value || 0);

            // Bestandsprüfung
            if (menge > bestand) {
                this.showToast('Fehler', `Nicht genügend Bestand (${bestand} verfügbar)`, 'error');
                return;
            }

            const empfaengerTyp = document.getElementById('shop-ausgabe-empfaenger-typ').value;

            const ausgabe = {
                datum: document.getElementById('shop-ausgabe-datum').value,
                artikelId: artikelId,
                menge: menge,
                empfaenger_typ: empfaengerTyp,
                zweck: document.getElementById('shop-ausgabe-zweck').value || null
            };

            if (empfaengerTyp === 'mitarbeiter') {
                const mitarbeiterId = document.getElementById('shop-ausgabe-mitarbeiter').value;
                if (!mitarbeiterId) {
                    this.showToast('Fehler', 'Bitte wählen Sie einen Mitarbeiter aus', 'error');
                    return;
                }
                ausgabe.empfaenger_user_id = mitarbeiterId;
            } else {
                const externSelect = document.getElementById('shop-ausgabe-extern-select').value;
                if (externSelect === '__NEU__') {
                    const externName = document.getElementById('shop-ausgabe-extern-name').value.trim();
                    if (!externName) {
                        this.showToast('Fehler', 'Bitte geben Sie einen Namen ein', 'error');
                        return;
                    }
                    // Zuerst neue externe Person anlegen
                    const neuerExterner = await DataManager.addExternerEmpfaenger({
                        name: externName,
                        notiz: document.getElementById('shop-ausgabe-extern-notiz').value || null
                    });
                    ausgabe.empfaenger_extern_id = neuerExterner.id;
                } else if (externSelect) {
                    ausgabe.empfaenger_extern_id = parseInt(externSelect);
                } else {
                    this.showToast('Fehler', 'Bitte wählen Sie eine externe Person aus oder erfassen Sie eine neue', 'error');
                    return;
                }
            }

            await DataManager.addShopAusgabe(ausgabe);

            this.showToast('Erfolg', 'Ausgabe erfasst', 'success');
            this.closeModal('shop-ausgabe-modal');
            await this.loadShopAusgaben();
            await this.loadShopInventar(); // Bestand aktualisieren

        } catch (error) {
            console.error('Fehler beim Speichern der Ausgabe:', error);
            this.showToast('Fehler', 'Ausgabe konnte nicht gespeichert werden', 'error');
        }
    },

    deleteShopAusgabe: async function(id) {
        if (!confirm('Möchten Sie diese Ausgabe wirklich löschen? Der Bestand wird wieder erhöht.')) {
            return;
        }

        try {
            await DataManager.deleteShopAusgabe(id);
            this.showToast('Erfolg', 'Ausgabe gelöscht', 'success');
            await this.loadShopAusgaben();
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.showToast('Fehler', 'Löschen fehlgeschlagen', 'error');
        }
    },

    // ---- EXCEL IMPORT ----

    showShopImportModal: function() {
        document.getElementById('shop-import-file').value = '';
        document.getElementById('shop-import-preview').innerHTML = '';
        document.getElementById('shop-import-btn').disabled = true;
        this.shopImportData = null;
        this.openModal('shop-import-modal');
    },

    // Lädt die vorhandene Shopinventar_2025.xlsx Datei vom Server
    loadShopinventarFromFile: async function() {
        const preview = document.getElementById('shop-import-preview');
        preview.innerHTML = '<p style="color: #666;">Lade Shopinventar_2025.xlsx...</p>';

        try {
            const response = await fetch('DATEV Exporte/Shop/Shopinventar_2025.xlsx');
            if (!response.ok) {
                throw new Error('Datei nicht gefunden');
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const allData = [];

            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (rows.length < 2) return;

                const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
                const isBuchSheet = sheetName.toLowerCase().includes('büch') || headers.includes('verlag');

                console.log(`Verarbeite Sheet: ${sheetName}, isBuch: ${isBuchSheet}, Headers:`, headers);

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    // Leere Zeilen überspringen
                    const hasContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
                    if (!hasContent) continue;

                    let artikel = {};

                    if (isBuchSheet) {
                        // Bücher-Sheet: Verlag | Hrsg. / Autor | Einkaufs Jahr | Titel | Menge | EK Preis | VK Preis | Standort
                        const verlagIdx = headers.indexOf('verlag');
                        const autorIdx = headers.indexOf('hrsg. / autor');
                        const jahrIdx = headers.indexOf('einkaufs jahr');
                        const titelIdx = headers.indexOf('titel');
                        const mengeIdx = headers.indexOf('menge');
                        const ekIdx = headers.indexOf('ek preis');
                        const vkIdx = headers.indexOf('vk preis');
                        const standortIdx = headers.indexOf('standort');

                        artikel = {
                            name: row[titelIdx >= 0 ? titelIdx : 3] || '',
                            hersteller: row[verlagIdx >= 0 ? verlagIdx : 0] || '',
                            autor: row[autorIdx >= 0 ? autorIdx : 1] || '',
                            einkaufsjahr: String(row[jahrIdx >= 0 ? jahrIdx : 2] || ''),
                            bestand_aktuell: parseInt(row[mengeIdx >= 0 ? mengeIdx : 4]) || 0,
                            einkaufspreis: parseFloat(row[ekIdx >= 0 ? ekIdx : 5]) || null,
                            verkaufspreis: parseFloat(row[vkIdx >= 0 ? vkIdx : 6]) || 0,
                            standort: row[standortIdx >= 0 ? standortIdx : 7] || 'Shop',
                            artikeltyp: 'buch',
                            mwst_satz: '4'
                        };
                    } else {
                        // Objekte-Sheet: Menge | Hersteller | Artikel | Jahr Eingang | EK Preis | Tot.
                        const mengeIdx = headers.indexOf('menge');
                        const herstellerIdx = headers.indexOf('hersteller');
                        const artikelIdx = headers.indexOf('artikel');
                        const jahrIdx = headers.indexOf('jahr eingang');
                        const ekIdx = headers.indexOf('ek preis');

                        artikel = {
                            name: row[artikelIdx >= 0 ? artikelIdx : 2] || '',
                            hersteller: row[herstellerIdx >= 0 ? herstellerIdx : 1] || '',
                            einkaufsjahr: String(row[jahrIdx >= 0 ? jahrIdx : 3] || ''),
                            bestand_aktuell: parseInt(row[mengeIdx >= 0 ? mengeIdx : 0]) || 0,
                            einkaufspreis: parseFloat(row[ekIdx >= 0 ? ekIdx : 4]) || null,
                            verkaufspreis: 0,
                            standort: 'Shop',
                            artikeltyp: 'objekt',
                            mwst_satz: '22'
                        };
                    }

                    // Nur Artikel mit Namen hinzufügen
                    if (artikel.name && artikel.name.trim()) {
                        allData.push(artikel);
                    }
                }
            });

            this.shopImportData = allData;

            // Preview anzeigen
            const buecherCount = allData.filter(a => a.artikeltyp === 'buch').length;
            const objekteCount = allData.filter(a => a.artikeltyp === 'objekt').length;

            preview.innerHTML = `
                <div class="alert" style="background: #e8f5e9; color: #2e7d32; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem;">
                    <strong>${allData.length} Artikel</strong> gefunden (${buecherCount} Bücher, ${objekteCount} Objekte)
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm" style="font-size: 0.85rem;">
                        <thead>
                            <tr><th>Name</th><th>Typ</th><th>Hersteller</th><th>VK</th><th>Bestand</th></tr>
                        </thead>
                        <tbody>
                            ${allData.slice(0, 15).map(d => `
                                <tr>
                                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${d.name}</td>
                                    <td>${d.artikeltyp === 'buch' ? 'Buch' : 'Objekt'}</td>
                                    <td style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${d.hersteller || '-'}</td>
                                    <td>${d.verkaufspreis ? this.formatCurrency(d.verkaufspreis) : '-'}</td>
                                    <td>${d.bestand_aktuell}</td>
                                </tr>
                            `).join('')}
                            ${allData.length > 15 ? `<tr><td colspan="5" class="text-center text-muted">... und ${allData.length - 15} weitere</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('shop-import-btn').disabled = false;
            this.showToast('Erfolg', `${allData.length} Artikel gefunden`, 'success');

        } catch (error) {
            console.error('Fehler beim Laden:', error);
            preview.innerHTML = `<div class="alert" style="background: #ffebee; color: #c62828; padding: 0.75rem; border-radius: 4px;">
                Fehler: ${error.message}. Bitte laden Sie die Datei manuell hoch.
            </div>`;
            this.showToast('Fehler', 'Datei konnte nicht geladen werden', 'error');
        }
    },

    previewShopImport: async function() {
        const fileInput = document.getElementById('shop-import-file');
        const file = fileInput.files[0];

        if (!file) {
            return;
        }

        const preview = document.getElementById('shop-import-preview');
        preview.innerHTML = '<p style="color: #666;">Verarbeite Datei...</p>';

        try {
            const data = await this.readExcelFile(file);
            this.shopImportData = data;

            preview.innerHTML = `
                <div class="alert" style="background: #e8f5e9; color: #2e7d32; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem;">
                    <strong>${data.length} Artikel</strong> gefunden
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm" style="font-size: 0.85rem;">
                        <thead>
                            <tr><th>Name</th><th>Typ</th><th>VK</th><th>Bestand</th></tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 15).map(d => `
                                <tr>
                                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${d.name}</td>
                                    <td>${d.artikeltyp === 'buch' ? 'Buch' : 'Objekt'}</td>
                                    <td>${d.verkaufspreis ? this.formatCurrency(d.verkaufspreis) : '-'}</td>
                                    <td>${d.bestand_aktuell}</td>
                                </tr>
                            `).join('')}
                            ${data.length > 15 ? `<tr><td colspan="4" class="text-center text-muted">... und ${data.length - 15} weitere</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('shop-import-btn').disabled = false;
            this.showToast('Erfolg', `${data.length} Artikel gefunden`, 'success');

        } catch (error) {
            console.error('Fehler beim Lesen:', error);
            preview.innerHTML = `<div class="alert" style="background: #ffebee; color: #c62828; padding: 0.75rem; border-radius: 4px;">
                Fehler beim Lesen der Datei
            </div>`;
            this.showToast('Fehler', 'Excel-Datei konnte nicht gelesen werden', 'error');
        }
    },

    readExcelFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const allData = [];

                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                        if (rows.length < 2) return;

                        const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
                        const isBuchSheet = sheetName.toLowerCase().includes('büch') || headers.includes('verlag');

                        for (let i = 1; i < rows.length; i++) {
                            const row = rows[i];
                            if (!row || row.length === 0) continue;

                            let artikel = {};

                            if (isBuchSheet) {
                                // Bücher-Sheet
                                artikel = {
                                    name: row[headers.indexOf('titel')] || row[3] || '',
                                    hersteller: row[headers.indexOf('verlag')] || row[0] || '',
                                    autor: row[headers.indexOf('hrsg. / autor')] || row[1] || '',
                                    einkaufsjahr: row[headers.indexOf('einkaufs jahr')] || row[2] || '',
                                    bestand_aktuell: parseInt(row[headers.indexOf('menge')] || row[4]) || 0,
                                    einkaufspreis: parseFloat(row[headers.indexOf('ek preis')] || row[5]) || null,
                                    verkaufspreis: parseFloat(row[headers.indexOf('vk preis')] || row[6]) || 0,
                                    standort: row[headers.indexOf('standort')] || row[7] || 'Shop',
                                    artikeltyp: 'buch',
                                    mwst_satz: '4'
                                };
                            } else {
                                // Objekte-Sheet
                                artikel = {
                                    name: row[headers.indexOf('artikel')] || row[2] || '',
                                    hersteller: row[headers.indexOf('hersteller')] || row[1] || '',
                                    einkaufsjahr: row[headers.indexOf('jahr eingang')] || row[3] || '',
                                    bestand_aktuell: parseInt(row[headers.indexOf('menge')] || row[0]) || 0,
                                    einkaufspreis: parseFloat(row[headers.indexOf('ek preis')] || row[4]) || null,
                                    verkaufspreis: 0,
                                    standort: 'Shop',
                                    artikeltyp: 'objekt',
                                    mwst_satz: '22'
                                };
                            }

                            if (artikel.name && artikel.name.trim()) {
                                allData.push(artikel);
                            }
                        }
                    });

                    resolve(allData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    },

    executeShopImport: async function() {
        if (!this.shopImportData || this.shopImportData.length === 0) {
            this.showToast('Fehler', 'Keine Daten zum Importieren', 'error');
            return;
        }

        try {
            const result = await DataManager.importShopArtikelFromExcel(this.shopImportData);
            this.closeModal('shop-import-modal');
            this.showToast('Erfolg', `${result.imported} Artikel importiert`, 'success');
            await this.loadShopInventar();
        } catch (error) {
            console.error('Fehler beim Import:', error);
            this.showToast('Fehler', 'Import fehlgeschlagen', 'error');
        }
    },

    // ---- KURSKATEGORIEN (Konfiguration) ----

    loadKurseKonfig: async function() {
        await Promise.all([
            this.loadKursKategorienKonfig(),
            this.loadKursAnbieterKonfig()
        ]);
    },

    loadKursKategorienKonfig: async function() {
        const container = document.getElementById('kurs-kategorien-list');
        if (!container) return;

        try {
            const kategorien = await DataManager.getKursKategorien();
            if (kategorien.length === 0) {
                container.innerHTML = '<p style="color: #666;">Keine Kategorien vorhanden</p>';
                return;
            }
            container.innerHTML = kategorien.map(k => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="width: 16px; height: 16px; border-radius: 50%; background: ${k.farbe || '#3498db'};"></span>
                        <strong>${escapeHtml(k.name)}</strong>
                        <span class="text-muted" style="margin-left: 0.5rem;">(${escapeHtml(k.code)})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn btn-icon btn-sm" onclick="App.editKursKategorie(${k.id})" title="Bearbeiten">
                            <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="App.deleteKursKategorie(${k.id})" title="Loeschen">
                            <img src="icons/12-delete.svg" alt="Loeschen" class="icon-sm">
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Fehler:', error);
            container.innerHTML = '<p style="color: #c0392b;">Fehler beim Laden</p>';
        }
    },

    loadKursAnbieterKonfig: async function() {
        const container = document.getElementById('kurs-anbieter-list');
        if (!container) return;

        try {
            const anbieter = await DataManager.getKursanbieter();
            if (anbieter.length === 0) {
                container.innerHTML = '<p style="color: #666;">Keine Kursanbieter vorhanden. Markieren Sie Lieferanten als Kursanbieter.</p>';
                return;
            }
            container.innerHTML = anbieter.map(a => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${escapeHtml(a.name || a.fornitore_name)}</strong>
                        ${a.email ? `<span class="text-muted" style="margin-left: 0.5rem;">${escapeHtml(a.email)}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Fehler:', error);
            container.innerHTML = '<p style="color: #c0392b;">Fehler beim Laden</p>';
        }
    },

    showNewKursKategorieForm: function() {
        this.currentKursKategorieId = null;
        document.getElementById('kurs-kategorie-modal-title').textContent = 'Neue Kurskategorie';
        document.getElementById('kurs-kategorie-form').reset();
        document.getElementById('kurs-kategorie-farbe').value = '#3498db';
        this.showModal('kurs-kategorie-modal');
    },

    editKursKategorie: async function(id) {
        const kategorien = await DataManager.getKursKategorien();
        const kat = kategorien.find(k => k.id === id);
        if (!kat) return;

        this.currentKursKategorieId = id;
        document.getElementById('kurs-kategorie-modal-title').textContent = 'Kurskategorie bearbeiten';
        document.getElementById('kurs-kategorie-code').value = kat.code || '';
        document.getElementById('kurs-kategorie-name').value = kat.name || '';
        document.getElementById('kurs-kategorie-beschreibung').value = kat.beschreibung || '';
        document.getElementById('kurs-kategorie-farbe').value = kat.farbe || '#3498db';
        this.showModal('kurs-kategorie-modal');
    },

    saveKursKategorie: async function(event) {
        event.preventDefault();

        const data = {
            code: document.getElementById('kurs-kategorie-code').value.trim(),
            name: document.getElementById('kurs-kategorie-name').value.trim(),
            beschreibung: document.getElementById('kurs-kategorie-beschreibung').value.trim() || null,
            farbe: document.getElementById('kurs-kategorie-farbe').value
        };

        if (!data.code || !data.name) {
            this.showToast('Fehler', 'Code und Name sind erforderlich', 'error');
            return;
        }

        try {
            if (this.currentKursKategorieId) {
                await DataManager.updateKursKategorie(this.currentKursKategorieId, data);
                this.showToast('Erfolg', 'Kategorie aktualisiert', 'success');
            } else {
                await DataManager.addKursKategorie(data);
                this.showToast('Erfolg', 'Kategorie erstellt', 'success');
            }
            this.hideModal('kurs-kategorie-modal');
            await this.loadKursKategorienKonfig();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    deleteKursKategorie: async function(id) {
        if (!confirm('Kategorie wirklich loeschen?')) return;

        try {
            await DataManager.deleteKursKategorie(id);
            this.showToast('Erfolg', 'Kategorie geloescht', 'success');
            await this.loadKursKategorienKonfig();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Loeschen fehlgeschlagen', 'error');
        }
    },

    // ---- SHOP KATEGORIEN (Konfiguration) ----

    loadShopKategorien: async function() {
        await Promise.all([
            this.loadShopArtikeltypen(),
            this.loadShopEintrittKategorien(),
            this.loadShopMitgliedKategorien()
        ]);
    },

    loadShopArtikeltypen: async function() {
        const container = document.getElementById('shop-artikeltypen-list');
        if (!container) return;

        try {
            const typen = await DataManager.getShopArtikeltypen();
            container.innerHTML = typen.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${t.name}</strong>
                        <span class="text-muted" style="margin-left: 0.5rem;">(${t.code})</span>
                    </div>
                    ${!t.is_system ? `
                        <button class="btn btn-icon btn-sm" onclick="App.deleteArtikelTyp(${t.id})" title="Löschen">
                            <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                        </button>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Fehler:', error);
        }
    },

    loadShopEintrittKategorien: async function() {
        const container = document.getElementById('shop-eintritt-kategorien-list');
        if (!container) return;

        try {
            const kategorien = await DataManager.getEintrittKategorien();
            this.shopEintrittKategorien = kategorien; // Cache für Dropdown
            container.innerHTML = kategorien.map(k => {
                const isActive = k.is_active !== false; // Default true wenn undefined
                return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${k.name}</strong>
                        <span class="text-muted" style="margin-left: 0.5rem;">${this.formatCurrency(k.preis)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="badge ${isActive ? 'badge-success' : 'badge-outline'}">${isActive ? 'Aktiv' : 'Inaktiv'}</span>
                        <button class="btn btn-icon btn-sm" onclick="App.editEintrittKat(${k.id})" title="Bearbeiten">
                            <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="App.deleteEintrittKat(${k.id})" title="Löschen">
                            <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                        </button>
                    </div>
                </div>
            `}).join('');
        } catch (error) {
            console.error('Fehler:', error);
        }
    },

    loadShopMitgliedKategorien: async function() {
        const container = document.getElementById('shop-mitglied-kategorien-list');
        if (!container) return;

        try {
            const kategorien = await DataManager.getMitgliedKategorien();
            this.shopMitgliedKategorien = kategorien; // Cache für Dropdown
            container.innerHTML = kategorien.map(k => {
                const isActive = k.is_active !== false; // Default true wenn undefined
                return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${k.name}</strong>
                        <span class="text-muted" style="margin-left: 0.5rem;">${this.formatCurrency(k.betrag)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="badge ${isActive ? 'badge-success' : 'badge-outline'}">${isActive ? 'Aktiv' : 'Inaktiv'}</span>
                        <button class="btn btn-icon btn-sm" onclick="App.editMitgliedKat(${k.id})" title="Bearbeiten">
                            <img src="icons/09-edit.svg" alt="Bearbeiten" class="icon-sm">
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="App.deleteMitgliedKat(${k.id})" title="Löschen">
                            <img src="icons/12-delete.svg" alt="Löschen" class="icon-sm">
                        </button>
                    </div>
                </div>
            `}).join('');
        } catch (error) {
            console.error('Fehler:', error);
        }
    },

    showNewArtikelTypForm: function() {
        const name = prompt('Name des neuen Artikeltyps:');
        if (!name || !name.trim()) return;

        const code = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        this.saveArtikelTyp({ code, name: name.trim() });
    },

    saveArtikelTyp: async function(data) {
        try {
            await DataManager.saveShopArtikeltyp(data);
            this.showToast('Erfolg', 'Artikeltyp gespeichert', 'success');
            await this.loadShopArtikeltypen();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    deleteArtikelTyp: async function(id) {
        if (!confirm('Diesen Artikeltyp wirklich löschen?')) return;

        try {
            await DataManager.deleteShopArtikeltyp(id);
            this.showToast('Erfolg', 'Artikeltyp gelöscht', 'success');
            await this.loadShopArtikeltypen();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Löschen fehlgeschlagen', 'error');
        }
    },

    showNewEintrittKatForm: function() {
        // Modal öffnen für neue Eintritts-Kategorie
        const form = document.getElementById('shop-eintritt-kat-form');
        if (form) form.reset();

        document.getElementById('eintritt-kat-id').value = '';
        document.getElementById('eintritt-kat-code').value = '';
        document.getElementById('eintritt-kat-code').disabled = false;
        document.getElementById('eintritt-kat-name').value = '';
        document.getElementById('eintritt-kat-preis').value = '0.00';
        document.getElementById('eintritt-kat-mwst').value = '22';
        document.getElementById('eintritt-kat-gueltig-ab').value = new Date().toISOString().split('T')[0];
        document.getElementById('eintritt-kat-gueltig-bis').value = '';
        document.getElementById('eintritt-kat-unbegrenzt').checked = true;
        document.getElementById('eintritt-kat-gueltig-bis').disabled = true;
        document.getElementById('eintritt-kat-aktiv').checked = true;

        document.getElementById('eintritt-kat-modal-title').textContent = 'Neue Eintritts-Kategorie';
        this.openModal('shop-eintritt-kat-modal');
    },

    editEintrittKat: async function(id) {
        const kategorien = await DataManager.getEintrittKategorien();
        const kat = kategorien.find(k => k.id === id);
        if (!kat) return;

        document.getElementById('eintritt-kat-id').value = id;
        document.getElementById('eintritt-kat-code').value = kat.code || '';
        document.getElementById('eintritt-kat-code').disabled = true; // Code nicht änderbar
        document.getElementById('eintritt-kat-name').value = kat.name || '';
        document.getElementById('eintritt-kat-preis').value = (kat.preis || 0).toFixed(2);
        document.getElementById('eintritt-kat-mwst').value = kat.mwst_satz || '22';
        document.getElementById('eintritt-kat-gueltig-ab').value = kat.gueltig_ab || '';
        document.getElementById('eintritt-kat-gueltig-bis').value = kat.gueltig_bis || '';

        const unbegrenzt = !kat.gueltig_bis;
        document.getElementById('eintritt-kat-unbegrenzt').checked = unbegrenzt;
        document.getElementById('eintritt-kat-gueltig-bis').disabled = unbegrenzt;
        document.getElementById('eintritt-kat-aktiv').checked = kat.is_active !== false;

        document.getElementById('eintritt-kat-modal-title').textContent = 'Eintritts-Kategorie bearbeiten';
        this.openModal('shop-eintritt-kat-modal');
    },

    toggleGueltigBis: function(type) {
        // Generische Funktion für beide Modal-Typen (eintritt, mitglied)
        const unbegrenzt = document.getElementById(`${type}-kat-unbegrenzt`).checked;
        const gueltigBisField = document.getElementById(`${type}-kat-gueltig-bis`);
        gueltigBisField.disabled = unbegrenzt;
        if (unbegrenzt) {
            gueltigBisField.value = '';
        }
    },

    toggleEintrittKatGueltigBis: function() {
        this.toggleGueltigBis('eintritt');
    },

    saveEintrittKatForm: async function(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('eintritt-kat-id').value;
        const code = document.getElementById('eintritt-kat-code').value.trim();
        const name = document.getElementById('eintritt-kat-name').value.trim();
        const preis = parseFloat(document.getElementById('eintritt-kat-preis').value) || 0;
        const mwst_satz = parseFloat(document.getElementById('eintritt-kat-mwst').value) || 22;
        const gueltig_ab = document.getElementById('eintritt-kat-gueltig-ab').value || null;
        const unbegrenzt = document.getElementById('eintritt-kat-unbegrenzt').checked;
        const gueltig_bis = unbegrenzt ? null : (document.getElementById('eintritt-kat-gueltig-bis').value || null);
        const is_active = document.getElementById('eintritt-kat-aktiv').checked;

        if (!code || !name) {
            this.showToast('Fehler', 'Code und Name sind erforderlich', 'error');
            return;
        }

        const data = {
            code,
            name,
            preis,
            mwst_satz,
            gueltig_ab,
            gueltig_bis,
            is_active
        };

        if (id) {
            data.id = parseInt(id);
        }

        await this.saveEintrittKat(data);
        this.closeModal('shop-eintritt-kat-modal');
    },

    saveEintrittKat: async function(data) {
        try {
            await DataManager.saveEintrittKategorie(data);
            this.showToast('Erfolg', 'Kategorie gespeichert', 'success');
            await this.loadShopEintrittKategorien();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    deleteEintrittKat: async function(id) {
        if (!confirm('Möchten Sie diese Eintritts-Kategorie wirklich löschen?')) return;

        try {
            await DataManager.deleteEintrittKategorie(id);
            this.showToast('Erfolg', 'Kategorie gelöscht', 'success');
            await this.loadShopEintrittKategorien();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Löschen fehlgeschlagen', 'error');
        }
    },

    showNewMitgliedKatForm: function() {
        // Modal öffnen für neue Mitglieds-Kategorie
        const form = document.getElementById('shop-mitglied-kat-form');
        if (form) form.reset();

        document.getElementById('mitglied-kat-id').value = '';
        document.getElementById('mitglied-kat-code').value = '';
        document.getElementById('mitglied-kat-code').disabled = false;
        document.getElementById('mitglied-kat-name').value = '';
        document.getElementById('mitglied-kat-betrag').value = '0.00';
        document.getElementById('mitglied-kat-gueltig-ab').value = new Date().toISOString().split('T')[0];
        document.getElementById('mitglied-kat-gueltig-bis').value = '';
        document.getElementById('mitglied-kat-unbegrenzt').checked = true;
        document.getElementById('mitglied-kat-gueltig-bis').disabled = true;
        document.getElementById('mitglied-kat-aktiv').checked = true;

        document.getElementById('mitglied-kat-modal-title').textContent = 'Neue Mitglieds-Kategorie';
        this.openModal('shop-mitglied-kat-modal');
    },

    editMitgliedKat: async function(id) {
        const kategorien = await DataManager.getMitgliedKategorien();
        const kat = kategorien.find(k => k.id === id);
        if (!kat) return;

        document.getElementById('mitglied-kat-id').value = id;
        document.getElementById('mitglied-kat-code').value = kat.code || '';
        document.getElementById('mitglied-kat-code').disabled = true; // Code nicht änderbar
        document.getElementById('mitglied-kat-name').value = kat.name || '';
        document.getElementById('mitglied-kat-betrag').value = (kat.betrag || 0).toFixed(2);
        document.getElementById('mitglied-kat-gueltig-ab').value = kat.gueltig_ab || '';
        document.getElementById('mitglied-kat-gueltig-bis').value = kat.gueltig_bis || '';

        const unbegrenzt = !kat.gueltig_bis;
        document.getElementById('mitglied-kat-unbegrenzt').checked = unbegrenzt;
        document.getElementById('mitglied-kat-gueltig-bis').disabled = unbegrenzt;
        document.getElementById('mitglied-kat-aktiv').checked = kat.is_active !== false;

        document.getElementById('mitglied-kat-modal-title').textContent = 'Mitglieds-Kategorie bearbeiten';
        this.openModal('shop-mitglied-kat-modal');
    },

    toggleMitgliedKatGueltigBis: function() {
        this.toggleGueltigBis('mitglied');
    },

    saveMitgliedKatForm: async function(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('mitglied-kat-id').value;
        const code = document.getElementById('mitglied-kat-code').value.trim();
        const name = document.getElementById('mitglied-kat-name').value.trim();
        const betrag = parseFloat(document.getElementById('mitglied-kat-betrag').value) || 0;
        const gueltig_ab = document.getElementById('mitglied-kat-gueltig-ab').value || null;
        const unbegrenzt = document.getElementById('mitglied-kat-unbegrenzt').checked;
        const gueltig_bis = unbegrenzt ? null : (document.getElementById('mitglied-kat-gueltig-bis').value || null);
        const is_active = document.getElementById('mitglied-kat-aktiv').checked;

        if (!code || !name) {
            this.showToast('Fehler', 'Code und Name sind erforderlich', 'error');
            return;
        }

        const data = {
            code,
            name,
            betrag,
            gueltig_ab,
            gueltig_bis,
            is_active
        };

        if (id) {
            data.id = parseInt(id);
        }

        await this.saveMitgliedKat(data);
        this.closeModal('shop-mitglied-kat-modal');
    },

    saveMitgliedKat: async function(data) {
        try {
            await DataManager.saveMitgliedKategorie(data);
            this.showToast('Erfolg', 'Kategorie gespeichert', 'success');
            await this.loadShopMitgliedKategorien();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    deleteMitgliedKat: async function(id) {
        if (!confirm('Möchten Sie diese Mitglieds-Kategorie wirklich löschen?')) return;

        try {
            await DataManager.deleteMitgliedKategorie(id);
            this.showToast('Erfolg', 'Kategorie gelöscht', 'success');
            await this.loadShopMitgliedKategorien();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Löschen fehlgeschlagen', 'error');
        }
    },

    // ==================== KURSVERWALTUNG ====================

    // Kurse-State
    kurseState: {
        kategorien: [],
        anbieter: [],
        kurse: [],
        termine: [],
        teilnehmer: [],
        ablaufend: []
    },

    // Kurse laden
    loadKurse: async function() {
        try {
            // Daten laden
            this.kurseState.kategorien = await DataManager.getKursKategorien();
            this.kurseState.anbieter = await DataManager.getKursanbieter();
            this.kurseState.kurse = await DataManager.getKurse();
            this.kurseState.termine = await DataManager.getKursTermine();
            this.kurseState.teilnehmer = await DataManager.getKursTeilnehmer();
            this.kurseState.ablaufend = await DataManager.getAblaufendeZertifikate();

            // Filter-Dropdown befuellen
            const kategorieSelect = document.getElementById('kurse-filter-kategorie');
            if (kategorieSelect && kategorieSelect.options.length <= 1) {
                this.kurseState.kategorien.forEach(k => {
                    kategorieSelect.innerHTML += `<option value="${k.id}">${escapeHtml(k.name)}</option>`;
                });
            }

            // Statistiken
            const kurseGesamt = this.kurseState.kurse.filter(k => k.is_active !== false).length;
            const pflichtkurse = this.kurseState.kurse.filter(k => k.ist_pflicht && k.is_active !== false).length;
            const geplantTermine = this.kurseState.termine.filter(t => t.status === 'geplant' || t.status === 'bestaetigt').length;
            const ablaufendCount = this.kurseState.ablaufend.length;

            document.getElementById('stat-kurse-gesamt').textContent = kurseGesamt;
            document.getElementById('stat-kurse-pflicht').textContent = pflichtkurse;
            document.getElementById('stat-kurse-geplant').textContent = geplantTermine;
            document.getElementById('stat-kurse-ablaufend').textContent = ablaufendCount;

            // Ablaufende Zertifikate Warnung
            const warnungDiv = document.getElementById('kurse-ablauf-warnung');
            const anzahlSpan = document.getElementById('kurse-ablauf-anzahl');
            if (warnungDiv && ablaufendCount > 0 && Auth.isAdmin()) {
                warnungDiv.style.display = 'block';
                if (anzahlSpan) anzahlSpan.textContent = ablaufendCount;
            } else if (warnungDiv) {
                warnungDiv.style.display = 'none';
            }

            // Listen rendern
            this.renderKursliste();
            this.renderMeineKurse();
        } catch (error) {
            console.error('Fehler beim Laden der Kurse:', error);
            this.showToast('Fehler', 'Kurse konnten nicht geladen werden', 'error');
        }
    },

    // Kursliste rendern (Admin)
    renderKursliste: function() {
        const tbody = document.getElementById('kurse-liste');
        if (!tbody) return;

        // Filter anwenden
        const filterKategorie = document.getElementById('kurse-filter-kategorie')?.value;
        const filterTyp = document.getElementById('kurse-filter-typ')?.value;
        const filterStatus = document.getElementById('kurse-filter-status')?.value;

        let kurse = [...this.kurseState.kurse];

        if (filterKategorie) {
            kurse = kurse.filter(k => k.kategorie_id == filterKategorie);
        }
        if (filterTyp === 'pflicht') {
            kurse = kurse.filter(k => k.ist_pflicht);
        } else if (filterTyp === 'freiwillig') {
            kurse = kurse.filter(k => !k.ist_pflicht);
        }
        if (filterStatus === 'aktiv') {
            kurse = kurse.filter(k => k.is_active !== false);
        } else if (filterStatus === 'inaktiv') {
            kurse = kurse.filter(k => k.is_active === false);
        }

        if (kurse.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">Keine Kurse vorhanden</td></tr>';
            return;
        }

        tbody.innerHTML = kurse.map(kurs => {
            const kategorie = this.kurseState.kategorien.find(k => k.id === kurs.kategorie_id);
            const termineCount = this.kurseState.termine.filter(t => t.kurs_id === kurs.id).length;
            const teilnehmerCount = this.kurseState.teilnehmer.filter(t => {
                const termin = this.kurseState.termine.find(te => te.id === t.termin_id);
                return termin && termin.kurs_id === kurs.id;
            }).length;

            const faelligkeitText = kurs.faelligkeit_datum ? new Date(kurs.faelligkeit_datum).toLocaleDateString('de-DE') : '-';

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(kurs.name)}</strong>
                        ${kurs.beschreibung ? `<br><small style="color: #666;">${escapeHtml(kurs.beschreibung.substring(0, 50))}...</small>` : ''}
                    </td>
                    <td>
                        ${kategorie ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${kategorie.farbe}20; color: ${kategorie.farbe}; font-size: 0.8rem;">${escapeHtml(kategorie.name)}</span>` : '-'}
                    </td>
                    <td>${kurs.ist_pflicht ? '<span style="color: #e74c3c;">Ja</span>' : 'Nein'}</td>
                    <td>${faelligkeitText}</td>
                    <td style="text-align: center;">${termineCount}</td>
                    <td style="text-align: center;">${teilnehmerCount}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-sm" onclick="App.showNewKursTerminForm(${kurs.id})" title="Termin hinzufuegen">+ Termin</button>
                        <button class="btn btn-outline btn-sm" onclick="App.editKurs(${kurs.id})" title="Bearbeiten">Bearbeiten</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Meine Kurse rendern (User)
    renderMeineKurse: async function() {
        const tbody = document.getElementById('meine-kurse-liste');
        if (!tbody) return;

        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Nicht eingeloggt</td></tr>';
            return;
        }

        const meineTeilnahmen = this.kurseState.teilnehmer.filter(t => t.user_id === currentUserId);

        if (meineTeilnahmen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Keine Kursteilnahmen vorhanden</td></tr>';
            return;
        }

        tbody.innerHTML = meineTeilnahmen.map(teilnahme => {
            const termin = this.kurseState.termine.find(t => t.id === teilnahme.termin_id);
            const kurs = termin ? this.kurseState.kurse.find(k => k.id === termin.kurs_id) : null;
            const kategorie = kurs ? this.kurseState.kategorien.find(k => k.id === kurs.kategorie_id) : null;

            if (!kurs || !termin) return '';

            const statusBadge = {
                'angemeldet': '<span class="badge" style="background: #3498db;">Angemeldet</span>',
                'teilgenommen': '<span class="badge" style="background: #27ae60;">Teilgenommen</span>',
                'nicht_erschienen': '<span class="badge" style="background: #e74c3c;">Nicht erschienen</span>',
                'abgesagt': '<span class="badge" style="background: #95a5a6;">Abgesagt</span>'
            }[teilnahme.status] || teilnahme.status;

            const ablaufText = teilnahme.zertifikat_ablauf
                ? new Date(teilnahme.zertifikat_ablauf).toLocaleDateString('de-DE')
                : '-';

            const isAblaufend = teilnahme.zertifikat_ablauf && new Date(teilnahme.zertifikat_ablauf) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

            return `
                <tr>
                    <td><strong>${escapeHtml(kurs.name)}</strong></td>
                    <td>
                        ${kategorie ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${kategorie.farbe}20; color: ${kategorie.farbe}; font-size: 0.8rem;">${escapeHtml(kategorie.name)}</span>` : '-'}
                    </td>
                    <td>${new Date(termin.datum).toLocaleDateString('de-DE')}</td>
                    <td>${statusBadge}</td>
                    <td style="${isAblaufend ? 'color: #e74c3c; font-weight: 500;' : ''}">${ablaufText}</td>
                    <td style="text-align: right;">
                        ${teilnahme.zertifikat_datei ? `<button class="btn btn-outline btn-sm" onclick="App.downloadZertifikat('${teilnahme.zertifikat_datei}')">Zertifikat</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Filter zuruecksetzen
    resetKurseFilters: function() {
        document.getElementById('kurse-filter-kategorie').value = '';
        document.getElementById('kurse-filter-typ').value = '';
        document.getElementById('kurse-filter-status').value = '';
        this.renderKursliste();
    },

    // Neuen Kurs erstellen
    showNewKursForm: function() {
        document.getElementById('kurs-modal-title').textContent = 'Neuer Kurs';
        document.getElementById('kurs-form').reset();
        document.getElementById('kurs-form-id').value = '';

        // Dropdowns befuellen
        const kategorieSelect = document.getElementById('kurs-kategorie');
        kategorieSelect.innerHTML = '<option value="">-- Waehlen --</option>';
        this.kurseState.kategorien.forEach(k => {
            kategorieSelect.innerHTML += `<option value="${k.id}">${escapeHtml(k.name)}</option>`;
        });

        const anbieterSelect = document.getElementById('kurs-anbieter');
        anbieterSelect.innerHTML = '<option value="">-- Kein Anbieter --</option>';
        this.kurseState.anbieter.filter(a => a.is_active !== false).forEach(a => {
            anbieterSelect.innerHTML += `<option value="${a.id}">${escapeHtml(a.name)}</option>`;
        });

        this.showModal('kurs-form-modal');
    },

    // Kurs bearbeiten
    editKurs: function(kursId) {
        const kurs = this.kurseState.kurse.find(k => k.id === kursId);
        if (!kurs) return;

        document.getElementById('kurs-modal-title').textContent = 'Kurs bearbeiten';
        document.getElementById('kurs-form-id').value = kurs.id;
        document.getElementById('kurs-name').value = kurs.name || '';
        document.getElementById('kurs-beschreibung').value = kurs.beschreibung || '';
        document.getElementById('kurs-pflicht').checked = kurs.ist_pflicht || false;
        document.getElementById('kurs-faelligkeit').value = kurs.faelligkeit_datum || '';
        document.getElementById('kurs-dauer').value = kurs.dauer_stunden || '';
        document.getElementById('kurs-kosten-person').value = kurs.kosten_pro_person || '';
        document.getElementById('kurs-kosten-pauschal').value = kurs.kosten_pauschal || '';

        // Dropdowns befuellen und Wert setzen
        const kategorieSelect = document.getElementById('kurs-kategorie');
        kategorieSelect.innerHTML = '<option value="">-- Waehlen --</option>';
        this.kurseState.kategorien.forEach(k => {
            kategorieSelect.innerHTML += `<option value="${k.id}" ${k.id === kurs.kategorie_id ? 'selected' : ''}>${escapeHtml(k.name)}</option>`;
        });

        const anbieterSelect = document.getElementById('kurs-anbieter');
        anbieterSelect.innerHTML = '<option value="">-- Kein Anbieter --</option>';
        this.kurseState.anbieter.filter(a => a.is_active !== false).forEach(a => {
            anbieterSelect.innerHTML += `<option value="${a.id}" ${a.id === kurs.anbieter_id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`;
        });

        this.showModal('kurs-form-modal');
    },

    // Kurs speichern
    saveKurs: async function(event) {
        event.preventDefault();

        const kursId = document.getElementById('kurs-form-id').value;
        const kursData = {
            name: document.getElementById('kurs-name').value.trim(),
            beschreibung: document.getElementById('kurs-beschreibung').value.trim() || null,
            kategorie_id: document.getElementById('kurs-kategorie').value || null,
            anbieter_id: document.getElementById('kurs-anbieter').value || null,
            ist_pflicht: document.getElementById('kurs-pflicht').checked,
            faelligkeit_datum: document.getElementById('kurs-faelligkeit').value || null,
            dauer_stunden: document.getElementById('kurs-dauer').value || null,
            kosten_pro_person: document.getElementById('kurs-kosten-person').value || null,
            kosten_pauschal: document.getElementById('kurs-kosten-pauschal').value || null
        };

        try {
            if (kursId) {
                await DataManager.updateKurs(kursId, kursData);
                this.showToast('Erfolg', 'Kurs aktualisiert', 'success');
            } else {
                await DataManager.addKurs(kursData);
                this.showToast('Erfolg', 'Kurs erstellt', 'success');
            }
            this.hideModal('kurs-form-modal');
            await this.loadKurse();
        } catch (error) {
            console.error('Fehler beim Speichern des Kurses:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // Kurs-Termin erstellen
    showNewKursTerminForm: async function(kursId) {
        const kurs = this.kurseState.kurse.find(k => k.id === kursId);
        if (!kurs) return;

        document.getElementById('kurs-termin-modal-title').textContent = `Neuer Termin: ${kurs.name}`;
        document.getElementById('kurs-termin-form').reset();
        document.getElementById('kurs-termin-form-id').value = '';
        document.getElementById('kurs-termin-kurs-id').value = kursId;

        // Teilnehmer-Checkboxen erstellen
        const users = await DataManager.getUsers();
        const interneUsers = users.filter(u => u.userType !== 'extern' && u.is_active !== false);
        const teilnehmerListe = document.getElementById('kurs-termin-teilnehmer-liste');
        teilnehmerListe.innerHTML = interneUsers.map(u => `
            <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #fff; border-radius: 4px; margin-bottom: 0.25rem;">
                <input type="checkbox" name="teilnehmer" value="${u.id}">
                <span>${escapeHtml(u.username || u.email || u.name)}</span>
            </label>
        `).join('');

        this.showModal('kurs-termin-modal');
    },

    // Online-Link Toggle
    toggleKursOnline: function() {
        const isOnline = document.getElementById('kurs-termin-online').checked;
        document.getElementById('kurs-termin-online-link-group').style.display = isOnline ? 'block' : 'none';
    },

    // Kurs-Termin speichern
    saveKursTermin: async function(event) {
        event.preventDefault();

        const terminId = document.getElementById('kurs-termin-form-id').value;
        const kursId = document.getElementById('kurs-termin-kurs-id').value;

        const terminData = {
            kurs_id: kursId,
            datum: document.getElementById('kurs-termin-datum').value,
            uhrzeit_von: document.getElementById('kurs-termin-von').value || null,
            uhrzeit_bis: document.getElementById('kurs-termin-bis').value || null,
            ort: document.getElementById('kurs-termin-ort').value.trim() || null,
            online: document.getElementById('kurs-termin-online').checked,
            online_link: document.getElementById('kurs-termin-online-link').value.trim() || null,
            kosten_gesamt: document.getElementById('kurs-termin-kosten').value || null,
            status: document.getElementById('kurs-termin-status').value,
            notizen: document.getElementById('kurs-termin-notizen').value.trim() || null
        };

        // Teilnehmer sammeln
        const teilnehmerCheckboxes = document.querySelectorAll('#kurs-termin-teilnehmer-liste input[name="teilnehmer"]:checked');
        const teilnehmerIds = Array.from(teilnehmerCheckboxes).map(cb => cb.value);

        try {
            let newTerminId;
            if (terminId) {
                await DataManager.updateKursTermin(terminId, terminData);
                newTerminId = terminId;
            } else {
                const result = await DataManager.addKursTermin(terminData);
                newTerminId = result.id;
            }

            // Teilnehmer hinzufuegen
            for (const userId of teilnehmerIds) {
                await DataManager.addKursTeilnehmer({
                    termin_id: newTerminId,
                    user_id: userId,
                    status: 'angemeldet'
                });
            }

            this.showToast('Erfolg', 'Termin gespeichert', 'success');
            this.hideModal('kurs-termin-modal');
            await this.loadKurse();
        } catch (error) {
            console.error('Fehler beim Speichern des Termins:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // Kurs-Anbieter Modal
    showKursAnbieterModal: async function() {
        const liste = document.getElementById('kurs-anbieter-liste');
        const anbieter = await DataManager.getKursanbieter();

        if (anbieter.length === 0) {
            liste.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Keine Anbieter vorhanden</p>';
        } else {
            liste.innerHTML = anbieter.map(a => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #fff; border-radius: 6px; margin-bottom: 0.5rem; border: 1px solid #e0e0e0;">
                    <div>
                        <strong>${escapeHtml(a.name)}</strong>
                        ${a.email ? `<br><small style="color: #666;">${escapeHtml(a.email)}</small>` : ''}
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="App.deleteKursAnbieter(${a.id})" style="color: #e74c3c;">Loeschen</button>
                </div>
            `).join('');
        }

        this.showModal('kurs-anbieter-modal');
    },

    // Anbieter hinzufuegen
    addKursAnbieter: async function() {
        const nameInput = document.getElementById('neuer-anbieter-name');
        const name = nameInput.value.trim();
        if (!name) {
            this.showToast('Fehler', 'Bitte Name eingeben', 'error');
            return;
        }

        try {
            await DataManager.addKursAnbieter({ name });
            nameInput.value = '';
            this.showToast('Erfolg', 'Anbieter hinzugefuegt', 'success');
            this.showKursAnbieterModal(); // Liste neu laden
            await this.loadKurse(); // Kurse-Dropdowns aktualisieren
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Hinzufuegen fehlgeschlagen', 'error');
        }
    },

    // Anbieter loeschen
    deleteKursAnbieter: async function(id) {
        if (!confirm('Anbieter wirklich loeschen?')) return;

        try {
            await DataManager.deleteKursAnbieter(id);
            this.showToast('Erfolg', 'Anbieter geloescht', 'success');
            this.showKursAnbieterModal();
            await this.loadKurse();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Loeschen fehlgeschlagen', 'error');
        }
    },

    // Ablaufende Zertifikate anzeigen
    showAblaufendeZertifikate: function() {
        const tbody = document.getElementById('ablaufende-zertifikate-liste');
        if (!tbody) return;

        tbody.innerHTML = this.kurseState.ablaufend.map(z => {
            const tageBisAblauf = z.tage_bis_ablauf;
            const dringendClass = tageBisAblauf <= 14 ? 'color: #e74c3c; font-weight: 600;' : (tageBisAblauf <= 30 ? 'color: #e67e22;' : '');

            return `
                <tr>
                    <td>${escapeHtml(z.username || '-')}</td>
                    <td>${escapeHtml(z.kurs_name)}</td>
                    <td>
                        ${z.kategorie ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${z.kategorie_farbe}20; color: ${z.kategorie_farbe}; font-size: 0.8rem;">${escapeHtml(z.kategorie)}</span>` : '-'}
                    </td>
                    <td>${z.ist_pflicht ? '<span style="color: #e74c3c;">Ja</span>' : 'Nein'}</td>
                    <td>${z.zertifikat_datum ? new Date(z.zertifikat_datum).toLocaleDateString('de-DE') : '-'}</td>
                    <td>${new Date(z.zertifikat_ablauf).toLocaleDateString('de-DE')}</td>
                    <td style="text-align: right; ${dringendClass}">${tageBisAblauf} Tage</td>
                </tr>
            `;
        }).join('');

        this.showModal('ablaufende-zertifikate-modal');
    },

    // ==================== ANWESENHEITSPLANUNG ====================

    // Anwesenheit-State
    anwesenheitState: {
        currentMonth: new Date(),
        meineCurrentMonth: new Date(),
        planung: [],
        bestellungen: [],
        heuteAnwesend: [],
        selectedDates: [] // Ausgewählte Tage für Musterauswahl
    },

    // Anwesenheit laden
    loadAnwesenheit: async function() {
        try {
            const year = this.anwesenheitState.currentMonth.getFullYear();
            const month = this.anwesenheitState.currentMonth.getMonth();

            // Titel setzen (Admin-Kalender)
            const monatNamen = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
            const adminTitel = document.getElementById('anwesenheit-monat-titel');
            if (adminTitel) adminTitel.textContent = `${monatNamen[month]} ${year}`;

            // Titel setzen (User-Kalender)
            const meineYear = this.anwesenheitState.meineCurrentMonth.getFullYear();
            const meineMonth = this.anwesenheitState.meineCurrentMonth.getMonth();
            const meineTitel = document.getElementById('meine-anwesenheit-monat-titel');
            if (meineTitel) meineTitel.textContent = `${monatNamen[meineMonth]} ${meineYear}`;

            // Daten laden - sowohl Admin-Monat als auch User-Monat abdecken
            // Lokales Datum-Format verwenden um UTC-Konvertierungsprobleme zu vermeiden
            const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const adminStart = new Date(year, month, 1);
            const adminEnd = new Date(year, month + 1, 0);
            const userStart = new Date(meineYear, meineMonth, 1);
            const userEnd = new Date(meineYear, meineMonth + 1, 0);

            // Min/Max Datum fuer Query
            const startDate = formatDate(new Date(Math.min(adminStart.getTime(), userStart.getTime())));
            const endDate = formatDate(new Date(Math.max(adminEnd.getTime(), userEnd.getTime())));

            this.anwesenheitState.planung = await DataManager.getAnwesenheitRange(startDate, endDate);
            this.anwesenheitState.heuteAnwesend = await DataManager.getHeuteAnwesend();

            // Statistiken berechnen (Admin)
            const heute = new Date().toISOString().split('T')[0];
            const heutePlanung = this.anwesenheitState.planung.filter(p => p.datum === heute);
            const heuteImBuero = heutePlanung.filter(p => p.im_buero).length;
            const heuteEssen = heutePlanung.filter(p => p.mittagessen).length;
            const monatEssen = this.anwesenheitState.planung.filter(p => p.mittagessen).length;
            const heuteHomeoffice = heutePlanung.filter(p => p.abwesenheit_grund === 'homeoffice').length;

            document.getElementById('stat-anwesenheit-heute').textContent = heuteImBuero;
            document.getElementById('stat-anwesenheit-essen-heute').textContent = heuteEssen;
            document.getElementById('stat-anwesenheit-essen-monat').textContent = monatEssen;
            document.getElementById('stat-anwesenheit-homeoffice').textContent = heuteHomeoffice;

            // UI rendern
            if (Auth.isAdmin()) {
                this.renderAnwesenheitKalenderAdmin();
            }
            this.renderMeineAnwesenheit();
            this.renderHeuteAnwesend();
        } catch (error) {
            console.error('Fehler beim Laden der Anwesenheit:', error);
            this.showToast('Fehler', 'Anwesenheit konnte nicht geladen werden', 'error');
        }
    },

    // Admin: Monatskalender rendern
    renderAnwesenheitKalenderAdmin: function() {
        const container = document.getElementById('anwesenheit-kalender-container');
        if (!container) return;

        const year = this.anwesenheitState.currentMonth.getFullYear();
        const month = this.anwesenheitState.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Montag = 0

        let html = '';

        // Leere Zellen vor dem 1.
        for (let i = 0; i < startDayOfWeek; i++) {
            html += '<div class="kalender-tag leer"></div>';
        }

        // Tage des Monats
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const datum = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tagesPlanung = this.anwesenheitState.planung.filter(p => p.datum === datum);
            const essenCount = tagesPlanung.filter(p => p.mittagessen).length;
            const bueroCount = tagesPlanung.filter(p => p.im_buero).length;

            const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
            const isToday = datum === new Date().toISOString().split('T')[0];

            html += `
                <div class="kalender-tag ${isWeekend ? 'wochenende' : ''} ${isToday ? 'heute' : ''}" onclick="App.showAnwesenheitDetails('${datum}')">
                    <div class="kalender-tag-nummer">${day}</div>
                    ${essenCount > 0 ? `<div style="font-size: 0.7rem; color: #27ae60;"><strong>${essenCount}</strong> Essen</div>` : ''}
                    ${bueroCount > 0 ? `<div style="font-size: 0.7rem; color: #3498db;">${bueroCount} im Büro</div>` : ''}
                </div>
            `;
        }

        container.innerHTML = html;
    },

    // User: Meine Anwesenheit als Monatskalender rendern
    renderMeineAnwesenheit: async function() {
        const container = document.getElementById('meine-anwesenheit-kalender');
        if (!container) return;

        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) return;

        const year = this.anwesenheitState.meineCurrentMonth.getFullYear();
        const month = this.anwesenheitState.meineCurrentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Montag = 0

        // Initialisiere selectedDates falls nicht vorhanden
        if (!this.anwesenheitState.selectedDates) {
            this.anwesenheitState.selectedDates = [];
        }

        let html = '';

        // Leere Zellen vor dem 1.
        for (let i = 0; i < startDayOfWeek; i++) {
            html += '<div class="kalender-tag leer"></div>';
        }

        // Tage des Monats
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const datum = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const planung = this.anwesenheitState.planung.find(p => p.datum === datum && p.user_id === currentUserId);
            const dateObj = new Date(year, month, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const isToday = datum === new Date().toISOString().split('T')[0];
            const isSelected = this.anwesenheitState.selectedDates.includes(datum);

            // Status ermitteln
            let statusClass = '';
            if (isSelected) {
                statusClass = 'ausgewählt'; // Lila - ausgewählt
            } else if (planung) {
                if (planung.im_buero && planung.mittagessen) {
                    statusClass = 'anwesend'; // Gruen
                } else if (planung.im_buero && !planung.mittagessen) {
                    statusClass = 'buero-ohne-essen'; // Blau
                } else if (planung.abwesenheit_grund === 'homeoffice') {
                    statusClass = 'homeoffice'; // Orange
                } else if (planung.abwesenheit_grund === 'urlaub') {
                    statusClass = 'urlaub'; // Rot
                }
            }

            const clickAction = `onclick="App.toggleAnwesenheitAuswahl('${datum}')"`;

            html += `
                <div class="kalender-tag ${isWeekend ? 'wochenende' : ''} ${isToday ? 'heute' : ''} ${statusClass}"
                     ${clickAction}
                     style="cursor: pointer;">
                    <div class="kalender-tag-nummer">${day}</div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    // Tag zur Auswahl hinzufuegen/entfernen
    toggleAnwesenheitAuswahl: function(datum) {
        if (!this.anwesenheitState.selectedDates) {
            this.anwesenheitState.selectedDates = [];
        }

        const index = this.anwesenheitState.selectedDates.indexOf(datum);
        if (index > -1) {
            this.anwesenheitState.selectedDates.splice(index, 1);
        } else {
            this.anwesenheitState.selectedDates.push(datum);
        }

        this.renderMeineAnwesenheit();
    },

    // Auswahl speichern
    saveAnwesenheitAuswahl: async function() {
        const selectedDates = this.anwesenheitState.selectedDates || [];
        if (selectedDates.length === 0) {
            this.showToast('Hinweis', 'Bitte waehle zuerst Tage aus', 'info');
            return;
        }

        const status = document.getElementById('anwesenheit-auswahl-status').value;
        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        let erfolg = 0;
        let fehler = 0;

        for (const datum of selectedDates) {
            let data = {
                user_id: currentUserId,
                datum: datum,
                im_buero: false,
                mittagessen: false,
                abwesenheit_grund: null
            };

            switch(status) {
                case 'buero_essen':
                    data.im_buero = true;
                    data.mittagessen = true;
                    break;
                case 'buero_ohne_essen':
                    data.im_buero = true;
                    data.mittagessen = false;
                    break;
                case 'homeoffice':
                    data.abwesenheit_grund = 'homeoffice';
                    break;
                case 'urlaub':
                    data.abwesenheit_grund = 'urlaub';
                    break;
                case 'nicht_da':
                    // Alles false/null
                    break;
            }

            try {
                await DataManager.upsertAnwesenheit(data);
                erfolg++;
            } catch (error) {
                console.error('Fehler beim Speichern von', datum, ':', error);
                fehler++;
            }
        }

        this.anwesenheitState.selectedDates = [];
        await this.loadAnwesenheit();

        if (fehler > 0) {
            this.showToast('Teilweise gespeichert', `${erfolg} OK, ${fehler} Fehler`, 'warning');
        } else {
            this.showToast('Gespeichert', `${erfolg} Tage gespeichert`, 'success');
        }
    },

    // Auswahl zuruecksetzen
    clearAnwesenheitAuswahl: function() {
        this.anwesenheitState.selectedDates = [];
        this.renderMeineAnwesenheit();
    },

    // Einfacher Toggle: Klick = Anwesend/Nicht anwesend
    toggleAnwesenheitTag: async function(datum) {
        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        // Aktuellen Status pruefen
        const planung = this.anwesenheitState.planung.find(p => p.datum === datum && p.user_id === currentUserId);
        const istAnwesend = planung && planung.im_buero && planung.mittagessen;

        try {
            if (istAnwesend) {
                // Abwaehlen: Eintrag loeschen oder auf nicht-anwesend setzen
                await DataManager.upsertAnwesenheit({
                    user_id: currentUserId,
                    datum: datum,
                    im_buero: false,
                    mittagessen: false,
                    abwesenheit_grund: null
                });
            } else {
                // Anwaehlen: Buero + Mittagessen
                await DataManager.upsertAnwesenheit({
                    user_id: currentUserId,
                    datum: datum,
                    im_buero: true,
                    mittagessen: true,
                    abwesenheit_grund: null
                });
            }

            // Daten neu laden
            await this.loadAnwesenheit();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // Modal fuer Tagesauswahl anzeigen
    showAnwesenheitTagModal: async function(datum) {
        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        // Aktuellen Status pruefen
        const planung = this.anwesenheitState.planung.find(p => p.datum === datum && p.user_id === currentUserId);

        // Datum formatieren
        const dateObj = new Date(datum);
        const wochentage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const monate = ['Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        const datumFormatiert = `${wochentage[dateObj.getDay()]}, ${dateObj.getDate()}. ${monate[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

        // Status ermitteln
        let currentStatus = 'nicht_da';
        if (planung) {
            if (planung.im_buero && planung.mittagessen) {
                currentStatus = 'buero_essen';
            } else if (planung.im_buero && !planung.mittagessen) {
                currentStatus = 'buero_ohne_essen';
            } else if (planung.abwesenheit_grund === 'homeoffice') {
                currentStatus = 'homeoffice';
            }
        }

        // Modal-Inhalt
        const modal = document.getElementById('anwesenheit-tag-modal');
        if (!modal) {
            console.error('Modal anwesenheit-tag-modal nicht gefunden');
            return;
        }

        document.getElementById('anwesenheit-tag-datum').textContent = datumFormatiert;
        document.getElementById('anwesenheit-tag-datum-hidden').value = datum;

        // Radio-Buttons setzen
        const radios = document.getElementsByName('anwesenheit-status');
        radios.forEach(r => {
            r.checked = (r.value === currentStatus);
        });

        this.showModal('anwesenheit-tag-modal');
    },

    // Anwesenheit speichern aus Modal
    saveAnwesenheitTag: async function() {
        const datum = document.getElementById('anwesenheit-tag-datum-hidden').value;
        const status = document.querySelector('input[name="anwesenheit-status"]:checked')?.value;

        if (!datum || !status) {
            this.showToast('Fehler', 'Bitte Status auswaehlen', 'error');
            return;
        }

        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        try {
            let data = {
                user_id: currentUserId,
                datum: datum,
                im_buero: false,
                mittagessen: false,
                abwesenheit_grund: null
            };

            switch(status) {
                case 'buero_essen':
                    data.im_buero = true;
                    data.mittagessen = true;
                    break;
                case 'buero_ohne_essen':
                    data.im_buero = true;
                    data.mittagessen = false;
                    break;
                case 'homeoffice':
                    data.abwesenheit_grund = 'homeoffice';
                    break;
                case 'urlaub':
                    data.abwesenheit_grund = 'urlaub';
                    break;
                case 'nicht_da':
                    // Alles false/null
                    break;
            }

            await DataManager.upsertAnwesenheit(data);
            this.hideModal('anwesenheit-tag-modal');
            await this.loadAnwesenheit();
            this.showToast('Gespeichert', 'Anwesenheit gespeichert', 'success');
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // User-Kalender Monat vor/zurueck
    meineAnwesenheitPrevMonth: function() {
        this.anwesenheitState.meineCurrentMonth.setMonth(this.anwesenheitState.meineCurrentMonth.getMonth() - 1);
        this.anwesenheitState.selectedDates = [];
        this.loadAnwesenheit();
    },

    meineAnwesenheitNextMonth: function() {
        this.anwesenheitState.meineCurrentMonth.setMonth(this.anwesenheitState.meineCurrentMonth.getMonth() + 1);
        this.anwesenheitState.selectedDates = [];
        this.loadAnwesenheit();
    },

    // Heute anwesend rendern
    renderHeuteAnwesend: function() {
        const container = document.getElementById('heute-anwesend-liste');
        if (!container) return;

        if (this.anwesenheitState.heuteAnwesend.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">Keine Anwesenheiten fuer heute geplant</p>';
            return;
        }

        const imBuero = this.anwesenheitState.heuteAnwesend.filter(a => a.im_buero);
        const homeoffice = this.anwesenheitState.heuteAnwesend.filter(a => a.abwesenheit_grund === 'homeoffice');

        let html = '';

        if (imBuero.length > 0) {
            html += '<div style="margin-bottom: 1rem;"><strong>Im Büro:</strong><br>';
            html += imBuero.map(a => `
                <span style="display: inline-block; padding: 4px 12px; background: ${a.mittagessen ? '#e8f5e9' : '#e3f2fd'}; border-radius: 20px; margin: 4px 4px 0 0; font-size: 0.9rem;">
                    ${escapeHtml(a.username || a.email)}
                    ${a.mittagessen ? '🍽️' : ''}
                </span>
            `).join('');
            html += '</div>';
        }

        if (homeoffice.length > 0) {
            html += '<div><strong>Home Office:</strong><br>';
            html += homeoffice.map(a => `
                <span style="display: inline-block; padding: 4px 12px; background: #f3e5f5; border-radius: 20px; margin: 4px 4px 0 0; font-size: 0.9rem;">
                    ${escapeHtml(a.username || a.email)} 🏠
                </span>
            `).join('');
            html += '</div>';
        }

        container.innerHTML = html;
    },

    // Anwesenheit-Formular oeffnen
    showAnwesenheitForm: function(datum) {
        document.getElementById('anwesenheit-form-datum').value = datum;
        const dateObj = new Date(datum);
        const wochentagNamen = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        document.getElementById('anwesenheit-datum-display').textContent = `${wochentagNamen[dateObj.getDay()]}, ${dateObj.toLocaleDateString('de-DE')}`;

        // Radio-Buttons Event-Listener
        document.querySelectorAll('input[name="anwesenheit-status"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const isAbwesend = radio.value === 'abwesend';
                document.getElementById('anwesenheit-grund-group').style.display = isAbwesend ? 'block' : 'none';
                document.getElementById('anwesenheit-notiz-group').style.display = isAbwesend ? 'block' : 'none';
            });
        });

        this.showModal('anwesenheit-form-modal');
    },

    // Anwesenheit speichern
    saveAnwesenheit: async function(event) {
        event.preventDefault();

        const datum = document.getElementById('anwesenheit-form-datum').value;
        const status = document.querySelector('input[name="anwesenheit-status"]:checked').value;
        const currentUserId = await DataManager.getCurrentPublicUserId();

        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        const planungData = {
            user_id: currentUserId,
            datum: datum,
            im_buero: status === 'buero_essen' || status === 'buero',
            mittagessen: status === 'buero_essen',
            abwesenheit_grund: status === 'abwesend' ? document.getElementById('anwesenheit-grund').value : (status === 'homeoffice' ? 'homeoffice' : null),
            abwesenheit_notiz: status === 'abwesend' ? document.getElementById('anwesenheit-notiz').value : null
        };

        try {
            await DataManager.upsertAnwesenheit(planungData);
            this.showToast('Erfolg', 'Anwesenheit gespeichert', 'success');
            this.hideModal('anwesenheit-form-modal');
            await this.loadAnwesenheit();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // Schnellauswahl: Ganze Woche setzen
    setAnwesenheitWoche: async function(typ) {
        const currentUserId = await DataManager.getCurrentPublicUserId();
        if (!currentUserId) {
            this.showToast('Fehler', 'Nicht eingeloggt', 'error');
            return;
        }

        // Naechste 5 Werktage
        const tage = [];
        let date = new Date();
        while (tage.length < 5) {
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                tage.push(date.toISOString().split('T')[0]);
            }
            date.setDate(date.getDate() + 1);
        }

        try {
            for (const datum of tage) {
                const planungData = {
                    user_id: currentUserId,
                    datum: datum,
                    im_buero: typ === 'buero_essen' || typ === 'buero',
                    mittagessen: typ === 'buero_essen',
                    abwesenheit_grund: typ === 'homeoffice' ? 'homeoffice' : null
                };
                await DataManager.upsertAnwesenheit(planungData);
            }
            this.showToast('Erfolg', 'Woche geplant', 'success');
            await this.loadAnwesenheit();
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Planung fehlgeschlagen', 'error');
        }
    },

    // Monat vor/zurueck
    anwesenheitPrevMonth: function() {
        this.anwesenheitState.currentMonth.setMonth(this.anwesenheitState.currentMonth.getMonth() - 1);
        this.loadAnwesenheit();
    },

    anwesenheitNextMonth: function() {
        this.anwesenheitState.currentMonth.setMonth(this.anwesenheitState.currentMonth.getMonth() + 1);
        this.loadAnwesenheit();
    },

    // Bestellungen Modal
    showBestellungModal: async function() {
        const bestellungen = await DataManager.getEssensgutscheinBestellungen();
        const tbody = document.getElementById('bestellungen-liste');

        // Aktuellen Monat setzen
        const jetzt = new Date();
        document.getElementById('bestellung-monat').value = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}`;

        if (bestellungen.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Keine Bestellungen vorhanden</td></tr>';
        } else {
            tbody.innerHTML = bestellungen.map(b => {
                const monatNamen = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                const statusBadge = {
                    'offen': '<span class="badge" style="background: #3498db;">Offen</span>',
                    'bestellt': '<span class="badge" style="background: #e67e22;">Bestellt</span>',
                    'geliefert': '<span class="badge" style="background: #27ae60;">Geliefert</span>'
                }[b.status] || b.status;

                return `
                    <tr>
                        <td>${monatNamen[b.monat - 1]} ${b.jahr}</td>
                        <td style="text-align: right;">${b.anzahl_geplant || 0}</td>
                        <td style="text-align: right;">${b.anzahl_bestellt}</td>
                        <td>${statusBadge}</td>
                        <td style="text-align: right;">
                            <select onchange="App.updateBestellungStatus(${b.id}, this.value)" class="form-control" style="width: auto; padding: 0.25rem;">
                                <option value="offen" ${b.status === 'offen' ? 'selected' : ''}>Offen</option>
                                <option value="bestellt" ${b.status === 'bestellt' ? 'selected' : ''}>Bestellt</option>
                                <option value="geliefert" ${b.status === 'geliefert' ? 'selected' : ''}>Geliefert</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.showModal('bestellung-modal');
    },

    // Bestellung speichern
    saveBestellung: async function() {
        const monatInput = document.getElementById('bestellung-monat').value;
        const anzahl = document.getElementById('bestellung-anzahl').value;

        if (!monatInput) {
            this.showToast('Fehler', 'Bitte Monat waehlen', 'error');
            return;
        }

        const [jahr, monat] = monatInput.split('-').map(Number);

        try {
            await DataManager.upsertEssensgutscheinBestellung({
                jahr,
                monat,
                anzahl_bestellt: anzahl,
                status: 'offen'
            });
            this.showToast('Erfolg', 'Bestellung gespeichert', 'success');
            this.showBestellungModal(); // Liste aktualisieren
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Speichern fehlgeschlagen', 'error');
        }
    },

    // Bestellungs-Status aendern
    updateBestellungStatus: async function(id, status) {
        try {
            await DataManager.updateEssensgutscheinBestellung(id, { status });
            this.showToast('Erfolg', 'Status aktualisiert', 'success');
        } catch (error) {
            console.error('Fehler:', error);
            this.showToast('Fehler', 'Aktualisierung fehlgeschlagen', 'error');
        }
    },

    // Anwesenheit Details anzeigen (Admin)
    showAnwesenheitDetails: function(datum) {
        const tagesPlanung = this.anwesenheitState.planung.filter(p => p.datum === datum);
        if (tagesPlanung.length === 0) {
            this.showToast('Info', 'Keine Planungen fuer diesen Tag', 'info');
            return;
        }

        let message = `${new Date(datum).toLocaleDateString('de-DE')}:\n\n`;
        tagesPlanung.forEach(p => {
            const name = p.username || p.user_id;
            let status = 'Unbekannt';
            if (p.im_buero && p.mittagessen) status = 'Büro + Essen';
            else if (p.im_buero) status = 'Büro';
            else if (p.abwesenheit_grund) status = p.abwesenheit_grund;
            message += `${name}: ${status}\n`;
        });

        alert(message);
    }
};

// App starten wenn Seite geladen
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

/**
 * PROJEKTSOFTWARE KUNST MERAN - DATA MODULE
 * Datenverwaltung mit localStorage + DATEV Import
 * Version: 4.0.0
 */

// ==========================================
// PROJEKT-STAMMDATEN (Feste IDs aus DATEV)
// ==========================================
const KUNST_MERAN_PROJEKTE = {
    2601: { id: 2601, name: "Complice", status: "aktiv", beschreibung: "Ausstellung Complice" },
    2602: { id: 2602, name: "Animacies", status: "aktiv", beschreibung: "Ausstellung Animacies" },
    2603: { id: 2603, name: "Stadtraum Meran", status: "aktiv", beschreibung: "Projekt Stadtraum Meran" },
    2604: { id: 2604, name: "Wanderausstellung", status: "aktiv", beschreibung: "Wanderausstellung" },
    2605: { id: 2605, name: "Konzertreihe", status: "aktiv", beschreibung: "Konzertreihe Kunsthaus" },
    2606: { id: 2606, name: "Menschenbilder", status: "aktiv", beschreibung: "Ausstellung Menschenbilder" },
    2607: { id: 2607, name: "Rahmenprogramm", status: "aktiv", beschreibung: "Rahmenprogramm & Events" }
};

// ==========================================
// KOSTENTYPEN FÜR PROJEKTE
// ==========================================
const KOSTENTYPEN = {
    KURATION: { id: 'kuration', name: 'Kuration', farbe: '#3498db' },
    KUENSTLERAUSGABE: { id: 'kuenstlerausgabe', name: 'Künstlerausgabe', farbe: '#9b59b6' },
    TRANSPORT: { id: 'transport', name: 'Transport', farbe: '#e67e22' },
    PRODUKTION: { id: 'produktion', name: 'Produktion', farbe: '#27ae60' },
    VERMITTLUNG: { id: 'vermittlung', name: 'Vermittlung', farbe: '#1abc9c' },
    DOKUMENTATION: { id: 'dokumentation', name: 'Dokumentation', farbe: '#34495e' },
    KOMMUNIKATION: { id: 'kommunikation', name: 'Kommunikation', farbe: '#e74c3c' }
};

// Kostentyp-Array für Dropdowns
const KOSTENTYPEN_LISTE = Object.values(KOSTENTYPEN);

// MwSt-Sätze für Italien
const MWST_SAETZE = {
    STANDARD: 0.22,      // 22% Standard-MwSt
    REDUZIERT: 0.10,     // 10% reduziert
    SUPER_REDUZIERT: 0.04, // 4% super-reduziert
    BEFREIT: 0            // MwSt-befreit
};

// Pro-Rata Sätze (nicht absetzbare MwSt)
const PRO_RATA = {
    AKTUELL: 0.85,       // 85% absetzbar (15% nicht absetzbar)
    VORJAHR: 0.86        // 86% absetzbar (14% nicht absetzbar)
};

// Rechnungs-Status Workflow
const RECHNUNG_STATUS = {
    NEU: 'neu',                    // Neue Rechnung aus DATEV
    KONTROLLIERT: 'kontrolliert',  // Von Mitarbeiter geprüft
    BEZAHLT: 'bezahlt'             // Von Barbara bezahlt
};

// Abgabestellen
const ABGABESTELLEN = {
    GEMEINDE: 'gemeinde',
    REGION: 'region',
    PROVINZ: 'provinz'
};

const DataManager = {
    // Storage Keys
    KEYS: {
        USERS: 'km_users',
        PROJECTS: 'km_projects',
        BUDGETS: 'km_budgets',
        COSTS: 'km_costs',
        SESSION: 'km_session',
        CONFIG: 'km_config',
        TIMETRACKING: 'km_timetracking',
        SUPPLIERS: 'km_suppliers',
        PLANNED_COSTS: 'km_planned_costs',  // Originalplanung
        DATEV_BUCHUNGEN: 'km_datev_buchungen',  // DATEV-Import Buchungen
        RECHNUNGEN_STATUS: 'km_rechnungen_status',  // Separater Status für Rechnungen
        LIEFERANTEN_NAMEN: 'km_lieferanten_namen',  // Manuelles Mapping Partita IVA -> Name
        // Neue Module (ehemals Notion)
        SITZUNGEN: 'km_sitzungen',
        KUENSTLER: 'km_kuenstler',
        INVENTAR: 'km_inventar',
        ADRESSEN: 'km_adressen',
        TASKS: 'km_tasks',  // Aufgaben aus Sitzungen
        // Einnahmenplanung
        EINNAHMEN: 'km_einnahmen',
        EINNAHMEN_DOKUMENTE: 'km_einnahmen_dokumente'  // Base64-encoded Dokumente
    },

    // Pfade
    PATHS: {
        BUCHUNGEN_JSON: 'data/buchungen.json',
        STATUS_JSON: 'data/rechnungen_status.json',
        EK_RECHNUNGEN: 'EK-Rechnungen/'
    },

    // Aktuell geladenes Jahr (null = aktuelles Jahr)
    currentYear: null,

    /**
     * Initialisiert die Datenbank mit Standardwerten
     */
    init: function() {
        // Benutzer initialisieren falls nicht vorhanden
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'Admin',
                    password: 'KunstMeran2026',
                    role: 'admin',
                    name: 'Administrator',
                    hourlyRate: 0  // Stundensatz (nur Admin sichtbar)
                },
                {
                    id: 2,
                    username: 'Mitarbeiter1',
                    password: 'Test123',
                    role: 'mitarbeiter',
                    name: 'Max Mustermann',
                    hourlyRate: 25  // 25 EUR/Stunde
                }
            ];
            this.save(this.KEYS.USERS, defaultUsers);
        }

        // Projekte initialisieren - Kunst Meran Projekte aus DATEV
        // Immer aktualisieren, um sicherzustellen dass die neuesten Projekte geladen sind
        const kunstMeranProjects = [
            {
                id: 2601,
                datevId: 2601,
                name: 'Complice',
                location: 'Kunst Meran',
                description: 'Ausstellung Complice',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2602,
                datevId: 2602,
                name: 'Animacies',
                location: 'Kunst Meran',
                description: 'Ausstellung Animacies',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2603,
                datevId: 2603,
                name: 'Stadtraum Meran',
                location: 'Kunst Meran / Stadtraum',
                description: 'Projekt Stadtraum Meran',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2604,
                datevId: 2604,
                name: 'Wanderausstellung',
                location: 'Diverse',
                description: 'Wanderausstellung',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2605,
                datevId: 2605,
                name: 'Konzertreihe',
                location: 'Kunst Meran',
                description: 'Konzertreihe Kunsthaus',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2606,
                datevId: 2606,
                name: 'Menschenbilder',
                location: 'Kunst Meran',
                description: 'Ausstellung Menschenbilder',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            },
            {
                id: 2607,
                datevId: 2607,
                name: 'Rahmenprogramm',
                location: 'Kunst Meran',
                description: 'Rahmenprogramm & Events',
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'laufend',
                budget: 0,
                createdBy: 1,
                createdAt: '2026-01-01'
            }
        ];
        this.save(this.KEYS.PROJECTS, kunstMeranProjects);

        // Budget-Positionen initialisieren
        if (!localStorage.getItem(this.KEYS.BUDGETS)) {
            const sampleBudgets = [
                // Projekt 2: Frühjahrsausstellung
                { id: 1, projectId: 2, category: 'Personal', description: 'Kurator', amount: 8000 },
                { id: 2, projectId: 2, category: 'Personal', description: 'Assistenz', amount: 4000 },
                { id: 3, projectId: 2, category: 'Material', description: 'Ausstellungsmaterial', amount: 5000 },
                { id: 4, projectId: 2, category: 'Dienstleistungen', description: 'Transport Kunstwerke', amount: 12000 },
                { id: 5, projectId: 2, category: 'Dienstleistungen', description: 'Versicherung', amount: 6000 },
                { id: 6, projectId: 2, category: 'Sonstiges', description: 'Marketing/Werbung', amount: 10000 },
                // Projekt 3: Sommerausstellung
                { id: 7, projectId: 3, category: 'Personal', description: 'Kurator', amount: 10000 },
                { id: 8, projectId: 3, category: 'Material', description: 'Ausstellungsaufbau', amount: 15000 },
                { id: 9, projectId: 3, category: 'Dienstleistungen', description: 'Internationale Transporte', amount: 20000 },
                { id: 10, projectId: 3, category: 'Reise', description: 'Künstlerbetreuung', amount: 5000 },
                { id: 11, projectId: 3, category: 'Sonstiges', description: 'Eröffnungsveranstaltung', amount: 10000 }
            ];
            this.save(this.KEYS.BUDGETS, sampleBudgets);
        }

        // Kosten initialisieren
        if (!localStorage.getItem(this.KEYS.COSTS)) {
            const sampleCosts = [
                // IST-Kosten Projekt 2
                { id: 1, projectId: 2, type: 'ist', category: 'Personal', description: 'Kurator Honorar Q1', amount: 4000, date: '2026-03-31', invoice: 'RG-2026-0045', supplierId: 1, plannedCostId: 1 },
                { id: 2, projectId: 2, type: 'ist', category: 'Material', description: 'Rahmen und Befestigung', amount: 2500, date: '2026-03-15', invoice: 'RG-2026-0038', supplierId: 2, plannedCostId: 3 },
                { id: 3, projectId: 2, type: 'ist', category: 'Dienstleistungen', description: 'Transport Lieferung 1', amount: 6000, date: '2026-02-28', invoice: 'RG-2026-0022', supplierId: 3, plannedCostId: 4 },
                { id: 4, projectId: 2, type: 'ist', category: 'Sonstiges', description: 'Flyer Druck', amount: 3000, date: '2026-03-20', invoice: 'RG-2026-0041', supplierId: 4, plannedCostId: 6 },
                // Provisorische Kosten Projekt 2
                { id: 5, projectId: 2, type: 'provisorisch', category: 'Personal', description: 'Kurator Honorar Q2', amount: 4000, date: '2026-06-30', invoice: '', supplierId: 1, plannedCostId: 2 },
                { id: 6, projectId: 2, type: 'provisorisch', category: 'Dienstleistungen', description: 'Transport Rückführung', amount: 6000, date: '2026-07-15', invoice: '', supplierId: 3, plannedCostId: 5 },
                // IST-Kosten Projekt 3
                { id: 7, projectId: 3, type: 'ist', category: 'Personal', description: 'Kurator Anzahlung', amount: 3000, date: '2026-05-15', invoice: 'RG-2026-0078', supplierId: 1, plannedCostId: 7 },
                // Provisorische Kosten Projekt 3
                { id: 8, projectId: 3, type: 'provisorisch', category: 'Dienstleistungen', description: 'Internationale Transporte', amount: 20000, date: '2026-06-30', invoice: '', supplierId: 3, plannedCostId: 9 },
                { id: 9, projectId: 3, type: 'provisorisch', category: 'Material', description: 'Aufbaumaterial', amount: 15000, date: '2026-06-15', invoice: '', supplierId: 2, plannedCostId: 8 }
            ];
            this.save(this.KEYS.COSTS, sampleCosts);
        }

        // Geplante Kosten initialisieren (Originalplanung)
        if (!localStorage.getItem(this.KEYS.PLANNED_COSTS)) {
            const samplePlannedCosts = [
                // Projekt 2: Frühjahrsausstellung - Originalplanung
                { id: 1, projectId: 2, category: 'Personal', description: 'Kurator Honorar Q1', plannedAmount: 4000, supplierId: 1, createdAt: '2026-01-10' },
                { id: 2, projectId: 2, category: 'Personal', description: 'Kurator Honorar Q2', plannedAmount: 4000, supplierId: 1, createdAt: '2026-01-10' },
                { id: 3, projectId: 2, category: 'Material', description: 'Ausstellungsmaterial', plannedAmount: 3000, supplierId: 2, createdAt: '2026-01-10' },
                { id: 4, projectId: 2, category: 'Dienstleistungen', description: 'Transport Hinfahrt', plannedAmount: 6000, supplierId: 3, createdAt: '2026-01-10' },
                { id: 5, projectId: 2, category: 'Dienstleistungen', description: 'Transport Rückfahrt', plannedAmount: 6000, supplierId: 3, createdAt: '2026-01-10' },
                { id: 6, projectId: 2, category: 'Sonstiges', description: 'Marketing/Werbung', plannedAmount: 5000, supplierId: 4, createdAt: '2026-01-10' },
                // Projekt 3: Sommerausstellung - Originalplanung
                { id: 7, projectId: 3, category: 'Personal', description: 'Kurator', plannedAmount: 10000, supplierId: 1, createdAt: '2026-02-20' },
                { id: 8, projectId: 3, category: 'Material', description: 'Aufbaumaterial', plannedAmount: 15000, supplierId: 2, createdAt: '2026-02-20' },
                { id: 9, projectId: 3, category: 'Dienstleistungen', description: 'Internationale Transporte', plannedAmount: 18000, supplierId: 3, createdAt: '2026-02-20' }
            ];
            this.save(this.KEYS.PLANNED_COSTS, samplePlannedCosts);
        }

        // Konfiguration initialisieren - immer mit aktuellen Kostentypen
        const defaultConfig = {
            costTypes: [
                { id: 'kuration', name: 'Kuration', color: '#3498db', active: true },
                { id: 'kuenstlerausgabe', name: 'Künstlerausgabe', color: '#9b59b6', active: true },
                { id: 'transport', name: 'Transport', color: '#e67e22', active: true },
                { id: 'produktion', name: 'Produktion', color: '#27ae60', active: true },
                { id: 'vermittlung', name: 'Vermittlung', color: '#1abc9c', active: true },
                { id: 'dokumentation', name: 'Dokumentation', color: '#34495e', active: true },
                { id: 'kommunikation', name: 'Kommunikation', color: '#e74c3c', active: true }
            ],
            projectStatuses: [
                { id: 1, name: 'planung', label: 'Planung', color: '#3498db' },
                { id: 2, name: 'laufend', label: 'Laufend', color: '#27ae60' },
                { id: 3, name: 'abgeschlossen', label: 'Abgeschlossen', color: '#95a5a6' }
            ]
        };
        this.save(this.KEYS.CONFIG, defaultConfig);

        // Lieferanten initialisieren (mit externer ID für Buchhaltung)
        if (!localStorage.getItem(this.KEYS.SUPPLIERS)) {
            const defaultSuppliers = [
                { id: 1, externalId: 'LF-001', name: 'Dr. Maria Huber (Kuratorin)', type: 'Personal', active: true, taxId: '', address: '', notes: '' },
                { id: 2, externalId: 'LF-002', name: 'Kunstbedarf Meran GmbH', type: 'Material', active: true, taxId: 'IT01234567890', address: 'Freiheitsstr. 45, 39012 Meran', notes: '' },
                { id: 3, externalId: 'LF-003', name: 'TransArt Spedition', type: 'Dienstleistungen', active: true, taxId: 'IT09876543210', address: 'Industriezone 12, 39100 Bozen', notes: '' },
                { id: 4, externalId: 'LF-004', name: 'Druckerei Alpenblick', type: 'Sonstiges', active: true, taxId: 'IT11122233344', address: 'Hauptplatz 8, 39012 Meran', notes: '' }
            ];
            this.save(this.KEYS.SUPPLIERS, defaultSuppliers);
        } else {
            // Migration: Externe ID hinzufügen falls nicht vorhanden
            let suppliers = this.getSuppliers();
            let needsSave = false;
            suppliers.forEach((s, idx) => {
                if (!s.externalId) {
                    s.externalId = 'LF-' + String(s.id).padStart(3, '0');
                    needsSave = true;
                }
            });
            if (needsSave) this.save(this.KEYS.SUPPLIERS, suppliers);
        }

        // Zeiterfassung initialisieren
        if (!localStorage.getItem(this.KEYS.TIMETRACKING)) {
            const sampleTimeEntries = [
                { id: 1, userId: 2, projectId: 2, date: '2026-05-20', hours: 4, description: 'Aufbau Ausstellung', createdAt: '2026-05-20T10:00:00' },
                { id: 2, userId: 2, projectId: 2, date: '2026-05-21', hours: 6, description: 'Kunstwerke platzieren', createdAt: '2026-05-21T16:00:00' },
                { id: 3, userId: 2, projectId: 3, date: '2026-05-22', hours: 2, description: 'Planungsbesprechung', createdAt: '2026-05-22T14:00:00' }
            ];
            this.save(this.KEYS.TIMETRACKING, sampleTimeEntries);
        }

        // Migration: hourlyRate zu Benutzern hinzufügen falls nicht vorhanden
        let users = this.getUsers();
        let usersNeedSave = false;
        users.forEach(u => {
            if (u.hourlyRate === undefined) {
                u.hourlyRate = u.role === 'admin' ? 0 : 25;
                usersNeedSave = true;
            }
        });
        if (usersNeedSave) this.save(this.KEYS.USERS, users);

        // Beispiel-Einnahmen für 2026 initialisieren (basierend auf Monatsbilanz)
        if (!localStorage.getItem(this.KEYS.EINNAHMEN)) {
            const sampleEinnahmen = [
                // 1.1 Erlöse Lieferungen/Leistungen (6001*)
                { id: 1, quelle: 'Shop Kunsthaus', typ: 'erloese', jahr: 2026, betragPlan: 38752, betragIst: 25800, status: 'erwartet', konto: '600101010', notizen: 'Verkauf Kataloge, Poster, Merchandise' },
                { id: 2, quelle: 'Bar-Verpachtung', typ: 'erloese', jahr: 2026, betragPlan: 36400, betragIst: 24200, status: 'bestaetigt', konto: '60010101550', notizen: 'Monatliche Pacht Café' },
                { id: 3, quelle: 'Ausstellungs-Eintritte', typ: 'erloese', jahr: 2026, betragPlan: 16248, betragIst: 10800, status: 'erwartet', konto: '600151051', notizen: 'Eintrittsgelder Ausstellungen' },
                { id: 4, quelle: 'Werbetätigkeit/Sponsoring-Gegenleistungen', typ: 'erloese', jahr: 2026, betragPlan: 64998, betragIst: 43300, status: 'erwartet', konto: '600151053', notizen: 'Logo-Platzierungen, Werbeflächen' },
                { id: 5, quelle: 'Bildung & Vermittlung', typ: 'erloese', jahr: 2026, betragPlan: 1327, betragIst: 885, status: 'unsicher', konto: '600151055', notizen: 'Führungen, Workshops' },

                // 1.2 Zuschüsse und Beiträge (6401*)
                { id: 6, quelle: 'Mitgliedsbeiträge Verein', typ: 'mitgliedsbeitrag', jahr: 2026, betragPlan: 13500, betragIst: 9000, status: 'bestaetigt', konto: '6401550', notizen: '~150 Mitglieder' },
                { id: 7, quelle: 'Spenden allgemein', typ: 'spende', jahr: 2026, betragPlan: 11900, betragIst: 7900, status: 'unsicher', konto: '6401551', notizen: 'Private Spender' },
                { id: 8, quelle: 'Gemeinde Meran', typ: 'zuschuss_gemeinde', jahr: 2026, betragPlan: 102600, betragIst: 68400, status: 'bestaetigt', faellig: '2026-06-30', konto: '6401552', notizen: 'Jährlicher Zuschuss, Vertrag bis 2028' },
                { id: 9, quelle: 'Autonome Provinz Bozen', typ: 'zuschuss_provinz', jahr: 2026, betragPlan: 354989, betragIst: 236659, status: 'bestaetigt', faellig: '2026-07-15', konto: '6401554', notizen: 'Kulturabteilung, größter Zuschussgeber' },
                { id: 10, quelle: 'Region Trentino-Südtirol', typ: 'zuschuss_region', jahr: 2026, betragPlan: 18000, betragIst: 12000, status: 'bestaetigt', konto: '6401556', notizen: 'Regionaler Kulturbeitrag' },
                { id: 11, quelle: 'Stiftung Südtiroler Sparkasse', typ: 'zuschuss_stiftung', jahr: 2026, betragPlan: 90000, betragIst: 60000, status: 'bestaetigt', faellig: '2026-09-01', konto: '6401557', notizen: 'Hauptsponsor, 3-Jahres-Vertrag' },

                // Sponsoring
                { id: 12, quelle: 'Firma Alperia AG', typ: 'sponsoring', jahr: 2026, betragPlan: 25000, betragIst: 0, status: 'erwartet', faellig: '2026-08-01', konto: '6401557', notizen: 'Gespräche laufen, Zusage erwartet' },
                { id: 13, quelle: 'Raiffeisen Landesbank', typ: 'sponsoring', jahr: 2026, betragPlan: 15000, betragIst: 15000, status: 'eingegangen', konto: '6401557', notizen: 'Bereits überwiesen' },
                { id: 14, quelle: 'Hotel Meranerhof', typ: 'sponsoring', jahr: 2026, betragPlan: 5000, betragIst: 0, status: 'unsicher', konto: '6401557', notizen: 'Noch keine Rückmeldung' },

                // Biennale Venedig (falls relevant)
                { id: 15, quelle: 'Öffentliche Beiträge Biennale Venedig', typ: 'zuschuss_provinz', jahr: 2026, betragPlan: 255000, betragIst: 170000, status: 'bestaetigt', konto: '6401565', notizen: 'Sonderprojekt Biennale' },

                // 1.3 Sonstige Erträge (6400*)
                { id: 16, quelle: 'Investitionsbeiträge', typ: 'sonstige', jahr: 2026, betragPlan: 73577, betragIst: 49050, status: 'erwartet', konto: '6401751', notizen: 'Für Anschaffungen/Renovierungen' },
                { id: 17, quelle: '5 Promille Steuerzuweisung', typ: 'sonstige', jahr: 2026, betragPlan: 3054, betragIst: 0, status: 'unsicher', faellig: '2026-12-31', konto: '6401260', notizen: 'Kommt erst Ende Jahr' }
            ];
            this.save(this.KEYS.EINNAHMEN, sampleEinnahmen);
        }

        console.log('DataManager initialized');
    },

    /**
     * Speichert Daten im localStorage
     */
    save: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    /**
     * Lädt Daten aus localStorage
     */
    load: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Generiert eine neue eindeutige ID
     */
    generateId: function(key) {
        const items = this.load(key) || [];
        if (items.length === 0) return 1;
        return Math.max(...items.map(item => item.id)) + 1;
    },

    // ==========================================
    // BENUTZER-FUNKTIONEN
    // ==========================================

    getUsers: function() {
        return this.load(this.KEYS.USERS) || [];
    },

    getUserById: function(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    },

    updateUser: function(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.save(this.KEYS.USERS, users);
            return users[index];
        }
        return null;
    },

    validateLogin: function(username, password) {
        const users = this.getUsers();
        return users.find(u => u.username === username && u.password === password);
    },

    // ==========================================
    // SESSION-FUNKTIONEN
    // ==========================================

    setSession: function(user) {
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };
        this.save(this.KEYS.SESSION, session);
    },

    getSession: function() {
        return this.load(this.KEYS.SESSION);
    },

    clearSession: function() {
        localStorage.removeItem(this.KEYS.SESSION);
    },

    isLoggedIn: function() {
        return this.getSession() !== null;
    },

    isAdmin: function() {
        const session = this.getSession();
        return session && session.role && session.role.toLowerCase() === 'admin';
    },

    // ==========================================
    // PROJEKT-FUNKTIONEN
    // ==========================================

    getProjects: function() {
        return this.load(this.KEYS.PROJECTS) || [];
    },

    getProjectById: function(id) {
        const projects = this.getProjects();
        return projects.find(p => p.id === id);
    },

    addProject: function(project) {
        const projects = this.getProjects();
        project.id = this.generateId(this.KEYS.PROJECTS);
        project.createdAt = new Date().toISOString().split('T')[0];
        project.createdBy = this.getSession().userId;
        projects.push(project);
        this.save(this.KEYS.PROJECTS, projects);
        return project;
    },

    updateProject: function(id, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            this.save(this.KEYS.PROJECTS, projects);
            return projects[index];
        }
        return null;
    },

    deleteProject: function(id) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        this.save(this.KEYS.PROJECTS, projects);

        // Auch Budget und Kosten löschen
        let budgets = this.getBudgets();
        budgets = budgets.filter(b => b.projectId !== id);
        this.save(this.KEYS.BUDGETS, budgets);

        let costs = this.getCosts();
        costs = costs.filter(c => c.projectId !== id);
        this.save(this.KEYS.COSTS, costs);

        // Geplante Kosten löschen
        let plannedCosts = this.getPlannedCosts();
        plannedCosts = plannedCosts.filter(pc => pc.projectId !== id);
        this.save(this.KEYS.PLANNED_COSTS, plannedCosts);

        // Zeiterfassung löschen
        let timeEntries = this.getTimeEntries();
        timeEntries = timeEntries.filter(t => t.projectId !== id);
        this.save(this.KEYS.TIMETRACKING, timeEntries);
    },

    // ==========================================
    // BUDGET-FUNKTIONEN
    // ==========================================

    getBudgets: function() {
        return this.load(this.KEYS.BUDGETS) || [];
    },

    getBudgetsByProject: function(projectId) {
        const budgets = this.getBudgets();
        return budgets.filter(b => b.projectId === projectId);
    },

    addBudgetItem: function(item) {
        const budgets = this.getBudgets();
        item.id = this.generateId(this.KEYS.BUDGETS);
        budgets.push(item);
        this.save(this.KEYS.BUDGETS, budgets);
        return item;
    },

    updateBudgetItem: function(id, updates) {
        const budgets = this.getBudgets();
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...updates };
            this.save(this.KEYS.BUDGETS, budgets);
            return budgets[index];
        }
        return null;
    },

    deleteBudgetItem: function(id) {
        let budgets = this.getBudgets();
        budgets = budgets.filter(b => b.id !== id);
        this.save(this.KEYS.BUDGETS, budgets);
    },

    getProjectBudgetTotal: function(projectId) {
        const budgets = this.getBudgetsByProject(projectId);
        return budgets.reduce((sum, b) => sum + b.amount, 0);
    },

    // ==========================================
    // GEPLANTE KOSTEN (Originalplanung)
    // ==========================================

    getPlannedCosts: function() {
        return this.load(this.KEYS.PLANNED_COSTS) || [];
    },

    getPlannedCostsByProject: function(projectId) {
        const planned = this.getPlannedCosts();
        return planned.filter(pc => pc.projectId === projectId);
    },

    getPlannedCostById: function(id) {
        const planned = this.getPlannedCosts();
        return planned.find(pc => pc.id === id);
    },

    addPlannedCost: function(item) {
        const planned = this.getPlannedCosts();
        item.id = this.generateId(this.KEYS.PLANNED_COSTS);
        item.createdAt = new Date().toISOString();
        planned.push(item);
        this.save(this.KEYS.PLANNED_COSTS, planned);
        return item;
    },

    updatePlannedCost: function(id, updates) {
        const planned = this.getPlannedCosts();
        const index = planned.findIndex(pc => pc.id === id);
        if (index !== -1) {
            planned[index] = { ...planned[index], ...updates };
            this.save(this.KEYS.PLANNED_COSTS, planned);
            return planned[index];
        }
        return null;
    },

    deletePlannedCost: function(id) {
        let planned = this.getPlannedCosts();
        planned = planned.filter(pc => pc.id !== id);
        this.save(this.KEYS.PLANNED_COSTS, planned);
    },

    getProjectPlannedTotal: function(projectId) {
        const planned = this.getPlannedCostsByProject(projectId);
        return planned.reduce((sum, pc) => sum + pc.plannedAmount, 0);
    },

    // ==========================================
    // KOSTEN-FUNKTIONEN
    // ==========================================

    getCosts: function() {
        return this.load(this.KEYS.COSTS) || [];
    },

    getCostsByProject: function(projectId) {
        const costs = this.getCosts();
        return costs.filter(c => c.projectId === projectId);
    },

    getCostsByType: function(projectId, type) {
        const costs = this.getCostsByProject(projectId);
        return costs.filter(c => c.type === type);
    },

    getCostById: function(id) {
        const costs = this.getCosts();
        return costs.find(c => c.id === id);
    },

    addCost: function(cost) {
        const costs = this.getCosts();
        cost.id = this.generateId(this.KEYS.COSTS);
        costs.push(cost);
        this.save(this.KEYS.COSTS, costs);
        return cost;
    },

    updateCost: function(id, updates) {
        const costs = this.getCosts();
        const index = costs.findIndex(c => c.id === id);
        if (index !== -1) {
            costs[index] = { ...costs[index], ...updates };
            this.save(this.KEYS.COSTS, costs);
            return costs[index];
        }
        return null;
    },

    deleteCost: function(id) {
        let costs = this.getCosts();
        costs = costs.filter(c => c.id !== id);
        this.save(this.KEYS.COSTS, costs);
    },

    /**
     * Wandelt provisorische Kosten in IST-Kosten um
     */
    convertToEffective: function(costId, invoice) {
        const cost = this.getCostById(costId);
        if (cost && cost.type === 'provisorisch') {
            return this.updateCost(costId, {
                type: 'ist',
                invoice: invoice || '',
                convertedAt: new Date().toISOString()
            });
        }
        return null;
    },

    // ==========================================
    // KONFIGURATION-FUNKTIONEN
    // ==========================================

    getConfig: function() {
        return this.load(this.KEYS.CONFIG) || { costTypes: [], projectStatuses: [] };
    },

    getCostTypes: function() {
        const config = this.getConfig();
        return config.costTypes || [];
    },

    getActiveCostTypes: function() {
        return this.getCostTypes().filter(ct => ct.active);
    },

    addCostType: function(costType) {
        const config = this.getConfig();
        costType.id = config.costTypes.length > 0
            ? Math.max(...config.costTypes.map(ct => ct.id)) + 1
            : 1;
        costType.active = true;
        config.costTypes.push(costType);
        this.save(this.KEYS.CONFIG, config);
        return costType;
    },

    updateCostType: function(id, updates) {
        const config = this.getConfig();
        const index = config.costTypes.findIndex(ct => ct.id === id);
        if (index !== -1) {
            config.costTypes[index] = { ...config.costTypes[index], ...updates };
            this.save(this.KEYS.CONFIG, config);
            return config.costTypes[index];
        }
        return null;
    },

    deleteCostType: function(id) {
        const config = this.getConfig();
        config.costTypes = config.costTypes.filter(ct => ct.id !== id);
        this.save(this.KEYS.CONFIG, config);
    },

    // ==========================================
    // LIEFERANTEN-FUNKTIONEN
    // ==========================================

    getSuppliers: function() {
        return this.load(this.KEYS.SUPPLIERS) || [];
    },

    getActiveSuppliers: function() {
        return this.getSuppliers().filter(s => s.active);
    },

    getSupplierById: function(id) {
        const suppliers = this.getSuppliers();
        return suppliers.find(s => s.id === id);
    },

    getSupplierByExternalId: function(externalId) {
        const suppliers = this.getSuppliers();
        return suppliers.find(s => s.externalId === externalId);
    },

    addSupplier: function(supplier) {
        const suppliers = this.getSuppliers();
        supplier.id = this.generateId(this.KEYS.SUPPLIERS);
        // Generiere externe ID falls nicht vorhanden
        if (!supplier.externalId) {
            supplier.externalId = 'LF-' + String(supplier.id).padStart(3, '0');
        }
        supplier.active = true;
        suppliers.push(supplier);
        this.save(this.KEYS.SUPPLIERS, suppliers);
        return supplier;
    },

    updateSupplier: function(id, updates) {
        const suppliers = this.getSuppliers();
        const index = suppliers.findIndex(s => s.id === id);
        if (index !== -1) {
            suppliers[index] = { ...suppliers[index], ...updates };
            this.save(this.KEYS.SUPPLIERS, suppliers);
            return suppliers[index];
        }
        return null;
    },

    deleteSupplier: function(id) {
        let suppliers = this.getSuppliers();
        suppliers = suppliers.filter(s => s.id !== id);
        this.save(this.KEYS.SUPPLIERS, suppliers);
    },

    // ==========================================
    // ZEITERFASSUNG-FUNKTIONEN
    // ==========================================

    getTimeEntries: function() {
        return this.load(this.KEYS.TIMETRACKING) || [];
    },

    getTimeEntriesByProject: function(projectId) {
        const entries = this.getTimeEntries();
        return entries.filter(e => e.projectId === projectId);
    },

    getTimeEntriesByUser: function(userId) {
        const entries = this.getTimeEntries();
        return entries.filter(e => e.userId === userId);
    },

    getMyTimeEntries: function() {
        const session = this.getSession();
        if (!session) return [];
        return this.getTimeEntriesByUser(session.userId);
    },

    addTimeEntry: function(entry) {
        const entries = this.getTimeEntries();
        entry.id = this.generateId(this.KEYS.TIMETRACKING);
        entry.userId = this.getSession().userId;
        entry.createdAt = new Date().toISOString();
        entries.push(entry);
        this.save(this.KEYS.TIMETRACKING, entries);
        return entry;
    },

    updateTimeEntry: function(id, updates) {
        const entries = this.getTimeEntries();
        const index = entries.findIndex(e => e.id === id);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updates };
            this.save(this.KEYS.TIMETRACKING, entries);
            return entries[index];
        }
        return null;
    },

    deleteTimeEntry: function(id) {
        let entries = this.getTimeEntries();
        entries = entries.filter(e => e.id !== id);
        this.save(this.KEYS.TIMETRACKING, entries);
    },

    getProjectTotalHours: function(projectId) {
        const entries = this.getTimeEntriesByProject(projectId);
        return entries.reduce((sum, e) => sum + e.hours, 0);
    },

    // Personalkosten basierend auf Stundensatz berechnen
    getProjectLaborCost: function(projectId) {
        const entries = this.getTimeEntriesByProject(projectId);
        let totalCost = 0;
        entries.forEach(entry => {
            const user = this.getUserById(entry.userId);
            if (user && user.hourlyRate) {
                totalCost += entry.hours * user.hourlyRate;
            }
        });
        return totalCost;
    },

    // ==========================================
    // BERECHNUNGEN
    // ==========================================

    getProjectSummary: function(projectId) {
        const project = this.getProjectById(projectId);
        const budgetItems = this.getBudgetsByProject(projectId);
        const istCosts = this.getCostsByType(projectId, 'ist');
        const provCosts = this.getCostsByType(projectId, 'provisorisch');
        const plannedCosts = this.getPlannedCostsByProject(projectId);
        const totalHours = this.getProjectTotalHours(projectId);
        const laborCost = this.getProjectLaborCost(projectId);

        // DATEV-Buchungen für dieses Projekt holen
        const datevBuchungen = this.getDatevBuchungen().filter(b =>
            String(b.projektId) === String(projectId)
        );
        const datevTotal = datevBuchungen.reduce((sum, b) => sum + (b.betrag || 0), 0);
        const datevAnzahl = datevBuchungen.length;

        const budgetTotal = budgetItems.reduce((sum, b) => sum + b.amount, 0);
        const istTotal = istCosts.reduce((sum, c) => sum + c.amount, 0);
        const provTotal = provCosts.reduce((sum, c) => sum + c.amount, 0);
        const plannedTotal = plannedCosts.reduce((sum, pc) => sum + pc.plannedAmount, 0);

        // IST-Kosten: manuelle + DATEV
        const istGesamt = istTotal + datevTotal;
        const available = budgetTotal - istGesamt - provTotal;

        return {
            project: project,
            budget: budgetTotal,
            ist: istGesamt,
            istManuell: istTotal,
            istDatev: datevTotal,
            datevAnzahl: datevAnzahl,
            provisorisch: provTotal,
            geplantOriginal: plannedTotal,  // Originalplanung
            gesamt: istGesamt + provTotal,
            verfuegbar: available,
            prozentVerbraucht: budgetTotal > 0 ? Math.round((istGesamt / budgetTotal) * 100) : 0,
            prozentGeplant: budgetTotal > 0 ? Math.round(((istGesamt + provTotal) / budgetTotal) * 100) : 0,
            totalHours: totalHours,
            laborCost: laborCost,
            // Vergleich Planung vs IST
            abweichungPlanung: plannedTotal > 0 ? istGesamt + provTotal - plannedTotal : 0
        };
    },

    getAllProjectsSummary: function() {
        const projects = this.getProjects();
        return projects.map(p => this.getProjectSummary(p.id));
    },

    // Nach Kategorie gruppierte Kosten mit Planvergleich
    getCostsByCategory: function(projectId) {
        const costs = this.getCostsByProject(projectId);
        const plannedCosts = this.getPlannedCostsByProject(projectId);
        const categories = {};

        // Geplante Kosten pro Kategorie
        plannedCosts.forEach(pc => {
            if (!categories[pc.category]) {
                categories[pc.category] = { planned: 0, ist: 0, provisorisch: 0, total: 0 };
            }
            categories[pc.category].planned += pc.plannedAmount;
        });

        // Tatsächliche Kosten
        costs.forEach(cost => {
            if (!categories[cost.category]) {
                categories[cost.category] = { planned: 0, ist: 0, provisorisch: 0, total: 0 };
            }
            if (cost.type === 'ist') {
                categories[cost.category].ist += cost.amount;
            } else {
                categories[cost.category].provisorisch += cost.amount;
            }
            categories[cost.category].total += cost.amount;
        });

        return categories;
    },

    // ==========================================
    // EXCEL EXPORT
    // ==========================================

    /**
     * Exportiert Projektdaten als CSV (Excel-kompatibel) - Verbessertes Format
     */
    exportProjectToCSV: function(projectId) {
        const project = this.getProjectById(projectId);
        const summary = this.getProjectSummary(projectId);
        const costs = this.getCostsByProject(projectId);
        const plannedCosts = this.getPlannedCostsByProject(projectId);
        const timeEntries = this.getTimeEntriesByProject(projectId);

        // DATEV-Rechnungen für dieses Projekt
        const datevRechnungen = this.getRechnungenByProjekt(projectId);

        let csv = '\uFEFF'; // BOM für UTF-8
        csv += 'PROJEKTEXPORT KUNST MERAN\n';
        csv += 'Projekt;' + project.name + '\n';
        csv += 'Exportdatum;' + new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE') + '\n\n';

        // Projekt-Übersicht
        csv += 'PROJEKTÜBERSICHT\n';
        csv += 'Feld;Wert\n';
        csv += 'Projektname;"' + project.name + '"\n';
        csv += 'Projekt-ID;' + projectId + '\n';
        csv += 'Standort;"' + project.location + '"\n';
        csv += 'Zeitraum;' + this.formatDatum(project.startDate) + ' - ' + this.formatDatum(project.endDate) + '\n';
        csv += 'Status;' + project.status + '\n';
        csv += 'Beschreibung;"' + (project.description || '') + '"\n';
        csv += '\n';

        // Budget-Übersicht mit deutschen Zahlenformat
        csv += 'BUDGET-ÜBERSICHT\n';
        csv += 'Position;Betrag\n';
        csv += 'Budget gesamt;' + summary.budget.toFixed(2).replace('.', ',') + '\n';
        csv += 'IST-Kosten (manuell);' + summary.istManuell.toFixed(2).replace('.', ',') + '\n';
        csv += 'IST-Kosten (DATEV);' + summary.istDatev.toFixed(2).replace('.', ',') + '\n';
        csv += 'IST-Kosten gesamt;' + summary.ist.toFixed(2).replace('.', ',') + '\n';
        csv += 'Provisorische Kosten;' + summary.provisorisch.toFixed(2).replace('.', ',') + '\n';
        csv += 'Kosten gesamt;' + summary.gesamt.toFixed(2).replace('.', ',') + '\n';
        csv += 'Verfügbar;' + summary.verfuegbar.toFixed(2).replace('.', ',') + '\n';
        csv += 'Original-Planung;' + summary.geplantOriginal.toFixed(2).replace('.', ',') + '\n';
        csv += 'Abweichung zur Planung;' + summary.abweichungPlanung.toFixed(2).replace('.', ',') + '\n';
        csv += 'Arbeitsstunden;' + summary.totalHours.toFixed(1).replace('.', ',') + '\n';
        csv += 'Personalkosten (kalkuliert);' + summary.laborCost.toFixed(2).replace('.', ',') + '\n';
        csv += '\n';

        // Geplante Kosten (Originalplanung)
        if (plannedCosts.length > 0) {
            csv += 'ORIGINALPLANUNG\n';
            csv += 'Nr;Kategorie;Beschreibung;Lieferant;Geplanter Betrag\n';
            let planSumme = 0;
            plannedCosts.forEach((pc, idx) => {
                const supplier = pc.supplierId ? this.getSupplierById(pc.supplierId) : null;
                planSumme += pc.plannedAmount;
                csv += `${idx + 1};"${pc.category}";"${pc.description}";"${supplier ? supplier.name : '-'}";${pc.plannedAmount.toFixed(2).replace('.', ',')}\n`;
            });
            csv += `;;SUMME;;${planSumme.toFixed(2).replace('.', ',')}\n`;
            csv += '\n';
        }

        // Manuelle Kosten
        if (costs.length > 0) {
            csv += 'MANUELLE KOSTEN\n';
            csv += 'Nr;Datum;Typ;Kategorie;Lieferant;Lieferant-ID;Beschreibung;Netto;MwSt;Brutto;Rechnungsnr\n';
            let kostenSumme = 0;
            costs.forEach((cost, idx) => {
                const supplier = cost.supplierId ? this.getSupplierById(cost.supplierId) : null;
                const netto = cost.amountNetto || cost.amount / 1.22;
                const mwst = cost.amountMwst || cost.amount - netto;
                kostenSumme += cost.amount;
                csv += `${idx + 1};${cost.date};${cost.type};"${cost.category}";"${supplier ? supplier.name : '-'}";${supplier ? supplier.externalId : '-'};"${cost.description}";`;
                csv += `${netto.toFixed(2).replace('.', ',')};${mwst.toFixed(2).replace('.', ',')};${cost.amount.toFixed(2).replace('.', ',')};${cost.invoice || '-'}\n`;
            });
            csv += `;;;;;;SUMME;;;${kostenSumme.toFixed(2).replace('.', ',')};\n`;
            csv += '\n';
        }

        // DATEV-Rechnungen
        if (datevRechnungen.length > 0) {
            csv += 'DATEV-RECHNUNGEN\n';
            csv += 'Nr;Datum;Lieferant;Partita IVA;Rechnungsnr;Typ;Netto;MwSt;Brutto;Status;Kostentyp;Abgabestelle\n';
            let datevSummeNetto = 0;
            let datevSummeBrutto = 0;
            datevRechnungen.forEach((r, idx) => {
                const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
                const mwst = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
                const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);
                const dokumentTyp = r.istGutschrift || r.dokumentTyp === 'NC' ? 'Gutschrift' : 'Rechnung';
                const kostentyp = r.kostentyp ? this.getKostentypName(r.kostentyp) : '';

                datevSummeNetto += netto;
                datevSummeBrutto += brutto;

                csv += `${idx + 1};${r.datum};"${r.fornitoreName}";${r.partitaIva};${r.dokumentNr};${dokumentTyp};`;
                csv += `${netto.toFixed(2).replace('.', ',')};${mwst.toFixed(2).replace('.', ',')};${brutto.toFixed(2).replace('.', ',')};`;
                csv += `${r.workflowStatus};"${kostentyp}";${r.abgabestelle || ''}\n`;
            });
            csv += `;;;;SUMME (${datevRechnungen.length} Rechnungen);;${datevSummeNetto.toFixed(2).replace('.', ',')};;${datevSummeBrutto.toFixed(2).replace('.', ',')};;;\n`;
            csv += '\n';
        }

        // Zeiterfassung
        if (timeEntries.length > 0) {
            csv += 'ZEITERFASSUNG\n';
            csv += 'Nr;Datum;Mitarbeiter;Stunden;Stundensatz;Kosten;Beschreibung\n';
            let stundenSumme = 0;
            let kostenSumme = 0;
            timeEntries.forEach((entry, idx) => {
                const user = this.getUserById(entry.userId);
                const stundensatz = user?.hourlyRate || 0;
                const kosten = entry.hours * stundensatz;
                stundenSumme += entry.hours;
                kostenSumme += kosten;
                csv += `${idx + 1};${entry.date};"${user ? user.name : '-'}";${entry.hours.toFixed(1).replace('.', ',')};${stundensatz.toFixed(2).replace('.', ',')};${kosten.toFixed(2).replace('.', ',')};"${entry.description}"\n`;
            });
            csv += `;;;SUMME;${stundenSumme.toFixed(1).replace('.', ',')};;${kostenSumme.toFixed(2).replace('.', ',')};\n`;
        }

        return csv;
    },

    /**
     * Exportiert alle Projekte als CSV - Verbessertes Format
     */
    exportAllToCSV: function() {
        const projects = this.getProjects();
        const summaries = this.getAllProjectsSummary();
        const alleRechnungen = this.getRechnungenMitStatus();

        let csv = '\uFEFF'; // BOM für UTF-8
        csv += 'GESAMTEXPORT KUNST MERAN\n';
        csv += 'Exportdatum;' + new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE') + '\n';
        csv += 'Anzahl Projekte;' + projects.length + '\n';
        csv += 'Anzahl DATEV-Rechnungen;' + alleRechnungen.length + '\n\n';

        // Projektübersicht
        csv += 'PROJEKTÜBERSICHT\n';
        csv += 'Nr;Projekt;Projekt-ID;Status;Budget;IST-Kosten;davon DATEV;Provisorisch;Verfügbar;Original-Planung;Abweichung;Stunden;Personalkosten\n';
        let gesamtBudget = 0;
        let gesamtIst = 0;
        let gesamtProv = 0;
        summaries.forEach((s, idx) => {
            gesamtBudget += s.budget;
            gesamtIst += s.ist;
            gesamtProv += s.provisorisch;
            csv += `${idx + 1};"${s.project.name}";${s.project.id};${s.project.status};`;
            csv += `${s.budget.toFixed(2).replace('.', ',')};${s.ist.toFixed(2).replace('.', ',')};${s.istDatev.toFixed(2).replace('.', ',')};`;
            csv += `${s.provisorisch.toFixed(2).replace('.', ',')};${s.verfuegbar.toFixed(2).replace('.', ',')};`;
            csv += `${s.geplantOriginal.toFixed(2).replace('.', ',')};${s.abweichungPlanung.toFixed(2).replace('.', ',')};`;
            csv += `${s.totalHours.toFixed(1).replace('.', ',')};${s.laborCost.toFixed(2).replace('.', ',')}\n`;
        });
        csv += `;;SUMME;;${gesamtBudget.toFixed(2).replace('.', ',')};${gesamtIst.toFixed(2).replace('.', ',')};`;
        csv += `;${gesamtProv.toFixed(2).replace('.', ',')};${(gesamtBudget - gesamtIst - gesamtProv).toFixed(2).replace('.', ',')};;;;\n`;
        csv += '\n';

        // DATEV-Rechnungen (alle)
        if (alleRechnungen.length > 0) {
            csv += 'ALLE DATEV-RECHNUNGEN\n';
            csv += 'Nr;Datum;Projekt;Projekt-ID;Lieferant;Partita IVA;Rechnungsnr;Typ;Netto;MwSt;Brutto;Status;Kostentyp;Abgabestelle\n';
            let summeNetto = 0;
            let summeBrutto = 0;
            alleRechnungen.forEach((r, idx) => {
                const projekt = KUNST_MERAN_PROJEKTE[r.projektId];
                const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
                const mwst = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
                const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);
                const dokumentTyp = r.istGutschrift || r.dokumentTyp === 'NC' ? 'NC' : 'F';
                const kostentyp = r.kostentyp ? this.getKostentypName(r.kostentyp) : '';

                summeNetto += netto;
                summeBrutto += brutto;

                csv += `${idx + 1};${r.datum};"${projekt?.name || ''}";${r.projektId};"${r.fornitoreName}";${r.partitaIva};${r.dokumentNr};${dokumentTyp};`;
                csv += `${netto.toFixed(2).replace('.', ',')};${mwst.toFixed(2).replace('.', ',')};${brutto.toFixed(2).replace('.', ',')};`;
                csv += `${r.workflowStatus};"${kostentyp}";${r.abgabestelle || ''}\n`;
            });
            csv += `;;;;SUMME;;;;;${summeNetto.toFixed(2).replace('.', ',')};;${summeBrutto.toFixed(2).replace('.', ',')};;;\n`;
            csv += '\n';
        }

        // Manuelle Kosten
        csv += 'ALLE MANUELLEN KOSTEN\n';
        csv += 'Nr;Projekt;Datum;Typ;Kategorie;Lieferant;Lieferant-ID;Beschreibung;Netto;MwSt;Brutto;Rechnungsnr\n';
        let kostenNr = 0;
        let manuelleKostenSumme = 0;
        projects.forEach(project => {
            const costs = this.getCostsByProject(project.id);
            costs.forEach(cost => {
                kostenNr++;
                const supplier = cost.supplierId ? this.getSupplierById(cost.supplierId) : null;
                const netto = cost.amountNetto || cost.amount / 1.22;
                const mwst = cost.amountMwst || cost.amount - netto;
                manuelleKostenSumme += cost.amount;
                csv += `${kostenNr};"${project.name}";${cost.date};${cost.type};"${cost.category}";"${supplier ? supplier.name : '-'}";${supplier ? supplier.externalId : '-'};"${cost.description}";`;
                csv += `${netto.toFixed(2).replace('.', ',')};${mwst.toFixed(2).replace('.', ',')};${cost.amount.toFixed(2).replace('.', ',')};${cost.invoice || '-'}\n`;
            });
        });
        csv += `;;;;;;SUMME;;;;${manuelleKostenSumme.toFixed(2).replace('.', ',')};\n`;
        csv += '\n';

        // DATEV-Lieferanten
        const datevLieferanten = this.getDatevLieferanten();
        if (datevLieferanten.length > 0) {
            csv += 'DATEV-LIEFERANTEN\n';
            csv += 'Nr;Name;Partita IVA;Lieferant-Nr;Anzahl Rechnungen;Gesamtbetrag\n';
            datevLieferanten.forEach((l, idx) => {
                const lieferantRechnungen = alleRechnungen.filter(r => r.partitaIva === l.partitaIva);
                const summe = lieferantRechnungen.reduce((sum, r) => sum + (r.betragGesamt || r.betrag * 1.22), 0);
                csv += `${idx + 1};"${l.name}";${l.partitaIva};${l.nummer};${lieferantRechnungen.length};${summe.toFixed(2).replace('.', ',')}\n`;
            });
            csv += '\n';
        }

        // Manuelle Lieferanten
        csv += 'MANUELLE LIEFERANTEN\n';
        csv += 'Nr;ID;Externe ID;Name;Kategorie;Steuernr;Adresse;Aktiv\n';
        this.getSuppliers().forEach((s, idx) => {
            csv += `${idx + 1};${s.id};${s.externalId || ''};"${s.name}";"${s.type || '-'}";${s.taxId || '-'};"${s.address || '-'}";${s.active ? 'Ja' : 'Nein'}\n`;
        });
        csv += '\n';

        // Zeiterfassung
        csv += 'ZEITERFASSUNG GESAMT\n';
        csv += 'Nr;Projekt;Datum;Mitarbeiter;Stunden;Stundensatz;Kosten;Beschreibung\n';
        let zeitNr = 0;
        let stundenSumme = 0;
        let kostenSumme = 0;
        projects.forEach(project => {
            const entries = this.getTimeEntriesByProject(project.id);
            entries.forEach(entry => {
                zeitNr++;
                const user = this.getUserById(entry.userId);
                const hourlyRate = user ? user.hourlyRate : 0;
                const kosten = entry.hours * hourlyRate;
                stundenSumme += entry.hours;
                kostenSumme += kosten;
                csv += `${zeitNr};"${project.name}";${entry.date};"${user ? user.name : '-'}";${entry.hours.toFixed(1).replace('.', ',')};${hourlyRate.toFixed(2).replace('.', ',')};${kosten.toFixed(2).replace('.', ',')};"${entry.description}"\n`;
            });
        });
        csv += `;;;;SUMME;${stundenSumme.toFixed(1).replace('.', ',')};;${kostenSumme.toFixed(2).replace('.', ',')};\n`;

        return csv;
    },

    // ==========================================
    // EXPORT / IMPORT
    // ==========================================

    exportAll: function() {
        return {
            exportDate: new Date().toISOString(),
            users: this.getUsers(),
            projects: this.getProjects(),
            budgets: this.getBudgets(),
            costs: this.getCosts(),
            plannedCosts: this.getPlannedCosts(),
            config: this.getConfig(),
            suppliers: this.getSuppliers(),
            timetracking: this.getTimeEntries()
        };
    },

    importAll: function(data) {
        if (data.users) this.save(this.KEYS.USERS, data.users);
        if (data.projects) this.save(this.KEYS.PROJECTS, data.projects);
        if (data.budgets) this.save(this.KEYS.BUDGETS, data.budgets);
        if (data.costs) this.save(this.KEYS.COSTS, data.costs);
        if (data.plannedCosts) this.save(this.KEYS.PLANNED_COSTS, data.plannedCosts);
        if (data.config) this.save(this.KEYS.CONFIG, data.config);
        if (data.suppliers) this.save(this.KEYS.SUPPLIERS, data.suppliers);
        if (data.timetracking) this.save(this.KEYS.TIMETRACKING, data.timetracking);
    },

    resetAll: function() {
        localStorage.removeItem(this.KEYS.USERS);
        localStorage.removeItem(this.KEYS.PROJECTS);
        localStorage.removeItem(this.KEYS.BUDGETS);
        localStorage.removeItem(this.KEYS.COSTS);
        localStorage.removeItem(this.KEYS.PLANNED_COSTS);
        localStorage.removeItem(this.KEYS.SESSION);
        localStorage.removeItem(this.KEYS.CONFIG);
        localStorage.removeItem(this.KEYS.SUPPLIERS);
        localStorage.removeItem(this.KEYS.TIMETRACKING);
        localStorage.removeItem(this.KEYS.DATEV_BUCHUNGEN);
        localStorage.removeItem(this.KEYS.RECHNUNGEN_STATUS);
        this.init();
    },

    // ==========================================
    // DATEV IMPORT FUNKTIONEN
    // ==========================================

    /**
     * Lädt die buchungen.json Datei (aktuelles Jahr oder Archiv)
     * @param {number|null} jahr - Jahr zum Laden (null = aktuelles Jahr)
     * @returns {Promise<Object>} Buchungsdaten
     */
    loadBuchungenJSON: async function(jahr = null) {
        try {
            // Dateiname bestimmen: buchungen.json oder buchungen_JAHR.json
            const filename = jahr ? `data/buchungen_${jahr}.json` : this.PATHS.BUCHUNGEN_JSON;
            const response = await fetch(filename + '?t=' + Date.now());
            if (!response.ok) {
                console.log('Keine ' + filename + ' gefunden');
                return null;
            }
            const data = await response.json();
            // In localStorage speichern für Offline-Zugriff
            this.save(this.KEYS.DATEV_BUCHUNGEN, data);
            this.currentYear = jahr;
            return data;
        } catch (error) {
            console.error('Fehler beim Laden der buchungen.json:', error);
            // Fallback auf localStorage
            return this.load(this.KEYS.DATEV_BUCHUNGEN);
        }
    },

    /**
     * Lädt ein archiviertes Jahr
     * @param {number} jahr - Das zu ladende Jahr
     */
    loadArchivedYear: async function(jahr) {
        const data = await this.loadBuchungenJSON(jahr);
        if (data) {
            console.log('Archiv ' + jahr + ' geladen mit ' + (data.buchungen?.length || 0) + ' Buchungen');
            return data;
        }
        return null;
    },

    /**
     * Lädt das aktuelle Jahr (buchungen.json)
     */
    loadCurrentYear: async function() {
        const data = await this.loadBuchungenJSON(null);
        if (data) {
            console.log('Aktuelles Jahr geladen mit ' + (data.buchungen?.length || 0) + ' Buchungen');
            return data;
        }
        return null;
    },

    /**
     * Prüft welche archivierten Jahre verfügbar sind
     * Testet Jahre von 2020 bis aktuelles Jahr
     * @returns {Promise<Array>} Array mit verfügbaren Jahren
     */
    getAvailableYears: async function() {
        const availableYears = [];
        const currentYear = new Date().getFullYear();

        // Aktuelles Jahr (buchungen.json) prüfen
        try {
            const response = await fetch(this.PATHS.BUCHUNGEN_JSON + '?t=' + Date.now(), { method: 'HEAD' });
            if (response.ok) {
                availableYears.push({ year: null, label: 'Aktuell', isCurrent: true });
            }
        } catch (e) {
            // Ignorieren
        }

        // Archive von 2020 bis Vorjahr prüfen
        for (let jahr = currentYear - 1; jahr >= 2020; jahr--) {
            try {
                const response = await fetch(`data/buchungen_${jahr}.json?t=` + Date.now(), { method: 'HEAD' });
                if (response.ok) {
                    availableYears.push({ year: jahr, label: String(jahr), isCurrent: false });
                }
            } catch (e) {
                // Jahr nicht vorhanden, ignorieren
            }
        }

        return availableYears;
    },

    /**
     * Holt das aktuell geladene Jahr
     */
    getCurrentLoadedYear: function() {
        return this.currentYear;
    },

    /**
     * Holt alle DATEV-Buchungen (aus localStorage nach Import)
     */
    getDatevBuchungen: function() {
        const data = this.load(this.KEYS.DATEV_BUCHUNGEN);
        return data ? data.buchungen || [] : [];
    },

    /**
     * Holt alle Lieferanten aus DATEV-Import
     * Reichert mit manuell gepflegten Namen an
     */
    getDatevLieferanten: function() {
        const data = this.load(this.KEYS.DATEV_BUCHUNGEN);
        const lieferanten = data ? data.lieferanten || [] : [];
        const manuelleNamen = this.getLieferantenNamen();

        // Namen aus manuellem Mapping ergänzen
        return lieferanten.map(l => ({
            ...l,
            name: manuelleNamen[l.partitaIva] || l.name || ''
        }));
    },

    // ==========================================
    // LIEFERANTEN-NAMEN MAPPING (Manuelle Pflege)
    // ==========================================

    /**
     * Holt alle manuell gepflegten Lieferantennamen
     * @returns {Object} Mapping: partitaIva -> name
     */
    getLieferantenNamen: function() {
        return this.load(this.KEYS.LIEFERANTEN_NAMEN) || {};
    },

    /**
     * Setzt den Namen für einen Lieferanten (via Partita IVA)
     */
    setLieferantName: function(partitaIva, name) {
        const namen = this.getLieferantenNamen();
        namen[partitaIva] = name;
        this.save(this.KEYS.LIEFERANTEN_NAMEN, namen);
        return name;
    },

    /**
     * Holt den Namen für eine Partita IVA (manuell oder aus DATEV)
     */
    getLieferantName: function(partitaIva) {
        // Zuerst manuelles Mapping prüfen
        const manuelleNamen = this.getLieferantenNamen();
        if (manuelleNamen[partitaIva]) {
            return manuelleNamen[partitaIva];
        }

        // Dann DATEV-Import prüfen
        const data = this.load(this.KEYS.DATEV_BUCHUNGEN);
        if (data && data.lieferanten) {
            const lieferant = data.lieferanten.find(l => l.partitaIva === partitaIva);
            if (lieferant && lieferant.name) {
                return lieferant.name;
            }
        }

        return '';
    },

    /**
     * Löscht einen manuell gepflegten Lieferantennamen
     */
    deleteLieferantName: function(partitaIva) {
        const namen = this.getLieferantenNamen();
        delete namen[partitaIva];
        this.save(this.KEYS.LIEFERANTEN_NAMEN, namen);
    },

    /**
     * Holt Projekt-Summen aus DATEV-Import
     */
    getDatevProjektSummen: function() {
        const data = this.load(this.KEYS.DATEV_BUCHUNGEN);
        return data ? data.projekte || {} : {};
    },

    /**
     * Letzte Aktualisierung der DATEV-Daten
     */
    getDatevLastUpdate: function() {
        const data = this.load(this.KEYS.DATEV_BUCHUNGEN);
        return data ? data.lastUpdate : null;
    },

    // ==========================================
    // RECHNUNGS-STATUS VERWALTUNG
    // ==========================================

    /**
     * Lädt die separate Status-Datei
     */
    loadRechnungenStatus: async function() {
        try {
            const response = await fetch(this.PATHS.STATUS_JSON + '?t=' + Date.now());
            if (!response.ok) {
                return this.load(this.KEYS.RECHNUNGEN_STATUS) || {};
            }
            const data = await response.json();
            // Merge mit lokalem Status
            const localStatus = this.load(this.KEYS.RECHNUNGEN_STATUS) || {};
            const mergedStatus = { ...data, ...localStatus };
            return mergedStatus;
        } catch (error) {
            return this.load(this.KEYS.RECHNUNGEN_STATUS) || {};
        }
    },

    /**
     * Holt Status für eine bestimmte Rechnung
     * @param {string} rechnungId - Format: PartitaIVA_Rechnungsnummer
     */
    getRechnungStatus: function(rechnungId) {
        const statusData = this.load(this.KEYS.RECHNUNGEN_STATUS) || {};
        return statusData[rechnungId] || {
            status: RECHNUNG_STATUS.NEU,
            kontrolliertVon: null,
            kontrolliertAm: null,
            bezahltAm: null,
            abgabestelle: null,
            notizen: ''
        };
    },

    /**
     * Setzt Status für eine Rechnung
     */
    setRechnungStatus: function(rechnungId, statusUpdate) {
        const statusData = this.load(this.KEYS.RECHNUNGEN_STATUS) || {};
        const currentStatus = statusData[rechnungId] || {};

        statusData[rechnungId] = {
            ...currentStatus,
            ...statusUpdate,
            updatedAt: new Date().toISOString(),
            updatedBy: this.getSession()?.userId
        };

        this.save(this.KEYS.RECHNUNGEN_STATUS, statusData);
        return statusData[rechnungId];
    },

    /**
     * Markiert Rechnung als kontrolliert
     * @param {string} rechnungId - ID der Rechnung
     * @param {string|null} datum - Optionales Datum (ISO-Format), sonst heute
     */
    markAsKontrolliert: function(rechnungId, datum = null) {
        const session = this.getSession();
        const kontrolliertAm = datum || new Date().toISOString().split('T')[0];
        return this.setRechnungStatus(rechnungId, {
            status: RECHNUNG_STATUS.KONTROLLIERT,
            kontrolliertVon: session?.userId,
            kontrolliertAm: kontrolliertAm
        });
    },

    /**
     * Setzt/Ändert das Kontrolliert-Datum
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} datum - Datum im ISO-Format (YYYY-MM-DD)
     */
    setKontrolliertDatum: function(rechnungId, datum) {
        return this.setRechnungStatus(rechnungId, {
            kontrolliertAm: datum || null
        });
    },

    /**
     * Markiert Rechnung als bezahlt
     * @param {string} rechnungId - ID der Rechnung
     * @param {string|null} datum - Optionales Datum (ISO-Format), sonst heute
     */
    markAsBezahlt: function(rechnungId, datum = null) {
        const bezahltAm = datum || new Date().toISOString().split('T')[0];
        return this.setRechnungStatus(rechnungId, {
            status: RECHNUNG_STATUS.BEZAHLT,
            bezahltAm: bezahltAm
        });
    },

    /**
     * Setzt/Ändert das Bezahlt-Datum
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} datum - Datum im ISO-Format (YYYY-MM-DD)
     */
    setBezahltDatum: function(rechnungId, datum) {
        return this.setRechnungStatus(rechnungId, {
            bezahltAm: datum || null
        });
    },

    /**
     * Setzt Abgabestelle für eine Rechnung (mit Datum)
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} abgabestelle - Abgabestelle (gemeinde, region, provinz)
     * @param {string|null} datum - Optionales Datum, sonst heute
     */
    setAbgabestelle: function(rechnungId, abgabestelle, datum = null) {
        const abgabestelleAm = abgabestelle ? (datum || new Date().toISOString().split('T')[0]) : null;
        return this.setRechnungStatus(rechnungId, {
            abgabestelle: abgabestelle,
            abgabestelleAm: abgabestelleAm
        });
    },

    /**
     * Setzt/Ändert das Abgabestelle-Datum
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} datum - Datum im ISO-Format (YYYY-MM-DD)
     */
    setAbgabestelleDatum: function(rechnungId, datum) {
        return this.setRechnungStatus(rechnungId, {
            abgabestelleAm: datum || null
        });
    },

    /**
     * Setzt Kostentyp für eine Rechnung (mit Datum)
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} kostentyp - Kostentyp-ID
     * @param {string|null} datum - Optionales Datum, sonst heute
     */
    setKostentyp: function(rechnungId, kostentyp, datum = null) {
        const kostentypAm = kostentyp ? (datum || new Date().toISOString().split('T')[0]) : null;
        return this.setRechnungStatus(rechnungId, {
            kostentyp: kostentyp,
            kostentypAm: kostentypAm
        });
    },

    /**
     * Setzt/Ändert das Kostentyp-Datum
     * @param {string} rechnungId - ID der Rechnung
     * @param {string} datum - Datum im ISO-Format (YYYY-MM-DD)
     */
    setKostentypDatum: function(rechnungId, datum) {
        return this.setRechnungStatus(rechnungId, {
            kostentypAm: datum || null
        });
    },

    /**
     * Holt den Kostentyp-Namen für Anzeige
     */
    getKostentypName: function(kostentypId) {
        const typ = KOSTENTYPEN_LISTE.find(k => k.id === kostentypId);
        return typ ? typ.name : null;
    },

    /**
     * Holt alle Rechnungen mit Status (kombiniert DATEV + Status + Lieferantennamen)
     * WICHTIG: Nur Rechnungen mit gültiger Projekt-ID werden angezeigt!
     */
    getRechnungenMitStatus: function() {
        const buchungen = this.getDatevBuchungen();
        const manuelleNamen = this.getLieferantenNamen();

        // Gültige Projekt-IDs (2601-2607)
        const gueltigeProjektIds = Object.keys(KUNST_MERAN_PROJEKTE).map(id => String(id));

        const result = buchungen
            // NUR Rechnungen mit gültiger Projekt-ID anzeigen
            .filter(buchung => {
                const projektId = String(buchung.projektId || '').trim();
                return projektId !== '' && gueltigeProjektIds.includes(projektId);
            })
            .map(buchung => {
                const rechnungId = buchung.partitaIva + '_' + buchung.dokumentNr;
                const status = this.getRechnungStatus(rechnungId);

                // Lieferantenname: Manuelles Mapping > DATEV-Import
                const lieferantName = manuelleNamen[buchung.partitaIva] || buchung.fornitoreName || '';

                // Projekt-ID: Status überschreibt DATEV-Import falls vorhanden
                const projektId = status.projektId !== undefined && status.projektId !== null
                    ? status.projektId
                    : buchung.projektId;

                return {
                    ...buchung,
                    projektId: projektId,
                    fornitoreName: lieferantName,
                    rechnungId: rechnungId,
                    workflowStatus: status.status,
                    kontrolliertVon: status.kontrolliertVon,
                    kontrolliertAm: status.kontrolliertAm,
                    bezahltAm: status.bezahltAm,
                    abgabestelle: status.abgabestelle,
                    abgabestelleAm: status.abgabestelleAm,
                    kostentyp: status.kostentyp,
                    kostentypAm: status.kostentypAm,
                    notizen: status.notizen,
                    geteilt: status.geteilt || false
                };
            });
        return result;
    },

    /**
     * Filtert Rechnungen nach Status
     */
    getRechnungenByStatus: function(status) {
        return this.getRechnungenMitStatus().filter(r => r.workflowStatus === status);
    },

    /**
     * Filtert Rechnungen nach Projekt
     */
    getRechnungenByProjekt: function(projektId) {
        return this.getRechnungenMitStatus().filter(r => r.projektId === projektId);
    },

    /**
     * Filtert Rechnungen nach Lieferant
     */
    getRechnungenByLieferant: function(partitaIva) {
        return this.getRechnungenMitStatus().filter(r => r.partitaIva === partitaIva);
    },

    // ==========================================
    // MWST-BERECHNUNGEN
    // ==========================================

    /**
     * Berechnet MwSt-Werte für eine Rechnung
     * @param {number} brutto - Bruttobetrag
     * @param {number} mwstSatz - MwSt-Satz (z.B. 0.22)
     * @param {boolean} mitInps - Hat INPS-Beitrag
     * @param {boolean} mitRitenuta - Hat Ritenuta d'acconto
     * @returns {Object} Berechnete Werte
     */
    berechneMwst: function(brutto, mwstSatz = MWST_SAETZE.STANDARD, mitInps = false, mitRitenuta = false) {
        const netto = brutto / (1 + mwstSatz);
        const mwstBetrag = brutto - netto;

        // Pro-Rata: Nicht absetzbare MwSt
        const absetzbareMwst = mwstBetrag * PRO_RATA.AKTUELL;
        const nichtAbsetzbareMwst = mwstBetrag * (1 - PRO_RATA.AKTUELL);

        // INPS (4% auf Netto bei Freiberuflern)
        let inpsBetrag = 0;
        if (mitInps) {
            inpsBetrag = netto * 0.04;
        }

        // Ritenuta d'acconto (20% auf Netto)
        let ritenutaBetrag = 0;
        if (mitRitenuta) {
            ritenutaBetrag = netto * 0.20;
        }

        return {
            brutto: Math.round(brutto * 100) / 100,
            netto: Math.round(netto * 100) / 100,
            mwstBetrag: Math.round(mwstBetrag * 100) / 100,
            mwstSatz: mwstSatz,
            absetzbareMwst: Math.round(absetzbareMwst * 100) / 100,
            nichtAbsetzbareMwst: Math.round(nichtAbsetzbareMwst * 100) / 100,
            inpsBetrag: Math.round(inpsBetrag * 100) / 100,
            ritenutaBetrag: Math.round(ritenutaBetrag * 100) / 100,
            zuZahlen: Math.round((brutto - ritenutaBetrag) * 100) / 100
        };
    },

    // ==========================================
    // BUDGET-VERGLEICH (YTD, PY)
    // ==========================================

    /**
     * Holt Kosten für Zeitraum Year-to-Date
     */
    getKostenYTD: function(projektId, jahr = new Date().getFullYear()) {
        const rechnungen = this.getRechnungenByProjekt(projektId);
        const startDatum = new Date(jahr, 0, 1);
        const heute = new Date();

        return rechnungen.filter(r => {
            const datum = new Date(r.datum);
            return datum >= startDatum && datum <= heute;
        }).reduce((sum, r) => sum + r.betrag, 0);
    },

    /**
     * Holt Kosten für Vorjahr Year-to-Date (gleicher Zeitraum)
     */
    getKostenPYYTD: function(projektId) {
        const vorjahr = new Date().getFullYear() - 1;
        const rechnungen = this.getRechnungenByProjekt(projektId);
        const startDatum = new Date(vorjahr, 0, 1);
        const vergleichsDatum = new Date(vorjahr, new Date().getMonth(), new Date().getDate());

        return rechnungen.filter(r => {
            const datum = new Date(r.datum);
            return datum >= startDatum && datum <= vergleichsDatum;
        }).reduce((sum, r) => sum + r.betrag, 0);
    },

    /**
     * Holt Gesamtkosten für ein Jahr
     */
    getKostenGesamt: function(projektId, jahr = new Date().getFullYear()) {
        const rechnungen = this.getRechnungenByProjekt(projektId);
        const startDatum = new Date(jahr, 0, 1);
        const endDatum = new Date(jahr, 11, 31);

        return rechnungen.filter(r => {
            const datum = new Date(r.datum);
            return datum >= startDatum && datum <= endDatum;
        }).reduce((sum, r) => sum + r.betrag, 0);
    },

    /**
     * Erstellt Budget-Vergleich für Projekt
     */
    getBudgetVergleich: function(projektId) {
        const aktuellesJahr = new Date().getFullYear();
        const plannedCosts = this.getPlannedCostsByProject(projektId);
        const planSumme = plannedCosts.reduce((sum, pc) => sum + pc.plannedAmount, 0);

        return {
            projektId: projektId,
            projektName: KUNST_MERAN_PROJEKTE[projektId]?.name || 'Unbekannt',
            plan: planSumme,
            ytd: this.getKostenYTD(projektId),
            gesamt: this.getKostenGesamt(projektId),
            pyYtd: this.getKostenPYYTD(projektId),
            pyGesamt: this.getKostenGesamt(projektId, aktuellesJahr - 1),
            abweichungYtd: this.getKostenYTD(projektId) - (planSumme * (new Date().getMonth() + 1) / 12),
            abweichungGesamt: this.getKostenGesamt(projektId) - planSumme
        };
    },

    /**
     * Holt Budget-Vergleich für alle Projekte
     */
    getAllBudgetVergleiche: function() {
        const vergleiche = [];
        for (const projektId in KUNST_MERAN_PROJEKTE) {
            vergleiche.push(this.getBudgetVergleich(parseInt(projektId)));
        }
        return vergleiche;
    },

    // ==========================================
    // EXPORT FUNKTIONEN FÜR BARBARA
    // ==========================================

    /**
     * Exportiert Rechnungen nach Status als CSV (verbessertes Format)
     */
    exportRechnungenCSV: function(statusFilter = null, projektFilter = null, lieferantFilter = null) {
        let rechnungen = statusFilter
            ? this.getRechnungenByStatus(statusFilter)
            : this.getRechnungenMitStatus();

        // Zusätzliche Filter anwenden
        if (projektFilter) {
            rechnungen = rechnungen.filter(r => String(r.projektId) === String(projektFilter));
        }
        if (lieferantFilter) {
            rechnungen = rechnungen.filter(r => r.partitaIva === lieferantFilter);
        }

        // Sortieren nach Datum
        rechnungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));

        let csv = '\uFEFF'; // BOM für UTF-8
        csv += 'RECHNUNGSEXPORT KUNST MERAN\n';
        csv += 'Exportdatum;' + new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE') + '\n';
        csv += 'Anzahl Rechnungen;' + rechnungen.length + '\n';
        if (statusFilter) csv += 'Filter Status;' + statusFilter + '\n';
        if (projektFilter) {
            const projekt = KUNST_MERAN_PROJEKTE[projektFilter];
            csv += 'Filter Projekt;' + (projekt?.name || projektFilter) + '\n';
        }
        csv += '\n';

        // Überschriften
        csv += 'Nr;Datum;Lieferant;Partita IVA Fornitore;Partita IVA Cliente;Rechnungsnr;Typ;';
        csv += 'Netto;MwSt 22%;Brutto;Projekt;Projekt-ID;';
        csv += 'Status;Kostentyp;Kostentyp Datum;Abgabestelle;Abgabestelle Datum;Kontrolliert am;Bezahlt am;PDF vorhanden;Notizen\n';

        let gesamtNetto = 0;
        let gesamtMwst = 0;
        let gesamtBrutto = 0;

        rechnungen.forEach((r, idx) => {
            // Nutze die Werte aus JSON falls vorhanden
            const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
            const mwstBetrag = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
            const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);

            const projekt = KUNST_MERAN_PROJEKTE[r.projektId];
            const kostentyp = r.kostentyp ? this.getKostentypName(r.kostentyp) : '';
            const dokumentTyp = r.istGutschrift || r.dokumentTyp === 'NC' ? 'Gutschrift' : 'Rechnung';

            // Für Gutschriften: Beträge mit negativem Vorzeichen
            const faktor = r.istGutschrift || r.betrag < 0 ? -1 : 1;
            const displayNetto = Math.abs(netto) * (netto < 0 ? -1 : faktor);
            const displayMwst = Math.abs(mwstBetrag) * (mwstBetrag < 0 ? -1 : faktor);
            const displayBrutto = Math.abs(brutto) * (brutto < 0 ? -1 : faktor);

            gesamtNetto += displayNetto;
            gesamtMwst += displayMwst;
            gesamtBrutto += displayBrutto;

            csv += `${idx + 1};`;
            csv += `${r.datum};`;
            csv += `"${(r.fornitoreName || '').replace(/"/g, '""')}";`;
            csv += `${r.partitaIva || ''};`;
            csv += `${r.partitaIvaCliente || ''};`;
            csv += `${r.dokumentNr || ''};`;
            csv += `${dokumentTyp};`;
            csv += `${displayNetto.toFixed(2).replace('.', ',')};`;
            csv += `${displayMwst.toFixed(2).replace('.', ',')};`;
            csv += `${displayBrutto.toFixed(2).replace('.', ',')};`;
            csv += `"${projekt?.name || ''}";`;
            csv += `${r.projektId || ''};`;
            csv += `${r.workflowStatus || ''};`;
            csv += `"${kostentyp}";`;
            csv += `${r.kostentypAm ? this.formatDatum(r.kostentypAm) : ''};`;
            csv += `${r.abgabestelle || ''};`;
            csv += `${r.abgabestelleAm ? this.formatDatum(r.abgabestelleAm) : ''};`;
            csv += `${r.kontrolliertAm ? this.formatDatum(r.kontrolliertAm) : ''};`;
            csv += `${r.bezahltAm ? this.formatDatum(r.bezahltAm) : ''};`;
            csv += `${r.pdfExists ? 'Ja' : 'Nein'};`;
            csv += `"${(r.notizen || '').replace(/"/g, '""')}"\n`;
        });

        // Summenzeile
        csv += '\n';
        csv += ';;;;;SUMME;;';
        csv += `${gesamtNetto.toFixed(2).replace('.', ',')};`;
        csv += `${gesamtMwst.toFixed(2).replace('.', ',')};`;
        csv += `${gesamtBrutto.toFixed(2).replace('.', ',')};`;
        csv += ';;;;;;;;;;;\n';

        return csv;
    },

    /**
     * Exportiert Projekt-Zusammenfassung für Abgabestellen (verbessertes Format)
     */
    exportProjektAbrechnung: function(projektId, abgabestelle = null) {
        let rechnungen = this.getRechnungenByProjekt(projektId);
        if (abgabestelle) {
            rechnungen = rechnungen.filter(r => r.abgabestelle === abgabestelle);
        }

        // Sortieren nach Datum
        rechnungen.sort((a, b) => new Date(a.datum) - new Date(b.datum));

        const projekt = KUNST_MERAN_PROJEKTE[projektId];
        let csv = '\uFEFF';
        csv += `PROJEKTABRECHNUNG KUNST MERAN\n`;
        csv += `Projekt;${projekt?.name || projektId}\n`;
        csv += `Projekt-ID;${projektId}\n`;
        csv += `Exportdatum;${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}\n`;
        if (abgabestelle) {
            csv += `Abgabestelle;${abgabestelle}\n`;
        }
        csv += `Anzahl Rechnungen;${rechnungen.length}\n`;
        csv += '\n';

        let gesamtNetto = 0;
        let gesamtMwst = 0;
        let gesamtBrutto = 0;
        let gutschriftenNetto = 0;

        // Aufschlüsselung nach Kostentyp
        const kostentypSummen = {};

        csv += 'Nr;Datum;Lieferant;Partita IVA;Rechnungsnr;Typ;Kostentyp;Netto;MwSt 22%;Brutto;Status;PDF\n';

        rechnungen.forEach((r, idx) => {
            // Nutze die Werte aus JSON falls vorhanden
            const netto = r.betragNetto !== undefined ? r.betragNetto : r.betrag;
            const mwstBetrag = r.betragMwst !== undefined ? r.betragMwst : (r.betrag * 0.22);
            const brutto = r.betragGesamt !== undefined ? r.betragGesamt : (r.betrag * 1.22);

            const dokumentTyp = r.istGutschrift || r.dokumentTyp === 'NC' ? 'NC' : 'F';
            const kostentyp = r.kostentyp ? this.getKostentypName(r.kostentyp) : 'Nicht zugeordnet';

            // Summen berechnen
            gesamtNetto += netto;
            gesamtMwst += mwstBetrag;
            gesamtBrutto += brutto;

            if (r.istGutschrift || netto < 0) {
                gutschriftenNetto += Math.abs(netto);
            }

            // Kostentyp-Summen
            if (!kostentypSummen[kostentyp]) {
                kostentypSummen[kostentyp] = { netto: 0, brutto: 0, anzahl: 0 };
            }
            kostentypSummen[kostentyp].netto += netto;
            kostentypSummen[kostentyp].brutto += brutto;
            kostentypSummen[kostentyp].anzahl++;

            csv += `${idx + 1};`;
            csv += `${r.datum};`;
            csv += `"${(r.fornitoreName || '').replace(/"/g, '""')}";`;
            csv += `${r.partitaIva || ''};`;
            csv += `${r.dokumentNr || ''};`;
            csv += `${dokumentTyp};`;
            csv += `"${kostentyp}";`;
            csv += `${netto.toFixed(2).replace('.', ',')};`;
            csv += `${mwstBetrag.toFixed(2).replace('.', ',')};`;
            csv += `${brutto.toFixed(2).replace('.', ',')};`;
            csv += `${r.workflowStatus || ''};`;
            csv += `${r.pdfExists ? 'Ja' : 'Nein'}\n`;
        });

        // Summenzeile
        csv += '\n';
        csv += `;;;;;SUMME;;`;
        csv += `${gesamtNetto.toFixed(2).replace('.', ',')};`;
        csv += `${gesamtMwst.toFixed(2).replace('.', ',')};`;
        csv += `${gesamtBrutto.toFixed(2).replace('.', ',')};\n`;

        // Aufschlüsselung nach Kostentyp
        csv += '\n\nAUFSCHLÜSSELUNG NACH KOSTENTYP\n';
        csv += 'Kostentyp;Anzahl;Netto;Brutto\n';
        for (const [typ, summen] of Object.entries(kostentypSummen)) {
            csv += `"${typ}";${summen.anzahl};`;
            csv += `${summen.netto.toFixed(2).replace('.', ',')};`;
            csv += `${summen.brutto.toFixed(2).replace('.', ',')}\n`;
        }

        // Wenn Gutschriften vorhanden
        if (gutschriftenNetto > 0) {
            csv += '\n';
            csv += `Gutschriften gesamt (Netto);;${gutschriftenNetto.toFixed(2).replace('.', ',')};\n`;
        }

        return csv;
    },

    // ==========================================
    // HILFSFUNKTIONEN
    // ==========================================

    /**
     * Holt Kunst Meran Projekt nach ID
     */
    getKunstMeranProjekt: function(projektId) {
        return KUNST_MERAN_PROJEKTE[projektId] || null;
    },

    /**
     * Holt alle Kunst Meran Projekte
     */
    getAllKunstMeranProjekte: function() {
        return Object.values(KUNST_MERAN_PROJEKTE);
    },

    /**
     * Generiert PDF-Pfad für Rechnung
     */
    getPdfPath: function(partitaIva, dokumentNr) {
        // Ersetze "/" durch "." in Dokumentnummer
        const safeDokNr = dokumentNr.replace(/\//g, '.');
        return this.PATHS.EK_RECHNUNGEN + partitaIva + '_' + safeDokNr + '.pdf';
    },

    /**
     * Formatiert Betrag als EUR
     */
    formatEUR: function(betrag) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(betrag);
    },

    /**
     * Formatiert Datum
     */
    formatDatum: function(datum) {
        return new Date(datum).toLocaleDateString('de-DE');
    },

    // ==========================================
    // SITZUNGEN (ehemals Notion)
    // ==========================================

    getSitzungen: function() {
        return this.load(this.KEYS.SITZUNGEN) || [];
    },

    saveSitzung: function(sitzung) {
        const sitzungen = this.getSitzungen();
        if (sitzung.id) {
            const idx = sitzungen.findIndex(s => s.id === sitzung.id);
            if (idx !== -1) sitzungen[idx] = sitzung;
        } else {
            sitzung.id = Date.now();
            sitzung.createdAt = new Date().toISOString();
            sitzungen.push(sitzung);
        }
        this.save(this.KEYS.SITZUNGEN, sitzungen);
        return sitzung;
    },

    deleteSitzung: function(id) {
        const sitzungen = this.getSitzungen().filter(s => s.id !== id);
        this.save(this.KEYS.SITZUNGEN, sitzungen);
    },

    // ==========================================
    // TASKS (Aufgaben aus Sitzungen)
    // ==========================================

    getTasks: function() {
        return this.load(this.KEYS.TASKS) || [];
    },

    saveTask: function(task) {
        const tasks = this.getTasks();
        if (task.id) {
            const idx = tasks.findIndex(t => t.id === task.id);
            if (idx !== -1) tasks[idx] = task;
        } else {
            task.id = Date.now();
            task.createdAt = new Date().toISOString();
            tasks.push(task);
        }
        this.save(this.KEYS.TASKS, tasks);
        return task;
    },

    deleteTask: function(id) {
        const tasks = this.getTasks().filter(t => t.id !== id);
        this.save(this.KEYS.TASKS, tasks);
    },

    getOpenTasks: function() {
        return this.getTasks().filter(t => t.status !== 'erledigt');
    },

    getUpcomingDeadlines: function(days = 14) {
        const heute = new Date();
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        return this.getTasks()
            .filter(t => t.deadline && t.status !== 'erledigt')
            .filter(t => new Date(t.deadline) <= deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    },

    // ==========================================
    // KÜNSTLER
    // ==========================================

    getKuenstler: function() {
        return this.load(this.KEYS.KUENSTLER) || [];
    },

    saveKuenstler: function(kuenstler) {
        const liste = this.getKuenstler();
        if (kuenstler.id) {
            const idx = liste.findIndex(k => k.id === kuenstler.id);
            if (idx !== -1) liste[idx] = kuenstler;
        } else {
            kuenstler.id = Date.now();
            kuenstler.createdAt = new Date().toISOString();
            liste.push(kuenstler);
        }
        this.save(this.KEYS.KUENSTLER, liste);
        return kuenstler;
    },

    deleteKuenstler: function(id) {
        const liste = this.getKuenstler().filter(k => k.id !== id);
        this.save(this.KEYS.KUENSTLER, liste);
    },

    // ==========================================
    // INVENTAR (Kunstgüter/Attrezzi)
    // ==========================================

    getInventar: function() {
        return this.load(this.KEYS.INVENTAR) || [];
    },

    saveInventar: function(item) {
        const liste = this.getInventar();
        if (item.id) {
            const idx = liste.findIndex(i => i.id === item.id);
            if (idx !== -1) liste[idx] = item;
        } else {
            item.id = Date.now();
            item.createdAt = new Date().toISOString();
            // Inventar-Nummer automatisch generieren
            if (!item.inventarNr) {
                const maxNr = liste.reduce((max, i) => {
                    const nr = parseInt(i.inventarNr?.replace(/\D/g, '') || '0');
                    return nr > max ? nr : max;
                }, 0);
                item.inventarNr = 'INV-' + String(maxNr + 1).padStart(4, '0');
            }
            liste.push(item);
        }
        this.save(this.KEYS.INVENTAR, liste);
        return item;
    },

    deleteInventar: function(id) {
        const liste = this.getInventar().filter(i => i.id !== id);
        this.save(this.KEYS.INVENTAR, liste);
    },

    // ==========================================
    // ADRESSEN (Kontakte)
    // ==========================================

    getAdressen: function() {
        return this.load(this.KEYS.ADRESSEN) || [];
    },

    saveAdresse: function(adresse) {
        const liste = this.getAdressen();
        if (adresse.id) {
            const idx = liste.findIndex(a => a.id === adresse.id);
            if (idx !== -1) liste[idx] = adresse;
        } else {
            adresse.id = Date.now();
            adresse.createdAt = new Date().toISOString();
            liste.push(adresse);
        }
        this.save(this.KEYS.ADRESSEN, liste);
        return adresse;
    },

    deleteAdresse: function(id) {
        const liste = this.getAdressen().filter(a => a.id !== id);
        this.save(this.KEYS.ADRESSEN, liste);
    },

    // ==========================================
    // EINNAHMENPLANUNG
    // ==========================================

    getEinnahmen: function(jahr = null) {
        const alle = this.load(this.KEYS.EINNAHMEN) || [];
        if (jahr) {
            return alle.filter(e => e.jahr === parseInt(jahr));
        }
        return alle;
    },

    saveEinnahme: function(einnahme) {
        const liste = this.getEinnahmen();
        if (einnahme.id) {
            // Update
            const idx = liste.findIndex(e => e.id === einnahme.id);
            if (idx >= 0) {
                einnahme.updatedAt = new Date().toISOString();
                liste[idx] = einnahme;
            }
        } else {
            // Neu
            einnahme.id = Date.now();
            einnahme.createdAt = new Date().toISOString();
            liste.push(einnahme);
        }
        this.save(this.KEYS.EINNAHMEN, liste);
        return einnahme;
    },

    deleteEinnahme: function(id) {
        const liste = this.getEinnahmen().filter(e => e.id !== id);
        this.save(this.KEYS.EINNAHMEN, liste);
        // Auch zugehöriges Dokument löschen
        this.deleteEinnahmeDokument(id);
    },

    // Dokumente als Base64 speichern (für localhost ohne Backend)
    saveEinnahmeDokument: function(einnahmeId, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dokumente = this.load(this.KEYS.EINNAHMEN_DOKUMENTE) || {};
                dokumente[einnahmeId] = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result,
                    uploadedAt: new Date().toISOString()
                };
                this.save(this.KEYS.EINNAHMEN_DOKUMENTE, dokumente);
                resolve(dokumente[einnahmeId]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    getEinnahmeDokument: function(einnahmeId) {
        const dokumente = this.load(this.KEYS.EINNAHMEN_DOKUMENTE) || {};
        return dokumente[einnahmeId] || null;
    },

    deleteEinnahmeDokument: function(einnahmeId) {
        const dokumente = this.load(this.KEYS.EINNAHMEN_DOKUMENTE) || {};
        delete dokumente[einnahmeId];
        this.save(this.KEYS.EINNAHMEN_DOKUMENTE, dokumente);
    },

    // Zusammenfassung Einnahmen nach Status
    getEinnahmenSummary: function(jahr) {
        const einnahmen = this.getEinnahmen(jahr);
        return {
            bestaetigt: einnahmen.filter(e => e.status === 'bestaetigt' || e.status === 'eingegangen')
                                 .reduce((sum, e) => sum + (parseFloat(e.betragPlan) || 0), 0),
            erwartet: einnahmen.filter(e => e.status === 'erwartet')
                               .reduce((sum, e) => sum + (parseFloat(e.betragPlan) || 0), 0),
            unsicher: einnahmen.filter(e => e.status === 'unsicher')
                               .reduce((sum, e) => sum + (parseFloat(e.betragPlan) || 0), 0),
            gesamt: einnahmen.filter(e => e.status !== 'abgesagt')
                             .reduce((sum, e) => sum + (parseFloat(e.betragPlan) || 0), 0),
            ist: einnahmen.reduce((sum, e) => sum + (parseFloat(e.betragIst) || 0), 0)
        };
    },

    // ==========================================
    // REPORTING - Deckungsbeitragsrechnung
    // ==========================================

    // Konten-Kategorien basierend auf Monatsbilanz
    KONTEN_KATEGORIEN: {
        // 1. UMSÄTZE
        ERLOESE: { prefix: '6001', name: 'Erlöse Lieferungen/Leistungen', gruppe: 'umsatz' },
        ZUSCHUESSE: { prefix: '6401', name: 'Zuschüsse und Beiträge', gruppe: 'umsatz' },
        SONST_ERTRAEGE: { prefix: '6400', name: 'Sonstige betriebliche Erträge', gruppe: 'umsatz' },

        // 2. DIREKTE KOSTEN (DB1)
        MATERIAL: { prefix: '680', name: 'Materialkosten', gruppe: 'direkt' },
        DIENSTLEISTUNG_AUSST: { prefix: '690125', name: 'Dienstleistungen (Ausst./Projekte)', gruppe: 'direkt' },
        REISEKOSTEN_KUENSTLER: { prefix: '69033', name: 'Reisekosten/Unterkunft Künstler', gruppe: 'direkt' },

        // 4. STRUKTURKOSTEN (DB2)
        VERWALTUNG: { prefix: '69012', name: 'Verwaltung', gruppe: 'struktur' },
        WERBUNG: { prefix: '6902', name: 'Werbung/Marketing', gruppe: 'struktur' },
        MIETE: { prefix: '700', name: 'Miete/Strukturen', gruppe: 'struktur' },
        GEBAEUDEKOSTEN: { prefix: '69024', name: 'Gebäudekosten', gruppe: 'struktur' },
        PERSONAL: { prefix: '710', name: 'Personalkosten', gruppe: 'struktur' },

        // Weitere
        ABSCHREIBUNGEN: { prefix: '720', name: 'Abschreibungen', gruppe: 'abschreibung' },
        ZINSEN: { prefix: '850', name: 'Zinsen', gruppe: 'zinsen' }
    },

    // Deckungsbeitragsrechnung berechnen
    calculateDeckungsbeitrag: function(jahr) {
        const buchungen = this.getBuchungen(jahr);
        const einnahmen = this.getEinnahmen(jahr);

        // Einnahmen nach Konten gruppieren
        const einnahmenNachKonto = {};
        einnahmen.filter(e => e.status !== 'abgesagt').forEach(e => {
            const konto = e.konto || 'unbekannt';
            if (!einnahmenNachKonto[konto]) einnahmenNachKonto[konto] = { plan: 0, ist: 0 };
            einnahmenNachKonto[konto].plan += parseFloat(e.betragPlan) || 0;
            einnahmenNachKonto[konto].ist += parseFloat(e.betragIst) || 0;
        });

        // Kosten nach Konten gruppieren (aus DATEV-Buchungen)
        const kostenNachKonto = {};
        buchungen.forEach(b => {
            const konto = b.konto || 'unbekannt';
            if (!kostenNachKonto[konto]) kostenNachKonto[konto] = 0;
            kostenNachKonto[konto] += parseFloat(b.betrag) || 0;
        });

        // Zusammenfassung
        let umsaetze = 0;
        let direkteKosten = 0;
        let strukturkosten = 0;
        let abschreibungen = 0;
        let zinsen = 0;

        // Kategorisieren
        Object.entries(kostenNachKonto).forEach(([konto, betrag]) => {
            for (const [key, kat] of Object.entries(this.KONTEN_KATEGORIEN)) {
                if (konto.startsWith(kat.prefix)) {
                    switch(kat.gruppe) {
                        case 'direkt': direkteKosten += betrag; break;
                        case 'struktur': strukturkosten += betrag; break;
                        case 'abschreibung': abschreibungen += betrag; break;
                        case 'zinsen': zinsen += betrag; break;
                    }
                    break;
                }
            }
        });

        // Umsätze aus Einnahmenplanung
        umsaetze = einnahmen.filter(e => e.status !== 'abgesagt')
                           .reduce((sum, e) => sum + (parseFloat(e.betragIst) || parseFloat(e.betragPlan) || 0), 0);

        const db1 = umsaetze - direkteKosten;
        const db2 = db1 - strukturkosten;
        const ebitda = db2;
        const ergebnis = ebitda - abschreibungen - zinsen;

        return {
            umsaetze,
            direkteKosten,
            db1,
            strukturkosten,
            db2,
            ebitda,
            abschreibungen,
            zinsen,
            ergebnis,
            details: {
                einnahmenNachKonto,
                kostenNachKonto
            }
        };
    }
};

// Initialisierung beim Laden
DataManager.init();

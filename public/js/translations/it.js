/**
 * Italian translations for Kunsthaus Meran Portal
 */
const translations_it = {
    // App title
    app: {
        title: "Software Progetto Kunst Meran",
        loading: "Caricamento...",
        readOnlyBanner: "Accesso in sola lettura - Modifica non consentita"
    },

    // Navigation
    nav: {
        dashboard: "Dashboard",
        projects: "Progetti",
        invoices: "Fatture",
        suppliers: "Fornitori",
        personnel: "Personale & Ore",
        inventory: "Inventario",
        shop: "Shop",
        reporting: "Reporting",
        revenue: "Pianificazione Entrate",
        budget: "Pianificazione Budget",
        members: "Soci",
        import: "Importa",
        config: "Configurazione",
        logout: "Esci"
    },

    // Common actions
    actions: {
        save: "Salva",
        cancel: "Annulla",
        delete: "Elimina",
        edit: "Modifica",
        details: "Dettagli",
        search: "Cerca",
        filter: "Filtra",
        export: "Esporta",
        import: "Importa",
        refresh: "Aggiorna",
        clear: "Cancella",
        close: "Chiudi",
        add: "Aggiungi",
        remove: "Rimuovi",
        copy: "Copia",
        archive: "Archivia",
        restore: "Ripristina",
        reset: "Reimposta",
        confirm: "Conferma",
        back: "Indietro",
        next: "Avanti",
        previous: "Precedente",
        selectAll: "Seleziona tutto",
        deselectAll: "Deseleziona tutto",
        newEntry: "+ Nuova voce"
    },

    // Status labels
    status: {
        new: "Nuovo",
        checked: "Controllato",
        paid: "Pagato",
        planning: "Pianificazione",
        running: "In corso",
        completed: "Completato",
        active: "Attivo",
        inactive: "Inattivo",
        archived: "Archiviato",
        open: "Aperto",
        closed: "Chiuso",
        pending: "In attesa",
        approved: "Approvato",
        rejected: "Rifiutato",
        assigned: "Assegnato",
        notAssigned: "Non assegnato"
    },

    // Form labels
    forms: {
        year: "Anno",
        date: "Data",
        amount: "Importo",
        description: "Descrizione",
        notes: "Note",
        name: "Nome",
        email: "Email",
        phone: "Telefono",
        address: "Indirizzo",
        city: "Città",
        country: "Paese",
        type: "Tipo",
        category: "Categoria",
        project: "Progetto",
        supplier: "Fornitore",
        status: "Stato",
        from: "Da",
        to: "A",
        budget: "Budget",
        location: "Sede",
        allYears: "Tutti gli anni",
        allProjects: "Tutti i progetti",
        allStatus: "Tutti gli stati",
        allCategories: "Tutte le categorie",
        allSuppliers: "Tutti i fornitori",
        showEntries: "Voci",
        perPage: "Per pagina",
        modifiedSince: "Modificato da"
    },

    // Placeholders
    placeholders: {
        searchSupplier: "Cerca fornitore...",
        searchProject: "Cerca progetto...",
        searchNumber: "Cerca numero...",
        searchGeneral: "Cerca...",
        searchMovements: "Cerca movimenti (N. fattura, Fornitore, Importo, Note...)",
        searchMembers: "Cerca socio (Nome, Indirizzo, Email)...",
        searchArticles: "Cerca articoli..."
    },

    // Dashboard
    dashboard: {
        title: "Dashboard",
        activeProjects: "Progetti Attivi",
        totalBudget: "Budget Totale",
        spent: "Speso (Effettivo)",
        available: "Disponibile",
        projectOverview: "Panoramica Progetti",
        noProjectsFound: "Nessun progetto con registrazioni trovato",
        legend: {
            under70: "< 70% consumato",
            between70and90: "70-90% consumato",
            over90: "> 90% consumato"
        }
    },

    // Projects
    projects: {
        title: "Progetti",
        newProject: "+ Nuovo Progetto",
        projectList: "Elenco Progetti",
        projectName: "Nome Progetto",
        location: "Sede",
        budget: "Budget",
        actualCosts: "Costi Effettivi",
        available: "Disponibile",
        modified: "Modificato",
        actions: "Azioni",
        noProjects: "Nessun progetto disponibile",
        showingProjects: "Visualizzazione {start}-{end} di {total} progetti",
        deleteConfirm: "Eliminare davvero il progetto?",
        projectNotFound: "Progetto non trovato",
        workHours: "Ore di Lavoro",
        pl1Exhibition: "PL1 - Gestione Mostre"
    },

    // Invoices
    invoices: {
        title: "Fatture d'Acquisto",
        invoiceNumber: "N. Fattura",
        date: "Data",
        supplier: "Fornitore",
        project: "Progetto",
        costType: "Tipo di Costo",
        net: "Netto",
        vat: "IVA",
        gross: "Lordo",
        status: "Stato",
        pdf: "PDF",
        checkedDate: "Controllato",
        paidDate: "Pagato",
        modified: "Modificato",
        submissionPoint: "Punto di Consegna",
        note: "Nota",
        actions: "Azioni",
        total: "Totale",
        open: "Aperto",
        paidAmount: "Pagato €",
        csvExport: "Esporta CSV",
        linkPdf: "Collega PDF",
        syncSuppliers: "Sincronizza Fornitori",
        noInvoices: "Nessuna fattura trovata",
        noInvoicesWithPdf: "Nessuna fattura con PDF per questo progetto",
        selected: "{count} selezionati",
        markAsNew: "Segna come nuovo",
        markAsChecked: "Segna come controllato",
        markAsPaid: "Segna come pagato",
        myInvoices: "Le mie fatture",
        pdfStatus: "Stato PDF",
        datevStatus: "Stato DATEV"
    },

    // Cost types
    costTypes: {
        title: "Tipo di Costo/Conto",
        allAccounts: "Tutti i conti",
        curation: "Curatela",
        artistExpense: "Spesa Artista",
        transport: "Trasporto",
        production: "Produzione",
        mediation: "Mediazione",
        documentation: "Documentazione",
        communication: "Comunicazione",
        selectCostType: "Assegna tipo di costo..."
    },

    // Suppliers
    suppliers: {
        title: "Fornitori",
        newSupplier: "+ Nuovo Fornitore",
        supplierName: "Fornitore",
        partitaIva: "Partita IVA",
        address: "Indirizzo",
        contactPerson: "Persona di Contatto",
        totalSuppliers: "Fornitori totali",
        withInvoices: "Con fatture",
        totalVolume: "Volume totale",
        searchPlaceholder: "Cerca fornitore (Nome, Partita IVA, Indirizzo)...",
        noSuppliers: "Nessun fornitore trovato",
        change: "+/- %"
    },

    // Personnel / Time tracking
    personnel: {
        title: "Personale",
        newTimeEntry: "+ Registra Tempo",
        timeEntries: "Registrazioni Tempo",
        external: "Esterni",
        calendar: "Calendario",
        courses: "Corsi",
        attendance: "Presenze",
        myEntries: "Le mie Registrazioni",
        hoursThisWeek: "Ore questa settimana",
        hoursThisMonth: "Ore questo mese",
        employee: "Dipendente",
        allEmployees: "Tutti i dipendenti",
        externalEmployee: "Dipendente Esterno",
        allExternals: "Tutti gli esterni",
        hours: "Ore",
        hourlyRate: "Tariffa Oraria",
        costs: "Costi",
        externalHoursTotal: "Ore esterne totali",
        externalCostsTotal: "Costi esterni totali",
        externalEmployees: "Dipendenti esterni",
        externalHoursByProject: "Ore esterne per progetto",
        filterAdmin: "Filtro (Admin)",
        resetFilters: "Reimposta filtri",
        noTimeEntries: "Nessuna registrazione tempo per questo progetto",
        loadingHours: "Caricamento ore...",
        errorLoading: "Errore di caricamento"
    },

    // Calendar
    calendar: {
        title: "Calendario Manutenzione",
        month: "Mese",
        type: "Tipo",
        employeesOnly: "Solo dipendenti",
        suppliersOnly: "Solo fornitori",
        allTypes: "Tutti",
        entriesInMonth: "Voci nel mese",
        totalHours: "Ore totali",
        supplierHours: "Ore fornitori",
        previousMonth: "Mese precedente",
        nextMonth: "Mese successivo",
        weekdays: {
            mo: "Lu",
            tu: "Ma",
            we: "Me",
            th: "Gi",
            fr: "Ve",
            sa: "Sa",
            su: "Do"
        }
    },

    // Courses
    courses: {
        title: "Corsi",
        newCourse: "+ Nuovo Corso",
        courseName: "Nome Corso",
        instructor: "Istruttore",
        startDate: "Data Inizio",
        endDate: "Data Fine",
        participants: "Partecipanti",
        maxParticipants: "Max. Partecipanti",
        price: "Prezzo",
        noCourses: "Nessun corso trovato",
        totalCourses: "Corsi totali",
        mandatoryCourses: "Corsi obbligatori",
        expiringSoon: "In scadenza (90 giorni)",
        plannedDates: "Date programmate",
        expiringWarning: "Attenzione: {count} certificati scadono nei prossimi 90 giorni.",
        showDetails: "Mostra dettagli",
        filter: "Filtro",
        allCategories: "Tutte le categorie",
        allTypes: "Tutti",
        mandatoryOnly: "Solo obbligatori",
        voluntaryOnly: "Solo facoltativi",
        activeOnly: "Solo attivi",
        inactiveOnly: "Solo inattivi",
        resetFilters: "Reimposta filtri",
        manageCourses: "Gestisci corsi",
        providers: "Fornitori",
        course: "Corso",
        mandatory: "Obbligatorio",
        due: "Scadenza",
        dates: "Date",
        myCourses: "I miei Corsi & Certificati",
        date: "Data",
        certificateUntil: "Certificato fino al"
    },

    // Attendance
    attendance: {
        title: "Presenze",
        newEntry: "+ Nuova Voce",
        date: "Data",
        present: "Presente",
        absent: "Assente",
        vacation: "Ferie",
        sick: "Malattia",
        todayInOffice: "Oggi in ufficio",
        lunchToday: "Pranzo oggi",
        lunchMonth: "Pranzo questo mese",
        homeofficeToday: "Telelavoro oggi",
        attendanceAndLunch: "Presenze & Buoni pasto",
        orders: "Ordini",
        myAttendance: "Le mie presenze",
        markAttendance: "Segna presenza",
        office: "Ufficio",
        homeoffice: "Telelavoro",
        notWorking: "Non presente",
        lunchVoucher: "Buono pasto"
    },

    // Inventory
    inventory: {
        title: "Inventario",
        newItem: "+ Nuovo Articolo",
        itemName: "Denominazione",
        category: "Categoria",
        location: "Posizione",
        quantity: "Quantità",
        value: "Valore",
        lastCheck: "Ultimo Controllo",
        noItems: "Nessun articolo inventario trovato",
        designation: "Descrizione",
        valueEur: "Valore (EUR)",
        warehouse: "Magazzino",
        external: "Esterno/Prestito",
        searchPlaceholder: "Cerca descrizione...",
        inventoryNo: "Nr. Inv.",
        condition: "Condizione",
        acquisition: "Acquisizione"
    },

    // Shop
    shop: {
        title: "Shop & Cassa",
        articles: "Articoli",
        sales: "Vendite",
        cashRegister: "Chiusura Cassa",
        newArticle: "+ Nuovo Articolo",
        newSale: "+ Nuova Vendita",
        articleName: "Nome Articolo",
        price: "Prezzo",
        stock: "Giacenza",
        sold: "Venduto",
        revenue: "Ricavi",
        noArticles: "Nessun articolo trovato",
        noSales: "Nessuna vendita trovata",
        sellArticle: "+ Vendi Articolo",
        admission: "+ Ingresso",
        membership: "+ Quota Associativa",
        cashRevenueToday: "Incassi Contanti (oggi)",
        posRevenueToday: "Incassi POS (oggi)",
        cashBalance: "Saldo Cassa",
        articlesInStock: "Articoli in Giacenza",
        inventory: "Inventario",
        purchases: "Acquisti",
        invoices: "Fatture",
        cash: "Cassa",
        internalExpenses: "Spese Interne",
        articleStock: "Giacenza Articoli",
        allTypes: "Tutti i Tipi",
        allLocations: "Tutte le Sedi",
        excelImport: "Importa Excel",
        articleNo: "Art. N.",
        designation: "Descrizione",
        avgPurchasePrice: "Ø PA",
        sellingPrice: "PV",
        margin: "Margine",
        vat: "IVA",
        salesAndRevenue: "Vendite & Incassi",
        allPayments: "Tutti",
        pos: "POS",
        time: "Ora",
        quantity: "Quantità",
        unitPrice: "Prezzo Unitario",
        total: "Totale",
        payment: "Pagamento",
        goodsPurchases: "Acquisti Merce",
        recordPurchase: "+ Registra Acquisto",
        article: "Articolo",
        invoiceManagement: "Gestione Cassa",
        withdrawal: "- Prelievo",
        deposit: "+ Versamento",
        cashOverview: "Saldo Cassa",
        openingBalance: "Saldo Iniziale Contanti",
        setOpeningBalance: "Imposta Saldo Iniziale",
        cashRevenue: "+ Incassi Contanti",
        deposits: "+ Versamenti",
        withdrawals: "- Prelievi",
        expectedBalance: "= Saldo Cassa (Previsto)",
        posRevenue: "Incassi POS (Carta)",
        totalRevenue: "Incassi Totali"
    },

    // Reporting
    reporting: {
        title: "Reporting",
        projectReport: "Report Progetto",
        costAnalysis: "Analisi Costi",
        budgetComparison: "Confronto Budget",
        timeline: "Cronologia",
        period: "Periodo:",
        totalContributionMargin: "Analisi Margine di Contribuzione Totale",
        ytd: "YTD (fino ad oggi)",
        ytdPrevMonth: "YTD (fino al mese precedente)",
        fullYear: "Anno intero",
        balanceAndPl: "Bilancio & Conto Economico"
    },

    // Revenue planning
    revenue: {
        title: "Pianificazione Entrate",
        newRevenue: "+ Nuova Entrata",
        source: "Fonte",
        amount: "Importo",
        expectedDate: "Data Prevista",
        receivedDate: "Data Ricezione",
        status: {
            promised: "Promesso",
            received: "Ricevuto",
            applied: "Richiesto",
            open: "Aperto",
            rejected: "Rifiutato"
        },
        noRevenues: "Nessuna entrata trovata"
    },

    // Budget planning
    budget: {
        title: "Pianificazione Budget",
        newBudget: "+ Nuovo Budget",
        budgetName: "Nome Budget",
        planned: "Pianificato",
        actual: "Effettivo",
        difference: "Differenza",
        noBudgets: "Nessuna voce budget trovata"
    },

    // Members
    members: {
        title: "Soci",
        newMember: "+ Nuovo Socio",
        memberName: "Nome",
        memberNumber: "N. Socio",
        memberSince: "Socio dal",
        membershipType: "Tipo Iscrizione",
        contribution: "Quota",
        lastPayment: "Ultimo Pagamento",
        searchPlaceholder: "Cerca socio (Nome, Indirizzo, Email)...",
        noMembers: "Nessun socio trovato",
        totalMembers: "Soci totali",
        activeMembers: "Soci attivi",
        contributionTotal: "Quote totali"
    },

    // Import
    import: {
        title: "Importa",
        datevImport: "Importa DATEV",
        excelImport: "Importa Excel",
        pdfUpload: "Carica PDF",
        selectFile: "Seleziona file",
        uploadFile: "Carica file",
        importSuccess: "Importazione riuscita",
        importError: "Errore importazione"
    },

    // Configuration
    config: {
        title: "Configurazione",
        users: "Utenti",
        permissions: "Permessi",
        categories: "Categorie",
        settings: "Impostazioni",
        newUser: "+ Nuovo Utente",
        userName: "Nome Utente",
        role: "Ruolo",
        admin: "Amministratore",
        user: "Utente",
        viewer: "Visualizzatore"
    },

    // Session types
    sessionTypes: {
        internal: "Interno",
        external: "Esterno",
        board: "Consiglio"
    },

    // Meetings/Sessions
    meetings: {
        title: "Riunioni & Incontri",
        newMeeting: "+ Nuova Riunione",
        all: "Tutti",
        internalMeetings: "Riunioni Interne",
        externalMeetings: "Incontri Esterni",
        boardMeetings: "Riunioni del Consiglio",
        upcomingDeadlines: "Scadenze Imminenti",
        noDeadlines: "Nessuna scadenza imminente",
        meetingsList: "Riunioni",
        meetingTitle: "Titolo",
        openTasks: "Attività Aperte"
    },

    // Artists
    artists: {
        title: "Gestione Artisti",
        newArtist: "+ Nuovo Artista",
        artistsList: "Artisti",
        technique: "Tecnica/Mezzo",
        linkedEvents: "Eventi Collegati",
        contact: "Contatto",
        searchName: "Cerca nome..."
    },

    // Messages - Success
    success: {
        saved: "Salvato con successo",
        deleted: "Eliminato con successo",
        updated: "Aggiornato con successo",
        created: "Creato con successo",
        imported: "Importazione riuscita",
        exported: "Esportazione riuscita",
        copied: "Copiato negli appunti",
        archived: "Archiviato con successo",
        restored: "Ripristinato con successo",
        statusChanged: "Stato modificato",
        noteSaved: "Nota salvata",
        paidDateUpdated: "Data pagamento aggiornata",
        projectUpdated: "Progetto aggiornato",
        invoiceMoved: "Fattura spostata in \"{project}\"",
        costTypeAssigned: "Tipo di costo \"{type}\" assegnato a {count} voci"
    },

    // Messages - Errors
    errors: {
        general: "Si è verificato un errore",
        saveFailed: "Salvataggio fallito",
        deleteFailed: "Eliminazione fallita",
        loadFailed: "Caricamento fallito",
        notFound: "Non trovato",
        noPermission: "Nessun permesso",
        invalidInput: "Input non valido",
        requiredField: "Campo obbligatorio",
        networkError: "Errore di rete",
        serverError: "Errore del server",
        sessionExpired: "Sessione scaduta",
        projectNotSaved: "Impossibile salvare il progetto",
        adminOnlyPaid: "Solo gli admin possono contrassegnare le fatture come pagate",
        pleaseSelect: "Si prega di selezionare",
        nothingSelected: "Nessuna voce selezionata",
        enterName: "Inserisci un nome",
        selectProject: "Seleziona un progetto",
        selectCostType: "Seleziona un tipo di costo",
        yearLoadFailed: "Errore nel caricamento dell'anno"
    },

    // Confirmations
    confirm: {
        delete: "Eliminare davvero?",
        archive: "Archiviare davvero?",
        unsavedChanges: "Ci sono modifiche non salvate. Uscire davvero?",
        deleteProject: "Eliminare davvero il progetto? Tutti i dati correlati verranno eliminati.",
        deleteInvoice: "Eliminare davvero la fattura?",
        archivePdfsWithoutDatev: "Archiviare i PDF senza collegamento DATEV?"
    },

    // Pagination
    pagination: {
        page: "Pagina",
        of: "di",
        showing: "Visualizzazione",
        entries: "voci",
        first: "Prima",
        last: "Ultima",
        previous: "Precedente",
        next: "Successiva"
    },

    // Table headers
    table: {
        actions: "Azioni",
        noData: "Nessun dato disponibile",
        loading: "Caricamento..."
    },

    // Dates and times
    datetime: {
        today: "Oggi",
        yesterday: "Ieri",
        tomorrow: "Domani",
        thisWeek: "Questa settimana",
        lastWeek: "Settimana scorsa",
        thisMonth: "Questo mese",
        lastMonth: "Mese scorso",
        thisYear: "Quest'anno",
        lastYear: "Anno scorso",
        months: {
            january: "Gennaio",
            february: "Febbraio",
            march: "Marzo",
            april: "Aprile",
            may: "Maggio",
            june: "Giugno",
            july: "Luglio",
            august: "Agosto",
            september: "Settembre",
            october: "Ottobre",
            november: "Novembre",
            december: "Dicembre"
        }
    },

    // Submission points
    submissionPoints: {
        title: "Punto di Consegna",
        all: "Tutti",
        municipality: "Comune",
        region: "Regione",
        province: "Provincia"
    },

    // Language switcher
    language: {
        de: "Deutsch",
        en: "English",
        it: "Italiano",
        select: "Seleziona lingua"
    },

    // Modals - Common
    modals: {
        projectDetails: "Dettagli progetto",
        useExtendedView: "Utilizzare la vista progetto estesa.",
        newProject: "Nuovo progetto",
        editProject: "Modifica progetto",
        projectName: "Nome progetto",
        datevId: "ID DATEV",
        datevIdPlaceholder: "es. 2601",
        startDate: "Data inizio",
        endDate: "Data fine",
        budgetEur: "Budget (EUR)",
        hideInReporting: "Non mostrare nel reporting",
        hideInReportingHint: "per Shop, costi strutturali ecc.",
        responsibilities: "Responsabilità",
        pl1Exhibition: "PL1 - Mostra",
        pl2Communication: "PL2 - Comunicazione",
        pl3Mediation: "PL3 - Mediazione",
        dropboxLink: "Link Dropbox",
        newCost: "Registra costo",
        editCost: "Modifica costo",
        pleaseSelect: "Seleziona...",
        costType: "Tipo",
        actualCosts: "Costi effettivi",
        provisional: "Provvisorio",
        noSupplier: "-- Nessun fornitore --",
        vatTreatment: "Trattamento IVA",
        vatBruttoIt: "Lordo incl. 22% IVA (Italia)",
        vatNettoReverse: "Netto + Reverse Charge (UE estero)",
        vatNettoImport: "Netto + IVA importazione (paese terzo)",
        vatNettoExempt: "Netto esente IVA",
        invoiceAmount: "Importo fattura (EUR)",
        calculatedValues: "Valori calcolati",
        invoiceNumberPlaceholder: "es. FT-2026-0123",
        invoicePdf: "Fattura (PDF)",
        pdfDropOrClick: "Trascina PDF qui o clicca per selezionare",
        maxSize: "Dimensione massima: 10 MB",
        newTimeEntry: "Registra tempo",
        editTimeEntry: "Modifica registrazione tempo",
        whatWasDone: "Cosa è stato fatto?",
        whatWasDonePlaceholder: "es. Manutenzione riscaldamento, Installazione elettrica...",
        newCostType: "Nuovo tipo di costo",
        costTypeLabel: "Tipo di costo",
        color: "Colore",
        newAccount: "Nuovo conto",
        editAccount: "Modifica conto",
        accountNumber: "Numero conto",
        accountName: "Denominazione conto",
        accountNameIt: "Denominazione (IT)",
        dbLevel: "Livello DB",
        neutral: "Neutro (non in DB)",
        wildcardHint: "Usa % come wildcard (680% = tutti i conti che iniziano con 680)",
        newSupplier: "Nuovo fornitore",
        editSupplier: "Modifica fornitore",
        supplierNumber: "Nr. fornitore",
        street: "Via",
        postalCode: "CAP",
        responsibleForInvoice: "Responsabile del controllo fatture per fatture senza assegnazione progetto",
        newEmployee: "Nuovo dipendente",
        editEmployee: "Modifica dipendente",
        fullName: "Nome e cognome",
        internal: "Interno",
        external: "Esterno",
        role: "Ruolo",
        convertToActual: "Converti in costi effettivi",
        pdfPreview: "Anteprima PDF",
        open: "Apri",
        pdfNotFound: "PDF non trovato",
        invoiceDetails: "Dettagli fattura",
        projectAssignment: "Assegnazione progetto",
        projectAssignmentHint: "può essere modificato dal PL o Barbara",
        splitInvoice: "Fattura divisa",
        municipality: "Comune",
        province: "Provincia",
        internalNotes: "Note interne",
        newMeeting: "Nuova riunione",
        editMeeting: "Modifica riunione",
        meetingTitle: "Titolo",
        meetingType: "Tipo riunione",
        protocol: "Protocollo / Note",
        addTask: "+ Aggiungi attività",
        newArtist: "Nuovo artista",
        editArtist: "Modifica artista",
        artistName: "Nome artista",
        technique: "Tecnica / Medium",
        multiSelectHint: "Ctrl+Click per selezione multipla",
        biography: "Note / Biografia",
        newItem: "Nuovo oggetto",
        editItem: "Modifica oggetto",
        inventoryNumber: "Nr. inventario",
        needsRepair: "Necessita riparazione",
        attachments: "Allegati (Immagini, Contratti, Documenti)",
        newContact: "Nuovo contatto",
        editContact: "Modifica contatto",
        streetAddress: "Via / Indirizzo",
        other: "Altro",
        newRevenue: "Nuova entrata",
        editRevenue: "Modifica entrata",
        revenueCode: "Codice",
        uniquePerYear: "Unico per anno",
        funder: "Finanziatore",
        useAsSubmissionPoint: "Usa come punto di consegna per fatture",
        exampleHint: "es. Finanziamento sito web",
        newBudgetEntry: "Nuova voce budget",
        editBudgetEntry: "Modifica voce budget",
        yearlyBudget: "Inserire budget annuale – verrà distribuito uniformemente su 12 mesi",
        monthlyAmounts: "Importi mensili (EUR)",
        monthSum: "Somma mesi:",
        documentPreview: "Anteprima documento",
        newWorkspace: "Nuovo workspace",
        editWorkspace: "Modifica workspace",
        workspaceName: "Nome workspace",
        accessRights: "Diritti di accesso",
        showOnlyAssigned: "Mostra solo assegnati",
        workspaceUsers: "Utenti nel workspace",
        userMustLogin: "L'utente deve essersi già connesso almeno una volta.",
        emailAddress: "Indirizzo email",
        newMember: "Nuovo socio",
        editMember: "Modifica socio",
        memberNumber: "Nr. socio",
        gender: "Genere",
        male: "Maschile",
        female: "Femminile",
        diverse: "Diverso",
        birthYear: "Anno di nascita",
        memberSince: "Socio dal",
        paymentMethod: "Metodo di pagamento",
        paymentMethodHint: "es. Bonifico, Contanti...",
        memberImport: "Importa soci",
        excelFile: "File Excel (.xlsx, .xls)",
        selectDatevBooking: "Seleziona registrazione DATEV",
        selectBooking: "-- Seleziona registrazione --",
        selectMembers: "Seleziona socio/i",
        clickToSelect: "Clicca per selezionare (max. 2 per pagamento congiunto)",
        linkDatevWithInvoice: "Collega movimento DATEV con fattura",
        alreadyLinked: "Già collegato",
        selectPdfFromList: "Seleziona un PDF dalla lista",
        bookingsForAccount: "Registrazioni per conto",
        sortByDate: "Data (più recenti prima)",
        sortByAmount: "Importo (più alti prima)",
        sortBySupplier: "Fornitore (A-Z)",
        newExpense: "Nuova uscita",
        editExpense: "Modifica uscita",
        recipientType: "Tipo destinatario",
        selectEmployee: "-- Seleziona dipendente --",
        newPersonEntry: "+ Registra nuova persona",
        alreadyReceivedWarning: "Questo destinatario ha già ricevuto questo articolo il",
        newArticle: "Nuovo articolo",
        editArticle: "Modifica articolo",
        articleCode: "Codice articolo",
        purchasePrice: "Prezzo acquisto (EUR)",
        sellingPrice: "Prezzo vendita (EUR)",
        initialStockHint: "Solo per nuovo articolo. Successivamente tramite acquisti/vendite.",
        selectArticle: "-- Seleziona articolo --",
        quantityRequired: "Quantità *",
        admissionSale: "Vendi ingresso",
        morning: "Mattina (fino alle 12:00)",
        afternoon: "Pomeriggio (dalle 12:00)",
        pricePerPerson: "Prezzo per persona (EUR) *",
        selectCategory: "-- Seleziona categoria --",
        purchaseAmount: "Importo (EUR) *",
        withdrawal: "Prelievo",
        deposit: "Deposito",
        noteOptional: "Nota",
        setOpeningBalance: "Imposta saldo iniziale",
        countedStock: "Giacenza contata:",
        newAdmissionCategory: "Nuova categoria ingresso",
        categoryName: "Nome categoria",
        priceEur: "Prezzo (EUR)",
        vatRate: "Aliquota IVA",
        booksReduced: "4% (Libri)",
        reduced10: "10% (ridotto)",
        standard22: "22% (standard)",
        validFrom: "Valido da",
        validUntil: "Valido fino a",
        newMemberCategory: "Nuova categoria soci",
        shopImport: "Importa Shop",
        importFromExcel: "Importa articoli dal file Excel inventario shop.",
        orUploadOther: "Oppure: Carica altro file Excel",
        supplierCustomer: "Fornitore/Cliente",
        linkPurchaseWithInvoice: "Collega acquisto con fattura",
        newCourse: "Nuovo corso",
        editCourse: "Modifica corso",
        courseName: "Nome corso",
        provider: "Fornitore",
        mandatory: "Obbligatorio",
        duration: "Durata (ore)",
        flatCost: "Costo forfettario",
        newDate: "Nuova data",
        editDate: "Modifica data",
        overridesCost: "Sovrascrive costo corso",
        newCourseCategory: "Nuova categoria corso",
        markAttendance: "Registra presenza",
        absent: "Assente",
        vacation: "Ferie",
        sick: "Malattia",
        newOrder: "Registra nuovo ordine",
        ordered: "Quantità ordinata",
        month: "Mese",
        expiringCertificates: "Certificati in scadenza",
        course: "Corso",
        required: "Obbligatorio",
        // Workspace permissions
        accessAreas: "Accesso alle aree",
        area: "Area",
        none: "Nessuno",
        read: "Lettura",
        edit: "Modif.",
        delete: "Elim.",
        showOnlyAssignedInvoices: "Fatture: Mostra solo assegnate",
        usersInWorkspace: "Utenti nel Workspace",
        addUser: "Aggiungi utente",
        userMustBeRegistered: "L'utente deve aver effettuato almeno un accesso.",
        assignedUsers: "Utenti assegnati",
        // PDF & Document
        pdfNotAccessible: "Il file non esiste o non è accessibile.",
        removeInvalidLink: "Rimuovi collegamento non valido",
        openInNewTab: "Apri in nuova scheda",
        document: "Documento",
        // Invoice details
        deductibleVat: "IVA detraibile (85%):",
        nonDeductibleVat: "Non detraibile (Pro-Rata):",
        statusHistory: "Cronologia stato",
        splitInvoiceHint: "Quando sono coinvolti più progetti o finanziatori",
        // Meeting/Sitzung
        time: "Orario",
        participants: "Partecipanti",
        agenda: "Agenda / Argomenti",
        tasksFromMeeting: "Attività da questa riunione",
        // Artist
        website: "Sito web",
        linkedProjects: "Progetti/Eventi collegati",
        // Inventory
        multipleFilesHint: "Più file possibili: PDF, Immagini, Word, Excel",
        organization: "Organizzazione",
        // Revenue/Income
        newIncome: "Nuova entrata",
        nameOrDescription: "Nome / Descrizione",
        source: "Fonte / Ente",
        submissionPointHint: "Se abilitato, questa entrata può essere selezionata per le fatture",
        confirmationDocument: "Documento di conferma (Email, Lettera, Contratto)",
        documentFileTypes: "PDF, Immagine, Word o file Email",
        // Budget
        projectOptional: "Progetto (opzionale)",
        noProject: "-- Nessun progetto --",
        distributesTo12Months: "L'importo viene distribuito uniformemente su 12 mesi",
        // Members import
        importMembersFromExcel: "Importa soci da Excel",
        importMembersHint: "Carica un file Excel con i dati dei soci.",
        previewFirst5Rows: "Anteprima (prime 5 righe):",
        assignPayment: "Assegna pagamento",
        selectDatevBooking: "Seleziona registrazione DATEV (Conto 6401550)",
        paymentDate: "Data pagamento",
        savePayment: "Salva pagamento",
        assignDatevToMembers: "Assegna registrazioni DATEV ai soci",
        assignDatevHint: "Seleziona una registrazione e assegnala a uno o più soci.",
        searchBooking: "Cerca registrazione",
        bookingsAccount: "Registrazioni (Conto 6401550)",
        showAlreadyPaid: "Mostra già pagati",
        clickToSelectHint: "Clicca per selezionare (max. 2 per pagamento congiunto)",
        makeAssignment: "Effettua assegnazione:",
        booking: "Registrazione:",
        members: "Socio/i:",
        assignNow: "Assegna ora",
        // DATEV Link
        linkDatevToInvoice: "Collega movimento DATEV a fattura",
        linkNow: "Collega ora",
        datevMovements: "Movimenti DATEV",
        withoutPdf: "Senza PDF",
        withPdf: "Con PDF",
        uploadedPdfs: "PDF caricati",
        notLinked: "Non collegato",
        withoutNote: "Senza nota",
        withNote: "Con nota",
        // Convert
        convertConfirmText: "Vuoi convertire questi costi provvisori in costi effettivi?",
        convert: "Converti",
        // Supplier
        partitaIvaHint: "Obbligatorio - Formato: IT + 11 cifre",
        contactPerson: "Referente (interno)",
        noContactPerson: "-- Nessun referente --",
        courseProvider: "Fornitore corsi",
        courseProviderHint: "Può essere selezionato come fornitore per corsi/formazione",
        // Employee
        employeeType: "Tipo dipendente",
        // Account DB levels
        dbUmsatz: "Ricavi (Entrate)",
        dbDb1: "DB1 - Costi diretti",
        dbDb2: "DB2 - Costi strutturali",
        dbDb3: "DB3 - Costi fissi",
        projectRelated: "Correlato a progetto",
        projectRelatedHint: "Se abilitato, le registrazioni su questo conto saranno assegnate a un progetto",
        // Workspace area names
        markAsPaid: "- Segna come pagato",
        movements: "Movimenti",
        timeTracking: "Rilevamento ore"
    },

    // Reporting tabs
    reportingTabs: {
        projectOverview: "Panoramica progetti",
        contributionMargins: "Margini di contribuzione",
        totalDb: "DB totale",
        categories: "Categorie",
        chartOfAccounts: "Piano dei conti",
        balanceSheet: "Bilancio/C.E.",
        visitors: "Visitatori"
    },

    // Budget tabs
    budgetTabs: {
        byAccounts: "Per conti bilancio",
        byProjects: "Per progetti",
        notes: "Note"
    },

    // Config tabs
    configTabs: {
        costTypes: "Tipi di costo",
        chartOfAccounts: "Piano dei conti",
        vatRates: "Aliquote IVA",
        workspaces: "Workspace",
        employees: "Dipendenti",
        courses: "Corsi",
        shop: "Shop",
        dataExport: "Esportazione dati"
    },

    // Inventory page
    inventoryPage: {
        artAssets: "Inventario – Beni artistici",
        newItem: "+ Nuovo oggetto",
        allCategories: "Tutte le categorie",
        allLocations: "Tutte le sedi",
        csvExport: "Esporta CSV",
        modified: "Modificato"
    },

    // Import page
    importPage: {
        description: "Importa registrazioni DATEV, fornitori e PDF fatture",
        excelFile: "File Excel",
        importSuppliers: "Importa fornitori",
        linkedPdfs: "PDF collegati",
        yearsImported: "Anni importati",
        or: "oppure",
        dropPdfs: "Trascina PDF qui o clicca per selezionare",
        multipleFiles: "Possibile selezionare più file contemporaneamente"
    },

    // Config page
    configPage: {
        manageSuppliers: "Gestisci fornitori",
        newAccount: "+ Nuovo conto",
        newCostType: "+ Nuovo tipo di costo",
        newWorkspace: "+ Nuovo workspace",
        newEmployee: "+ Nuovo dipendente",
        allDbLevels: "Tutti i livelli DB",
        allRevenues: "Tutte le entrate",
        searchAccounts: "Cerca per conto o nome...",
        noEmployees: "Nessun dipendente definito",
        vatRatesEu: "Aliquote IVA (UE)",
        vatRatesShop: "Aliquote IVA (Shop)",
        availableVatRates: "Aliquote IVA disponibili per articoli shop:",
        booksHint: "– Libri, riviste",
        standardHint: "– Aliquota standard per merci",
        exportAllData: "Esporta tutti i dati",
        projectExport: "Esportazione progetto",
        selectProjectExport: "Seleziona un progetto per l'esportazione:",
        selectProject: "-- Seleziona progetto --",
        exportProject: "Esporta progetto"
    },

    // Members page
    membersPage: {
        allLocations: "Tutte le località"
    },

    // Shop page
    shopPage: {
        vatBreakdown: "Ripartizione IVA",
        close: "Chiudi cassa",
        allMovements: "Tutti i movimenti",
        shopInvoices: "Fatture Shop (centro di costo 2699)",
        noInvoices: "Nessuna fattura trovata per Shop",
        internalExpenses: "Uscite interne (Pubblicazioni)",
        until: "fino a",
        allRecipients: "Tutti i destinatari",
        recipient: "Destinatario",
        newExpense: "+ Nuova uscita",
        noSales: "Nessuna vendita presente.",
        noPurchases: "Nessun acquisto presente."
    },

    // Revenue page
    revenuePage: {
        expenses: "Uscite",
        income: "Entrate",
        sum: "Somma",
        totalBudget: "Budget totale",
        revenueShop: "Ricavi (Shop, Mostre)",
        miscellaneous: "Varie",
        confirmedDoc: "Confermato (documento presente)",
        plannedRevenues: "Entrate pianificate"
    },

    // Budget page
    budgetPage: {
        addBudget: "+ Aggiungi budget",
        budgetByProjects: "Budget per progetti",
        noProjectsWithBudget: "Nessun progetto con budget trovato",
        notesAutoSave: "Le note vengono salvate automaticamente per anno.",
        notesPlaceholder: "Inserire note sulla pianificazione budget...",
        revenues: "1. RICAVI"
    },

    // Inventory categories
    inventoryCategories: {
        technik: "Tecnologia (Proiettori, Audio, ecc.)",
        moebel: "Mobili & Allestimento",
        kunst: "Opere d'arte",
        transport: "Mezzi di trasporto",
        sonstiges: "Altro"
    },

    // Contacts page
    contacts: {
        title: "Gestione Contatti",
        newContact: "+ Nuovo Contatto",
        contacts: "Contatti",
        organization: "Organizzazione",
        cityCountry: "Città/Paese",
        searchPlaceholder: "Nome, Email, Organizzazione..."
    },

    // Contact categories
    contactCategories: {
        artist: "Artisti",
        curator: "Curatori",
        press: "Stampa & Media",
        sponsor: "Sponsor",
        supplier: "Fornitori",
        institution: "Istituzioni",
        other: "Altro"
    },

    // Revenue types
    revenueTypes: {
        all: "Tutti i tipi",
        grantProvince: "Contributo Provincia",
        grantMunicipality: "Contributo Comune",
        grantRegion: "Contributo Regione",
        grantFoundation: "Contributo Fondazione",
        sponsoring: "Sponsorizzazione",
        donation: "Donazione",
        membershipFee: "Quota associativa",
        revenues: "Ricavi (Shop, Mostre)",
        other: "Altro"
    },

    // Revenue status
    revenueStatus: {
        confirmed: "Confermato (documento presente)",
        expected: "Previsto",
        uncertain: "Incerto",
        cancelled: "Annullato"
    },

    // Project details page
    projectDetails: {
        excelExport: "Esporta Excel",
        projectInfo: "Informazioni Progetto",
        costs: "Costi",
        addCost: "+ Aggiungi Costo",
        searchDescSupplier: "Cerca (Descrizione/Fornitore)",
        enterSearchTerm: "Inserisci termine di ricerca...",
        allTypes: "Tutti",
        actualCosts: "Costi Effettivi",
        provisional: "Provvisorio",
        nSelected: "0 selezionati",
        assignCostType: "Assegna tipo di costo...",
        assign: "Assegna",
        nr: "Nr.",
        source: "Fonte",
        costType: "Tipo di Costo",
        invoiceControl: "Controllo Fatture",
        filterStatus: "Filtra Stato",
        newToCheck: "Nuovo (da controllare)",
        datevPdfHint: "Qui vengono visualizzate solo le registrazioni DATEV con PDF collegati. Modifiche di stato e note sono sincronizzate con la pagina fatture.",
        timeTracking: "Registrazione Tempo / Ore di Lavoro",
        hours: "Ore",
        costColumn: "Costo",
        hourCostHint: "Nota: I costi orari non sono inclusi nel totale del progetto.",
        budgetOverview: "Panoramica Budget",
        actual: "Effettivo",
        planned: "Pianificato",
        planComparison: "Confronto Piano",
        originalPlan: "Piano Originale:",
        deviation: "Scostamento:",
        laborCosts: "Costi del Personale (calcolati)",
        basedOnRates: "Basato sulle tariffe orarie:",
        byCostType: "Per Tipo di Costo"
    },

    // Revenue additional keys
    revenue: {
        title: "Pianificazione Entrate",
        newRevenue: "+ Nuova Entrata",
        source: "Fonte",
        amount: "Importo",
        expectedDate: "Data prevista",
        receivedDate: "Data ricezione",
        code: "Codice",
        nameSource: "Nome / Fonte",
        previousYear: "Anno precedente",
        changePercent: "+/- %",
        document: "Documento",
        status: {
            promised: "Promesso",
            received: "Ricevuto",
            applied: "Richiesto",
            open: "Aperto",
            rejected: "Rifiutato"
        },
        noRevenues: "Nessuna entrata trovata"
    }
};

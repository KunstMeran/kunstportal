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
        projectNotFound: "Progetto non trovato"
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
        homeofficeToday: "Homeoffice oggi",
        attendanceAndLunch: "Presenze & Buoni pasto",
        orders: "Ordini",
        myAttendance: "Le mie presenze",
        markAttendance: "Segna presenza",
        office: "Ufficio",
        homeoffice: "Homeoffice",
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
        noItems: "Nessun articolo inventario trovato"
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
        timeline: "Cronologia"
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
        lastYear: "Anno scorso"
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
    }
};

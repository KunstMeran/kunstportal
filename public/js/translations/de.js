/**
 * German translations for Kunsthaus Meran Portal
 */
const translations_de = {
    // App title
    app: {
        title: "Projektsoftware Kunst Meran",
        loading: "Wird geladen...",
        readOnlyBanner: "Nur Lesezugriff - Bearbeiten nicht möglich"
    },

    // Navigation
    nav: {
        dashboard: "Dashboard",
        projects: "Projekte",
        invoices: "Rechnungen",
        suppliers: "Lieferanten",
        personnel: "Personal & Stunden",
        inventory: "Inventar",
        shop: "Shop",
        reporting: "Reporting",
        revenue: "Einnahmenplanung",
        budget: "Budgetplanung",
        members: "Mitglieder",
        import: "Import",
        config: "Konfiguration",
        logout: "Abmelden"
    },

    // Common actions
    actions: {
        save: "Speichern",
        cancel: "Abbrechen",
        delete: "Löschen",
        edit: "Bearbeiten",
        details: "Details",
        search: "Suchen",
        filter: "Filtern",
        export: "Exportieren",
        import: "Importieren",
        refresh: "Aktualisieren",
        clear: "Leeren",
        close: "Schließen",
        add: "Hinzufügen",
        remove: "Entfernen",
        copy: "Kopieren",
        archive: "Archivieren",
        restore: "Wiederherstellen",
        reset: "Zurücksetzen",
        confirm: "Bestätigen",
        back: "Zurück",
        next: "Weiter",
        previous: "Vorherige",
        selectAll: "Alle auswählen",
        deselectAll: "Auswahl aufheben",
        newEntry: "+ Neuer Eintrag"
    },

    // Status labels
    status: {
        new: "Neu",
        checked: "Kontrolliert",
        paid: "Bezahlt",
        planning: "Planung",
        running: "Laufend",
        completed: "Abgeschlossen",
        active: "Aktiv",
        inactive: "Inaktiv",
        archived: "Archiviert",
        open: "Offen",
        closed: "Geschlossen",
        pending: "Ausstehend",
        approved: "Genehmigt",
        rejected: "Abgelehnt",
        assigned: "Zugewiesen",
        notAssigned: "Nicht zugewiesen"
    },

    // Form labels
    forms: {
        year: "Jahr",
        date: "Datum",
        amount: "Betrag",
        description: "Beschreibung",
        notes: "Notizen",
        name: "Name",
        email: "E-Mail",
        phone: "Telefon",
        address: "Adresse",
        city: "Stadt",
        country: "Land",
        type: "Typ",
        category: "Kategorie",
        project: "Projekt",
        supplier: "Lieferant",
        status: "Status",
        from: "Von",
        to: "Bis",
        budget: "Budget",
        location: "Standort",
        allYears: "Alle Jahre",
        allProjects: "Alle Projekte",
        allStatus: "Alle Status",
        allCategories: "Alle Kategorien",
        allSuppliers: "Alle Lieferanten",
        showEntries: "Einträge",
        perPage: "Pro Seite",
        modifiedSince: "Geändert ab"
    },

    // Placeholders
    placeholders: {
        searchSupplier: "Lieferant suchen...",
        searchProject: "Projekt suchen...",
        searchNumber: "Nummer suchen...",
        searchGeneral: "Suchen...",
        searchMovements: "Bewegungen durchsuchen (Rechnungs-Nr., Lieferant, Betrag, Notizen...)",
        searchMembers: "Mitglied suchen (Name, Adresse, E-Mail)...",
        searchArticles: "Artikel suchen..."
    },

    // Dashboard
    dashboard: {
        title: "Dashboard",
        activeProjects: "Aktive Projekte",
        totalBudget: "Gesamtbudget",
        spent: "Ausgegeben (IST)",
        available: "Verfügbar",
        projectOverview: "Projektübersicht",
        noProjectsFound: "Keine Projekte mit Buchungen gefunden",
        legend: {
            under70: "< 70% verbraucht",
            between70and90: "70-90% verbraucht",
            over90: "> 90% verbraucht"
        }
    },

    // Projects
    projects: {
        title: "Projekte",
        newProject: "+ Neues Projekt",
        projectList: "Projektliste",
        projectName: "Projektname",
        location: "Standort",
        budget: "Budget",
        actualCosts: "IST-Kosten",
        available: "Verfügbar",
        modified: "Geändert",
        actions: "Aktionen",
        noProjects: "Keine Projekte vorhanden",
        showingProjects: "Zeige {start}-{end} von {total} Projekten",
        deleteConfirm: "Projekt wirklich löschen?",
        projectNotFound: "Projekt nicht gefunden"
    },

    // Invoices
    invoices: {
        title: "EK-Rechnungen",
        invoiceNumber: "Rechnungsnr.",
        date: "Datum",
        supplier: "Lieferant",
        project: "Projekt",
        costType: "Kostentyp",
        net: "Netto",
        vat: "MwSt",
        gross: "Brutto",
        status: "Status",
        pdf: "PDF",
        checkedDate: "Kontrolliert",
        paidDate: "Bezahlt",
        modified: "Geändert",
        submissionPoint: "Abgabestelle",
        note: "Notiz",
        actions: "Aktionen",
        total: "Gesamt",
        open: "Offen",
        paidAmount: "Bezahlt €",
        csvExport: "CSV Export",
        linkPdf: "PDF verknüpfen",
        syncSuppliers: "Lieferanten sync",
        noInvoices: "Keine Rechnungen gefunden",
        noInvoicesWithPdf: "Keine Rechnungen mit PDF für dieses Projekt",
        selected: "{count} ausgewählt",
        markAsNew: "Als neu",
        markAsChecked: "Als kontrolliert",
        markAsPaid: "Als bezahlt",
        myInvoices: "Meine Rechnungen",
        pdfStatus: "PDF-Status",
        datevStatus: "DATEV-Bewegung"
    },

    // Cost types
    costTypes: {
        title: "Kostentyp/Konto",
        allAccounts: "Alle Konten",
        curation: "Kuration",
        artistExpense: "Künstlerausgabe",
        transport: "Transport",
        production: "Produktion",
        mediation: "Vermittlung",
        documentation: "Dokumentation",
        communication: "Kommunikation",
        selectCostType: "Kostentyp zuweisen..."
    },

    // Suppliers
    suppliers: {
        title: "Lieferanten",
        newSupplier: "+ Neuer Lieferant",
        supplierName: "Lieferant",
        partitaIva: "Partita IVA",
        address: "Adresse",
        contactPerson: "Ansprechperson",
        totalSuppliers: "Lieferanten gesamt",
        withInvoices: "Mit Rechnungen",
        totalVolume: "Gesamtvolumen",
        searchPlaceholder: "Lieferant suchen (Name, Partita IVA, Adresse)...",
        noSuppliers: "Keine Lieferanten gefunden",
        change: "+/- %"
    },

    // Personnel / Time tracking
    personnel: {
        title: "Personal",
        newTimeEntry: "+ Zeit erfassen",
        timeEntries: "Zeiteinträge",
        external: "Externe",
        calendar: "Kalender",
        courses: "Kurse",
        attendance: "Anwesenheit",
        myEntries: "Meine Zeiteinträge",
        hoursThisWeek: "Stunden diese Woche",
        hoursThisMonth: "Stunden diesen Monat",
        employee: "Mitarbeiter",
        allEmployees: "Alle Mitarbeiter",
        externalEmployee: "Externer Mitarbeiter",
        allExternals: "Alle Externen",
        hours: "Stunden",
        hourlyRate: "Stundensatz",
        costs: "Kosten",
        externalHoursTotal: "Externe Stunden gesamt",
        externalCostsTotal: "Externe Kosten gesamt",
        externalEmployees: "Externe Mitarbeiter",
        externalHoursByProject: "Externe Stunden nach Projekt",
        filterAdmin: "Filter (Admin)",
        resetFilters: "Filter zurücksetzen",
        noTimeEntries: "Keine Zeiteinträge für dieses Projekt",
        loadingHours: "Lade Stunden...",
        errorLoading: "Fehler beim Laden"
    },

    // Calendar
    calendar: {
        title: "Wartungskalender",
        month: "Monat",
        type: "Typ",
        employeesOnly: "Nur Mitarbeiter",
        suppliersOnly: "Nur Lieferanten",
        allTypes: "Alle",
        entriesInMonth: "Einträge im Monat",
        totalHours: "Stunden gesamt",
        supplierHours: "Lieferanten-Stunden",
        previousMonth: "Vorheriger Monat",
        nextMonth: "Nächster Monat",
        weekdays: {
            mo: "Mo",
            tu: "Di",
            we: "Mi",
            th: "Do",
            fr: "Fr",
            sa: "Sa",
            su: "So"
        }
    },

    // Courses
    courses: {
        title: "Kurse",
        newCourse: "+ Neuer Kurs",
        courseName: "Kursname",
        instructor: "Kursleiter",
        startDate: "Startdatum",
        endDate: "Enddatum",
        participants: "Teilnehmer",
        maxParticipants: "Max. Teilnehmer",
        price: "Preis",
        noCourses: "Keine Kurse gefunden",
        totalCourses: "Kurse gesamt",
        mandatoryCourses: "Pflichtkurse",
        expiringSoon: "Ablaufend (90 Tage)",
        plannedDates: "Geplante Termine",
        expiringWarning: "Achtung: {count} Zertifikate laufen in den nächsten 90 Tagen ab.",
        showDetails: "Details anzeigen",
        filter: "Filter",
        allCategories: "Alle Kategorien",
        allTypes: "Alle",
        mandatoryOnly: "Nur Pflicht",
        voluntaryOnly: "Nur Freiwillig",
        activeOnly: "Nur aktive",
        inactiveOnly: "Nur inaktive",
        resetFilters: "Filter zurücksetzen",
        manageCourses: "Kurse verwalten",
        providers: "Anbieter",
        course: "Kurs",
        mandatory: "Pflicht",
        due: "Fällig",
        dates: "Termine",
        myCourses: "Meine Kurse & Zertifikate",
        date: "Termin",
        certificateUntil: "Zertifikat bis"
    },

    // Attendance
    attendance: {
        title: "Anwesenheit",
        newEntry: "+ Neuer Eintrag",
        date: "Datum",
        present: "Anwesend",
        absent: "Abwesend",
        vacation: "Urlaub",
        sick: "Krank",
        todayInOffice: "Heute im Büro",
        lunchToday: "Mittagessen heute",
        lunchMonth: "Mittagessen Monat",
        homeofficeToday: "Homeoffice heute",
        attendanceAndLunch: "Anwesenheit & Essensgutscheine",
        orders: "Bestellungen",
        myAttendance: "Meine Anwesenheit",
        markAttendance: "Anwesenheit eintragen",
        office: "Büro",
        homeoffice: "Homeoffice",
        notWorking: "Nicht anwesend",
        lunchVoucher: "Essensgutschein"
    },

    // Inventory
    inventory: {
        title: "Inventar",
        newItem: "+ Neues Item",
        itemName: "Bezeichnung",
        category: "Kategorie",
        location: "Standort",
        quantity: "Anzahl",
        value: "Wert",
        lastCheck: "Letzte Prüfung",
        noItems: "Keine Inventar-Items gefunden"
    },

    // Shop
    shop: {
        title: "Shop & Kasse",
        articles: "Artikel",
        sales: "Verkäufe",
        cashRegister: "Kassenabschluss",
        newArticle: "+ Neuer Artikel",
        newSale: "+ Neuer Verkauf",
        articleName: "Artikelname",
        price: "Preis",
        stock: "Bestand",
        sold: "Verkauft",
        revenue: "Umsatz",
        noArticles: "Keine Artikel gefunden",
        noSales: "Keine Verkäufe gefunden",
        sellArticle: "+ Artikel verkaufen",
        admission: "+ Eintritt",
        membership: "+ Mitgliedsbeitrag",
        cashRevenueToday: "Einnahmen Bar (heute)",
        posRevenueToday: "Einnahmen POS (heute)",
        cashBalance: "Kassensaldo Bar",
        articlesInStock: "Artikel im Bestand",
        inventory: "Inventar",
        purchases: "Einkäufe",
        invoices: "Rechnungen",
        cash: "Kasse",
        internalExpenses: "Interne Ausgaben",
        articleStock: "Artikelbestand",
        allTypes: "Alle Typen",
        allLocations: "Alle Standorte",
        excelImport: "Excel Import",
        articleNo: "Art.-Nr.",
        designation: "Bezeichnung",
        avgPurchasePrice: "Ø EK",
        sellingPrice: "VK",
        margin: "Marge",
        vat: "MwSt",
        salesAndRevenue: "Verkäufe & Einnahmen",
        allPayments: "Alle",
        cash: "Bar",
        pos: "POS",
        time: "Zeit",
        quantity: "Menge",
        unitPrice: "Einzelpreis",
        total: "Gesamt",
        payment: "Zahlung",
        goodsPurchases: "Wareneinkäufe",
        recordPurchase: "+ Einkauf erfassen",
        article: "Artikel",
        invoiceManagement: "Kassenführung",
        withdrawal: "- Entnahme",
        deposit: "+ Einlage",
        cashOverview: "Kassensaldo",
        openingBalance: "Anfangsbestand Bar",
        setOpeningBalance: "Anfangsbestand setzen",
        cashRevenue: "+ Einnahmen Bar",
        deposits: "+ Einlagen Bar",
        withdrawals: "- Entnahmen Bar",
        expectedBalance: "= Kassensaldo (Soll)",
        posRevenue: "Einnahmen POS (Karte)",
        totalRevenue: "Gesamteinnahmen"
    },

    // Reporting
    reporting: {
        title: "Reporting",
        projectReport: "Projekt-Report",
        costAnalysis: "Kostenanalyse",
        budgetComparison: "Budget-Vergleich",
        timeline: "Zeitverlauf"
    },

    // Revenue planning
    revenue: {
        title: "Einnahmenplanung",
        newRevenue: "+ Neue Einnahme",
        source: "Quelle",
        amount: "Betrag",
        expectedDate: "Erwartetes Datum",
        receivedDate: "Eingangsdatum",
        status: {
            promised: "Zugesagt",
            received: "Eingegangen",
            applied: "Beantragt",
            open: "Offen",
            rejected: "Abgelehnt"
        },
        noRevenues: "Keine Einnahmen gefunden"
    },

    // Budget planning
    budget: {
        title: "Budgetplanung",
        newBudget: "+ Neues Budget",
        budgetName: "Budgetbezeichnung",
        planned: "Geplant",
        actual: "IST",
        difference: "Differenz",
        noBudgets: "Keine Budgeteinträge gefunden"
    },

    // Members
    members: {
        title: "Mitglieder",
        newMember: "+ Neues Mitglied",
        memberName: "Name",
        memberNumber: "Mitglieds-Nr.",
        memberSince: "Mitglied seit",
        membershipType: "Mitgliedsart",
        contribution: "Beitrag",
        lastPayment: "Letzte Zahlung",
        searchPlaceholder: "Mitglied suchen (Name, Adresse, E-Mail)...",
        noMembers: "Keine Mitglieder gefunden",
        totalMembers: "Mitglieder gesamt",
        activeMembers: "Aktive Mitglieder",
        contributionTotal: "Beiträge gesamt"
    },

    // Import
    import: {
        title: "Import",
        datevImport: "DATEV Import",
        excelImport: "Excel Import",
        pdfUpload: "PDF Upload",
        selectFile: "Datei auswählen",
        uploadFile: "Datei hochladen",
        importSuccess: "Import erfolgreich",
        importError: "Fehler beim Import"
    },

    // Configuration
    config: {
        title: "Konfiguration",
        users: "Benutzer",
        permissions: "Berechtigungen",
        categories: "Kategorien",
        settings: "Einstellungen",
        newUser: "+ Neuer Benutzer",
        userName: "Benutzername",
        role: "Rolle",
        admin: "Administrator",
        user: "Benutzer",
        viewer: "Betrachter"
    },

    // Session types
    sessionTypes: {
        internal: "Intern",
        external: "Extern",
        board: "Vorstand"
    },

    // Meetings/Sessions
    meetings: {
        title: "Sitzungen & Besprechungen",
        newMeeting: "+ Neue Sitzung",
        all: "Alle",
        internalMeetings: "Interne Besprechungen",
        externalMeetings: "Externe Meetings",
        boardMeetings: "Vorstandssitzungen",
        upcomingDeadlines: "Anstehende Deadlines",
        noDeadlines: "Keine anstehenden Deadlines",
        meetingsList: "Sitzungen",
        meetingTitle: "Titel",
        openTasks: "Offene Tasks"
    },

    // Artists
    artists: {
        title: "Künstlerverwaltung",
        newArtist: "+ Neuer Künstler",
        artistsList: "Künstler",
        technique: "Technik/Medium",
        linkedEvents: "Verknüpfte Events",
        contact: "Kontakt",
        searchName: "Name suchen..."
    },

    // Messages - Success
    success: {
        saved: "Erfolgreich gespeichert",
        deleted: "Erfolgreich gelöscht",
        updated: "Erfolgreich aktualisiert",
        created: "Erfolgreich erstellt",
        imported: "Import erfolgreich",
        exported: "Export erfolgreich",
        copied: "In Zwischenablage kopiert",
        archived: "Erfolgreich archiviert",
        restored: "Erfolgreich wiederhergestellt",
        statusChanged: "Status geändert",
        noteSaved: "Notiz wurde gespeichert",
        paidDateUpdated: "Bezahlt-Datum aktualisiert",
        projectUpdated: "Projekt wurde aktualisiert",
        invoiceMoved: "Rechnung nach \"{project}\" verschoben",
        costTypeAssigned: "Kostentyp \"{type}\" wurde {count} Einträgen zugewiesen"
    },

    // Messages - Errors
    errors: {
        general: "Ein Fehler ist aufgetreten",
        saveFailed: "Fehler beim Speichern",
        deleteFailed: "Fehler beim Löschen",
        loadFailed: "Fehler beim Laden",
        notFound: "Nicht gefunden",
        noPermission: "Keine Berechtigung",
        invalidInput: "Ungültige Eingabe",
        requiredField: "Pflichtfeld",
        networkError: "Netzwerkfehler",
        serverError: "Serverfehler",
        sessionExpired: "Sitzung abgelaufen",
        projectNotSaved: "Projekt konnte nicht gespeichert werden",
        adminOnlyPaid: "Nur Admins können Rechnungen als bezahlt markieren",
        pleaseSelect: "Bitte wählen Sie",
        nothingSelected: "Keine Einträge ausgewählt",
        enterName: "Bitte geben Sie einen Namen ein",
        selectProject: "Bitte wählen Sie ein Projekt aus",
        selectCostType: "Bitte wählen Sie einen Kostentyp aus",
        yearLoadFailed: "Fehler beim Laden des Jahres"
    },

    // Confirmations
    confirm: {
        delete: "Wirklich löschen?",
        archive: "Wirklich archivieren?",
        unsavedChanges: "Es gibt ungespeicherte Änderungen. Wirklich verlassen?",
        deleteProject: "Projekt wirklich löschen? Alle zugehörigen Daten werden ebenfalls gelöscht.",
        deleteInvoice: "Rechnung wirklich löschen?",
        archivePdfsWithoutDatev: "PDFs ohne DATEV-Verknüpfung archivieren?"
    },

    // Pagination
    pagination: {
        page: "Seite",
        of: "von",
        showing: "Zeige",
        entries: "Einträge",
        first: "Erste",
        last: "Letzte",
        previous: "Vorherige",
        next: "Nächste"
    },

    // Table headers
    table: {
        actions: "Aktionen",
        noData: "Keine Daten vorhanden",
        loading: "Wird geladen..."
    },

    // Dates and times
    datetime: {
        today: "Heute",
        yesterday: "Gestern",
        tomorrow: "Morgen",
        thisWeek: "Diese Woche",
        lastWeek: "Letzte Woche",
        thisMonth: "Diesen Monat",
        lastMonth: "Letzten Monat",
        thisYear: "Dieses Jahr",
        lastYear: "Letztes Jahr"
    },

    // Submission points
    submissionPoints: {
        title: "Abgabestelle",
        all: "Alle",
        municipality: "Gemeinde",
        region: "Region",
        province: "Provinz"
    },

    // Language switcher
    language: {
        de: "Deutsch",
        en: "English",
        it: "Italiano",
        select: "Sprache wählen"
    }
};

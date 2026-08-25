/**
 * English translations for Kunsthaus Meran Portal
 */
const translations_en = {
    // App title
    app: {
        title: "Project Software Kunst Meran",
        loading: "Loading...",
        readOnlyBanner: "Read-only access - Editing not allowed"
    },

    // Navigation
    nav: {
        dashboard: "Dashboard",
        projects: "Projects",
        invoices: "Invoices",
        suppliers: "Suppliers",
        personnel: "Personnel & Hours",
        inventory: "Inventory",
        shop: "Shop",
        reporting: "Reporting",
        revenue: "Revenue Planning",
        budget: "Budget Planning",
        members: "Members",
        import: "Import",
        config: "Configuration",
        logout: "Logout"
    },

    // Common actions
    actions: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        details: "Details",
        search: "Search",
        filter: "Filter",
        export: "Export",
        import: "Import",
        refresh: "Refresh",
        clear: "Clear",
        close: "Close",
        add: "Add",
        remove: "Remove",
        copy: "Copy",
        archive: "Archive",
        restore: "Restore",
        reset: "Reset",
        confirm: "Confirm",
        back: "Back",
        next: "Next",
        previous: "Previous",
        selectAll: "Select all",
        deselectAll: "Deselect all",
        newEntry: "+ New Entry"
    },

    // Status labels
    status: {
        new: "New",
        checked: "Checked",
        paid: "Paid",
        planning: "Planning",
        running: "Running",
        completed: "Completed",
        active: "Active",
        inactive: "Inactive",
        archived: "Archived",
        open: "Open",
        closed: "Closed",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        assigned: "Assigned",
        notAssigned: "Not assigned"
    },

    // Form labels
    forms: {
        year: "Year",
        date: "Date",
        amount: "Amount",
        description: "Description",
        notes: "Notes",
        name: "Name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        city: "City",
        country: "Country",
        type: "Type",
        category: "Category",
        project: "Project",
        supplier: "Supplier",
        status: "Status",
        from: "From",
        to: "To",
        budget: "Budget",
        location: "Location",
        allYears: "All years",
        allProjects: "All projects",
        allStatus: "All status",
        allCategories: "All categories",
        allSuppliers: "All suppliers",
        showEntries: "Entries",
        perPage: "Per page",
        modifiedSince: "Modified since"
    },

    // Placeholders
    placeholders: {
        searchSupplier: "Search supplier...",
        searchProject: "Search project...",
        searchNumber: "Search number...",
        searchGeneral: "Search...",
        searchMovements: "Search transactions (Invoice no., Supplier, Amount, Notes...)",
        searchMembers: "Search member (Name, Address, Email)...",
        searchArticles: "Search articles..."
    },

    // Dashboard
    dashboard: {
        title: "Dashboard",
        activeProjects: "Active Projects",
        totalBudget: "Total Budget",
        spent: "Spent (Actual)",
        available: "Available",
        projectOverview: "Project Overview",
        noProjectsFound: "No projects with bookings found",
        legend: {
            under70: "< 70% consumed",
            between70and90: "70-90% consumed",
            over90: "> 90% consumed"
        }
    },

    // Projects
    projects: {
        title: "Projects",
        newProject: "+ New Project",
        projectList: "Project List",
        projectName: "Project Name",
        location: "Location",
        budget: "Budget",
        actualCosts: "Actual Costs",
        available: "Available",
        modified: "Modified",
        actions: "Actions",
        noProjects: "No projects available",
        showingProjects: "Showing {start}-{end} of {total} projects",
        deleteConfirm: "Really delete project?",
        projectNotFound: "Project not found"
    },

    // Invoices
    invoices: {
        title: "Purchase Invoices",
        invoiceNumber: "Invoice No.",
        date: "Date",
        supplier: "Supplier",
        project: "Project",
        costType: "Cost Type",
        net: "Net",
        vat: "VAT",
        gross: "Gross",
        status: "Status",
        pdf: "PDF",
        checkedDate: "Checked",
        paidDate: "Paid",
        modified: "Modified",
        submissionPoint: "Submission Point",
        note: "Note",
        actions: "Actions",
        total: "Total",
        open: "Open",
        paidAmount: "Paid €",
        csvExport: "CSV Export",
        linkPdf: "Link PDF",
        syncSuppliers: "Sync Suppliers",
        noInvoices: "No invoices found",
        noInvoicesWithPdf: "No invoices with PDF for this project",
        selected: "{count} selected",
        markAsNew: "Mark as new",
        markAsChecked: "Mark as checked",
        markAsPaid: "Mark as paid",
        myInvoices: "My invoices",
        pdfStatus: "PDF Status",
        datevStatus: "DATEV Status"
    },

    // Cost types
    costTypes: {
        title: "Cost Type/Account",
        allAccounts: "All accounts",
        curation: "Curation",
        artistExpense: "Artist Expense",
        transport: "Transport",
        production: "Production",
        mediation: "Mediation",
        documentation: "Documentation",
        communication: "Communication",
        selectCostType: "Assign cost type..."
    },

    // Suppliers
    suppliers: {
        title: "Suppliers",
        newSupplier: "+ New Supplier",
        supplierName: "Supplier",
        partitaIva: "VAT ID",
        address: "Address",
        contactPerson: "Contact Person",
        totalSuppliers: "Total Suppliers",
        withInvoices: "With Invoices",
        totalVolume: "Total Volume",
        searchPlaceholder: "Search supplier (Name, VAT ID, Address)...",
        noSuppliers: "No suppliers found",
        change: "+/- %"
    },

    // Personnel / Time tracking
    personnel: {
        title: "Personnel",
        newTimeEntry: "+ Log Time",
        timeEntries: "Time Entries",
        external: "External",
        calendar: "Calendar",
        courses: "Courses",
        attendance: "Attendance",
        myEntries: "My Time Entries",
        hoursThisWeek: "Hours this week",
        hoursThisMonth: "Hours this month",
        employee: "Employee",
        allEmployees: "All employees",
        externalEmployee: "External Employee",
        allExternals: "All externals",
        hours: "Hours",
        hourlyRate: "Hourly Rate",
        costs: "Costs",
        externalHoursTotal: "External hours total",
        externalCostsTotal: "External costs total",
        externalEmployees: "External employees",
        externalHoursByProject: "External hours by project",
        filterAdmin: "Filter (Admin)",
        resetFilters: "Reset filters",
        noTimeEntries: "No time entries for this project",
        loadingHours: "Loading hours...",
        errorLoading: "Error loading"
    },

    // Calendar
    calendar: {
        title: "Maintenance Calendar",
        month: "Month",
        type: "Type",
        employeesOnly: "Employees only",
        suppliersOnly: "Suppliers only",
        allTypes: "All",
        entriesInMonth: "Entries in month",
        totalHours: "Total hours",
        supplierHours: "Supplier hours",
        previousMonth: "Previous month",
        nextMonth: "Next month",
        weekdays: {
            mo: "Mo",
            tu: "Tu",
            we: "We",
            th: "Th",
            fr: "Fr",
            sa: "Sa",
            su: "Su"
        }
    },

    // Courses
    courses: {
        title: "Courses",
        newCourse: "+ New Course",
        courseName: "Course Name",
        instructor: "Instructor",
        startDate: "Start Date",
        endDate: "End Date",
        participants: "Participants",
        maxParticipants: "Max. Participants",
        price: "Price",
        noCourses: "No courses found",
        totalCourses: "Total courses",
        mandatoryCourses: "Mandatory courses",
        expiringSoon: "Expiring (90 days)",
        plannedDates: "Planned dates",
        expiringWarning: "Attention: {count} certificates expire in the next 90 days.",
        showDetails: "Show details",
        filter: "Filter",
        allCategories: "All categories",
        allTypes: "All",
        mandatoryOnly: "Mandatory only",
        voluntaryOnly: "Voluntary only",
        activeOnly: "Active only",
        inactiveOnly: "Inactive only",
        resetFilters: "Reset filters",
        manageCourses: "Manage courses",
        providers: "Providers",
        course: "Course",
        mandatory: "Mandatory",
        due: "Due",
        dates: "Dates",
        myCourses: "My Courses & Certificates",
        date: "Date",
        certificateUntil: "Certificate until"
    },

    // Attendance
    attendance: {
        title: "Attendance",
        newEntry: "+ New Entry",
        date: "Date",
        present: "Present",
        absent: "Absent",
        vacation: "Vacation",
        sick: "Sick",
        todayInOffice: "In office today",
        lunchToday: "Lunch today",
        lunchMonth: "Lunch this month",
        homeofficeToday: "Homeoffice today",
        attendanceAndLunch: "Attendance & Lunch Vouchers",
        orders: "Orders",
        myAttendance: "My Attendance",
        markAttendance: "Mark attendance",
        office: "Office",
        homeoffice: "Homeoffice",
        notWorking: "Not present",
        lunchVoucher: "Lunch voucher"
    },

    // Inventory
    inventory: {
        title: "Inventory",
        newItem: "+ New Item",
        itemName: "Item Name",
        category: "Category",
        location: "Location",
        quantity: "Quantity",
        value: "Value",
        lastCheck: "Last Check",
        noItems: "No inventory items found"
    },

    // Shop
    shop: {
        title: "Shop & Cash Register",
        articles: "Articles",
        sales: "Sales",
        cashRegister: "Cash Register",
        newArticle: "+ New Article",
        newSale: "+ New Sale",
        articleName: "Article Name",
        price: "Price",
        stock: "Stock",
        sold: "Sold",
        revenue: "Revenue",
        noArticles: "No articles found",
        noSales: "No sales found",
        sellArticle: "+ Sell Article",
        admission: "+ Admission",
        membership: "+ Membership Fee",
        cashRevenueToday: "Cash Revenue (today)",
        posRevenueToday: "POS Revenue (today)",
        cashBalance: "Cash Balance",
        articlesInStock: "Articles in Stock",
        inventory: "Inventory",
        purchases: "Purchases",
        invoices: "Invoices",
        cash: "Cash",
        internalExpenses: "Internal Expenses",
        articleStock: "Article Stock",
        allTypes: "All Types",
        allLocations: "All Locations",
        excelImport: "Excel Import",
        articleNo: "Art. No.",
        designation: "Description",
        avgPurchasePrice: "Avg PP",
        sellingPrice: "SP",
        margin: "Margin",
        vat: "VAT",
        salesAndRevenue: "Sales & Revenue",
        allPayments: "All",
        time: "Time",
        quantity: "Quantity",
        unitPrice: "Unit Price",
        total: "Total",
        payment: "Payment",
        goodsPurchases: "Goods Purchases",
        recordPurchase: "+ Record Purchase",
        article: "Article",
        invoiceManagement: "Cash Management",
        withdrawal: "- Withdrawal",
        deposit: "+ Deposit",
        cashOverview: "Cash Balance",
        openingBalance: "Opening Balance Cash",
        setOpeningBalance: "Set Opening Balance",
        cashRevenue: "+ Cash Revenue",
        deposits: "+ Deposits",
        withdrawals: "- Withdrawals",
        expectedBalance: "= Cash Balance (Expected)",
        posRevenue: "POS Revenue (Card)",
        totalRevenue: "Total Revenue"
    },

    // Reporting
    reporting: {
        title: "Reporting",
        projectReport: "Project Report",
        costAnalysis: "Cost Analysis",
        budgetComparison: "Budget Comparison",
        timeline: "Timeline"
    },

    // Revenue planning
    revenue: {
        title: "Revenue Planning",
        newRevenue: "+ New Revenue",
        source: "Source",
        amount: "Amount",
        expectedDate: "Expected Date",
        receivedDate: "Received Date",
        status: {
            promised: "Promised",
            received: "Received",
            applied: "Applied",
            open: "Open",
            rejected: "Rejected"
        },
        noRevenues: "No revenues found"
    },

    // Budget planning
    budget: {
        title: "Budget Planning",
        newBudget: "+ New Budget",
        budgetName: "Budget Name",
        planned: "Planned",
        actual: "Actual",
        difference: "Difference",
        noBudgets: "No budget entries found"
    },

    // Members
    members: {
        title: "Members",
        newMember: "+ New Member",
        memberName: "Name",
        memberNumber: "Member No.",
        memberSince: "Member since",
        membershipType: "Membership Type",
        contribution: "Contribution",
        lastPayment: "Last Payment",
        searchPlaceholder: "Search member (Name, Address, Email)...",
        noMembers: "No members found",
        totalMembers: "Total members",
        activeMembers: "Active members",
        contributionTotal: "Total contributions"
    },

    // Import
    import: {
        title: "Import",
        datevImport: "DATEV Import",
        excelImport: "Excel Import",
        pdfUpload: "PDF Upload",
        selectFile: "Select file",
        uploadFile: "Upload file",
        importSuccess: "Import successful",
        importError: "Import error"
    },

    // Configuration
    config: {
        title: "Configuration",
        users: "Users",
        permissions: "Permissions",
        categories: "Categories",
        settings: "Settings",
        newUser: "+ New User",
        userName: "Username",
        role: "Role",
        admin: "Administrator",
        user: "User",
        viewer: "Viewer"
    },

    // Session types
    sessionTypes: {
        internal: "Internal",
        external: "External",
        board: "Board"
    },

    // Meetings/Sessions
    meetings: {
        title: "Meetings & Sessions",
        newMeeting: "+ New Meeting",
        all: "All",
        internalMeetings: "Internal Meetings",
        externalMeetings: "External Meetings",
        boardMeetings: "Board Meetings",
        upcomingDeadlines: "Upcoming Deadlines",
        noDeadlines: "No upcoming deadlines",
        meetingsList: "Meetings",
        meetingTitle: "Title",
        openTasks: "Open Tasks"
    },

    // Artists
    artists: {
        title: "Artist Management",
        newArtist: "+ New Artist",
        artistsList: "Artists",
        technique: "Technique/Medium",
        linkedEvents: "Linked Events",
        contact: "Contact",
        searchName: "Search name..."
    },

    // Messages - Success
    success: {
        saved: "Successfully saved",
        deleted: "Successfully deleted",
        updated: "Successfully updated",
        created: "Successfully created",
        imported: "Import successful",
        exported: "Export successful",
        copied: "Copied to clipboard",
        archived: "Successfully archived",
        restored: "Successfully restored",
        statusChanged: "Status changed",
        noteSaved: "Note saved",
        paidDateUpdated: "Paid date updated",
        projectUpdated: "Project updated",
        invoiceMoved: "Invoice moved to \"{project}\"",
        costTypeAssigned: "Cost type \"{type}\" assigned to {count} entries"
    },

    // Messages - Errors
    errors: {
        general: "An error occurred",
        saveFailed: "Save failed",
        deleteFailed: "Delete failed",
        loadFailed: "Load failed",
        notFound: "Not found",
        noPermission: "No permission",
        invalidInput: "Invalid input",
        requiredField: "Required field",
        networkError: "Network error",
        serverError: "Server error",
        sessionExpired: "Session expired",
        projectNotSaved: "Project could not be saved",
        adminOnlyPaid: "Only admins can mark invoices as paid",
        pleaseSelect: "Please select",
        nothingSelected: "No entries selected",
        enterName: "Please enter a name",
        selectProject: "Please select a project",
        selectCostType: "Please select a cost type",
        yearLoadFailed: "Error loading year"
    },

    // Confirmations
    confirm: {
        delete: "Really delete?",
        archive: "Really archive?",
        unsavedChanges: "There are unsaved changes. Really leave?",
        deleteProject: "Really delete project? All related data will also be deleted.",
        deleteInvoice: "Really delete invoice?",
        archivePdfsWithoutDatev: "Archive PDFs without DATEV link?"
    },

    // Pagination
    pagination: {
        page: "Page",
        of: "of",
        showing: "Showing",
        entries: "entries",
        first: "First",
        last: "Last",
        previous: "Previous",
        next: "Next"
    },

    // Table headers
    table: {
        actions: "Actions",
        noData: "No data available",
        loading: "Loading..."
    },

    // Dates and times
    datetime: {
        today: "Today",
        yesterday: "Yesterday",
        tomorrow: "Tomorrow",
        thisWeek: "This week",
        lastWeek: "Last week",
        thisMonth: "This month",
        lastMonth: "Last month",
        thisYear: "This year",
        lastYear: "Last year"
    },

    // Submission points
    submissionPoints: {
        title: "Submission Point",
        all: "All",
        municipality: "Municipality",
        region: "Region",
        province: "Province"
    },

    // Language switcher
    language: {
        de: "Deutsch",
        en: "English",
        it: "Italiano",
        select: "Select language"
    }
};

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
        projectNotFound: "Project not found",
        workHours: "Work Hours",
        pl1Exhibition: "PL1 - Exhibition Management"
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
        homeofficeToday: "Working from home today",
        attendanceAndLunch: "Attendance & Lunch Vouchers",
        orders: "Orders",
        myAttendance: "My Attendance",
        markAttendance: "Mark attendance",
        office: "Office",
        homeoffice: "Work from Home",
        notWorking: "Not present",
        lunchVoucher: "Lunch voucher"
    },

    // Inventory
    inventory: {
        title: "Inventory",
        newItem: "+ New Item",
        itemName: "Item Name",
        designation: "Description",
        category: "Category",
        location: "Location",
        quantity: "Quantity",
        value: "Value",
        valueEur: "Value (EUR)",
        lastCheck: "Last Check",
        noItems: "No inventory items found",
        warehouse: "Warehouse",
        external: "External/On Loan",
        searchPlaceholder: "Search description...",
        inventoryNo: "Inv. No.",
        condition: "Condition",
        acquisition: "Acquisition"
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
        pos: "POS",
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
        timeline: "Timeline",
        period: "Period:",
        totalContributionMargin: "Total Contribution Margin Analysis",
        ytd: "YTD (until today)",
        ytdPrevMonth: "YTD (until previous month)",
        fullYear: "Full Year",
        balanceAndPl: "Balance Sheet & Profit and Loss Statement"
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
        lastYear: "Last year",
        months: {
            january: "January",
            february: "February",
            march: "March",
            april: "April",
            may: "May",
            june: "June",
            july: "July",
            august: "August",
            september: "September",
            october: "October",
            november: "November",
            december: "December"
        }
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
    },

    // Modals - Common
    modals: {
        projectDetails: "Project Details",
        useExtendedView: "Please use the extended project view.",
        newProject: "New Project",
        editProject: "Edit Project",
        projectName: "Project Name",
        datevId: "DATEV ID",
        datevIdPlaceholder: "e.g. 2601",
        startDate: "Start Date",
        endDate: "End Date",
        budgetEur: "Budget (EUR)",
        hideInReporting: "Don't show in reporting",
        hideInReportingHint: "for Shop, structural costs etc.",
        responsibilities: "Responsibilities",
        pl1Exhibition: "PL1 - Exhibition",
        pl2Communication: "PL2 - Communication",
        pl3Mediation: "PL3 - Mediation",
        dropboxLink: "Dropbox Link",
        newCost: "Record Cost",
        editCost: "Edit Cost",
        pleaseSelect: "Please select...",
        costType: "Type",
        actualCosts: "Actual Costs",
        provisional: "Provisional",
        noSupplier: "-- No Supplier --",
        vatTreatment: "VAT Treatment",
        vatBruttoIt: "Gross incl. 22% VAT (Italy)",
        vatNettoReverse: "Net + Reverse Charge (EU foreign)",
        vatNettoImport: "Net + Import VAT (third country)",
        vatNettoExempt: "Net VAT exempt",
        invoiceAmount: "Invoice Amount (EUR)",
        calculatedValues: "Calculated Values",
        invoiceNumberPlaceholder: "e.g. INV-2026-0123",
        invoicePdf: "Invoice (PDF)",
        pdfDropOrClick: "Drop PDF here or click to select",
        maxSize: "Maximum size: 10 MB",
        newTimeEntry: "Record Time",
        editTimeEntry: "Edit Time Entry",
        whatWasDone: "What was done?",
        whatWasDonePlaceholder: "e.g. Heating maintenance, Electrical installation...",
        newCostType: "New Cost Type",
        costTypeLabel: "Cost Type",
        color: "Color",
        newAccount: "New Account",
        editAccount: "Edit Account",
        accountNumber: "Account Number",
        accountName: "Account Name",
        accountNameIt: "Name (IT)",
        dbLevel: "DB Level",
        neutral: "Neutral (not in DB)",
        wildcardHint: "Use % as wildcard (680% = all accounts starting with 680)",
        newSupplier: "New Supplier",
        editSupplier: "Edit Supplier",
        supplierNumber: "Supplier No.",
        street: "Street",
        postalCode: "Postal Code",
        responsibleForInvoice: "Responsible for invoice control for invoices without project assignment",
        newEmployee: "New Employee",
        editEmployee: "Edit Employee",
        fullName: "Full Name",
        internal: "Internal",
        external: "External",
        role: "Role",
        convertToActual: "Convert to Actual Costs",
        pdfPreview: "PDF Preview",
        open: "Open",
        pdfNotFound: "PDF not found",
        invoiceDetails: "Invoice Details",
        projectAssignment: "Project Assignment",
        projectAssignmentHint: "can be changed by PL or Barbara",
        splitInvoice: "Split Invoice",
        municipality: "Municipality",
        province: "Province",
        internalNotes: "Internal Notes",
        newMeeting: "New Meeting",
        editMeeting: "Edit Meeting",
        meetingTitle: "Title",
        meetingType: "Meeting Type",
        protocol: "Protocol / Notes",
        addTask: "+ Add Task",
        newArtist: "New Artist",
        editArtist: "Edit Artist",
        artistName: "Artist Name",
        technique: "Technique / Medium",
        multiSelectHint: "Ctrl+Click for multiple selection",
        biography: "Notes / Biography",
        newItem: "New Item",
        editItem: "Edit Item",
        inventoryNumber: "Inventory No.",
        needsRepair: "Needs Repair",
        attachments: "Attachments (Images, Contracts, Documents)",
        newContact: "New Contact",
        editContact: "Edit Contact",
        streetAddress: "Street / Address",
        other: "Other",
        newRevenue: "New Revenue",
        editRevenue: "Edit Revenue",
        revenueCode: "Code",
        uniquePerYear: "Unique per year",
        funder: "Funder",
        useAsSubmissionPoint: "Use as submission point for invoices",
        exampleHint: "e.g. Website funding",
        newBudgetEntry: "New Budget Entry",
        editBudgetEntry: "Edit Budget Entry",
        yearlyBudget: "Enter yearly budget – will be distributed evenly over 12 months",
        monthlyAmounts: "Monthly Amounts (EUR)",
        monthSum: "Sum of months:",
        documentPreview: "Document Preview",
        newWorkspace: "New Workspace",
        editWorkspace: "Edit Workspace",
        workspaceName: "Workspace Name",
        accessRights: "Access Rights",
        showOnlyAssigned: "Show only assigned",
        workspaceUsers: "Users in Workspace",
        userMustLogin: "The user must have logged in at least once.",
        emailAddress: "Email Address",
        newMember: "New Member",
        editMember: "Edit Member",
        memberNumber: "Member No.",
        gender: "Gender",
        male: "Male",
        female: "Female",
        diverse: "Diverse",
        birthYear: "Birth Year",
        memberSince: "Member since",
        paymentMethod: "Payment Method",
        paymentMethodHint: "e.g. Bank transfer, Cash...",
        memberImport: "Import Members",
        excelFile: "Excel File (.xlsx, .xls)",
        selectDatevBooking: "Select DATEV Booking",
        selectBooking: "-- Select Booking --",
        selectMembers: "Select Member(s)",
        clickToSelect: "Click to select (max. 2 for joint payment)",
        linkDatevWithInvoice: "Link DATEV movement with invoice",
        alreadyLinked: "Already linked",
        selectPdfFromList: "Select a PDF from the list",
        bookingsForAccount: "Bookings for Account",
        sortByDate: "Date (newest first)",
        sortByAmount: "Amount (highest first)",
        sortBySupplier: "Supplier (A-Z)",
        newExpense: "New Expense",
        editExpense: "Edit Expense",
        recipientType: "Recipient Type",
        selectEmployee: "-- Select Employee --",
        newPersonEntry: "+ Add New Person",
        alreadyReceivedWarning: "This recipient has already received this item on",
        newArticle: "New Article",
        editArticle: "Edit Article",
        articleCode: "Article Code",
        purchasePrice: "Purchase Price (EUR)",
        sellingPrice: "Selling Price (EUR)",
        initialStockHint: "Only for new article. Afterwards via purchases/sales.",
        selectArticle: "-- Select Article --",
        quantityRequired: "Quantity *",
        admissionSale: "Sell Admission",
        morning: "Morning (until 12:00)",
        afternoon: "Afternoon (from 12:00)",
        pricePerPerson: "Price per Person (EUR) *",
        selectCategory: "-- Select Category --",
        purchaseAmount: "Amount (EUR) *",
        withdrawal: "Withdrawal",
        deposit: "Deposit",
        noteOptional: "Note",
        setOpeningBalance: "Set Opening Balance",
        countedStock: "Counted Stock:",
        newAdmissionCategory: "New Admission Category",
        categoryName: "Category Name",
        priceEur: "Price (EUR)",
        vatRate: "VAT Rate",
        booksReduced: "4% (Books)",
        reduced10: "10% (reduced)",
        standard22: "22% (standard)",
        validFrom: "Valid from",
        validUntil: "Valid until",
        newMemberCategory: "New Member Category",
        shopImport: "Shop Import",
        importFromExcel: "Import articles from shop inventory Excel file.",
        orUploadOther: "Or: Upload other Excel file",
        supplierCustomer: "Supplier/Customer",
        linkPurchaseWithInvoice: "Link Purchase with Invoice",
        newCourse: "New Course",
        editCourse: "Edit Course",
        courseName: "Course Name",
        provider: "Provider",
        mandatory: "Mandatory",
        duration: "Duration (hours)",
        flatCost: "Flat Cost",
        newDate: "New Date",
        editDate: "Edit Date",
        overridesCost: "Overrides course cost",
        newCourseCategory: "New Course Category",
        markAttendance: "Mark Attendance",
        absent: "Absent",
        vacation: "Vacation",
        sick: "Sick",
        newOrder: "Record New Order",
        ordered: "Quantity Ordered",
        month: "Month",
        expiringCertificates: "Expiring Certificates",
        course: "Course",
        required: "Required"
    },

    // Reporting tabs
    reportingTabs: {
        projectOverview: "Project Overview",
        contributionMargins: "Contribution Margins",
        totalDb: "Total DB",
        categories: "Categories",
        chartOfAccounts: "Chart of Accounts",
        balanceSheet: "Balance Sheet/P&L",
        visitors: "Visitors"
    },

    // Budget tabs
    budgetTabs: {
        byAccounts: "By Balance Accounts",
        byProjects: "By Projects",
        notes: "Notes"
    },

    // Config tabs
    configTabs: {
        costTypes: "Cost Types",
        chartOfAccounts: "Chart of Accounts",
        vatRates: "VAT Rates",
        workspaces: "Workspaces",
        employees: "Employees",
        courses: "Courses",
        shop: "Shop",
        dataExport: "Data Export"
    },

    // Inventory page
    inventoryPage: {
        artAssets: "Inventory – Art Assets",
        newItem: "+ New Item",
        allCategories: "All Categories",
        allLocations: "All Locations",
        csvExport: "CSV Export",
        modified: "Modified"
    },

    // Import page
    importPage: {
        description: "Import DATEV bookings, suppliers and invoice PDFs",
        excelFile: "Excel File",
        importSuppliers: "Import Suppliers",
        linkedPdfs: "Linked PDFs",
        yearsImported: "Years imported",
        or: "or",
        dropPdfs: "Drop PDFs here or click to select",
        multipleFiles: "Multiple files can be selected at once"
    },

    // Config page
    configPage: {
        manageSuppliers: "Manage Suppliers",
        newAccount: "+ New Account",
        newCostType: "+ New Cost Type",
        newWorkspace: "+ New Workspace",
        newEmployee: "+ New Employee",
        allDbLevels: "All DB Levels",
        allRevenues: "All Revenues",
        searchAccounts: "Search for account or name...",
        noEmployees: "No employees defined",
        vatRatesEu: "VAT Rates (EU)",
        vatRatesShop: "VAT Rates (Shop)",
        availableVatRates: "Available VAT rates for shop articles:",
        booksHint: "– Books, magazines",
        standardHint: "– Standard rate for goods",
        exportAllData: "Export All Data",
        projectExport: "Project Export",
        selectProjectExport: "Select a project for export:",
        selectProject: "-- Select Project --",
        exportProject: "Export Project"
    },

    // Members page
    membersPage: {
        allLocations: "All Locations"
    },

    // Shop page
    shopPage: {
        vatBreakdown: "VAT Breakdown",
        close: "Close Register",
        allMovements: "All Movements",
        shopInvoices: "Shop Invoices (Cost Center 2699)",
        noInvoices: "No invoices found for Shop",
        internalExpenses: "Internal Expenses (Publications)",
        until: "until",
        allRecipients: "All Recipients",
        recipient: "Recipient",
        newExpense: "+ New Expense",
        noSales: "No sales available.",
        noPurchases: "No purchases available."
    },

    // Revenue page
    revenuePage: {
        expenses: "Expenses",
        income: "Income",
        sum: "Sum",
        totalBudget: "Total Budget",
        revenueShop: "Revenue (Shop, Exhibitions)",
        miscellaneous: "Miscellaneous",
        confirmedDoc: "Confirmed (document available)",
        plannedRevenues: "Planned Revenues"
    },

    // Budget page
    budgetPage: {
        addBudget: "+ Add Budget",
        budgetByProjects: "Budget by Projects",
        noProjectsWithBudget: "No projects with budget found",
        notesAutoSave: "Notes are automatically saved per year.",
        notesPlaceholder: "Enter budget planning notes...",
        revenues: "1. REVENUES"
    },

    // Inventory categories
    inventoryCategories: {
        technik: "Technology (Projectors, Audio, etc.)",
        moebel: "Furniture & Setup",
        kunst: "Artworks",
        transport: "Vehicles",
        sonstiges: "Other"
    },

    // Contacts page
    contacts: {
        title: "Contact Management",
        newContact: "+ New Contact",
        contacts: "Contacts",
        organization: "Organization",
        cityCountry: "City/Country",
        searchPlaceholder: "Name, Email, Organization..."
    },

    // Contact categories
    contactCategories: {
        artist: "Artists",
        curator: "Curators",
        press: "Press & Media",
        sponsor: "Sponsors",
        supplier: "Suppliers",
        institution: "Institutions",
        other: "Other"
    },

    // Revenue types
    revenueTypes: {
        all: "All Types",
        grantProvince: "Province Grant",
        grantMunicipality: "Municipality Grant",
        grantRegion: "Region Grant",
        grantFoundation: "Foundation Grant",
        sponsoring: "Sponsoring",
        donation: "Donation",
        membershipFee: "Membership Fee",
        revenues: "Revenue (Shop, Exhibitions)",
        other: "Other"
    },

    // Revenue status
    revenueStatus: {
        confirmed: "Confirmed (document available)",
        expected: "Expected",
        uncertain: "Uncertain",
        cancelled: "Cancelled"
    },

    // Project details page
    projectDetails: {
        excelExport: "Excel Export",
        projectInfo: "Project Information",
        costs: "Costs",
        addCost: "+ Add Cost",
        searchDescSupplier: "Search (Description/Supplier)",
        enterSearchTerm: "Enter search term...",
        allTypes: "All",
        actualCosts: "Actual Costs",
        provisional: "Provisional",
        nSelected: "0 selected",
        assignCostType: "Assign cost type...",
        assign: "Assign",
        nr: "No.",
        source: "Source",
        costType: "Cost Type",
        invoiceControl: "Invoice Control",
        filterStatus: "Filter Status",
        newToCheck: "New (to check)",
        datevPdfHint: "Only DATEV bookings with linked PDFs are displayed here. Status changes and notes are synchronized with the invoices page.",
        timeTracking: "Time Tracking / Work Hours",
        hours: "Hours",
        costColumn: "Cost",
        hourCostHint: "Note: Hourly costs are not included in the project total.",
        budgetOverview: "Budget Overview",
        actual: "Actual",
        planned: "Planned",
        planComparison: "Plan Comparison",
        originalPlan: "Original Plan:",
        deviation: "Deviation:",
        laborCosts: "Labor Costs (calculated)",
        basedOnRates: "Based on hourly rates:",
        byCostType: "By Cost Type"
    },

    // Revenue additional keys
    revenue: {
        title: "Revenue Planning",
        newRevenue: "+ New Revenue",
        source: "Source",
        amount: "Amount",
        expectedDate: "Expected Date",
        receivedDate: "Received Date",
        code: "Code",
        nameSource: "Name / Source",
        previousYear: "Previous Year",
        changePercent: "+/- %",
        document: "Document",
        status: {
            promised: "Promised",
            received: "Received",
            applied: "Applied",
            open: "Open",
            rejected: "Rejected"
        },
        noRevenues: "No revenues found"
    }
};

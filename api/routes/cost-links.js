const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

/**
 * GET /cost-links/planned/:costId
 * Get all links for a planned cost
 */
router.get("/planned/:costId", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { costId } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                cl.*,
                -- Actual cost info
                ac.description AS actual_description,
                ac.amount AS actual_amount,
                ac.date AS actual_date,
                -- Invoice info
                inv.rechnungs_nummer AS invoice_number,
                inv.lieferant AS invoice_supplier,
                inv.betrag AS invoice_amount,
                -- DATEV booking info
                db.buchungstext AS datev_text,
                db.betrag AS datev_amount,
                db.belegdatum AS datev_date
            FROM cost_links cl
            LEFT JOIN costs ac ON cl.actual_cost_id = ac.id
            LEFT JOIN invoices inv ON cl.invoice_id = inv.id
            LEFT JOIN datev_bookings db ON cl.datev_booking_id = db.rechnungs_id
            WHERE cl.planned_cost_id = $1
            ORDER BY cl.created_at DESC
        `, [costId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching cost links:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /cost-links/available/:projectId
 * Get available IST costs, invoices, and DATEV bookings for linking
 */
router.get("/available/:projectId", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projectId } = req.params;

    try {
        // Get already linked IDs
        const linkedResult = await pool.query(`
            SELECT
                actual_cost_id,
                invoice_id,
                datev_booking_id
            FROM cost_links
        `);

        const linkedActualIds = new Set(linkedResult.rows.map(r => r.actual_cost_id).filter(Boolean));
        const linkedInvoiceIds = new Set(linkedResult.rows.map(r => r.invoice_id).filter(Boolean));
        const linkedDatevIds = new Set(linkedResult.rows.map(r => r.datev_booking_id).filter(Boolean));

        // Get available IST costs (not linked yet)
        const costsResult = await pool.query(`
            SELECT id, description, amount, date, category
            FROM costs
            WHERE project_id = $1
              AND cost_type = 'ist'
              AND deleted_at IS NULL
            ORDER BY date DESC
        `, [projectId]);

        // Get available invoices (not linked yet)
        const invoicesResult = await pool.query(`
            SELECT id, rechnungs_nummer, lieferant, betrag, rechnungsdatum
            FROM invoices
            WHERE projekt_id = $1
              AND deleted_at IS NULL
            ORDER BY rechnungsdatum DESC
        `, [projectId]);

        // Get available DATEV bookings for this project
        const datevResult = await pool.query(`
            SELECT rechnungs_id, buchungstext, betrag, belegdatum, lieferant
            FROM datev_bookings
            WHERE projekt_id = $1
            ORDER BY belegdatum DESC
        `, [projectId]);

        // Filter out already linked items
        const availableCosts = costsResult.rows.filter(c => !linkedActualIds.has(c.id));
        const availableInvoices = invoicesResult.rows.filter(i => !linkedInvoiceIds.has(i.id));
        const availableDatev = datevResult.rows.filter(d => !linkedDatevIds.has(d.rechnungs_id));

        res.json({
            costs: availableCosts,
            invoices: availableInvoices,
            datev: availableDatev
        });
    } catch (err) {
        console.error("Error fetching available costs:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /cost-links
 * Create a new cost link
 */
router.post("/", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const userId = req.user?.id;
    const { planned_cost_id, actual_cost_id, invoice_id, datev_booking_id, amount, notes } = req.body;

    // Validate: exactly one link type must be set
    const linkTypes = [actual_cost_id, invoice_id, datev_booking_id].filter(Boolean).length;
    if (linkTypes !== 1) {
        return res.status(400).json({ error: "Exactly one of actual_cost_id, invoice_id, or datev_booking_id must be set" });
    }

    if (!planned_cost_id || !amount) {
        return res.status(400).json({ error: "planned_cost_id and amount are required" });
    }

    try {
        const result = await pool.query(`
            INSERT INTO cost_links (planned_cost_id, actual_cost_id, invoice_id, datev_booking_id, amount, notes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [planned_cost_id, actual_cost_id || null, invoice_id || null, datev_booking_id || null, amount, notes || null, userId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating cost link:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /cost-links/:id
 * Remove a cost link
 */
router.delete("/:id", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM cost_links WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Link not found" });
        }

        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error("Error deleting cost link:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /cost-links/project/:projectId/summary
 * Get linked amounts summary per planned cost
 */
router.get("/project/:projectId/summary", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projectId } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                cl.planned_cost_id,
                COUNT(*) AS link_count,
                SUM(cl.amount) AS linked_total
            FROM cost_links cl
            JOIN costs c ON cl.planned_cost_id = c.id
            WHERE c.project_id = $1
            GROUP BY cl.planned_cost_id
        `, [projectId]);

        // Convert to object for easy lookup
        const summary = {};
        result.rows.forEach(row => {
            summary[row.planned_cost_id] = {
                count: parseInt(row.link_count),
                total: parseFloat(row.linked_total) || 0
            };
        });

        res.json(summary);
    } catch (err) {
        console.error("Error fetching link summary:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

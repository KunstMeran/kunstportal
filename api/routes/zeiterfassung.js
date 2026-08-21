const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

// GET all time entries
router.get("/", requireAuth, requirePermission("zeiterfassung", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { user_id, project_id, start_date, end_date, limit = 500, offset = 0 } = req.query;

    try {
        let query = "SELECT * FROM time_entries WHERE 1=1";
        const values = [];

        if (user_id) {
            values.push(user_id);
            query += ` AND user_id = $${values.length}`;
        }
        if (project_id) {
            values.push(project_id);
            query += ` AND project_id = $${values.length}`;
        }
        if (start_date) {
            values.push(start_date);
            query += ` AND date >= $${values.length}`;
        }
        if (end_date) {
            values.push(end_date);
            query += ` AND date <= $${values.length}`;
        }

        query += ` ORDER BY date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET time entry by ID
router.get("/:id", requireAuth, requirePermission("zeiterfassung", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM time_entries WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Time entry not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET aggregated hours by user/project
router.get("/stats/summary", requireAuth, requirePermission("zeiterfassung", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { year, month, project_id } = req.query;

    try {
        let query = `
            SELECT
                user_id,
                project_id,
                SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as total_hours,
                COUNT(*) as entry_count
            FROM time_entries
            WHERE 1=1
        `;
        const values = [];

        if (year) {
            values.push(parseInt(year));
            query += ` AND EXTRACT(YEAR FROM date) = $${values.length}`;
        }
        if (month) {
            values.push(parseInt(month));
            query += ` AND EXTRACT(MONTH FROM date) = $${values.length}`;
        }
        if (project_id) {
            values.push(project_id);
            query += ` AND project_id = $${values.length}`;
        }

        query += " GROUP BY user_id, project_id ORDER BY total_hours DESC";

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create time entry
router.post("/", requireAuth, requirePermission("zeiterfassung", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO time_entries (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update time entry
router.put("/:id", requireAuth, requirePermission("zeiterfassung", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE time_entries SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Time entry not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE time entry
router.delete("/:id", requireAuth, requirePermission("zeiterfassung", "delete"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("DELETE FROM time_entries WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Time entry not found" });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

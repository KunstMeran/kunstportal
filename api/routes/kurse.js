const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

// ===== KURSE =====
router.get("/", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(`
            SELECT k.*, ka.name as anbieter_name, kk.name as kategorie_name
            FROM kurse k
            LEFT JOIN kurs_anbieter ka ON k.anbieter_id = ka.id
            LEFT JOIN kurs_kategorien kk ON k.kategorie_id = kk.id
            ORDER BY k.startdatum DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM kurse WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Kurs not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO kurse (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE kurse SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", requireAuth, requirePermission("projekte", "delete"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("DELETE FROM kurse WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Kurs not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== KURS TERMINE =====
router.get("/:id/termine", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(
            "SELECT * FROM kurs_termine WHERE kurs_id = $1 ORDER BY datum, startzeit",
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/:id/termine", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = { ...req.body, kurs_id: req.params.id };
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO kurs_termine (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== KURS TEILNEHMER =====
router.get("/termine/:terminId/teilnehmer", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(`
            SELECT kt.*, u.name as user_name
            FROM kurs_teilnehmer kt
            LEFT JOIN users u ON kt.user_id = u.id
            WHERE kt.termin_id = $1
        `, [req.params.terminId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/termine/:terminId/teilnehmer", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { user_id, anwesend } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO kurs_teilnehmer (termin_id, user_id, anwesend) VALUES ($1, $2, $3) RETURNING *",
            [req.params.terminId, user_id, anwesend || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== KATEGORIEN =====
router.get("/kategorien/all", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM kurs_kategorien ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ANBIETER =====
router.get("/anbieter/all", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM kurs_anbieter ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/anbieter", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO kurs_anbieter (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

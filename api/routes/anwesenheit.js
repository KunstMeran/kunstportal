const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

// GET anwesenheit planung
router.get("/planung", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { user_id, monat, jahr, start_date, end_date } = req.query;

    try {
        let query = "SELECT * FROM anwesenheit_planung WHERE 1=1";
        const values = [];

        if (user_id) {
            values.push(user_id);
            query += ` AND user_id = $${values.length}`;
        }
        // Filter nach Monat/Jahr über datum-Spalte
        if (monat && jahr) {
            values.push(parseInt(jahr));
            values.push(parseInt(monat));
            query += ` AND EXTRACT(YEAR FROM datum) = $${values.length - 1} AND EXTRACT(MONTH FROM datum) = $${values.length}`;
        } else if (jahr) {
            values.push(parseInt(jahr));
            query += ` AND EXTRACT(YEAR FROM datum) = $${values.length}`;
        }
        // Alternativ: Datumsbereich
        if (start_date) {
            values.push(start_date);
            query += ` AND datum >= $${values.length}`;
        }
        if (end_date) {
            values.push(end_date);
            query += ` AND datum <= $${values.length}`;
        }

        query += " ORDER BY datum DESC";
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET v_heute_anwesend view
router.get("/heute", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM v_heute_anwesend");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST/PUT upsert anwesenheit planung
router.post("/planung", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { user_id, datum, im_buero, mittagessen, abwesenheit_grund, abwesenheit_notiz } = req.body;

    // Datum normalisieren (nur YYYY-MM-DD Teil)
    const normalizedDatum = datum ? datum.split('T')[0] : datum;

    try {
        // Prüfe ob Eintrag bereits existiert
        const existing = await pool.query(
            "SELECT id FROM anwesenheit_planung WHERE user_id = $1 AND datum = $2::date",
            [user_id, normalizedDatum]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update existierenden Eintrag
            result = await pool.query(`
                UPDATE anwesenheit_planung
                SET im_buero = $1, mittagessen = $2, abwesenheit_grund = $3, abwesenheit_notiz = $4, updated_at = NOW()
                WHERE user_id = $5 AND datum = $6::date
                RETURNING *
            `, [im_buero || false, mittagessen || false, abwesenheit_grund || null, abwesenheit_notiz || null, user_id, normalizedDatum]);
        } else {
            // Neuen Eintrag erstellen
            result = await pool.query(`
                INSERT INTO anwesenheit_planung (user_id, datum, im_buero, mittagessen, abwesenheit_grund, abwesenheit_notiz)
                VALUES ($1, $2::date, $3, $4, $5, $6)
                RETURNING *
            `, [user_id, normalizedDatum, im_buero || false, mittagessen || false, abwesenheit_grund || null, abwesenheit_notiz || null]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update specific day
router.put("/planung/:id", requireAuth, requirePermission("projekte", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE anwesenheit_planung SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE anwesenheit planung
router.delete("/planung/:id", requireAuth, requirePermission("projekte", "delete"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("DELETE FROM anwesenheit_planung WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET summary by month
router.get("/summary", requireAuth, requirePermission("projekte", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { monat, jahr } = req.query;

    try {
        let query = `
            SELECT
                ap.user_id,
                u.name as user_name,
                ap.datum,
                ap.im_buero,
                ap.mittagessen,
                ap.abwesenheit_grund,
                ap.abwesenheit_notiz
            FROM anwesenheit_planung ap
            JOIN users u ON ap.user_id = u.id
            WHERE 1=1
        `;
        const values = [];

        if (monat && jahr) {
            values.push(parseInt(jahr));
            values.push(parseInt(monat));
            query += ` AND EXTRACT(YEAR FROM ap.datum) = $${values.length - 1} AND EXTRACT(MONTH FROM ap.datum) = $${values.length}`;
        } else if (jahr) {
            values.push(parseInt(jahr));
            query += ` AND EXTRACT(YEAR FROM ap.datum) = $${values.length}`;
        }

        query += " ORDER BY u.name, ap.datum";
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

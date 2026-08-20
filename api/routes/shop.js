const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

// ===== ARTIKEL =====
router.get("/artikel", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(`
            SELECT a.*, t.name as typ_name
            FROM shop_artikel a
            LEFT JOIN shop_artikeltypen t ON a.typ_id = t.id
            ORDER BY a.name
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/artikel", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { name, typ_id, preis, bestand, isbn, beschreibung } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO shop_artikel (name, typ_id, preis, bestand, isbn, beschreibung) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, typ_id, preis, bestand || 0, isbn, beschreibung]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/artikel/:id", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE shop_artikel SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ARTIKELTYPEN =====
router.get("/artikeltypen", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_artikeltypen ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== VERKAEUFE =====
router.get("/verkaeufe", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { datum, typ, limit = 100, offset = 0 } = req.query;
    try {
        let query = "SELECT * FROM shop_verkaeufe WHERE 1=1";
        const values = [];

        if (datum) {
            values.push(datum);
            query += ` AND DATE(datum) = $${values.length}`;
        }
        if (typ) {
            values.push(typ);
            query += ` AND typ = $${values.length}`;
        }

        query += ` ORDER BY datum DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/verkaeufe", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO shop_verkaeufe (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== EINKAEUFE =====
router.get("/einkaeufe", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_einkaeufe ORDER BY datum DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/einkaeufe", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO shop_einkaeufe (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== EINTRITT KATEGORIEN =====
router.get("/eintritt-kategorien", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_eintritt_kategorien ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== MITGLIED KATEGORIEN =====
router.get("/mitglied-kategorien", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_mitglied_kategorien ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== KASSEN BEWEGUNGEN =====
router.get("/kassen-bewegungen", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { datum } = req.query;
    try {
        let query = "SELECT * FROM shop_kassen_bewegungen";
        const values = [];

        if (datum) {
            values.push(datum);
            query += " WHERE DATE(datum) = $1";
        }

        query += " ORDER BY datum DESC";
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/kassen-bewegungen", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { typ, betrag, beschreibung } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO shop_kassen_bewegungen (typ, betrag, beschreibung) VALUES ($1, $2, $3) RETURNING *",
            [typ, betrag, beschreibung]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== KASSENABSCHLUSS =====
router.get("/kassenabschluss", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { datum, limit = 30 } = req.query;
    try {
        let query = "SELECT * FROM shop_kassenabschluss";
        const values = [];

        if (datum) {
            values.push(datum);
            query += " WHERE datum = $1";
        }

        query += ` ORDER BY datum DESC LIMIT $${values.length + 1}`;
        values.push(limit);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/kassenabschluss", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        const updateSet = columns.map((col) => `${col} = EXCLUDED.${col}`).join(", ");

        const result = await pool.query(`
            INSERT INTO shop_kassenabschluss (${columns.join(", ")})
            VALUES (${placeholders.join(", ")})
            ON CONFLICT (datum) DO UPDATE SET ${updateSet}
            RETURNING *
        `, values);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== AUSGABEN =====
router.get("/ausgaben", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_ausgaben ORDER BY datum DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/ausgaben", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO shop_ausgaben (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== EXTERNE EMPFAENGER =====
router.get("/externe-empfaenger", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_externe_empfaenger ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== RECHNUNGEN =====
router.get("/rechnungen", requireAuth, requirePermission("einnahmen", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM shop_rechnungen ORDER BY datum DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/rechnungen", requireAuth, requirePermission("einnahmen", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO shop_rechnungen (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

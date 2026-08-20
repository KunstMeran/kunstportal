const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');

// GET budget entries
router.get('/entries', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, year } = req.query;

    try {
        let query = 'SELECT * FROM budget_entries WHERE 1=1';
        const values = [];

        if (projekt_id) {
            values.push(projekt_id);
            query += ` AND projekt_id = $${values.length}`;
        }
        if (year) {
            values.push(parseInt(year));
            query += ` AND jahr = $${values.length}`;
        }

        query += ' ORDER BY konto, monat';
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST/PUT upsert budget entry
router.post('/entries', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, konto, monat, jahr, betrag } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO budget_entries (projekt_id, konto, monat, jahr, betrag)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (projekt_id, konto, monat, jahr) 
            DO UPDATE SET betrag = EXCLUDED.betrag, updated_at = NOW()
            RETURNING *
        `, [projekt_id, konto, monat, jahr, betrag]);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET chart of accounts
router.get('/kontenplan', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM chart_of_accounts ORDER BY konto');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET konto bezeichnungen
router.get('/konto-bezeichnungen', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM konto_bezeichnungen ORDER BY konto');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET budget notes
router.get('/notes', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id } = req.query;

    try {
        let query = 'SELECT * FROM budget_notes';
        const values = [];

        if (projekt_id) {
            values.push(projekt_id);
            query += ' WHERE projekt_id = $1';
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST budget note
router.post('/notes', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, note } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO budget_notes (projekt_id, note) VALUES ($1, $2) RETURNING *',
            [projekt_id, note]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET/POST konto notes
router.get('/konto-notes', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, konto } = req.query;

    try {
        let query = 'SELECT * FROM budget_konto_notes WHERE 1=1';
        const values = [];

        if (projekt_id) {
            values.push(projekt_id);
            query += ` AND projekt_id = $${values.length}`;
        }
        if (konto) {
            values.push(konto);
            query += ` AND konto = $${values.length}`;
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/konto-notes', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, konto, note } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO budget_konto_notes (projekt_id, konto, note)
            VALUES ($1, $2, $3)
            ON CONFLICT (projekt_id, konto) 
            DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
            RETURNING *
        `, [projekt_id, konto, note]);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET cost types
router.get('/cost-types', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM cost_types ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

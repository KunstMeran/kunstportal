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
            query += ` AND fiscal_year = $${values.length}`;
        }

        query += ' ORDER BY konto_nr, description';
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST/PUT upsert budget entry
router.post('/entries', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { projekt_id, konto_nr, description, fiscal_year, entry_type, notes, jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, dez } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO budget_entries (projekt_id, konto_nr, description, fiscal_year, entry_type, notes, jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, dez)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id)
            DO UPDATE SET
                konto_nr = EXCLUDED.konto_nr,
                description = EXCLUDED.description,
                jan = EXCLUDED.jan, feb = EXCLUDED.feb, mar = EXCLUDED.mar,
                apr = EXCLUDED.apr, mai = EXCLUDED.mai, jun = EXCLUDED.jun,
                jul = EXCLUDED.jul, aug = EXCLUDED.aug, sep = EXCLUDED.sep,
                okt = EXCLUDED.okt, nov = EXCLUDED.nov, dez = EXCLUDED.dez,
                notes = EXCLUDED.notes,
                updated_at = NOW()
            RETURNING *
        `, [projekt_id, konto_nr, description, fiscal_year, entry_type || 'budget', notes,
            jan || 0, feb || 0, mar || 0, apr || 0, mai || 0, jun || 0,
            jul || 0, aug || 0, sep || 0, okt || 0, nov || 0, dez || 0]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update budget entry
router.put('/entries/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(id);

        const result = await pool.query(
            `UPDATE budget_entries SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Budget entry not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET chart of accounts
router.get('/kontenplan', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM chart_of_accounts ORDER BY sort_order, konto_pattern');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create chart of accounts entry
router.post('/kontenplan', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { konto_pattern, konto_name, kategorie, beschreibung, db_zuordnung, ist_projektbezogen, sort_order } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, beschreibung, db_zuordnung, ist_projektbezogen, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [konto_pattern, konto_name, kategorie, beschreibung, db_zuordnung || 'NEUTRAL', ist_projektbezogen || false, sort_order || 0]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update chart of accounts entry
router.put('/kontenplan/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(id);

        const result = await pool.query(
            `UPDATE chart_of_accounts SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE chart of accounts entry
router.delete('/kontenplan/:id', requireAuth, requirePermission('projekte', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM chart_of_accounts WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
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
    const { fiscal_year } = req.query;

    try {
        let query = 'SELECT * FROM budget_notes';
        const values = [];

        if (fiscal_year) {
            values.push(parseInt(fiscal_year));
            query += ' WHERE fiscal_year = $1';
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
    const { fiscal_year, notes } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO budget_notes (fiscal_year, notes)
            VALUES ($1, $2)
            ON CONFLICT (fiscal_year)
            DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
            RETURNING *
        `, [fiscal_year, notes]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET/POST konto notes
router.get('/konto-notes', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { fiscal_year, konto_nr } = req.query;

    try {
        let query = 'SELECT * FROM budget_konto_notes WHERE 1=1';
        const values = [];

        if (fiscal_year) {
            values.push(parseInt(fiscal_year));
            query += ` AND fiscal_year = $${values.length}`;
        }
        if (konto_nr) {
            values.push(konto_nr);
            query += ` AND konto_nr = $${values.length}`;
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/konto-notes', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { fiscal_year, konto_nr, notes } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO budget_konto_notes (fiscal_year, konto_nr, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (konto_nr, fiscal_year)
            DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
            RETURNING *
        `, [fiscal_year, konto_nr, notes]);

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

// POST create cost type
router.post('/cost-types', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO cost_types (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update cost type
router.put('/cost-types/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(id);

        const result = await pool.query(
            `UPDATE cost_types SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cost type not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE cost type (soft delete)
router.delete('/cost-types/:id', requireAuth, requirePermission('projekte', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    try {
        const result = await pool.query(
            'UPDATE cost_types SET deleted_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cost type not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

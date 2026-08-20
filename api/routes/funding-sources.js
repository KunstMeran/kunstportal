const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');

// GET funding sources (Einnahmeplanung / Abgabestellen)
router.get('/', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { year, is_abgabestelle } = req.query;

    try {
        let query = 'SELECT * FROM funding_sources WHERE 1=1';
        const values = [];

        if (year) {
            values.push(parseInt(year));
            query += ` AND fiscal_year = $${values.length}`;
        }
        if (is_abgabestelle !== undefined) {
            values.push(is_abgabestelle === 'true');
            query += ` AND is_abgabestelle = $${values.length}`;
        }

        query += ' ORDER BY code';
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET funding source by ID
router.get('/:id', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM funding_sources WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Funding source not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create funding source
router.post('/', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { code, name, source, amount, fiscal_year, is_abgabestelle, status, notes, document_path } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(`
            INSERT INTO funding_sources
            (code, name, source, amount, fiscal_year, is_abgabestelle, status, notes, document_path, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [code, name, source, amount || 0, fiscal_year, is_abgabestelle || false, status || 'offen', notes, document_path, userId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Code existiert bereits für dieses Jahr' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// PUT update funding source
router.put('/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { code, name, source, amount, fiscal_year, is_abgabestelle, status, notes, document_path } = req.body;

    try {
        const result = await pool.query(`
            UPDATE funding_sources
            SET code = $1, name = $2, source = $3, amount = $4, fiscal_year = $5,
                is_abgabestelle = $6, status = $7, notes = $8, document_path = $9,
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [code, name, source, amount, fiscal_year, is_abgabestelle, status, notes, document_path, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Funding source not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: 'Code existiert bereits für dieses Jahr' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// DELETE funding source
router.delete('/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM funding_sources WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Funding source not found' });
        }
        res.json({ message: 'Funding source deleted', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');

// GET all invoices
router.get('/', requireAuth, requirePermission('rechnungen', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { project_id, supplier_partita_iva, status, bezahlt, limit = 500, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM invoices';
        const values = [];
        const conditions = [];

        if (project_id) {
            values.push(project_id);
            conditions.push(`project_id = $${values.length}`);
        }
        if (supplier_partita_iva) {
            values.push(supplier_partita_iva);
            conditions.push(`supplier_partita_iva = $${values.length}`);
        }
        if (status) {
            values.push(status);
            conditions.push(`status = $${values.length}`);
        }
        if (bezahlt !== undefined) {
            values.push(bezahlt === 'true');
            conditions.push(`bezahlt = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY datum DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET invoice by ID
router.get('/:id', requireAuth, requirePermission('rechnungen', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create invoice
router.post('/', requireAuth, requirePermission('rechnungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO invoices (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update invoice
router.put('/:id', requireAuth, requirePermission('rechnungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE invoices SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE invoice
router.delete('/:id', requireAuth, requirePermission('rechnungen', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

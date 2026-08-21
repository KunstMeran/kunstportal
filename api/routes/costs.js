const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');

// GET all costs
router.get('/', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { project_id, limit = 500, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM costs WHERE deleted_at IS NULL';
        const values = [];

        if (project_id) {
            values.push(project_id);
            query += ` AND project_id = $${values.length}`;
        }

        query += ` ORDER BY date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET cost by ID
router.get('/:id', requireAuth, requirePermission('projekte', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(
            'SELECT * FROM costs WHERE id = $1 AND deleted_at IS NULL',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cost not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create cost
router.post('/', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { project_id, budget_item_id, category, description, amount, cost_type, date, supplier, invoice_number, file_path } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(`
            INSERT INTO costs
            (project_id, budget_item_id, category, description, amount, cost_type, date, supplier, invoice_number, file_path, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [project_id, budget_item_id, category, description, amount, cost_type, date, supplier, invoice_number, file_path, userId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update cost
router.put('/:id', requireAuth, requirePermission('projekte', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    const userId = req.user.id;

    try {
        // Add audit fields
        data.updated_at = new Date().toISOString();
        data.updated_by = userId;

        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE costs SET ${setClause} WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cost not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE cost (soft delete)
router.delete('/:id', requireAuth, requirePermission('projekte', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `UPDATE costs SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
            [userId, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cost not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

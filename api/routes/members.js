const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');
const { createCrudRouter } = require('../middleware/crud');

// Base CRUD for members
const membersRouter = createCrudRouter('members', {
    module: 'mitglieder',
    searchColumns: ['first_name', 'last_name', 'email'],
    orderBy: 'last_name ASC, first_name ASC'
});

// Additional routes for member_payments
router.use('/', membersRouter);

router.get('/:id/payments', requireAuth, requirePermission('mitglieder', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(
            'SELECT * FROM member_payments WHERE member_id = $1 ORDER BY jahr DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/payments', requireAuth, requirePermission('mitglieder', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { jahr, betrag, zahlungsdatum, bemerkung } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO member_payments (member_id, jahr, betrag, zahlungsdatum, bemerkung) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.params.id, jahr, betrag, zahlungsdatum, bemerkung]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

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
    // Unterstütze beide Namenskonventionen
    const { year, jahr, amount, betrag, payment_date, zahlungsdatum, notes, bemerkung, datev_buchung_id, datev_buchungstext } = req.body;
    const finalYear = year || jahr;
    const finalAmount = amount || betrag;
    const finalDate = payment_date || zahlungsdatum;
    const finalNotes = notes || bemerkung;

    try {
        // Einfacher INSERT - ein Mitglied kann mehrere Zahlungen pro Jahr haben
        const result = await pool.query(`
            INSERT INTO member_payments (member_id, year, amount, payment_date, notes, datev_buchung_id, datev_buchungstext)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [req.params.id, finalYear, finalAmount, finalDate, finalNotes, datev_buchung_id, datev_buchungstext]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all payments for a specific year (with member data)
router.get('/payments/year/:year', requireAuth, requirePermission('mitglieder', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(`
            SELECT mp.*, m.id as member_id, m.last_name, m.first_name, m.membership_fee
            FROM member_payments mp
            JOIN members m ON mp.member_id = m.id
            WHERE mp.year = $1
            ORDER BY mp.payment_date DESC`,
            [req.params.year]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

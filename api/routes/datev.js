const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middleware/auth');

// GET all DATEV bookings
router.get('/', requireAuth, requirePermission('bewegungen', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { konto, projekt_id, year, month, kostentyp_id, kontrolliert, start_date, end_date, partita_iva, dokument_nr, limit = 1000, offset = 0 } = req.query;

    try {
        let query = 'SELECT * FROM datev_bookings';
        const values = [];
        const conditions = [];

        if (konto) {
            values.push(konto);
            conditions.push(`konto = $${values.length}`);
        }
        if (projekt_id) {
            values.push(projekt_id);
            conditions.push(`projekt_id = $${values.length}`);
        }
        if (year) {
            values.push(parseInt(year));
            conditions.push(`EXTRACT(YEAR FROM datum) = $${values.length}`);
        }
        if (month) {
            values.push(parseInt(month));
            conditions.push(`EXTRACT(MONTH FROM datum) = $${values.length}`);
        }
        if (start_date) {
            values.push(start_date);
            conditions.push(`datum >= $${values.length}`);
        }
        if (end_date) {
            values.push(end_date);
            conditions.push(`datum <= $${values.length}`);
        }
        if (kostentyp_id) {
            values.push(kostentyp_id);
            conditions.push(`kostentyp_id = $${values.length}`);
        }
        if (kontrolliert !== undefined) {
            values.push(kontrolliert === 'true');
            conditions.push(`kontrolliert = $${values.length}`);
        }
        if (partita_iva) {
            values.push(partita_iva);
            conditions.push(`partita_iva = $${values.length}`);
        }
        if (dokument_nr) {
            values.push(dokument_nr);
            conditions.push(`dokument_nr = $${values.length}`);
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

// GET /years - Alle verfügbaren Jahre (MUSS VOR /:id stehen!)
router.get('/years', requireAuth, async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(
            'SELECT DISTINCT import_year FROM datev_bookings WHERE import_year IS NOT NULL ORDER BY import_year DESC'
        );
        res.json(result.rows.map(r => r.import_year));
    } catch (error) {
        console.error('Get DATEV years error:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Jahre' });
    }
});


// GET aggregated by account
router.get('/aggregated', requireAuth, requirePermission('bewegungen', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { year, projekt_id } = req.query;

    try {
        let query = `
            SELECT
                konto,
                SUM(betrag) as total,
                COUNT(*) as count,
                EXTRACT(MONTH FROM datum) as monat
            FROM datev_bookings
            WHERE 1=1
        `;
        const values = [];

        if (year) {
            values.push(parseInt(year));
            query += ` AND EXTRACT(YEAR FROM datum) = $${values.length}`;
        }
        if (projekt_id) {
            values.push(projekt_id);
            query += ` AND projekt_id = $${values.length}`;
        }

        query += ' GROUP BY konto, EXTRACT(MONTH FROM datum) ORDER BY konto, monat';

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single booking
router.get('/:id', requireAuth, requirePermission('bewegungen', 'read'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('SELECT * FROM datev_bookings WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create booking
router.post('/', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO datev_bookings (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk import
router.post('/import', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { bookings } = req.body;

    if (!Array.isArray(bookings)) {
        return res.status(400).json({ error: 'bookings must be an array' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const imported = [];
            const errors = [];

            for (const booking of bookings) {
                try {
                    const columns = Object.keys(booking);
                    const values = Object.values(booking);
                    const placeholders = values.map((_, i) => `$${i + 1}`);

                    const result = await client.query(
                        `INSERT INTO datev_bookings (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
                        values
                    );
                    imported.push(result.rows[0].id);
                } catch (err) {
                    errors.push({ booking, error: err.message });
                }
            }

            await client.query('COMMIT');
            res.json({ imported: imported.length, errors });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update booking
router.put('/:id', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE datev_bookings SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk workflow status update by IDs
router.post('/bulk-status', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { bookingIds, status, userId } = req.body;
    const heute = new Date().toISOString().split('T')[0];

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ error: 'bookingIds array required' });
    }

    try {
        let updateData = { workflow_status: status || 'neu' };

        if (status === 'kontrolliert') {
            updateData.kontrolled_at = heute;
            updateData.kontrolled_by = userId;
        } else if (status === 'bezahlt') {
            updateData.paid_at = heute;
            updateData.paid_by = userId;
        } else if (status === 'neu') {
            updateData.kontrolled_at = null;
            updateData.kontrolled_by = null;
            updateData.paid_at = null;
            updateData.paid_by = null;
        }

        const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(',');
        const columns = Object.keys(updateData);
        const setClause = columns.map(col => `${col} = $${bookingIds.length + columns.indexOf(col) + 1}`).join(', ');

        const values = [...bookingIds, ...Object.values(updateData)];

        const result = await pool.query(
            `UPDATE datev_bookings SET ${setClause} WHERE id IN (${placeholders}) RETURNING id`,
            values
        );

        res.json({ success: true, updated: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk workflow status update by partita_iva and dokument_nr
router.post('/bulk-status-by-dokument', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { documents, status, userId } = req.body;
    const heute = new Date().toISOString().split('T')[0];

    // documents = [{ partitaIva: '...', dokumentNr: '...' }, ...]
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({ error: 'documents array required' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let totalUpdated = 0;

            for (const doc of documents) {
                const { partitaIva, dokumentNr } = doc;

                let updateFields = { workflow_status: status || 'neu' };

                if (status === 'kontrolliert') {
                    updateFields.kontrolled_at = heute;
                    updateFields.kontrolled_by = userId;
                } else if (status === 'bezahlt') {
                    updateFields.paid_at = heute;
                    updateFields.paid_by = userId;
                } else if (status === 'neu') {
                    updateFields.kontrolled_at = null;
                    updateFields.kontrolled_by = null;
                    updateFields.paid_at = null;
                    updateFields.paid_by = null;
                }

                // Build WHERE clause for partita_iva (can be NULL or empty)
                let whereClause;
                let values;

                if (partitaIva && partitaIva.trim() !== '') {
                    whereClause = 'partita_iva = $1 AND dokument_nr = $2';
                    values = [partitaIva, dokumentNr];
                } else {
                    whereClause = '(partita_iva IS NULL OR partita_iva = \'\') AND dokument_nr = $1';
                    values = [dokumentNr];
                }

                const columns = Object.keys(updateFields);
                const setClause = columns.map((col, i) => `${col} = $${values.length + i + 1}`).join(', ');
                values.push(...Object.values(updateFields));

                const result = await client.query(
                    `UPDATE datev_bookings SET ${setClause} WHERE ${whereClause}`,
                    values
                );
                totalUpdated += result.rowCount;
            }

            await client.query('COMMIT');
            res.json({ success: true, updated: totalUpdated });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk archive
router.post('/bulk-archive', requireAuth, requirePermission('bewegungen', 'write'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { bookingIds, archived = true } = req.body;
    const archivedAt = archived ? new Date().toISOString() : null;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ error: 'bookingIds array required' });
    }

    try {
        const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(
            `UPDATE datev_bookings SET archived = $${bookingIds.length + 1}, archived_at = $${bookingIds.length + 2} WHERE id IN (${placeholders}) RETURNING id`,
            [...bookingIds, archived, archivedAt]
        );

        res.json({ success: true, updated: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk delete
router.post('/bulk-delete', requireAuth, requirePermission('bewegungen', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    const { bookingIds } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ error: 'bookingIds array required' });
    }

    try {
        const placeholders = bookingIds.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(
            `DELETE FROM datev_bookings WHERE id IN (${placeholders}) RETURNING id`,
            bookingIds
        );

        res.json({ success: true, deleted: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE booking
router.delete('/:id', requireAuth, requirePermission('bewegungen', 'delete'), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query('DELETE FROM datev_bookings WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


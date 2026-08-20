// Generic CRUD helper for simple tables
const createCrudRouter = (tableName, options = {}) => {
    const express = require('express');
    const router = express.Router();
    const { requireAuth, requirePermission } = require('./auth');

    const {
        module: moduleName = tableName,
        idColumn = 'id',
        selectColumns = '*',
        orderBy = 'id DESC',
        searchColumns = []
    } = options;

    // GET all
    router.get('/', requireAuth, requirePermission(moduleName, 'read'), async (req, res) => {
        const pool = req.app.locals.pool;
        const { limit = 1000, offset = 0, search, ...filters } = req.query;

        try {
            let query = `SELECT ${selectColumns} FROM ${tableName}`;
            const values = [];
            const conditions = [];

            // Search
            if (search && searchColumns.length > 0) {
                const searchConditions = searchColumns.map((col, i) => {
                    values.push(`%${search}%`);
                    return `${col} ILIKE $${values.length}`;
                });
                conditions.push(`(${searchConditions.join(' OR ')})`);
            }

            // Filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    values.push(value);
                    conditions.push(`${key} = $${values.length}`);
                }
            });

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ` ORDER BY ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
            values.push(limit, offset);

            const result = await pool.query(query, values);
            res.json(result.rows);
        } catch (err) {
            console.error(`GET ${tableName} error:`, err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET one by ID
    router.get('/:id', requireAuth, requirePermission(moduleName, 'read'), async (req, res) => {
        const pool = req.app.locals.pool;
        try {
            const result = await pool.query(
                `SELECT ${selectColumns} FROM ${tableName} WHERE ${idColumn} = $1`,
                [req.params.id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Not found' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error(`GET ${tableName}/${req.params.id} error:`, err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST create
    router.post('/', requireAuth, requirePermission(moduleName, 'write'), async (req, res) => {
        const pool = req.app.locals.pool;
        const data = req.body;

        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`);

            const result = await pool.query(
                `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
                values
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(`POST ${tableName} error:`, err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT/PATCH update
    router.put('/:id', requireAuth, requirePermission(moduleName, 'write'), async (req, res) => {
        const pool = req.app.locals.pool;
        const data = req.body;

        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

            values.push(req.params.id);
            const result = await pool.query(
                `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = $${values.length} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Not found' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error(`PUT ${tableName}/${req.params.id} error:`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.patch('/:id', router.stack.find(l => l.route?.path === '/:id' && l.route?.methods?.put)?.route?.stack[2]?.handle);

    // DELETE
    router.delete('/:id', requireAuth, requirePermission(moduleName, 'delete'), async (req, res) => {
        const pool = req.app.locals.pool;
        try {
            const result = await pool.query(
                `DELETE FROM ${tableName} WHERE ${idColumn} = $1 RETURNING *`,
                [req.params.id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Not found' });
            }
            res.json({ success: true, deleted: result.rows[0] });
        } catch (err) {
            console.error(`DELETE ${tableName}/${req.params.id} error:`, err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

module.exports = { createCrudRouter };

const express = require("express");
const router = express.Router();
const { requireAuth, requirePermission } = require("../middleware/auth");

// GET all workspaces
router.get("/", requireAuth, requirePermission("konfiguration", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM workspaces ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET workspace by ID
router.get("/:id", requireAuth, requirePermission("konfiguration", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM workspaces WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create workspace
router.post("/", requireAuth, requirePermission("konfiguration", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const result = await pool.query(
            `INSERT INTO workspaces (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
            values
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update workspace
router.put("/:id", requireAuth, requirePermission("konfiguration", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE workspaces SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user_workspaces
router.get("/:id/users", requireAuth, requirePermission("konfiguration", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(`
            SELECT uw.*, u.name, u.email
            FROM user_workspaces uw
            JOIN users u ON uw.user_id = u.id
            WHERE uw.workspace_id = $1
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST assign user to workspace
router.post("/:id/users", requireAuth, requirePermission("konfiguration", "write"), async (req, res) => {
    const pool = req.app.locals.pool;
    const { user_id } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO user_workspaces (user_id, workspace_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
            [user_id, req.params.id]
        );
        res.status(201).json(result.rows[0] || { message: "User already assigned" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE remove user from workspace
router.delete("/:id/users/:userId", requireAuth, requirePermission("konfiguration", "delete"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query(
            "DELETE FROM user_workspaces WHERE workspace_id = $1 AND user_id = $2 RETURNING *",
            [req.params.id, req.params.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user permissions (view)
router.get("/permissions/:userId", requireAuth, requirePermission("konfiguration", "read"), async (req, res) => {
    const pool = req.app.locals.pool;
    try {
        const result = await pool.query("SELECT * FROM user_permissions WHERE user_id = $1", [req.params.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User permissions not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

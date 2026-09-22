const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Login (Microsoft SSO callback wird hier ankommen)
router.post('/login', async (req, res) => {
    const pool = req.app.locals.pool;
    const { email, name, microsoft_id } = req.body;

    try {
        // Find or create user
        let result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        let user;
        if (result.rows.length === 0) {
            // User doesn't exist - create new
            // Generate username from email (part before @)
            const username = email.split('@')[0];
            const insertResult = await pool.query(
                'INSERT INTO users (email, username, role, microsoft_id, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [email, username, 'user', microsoft_id, 'internal']
            );
            user = insertResult.rows[0];
        } else {
            user = result.rows[0];
            // Update microsoft_id if not set
            if (!user.microsoft_id && microsoft_id) {
                await pool.query(
                    'UPDATE users SET microsoft_id = $1 WHERE id = $2',
                    [microsoft_id, user.id]
                );
            }
        }

        // Get permissions
        const permResult = await pool.query(
            'SELECT * FROM user_permissions WHERE user_id = $1',
            [user.id]
        );

        req.session.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            user_type: user.user_type,
            permissions: permResult.rows[0] || null
        };

        res.json({
            success: true,
            user: req.session.user
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current session
router.get('/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

module.exports = router;

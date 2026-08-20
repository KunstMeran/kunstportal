// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Permission check middleware
const requirePermission = (module, level = 'read') => {
    return async (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const pool = req.app.locals.pool;
        const userId = req.session.user.id;

        try {
            const result = await pool.query(
                'SELECT * FROM user_permissions WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'No permissions found' });
            }

            const permissions = result.rows[0];
            const permissionKey = 'access_' + module;
            const userLevel = permissions[permissionKey];

            const levels = ['none', 'read', 'write', 'delete'];
            const requiredIndex = levels.indexOf(level);
            const userIndex = levels.indexOf(userLevel);

            if (userIndex < requiredIndex) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            req.permissions = permissions;
            next();
        } catch (err) {
            console.error('Permission check error:', err);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
};

module.exports = { requireAuth, requirePermission };

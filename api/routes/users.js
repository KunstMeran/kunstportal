const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('users', {
    module: 'konfiguration',
    searchColumns: ['username', 'email'],
    // SECURITY: Exclude password_hash and sensitive fields from API responses
    // Actual columns: id, username, password_hash, role, email, hourly_rate, auth_id, user_type, created_at, updated_at
    selectColumns: 'id, email, username, role, user_type, hourly_rate, created_at, updated_at'
});

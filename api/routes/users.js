const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('users', {
    module: 'konfiguration',
    searchColumns: ['name', 'email'],
    // SECURITY: Exclude password_hash and sensitive fields from API responses
    selectColumns: 'id, email, name, username, user_type, is_active, created_at, updated_at, microsoft_id'
});

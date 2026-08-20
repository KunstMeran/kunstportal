const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('users', {
    module: 'konfiguration',
    searchColumns: ['name', 'email']
});

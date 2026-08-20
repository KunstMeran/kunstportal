const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('projects', {
    module: 'projekte',
    searchColumns: ['name', 'beschreibung'],
    orderBy: 'created_at DESC'
});

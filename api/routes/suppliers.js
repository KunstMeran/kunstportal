const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('suppliers', {
    module: 'lieferanten',
    searchColumns: ['name', 'partita_iva', 'codice_fiscale'],
    orderBy: 'name ASC'
});

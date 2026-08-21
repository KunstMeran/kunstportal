const { createCrudRouter } = require('../middleware/crud');
module.exports = createCrudRouter('suppliers', {
    module: 'lieferanten',
    idColumn: 'partita_iva',
    searchColumns: ['fornitore_name', 'partita_iva', 'codice_fiscale'],
    orderBy: 'fornitore_name ASC'
});

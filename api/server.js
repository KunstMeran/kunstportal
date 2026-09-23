require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Database Pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Export pool for routes
app.locals.pool = pool;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://portal.kunstmeranoarte.org'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
// Rate Limiting (1000 Anfragen pro 15 Minuten pro IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Zu viele Anfragen, bitte später versuchen' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/invoices', require('./routes/invoices'));
app.use('/api/v1/datev', require('./routes/datev'));
app.use('/api/v1/suppliers', require('./routes/suppliers'));
app.use('/api/v1/members', require('./routes/members'));
app.use('/api/v1/budget', require('./routes/budget'));
app.use('/api/v1/shop', require('./routes/shop'));
app.use('/api/v1/workspaces', require('./routes/workspaces'));
app.use('/api/v1/storage', require('./routes/storage'));
app.use('/api/v1/zeiterfassung', require('./routes/zeiterfassung'));
app.use('/api/v1/kurse', require('./routes/kurse'));
app.use('/api/v1/anwesenheit', require('./routes/anwesenheit'));
app.use('/api/v1/funding-sources', require('./routes/funding-sources'));
app.use('/api/v1/costs', require('./routes/costs'));

// Health check
app.get('/api/v1/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time, current_database() as db');
        res.json({
            status: 'ok',
            database: result.rows[0].db,
            time: result.rows[0].time
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Kunstmeran API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await pool.end();
    process.exit(0);
});

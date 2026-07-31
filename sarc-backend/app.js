const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const path = require('path');

const xss = require('xss-clean');
const compression = require('compression');

// Use gzip compression for all JSON and HTTP responses
app.use(compression());

// Trust proxy is required if you are behind a reverse proxy (Heroku, Render, Netlify, Nginx, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:4174', 'http://localhost:4175'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' })); // Increased limit for bulk imports
// Custom XSS Middleware for Express 5
const { clean } = require('xss-clean/lib/xss');
app.use((req, res, next) => {
    if (req.body) {
        const cleaned = clean(req.body);
        for (const key in req.body) delete req.body[key];
        Object.assign(req.body, cleaned);
    }
    if (req.query) {
        const cleaned = clean(req.query);
        for (const key in req.query) delete req.query[key];
        Object.assign(req.query, cleaned);
    }
    if (req.params) {
        const cleaned = clean(req.params);
        for (const key in req.params) delete req.params[key];
        Object.assign(req.params, cleaned);
    }
    next();
});

// Custom HPP Middleware for Express 5 (req.query is a getter, so we modify the object instead of reassigning)
app.use((req, res, next) => {
    if (req.query) {
        for (let key in req.query) {
            if (Array.isArray(req.query[key])) {
                req.query[key] = req.query[key][req.query[key].length - 1];
            }
        }
    }
    next();
});

// Rate limiting disabled per user request

// Local static file serving removed for Serverless architecture

// ─── Routes ───────────────────────────────────────────────────────────────────
// We mount routes on a Router so they can be served both on /api (local) and /.netlify/functions/api (Netlify)
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/authRoutes'));
apiRouter.use('/upload', require('./routes/uploadRoutes'));
apiRouter.use('/projects', require('./routes/projectRoutes'));
apiRouter.use('/applications', require('./routes/applicationRoutes'));
apiRouter.use('/notifications', require('./routes/notificationRoutes'));
apiRouter.use('/teams', require('./routes/teamRoutes'));
apiRouter.use('/milestones', require('./routes/milestoneRoutes'));
apiRouter.use('/users', require('./routes/userRoutes'));
apiRouter.use('/guide', require('./routes/guideRoutes'));
apiRouter.use('/stats', require('./routes/statsRoutes'));
apiRouter.use('/global-milestones', require('./routes/globalMilestoneRoutes'));
apiRouter.use('/system', require('./routes/systemRoutes'));
apiRouter.use('/support', require('./routes/supportRoutes'));
apiRouter.use('/instructions', require('./routes/instructionRoutes'));
// Apply the global API routes
app.use('/api', apiRouter);
// Mount for Netlify Functions mapping
app.use('/.netlify/functions/api', apiRouter);

// Basic health check route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the SARCG API', status: 'OK' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        message: isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
        ...(isProduction ? {} : { stack: err.stack })
    });
});

module.exports = app;

const app = require('./app');
const { prisma } = require('./config/prismaClient');

// Cleanup logic has been migrated to a Netlify Scheduled Function (cron-cleanup.js)

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | PID: ${process.pid}`);
});

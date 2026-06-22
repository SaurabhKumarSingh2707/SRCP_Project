const { PrismaClient } = require('@prisma/client');

// ─── Connection Pool Configuration ────────────────────────────────────────────
// PostgreSQL has a default max of 100 connections.
// With PM2 cluster mode (e.g., 4 workers), each worker gets its own pool.
// Formula: connection_limit = Math.floor(postgres_max_connections / num_workers)
// Set DATABASE_URL with ?connection_limit=N to control per-process pool size.
// Example for 4 PM2 workers: ?connection_limit=20&pool_timeout=20
//
// If you do not set ?connection_limit in DATABASE_URL, Prisma defaults to:
//   - 2 + (num_cpus * 2) connections per process (usually ~10-18 per worker)
//
// Explicitly set here for predictability across environments.

const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

const prismaClientSingleton = () => {
    const baseClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        datasources: { db: { url: process.env.DATABASE_URL } },
    });

    // RLS Extension
    return baseClient.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    const store = asyncLocalStorage.getStore();
                    const userId = store?.userId;
                    
                    if (userId) {
                        const [, result] = await baseClient.$transaction([
                            baseClient.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`,
                            query(args),
                        ]);
                        return result;
                    }
                    
                    return query(args);
                },
            },
        },
    });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = { prisma, asyncLocalStorage };

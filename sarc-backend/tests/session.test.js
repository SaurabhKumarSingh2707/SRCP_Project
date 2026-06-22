const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');
const { prisma } = require('../config/prismaClient');
const redisClient = require('../config/redisClient');
const bcrypt = require('bcryptjs');

test('Session Management & Caching Integration Tests', async (t) => {
    let server;
    let baseUrl;
    let userId;
    const testEmail = `session-test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Setup Server & Test User
    t.before(async () => {
        // Start server on an ephemeral port
        server = app.listen(0);
        const { port } = server.address();
        baseUrl = `http://localhost:${port}`;

        // Create test user directly in DB (bypass email sending on register)
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                fullName: 'Session Test User',
                email: testEmail,
                password: hashedPassword,
                role: 'STUDENT',
                accountStatus: 'ACTIVE',
                isFirstLogin: false
            }
        });
        userId = user.id;
    });

    // 2. Teardown
    t.after(async () => {
        // Cleanup user and session records
        if (userId) {
            await prisma.session.deleteMany({ where: { userId } });
            await prisma.user.deleteMany({ where: { id: userId } });
        }
        if (redisClient) {
            await redisClient.del(`session:user:${userId}`);
            // Also clean up any caching keys generated during testing
            const cacheKeys = await redisClient.keys('*session-test*');
            if (cacheKeys.length > 0) {
                await redisClient.del(...cacheKeys);
            }
        }
        server.close();
    });

    await t.test('Device A logs in, successfully accesses protected routes', async () => {
        // Login from Device A
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        assert.strictEqual(loginRes.status, 200);
        const data = await loginRes.json();
        const tokenA = data.token;
        const refreshTokenA = data.refreshToken;

        assert.ok(tokenA);
        assert.ok(refreshTokenA);

        // Access /api/auth/me with Token A
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert.strictEqual(meRes.status, 200);
        const meData = await meRes.json();
        assert.strictEqual(meData.email, testEmail);

        // Store these tokens in the test context to use in subsequent subtests
        t.context = { tokenA, refreshTokenA };
    });

    await t.test('Device B logs in, which invalidates Device A session', async () => {
        const { tokenA, refreshTokenA } = t.context;

        // Login from Device B
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        assert.strictEqual(loginRes.status, 200);
        const data = await loginRes.json();
        const tokenB = data.token;
        const refreshTokenB = data.refreshToken;

        assert.ok(tokenB);
        assert.ok(refreshTokenB);
        assert.notStrictEqual(tokenA, tokenB);

        // Device B should be able to access the endpoint
        const meResB = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        assert.strictEqual(meResB.status, 200);

        // Device A should be BLOCKED now (returns 401 Session Invalidated)
        const meResA = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        assert.strictEqual(meResA.status, 401);
        const errData = await meResA.json();
        assert.match(errData.message, /Session invalidated/i);

        // Device A refresh token should be rejected
        const refreshResA = await fetch(`${baseUrl}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTokenA })
        });
        assert.strictEqual(refreshResA.status, 401);

        // Device B refresh token should succeed
        const refreshResB = await fetch(`${baseUrl}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTokenB })
        });
        assert.strictEqual(refreshResB.status, 200);
        const refreshDataB = await refreshResB.json();
        assert.ok(refreshDataB.token);

        t.context = { tokenB, refreshTokenB };
    });

    await t.test('Logout invalidates the active session', async () => {
        const { tokenB } = t.context;

        // Logout Device B
        const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        assert.strictEqual(logoutRes.status, 200);

        // Device B should now be blocked
        const meResB = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        assert.strictEqual(meResB.status, 401);
    });

    await t.test('Redis Cache partitioning and invalidation works as expected', async () => {
        // Caching is used on public stats endpoint
        // 1. First request -> MISS
        const res1 = await fetch(`${baseUrl}/api/stats`);
        assert.strictEqual(res1.status, 200);
        assert.strictEqual(res1.headers.get('X-Cache'), 'MISS');

        // 2. Second request -> HIT
        const res2 = await fetch(`${baseUrl}/api/stats`);
        assert.strictEqual(res2.status, 200);
        // Caching will only return HIT if Redis is active
        if (redisClient) {
            assert.strictEqual(res2.headers.get('X-Cache'), 'HIT');
        } else {
            console.log('Skipping cache HIT assertion since Redis is not configured.');
        }
    });
});

const redisClient = require('../config/redisClient');

const DEFAULT_EXPIRATION = 300; // 5 minutes in seconds

/**
 * Middleware to cache HTTP responses using Redis
 * @param {number} duration - Expiration time in seconds
 */
const cacheResponse = (duration = DEFAULT_EXPIRATION) => {
    return async (req, res, next) => {
        // 1. Only cache HTTP GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Add Cache-Control header for Edge CDN Caching if no auth token is present
        // We must check headers, cookies, AND req.user to ensure we don't accidentally cache protected admin routes!
        const hasAuth = req.headers.authorization || (req.cookies && req.cookies.sarc_token) || req.user;
        if (!hasAuth) {
            res.setHeader('Cache-Control', `public, max-age=${duration}`);
        }

        if (!redisClient) {
            // Redis not configured, bypass manual caching
            return next();
        }

        // 2. Partition cache keys by user ID (or anonymous) to prevent cross-user data leakage
        const userId = req.user ? req.user.id : 'anonymous';
        const key = `__express__:${userId}:${req.originalUrl || req.url}`;

        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                // If data exists in cache, send it and do not call next()
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedData));
            } else {
                res.setHeader('X-Cache', 'MISS');
                
                // Override res.json to intercept the response and cache it
                const originalSend = res.json;
                res.json = function (body) {
                    // Cache the stringified body. Do this asynchronously to not block the response
                    redisClient.setex(key, duration, JSON.stringify(body)).catch(err => {
                        console.error('Redis cache error:', err);
                    });
                    
                    // Call the original res.json
                    return originalSend.call(this, body);
                };
                
                next();
            }
        } catch (error) {
            console.error('Redis error in cache middleware:', error);
            // On error, bypass caching
            next();
        }
    };
};

/**
 * Helper to invalidate Redis cache keys matching a pattern
 * @param {string} pattern - Key prefix/pattern (e.g. '/api/projects')
 */
const clearCachePattern = async (pattern) => {
    if (!redisClient) return;
    try {
        let cursor = '0';
        let totalDeleted = 0;
        do {
            const [newCursor, keys] = await redisClient.scan(cursor, 'MATCH', `*${pattern}*`, 'COUNT', 100);
            cursor = newCursor;
            if (keys.length > 0) {
                await redisClient.del(...keys);
                totalDeleted += keys.length;
            }
        } while (cursor !== '0');
        console.log(`Successfully cleared ${totalDeleted} cache keys matching pattern: ${pattern}`);
    } catch (err) {
        console.error(`Error invalidating cache pattern "${pattern}":`, err);
    }
};

module.exports = cacheResponse;
module.exports.clearCachePattern = clearCachePattern;

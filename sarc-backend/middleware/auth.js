const jwt = require('jsonwebtoken');
const { prisma, asyncLocalStorage } = require('../config/prismaClient');
const redisClient = require('../config/redisClient');

const authMiddleware = async (req, res, next) => {
    // Get token from cookie or header
    const token = req.cookies?.sarc_token || req.header('Authorization')?.replace('Bearer ', '');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token with clock tolerance to prevent "issued in future" errors on serverless functions
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { clockTolerance: 30 });
        req.user = decoded.user;

        // Verify sessionId is present in token
        if (!req.user || !req.user.sessionId) {
            return res.status(401).json({ message: 'Session is not valid. Please log in again.' });
        }

        // Retrieve active session ID
        let activeSessionId = null;
        if (redisClient) {
            try {
                activeSessionId = await redisClient.get(`session:user:${req.user.id}`);
            } catch (err) {
                console.error('Redis error in auth middleware:', err);
            }
        }

        if (!activeSessionId) {
            const dbSession = await prisma.session.findUnique({
                where: { userId: req.user.id }
            });
            activeSessionId = dbSession?.id;

            // Backfill Redis if session exists
            if (activeSessionId && redisClient) {
                try {
                    await redisClient.set(`session:user:${req.user.id}`, activeSessionId, 'EX', 30 * 24 * 60 * 60);
                } catch (err) {
                    console.error('Redis backfill error in auth middleware:', err);
                }
            }
        }

        // Compare session IDs
        if (!activeSessionId || activeSessionId !== req.user.sessionId) {
            return res.status(401).json({ 
                message: 'Session invalidated. Your account has been logged in from another device.' 
            });
        }

        // Wrap the rest of the request in the AsyncLocalStorage context
        asyncLocalStorage.run({ userId: req.user.id }, () => {
            next();
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
            return res.status(401).json({ message: 'Token is not valid or expired' });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

authMiddleware.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

module.exports = authMiddleware;

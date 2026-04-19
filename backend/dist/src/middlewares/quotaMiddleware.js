"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaMiddleware = void 0;
const quotaService_1 = require("../services/quotaService");
const planConfig_1 = require("../config/planConfig");
/**
 * DB-based Quota Enforcement Middleware
 * No longer requires Redis
 */
const quotaMiddleware = async (req, res, next) => {
    if (!req.apiKey) {
        return res.status(401).json({ error: 'API Key not authenticated' });
    }
    const { id: apiKeyId } = req.apiKey;
    const planType = req.apiKey.user.planType || 'FREE';
    const planConfig = (0, planConfig_1.getPlanConfig)(planType);
    try {
        // 1. Get current usage directly from DB
        const currentUsage = await (0, quotaService_1.getDailyUsage)(apiKeyId);
        const limit = planConfig.dailyRequests;
        const remaining = Math.max(0, limit - (currentUsage + 1));
        // 2. Set Headers
        const now = new Date();
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        const resetTime = Math.floor(endOfDay.getTime() / 1000);
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', resetTime.toString());
        // 3. Enforce Limit
        if (currentUsage >= limit) {
            return res.status(429).json({
                error: 'Quota Exceeded',
                message: `You have reached your limit of ${limit} requests for the ${planType} plan.`,
                retryAfter: resetTime
            });
        }
        next();
    }
    catch (error) {
        console.error('Quota Error:', error);
        next();
    }
};
exports.quotaMiddleware = quotaMiddleware;

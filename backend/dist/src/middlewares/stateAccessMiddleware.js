"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateAccessMiddleware = void 0;
const planConfig_1 = require("../config/planConfig");
const db_1 = __importDefault(require("../config/db"));
/**
 * DB-based State Access Control
 * Restricts unique states accessed per day based on plan
 */
const stateAccessMiddleware = async (req, res, next) => {
    if (!req.apiKey) {
        return res.status(401).json({ error: 'API Key not authenticated' });
    }
    const { userId } = req.apiKey;
    const planType = req.apiKey.user.planType || 'FREE';
    const stateIdParam = req.params.stateId;
    if (stateIdParam) {
        const stateId = parseInt(stateIdParam, 10);
        const plan = (0, planConfig_1.getPlanConfig)(planType);
        if (plan.maxStates !== -1) {
            try {
                // 1. Calculate start of today (UTC)
                const now = new Date();
                const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
                // 2. Find unique state IDs accessed today by this user across all their API keys
                // We look for endpoints matching the state district lookup pattern
                const logs = await db_1.default.apiLog.findMany({
                    where: {
                        apiKey: { userId },
                        createdAt: { gte: startOfDay },
                        endpoint: { contains: '/districts' }
                    },
                    select: { endpoint: true }
                });
                // 3. Extract state IDs from URLs (e.g., /api/v1/states/1/districts)
                const accessedStateIds = new Set();
                logs.forEach(log => {
                    const match = log.endpoint.match(/\/states\/(\d+)\//);
                    if (match)
                        accessedStateIds.add(match[1]);
                });
                // Add the current request's state ID
                accessedStateIds.add(stateId.toString());
                if (accessedStateIds.size > plan.maxStates) {
                    return res.status(403).json({
                        error: 'Plan State Limit Exceeded',
                        message: `Your ${planType} plan only allows access to ${plan.maxStates} unique state(s) per day.`
                    });
                }
            }
            catch (error) {
                console.error('⚠️ State Access System Error:', error);
                // Pass through in case of system error to ensure availability
            }
        }
    }
    next();
};
exports.stateAccessMiddleware = stateAccessMiddleware;

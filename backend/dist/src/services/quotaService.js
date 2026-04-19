"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyUsage = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * High-performance, DB-only Quota Tracking
 * Counts today's logs directly from PostgreSQL/SQLite
 */
const getDailyUsage = async (apiKeyId) => {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    try {
        return await db_1.default.apiLog.count({
            where: {
                apiKeyId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
    }
    catch (error) {
        console.error('❌ Database usage count failed:', error);
        return 0;
    }
};
exports.getDailyUsage = getDailyUsage;

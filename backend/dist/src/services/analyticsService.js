"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const db_1 = __importDefault(require("../config/db"));
class AnalyticsService {
    /**
     * Get total requests, success rate, and average latency
     */
    async getSummary(userId, apiKeyId, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            createdAt: { gte: startDate },
            apiKey: { userId }
        };
        if (apiKeyId)
            where.apiKeyId = apiKeyId;
        const [totalRequests, successRequests, avgLatency, stateCount, districtCount, villageCount] = await Promise.all([
            db_1.default.apiLog.count({ where }),
            db_1.default.apiLog.count({ where: { ...where, status: { lt: 400 } } }),
            db_1.default.apiLog.aggregate({
                where,
                _avg: { latency: true }
            }),
            db_1.default.state.count(),
            db_1.default.district.count(),
            db_1.default.village.count(),
        ]);
        return {
            totalRequests,
            successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0,
            avgLatency: avgLatency._avg.latency || 0,
            totalStates: stateCount,
            totalDistricts: districtCount,
            totalVillages: villageCount,
        };
    }
    /**
     * Get requests grouped by day
     */
    async getRequestsOverTime(userId, apiKeyId, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            createdAt: { gte: startDate },
            apiKey: { userId }
        };
        if (apiKeyId)
            where.apiKeyId = apiKeyId;
        const logs = await db_1.default.apiLog.findMany({
            where,
            select: { createdAt: true, status: true },
            orderBy: { createdAt: 'asc' }
        });
        const grouped = logs.reduce((acc, log) => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!acc[date])
                acc[date] = { date, total: 0, success: 0, error: 0 };
            acc[date].total++;
            if (log.status < 400)
                acc[date].success++;
            else
                acc[date].error++;
            return acc;
        }, {});
        return Object.values(grouped);
    }
    /**
     * Get most used endpoints
     */
    async getTopEndpoints(userId, apiKeyId, limit = 5) {
        const where = { apiKey: { userId } };
        if (apiKeyId)
            where.apiKeyId = apiKeyId;
        const topEndpoints = await db_1.default.apiLog.groupBy({
            by: ['endpoint'],
            where,
            _count: { _all: true },
            orderBy: { _count: { endpoint: 'desc' } },
            take: limit
        });
        return topEndpoints.map(e => ({
            endpoint: e.endpoint,
            count: e._count._all
        }));
    }
    /**
     * Get platform-wide analytics for Admin
     */
    async getPlatformStats() {
        const [totalUsers, totalRequests, planDistribution, activeToday] = await Promise.all([
            db_1.default.user.count(),
            db_1.default.apiLog.count(),
            db_1.default.user.groupBy({
                by: ['planType'],
                _count: { _all: true }
            }),
            db_1.default.apiLog.groupBy({
                by: ['apiKeyId'],
                where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
            })
        ]);
        return {
            totalUsers,
            totalRequests,
            activeUsersToday: activeToday.length,
            planDistribution: planDistribution.map(p => ({
                plan: p.planType,
                count: p._count._all
            }))
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();

import prisma from "../config/db";

export class AnalyticsService {
  /**
   * Get total requests, success rate, and average latency
   */
  async getSummary(userId: string, apiKeyId?: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
      apiKey: { userId }
    };
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const [totalRequests, successRequests, avgLatency, stateCount, districtCount, villageCount] = await Promise.all([
      prisma.apiLog.count({ where }),
      prisma.apiLog.count({ where: { ...where, status: { lt: 400 } } }),
      prisma.apiLog.aggregate({
        where,
        _avg: { latency: true }
      }),
      prisma.state.count(),
      prisma.district.count(),
      prisma.village.count(),
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
  async getRequestsOverTime(userId: string, apiKeyId?: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
      apiKey: { userId }
    };
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const logs = await prisma.apiLog.findMany({
      where,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = logs.reduce((acc: any, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, total: 0, success: 0, error: 0 };
      acc[date].total++;
      if (log.status < 400) acc[date].success++;
      else acc[date].error++;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Get most used endpoints
   */
  async getTopEndpoints(userId: string, apiKeyId?: string, limit: number = 5) {
    const where: any = { apiKey: { userId } };
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const topEndpoints = await prisma.apiLog.groupBy({
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
      prisma.user.count(),
      prisma.apiLog.count(),
      prisma.user.groupBy({
        by: ['planType'],
        _count: { _all: true }
      }),
      prisma.apiLog.groupBy({
        by: ['apiKeyId'],
        where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
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

export const analyticsService = new AnalyticsService();

import prisma from "../config/db";

/**
 * High-performance, DB-only Quota Tracking
 * Counts today's logs directly from PostgreSQL/SQLite
 */
export const getDailyUsage = async (apiKeyId: string): Promise<number> => {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  try {
    return await prisma.apiLog.count({
      where: {
        apiKeyId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  } catch (error) {
    console.error('❌ Database usage count failed:', error);
    return 0;
  }
};

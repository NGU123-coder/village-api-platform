import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from './apiKeyMiddleware';
import { getDailyUsage } from '../services/quotaService';
import { getPlanConfig } from '../config/planConfig';

/**
 * DB-based Quota Enforcement Middleware
 * No longer requires Redis
 */
export const quotaMiddleware = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey) {
    return res.status(401).json({ error: 'API Key not authenticated' });
  }

  const { id: apiKeyId } = req.apiKey;
  const planType = req.apiKey.user.planType || 'FREE';
  const planConfig = getPlanConfig(planType);

  try {
    // 1. Get current usage directly from DB
    const currentUsage = await getDailyUsage(apiKeyId);
    
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
  } catch (error) {
    console.error('Quota Error:', error);
    next(); 
  }
};

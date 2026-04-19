import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from './apiKeyMiddleware';
import { getPlanConfig } from '../config/planConfig';
import prisma from '../config/db';

/**
 * DB-based State Access Control
 * Restricts unique states accessed per day based on plan
 */
export const stateAccessMiddleware = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey) {
    return res.status(401).json({ error: 'API Key not authenticated' });
  }

  const { userId } = req.apiKey;
  const planType = req.apiKey.user.planType || 'FREE';
  const stateIdParam = req.params.stateId;

  if (stateIdParam) {
    const stateId = parseInt(stateIdParam as string, 10);
    const plan = getPlanConfig(planType);

    if (plan.maxStates !== -1) {
        try {
          // 1. Calculate start of today (UTC)
          const now = new Date();
          const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

          // 2. Find unique state IDs accessed today by this user across all their API keys
          // We look for endpoints matching the state district lookup pattern
          const logs = await prisma.apiLog.findMany({
            where: {
              apiKey: { userId },
              createdAt: { gte: startOfDay },
              endpoint: { contains: '/districts' }
            },
            select: { endpoint: true }
          });

          // 3. Extract state IDs from URLs (e.g., /api/v1/states/1/districts)
          const accessedStateIds = new Set<string>();
          logs.forEach(log => {
             const match = log.endpoint.match(/\/states\/(\d+)\//);
             if (match) accessedStateIds.add(match[1]);
          });

          // Add the current request's state ID
          accessedStateIds.add(stateId.toString());
          
          if (accessedStateIds.size > plan.maxStates) {
            return res.status(403).json({
              error: 'Plan State Limit Exceeded',
              message: `Your ${planType} plan only allows access to ${plan.maxStates} unique state(s) per day.`
            });
          }
        } catch (error) {
          console.error('⚠️ State Access System Error:', error);
          // Pass through in case of system error to ensure availability
        }
    }
  }

  next();
};

export type PlanType = 'FREE' | 'PREMIUM' | 'PRO' | 'UNLIMITED';

export interface PlanConfig {
  dailyRequests: number;
  maxStates: number; // -1 for unlimited
}

export const PLAN_LIMITS: Record<string, PlanConfig> = {
  FREE: { dailyRequests: 5000, maxStates: 1 },
  PREMIUM: { dailyRequests: 50000, maxStates: 5 },
  PRO: { dailyRequests: 300000, maxStates: -1 },
  UNLIMITED: { dailyRequests: 1000000, maxStates: -1 },
};

export const getPlanConfig = (planType: string): PlanConfig => {
  const plan = planType.toUpperCase();
  return PLAN_LIMITS[plan] || PLAN_LIMITS['FREE'];
};

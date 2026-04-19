"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanConfig = exports.PLAN_LIMITS = void 0;
exports.PLAN_LIMITS = {
    FREE: { dailyRequests: 5000, maxStates: 1 },
    PREMIUM: { dailyRequests: 50000, maxStates: 5 },
    PRO: { dailyRequests: 300000, maxStates: -1 },
    UNLIMITED: { dailyRequests: 1000000, maxStates: -1 },
};
const getPlanConfig = (planType) => {
    const plan = planType.toUpperCase();
    return exports.PLAN_LIMITS[plan] || exports.PLAN_LIMITS['FREE'];
};
exports.getPlanConfig = getPlanConfig;

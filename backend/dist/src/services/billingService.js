"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingService = exports.BillingService = exports.PLANS = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.PLANS = {
    FREE: { id: 'FREE', name: 'Free', price: 0 },
    PREMIUM: { id: 'PREMIUM', name: 'Premium', price: 49 },
    PRO: { id: 'PRO', name: 'Professional', price: 199 },
    UNLIMITED: { id: 'UNLIMITED', name: 'Unlimited', price: 499 },
};
class BillingService {
    async checkout(userId, planType) {
        const plan = exports.PLANS[planType.toUpperCase()];
        if (!plan)
            throw new Error('Invalid plan type');
        // 1. Create a pending payment
        const payment = await db_1.default.payment.create({
            data: {
                userId,
                amount: plan.price,
                plan: planType,
                status: 'PENDING',
            },
        });
        // 2. Simulate payment processing (delay)
        await new Promise(resolve => setTimeout(resolve, 1500));
        // 3. Update payment to success
        await db_1.default.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS' },
        });
        // 4. Update user's plan
        const planEndDate = new Date();
        planEndDate.setDate(planEndDate.getDate() + 30); // 30-day subscription
        return await db_1.default.user.update({
            where: { id: userId },
            data: {
                planType: plan.id,
                planStartDate: new Date(),
                planEndDate: planEndDate,
                isActive: true,
            },
        });
    }
    async downgrade(userId, targetPlan = 'FREE') {
        // For this simulation, downgrade is immediate. 
        // In production, we'd usually schedule it for the end of the current cycle.
        return await db_1.default.user.update({
            where: { id: userId },
            data: {
                planType: targetPlan.toUpperCase(),
                // We keep the end date but change the type for immediate quota effect
            },
        });
    }
    async checkSubscriptionExpiry(userId) {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { planType: true, planEndDate: true },
        });
        if (user?.planType !== 'FREE' && user?.planEndDate && new Date() > user.planEndDate) {
            // Plan expired, fallback to FREE
            await db_1.default.user.update({
                where: { id: userId },
                data: { planType: 'FREE', isActive: true },
            });
            return true; // Expired
        }
        return false; // Valid
    }
    async getAllPayments() {
        return await db_1.default.payment.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.BillingService = BillingService;
exports.billingService = new BillingService();

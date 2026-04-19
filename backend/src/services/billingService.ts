import prisma from "../config/db";

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
}

export const PLANS: Record<string, PlanDetails> = {
  FREE: { id: 'FREE', name: 'Free', price: 0 },
  PREMIUM: { id: 'PREMIUM', name: 'Premium', price: 49 },
  PRO: { id: 'PRO', name: 'Professional', price: 199 },
  UNLIMITED: { id: 'UNLIMITED', name: 'Unlimited', price: 499 },
};

export class BillingService {
  async checkout(userId: string, planType: string) {
    const plan = PLANS[planType.toUpperCase()];
    if (!plan) throw new Error('Invalid plan type');

    // 1. Create a pending payment
    const payment = await prisma.payment.create({
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
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS' },
    });

    // 4. Update user's plan
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + 30); // 30-day subscription

    return await prisma.user.update({
      where: { id: userId },
      data: {
        planType: plan.id,
        planStartDate: new Date(),
        planEndDate: planEndDate,
        isActive: true,
      },
    });
  }

  async downgrade(userId: string, targetPlan: string = 'FREE') {
    // For this simulation, downgrade is immediate. 
    // In production, we'd usually schedule it for the end of the current cycle.
    return await prisma.user.update({
      where: { id: userId },
      data: {
        planType: targetPlan.toUpperCase(),
        // We keep the end date but change the type for immediate quota effect
      },
    });
  }

  async checkSubscriptionExpiry(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, planEndDate: true },
    });

    if (user?.planType !== 'FREE' && user?.planEndDate && new Date() > user.planEndDate) {
      // Plan expired, fallback to FREE
      await prisma.user.update({
        where: { id: userId },
        data: { planType: 'FREE', isActive: true },
      });
      return true; // Expired
    }
    return false; // Valid
  }

  async getAllPayments() {
    return await prisma.payment.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const billingService = new BillingService();

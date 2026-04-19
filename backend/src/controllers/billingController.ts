import { Request, Response } from 'express';
import { billingService } from '../services/billingService';

export const checkout = async (req: any, res: Response) => {
  try {
    const { planType } = req.body;
    if (!planType) return res.status(400).json({ error: 'Plan type is required' });

    const updatedUser = await billingService.checkout(req.user.userId, planType);
    
    res.json({
        message: 'Subscription successful',
        user: {
            planType: updatedUser.planType,
            planEndDate: updatedUser.planEndDate
        }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
};

export const downgrade = async (req: any, res: Response) => {
    try {
      const { planType } = req.body;
      const updatedUser = await billingService.downgrade(req.user.userId, planType || 'FREE');
      res.json({ message: 'Plan downgraded', plan: updatedUser.planType });
    } catch (error) {
      res.status(500).json({ error: 'Downgrade failed' });
    }
};

export const getPaymentHistory = async (req: any, res: Response) => {
    try {
        const payments = await billingService.getAllPayments();
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

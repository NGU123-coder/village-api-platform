import { Request, Response } from 'express';
import { billingService } from '../services/billingService';

export const checkout = async (req: any, res: Response) => {
  try {
    const { planType } = req.body;
    if (!planType) return res.status(400).json({ success: false, message: 'Plan type is required' });

    const updatedUser = await billingService.checkout(req.user.userId, planType);
    
    res.json({
        success: true,
        data: {
            message: 'Subscription successful',
            user: {
                planType: updatedUser.planType,
                planEndDate: updatedUser.planEndDate
            }
        }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Payment processing failed' });
  }
};

export const downgrade = async (req: any, res: Response) => {
    try {
      const { planType } = req.body;
      const updatedUser = await billingService.downgrade(req.user.userId, planType || 'FREE');
      res.json({ 
        success: true,
        data: { message: 'Plan downgraded', plan: updatedUser.planType } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Downgrade failed' });
    }
};

export const getPaymentHistory = async (req: any, res: Response) => {
    try {
        const payments = await billingService.getAllPayments(req.user.userId);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
};

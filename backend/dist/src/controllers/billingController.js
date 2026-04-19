"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentHistory = exports.downgrade = exports.checkout = void 0;
const billingService_1 = require("../services/billingService");
const checkout = async (req, res) => {
    try {
        const { planType } = req.body;
        if (!planType)
            return res.status(400).json({ error: 'Plan type is required' });
        const updatedUser = await billingService_1.billingService.checkout(req.user.userId, planType);
        res.json({
            message: 'Subscription successful',
            user: {
                planType: updatedUser.planType,
                planEndDate: updatedUser.planEndDate
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Payment processing failed' });
    }
};
exports.checkout = checkout;
const downgrade = async (req, res) => {
    try {
        const { planType } = req.body;
        const updatedUser = await billingService_1.billingService.downgrade(req.user.userId, planType || 'FREE');
        res.json({ message: 'Plan downgraded', plan: updatedUser.planType });
    }
    catch (error) {
        res.status(500).json({ error: 'Downgrade failed' });
    }
};
exports.downgrade = downgrade;
const getPaymentHistory = async (req, res) => {
    try {
        const payments = await billingService_1.billingService.getAllPayments();
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};
exports.getPaymentHistory = getPaymentHistory;

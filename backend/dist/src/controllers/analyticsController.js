"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStats = exports.getTopEndpoints = exports.getRequestsOverTime = exports.getSummary = void 0;
const analyticsService_1 = require("../services/analyticsService");
const getSummary = async (req, res) => {
    try {
        const { apiKeyId, days } = req.query;
        const stats = await analyticsService_1.analyticsService.getSummary(req.user.userId, apiKeyId, days ? parseInt(days) : 7);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
};
exports.getSummary = getSummary;
const getRequestsOverTime = async (req, res) => {
    try {
        const { apiKeyId, days } = req.query;
        const stats = await analyticsService_1.analyticsService.getRequestsOverTime(req.user.userId, apiKeyId, days ? parseInt(days) : 7);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch usage trends' });
    }
};
exports.getRequestsOverTime = getRequestsOverTime;
const getTopEndpoints = async (req, res) => {
    try {
        const { apiKeyId, limit } = req.query;
        const stats = await analyticsService_1.analyticsService.getTopEndpoints(req.user.userId, apiKeyId, limit ? parseInt(limit) : 5);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch top endpoints' });
    }
};
exports.getTopEndpoints = getTopEndpoints;
const getPlatformStats = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const stats = await analyticsService_1.analyticsService.getPlatformStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch platform stats' });
    }
};
exports.getPlatformStats = getPlatformStats;

import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

export const getSummary = async (req: any, res: Response) => {
  try {
    const { apiKeyId, days } = req.query;
    const stats = await analyticsService.getSummary(
      req.user.userId, 
      apiKeyId as string, 
      days ? parseInt(days as string) : 7
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics summary' });
  }
};

export const getRequestsOverTime = async (req: any, res: Response) => {
  try {
    const { apiKeyId, days } = req.query;
    const stats = await analyticsService.getRequestsOverTime(
      req.user.userId, 
      apiKeyId as string, 
      days ? parseInt(days as string) : 7
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch usage trends' });
  }
};

export const getTopEndpoints = async (req: any, res: Response) => {
  try {
    const { apiKeyId, limit } = req.query;
    const stats = await analyticsService.getTopEndpoints(
      req.user.userId, 
      apiKeyId as string, 
      limit ? parseInt(limit as string) : 5
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch top endpoints' });
  }
};

export const getPlatformStats = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const stats = await analyticsService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
  }
};

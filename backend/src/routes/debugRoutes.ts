import { Router } from 'express';
import prisma from '../config/db';

const router = Router();

router.get('/connection-test', async (req, res) => {
  try {
    const stateCount = await prisma.state.count();
    const userCount = await prisma.user.count();
    const apiKeyCount = await prisma.apiKey.count();
    
    res.json({
      success: true,
      message: "Backend is healthy and connected to DB",
      database: {
        states: stateCount,
        users: userCount,
        apiKeys: apiKeyCount
      },
      requestHeaders: req.headers,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasFrontendUrl: !!process.env.FRONTEND_URL
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;

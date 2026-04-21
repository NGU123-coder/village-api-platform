import { Router } from 'express';
import prisma from '../config/db';

const router = Router();

router.get('/connection-test', async (req, res) => {
  try {
    const [stateCount, districtCount, subDistrictCount, villageCount, userCount, apiKeyCount] = await Promise.all([
      prisma.state.count(),
      prisma.district.count(),
      prisma.subDistrict.count(),
      prisma.village.count(),
      prisma.user.count(),
      prisma.apiKey.count()
    ]);
    
    res.json({
      success: true,
      message: "Backend is healthy and connected to DB",
      database: {
        states: stateCount,
        districts: districtCount,
        subDistricts: subDistrictCount,
        villages: villageCount,
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

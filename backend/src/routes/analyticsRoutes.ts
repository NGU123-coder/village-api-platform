import { Router } from 'express';
import { 
  getSummary, 
  getRequestsOverTime, 
  getTopEndpoints, 
  getPlatformStats 
} from '../controllers/analyticsController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticateJWT);

router.get('/summary', getSummary);
router.get('/requests-over-time', getRequestsOverTime);
router.get('/top-endpoints', getTopEndpoints);

// Admin only route
router.get('/platform', getPlatformStats);

export default router;

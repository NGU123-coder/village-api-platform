import { Router } from 'express';
import { checkout, downgrade, getPaymentHistory } from '../controllers/billingController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/checkout', checkout);
router.post('/downgrade', downgrade);

// Admin or Self (for simplicity, only exposing to all auth users here)
router.get('/history', getPaymentHistory);

export default router;

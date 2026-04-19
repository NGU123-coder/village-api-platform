import { Router } from 'express';
import { getApiKeys, createApiKey, deleteApiKey } from '../controllers/clientController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/api-keys', getApiKeys);
router.post('/api-keys', createApiKey);
router.delete('/api-keys/:id', deleteApiKey);

export default router;

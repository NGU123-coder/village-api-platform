import { Router } from 'express';
import { 
  getStates, 
  getDistrictsByState, 
  getSubDistrictsByDistrict, 
  getVillagesBySubDistrict,
  getVillages,
  autocomplete
} from '../controllers/geoController';
import { authenticateApiKey } from '../middlewares/apiKeyMiddleware';
import { quotaMiddleware } from '../middlewares/quotaMiddleware';
import { stateAccessMiddleware } from '../middlewares/stateAccessMiddleware';

const router = Router();

// Secure all geo routes with API Key and Quota Enforcement
router.use(authenticateApiKey);
router.use(quotaMiddleware);

/**
 * Geographical Data Routes
 */

// 1. Get all states
router.get('/states', getStates);

// 2. Get districts by stateId
router.get('/states/:stateId/districts', stateAccessMiddleware, getDistrictsByState);

// 3. Get sub-districts by districtId
router.get('/districts/:districtId/subdistricts', getSubDistrictsByDistrict);

// 4. Get villages by subDistrictId (with pagination)
router.get('/subdistricts/:subDistrictId/villages', getVillagesBySubDistrict);

// 5. High-performance autocomplete search
router.get('/autocomplete', autocomplete);

// Global village search/list
router.get('/villages', getVillages);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geoController_1 = require("../controllers/geoController");
const apiKeyMiddleware_1 = require("../middlewares/apiKeyMiddleware");
const quotaMiddleware_1 = require("../middlewares/quotaMiddleware");
const stateAccessMiddleware_1 = require("../middlewares/stateAccessMiddleware");
const router = (0, express_1.Router)();
// Secure all geo routes with API Key and Quota Enforcement
router.use(apiKeyMiddleware_1.authenticateApiKey);
router.use(quotaMiddleware_1.quotaMiddleware);
/**
 * Geographical Data Routes
 */
// 1. Get all states
router.get('/states', geoController_1.getStates);
// 2. Get districts by stateId
router.get('/states/:stateId/districts', stateAccessMiddleware_1.stateAccessMiddleware, geoController_1.getDistrictsByState);
// 3. Get sub-districts by districtId
router.get('/districts/:districtId/subdistricts', geoController_1.getSubDistrictsByDistrict);
// 4. Get villages by subDistrictId (with pagination)
router.get('/subdistricts/:subDistrictId/villages', geoController_1.getVillagesBySubDistrict);
// 5. High-performance autocomplete search
router.get('/autocomplete', geoController_1.autocomplete);
// Global village search/list
router.get('/villages', geoController_1.getVillages);
exports.default = router;

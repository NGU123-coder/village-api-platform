"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geoController_1 = require("../controllers/geoController");
const apiKeyMiddleware_1 = require("../middlewares/apiKeyMiddleware");
const router = (0, express_1.Router)();
// Secure all geo routes with API Key
router.use(apiKeyMiddleware_1.authenticateApiKey);
router.get('/states', geoController_1.getStates);
router.get('/states/:stateId/districts', geoController_1.getDistrictsByState);
router.get('/districts/:districtId/sub-districts', geoController_1.getSubDistrictsByDistrict);
router.get('/sub-districts/:subDistrictId/villages', geoController_1.getVillagesBySubDistrict);
exports.default = router;

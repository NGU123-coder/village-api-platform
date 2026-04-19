"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// All analytics routes require authentication
router.use(authMiddleware_1.authenticateJWT);
router.get('/summary', analyticsController_1.getSummary);
router.get('/requests-over-time', analyticsController_1.getRequestsOverTime);
router.get('/top-endpoints', analyticsController_1.getTopEndpoints);
// Admin only route
router.get('/platform', analyticsController_1.getPlatformStats);
exports.default = router;

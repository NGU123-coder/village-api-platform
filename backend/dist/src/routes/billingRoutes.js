"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billingController_1 = require("../controllers/billingController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateJWT);
router.post('/checkout', billingController_1.checkout);
router.post('/downgrade', billingController_1.downgrade);
// Admin or Self (for simplicity, only exposing to all auth users here)
router.get('/history', billingController_1.getPaymentHistory);
exports.default = router;

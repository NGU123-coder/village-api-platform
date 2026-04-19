"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
exports.prisma = db_1.default;
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const geoRoutes_1 = __importDefault(require("./routes/geoRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const billingRoutes_1 = __importDefault(require("./routes/billingRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json());
// Production CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL, // Deployed frontend
    'http://localhost:5173', // Local development
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('combined')); // Better logging for production
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/client', clientRoutes_1.default);
// CRITICAL FIX: Mount analytics BEFORE general v1 routes 
// to prevent API Key middleware from intercepting JWT-based analytics requests.
app.use('/api/v1/analytics', analyticsRoutes_1.default);
app.use('/api/v1/billing', billingRoutes_1.default);
app.use('/api/v1', geoRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.send('All India Village API Platform');
});
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Start server
const start = async () => {
    try {
        app.listen(port, () => {
            console.log(`✅ Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
start();

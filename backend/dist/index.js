"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const redis_1 = __importDefault(require("redis"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const geoRoutes_1 = __importDefault(require("./routes/geoRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Redis setup (Optional for now, will integrate fully later)
const redisClient = redis_1.default.createClient({
    url: process.env.REDIS_URL
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => console.log('Redis Client Error', err));
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/client', clientRoutes_1.default);
app.use('/api/v1', geoRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Root route
app.get('/', (req, res) => {
    res.send('All India Village API Platform');
});
// Start server
const start = async () => {
    try {
        // await redisClient.connect();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
start();

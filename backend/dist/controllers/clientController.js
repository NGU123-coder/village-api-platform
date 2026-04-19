"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApiKey = exports.createApiKey = exports.getApiKeys = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getApiKeys = async (req, res) => {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(keys);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
};
exports.getApiKeys = getApiKeys;
const createApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        const secret = crypto_1.default.randomBytes(32).toString('hex');
        const hash = await bcryptjs_1.default.hash(secret, 10);
        const apiKey = await prisma.apiKey.create({
            data: {
                name: name || 'Default Key',
                keyHash: hash,
                userId: req.user.userId,
            },
        });
        // We return key in format `id.secret`
        res.status(201).json({
            message: 'API Key created successfully',
            key: `${apiKey.id}.${secret}`,
            id: apiKey.id,
            name: apiKey.name
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create API key' });
    }
};
exports.createApiKey = createApiKey;
const deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.apiKey.deleteMany({
            where: { id, userId: req.user.userId },
        });
        res.json({ message: 'API Key deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete API key' });
    }
};
exports.deleteApiKey = deleteApiKey;

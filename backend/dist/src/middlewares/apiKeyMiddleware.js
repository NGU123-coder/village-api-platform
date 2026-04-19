"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to authenticate requests using an API Key.
 * Expected format: x-api-key: <id>.<secret>
 */
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API Key is required' });
    }
    const startTime = Date.now();
    try {
        const [keyId, secret] = apiKey.split('.');
        if (!keyId || !secret) {
            return res.status(401).json({ error: 'Invalid API Key format. Expected id.secret' });
        }
        // Find the key record
        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { id: keyId },
            include: { user: { select: { id: true, email: true, role: true, planType: true } } }
        });
        if (!apiKeyRecord || !apiKeyRecord.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive API Key' });
        }
        // Verify the secret against the hash
        const isValid = await bcryptjs_1.default.compare(secret, apiKeyRecord.keyHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid API Key secret' });
        }
        // Attach API key and user info to the request
        req.apiKey = apiKeyRecord;
        // Hook into response finish to log usage
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            prisma.apiLog.create({
                data: {
                    apiKeyId: apiKeyRecord.id,
                    endpoint: req.originalUrl,
                    status: res.statusCode,
                    latency: duration,
                }
            }).catch(err => console.error('Failed to log API usage:', err));
            // Update last used timestamp
            prisma.apiKey.update({
                where: { id: apiKeyRecord.id },
                data: { lastUsedAt: new Date() }
            }).catch(err => console.error('Failed to update last used:', err));
        });
        next();
    }
    catch (error) {
        console.error('API Key Auth Error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
exports.authenticateApiKey = authenticateApiKey;

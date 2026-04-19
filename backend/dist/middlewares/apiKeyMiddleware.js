"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API Key is required' });
    }
    try {
        // Note: In a high-traffic system, we would use Redis to cache keyHash -> userId mapping
        // Here we split the key to get the prefix/id part if we had one, but we are using full hash search
        // For simplicity, we search by hash. For performance, we'd store a hint or prefix.
        // We'll iterate through keys (this is SLOW, for demo purposes). 
        // BETTER: Store key as `prefix.secret`. Store `prefix` in DB as indexed column.
        // For this capstone, we'll assume the user provides a key we can verify.
        // Let's implement a more performant key system: key = uuid + '.' + secret
        const [keyId, secret] = apiKey.split('.');
        if (!keyId || !secret) {
            return res.status(401).json({ error: 'Invalid API Key format' });
        }
        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { id: keyId },
            include: { user: true }
        });
        if (!apiKeyRecord || !apiKeyRecord.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive API Key' });
        }
        const isValid = await bcryptjs_1.default.compare(secret, apiKeyRecord.keyHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }
        // Log the request (Async)
        prisma.apiLog.create({
            data: {
                apiKeyId: apiKeyRecord.id,
                endpoint: req.originalUrl,
                status: 200, // Updated later if needed
                latency: 0 // Placeholder
            }
        }).catch(console.error);
        // Update last used (Async)
        prisma.apiKey.update({
            where: { id: apiKeyRecord.id },
            data: { lastUsedAt: new Date() }
        }).catch(console.error);
        req.apiKey = apiKeyRecord;
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
};
exports.authenticateApiKey = authenticateApiKey;

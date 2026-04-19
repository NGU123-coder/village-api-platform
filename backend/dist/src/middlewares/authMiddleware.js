"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication token missing' });
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired session' });
            }
            req.user = user;
            next();
        });
    }
    else {
        res.status(401).json({ error: 'Authorization header required' });
    }
};
exports.authenticateJWT = authenticateJWT;

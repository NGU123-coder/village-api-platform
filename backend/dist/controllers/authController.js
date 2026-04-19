"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash, role: role || 'CLIENT' },
        });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to login' });
    }
};
exports.login = login;

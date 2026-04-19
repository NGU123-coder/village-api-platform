"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['ADMIN', 'CLIENT']).optional(),
});
const register = async (req, res) => {
    try {
        console.log('Registering user:', req.body.email);
        // 1. Validation
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return res.status(400).json({
                error: firstError?.message || 'Validation failed'
            });
        }
        const { email, password, role } = validation.data;
        // 2. Check if user exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // 3. Hash Password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // 4. Create User
        const user = await db_1.default.user.create({
            data: {
                email,
                passwordHash,
                role: role || 'CLIENT'
            },
        });
        console.log('User created successfully:', user.id);
        // 5. Generate Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    }
    catch (error) {
        console.error('REGISTRATION_ERROR:', error);
        res.status(500).json({
            error: 'Registration failed: ' + (error.message || 'Check database connection'),
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        console.log('Login attempt:', email);
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        console.log('Login successful:', user.email);
        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    }
    catch (error) {
        console.error('LOGIN_ERROR:', error);
        res.status(500).json({
            error: 'Login failed: ' + (error.message || 'Check database connection'),
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.login = login;

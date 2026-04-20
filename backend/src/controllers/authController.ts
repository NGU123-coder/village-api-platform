import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'CLIENT']).optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registering user:', req.body.email);
    
    // 1. Validation
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        success: false,
        message: firstError?.message || 'Validation failed' 
      });
    }

    const { email, password, role } = validation.data;
    
    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 4. Create User
    const user = await prisma.user.create({
      data: { 
        email, 
        passwordHash, 
        role: role || 'CLIENT' 
      },
    });

    console.log('User created successfully:', user.id);

    // 5. Generate Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      success: true,
      data: {
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      }
    });
  } catch (error: any) {
    console.error('REGISTRATION_ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + (error.message || 'Check database connection')
    });
  }
};

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validation
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return res.status(400).json({ 
        success: false,
        message: firstError?.message || 'Validation failed' 
      });
    }

    const { email, password } = validation.data;
    console.log('Login attempt:', email);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('Login successful:', user.email);

    res.json({ 
      success: true,
      data: {
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      }
    });
  } catch (error: any) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed: ' + (error.message || 'Check database connection')
    });
  }
};

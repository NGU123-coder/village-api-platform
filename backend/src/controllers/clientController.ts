import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';

export const getApiKeys = async (req: any, res: Response) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
  }
};

export const createApiKey = async (req: any, res: Response) => {
  try {
    const { name } = req.body;
    const secret = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(secret, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name || 'Default Key',
        keyHash: hash,
        userId: req.user.userId,
      },
    });

    // We return id and secret separately for the one-time display
    res.status(201).json({ 
        success: true,
        data: {
            message: 'API Key created successfully', 
            id: apiKey.id,
            secret: secret,
            name: apiKey.name
        }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create API key' });
  }
};

export const deleteApiKey = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.apiKey.deleteMany({
      where: { id, userId: req.user.userId },
    });
    res.json({ success: true, data: { message: 'API Key deleted successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete API key' });
  }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired session' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header required' });
  }
};

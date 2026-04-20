import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import prisma from './config/db';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import geoRoutes from './routes/geoRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import billingRoutes from './routes/billingRoutes';
import debugRoutes from './routes/debugRoutes';
import { logger } from './utils/logger';

// MANDATORY: Guard against missing environment variables
if (!process.env.DATABASE_URL) {
  logger.error("FATAL: DATABASE_URL is not defined");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// 1. GLOBAL MIDDLEWARE (ORDER IS CRITICAL)
app.set('trust proxy', 1); // Trust Render's proxy for accurate IP tracking

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !isProd) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Request-Id'],
  exposedHeaders: ['x-api-key']
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request Context & Elite Logging
app.use((req: any, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

morgan.token('id', (req: any) => req.requestId);
morgan.token('body', (req: any) => isProd ? '' : JSON.stringify(req.body));

app.use(morgan('[:id] :method :url :status :response-time ms - :body', {
  skip: (req) => req.url.startsWith('/api/v1/health')
}));

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { success: false, message: 'Too many requests.' }
});
app.use('/api/', limiter);

// 3. PUBLIC SYSTEM ROUTES (NO AUTH REQUIRED)
// These must be mounted BEFORE any middleware-protected groups

app.use('/api/v1/debug', debugRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running 🚀' });
});

app.get('/api/v1/health/live', (req, res) => {
  res.status(200).json({ success: true, message: 'Process is alive' });
});

app.get('/api/v1/health/db', async (req: any, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: 'Database connected' });
  } catch (e: any) {
    logger.error('DB Health Check Failed', { requestId: req.requestId, error: e.message });
    res.status(503).json({ success: false, message: 'Database unreachable' });
  }
});

// 4. PROTECTED ROUTES

// A. JWT Protected Routes (User Sessions)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// B. API Key Protected Routes (Core Data)
// The apiKeyMiddleware is usually embedded inside geoRoutes.ts
app.use('/api/v1', geoRoutes);

// 5. Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Village API Platform',
      version: '1.0.0',
      description: 'Comprehensive geographical data API for Indian villages',
    },
    servers: [{ url: isProd ? 'https://village-api-platform.onrender.com' : `http://localhost:${port}` }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 6. 404 & Error Handling
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, req: any, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled request error', {
    requestId: req.requestId,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: isProd ? undefined : err.stack
  });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    requestId: req.requestId,
    message: err.message || 'Internal Server Error'
  });
});

// 7. Start server & Graceful Shutdown
const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`, { env: process.env.NODE_ENV });
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      process.exit(0);
    } catch (err: any) {
      logger.error('Error during graceful shutdown', { error: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { prisma };

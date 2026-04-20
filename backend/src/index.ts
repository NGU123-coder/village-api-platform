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
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// 1. GLOBAL MIDDLEWARE (ORDER IS CRITICAL)

// A. Parse JSON bodies FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// B. Enable CORS early to handle preflights
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Request-Id']
}));

// C. Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// D. Request Context & Elite Logging
app.use((req: any, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

morgan.token('id', (req: any) => req.requestId);
morgan.token('body', (req: any) => isProd ? '' : JSON.stringify(req.body));

app.use(morgan('[:id] :method :url :status :response-time ms - :body', {
  skip: (req) => req.url.startsWith('/health')
}));

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { success: false, message: 'Too many requests.' }
});
app.use('/api/', limiter);

// 3. Swagger Documentation Setup
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

// 4. API Routes (Versioned)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/billing', billingRoutes);

// Mount specific analytics path BEFORE generic /v1 path
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', geoRoutes);

// 5. System & Health Routes
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running 🚀' });
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ success: true, message: 'Process is alive' });
});

app.get('/health/ready', async (req: any, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, data: { status: 'READY', database: 'CONNECTED' } });
  } catch (e: any) {
    logger.error('Readiness probe failed', { requestId: req.requestId, error: e.message });
    res.status(503).json({ success: false, data: { status: 'NOT_READY', database: 'DISCONNECTED' } });
  }
});

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

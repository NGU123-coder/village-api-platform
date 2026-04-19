import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// 1. Request Context & Elite Logging
app.use((req: any, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

morgan.token('id', (req: any) => req.requestId);
app.use(morgan('[:id] :method :url :status :response-time ms', {
  skip: (req) => req.url.startsWith('/health')
}));

// 2. Security & Core Middleware
app.use(helmet());
app.use(express.json());

// Request Timeout Middleware (5 seconds) with cleanup
app.use((req: any, res, next) => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout reached', { requestId: req.requestId, url: req.originalUrl });
      res.status(503).json({ success: false, message: 'Request timeout' });
    }
  }, 5000);

  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));
  next();
});

// 2. Secure CORS Configuration
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    // Also allow any origin in development
    if (!origin || !isProd) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For debugging: log the blocked origin
      logger.warn('Blocked by CORS', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { success: false, message: 'Too many requests.' }
});
app.use('/api/', limiter);

// 4. Swagger Documentation
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

// 5. API Routes (Versioned)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1', geoRoutes);

// 6. System & Health Routes
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

// 7. 404 & Error Handling
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

// 8. Server Lifecycle & Graceful Shutdown
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

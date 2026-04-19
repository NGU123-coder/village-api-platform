import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './config/db';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import geoRoutes from './routes/geoRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import billingRoutes from './routes/billingRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Production CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // Deployed frontend
  'http://localhost:5173',  // Local development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(helmet());
app.use(morgan('combined')); // Better logging for production

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);

// CRITICAL FIX: Mount analytics BEFORE general v1 routes 
// to prevent API Key middleware from intercepting JWT-based analytics requests.
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1', geoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('All India Village API Platform');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global Error:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const start = async () => {
  try {
    app.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export { prisma };

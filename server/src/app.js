import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import { globalOrgRouter, scopedOrgRouter } from './routes/org.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Trust proxy for Vercel rewrite architecture & Render deployment
app.set('trust proxy', 1);

// 2. Security headers
app.use(helmet());

// 3. CORS configuration (allowing credentials for cookies & multiple origins)
const allowedOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        env.NODE_ENV === 'development' ||
        allowedOrigins.includes('*');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 4. Body parsers & sanitizers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// 5. Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  },
});

// 6. Health check endpoint (for Vercel proxy, Render cold starts & monitoring)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// 7. Mount routes
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orgs', globalOrgRouter);
app.use('/api/o/:slug', scopedOrgRouter);

// 8. 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// 9. Central error handling middleware
app.use(errorHandler);

export default app;

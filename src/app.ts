import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import errorHandler, { notFound } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

const app: Application = express();

// ── Trust proxy (nginx / load balancer) ──────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Managed by CDN/nginx in production
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
// Webhook must use raw body for HMAC verification
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Security sanitizers ───────────────────────────────────────────────────────
app.use(mongoSanitize());  // Prevent NoSQL injection
app.use(hpp());            // Prevent HTTP parameter pollution

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Request logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
    skip: (_req: Request, res: Response) => res.statusCode < 400, // Only log errors in prod
  }));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success:   true,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    env:       process.env.NODE_ENV,
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
import routes from './routes';
app.use('/api/v1', routes);

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PYQPB API Server',
    version: '1.0.0',
    docs:    `${process.env.API_URL || ''}/api-docs`,
  });
});

// ── 404 & error handlers (must be last) ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
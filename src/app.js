// import csurf from 'csurf';
// app.use(csurf({ cookie: true }));

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xssClean from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from './core/config/logger.js';
// import errorHandler from './core/middlewares/errorMiddleware.js';
import notFound from './core/middlewares/notFound.js';
import { globalLimiter } from './lib/limit.js';
import appRouter from './core/app/appRouter.js';
import { globalErrorHandler } from './core/middlewares/globalErrorHandler.js';
import { initPaymentCheckCron } from './entities/order/paymentCheck.cron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set up security middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'http://localhost:8080', // Common dev port
  'https://sktch-labs.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Instead of throwing an error, deny the request gracefully
    logger.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // important for preflight
app.use(xssClean());
app.use(mongoSanitize());

// Set up logging middleware
app.use(morgan('combined'));

// Set up body parsing middleware
app.use(express.json({ limit: '10000kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up rate limiting middleware
app.use(globalLimiter);

// Set up static files middleware
const uploadPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadPath));

// Set up API routes
app.use('/api', appRouter);

// Set up 404 error middleware
app.use(notFound);

// Set up error handling middleware
app.use(globalErrorHandler);

logger.info('Middleware stack initialized');

// Initialize payment check cron job (runs every 5 seconds)
initPaymentCheckCron();

export { app };

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import { logger } from './utils/logger.js';
import { loadTrainedModels } from './services/nlpService.js';

// Import routes
import dataRoutes from './routes/dataRoutes.js';
import scrapingRoutes from './routes/scrapingRoutes.js';
import nlpRoutes from './routes/nlpRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Load trained models (if available)
loadTrainedModels();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration (allow all)
app.use(
  cors({
    origin: true, // reflects request origin
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use(logger);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GTU NLP Web Scraping API',
    version: '1.0.0',
    endpoints: {
      data: '/api/data',
      scraping: '/api/scrape',
      nlp: '/api/nlp',
    },
  });
});

app.use('/api/data', dataRoutes);
app.use('/api/scrape', scrapingRoutes);
app.use('/api/nlp', nlpRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;


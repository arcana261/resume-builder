import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import jobsRouter from './routes/jobs.js';
import searchesRouter from './routes/searches.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/searches', searchesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Job Browser API Server              ║
╠═══════════════════════════════════════╣
║ Status: Running                       ║
║ Port: ${PORT}                          ║
║ Environment: ${process.env.NODE_ENV || 'development'}                  ║
║ Database: ${process.env.DATABASE_PATH || 'default'}                     ║
╚═══════════════════════════════════════╝

API Endpoints:
  GET  /api/jobs              - List jobs with filters
  GET  /api/jobs/:id          - Get job details
  GET  /api/jobs/:id/html     - Get job HTML
  GET  /api/searches          - List search history
  GET  /api/searches/:id      - Get search details
  GET  /api/health            - Health check
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

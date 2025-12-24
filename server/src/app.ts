import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import datasourcesRouter from './api/datasources';
import queryRouter from './api/query';
import authRouter from './api/auth';
import dashboardsRouter from './api/dashboards';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve API keys management page
app.get('/api-keys.html', (req, res) => {
  res.sendFile('api-keys.html', { root: './public' });
});

// API routes
app.use('/api/datasources', datasourcesRouter);
app.use('/api/query', queryRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboards', dashboardsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Grafana Mirror Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Data sources: http://localhost:${PORT}/api/datasources`);
  console.log(`🔑 API keys: http://localhost:${PORT}/api/auth/keys`);
  console.log(`📋 Dashboards: http://localhost:${PORT}/api/dashboards`);
});

export default app;
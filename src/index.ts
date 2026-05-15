import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { hotelsRouter } from './routes/hotels';
import { supplierARouter } from './suppliers/supplierA';
import { supplierBRouter } from './suppliers/supplierB';
import { healthRouter } from './routes/health';
import { logger } from './middleware/logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Mock supplier endpoints
app.use('/supplierA', supplierARouter);
app.use('/supplierB', supplierBRouter);

// Main API routes
app.use('/api/hotels', hotelsRouter);
app.use('/health', healthRouter);

// ── Docs: serve README.md as plain text ─────────────────────
app.get('/docs/readme', (req, res) => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  if (!fs.existsSync(readmePath)) {
    return res.status(404).send('# Documentation not found\n\nREADME.md is missing.');
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(readmePath);
});

// ── Serve React client build (production) ───────────────────
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  logger.info(`[Static] Serving React build from ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // All non-API routes → React index.html (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  logger.warn('[Static] No client/build found — run build.bat to generate the frontend');

  // 404 fallback when no client build
  app.use((req, res) => {
    res.status(404).json({
      error: 'Route not found',
      hint: 'Run build.bat to build the React frontend, then restart the server',
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`🏨 Hotel Offer Orchestrator running on port ${PORT}`);
  
  if (fs.existsSync(clientBuildPath)) {
    logger.info(`   Frontend UI  →  http://localhost:${PORT}`);
  }

  logger.info(`  Supplier A: http://localhost:${PORT}/supplierA/hotels`);
  logger.info(`  Supplier B: http://localhost:${PORT}/supplierB/hotels`);
  logger.info(`  Hotels API: http://localhost:${PORT}/api/hotels?city=delhi`);
  logger.info(`  Health:     http://localhost:${PORT}/health`);
});

export default app;

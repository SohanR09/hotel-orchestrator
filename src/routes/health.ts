import { Router, Request, Response } from 'express';
import axios from 'axios';
import { checkRedisHealth } from '../redis/client';
import { logger } from '../middleware/logger';

export const healthRouter = Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function checkSupplier(name: string, url: string): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await axios.get(url, { timeout: 5000 });
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (err: any) {
    logger.warn(`[Health] ${name} check failed: ${err.message}`);
    return { status: 'unhealthy', error: err.message };
  }
}

healthRouter.get('/', async (req: Request, res: Response) => {
  logger.info('[Health] Running health checks');

  const [supplierA, supplierB, redisOk] = await Promise.all([
    checkSupplier('Supplier A', `${BASE_URL}/supplierA/hotels?city=delhi`),
    checkSupplier('Supplier B', `${BASE_URL}/supplierB/hotels?city=delhi`),
    checkRedisHealth(),
  ]);

  const allHealthy =
    supplierA.status === 'healthy' &&
    supplierB.status === 'healthy' &&
    redisOk;

  const status = allHealthy ? 'healthy' : 'degraded';
  const httpStatus = allHealthy ? 200 : 207;

  const response = {
    status,
    timestamp: new Date().toISOString(),
    services: {
      supplierA,
      supplierB,
      redis: { status: redisOk ? 'healthy' : 'unhealthy' },
    },
  };

  logger.info(`[Health] Overall status: ${status}`);
  res.status(httpStatus).json(response);
});

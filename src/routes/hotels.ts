import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../middleware/logger';
import { BestOffer } from '../types';
import * as activities from '../temporal/activities';
import {
  saveHotelsToRedis,
  filterHotelsByPriceFromRedis,
  isRedisAvailable,
  getHotelsFromRedis,
} from '../redis/client';
import { get } from 'http';
import { getTemporalClient } from '../temporal/client';
import { hotelAggregationWorkflow } from '../temporal/workflow';

export const hotelsRouter = Router();

// Core business logic — no Temporal needed
async function fetchAndDedup(city: string): Promise<BestOffer[]> {
  const [supplierAHotels, supplierBHotels] = await Promise.all([
    activities.fetchSupplierA(city),
    activities.fetchSupplierB(city),
  ]);
  return activities.deduplicateAndSelectBest(supplierAHotels, supplierBHotels);
}

hotelsRouter.get('/', async (req: Request, res: Response) => {
  const city = (req.query.city as string || '').toLowerCase().trim();
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

  if (!city) {
    return res.status(400).json({ error: 'Query parameter "city" is required' });
  }

  logger.info(`[API] GET /api/hotels city="${city}" minPrice=${minPrice ?? '-'} maxPrice=${maxPrice ?? '-'}`);

  try {
    const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
    const redisOk = await isRedisAvailable();

    // ── 1. Redis cache hit with price filter ──────────────────
    if (redisOk && hasPriceFilter) {
      const cached = await filterHotelsByPriceFromRedis(city, minPrice, maxPrice);
      if (cached !== null) {
        logger.info(`[API] Serving from Redis cache (filtered): ${cached.length} hotels`);
        return res.json(cached);
      }
    }

    // // Fetch and deduplicate (direct, no Temporal required)
    // const bestOffers: BestOffer[] = await fetchAndDedup(city);
    // logger.info(`[API] Fetched ${bestOffers.length} hotels for city="${city}"`);

    // ── 2. Redis cache hit (no filter) ────────────────────────
    if (redisOk && !hasPriceFilter) {
      const chached = await getHotelsFromRedis(city);
      if (chached !== null) {
        logger.info(`[API] Redis cache hit: ${chached.length} hotels`);
        return res.json(chached);
      }
    }

    // ── 3. Run via Temporal workflow ──────────────────────────
    let bestOffers: BestOffer[] = [];
    try {
       logger.info('[API] Starting Temporal workflow...');
      const client     = await getTemporalClient();
      const workflowId = `hotel-${city}-${uuidv4()}`;

      const handle = await client.workflow.start(hotelAggregationWorkflow, {
        args: [city],
        taskQueue: 'hotel-task-queue',
        workflowId,
      });

      bestOffers = await handle.result();
      logger.info(`[API] Temporal workflow done: ${bestOffers.length} hotels (id: ${workflowId})`);
    } catch (temporalErr: any) {
      // ── 4. Fallback: run activities directly ─────────────────
      logger.warn(`[API] Temporal unavailable (${temporalErr.message}) — running directly`);
      const [a, b] = await Promise.all([
        activities.fetchSupplierA(city),
        activities.fetchSupplierB(city),
      ]);
      bestOffers = await activities.deduplicateAndSelectBest(a, b);
      logger.info(`[API] Direct execution: ${bestOffers.length} hotels`);
    }

    // ── 5. Save to Redis ──────────────────────────────────────
    if (redisOk) {
      await saveHotelsToRedis(city, bestOffers);
    }

    // ── 6. Apply price filter ─────────────────────────────────
    let result = bestOffers;
    if (hasPriceFilter) {
      if (minPrice !== undefined) result = result.filter((h) => h.price >= minPrice);
      if (maxPrice !== undefined) result = result.filter((h) => h.price <= maxPrice);
      logger.info(`[API] After price filter: ${result.length} hotels`);
    }

    return res.json(result);
  } catch (err: any) {
    logger.error(`[API] Error: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ error: 'Failed to fetch hotel offers', message: err.message });
  }
});

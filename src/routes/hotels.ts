import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import { BestOffer } from '../types';
import * as activities from '../temporal/activities';
import {
  saveHotelsToRedis,
  filterHotelsByPriceFromRedis,
  isRedisAvailable,
} from '../redis/client';

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

    // If Redis is up and we have a price filter, try cache first
    if (redisOk && hasPriceFilter) {
      const cached = await filterHotelsByPriceFromRedis(city, minPrice, maxPrice);
      if (cached !== null) {
        logger.info(`[API] Serving from Redis cache (filtered): ${cached.length} hotels`);
        return res.json(cached);
      }
    }

    // Fetch and deduplicate (direct, no Temporal required)
    const bestOffers: BestOffer[] = await fetchAndDedup(city);
    logger.info(`[API] Fetched ${bestOffers.length} hotels for city="${city}"`);

    // Save to Redis if available
    if (redisOk) {
      await saveHotelsToRedis(city, bestOffers);
    }

    // Apply price filter
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

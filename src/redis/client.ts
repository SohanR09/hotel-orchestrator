import Redis from 'ioredis';
import { logger } from '../middleware/logger';
import { BestOffer } from '../types';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300');

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 3000,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 500, 2000);
    },
  });

  redisClient.on('connect', () => logger.info('[Redis] Connected'));
  redisClient.on('error', (err) => logger.warn(`[Redis] Not available: ${err.message} — running without cache`));
  redisClient.on('close', () => logger.warn('[Redis] Connection closed'));

  redisClient.connect().catch(() => {
    logger.warn('[Redis] Could not connect — caching disabled');
  });

  return redisClient;
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const pong = await getRedisClient().ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function saveHotelsToRedis(city: string, hotels: BestOffer[]): Promise<void> {
  try {
    await getRedisClient().setex(`hotels:${city.toLowerCase()}`, CACHE_TTL, JSON.stringify(hotels));
    logger.info(`[Redis] Cached ${hotels.length} hotels for "${city}" (TTL: ${CACHE_TTL}s)`);
  } catch (err: any) {
    logger.warn(`[Redis] Could not save: ${err.message}`);
  }
}

export async function getHotelsFromRedis(city: string): Promise<BestOffer[] | null> {
  try {
    const cached = await getRedisClient().get(`hotels:${city.toLowerCase()}`);
    if (cached) { logger.info(`[Redis] Cache HIT for "${city}"`); return JSON.parse(cached); }
    logger.info(`[Redis] Cache MISS for "${city}"`);
    return null;
  } catch (err: any) {
    logger.warn(`[Redis] Could not read: ${err.message}`);
    return null;
  }
}

export async function filterHotelsByPriceFromRedis(
  city: string, minPrice?: number, maxPrice?: number
): Promise<BestOffer[] | null> {
  const all = await getHotelsFromRedis(city);
  if (!all) return null;
  let result = all;
  if (minPrice !== undefined) result = result.filter((h) => h.price >= minPrice);
  if (maxPrice !== undefined) result = result.filter((h) => h.price <= maxPrice);
  logger.info(`[Redis] Price filter → ${result.length} hotels`);
  return result;
}

export async function checkRedisHealth(): Promise<boolean> {
  return isRedisAvailable();
}

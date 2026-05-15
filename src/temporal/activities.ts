import axios from 'axios';
import { SupplierHotel, BestOffer } from '../types';
import { logger } from '../middleware/logger';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  logger.info(`[Activity] Fetching Supplier A for city=${city}`);
  try {
    const { data } = await axios.get<SupplierHotel[]>(
      `${BASE_URL}/supplierA/hotels?city=${encodeURIComponent(city)}`,
      { timeout: 10000 }
    );
    logger.info(`[Activity] Supplier A returned ${data.length} hotels`);
    return data;
  } catch (err: any) {
    logger.error(`[Activity] Supplier A failed: ${err.message}`);
    return [];
  }
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  logger.info(`[Activity] Fetching Supplier B for city=${city}`);
  try {
    const { data } = await axios.get<SupplierHotel[]>(
      `${BASE_URL}/supplierB/hotels?city=${encodeURIComponent(city)}`,
      { timeout: 10000 }
    );
    logger.info(`[Activity] Supplier B returned ${data.length} hotels`);
    return data;
  } catch (err: any) {
    logger.error(`[Activity] Supplier B failed: ${err.message}`);
    return [];
  }
}

export async function deduplicateAndSelectBest(
  supplierAHotels: SupplierHotel[],
  supplierBHotels: SupplierHotel[]
): Promise<BestOffer[]> {
  logger.info(`[Activity] Deduplicating: A=${supplierAHotels.length}, B=${supplierBHotels.length} hotels`);

  const hotelMap = new Map<string, BestOffer>();

  for (const hotel of supplierAHotels) {
    const key = hotel.name.toLowerCase().trim();
    hotelMap.set(key, {
      name: hotel.name,
      price: hotel.price,
      supplier: 'Supplier A',
      commissionPct: hotel.commissionPct,
    });
  }

  for (const hotel of supplierBHotels) {
    const key = hotel.name.toLowerCase().trim();
    const existing = hotelMap.get(key);
    if (!existing || hotel.price < existing.price) {
      hotelMap.set(key, {
        name: hotel.name,
        price: hotel.price,
        supplier: 'Supplier B',
        commissionPct: hotel.commissionPct,
      });
    }
  }

  const result = Array.from(hotelMap.values());
  logger.info(`[Activity] Deduplication complete: ${result.length} unique hotels`);
  return result;
}

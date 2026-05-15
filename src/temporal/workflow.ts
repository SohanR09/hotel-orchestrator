import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { BestOffer } from '../types';

const { fetchSupplierA, fetchSupplierB, deduplicateAndSelectBest } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

export async function hotelAggregationWorkflow(city: string): Promise<BestOffer[]> {
  // Call Supplier A and B in parallel
  const [supplierAHotels, supplierBHotels] = await Promise.all([
    fetchSupplierA(city),
    fetchSupplierB(city),
  ]);

  // Deduplicate and select best offers
  const bestOffers = await deduplicateAndSelectBest(supplierAHotels, supplierBHotels);

  return bestOffers;
}

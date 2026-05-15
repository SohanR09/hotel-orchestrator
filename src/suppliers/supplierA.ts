import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';

export const supplierARouter = Router();

const supplierAData: Record<string, any[]> = {
  delhi: [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'Grand Hyatt', price: 12000, city: 'delhi', commissionPct: 15 },
    { hotelId: 'a4', name: 'ITC Maurya', price: 9500, city: 'delhi', commissionPct: 12 },
    { hotelId: 'a5', name: 'The Lalit', price: 7200, city: 'delhi', commissionPct: 11 },
  ],
  mumbai: [
    { hotelId: 'a6', name: 'Taj Mahal Palace', price: 18000, city: 'mumbai', commissionPct: 14 },
    { hotelId: 'a7', name: 'Trident Nariman', price: 11000, city: 'mumbai', commissionPct: 10 },
    { hotelId: 'a8', name: 'The Oberoi', price: 15000, city: 'mumbai', commissionPct: 16 },
  ],
  bangalore: [
    { hotelId: 'a9', name: 'ITC Gardenia', price: 8500, city: 'bangalore', commissionPct: 12 },
    { hotelId: 'a10', name: 'Leela Palace', price: 13000, city: 'bangalore', commissionPct: 15 },
  ],
};

supplierARouter.get('/hotels', (req: Request, res: Response) => {
  const city = (req.query.city as string || '').toLowerCase().trim();
  logger.info(`Supplier A: Request for city="${city || 'ALL'}"`);

  // Return all hotels across all cities if no city specified
  const results = city
    ? (supplierAData[city] || [])
    : Object.values(supplierAData).flat();

  logger.info(`Supplier A: Returning ${results.length} hotels`);
  res.json(results);
});

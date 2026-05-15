import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';

export const supplierBRouter = Router();

const supplierBData: Record<string, any[]> = {
  delhi: [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 8 },
    { hotelId: 'b3', name: 'Grand Hyatt', price: 11500, city: 'delhi', commissionPct: 18 },
    { hotelId: 'b4', name: 'Park Hotel', price: 4800, city: 'delhi', commissionPct: 9 },
    { hotelId: 'b5', name: 'Crowne Plaza', price: 6800, city: 'delhi', commissionPct: 14 },
  ],
  mumbai: [
    { hotelId: 'b6', name: 'Taj Mahal Palace', price: 17500, city: 'mumbai', commissionPct: 12 },
    { hotelId: 'b7', name: 'Marine Plaza', price: 8000, city: 'mumbai', commissionPct: 10 },
    { hotelId: 'b8', name: 'The Oberoi', price: 16000, city: 'mumbai', commissionPct: 13 },
  ],
  bangalore: [
    { hotelId: 'b9', name: 'ITC Gardenia', price: 9000, city: 'bangalore', commissionPct: 11 },
    { hotelId: 'b10', name: 'Marriott Whitefield', price: 7500, city: 'bangalore', commissionPct: 13 },
  ],
};

supplierBRouter.get('/hotels', (req: Request, res: Response) => {
  const city = (req.query.city as string || '').toLowerCase().trim();
  logger.info(`Supplier B: Request for city="${city || 'ALL'}"`);

  // Return all hotels across all cities if no city specified
  const results = city
    ? (supplierBData[city] || [])
    : Object.values(supplierBData).flat();

  logger.info(`Supplier B: Returning ${results.length} hotels`);
  res.json(results);
});

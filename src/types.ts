export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface BestOffer {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface HotelWorkflowParams {
  city: string;
  baseUrl: string;
}

export interface FilteredHotelParams {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

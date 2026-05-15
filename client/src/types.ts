export interface Hotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    supplierA: { status: string; latencyMs?: number; error?: string };
    supplierB: { status: string; latencyMs?: number; error?: string };
    redis:     { status: string; error?: string };
  };
}

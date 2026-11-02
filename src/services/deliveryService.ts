import { Order } from '../types';

export const deliveryService = {
  // Distance calculation (Mock or Google Maps Distance Matrix)
  calculateDistance: async (origin: string, destination: string): Promise<number> => {
    console.log(`Calculating distance from ${origin} to ${destination}`);
    return Math.floor(Math.random() * 12) + 3; // 3-15 km
  },
  
  calculateDeliveryCharge: async (distanceKm: number, ratePerKm: number = 10): Promise<number> => {
    const minCharge = 30;
    const charge = distanceKm * ratePerKm;
    return Math.max(minCharge, charge);
  }
};


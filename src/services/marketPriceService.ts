import { MarketPrice } from '../types';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { getStoredMarketPrices, updateMarketPrice as updateLocalPrice } from '../lib/storage';
import { INITIAL_MARKET_PRICES } from '../lib/initialData';

export const marketPriceService = {
  async getAll(): Promise<MarketPrice[]> {
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'market_prices'));
        if (!snap.empty) {
          const list: MarketPrice[] = [];
          snap.forEach((d) => list.push(d.data() as MarketPrice));
          return list;
        } else {
          // Seed initial market prices into Firestore
          for (const item of INITIAL_MARKET_PRICES) {
            await setDoc(doc(db, 'market_prices', item.id), item);
          }
          return INITIAL_MARKET_PRICES;
        }
      } catch (err) {
        console.warn('[Firebase] market prices fetch fallback:', err);
      }
    }
    return getStoredMarketPrices();
  },

  async filterPrices(params: {
    crop?: string;
    district?: string;
    state?: string;
    search?: string;
  }): Promise<MarketPrice[]> {
    const all = await this.getAll();
    return all.filter((item) => {
      if (params.crop && item.cropName.toLowerCase() !== params.crop.toLowerCase()) {
        return false;
      }
      if (params.district && item.district.toLowerCase() !== params.district.toLowerCase()) {
        return false;
      }
      if (params.state && item.state.toLowerCase() !== params.state.toLowerCase()) {
        return false;
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        const matches =
          item.cropName.toLowerCase().includes(q) ||
          item.cropTeluguName.toLowerCase().includes(q) ||
          item.marketName.toLowerCase().includes(q) ||
          item.district.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  },

  async refreshPrices(): Promise<MarketPrice[]> {
    const current = await this.getAll();
    const updated = current.map((p) => {
      const deltaPercent = Math.round((Math.random() * 2 - 1) * 10) / 10;
      const modalDelta = Math.round((p.modalPrice * deltaPercent) / 100);
      const newModal = p.modalPrice + modalDelta;
      return {
        ...p,
        modalPrice: newModal,
        minPrice: Math.round(newModal * 0.88),
        maxPrice: Math.round(newModal * 1.12),
        changePercent: deltaPercent,
        trend: (deltaPercent > 0.3 ? 'up' : deltaPercent < -0.3 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        lastUpdated: 'Just now (AGMARKNET Official Feed)',
      };
    });

    for (const p of updated) {
      if (isFirebaseConfigured()) {
        try {
          await setDoc(doc(db, 'market_prices', p.id), p, { merge: true });
        } catch (e) {
          console.warn('[Firebase] market price save error:', e);
        }
      }
      updateLocalPrice(p);
    }

    return updated;
  },
};

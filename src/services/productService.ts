import { Product } from '../types';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getStoredProducts, saveProduct as saveLocalProduct, deleteProduct as deleteLocalProduct } from '../lib/storage';
import { INITIAL_PRODUCTS } from '../lib/initialData';

export const productService = {
  async getAll(): Promise<Product[]> {
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach((d) => list.push(d.data() as Product));
          return list;
        } else {
          // Seed initial products into Firebase Firestore on first run
          for (const item of INITIAL_PRODUCTS) {
            await setDoc(doc(db, 'products', item.id), item);
          }
          return INITIAL_PRODUCTS;
        }
      } catch (err) {
        console.warn('[Firebase] products fetch fallback:', err);
      }
    }
    return getStoredProducts();
  },

  async getById(id: string): Promise<Product | undefined> {
    const products = await this.getAll();
    return products.find((p) => p.id === id);
  },

  async getByFarmer(farmerId: string): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter((p) => p.farmerId === farmerId);
  },

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), newProduct);
      } catch (err) {
        console.warn('[Firebase] product create fallback:', err);
      }
    }

    return saveLocalProduct(newProduct);
  },

  async update(product: Product): Promise<Product> {
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'products', product.id), product, { merge: true });
      } catch (err) {
        console.warn('[Firebase] product update fallback:', err);
      }
    }
    return saveLocalProduct(product);
  },

  async delete(productId: string): Promise<boolean> {
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.warn('[Firebase] product delete fallback:', err);
      }
    }
    return deleteLocalProduct(productId);
  },
};

import { Order, OrderStatus } from '../types';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getStoredOrders, saveOrder as saveLocalOrder, updateOrderStatus as updateLocalOrderStatus } from '../lib/storage';
import { INITIAL_ORDERS } from '../lib/initialData';

export const orderService = {
  async getAll(): Promise<Order[]> {
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          const list: Order[] = [];
          snap.forEach((d) => list.push(d.data() as Order));
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
          // Seed initial orders into Firestore on first run
          for (const item of INITIAL_ORDERS) {
            await setDoc(doc(db, 'orders', item.id), item);
          }
          return INITIAL_ORDERS;
        }
      } catch (err) {
        console.warn('[Firebase] orders fetch fallback:', err);
      }
    }
    return getStoredOrders();
  },

  async getById(id: string): Promise<Order | undefined> {
    const orders = await this.getAll();
    return orders.find((o) => o.id === id || o.orderNumber === id);
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    const orders = await this.getAll();
    return orders.filter((o) => o.customerId === customerId);
  },

  async getByFarmer(farmerId: string): Promise<Order[]> {
    const orders = await this.getAll();
    return orders.filter((o) => o.farmerId === farmerId);
  },

  async create(order: Order): Promise<Order> {
    if (isFirebaseConfigured()) {
      try {
        if (!order.farmerId) {
          throw new Error('Order must have a valid farmerId');
        }
        await setDoc(doc(db, 'orders', order.id), order);
      } catch (err) {
        console.warn('[Firebase] order create fallback:', err);
      }
    }
    return saveLocalOrder(order);
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status });
      } catch (err) {
        console.warn('[Firebase] order update fallback:', err);
      }
    }
    return updateLocalOrderStatus(orderId, status);
  },

  async cancelOrder(
    orderId: string,
    cancellationReason: string = 'Cancelled by customer',
    cancelledBy: 'customer' | 'farmer' | 'admin' = 'customer'
  ): Promise<Order | null> {
    const cancelPayload = {
      status: 'cancelled' as OrderStatus,
      cancellationReason,
      cancelledBy,
      cancelledAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'orders', orderId), cancelPayload);
      } catch (err) {
        console.warn('[Firebase] cancelOrder updateDoc error:', err);
      }
    }

    const updated = updateLocalOrderStatus(orderId, 'cancelled');
    window.dispatchEvent(new Event('farmconnect_storage_update'));
    return updated;
  },
};

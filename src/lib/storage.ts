import { Product, Order, MarketPrice, NotificationItem, Review, UserProfile, OrderStatus } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_MARKET_PRICES, INITIAL_NOTIFICATIONS, INITIAL_REVIEWS, INITIAL_FARMERS } from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'farmconnect_products_v1',
  ORDERS: 'farmconnect_orders_v1',
  MARKET_PRICES: 'farmconnect_market_prices_v1',
  NOTIFICATIONS: 'farmconnect_notifications_v1',
  REVIEWS: 'farmconnect_reviews_v1',
  FARMERS: 'farmconnect_farmers_v1',
};

// Dispatch a custom event so other components can re-render immediately
const notifyChange = (key: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key } }));
  }
};

export const getStoredProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const saveProduct = (product: Product): Product => {
  const current = getStoredProducts();
  const existingIndex = current.findIndex((p) => p.id === product.id);
  let updated: Product[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = product;
  } else {
    updated = [product, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.PRODUCTS);
  return product;
};

export const deleteProduct = (productId: string): boolean => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== productId);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.PRODUCTS);
  return true;
};

export const getStoredOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
};

export const saveOrder = (order: Order): Order => {
  const current = getStoredOrders();
  const updated = [order, ...current];
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));

  // Deduct product stock
  const products = getStoredProducts();
  let productsChanged = false;
  order.items.forEach((item) => {
    const pIndex = products.findIndex((p) => p.id === item.productId);
    if (pIndex >= 0) {
      products[pIndex].availableQtyKg = Math.max(0, products[pIndex].availableQtyKg - item.quantityKg);
      if (products[pIndex].availableQtyKg === 0) {
        products[pIndex].status = 'out_of_stock';
      } else if (products[pIndex].availableQtyKg < 50) {
        products[pIndex].status = 'low_stock';
      }
      productsChanged = true;
    }
  });
  if (productsChanged) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    notifyChange(STORAGE_KEYS.PRODUCTS);
  }

  // Create notifications for farmer & customer
  addNotification({
    id: `notif-${Date.now()}`,
    userId: order.farmerId,
    targetRole: 'farmer',
    title: 'New Direct Order Received',
    titleTe: 'కొత్త ఆర్డర్ వచ్చింది',
    message: `New order #${order.orderNumber} for ₹${order.finalAmount} received from ${order.customerName}.`,
    messageTe: `${order.customerName} నుండి ₹${order.finalAmount} విలువైన కొత్త ఆర్డర్ #${order.orderNumber} వచ్చింది.`,
    type: 'order',
    isRead: false,
    createdAt: new Date().toISOString(),
    linkUrl: `/orders`,
  });

  notifyChange(STORAGE_KEYS.ORDERS);
  return order;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): Order | null => {
  const current = getStoredOrders();
  const index = current.findIndex((o) => o.id === orderId);
  if (index === 0 || index > 0) {
    const updatedOrder = { ...current[index], status };
    current[index] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(current));

    // Notify customer
    addNotification({
      id: `notif-${Date.now()}`,
      userId: updatedOrder.customerId,
      targetRole: 'customer',
      title: `Order Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
      titleTe: `ఆర్డర్ స్థితి నవీకరించబడింది: ${status}`,
      message: `Your order #${updatedOrder.orderNumber} is now marked as "${status.replace('_', ' ')}".`,
      messageTe: `మీ ఆర్డర్ #${updatedOrder.orderNumber} స్థితి "${status}" గా మార్చబడింది.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/orders`,
    });

    notifyChange(STORAGE_KEYS.ORDERS);
    return updatedOrder;
  }
  return null;
};

export const getStoredMarketPrices = (): MarketPrice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKET_PRICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MARKET_PRICES, JSON.stringify(INITIAL_MARKET_PRICES));
      return INITIAL_MARKET_PRICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MARKET_PRICES;
  }
};

export const updateMarketPrice = (price: MarketPrice): MarketPrice => {
  const current = getStoredMarketPrices();
  const idx = current.findIndex((m) => m.id === price.id);
  let updated: MarketPrice[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = price;
  } else {
    updated = [price, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.MARKET_PRICES, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.MARKET_PRICES);
  return price;
};

export const getStoredNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
};

export const addNotification = (item: NotificationItem): void => {
  const current = getStoredNotifications();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.NOTIFICATIONS);
};

export const markNotificationAsRead = (id: string): void => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.NOTIFICATIONS);
};

export const markAllNotificationsRead = (userId: string): void => {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.userId === userId || n.userId === 'all' ? { ...n, isRead: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.NOTIFICATIONS);
};

export const getStoredReviews = (): Review[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REVIEWS;
  }
};

export const addReview = (review: Review): Review => {
  const current = getStoredReviews();
  const updated = [review, ...current];
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
  notifyChange(STORAGE_KEYS.REVIEWS);
  return review;
};

export const getStoredFarmers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(INITIAL_FARMERS));
      return INITIAL_FARMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FARMERS;
  }
};

export const setFarmerVerification = (userId: string, isVerified: boolean, status?: 'pending' | 'verified' | 'rejected' | 'approved', reason?: string): void => {
  const isApproved = isVerified || status === 'verified' || status === 'approved';
  const vStatus = isApproved ? 'approved' : (status === 'rejected' ? 'rejected' : 'pending');
  const updateFields = {
    isVerified: isApproved,
    verificationStatus: vStatus,
    approvalStatus: vStatus,
    rejectionReason: reason || '',
  };

  // 1. Update STORAGE_KEYS.FARMERS
  const currentFarmers = getStoredFarmers();
  const farmerIdx = currentFarmers.findIndex((f) => f.id === userId);
  let updatedFarmers: UserProfile[];
  if (farmerIdx >= 0) {
    updatedFarmers = [...currentFarmers];
    updatedFarmers[farmerIdx] = { ...updatedFarmers[farmerIdx], ...updateFields };
  } else {
    try {
      const localUsersRaw = localStorage.getItem('farmconnect_registered_users_v1');
      if (localUsersRaw) {
        const localUsers = JSON.parse(localUsersRaw);
        const found = localUsers.find((u: any) => u.id === userId);
        if (found) {
          updatedFarmers = [{ ...found, ...updateFields }, ...currentFarmers];
        } else {
          updatedFarmers = currentFarmers;
        }
      } else {
        updatedFarmers = currentFarmers;
      }
    } catch (e) {
      updatedFarmers = currentFarmers;
    }
  }
  localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(updatedFarmers));

  // 2. Update LOCAL_USERS_KEY ('farmconnect_registered_users_v1')
  try {
    const localUsersRaw = localStorage.getItem('farmconnect_registered_users_v1');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      const userIdx = localUsers.findIndex((u: any) => u.id === userId);
      if (userIdx >= 0) {
        localUsers[userIdx] = { ...localUsers[userIdx], ...updateFields };
        localStorage.setItem('farmconnect_registered_users_v1', JSON.stringify(localUsers));
      }
    }
  } catch (e) {}

  // 3. Update active session in localStorage if current user matches
  try {
    const sessionRaw = localStorage.getItem('farmconnect_active_session_v2');
    if (sessionRaw) {
      const activeUser = JSON.parse(sessionRaw);
      if (activeUser && activeUser.id === userId) {
        activeUser.isVerified = isVerified;
        activeUser.verificationStatus = vStatus;
        if (reason) activeUser.rejectionReason = reason;
        else if (isVerified) activeUser.rejectionReason = '';
        localStorage.setItem('farmconnect_active_session_v2', JSON.stringify(activeUser));
      }
    }
  } catch (e) {}

  // 4. Also update products by this farmer if they are a farmer
  const products = getStoredProducts();
  const updatedProducts = products.map((p) =>
    p.farmerId === userId ? { ...p, farmerVerified: isVerified } : p
  );
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));

  notifyChange(STORAGE_KEYS.FARMERS);
  notifyChange(STORAGE_KEYS.PRODUCTS);
  notifyChange('farmconnect_registered_users_v1');
};


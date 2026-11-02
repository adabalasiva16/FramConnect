import { NotificationItem, UserRole } from '../types';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getStoredNotifications, addNotification as addLocalNotification, markNotificationAsRead as markLocalNotificationRead, markAllNotificationsRead as markAllLocalNotificationsRead } from '../lib/storage';
import { INITIAL_NOTIFICATIONS } from '../lib/initialData';

export const notificationService = {
  async getForUser(userId: string, role: UserRole): Promise<NotificationItem[]> {
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'notifications'));
        if (!snap.empty) {
          const list: NotificationItem[] = [];
          snap.forEach((d) => list.push(d.data() as NotificationItem));
          return list.filter((n) => n.userId === userId || n.targetRole === role || n.targetRole === 'all');
        } else {
          for (const item of INITIAL_NOTIFICATIONS) {
            await setDoc(doc(db, 'notifications', item.id), item);
          }
          return INITIAL_NOTIFICATIONS.filter((n) => n.userId === userId || n.targetRole === role || n.targetRole === 'all');
        }
      } catch (err) {
        console.warn('[Firebase] notifications fetch fallback:', err);
      }
    }

    const all = getStoredNotifications();
    return all.filter((n) => n.userId === userId || n.targetRole === role || n.targetRole === 'all');
  },

  async markAsRead(notificationId: string): Promise<void> {
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      } catch (err) {
        console.warn('[Firebase] mark read fallback:', err);
      }
    }
    markLocalNotificationRead(notificationId);
  },

  async markAllRead(userId: string): Promise<void> {
    markAllLocalNotificationsRead(userId);
  },

  async send(item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'notifications', newItem.id), newItem);
      } catch (err) {
        console.warn('[Firebase] send notification fallback:', err);
      }
    }

    addLocalNotification(newItem);
    return newItem;
  },
};

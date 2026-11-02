import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Package, DollarSign, MessageSquare, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { NotificationItem } from '../types';
import { getStoredNotifications, markNotificationAsRead, markAllNotificationsRead } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationsPageProps {
  onBack: () => void;
  onNavigate: (view: string, param?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack, onNavigate }) => {
  const { user, role } = useAuth();
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadNotifs();
    window.addEventListener('farmconnect_storage_update', loadNotifs);
    return () => window.removeEventListener('farmconnect_storage_update', loadNotifs);
  }, [user, role]);

  const loadNotifs = () => {
    const all = getStoredNotifications();
    const filtered = all.filter(
      (n) => n.userId === user?.id || n.targetRole === role || n.targetRole === 'all'
    );
    setNotifications(filtered);
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifs();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user?.id || 'all');
    loadNotifs();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{language === 'te' ? 'అన్నీ చదివినట్లు గుర్తించు' : 'Mark All as Read'}</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900">{t('navNotifications')}</h1>
            <p className="text-xs text-stone-500 mt-1">
              Order confirmations, mandi price alerts, and customer messages
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-xs">No notifications right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    n.isRead
                      ? 'bg-white border-stone-100 text-stone-600'
                      : 'bg-emerald-50/50 border-emerald-200 text-stone-900'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {n.type === 'order' ? (
                        <Package className="w-4 h-4 text-emerald-600" />
                      ) : n.type === 'stock' ? (
                        <DollarSign className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Bell className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">
                        {language === 'te' ? n.titleTe || n.title : n.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                        {language === 'te' ? n.messageTe || n.message : n.message}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

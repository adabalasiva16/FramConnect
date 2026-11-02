import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Search,
  Package,
  Calendar,
  Truck,
  Heart,
  ChevronRight,
  User,
} from 'lucide-react';
import { Order, Product, UserProfile, UserRole } from '../types';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { farmerService } from '../services/farmerService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

import { LogOut } from 'lucide-react';

interface CustomerDashboardProps {
  onNavigateToMarketplace: (searchOrCategory?: string) => void;
  onNavigateToMarketPrices: () => void;
  onTrackOrder: (order: Order) => void;
  onSelectProduct: (product: Product) => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: UserRole) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNavigateToMarketplace,
  onNavigateToMarketPrices,
  onTrackOrder,
  onSelectProduct,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [nearbyFarmers, setNearbyFarmers] = useState<UserProfile[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('farmconnect_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('farmconnect_storage_update', handleStorageUpdate);
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allOrders, allProducts, allFarmers] = await Promise.all([
        orderService.getAll(),
        productService.getAll(),
        farmerService.getAll(),
      ]);
      setOrders(allOrders);
      setFeaturedProducts(allProducts.slice(0, 4));
      setNearbyFarmers(allFarmers);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-stone-50 pb-24 pt-12">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">
              {language === 'te' ? 'వినియోగదారు డాష్‌బోర్డ్' : 'Customer Account Portal'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {language === 'te'
                ? 'మీ ఆర్డర్లను ట్రాక్ చేయడానికి, సమీక్షలు రాయడానికి మరియు రైతులతో మాట్లాడటానికి దయచేసి లాగిన్ అవ్వండి లేదా కొత్త కస్టమర్ ప్రొఫైల్ నమోదు చేసుకోండి.'
                : 'Please log in or create a consumer profile to track fresh deliveries, view previous orders, and communicate directly with local farmers.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onOpenAuth?.('login', 'customer')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-colors shadow-xs"
              >
                {t('navLogin')}
              </button>
              <button
                onClick={() => onOpenAuth?.('register', 'customer')}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl transition-colors"
              >
                Create Consumer Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20">
                {language === 'te' ? 'రైతు బజార్ డిజిటల్ కన్సోల్' : 'Direct Consumer Portal'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {language === 'te' ? `స్వాగతం, ${user.fullName}!` : `Welcome back, ${user.fullName}!`}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              {language === 'te'
                ? 'మీ ప్రాంతంలోని ధృవీకరించబడిన రైతుల నుండి నేరుగా తాజా ఆహారాన్ని ఆర్డర్ చేయండి.'
                : 'Connect with verified farmers in Krishna & Guntur districts for fresh pesticide-free harvests.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateToMarketplace()}
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>{t('exploreProducts')}</span>
            </button>

            <button
              onClick={() => {
                 // In a real app, you'd open a profile modal here
                 alert('Profile management functionality coming soon!');
              }}
              className="bg-emerald-900/60 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={logout}
              className="bg-emerald-900/60 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-white/20 transition-colors flex items-center gap-1.5"
              title="Logout from Customer Dashboard"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Active Orders Tracker Card (if any) */}
        {activeOrders.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xs mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-extrabold text-base text-stone-900">
                  {language === 'te' ? 'నడుస్తున్న ఆర్డర్లు' : 'Active Farm Deliveries'}
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                {activeOrders.length} In Progress
              </span>
            </div>

            <div className="space-y-3">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-sm">
                        Order #{ord.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Direct from farmer <strong>{ord.farmerName}</strong> ({ord.farmerVillage})
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-black text-emerald-800">₹{ord.finalAmount}</span>
                    <button
                      onClick={() => onTrackOrder(ord)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                    >
                      {t('trackOrder')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Nearby Farmers & Quick Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Nearby Farmers (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">{t('favoriteFarmers')}</h3>
                <p className="text-xs text-stone-500">Certified local growers in your surrounding mandals</p>
              </div>
              <button
                onClick={() => onNavigateToMarketplace()}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>{t('viewAll')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {nearbyFarmers.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={f.avatarUrl}
                      alt={f.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 text-sm">{f.fullName}</span>
                        {f.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{f.village}, {f.district}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToMarketplace(f.district)}
                    className="bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                  >
                    View Harvests
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick APMC Mandi Ticker Shortcut (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-stone-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {language === 'te' ? 'మార్కెట్ విశ్లేషణ' : 'Daily Market Intelligence'}
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-white">
                {language === 'te' ? 'నేటి అధికారిక మార్కెట్ ధరలు' : 'Daily Mandi Rates vs Farm Price'}
              </h3>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Check official APMC rates before buying. FarmConnect connects you directly to farmers for prices lower than supermarkets and higher than middlemen farm-gate rates!
              </p>

              <div className="my-5 p-3.5 bg-white/10 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-300">Tomato (Guntur):</span>
                  <span className="font-bold text-emerald-300">₹34 / kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Sona Masoori Rice:</span>
                  <span className="font-bold text-emerald-300">₹58 / kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Guntur Red Chilli:</span>
                  <span className="font-bold text-emerald-300">₹185 / kg</span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToMarketPrices}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{t('marketPricesTitle')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Harvests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-stone-900">{t('recommendedForYou')}</h3>
            <button
              onClick={() => onNavigateToMarketplace()}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-40 bg-stone-100">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  {p.isOrganic && (
                    <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Organic
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <span className="text-[10px] text-stone-400 block">{p.farmerName} • {p.farmerVillage}</span>
                  <h4 className="font-bold text-stone-900 text-sm mt-0.5 line-clamp-1">
                    {language === 'te' ? p.teluguName : p.name}
                  </h4>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-black text-stone-900">₹{p.pricePerKg} /{p.unit}</span>
                    <span className="text-xs font-bold text-emerald-700 hover:underline">View</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

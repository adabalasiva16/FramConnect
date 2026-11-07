import React, { useState, useEffect } from 'react';
import {
  Sprout,
  ShoppingBag,
  Bell,
  Mic,
  Globe,
  Menu,
  X,
  User,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getStoredNotifications } from '../../lib/storage';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenVoice: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenVoice,
  onOpenAuth,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, role, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync notification count
  const refreshNotifCount = () => {
    const notifs = getStoredNotifications();
    const unread = notifs.filter(
      (n) => !n.isRead && (n.userId === user?.id || n.targetRole === role || n.targetRole === 'all')
    ).length;
    setUnreadCount(unread);
  };

  useEffect(() => {
    refreshNotifCount();
    window.addEventListener('farmconnect_storage_update', refreshNotifCount);
    return () => window.removeEventListener('farmconnect_storage_update', refreshNotifCount);
  }, [user, role]);

  const navLinks = [
    { id: 'home', label: t('navHome') },
    { id: 'marketplace', label: t('navMarketplace') },
    { id: 'market-prices', label: t('navMarketPrices') },
    { id: 'how-it-works', label: t('navHowItWorks') },
    { id: 'about', label: t('navAbout') },
    { id: 'contact', label: t('navContact') },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Banner for APMC Live Ticker & Auth Status */}
      <div className="bg-emerald-900 text-emerald-100 text-xs px-4 py-1.5 flex items-center justify-between font-medium">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="flex items-center gap-1 bg-emerald-700/60 text-emerald-100 text-[11px] px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {language === 'te' ? 'ప్రత్యక్ష మార్కెట్ ధరలు' : 'LIVE APMC RATES'}
            </span>
            <span className="truncate text-emerald-200">
              {language === 'te'
                ? 'గుంటూరు మిరప: ₹19,200/క్వింటా | టమాటా: ₹34/కిలో | బోయినపల్లి ఉల్లి: ₹27/కిలో | వరి: ₹2,480/క్వింటా'
                : 'Guntur Chilli: ₹19,200/Qtl | Tomato: ₹34/kg | Bowenpally Onion: ₹27/kg | Paddy: ₹2,480/Qtl'}
            </span>
          </div>

          {/* Right Status & Direct Logout / Login Link */}
          <div className="flex items-center gap-3 relative shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Firebase Cloud Firestore</span>
            </span>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] text-emerald-200 font-semibold truncate max-w-[130px]">
                  {user.fullName} ({role})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-600 text-white px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors shadow-2xs"
                  title="Logout from FarmConnect"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs text-emerald-200 hover:text-white font-bold underline"
              >
                {t('navLogin')} / {language === 'te' ? 'రిజిస్టర్' : 'Register'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-emerald-950">
                Farm<span className="text-emerald-600">Connect</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                AgriTech
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-medium hidden sm:block leading-tight">
              {t('appTagline')}
            </p>
          </div>
        </button>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-stone-700">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`px-3 py-2 rounded-xl transition-all ${
                currentView === link.id
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {link.label}
            </button>
          ))}

          {/* Quick Dashboard link (only when logged in) */}
          {isAuthenticated && role === 'farmer' && (
            <button
              onClick={() => onNavigate('farmer-dashboard')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 ${
                currentView === 'farmer-dashboard'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('navFarmerDashboard')}</span>
            </button>
          )}

          {isAuthenticated && role === 'customer' && (
            <button
              onClick={() => onNavigate('customer-dashboard')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 ${
                currentView === 'customer-dashboard'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('navCustomerDashboard')}</span>
            </button>
          )}

          {isAuthenticated && (role === 'admin' || user?.email?.toLowerCase().trim() === 'adabalasiva16@gmail.com') && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 ${
                currentView === 'admin-dashboard'
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('navAdminDashboard')}</span>
            </button>
          )}
        </nav>

        {/* Right Action Icons & Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            title={t('navVoiceAssistant')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 sm:px-3.5 py-2 rounded-2xl shadow-sm shadow-emerald-500/20 font-bold text-xs sm:text-sm transition-all transform hover:scale-102 active:scale-98"
          >
            <div className="relative">
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300" />
            </div>
            <span className="hidden md:inline">{t('navVoiceAssistant')}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Switch Language / భాషను మార్చుకోండి"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-stone-200 hover:border-emerald-300 bg-stone-50 hover:bg-emerald-50/50 text-xs sm:text-sm font-semibold text-stone-800 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => onNavigate('notifications')}
            title={t('navNotifications')}
            className="relative p-2.5 rounded-xl border border-stone-200 hover:border-emerald-300 bg-stone-50 hover:bg-emerald-50/50 text-stone-700 hover:text-emerald-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => onNavigate('cart')}
            title={t('navCart')}
            className="relative p-2.5 rounded-xl border border-stone-200 hover:border-emerald-300 bg-stone-50 hover:bg-emerald-50/50 text-stone-700 hover:text-emerald-800 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile and Logout OR Login / Create Profile Buttons */}
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <button
                onClick={() =>
                  onNavigate(
                    role === 'farmer'
                      ? 'farmer-dashboard'
                      : role === 'admin'
                      ? 'admin-dashboard'
                      : 'customer-dashboard'
                  )
                }
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-2xl hover:bg-stone-100 transition-colors text-left"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500"
                />
                <div className="hidden xl:block">
                  <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[100px]">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-emerald-700 capitalize font-medium">{user.role}</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-colors shadow-2xs"
              >
                {t('navLogin')}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="hidden sm:flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'te' ? 'రిజిస్టర్' : 'Register'}</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2 animate-fade-in shadow-lg">
          <div className="flex flex-col gap-1">
            {/* User status in mobile drawer */}
            {isAuthenticated && user ? (
              <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-900">{user.fullName}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-xl"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl text-center"
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="bg-stone-100 text-stone-800 text-xs font-bold py-2.5 rounded-xl text-center"
                >
                  Create Profile
                </button>
              </div>
            )}

            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm ${
                  currentView === link.id
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {link.label}
              </button>
            ))}

            {isAuthenticated && (
              <div className="pt-2 border-t border-stone-100 mt-2">
                <button
                  onClick={() => {
                    onNavigate(
                      role === 'farmer'
                        ? 'farmer-dashboard'
                        : role === 'admin'
                        ? 'admin-dashboard'
                        : 'customer-dashboard'
                    );
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>
                    {role === 'farmer'
                      ? t('navFarmerDashboard')
                      : role === 'admin'
                      ? t('navAdminDashboard')
                      : t('navCustomerDashboard')}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                onNavigate('orders');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              {t('navMyOrders')}
            </button>

            <button
              onClick={() => {
                onNavigate('messages');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              {t('navMessages')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

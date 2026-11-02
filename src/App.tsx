import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { AuthModal } from './components/auth/AuthModal';
import { PriceComparisonModal } from './components/marketplace/PriceComparisonModal';

// Pages
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ProductDetails } from './pages/ProductDetails';
import { MarketPrices } from './pages/MarketPrices';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeliveryManagementPage } from './pages/DeliveryManagementPage';
import { MessagingPage } from './pages/MessagingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { AuthPage } from './pages/AuthPage';

import { Product, Order, UserRole } from './types';
import { productService } from './services/productService';
import { orderService } from './services/orderService';

function MainApp() {
  const { role } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // Authentication view state
  const [authViewMode, setAuthViewMode] = useState<{ mode: 'login' | 'register'; role?: UserRole }>({
    mode: 'login',
    role: 'farmer',
  });

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', targetRole?: UserRole) => {
    setAuthViewMode({ mode, role: targetRole });
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search & Filter state passed to marketplace
  const [marketplaceFilter, setMarketplaceFilter] = useState<{ search?: string; category?: any }>({});
  const [marketPriceCrop, setMarketPriceCrop] = useState<string>('');

  // Modals
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareCrop, setCompareCrop] = useState('Tomato');

  // Chat parameters
  const [chatParams, setChatParams] = useState({
    recipientId: 'farmer-1',
    recipientName: 'Venkata Subba Reddy',
    productName: 'Country Tomatoes',
  });

  // Global Products & Orders
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadGlobalData();
    const handleStorageUpdate = () => loadGlobalData();
    const handleOpenAuthEvent = (e: any) => {
      const detail = e.detail || {};
      handleOpenAuth(detail.mode || 'login', detail.role || 'farmer');
    };
    window.addEventListener('farmconnect_storage_update', handleStorageUpdate);
    window.addEventListener('farmconnect_open_auth', handleOpenAuthEvent);
    return () => {
      window.removeEventListener('farmconnect_storage_update', handleStorageUpdate);
      window.removeEventListener('farmconnect_open_auth', handleOpenAuthEvent);
    };
  }, []);

  // Redirect to home on logout
  const { user } = useAuth();
  useEffect(() => {
    if (!user && (currentView === 'farmer-dashboard' || currentView === 'customer-dashboard' || currentView === 'admin-dashboard' || currentView === 'order-tracking' || currentView === 'messages')) {
      setCurrentView('home');
    }
  }, [user, currentView]);

  const loadGlobalData = async () => {
    try {
      const [p, o] = await Promise.all([productService.getAll(), orderService.getAll()]);
      setProducts(p);
      setOrders(o);
      if (!activeTrackingOrder && o.length > 0) {
        setActiveTrackingOrder(o[0]);
      }
    } catch (e) {
      console.warn('Error loading global data:', e);
    }
  };

  const handleNavigate = (view: string, param?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'marketplace') {
      if (typeof param === 'string') {
        setMarketplaceFilter({ search: param });
      } else if (param && typeof param === 'object') {
        setMarketplaceFilter(param);
      } else {
        setMarketplaceFilter({});
      }
    }

    if (view === 'market-prices') {
      if (param && param.crop) {
        setMarketPriceCrop(param.crop);
      } else {
        setMarketPriceCrop('');
      }
    }

    if (view === 'orders') {
      if (orders.length > 0) {
        setActiveTrackingOrder(orders[0]);
        setCurrentView('order-tracking');
        return;
      }
    }

    if (view === 'auth') {
      if (param && typeof param === 'object') {
        setAuthViewMode({
          mode: param.mode || 'login',
          role: param.role || 'farmer',
        });
      } else if (param === 'login' || param === 'register') {
        setAuthViewMode((prev) => ({ ...prev, mode: param }));
      }
      setCurrentView('auth');
      return;
    }

    setCurrentView(view);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPriceComparison = (cropName: string) => {
    setCompareCrop(cropName || 'Tomato');
    setCompareModalOpen(true);
  };

  const handleNavigateToFarmerChat = (
    recipientId: string,
    recipientName: string,
    _productId?: string,
    productName?: string
  ) => {
    setChatParams({
      recipientId,
      recipientName,
      productName: productName || 'Crop Inquiry',
    });
    setCurrentView('messages');
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setActiveTrackingOrder(newOrder);
    setCurrentView('order-tracking');
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenVoice={() => setVoiceOpen(true)}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
      />

      <main className="flex-1">
        {currentView === 'auth' && (
          <AuthPage
            initialMode={authViewMode.mode}
            initialRole={authViewMode.role || 'farmer'}
            onSuccess={(loggedRole) => {
              if (loggedRole === 'farmer') handleNavigate('farmer-dashboard');
              else if (loggedRole === 'admin') handleNavigate('admin-dashboard');
              else handleNavigate('customer-dashboard');
            }}
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentView === 'home' && (
          <Home
            onNavigate={handleNavigate}
            featuredProducts={products}
            onSelectProduct={handleSelectProduct}
            onOpenVoice={() => setVoiceOpen(true)}
          />
        )}

        {currentView === 'marketplace' && (
          <Marketplace
            products={products}
            onSelectProduct={handleSelectProduct}
            initialSearch={marketplaceFilter.search || ''}
            initialCategory={marketplaceFilter.category || 'all'}
          />
        )}

        {currentView === 'product-details' && selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            onBack={() => setCurrentView('marketplace')}
            onNavigateToFarmerChat={handleNavigateToFarmerChat}
            onOpenPriceComparison={handleOpenPriceComparison}
          />
        )}

        {currentView === 'market-prices' && (
          <MarketPrices
            initialCrop={marketPriceCrop}
            onNavigateToMarketplace={(crop) => handleNavigate('marketplace', { search: crop })}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            onNavigateToMarketplace={() => handleNavigate('marketplace')}
            onProceedToCheckout={() => setCurrentView('checkout')}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBackToCart={() => setCurrentView('cart')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentView === 'order-tracking' && activeTrackingOrder && (
          <OrderTrackingPage
            order={activeTrackingOrder}
            onBackToOrders={() => {
              if (role === 'farmer') setCurrentView('farmer-dashboard');
              else setCurrentView('customer-dashboard');
            }}
            onNavigateToMarketplace={() => handleNavigate('marketplace')}
          />
        )}

        {currentView === 'farmer-dashboard' && (
          <FarmerDashboard
            onNavigateToChat={(customerId, customerName) =>
              handleNavigateToFarmerChat(customerId, customerName, undefined, 'Order Inquiry')
            }
            onOpenAuth={(mode, targetRole) => handleOpenAuth(mode, targetRole)}
          />
        )}

        {currentView === 'customer-dashboard' && (
          <CustomerDashboard
            onNavigateToMarketplace={(q) => handleNavigate('marketplace', q ? { search: q } : {})}
            onNavigateToMarketPrices={() => handleNavigate('market-prices')}
            onTrackOrder={(order) => {
              setActiveTrackingOrder(order);
              setCurrentView('order-tracking');
            }}
            onSelectProduct={handleSelectProduct}
            onOpenAuth={(mode, targetRole) => handleOpenAuth(mode, targetRole)}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            onOpenAuth={(mode, targetRole) => handleOpenAuth(mode, targetRole)}
          />
        )}

        {currentView === 'delivery-mgmt' && (
          <DeliveryManagementPage onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'messages' && (
          <MessagingPage
            initialRecipientId={chatParams.recipientId}
            initialRecipientName={chatParams.recipientName}
            initialProductName={chatParams.productName}
            onBack={() => {
              if (role === 'farmer') setCurrentView('farmer-dashboard');
              else setCurrentView('customer-dashboard');
            }}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsPage
            onBack={() => setCurrentView('home')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'about' && (
          <AboutPage
            onBack={() => setCurrentView('home')}
            onNavigateToMarketplace={() => handleNavigate('marketplace')}
          />
        )}

        {currentView === 'contact' && (
          <ContactPage onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'help' && (
          <HelpCenterPage
            onBack={() => setCurrentView('home')}
            onOpenVoice={() => setVoiceOpen(true)}
          />
        )}

        {currentView === 'how-it-works' && (
          <div className="py-12">
            <Home
              onNavigate={handleNavigate}
              featuredProducts={products}
              onSelectProduct={handleSelectProduct}
              onOpenVoice={() => setVoiceOpen(true)}
            />
          </div>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Global Modals */}
      <VoiceAssistantModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onNavigate={handleNavigate}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(loggedRole) => {
          if (loggedRole === 'farmer') handleNavigate('farmer-dashboard');
          else if (loggedRole === 'admin') handleNavigate('admin-dashboard');
          else handleNavigate('customer-dashboard');
        }}
      />

      <PriceComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        products={products}
        initialCropName={compareCrop}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

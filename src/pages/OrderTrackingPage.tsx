import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  ShieldCheck,
  Package,
  Calendar,
  Share2,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { orderService } from '../services/orderService';

interface OrderTrackingPageProps {
  order: Order;
  onBackToOrders: () => void;
  onNavigateToMarketplace: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  order,
  onBackToOrders,
  onNavigateToMarketplace,
}) => {
  const { language, t } = useLanguage();
  const [currentOrder, setCurrentOrder] = React.useState<Order>(order);
  const [cancelling, setCancelling] = React.useState(false);

  const handleCancelOrder = async () => {
    if (window.confirm(language === 'te' ? 'ఈ ఆర్డర్‌ను రద్దు చేయాలనుకుంటున్నారా?' : 'Are you sure you want to cancel this order?')) {
      setCancelling(true);
      try {
        const updated = await orderService.updateStatus(currentOrder.id, 'cancelled');
        if (updated) {
          setCurrentOrder(updated);
        }
      } catch (err: any) {
        alert('Failed to cancel order: ' + err.message);
      } finally {
        setCancelling(false);
      }
    }
  };

  const steps: { status: OrderStatus; labelEn: string; labelTe: string; desc: string }[] = [
    {
      status: 'placed',
      labelEn: 'Order Placed',
      labelTe: 'ఆర్డర్ చేయబడింది',
      desc: 'Order sent directly to the farmer.',
    },
    {
      status: 'accepted',
      labelEn: 'Farmer Accepted',
      labelTe: 'రైతు అంగీకరించారు',
      desc: 'Farmer accepted and confirmed crop stock.',
    },
    {
      status: 'preparing',
      labelEn: 'Fresh Harvest & Packing',
      labelTe: 'పంట కోత మరియు ప్యాకింగ్',
      desc: 'Produce harvested fresh from farm bed.',
    },
    {
      status: 'shipped',
      labelEn: 'Out for Delivery / Dispatched',
      labelTe: 'డెలివరీకి బయలుదేరింది',
      desc: 'En route to your delivery address.',
    },
    {
      status: 'delivered',
      labelEn: 'Delivered Fresh',
      labelTe: 'విజయవంతంగా చేరింది',
      desc: 'Order delivered directly to your doorstep.',
    },
  ];

  // Helper to determine step index
  const statusOrder: OrderStatus[] = ['placed', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled'];
  const currentIndex = currentOrder.status === 'cancelled' ? -1 : statusOrder.indexOf(currentOrder.status === 'ready_for_pickup' ? 'shipped' : currentOrder.status);

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToOrders}
            className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm bg-white px-3.5 py-2 rounded-xl border border-stone-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'te' ? 'అన్ని ఆర్డర్లు' : 'My Orders'}</span>
          </button>

          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Order #{order.orderNumber}
          </span>
        </div>

        {/* Success Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('orderSuccess')}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {language === 'te' ? 'ఆర్డర్ ట్రాకింగ్ వివరాలు' : 'Live Order Tracking'}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                {t('orderPlacedMessage')}
              </p>
            </div>

            {/* OTP Code for secure delivery verification */}
            {order.otpCode && order.status !== 'delivered' && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center self-start sm:self-center">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  Delivery Verification PIN
                </span>
                <span className="text-2xl font-black text-white tracking-widest">{order.otpCode}</span>
                <span className="text-[10px] text-emerald-200 block">Share with farmer on arrival</span>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Order Action */}
        {(currentOrder.status === 'placed' || currentOrder.status === 'accepted') && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-rose-900">Need to make changes or cancel?</p>
              <p className="text-[11px] text-rose-700">You can cancel your order before the farmer starts harvesting.</p>
            </div>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs shrink-0"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}

        {currentOrder.status === 'cancelled' && (
          <div className="mb-8 p-4 bg-stone-100 border border-stone-300 text-stone-800 rounded-2xl flex items-center gap-3 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>This order has been cancelled successfully.</span>
          </div>
        )}

        {/* Status Progression Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs mb-8">
          <h3 className="font-extrabold text-base text-stone-900 mb-6">
            {language === 'te' ? 'ఆర్డర్ ప్రగతి కాలక్రమం' : 'Order Lifecycle Timeline'}
          </h3>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-stone-200 -z-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${Math.min(100, (Math.max(0, currentIndex) / (steps.length - 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 relative z-10">
              {steps.map((s, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={s.status} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-md ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-emerald-200'
                          : 'bg-stone-100 text-stone-400 border border-stone-200'
                      } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>

                    <div>
                      <h4 className={`font-extrabold text-xs sm:text-sm ${isPassed ? 'text-stone-900' : 'text-stone-400'}`}>
                        {language === 'te' ? s.labelTe : s.labelEn}
                      </h4>
                      <p className="text-[11px] text-stone-500 hidden sm:block mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details & Farmer Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Farmer Contact Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider text-emerald-800">
              {language === 'te' ? 'రైతు సంప్రదింపు వివరాలు' : 'Direct Producer Contact'}
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-lg flex items-center justify-center">
                {order.farmerName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-base">{order.farmerName}</h4>
                <p className="text-xs text-stone-500">{order.farmerVillage}</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">{order.farmerPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500">
                <Truck className="w-4 h-4 text-stone-400" />
                <span>
                  Delivery Method: <strong>{order.deliveryMethod.replace('_', ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Coordinates */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider text-emerald-800">
              {language === 'te' ? 'డెలివరీ గమ్యస్థానం' : 'Delivery Destination'}
            </h3>

            <div className="flex items-start gap-3 text-xs">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900 text-sm">{order.deliveryAddress.fullName}</p>
                <p className="text-stone-600 mt-1 leading-relaxed">
                  {order.deliveryAddress.addressLine}, {order.deliveryAddress.village}, {order.deliveryAddress.mandal}, {order.deliveryAddress.district} - {order.deliveryAddress.pincode}
                </p>
                <p className="text-stone-500 mt-1">Phone: {order.deliveryAddress.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Crops Summary */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-stone-900 pb-2 border-b border-stone-100">
            {language === 'te' ? 'ఆర్డర్ చేసిన పంటలు' : 'Ordered Harvest Summary'}
          </h3>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm py-2">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      {language === 'te' ? item.productTeluguName : item.productName}
                    </span>
                    <span className="text-stone-400 text-xs">
                      {item.quantityKg} {item.unit} × ₹{item.pricePerKg}
                    </span>
                  </div>
                </div>

                <span className="font-black text-stone-900">₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline font-black text-base text-stone-900">
            <span>{t('finalTotal')}</span>
            <span className="text-2xl text-emerald-800">₹{order.finalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  Store,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PaymentMethod, Order } from '../types';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { farmerService } from '../services/farmerService';
import { deliveryService } from '../services/deliveryService';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToCart,
  onOrderSuccess,
}) => {
  const { items, totalAmount, deliveryCharge, finalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [addressLine, setAddressLine] = useState('');
  const [village, setVillage] = useState(user?.village || '');
  const [mandal, setMandal] = useState(user?.mandal || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [state, setState] = useState(user?.state || 'Andhra Pradesh');
  const [pincode, setPincode] = useState(user?.pincode || '');

  const [deliveryMethod, setDeliveryMethod] = useState<'farmer_delivery' | 'pickup' | 'partner'>('farmer_delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okhdfcbank` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(5);

  // Recalculate distance whenever village or district changes
  React.useEffect(() => {
    let isMounted = true;
    const updateDistance = async () => {
      const destination = `${village || ''} ${district || ''}`.trim() || 'Guntur';
      const origin = items[0]?.farmerVillage || 'Tenali';
      const km = await deliveryService.calculateDistance(origin, destination);
      if (isMounted) setDeliveryDistanceKm(km);
    };
    updateDistance();
    return () => { isMounted = false; };
  }, [village, district, items]);

  // Delivery charge: ₹10 per km. Farm Pickup = ₹0.
  const calculatedDeliveryFee = deliveryMethod === 'pickup' 
    ? 0 
    : deliveryService.calculateDeliveryCharge(deliveryDistanceKm, false, 10);
  const grandTotal = totalAmount + calculatedDeliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderNumber = `FC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Process payment
      await paymentService.processPayment({
        orderId: orderNumber,
        amount: grandTotal,
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
      });

      // Group items strictly by farmerId
      const farmerOrders = items.reduce((acc: any, item) => {
        if (!acc[item.farmerId]) {
          acc[item.farmerId] = {
            items: [],
            totalAmount: 0,
          };
        }
        acc[item.farmerId].items.push(item);
        acc[item.farmerId].totalAmount += item.subtotal;
        return acc;
      }, {});

      // Fetch authentic farmer profiles for each farmerId to avoid wrong farmer assignment
      for (const farmerId in farmerOrders) {
        const orderData = farmerOrders[farmerId];
        const firstItem = orderData.items[0];
        
        let actualFarmer = await farmerService.getById(farmerId);
        const farmerPhone = actualFarmer?.mobile || firstItem.farmerPhone || '+91 98480 12345';
        const farmerVillage = actualFarmer?.village || firstItem.farmerVillage || 'Tenali';
        const farmerName = actualFarmer?.fullName || firstItem.farmerName;

        // Calculate farmer-specific delivery distance & fee (₹10/km, pickup = ₹0)
        const farmerOrigin = `${farmerVillage} ${actualFarmer?.district || ''}`.trim();
        const customerDest = `${village} ${district}`.trim();
        const distKm = await deliveryService.calculateDistance(farmerOrigin, customerDest);
        const splitDeliveryCharge = deliveryMethod === 'pickup' ? 0 : deliveryService.calculateDeliveryCharge(distKm, false, 10);

        const newOrder: Order = {
          id: `ord-${Date.now()}-${farmerId}`,
          orderNumber: `${orderNumber}-${farmerId.slice(-4)}`,
          customerId: user?.id || 'cust-demo',
          customerName: fullName,
          customerPhone: phone,
          deliveryAddress: {
            fullName,
            phone,
            addressLine,
            village,
            mandal,
            district,
            state,
            pincode,
          },
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          deliveryCharge: splitDeliveryCharge,
          deliveryDistanceKm: distKm,
          finalAmount: orderData.totalAmount + splitDeliveryCharge,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
          status: 'placed',
          deliveryMethod,
          farmerId: farmerId,
          farmerName: farmerName,
          farmerPhone: farmerPhone,
          farmerVillage: farmerVillage,
          createdAt: new Date().toISOString(),
          estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 days
        };

        await orderService.create(newOrder);
      }
      
      clearCart();
      onOrderSuccess({ id: 'multiple' } as any);
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Could not complete order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <button
          onClick={onBackToCart}
          className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm mb-6 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'te' ? 'బుట్టకు తిరిగి వెళ్లండి' : 'Back to Cart'}</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mb-2">
          {t('checkoutTitle')}
        </h1>
        <p className="text-xs text-stone-500 mb-8">
          {language === 'te'
            ? 'రైతుల నుండి నేరుగా తాజా ఆహారాన్ని ఆర్డర్ చేయడానికి క్రింది వివరాలను పూరించండి'
            : 'Enter delivery coordinates and select convenient direct payment method'}
        </p>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Address & Preferences (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{t('deliveryAddress')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Full Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-stone-700 block mb-1">Street / House / Landmark *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Plot/Flat number, Street name"
                  className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village/Town *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mandal *</label>
                  <input
                    type="text"
                    required
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Method Selector */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>{t('deliveryMethod')}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'farmer_delivery'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === 'farmer_delivery'}
                    onChange={() => setDeliveryMethod('farmer_delivery')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      {language === 'te' ? 'రైతు నేరుగా డెలివరీ చేయడం' : 'Farmer Direct Home Delivery'}
                    </span>
                    <span className="text-stone-500">
                      Farmer delivers in their morning delivery round straight from farm bed.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'pickup'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block flex items-center gap-2">
                      <span>{language === 'te' ? 'పొలంలో నేరుగా తీసుకోవడం (ఉచితం)' : 'Direct Farm / Collection Hub Pickup'}</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ₹0 Fee
                      </span>
                    </span>
                    <span className="text-stone-500">
                      Pick up directly from farmer’s location in Tenali or Rythu collection centre.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    deliveryMethod === 'partner'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === 'partner'}
                    onChange={() => setDeliveryMethod('partner')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      {language === 'te' ? 'స్థానిక అగ్రి డెలివరీ భాగస్వామి' : 'Local Rural Express Courier'}
                    </span>
                    <span className="text-stone-500">
                      Delivered via verified agri-couriers with temperature-controlled crating.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>{t('paymentMethod')}</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* UPI Option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="mt-1 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm block">
                        {t('payUpi')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Instant Farmer Credit
                      </span>
                    </div>
                    <span className="text-stone-500">
                      Direct transfer to farmer’s registered Bank account via UPI VPA.
                    </span>

                    {paymentMethod === 'upi' && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 space-y-2">
                        <label className="font-bold text-stone-700 block">Your UPI ID / VPA</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. mobile@upi"
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-semibold text-xs"
                        />
                      </div>
                    )}
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">{t('payCod')}</span>
                    <span className="text-stone-500">Pay cash or scan QR when fresh harvest arrives.</span>
                  </div>
                </label>

                {/* Card */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">{t('payCard')}</span>
                    <span className="text-stone-500">Visa, Mastercard, RuPay cards supported.</span>
                  </div>
                </label>

                {/* Razorpay Sandbox */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">{t('payRazorpay')}</span>
                    <span className="text-stone-500">Integrated sandbox testing environment.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5 sticky top-24">
              <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100">
                Order Review ({items.length} crops)
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-xs">
                    <div className="truncate max-w-[180px]">
                      <span className="font-bold text-stone-800 block truncate">
                        {language === 'te' ? item.productTeluguName : item.productName}
                      </span>
                      <span className="text-stone-400">
                        {item.quantityKg} {item.unit} × ₹{item.pricePerKg}
                      </span>
                    </div>
                    <span className="font-extrabold text-stone-900">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-bold text-stone-900">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span>{t('deliveryCharge')}</span>
                    {deliveryMethod !== 'pickup' && (
                      <span className="text-[10px] text-stone-400 block font-normal">
                        ({deliveryDistanceKm} KM × ₹10/km rate)
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-stone-900">
                    {calculatedDeliveryFee === 0 ? 'FREE (Farm Pickup)' : `₹${calculatedDeliveryFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline text-base font-black text-stone-900">
                  <span>{t('finalTotal')}</span>
                  <span className="text-2xl text-emerald-800">₹{grandTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </div>
                ) : (
                  <>
                    <span>{t('placeOrder')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3 bg-stone-50 rounded-2xl text-[11px] text-stone-500 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-stone-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct Farm Gate Guarantee</span>
                </p>
                <p>Payment is credited directly to the farmer without intermediary deductions.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

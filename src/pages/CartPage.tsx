import React from 'react';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CartPageProps {
  onNavigateToMarketplace: () => void;
  onProceedToCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateToMarketplace,
  onProceedToCheckout,
}) => {
  const { items, updateQuantity, removeFromCart, totalAmount, deliveryCharge, finalAmount } = useCart();
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">{t('cartTitle')}</h1>
            <p className="text-xs text-stone-500 mt-1">
              {language === 'te'
                ? 'రైతుల నుండి నేరుగా తాజా పంటలు మీ బుట్టలో చేర్చబడ్డాయి'
                : 'Direct from rural farm beds straight to your home pantry'}
            </p>
          </div>

          <button
            onClick={onNavigateToMarketplace}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-stone-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'te' ? 'మరిన్ని పంటలు చూడండి' : 'Continue Shopping'}</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-lg mb-2">{t('emptyCart')}</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Support local growers in Tenali, Undi, and Yellamanchili by ordering direct today.
            </p>
            <button
              onClick={onNavigateToMarketplace}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl transition-all shadow-md shadow-emerald-600/20"
            >
              {t('exploreProducts')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Items List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex gap-4 items-center justify-between"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 text-sm truncate">
                      {language === 'te' ? item.productTeluguName : item.productName}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      ₹{item.pricePerKg} <span className="text-stone-400 font-normal">/{item.unit}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantityKg - 1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-extrabold text-stone-900 px-1">
                          {item.quantityKg} {item.unit}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantityKg + 1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-stone-900">₹{item.subtotal}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5 sticky top-24">
                <h3 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100">
                  {language === 'te' ? 'ఆర్డర్ సారాంశం' : 'Order Bill Summary'}
                </h3>

                <div className="space-y-3 text-xs sm:text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}</span>
                    <span className="font-bold text-stone-900">₹{totalAmount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span>{t('deliveryCharge')}</span>
                      <span className="text-[10px] text-stone-400 block">{t('freeDeliveryThreshold')}</span>
                    </div>
                    <span className="font-bold text-stone-900">
                      {deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-extrabold uppercase">FREE</span>
                      ) : (
                        `₹${deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline text-base font-black text-stone-900">
                    <span>{t('finalTotal')}</span>
                    <span className="text-2xl text-emerald-800">₹{finalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={onProceedToCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-98"
                >
                  <span>{t('proceedToCheckout')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Direct UPI Transfer / COD Available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

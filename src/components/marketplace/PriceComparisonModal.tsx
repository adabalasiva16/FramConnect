import React, { useState } from 'react';
import { X, Scale, CheckCircle2, MapPin, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';

interface PriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialCropName?: string;
  onSelectProduct: (product: Product) => void;
}

export const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  initialCropName = 'Tomato',
  onSelectProduct,
}) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCropName);

  if (!isOpen) return null;

  // Extract unique crops available
  const cropList = ['Tomato', 'Rice', 'Chilli', 'Onion', 'Banana', 'Groundnut', 'Potato', 'Jaggery'];

  // Filter products matching selected crop name (case-insensitive substring)
  const matchingProducts = products.filter((p) =>
    p.name.toLowerCase().includes(selectedCrop.toLowerCase()) ||
    p.teluguName.toLowerCase().includes(selectedCrop.toLowerCase()) ||
    (selectedCrop.toLowerCase() === 'rice' && p.category === 'grains') ||
    (selectedCrop.toLowerCase() === 'tomato' && p.name.toLowerCase().includes('tomato'))
  );

  // Find lowest price
  const minPrice = matchingProducts.length > 0
    ? Math.min(...matchingProducts.map((p) => p.pricePerKg))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {language === 'te' ? 'రైతుల వారీగా పంట ధరల పోలిక' : 'Farmer Price & Quality Comparison'}
              </h3>
              <p className="text-xs text-emerald-200">
                {language === 'te'
                  ? 'ఒకే పంటను విభిన్న రైతుల ధరలతో సరిపోల్చి ఉత్తమమైనదాన్ని ఎంచుకోండి'
                  : 'Compare the same agricultural produce across local farmers directly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Selector Tabs */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 uppercase shrink-0">
            {language === 'te' ? 'పంటను ఎంచుకోండి:' : 'Select Crop:'}
          </span>
          {cropList.map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCrop.toLowerCase() === crop.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>

        {/* Comparison Table / Cards */}
        <div className="p-6 overflow-y-auto flex-1">
          {matchingProducts.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Scale className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="font-semibold">
                {language === 'te'
                  ? `ప్రస్తుతం "${selectedCrop}" పై పోల్చడానికి ఒకే రైతు జాబితా ఉంది.`
                  : `Currently no multiple farmer listings for "${selectedCrop}".`}
              </p>
              <p className="text-xs text-stone-400 mt-1">Try selecting Tomato, Rice, or Chilli above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingProducts.map((p) => {
                const isBestPrice = p.pricePerKg === minPrice && matchingProducts.length > 1;
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-md relative bg-white ${
                      isBestPrice
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                        : 'border-stone-200'
                    }`}
                  >
                    {isBestPrice && (
                      <span className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {language === 'te' ? 'అత్యల్ప ధర!' : 'Lowest Price!'}
                      </span>
                    )}

                    <div>
                      <div className="flex gap-3 mb-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-18 h-18 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 text-sm line-clamp-1">
                            {language === 'te' ? p.teluguName : p.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-800 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{p.farmerName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{p.farmerVillage}, {p.farmerDistrict}</span>
                          </div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="space-y-1.5 py-2 border-y border-stone-100 text-xs text-stone-600">
                        <div className="flex justify-between">
                          <span className="text-stone-400">{language === 'te' ? 'ధర / కిలో:' : 'Price / kg:'}</span>
                          <span className="font-extrabold text-stone-900 text-sm">
                            ₹{p.pricePerKg} <span className="text-xs font-normal text-stone-400">/{p.unit}</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{t('availableStock')}:</span>
                          <span className="font-semibold text-stone-800">{p.availableQtyKg} {p.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{t('harvestedOn')}:</span>
                          <span className="font-medium text-stone-700">{p.harvestDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{language === 'te' ? 'పద్ధతి:' : 'Method:'}</span>
                          <span className="font-semibold text-emerald-700">
                            {p.isOrganic ? '100% Organic (సేంద్రీయం)' : 'Conventional (సాధారణ)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2 rounded-xl transition-colors text-center"
                      >
                        {t('viewDetails')}
                      </button>
                      <button
                        onClick={() => {
                          addToCart(p, 1);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t('addToCart')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

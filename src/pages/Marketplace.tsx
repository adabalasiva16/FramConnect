import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Scale,
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  Leaf,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { CATEGORIES } from '../lib/initialData';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { PriceComparisonModal } from '../components/marketplace/PriceComparisonModal';

interface MarketplaceProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  initialSearch?: string;
  initialCategory?: ProductCategory | 'all';
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  onSelectProduct,
  initialSearch = '',
  initialCategory = 'all',
}) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'newest' | 'rating'>('newest');
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonCrop, setComparisonCrop] = useState('Tomato');
  const [addedPopup, setAddedPopup] = useState<string | null>(null);

  // Extract districts available
  const districts = useMemo(() => {
    const list = new Set(products.map((p) => p.farmerDistrict));
    return Array.from(list);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.teluguName.toLowerCase().includes(q) ||
            p.farmerName.toLowerCase().includes(q) ||
            p.farmerVillage.toLowerCase().includes(q) ||
            p.farmerDistrict.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // District filter
        if (selectedDistrict !== 'all' && p.farmerDistrict !== selectedDistrict) {
          return false;
        }

        // Organic filter
        if (organicOnly && !p.isOrganic) {
          return false;
        }

        // In Stock filter
        if (inStockOnly && p.availableQtyKg <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'lowest') return a.pricePerKg - b.pricePerKg;
        if (sortBy === 'highest') return b.pricePerKg - a.pricePerKg;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default newest
        return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
      });
  }, [products, searchTerm, selectedCategory, selectedDistrict, organicOnly, inStockOnly, sortBy]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedPopup(product.id);
    setTimeout(() => setAddedPopup(null), 1800);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20">
                  {language === 'te' ? 'రైతుల నుండి నేరుగా కొనుగోలు' : '100% Direct From Farmers'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {language === 'te' ? 'రైతు బజార్ & వ్యవసాయ ఉత్పత్తుల మార్కెట్' : 'Fresh Farm Marketplace'}
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-2xl">
                {language === 'te'
                  ? 'మధ్యవర్తులు లేకుండా రైతుల నుండి నేరుగా నాణ్యమైన, సహజసిద్ధమైన తాజా కూరగాయలు, ధాన్యాలు మరియు పండ్లను పొందండి.'
                  : 'Order direct from certified farmers across Andhra Pradesh & Telangana. Support rural producers with fair farm-gate pricing.'}
              </p>
            </div>

            {/* Quick Price Comparison Button */}
            <button
              onClick={() => {
                setComparisonCrop('Tomato');
                setComparisonModalOpen(true);
              }}
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all transform hover:scale-102 shrink-0 self-start md:self-center"
            >
              <Scale className="w-5 h-5 text-emerald-700" />
              <span>{t('comparePrices')}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-8 relative max-w-3xl">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-white text-stone-900 pl-12 pr-10 py-3.5 rounded-2xl shadow-md border-0 focus:ring-2 focus:ring-emerald-400 text-sm sm:text-base placeholder-stone-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {t('catAll')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{language === 'te' ? cat.nameTe : cat.nameEn}</span>
            </button>
          ))}
        </div>

        {/* Filters and Sorting Bar */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* District dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">{language === 'te' ? 'అన్ని జిల్లాలు' : 'All Districts'}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Organic filter toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-emerald-50">
              <input
                type="checkbox"
                checked={organicOnly}
                onChange={(e) => setOrganicOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('filterOrganicOnly')}</span>
            </label>

            {/* In Stock toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-emerald-50">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t('filterAvailableOnly')}</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-4 h-4 text-stone-400" />
            <span className="font-semibold text-stone-500">{t('sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="lowest">{t('sortLowestPrice')}</option>
              <option value="highest">{t('sortHighestPrice')}</option>
              <option value="rating">{t('sortRating')}</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {language === 'te'
              ? `${filteredProducts.length} పంటలు అందుబాటులో ఉన్నాయి`
              : `Showing ${filteredProducts.length} farm-direct harvests`}
          </p>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs max-w-md mx-auto my-8">
            <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-stone-800">
              {language === 'te' ? 'ఎటువంటి పంటలు లభించలేదు' : 'No harvests found matching your filters'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {language === 'te' ? 'దయచేసి మీ శోధన పదాన్ని లేదా ఫిల్టర్లను మార్చండి.' : 'Try adjusting your search criteria or resetting filters.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDistrict('all');
                setOrganicOnly(false);
                setInStockOnly(false);
              }}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.availableQtyKg <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                >
                  {/* Image container */}
                  <div className="relative h-52 overflow-hidden bg-stone-100">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                    />

                    {/* Organic Badge */}
                    {product.isOrganic && (
                      <span className="absolute top-3 left-3 bg-emerald-700/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-300" />
                        <span>Organic</span>
                      </span>
                    )}

                    {/* Stock status indicator */}
                    {isOutOfStock ? (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                        {t('outOfStock')}
                      </span>
                    ) : product.availableQtyKg < 50 ? (
                      <span className="absolute top-3 right-3 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                        Only {product.availableQtyKg} kg left
                      </span>
                    ) : null}

                    {/* Compare Shortcut */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonCrop(product.name.split(' ')[0] || 'Tomato');
                        setComparisonModalOpen(true);
                      }}
                      title="Compare price for this crop across farmers"
                      className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-stone-800 p-2 rounded-xl backdrop-blur-md shadow-md text-xs font-semibold flex items-center gap-1 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Scale className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-[11px]">Compare</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Farmer identity header */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1">
                        <span className="font-semibold text-stone-800 truncate">{product.farmerName}</span>
                        {product.farmerVerified && (
                          <span title="Verified Producer">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>

                      {/* Location & Harvest Date */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{product.farmerVillage}, {product.farmerDistrict}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{product.harvestDate}</span>
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-extrabold text-stone-900 text-base leading-tight mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {language === 'te' ? product.teluguName : product.name}
                      </h3>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {language === 'te' ? product.descriptionTe || product.description : product.description}
                      </p>
                    </div>

                    {/* Price and Cart Action */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-stone-900">₹{product.pricePerKg}</span>
                          <span className="text-xs text-stone-500 font-medium">/{product.unit}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block">
                          {t('availableStock')}: {product.availableQtyKg} {product.unit}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isOutOfStock}
                        className={`p-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs ${
                          isOutOfStock
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : addedPopup === product.id
                            ? 'bg-emerald-700 text-white scale-105'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {addedPopup === product.id ? 'Added!' : t('addToCart')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Comparison Modal */}
      <PriceComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        products={products}
        initialCropName={comparisonCrop}
        onSelectProduct={(p) => {
          onSelectProduct(p);
          setComparisonModalOpen(false);
        }}
      />
    </div>
  );
};

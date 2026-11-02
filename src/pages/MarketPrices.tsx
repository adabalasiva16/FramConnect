import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MarketPrice } from '../types';
import { marketPriceService } from '../services/marketPriceService';
import { useLanguage } from '../contexts/LanguageContext';

interface MarketPricesProps {
  initialCrop?: string;
  onNavigateToMarketplace: (cropName: string) => void;
}

export const MarketPrices: React.FC<MarketPricesProps> = ({
  initialCrop = '',
  onNavigateToMarketplace,
}) => {
  const { language, t } = useLanguage();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialCrop);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Today at 09:30 AM');

  const supportedCrops = [
    { en: 'Tomato', te: 'టమాటా' },
    { en: 'Onion', te: 'ఉల్లిపాయలు' },
    { en: 'Potato', te: 'బంగాళాదుంపలు' },
    { en: 'Paddy / Rice (Common)', te: 'వరి ధాన్యం / బియ్యం' },
    { en: 'Chilli (Red Dry)', te: 'ఎర్ర మిరపకాయలు' },
    { en: 'Cotton (Kapas)', te: 'పత్తి' },
    { en: 'Groundnut (Pod)', te: 'వేరుశనగ కాయలు' },
    { en: 'Maize (Corn)', te: 'మొక్కజొన్న' },
    { en: 'Banana (Raw/Bunch)', te: 'అరటిపండ్లు' },
  ];

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const data = await marketPriceService.getAll();
      setPrices(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updated = await marketPriceService.refreshPrices();
      setPrices(updated);
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered prices
  const filteredPrices = prices.filter((item) => {
    if (selectedCrop !== 'all' && item.cropName.toLowerCase() !== selectedCrop.toLowerCase()) {
      return false;
    }
    if (selectedState !== 'all' && item.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }
    if (selectedDistrict !== 'all' && item.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        item.cropName.toLowerCase().includes(q) ||
        item.cropTeluguName.toLowerCase().includes(q) ||
        item.marketName.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const states = Array.from(new Set(prices.map((p) => p.state)));
  const districts = Array.from(new Set(prices.map((p) => p.district)));

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {language === 'te' ? 'అధికారిక AGMARKNET & e-NAM సమాచారం' : 'Verified APMC Mandi Feeds'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('marketPricesTitle')}
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                {t('marketPricesSubtitle')}
              </p>
            </div>

            {/* Refresh Live Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all self-start md:self-center"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing AGMARKNET...' : t('refreshPrices')}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-3xl">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'te'
                  ? 'పంట పేరు లేదా మార్కెట్ యార్డ్ ద్వారా వెతకండి (ఉదా: టమాటా, గుంటూరు, బోయినపల్లి)...'
                  : 'Search by crop or APMC mandi name (e.g. Tomato, Guntur, Bowenpally)...'
              }
              className="w-full bg-white text-stone-900 pl-12 pr-4 py-3.5 rounded-2xl shadow-md border-0 focus:ring-2 focus:ring-emerald-400 text-sm sm:text-base placeholder-stone-400 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        {/* Quick Crop Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCrop('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCrop === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {language === 'te' ? 'అన్ని పంటలు' : 'All Crops'}
          </button>
          {supportedCrops.map((c) => (
            <button
              key={c.en}
              onClick={() => setSelectedCrop(c.en)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCrop.toLowerCase() === c.en.toLowerCase()
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <span>{language === 'te' ? c.te : c.en}</span>
            </button>
          ))}
        </div>

        {/* Filters Bar & Live Stamp */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* State filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="font-semibold">{t('selectState')}:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-bold text-stone-800 text-xs focus:outline-none"
              >
                <option value="all">{language === 'te' ? 'అన్ని రాష్ట్రాలు' : 'All States'}</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* District filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="font-semibold">{t('selectDistrict')}:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 font-bold text-stone-800 text-xs focus:outline-none"
              >
                <option value="all">{language === 'te' ? 'అన్ని జిల్లాలు' : 'All Districts'}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {t('lastUpdated')}: <strong className="text-stone-800">{lastRefreshedAt}</strong>
            </span>
          </div>
        </div>

        {/* Note on conversions */}
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{t('quintalToKgNote')}</span>
        </div>

        {/* Price Table Cards */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-500">{t('loading')}</p>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto my-8">
            <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="font-bold text-stone-800">
              {language === 'te' ? 'ఎటువంటి మార్కెట్ ధరలు లభించలేదు' : 'No mandi records matched your filters'}
            </p>
            <button
              onClick={() => {
                setSelectedCrop('all');
                setSelectedState('all');
                setSelectedDistrict('all');
                setSearchTerm('');
              }}
              className="mt-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrices.map((item) => {
              // Calculate per kg equivalent
              const pricePerKgEquivalent = Math.round(item.modalPrice / 100);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-lg transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {item.dataSource}
                        </span>
                        <h3 className="font-extrabold text-lg text-stone-900 mt-1">
                          {language === 'te' ? item.cropTeluguName : item.cropName}
                        </h3>
                        <p className="text-xs font-semibold text-stone-400">
                          {language === 'te' ? item.cropName : item.cropTeluguName}
                        </p>
                      </div>

                      {/* Trend Badge */}
                      <div
                        className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
                          item.trend === 'up'
                            ? 'bg-rose-50 text-rose-700'
                            : item.trend === 'down'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {item.trend === 'up' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : item.trend === 'down' ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        <span>{item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}</span>
                      </div>
                    </div>

                    {/* Mandi & District */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-4 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-stone-800">{item.marketName}</span>
                      <span className="text-stone-400">•</span>
                      <span>{item.district}, {item.state}</span>
                    </div>

                    {/* Modal Price Highlight */}
                    <div className="my-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                            {t('modalPrice')} (సగటు ధర)
                          </span>
                          <span className="text-2xl font-black text-emerald-950">
                            ₹{item.modalPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-emerald-700 font-medium ml-1">/ Quintal</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Approx Per Kg
                          </span>
                          <span className="text-lg font-black text-emerald-800">
                            ₹{pricePerKgEquivalent}
                          </span>
                          <span className="text-xs text-emerald-700 font-medium ml-0.5">/ kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Min & Max Range */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-stone-100">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">{t('minPrice')}</span>
                        <span className="font-bold text-stone-700">₹{item.minPrice.toLocaleString()} / Qtl</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">{t('maxPrice')}</span>
                        <span className="font-bold text-stone-700">₹{item.maxPrice.toLocaleString()} / Qtl</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link to Buy Direct */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.marketDate}</span>
                    </span>

                    <button
                      onClick={() => onNavigateToMarketplace(item.cropName.split(' ')[0])}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
                    >
                      <span>{language === 'te' ? 'రైతుల వద్ద కొనుగోలు' : 'Buy From Farmers'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

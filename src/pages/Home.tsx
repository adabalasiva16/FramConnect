import React, { useState } from 'react';
import {
  Sprout,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Truck,
  Leaf,
  Scale,
  ArrowRight,
  Star,
  MapPin,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  DollarSign,
  Mic,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { CATEGORIES } from '../lib/initialData';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  onNavigate: (view: string, param?: any) => void;
  featuredProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenVoice: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  featuredProducts,
  onSelectProduct,
  onOpenVoice,
}) => {
  const { language, t } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const [workflowTab, setWorkflowTab] = useState<'farmer' | 'consumer'>('farmer');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = language === 'te'
    ? [
        {
          q: 'ఫార్మ్‌కనెక్ట్ రైతులకు ఎలా సహాయపడుతుంది?',
          a: 'ఫార్మ్‌కనెక్ట్ ద్వారా రైతులు తమ వ్యవసాయ ఉత్పత్తులను ఎటువంటి మధ్యవర్తులు (దళారులు) లేకుండా నేరుగా వినియోగదారులకు తమకు నచ్చిన ధరకు అమ్ముకోవచ్చు. దీనివల్ల రైతులకు 30% నుండి 40% వరకు అధిక లాభం లభిస్తుంది.',
        },
        {
          q: 'వినియోగదారులకు తాజా కూరగాయలు ఎలా అందుతాయి?',
          a: 'మీరు ఆర్డర్ చేసిన వెంటనే రైతు పొలంలో తాజాగా కోసి ప్యాక్ చేస్తారు. అదే రోజు లేదా మరుసటి రోజు ఉదయమే మీ ఇంటి వద్దకు తాజా పంట చేరుతుంది.',
        },
        {
          q: 'మార్కెట్ ధరల సమాచారం ఎంతవరకు ఖచ్చితమైనది?',
          a: 'మా ప్లాట్‌ఫారమ్‌లో చూపించే ధరలు కేంద్ర మరియు రాష్ట్ర ప్రభుత్వ వ్యవసాయ మార్కెటింగ్ శాఖలు (AGMARKNET & e-NAM) అధికారికంగా విడుదల చేసే మోడల్ రేట్లు.',
        },
        {
          q: 'తెలుగులో మాట్లాడి ఆర్డర్ చేయవచ్చా?',
          a: 'అవును! మా వాయిస్ అసిస్టెంట్ ద్వారా మీరు తెలుగులో నేరుగా మాట్లాడి పంటలను వెతకవచ్చు మరియు మార్కెట్ ధరలు తెలుసుకోవచ్చు.',
        },
      ]
    : [
        {
          q: 'How does FarmConnect eliminate middlemen?',
          a: 'FarmConnect provides a direct digital link connecting farming families in Andhra Pradesh and Telangana directly to consumers. Farmers list harvests at fair MSP prices and receive 100% of the sale value via UPI without trader deductions.',
        },
        {
          q: 'How fresh is the produce received by consumers?',
          a: 'Harvests are picked-to-order early morning by farmers and dispatched on the same day, reaching consumer doorsteps within 24 hours compared to 4-5 days through conventional wholesale markets.',
        },
        {
          q: 'Are the displayed APMC Mandi rates authentic?',
          a: 'Yes. All displayed market prices are synchronized with official AGMARKNET and e-NAM agricultural produce committee datasets, displaying daily minimum, maximum, and modal benchmark rates.',
        },
        {
          q: 'Can farmers with basic smartphone knowledge use this platform?',
          a: 'Absolutely! Our bilingual Telugu and English voice assistant enables farmers to upload crops, check orders, and inquire mandi rates simply by speaking into their microphone.',
        },
      ];

  return (
    <div className="bg-stone-50 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 text-white pt-12 sm:pt-20 pb-24 sm:pb-32 px-4 sm:px-6">
        {/* Decorative backdrop glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-emerald-400/20 shadow-xs backdrop-blur-md">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>{t('appTagline')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
              {t('heroTitle')}
            </h1>

            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
              {t('heroSubtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => onNavigate('marketplace')}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-102 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-950" />
                <span>{t('exploreProducts')}</span>
              </button>

              <button
                onClick={() => {
                  if (isAuthenticated && role === 'farmer') {
                    onNavigate('farmer-dashboard');
                  } else {
                    onNavigate('auth', { mode: 'register', role: 'farmer' });
                  }
                }}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base px-7 py-4 rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <Sprout className="w-5 h-5 text-emerald-300" />
                <span>{t('joinAsFarmer')}</span>
              </button>

              {/* Voice button in hero */}
              <button
                onClick={onOpenVoice}
                className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-bold text-sm sm:text-base px-5 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>{t('navVoiceAssistant')}</span>
              </button>
            </div>

            {/* Three Pillar Metric Badges */}
            <div className="pt-10 grid grid-cols-3 gap-3 sm:gap-6 border-t border-emerald-800/60 max-w-2xl mx-auto text-left">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-white block">0%</span>
                <span className="text-[11px] sm:text-xs text-emerald-200 font-semibold">
                  {language === 'te' ? 'దళారులు లేరు' : 'Middlemen Commission'}
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-emerald-300 block">&lt; 24 Hrs</span>
                <span className="text-[11px] sm:text-xs text-emerald-200 font-semibold">
                  {language === 'te' ? 'పొలం నుండి ఇంటికి' : 'Farm to Doorstep'}
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-amber-300 block">100%</span>
                <span className="text-[11px] sm:text-xs text-emerald-200 font-semibold">
                  {language === 'te' ? 'రైతుకు గిట్టుబాటు ధర' : 'Fair Farmer Earnings'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-10 sm:-mt-14 relative z-20 mb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                {language === 'te' ? 'పంటల వర్గాలు' : 'Harvest Categories'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Explore fresh direct farm offerings by category</p>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('marketplace', { category: cat.id })}
                className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200/80 hover:border-emerald-300 text-center transition-all group flex flex-col items-center justify-between min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-110 transition-transform">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-900 leading-tight">
                  {language === 'te' ? cat.nameTe : cat.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (Direct From Farm) */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Direct Harvest Today</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              {language === 'te' ? 'నేడు కోసిన తాజా పంటలు' : 'Farm-Fresh Harvests Direct From Growers'}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-end"
          >
            <span>{t('exploreProducts')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="relative h-48 bg-stone-100 overflow-hidden">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                />
                {p.isOrganic && (
                  <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-300" />
                    Organic
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span className="truncate">{p.farmerName} • {p.farmerVillage}</span>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {language === 'te' ? p.teluguName : p.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
                  <span className="text-lg font-black text-stone-900">
                    ₹{p.pricePerKg} <span className="text-xs font-normal text-stone-400">/{p.unit}</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 group-hover:underline">
                    {t('viewDetails')} →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW FARMCONNECT WORKS (Interactive tab) */}
      <section className="bg-stone-100 py-20 px-4 sm:px-6 mb-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {t('navHowItWorks')}
            </span>
            <h2 className="text-3xl font-black text-stone-900 mt-2">
              {language === 'te' ? 'ఫార్మ్‌కనెక్ట్ ఎలా పనిచేస్తుంది?' : 'Simple, Transparent Farm-to-Fork Journey'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2">
              Designed for ease of use, even for rural farmers with limited digital smartphone knowledge.
            </p>

            {/* Workflow Toggle */}
            <div className="inline-flex p-1 bg-stone-200 rounded-2xl mt-6">
              <button
                onClick={() => setWorkflowTab('farmer')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  workflowTab === 'farmer'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                🌾 {language === 'te' ? 'రైతు ప్రయాణం (Farmer)' : 'For Farmers'}
              </button>
              <button
                onClick={() => setWorkflowTab('consumer')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  workflowTab === 'consumer'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                🛒 {language === 'te' ? 'వినియోగదారు ప్రయాణం (Consumer)' : 'For Consumers'}
              </button>
            </div>
          </div>

          {/* Workflow Steps Cards */}
          {workflowTab === 'farmer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  1
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'సులభంగా నమోదు' : 'Register with Mobile'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Sign up with village, district, and mobile number. Verified by agricultural department passbook.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  2
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'పంటలను అప్‌లోడ్ చేయండి' : 'Upload Harvest'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Speak in Telugu into our voice assistant or use simple forms to set your fair price/kg and available stock.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  3
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'ఆర్డర్‌లను స్వీకరించండి' : 'Accept Orders'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Receive direct order alerts with customer contact info. Pack fresh harvest for collection or delivery.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  4
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'నేరుగా UPI చెల్లింపు' : 'Direct Bank Credit'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Receive instant 100% money transfer to your bank account without deductions from agents or commission brokers.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  1
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'మార్కెట్ శోధించండి' : 'Browse Fresh Harvests'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Explore vegetables, aged Godavari rice, Guntur chillies, and orchard fruits harvested this morning.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  2
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'ధరలను పోల్చండి' : 'Compare Farmer Prices'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Use our 1-click comparison tool to compare rates, distance, and organic credentials across local farmers.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  3
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'ఆర్డర్ నమోదు చేయండి' : 'Place Direct Order'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Choose delivery or hub pickup. Pay securely with UPI, cards, or Cash on Delivery.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs relative">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                  4
                </span>
                <h4 className="font-bold text-stone-900 text-base mb-1">
                  {language === 'te' ? 'తాజా ఆహారాన్ని ఆస్వాదించండి' : 'Farm-to-Table Freshness'}
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Track delivery progress live with verification PIN, ensuring wholesome chemical-free nutrition for your family.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. BENEFITS FOR FARMERS & CONSUMERS */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Farmers Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-8 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {language === 'te' ? 'రైతులకు ప్రయోజనాలు' : 'Benefits for Farmers'}
                </span>
              </div>
              <h3 className="text-2xl font-black mb-4">
                {language === 'te' ? 'రైతులకు 35% అధిక లాభం' : 'Fair Price Empowerment for Producers'}
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Eliminate abusive intermediary commission cuts and delayed trader settlements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Daily live access to APMC mandi benchmarks to set confident farm-gate pricing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct bilingual Telugu voice assistant removes technology barriers.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (isAuthenticated && role === 'farmer') {
                  onNavigate('farmer-dashboard');
                } else {
                  onNavigate('auth', { mode: 'register', role: 'farmer' });
                }
              }}
              className="mt-8 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs sm:text-sm py-3 px-5 rounded-xl transition-all self-start"
            >
              {t('joinAsFarmer')} →
            </button>
          </div>

          {/* Consumers Card */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {language === 'te' ? 'వినియోగదారులకు ప్రయోజనాలు' : 'Benefits for Consumers'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-stone-900 mb-4">
                {language === 'te' ? 'వినియోగదారులకు తాజా, స్వచ్ఛమైన ఆహారం' : 'Farm-Fresh Purity for Families'}
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% chemical-free and heirloom crops directly traceable to verified village farms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prices lower than supermarkets and cold storages by eliminating retail markups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Live multi-farmer price comparison ensures best value per kilogram.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('marketplace')}
              className="mt-8 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl transition-all self-start"
            >
              {t('exploreProducts')} →
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 mb-24">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            {language === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు (FAQ)' : 'Got Questions? We Have Answers.'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-5 font-extrabold text-sm sm:text-base text-stone-900 flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

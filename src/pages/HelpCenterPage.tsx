import React, { useState } from 'react';
import { HelpCircle, Mic, Sprout, ShoppingBag, CreditCard, Truck, ArrowLeft, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HelpCenterPageProps {
  onBack: () => void;
  onOpenVoice: () => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onBack, onOpenVoice }) => {
  const { language, t } = useLanguage();
  const [activeTopic, setActiveTopic] = useState<'voice' | 'farmer' | 'buyer' | 'payment'>('voice');

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm mb-6 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-900">{t('navHelp')}</h1>
              <p className="text-xs text-stone-500">
                {language === 'te'
                  ? 'రైతులు మరియు కొనుగోలుదారుల కోసం స్పష్టమైన గైడ్'
                  : 'Step-by-step guides for farmers, consumers, and voice navigation'}
              </p>
            </div>
          </div>
        </div>

        {/* Topic Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          <button
            onClick={() => setActiveTopic('voice')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTopic === 'voice'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Assistant Guide</span>
          </button>

          <button
            onClick={() => setActiveTopic('farmer')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTopic === 'farmer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Farmer Listing Guide</span>
          </button>

          <button
            onClick={() => setActiveTopic('buyer')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTopic === 'buyer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ordering & Delivery</span>
          </button>

          <button
            onClick={() => setActiveTopic('payment')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTopic === 'payment'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>UPI & Payments</span>
          </button>
        </div>

        {/* Topic Detail */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-stone-600 leading-relaxed">
          {activeTopic === 'voice' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900">How to Use the Bilingual Voice Assistant</h2>
              <p>
                FarmConnect features built-in Web Speech recognition and Google Gemini natural language interpretation. You can interact in pure spoken Telugu (తెలుగు) or Indian English.
              </p>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-950 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                  Telugu Sample Commands:
                </span>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  <li>"టమాటా ధర ఎంత?" (Opens live tomato mandi prices)</li>
                  <li>"కొత్త పంటను జోడించు" (Opens new crop listing form)</li>
                  <li>"నా ఆర్డర్లు చూపించు" (Navigates to your orders)</li>
                  <li>"బియ్యం ఉత్పత్తులను చూపించు" (Filters marketplace for rice)</li>
                </ul>
              </div>
              <button
                onClick={onOpenVoice}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Launch Voice Assistant Now</span>
              </button>
            </div>
          )}

          {activeTopic === 'farmer' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900">Farmer Crop Upload & Order Fulfillment</h2>
              <p>
                Listing your harvest is simple:
              </p>
              <ol className="list-decimal list-inside space-y-2 font-medium text-stone-700">
                <li>Log in to your <strong>Farmer Dashboard</strong>.</li>
                <li>Tap <strong>Add New Product</strong>.</li>
                <li>Enter the crop name, variety (e.g. Sona Masoori, Teja Chilli), price/kg, and harvest date.</li>
                <li>Toggle <strong>Organic Farming</strong> if grown pesticide-free.</li>
                <li>When orders arrive, review customer location, mark <em>Accepted</em>, pack the harvest, and mark <em>Shipped</em>.</li>
              </ol>
            </div>
          )}

          {activeTopic === 'buyer' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900">Customer Guide: Ordering & Fresh Delivery</h2>
              <p>
                Browse crops harvested directly by verified farmers in Guntur, Krishna, and Godavari delta districts. Use the <strong>Compare Prices</strong> feature to see side-by-side rates from multiple growers. Every order includes direct farmer contact information and real-time status progression.
              </p>
            </div>
          )}

          {activeTopic === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-900">Direct Payments & UPI Safety</h2>
              <p>
                FarmConnect supports UPI (Google Pay, PhonePe, Paytm, BHIM), debit/credit cards, and Cash on Delivery. Payments are held in secure escrow and credited directly to the farmer upon delivery without intermediary cuts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

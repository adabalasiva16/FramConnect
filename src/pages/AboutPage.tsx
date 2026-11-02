import React from 'react';
import { Sprout, ShieldCheck, HeartHandshake, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutPageProps {
  onBack: () => void;
  onNavigateToMarketplace: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onNavigateToMarketplace }) => {
  const { language, t } = useLanguage();

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

        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>About FarmConnect</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
              {language === 'te'
                ? 'రైతుల నుండి నేరుగా వినియోగదారుల వరకు - విప్లవాత్మక అగ్రిటెక్ వేదిక'
                : 'Connecting Farmers Directly to Consumers Without Intermediaries'}
            </h1>
            <p className="text-stone-600 text-sm sm:text-base mt-4 leading-relaxed">
              {language === 'te'
                ? 'భారతదేశంలో వ్యవసాయ రంగం ఎదుర్కొంటున్న ప్రధాన సమస్య దళారీల వ్యవస్థ. రైతులు చెమటోడ్చి పండించిన పంటలకు దళారులు నామమాత్రపు ధర చెల్లించి, మార్కెట్లో వినియోగదారులకు రెండింతల ధరకు అమ్ముతున్నారు. ఫార్మ్‌కనెక్ట్ ఈ సమస్యకు ఆధునిక సాంకేతిక పరిష్కారం.'
                : 'In traditional Indian agriculture, multi-tier commission agents and brokers capture up to 55% of the retail crop value while farmers struggle with unremunerative prices. FarmConnect was built to disrupt this cycle by building a direct, transparent digital bridge between rural growers and urban/suburban consumers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
              <h3 className="font-bold text-stone-900 text-base mb-2">Our Mission</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Ensure every farming family receives fair price value for their harvest, while delivering wholesome, farm-fresh heirloom nutrition to consumers within 24 hours of harvest.
              </p>
            </div>

            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <h3 className="font-bold text-emerald-950 text-base mb-2">Technology for Everyone</h3>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                We remove digital literacy barriers through our bilingual Telugu & English Voice Assistant, enabling farmers of all ages to manage crops and prices simply by speaking.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100">
            <h3 className="font-extrabold text-lg text-stone-900 mb-4">Core Principles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-black text-emerald-700 text-lg block mb-1">01</span>
                <h4 className="font-bold text-stone-900 mb-1">Zero Intermediaries</h4>
                <p className="text-stone-500">Every rupee paid by the consumer goes straight to the farmer’s bank account.</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-black text-emerald-700 text-lg block mb-1">02</span>
                <h4 className="font-bold text-stone-900 mb-1">Transparent Mandi Rates</h4>
                <p className="text-stone-500">Real-time daily feeds from AGMARKNET & e-NAM prevent price exploitation.</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-black text-emerald-700 text-lg block mb-1">03</span>
                <h4 className="font-bold text-stone-900 mb-1">100% Traceability</h4>
                <p className="text-stone-500">Know the exact village, farmer, and harvest date behind every meal on your table.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

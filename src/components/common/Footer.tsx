import React from 'react';
import { Sprout, Phone, Mail, MapPin, Heart, Shield, CheckCircle2, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Farm<span className="text-emerald-400">Connect</span>
              </span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
              {language === 'te'
                ? 'రైతుల ఉత్పత్తులకు గిట్టుబాటు ధర కల్పిస్తూ, వినియోగదారులకు వ్యవసాయ క్షేత్రాల నుంచే నేరుగా తాజా ఆహారాన్ని అందించే నమ్మకమైన డిజిటల్ అగ్రిటెక్ వేదిక.'
                : 'Direct digital agricultural marketplace eliminating intermediaries, guaranteeing fair MSP pricing for farmers and wholesome farm-fresh harvests for families.'}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                {language === 'te' ? '100% రైతు ధృవీకరణ' : '100% Verified Farmers'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {language === 'te' ? 'నేరుగా చెల్లింపు' : 'Direct UPI Transfers'}
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              {language === 'te' ? 'త్వరిత లింకులు' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition-colors">
                  {t('navHome')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-emerald-400 transition-colors">
                  {t('navMarketplace')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('market-prices')} className="hover:text-emerald-400 transition-colors">
                  {t('navMarketPrices')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-emerald-400 transition-colors">
                  {t('navHowItWorks')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('delivery-mgmt')} className="hover:text-emerald-400 transition-colors">
                  {language === 'te' ? 'డెలివరీ & సేకరణ కేంద్రాలు' : 'Delivery & Hubs'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-emerald-400 transition-colors">
                  {language === 'te' ? 'అడ్మిన్ పోర్టల్' : 'Admin Portal'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Farmers & Producers */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              {language === 'te' ? 'రైతు సేవలు' : 'For Farmers'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('farmer-dashboard')} className="hover:text-emerald-400 transition-colors">
                  {t('navFarmerDashboard')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('add-product')} className="hover:text-emerald-400 transition-colors">
                  {t('addNewProduct')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('market-prices')} className="hover:text-emerald-400 transition-colors">
                  {language === 'te' ? 'నేటి మార్కెట్ యార్డ్ రేట్లు' : 'Live Mandi Yard Rates'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-emerald-400 transition-colors">
                  {language === 'te' ? 'రైతు గైడ్ & సహాయం' : 'Farmer Training Guide'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Contact */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              {language === 'te' ? 'సహాయం & చిరునామా' : 'Support & Contact'}
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Rythu Bhavan, MG Road, Vijayawada, AP - 520010</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1800-425-1551 (Kisan Helpline)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@farmconnect.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 FarmConnect. All rights reserved. Connecting Farmers Directly to Consumers.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Farmers
            </span>
            <span>•</span>
            <span>English & Telugu (తెలుగు)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

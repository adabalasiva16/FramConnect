import React, { useState } from 'react';
import { X, Sprout, ShoppingBag, ShieldCheck, User, Lock, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const { language, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('Tenali');
  const [mandal, setMandal] = useState('Tenali');
  const [district, setDistrict] = useState('Guntur');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('522201');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    // Delegate to AuthPage for mandatory Firebase Email Verification Link flow
    const event = new CustomEvent('farmconnect_open_auth', {
      detail: { mode, role: selectedRole, email }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {mode === 'login'
                  ? language === 'te' ? 'ఫార్మ్‌కనెక్ట్ లాగిన్' : 'Login to FarmConnect'
                  : language === 'te' ? 'కొత్త ఖాతా నమోదు' : 'Create FarmConnect Account'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Mode Switcher */}
          <div className="flex bg-stone-100 p-1 rounded-2xl mb-5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'login' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t('navLogin')}
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'register' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t('navRegister')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {/* Role Selection */}
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {language === 'te' ? 'మీ పాత్రను ఎంచుకోండి:' : 'Select Your Role:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('farmer')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    selectedRole === 'farmer'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  🌾 {language === 'te' ? 'రైతు' : 'Farmer'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    selectedRole === 'customer'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  🛒 {language === 'te' ? 'వినియోగదారు' : 'Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    selectedRole === 'admin'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  🛡️ {language === 'te' ? 'అడ్మిన్' : 'Admin'}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="font-bold text-stone-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Venkata Subba Reddy"
                  className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-stone-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="font-bold text-stone-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-stone-700 block mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village *</label>
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
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
            >
              <span>{mode === 'login' ? t('navLogin') : t('navRegister')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

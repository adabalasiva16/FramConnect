import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  onSuccess: (role: UserRole) => void;
  onBack: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'US / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'farmer',
  onSuccess,
  onBack,
}) => {
  const { 
    login, 
    loginWithMobileOrEmail, 
    register, 
    sendPasswordReset, 
    loginWithGoogle,
    resendVerificationLink,
    refreshUserStatus
  } = useAuth();
  const { language, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await loginWithGoogle(selectedRole);
      onSuccess(selectedRole);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Location fields
  const [village, setVillage] = useState('Tenali');
  const [mandal, setMandal] = useState('Tenali');
  const [district, setDistrict] = useState('Guntur');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('522201');
  const [farmingExperience, setFarmingExperience] = useState<number>(10);
  const [bio, setBio] = useState('');

  // Verification status
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendLink = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await resendVerificationLink();
      setSuccessMsg(t('verifyEmailSent'));
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsSubmitting(true);
    try {
      const isVerified = await refreshUserStatus();
      if (isVerified) {
        setSuccessMsg(t('verificationSuccess'));
        setVerificationPending(false);
        setErrorMsg('');
        setTimeout(() => onSuccess(selectedRole), 1500);
      } else {
        setErrorMsg(t('verificationIncomplete'));
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to reset your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSuccessMsg('Password reset link sent to your email inbox.');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Admin Bypass: Admin uses direct Firebase Auth (Email/Password) without OTP
    if (selectedRole === 'admin') {
      if (mode === 'register') {
        setErrorMsg('Admin account registration is disabled. Please sign in using existing credentials.');
        return;
      }
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please enter both admin email and password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Admin password must be at least 6 characters.');
        return;
      }
      setIsSubmitting(true);
      try {
        const success = await login(email.trim(), password, 'admin');
        if (success) {
          console.log('[Admin Portal] Login successful. Redirecting...');
          onSuccess('admin');
        }
      } catch (err: any) {
        console.error('[Admin Login Error]', err);
        setErrorMsg(err.message || 'Admin authentication failed. Please check your credentials.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Farmer / Customer Flow (Firebase Email Verification)
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanLocalNumber = mobile.replace(/\D/g, '');
      const fullPhone = `${countryCode}${cleanLocalNumber}`;

      if (mode === 'login') {
        try {
          const foundProfile = await loginWithMobileOrEmail(cleanEmail, password || 'farmconnect123', selectedRole);
          if (!foundProfile) {
            const foundByMobile = await loginWithMobileOrEmail(fullPhone, password || 'farmconnect123', selectedRole);
            if (!foundByMobile) {
              throw new Error(`No registered ${selectedRole} account found for ${cleanEmail}. Please register first.`);
            }
          }
          onSuccess(selectedRole);
        } catch (authErr: any) {
          if (authErr.message.includes('VERIFY_EMAIL:')) {
            setVerificationPending(true);
            setErrorMsg(''); // Clear any previous error message
            setSuccessMsg(t('verifyEmailMessage')); // Use success message instead of error
            return;
          }
          throw authErr;
        }
      } else {
        // Registration
        if (!fullName.trim()) {
          throw new Error('Please enter your full legal name.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        try {
          const success = await register({
            fullName,
            email: cleanEmail,
            mobile: fullPhone,
            village,
            mandal,
            district,
            state,
            pincode,
            role: selectedRole,
            farmingExperience: selectedRole === 'farmer' ? farmingExperience : undefined,
            bio,
            password: password || 'farmconnect123',
          });
          
          if (success) {
            onSuccess(selectedRole);
          } else {
            throw new Error('Registration failed. This email might already be in use.');
          }
        } catch (regErr: any) {
          if (regErr.message.includes('VERIFY_EMAIL_SENT:')) {
            setVerificationPending(true);
            setErrorMsg(''); // Clear error message when switching to verification state
            setSuccessMsg(t('verifyEmailSent'));
            return;
          }
          throw regErr;
        }
      }
    } catch (err: any) {
      console.error('[Auth Flow Error]', err);
      const msg = err.message || '';
      
      if (msg.includes('VERIFY_EMAIL_SENT:')) {
        setVerificationPending(true);
        setErrorMsg('');
        setSuccessMsg(t('verifyEmailSent'));
      } else if (msg.includes('VERIFY_EMAIL:')) {
        setVerificationPending(true);
        setErrorMsg('');
        setSuccessMsg(t('verifyEmailMessage'));
      } else if (msg.includes('COLLISION:')) {
        setErrorMsg(msg);
        // We stay in register mode but show the "Switch to Login" button via existing UI logic
      } else {
        setErrorMsg(msg || 'Authentication error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-xl px-4 sm:px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm mb-6 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'te' ? 'హోమ్ పేజీకి తిరిగి వెళ్లండి' : 'Back to Home'}</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Header Banner - NO LOGO */}
          <div className="px-6 py-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
            <div>
              <h1 className="text-xl sm:text-2xl font-black">
                {mode === 'login'
                  ? language === 'te' ? 'ఫార్మ్‌కనెక్ట్ ఖాతా లాగిన్' : 'Login to FarmConnect'
                  : language === 'te' ? 'కొత్త ప్రొఫైల్ నమోదు చేసుకోండి' : 'Create New Profile'}
              </h1>
              <p className="text-xs text-emerald-200 mt-1">
                {selectedRole === 'admin'
                  ? 'Administrator Firebase Authentication Portal'
                  : selectedRole === 'farmer'
                  ? 'Farmer Mobile OTP & Verified Portal'
                  : 'Customer Mobile OTP Verified Marketplace'}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Profile Role Selector */}
            <div className="mb-6">
              <label className="font-bold text-stone-700 block mb-2 text-xs uppercase tracking-wider">
                {language === 'te' ? 'మీ పాత్రను ఎంచుకోండి:' : 'Select Portal Role:'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('farmer');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                    selectedRole === 'farmer'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-base">🌾</span>
                  <span>{language === 'te' ? 'రైతు' : 'Farmer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('customer');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                    selectedRole === 'customer'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-base">🛒</span>
                  <span>{language === 'te' ? 'వినియోగదారు' : 'Customer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('admin');
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                    selectedRole === 'admin'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'te' ? 'అడ్మిన్' : 'Admin'}</span>
                </button>
              </div>
            </div>

            {/* Mode Tabs / Admin Notice */}
            {selectedRole === 'admin' ? (
              <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block font-bold">Administrator Portal Login</strong>
                  <span>Profile creation is disabled. Please sign in using your Firebase Authentication credentials.</span>
                </div>
              </div>
            ) : (
              <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {t('navLogin')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {language === 'te' ? 'కొత్త ప్రొఫైల్ (రిజిస్టర్)' : 'Create New Profile'}
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex flex-col gap-2 text-xs font-semibold animate-fade-in shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg.replace('COLLISION: ', '')}</span>
                </div>
                
                {/* Contextual Action Links */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 ml-6">
                  {errorMsg.includes('COLLISION') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="text-emerald-700 hover:underline font-black text-[10px] uppercase tracking-wider text-left"
                    >
                      Switch to Login
                    </button>
                  )}
                  
                  {(selectedRole === 'admin' || errorMsg.includes('password') || errorMsg.includes('COLLISION')) && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-emerald-700 hover:underline font-black text-[10px] uppercase tracking-wider text-left"
                    >
                      Forgot Password? Reset it
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* ADMIN LOGIN FORM */}
              {selectedRole === 'admin' ? (
                <>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@farmconnect.org"
                      className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">Admin Password *</label>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-stone-200 rounded-xl p-3 pr-10 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="relative flex items-center justify-center py-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200"></div>
                      </div>
                      <span className="relative bg-white px-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Or authenticate via
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full bg-white border-2 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-stone-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign in with Google Authority</span>
                    </button>
                  </div>
                </>
              ) : (
                /* FARMER / CUSTOMER MOBILE OTP VERIFICATION PORTAL */
                <>
                  {mode === 'register' && (
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        {language === 'te' ? 'పూర్తి పేరు *' : 'Full Legal Name *'}
                      </label>
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

                  {/* EMAIL FIELD (Always required) */}
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        {language === 'te' ? 'ఇమెయిల్ చిరునామా *' : 'Email Address *'}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          disabled={verificationPending}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className={`w-full border border-stone-200 rounded-xl p-3 pl-10 focus:outline-none focus:border-emerald-500 font-medium ${verificationPending ? 'bg-stone-50 text-stone-500' : 'bg-white'}`}
                        />
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        {verificationPending && (
                          <button
                            type="button"
                            onClick={() => { 
                              setVerificationPending(false); 
                              setErrorMsg('');
                              setSuccessMsg('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </div>

                    {verificationPending && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 space-y-4 animate-fade-in shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-emerald-600 text-white p-1.5 rounded-lg shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-black text-emerald-950 text-xs uppercase tracking-wider">
                              {t('verifyEmailTitle')}
                            </h4>
                            <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                              {language === 'te'
                                ? 'మేము మీ ఈమెయిల్‌కు వెరిఫికేషన్ లింక్‌ను పంపాము. దయచేసి దానిపై క్లిక్ చేసి, ఇక్కడ "రిఫ్రెష్" బటన్ నొక్కండి.'
                                : 'We sent a verification link to your email. Click it, then press "Refresh Status" here.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleRefreshStatus}
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                            <span>{t('refreshStatus')}</span>
                          </button>

                          <div className="flex items-center justify-between px-1">
                            {resendCooldown > 0 ? (
                              <span className="text-[10px] font-bold text-stone-400">Resend link in {resendCooldown}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendLink}
                                className="text-[10px] font-black text-emerald-700 hover:underline"
                              >
                                {t('resendVerification')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!verificationPending && (
                      <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-emerald-900 leading-relaxed">
                          {language === 'te' 
                            ? 'భద్రత కోసం మేము మీ ఈమెయిల్ చిరునామాను వెరిఫై చేస్తాము.' 
                            : 'For security, we will verify your email address via a secure link.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* MOBILE PHONE NUMBER FIELD */}
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {language === 'te' ? 'మొబైల్ నంబర్ *' : 'Mobile Phone Number *'}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="border border-stone-200 rounded-xl p-3 font-bold bg-white text-xs shrink-0"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, countryCode === '+91' ? 10 : 12))}
                        placeholder={countryCode === '+91' ? '9848012345' : '1234567890'}
                        className="flex-1 border border-stone-200 rounded-xl p-3 font-bold bg-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        {language === 'te' ? 'పాస్‌వర్డ్ *' : 'Password *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full border border-stone-200 rounded-xl p-3 pr-10 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">
                          {language === 'te' ? 'పాస్‌వర్డ్ నిర్ధారించండి *' : 'Confirm Password *'}
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Location Fields (if registering) */}
                  {mode === 'register' && (
                    <div className="pt-2 border-t border-stone-100 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                        {language === 'te' ? 'ప్రాంతం మరియు చిరునామా వివరాలు' : 'Location & Address Details'}
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">Village / City *</label>
                          <input
                            type="text"
                            required
                            value={village}
                            onChange={(e) => setVillage(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">Mandal *</label>
                          <input
                            type="text"
                            required
                            value={mandal}
                            onChange={(e) => setMandal(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">District *</label>
                          <input
                            type="text"
                            required
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl p-2.5 font-medium"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl p-2.5 font-bold"
                          />
                        </div>
                      </div>

                      {/* Farmer Specific Fields */}
                      {selectedRole === 'farmer' && (
                        <div className="pt-2 border-t border-stone-100 space-y-3">
                          <div>
                            <label className="font-bold text-stone-600 block mb-1">
                              {language === 'te' ? 'వ్యవసాయ అనుభవం (సంవత్సరాలు)' : 'Farming Experience (Years)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={farmingExperience}
                              onChange={(e) => setFarmingExperience(Number(e.target.value))}
                              className="w-full border border-stone-200 rounded-xl p-2.5 font-bold"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-stone-600 block mb-1">
                              {language === 'te' ? 'పండించే పంటల వివరాలు / బయో' : 'Farm Profile Description'}
                            </label>
                            <textarea
                              rows={2}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              placeholder="e.g. Cultivating pesticide-free country tomatoes, chilli and paddy with drip irrigation."
                              className="w-full border border-stone-200 rounded-xl p-2.5"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm mt-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'admin' 
                        ? (mode === 'login' ? t('navLogin') : 'Register Admin')
                        : (mode === 'login'
                            ? (verificationPending ? (language === 'te' ? 'లాగిన్ ప్రయత్నించండి' : 'Try Logging In') : t('navLogin'))
                            : (verificationPending ? (language === 'te' ? 'రిజిస్టర్ విజయవంతమైంది' : 'Registration Successful') : 'Register & Verify Profile'))
                      }
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
              {mode === 'login' ? (
                <p>
                  Don't have a profile yet?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Create a new verified profile
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

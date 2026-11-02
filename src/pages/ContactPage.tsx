import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const { language, t } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setFormData({ name: '', email: '', mobile: '', subject: '', message: '' });
  };

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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            <h1 className="text-2xl font-black text-stone-900 mb-2">{t('navContact')}</h1>
            <p className="text-xs text-stone-500 mb-6">
              {language === 'te'
                ? 'ఏవైనా సందేహాలు లేదా సహాయం కొరకు క్రింది ఫారమ్‌ను పూరించండి'
                : 'Have questions, feedback, or need farmer onboarding assistance? Reach our team.'}
            </p>

            {formSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-950 text-base">Message Sent Successfully!</h3>
                <p className="text-xs text-emerald-700">
                  Our Kisan Support Team will respond via phone or email within 4 business hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="mt-3 text-xs font-bold text-emerald-800 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Adabala Siva"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@domain.com"
                      className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+91 98491 55667"
                      className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Farmer Verification or Delivery Enquiry"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we assist your agricultural needs?"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Contact Details (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <h3 className="font-black text-lg">Direct Helpline</h3>
              <div className="space-y-4 text-xs sm:text-sm text-stone-200">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Toll-Free Kisan Support</span>
                    <span>1800-425-1551 (Mon-Sat, 7AM-8PM)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Support Email</span>
                    <span>support@farmconnect.org</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Central Office</span>
                    <span>Rythu Bhavan, MG Road, Vijayawada, AP - 520010</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-2">
              <h4 className="font-bold text-stone-900 text-sm">Need Help Navigating?</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                You can also use the Voice Assistant directly from the top menu by tapping the microphone icon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

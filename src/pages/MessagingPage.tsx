import React, { useState } from 'react';
import { MessageSquare, Send, User, MapPin, ShieldCheck, ArrowLeft } from 'lucide-react';
import { DirectMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface MessagingPageProps {
  initialRecipientId?: string;
  initialRecipientName?: string;
  initialProductName?: string;
  onBack: () => void;
}

export const MessagingPage: React.FC<MessagingPageProps> = ({
  initialRecipientId = 'farmer-1',
  initialRecipientName = 'Venkata Subba Reddy',
  initialProductName = 'Country Tomatoes',
  onBack,
}) => {
  const { user, role } = useAuth();
  const { language, t } = useLanguage();

  const [activeRecipient, setActiveRecipient] = useState({
    id: initialRecipientId,
    name: initialRecipientName,
    crop: initialProductName,
  });

  const [messages, setMessages] = useState<DirectMessage[]>([
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'farmer-1',
      senderName: 'Venkata Subba Reddy',
      senderRole: 'farmer',
      recipientId: 'cust-demo',
      recipientName: 'Adabala Siva',
      productName: 'Farm Fresh Country Tomatoes',
      content: 'నమస్కారం! నేడు ఉదయం 6 గంటలకు కోసిన తాజా నాటు టమాటాలు సిద్ధంగా ఉన్నాయి. మీకు ఎన్ని కిలోలు అవసరం?',
      createdAt: '2026-10-31T07:15:00Z',
      read: true,
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'cust-demo',
      senderName: 'Adabala Siva',
      senderRole: 'customer',
      recipientId: 'farmer-1',
      recipientName: 'Venkata Subba Reddy',
      productName: 'Farm Fresh Country Tomatoes',
      content: 'నమస్తే సుబ్బారెడ్డి గారూ, నాకు 5 కిలోలు కావాలి. రేపు ఉదయానికి డెలివరీ చేయగలరా?',
      createdAt: '2026-10-31T07:22:00Z',
      read: true,
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'farmer-1',
      senderName: 'Venkata Subba Reddy',
      senderRole: 'farmer',
      recipientId: 'cust-demo',
      recipientName: 'Adabala Siva',
      productName: 'Farm Fresh Country Tomatoes',
      content: 'తప్పకుండా! రేపు ఉదయం 10 గంటల లోపు మీ ఇంటి వద్దకు డెలివరీ చేస్తాము. ఆర్డర్ వివరాలు ఇప్పుడే యాప్‌లో నమోదు చేయండి.',
      createdAt: '2026-10-31T07:30:00Z',
      read: true,
    },
  ]);

  const [newText, setNewText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      senderId: user?.id || 'user-active',
      senderName: user?.fullName || 'Active User',
      senderRole: role,
      recipientId: activeRecipient.id,
      recipientName: activeRecipient.name,
      productName: activeRecipient.crop,
      content: newText,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages([...messages, newMsg]);
    setNewText('');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
          </button>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {language === 'te' ? 'రైతు - కస్టమర్ సందేశాలు' : 'Direct Producer Chat'}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden flex flex-col h-[650px]">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {activeRecipient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base">{activeRecipient.name}</h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <p className="text-[11px] text-emerald-200">
                  {activeRecipient.crop ? `Discussion regarding ${activeRecipient.crop}` : 'Direct Farm Inquiry'}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-700 text-emerald-200 px-2 py-1 rounded-md font-semibold">
              Online
            </span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-stone-50/50">
            {messages.map((m) => {
              const isMe = m.senderId === user?.id || (role === 'customer' && m.senderRole === 'customer') || (role === 'farmer' && m.senderRole === 'farmer');
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm shadow-2xs ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    <span
                      className={`text-[9px] block text-right mt-1.5 font-medium ${
                        isMe ? 'text-emerald-200' : 'text-stone-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-stone-200 flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={
                language === 'te'
                  ? 'రైతుకు సందేశం పంపండి (ఉదా: నాణ్యత, డెలివరీ సమయం గురించి)...'
                  : 'Type your message to the farmer...'
              }
              className="flex-1 bg-stone-100 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!newText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

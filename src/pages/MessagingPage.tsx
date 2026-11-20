import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { DirectMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface MessagingPageProps {
  initialRecipientId?: string;
  initialRecipientName?: string;
  initialProductName?: string;
  onBack: () => void;
}

/** Deterministic conversation ID — same for both sides */
const makeConversationId = (idA: string, idB: string): string =>
  [idA, idB].sort().join('_');

/** Persist to / load from localStorage as offline fallback */
const LS_KEY = 'farmconnect_messages_v1';

const loadLocalMessages = (convId: string): DirectMessage[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const all: DirectMessage[] = JSON.parse(raw);
    return all.filter((m) => m.conversationId === convId);
  } catch {
    return [];
  }
};

const saveLocalMessage = (msg: DirectMessage) => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: DirectMessage[] = raw ? JSON.parse(raw) : [];
    all.push(msg);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
};

export const MessagingPage: React.FC<MessagingPageProps> = ({
  initialRecipientId = 'farmer-1',
  initialRecipientName = 'Venkata Subba Reddy',
  initialProductName = 'Country Tomatoes',
  onBack,
}) => {
  const { user, role } = useAuth();
  const { language } = useLanguage();

  const [activeRecipient] = useState({
    id: initialRecipientId,
    name: initialRecipientName,
    crop: initialProductName,
  });

  const conversationId = makeConversationId(user?.id || 'guest', activeRecipient.id);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Load messages on mount ── */
  useEffect(() => {
    setLoading(true);
    setMessages([]);

    if (isFirebaseConfigured()) {
      /* Real-time listener on Firestore */
      const msgsRef = collection(db, 'messages');
      const q = query(
        msgsRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const fetched: DirectMessage[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderRole: data.senderRole,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              productId: data.productId,
              productName: data.productName,
              content: data.content,
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt || new Date().toISOString(),
              read: data.read ?? false,
            } as DirectMessage;
          });
          setMessages(fetched.length > 0 ? fetched : loadLocalMessages(conversationId));
          setLoading(false);
        },
        (err) => {
          console.warn('[MessagingPage] Firestore listener error, using localStorage:', err);
          setMessages(loadLocalMessages(conversationId));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      /* Offline-only mode */
      setMessages(loadLocalMessages(conversationId));
      setLoading(false);
    }
  }, [conversationId]);

  /* ── Auto-scroll to bottom whenever messages change ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message ── */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || sending) return;

    setSending(true);
    const msgBase: Omit<DirectMessage, 'id'> = {
      conversationId,
      senderId: user?.id || 'user-active',
      senderName: user?.fullName || 'Active User',
      senderRole: role,
      recipientId: activeRecipient.id,
      recipientName: activeRecipient.name,
      productName: activeRecipient.crop,
      content: newText.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    const optimisticMsg: DirectMessage = { id: `local-${Date.now()}`, ...msgBase };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewText('');

    try {
      if (isFirebaseConfigured()) {
        await addDoc(collection(db, 'messages'), {
          ...msgBase,
          createdAt: serverTimestamp(),
        });
      } else {
        saveLocalMessage(optimisticMsg);
      }
    } catch (err) {
      console.warn('[MessagingPage] Send error, saved locally:', err);
      saveLocalMessage(optimisticMsg);
    } finally {
      setSending(false);
    }
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
              {isFirebaseConfigured() ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-stone-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                <p className="text-xs font-medium">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
                <MessageSquare className="w-10 h-10 text-stone-200" />
                <p className="text-xs font-semibold">
                  {language === 'te' ? 'ఇంకా సందేశాలు లేవు. మొదటి సందేశం పంపండి!' : 'No messages yet. Start the conversation!'}
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[9px] text-stone-400 font-semibold mb-1 ml-1">{m.senderName}</span>
                    )}
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
              })
            )}
            <div ref={bottomRef} />
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
                  : 'Type your message...'
              }
              className="flex-1 bg-stone-100 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!newText.trim() || sending}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-xs"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

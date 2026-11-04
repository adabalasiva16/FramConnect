import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, X, Sparkles,
  ArrowRight, Send, Bot, User, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, param?: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  action?: { type: string; param?: string | null };
  followUps?: string[];
}

// ─── Conversational greetings & chit-chat (instant, no API needed) ──────────
function getConversationalReply(text: string, isTe: boolean): string | null {
  const q = text.toLowerCase().trim();

  // Greetings
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|howdy)\b/.test(q))
    return isTe
      ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. మీకు ఏ సహాయం కావాలి?'
      : 'Hello! I am the FarmConnect AI Assistant. How can I help you today?';

  if (/నమస్కారం|నమస్కార|హలో|హాయ్/.test(q))
    return 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. మీకు ఏ సహాయం కావాలి?';

  // How are you
  if (/how are you|how do you do/.test(q))
    return isTe
      ? 'నేను బాగున్నాను, ధన్యవాదాలు! మీకు ఏ సహాయం చేయగలను?'
      : "I'm doing great, thank you! How can I assist you?";

  if (/మీరు ఎలా ఉన్నారు|మీరు బాగున్నారా/.test(q))
    return 'నేను బాగున్నాను, ధన్యవాదాలు! మీకు ఏ సహాయం చేయగలను?';

  // What is your name
  if (/your name|who are you/.test(q))
    return isTe
      ? 'నా పేరు FarmConnect AI Assistant. నేను మీకు వ్యవసాయ సమాచారం, మార్కెట్ ధరలు, ఆర్డర్లు గురించి సహాయం చేస్తాను.'
      : 'I am FarmConnect AI Assistant. I help with agricultural information, market prices, and orders.';

  if (/మీ పేరు|నీ పేరు/.test(q))
    return 'నా పేరు FarmConnect AI Assistant. నేను మీకు వ్యవసాయ సమాచారం, మార్కెట్ ధరలు, ఆర్డర్లు గురించి సహాయం చేస్తాను.';

  // Thanks
  if (/^(thanks|thank you|thank u|ok|okay|great|perfect|good)\b/.test(q))
    return isTe
      ? 'మీకు స్వాగతం! మరింత సహాయం కావాలంటే అడగండి.'
      : 'You are welcome! Feel free to ask anything else.';

  if (/ధన్యవాదాలు|థాంక్స్|సరే|సరి/.test(q))
    return 'మీకు స్వాగతం! మరింత సహాయం కావాలంటే అడగండి.';

  // Bye
  if (/^(bye|goodbye|see you|good night)\b/.test(q))
    return isTe ? 'సెలవు! మళ్లీ రండి.' : 'Goodbye! Have a great day.';

  if (/సెలవు|బై/.test(q)) return 'సెలవు! మళ్లీ రండి.';

  return null; // Not a conversational phrase — go to API
}

// ─── Local agricultural fallback (when API is unreachable) ──────────────────
function getLocalFarmReply(text: string, isTe: boolean): { reply: string; action?: { type: string; param?: string } } {
  const q = text.toLowerCase();

  if (q.includes('టమాటా') || q.includes('tomato') || q.includes('price') || q.includes('ధర') || q.includes('mandi') || q.includes('రేట్'))
    return {
      reply: isTe
        ? 'నేటి టమాటా సగటు ధర క్వింటాలుకు ₹3,400 (కిలోకు ₹34). మార్కెట్ ధరల పేజీ తెరవడానికి "పేజీకి వెళ్ళండి" నొక్కండి.'
        : "Today's average tomato mandi price is ₹3,400/Quintal (~₹34/kg). Click 'Go to page' to view live market rates.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' },
    };

  if (q.includes('ఉల్లి') || q.includes('onion'))
    return {
      reply: isTe ? 'ఉల్లిపాయ ధర నేడు ₹28/కిలో.' : 'Onion price today is ₹28/kg.',
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Onion' },
    };

  if (q.includes('బంగాళాదుంప') || q.includes('potato'))
    return {
      reply: isTe ? 'బంగాళాదుంప ధర నేడు ₹26/కిలో.' : 'Potato price today is ₹26/kg.',
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Potato' },
    };

  if (q.includes('బియ్యం') || q.includes('rice') || q.includes('paddy'))
    return {
      reply: isTe
        ? 'గోదావరి సోనా మసూరి బియ్యం ₹58/కిలో అందుబాటులో ఉంది.'
        : 'Godavari Sona Masoori rice is available at ₹58/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'rice' },
    };

  if (q.includes('మిరప') || q.includes('chilli') || q.includes('చిల్లి'))
    return {
      reply: isTe
        ? 'గుంటూరు తేజ ఎర్ర మిరపకాయ ₹185/కిలో. APMC ధర ₹19,200/క్వింటల్.'
        : 'Guntur Teja chilli at ₹185/kg. APMC price ₹19,200/Quintal.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' },
    };

  if (q.includes('కొత్త పంట') || q.includes('add product') || q.includes('జోడించు') || q.includes('upload'))
    return {
      reply: isTe ? 'కొత్త పంటను జోడించే పేజీ తెరవడానికి నొక్కండి.' : 'Click below to open the add new product page.',
      action: { type: 'NAVIGATE_ADD_PRODUCT' },
    };

  if (q.includes('ఆర్డర్') || q.includes('order') || q.includes('orders'))
    return {
      reply: isTe ? 'మీ ఆర్డర్ల వివరాలు చూడడానికి నొక్కండి.' : 'Click below to view your orders.',
      action: { type: 'NAVIGATE_ORDERS' },
    };

  if (q.includes('అమ్మకాల') || q.includes('sales') || q.includes('ఆదాయం') || q.includes('earnings'))
    return {
      reply: isTe ? 'మీ అమ్మకాల నివేదిక తెరవడానికి నొక్కండి.' : 'Click below to open your sales analytics.',
      action: { type: 'NAVIGATE_FARMER_SALES' },
    };

  if (q.includes('మార్కెట్') || q.includes('market') || q.includes('ధరలు') || q.includes('prices'))
    return {
      reply: isTe ? 'లైవ్ మార్కెట్ ధరలు చూడడానికి నొక్కండి.' : 'Click below to view live market prices.',
      action: { type: 'NAVIGATE_MARKET_PRICES' },
    };

  return {
    reply: isTe
      ? `మీరు అడిగిన "${text}" కోసం మార్కెట్‌లో వెతుకుతున్నాను.`
      : `Searching marketplace for "${text}".`,
    action: { type: 'NAVIGATE_MARKETPLACE', param: text },
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { role } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [manualQuery, setManualQuery] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [permDenied, setPermDenied] = useState(false);

  /* ── Stable refs (never go stale in callbacks) ── */
  const recRef = useRef<any>(null);
  const wantListenRef = useRef(false);
  const busyRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(language);
  const roleRef = useRef(role);
  const ttsEnabledRef = useRef(ttsEnabled);
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  // Keep refs in sync with latest values
  useEffect(() => { langRef.current = language; }, [language]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing, interimText]);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const speakText = (text: string) => {
    if (!ttsEnabledRef.current) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = langRef.current === 'te' ? 'te-IN' : 'en-IN';
      utt.rate = 0.9;
      utt.pitch = 1.0;

      const doSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (langRef.current === 'te' && voices.length > 0) {
          const v =
            voices.find((v) => v.lang === 'te-IN') ||
            voices.find((v) => v.lang.startsWith('te')) ||
            voices.find((v) => v.lang === 'hi-IN') ||
            voices.find((v) => v.lang.startsWith('hi'));
          if (v) utt.voice = v;
        }
        window.speechSynthesis.speak(utt);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
      } else {
        doSpeak();
      }
    } catch (e) { console.warn('TTS:', e); }
  };

  // ── Add message helper ───────────────────────────────────────────────────────
  const addMsg = (msg: Omit<ChatMessage, 'id' | 'time'>) => {
    const m: ChatMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, m]);
    return m;
  };

  // ── Process a user utterance ─────────────────────────────────────────────────
  const handleUserText = async (text: string) => {
    if (!text.trim() || busyRef.current) return;
    busyRef.current = true;
    setIsProcessing(true);

    const isTe = langRef.current === 'te';

    // Add user bubble
    addMsg({ role: 'user', text });

    // 1️⃣ Instant conversational reply (no network)
    const convo = getConversationalReply(text, isTe);
    if (convo) {
      addMsg({ role: 'assistant', text: convo });
      speakText(convo);
      busyRef.current = false;
      setIsProcessing(false);
      return;
    }

    // 2️⃣ Call AI API
    const history = chatHistoryRef.current.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: langRef.current, userRole: roleRef.current, history }),
      });
      const data = await res.json();
      const reply = data.reply || (isTe ? 'మీ అభ్యర్థన అర్థమైంది.' : 'Understood.');
      addMsg({ role: 'assistant', text: reply, action: data.action, followUps: data.suggestedFollowUps || [] });
      speakText(reply);
    } catch {
      // 3️⃣ Offline local fallback
      const { reply, action } = getLocalFarmReply(text, isTe);
      addMsg({ role: 'assistant', text: reply, action });
      speakText(reply);
    } finally {
      busyRef.current = false;
      setIsProcessing(false);
    }
  };

  // ── Build recognition (called once; reused) ──────────────────────────────────
  const buildRec = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onstart = () => { setIsListening(true); setErrorMsg(''); };

    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        setInterimText('');
        handleUserText(final.trim()); // always latest via closure-free call
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setPermDenied(true);
        wantListenRef.current = false;
        setIsListening(false);
      } else if (e.error === 'audio-capture') {
        setErrorMsg(langRef.current === 'te' ? '❌ మైక్రోఫోన్ కనుగొనబడలేదు.' : '❌ No microphone found.');
        wantListenRef.current = false;
        setIsListening(false);
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('SpeechRecognition error:', e.error);
      }
    };

    rec.onend = () => {
      if (wantListenRef.current) {
        // keep alive — restart after tiny pause
        setTimeout(() => {
          if (wantListenRef.current && recRef.current) {
            try { recRef.current.start(); } catch (_) {}
          }
        }, 200);
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    return rec;
  };

  // ── Initialise recognition once on mount ────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rec = buildRec();
    if (!rec) { setBrowserSupported(false); return; }
    recRef.current = rec;
    return () => { try { rec.abort(); } catch (_) {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update recognition language when it changes ─────────────────────────────
  useEffect(() => {
    if (recRef.current) {
      recRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
    }
  }, [language]);

  // ── Welcome + cleanup on open/close ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen && chatHistoryRef.current.length === 0) {
      const txt = language === 'te'
        ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. పంట ధరలు, ఆర్డర్లు, మార్కెట్ సమాచారం అడగండి. మైక్ నొక్కి మాట్లాడండి!'
        : 'Hello! I am the FarmConnect AI Assistant. Ask me anything — crop prices, orders, market info. Press the mic and speak!';
      addMsg({ role: 'assistant', text: txt });
      speakText(txt);
    }
    if (!isOpen) {
      wantListenRef.current = false;
      setIsListening(false);
      setInterimText('');
      try { recRef.current?.stop(); } catch (_) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Mic start / stop ─────────────────────────────────────────────────────────
  const startListening = async () => {
    if (!recRef.current) { setBrowserSupported(false); return; }
    setErrorMsg('');
    setPermDenied(false);

    // Explicitly request mic permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermDenied(true);
      return;
    }

    wantListenRef.current = true;
    try {
      recRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      if (!String(e).includes('already started')) {
        wantListenRef.current = false;
        setErrorMsg(language === 'te' ? '⚠ మైక్ ప్రారంభించడంలో సమస్య.' : '⚠ Could not start mic. Try again.');
      } else {
        setIsListening(true); // already running, that's fine
      }
    }
  };

  const stopListening = () => {
    wantListenRef.current = false;
    setIsListening(false);
    setInterimText('');
    try { recRef.current?.stop(); } catch (_) {}
  };

  const handleNavigate = (action?: ChatMessage['action']) => {
    if (!action?.type) return;
    if (action.type === 'NAVIGATE_MARKET_PRICES') onNavigate('market-prices', action.param ? { crop: action.param } : undefined);
    else if (action.type === 'NAVIGATE_MARKETPLACE') onNavigate('marketplace', { search: action.param });
    else if (action.type === 'NAVIGATE_ADD_PRODUCT') onNavigate('add-product');
    else if (action.type === 'NAVIGATE_ORDERS') onNavigate('orders');
    else if (action.type === 'NAVIGATE_FARMER_SALES') onNavigate('farmer-sales');
  };

  const quickCommands = language === 'te'
    ? [
        { label: 'నమస్కారం', query: 'నమస్కారం' },
        { label: 'టమాటా ధర ఎంత?', query: 'టమాటా ధర ఎంత?' },
        { label: 'నా ఆర్డర్లు', query: 'నా ఆర్డర్లు చూపించు' },
        { label: 'కొత్త పంట జోడించు', query: 'కొత్త పంటను జోడించు' },
        { label: 'మార్కెట్ ధరలు', query: 'నేటి మార్కెట్ ధరలు చూపించు' },
      ]
    : [
        { label: 'Hello!', query: 'Hello' },
        { label: 'Tomato price?', query: "What is today's tomato price?" },
        { label: 'My orders', query: 'Show my orders' },
        { label: 'Add product', query: 'Add a new product' },
        { label: 'Market prices', query: "Show today's market prices" },
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col"
        style={{ height: '90vh', maxHeight: '700px' }}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{t('voiceModalTitle')}</h3>
              <p className="text-xs text-emerald-100">
                {language === 'te' ? 'తెలుగు & English — AI చాట్‌బాట్' : 'Telugu & English — AI Chatbot'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTtsEnabled((v) => !v)}
              title={ttsEnabled ? 'Mute' : 'Unmute'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-200" /> : <VolumeX className="w-4 h-4 text-white/60" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-colors"
            >
              {language === 'en' ? 'తెలుగు' : 'English'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Mic permission banner ── */}
        {permDenied && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-start gap-2 text-sm text-red-800 shrink-0">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <strong>{language === 'te' ? 'మైక్రోఫోన్ అనుమతి అవసరం' : 'Microphone Permission Required'}</strong>
              <p className="text-xs mt-0.5 text-red-700">
                {language === 'te'
                  ? 'URL బార్ లో 🔒 నొక్కి → Site Settings → Microphone → Allow → పేజీ రీలోడ్ చేయండి.'
                  : 'Click 🔒 in URL bar → Site Settings → Microphone → Allow → Reload page.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Chat area ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-1 ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-teal-700'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[80%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>

                {msg.role === 'assistant' && msg.action?.type && (
                  <button
                    onClick={() => handleNavigate(msg.action)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" />
                    {language === 'te' ? 'పేజీకి వెళ్ళండి →' : 'Go to page →'}
                  </button>
                )}

                {msg.role === 'assistant' && (msg.followUps?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {msg.followUps!.slice(0, 2).map((fu, i) => (
                      <button
                        key={i}
                        onClick={() => handleUserText(fu)}
                        className="text-xs bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200 hover:border-emerald-300 rounded-full px-2.5 py-1 transition-all"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-stone-400">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Live interim speech bubble */}
          {isListening && interimText && (
            <div className="flex gap-2 flex-row-reverse">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-emerald-100 text-emerald-800 text-sm italic border border-emerald-200">
                {interimText}
                <span className="inline-block w-1 h-3.5 bg-emerald-600 ml-1 animate-pulse rounded-sm" />
              </div>
            </div>
          )}

          {/* Thinking dots */}
          {isProcessing && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-stone-200 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Quick command chips ── */}
        <div className="px-4 pt-2 pb-1 bg-white border-t border-stone-100 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {quickCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleUserText(item.query)}
                disabled={isProcessing}
                className="text-xs whitespace-nowrap bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full px-3 py-1.5 font-medium transition-all shrink-0 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error bar ── */}
        {errorMsg && !permDenied && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ── Bottom input bar ── */}
        <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!browserSupported || permDenied}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow transition-all select-none
                ${isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white scale-110 shadow-rose-200'
                  : permDenied
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95'
                }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <form onSubmit={(e) => { e.preventDefault(); if (manualQuery.trim()) { handleUserText(manualQuery.trim()); setManualQuery(''); } }} className="flex-1 flex gap-2">
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder={
                  isListening
                    ? (language === 'te' ? '🎤 వింటున్నాను...' : '🎤 Listening...')
                    : (language === 'te' ? 'మాట్లాడండి లేదా టైప్ చేయండి...' : 'Speak or type a question...')
                }
                disabled={isProcessing}
                className="flex-1 bg-stone-100 rounded-xl px-4 py-2 text-sm text-stone-800 placeholder-stone-400 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!manualQuery.trim() || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Listening status */}
          {isListening && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs text-rose-600 font-semibold">
                {language === 'te' ? 'వింటున్నాను — స్పష్టంగా మాట్లాడండి' : 'Listening — speak clearly'}
              </span>
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-1 bg-rose-400 rounded-full animate-bounce"
                    style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            </div>
          )}

          {!browserSupported && (
            <p className="text-xs text-amber-700 mt-1.5 text-center">
              {language === 'te' ? 'Chrome బ్రౌజర్ వాడండి.' : 'Please use Chrome browser for voice input.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

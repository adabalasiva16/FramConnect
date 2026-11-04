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

// ── Pure helper: conversational chit-chat (instant mini-ChatGPT responses) ───
function getConvoReply(text: string, isTe: boolean): string | null {
  const q = text.toLowerCase().trim();

  // Greetings
  if (
    /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening)\b/.test(q) ||
    /నమస్కారం|నమస్కార|హలో|హాయ్/.test(q)
  ) {
    return isTe
      ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. మీకు వ్యవసాయం, పంట ధరలు లేదా ఆర్డర్ల గురించి ఎలాంటి సమాచారం కావాలి?'
      : 'Hello! I am your FarmConnect AI Assistant. How can I help you today with crop prices, orders, or farming advice?';
  }

  // How are you
  if (/how are you/.test(q) || /మీరు ఎలా|బాగున్నారా/.test(q)) {
    return isTe
      ? 'నేను చాలా బాగున్నాను, ధన్యవాదాలు! రైతులకు, వినియోగదారులకు సహాయం చేయడానికి సంతోషంగా ఉన్నాను. మీకు ఏ వివరాలు కావాలి?'
      : "I am doing great, thank you! Ready to help you with fresh farm harvests and market rates. What's on your mind?";
  }

  // Who are you / Identity
  if (/your name|who are you|who made you/.test(q) || /మీ పేరు|నీ పేరు|ఎవరు మీరు/.test(q)) {
    return isTe
      ? 'నా పేరు FarmConnect AI Assistant. నేను రైతులకు మరియు కొనుగోలుదారులకు సహాయం చేసే ఒక స్మార్ట్ అగ్రికల్చరల్ చాట్‌బాట్‌ను.'
      : 'I am the FarmConnect AI Assistant — a smart agricultural companion helping farmers and consumers connect directly!';
  }

  // What can you do / Help
  if (/what can you do|help me|what do you do|సహాయం|ఏం చేస్తావ్/.test(q)) {
    return isTe
      ? 'నేను మీకు APMC మండీ మార్కెట్ ధరలు చెప్పగలను, తాజా పంట ఉత్పత్తులను శోధించగలను, కొత్త పంట నమోదు చేయడంలో మరియు మీ ఆర్డర్లను ట్రాక్ చేయడంలో సహాయపడతాను.'
      : 'I can tell you live APMC Mandi prices, search farm-fresh harvests, guide you to list new crops, and track your orders!';
  }

  // Gratitude / OK
  if (/^(thanks|thank you|thank u|great|awesome|perfect|good|nice)\b/.test(q) || /ధన్యవాదాలు|థాంక్స్|చాలా బాగుంది/.test(q)) {
    return isTe
      ? 'మీకు సహాయపడినందుకు చాలా సంతోషం! మీకు మరేదైనా సమాచారం కావాలంటే నిర్భయంగా అడగండి.'
      : 'You are most welcome! Always happy to help. Let me know if you need anything else.';
  }

  // Farewell
  if (/^(bye|goodbye|see you|good night)\b/.test(q) || /సెలవు|బై|మళ్ళీ కలుద్దాం/.test(q)) {
    return isTe
      ? 'సెలవు! మీ రోజు శుభప్రదంగా గడవాలని ఆశిస్తున్నాను. మళ్లీ ఏదైనా అవసరమైతే నన్ను పిలవండి.'
      : 'Goodbye! Wishing you a fruitful day ahead. Feel free to chat with me anytime.';
  }

  return null;
}

// ── Pure helper: local farm fallback (when API is offline/unreachable) ───────
function getLocalReply(text: string, isTe: boolean): { reply: string; action?: { type: string; param?: string } } {
  const q = text.toLowerCase();

  if (q.includes('టమాటా') || q.includes('tomato')) {
    return {
      reply: isTe
        ? 'నేటి గుంటూరు మార్కెట్‌లో టమాటా సగటు ధర ₹34/కిలో (క్వింటాలుకు ₹3,400). లైవ్ మండీ ధరలు చూడడానికి కింద బటన్ నొక్కండి.'
        : "Today's average tomato mandi rate is ₹34/kg (₹3,400/Quintal). Click below to view the live market dashboard.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' },
    };
  }

  if (q.includes('ఉల్లి') || q.includes('onion')) {
    return {
      reply: isTe
        ? 'కర్నూలు మార్కెట్‌లో ఉల్లిపాయ ధర ₹28/కిలో (క్వింటాలుకు ₹2,800).'
        : 'Kurnool average onion price is ₹28/kg (₹2,800/Quintal).',
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Onion' },
    };
  }

  if (q.includes('బంగాళాదుంప') || q.includes('potato') || q.includes('ఆలు')) {
    return {
      reply: isTe
        ? 'బంగాళాదుంప సగటు హోల్‌సేల్ ధర ₹26/కిలో.'
        : 'Wholesale potato price is ₹26/kg.',
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Potato' },
    };
  }

  if (q.includes('బియ్యం') || q.includes('rice') || q.includes('వరి') || q.includes('paddy')) {
    return {
      reply: isTe
        ? 'గోదావరి సోనా మసూరి పాత బియ్యం రైతు వద్ద నేరుగా ₹58/కిలో లభిస్తుంది.'
        : 'Godavari Sona Masoori raw rice is available directly from farmers at ₹58/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'rice' },
    };
  }

  if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
    return {
      reply: isTe
        ? 'గుంటూరు తేజ ఎండిన ఎర్ర మిరపకాయ రైతు వద్ద ₹185/కిలో. APMC ధర ₹19,200/క్వింటల్.'
        : 'Guntur Teja dry chillies are ₹185/kg directly from farms. Mandi price is ₹19,200/Quintal.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' },
    };
  }

  if (q.includes('add product') || q.includes('కొత్త పంట') || q.includes('జోడించు') || q.includes('upload')) {
    return {
      reply: isTe
        ? 'కొత్త పంట నమోదు పేజీని తెరుస్తున్నాను. మీ ఉత్పత్తి వివరాలు అక్కడ జోడించండి.'
        : 'Opening the crop upload page so you can list your harvest directly.',
      action: { type: 'NAVIGATE_ADD_PRODUCT' },
    };
  }

  if (q.includes('ఆర్డర్') || q.includes('order')) {
    return {
      reply: isTe
        ? 'మీ ఆర్డర్ల వివరాలు మరియు డెలివరీ స్థితిని తెరుస్తున్నాను.'
        : 'Opening your orders and delivery tracking.',
      action: { type: 'NAVIGATE_ORDERS' },
    };
  }

  if (q.includes('అమ్మకాల') || q.includes('sales') || q.includes('ఆదాయం') || q.includes('earnings')) {
    return {
      reply: isTe
        ? 'మీ వ్యవసాయ అమ్మకాల నివేదిక మరియు ఆదాయ వివరాలను తెరుస్తున్నాను.'
        : 'Opening your farm sales analytics report.',
      action: { type: 'NAVIGATE_FARMER_SALES' },
    };
  }

  if (q.includes('ధర') || q.includes('price') || q.includes('మార్కెట్') || q.includes('market') || q.includes('mandi')) {
    return {
      reply: isTe
        ? 'ఆంధ్రప్రదేశ్ మరియు తెలంగాణ APMC మార్కెట్ లైవ్ ధరల పేజీని తెరుస్తున్నాను.'
        : 'Opening live APMC market prices across Andhra Pradesh and Telangana.',
      action: { type: 'NAVIGATE_MARKET_PRICES' },
    };
  }

  return {
    reply: isTe
      ? `మీరు అడిగిన "${text}" గురించి మార్కెట్‌లో వెతుకుతున్నాను. కింద బటన్ నొక్కి వివరాలు చూడండి.`
      : `Searching farm harvests for "${text}". Tap below to explore listings.`,
    action: { type: 'NAVIGATE_MARKETPLACE', param: text },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
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

  /* ─── Stable Refs ─── */
  const recRef             = useRef<any>(null);
  const wantListenRef      = useRef(false);
  const busyRef            = useRef(false);
  const isSpeakingRef      = useRef(false);          // True while browser TTS is playing audio
  const accumulatedTextRef = useRef('');             // Collects user utterance across continuous events
  const silenceTimerRef    = useRef<any>(null);      // 3-second silence detector
  const chatEndRef         = useRef<HTMLDivElement>(null);

  // Live state refs (always freshest without re-binding recognition)
  const langRef       = useRef(language);
  const roleRef       = useRef(role);
  const ttsRef        = useRef(ttsEnabled);
  const historyRef    = useRef<ChatMessage[]>([]);
  const handleTextRef = useRef<(t: string) => void>(() => {});

  useEffect(() => { langRef.current = language; }, [language]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { ttsRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { historyRef.current = chatHistory; }, [chatHistory]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing, interimText]);

  /* ─── TTS with Acoustic Echo Protection ─────────────────────────────────── */
  const speakText = (text: string) => {
    if (!ttsRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      // 1. Immediately turn OFF and abort microphone so it NEVER hears itself!
      stopListeningInternal();
      isSpeakingRef.current = true;

      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang  = langRef.current === 'te' ? 'te-IN' : 'en-IN';
      utt.rate  = 0.92;
      utt.pitch = 1.0;

      utt.onstart = () => {
        isSpeakingRef.current = true;
        stopListeningInternal();
      };

      utt.onend = () => {
        // Small guard window after speech ends to prevent catching speaker reverb
        setTimeout(() => {
          isSpeakingRef.current = false;
        }, 500);
      };

      utt.onerror = () => {
        isSpeakingRef.current = false;
      };

      const doSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (langRef.current === 'te' && voices.length > 0) {
          const v = voices.find(v => v.lang === 'te-IN')
                 || voices.find(v => v.lang.startsWith('te'))
                 || voices.find(v => v.lang === 'hi-IN')
                 || voices.find(v => v.lang.startsWith('hi'));
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
    } catch (e) {
      console.warn('TTS:', e);
      isSpeakingRef.current = false;
    }
  };

  /* ─── Add Chat Message ─────────────────────────────────────────────────── */
  const addMsg = (msg: Omit<ChatMessage, 'id' | 'time'>) => {
    const m: ChatMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory(prev => [...prev, m]);
    return m;
  };

  /* ─── Process User Query (Mini-ChatGPT conversational pipeline) ────────── */
  const handleUserText = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean || busyRef.current) return;
    busyRef.current = true;
    setIsProcessing(true);

    const isTe = langRef.current === 'te';
    addMsg({ role: 'user', text: clean });

    // 1. Instant conversational response for greetings & pleasantries
    const convo = getConvoReply(clean, isTe);
    if (convo) {
      addMsg({ role: 'assistant', text: convo });
      speakText(convo);
      busyRef.current = false;
      setIsProcessing(false);
      return;
    }

    // 2. Call AI Assistant API (with conversational history)
    const history = historyRef.current.slice(-6).map(m => ({ role: m.role, text: m.text }));
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, language: langRef.current, userRole: roleRef.current, history }),
      });
      const data = await res.json();
      const reply = data.reply || (isTe ? 'మీ అభ్యర్థన అర్థమైంది.' : 'Understood your request.');
      addMsg({ role: 'assistant', text: reply, action: data.action, followUps: data.suggestedFollowUps || [] });
      speakText(reply);
    } catch (err) {
      console.warn('Assistant API fallback:', err);
      // 3. Fallback to smart local agricultural response
      const { reply, action } = getLocalReply(clean, isTe);
      addMsg({ role: 'assistant', text: reply, action });
      speakText(reply);
    } finally {
      busyRef.current = false;
      setIsProcessing(false);
    }
  };

  // Keep ref pointing to latest handler
  handleTextRef.current = handleUserText;

  /* ─── Silence Detector & Speech Recognition Setup ──────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setBrowserSupported(false); return; }

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.lang = 'en-IN';

    rec.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    rec.onresult = (e: any) => {
      // CRITICAL: If the assistant is speaking its answer out loud, IGNORE microphone audio completely!
      if (isSpeakingRef.current || busyRef.current) {
        return;
      }

      let interim = '';
      let finalPiece = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          let best = r[0].transcript;
          for (let j = 1; j < r.length; j++) {
            if (r[j].confidence > r[0].confidence) best = r[j].transcript;
          }
          finalPiece += ' ' + best;
        } else {
          interim += ' ' + r[0].transcript;
        }
      }

      if (finalPiece.trim()) {
        accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + finalPiece).trim();
      }

      const currentLiveDisplay = (accumulatedTextRef.current + ' ' + interim).trim();
      if (currentLiveDisplay) {
        setInterimText(currentLiveDisplay);
      }

      // ── 3-Second Silence Timer:
      // When the user speaks, start/reset timer. Once user is quiet for ~2.8 seconds:
      // Turn OFF the mic and give the reply!
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        const spokenSentence = (accumulatedTextRef.current + ' ' + interim).trim();
        if (spokenSentence && !isSpeakingRef.current && !busyRef.current) {
          // 1. Immediately turn off the mic
          stopListeningInternal();
          setInterimText('');
          accumulatedTextRef.current = '';

          // 2. Give the reply
          handleTextRef.current(spokenSentence);
        }
      }, 2600); // 2.6 seconds of silence gives a natural, responsive turn
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
      // Only restart if user actively wants to listen AND we are not speaking/processing
      if (wantListenRef.current && !isSpeakingRef.current && !busyRef.current) {
        setTimeout(() => {
          if (wantListenRef.current && recRef.current && !isSpeakingRef.current && !busyRef.current) {
            try { recRef.current.start(); } catch (_) {}
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch (_) {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Keep Recognition Language Synced ─────────────────────────────────── */
  useEffect(() => {
    if (recRef.current) {
      recRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
    }
  }, [language]);

  /* ─── Stop Listening Helper ────────────────────────────────────────────── */
  const stopListeningInternal = () => {
    wantListenRef.current = false;
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      recRef.current?.stop();
    } catch (_) {}
  };

  /* ─── Welcome Message on Modal Open ─────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && historyRef.current.length === 0) {
      const txt = language === 'te'
        ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. పంట ధరలు, ఆర్డర్లు, మార్కెట్ సమాచారం అడగండి. మైక్ నొక్కి మాట్లాడండి!'
        : 'Hello! I am your FarmConnect AI Assistant. Ask me about crop prices, orders, or market info. Tap the mic and speak!';
      addMsg({ role: 'assistant', text: txt });
      speakText(txt);
    }
    if (!isOpen) {
      stopListeningInternal();
      setInterimText('');
      accumulatedTextRef.current = '';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ─── Mic Start / User Click ────────────────────────────────────────────── */
  const startListening = () => {
    if (!recRef.current) { setBrowserSupported(false); return; }

    // If assistant is currently talking, clicking mic interrupts speech (barge-in)!
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    setErrorMsg('');
    setPermDenied(false);
    setInterimText('');
    accumulatedTextRef.current = '';
    wantListenRef.current = true;

    try {
      recRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recRef.current.start();
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('already started') || msg.includes('already running')) {
        setIsListening(true);
      } else {
        wantListenRef.current = false;
        console.warn('Mic start error:', e);
        setErrorMsg(language === 'te' ? '⚠ మైక్ ప్రారంభించడంలో సమస్య. మళ్లీ నొక్కండి.' : '⚠ Could not start microphone. Please tap again.');
      }
    }
  };

  // User manually stops mic early before 3s timeout
  const stopListeningManual = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const pendingText = (accumulatedTextRef.current + ' ' + interimText).trim();
    stopListeningInternal();
    setInterimText('');
    accumulatedTextRef.current = '';

    if (pendingText) {
      handleTextRef.current(pendingText);
    }
  };

  /* ─── Navigation Helper ─────────────────────────────────────────────────── */
  const handleNavigate = (action?: ChatMessage['action']) => {
    if (!action?.type) return;
    if (action.type === 'NAVIGATE_MARKET_PRICES')  onNavigate('market-prices', action.param ? { crop: action.param } : undefined);
    else if (action.type === 'NAVIGATE_MARKETPLACE') onNavigate('marketplace', { search: action.param });
    else if (action.type === 'NAVIGATE_ADD_PRODUCT') onNavigate('add-product');
    else if (action.type === 'NAVIGATE_ORDERS')      onNavigate('orders');
    else if (action.type === 'NAVIGATE_FARMER_SALES') onNavigate('farmer-sales');
  };

  /* ─── Quick Chips ───────────────────────────────────────────────────────── */
  const quickCommands = language === 'te'
    ? [
        { label: 'నమస్కారం 👋', query: 'నమస్కారం' },
        { label: 'టమాటా ధర ఎంత?', query: 'టమాటా ధర ఎంత?' },
        { label: 'నా ఆర్డర్లు', query: 'నా ఆర్డర్లు చూపించు' },
        { label: 'కొత్త పంట జోడించు', query: 'కొత్త పంటను జోడించు' },
        { label: 'మార్కెట్ ధరలు', query: 'నేటి మార్కెట్ ధరలు చూపించు' },
      ]
    : [
        { label: 'Hello 👋', query: 'Hello' },
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
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{t('voiceModalTitle')}</h3>
              <p className="text-xs text-emerald-100">
                {language === 'te' ? 'తెలుగు & English — స్మార్ట్ AI చాట్‌బాట్' : 'Telugu & English — Smart AI Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (ttsEnabled) {
                  window.speechSynthesis?.cancel();
                  isSpeakingRef.current = false;
                }
                setTtsEnabled(v => !v);
              }}
              title={ttsEnabled ? 'Mute Audio' : 'Unmute Audio'}
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

        {/* Permission Denied Alert */}
        {permDenied && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-start gap-2 text-sm text-red-800 shrink-0">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <strong>{language === 'te' ? 'మైక్రోఫోన్ అనుమతి అవసరం' : 'Microphone Permission Required'}</strong>
              <p className="text-xs mt-0.5 text-red-700">
                {language === 'te'
                  ? 'URL బార్ లో 🔒 నొక్కి → Site Settings → Microphone → Allow చేసి పేజీని రీలోడ్ చేయండి.'
                  : 'Click 🔒 in the URL address bar → Site Settings → Microphone → Allow → then refresh.'}
              </p>
            </div>
          </div>
        )}

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-1 ${
                msg.role === 'user' ? 'bg-emerald-600' : 'bg-teal-700'
              }`}>
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

                {/* Inline Action Button */}
                {msg.role === 'assistant' && msg.action?.type && (
                  <button
                    onClick={() => handleNavigate(msg.action)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors shadow-xs"
                  >
                    <ArrowRight className="w-3 h-3" />
                    {language === 'te' ? 'పేజీకి వెళ్ళండి →' : 'Go to page →'}
                  </button>
                )}

                {/* Quick Follow-ups */}
                {msg.role === 'assistant' && (msg.followUps?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {msg.followUps!.slice(0, 2).map((fu, i) => (
                      <button
                        key={i}
                        onClick={() => handleTextRef.current(fu)}
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

          {/* Live speech transcription bubble */}
          {isListening && interimText && (
            <div className="flex gap-2 flex-row-reverse animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-emerald-100 text-emerald-900 text-sm italic border border-emerald-300 shadow-sm">
                <span>{interimText}</span>
                <span className="inline-block w-1.5 h-3.5 bg-emerald-600 ml-1.5 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          )}

          {/* Assistant Thinking Indicator */}
          {isProcessing && (
            <div className="flex gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-stone-200 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '320ms' }} />
                <span className="text-xs text-stone-400 ml-1.5 font-medium">
                  {language === 'te' ? 'ఆలోచిస్తున్నాను...' : 'Thinking...'}
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 pt-2 pb-1 bg-white border-t border-stone-100 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {quickCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleTextRef.current(item.query)}
                disabled={isProcessing}
                className="text-xs whitespace-nowrap bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full px-3 py-1.5 font-medium transition-all shrink-0 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && !permDenied && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}
          </div>
        )}

        {/* Bottom Control & Input Bar */}
        <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mic Toggle Button */}
            <button
              onClick={isListening ? stopListeningManual : startListening}
              disabled={!browserSupported || permDenied}
              title={isListening ? 'Tap to finish speaking' : 'Tap to speak'}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow transition-all select-none ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white scale-110 shadow-rose-300 animate-pulse'
                  : permDenied
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Manual text input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualQuery.trim()) {
                  handleTextRef.current(manualQuery.trim());
                  setManualQuery('');
                }
              }}
              className="flex-1 flex gap-2"
            >
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder={
                  isListening
                    ? (language === 'te' ? '🎤 వింటున్నాను... మాట్లాడి 3 సెకన్లు ఆగండి' : '🎤 Listening... speak & pause 3s to send')
                    : (language === 'te' ? 'మాట్లాడండి లేదా టైప్ చేయండి...' : 'Speak or type your question...')
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

          {/* Listening Live Status & Silence Turn Countdown */}
          {isListening && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs text-rose-600 font-semibold">
                {language === 'te'
                  ? 'వింటున్నాము — మాట్లాడటం ఆపిన 3 సెకన్లలో సమాధానం వస్తుంది'
                  : 'Listening — stop speaking for 3 seconds to send'}
              </span>
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-bounce"
                    style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!browserSupported && (
            <p className="text-xs text-amber-700 mt-1.5 text-center">
              {language === 'te' ? 'Chrome బ్రౌజర్ ఉపయోగించండి.' : 'Please use Chrome browser for microphone features.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, ArrowRight, Send, Bot, User, AlertCircle } from 'lucide-react';
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
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Refs that stay in sync without needing state
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);   // Source of truth for "should mic be active"
  const isProcessingRef = useRef(false);   // Avoid processing same text twice
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<ChatMessage[]>([]); // For use inside callbacks

  // Keep chatHistoryRef in sync
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing, interimText]);

  // Welcome message when modal first opens
  useEffect(() => {
    if (isOpen && chatHistoryRef.current.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        text:
          language === 'te'
            ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. పంట ధరలు, ఆర్డర్లు, మార్కెట్ సమాచారం అడగండి. మైక్ నొక్కి తెలుగులో మాట్లాడండి!'
            : 'Hello! I am the FarmConnect AI Assistant. Ask me about crop prices, orders, market info and more. Press the mic and speak!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory([welcome]);
    }
    // Stop mic when modal closes
    if (!isOpen) {
      stopListeningInternal();
    }
  }, [isOpen]);

  // ── Build & start a fresh SpeechRecognition instance ──────────────────────
  const buildRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.lang = language === 'te' ? 'te-IN' : 'en-IN';

    rec.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
      if (finalText.trim()) {
        setInterimText('');
        // Guard: do not process while already processing
        if (!isProcessingRef.current) {
          processUserMessage(finalText.trim());
        }
      }
    };

    rec.onerror = (event: any) => {
      const err = event.error as string;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setMicPermission('denied');
        setErrorMsg(
          language === 'te'
            ? '❌ మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్స్‌లో అనుమతి ఇవ్వండి.'
            : '❌ Microphone permission denied. Please allow microphone access in your browser settings.'
        );
        shouldListenRef.current = false;
        setIsListening(false);
      } else if (err === 'audio-capture') {
        setErrorMsg(
          language === 'te'
            ? '❌ మైక్రోఫోన్ కనుగొనబడలేదు. మైక్ కనెక్ట్ ఉందో చూడండి.'
            : '❌ No microphone found. Please connect a microphone.'
        );
        shouldListenRef.current = false;
        setIsListening(false);
      } else if (err === 'network') {
        setErrorMsg(
          language === 'te'
            ? '⚠ నెట్‌వర్క్ సమస్య. ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేయండి.'
            : '⚠ Network error. Check your internet connection.'
        );
      } else if (err !== 'no-speech' && err !== 'aborted') {
        console.warn('SpeechRecognition error:', err);
        setErrorMsg(
          language === 'te'
            ? `⚠ గుర్తించడంలో సమస్య (${err}). మళ్లీ ప్రయత్నించండి.`
            : `⚠ Recognition error (${err}). Please try again.`
        );
      }
    };

    rec.onend = () => {
      // If we still WANT to listen, restart automatically
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (_) {
              // Recognition already started, ignore
            }
          }
        }, 150);
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    return rec;
  }, [language]);

  // (Re)build recognition when language changes
  useEffect(() => {
    // Tear down old instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = buildRecognition();
    if (!rec) {
      setBrowserSupported(false);
      return;
    }
    recognitionRef.current = rec;

    // If we were listening before the language switched, restart with new lang
    if (shouldListenRef.current) {
      setTimeout(() => {
        try { recognitionRef.current?.start(); } catch (_) {}
      }, 200);
    }

    return () => {
      try { rec.abort(); } catch (_) {}
    };
  }, [language, buildRecognition]);

  // ── TTS helper ─────────────────────────────────────────────────────────────
  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
        utterance.rate = 0.88;
        utterance.pitch = 1.0;

        const trySpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          if (language === 'te' && voices.length > 0) {
            const teVoice =
              voices.find((v) => v.lang === 'te-IN') ||
              voices.find((v) => v.lang.startsWith('te')) ||
              voices.find((v) => v.lang === 'hi-IN') ||
              voices.find((v) => v.lang.startsWith('hi'));
            if (teVoice) utterance.voice = teVoice;
          }
          window.speechSynthesis.speak(utterance);
        };

        // Voices might not be loaded yet — wait for them
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            trySpeak();
          };
        } else {
          trySpeak();
        }
      } catch (e) {
        console.warn('TTS error:', e);
      }
    },
    [ttsEnabled, language]
  );

  // ── Mic control ────────────────────────────────────────────────────────────
  const stopListeningInternal = () => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimText('');
    try { recognitionRef.current?.stop(); } catch (_) {}
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      setBrowserSupported(false);
      return;
    }
    setErrorMsg('');

    // Request microphone permission explicitly first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
    } catch (err: any) {
      setMicPermission('denied');
      setErrorMsg(
        language === 'te'
          ? '❌ మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. బ్రౌజర్ లో అనుమతి ఇవ్వండి మరియు మళ్లీ ప్రయత్నించండి.'
          : '❌ Microphone access denied. Please allow microphone in your browser and try again.'
      );
      return;
    }

    // Set the desire flag BEFORE calling start so onend can restart
    shouldListenRef.current = true;
    try {
      recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      if (e?.message?.includes('already started')) {
        // Already running — that's fine
        setIsListening(true);
      } else {
        shouldListenRef.current = false;
        console.warn('Recognition start error:', e);
        setErrorMsg(
          language === 'te'
            ? '⚠ మైక్ ప్రారంభించడంలో సమస్య. మళ్లీ నొక్కండి.'
            : '⚠ Could not start microphone. Please tap again.'
        );
      }
    }
  };

  const stopListening = () => stopListeningInternal();

  // ── Chat helpers ───────────────────────────────────────────────────────────
  const addMessage = (msg: Omit<ChatMessage, 'id' | 'time'>): ChatMessage => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Date.now().toString() + Math.random(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const processUserMessage = async (text: string) => {
    if (!text.trim()) return;
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    addMessage({ role: 'user', text });

    // Build history context from ref (safe inside async callback)
    const historyContext = chatHistoryRef.current.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language, userRole: role, history: historyContext }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        (language === 'te' ? 'మీ అభ్యర్థన అర్థమైంది.' : 'Understood your request.');

      addMessage({
        role: 'assistant',
        text: replyText,
        action: data.action,
        followUps: data.suggestedFollowUps || [],
      });

      speakText(replyText);
    } catch (error) {
      console.warn('API error, falling back to local intent:', error);
      handleLocalFallback(text);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleLocalFallback = (text: string) => {
    const q = text.toLowerCase();
    const isTe = language === 'te';
    let localReply = '';
    let action: ChatMessage['action'];

    if (q.includes('టమాటా') || q.includes('tomato') || q.includes('ధర') || q.includes('price') || q.includes('mandi') || q.includes('మార్కెట్')) {
      localReply = isTe
        ? 'నేటి టమాటా సగటు మార్కెట్ ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). మార్కెట్ ధరల పేజీ తెరవడానికి కింద బటన్ నొక్కండి.'
        : "Today's average modal tomato mandi price is ₹3,400/Quintal (~₹34/kg). Click below to view the live market price dashboard.";
      action = { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' };
    } else if (q.includes('కొత్త పంట') || q.includes('add product') || q.includes('జోడించు') || q.includes('అప్లోడ్')) {
      localReply = isTe ? 'కొత్త వ్యవసాయ ఉత్పత్తి చేర్చే పేజీకి వెళ్ళడానికి నొక్కండి.' : 'Click below to open the new agricultural crop upload form.';
      action = { type: 'NAVIGATE_ADD_PRODUCT' };
    } else if (q.includes('ఆర్డర్') || q.includes('order') || q.includes('ట్రాక్') || q.includes('track')) {
      localReply = isTe ? 'మీ ఆర్డర్ల వివరాలు చూడడానికి నొక్కండి.' : 'Click below to view your current orders and tracking.';
      action = { type: 'NAVIGATE_ORDERS' };
    } else if (q.includes('బియ్యం') || q.includes('rice')) {
      localReply = isTe ? 'స్వచ్ఛమైన గోదావరి బియ్యం చూడడానికి నొక్కండి.' : 'Click below to see direct-from-farm single-origin rice products.';
      action = { type: 'NAVIGATE_MARKETPLACE', param: 'rice' };
    } else if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
      localReply = isTe ? 'గుంటూరు తేజ మిరపకాయల వివరాలు చూడడానికి నొక్కండి.' : 'Click below to see authentic Guntur Teja dried chillies.';
      action = { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' };
    } else if (q.includes('అమ్మకాల') || q.includes('sales') || q.includes('ఆదాయం') || q.includes('earnings')) {
      localReply = isTe ? 'మీ అమ్మకాలు మరియు ఆదాయ నివేదిక తెరవడానికి నొక్కండి.' : 'Click below to open your farm sales analytics report.';
      action = { type: 'NAVIGATE_FARMER_SALES' };
    } else {
      localReply = isTe
        ? `మీరు అడిగిన "${text}" కోసం మార్కెట్‌లో వెతికాను. కింద బటన్ నొక్కి ఫలితాలు చూడండి.`
        : `I searched for "${text}" in the marketplace. Click below to see results.`;
      action = { type: 'NAVIGATE_MARKETPLACE', param: text };
    }

    addMessage({ role: 'assistant', text: localReply, action });
    speakText(localReply);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim() && !isProcessingRef.current) {
      processUserMessage(manualQuery.trim());
      setManualQuery('');
    }
  };

  const handleNavigate = (action?: ChatMessage['action']) => {
    if (!action?.type) return;
    if (action.type === 'NAVIGATE_MARKET_PRICES') onNavigate('market-prices', action.param ? { crop: action.param } : undefined);
    else if (action.type === 'NAVIGATE_MARKETPLACE') onNavigate('marketplace', { search: action.param });
    else if (action.type === 'NAVIGATE_ADD_PRODUCT') onNavigate('add-product');
    else if (action.type === 'NAVIGATE_ORDERS') onNavigate('orders');
    else if (action.type === 'NAVIGATE_FARMER_SALES') onNavigate('farmer-sales');
  };

  const quickCommands =
    language === 'te'
      ? [
          { label: 'టమాటా ధర ఎంత?', query: 'టమాటా ధర ఎంత?' },
          { label: 'కొత్త పంటను జోడించు', query: 'కొత్త పంటను జోడించు' },
          { label: 'నా ఆర్డర్లు చూపించు', query: 'నా ఆర్డర్లు చూపించు' },
          { label: 'బియ్యం ఉత్పత్తులు', query: 'బియ్యం ఉత్పత్తులను చూపించు' },
          { label: 'నేటి మార్కెట్ ధరలు', query: 'నేటి మార్కెట్ ధరలు చూపించు' },
        ]
      : [
          { label: 'Tomato price?', query: "What is today's tomato price?" },
          { label: 'Add new product', query: 'Add a new product' },
          { label: 'Show my orders', query: 'Show my orders' },
          { label: 'Search rice', query: 'Show rice products' },
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
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Mute Audio' : 'Enable Audio'}
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
        {micPermission === 'denied' && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-start gap-2 text-sm text-red-800 shrink-0">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <div>
              <strong>{language === 'te' ? 'మైక్రోఫోన్ అనుమతి అవసరం' : 'Microphone Permission Required'}</strong>
              <p className="text-xs mt-0.5">
                {language === 'te'
                  ? 'URL బార్ లో 🔒 ఐకాన్ నొక్కి → Site Settings → Microphone → Allow చేయండి. తర్వాత పేజీ రీలోడ్ చేయండి.'
                  : 'Click the 🔒 icon in your URL bar → Site Settings → Microphone → Allow. Then reload the page.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Chat messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-1
                ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-teal-700'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[80%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'}`}>
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

                {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {msg.followUps.slice(0, 2).map((fu, i) => (
                      <button
                        key={i}
                        onClick={() => processUserMessage(fu)}
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

          {/* Live interim transcript */}
          {isListening && interimText && (
            <div className="flex gap-2 flex-row-reverse">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[80%]">
                <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-emerald-100 text-emerald-800 text-sm italic border border-emerald-200">
                  {interimText}
                  <span className="inline-block w-1 h-3.5 bg-emerald-600 ml-1 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Processing indicator */}
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

        {/* ── Quick chips ── */}
        <div className="px-4 pt-2 pb-1 bg-white border-t border-stone-100 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {quickCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => processUserMessage(item.query)}
                disabled={isProcessing}
                className="text-xs whitespace-nowrap bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full px-3 py-1.5 font-medium transition-all shrink-0 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error message ── */}
        {errorMsg && !micPermission.includes('denied') && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!browserSupported || micPermission === 'denied'}
              title={
                micPermission === 'denied'
                  ? 'Microphone permission denied'
                  : isListening
                  ? 'Stop listening'
                  : 'Start voice input'
              }
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow transition-all select-none
                ${isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white scale-110 shadow-rose-300'
                  : micPermission === 'denied'
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95'
                }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <form onSubmit={handleManualSubmit} className="flex-1 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder={
                  isListening
                    ? language === 'te' ? '🎤 వింటున్నాను...' : '🎤 Listening...'
                    : language === 'te'
                    ? 'మాట్లాడండి లేదా టైప్ చేయండి...'
                    : 'Speak or type your question...'
                }
                disabled={isProcessing}
                className="flex-1 bg-stone-100 rounded-xl px-4 py-2 text-sm text-stone-800 placeholder-stone-400 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!manualQuery.trim() || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Listening status */}
          {isListening && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs text-rose-600 font-semibold">
                {language === 'te' ? 'వింటున్నాను — స్పష్టంగా మాట్లాడండి' : 'Listening — speak clearly'}
              </p>
              {/* Live waveform dots */}
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-bounce"
                    style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!browserSupported && (
            <p className="text-xs text-amber-700 mt-1.5 text-center">
              {language === 'te'
                ? 'మీ బ్రౌజర్ మైక్‌కు మద్దతు ఇవ్వడం లేదు. Chrome బ్రౌజర్ వాడండి.'
                : 'Voice not supported in this browser. Please use Chrome.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

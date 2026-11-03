import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, ArrowRight, Send, Bot, User } from 'lucide-react';
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

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync with state (for use in recognition callbacks)
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isProcessing, interimText]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        text:
          language === 'te'
            ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. మీకు పంట ధరలు, ఆర్డర్లు, మార్కెట్ సమాచారం ఇవ్వగలను. మైక్ నొక్కండి లేదా అడగండి!'
            : 'Hello! I am the FarmConnect AI Assistant. I can help with crop prices, orders, market information and much more. Press the mic or type your question!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory([welcome]);
      if (ttsEnabled) speakText(welcome.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
      if (finalText.trim()) {
        setInterimText('');
        processUserMessage(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is expected; don't show error for it
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
        setErrorMsg(
          language === 'te'
            ? 'మైక్రోఫోన్ సమస్య. దయచేసి మళ్లీ ప్రయత్నించండి.'
            : 'Microphone error. Please try again.'
        );
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (_) {
          // ignore
        }
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (_) {}
    };
  }, [language]);

  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
        utterance.rate = 0.88;
        utterance.pitch = 1.0;

        // Try to find a Telugu/Indian voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && language === 'te') {
          const teVoice =
            voices.find((v) => v.lang === 'te-IN') ||
            voices.find((v) => v.lang.startsWith('te')) ||
            voices.find((v) => v.lang === 'hi-IN') ||
            voices.find((v) => v.lang.startsWith('hi'));
          if (teVoice) utterance.voice = teVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS error:', e);
      }
    },
    [ttsEnabled, language]
  );

  const startListening = () => {
    if (!recognitionRef.current) {
      setBrowserSupported(false);
      return;
    }
    setErrorMsg('');
    try {
      recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'time'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const processUserMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    // Add user bubble
    addMessage({ role: 'user', text });
    setIsProcessing(true);

    // Build history context (last 6 messages)
    const historyContext = chatHistory.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          userRole: role,
          history: historyContext,
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        (language === 'te' ? 'మీ అభ్యర్థన అర్థమైంది.' : 'Understood your request.');

      const assistantMsg = addMessage({
        role: 'assistant',
        text: replyText,
        action: data.action,
        followUps: data.suggestedFollowUps || [],
      });

      speakText(replyText);
    } catch (error) {
      console.warn('AI Assistant error, falling back to local intent parser:', error);
      handleLocalFallback(text);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocalFallback = (text: string) => {
    const q = text.toLowerCase();
    const isTe = language === 'te';

    let localReply = '';
    let action: ChatMessage['action'] = undefined;

    if (
      q.includes('టమాటా') ||
      q.includes('tomato') ||
      q.includes('ధర') ||
      q.includes('price') ||
      q.includes('mandi') ||
      q.includes('మార్కెట్')
    ) {
      localReply = isTe
        ? 'నేటి టమాటా సగటు మార్కెట్ ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). మార్కెట్ ధరల పేజీ తెరవడానికి కింద బటన్ నొక్కండి.'
        : "Today's average modal tomato mandi price is ₹3,400/Quintal (approx ₹34/kg). Click below to view the live market price dashboard.";
      action = { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' };
    } else if (
      q.includes('కొత్త పంట') ||
      q.includes('add product') ||
      q.includes('జోడించు') ||
      q.includes('అప్లోడ్')
    ) {
      localReply = isTe
        ? 'కొత్త వ్యవసాయ ఉత్పత్తిని చేర్చే పేజీని తెరవడానికి కింద బటన్ నొక్కండి.'
        : 'Click below to open the new agricultural crop upload form.';
      action = { type: 'NAVIGATE_ADD_PRODUCT' };
    } else if (
      q.includes('ఆర్డర్') ||
      q.includes('order') ||
      q.includes('ట్రాక్') ||
      q.includes('track')
    ) {
      localReply = isTe
        ? 'మీ ఆర్డర్ల వివరాలు చూడడానికి కింద బటన్ నొక్కండి.'
        : 'Click below to view your current orders and tracking.';
      action = { type: 'NAVIGATE_ORDERS' };
    } else if (q.includes('బియ్యం') || q.includes('rice')) {
      localReply = isTe
        ? 'స్వచ్ఛమైన గోదావరి బియ్యం ఉత్పత్తులు చూడడానికి కింద నొక్కండి.'
        : 'Click below to see direct-from-farm single-origin rice products.';
      action = { type: 'NAVIGATE_MARKETPLACE', param: 'rice' };
    } else if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
      localReply = isTe
        ? 'గుంటూరు తేజ ఎర్ర మిరపకాయల వివరాలు చూడడానికి నొక్కండి.'
        : 'Click below to see authentic Guntur Teja dried chillies.';
      action = { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' };
    } else if (
      q.includes('అమ్మకాల') ||
      q.includes('sales') ||
      q.includes('ఆదాయం') ||
      q.includes('earnings')
    ) {
      localReply = isTe
        ? 'మీ అమ్మకాలు మరియు ఆదాయ నివేదిక తెరవడానికి నొక్కండి.'
        : 'Click below to open your farm sales analytics report.';
      action = { type: 'NAVIGATE_FARMER_SALES' };
    } else {
      localReply = isTe
        ? `మీరు అడిగిన "${text}" గురించి మార్కెట్‌లో వెతికాను. కింద బటన్ నొక్కి ఫలితాలు చూడండి.`
        : `I searched for "${text}" in the marketplace. Click below to see results.`;
      action = { type: 'NAVIGATE_MARKETPLACE', param: text };
    }

    addMessage({ role: 'assistant', text: localReply, action });
    speakText(localReply);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim() && !isProcessing) {
      processUserMessage(manualQuery.trim());
      setManualQuery('');
    }
  };

  const handleNavigate = (action: ChatMessage['action']) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col"
        style={{ height: '90vh', maxHeight: '700px' }}>

        {/* ── Header ── */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
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
            {/* TTS Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Mute Audio Responses' : 'Enable Audio Responses'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-200" /> : <VolumeX className="w-4 h-4 text-white/60" />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-colors"
            >
              {language === 'en' ? 'తెలుగు' : 'English'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Chat messages area ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1
                ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-teal-700'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'}`}>
                  {msg.text}
                </div>

                {/* Navigate button for assistant messages with action */}
                {msg.role === 'assistant' && msg.action?.type && (
                  <button
                    onClick={() => handleNavigate(msg.action)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" />
                    {language === 'te' ? 'పేజీకి వెళ్ళండి →' : 'Go to page →'}
                  </button>
                )}

                {/* Follow-up suggestions */}
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

          {/* Interim transcript bubble */}
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

          {/* Thinking indicator */}
          {isProcessing && (
            <div className="flex gap-2 flex-row">
              <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-stone-200 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Quick command chips ── */}
        <div className="px-4 py-2 bg-white border-t border-stone-100 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  processUserMessage(item.query);
                }}
                disabled={isProcessing}
                className="text-xs whitespace-nowrap bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full px-3 py-1.5 font-medium transition-all shrink-0 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error message ── */}
        {errorMsg && (
          <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 text-xs text-red-700 shrink-0">
            ⚠ {errorMsg}
          </div>
        )}

        {/* ── Bottom input bar ── */}
        <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!browserSupported}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow transition-all
                ${isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                    ? 'టైప్ చేయండి లేదా మాట్లాడండి...'
                    : 'Type or speak a question...'
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

          {/* Mic status hint */}
          {isListening && (
            <p className="text-xs text-rose-600 font-medium mt-1.5 text-center animate-pulse flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse" />
              {language === 'te' ? 'వింటున్నాను — మాట్లాడండి' : 'Listening — speak now'}
            </p>
          )}

          {!browserSupported && (
            <p className="text-xs text-amber-700 mt-1 text-center">
              {language === 'te'
                ? 'మీ బ్రౌజర్ మైక్‌కు మద్దతు ఇవ్వడం లేదు. టైప్ చేయండి.'
                : 'Microphone not supported in this browser. Please use text input.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Language } from '../../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, param?: any) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { role } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [manualQuery, setManualQuery] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage(language === 'te' ? 'వింటున్నాము... మాట్లాడండి' : 'Listening... Speak now');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          setStatusMessage(
            language === 'te'
              ? 'వాయిస్ గుర్తించడంలో సమస్య ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.'
              : 'Could not catch your voice. Please try again or type below.'
          );
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setBrowserSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn(e);
        }
      }
    };
  }, [language]);

  // When speech recognition ends and we have a transcript, process it
  useEffect(() => {
    if (!isListening && transcript.trim().length > 1 && !isProcessing) {
      handleProcessCommand(transcript);
    }
  }, [isListening, transcript]);

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const startListening = () => {
    setTranscript('');
    setReply('');
    setStatusMessage('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    } else {
      setBrowserSupported(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsListening(false);
  };

  const handleProcessCommand = async (queryText: string) => {
    setIsProcessing(true);
    setStatusMessage(language === 'te' ? 'మీ ఆదేశాన్ని అర్థం చేసుకుంటున్నాము...' : 'Interpreting voice command with AI...');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          language,
          userRole: role,
        }),
      });

      const data = await response.json();
      const assistantReply = data.reply || (language === 'te' ? 'మీ అభ్యర్థన పూర్తయింది.' : 'Understood your request.');
      setReply(assistantReply);
      speakText(assistantReply);

      // Execute action if parsed by server or client
      executeAction(queryText, data.action);
    } catch (error) {
      console.warn('AI Assistant error, falling back to local intent parser:', error);
      handleLocalFallback(queryText);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const executeAction = (text: string, action: any) => {
    const lower = text.toLowerCase();

    if (action && action.type) {
      setTimeout(() => {
        if (action.type === 'NAVIGATE_MARKET_PRICES') {
          onNavigate('market-prices');
          onClose();
        } else if (action.type === 'NAVIGATE_MARKETPLACE') {
          onNavigate('marketplace', { search: action.param });
          onClose();
        } else if (action.type === 'NAVIGATE_ADD_PRODUCT') {
          onNavigate('add-product');
          onClose();
        } else if (action.type === 'NAVIGATE_ORDERS') {
          onNavigate('orders');
          onClose();
        } else if (action.type === 'NAVIGATE_FARMER_SALES') {
          onNavigate('farmer-sales');
          onClose();
        }
      }, 1400);
      return;
    }

    // Local pattern detection
    handleLocalFallback(text);
  };

  const handleLocalFallback = (text: string) => {
    const q = text.toLowerCase();
    const isTe = language === 'te';

    let localReply = '';
    let targetView = '';
    let param: any = null;

    if (q.includes('టమాటా') || q.includes('tomato') || q.includes('ధర') || q.includes('price') || q.includes('mandi') || q.includes('మార్కెట్')) {
      localReply = isTe
        ? 'నేటి టమాటా సగటు మార్కెట్ ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). మార్కెట్ ధరల పేజీకి తీసుకెళ్తున్నాను.'
        : 'Today\'s average modal tomato mandi price is ₹3,400/Quintal (approx ₹34/kg). Opening live market price dashboard.';
      targetView = 'market-prices';
      param = { crop: 'Tomato' };
    } else if (q.includes('కొత్త పంట') || q.includes('add product') || q.includes('జోడించు') || q.includes('అప్లోడ్')) {
      localReply = isTe
        ? 'కొత్త వ్యవసాయ ఉత్పత్తిని చేర్చే పేజీని తెరుస్తున్నాను.'
        : 'Opening new agricultural crop upload form for you.';
      targetView = 'add-product';
    } else if (q.includes('ఆర్డర్') || q.includes('order') || q.includes('orders') || q.includes('ట్రాక్') || q.includes('track')) {
      localReply = isTe
        ? 'మీ ఆర్డర్ల వివరాలను చూపిస్తున్నాను.'
        : 'Showing your current farm orders and tracking timeline.';
      targetView = 'orders';
    } else if (q.includes('బియ్యం') || q.includes('rice')) {
      localReply = isTe
        ? 'రైతుల వద్ద ఉన్న స్వచ్ఛమైన గోదావరి బియ్యం ఉత్పత్తులను చూపిస్తున్నాను.'
        : 'Showing direct-from-farm single-origin rice products.';
      targetView = 'marketplace';
      param = { category: 'grains', search: 'rice' };
    } else if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
      localReply = isTe
        ? 'గుంటూరు తేజ ఎర్ర మిరపకాయల వివరాలను చూపిస్తున్నాను.'
        : 'Showing authentic Guntur Teja dried chillies.';
      targetView = 'marketplace';
      param = { category: 'spices', search: 'chilli' };
    } else if (q.includes('అమ్మకాల') || q.includes('sales') || q.includes('ఆదాయం') || q.includes('earnings')) {
      localReply = isTe
        ? 'మీ అమ్మకాలు మరియు ఆదాయ నివేదికను తెరుస్తున్నాను.'
        : 'Opening your farm sales analytics report.';
      targetView = 'farmer-dashboard';
    } else {
      localReply = isTe
        ? `మీరు అడిగిన "${text}" కొరకు మార్కెట్ ఉత్పత్తులను శోధిస్తున్నాము.`
        : `Searching fresh farm produce for "${text}".`;
      targetView = 'marketplace';
      param = { search: text };
    }

    setReply(localReply);
    speakText(localReply);

    if (targetView) {
      setTimeout(() => {
        onNavigate(targetView, param);
        onClose();
      }, 1500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      setTranscript(manualQuery);
      handleProcessCommand(manualQuery);
      setManualQuery('');
    }
  };

  const quickCommands = language === 'te'
    ? [
        { label: 'టమాటా ధర ఎంత?', query: 'టమాటా ధర ఎంత?' },
        { label: 'కొత్త పంటను జోడించు', query: 'కొత్త పంటను జోడించు' },
        { label: 'నా ఆర్డర్లు చూపించు', query: 'నా ఆర్డర్లు చూపించు' },
        { label: 'బియ్యం ఉత్పత్తులు వెతుకు', query: 'బియ్యం ఉత్పత్తులను చూపించు' },
        { label: 'నేటి మార్కెట్ ధరలు', query: 'నేటి మార్కెట్ ధరలు చూపించు' },
      ]
    : [
        { label: 'What is tomato price?', query: "What is today's tomato price?" },
        { label: 'Add new product', query: 'Add a new product' },
        { label: 'Show my orders', query: 'Show my orders' },
        { label: 'Search rice crops', query: 'Show rice products' },
        { label: 'Show market prices', query: "Show today's market prices" },
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{t('voiceModalTitle')}</h3>
              <p className="text-xs text-emerald-100 font-medium">
                {language === 'te' ? 'తెలుగు మరియు ఇంగ్లీష్ మద్దతు' : 'Telugu (te-IN) & English (en-IN)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Readout Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Mute Audio Responses' : 'Enable Audio Responses'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-200" /> : <VolumeX className="w-4 h-4 text-white/60" />}
            </button>

            {/* Language Switcher inside voice modal */}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          {/* Wave animation & big microphone button */}
          <div className="my-4 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Pulsing visual circles */}
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-400/30 animate-ping" />
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-500/40 animate-pulse" />
                </>
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 animate-pulse" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            <p className="mt-4 font-semibold text-stone-700 text-center">
              {isListening ? (
                <span className="text-rose-600 font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                  {t('voiceMicrophoneOff')}
                </span>
              ) : (
                <span className="text-stone-600">{t('voiceMicrophoneOn')}</span>
              )}
            </p>
            <p className="text-xs text-stone-400 mt-0.5 text-center">
              {language === 'te' ? 'మైక్ నొక్కి నేరుగా మాట్లాడండి' : 'Click the mic and speak clearly into your microphone'}
            </p>
          </div>

          {/* Transcript / Spoken Result Box */}
          <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 min-h-[90px] flex flex-col justify-center">
            {transcript ? (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {language === 'te' ? 'మీరు చెప్పినది:' : 'You said:'}
                </span>
                <p className="text-stone-800 text-base font-semibold mt-1">"{transcript}"</p>
              </div>
            ) : isListening ? (
              <p className="text-stone-400 italic text-sm text-center animate-pulse">
                {t('voiceListening')}
              </p>
            ) : (
              <p className="text-stone-400 text-xs text-center">
                {t('voiceInstruction')}
              </p>
            )}
          </div>

          {/* Assistant Response Box */}
          {(reply || isProcessing) && (
            <div className="w-full mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'te' ? 'ఫార్మ్‌కనెక్ట్ సమాధానం:' : 'FarmConnect Assistant:'}</span>
              </div>
              {isProcessing ? (
                <div className="flex items-center gap-2 text-emerald-700 py-1 text-sm font-medium">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>{statusMessage || t('voiceThinking')}</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed font-medium">{reply}</p>
              )}
            </div>
          )}

          {/* Quick Voice Prompt Suggestions */}
          <div className="w-full mt-5">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              {language === 'te' ? 'సూచించిన ఆదేశాలు (నొక్కండి):' : 'Suggested Commands (or click to run):'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickCommands.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(item.query);
                    handleProcessCommand(item.query);
                  }}
                  className="text-xs bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 rounded-full px-3 py-1.5 font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Text Input Fallback */}
          <form onSubmit={handleManualSubmit} className="w-full mt-5 pt-4 border-t border-stone-100 flex gap-2">
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder={
                language === 'te'
                  ? 'లేదా టైప్ చేసి అడగండి (ఉదా: టమాటా ధర ఎంత?)...'
                  : 'Or type your question here (e.g. Tomato price?)...'
              }
              className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!manualQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {language === 'te' ? 'పంపండి' : 'Ask'}
            </button>
          </form>

          {!browserSupported && (
            <div className="w-full mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'te'
                  ? 'మీ బ్రౌజర్ స్పీచ్ రికగ్నిషన్‌కు మద్దతు ఇవ్వడం లేదు. మీరు పైన నేరుగా టైప్ చేయవచ్చు.'
                  : 'Microphone recognition not supported in this browser. Please use the text input above.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

// ── Pure helper: conversational chit-chat (Instant friendly replies) ────────
function getConvoReply(text: string, isTe: boolean): string | null {
  const q = text.toLowerCase().trim();

  // 1. Greetings
  if (
    /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening)\b/.test(q) ||
    /^(నమస్కారం|నమస్కార|హలో|హాయ్|నమస్తే)\b/.test(q)
  ) {
    return isTe
      ? 'నమస్కారం! నేను మీ FarmConnect AI సహాయకుడిని. మీకు వ్యవసాయం, పంట ధరలు లేదా ఏదైనా సలహా కావాలా? అడగండి!'
      : 'Hello! I am your FarmConnect AI Assistant. How can I help you today with crops, market rates, or farming advice?';
  }

  // 2. How are you
  if (/how are you|how do you do/.test(q) || /మీరు ఎలా|బాగున్నారా|ఎలా ఉన్నారు/.test(q)) {
    return isTe
      ? 'నేను చాలా బాగున్నాను, ధన్యవాదాలు! రైతు సోదరులతో మాట్లాడటం నాకు చాలా ఇష్టం. మీ పొలం పనులు ఎలా సాగుతున్నాయి?'
      : "I am doing great, thank you! Always happy to assist farmers and buyers. How are your farm activities going?";
  }

  // 3. Who are you / Identity
  if (/your name|who are you|who made you/.test(q) || /మీ పేరు|నీ పేరు|ఎవరు మీరు|నువ్వు ఎవరు/.test(q)) {
    return isTe
      ? 'నా పేరు FarmConnect AI Assistant. నేను రైతులకు మరియు వినియోగదారులకు మార్కెట్ ధరలు, పంట సలహాలు మరియు సూచనలు ఇచ్చే స్మార్ట్ వ్యవసాయ మిత్రుడిని!'
      : 'I am the FarmConnect AI Assistant — your smart agricultural companion for crop prices, farming advice, and connecting directly with buyers!';
  }

  // 4. What are you doing / Chit-chat
  if (/what are you doing|what are you up to/.test(q) || /ఏం చేస్తున్నావ్|ఏం చేస్తున్నావు|ఏమి చేస్తున్నావ్/.test(q)) {
    return isTe
      ? 'రైతుల కోసం తాజా మండీ ధరలు మరియు వ్యవసాయ సలహాలను సిద్ధం చేస్తున్నాను! మీరు ఏ పంట సాగు చేస్తున్నారు?'
      : 'I am tracking today’s live APMC market prices and preparing farming tips! What crops are you currently growing?';
  }

  // 5. I am a farmer / User introduction
  if (/i am a farmer|i am farmer/.test(q) || /నేను రైతు|రైతుని|నాకు పొలం ఉంది/.test(q)) {
    return isTe
      ? 'మీలాంటి అన్నదాతలతో మాట్లాడటం మాకు గర్వకారణం! మీకు ఎలాంటి పంట సలహాలు లేదా మార్కెట్ సమాచారం కావాలో నన్ను అడగండి.'
      : 'Honored to speak with a farmer! Farmers are the backbone of our nation. How can I assist with your crops or sales today?';
  }

  // 6. Joke / Fun
  if (/joke|funny/.test(q) || /జోక్|నవ్వు/.test(q)) {
    return isTe
      ? 'ఒక రైతును అడిగారట: "ఈ సంవత్సరం వర్షాలు ఎలా ఉన్నాయి?" అని. దానికి రైతు: "వర్షాలు చాలా క్రమశిక్షణగా ఉన్నాయి, కేవలం సెలవు రోజుల్లోనే వస్తున్నాయి!" అన్నారట! 😄'
      : 'Why did the scarecrow win an award? Because he was outstanding in his field! 😄 Hope that brought a smile!';
  }

  // 7. Compliments
  if (/you are good|you are great|nice|smart|i like you/.test(q) || /మంచివి|బాగున్నావ్|గొప్ప|చాలా బాగుంది/.test(q)) {
    return isTe
      ? 'చాలా ధన్యవాదాలు! మీ మాటలు నాకు ఎంతో ఉత్సాహాన్ని ఇచ్చాయి. మీకు సహాయపడటానికి నేను ఎల్లప్పుడూ ఇక్కడే ఉంటాను.'
      : 'Thank you so much! That warms my heart. I am always here to support you with your agricultural needs.';
  }

  // 8. Gratitude / OK
  if (/^(thanks|thank you|thank u|great|awesome|perfect|super)\b/.test(q) || /ధన్యవాదాలు|థాంక్స్|మంచిది|సరే/.test(q)) {
    return isTe
      ? 'మీకు స్వాగతం! వ్యవసాయం, విత్తనాలు, ఎరువులు లేదా అమ్మకాల గురించి మరేదైనా సలహా కావాలంటే అడగండి.'
      : 'You are most welcome! Feel free to ask anytime for crop advice, seeds, fertilizers, or selling tips.';
  }

  // 9. Farewell
  if (/^(bye|goodbye|see you|good night)\b/.test(q) || /సెలవు|బై|మళ్ళీ కలుద్దాం/.test(q)) {
    return isTe
      ? 'సెలవు! మీ పంటలు సమృద్ధిగా పండాలని ఆశిస్తున్నాను. మళ్లీ ఎప్పుడైనా మాట్లాడండి!'
      : 'Goodbye! Wishing you a bountiful harvest and great profits. Chat with me anytime!';
  }

  return null;
}

// ── Pure helper: rich agricultural advises & suggestions ────────────────────
function getLocalReply(text: string, isTe: boolean): { reply: string; action?: { type: string; param?: string } } {
  const q = text.toLowerCase();

  // ── A. Pest & Disease Advice (పురుగులు & తెగుళ్లు) ──
  if (q.includes('పురుగు') || q.includes('తెగులు') || q.includes('pest') || q.includes('disease') || q.includes('మందు') || q.includes('స్ప్రే')) {
    if (q.includes('మిరప') || q.includes('chilli')) {
      return {
        reply: isTe
          ? 'మిరపలో తామర పురుగులు లేదా బొబ్బర తెగులు నివారణకు: వేప నూనె (10,000 ppm) లీటరు నీటికి 3-5 మి.లీ కలిపి పిచికారీ చేయండి. తీవ్రత ఎక్కువగా ఉంటే డైఫెన్థియురాన్ లేదా ఎసిఫేట్ వాడండి.'
          : 'For Chilli thrips and leaf curl: Spray Neem oil (10,000 ppm) at 3-5 ml/L. For severe infestation, apply Diafenthiuron or Acetamiprid under guidance.',
      };
    }
    if (q.includes('టమాటా') || q.includes('tomato')) {
      return {
        reply: isTe
          ? 'టమాటాలో కాయ తొలుచు పురుగు నివారణకు ఎకరానికి 5-8 లింగాకర్షక బుట్టలు (Pheromone traps) పెట్టండి. ఆకుమచ్చ తెగులుకు మాంకోజెబ్ 2.5 గ్రాములు లీటరు నీటికి కలిపి పిచికారీ చేయండి.'
          : 'For Tomato fruit borer: Install 5-8 pheromone traps per acre. For early blight, spray Mancozeb at 2.5 g/L of water.',
      };
    }
    if (q.includes('వరి') || q.includes('rice') || q.includes('paddy')) {
      return {
        reply: isTe
          ? 'వరిలో కాండం తొలుచు పురుగు నివారణకు కార్టాప్ హైడ్రోక్లోరైడ్ 4G గుళికలు ఎకరానికి 8 కిలోలు చల్లండి. పొలంలో నీరు నిలిచేలా చూడండి.'
          : 'For Paddy stem borer: Apply Cartap Hydrochloride 4G granules at 8 kg per acre with standing water.',
      };
    }
    return {
      reply: isTe
        ? 'చీడపీడల నివారణకు ముందుగా వేప కషాయం లేదా జీవామృతం పిచికారీ చేయడం ఉత్తమం. ఏ పంటకు ఏ పురుగు సమస్య ఉందో వివరంగా చెబితే ఖచ్చితమైన సలహా ఇస్తాను.'
        : 'For pest control, bio-solutions like Neem oil or Trichoderma are great first steps. Mention your specific crop and pest symptoms for exact recommendations.',
    };
  }

  // ── B. Fertilizer & Nutrition Advice (ఎరువులు & నేల) ──
  if (q.includes('ఎరువు') || q.includes('fertilizer') || q.includes('dap') || q.includes('యూరియా') || q.includes('urea') || q.includes('పోషక')) {
    return {
      reply: isTe
        ? 'రసాయన ఎరువులతో పాటు పశువుల ఎరువు లేదా వర్మీకంపోస్ట్ వాడటం వలన నేల సారం పెరుగుతుంది. వరి లేదా మిరపకు నత్రజని (యూరియా) ఒకేసారి కాకుండా 3 దఫాలుగా వేయడం మంచిది.'
        : 'Combine organic vermicompost with chemical fertilizers for soil health. Split Nitrogen (Urea) into 2-3 doses rather than applying all at once.',
    };
  }

  // ── C. Irrigation & Water Advice (నీటి యాజమాన్యం) ──
  if (q.includes('నీరు') || q.includes('water') || q.includes('సేద్యం') || q.includes('irrigation') || q.includes('డ్రిప్') || q.includes('drip')) {
    return {
      reply: isTe
        ? 'టమాటా, మిరప, అరటి వంటి పంటలకు బిందు సేద్యం (డ్రిప్) వాడటం వలన 40-50% నీరు ఆదా అవుతుంది, కలుపు తగ్గుతుంది మరియు దిగుబడి 20-30% పెరుగుతుంది.'
        : 'Drip irrigation saves 40-50% water, cuts weed growth, and increases crop yields by up to 25% for tomatoes, chillies, and bananas.',
    };
  }

  // ── D. Selling & Profit Tips (మంచి ధర, లాభాలు) ──
  if (q.includes('లాభం') || q.includes('ధర పొందడం') || q.includes('profit') || q.includes('sell') || q.includes('అమ్మకం') || q.includes('ఎలా అమ్మాలి')) {
    return {
      reply: isTe
        ? 'మంచి లాభాల కోసం: పంటను గ్రేడింగ్ (A/B రకాలుగా వేరు చేయడం) చేసి FarmConnect లో నేరుగా వినియోగదారులకు లేదా హోల్‌సేలర్లకు అమ్మండి. దళారుల కమీషన్ లేకుండా అధిక ఆదాయం పొందవచ్చు!'
        : 'To maximize profits: Grade your produce, check live APMC market rates, and list directly on FarmConnect to sell directly to buyers without middleman commissions!',
      action: { type: 'NAVIGATE_ADD_PRODUCT' },
    };
  }

  // ── E. Specific Crop Prices ──
  if (q.includes('టమాటా') || q.includes('tomato')) {
    return {
      reply: isTe
        ? 'నేటి గుంటూరు మార్కెట్‌లో టమాటా సగటు ధర ₹34/కిలో (క్వింటాలుకు ₹3,400). లైవ్ మండీ ధరల కోసం కింద బటన్ నొక్కండి.'
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
        ? 'కొత్త పంట నమోదు పేజీని తెరుస్తున్నాను. మీ ఉత్పత్తి వివరాలు అక్కడ నమోదు చేయండి.'
        : 'Opening the crop upload page so you can list your harvest directly.',
      action: { type: 'NAVIGATE_ADD_PRODUCT' },
    };
  }

  if (q.includes('ఆర్డర్') || q.includes('order')) {
    return {
      reply: isTe
        ? 'మీ ఆర్డర్ల వివరాలు మరియు డెలివరీ స్థితిని తెరుస్తున్నాను.'
        : 'Opening your orders and delivery tracking timeline.',
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
  const isSpeakingRef      = useRef(false);
  const currentTextRef     = useRef('');             // Holds the current session transcript (NO DUPLICATION)
  const silenceTimerRef    = useRef<any>(null);      // 2.4s silence detector
  const chatEndRef         = useRef<HTMLDivElement>(null);

  // Live state refs
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
      // 1. Immediately turn OFF microphone so it NEVER hears itself!
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

    // 1. Instant conversational response for chit-chat & pleasantries
    const convo = getConvoReply(clean, isTe);
    if (convo) {
      addMsg({ role: 'assistant', text: convo });
      speakText(convo);
      busyRef.current = false;
      setIsProcessing(false);
      return;
    }

    // 2. Call AI Assistant API (with full multi-turn conversational context)
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
      // 3. Fallback to rich local agricultural advice
      const { reply, action } = getLocalReply(clean, isTe);
      addMsg({ role: 'assistant', text: reply, action });
      speakText(reply);
    } finally {
      busyRef.current = false;
      setIsProcessing(false);
    }
  };

  handleTextRef.current = handleUserText;

  /* ─── Setup Speech Recognition Without Audio Duplication ───────────────── */
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
      // If assistant is currently speaking or processing, drop incoming audio immediately!
      if (isSpeakingRef.current || busyRef.current) {
        return;
      }

      // Reconstruct the FULL transcript directly from e.results — NEVER APPEND TO OLD STATE!
      // This completely eliminates "takes voice 2 or 3 times" duplication.
      let fullTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        const item = e.results[i];
        if (item && item[0]) {
          fullTranscript += item[0].transcript + ' ';
        }
      }

      const cleanTranscript = fullTranscript.trim();
      if (!cleanTranscript) return;

      currentTextRef.current = cleanTranscript;
      setInterimText(cleanTranscript);

      // Clear previous silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Auto turn-off mic and send after ~2.4 seconds of silence
      silenceTimerRef.current = setTimeout(() => {
        const textToSend = currentTextRef.current.trim();
        if (textToSend && !isSpeakingRef.current && !busyRef.current) {
          currentTextRef.current = '';
          setInterimText('');
          stopListeningInternal();
          handleTextRef.current(textToSend);
        }
      }, 2400);
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
        ? 'నమస్కారం! నేను FarmConnect AI సహాయకుడిని. నాతో సరదాగా మాట్లాడవచ్చు లేదా పంట ధరలు, చీడపీడల నివారణ, ఎరువుల సలహాలు అడగవచ్చు. మైక్ నొక్కి మాట్లాడండి!'
        : 'Hello! I am your FarmConnect AI Companion. Ask me for crop advice, market prices, farming tips, or just have a chat. Tap the mic and speak!';
      addMsg({ role: 'assistant', text: txt });
      speakText(txt);
    }
    if (!isOpen) {
      stopListeningInternal();
      setInterimText('');
      currentTextRef.current = '';
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

    // Interrupt assistant speech if active
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    setErrorMsg('');
    setPermDenied(false);
    setInterimText('');
    currentTextRef.current = '';
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

  // User manually stops mic early before 2.4s timeout
  const stopListeningManual = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const textToSend = currentTextRef.current.trim() || interimText.trim();
    currentTextRef.current = '';
    setInterimText('');
    stopListeningInternal();

    if (textToSend && !isSpeakingRef.current && !busyRef.current) {
      handleTextRef.current(textToSend);
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
        { label: 'నమస్కారం! బాగున్నారా? 👋', query: 'నమస్కారం! మీరు ఎలా ఉన్నారు?' },
        { label: 'మిరపలో పురుగు నివారణ సలహా 🌶', query: 'మిరప పంటలో పురుగుల నివారణకు సలహా ఇవ్వండి' },
        { label: 'టమాటా ధర ఎంత? 🍅', query: 'టమాటా ధర ఎంత?' },
        { label: 'మంచి లాభం పొందడం ఎలా? 💡', query: 'పంటను మంచి ధరకు ఎలా అమ్మాలి?' },
        { label: 'నేటి మార్కెట్ ధరలు 📊', query: 'నేటి మార్కెట్ ధరలు చూపించు' },
      ]
    : [
        { label: 'Hello! How are you? 👋', query: 'Hello! How are you doing today?' },
        { label: 'Chilli pest control tips 🌶', query: 'Give me advice for pest control in chilli' },
        { label: 'Tomato price today? 🍅', query: "What is today's tomato price?" },
        { label: 'How to maximize profits? 💡', query: 'How to get best price for my crops?' },
        { label: 'Live market prices 📊', query: "Show today's market prices" },
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
                {language === 'te' ? 'తెలుగు & English — AI వ్యవసాయ మిత్రుడు & సలహాదారు' : 'Telugu & English — AI Agricultural Companion & Advisor'}
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

                {/* Quick Follow-up chips */}
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

          {/* Live speech transcription bubble (single clean text without duplication) */}
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
                  {language === 'te' ? 'సలహా ఆలోచిస్తున్నాను...' : 'Thinking advice...'}
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
                    ? (language === 'te' ? '🎤 వింటున్నాను... మాట్లాడి 2-3 సెకన్లు ఆగండి' : '🎤 Listening... speak & pause to send')
                    : (language === 'te' ? 'నాతో మాట్లాడండి లేదా టైప్ చేయండి...' : 'Chat, ask advice or type here...')
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
                  ? 'వింటున్నాము — మాట్లాడటం ఆపిన 2-3 సెకన్లలో సమాధానం వస్తుంది'
                  : 'Listening — stop speaking to automatically send'}
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

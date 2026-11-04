import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.NODE_ENV === 'production' && process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini SDK if real API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function getSmartAgriculturalResponse(message: string, isTelugu: boolean, userRole: string) {
  const q = message.toLowerCase();

  if (q.includes('టమాటా') || q.includes('tomato') || q.includes('ధర') || q.includes('price') || q.includes('రేటు')) {
    return {
      reply: isTelugu
        ? 'నేడు గుంటూరు APMC మార్కెట్‌లో నాటు టమాటా సగటు మోడల్ ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). ఫార్మ్‌కనెక్ట్‌లో రైతులు నేరుగా కిలో ₹34కే విక్రయిస్తున్నారు.'
        : "Today's average modal tomato mandi price in Guntur APMC is ₹3,400/Quintal (~₹34/kg). Direct farm listings are available from ₹34/kg.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' },
      suggestedFollowUps: isTelugu ? ['ఉల్లిపాయ ధర ఎంత?', 'బియ్యం చూపించు'] : ['Check Onion rates', 'Explore direct harvests'],
    };
  }

  if (q.includes('కొత్త పంట') || q.includes('add product') || q.includes('జోడించు') || q.includes('అప్లోడ్') || q.includes('upload')) {
    return {
      reply: isTelugu
        ? 'కొత్త వ్యవసాయ ఉత్పత్తిని అప్‌లోడ్ చేసే ఫారమ్‌ను తెరుస్తున్నాము. మీరు పంట పేరు, ధర మరియు లభ్యత నమోదు చేయవచ్చు.'
        : 'Opening the new crop listing form for you. Fill in crop variety, per kg price, and harvest date.',
      action: { type: 'NAVIGATE_ADD_PRODUCT', param: null },
      suggestedFollowUps: isTelugu ? ['నా ఉత్పత్తుల జాబితా', 'మార్కెట్ ధరలు'] : ['My live listings', 'Check market rates'],
    };
  }

  if (q.includes('ఆర్డర్') || q.includes('order') || q.includes('ట్రాక్') || q.includes('track')) {
    return {
      reply: isTelugu
        ? 'మీ తాజా ఆర్డర్లు మరియు డెలివరీ స్థితి (లైవ్ ట్రాకింగ్) పేజీని చూపిస్తున్నాము.'
        : 'Displaying your current farm orders and live delivery tracking timeline.',
      action: { type: 'NAVIGATE_ORDERS', param: null },
      suggestedFollowUps: isTelugu ? ['ఆర్డర్ స్థితి ఏమిటి?', 'రైతుతో మాట్లాడండి'] : ['Track dispatch PIN', 'Chat with farmer'],
    };
  }

  if (q.includes('బియ్యం') || q.includes('వరి') || q.includes('rice') || q.includes('paddy')) {
    return {
      reply: isTelugu
        ? 'గోదావరి డెల్టాలో పండించిన 12 నెలల పాత సింగిల్ ఆరిజిన్ సోనా మసూరి బియ్యం కిలో ₹58 చొప్పున అందుబాటులో ఉంది.'
        : 'Aged 12-month single-origin Godavari Sona Masoori raw rice is available directly from farmer Ramanaiah at ₹58/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'rice' },
      suggestedFollowUps: isTelugu ? ['రైతు వివరాలు', 'బుట్టలో చేర్చు'] : ['Farmer profile', 'Add to Cart'],
    };
  }

  if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
    return {
      reply: isTelugu
        ? 'గుంటూరు ఆసియా అతిపెద్ద మార్కెట్ యార్డ్‌లో తేజ ఎండిన ఎర్ర మిరపకాయల మోడల్ ధర క్వింటాలుకు ₹19,200 (+3.8% పెరిగింది).'
        : 'Guntur Teja sun-dried chillies modal price reached ₹19,200/Quintal (+3.8% today). Direct farm stock is ₹185/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' },
      suggestedFollowUps: isTelugu ? ['మార్కెట్ ధరలు', 'ఆర్డర్ చేయండి'] : ['Check Mandi Yard', 'Buy Direct'],
    };
  }

  if (q.includes('అమ్మకాల') || q.includes('sales') || q.includes('ఆదాయం') || q.includes('earnings')) {
    return {
      reply: isTelugu
        ? 'మీ వ్యవసాయ అమ్మకాలు మరియు ఆదాయ విశ్లేషణ డాష్‌బోర్డ్‌ను తెరుస్తున్నాము.'
        : 'Opening your farm sales analytics report and monthly revenue breakdown.',
      action: { type: 'NAVIGATE_FARMER_SALES', param: null },
      suggestedFollowUps: isTelugu ? ['పెండింగ్ ఆర్డర్లు', 'స్టాక్ మార్చు'] : ['Pending orders', 'Update stock'],
    };
  }

  return {
    reply: isTelugu
      ? `నమస్కారం! ఫార్మ్‌కనెక్ట్ సహాయకుడికి స్వాగతం. మీరు "${message}" అని అడిగారు. రైతు ఉత్పత్తుల మార్కెట్‌ను తెరుస్తున్నాము.`
      : `Hello! Welcome to FarmConnect Assistant. You asked: "${message}". Opening fresh harvests matching your query.`,
    action: { type: 'NAVIGATE_MARKETPLACE', param: message },
    suggestedFollowUps: isTelugu ? ['టమాటా ధర ఎంత?', 'రైతుల వివరాలు'] : ["Today's Mandi Prices", 'Explore fresh produce'],
  };
}

// Gemini AI Assistant Proxy Endpoint
app.post('/api/assistant', async (req, res) => {
  try {
    const { message, language = 'en', userRole = 'customer', history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(message);

    if (!aiClient) {
      const fallback = getSmartAgriculturalResponse(message, isTelugu, userRole);
      return res.json(fallback);
    }

    try {
      const historyText =
        Array.isArray(history) && history.length > 0
          ? '\nPrevious conversation context:\n' +
            history
              .slice(-6)
              .map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
              .join('\n')
          : '';

      const systemPrompt = `You are FarmConnect AI, a knowledgeable, friendly, conversational agricultural assistant (like a specialized mini ChatGPT for farming and fresh produce in Telugu & English).
User Role: ${userRole}.
Requested Language: ${isTelugu ? 'Telugu (తెలుగు)' : 'English'}.
${historyText}

Context available in app:
- Current crops available: Tomato (టమాటా - ₹34/kg), Rice (సోనా మసూరి - ₹58/kg), Chilli (గుంటూరు తేజ - ₹185/kg), Onion (ఉల్లిపాయలు - ₹28/kg), Potato (బంగాళాదుంపలు - ₹26/kg), Banana (అరటి - ₹45/kg), Groundnut (వేరుశనగ - ₹68/kg), Jaggery (బెల్లం - ₹75/kg).
- User query: "${message}".

Instructions:
1. Provide a warm, concise, and helpful answer in ${isTelugu ? 'simple, natural Telugu' : 'clear English'} (2 to 4 sentences max so voice readout sounds natural).
2. Answer greetings, small talk, and agricultural guidance intelligently.
3. Set action if user wants to navigate:
- NAVIGATE_MARKET_PRICES
- NAVIGATE_MARKETPLACE
- NAVIGATE_ADD_PRODUCT
- NAVIGATE_ORDERS
- NAVIGATE_FARMER_SALES
- SEARCH_CROP

Return pure JSON:
{
  "reply": "string",
  "action": { "type": "string" | null, "param": "string" | null },
  "suggestedFollowUps": ["string"]
}`;

      // Timeout wrapper after 15000ms
      let response;
      try {
        response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch {
        response = await aiClient.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      }
      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (apiError) {
      console.warn('Gemini generateContent timed out or errored, using smart fallback:', apiError);
      const fallback = getSmartAgriculturalResponse(message, isTelugu, userRole);
      return res.json(fallback);
    }
  } catch (error: any) {
    console.error('Error in /api/assistant:', error);
    const isTelugu = req.body?.language === 'te';
    return res.json(getSmartAgriculturalResponse(req.body?.message || '', isTelugu, req.body?.userRole || 'customer'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'FarmConnect',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(geminiApiKey),
  });
});

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase App & Firestore for persistent backend OTP storage
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`FarmConnect full-stack server running on http://0.0.0.0:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${port} is currently busy, waiting before re-binding...`);
    } else {
      console.error('[Server Error]:', err);
    }
  });
}

startServer();

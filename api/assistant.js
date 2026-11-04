import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSmartAgriculturalResponse(message, isTelugu, userRole) {
  const q = (message || '').toLowerCase().trim();

  // 1. Greetings & Chit-chat
  if (
    /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening)\b/.test(q) ||
    /నమస్కారం|నమస్కార|హలో|హాయ్/.test(q)
  ) {
    return {
      reply: isTelugu
        ? 'నమస్కారం! నేను మీ FarmConnect AI సహాయకుడిని. పంట ధరలు, ఆర్డర్లు, లేదా వ్యవసాయ సలహాల గురించి నన్ను అడగండి.'
        : 'Hello! I am your FarmConnect AI Assistant. How can I assist you with crop prices, orders, or agricultural advice today?',
      action: null,
      suggestedFollowUps: isTelugu
        ? ['టమాటా ధర ఎంత?', 'నేటి మార్కెట్ ధరలు']
        : ["What is today's tomato price?", 'Show market prices'],
    };
  }

  if (/how are you|బాగున్నారా|ఎలా ఉన్నారు/.test(q)) {
    return {
      reply: isTelugu
        ? 'నేను చాలా బాగున్నాను! రైతులకు, కొనుగోలుదారులకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను. మీకు ఏ సమాచారం కావాలి?'
        : "I am doing great, thank you! Ready to help you connect with fresh harvests and market insights. How can I help?",
      action: null,
      suggestedFollowUps: isTelugu ? ['నా ఆర్డర్లు', 'పంట ధరలు'] : ['My orders', 'Market prices'],
    };
  }

  // 2. Specific Crop Prices
  if (q.includes('టమాటా') || q.includes('tomato')) {
    return {
      reply: isTelugu
        ? 'నేటి గుంటూరు APMC మార్కెట్ లో టమాటా సగటు ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). నేరుగా రైతుల వద్ద ₹34/కిలో అందుబాటులో ఉంది.'
        : "Today's average modal tomato mandi price in Guntur APMC is ₹3,400/Quintal (~₹34/kg). Direct farm stock is available from ₹34/kg.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' },
      suggestedFollowUps: isTelugu
        ? ['ఉల్లిపాయ ధర చెప్పు', 'లైవ్ మార్కెట్ పేజీ']
        : ['Check Onion rates', 'View Market Dashboard'],
    };
  }

  if (q.includes('ఉల్లి') || q.includes('onion')) {
    return {
      reply: isTelugu
        ? 'కర్నూలు APMC మార్కెట్‌లో ఉల్లిపాయల సగటు ధర క్వింటాలుకు ₹2,800 (కిలోకు ₹28). తాజా స్టాక్ రైతు మార్కెట్‌లో ఉంది.'
        : "Kurnool mandi average onion price is ₹2,800/Quintal (~₹28/kg). Fresh direct harvests are listed in the marketplace.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Onion' },
      suggestedFollowUps: isTelugu ? ['టమాటా ధర ఎంత?', 'బంగాళాదుంప ధర'] : ['Tomato price', 'Potato price'],
    };
  }

  if (q.includes('బంగాళాదుంప') || q.includes('potato') || q.includes('ఆలుగడ్డ')) {
    return {
      reply: isTelugu
        ? 'బంగాళాదుంప సగటు హోల్‌సేల్ ధర క్వింటాలుకు ₹2,600 (కిలోకు ₹26). తాజా దేశవాళీ బంగాళాదుంపలు రైతు వద్ద అందుబాటులో ఉన్నాయి.'
        : "Potato wholesale price is ₹2,600/Quintal (~₹26/kg). Farm-fresh potatoes are available in the marketplace.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Potato' },
      suggestedFollowUps: isTelugu ? ['మార్కెట్ ధరలు', 'నా ఆర్డర్లు'] : ['Live Market Prices', 'My Orders'],
    };
  }

  if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
    return {
      reply: isTelugu
        ? 'గుంటూరు తేజ సన్-డ్రైడ్ ఎర్ర మిరపకాయ నేడు ₹19,200/క్వింటల్. నాణ్యమైన తేజ మిరపకాయ రైతుల వద్ద ₹185/కిలో లభిస్తుంది.'
        : 'Guntur Teja sun-dried chillies modal price reached ₹19,200/Quintal. Direct verified farmer stock is ₹185/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' },
      suggestedFollowUps: isTelugu
        ? ['మిరప పంట కొనుగోలు', 'మండీ ధరలు']
        : ['Buy Teja Chilli', 'Check Mandi Rates'],
    };
  }

  if (q.includes('బియ్యం') || q.includes('rice') || q.includes('వరి') || q.includes('paddy')) {
    return {
      reply: isTelugu
        ? '12 నెలల గోదావరి సోనా మసూరి పాత బియ్యం రైతు వద్ద నేరుగా ₹58/కిలో లభిస్తుంది. ధాన్యం MSP క్వింటాలుకు ₹2,320.'
        : 'Aged Godavari Sona Masoori raw rice is available directly from local farmers at ₹58/kg. Paddy MSP is ₹2,320/Quintal.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'rice' },
      suggestedFollowUps: isTelugu
        ? ['రైతుల ఉత్పత్తులు', 'కార్ట్‌కు జోడించు']
        : ['Explore Rice Products', 'View Marketplace'],
    };
  }

  if (q.includes('అరటి') || q.includes('banana')) {
    return {
      reply: isTelugu
        ? 'తాజా గోదావరి కర్పూర అరటిపండ్లు డజనుకు ₹45 మరియు టన్నుకు ₹18,000 వద్ద నేరుగా రైతు తోట నుండి అందుబాటులో ఉన్నాయి.'
        : 'Fresh Godavari Karpura bananas are available directly from farm orchards at ₹45/dozen.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'banana' },
      suggestedFollowUps: isTelugu ? ['మార్కెట్ ధరలు', 'ఆర్డర్లు'] : ['Check Rates', 'My Orders'],
    };
  }

  if (q.includes('వేరుశనగ') || q.includes('groundnut') || q.includes('peanut')) {
    return {
      reply: isTelugu
        ? 'అనంతపురం నాణ్యమైన వేరుశనగ క్వింటాలుకు ₹6,800 (కిలోకు ₹68). నూనె శాతం అధికంగా ఉన్న విత్తనాలు అందుబాటులో ఉన్నాయి.'
        : 'Anantapur oil-rich groundnuts are trading at ₹6,800/Quintal (~₹68/kg) directly from certified farmers.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'groundnut' },
      suggestedFollowUps: isTelugu ? ['మార్కెట్ ధరలు', 'కొనుగోలు చేయి'] : ['Market Rates', 'Explore listings'],
    };
  }

  // 3. Platform actions
  if (
    q.includes('కొత్త పంట') ||
    q.includes('add product') ||
    q.includes('జోడించు') ||
    q.includes('అప్లోడ్') ||
    q.includes('upload')
  ) {
    return {
      reply: isTelugu
        ? 'కొత్త వ్యవసాయ ఉత్పత్తి జాబితా ఫారమ్‌ను తెరుస్తున్నాను. కింద ఇచ్చిన బటన్ నొక్కి వివరాలు నమోదు చేయండి.'
        : 'Opening the new crop listing form for you. Tap the button below to publish your harvest.',
      action: { type: 'NAVIGATE_ADD_PRODUCT', param: null },
      suggestedFollowUps: isTelugu
        ? ['నా లైవ్ జాబితాలు', 'మార్కెట్ ధరలు']
        : ['My live listings', 'Check market rates'],
    };
  }

  if (q.includes('ఆర్డర్') || q.includes('order') || q.includes('ట్రాక్') || q.includes('track')) {
    return {
      reply: isTelugu
        ? 'మీ ప్రస్తుత ఆర్డర్లు మరియు డెలివరీ స్థితిని తెరవడానికి కింద బటన్ నొక్కండి.'
        : 'Displaying your farm orders and live delivery tracking timeline. Tap below to view.',
      action: { type: 'NAVIGATE_ORDERS', param: null },
      suggestedFollowUps: isTelugu
        ? ['రైతుతో మాట్లాడండి', 'ఇతర పంటలు']
        : ['Contact Farmer', 'Explore fresh crops'],
    };
  }

  if (
    q.includes('అమ్మకాల') ||
    q.includes('sales') ||
    q.includes('ఆదాయం') ||
    q.includes('earnings')
  ) {
    return {
      reply: isTelugu
        ? 'మీ వ్యవసాయ అమ్మకాల నివేదిక మరియు ఆదాయ వివరాలను తెరుస్తున్నాను.'
        : 'Opening your farm sales analytics report and monthly revenue dashboard.',
      action: { type: 'NAVIGATE_FARMER_SALES', param: null },
      suggestedFollowUps: isTelugu
        ? ['పెండింగ్ ఆర్డర్లు', 'స్టాక్ అప్‌డేట్']
        : ['Pending orders', 'Update crop stock'],
    };
  }

  if (q.includes('ధర') || q.includes('price') || q.includes('మార్కెట్') || q.includes('market') || q.includes('mandi')) {
    return {
      reply: isTelugu
        ? 'ఆంధ్రప్రదేశ్ మరియు తెలంగాణ APMC మండీల లైవ్ వ్యవసాయ ధరలను చూడడానికి కింద బటన్ నొక్కండి.'
        : 'Opening live APMC Mandi rates across Andhra Pradesh and Telangana. Tap below to view all crops.',
      action: { type: 'NAVIGATE_MARKET_PRICES', param: null },
      suggestedFollowUps: isTelugu
        ? ['టమాటా ధర ఎంత?', 'మిరప ధర ఎంత?']
        : ['Tomato price?', 'Chilli price?'],
    };
  }

  // 4. Default helpful ChatGPT-like fallback
  return {
    reply: isTelugu
      ? `మీరు అడిగిన "${message}" గురించి అర్థం చేసుకున్నాను. వ్యవసాయ ఉత్పత్తులు, మండీ ధరలు మరియు ఆర్డర్ వివరాల కోసం నేను మీకు సహాయం చేయగలను.`
      : `I understood your query about "${message}". I can help with crop prices, organic farming tips, order tracking, and connecting directly with farmers.`,
    action: { type: 'NAVIGATE_MARKETPLACE', param: message },
    suggestedFollowUps: isTelugu
      ? ['నేటి మండీ ధరలు', 'తాజా పంటలు చూపించు']
      : ["Today's Mandi Prices", 'Explore fresh harvests'],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, language = 'en', userRole = 'customer', history = [] } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(message);

    if (!aiClient) {
      const fallback = getSmartAgriculturalResponse(message, isTelugu, userRole);
      return res.status(200).json(fallback);
    }

    try {
      // Build conversation history context
      const historyText =
        Array.isArray(history) && history.length > 0
          ? '\nPrevious conversation context:\n' +
            history
              .slice(-6)
              .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
              .join('\n')
          : '';

      const systemPrompt = `You are FarmConnect AI, a knowledgeable, friendly, conversational agricultural assistant (like a specialized mini ChatGPT for farming and fresh produce in Telugu & English).
User Role: ${userRole}.
Requested Language: ${isTelugu ? 'Telugu (తెలుగు)' : 'English'}.
${historyText}

Platform Context:
- Current crops & prices: Tomato (టమాటా - ₹34/kg), Rice (సోనా మసూరి - ₹58/kg), Chilli (గుంటూరు తేజ - ₹185/kg), Onion (ఉల్లిపాయలు - ₹28/kg), Potato (బంగాళాదుంపలు - ₹26/kg), Banana (అరటి - ₹45/kg), Groundnut (వేరుశనగ - ₹68/kg), Jaggery (బెల్లం - ₹75/kg).
- User query: "${message}"

Instructions:
1. Respond warmly, naturally, and concisely (2 to 4 sentences max so audio speech readout sounds crisp and smooth).
2. Answer greetings, general chit-chat, crop diseases, fertilizers, weather, market trends, or platform guidance intelligently like ChatGPT.
3. If user wants to see prices, browse crops, add product, or track orders, specify appropriate action:
   - NAVIGATE_MARKET_PRICES (for market rates)
   - NAVIGATE_MARKETPLACE (for buying or searching crops)
   - NAVIGATE_ADD_PRODUCT (for listing crops)
   - NAVIGATE_ORDERS (for tracking orders)
   - NAVIGATE_FARMER_SALES (for farmer revenue/sales)
4. Provide 2 natural follow-up prompt suggestions in ${isTelugu ? 'Telugu' : 'English'}.

Return ONLY valid JSON (no markdown fences, no code blocks):
{
  "reply": "string",
  "action": { "type": "string or null", "param": "string or null" },
  "suggestedFollowUps": ["string", "string"]
}`;

      // Try gemini-2.5-flash first, fallback to gemini-1.5-flash
      let response;
      try {
        response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      } catch (firstErr) {
        console.warn('gemini-2.5-flash error, falling back to gemini-1.5-flash:', firstErr?.message);
        response = await aiClient.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
      }

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      return res.status(200).json(parsedData);
    } catch (apiError) {
      console.warn('Gemini generateContent timed out or errored, using smart fallback:', apiError);
      const fallback = getSmartAgriculturalResponse(message, isTelugu, userRole);
      return res.status(200).json(fallback);
    }
  } catch (error) {
    console.error('Error in /api/assistant:', error);
    const isTelugu = req.body?.language === 'te';
    return res
      .status(200)
      .json(
        getSmartAgriculturalResponse(req.body?.message || '', isTelugu, req.body?.userRole || 'customer')
      );
  }
}

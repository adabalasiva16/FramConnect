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
  const q = (message || '').toLowerCase();

  if (
    q.includes('టమాటా') ||
    q.includes('tomato') ||
    q.includes('ధర') ||
    q.includes('price') ||
    q.includes('mandi') ||
    q.includes('మార్కెట్')
  ) {
    return {
      reply: isTelugu
        ? 'నేటి గుంటూరు APMC మార్కెట్ లో టమాటా సగటు ధర క్వింటాలుకు ₹3,400 (కిలోకు సుమారు ₹34). నేరుగా రైతుల నుండి ₹34/కిలో అందుబాటులో ఉంది.'
        : "Today's average modal tomato mandi price in Guntur APMC is ₹3,400/Quintal (~₹34/kg). Direct farm listings are available from ₹34/kg.",
      action: { type: 'NAVIGATE_MARKET_PRICES', param: 'Tomato' },
      suggestedFollowUps: isTelugu
        ? ['ఉల్లిపాయ ధర చెప్పు', 'తాజా పంటలు చూపించు']
        : ['Check Onion rates', 'Explore direct harvests'],
    };
  }

  if (
    q.includes('కొత్త పంట') ||
    q.includes('add product') ||
    q.includes('జోడించు') ||
    q.includes('అప్లోడ్') ||
    q.includes('upload')
  ) {
    return {
      reply: isTelugu
        ? 'కొత్త వ్యవసాయ ఉత్పత్తి జాబితా ఫారమ్ తెరుస్తున్నాను. పంట రకం, కిలో ధర మరియు కోత తేదీ నమోదు చేయండి.'
        : 'Opening the new crop listing form for you. Fill in crop variety, per kg price, and harvest date.',
      action: { type: 'NAVIGATE_ADD_PRODUCT', param: null },
      suggestedFollowUps: isTelugu
        ? ['నా లైవ్ జాబితాలు', 'మార్కెట్ ధరలు చూపించు']
        : ['My live listings', 'Check market rates'],
    };
  }

  if (
    q.includes('ఆర్డర్') ||
    q.includes('order') ||
    q.includes('ట్రాక్') ||
    q.includes('track')
  ) {
    return {
      reply: isTelugu
        ? 'మీ ప్రస్తుత ఆర్డర్లు మరియు డెలివరీ ట్రాకింగ్ వివరాలు చూపిస్తున్నాను.'
        : 'Displaying your current farm orders and live delivery tracking timeline.',
      action: { type: 'NAVIGATE_ORDERS', param: null },
      suggestedFollowUps: isTelugu
        ? ['రైతుతో మాట్లాడు', 'స్టాక్ అప్‌డేట్ చేయి']
        : ['Chat with farmer', 'Update stock'],
    };
  }

  if (q.includes('బియ్యం') || q.includes('rice') || q.includes('paddy')) {
    return {
      reply: isTelugu
        ? '12 నెలల వయసు గల గోదావరి సోనా మసూరి బియ్యం రైతు రామయ్య నుండి నేరుగా ₹58/కిలో కు అందుబాటులో ఉంది.'
        : 'Aged 12-month single-origin Godavari Sona Masoori raw rice is available directly from farmer Ramanaiah at ₹58/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'rice' },
      suggestedFollowUps: isTelugu
        ? ['రైతు ప్రొఫైల్', 'కార్ట్‌కు జోడించు']
        : ['Farmer profile', 'Add to Cart'],
    };
  }

  if (q.includes('మిరప') || q.includes('chilli') || q.includes('తేజ')) {
    return {
      reply: isTelugu
        ? 'గుంటూరు తేజ సన్-డ్రైడ్ ఎర్ర మిరపకాయ నేడు ₹19,200/క్వింటల్ (+3.8%). నేరుగా రైతు స్టాక్ ₹185/కిలో అందుబాటులో ఉంది.'
        : 'Guntur Teja sun-dried chillies modal price reached ₹19,200/Quintal (+3.8% today). Direct farm stock is ₹185/kg.',
      action: { type: 'NAVIGATE_MARKETPLACE', param: 'chilli' },
      suggestedFollowUps: isTelugu
        ? ['మండీ ధర చూపించు', 'నేరుగా కొనుగోలు']
        : ['Check Mandi Yard', 'Buy Direct'],
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
        ? 'మీ వ్యవసాయ అమ్మకాల అనలిటిక్స్ మరియు నెలవారీ ఆదాయ వివరాలు తెరుస్తున్నాను.'
        : 'Opening your farm sales analytics report and monthly revenue breakdown.',
      action: { type: 'NAVIGATE_FARMER_SALES', param: null },
      suggestedFollowUps: isTelugu
        ? ['పెండింగ్ ఆర్డర్లు', 'స్టాక్ అప్‌డేట్']
        : ['Pending orders', 'Update stock'],
    };
  }

  return {
    reply: isTelugu
      ? `నమస్కారం! FarmConnect AI సహాయకుడికి స్వాగతం. మీరు అడిగిన "${message}" కోసం మార్కెట్‌లో వెతుకుతున్నాను.`
      : `Hello! Welcome to FarmConnect Assistant. You asked: "${message}". Opening fresh harvests matching your query.`,
    action: { type: 'NAVIGATE_MARKETPLACE', param: message },
    suggestedFollowUps: isTelugu
      ? ['నేటి మండీ ధరలు', 'తాజా పంటలు చూపించు']
      : ["Today's Mandi Prices", 'Explore fresh produce'],
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
      // Build conversation history context string
      const historyText =
        Array.isArray(history) && history.length > 0
          ? '\nRecent conversation:\n' +
            history
              .slice(-6)
              .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
              .join('\n')
          : '';

      const systemPrompt = `You are the bilingual AI Assistant for "FarmConnect" (ఫార్మ్‌కనెక్ట్), an agricultural marketplace connecting farmers directly to consumers in Andhra Pradesh & Telangana.
User Role: ${userRole}.
Requested Language: ${isTelugu ? 'Telugu (తెలుగు)' : 'English'}.
${historyText}

Context available in app:
- Current crops: Tomato (టమాటా - ₹34/kg), Rice (గోదావరి బియ్యం - ₹58/kg), Chilli (గుంటూరు తేజ - ₹185/kg), Onion (ఉల్లిపాయ - ₹28/kg), Potato (బంగాళాదుంప - ₹26/kg), Banana (అరటిపండ్లు - ₹45/kg), Groundnut (వేరుశనగ - ₹68/kg), Jaggery (బెల్లం - ₹75/kg).
- Current user query: "${message}"

Instructions:
1. Provide a warm, concise, helpful answer in ${isTelugu ? 'simple, natural Telugu' : 'clear English'}.
2. Reference previous conversation context if relevant.
3. Set action if user wants to navigate:
   - NAVIGATE_MARKET_PRICES (for price queries)
   - NAVIGATE_MARKETPLACE (for product/crop searches)
   - NAVIGATE_ADD_PRODUCT (for adding/uploading products)
   - NAVIGATE_ORDERS (for order tracking)
   - NAVIGATE_FARMER_SALES (for sales analytics)
4. Suggest 2 helpful follow-up questions.

Return ONLY valid JSON (no markdown):
{
  "reply": "string",
  "action": { "type": "string or null", "param": "string or null" },
  "suggestedFollowUps": ["string", "string"]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);
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

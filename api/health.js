export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    app: 'FarmConnect',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
}

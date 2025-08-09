const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// 環境變數
const GAS_URL = process.env.GAS_URL; // 必填：你的 GAS /exec URL
const ORIGIN_WHITELIST = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// CORS 白名單 + 憑證
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // LIFF/本機工具可能無 Origin
    const allowed = ORIGIN_WHITELIST.includes(origin);
    callback(allowed ? null : new Error(`Origin not allowed: ${origin}`), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: 'text/plain', limit: '1mb' }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 轉發 LIFF 問卷
app.post('/liff/survey', async (req, res) => {
  try {
    if (!GAS_URL) {
      return res.status(500).json({ success: false, error: 'Missing GAS_URL env' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const resp = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch (_) {
      return res.status(502).json({ success: false, error: `Upstream non-JSON: ${text.slice(0, 200)}` });
    }

    return res.status(resp.status).json(json);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
}); 
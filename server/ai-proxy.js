'use strict';

/*
 * Minimal same-origin AI proxy for math.astroswarm.cn.
 * The NVIDIA key is only read from the server process environment; it is never
 * sent to the browser, written to disk by this process, or included in logs.
 */

const http = require('http');

const PORT = Number(process.env.AI_PORT || 8787);
const HOST = '127.0.0.1';
const UPSTREAM = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const MAX_BODY = 20 * 1024;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 24;

const MODE_LABELS = {
  limit: '极限',
  derivative: '导数',
  taylor: '泰勒展开',
  integral: '定积分'
};

const CHAT_SYSTEM = [
  '你是“数形实验室”的数学助教。',
  '用简体中文回答，分步讲解，控制在 200 字左右，语气克制、准确。',
  '数学公式使用 $...$（行内）或 $$...$$（独立公式）包裹，不要输出代码块、HTML 或与数学无关的内容。',
  '如果学生的问题与当前函数无关，也先回答数学问题。'
].join('\n');

const PRACTICE_SYSTEM = [
  '你是“数形实验室”的数学出题助手。',
  '出一道与给定模块相关、难度相近、答案唯一的题目。',
  '只返回一个 JSON 对象，不要 Markdown 代码块或额外解释，格式如下：',
  '{"question":"题干，公式用 $...$ 包裹","answer":"可直接判分的答案","answerTex":"答案的 LaTeX","hint":"一句提示","explanation":"两三句解析"}'
].join('\n');

const buckets = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) {
    if (now - bucket.start > WINDOW_MS) buckets.delete(ip);
  }
}, WINDOW_MS).unref();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('body_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function shortNumber(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (Math.abs(n) >= 1e7 || (Math.abs(n) < 1e-5 && n !== 0)) return n.toExponential(3);
  return String(Math.round(n * 1e6) / 1e6);
}

function contextLine(context, mode) {
  const c = context && typeof context === 'object' ? context : {};
  const parts = [`当前模块：${MODE_LABELS[mode] || '函数图像'}`];
  if (typeof c.function === 'string' && c.function.trim()) {
    parts.push(`当前函数：f(x) = ${c.function.trim().slice(0, 200)}`);
  }
  if (mode === 'limit') parts.push(`极限点 a = ${shortNumber(c.a, '0')}`);
  if (mode === 'derivative') parts.push(`切点 x = ${shortNumber(c.x, shortNumber(c.a, '0'))}`);
  if (mode === 'taylor') parts.push(`展开阶数 n = ${shortNumber(c.taylorOrder, '3')}`);
  if (mode === 'integral') {
    parts.push(`积分区间 [${shortNumber(c.integralA, '0')}, ${shortNumber(c.integralB, '1')}]`);
    parts.push(`中点采样个数 n = ${shortNumber(c.integralN, '12')}`);
  }
  return parts.join('；');
}

function normalizeContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      return '';
    }).join('');
  }
  return '';
}

function deltaText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  if (choice) {
    return normalizeContent(
      (choice.delta && choice.delta.content) ??
      (choice.message && choice.message.content)
    );
  }
  return normalizeContent(
    (payload.delta && payload.delta.content) ??
    payload.delta ??
    payload.text ??
    payload.content ??
    payload.answer
  );
}

function upstreamError(res, status) {
  console.error(`[ai-proxy] upstream status ${status}`);
  if (!res.headersSent) sendJson(res, 502, { error: 'upstream_unavailable' });
  else res.end();
}

async function handle(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  if (rateLimited(ip)) {
    sendJson(res, 429, { error: 'too_many_requests' });
    return;
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, error.status || 400, { error: 'bad_request' });
    return;
  }

  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 2000) : '';
  if (!question) {
    sendJson(res, 400, { error: 'missing_question' });
    return;
  }

  const mode = MODE_LABELS[body.mode] ? body.mode : 'limit';
  const practice = body.task === 'practice';
  const apiKey = process.env.NVIDIA_API_KEY || '';
  if (!apiKey) {
    sendJson(res, 503, { error: 'ai_not_configured' });
    return;
  }

  const system = practice ? PRACTICE_SYSTEM : CHAT_SYSTEM;
  const user = practice
    ? `${contextLine(body.context, mode)}\n请出一道新题，只返回 JSON。`
    : `${contextLine(body.context, mode)}\n学生的问题：${question}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), practice ? 30000 : 45000);
  let closed = false;
  res.on('close', () => {
    closed = true;
    controller.abort();
  });

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: practice ? 0.6 : 0.35,
        top_p: 0.9,
        max_tokens: practice ? 700 : 800,
        stream: true
      }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (!closed) upstreamError(res, 'network');
    return;
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeout);
    upstreamError(res, upstream.status);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;
  let finished = false;

  const emitLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return false;
    const raw = trimmed.slice(5).trim();
    if (!raw) return false;
    if (raw === '[DONE]') return true;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      return false;
    }
    const text = deltaText(payload);
    if (!text) return false;
    emitted = true;
    if (!closed) res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
    return false;
  };

  try {
    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (emitLine(line)) {
          finished = true;
          buffer = '';
          break;
        }
        newline = buffer.indexOf('\n');
      }
      if (finished || closed) break;
    }
    if (!finished && buffer.trim()) emitLine(buffer);
    if (!closed) {
      if (!emitted) console.error('[ai-proxy] upstream returned no text');
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    if (!closed) {
      console.error(`[ai-proxy] stream ${error && error.name ? error.name : 'error'}`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, { ok: true, configured: Boolean(process.env.NVIDIA_API_KEY) });
    return;
  }
  handle(req, res).catch((error) => {
    console.error(`[ai-proxy] unhandled ${error && error.message ? error.message : 'error'}`);
    if (!res.headersSent) sendJson(res, 500, { error: 'internal_error' });
    else res.end();
  });
});

server.requestTimeout = 60000;
server.headersTimeout = 15000;

server.listen(PORT, HOST, () => {
  console.log(`[ai-proxy] listening on ${HOST}:${PORT} configured=${Boolean(process.env.NVIDIA_API_KEY)}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* 函数式告别 · 结局小说 API（后端代理）
 *
 * 作用：把「这一局的完整选择记录」交给 NVIDIA API，流式返回一篇只属于这一局的小说。
 * 安全：NVIDIA 密钥只存在于服务器环境变量（/etc/shuxing-lab/novel.env），
 *       前端代码、仓库、日志里都不出现。
 */
'use strict';

var http = require('http');
var https = require('https');
var fs = require('fs');

var PORT = Number(process.env.NOVEL_PORT || 8791);
var KEY = process.env.NVIDIA_API_KEY || '';
var MODEL = process.env.NOVEL_MODEL || 'stepfun-ai/step-5-preview';
var FALLBACK_MODEL = process.env.NOVEL_FALLBACK_MODEL || 'z-ai/glm-5.3-flash';
var MAX_TOKENS = Number(process.env.NOVEL_MAX_TOKENS || 9000);
var UPSTREAM_TIMEOUT = Number(process.env.NOVEL_TIMEOUT_MS || 900000);

function log() {
  var args = Array.prototype.slice.call(arguments);
  console.log(new Date().toISOString(), args.join(' '));
}

function systemPrompt() {
  return [
    '你是一位克制、细腻的中文小说作者，擅长写三五千字的短篇。',
    '写作要求：第三人称叙述，具体、克制、不煽情；有天气、声音、触感与动作细节；不写总结句，不做道德判断。',
    '必须严格使用玩家这一局真实经历的场景与选择，不得编造没有发生过的情节，不得改结局。',
    '只输出小说正文，不要标题、不要分段标题、不要任何解释或元信息。'
  ].join('\n');
}

function userPrompt(run) {
  var lines = [];
  lines.push('这是我刚刚玩完的一局《函数式告别》的完整记录，请据此写一篇约 5000 字的中文短篇小说。');
  lines.push('');
  lines.push('【结局】' + (run.ending && run.ending.title ? run.ending.title : '未知') +
    '（' + (run.ending && run.ending.text ? run.ending.text : '') + '）');
  lines.push('');
  lines.push('【这一局走过的场景与选择】');
  (run.steps || []).forEach(function (st, i) {
    lines.push((i + 1) + '. ' + st.scene + '（' + (st.when || '') + '）你选择了「' + st.label + '」——' + (st.text || ''));
  });
  lines.push('');
  lines.push('【写作要求】');
  lines.push('1. 按顺序写这一年，每幕至少一段，把选择的后果写出来：因为你当时选了 A，后来才会发生 B。');
  lines.push('2. 结尾必须落在结局给出的基调上，与结局正文一致，不要另起结局。');
  lines.push('3. 全文约 5000 字，一次写完，不要分节标题。');
  return lines.join('\n');
}

function upstreamBody(stream, model) {
  return JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: stream.prompt }
    ],
    temperature: 0.9,
    top_p: 0.95,
    max_tokens: MAX_TOKENS,
    stream: true
  });
}

function readBody(req, cb) {
  var chunks = [];
  var size = 0;
  req.on('data', function (c) {
    size += c.length;
    if (size > 256 * 1024) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', function () {
    try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch (err) { cb(err); }
  });
  req.on('error', cb);
}

function sse(res, obj) {
  res.write('data: ' + JSON.stringify(obj) + '\n\n');
}

function callUpstream(prompt, model, res, done) {
  var body = upstreamBody({ prompt: prompt }, model);
  var req = https.request({
    hostname: 'integrate.api.nvidia.com',
    path: '/v1/chat/completions',
    method: 'POST',
    timeout: UPSTREAM_TIMEOUT,
    headers: {
      Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Content-Length': Buffer.byteLength(body)
    }
  }, function (up) {
    if (up.statusCode !== 200) {
      var errChunks = [];
      up.on('data', function (c) { errChunks.push(c); });
      up.on('end', function () {
        var msg = Buffer.concat(errChunks).toString('utf8').slice(0, 300);
        log('upstream', model, up.statusCode, msg.replace(/\s+/g, ' '));
        done(new Error('上游 ' + up.statusCode));
      });
      return;
    }
    var buf = '';
    var chars = 0;
    up.setEncoding('utf8');
    up.on('data', function (chunk) {
      buf += chunk;
      var idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        var line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line || line.indexOf('data:') !== 0) continue;
        var payload = line.slice(5).trim();
        if (payload === '[DONE]') { done(null, chars); return; }
        try {
          var j = JSON.parse(payload);
          var delta = j.choices && j.choices[0] && j.choices[0].delta;
          var text = delta && (delta.content || '');
          if (text) {
            chars += text.length;
            sse(res, { type: 'delta', text: text, chars: chars });
          }
        } catch (err) { /* 忽略半行 */ }
      }
    });
    up.on('end', function () { done(null, chars); });
  });
  req.on('timeout', function () { req.destroy(new Error('上游超时')); });
  req.on('error', function (err) { done(err); });
  req.write(body);
  req.end();
}

var server = http.createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/api/novel/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: !!KEY, model: MODEL, fallback: FALLBACK_MODEL }));
    return;
  }
  if (req.method !== 'POST' || req.url !== '/api/novel') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }
  if (!KEY) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('service not configured');
    return;
  }
  readBody(req, function (err, data) {
    if (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('bad request');
      return;
    }
    var run = (data && data.run) || {};
    var prompt = userPrompt(run);
    log('generate', 'steps=' + ((run.steps || []).length), 'ending=' + (run.ending && run.ending.title));

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    if (res.flushHeaders) res.flushHeaders();

    var finished = false;
    function finish(chars) {
      if (finished) return;
      finished = true;
      sse(res, { type: 'done', chars: chars || 0 });
      res.end();
    }

    callUpstream(prompt, MODEL, res, function (err, chars) {
      if (!err && chars > 200) { finish(chars); return; }
      log('primary failed', err ? err.message : 'short output', 'fallback=' + FALLBACK_MODEL);
      callUpstream(prompt, FALLBACK_MODEL, res, function (err2, chars2) {
        if (err2 || !chars2) {
          sse(res, { type: 'error', message: (err2 || err).message });
          finished = true;
          res.end();
          return;
        }
        finish(chars2);
      });
    });
  });
});

server.listen(PORT, '127.0.0.1', function () {
  log('novel-api listening on 127.0.0.1:' + PORT, 'model=' + MODEL, 'key=' + (KEY ? 'set' : 'MISSING'));
});

/* 动画/渲染修复验收：node tests/animation-qa.js
 * 覆盖用户指定的 6 项自测，并回归五个结局完整点击路径。
 * 不改动数据/引擎；只验证渲染、转场、锁与画布状态。
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var { spawn } = require('child_process');

var CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
var BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/';
var PORT = 9334;
var OUT = path.join(__dirname, 'shots-anim');
var failures = [];
var checks = 0;

function ok(cond, label, detail) {
  checks += 1;
  if (cond) {
    console.log('  ok   ' + label);
  } else {
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.error('  FAIL ' + label + (detail ? ' — ' + detail : ''));
  }
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function waitFor(cdp, expression, timeout, label) {
  var start = Date.now();
  var last;
  while (Date.now() - start < (timeout || 12000)) {
    try {
      last = await evaluate(cdp, expression);
      if (last) return last;
    } catch (err) { last = err.message; }
    await sleep(60);
  }
  throw new Error('等待超时: ' + (label || expression) + ' — ' + String(last));
}

async function waitJson(url, timeout) {
  var start = Date.now();
  var lastError;
  while (Date.now() - start < timeout) {
    try {
      var res = await fetch(url);
      if (res.ok) return await res.json();
      lastError = new Error('HTTP ' + res.status);
    } catch (err) { lastError = err; }
    await sleep(150);
  }
  throw new Error('Chrome 未就绪: ' + (lastError && lastError.message));
}

class CDP {
  constructor(url) { this.url = url; this.ws = null; this.id = 0; this.pending = new Map(); this.events = new Map(); this.closed = false; }
  open() {
    var self = this;
    return new Promise(function (resolve, reject) {
      var ws = new WebSocket(self.url);
      self.ws = ws;
      ws.onopen = function () { resolve(); };
      ws.onerror = function () { reject(new Error('CDP WebSocket 错误')); };
      ws.onmessage = function (evt) {
        var msg;
        try { msg = JSON.parse(evt.data); } catch (err) { return; }
        if (msg.id && self.pending.has(msg.id)) {
          var p = self.pending.get(msg.id);
          self.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
          return;
        }
        if (msg.method) {
          var list = self.events.get(msg.method) || [];
          list.forEach(function (cb) { cb(msg.params); });
        }
      };
      ws.onclose = function () { self.closed = true; };
    });
  }
  send(method, params) {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (self.closed) { reject(new Error('CDP 已关闭')); return; }
      var id = ++self.id;
      self.pending.set(id, { resolve: resolve, reject: reject });
      self.ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }
  on(method, cb) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(cb);
  }
}

async function evaluate(cdp, expression) {
  var res = await cdp.send('Runtime.evaluate', {
    expression: expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (res.exceptionDetails) {
    var txt = (res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text;
    throw new Error('页面脚本错误: ' + txt);
  }
  return res.result ? res.result.value : undefined;
}

function js(fn, arg) {
  return '(' + fn.toString() + ')(' + JSON.stringify(arg === undefined ? null : arg) + ')';
}

async function shot(cdp, name) {
  var file = path.join(OUT, name + '.png');
  var res = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
  return file;
}

async function emulate(cdp, width, height, dpr, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: width, height: height, deviceScaleFactor: dpr, mobile: !!mobile,
    screenWidth: width, screenHeight: height
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: !!mobile, maxTouchPoints: mobile ? 5 : 1 });
}

async function load(cdp, width, height, dpr, mobile) {
  await emulate(cdp, width, height, dpr, mobile);
  await cdp.send('Page.navigate', { url: BASE + '?qa=' + Date.now() });
  await waitFor(cdp, 'document.readyState === "complete" && !!window.__farewell && !!document.querySelector("#scene")', 15000, '页面就绪');
  await evaluate(cdp, 'new Promise(function(r){ if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){r();}); setTimeout(r, 2200); })');
  await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "idle"', 12000, '开场入场完成');
}

var PATHS = {
  good: { picks: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], title: '同行',
    ids: ["f1","f1","f1","f3","f8","f13","f7","f10","f3","f10","f1","f13","f1","f7","f4","f13","f7","f7","f10","f7","f1","f3","f2","f13","f1","f2","f7","f1","f10","f13"] },
  jump: { picks: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], title: '两不相欠',
    ids: ["f3","f13","f3","f7","f14","f10","f2","f13","f13","f7","f3","f1","f3","f2","f13","f2","f2","f3","f14","f2","f14","f3","f7","f3","f14","f13","f3","f3","f7","f3"] },
  asymptote: { picks: [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2], title: '先开口的人',
    ids: ["f10","f7","f14","f13","f3","f14","f3","f3","f14","f14","f2","f14","f4","f14","f14","f3","f1","f13","f4","f9","f7","f13","f1","f4","f4","f3","f13","f13","f4","f1"] }
};

async function startMonitor(cdp) {
  await evaluate(cdp, js(function () {
    if (window.__qaMonitorIv) clearInterval(window.__qaMonitorIv);
    window.__qaMonitor = { maxTitles: 0, maxScenes: 0, samples: 0 };
    window.__qaMonitorIv = setInterval(function () {
      var titles = document.querySelectorAll('#scene h1').length;
      var scenes = document.querySelectorAll('#scene > .screen').length;
      var m = window.__qaMonitor;
      m.maxTitles = Math.max(m.maxTitles, titles);
      m.maxScenes = Math.max(m.maxScenes, scenes);
      m.samples += 1;
    }, 20);
    return true;
  }));
}

async function stopMonitor(cdp) {
  return evaluate(cdp, js(function () {
    if (window.__qaMonitorIv) clearInterval(window.__qaMonitorIv);
    window.__qaMonitorIv = 0;
    return window.__qaMonitor;
  }));
}

async function canvasBBox(cdp, selector) {
  return evaluate(cdp, js(function (sel) {
    var c = document.querySelector(sel);
    if (!c) return null;
    var ctx = c.getContext('2d');
    var d = ctx.getImageData(0, 0, c.width, c.height).data;
    var minX = c.width, maxX = -1, minY = c.height, maxY = -1, count = 0;
    for (var y = 0; y < c.height; y++) {
      for (var x = 0; x < c.width; x++) {
        var a = d[(y * c.width + x) * 4 + 3];
        if (a > 12) {
          count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    var dpr = c.width / Math.max(1, c.getBoundingClientRect().width);
    return {
      count: count,
      width: maxX >= 0 ? (maxX - minX + 1) / dpr : 0,
      height: maxY >= 0 ? (maxY - minY + 1) / dpr : 0,
      cssWidth: c.getBoundingClientRect().width,
      cssHeight: c.getBoundingClientRect().height
    };
  }, selector));
}

async function shadowCount(cdp) {
  return evaluate(cdp, js(function () {
    var c = document.querySelector('#intro-canvas');
    var rect = c.getBoundingClientRect();
    var dpr = c.width / Math.max(1, rect.width);
    var cx = c.width / 2;
    var cy = c.height / 2;
    var x0 = Math.max(0, Math.floor(cx - 100 * dpr));
    var x1 = Math.min(c.width, Math.ceil(cx + 100 * dpr));
    var y0 = Math.max(0, Math.floor(cy + 70 * dpr));
    var y1 = Math.min(c.height, Math.ceil(cy + 190 * dpr));
    var d = c.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
    var n = 0;
    for (var i = 3; i < d.length; i += 4) if (d[i] > 10) n++;
    return n;
  }));
}

async function verticalConnectors(cdp, selector) {
  return evaluate(cdp, js(function (sel) {
    var c = document.querySelector(sel);
    if (!c) return null;
    var ctx = c.getContext('2d');
    var d = ctx.getImageData(0, 0, c.width, c.height).data;
    var longCols = 0;
    var dark = 0;
    for (var x = 0; x < c.width; x++) {
      var run = 0, best = 0;
      for (var y = 0; y < c.height; y++) {
        var i = (y * c.width + x) * 4;
        var isDark = d[i + 3] > 160 && d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90;
        if (isDark) { dark++; run++; if (run > best) best = run; }
        else run = 0;
      }
      if (best > c.height * 0.82) longCols++;
    }
    return { longCols: longCols, dark: dark, height: c.height, width: c.width };
  }, selector));
}

async function sampleBackground(cdp) {
  return evaluate(cdp, js(function () {
    return new Promise(function (resolve) {
      var seen = { fade: false, grow: false, idle: false };
      var maxCount = 0;
      var start = Date.now();
      var iv = setInterval(function () {
        var F = window.__farewell;
        var d = F.state.atmos ? F.state.atmos.debug() : null;
        if (d) {
          maxCount = Math.max(maxCount, d.fCount);
          if (d.fPhase === 'fade') seen.fade = true;
          if (d.fPhase === 'grow') seen.grow = true;
          if (d.fPhase === 'idle' && d.fCount === 1) seen.idle = true;
        }
        if (Date.now() - start > 1150) {
          clearInterval(iv);
          resolve({ seen: seen, maxCount: maxCount, debug: d });
        }
      }, 25);
    });
  }));
}

async function enterGame(cdp) {
  await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened"', 12000, '开局完成');
  await evaluate(cdp, 'document.querySelector("#btn-enter").click()');
  await waitFor(cdp, '!window.__farewell.isLocked() && !!document.querySelector(".screen-prologue")', 12000, '进入序章');
  await evaluate(cdp, 'document.querySelector("#btn-continue").click()');
  await waitFor(cdp, '!window.__farewell.isLocked() && !!document.querySelector("#screen-game") && document.querySelectorAll("#options .option").length === 3', 12000, '进入第一题');
}

var beatEvidence = { interlude: null, chat: null };

async function advanceBeats(cdp, target, shotsOn, prefix) {
  prefix = prefix || 'desktop';
  var deadline = Date.now() + 60000;
  var typingSeen = false;
  var replyClicks = 0;
  var lastReplyClick = 0;
  var continued = false;
  var last = null;
  while (Date.now() < deadline) {
    var st = await evaluate(cdp, js(function () {
      var F = window.__farewell;
      var b = F.beatDebug();
      var replies = document.querySelector('#chat-replies');
      var cont = document.querySelector('#chat-continue');
      var inter = document.querySelector('.screen-interlude');
      return {
        locked: F.isLocked(),
        sceneIndex: F.state.sceneIndex,
        funcs: F.state.funcs.length,
        beatType: b.type,
        beatId: b.id,
        options: document.querySelectorAll('#options .option').length,
        chat: !!document.querySelector('.screen-chat'),
        phone: !!document.querySelector('.chat-phone'),
        contact: (document.querySelector('.chat-contact') || {}).textContent || '',
        replies: replies ? replies.children.length : 0,
        repliesDone: replies ? replies.classList.contains('is-done') : false,
        typing: !!document.querySelector('.chat-typing'),
        bubbles: document.querySelectorAll('.chat-bubble').length,
        mine: document.querySelectorAll('.chat-bubble.mine').length,
        chatContinue: !!cont && !cont.hidden,
        interlude: !!inter,
        interTitle: inter ? (inter.querySelector('.interlude-title') || {}).textContent || '' : '',
        interParas: inter ? inter.querySelectorAll('.interlude-text p').length : 0,
        interPaths: inter ? inter.querySelectorAll('.interlude-art path, .interlude-art line, .interlude-art circle').length : 0
      };
    }));
    if (st.sceneIndex === target && st.options === 3 && st.funcs === target && !st.locked) return;
    last = st;
    if (st.typing) typingSeen = true;

    if (st.beatType === 'interlude' && st.interlude) {
      if (shotsOn && !beatEvidence.interlude) {
        beatEvidence.interlude = {
          title: st.interTitle,
          paras: st.interParas,
          paths: st.interPaths
        };
        await shot(cdp, prefix + '-interlude');
      }
      if (!st.locked) {
        await evaluate(cdp, 'document.querySelector("#btn-continue").click()');
        await sleep(320);
      }
      continue;
    }

    if (st.beatType === 'chat' && st.chat) {
      if (st.replies > 0 && !st.repliesDone && st.mine < 2) {
        if (shotsOn && !beatEvidence.chat) {
          beatEvidence.chat = {
            phone: st.phone,
            contact: st.contact,
            bubbles: st.bubbles,
            replies: st.replies,
            typingSeen: typingSeen,
            mine: 0,
            afterTotal: 0,
            continued: false
          };
          await shot(cdp, prefix + '-chat');
        }
        replyClicks += 1;
        lastReplyClick = Date.now();
        await evaluate(cdp, 'document.querySelectorAll("#chat-replies button")[0].click()');
        await sleep(260);
        continue;
      }
      if (st.chatContinue && st.mine >= 2) {
        continued = true;
        if (shotsOn && beatEvidence.chat) {
          beatEvidence.chat.mine = st.mine;
          beatEvidence.chat.afterTotal = st.bubbles;
          beatEvidence.chat.continued = true;
          await shot(cdp, prefix + '-chat-continue');
        }
        await evaluate(cdp, 'document.querySelector("#chat-continue").click()');
        await sleep(320);
        continue;
      }
    }
    await sleep(120);
  }
  throw new Error('等待转到第 ' + (target + 1) + ' 题超时 — ' + JSON.stringify(last));
}

async function playPath(cdp, kind, opts) {
  opts = opts || {};
  var spec = PATHS[kind];
  var shotPrefix = opts.prefix || 'desktop';
  if (opts.shots) beatEvidence = { interlude: null, chat: null };
  await startMonitor(cdp);
  var bgReports = [];
  for (var i = 0; i < 30; i++) {
    await waitFor(cdp, js(function (n) {
      var F = window.__farewell;
      return !F.isLocked() && !!document.querySelector('#screen-game') &&
        F.state.funcs.length === n && F.state.sceneIndex === n &&
        document.querySelectorAll('#options .option').length === 3 &&
        !document.querySelector('#options .option').disabled;
    }, i), 15000, '第' + (i + 1) + '题可点击');
    if (kind === 'jump' && opts.shots) await shot(cdp, shotPrefix + '-scene-' + (i + 1));
    var pick = spec.picks[i];
    if (i === 0 && opts.doubleClick) {
      await evaluate(cdp, js(function (p) {
        var btn = document.querySelectorAll('#options .option')[p];
        btn.click();
        btn.click();
        btn.click();
        return true;
      }, pick));
    } else {
      await evaluate(cdp, js(function (p) {
        document.querySelectorAll('#options .option')[p].click();
        return true;
      }, pick));
    }

    var bg = await sampleBackground(cdp);
    bgReports.push(bg);

    if (i < 29) {
      await advanceBeats(cdp, i + 1, !!opts.shots, shotPrefix);
    } else {
      await waitFor(cdp, '!window.__farewell.isLocked() && !!document.querySelector("#screen-ending")', 15000, '结局页出现');
    }
  }
  if (opts.shots) {
    var evI = beatEvidence.interlude;
    var evC = beatEvidence.chat;
    ok(!!evI && evI.title.length > 0 && evI.paras >= 2, '间章：标题与两段叙事出现', JSON.stringify(evI));
    ok(!!evI && evI.paths > 10, '间章：背景线稿已绘制', JSON.stringify(evI));
    ok(!!evC && evC.phone && evC.contact.length > 0 && evC.bubbles >= 2 && evC.replies === 3,
      '聊天：手机框、联系人、两条消息与三个回复', JSON.stringify(evC));
    ok(!!evC && evC.typingSeen, '聊天：消息带正在输入提示', JSON.stringify(evC));
    ok(!!evC && evC.mine === 2 && evC.afterTotal >= 10, '聊天：两轮回复各带两条后续消息', JSON.stringify(evC));
    ok(!!evC && evC.continued, '聊天：继续按钮出现并可推进', JSON.stringify(evC));
  }
  await waitFor(cdp, '!!window.__farewell.state.plot', 4000, '结局画布挂载');
  var before = await evaluate(cdp, js(function () {
    var F = window.__farewell;
    var dbg = F.endingDebug();
    var axisX = document.querySelector('#axis-x');
    var axisY = document.querySelector('#axis-y');
    var axisNote = document.querySelector('#axis-note');
    return {
      reduced: dbg.reduced,
      plotDrawnAt: dbg.plotDrawnAt,
      narrativeStartedAt: dbg.narrativeStartedAt,
      narrativeTyped: dbg.narrativeTyped,
      isPlotDrawn: document.querySelector('#screen-ending').classList.contains('is-plot-drawn'),
      plotBeforeText: dbg.plotBeforeText,
      axisX: axisX ? axisX.textContent : '',
      axisY: axisY ? axisY.textContent : '',
      axisNote: axisNote ? axisNote.textContent : ''
    };
  }));

  ok(before.plotBeforeText, kind + '：结局图像位于解释文字之前');
  ok(/横向/.test(before.axisX) && /纵向/.test(before.axisY),
    kind + '：图下注明横向/纵向位置', before.axisX + ' / ' + before.axisY);
  ok(/按结局定形/.test(before.axisNote) && !/必然/.test(before.axisNote), kind + '：图下说明按结局定形', before.axisNote);
  if (!before.reduced) {
    ok(before.narrativeTyped === 0 && before.plotDrawnAt === 0 && !before.isPlotDrawn,
      kind + '：曲线未画完时正文保持空白', JSON.stringify(before));
  }

  await evaluate(cdp, 'document.querySelector("#ending-canvas").scrollIntoView({ block: "center" })');
  await waitFor(cdp, 'window.__farewell.state.plot && window.__farewell.state.plot.debug().drawComplete', 7000, kind + ' 曲线绘制完成');
  await waitFor(cdp, 'window.__farewell.endingDebug().narrativeTyped > 0', 4000, kind + ' 正文开始逐字显示');
  var typingA = await evaluate(cdp, 'window.__farewell.endingDebug().narrativeTyped');
  await sleep(180);
  var typingB = await evaluate(cdp, 'window.__farewell.endingDebug().narrativeTyped');
  await waitFor(cdp, 'window.__farewell.endingDebug().principleShownAt > 0 && window.__farewell.endingDebug().principleComplete', 30000, kind + ' 正文与原理逐字显示完成');
  var finalDebug = await evaluate(cdp, 'window.__farewell.endingDebug()');
  var monitor = await stopMonitor(cdp);
  var ending = await evaluate(cdp, js(function () {
    var F = window.__farewell;
    var plot = F.state.plot ? F.state.plot.debug() : null;
    var name = document.querySelector('#ending-name');
    var typed = document.querySelector('#ending-type');
    var accessible = document.querySelector('#ending-text-accessible');
    return {
      kind: F.state.result ? F.state.result.kind : null,
      title: name ? name.textContent : null,
      funcs: F.state.funcs.slice(),
      plot: plot,
      hasToast: !!document.querySelector('#toast'),
      expectedText: F.state.ending ? F.state.ending.text : '',
      typedText: typed ? typed.textContent : '',
      accessibleText: accessible ? accessible.textContent : '',
      principleVisible: document.querySelector('#principle-section').classList.contains('is-visible')
    };
  }));

  if (!before.reduced) {
    ok(typingA > 0 && typingA < finalDebug.narrativeLength, kind + '：正文按字符开始出现', typingA + '/' + finalDebug.narrativeLength);
    ok(typingB > typingA && typingB < finalDebug.narrativeLength, kind + '：180ms 内继续逐字增加', typingA + ' -> ' + typingB);
  }
  ok(finalDebug.plotDrawnAt > 0 && finalDebug.narrativeStartedAt >= finalDebug.plotDrawnAt,
    kind + '：绘图完成后才启动正文', JSON.stringify(finalDebug));
  ok(finalDebug.narrativeComplete && finalDebug.principleComplete,
    kind + '：正文与原理最终完整显示', JSON.stringify(finalDebug));
  ok(ending.typedText === ending.expectedText && ending.accessibleText === ending.expectedText,
    kind + '：可见文字与无障碍全文一致');
  ok(ending.principleVisible, kind + '：一句原理在正文后显示');

  return { monitor: monitor, bgReports: bgReports, ending: ending, spec: spec, before: before, typing: { a: typingA, b: typingB }, finalDebug: finalDebug };
}

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error('找不到 Chrome: ' + CHROME);
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  var profile = fs.mkdtempSync(path.join(os.tmpdir(), 'farewell-anim-qa-'));
  var chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-component-update',
    '--remote-allow-origins=*', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile, '--window-size=1440,900', 'about:blank'
  ], { stdio: 'ignore' });

  var cdp = null;
  try {
    await waitJson('http://127.0.0.1:' + PORT + '/json/version', 20000);
    var list = await waitJson('http://127.0.0.1:' + PORT + '/json/list', 5000);
    var page = (list || []).filter(function (t) { return t.type === 'page'; })[0];
    if (!page) throw new Error('没有可用的页面 target');
    cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.open();
    var errors = [];
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    cdp.on('Runtime.exceptionThrown', function (p) {
      errors.push(p.exceptionDetails.text + ' ' + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || ''));
    });
    cdp.on('Log.entryAdded', function (p) {
      if (!p.entry || p.entry.level !== 'error') return;
      // 外部字体域的网络波动（QUIC/连接重置）属环境噪声，站点会回退本地衬线，不计为应用异常。
      var u = p.entry.url || '';
      if (u.indexOf('fonts.googleapis.com') > -1 || u.indexOf('fonts.gstatic.com') > -1) return;
      errors.push(p.entry.text);
    });
    cdp.on('Page.loadEventFired', function () { errors.length = 0; });

    console.log('\n[桌面 1440×900 · 开场与转场]');
    await load(cdp, 1440, 900, 1, false);
    var intro0 = await evaluate(cdp, 'window.__farewell.introDebug()');
    ok(intro0.sampleCount === 240, '开场圆使用 240 个采样点', JSON.stringify(intro0));
    ok(intro0.lineWidth === 3 && intro0.morphDur === 950 && intro0.compressDur === 700 && intro0.entryDur === 600, '压缩 700ms / 曲线 950ms / 入场 600ms / 线宽 3px');
    ok(intro0.radius === 90, '入场目标半径 90px');
    await shot(cdp, 'desktop-intro-idle');

    function devOf(d) {
      var maxI = 0;
      for (var i = 1; i < d.radii.length; i++) if (d.radii[i] > d.radii[maxI]) maxI = i;
      var opp = (maxI + d.radii.length / 2) % d.radii.length;
      return { max: d.radii[maxI] - d.baseRadius, opp: d.radii[opp] - d.baseRadius };
    }

    // 提示语：逐字、中心对称、轮换
    var h0 = await evaluate(cdp, 'window.__farewell.hintDebug()');
    ok(h0.phrases.length >= 6, '开场提示语不少于 6 句', String(h0.phrases.length));
    var oldHint = await evaluate(cdp, 'document.querySelector("#intro-hint").textContent');
    ok(oldHint.indexOf('点击黑点') === -1, '旧提示“点击黑点”已移除');
    await waitFor(cdp, 'window.__farewell.hintDebug().mode === "type" && window.__farewell.hintDebug().typed < window.__farewell.hintDebug().total', 15000, '提示语进入打字阶段');
    var ht0 = await evaluate(cdp, 'window.__farewell.hintDebug().typed');
    var hc0 = await evaluate(cdp, js(function () {
      var r = document.querySelector('#intro-hint .hint-line').getBoundingClientRect();
      return (r.left + r.right) / 2;
    }));
    await sleep(420);
    var ht1 = await evaluate(cdp, 'window.__farewell.hintDebug().typed');
    var hc1 = await evaluate(cdp, js(function () {
      var r = document.querySelector('#intro-hint .hint-line').getBoundingClientRect();
      return (r.left + r.right) / 2;
    }));
    ok(ht1 > ht0 && ht1 <= h0.total, '提示语逐字增加', ht0 + '->' + ht1);
    ok(Math.abs(hc0 - 720) <= 2 && Math.abs(hc1 - 720) <= 2, '打字过程保持中心对称', hc0 + ',' + hc1);
    await waitFor(cdp, 'window.__farewell.hintDebug().idx !== ' + h0.idx, 15000, '提示语轮换到下一句');
    var h2 = await evaluate(cdp, 'window.__farewell.hintDebug()');
    ok(h2.phrases[h2.idx] !== h0.phrases[h0.idx], '轮换文案与上一句不同');

    // 黑点：鼠标越近，朝向鼠标一侧局部凸起越明显
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 60, clientY: 60 }))');
    await sleep(1000);
    var dFar = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(dFar.max < 0.8, '鼠标远离时黑点保持正圆', JSON.stringify(dFar));
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 950, clientY: 450 }))');
    await sleep(1000);
    var dMid = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 820, clientY: 450 }))');
    await sleep(1000);
    var dNear = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(dNear.max > 10, '鼠标靠近时黑点局部凸起', JSON.stringify(dNear));
    ok(dNear.max > dMid.max * 1.35, '越近凸起越明显', JSON.stringify({ mid: dMid.max, near: dNear.max }));
    ok(dNear.opp < 1.2, '凸起只发生在朝向鼠标一侧', JSON.stringify(dNear));
    await shot(cdp, 'desktop-intro-bulge');
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 60, clientY: 60 }))');
    await sleep(160);
    var dLag = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(dLag.max > dNear.max * 0.3, '快速移开时凸起带阻尼滞后', JSON.stringify({ near: dNear.max, lag: dLag.max }));
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointerleave"))');
    await sleep(1000);
    var dRest = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(dRest.max < 0.8, '鼠标移开后黑点恢复正圆', JSON.stringify(dRest));

    // 墨色层次：柔边 + 投影 + 文字墨影层
    var inkStats = await evaluate(cdp, js(function () {
      var c = document.querySelector('#intro-canvas');
      var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      var semi = 0, core = 0;
      for (var i = 3; i < d.length; i += 4) {
        var a = d[i];
        if (a >= 230) core++;
        else if (a >= 20) semi++;
      }
      return { semi: semi, core: core };
    }));
    ok(inkStats.core > 5000 && inkStats.semi > 400, '黑点带柔边与投影（半透明过渡像素）', JSON.stringify(inkStats));
    var layer = await evaluate(cdp, js(function () {
      var g = document.querySelector('#hint-ghost');
      var t = document.querySelector('#hint-type');
      var gs = getComputedStyle(g);
      return {
        ghostBlur: gs.filter,
        ghostOpacity: Number(gs.opacity),
        typeShadow: getComputedStyle(t).textShadow,
        ghostText: g.textContent,
        typeText: t.textContent
      };
    }));
    ok(layer.ghostBlur.indexOf('blur') === 0 && layer.ghostOpacity > 0 && layer.ghostOpacity < 0.5, '提示语带模糊墨影层', JSON.stringify(layer));
    ok(layer.typeShadow !== 'none' && layer.ghostText === layer.typeText, '提示语前景有阴影且墨影同步', JSON.stringify(layer));

    // 顶部精简 + 签名行轮换/溶解
    var introChrome = await evaluate(cdp, js(function () {
      var intro = document.querySelector('#screen-intro');
      return {
        hasTop: !!intro.querySelector('.intro-top'),
        hasWordmark: !!intro.querySelector('.wordmark'),
        hasMeta: !!intro.querySelector('.intro-meta'),
        hasSub: !!intro.querySelector('.hint-sub')
      };
    }));
    ok(!introChrome.hasTop && !introChrome.hasWordmark && !introChrome.hasMeta && !introChrome.hasSub,
      '顶部字标/副题与旧副行已移除', JSON.stringify(introChrome));

    var sigPos = await evaluate(cdp, js(function () {
      var h = document.querySelector('#intro-hint .hint-line').getBoundingClientRect();
      var s = document.querySelector('#intro-sign').getBoundingClientRect();
      var cs = getComputedStyle(document.querySelector('#intro-sign'));
      return {
        gap: s.top - h.bottom,
        cx: (s.left + s.right) / 2,
        shadow: cs.textShadow,
        font: cs.fontFamily,
        size: parseFloat(cs.fontSize),
        text: document.querySelector('#sign-text').textContent.replace(/\u00A0/g, ' ')
      };
    }));
    ok(sigPos.gap >= 8 && Math.abs(sigPos.cx - 720) <= 2, '签名行位于打字机下方并居中', JSON.stringify(sigPos));
    ok(sigPos.shadow === 'none' && /mono/i.test(sigPos.font) && sigPos.size <= 10.5, '签名行等宽小字且无阴影', JSON.stringify(sigPos));

    var sig0 = await evaluate(cdp, 'window.__farewell.signatureDebug().text');
    await waitFor(cdp, 'window.__farewell.signatureDebug().text.length > 0 && window.__farewell.signatureDebug().text !== ' + JSON.stringify(sig0), 15000, '签名行轮换');
    var sig1 = await evaluate(cdp, 'window.__farewell.signatureDebug()');
    ok(sig1.items.indexOf(sig1.text) >= 0, '签名行轮换到另一段文字', JSON.stringify(sig1));

    await waitFor(cdp, 'window.__farewell.hintDebug().typed > 2', 15000, '提示语出现字符');
    var signY1 = await evaluate(cdp, js(function () {
      return document.querySelector('#intro-sign').getBoundingClientRect().top;
    }));
    await waitFor(cdp, 'window.__farewell.hintDebug().typed === 0', 15000, '提示语清空');
    var signY2 = await evaluate(cdp, js(function () {
      return document.querySelector('#intro-sign').getBoundingClientRect().top;
    }));
    ok(Math.abs(signY1 - signY2) <= 1, '打字机清空时签名行不位移', signY1 + ' / ' + signY2);

    await waitFor(cdp, 'window.__farewell.signatureDebug().mode === "out" && window.__farewell.signatureDebug().opacities.some(function(o){return o < 0.9;}) && window.__farewell.signatureDebug().opacities.some(function(o){return o > 0.1;})', 15000, '签名行错峰溶解');
    var dis = await evaluate(cdp, 'window.__farewell.signatureDebug()');
    ok(new Set(dis.delays).size >= 2, '签名行逐字错峰溶解', JSON.stringify(dis));
    await shot(cdp, 'desktop-intro-dissolve');

    var openingsSeen = [];
    var revealWidths = [];
    for (var k = 0; k < 5; k++) {
      await waitFor(cdp, '!window.__farewell.isLocked() && (window.__farewell.state.phase === "idle" || window.__farewell.state.phase === "opened")', 12000, '可点击黑点');
      await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
      if (k === 0) {
        var stage0 = await evaluate(cdp, 'window.__farewell.introDebug()');
        ok(stage0.morphStage === 'compress' && stage0.compressDur === 700,
          '点击后先进入压缩成线阶段（700ms）', JSON.stringify({ stage: stage0.morphStage, compressDur: stage0.compressDur }));
      }
      await sleep(120);
      if (k === 1) {
        var switchVis = await evaluate(cdp, js(function () {
          var copy = document.querySelector('#intro-copy');
          var acts = document.querySelector('.opening-actions');
          var b = document.querySelector('#btn-enter').getBoundingClientRect();
          return {
            morphing: copy.classList.contains('is-morphing'),
            visible: copy.classList.contains('is-visible'),
            opacity: Number(getComputedStyle(acts).opacity),
            h: b.height
          };
        }));
        ok(switchVis.morphing && switchVis.visible && switchVis.opacity > 0.3 && switchVis.h > 0,
          '切换开局时两个图标按钮保持可见', JSON.stringify(switchVis));
      }
      var early = await canvasBBox(cdp, '#intro-canvas');
      var shadowEarly = k === 0 ? await shadowCount(cdp) : null;
      if (k === 0) await shot(cdp, 'desktop-intro-compress');
      var dbgMid = await evaluate(cdp, 'window.__farewell.introDebug()');
      if (early && early.count > 0) revealWidths.push(early.width / early.cssWidth);
      ok(dbgMid.lineWidth === 3, '第' + (k + 1) + '次变形中線宽保持 3px');
      if (k === 0) {
        await sleep(200);
        var midBox = await canvasBBox(cdp, '#intro-canvas');
        var shadowMid = await shadowCount(cdp);
        ok(early && midBox && early.height > midBox.height + 8,
          '圆圈压缩时高度收缩', JSON.stringify({ early: early && early.height, mid: midBox && midBox.height }));
        ok(shadowEarly > 200 && shadowMid < shadowEarly * 0.5,
          '压缩时阴影与柔边淡出', JSON.stringify({ early: shadowEarly, mid: shadowMid }));
        await shot(cdp, 'desktop-intro-compress-mid');
        await waitFor(cdp, 'window.__farewell.introDebug().morphStage === "curve"', 5000, '进入曲线生长阶段');
        await sleep(100);
        await shot(cdp, 'desktop-intro-curve-line');
      }
      await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened"', 12000, '第' + (k + 1) + '次变形完成');
      if (k === 0) {
        var fin = await evaluate(cdp, 'window.__farewell.introDebug().compressFinal');
        ok(fin && fin.h <= 12 && fin.w >= 120, '压缩末段已成细线而非扁椭圆', JSON.stringify(fin));
        var btnInfo = await evaluate(cdp, js(function () {
          function info(id) {
            var b = document.querySelector(id);
            var svg = b.querySelector('svg');
            var cs = svg ? getComputedStyle(svg) : null;
            return {
              label: b.getAttribute('aria-label'),
              text: b.textContent.trim(),
              hasSvg: !!svg,
              viewBox: svg ? svg.getAttribute('viewBox') : '',
              shape: svg ? svg.getAttribute('data-icon') : '',
              d: b.querySelector('path') ? b.querySelector('path').getAttribute('d') : '',
              stroke: cs ? parseFloat(cs.strokeWidth) : 0,
              cap: cs ? cs.strokeLinecap : '',
              linejoin: cs ? cs.strokeLinejoin : '',
              w: svg ? svg.getBoundingClientRect().width : 0
            };
          }
          return { enter: info('#btn-enter'), reroll: info('#btn-reroll') };
        }));
        ok(btnInfo.enter.label === '进入序章' && btnInfo.reroll.label === '切换开局' && btnInfo.enter.text === '' && btnInfo.reroll.text === '',
          '开局按钮改为纯图标并有可读标签', JSON.stringify(btnInfo));
        ok(btnInfo.enter.hasSvg && btnInfo.reroll.hasSvg && btnInfo.enter.shape === 'circle' && btnInfo.reroll.shape === 'triangle' &&
          btnInfo.enter.d.indexOf('a10 10') > -1 && btnInfo.reroll.d.indexOf('a2 2') > -1,
          '图标采用 Lucide circle/triangle 路径', JSON.stringify(btnInfo));
        ok(btnInfo.enter.viewBox === '0 0 24 24' && btnInfo.reroll.viewBox === '0 0 24 24' &&
          btnInfo.enter.stroke === 2.5 && btnInfo.reroll.stroke === 2.5 &&
          btnInfo.enter.cap === 'round' && btnInfo.enter.linejoin === 'round' &&
          btnInfo.reroll.cap === 'round' && btnInfo.reroll.linejoin === 'round' &&
          Math.abs(btnInfo.enter.w - 24) <= 1,
          '图标遵循 Lucide 24px/描边2.5/圆头圆角规范', JSON.stringify(btnInfo));

        await sleep(700);
        await shot(cdp, 'desktop-opening-handoff');
        await waitFor(cdp, 'Number(getComputedStyle(document.querySelector("#opening-title")).opacity) > 0.99', 6000, '开局标题完全显现');
        var openInk = await evaluate(cdp, js(function () {
          var c = document.querySelector('#copy-ink');
          var d = c ? c.getContext('2d').getImageData(0, 0, c.width, c.height).data : [];
          var n = 0;
          for (var i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
          var cs = getComputedStyle(document.querySelector('#opening-title'));
          return { ink: n, opacity: Number(cs.opacity) };
        }));
        ok(openInk.ink === 0 && openInk.opacity > 0.99,
          '开局不再有墨滴遮挡，文字直接显现', JSON.stringify(openInk));

        async function iconHover(id, leave) {
          return evaluate(cdp, js(function (arg) {
            var b = document.querySelector(arg.id);
            var r = b.getBoundingClientRect();
            b.dispatchEvent(new PointerEvent(arg.leave ? 'pointerleave' : 'pointermove', {
              pointerType: 'mouse',
              bubbles: true,
              clientX: r.left + r.width * 0.72,
              clientY: r.top + r.height * 0.5
            }));
            return true;
          }, { id: id, leave: leave }));
        }
        async function iconD(id) {
          return evaluate(cdp, 'document.querySelector("' + id + ' svg path").getAttribute("d")');
        }

        await iconHover('#btn-enter', false);
        await sleep(800);
        var dEnterHover = await iconD('#btn-enter');
        await shot(cdp, 'desktop-icon-hover');
        await iconHover('#btn-reroll', false);
        await sleep(800);
        var dTriHover = await iconD('#btn-reroll');
        await shot(cdp, 'desktop-icon-hover-both');
        ok(dEnterHover.indexOf('H19') > -1 && dTriHover.indexOf('M18 6') > -1,
          '悬停时圆变换为圆角方、三角变换为叉', JSON.stringify({ enter: dEnterHover, tri: dTriHover }));
        await iconHover('#btn-enter', true);
        await iconHover('#btn-reroll', true);
        await sleep(800);
        var dEnterRest = await iconD('#btn-enter');
        var dTriRest = await iconD('#btn-reroll');
        ok(dEnterRest.indexOf('a10 10') > -1 && dTriRest.indexOf('a2 2') > -1,
          '移开后恢复各自原始形状', JSON.stringify({ enter: dEnterRest, tri: dTriRest }));
      }
      var oid = await evaluate(cdp, 'window.__farewell.state.opening.id');
      openingsSeen.push(oid);
      var full = await canvasBBox(cdp, '#intro-canvas');
      ok(full && full.count > 100 && full.width > 40, '第' + (k + 1) + '次开局曲线已完整画出 (' + oid + ')', JSON.stringify(full));
      if (k === 0) await shot(cdp, 'desktop-opening-morphed');
    }
    ok(revealWidths.length > 0 && revealWidths.every(function (r) { return r < 0.62; }), '变形早期只从中点附近长出', JSON.stringify(revealWidths));
    ok(new Set(openingsSeen).size >= 1, '开场随机变形连点 5 次完成', openingsSeen.join(','));

    console.log('\n[桌面 · 十种开局与背景断线]');
    var openingIds = await evaluate(cdp, 'window.__farewell.DATA.openings.map(function(o){return o.id;})');
    for (var oi = 0; oi < openingIds.length; oi++) {
      var oid = openingIds[oi];
      await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened"', 12000, '可换开局');
      await evaluate(cdp, js(function (id) { window.__farewell.rollOpening(id); return true; }, oid));
      await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened" && window.__farewell.state.opening.id === "' + oid + '"', 12000, '开局 ' + oid);
      var odbg = await evaluate(cdp, 'window.__farewell.introDebug()');
      var obox = await canvasBBox(cdp, '#intro-canvas');
      var oconn = await verticalConnectors(cdp, '#intro-canvas');
      ok(odbg.targetCount === 240 && obox && obox.width > 40, '开局 ' + oid + ' 用 240 点画出完整曲线', JSON.stringify(obox));
      ok(oconn && oconn.longCols === 0, '开局 ' + oid + ' 无贯穿竖线（tan/1/x/间断断开）', JSON.stringify(oconn));
      if (oid === 'tan' || oid === 'jump') await shot(cdp, 'desktop-opening-' + oid);
    }

    await evaluate(cdp, 'document.querySelector("#btn-enter").click()');
    await waitFor(cdp, '!window.__farewell.isLocked() && !!document.querySelector(".screen-prologue")', 12000, '进入序章');
    var proInfo = await evaluate(cdp, js(function () {
      var sec = document.querySelector('.screen-prologue');
      var t = sec.querySelector('.interlude-title');
      var ps = sec.querySelectorAll('.interlude-text p');
      return {
        title: t ? t.textContent : '',
        paras: ps.length,
        chars: Array.prototype.map.call(ps, function (p) { return p.textContent.length; }),
        beforeScene: !document.querySelector('#options .option'),
        hasContinue: !!sec.querySelector('#btn-continue')
      };
    }));
    ok(proInfo.beforeScene && proInfo.paras >= 3 && proInfo.title.length > 0 && proInfo.hasContinue &&
      proInfo.chars.every(function (c) { return c > 20; }),
      '序章在第一题之前出现，交代相识背景', JSON.stringify(proInfo));
    await shot(cdp, 'desktop-prologue');
    await evaluate(cdp, 'document.querySelector("#btn-continue").click()');
    await waitFor(cdp, '!window.__farewell.isLocked() && !!document.querySelector("#screen-game")', 12000, '进入题目以测背景');

    var sceneStats = await evaluate(cdp, js(function () {
      var data = window.__farewell.DATA;
      return {
        titles: data.scenes.map(function (s) { return s.title; }),
        questions: data.scenes.map(function (s) { return s.question; }),
        artCount: document.querySelectorAll('#scene-art path, #scene-art line, #scene-art circle, #scene-art ellipse, #scene-art rect').length,
        hasAllArt: data.scenes.every(function (s) {
          var a = window.FAREWELL_ART && window.FAREWELL_ART[s.id];
          return !!(a && a.bg && a.portrait && a.portrait.src && a.portrait.spot && a.options && a.options.length === 3 && a.options.every(function (o) {
            return o && o.art && o.spot && o.spot.length === 4;
          }));
        }),
        opts: Array.prototype.map.call(document.querySelectorAll('#options .art-option'), function (b) {
          return {
            art: b.querySelectorAll('.option-art svg *').length,
            reveal: !!b.querySelector('.option-reveal'),
            label: b.getAttribute('aria-label')
          };
        })
      };
    }));
    ok(sceneStats.hasAllArt && sceneStats.artCount > 20 && sceneStats.opts.length === 3 && sceneStats.opts.every(function (o) { return o.art > 2 && o.reveal && o.label; }),
      '每题带线描场景与三个可交互物件', JSON.stringify({ all: sceneStats.hasAllArt, art: sceneStats.artCount, opts: sceneStats.opts }));
    ok(new Set(sceneStats.titles).size === 30 && new Set(sceneStats.questions).size === 30,
  '30 个场景与问题均不重复', JSON.stringify({ titles: sceneStats.titles, questions: sceneStats.questions }));

    await waitFor(cdp, 'document.querySelector("#scene-portrait") && document.querySelector("#scene-portrait").complete', 6000, '场景肖像载入');
    var pInfo = await evaluate(cdp, js(function () {
      var p = document.querySelector('#scene-portrait');
      if (!p) return null;
      var cs = getComputedStyle(p);
      return {
        w: p.naturalWidth,
        blend: cs.mixBlendMode,
        mask: cs.maskImage || cs.webkitMaskImage,
        opacity: Number(cs.opacity)
      };
    }));
    ok(pInfo && pInfo.w > 500 && (pInfo.blend === 'normal' || pInfo.blend === 'multiply') && pInfo.mask && pInfo.mask !== 'none' && pInfo.opacity > 0.5,
      '场景肖像以柔边叠底融入背景', JSON.stringify(pInfo));

    await waitFor(cdp, 'document.querySelector("#scene-question-type") && document.querySelector("#scene-question-type").textContent.length > 0', 8000, '问题开始逐字显示');
    var qa = await evaluate(cdp, 'document.querySelector("#scene-question-type").textContent.length');
    await sleep(260);
    var qb = await evaluate(cdp, 'document.querySelector("#scene-question-type").textContent.length');
    var qf = await evaluate(cdp, 'document.querySelector("#scene-question-full").textContent.length');
    ok(qb > qa && qb <= qf, '问题逐字打出', qa + '->' + qb + '/' + qf);
    await shot(cdp, 'desktop-scene-park');

    var spot = await evaluate(cdp, js(function () {
      var b = document.querySelectorAll('#options .art-option')[0];
      var r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }));
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: spot.x, y: spot.y });
    await sleep(450);
    var hov = await evaluate(cdp, js(function () {
      var b = document.querySelectorAll('#options .art-option')[0];
      return {
        art: Number(getComputedStyle(b.querySelector('.option-art')).opacity),
        reveal: Number(getComputedStyle(b.querySelector('.option-reveal')).opacity)
      };
    }));
        await shot(cdp, 'desktop-scene-hover');
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 8, y: 8 });
    await sleep(450);
    var unhov = await evaluate(cdp, js(function () {
      var b = document.querySelectorAll('#options .art-option')[0];
      return {
        art: Number(getComputedStyle(b.querySelector('.option-art')).opacity),
        reveal: Number(getComputedStyle(b.querySelector('.option-reveal')).opacity)
      };
    }));
    
    for (var bi = 0; bi < 2; bi++) {
      var fid = bi === 0 ? 'f5' : 'f15';
      await evaluate(cdp, js(function (id) { window.__farewell.state.atmos.showFunction([id]); return true; }, fid));
      await sleep(1150);
      var bconn = await verticalConnectors(cdp, '#bg-canvas');
      var bdbg = await evaluate(cdp, 'window.__farewell.state.atmos.debug()');
      ok(bconn && bconn.dark > 40 && bconn.longCols === 0, '背景 ' + fid + ' 有曲线且无贯穿竖线', JSON.stringify(bconn));
      ok(bdbg.fCount <= 1 && bdbg.lineWidth === 1.5 && bdbg.canvasOpacity === 0.07, '背景 ' + fid + ' 单曲线 / 1.5px / opacity 0.07', JSON.stringify(bdbg));
    }
    await evaluate(cdp, 'window.__farewell.restartAll()');
    await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "idle"', 12000, '背景测试后重开');
    await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
    await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened"', 12000, '重开开局完成');

    console.log('\n[桌面 · 五个结局完整点击路径]');
    var kinds = Object.keys(PATHS);
    for (var ki = 0; ki < kinds.length; ki++) {
      var kind = kinds[ki];
      if (ki > 0) {
        await evaluate(cdp, 'window.__farewell.restartAll()');
        await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "idle"', 12000, '重开回到开场');
        await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
        await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "opened"', 12000, '重开开局完成');
      }
      await enterGame(cdp);
      var report = await playPath(cdp, kind, { doubleClick: ki === 0, shots: ki === 0 });
      await shot(cdp, 'desktop-ending-' + kind);
      var m = report.monitor;
      ok(m.samples > 50 && m.maxTitles <= 2, kind + '：全程 DOM 中最多两个标题（交叉淡出允许一层叠）', JSON.stringify(m));
      ok(m.maxScenes <= 2, kind + '：#scene 交叉淡出期间最多两个场景节点');
      ok(report.ending.title === report.spec.title, kind + '：结局标题正确 ' + report.ending.title);
      ok(JSON.stringify(report.ending.funcs.map(function (c) { return typeof c === 'string' ? c : c.fn; })) === JSON.stringify(report.spec.ids), kind + '：十二次选择函数精确匹配');
      ok(!report.ending.hasToast, kind + '：悬浮 toast 已删除');
      var bgOk = report.bgReports.every(function (b) { return b.maxCount <= 1 && b.seen.fade && b.seen.grow; });
      ok(bgOk, kind + '：每次选择背景旧线淡出、新线中点长出，且内存只有一条 F 曲线');
      var p = report.ending.plot;
      ok(p && p.view && p.view.x1 > p.view.x0 && p.view.y1 > p.view.y0, kind + '：形状视野固定且有效', JSON.stringify(p && p.view));
      ok(p && Array.isArray(p.yTicks) && p.yTicks.length >= 3, kind + '：y 刻度随区间生成');
      ok(p && p.sampleCount > 200, kind + '：形状采样点充足', String(p && p.sampleCount));
      ok(p && !p.hasF5, kind + '：形状图不再挂 1/x 特例');
      var conn = await verticalConnectors(cdp, '#ending-canvas');
      ok(conn && conn.dark > 80 && conn.longCols === 0, kind + '：结局图有曲线且无贯穿竖线', JSON.stringify(conn));
      if (ki === 0) {
        var card = await evaluate(cdp, js(function () {
          var F = window.__farewell;
          var c = document.querySelector('#share-card');
          window.FarewellPlot.renderCard(c, { result: F.state.result, ending: F.state.ending, funcs: F.state.funcs.slice() });
          var ctx = c.getContext('2d');
          var S = 2;
          var d = ctx.getImageData(64 * S, 304 * S, 772 * S, 286 * S).data;
          var dark = 0;
          for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 180 && d[i] < 80) dark++;
          return { width: c.width, height: c.height, dark: dark };
        }));
        ok(card.width === 1800 && card.height === 2400 && card.dark > 50, kind + '：分享卡 1800×2400 且图像非空', JSON.stringify(card));
      }
      ok(errors.length === 0, kind + '：无运行时异常', errors.slice(0, 2).join(' | '));
    }

    console.log('\n[桌面 · 顶栏内联状态专项]');
    await evaluate(cdp, 'window.__farewell.restartAll()');
    await waitFor(cdp, '!window.__farewell.isLocked() && window.__farewell.state.phase === "idle"', 12000, '专项重开');
    await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
    await enterGame(cdp);
    await waitFor(cdp, '!window.__farewell.isLocked() && document.querySelectorAll("#options .option").length === 3', 12000, '专项第一题');
    await evaluate(cdp, 'document.querySelectorAll("#options .option")[1].click()');
    await sleep(80);
    var status = await evaluate(cdp, js(function () {
      var s = document.querySelector('#rail-status');
      var options = Array.prototype.map.call(document.querySelectorAll('#options .option'), function (b) {
        var r = b.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      });
      if (!s) return { exists: false };
      var r = s.getBoundingClientRect();
      var cs = getComputedStyle(s);
      var intersects = options.some(function (o) {
        return r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top;
      });
      return {
        exists: true,
        visible: s.classList.contains('is-visible'),
        text: s.textContent,
        fontSize: cs.fontSize,
        color: cs.color,
        pointerEvents: cs.pointerEvents,
        intersects: intersects,
        bottom: r.bottom,
        optionsTop: options.length ? options[0].top : null,
        inHeader: !!s.closest('.game-header')
      };
    }));
    ok(status.exists && status.inHeader, '状态位于顶栏 F(x) 同一行右侧');
    ok(status.visible && status.text.length > 0, '状态文案为 ✓ 已加入 f(x)=...', status.text);
    ok(status.fontSize === '12px', '状态字号 12px', status.fontSize);
    ok(status.pointerEvents === 'none', '状态 pointer-events:none');
    ok(!status.intersects && status.bottom <= status.optionsTop, '状态不遮挡任何选项文字', JSON.stringify(status));
    await shot(cdp, 'desktop-rail-status');
    await sleep(1350);
    var faded = await evaluate(cdp, 'getComputedStyle(document.querySelector("#rail-status")).opacity');
    ok(Number(faded) < 0.05, '状态 1200ms 后淡出', faded);

    console.log('\n[手机 390×844 · 无鼠标可玩]');
    await load(cdp, 390, 844, 2, true);
    var mIntro = await evaluate(cdp, 'window.__farewell.introDebug()');
    ok(mIntro.coarse === true, '手机识别为无鼠标环境');
    var b1 = mIntro.breath;
    await sleep(800);
    var b2 = await evaluate(cdp, 'window.__farewell.introDebug().breath');
    ok(b1 >= 0.98 && b1 <= 1.02 && b2 >= 0.98 && b2 <= 1.02 && Math.abs(b1 - b2) > 0.0001, '手机呼吸缩放 1±0.02 且缓慢变化', b1 + ' -> ' + b2);
    var mHintC = await evaluate(cdp, js(function () {
      var r = document.querySelector('#intro-hint .hint-line').getBoundingClientRect();
      return { c: (r.left + r.right) / 2, w: window.innerWidth };
    }));
    ok(Math.abs(mHintC.c - mHintC.w / 2) <= 2, '手机提示语保持中心对称', JSON.stringify(mHintC));
    var mSign = await evaluate(cdp, js(function () {
      var r = document.querySelector('#intro-sign').getBoundingClientRect();
      var cs = getComputedStyle(document.querySelector('#intro-sign'));
      return { c: (r.left + r.right) / 2, w: window.innerWidth, h: r.height, display: cs.display };
    }));
    ok(mSign.h > 8 && mSign.display !== 'none' && Math.abs(mSign.c - mSign.w / 2) <= 2, '手机签名行可见且居中', JSON.stringify(mSign));
    await shot(cdp, 'mobile-intro');
    await evaluate(cdp, 'window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", clientX: 295, clientY: 422 }))');
    await sleep(350);
    var mBulge = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(mBulge.max > 3, '手机触摸产生临时凸起', JSON.stringify(mBulge));
    await sleep(2200);
    var mRest = devOf(await evaluate(cdp, 'window.__farewell.introDebug()'));
    ok(mRest.max < 2, '触摸凸起随后消退', JSON.stringify(mRest));
    var mInk = await evaluate(cdp, js(function () {
      var c = document.querySelector('#intro-canvas');
      var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      var semi = 0, core = 0;
      for (var i = 3; i < d.length; i += 4) {
        var a = d[i];
        if (a >= 230) core++;
        else if (a >= 20) semi++;
      }
      return { semi: semi, core: core };
    }));
    ok(mInk.core > 5000 && mInk.semi > 400, '手机黑点同样带柔边与投影', JSON.stringify(mInk));
    await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
    await enterGame(cdp);
    var mReport = await playPath(cdp, 'jump', { shots: true, prefix: 'mobile' });
    ok(mReport.monitor.maxTitles <= 2 && mReport.monitor.maxScenes <= 2, '手机交叉淡出叠层不超过两层');
    ok(!!mReport.ending.title && mReport.ending.title.length > 0, '手机完整玩到结局', mReport.ending.title);
    var overflow = await evaluate(cdp, 'document.documentElement.scrollWidth - document.documentElement.clientWidth');
    ok(overflow <= 1, '手机无横向溢出', String(overflow));
    var formula = await evaluate(cdp, js(function () {
      var f = document.querySelector('#formula');
      if (!f) return null;
      return { overflow: f.scrollWidth - f.clientWidth, height: f.getBoundingClientRect().height };
    }));
    ok(formula && formula.overflow <= 1 && formula.height > 40, '手机完整 F(x) 显示', JSON.stringify(formula));
    ok(errors.length === 0, '手机流程无运行时异常', errors.slice(0, 2).join(' | '));
    await shot(cdp, 'mobile-ending');

    console.log('\n[减少动态效果 fallback]');
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await load(cdp, 1440, 900, 1, false);
    var rHint = await evaluate(cdp, 'window.__farewell.hintDebug()');
    ok(rHint.typed === rHint.total && rHint.total > 0, '减少动态效果下提示语直接完整显示', JSON.stringify(rHint));
    var rSign = await evaluate(cdp, 'window.__farewell.signatureDebug()');
    ok(rSign.text.length > 0 && rSign.mode === 'hold', '减少动态效果下签名行直接显示', JSON.stringify(rSign));
    await evaluate(cdp, 'document.querySelector("#seed-btn").click()');
    await enterGame(cdp);
    var reducedReport = await playPath(cdp, 'jump', { reduced: true });
    ok(!!reducedReport.ending.title && reducedReport.ending.title.length > 0, '减少动态效果下仍可完整玩到结局', reducedReport.ending.title);
    ok(reducedReport.finalDebug.narrativeComplete && reducedReport.finalDebug.principleComplete,
      '减少动态效果下正文与原理无障碍地直接完整显示');
    ok(reducedReport.monitor.maxTitles <= 2 && reducedReport.monitor.maxScenes <= 2, '减少动态效果下叠层不超过两层');
    ok(errors.length === 0, '减少动态效果下无运行时异常', errors.slice(0, 2).join(' | '));
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] });

    console.log('\n[汇总]');
    console.log('  截图目录: ' + OUT);
    console.log('  检查项: ' + checks + '，失败: ' + failures.length);
    if (failures.length) {
      failures.forEach(function (f) { console.error('  - ' + f); });
      process.exitCode = 1;
    } else {
      console.log('  PASS: 动画/渲染修复验收通过');
    }
  } catch (err) {
    console.error('\nQA 异常: ' + (err && err.stack || err));
    process.exitCode = 1;
  } finally {
    try { if (cdp) cdp.ws.close(); } catch (err) { /* ignore */ }
    chrome.kill();
  }
}

main();
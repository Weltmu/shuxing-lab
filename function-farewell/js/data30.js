/* 30 幕长流程装配：故事 + 30 个结局 + 形状模板 + 判定
 * 覆盖 FAREWELL_DATA 的 scenes/slots/beats/endings，并把 Engine.classify 换成按累计信号判定。
 */
(function (root) {
  'use strict';

  var D = root.FAREWELL_DATA;
  var S = root.FAREWELL_STORY30;
  var E = root.FAREWELL_ENDINGS30;
  var Engine = root.FarewellEngine;
  if (!D || !S || !E || !Engine) return;

  var TAU = Math.PI * 2;
  var NAN = { x: NaN, y: NaN };

  /* ---------- 形状模板：30 个结局各一个 ---------- */
  function pts(fn, n, t0, t1) {
    var out = [];
    n = n || 320;
    for (var i = 0; i <= n; i++) out.push(fn((t0 || 0) + ((t1 === undefined ? TAU : t1) - (t0 || 0)) * i / n));
    return out;
  }
  function heart(t) {
    return { x: 16 * Math.pow(Math.sin(t), 3), y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) };
  }
  function rose(k, r) { return function (t) { var rr = (r || 1) * Math.cos(k * t); return { x: rr * Math.cos(t), y: rr * Math.sin(t) }; }; }
  function spiral(turns, r0, r1) {
    return function (t) {
      var u = t / TAU; var r = r0 + (r1 - r0) * u;
      return { x: r * Math.cos(turns * TAU * u), y: r * Math.sin(turns * TAU * u) };
    };
  }
  function line(a, b) { return function (t) { var u = t / TAU; return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u }; }; }
  function multi() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      var seg = arguments[i];
      if (typeof seg === 'function') seg = pts(seg);
      for (var j = 0; j < seg.length; j++) out.push(seg[j]);
      out.push(NAN);
    }
    return out;
  }

  var SHAPES = {
    'heart': pts(heart),
    'heart-half': pts(function (t) { var p = heart(t); return { x: p.x, y: p.y }; }, 320, Math.PI, TAU),
    'heart-open': multi(
      pts(function (t) { var p = heart(t); return { x: p.x - 1.6, y: p.y - 0.4 }; }, 200, Math.PI + 0.2, TAU - 0.1),
      pts(function (t) { var p = heart(t); return { x: p.x + 1.6, y: p.y + 0.4 }; }, 200, 0.1, Math.PI - 0.2)
    ),
    'scissors-line': multi(line([-1, 0.3], [1, 0.3]), line([-1, -0.3], [1, -0.3])),
    'straight-line': pts(line([-1.4, 0], [1.4, 0])),
    'empty-bench': multi(
      line([-1, 0.2], [1, 0.2]), line([-1, 0.2], [-0.9, -0.4]), line([1, 0.2], [0.9, -0.4]),
      line([-0.9, -0.4], [0.9, -0.4]), line([-0.6, 0.2], [-0.6, 0.9]), line([0.6, 0.2], [0.6, 0.9])
    ),
    'fading-spiral': pts(spiral(2.4, 1.25, 0.05)),
    'folded-letter': multi(line([-1, 0.6], [1, 0.6]), line([-1, -0.6], [1, -0.6]), line([-1, 0.6], [0, -0.2]), line([1, 0.6], [0, -0.2])),
    'two-dots': multi(pts(function (t) { return { x: 0.8 * Math.cos(t) + 0.9, y: 0.8 * Math.sin(t) }; }, 80), pts(function (t) { return { x: 0.8 * Math.cos(t) - 0.9, y: 0.8 * Math.sin(t) }; }, 80)),
    'two-lines': multi(line([-1.2, 0.5], [1.2, 0.5]), line([-1.2, -0.5], [1.2, -0.5])),
    'asymptote': multi(
      pts(function (t) { var u = 0.4 + (t / TAU) * 1.4; return { x: -u, y: 0.5 / u }; }),
      pts(function (t) { var u = 0.4 + (t / TAU) * 1.4; return { x: u, y: -0.5 / u }; }),
      pts(rose(5, 0.28))
    ),
    'road': pts(function (t) { var u = t / TAU; return { x: (u - 0.5) * 3, y: Math.sin(u * Math.PI * 2) * 0.5 }; }),
    'blank-page': multi(line([-0.9, 0.7], [0.9, 0.7]), line([-0.9, -0.7], [0.9, -0.7])),
    'lamp': multi(line([0, -1], [0, 0.4]), pts(function (t) { return { x: 0.6 * Math.cos(t), y: 0.4 + 0.35 * Math.sin(t) }; }, 120, 0, Math.PI)),
    'paper-plane': multi(line([-1, -0.5], [1.1, 0.2]), line([1.1, 0.2], [-0.7, 0.7]), line([-0.7, 0.7], [-1, -0.5])),
    'key': multi(pts(function (t) { return { x: 0.28 * Math.cos(t) - 0.6, y: 0.28 * Math.sin(t) }; }, 120), line([-0.32, 0], [1.2, 0]), line([0.8, 0], [0.8, 0.3]), line([1.1, 0], [1.1, 0.25])),
    'snowflake': (function () {
      var out = [];
      for (var k = 0; k < 6; k++) {
        var a = k / 6 * TAU;
        out.push({ x: 0, y: 0 }); out.push({ x: Math.cos(a) * 1.1, y: Math.sin(a) * 1.1 }); out.push(NAN);
        var bx = Math.cos(a) * 0.55, by = Math.sin(a) * 0.55;
        out.push({ x: bx, y: by }); out.push({ x: bx + Math.cos(a + Math.PI / 3) * 0.3, y: by + Math.sin(a + Math.PI / 3) * 0.3 }); out.push(NAN);
        out.push({ x: bx, y: by }); out.push({ x: bx + Math.cos(a - Math.PI / 3) * 0.3, y: by + Math.sin(a - Math.PI / 3) * 0.3 }); out.push(NAN);
      }
      return out;
    })(),
    'circle': pts(function (t) { return { x: Math.cos(t), y: Math.sin(t) }; }),
    'umbrella': multi(pts(function (t) { return { x: Math.cos(t), y: Math.abs(Math.sin(t)) * 0.7 - 0.4 }; }, 160, 0, Math.PI), line([0, -0.4], [0, 0.9])),
    'two-cups': multi(
      pts(function (t) { return { x: 0.4 * Math.cos(t) - 0.5, y: 0.3 * Math.sin(t) - 0.2 }; }, 100),
      pts(function (t) { return { x: 0.4 * Math.cos(t) + 0.5, y: 0.3 * Math.sin(t) - 0.2 }; }, 100)
    ),
    'folded-page': multi(line([-0.8, 0.7], [0.8, 0.7]), line([-0.8, 0.7], [-0.8, -0.7]), line([-0.8, -0.7], [0.8, -0.7]), line([0.8, -0.7], [0.8, 0.2]), line([0.8, 0.2], [0.2, 0.2])),
    'traffic-light': multi(
      pts(function (t) { return { x: 0.45 * Math.cos(t), y: 1.1 + 0.45 * Math.sin(t) }; }, 100),
      line([-0.45, 1.1], [-0.45, -1.1]), line([0.45, 1.1], [0.45, -1.1])
    ),
    'firework': (function () {
      var out = [];
      for (var k = 0; k < 12; k++) {
        var a = k / 12 * TAU, r = k % 2 ? 0.55 : 1.1;
        out.push({ x: 0, y: 0 }); out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); out.push(NAN);
      }
      return out;
    })(),
    'moon': multi(pts(function (t) { return { x: Math.cos(t) + 0.25, y: Math.sin(t) }; }, 160), pts(function (t) { return { x: Math.cos(t) * 0.85 + 0.55, y: Math.sin(t) * 0.85 }; }, 160)),
    'pause': multi(line([-0.5, 0.8], [-0.5, -0.8]), line([0.3, 0.8], [0.3, -0.8])),
    'flower': pts(rose(6, 1.0)),
    'open-book': multi(line([-1, 0.4], [-0.05, 0.1]), line([-0.05, 0.1], [1, 0.4]), line([-1, 0.4], [-1, -0.5]), line([1, 0.4], [1, -0.5]), line([-1, -0.5], [0, -0.15]), line([1, -0.5], [0, -0.15])),
    'book-stack': multi(line([-0.9, 0.7], [0.9, 0.7]), line([-0.9, 0.7], [-0.9, 0.45]), line([-0.8, 0.05], [1, 0.05]), line([-0.8, -0.35], [0.8, -0.35]), line([-0.6, -0.75], [0.9, -0.75])),
    'calendar': multi(line([-0.9, 0.8], [0.9, 0.8]), line([-0.9, 0.8], [-0.9, -0.8]), line([-0.9, -0.8], [0.9, -0.8]), line([0.9, -0.8], [0.9, 0.8]), line([-0.9, 0.3], [0.9, 0.3])),
    'light-year': pts(spiral(4, 0.05, 1.4), 420)
  };

  // 形状统一：居中并按包围盒缩放
  function normalize(raw) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    raw.forEach(function (p) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    });
    if (!Number.isFinite(x0)) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
    var side = Math.max(x1 - x0 || 1, y1 - y0 || 1);
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var out = raw.map(function (p) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return NAN;
      return { x: (p.x - cx) / side, y: (p.y - cy) / side };
    });
    return { pts: out, view: { x0: -0.62, x1: 0.62, y0: -0.62, y1: 0.62 } };
  }

  var shapeCache = {};
  function shapeOf(id) {
    if (shapeCache[id]) return shapeCache[id];
    var raw = SHAPES[id] || SHAPES['heart'];
    shapeCache[id] = normalize(raw);
    return shapeCache[id];
  }

  /* ---------- 装配场景 / 槽位 / 节拍 ---------- */
  var scenes = S.scenes.map(function (sc, i) {
    var copy = {
      id: sc.id,
      slot: i + 1,
      when: sc.when,
      title: sc.title,
      text: sc.text,
      question: sc.question,
      echoes: (sc.echoes || []).slice(),
      actLabel: i < 8 ? '第一幕 · 秋' : (i < 16 ? '第二幕 · 冬与春' : (i < 24 ? '第三幕 · 夏' : '尾声 · 第二年')),
      options: sc.options.map(function (o, k) {
        var next = (i + 1 < S.scenes.length) ? S.scenes[i + 1].id : null;
        var bridgeText = (o.text || '') + '。';
        return {
          id: o.id, label: o.label, text: o.text, fn: o.fn,
          op: '+', weight: o.signal.t > 0 ? 1 : 0,
          key: false,
          signal: o.signal,
          next: next,
          bridge: i + 1 < S.scenes.length ? bridgeText : '',
          d: null, h: null
        };
      })
    };
    return copy;
  });

  var sceneById = {};
  scenes.forEach(function (sc) { sceneById[sc.id] = sc; });

  var slots = scenes.map(function (sc) { return [sc.id]; });

  // 节拍：30 幕 + 6 段间章 + 5 段聊天
  var CHAT_AT = { 5: 'c1', 12: 'c2', 17: 'c4', 21: 'c3', 26: 'c5' };
  var INTER_AT = { 3: 'n1', 8: 'n2', 14: 'n3', 19: 'n4', 24: 'n5', 28: 'n6' };
  var beats = [];
  scenes.forEach(function (sc, i) {
    beats.push({ type: 'scene', slot: i + 1, default: sc.id, id: sc.id });
    if (INTER_AT[i + 1]) beats.push({ type: 'interlude', id: INTER_AT[i + 1] });
    if (CHAT_AT[i + 1]) beats.push({ type: 'chat', id: CHAT_AT[i + 1] });
  });

  /* ---------- 结局 ---------- */
  var endings = {};
  var endingsOrder = [];
  E.list.forEach(function (e) {
    endings[e.id] = {
      id: e.id, order: e.index, title: e.title, en: e.en, shape: e.shape, shapeName: e.shapeName || '',
      text: e.text, principle: e.principle,
      good: e.id === 'e30'
    };
    endingsOrder.push(e.id);
  });

  /* ---------- 覆盖 DATA ---------- */
  D.scenes = scenes;
  D.sceneById = sceneById;
  D.slots = slots;
  D.slotCount = slots.length;
  D.beats = beats;
  D.endings = endings;
  D.endingsOrder = endingsOrder;
  D.storyScenes = S.scenes;

  /* ---------- 判定：累计信号 → 结局 ---------- */
  // 每个轴的基准均值：让「比平均更暖/更冷」才进入两端档，避免某一档被随机玩法垄断
  var meanT = 0, meanH = 0, meanA = 0, optCount = 0;
  scenes.forEach(function (sc) {
    sc.options.forEach(function (o) {
      meanT += o.signal.t || 0; meanH += o.signal.h || 0; meanA += o.signal.a || 0; optCount += 1;
    });
  });
  meanT /= optCount; meanH /= optCount; meanA /= optCount;

  var baseClassify = Engine.classify;
  Engine.classify = function (list) {
    var arr = Array.isArray(list) ? list : [];
    if (arr.some(function (c) { return typeof c === 'string'; })) return baseClassify(arr);
    var sumT = 0, sumH = 0, sumA = 0;
    arr.forEach(function (c) {
      var s = c && c.signal;
      if (!s) return;
      sumT += s.t || 0; sumH += s.h || 0; sumA += s.a || 0;
    });
    sumT -= meanT * arr.length;
    sumH -= meanH * arr.length;
    sumA -= meanA * arr.length;
    var ending = E.pick(sumT, sumH, sumA, arr.length);
    var shape = shapeOf(ending.shape);
    return {
      kind: ending.id,
      ending: ending,
      pts: shape.pts,
      view: shape.view,
      sums: { t: sumT, h: sumH, a: sumA },
      note: '',
      tags: []
    };
  };

  root.FAREWELL_30 = { scenes: scenes, endings: endings, shapeOf: shapeOf };
})(typeof window !== 'undefined' ? window : globalThis);

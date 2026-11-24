/* 函数式告别 — 形状引擎
 *
 * 12 次选择，每个选项贡献一个谐波项（axis / amp / freq / phase），错误选项
 * 额外带一种"破坏类型"，于是最终画出来的是同一颗心的不同形态：
 *
 *   x(t) = Σ 选项的 x 项        y(t) = Σ 选项的 y 项        t ∈ [0, 2π]
 *
 * 12 个真诚选项的谐波项加起来，恰好等于经典心形参数方程：
 *   x(t) = 12 sin t − 4 sin 3t
 *   y(t) = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t
 *
 * 好结局：12 次里至少 10 次真诚，且 3 个关键节点全中。
 * 坏结局：按破坏类型的优先级落到 8 种残形之一。
 */
(function (root) {
  'use strict';

  var SAMPLES = 360;
  var TWO_PI = Math.PI * 2;
  var GOOD_SINCERE = 10;
  var KEY_TOTAL = 3;

  // 破坏类型 → 结局 kind（优先级从高到低）
  var TAG_ORDER = ['break', 'open', 'drift', 'shrink', 'wobble', 'sink', 'flatten', 'void'];
  var TAG_KIND = {
    break: 'jump',
    open: 'asymptote',
    drift: 'drift',
    shrink: 'decay',
    wobble: 'sine',
    sink: 'parabola',
    flatten: 'log',
    void: 'flat'
  };

  var TAG_NOTE = {
    break: 't 走过 π 时 x 突然多出几个单位（阶跃项），曲线在这里被切断。',
    open: '多了一项随时间线性增长的偏移，末尾还在往外跑，合不拢。',
    drift: '包络随时间增长，心外甩出一条逃逸的弧。',
    shrink: '振幅包络随时间衰减，一侧被卷进去。',
    wobble: '混进了更高次的谐波，边缘起了皱。',
    sink: 'y 方向多了一项线性偏移，整颗心往下沉。',
    flatten: 'y 方向被常数项压扁。',
    void: '这一项的振幅几乎为零，整颗心缩成很小一圈。'
  };

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function (c) {
      if (!c || typeof c === 'string') return { h: null, weight: 0, key: false, d: null };
      return { h: c.h || null, weight: c.weight || 0, key: !!c.key, d: c.d || null };
    });
  }

  function termValue(h, t) {
    if (!h) return 0;
    if (h.kind === 'step') return h.amp * (t >= Math.PI ? 1 : 0);
    if (h.kind === 'ramp') return h.amp * (t / Math.PI - 1);
    if (h.kind === 'const') return h.amp;
    var v = h.amp * (h.phase === 'sin' ? Math.sin(h.freq * t) : Math.cos(h.freq * t));
    if (h.kind === 'decay') v *= (1 - t / TWO_PI);
    return v;
  }

  function composeShape(list) {
    var norm = normalize(list);
    var pts = new Array(SAMPLES + 1);
    for (var i = 0; i <= SAMPLES; i++) {
      var t = i / SAMPLES * TWO_PI;
      var x = 0;
      var y = 0;
      for (var j = 0; j < norm.length; j++) {
        var h = norm[j].h;
        if (!h) continue;
        var v = termValue(h, t);
        if (h.axis === 'x') x += v; else y += v;
      }
      pts[i] = { x: x, y: y };
    }
    return pts;
  }

  function goodMarks(list) {
    var sincere = 0;
    var keyHit = 0;
    var keyTotal = 0;
    (list || []).forEach(function (c) {
      if (!c || typeof c === 'string') return;
      if (c.weight > 0) sincere += 1;
      if (c.key) {
        keyTotal += 1;
        if (c.weight > 0) keyHit += 1;
      }
    });
    return { sincere: sincere, keyHit: keyHit, keyTotal: keyTotal };
  }

  function meetsGood(list) {
    var m = goodMarks(list);
    return m.sincere >= GOOD_SINCERE && m.keyTotal >= KEY_TOTAL && m.keyHit === m.keyTotal;
  }

  // 理想心形的包围盒（画布视野固定在这里，残形才会真的小下去）
  var view = (function () {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (var i = 0; i <= SAMPLES; i++) {
      var t = i / SAMPLES * TWO_PI;
      var x = 12 * Math.sin(t) - 4 * Math.sin(3 * t);
      var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    var padX = (x1 - x0) * 0.14;
    var padY = (y1 - y0) * 0.14;
    return { x0: x0 - padX, x1: x1 + padX, y0: y0 - padY, y1: y1 + padY };
  })();


  /* ---------- 结局图形模板：形状由结局类型定死，不再由谐波相加决定 ---------- */

  var TWO_PI2 = Math.PI * 2;
  var NAN = { x: NaN, y: NaN };

  function pushLine(out, pts) {
    for (var i = 0; i < pts.length; i++) out.push(pts[i]);
    out.push(NAN);
  }

  function heartPoints(scale, dx, dy, from, to) {
    var pts = [];
    var n = 260;
    for (var i = 0; i <= n; i++) {
      var t = (from === undefined ? 0 : from) + (i / n) * ((to === undefined ? TWO_PI2 : to) - (from === undefined ? 0 : from));
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push({ x: x * scale + (dx || 0), y: y * scale + (dy || 0) });
    }
    return pts;
  }

  function rosePoints(petals, radius, steps) {
    var pts = [];
    var n = steps || 320;
    for (var i = 0; i <= n; i++) {
      var t = i / n * TWO_PI2;
      var r = radius * Math.cos(petals * t);
      pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
    }
    return pts;
  }

  function spiralPoints(turns, r0, r1, steps) {
    var pts = [];
    var n = steps || 360;
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      var t = u * TWO_PI2 * turns;
      var r = r0 + (r1 - r0) * u;
      pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
    }
    return pts;
  }

  function snowflakePoints(len) {
    var out = [];
    for (var k = 0; k < 6; k++) {
      var a = k / 6 * TWO_PI2;
      var cx = Math.cos(a), cy = Math.sin(a);
      pushLine(out, [{ x: 0, y: 0 }, { x: cx * len, y: cy * len }]);
      for (var b = 1; b <= 2; b++) {
        var u = b / 3;
        var bx = cx * len * u, by = cy * len * u;
        var side = (b % 2 ? 1 : -1) * 0.18 * len;
        var pa = a + Math.PI / 3, pb = a - Math.PI / 3;
        pushLine(out, [
          { x: bx, y: by },
          { x: bx + Math.cos(pa) * side, y: by + Math.sin(pa) * side }
        ]);
        pushLine(out, [
          { x: bx, y: by },
          { x: bx + Math.cos(pb) * side, y: by + Math.sin(pb) * side }
        ]);
      }
    }
    return out;
  }

  function shapeFor(kind) {
    var out = [];
    if (kind === 'good') {
      pushLine(out, heartPoints(1, 0, 0));
    } else if (kind === 'jump') {
      // 断成两半的心：左右两半明显分开、上下错位，中间留出裂口
      pushLine(out, heartPoints(0.92, -1.7, -0.55, Math.PI + 0.22, TWO_PI2 - 0.06));
      pushLine(out, heartPoints(0.92, 1.7, 0.55, 0.06, Math.PI - 0.22));
    } else if (kind === 'asymptote') {
      // 两条逼近却不相交的曲线，中间夹一朵玫瑰
      var left = [], right = [];
      for (var i = 0; i <= 90; i++) {
        var x = 0.42 + (i / 90) * 1.5;
        var y = 0.5 / x;
        left.push({ x: -x, y: y });
        right.push({ x: x, y: -y });
      }
      pushLine(out, left);
      pushLine(out, right);
      pushLine(out, rosePoints(5, 0.3, 240));
    } else if (kind === 'decay') {
      pushLine(out, spiralPoints(2.2, 1.15, 0.12, 420));
    } else if (kind === 'sine') {
      var wave = [];
      for (var j = 0; j <= 300; j++) {
        var u = j / 300;
        wave.push({ x: (u - 0.5) * 3.2, y: Math.sin(u * Math.PI * 6) * 0.55 * (0.45 + 0.55 * u) });
      }
      pushLine(out, wave);
    } else if (kind === 'parabola') {
      var arc = [];
      for (var m = 0; m <= 240; m++) {
        var q = (m / 240 - 0.5) * 2;
        arc.push({ x: q * 1.5, y: -0.55 * q * q + 0.5 });
      }
      pushLine(out, arc);
    } else if (kind === 'log') {
      var curve = [];
      for (var n2 = 0; n2 <= 240; n2++) {
        var xx = -1.5 + (n2 / 240) * 3;
        curve.push({ x: xx, y: (xx > 0 ? Math.log(1 + xx * 1.6) * 0.62 : xx * 0.18) - 0.25 });
      }
      pushLine(out, curve);
    } else if (kind === 'flat') {
      [0.92, 0.56, 0.26, 0.09].forEach(function (rad) {
        var ring = [];
        for (var r2 = 0; r2 <= 120; r2++) {
          var th = r2 / 120 * TWO_PI2;
          ring.push({ x: rad * Math.cos(th), y: rad * Math.sin(th) });
        }
        pushLine(out, ring);
      });
    } else if (kind === 'drift') {
      pushLine(out, spiralPoints(3.4, 0.08, 1.5, 460));
    } else {
      pushLine(out, heartPoints(1, 0, 0));
    }
    return finishShape(out);
  }

  function finishShape(raw) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    raw.forEach(function (p) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    });
    if (!Number.isFinite(x0)) { x0 = -1; x1 = 1; y0 = -1; y1 = 1; }
    var w = x1 - x0 || 1, h = y1 - y0 || 1;
    var side = Math.max(w, h);
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var pts = raw.map(function (p) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return NAN;
      return { x: (p.x - cx) / side, y: (p.y - cy) / side };
    });
    var pad = 0.12;
    return {
      pts: pts,
      view: { x0: -0.5 - pad, x1: 0.5 + pad, y0: -0.5 - pad, y1: 0.5 + pad }
    };
  }

  function classify(list) {
    var arr = Array.isArray(list) ? list : [];
    var hasString = arr.some(function (c) { return typeof c === 'string'; });
    if (hasString) return classify1D(arr);
    var choices = arr.filter(function (c) { return c && typeof c === 'object'; });
    var marks = goodMarks(choices);
    var tags = [];
    choices.forEach(function (c) {
      if (c.d && tags.indexOf(c.d) === -1) tags.push(c.d);
    });

    var kind = 'good';
    if (!meetsGood(choices)) {
      kind = 'log';
      for (var i = 0; i < TAG_ORDER.length; i++) {
        if (tags.indexOf(TAG_ORDER[i]) !== -1) { kind = TAG_KIND[TAG_ORDER[i]]; break; }
      }
    }

    var shape = shapeFor(kind);
    var pts = shape.pts;
    var shapeView = shape.view;
    var notes = tags.filter(function (tag) { return TAG_NOTE[tag]; })
      .map(function (tag) { return TAG_NOTE[tag]; });

    return {
      kind: kind,
      pts: pts,
      view: shapeView,
      tags: tags,
      note: kind === 'good' ? '十二项谐波加起来，正好是心形的参数方程。' : (notes[0] || ''),
      stats: marks
    };
  }

  // 给结局页拼 x(t) / y(t) 用的项表
  function termRows(list) {
    return (Array.isArray(list) ? list : []).filter(function (c) {
      return c && typeof c === 'object' && c.h;
    }).map(function (c) {
      return { axis: c.h.axis, amp: c.h.amp, freq: c.h.freq, phase: c.h.phase, kind: c.h.kind || null, bad: !!c.d };
    });
  }


  /* ---------- 旧的一维函数 API（背景曲线 / 开场形变仍在用） ---------- */
  var XS = [];
  for (var xi = 0; xi < 101; xi++) XS.push(Number((xi * 0.1).toFixed(1)));
  var JUMP_X = 5.2;
  var TAN_POLES = [Math.PI / 2, 3 * Math.PI / 2, 5 * Math.PI / 2];
  var compiled = {};
  var fallback = {
    f1: function (x) { return x; }, f2: function (x) { return -x; },
    f3: function (x) { return Math.exp(-x); }, f4: function (x) { return Math.sin(x); },
    f5: function (x) { return 1 / x; }, f6: function (x) { return -(x * x); },
    f7: function (x) { return Math.log(x); }, f8: function (x) { return Math.exp(x); },
    f10: function (x) { return Math.cos(x); }, f11: function (x) { return x * x; },
    f12: function (x) { return x * x * x; }, f13: function (x) { return Math.sqrt(x); },
    f14: function (x) { return Math.abs(x); }, f15: function (x) { return Math.tan(x); }
  };
  function getCompiled(id) {
    if (compiled[id] !== undefined) return compiled[id];
    var fn = root.FAREWELL_DATA && root.FAREWELL_DATA.functions && root.FAREWELL_DATA.functions[id];
    var math = root.math;
    var out = null;
    if (fn && fn.expr && math && typeof math.compile === 'function') {
      try { out = math.compile(fn.expr); } catch (err) { out = null; }
    }
    compiled[id] = out;
    return out;
  }
  function evalFn(id, x) {
    if (id === 'f9') return x >= JUMP_X ? 2 : 0;
    var c = getCompiled(id);
    if (c) {
      try {
        var v = c.evaluate({ x: x });
        if (typeof v === 'number') return v;
        if (v && typeof v.valueOf === 'function') return Number(v.valueOf());
      } catch (err) { /* fall through */ }
    }
    var f = fallback[id];
    return f ? f(x) : NaN;
  }
  function sumAt(ids, x) {
    var total = 0;
    for (var i = 0; i < ids.length; i++) {
      var v = evalFn(typeof ids[i] === 'string' ? ids[i] : ids[i].fn, x);
      if (!Number.isFinite(v)) return NaN;
      total += v;
    }
    return total;
  }
  function sample1D(ids) {
    return XS.map(function (x) { return { x: x, y: sumAt(ids, x) }; });
  }
  function classify1D(ids) {
    var names = ids.map(function (c) { return typeof c === 'string' ? c : c.fn; });
    var hasF5 = names.indexOf('f5') !== -1;
    var hasTan = names.indexOf('f15') !== -1;
    if (names.indexOf('f9') !== -1) {
      return { kind: 'jump', jumpX: JUMP_X, pts: sample1D(ids) };
    }
    if (hasF5 || hasTan) {
      var xs = [];
      if (hasF5) xs.push(0);
      if (hasTan) TAN_POLES.forEach(function (p) { if (p <= 10) xs.push(Number(p.toFixed(4))); });
      return { kind: 'asymptote', asymptoteXs: xs, pts: sample1D(ids) };
    }
    return { kind: 'log', pts: sample1D(ids) };
  }

  root.FarewellEngine = {
    SAMPLES: SAMPLES,
    GOOD_SINCERE: GOOD_SINCERE,
    KEY_TOTAL: KEY_TOTAL,
    TAG_ORDER: TAG_ORDER,
    TAG_KIND: TAG_KIND,
    view: view,
    composeShape: composeShape,
    classify: classify,
    meetsGood: meetsGood,
    goodMarks: goodMarks,
    termRows: termRows,
    termValue: termValue,
    XS: XS,
    JUMP_X: JUMP_X,
    evalFn: evalFn,
    sumAt: sumAt,
    sample: sample1D,
    classify1D: classify1D
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* 函数式告别 — 黑白天图像
 * 结局曲线：从左到右生长、关键点脉冲、拖动平移、滚轮缩放、双击复位、收束成点。
 * 分享卡片：纯 Canvas 绘制，包含 F(x) 图像、原理与三十次选择。
 */
(function (root) {
  'use strict';

  var DATA = root.FAREWELL_DATA;
  var Engine = root.FarewellEngine;
  var SERIF = '"Noto Serif SC", "Songti SC", STSong, serif';
  var SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  var MONO = 'ui-monospace, SFMono-Regular, Consolas, monospace';

  var GRID = '#ededed';
  var AXIS = '#c8c8c8';
  var LABEL = '#969696';
  var INK = '#000000';
  var DASH = '#9a9a9a';

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function quantile(arr, q) {
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (p, q2) { return p - q2; });
    var pos = (a.length - 1) * q;
    var lo = Math.floor(pos);
    var hi = Math.ceil(pos);
    if (lo === hi) return a[lo];
    return a[lo] + (a[hi] - a[lo]) * (pos - lo);
  }

  function fmt(v) {
    var a = Math.abs(v);
    if (a >= 1000) {
      var k = v / 1000;
      return (Number.isInteger(k) ? String(k) : k.toFixed(1)) + 'k';
    }
    if (Math.abs(v) < 1e-9) return '0';
    if (Number.isInteger(v)) return String(v);
    if (a >= 10) return v.toFixed(0);
    if (a >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }

  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / p;
    if (n <= 1) return p;
    if (n <= 2) return 2 * p;
    if (n <= 5) return 5 * p;
    return 10 * p;
  }

  function rangeFor(pts) {
    var ys = (pts || []).filter(function (p) { return Number.isFinite(p.y); })
      .map(function (p) { return p.y; });
    if (!ys.length) return { y0: -2, y1: 2, capped: false };
    var lo = quantile(ys, 0.02);
    var hi = quantile(ys, 0.98);
    if (lo > 0) lo = 0;
    if (hi < 0) hi = 0;
    var span = hi - lo;
    var capped = false;
    if (!(span > 0.0001)) {
      var mid = (hi + lo) / 2 || 0;
      lo = mid - 1;
      hi = mid + 1;
      span = 2;
    } else if (span > 18) {
      // 只有画布内确实能看到一段曲线时才裁剪到 [-6, 6]，
      // 否则（如 e^x 主导的 F）会整条曲线落在画面外，只剩空网格。
      var inside = 0;
      for (var i = 0; i < ys.length; i++) {
        if (ys[i] >= -6 && ys[i] <= 6) inside += 1;
      }
      if (inside >= Math.max(6, ys.length * 0.12)) {
        lo = -6;
        hi = 6;
        span = 12;
        capped = true;
      }
    }
    if (!capped) {
      var pad = span * 0.12;
      lo -= pad;
      hi += pad;
    }
    return { y0: lo, y1: hi, capped: capped };
  }

  // y 轴刻度：区间固定时用手写刻度，自适应区间时按 nice step 生成。
  function ticksFor(view) {
    if (!view) return Y_TICKS;
    if (Math.abs(view.y0 + 6) < 1e-6 && Math.abs(view.y1 - 6) < 1e-6) return Y_TICKS;
    var step = niceStep((view.y1 - view.y0) / 4);
    var out = [];
    var start = Math.ceil(view.y0 / step) * step;
    for (var v = start; v <= view.y1 + 1e-9; v += step) out.push(Number(v.toFixed(6)));
    return out.length ? out : Y_TICKS;
  }

  var FIXED_VIEW = { x0: 0, x1: 10, y0: -6, y1: 6 };
  var Y_TICKS = [-6, -4, -2, 0, 2, 4, 6];
  var RENDER_SAMPLES = 401;
  var RENDER_STEP = 0.025;

  // 结局渲染专用采样：401 点、步长 0.025；含 1/x 时 x<0.1 不画。
  // 不改动 Engine 的 101 点判定采样。
  function buildRenderPoints(ids, result) {
    if (result && result.pts && result.pts.length) return result.pts;
    if (!Array.isArray(ids) || !ids.length || !Engine || !Engine.composeAt) {
      return (result && result.pts) || [];
    }
    var hasF5 = ids.some(function (c) { return (typeof c === 'string' ? c : c.fn) === 'f5'; });
    var pts = [];
    for (var i = 0; i < RENDER_SAMPLES; i++) {
      var x = Number((i * RENDER_STEP).toFixed(3));
      var y = Engine.composeAt(ids, x);
      if (hasF5 && x < 0.1) y = NaN;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  function asymptotesOf(result) {
    var list = [];
    if (!result) return list;
    if (Array.isArray(result.asymptoteXs)) {
      result.asymptoteXs.forEach(function (x) {
        if (Number.isFinite(x) && list.indexOf(x) === -1) list.push(x);
      });
    }
    if (Number.isFinite(result.asymptoteX) && list.indexOf(result.asymptoteX) === -1) {
      list.push(result.asymptoteX);
    }
    return list;
  }

  function crossesBreak(result, a, b, asyms) {
    if (result.kind === 'jump' && Number.isFinite(result.jumpX)) {
      var j = result.jumpX;
      if ((a < j && b >= j) || (a >= j && b < j)) return true;
    }
    for (var i = 0; i < asyms.length; i++) {
      var ax = asyms[i];
      if ((a < ax && b >= ax) || (a >= ax && b < ax)) return true;
    }
    return false;
  }

  function makeMapper(W, H, view, pad) {
    var pw = W - pad.l - pad.r;
    var ph = H - pad.t - pad.b;
    return {
      x: function (x) { return pad.l + ((x - view.x0) / (view.x1 - view.x0)) * pw; },
      y: function (y) { return pad.t + ((view.y1 - y) / (view.y1 - view.y0)) * ph; },
      plotW: pw,
      plotH: ph
    };
  }

  function drawGrid(ctx, W, H, view, pad, scale, yTicks) {
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.font = (10 * scale) + 'px ' + MONO;
    ctx.fillStyle = LABEL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var stepX = niceStep((view.x1 - view.x0) / 5);
    var startX = Math.ceil(view.x0 / stepX) * stepX;
    for (var x = startX; x <= view.x1 + 1e-9; x += stepX) {
      var px = pad.l + ((x - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
      if (px < pad.l - 1 || px > W - pad.r + 1) continue;
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, H - pad.b);
      ctx.stroke();
      ctx.fillText(fmt(x), px, H - pad.b + 7 * scale);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var ys;
    if (Array.isArray(yTicks) && yTicks.length) {
      ys = yTicks;
    } else {
      ys = [];
      var stepY = niceStep((view.y1 - view.y0) / 4);
      var startY = Math.ceil(view.y0 / stepY) * stepY;
      for (var y = startY; y <= view.y1 + 1e-9; y += stepY) ys.push(y);
    }
    for (var yi = 0; yi < ys.length; yi++) {
      var yv = ys[yi];
      if (yv < view.y0 - 1e-9 || yv > view.y1 + 1e-9) continue;
      var py = pad.t + ((view.y1 - yv) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
      if (py < pad.t - 1 || py > H - pad.b + 1) continue;
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(W - pad.r, py);
      ctx.stroke();
      ctx.fillText(fmt(yv), pad.l - 7 * scale, py);
    }

    if (view.y0 < 0 && view.y1 > 0) {
      var zeroY = pad.t + ((view.y1 - 0) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
      ctx.strokeStyle = AXIS;
      ctx.beginPath();
      ctx.moveTo(pad.l, zeroY);
      ctx.lineTo(W - pad.r, zeroY);
      ctx.stroke();
    }
    if (view.x0 < 0 && view.x1 > 0) {
      var zeroX = pad.l + ((0 - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
      ctx.strokeStyle = AXIS;
      ctx.beginPath();
      ctx.moveTo(zeroX, pad.t);
      ctx.lineTo(zeroX, H - pad.b);
      ctx.stroke();
    }
    ctx.restore();
  }

  function traceCurve(ctx, result, map, plotH, ptsOverride) {
    var pts = ptsOverride || (result && result.pts) || [];
    var asyms = asymptotesOf(result);
    var prev = null;
    var open = false;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      // 函数式曲线固定 y ∈ [-6, 6]；参数图形则按锁定视野判断，不能裁到心形。
      // 参数图形用锁定视野，超出画布的部分由 canvas 自己裁掉，不再按 ±6 断开。
      var clipY = !(result && result.view) && Math.abs(p.y) > 6;
      if (!Number.isFinite(p.y) || clipY) {
        open = false;
        prev = null;
        continue;
      }
      var sx = map.x(p.x);
      var sy = map.y(p.y);
      if (prev && crossesBreak(result, prev.x, p.x, asyms)) {
        open = false;
      }
      if (prev && Math.abs(sy - prev.sy) > plotH * 0.92) {
        open = false;
      }
      if (!open) {
        ctx.moveTo(sx, sy);
        open = true;
      } else {
        ctx.lineTo(sx, sy);
      }
      prev = { x: p.x, sy: sy };
    }
    ctx.stroke();
  }

  function asymptoteText(x) {
    if (Math.abs(x) < 1e-6) return 'x → 0⁺';
    var poles = [
      Math.PI / 2, 3 * Math.PI / 2, 5 * Math.PI / 2,
      -Math.PI / 2, -3 * Math.PI / 2
    ];
    for (var i = 0; i < poles.length; i++) {
      if (Math.abs(x - poles[i]) < 0.005) {
        if (i === 0) return 'x → π/2';
        if (i === 1) return 'x → 3π/2';
        if (i === 2) return 'x → 5π/2';
        return 'x → −π/2';
      }
    }
    return 'x ≈ ' + fmt(x);
  }

  function findLimits(result, x) {
    var pts = (result && result.pts) || [];
    var left = null;
    var right = null;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!Number.isFinite(p.y)) continue;
      if (p.x < x - 1e-9) left = p;
      if (p.x >= x - 1e-9) { right = p; break; }
    }
    return { left: left, right: right };
  }

  function drawAnnotations(ctx, W, H, result, view, pad, scale, alpha) {
    if (!result || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = (9.5 * scale) + 'px ' + MONO;
    ctx.textBaseline = 'top';
    ctx.strokeStyle = DASH;
    ctx.fillStyle = '#676767';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    asymptotesOf(result).forEach(function (ax) {
      if (ax < view.x0 || ax > view.x1) return;
      var px = pad.l + ((ax - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
      ctx.strokeStyle = 'rgba(0,0,0,.32)';
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, H - pad.b);
      ctx.stroke();
      ctx.setLineDash([]);
      var label = asymptoteText(ax);
      var tw = ctx.measureText(label).width;
      var tx = clamp(px + 6, pad.l, W - pad.r - tw);
      ctx.fillText(label, tx, pad.t + 5 * scale);
      ctx.setLineDash([3, 4]);
    });

    if (result.kind === 'jump' && Number.isFinite(result.jumpX)) {
      var jx = result.jumpX;
      if (jx >= view.x0 && jx <= view.x1) {
        var lim = findLimits(result, jx);
        if (lim.left && lim.right) {
          var px = pad.l + ((jx - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
          var pyL = pad.t + ((view.y1 - lim.left.y) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
          var pyR = pad.t + ((view.y1 - lim.right.y) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
          var topY = Math.min(pyL, pyR);
          var bottomY = Math.max(pyL, pyR);
          if (bottomY - topY < 34 * scale) {
            var mid = (topY + bottomY) / 2;
            topY = mid - 17 * scale;
            bottomY = mid + 17 * scale;
          }
          topY = clamp(topY, pad.t + 2, H - pad.b - 2);
          bottomY = clamp(bottomY, pad.t + 2, H - pad.b - 2);
          ctx.strokeStyle = 'rgba(0,0,0,.58)';
          ctx.beginPath();
          ctx.moveTo(px, topY);
          ctx.lineTo(px, bottomY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = INK;
          if (lim.left.y >= view.y0 && lim.left.y <= view.y1) {
            ctx.beginPath();
            ctx.arc(px, pad.t + ((view.y1 - lim.left.y) / (view.y1 - view.y0)) * (H - pad.t - pad.b), 2.8 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
          if (lim.right.y >= view.y0 && lim.right.y <= view.y1) {
            ctx.beginPath();
            ctx.arc(px, pad.t + ((view.y1 - lim.right.y) / (view.y1 - view.y0)) * (H - pad.t - pad.b), 2.8 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#454545';
          var jumpLabel = '跳跃 · x = ' + fmt(jx);
          var jw = ctx.measureText(jumpLabel).width;
          var jtx = clamp(px + 7, pad.l, W - pad.r - jw);
          ctx.fillText(jumpLabel, jtx, pad.t + 5 * scale);
        }
      }
    }

    if (result.vertex && Number.isFinite(result.vertex.x) && Number.isFinite(result.vertex.y)) {
      var vx = result.vertex.x;
      var vy = result.vertex.y;
      if (vx >= view.x0 && vx <= view.x1 && vy >= view.y0 && vy <= view.y1) {
        var vpx = pad.l + ((vx - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
        var vpy = pad.t + ((view.y1 - vy) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
        ctx.setLineDash([]);
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.arc(vpx, vpy, 4 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#555';
        var vlabel = '顶点';
        var vw = ctx.measureText(vlabel).width;
        ctx.fillText(vlabel, clamp(vpx + 7, pad.l, W - pad.r - vw), clamp(vpy - 16 * scale, pad.t, H - pad.b));
      }
    }
    ctx.restore();
  }

  function drawPulses(ctx, W, H, result, view, pad, elapsed, scale) {
    if (!result || !elapsed) return;
    var cycle = (elapsed % 1500) / 1500;
    var alpha = Math.max(0, 1 - cycle);
    var points = (result.keyPoints || []).filter(function (p) {
      return Number.isFinite(p.x) && Number.isFinite(p.y) &&
        p.x >= view.x0 && p.x <= view.x1 && p.y >= view.y0 && p.y <= view.y1;
    });
    ctx.save();
    points.forEach(function (p) {
      var px = pad.l + ((p.x - view.x0) / (view.x1 - view.x0)) * (W - pad.l - pad.r);
      var py = pad.t + ((view.y1 - p.y) / (view.y1 - view.y0)) * (H - pad.t - pad.b);
      ctx.beginPath();
      ctx.arc(px, py, (2.4 + cycle * 15) * scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,' + (alpha * 0.5) + ')';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 1.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.55 + alpha * 0.35) + ')';
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPlotCore(ctx, W, H, result, view, options) {
    options = options || {};
    var pad = options.pad || { l: 42, r: 15, t: 16, b: 27 };
    var scale = options.scale || 1;
    var progress = options.progress == null ? 1 : clamp(options.progress, 0, 1);
    var map = makeMapper(W, H, view, pad);

    if (options.grid !== false) drawGrid(ctx, W, H, view, pad, scale, options.yTicks);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, Math.max(0, map.plotW * progress), map.plotH);
    ctx.clip();
    ctx.strokeStyle = INK;
    ctx.lineWidth = (options.lineWidth || 2) * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    traceCurve(ctx, result, map, map.plotH, options.pts);
    ctx.restore();

    var annAlpha = Math.max(0, Math.min(1, (progress - 0.55) / 0.45));
    if (options.annotations !== false) {
      drawAnnotations(ctx, W, H, result, view, pad, scale, annAlpha);
    }
    if (options.pulseElapsed) {
      drawPulses(ctx, W, H, result, view, pad, options.pulseElapsed, scale);
    }
  }

  function mount(canvas, result, options) {
    if (!canvas || !result) return null;
    options = options || {};
    var ctx = canvas.getContext('2d');
    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (err) { /* ignore */ }

    var dpr = 1;
    var W = 0;
    var H = 0;
    // 结局坐标固定：x [0,10]，y [-6,6]，不自动扩轴。
    var baseView = (result && result.view) ? result.view : FIXED_VIEW;
    var view = { x0: baseView.x0, x1: baseView.x1, y0: baseView.y0, y1: baseView.y1 };
    var home = { x0: baseView.x0, x1: baseView.x1, y0: baseView.y0, y1: baseView.y1 };
    var pad = { l: 42, r: 17, t: 17, b: 28 };
    var renderPts = (result && result.pts && result.pts.length) ? result.pts : buildRenderPoints(options.ids, result);
    var hasF5 = false;

    var drawT = 0;
    var animStart = 0;
    var pulseStart = 0;
    var raf = 0;
    var started = false;
    var destroyed = false;
    var drawCompleted = false;
    var collapsed = false;
    var collapseT = 0;
    var collapseAnim = null;

    var pointers = new Map();
    var drag = null;
    var pinch = null;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    }

    function dotRadius(t) { return 1 + 3.1 * t; }

    function paint(now) {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      if (collapseT > 0.0001) {
        var s = 1 - 0.988 * collapseT;
        ctx.translate(W / 2, H / 2);
        ctx.scale(s, s);
        ctx.translate(-W / 2, -H / 2);
      }
      var pulseElapsed = pulseStart ? now - pulseStart : 0;
      drawPlotCore(ctx, W, H, result, view, {
        pad: pad,
        progress: drawT,
        pulseElapsed: pulseElapsed,
        annotations: !(result && result.view),
        pts: renderPts,
        yTicks: ticksFor(view)
      });
      ctx.restore();

      if (collapseT > 0.0001) {
        ctx.save();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, dotRadius(collapseT), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function ensureLoop() {
      if (destroyed || reduced) return;
      if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    }

    function notifyDrawComplete() {
      if (destroyed || drawCompleted) return;
      drawCompleted = true;
      if (typeof options.onDrawComplete === 'function') options.onDrawComplete();
    }

    function loop(now) {
      raf = 0;
      var active = false;
      var justDrawn = false;

      if (animStart) {
        var t = Math.min(1, (now - animStart) / (options.duration || 1650));
        drawT = 1 - Math.pow(1 - t, 3);
        if (t < 1) {
          active = true;
        } else {
          drawT = 1;
          animStart = 0;
          justDrawn = true;
          if (!reduced && !options.noPulse) pulseStart = now;
          active = true;
        }
      }

      if (pulseStart) {
        if (now - pulseStart > 3900) {
          pulseStart = 0;
        } else {
          active = true;
        }
      }

      if (collapseAnim) {
        var c = Math.min(1, (now - collapseAnim.start) / collapseAnim.dur);
        var eased = c < 0.5
          ? 4 * c * c * c
          : 1 - Math.pow(-2 * c + 2, 3) / 2;
        collapseT = collapseAnim.from + (collapseAnim.to - collapseAnim.from) * eased;
        if (c >= 1) {
          collapseT = collapseAnim.to;
          var to = collapseAnim.to;
          collapseAnim = null;
          collapsed = to === 1;
          if (typeof options.onCollapseChange === 'function') options.onCollapseChange(collapsed);
        } else {
          active = true;
        }
      }

      paint(now);
      if (justDrawn) notifyDrawComplete();
      if (active) ensureLoop();
    }

    function start() {
      if (started || destroyed) return;
      started = true;
      if (reduced) {
        drawT = 1;
        paint(performance.now());
        notifyDrawComplete();
        return;
      }
      drawT = 0;
      animStart = performance.now();
      ensureLoop();
    }

    function stopAnimations() {
      animStart = 0;
      pulseStart = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function reset() {
      if (collapsed) return;
      view = { x0: home.x0, x1: home.x1, y0: home.y0, y1: home.y1 };
      stopAnimations();
      drawT = 1;
      paint(performance.now());
      notifyDrawComplete();
    }

    function clampView() {
      var span = view.x1 - view.x0;
      var min = -2;
      var max = 12;
      view.x0 = clamp(view.x0, min, max - span);
      if (view.x1 < view.x0 + span) view.x1 = view.x0 + span;
    }

    function zoomAt(factor, clientX) {
      var rect = canvas.getBoundingClientRect();
      var px = clamp(clientX - rect.left, pad.l, W - pad.r);
      var frac = (px - pad.l) / Math.max(1, W - pad.l - pad.r);
      var anchor = view.x0 + frac * (view.x1 - view.x0);
      var span = clamp((view.x1 - view.x0) * factor, 1.2, 40);
      view.x0 = anchor - frac * span;
      view.x1 = view.x0 + span;
      clampView();
      stopAnimations();
      drawT = 1;
      paint(performance.now());
      notifyDrawComplete();
    }

    function onWheel(e) {
      if (collapsed) return;
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1.2 : 0.83, e.clientX);
    }

    function onPointerDown(e) {
      if (collapsed) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (pointers.size === 1) {
        drag = { x: e.clientX, view0: view.x0, view1: view.x1 };
        canvas.classList.add('is-dragging');
      } else if (pointers.size === 2) {
        var arr = Array.from(pointers.values());
        pinch = {
          dist: Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y),
          view0: view.x0,
          view1: view.x1
        };
        drag = null;
      }
      stopAnimations();
      drawT = 1;
      paint(performance.now());
      notifyDrawComplete();
    }

    function onPointerMove(e) {
      if (collapsed || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && drag) {
        var dx = e.clientX - drag.x;
        var span = drag.view1 - drag.view0;
        var shift = -(dx / Math.max(1, W - pad.l - pad.r)) * span;
        view.x0 = drag.view0 + shift;
        view.x1 = view.x0 + span;
        clampView();
        paint(performance.now());
      } else if (pointers.size === 2 && pinch) {
        var arr = Array.from(pointers.values());
        var dist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        if (!dist) return;
        var factor = pinch.dist / dist;
        var span0 = pinch.view1 - pinch.view0;
        var rect = canvas.getBoundingClientRect();
        var midX = (arr[0].x + arr[1].x) / 2;
        var frac = clamp((midX - rect.left - pad.l) / Math.max(1, W - pad.l - pad.r), 0, 1);
        var nextSpan = clamp(span0 * factor, 1.2, 40);
        var anchor = pinch.view0 + frac * span0;
        view.x0 = anchor - frac * nextSpan;
        view.x1 = view.x0 + nextSpan;
        clampView();
        paint(performance.now());
      }
    }

    function onPointerUp(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        drag = null;
        canvas.classList.remove('is-dragging');
      } else if (pointers.size === 1) {
        var arr = Array.from(pointers.values());
        drag = { x: arr[0].x, view0: view.x0, view1: view.x1 };
      }
    }

    function onDblClick() {
      if (!collapsed) reset();
    }

    function collapse() {
      if (collapsed || collapseAnim) return;
      stopAnimations();
      drawT = 1;
      if (drawT < 0.2) drawT = 1;
      if (reduced) {
        collapseT = 1;
        collapsed = true;
        paint(performance.now());
        if (typeof options.onCollapseChange === 'function') options.onCollapseChange(true);
        return;
      }
      collapseAnim = { from: collapseT, to: 1, start: performance.now(), dur: 1150 };
      ensureLoop();
    }

    function expand() {
      if (!collapsed || collapseAnim) return;
      if (reduced) {
        collapseT = 0;
        collapsed = false;
        paint(performance.now());
        if (typeof options.onCollapseChange === 'function') options.onCollapseChange(false);
        return;
      }
      collapseAnim = { from: collapseT, to: 0, start: performance.now(), dur: 950 };
      ensureLoop();
    }

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('dblclick', onDblClick);

    var ro = null;
    if (root.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      root.addEventListener('resize', resize);
    }

    var io = null;
    if (root.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) {
          start();
          io.disconnect();
        }
      }, { threshold: 0.18 });
      io.observe(canvas);
    } else {
      start();
    }

    resize();

    return {
      reset: reset,
      start: start,
      collapse: collapse,
      expand: expand,
      isCollapsed: function () { return collapsed; },
      debug: function () {
        return {
          view: { x0: view.x0, x1: view.x1, y0: view.y0, y1: view.y1 },
          home: { x0: home.x0, x1: home.x1, y0: home.y0, y1: home.y1 },
          yTicks: Y_TICKS.slice(),
          sampleCount: renderPts.length,
          step: RENDER_STEP,
          startX: hasF5 ? 0.1 : 0,
          hasF5: hasF5,
          collapsed: collapsed,
          drawT: drawT,
          drawComplete: drawCompleted,
          reduced: reduced
        };
      },
      destroy: function () {
        destroyed = true;
        stopAnimations();
        if (ro) ro.disconnect();
        else root.removeEventListener('resize', resize);
        if (io) io.disconnect();
      }
    };
  }

  var HANG_PUNCT = '，。、；：！？）》」』”’…,.;:!?)';

  function wrapText(ctx, text, maxWidth, maxLines) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        // 中文禁则：句号、逗号等不能落到下一行行首，允许在行尾悬挂。
        if (HANG_PUNCT.indexOf(ch) !== -1) {
          line = test;
          continue;
        }
        lines.push(line);
        line = ch;
        if (lines.length === maxLines - 1) {
          var rest = text.slice(i);
          while (ctx.measureText(rest + '…').width > maxWidth && rest.length > 1) {
            rest = rest.slice(0, -1);
          }
          lines.push(rest + '…');
          return lines;
        }
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  var BREAK_AFTER = '，；。、！？：,;.!?:';

  // 卡片里的原理句按标点做一次平衡换行，避免最后一行只剩一两个字。
  function wrapBalanced(ctx, text, maxWidth, maxLines) {
    if (!text) return [];
    var total = ctx.measureText(text).width;
    var n = Math.max(1, Math.min(maxLines, Math.ceil(total / maxWidth)));
    if (n <= 1) return [text];

    var lines = [];
    var start = 0;
    for (var line = 0; line < n - 1; line++) {
      var remainingLines = n - line;
      var limit = text.length - (remainingLines - 1);
      var target = start + Math.round((text.length - start) / remainingLines);
      var best = -1;
      var bestDist = Infinity;
      for (var i = start; i < limit - 1; i++) {
        if (BREAK_AFTER.indexOf(text.charAt(i)) === -1) continue;
        var idx = i + 1;
        if (ctx.measureText(text.slice(start, idx)).width > maxWidth) continue;
        var dist = Math.abs(idx - target);
        if (dist < bestDist) {
          best = idx;
          bestDist = dist;
        }
      }
      if (best < 0) {
        best = start + 1;
        while (best < limit && ctx.measureText(text.slice(start, best + 1)).width <= maxWidth) {
          best += 1;
        }
      }
      lines.push(text.slice(start, best));
      start = best;
    }
    if (start < text.length) lines.push(text.slice(start));
    return lines;
  }

  function plainSigned(f) {
    if (!f) return '';
    var p = f.plain || f.tex || '';
    var neg = f.sign < 0 || p.charAt(0) === '-';
    if (p.charAt(0) === '-') p = p.slice(1);
    p = p
      .replace(/e\^\(-x\)/g, 'e⁻ˣ')
      .replace(/e\^x/g, 'eˣ')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/H\(x-5\.2\)/g, 'H(x−5.2)');
    return (neg ? '−' : '') + p;
  }

  function renderCard(canvas, opts) {
    if (!canvas || !opts || !opts.result || !opts.ending) return null;
    var ending = opts.ending;
    var funcs = opts.funcs || [];
    var S = 2;
    var LW = 900;
    var LH = 1200;
    canvas.width = LW * S;
    canvas.height = LH * S;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, LW, LH);

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.strokeRect(34.5, 34.5, LW - 69, LH - 69);

    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 18px ' + SERIF;
    ctx.fillText('函数式告别', 64, 84);
    ctx.font = '11px ' + MONO;
    ctx.fillStyle = '#777';
    ctx.textAlign = 'right';
    ctx.fillText('A FUNCTIONAL FAREWELL', LW - 64, 82);
    ctx.textAlign = 'left';

    ctx.beginPath();
    ctx.arc(LW - 64, 48, 5, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();

    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(64, 108);
    ctx.lineTo(LW - 64, 108);
    ctx.stroke();

    ctx.font = '12px ' + MONO;
    ctx.fillStyle = '#777';
    ctx.fillText('ENDING ' + (ending.order < 10 ? '0' + ending.order : ending.order) + ' / 06', 64, 150);

    ctx.font = '600 58px ' + SERIF;
    ctx.fillStyle = INK;
    ctx.fillText(ending.title, 64, 224);

    ctx.font = '16px ' + SANS;
    ctx.fillStyle = '#666';
    ctx.fillText(ending.shape, 64, 264);

    var plotRect = { x: 64, y: 304, w: 772, h: 286 };
    ctx.save();
    ctx.translate(plotRect.x, plotRect.y);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, plotRect.w, plotRect.h);
    var cardPts = buildRenderPoints(funcs, opts.result);
    drawPlotCore(ctx, plotRect.w, plotRect.h, opts.result, { x0: FIXED_VIEW.x0, x1: FIXED_VIEW.x1, y0: FIXED_VIEW.y0, y1: FIXED_VIEW.y1 }, {
      pad: { l: 50, r: 18, t: 22, b: 30 },
      scale: 1.18,
      progress: 1,
      lineWidth: 2.1,
      pts: cardPts,
      yTicks: Y_TICKS
    });
    ctx.strokeStyle = '#e2e2e2';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, plotRect.w - 1, plotRect.h - 1);
    ctx.font = '11px ' + MONO;
    ctx.fillStyle = '#8a8a8a';
    ctx.fillText('F(x)', 12, 18);
    ctx.restore();

    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(64, 652);
    ctx.lineTo(LW - 64, 652);
    ctx.stroke();

    ctx.font = '11px ' + MONO;
    ctx.fillStyle = '#7a7a7a';
    ctx.fillText('一句原理', 64, 686);

    ctx.font = '25px ' + SERIF;
    ctx.fillStyle = INK;
    var principleLines = wrapBalanced(ctx, ending.principle, 772, 3);
    principleLines.forEach(function (line, i) {
      ctx.fillText(line, 64, 734 + i * 42);
    });

    var afterPrinciple = 734 + principleLines.length * 42 + 24;

    ctx.font = '11px ' + MONO;
    ctx.fillStyle = '#7a7a7a';
    ctx.fillText('三十次选择', 64, afterPrinciple);

    var terms = funcs.map(function (id) {
      var f = DATA && DATA.functions[id];
      return f ? plainSigned(f) : '';
    }).filter(Boolean).join('   ·   ');

    ctx.font = '19px ' + SERIF;
    ctx.fillStyle = INK;
    var termLines = wrapText(ctx, terms, 772, 2);
    termLines.forEach(function (line, i) {
      ctx.fillText(line, 64, afterPrinciple + 34 + i * 29);
    });

    ctx.strokeStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.moveTo(64, 1084);
    ctx.lineTo(LW - 64, 1084);
    ctx.stroke();

    ctx.font = '10px ' + MONO;
    ctx.fillStyle = '#8a8a8a';
    ctx.textAlign = 'left';
    ctx.fillText('FUNCTION IS FATE.', 64, 1116);
    ctx.textAlign = 'right';
    ctx.fillText('函数式告别 · 2026', LW - 64, 1116);

    return canvas;
  }

  root.FarewellPlot = {
    mount: mount,
    renderCard: renderCard,
    rangeFor: rangeFor
  };
})(typeof window !== 'undefined' ? window : globalThis);

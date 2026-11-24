/* 函数式告别 — 背景水印
 * 一张全屏固定 Canvas：开场是极浅的函数水印；进入游戏后只保留一条累计 F(x)。
 * 每次选择：旧线 350ms 淡出并清空，新线 600ms 从屏幕中点向两侧长出。
 * 内存中同一时刻只有一条 F(x) 曲线；tan 与 1/x 在极点处断开。
 */
(function (root) {
  'use strict';

  var DATA = root.FAREWELL_DATA;
  var Engine = root.FarewellEngine;

  var X_MAX = 10;
  var Y_MIN = -6;
  var Y_MAX = 6;
  var LINE_WIDTH = 1.5;
  var FADE_MS = 350;
  var GROW_MS = 600;

  function create(canvas, options) {
    if (!canvas || !DATA || !Engine) return null;
    options = options || {};
    var ctx = canvas.getContext('2d');
    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (err) { /* ignore */ }

    var dpr = 1;
    var W = 0;
    var H = 0;
    var left = 0;
    var right = 0;
    var top = 0;
    var bottom = 0;

    var curves = buildCurves();
    var introAlpha = 0;
    var introTarget = 1;
    var introDim = 1;
    var introDimTarget = 1;
    var fade = 1;
    var fadeTarget = 1;

    // 只有一条 F(x) 曲线；切换时先保存下一组 id，旧线清空后才生成新线。
    var fCurrent = null;
    var fPendingIds = null;
    var fPhase = 'idle'; // idle | fade | grow
    var fStart = 0;
    var fProgress = 1;

    var raf = 0;
    var lastPaint = 0;
    var destroyed = false;

    function xToPx(x) {
      return left + ((x - 0) / X_MAX) * (right - left);
    }

    function yToPx(y) {
      return top + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (bottom - top);
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      left = -W * 0.06;
      right = W * 1.06;
      top = H * 0.075;
      bottom = H * 0.925;
      paint();
    }

    function buildCurves() {
      var specs = [
        { fn: 'f1', base: 0.07, phase: 0.4, ax: 12, ay: 5, sp: 0.000075, offset: 0, scale: 0.88 },
        { fn: 'f4', base: 0.085, phase: 1.7, ax: 10, ay: 7, sp: 0.000061, offset: 0.4, scale: 3.25 },
        { fn: 'f10', base: 0.065, phase: 3.1, ax: 14, ay: 5, sp: 0.000052, offset: -0.3, scale: 2.7 },
        { fn: 'f15', base: 0.08, phase: 0.9, ax: 9, ay: 4, sp: 0.000043, offset: 0, scale: 1.5 },
        { fn: 'f3', base: 0.09, phase: 2.2, ax: 11, ay: 8, sp: 0.000068, offset: -4.4, scale: 9 },
        { fn: 'f5', base: 0.06, phase: 4.4, ax: 8, ay: 6, sp: 0.000038, offset: 0.6, scale: 4.6 },
        { fn: 'f6', base: 0.075, phase: 5.2, ax: 13, ay: 6, sp: 0.000055, offset: 3.1, scale: -0.115, shift: 2.1 },
        { fn: 'f7', base: 0.07, phase: 2.8, ax: 10, ay: 5, sp: 0.000048, offset: -3.7, scale: 3.1 },
        { fn: 'f9', base: 0.06, phase: 3.6, ax: 7, ay: 4, sp: 0.000032, offset: 0, scale: 1 },
        { fn: 'f11', base: 0.06, phase: 1.2, ax: 12, ay: 5, sp: 0.000051, offset: -4.6, scale: 0.12, shift: 7.8 },
        { fn: 'f13', base: 0.075, phase: 5.7, ax: 9, ay: 7, sp: 0.000044, offset: -4.8, scale: 3.1 },
        { fn: 'f14', base: 0.08, phase: 0.1, ax: 11, ay: 6, sp: 0.000057, offset: -3.2, scale: 0.72, shift: 4.8 }
      ];
      return specs.map(function (s, i) {
        s.hl = 0;
        s.hlTarget = 0;
        s.seed = i * 1.73;
        return s;
      });
    }

    function valueOf(fn, x) {
      if (fn === 'f15') {
        if (Math.abs(Math.cos(x)) < 0.018) return NaN;
        return Math.tan(x);
      }
      return Engine.evalFn(fn, x);
    }

    function curveValue(spec, x) {
      var raw = valueOf(spec.fn, x);
      if (!Number.isFinite(raw)) return NaN;
      if (spec.fn === 'f1') return (x - 5) * spec.scale;
      if (spec.fn === 'f4') return spec.offset + spec.scale * Math.sin(x * 0.92 + 0.6);
      if (spec.fn === 'f10') return spec.offset + spec.scale * Math.cos(x * 0.78 - 0.4);
      if (spec.fn === 'f15') return raw * 1.5;
      if (spec.fn === 'f3') return spec.offset + spec.scale * Math.exp(-x * 0.55);
      if (spec.fn === 'f5') return spec.offset + spec.scale / (x - 5);
      if (spec.fn === 'f6') return spec.offset + spec.scale * Math.pow(x - spec.shift, 2);
      if (spec.fn === 'f7') return spec.offset + spec.scale * Math.log(x + 0.8);
      if (spec.fn === 'f9') return x >= 5.2 ? 3.1 : -3.1;
      if (spec.fn === 'f11') return spec.offset + spec.scale * Math.pow(x - spec.shift, 2);
      if (spec.fn === 'f13') return spec.offset + spec.scale * Math.sqrt(x);
      if (spec.fn === 'f14') return spec.offset + spec.scale * Math.abs(x - spec.shift);
      return raw;
    }

    function shouldBreak(spec, a, b) {
      if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
      if (a < Y_MIN - 0.01 || a > Y_MAX + 0.01 || b < Y_MIN - 0.01 || b > Y_MAX + 0.01) return true;
      if (spec.fn === 'f15' || spec.fn === 'f5') {
        if ((a < 0) !== (b < 0) && Math.abs(a - b) > 3) return true;
      }
      if (spec.fn === 'f9' && ((a < 0 && b >= 0) || (a >= 0 && b < 0))) return true;
      if (Math.abs(a - b) > (Y_MAX - Y_MIN) * 0.72) return true;
      return false;
    }

    function trace(points, alpha) {
      if (alpha <= 0.002) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      var open = false;
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (!p.ok) { open = false; continue; }
        if (!open) { ctx.moveTo(p.x, p.y); open = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawCurve(spec, now, maxHl) {
      var pts = [];
      var N = 230;
      var driftX = Math.sin(now * spec.sp + spec.phase) * spec.ax;
      var driftY = Math.cos(now * spec.sp * 0.77 + spec.seed) * spec.ay;
      var prevVal = NaN;
      for (var i = 0; i <= N; i++) {
        var x = (i / N) * X_MAX;
        var v = curveValue(spec, x);
        var ok = Number.isFinite(v) && v >= Y_MIN - 0.01 && v <= Y_MAX + 0.01;
        var broken = ok && shouldBreak(spec, prevVal, v);
        if (ok) prevVal = v;
        else prevVal = NaN;
        pts.push({
          x: xToPx(x) + driftX,
          y: ok ? yToPx(v) + driftY : 0,
          ok: ok && !broken
        });
      }

      var hl = spec.hl;
      var otherDim = 1 - 0.52 * maxHl;
      // Canvas 本身 opacity 0.07；这里用接近 1 的 alpha 保证水印可见但极浅。
      var alpha = (0.5 + 0.5 * hl) * introAlpha * introDim * fade;
      if (hl < 0.15) alpha *= otherDim;
      if (alpha > 0.004) trace(pts, alpha);
    }

    function yToPxIn(y, range) {
      return top + ((range.y1 - y) / (range.y1 - range.y0)) * (bottom - top);
    }

    function chooseFRange(samples) {
      var ys = [];
      for (var i = 0; i < samples.length; i++) {
        if (Number.isFinite(samples[i].y)) ys.push(samples[i].y);
      }
      var inside = 0;
      for (var j = 0; j < ys.length; j++) {
        if (ys[j] >= Y_MIN && ys[j] <= Y_MAX) inside += 1;
      }
      if (inside >= 2) return { y0: Y_MIN, y1: Y_MAX, adaptive: false };
      if (!ys.length) return { y0: Y_MIN, y1: Y_MAX, adaptive: false };

      var sorted = ys.slice().sort(function (a, b) { return a - b; });
      var q = function (t) {
        var pos = (sorted.length - 1) * t;
        var lo = Math.floor(pos);
        var hi = Math.ceil(pos);
        return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
      };
      var lo = q(0.02);
      var hi = q(0.98);
      if (lo > 0) lo = 0;
      if (hi < 0) hi = 0;
      var span = hi - lo;
      if (!(span > 1e-6)) {
        var mid = (hi + lo) / 2 || 0;
        lo = mid - 1;
        hi = mid + 1;
      } else {
        var pad = span * 0.1;
        lo -= pad;
        hi += pad;
      }
      return { y0: lo, y1: hi, adaptive: true };
    }

    function makeFPath(ids) {
      var pts = [];
      var asymptotes = [];
      var result = Engine.classify(ids);
      if (result && result.kind === 'asymptote' && result.asymptoteXs) asymptotes = result.asymptoteXs;
      var jumpX = null;
      if (result && result.kind === 'jump' && Number.isFinite(result.jumpX)) jumpX = result.jumpX;

      var samples = Engine.sample(ids);
      var range = chooseFRange(samples);
      for (var i = 0; i < samples.length; i++) {
        var p = samples[i];
        var prev = samples[i - 1];
        var ok = Number.isFinite(p.y) && p.y >= range.y0 - 0.01 && p.y <= range.y1 + 0.01;
        if (ok && prev) {
          if (!Number.isFinite(prev.y)) ok = false;
          else if (Math.abs(prev.y - p.y) > (range.y1 - range.y0) * 0.6) ok = false;
          else {
            for (var a = 0; a < asymptotes.length; a++) {
              if ((prev.x < asymptotes[a] && p.x >= asymptotes[a]) ||
                  (prev.x >= asymptotes[a] && p.x < asymptotes[a])) { ok = false; break; }
            }
            if (jumpX != null && ((prev.x < jumpX && p.x >= jumpX) || (prev.x >= jumpX && p.x < jumpX))) ok = false;
          }
        }
        pts.push({
          x: p.x,
          y: p.y,
          ok: ok,
          sx: xToPx(p.x),
          sy: yToPxIn(ok ? p.y : 0, range)
        });
      }
      return { pts: pts, ids: ids.slice(), range: range };
    }

    function drawFPath(path, alpha, clipHalf) {
      if (!path || alpha <= 0.002) return;
      ctx.save();
      if (clipHalf != null) {
        ctx.beginPath();
        ctx.rect(W / 2 - clipHalf, 0, clipHalf * 2, H);
        ctx.clip();
      }
      ctx.globalAlpha = alpha * fade;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      var open = false;
      for (var i = 0; i < path.pts.length; i++) {
        var p = path.pts[i];
        if (!p.ok) { open = false; continue; }
        if (!open) { ctx.moveTo(p.sx, p.sy); open = true; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    function paint() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      var now = performance.now();
      var maxHl = 0;
      for (var i = 0; i < curves.length; i++) {
        if (curves[i].hl > maxHl) maxHl = curves[i].hl;
      }

      if (introAlpha > 0.003 && curves.length) {
        var ordered = curves.slice().sort(function (a, b) { return a.hl - b.hl; });
        for (var c = 0; c < ordered.length; c++) {
          drawCurve(ordered[c], now, maxHl);
        }
      }

      if (fCurrent) {
        if (fPhase === 'fade') {
          drawFPath(fCurrent, 1 - fProgress, null);
        } else if (fPhase === 'grow') {
          drawFPath(fCurrent, 1, fProgress * (W / 2));
        } else {
          drawFPath(fCurrent, 1, null);
        }
      }
    }

    function tick(now) {
      if (destroyed) return;
      raf = requestAnimationFrame(tick);
      if (now - lastPaint < 32) return;
      var dt = Math.min(48, now - (lastPaint || now));
      lastPaint = now;

      var k = reduced ? 1 : Math.min(1, dt * 0.0065);
      introAlpha += (introTarget - introAlpha) * k;
      introDim += (introDimTarget - introDim) * k;
      fade += (fadeTarget - fade) * (reduced ? 1 : Math.min(1, dt * 0.0045));

      if (introTarget === 0 && introAlpha < 0.003 && curves.length) {
        curves.length = 0;
      }

      if (fPhase === 'fade') {
        fProgress = Math.min(1, (now - fStart) / FADE_MS);
        if (fProgress >= 1) {
          ctx.clearRect(0, 0, W, H);
          fCurrent = null;
          if (fPendingIds) {
            fCurrent = makeFPath(fPendingIds);
            fPendingIds = null;
            fPhase = 'grow';
            fStart = now;
            fProgress = 0;
          } else {
            fPhase = 'idle';
            fProgress = 1;
          }
        }
      } else if (fPhase === 'grow') {
        fProgress = Math.min(1, (now - fStart) / GROW_MS);
        if (fProgress >= 1) {
          fPhase = 'idle';
          fProgress = 1;
        }
      }

      for (var i = 0; i < curves.length; i++) {
        var c = curves[i];
        c.hl += (c.hlTarget - c.hl) * (reduced ? 1 : Math.min(1, dt * 0.0055));
      }
      paint();
    }

    function ensureLoop() {
      if (destroyed) return;
      if (reduced) { paint(); return; }
      if (!raf) {
        lastPaint = 0;
        raf = requestAnimationFrame(tick);
      }
    }

    function highlight(fnIds) {
      var list = Array.isArray(fnIds) ? fnIds : [];
      for (var i = 0; i < curves.length; i++) {
        curves[i].hlTarget = list.indexOf(curves[i].fn) !== -1 ? 1 : 0;
      }
      ensureLoop();
    }

    function dimIntro(on) {
      introDimTarget = on ? 0.56 : 1;
      if (reduced) {
        introDim = introDimTarget;
        paint();
        return;
      }
      ensureLoop();
    }

    function showFunction(ids) {
      var list = Array.isArray(ids) ? ids.slice() : [];
      introTarget = 0;
      if (reduced) {
        fPendingIds = null;
        fCurrent = makeFPath(list);
        fPhase = 'idle';
        fProgress = 1;
        paint();
        return;
      }
      if (fCurrent) {
        fPendingIds = list;
        if (fPhase !== 'fade') {
          fPhase = 'fade';
          fStart = performance.now();
          fProgress = 0;
        }
      } else {
        // 第一次选择也先走 350ms 淡出（开场水印让位），再长出新 F(x)。
        fPendingIds = list;
        fPhase = 'fade';
        fStart = performance.now();
        fProgress = 0;
      }
      ensureLoop();
    }

    function reset() {
      fPendingIds = null;
      fCurrent = null;
      fPhase = 'idle';
      fProgress = 1;
      introTarget = 1;
      introAlpha = reduced ? 1 : 0;
      introDim = 1;
      introDimTarget = 1;
      fadeTarget = 1;
      curves = buildCurves();
      ctx.clearRect(0, 0, W, H);
      ensureLoop();
    }

    function setEnding(on) {
      fadeTarget = on ? 0.34 : 1;
      ensureLoop();
    }

    var ro = null;
    if (root.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      root.addEventListener('resize', resize);
    }
    resize();
    introAlpha = reduced ? 1 : 0;
    ensureLoop();

    return {
      highlight: highlight,
      dimIntro: dimIntro,
      showFunction: showFunction,
      reset: reset,
      setEnding: setEnding,
      refresh: paint,
      debug: function () {
        return {
          introAlpha: introAlpha,
          introTarget: introTarget,
          introDim: introDim,
          introDimTarget: introDimTarget,
          fade: fade,
          fadeTarget: fadeTarget,
          fPhase: fPhase,
          fProgress: fProgress,
          fCount: fCurrent ? 1 : 0,
          hasPendingIds: !!fPendingIds,
          introCurveCount: curves.length,
          lineWidth: LINE_WIDTH,
          canvasOpacity: 0.07,
          fadeMs: FADE_MS,
          growMs: GROW_MS,
          currentRange: fCurrent ? fCurrent.range : null,
          raf: raf,
          reduced: reduced
        };
      },
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        else root.removeEventListener('resize', resize);
      }
    };
  }

  root.FarewellAtmosphere = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
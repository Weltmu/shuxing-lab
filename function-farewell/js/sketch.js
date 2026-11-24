/* 手绘笔触生成器（纯代码，无依赖）
 * 移植自 javascript-animation skill 的 ink 技法：
 *  - 点列重采样 → 双频噪声抖动 → 二次贝塞尔 → 两遍描边(第二遍更细更淡)
 *  - 输出 SVG 路径字符串，用于场景线稿与物件图标
 */
(function (root) {
  'use strict';

  function hash2(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return h - Math.floor(h);
  }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    function lerp(a, b, t) { return a + (b - a) * t; }
    return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
  }
  function jit(x, y, seed, amp) {
    var s = seed * 13.37;
    return [
      x + (vnoise(x * 0.012 + s, y * 0.012) - 0.5) * 2 * amp + (vnoise(x * 0.09 + s, y * 0.09 + 7) - 0.5) * amp * 0.6,
      y + (vnoise(x * 0.012, y * 0.012 + s + 50) - 0.5) * 2 * amp + (vnoise(x * 0.09 + 3, y * 0.09 + s) - 0.5) * amp * 0.6
    ];
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function resample(pts, step, closed) {
    step = step || 9;
    var out = [], P = closed ? pts.concat([pts[0]]) : pts, i, k, n;
    for (i = 0; i < P.length - 1; i++) {
      var x0 = P[i][0], y0 = P[i][1], x1 = P[i + 1][0], y1 = P[i + 1][1];
      n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (k = 0; k < n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
    }
    if (!closed) out.push(P[P.length - 1]);
    return out;
  }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function pathD(pts, closed) {
    if (!pts.length) return '';
    if (pts.length < 3) {
      return 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + (closed ? ' Z' : '');
    }
    var P = closed ? pts.concat([pts[0], pts[1]]) : pts;
    var m = mid(P[0], P[1]);
    var d = 'M' + m[0].toFixed(2) + ' ' + m[1].toFixed(2);
    for (var i = 1; i < P.length - 1; i++) {
      var c = P[i], n = mid(P[i], P[i + 1]);
      d += ' Q' + c[0].toFixed(2) + ' ' + c[1].toFixed(2) + ' ' + n[0].toFixed(2) + ' ' + n[1].toFixed(2);
    }
    if (closed) d += ' Z';
    else d += ' L' + P[P.length - 1][0].toFixed(2) + ' ' + P[P.length - 1][1].toFixed(2);
    return d;
  }
  function J(pts, seed, amp) {
    return pts.map(function (p) { return jit(p[0], p[1], seed, amp); });
  }

  // 基础形状点列
  function line(x0, y0, x1, y1) { return resample([[x0, y0], [x1, y1]], 10); }
  function rect(x, y, w, h) { return resample([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 12, true); }
  function poly(pts, closed) { return resample(pts, 10, !!closed); }
  function ellipsePts(cx, cy, rx, ry, a0, a1) {
    a0 = a0 === undefined ? 0 : a0; a1 = a1 === undefined ? Math.PI * 2 : a1;
    var n = Math.max(18, Math.round(Math.max(rx, ry) * 0.5)), out = [];
    for (var i = 0; i <= n; i++) {
      var a = lerp(a0, a1, i / n);
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return resample(out, 9, Math.abs(a1 - a0) >= Math.PI * 1.99);
  }

  // 一笔墨线：两遍描边
  function ink(pts, o) {
    o = o || {};
    var w = o.w || 2, col = o.col || 'currentColor', amp = o.amp == null ? 1.6 : o.amp,
        seed = o.seed || 1, passes = o.passes == null ? 2 : o.passes, closed = !!o.closed,
        alpha = o.alpha == null ? 1 : o.alpha, dash = o.dash || '';
    var out = '';
    for (var p = 0; p < passes; p++) {
      var jp = J(pts, seed + p * 0.41, amp * (p ? 1.4 : 1));
      var a = alpha * (p ? 0.5 : 1), lw = w * (p ? 0.55 : 1);
      out += '<path d="' + pathD(jp, closed) + '" fill="none" stroke="' + col + '" stroke-width="' + lw.toFixed(2) +
        '" stroke-linecap="round" stroke-linejoin="round" opacity="' + a.toFixed(2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    }
    return out;
  }
  // 排线（阴影）
  function hatch(pts, o) {
    o = o || {};
    var gap = o.gap || 11, col = o.col || 'currentColor', w = o.w || 1.1, alpha = o.alpha == null ? 0.3 : o.alpha,
        angle = o.angle == null ? -0.9 : o.angle, seed = o.seed || 5;
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var R = Math.hypot(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) / 2 + 10;
    var id = 'h' + Math.abs(Math.round(cx * 7 + cy * 13 + seed)) % 100000;
    var out = '<clipPath id="' + id + '"><path d="' + pathD(J(pts, seed, 1.2), true) + '"/></clipPath>';
    out += '<g clip-path="url(#' + id + ')" opacity="' + alpha + '">';
    var cos = Math.cos(angle), sin = Math.sin(angle);
    for (var y = -R, i = 0; y < R; y += gap, i++) {
      var a = hash2(i, seed) * 4 - 2, b = hash2(i + 99, seed) * 4 - 2;
      var p0 = [cx + (-R) * cos - (y + a) * sin, cy + (-R) * sin + (y + a) * cos];
      var p2 = [cx + R * cos - (y + b) * sin, cy + R * sin + (y + b) * cos];
      out += '<path d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) +
        '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    }
    out += '</g>';
    return out;
  }

  var api = {
    hash2: hash2, jit: jit, resample: resample, pathD: pathD, J: J,
    line: line, rect: rect, poly: poly, ellipse: ellipsePts, ink: ink, hatch: hatch
  };
  root.SKETCH = api;
})(typeof window !== 'undefined' ? window : globalThis);

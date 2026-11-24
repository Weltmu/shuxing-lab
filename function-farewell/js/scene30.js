/* 函数式告别 · 30 幕独立手绘线稿场景（纯代码）
 * 每一幕有自己的环境构图和三个物件，不复用同一张场景图。
 * 笔触来自 SKETCH.ink（双频抖动 + 两遍描边），物件带落地投影。
 * 背景空间 1200×720；物件图标 200×200，地面线 y≈186。
 */
(function (root) {
  'use strict';
  var A = root.FAREWELL_ART, S = root.SKETCH;
  if (!A || !S) return;

  var W = 1200, H = 720;
  function K(pts, o) { return S.ink(pts, o); }
  function L(x0, y0, x1, y1, o) { return S.ink(S.line(x0, y0, x1, y1), o || { w: 1.1, seed: 11 }); }
  function R(x, y, w, h, o) { return S.ink(S.rect(x, y, w, h), o || { w: 1.2, seed: 12 }); }
  function E(cx, cy, rx, ry, a0, a1, o) {
    if (a0 && typeof a0 === 'object') { o = a0; a0 = 0; a1 = Math.PI * 2; }
    return S.ink(S.ellipse(cx, cy, rx, ry, a0, a1), o || { w: 1.2, seed: 13 });
  }
  function POLY(pts, closed, o) { return S.ink(S.poly(pts, closed), o || { w: 1.2, seed: 14 }); }
  function HATCH(pts, o) { return S.hatch(S.poly(pts, true), o || { gap: 13, alpha: 0.14, seed: 15 }); }

  /* ================= 物件图标（200×200，底部落地投影） ================= */
  function ground(gy) {
    gy = gy || 184;
    return S.hatch(S.ellipse(100, gy, 60, 8), { gap: 6, alpha: 0.24, seed: 77 }) +
      S.ink(S.ellipse(100, gy, 62, 9, 0, Math.PI), { w: 1, amp: 1, seed: 78, passes: 1, alpha: 0.55 });
  }
  function I(body, gy) { return body + ground(gy); }


  // —— 平放在桌面/地面上的物件：按透视求四个角（上边更窄更远），再补厚度与投影 ——
  function flatQuad(cx, cy, w, h, taper, skew) {
    taper = taper == null ? 0.16 : taper;
    skew = skew || 0;
    var half = w / 2, halfFar = half * (1 - taper);
    var bottomL = [cx - half, cy], bottomR = [cx + half, cy];
    var topL = [cx - halfFar + skew, cy - h], topR = [cx + halfFar + skew, cy - h];
    return { topL: topL, topR: topR, bottomR: bottomR, bottomL: bottomL };
  }
  function flatBody(q) {
    return [[q.topL[0], q.topL[1]], [q.topR[0], q.topR[1]], [q.bottomR[0], q.bottomR[1]], [q.bottomL[0], q.bottomL[1]]];
  }
  function flatThickness(q, layer, seed) {
    var d = layer || 6, out = '';
    out += S.ink(S.poly([[q.bottomL[0], q.bottomL[1]], [q.bottomR[0], q.bottomR[1]],
      [q.bottomR[0], q.bottomR[1] + d], [q.bottomL[0], q.bottomL[1] + d]], true), { w: 1.4, amp: 0.9, seed: seed, passes: 1 });
    out += S.hatch(S.poly([q.bottomL, q.bottomR, [q.bottomR[0], q.bottomR[1] + d], [q.bottomL[0], q.bottomL[1] + d]], true),
      { gap: 6, alpha: 0.2, seed: seed + 1 });
    return out;
  }
  var ICON = {};
  ICON.cup = I(K(S.ellipse(96, 92, 40, 13), { w: 2.2, seed: 201 }) +
    K(S.poly([[58, 92], [66, 146], [126, 146], [134, 92]], false), { w: 2.4, seed: 202 }) +
    K(S.ellipse(136, 112, 18, 14, -1.3, 1.5), { w: 2, seed: 203 }), 152);
  ICON.glass = I(K(S.ellipse(100, 84, 26, 9), { w: 2.1, seed: 205 }) +
    K(S.poly([[74, 84], [80, 150], [120, 150], [126, 84]], false), { w: 2.3, seed: 206 }), 154);
  ICON.note = I((function () { var q = flatQuad(100, 158, 142, 52, 0.2, -6); return K(S.poly(flatBody(q), true), { w: 2.5, seed: 211 }) +   K(S.poly([q.topR, [q.topR[0] - 26, q.topR[1] + 3], [q.topR[0] - 22, q.topR[1] + 20]], false), { w: 1.6, seed: 212 }) +   K(S.line(q.topL[0] + 12, q.topL[1] + 16, q.topR[0] - 16, q.topR[1] + 16), { w: 1.4, seed: 213 }) +   K(S.line(q.topL[0] + 12, q.topL[1] + 26, q.topR[0] - 14, q.topR[1] + 26), { w: 1.4, seed: 214 }) +   K(S.line(q.topL[0] + 12, q.topL[1] + 36, q.topL[0] + 56, q.topL[1] + 38), { w: 1.3, seed: 215 }) +   flatThickness(q, 6, 216); })(), 176);
  ICON.letter = I((function () { var q = flatQuad(100, 160, 146, 54, 0.18, -5); return K(S.poly(flatBody(q), true), { w: 2.5, seed: 215 }) +   K(S.poly([q.bottomL, [100, q.bottomL[1] - 34], q.bottomR], false), { w: 1.8, seed: 216 }) +   K(S.ellipse(100, q.bottomL[1] - 20, 10, 4), { w: 1.2, seed: 217 }) +   flatThickness(q, 5, 218); })(), 174);
  ICON.book = I(K(S.poly([[40, 66], [100, 54], [160, 66], [160, 140], [100, 128], [40, 140]], true), { w: 2.3, seed: 221 }) +
    K(S.line(100, 54, 100, 128), { w: 1.8, seed: 222 }) +
    K(S.line(56, 82, 92, 74), { w: 1.2, seed: 223 }) + K(S.line(56, 102, 92, 94), { w: 1.2, seed: 224 }), 144);
  ICON.chair = I(K(S.poly([[62, 34], [138, 28], [146, 146], [70, 152]], true), { w: 2.3, seed: 231 }) +
    K(S.line(78, 90, 132, 86), { w: 1.5, seed: 232 }), 156);
  ICON.bench = I(K(S.poly([[32, 108], [168, 100], [168, 128], [32, 136]], true), { w: 2.3, seed: 235 }) +
    K(S.poly([[38, 74], [168, 66], [168, 100], [38, 108]], true), { w: 2.1, seed: 236 }) +
    K(S.line(44, 78, 44, 100), { w: 1, seed: 237, passes: 1 }) + K(S.line(100, 74, 100, 98), { w: 1, seed: 238, passes: 1 }) + K(S.line(156, 70, 156, 96), { w: 1, seed: 239, passes: 1 }) +
    K(S.line(40, 136, 34, 180), { w: 2.1, seed: 240 }) + K(S.line(164, 128, 170, 172), { w: 2.1, seed: 249 }), 180);
  ICON.lamp = I(K(S.line(96, 178, 100, 68), { w: 2.4, amp: 1.3, seed: 241 }) +
    K(S.ellipse(120, 58, 24, 9, Math.PI, Math.PI * 2), { w: 2, seed: 242 }) +
    K(S.line(96, 58, 90, 72), { w: 1.6, seed: 243 }) + K(S.line(144, 58, 150, 72), { w: 1.6, seed: 244 }) +
    K(S.line(90, 72, 150, 72), { w: 1.6, seed: 245 }), 182);
  ICON.tree = I(K(S.line(100, 178, 98, 104), { w: 2.4, amp: 1.4, seed: 251 }) +
    K(S.ellipse(100, 76, 50, 42), { w: 2.2, seed: 252 }) +
    K(S.ellipse(76, 54, 26, 20), { w: 1.5, seed: 253 }) + K(S.ellipse(126, 50, 24, 18), { w: 1.5, seed: 254 }), 182);
  ICON.clock = I(K(S.ellipse(100, 96, 52, 52), { w: 2.4, seed: 261 }) +
    K(S.line(100, 96, 100, 60), { w: 2.1, seed: 262 }) + K(S.line(100, 96, 130, 108), { w: 2.1, seed: 263 }) +
    K(S.ellipse(100, 96, 7, 7), { w: 1.3, seed: 264 }), 152);
  ICON.door = I(K(S.rect(56, 32, 88, 146), { w: 2.4, seed: 271 }) +
    K(S.ellipse(126, 108, 6, 6), { w: 1.7, seed: 272 }) +
    K(S.rect(70, 46, 60, 46), { w: 1.3, seed: 273 }), 182);
  ICON.key = I(K(S.ellipse(66, 80, 22, 22), { w: 2.2, seed: 281 }) +
    K(S.line(84, 96, 138, 150), { w: 2.2, seed: 282 }) +
    K(S.line(118, 130, 132, 116), { w: 1.9, seed: 283 }), 152);
  ICON.umbrella = I(K(S.ellipse(100, 82, 62, 36, Math.PI, Math.PI * 2), { w: 2.3, seed: 291 }) +
    K(S.line(100, 82, 100, 158), { w: 2.2, seed: 292 }) +
    K(S.ellipse(86, 158, 14, 9, Math.PI, Math.PI * 2), { w: 2, seed: 293 }), 170);
  ICON.light = I(K(S.line(100, 184, 100, 92), { w: 2.4, seed: 301 }) +
    K(S.rect(72, 22, 56, 72), { w: 2.2, seed: 302 }) +
    K(S.ellipse(100, 42, 10, 10), { w: 1.7, seed: 303 }) + K(S.ellipse(100, 60, 10, 10), { w: 1.7, seed: 304 }) + K(S.ellipse(100, 78, 10, 10), { w: 1.7, seed: 305 }), 188);
  ICON.moon = I(K(S.ellipse(104, 92, 52, 52), { w: 2.3, seed: 311 }) +
    K(S.ellipse(126, 82, 30, 40), { w: 1.4, seed: 312 }), 148);
  ICON.railing = I(K(S.line(22, 70, 178, 70), { w: 2.4, seed: 321 }) +
    K(S.line(22, 122, 178, 122), { w: 2.1, seed: 322 }) +
    K(S.line(48, 70, 48, 122), { w: 1.9, seed: 323 }) + K(S.line(100, 70, 100, 122), { w: 1.9, seed: 324 }) + K(S.line(152, 70, 152, 122), { w: 1.9, seed: 325 }), 126);
  ICON.phone = I((function () {
    var q = flatQuad(100, 168, 152, 40, 0.18, -6);
    var inner = flatQuad(100, 164, 128, 28, 0.18, -6);
    return K(S.poly(flatBody(q), true), { w: 2.5, seed: 331 }) +
      K(S.poly(flatBody(inner), true), { w: 1.3, seed: 332 }) +
      K(S.ellipse(q.topL[0] + 18, q.topL[1] + 10, 4, 3), { w: 1.2, seed: 333 }) +
      K(S.line(q.topL[0] + 34, q.topL[1] + 6, q.topR[0] - 16, q.topR[1] + 6), { w: 1, seed: 334, passes: 1 }) +
      S.hatch(S.poly([[q.bottomL[0] - 4, q.bottomL[1] + 2], [q.bottomR[0] + 4, q.bottomR[1] + 2],
        [q.bottomR[0] + 4, q.bottomR[1] + 10], [q.bottomL[0] - 4, q.bottomL[1] + 10]], true),
        { gap: 6, alpha: 0.2, seed: 336 });
  })(), 178);
  ICON.photo = I((function () { var q = flatQuad(100, 158, 130, 58, 0.16, -4); var inner = flatQuad(100, 152, 112, 44, 0.16, -4); return K(S.poly(flatBody(q), true), { w: 2.4, seed: 335 }) +   K(S.poly(flatBody(inner), true), { w: 1.2, seed: 336 }) +   K(S.poly([inner.bottomL, [inner.topL[0] + 34, inner.topL[1] + 10], [inner.topR[0] - 28, inner.topR[1] + 22], inner.bottomR], false), { w: 1.3, seed: 337 }) +   K(S.ellipse(inner.topR[0] - 14, inner.topR[1] + 12, 5, 4), { w: 1.1, seed: 338 }) +   flatThickness(q, 5, 339); })(), 170);
  ICON.box = I(K(S.poly([[46, 84], [154, 78], [158, 154], [48, 160]], true), { w: 2.3, seed: 341 }) +
    K(S.line(46, 84, 100, 64), { w: 1.8, seed: 342 }) + K(S.line(154, 78, 100, 64), { w: 1.8, seed: 343 }) +
    K(S.line(66, 104, 134, 100), { w: 1.3, seed: 344 }), 164);
  ICON.cake = I(K(S.poly([[52, 96], [148, 92], [148, 148], [52, 152]], true), { w: 2.3, seed: 351 }) +
    K(S.line(52, 112, 148, 108), { w: 1.2, seed: 352 }) +
    K(S.line(84, 92, 84, 62), { w: 1.8, seed: 353 }) + K(S.ellipse(84, 56, 7, 10), { w: 1.5, seed: 354 }) +
    K(S.line(116, 90, 116, 62), { w: 1.8, seed: 355 }) + K(S.ellipse(116, 56, 7, 10), { w: 1.5, seed: 356 }), 156);
  ICON.candle = I(K(S.rect(70, 90, 34, 66), { w: 2.2, seed: 361 }) +
    K(S.line(87, 90, 87, 62), { w: 1.6, seed: 362 }) + K(S.ellipse(87, 54, 9, 13), { w: 1.6, seed: 363 }) +
    K(S.ellipse(87, 156, 30, 8), { w: 1.4, seed: 364 }), 162);
  ICON.envelope = I((function () { var q = flatQuad(100, 158, 148, 56, 0.18, -5); return K(S.poly(flatBody(q), true), { w: 2.4, seed: 371 }) +   K(S.poly([q.topL, [100, q.topL[1] + 40], q.topR], false), { w: 1.8, seed: 372 }) +   K(S.poly([q.topR[0] - 34, q.topR[1] + 8, q.topR[0] - 4, q.topR[1] + 6, q.topR[0] - 2, q.topR[1] + 30, q.topR[0] - 32, q.topR[1] + 32], true), { w: 1.2, seed: 373 }) +   flatThickness(q, 5, 374); })(), 172);
  ICON.pen = I(K(S.poly([[64, 150], [96, 44], [118, 48], [86, 154]], true), { w: 2.2, seed: 375 }) +
    K(S.line(96, 44, 86, 154), { w: 1, seed: 376 }), 158);
  ICON.bag = I(K(S.poly([[54, 86], [146, 84], [152, 152], [48, 154]], true), { w: 2.3, seed: 381 }) +
    K(S.ellipse(100, 86, 26, 18, Math.PI, Math.PI * 2), { w: 1.9, seed: 382 }), 160);
  ICON.stairs = I(K(S.poly([[40, 156], [40, 132], [70, 132], [70, 112], [100, 112], [100, 92], [130, 92], [130, 72], [162, 72]], false), { w: 2.3, seed: 391 }) +
    K(S.line(40, 156, 162, 156), { w: 2, seed: 392 }), 164);
  ICON.window = I(K(S.rect(50, 40, 100, 108), { w: 2.4, seed: 401 }) +
    K(S.line(100, 40, 100, 148), { w: 1.5, seed: 402 }) + K(S.line(50, 94, 150, 94), { w: 1.5, seed: 403 }), 152);
  ICON.ticket = I((function () { var q = flatQuad(100, 158, 138, 48, 0.16, -4); return K(S.poly(flatBody(q), true), { w: 2.4, seed: 411 }) +   K(S.line(q.topL[0] + 92, q.topL[1] + 2, q.topL[0] + 96, q.bottomL[1] - 2), { w: 1.3, seed: 412 }) +   K(S.line(q.topL[0] + 14, q.topL[1] + 16, q.topL[0] + 62, q.topL[1] + 14), { w: 1.1, seed: 413, passes: 1 }) +   K(S.line(q.topL[0] + 14, q.topL[1] + 30, q.topL[0] + 54, q.topL[1] + 29), { w: 1.1, seed: 414, passes: 1 }) +   flatThickness(q, 5, 415); })(), 158);
  ICON.shelf = I(K(S.line(30, 60, 170, 60), { w: 2.3, seed: 421 }) + K(S.line(30, 118, 170, 118), { w: 2.1, seed: 422 }) +
    K(S.line(30, 60, 30, 170), { w: 2, seed: 423 }) + K(S.line(170, 60, 170, 170), { w: 2, seed: 424 }) +
    K(S.line(54, 60, 54, 118), { w: 1.2, seed: 425 }) + K(S.line(84, 60, 84, 118), { w: 1.2, seed: 426 }) + K(S.line(112, 60, 112, 118), { w: 1.2, seed: 427 }), 176);
  ICON.camera = I(K(S.rect(48, 72, 104, 74), { w: 2.3, seed: 431 }) + K(S.ellipse(100, 108, 24, 24), { w: 1.8, seed: 432 }) + K(S.rect(80, 56, 40, 18), { w: 1.6, seed: 433 }), 150);
  ICON.hat = I(K(S.ellipse(100, 116, 56, 16), { w: 2.2, seed: 441 }) + K(S.rect(74, 76, 52, 40), { w: 2.1, seed: 442 }) + K(S.line(100, 76, 100, 116), { w: 1, seed: 443, passes: 1 }), 136);
  ICON.flower = I(K(S.line(100, 178, 100, 96), { w: 2.2, seed: 451 }) +
    K(S.ellipse(100, 84, 18, 16), { w: 1.8, seed: 452 }) +
    K(S.ellipse(78, 96, 14, 12), { w: 1.5, seed: 453 }) + K(S.ellipse(122, 96, 14, 12), { w: 1.5, seed: 454 }) +
    K(S.ellipse(100, 62, 12, 11), { w: 1.4, seed: 455 }), 184);
  ICON.sign = I(K(S.line(100, 184, 100, 96), { w: 2.3, seed: 461 }) + K(S.rect(48, 44, 104, 56), { w: 2.1, seed: 462 }) + K(S.line(64, 64, 136, 64), { w: 1.2, seed: 463 }), 190);
  ICON.table = I(K(S.poly([[30, 104], [170, 100], [156, 124], [44, 128]], true), { w: 2.3, seed: 471 }) +
    K(S.line(56, 126, 50, 176), { w: 2.2, seed: 472 }) + K(S.line(150, 122, 156, 172), { w: 2.2, seed: 473 }), 180);

  /* ================= 环境（1200×720） ================= */
  var HZ = 420; // 常见地面线

  function envParkLake() {
    return L(300, 400, 1120, 400, { w: 1.1, seed: 11 }) +
      L(330, 432, 1090, 432, { w: 0.9, seed: 12 }) +
      POLY([[300, 400], [420, 330], [540, 400]], false, { w: 1.1, seed: 13 }) +
      POLY([[520, 400], [660, 342], [800, 400]], false, { w: 1.1, seed: 14 }) +
      E(700, 500, 460, 44, Math.PI * 1.05, Math.PI * 1.95, { w: 1.3, seed: 15 }) +
      HATCH([[320, 620], [1100, 596], [1100, 700], [320, 700]], { gap: 14, alpha: 0.12, seed: 16 });
  }
  function envParkSnow() {
    var snow = '';
    for (var i = 0; i < 26; i++) {
      var x = 320 + (i * 137) % 780, y = 120 + (i * 211) % 300;
      snow += L(x, y, x - 3, y + 8, { w: 0.9, amp: 0.7, seed: 30 + i, passes: 1, alpha: 0.6 });
    }
    return snow +
      L(300, 452, 1120, 452, { w: 1.1, seed: 17 }) +
      E(700, 560, 470, 54, Math.PI * 1.02, Math.PI * 1.98, { w: 1.2, seed: 18 }) +
      HATCH([[320, 640], [1100, 620], [1100, 706], [320, 706]], { gap: 12, alpha: 0.16, seed: 19 });
  }
  function envParkSpring() {
    var b = '';
    for (var i = 0; i < 7; i++) {
      var x = 900 + i * 26, y = 120 + i * 34;
      b += E(x, y, 12, 9, { w: 1.2, seed: 50 + i });
    }
    return L(300, 404, 1120, 404, { w: 1.1, seed: 21 }) +
      E(700, 496, 460, 44, Math.PI * 1.03, Math.PI * 1.97, { w: 1.2, seed: 22 }) +
      K(S.poly([[880, 400], [960, 300], [1010, 340]], false), { w: 1.2, seed: 23 }) + b +
      HATCH([[320, 622], [1100, 600], [1100, 700], [320, 700]], { gap: 15, alpha: 0.1, seed: 24 });
  }
  function envParkAutumn() {
    return L(300, 400, 1120, 400, { w: 1.1, seed: 25 }) +
      K(S.poly([[880, 400], [868, 280], [900, 240]], false), { w: 1.6, seed: 26 }) +
      K(S.poly([[868, 300], [810, 260]], false), { w: 1.1, seed: 27 }) +
      K(S.poly([[872, 330], [940, 286]], false), { w: 1.1, seed: 28 }) +
      E(700, 498, 450, 40, Math.PI * 1.05, Math.PI * 1.95, { w: 1.2, seed: 29 });
  }
  function envCafeWindow() {
    var rain = '';
    for (var i = 0; i < 10; i++) {
      var x = 640 + i * 42, y = 150 + (i % 3) * 30;
      rain += L(x, y, x - 11, y + 40, { w: 0.8, amp: 0.8, seed: 60 + i, passes: 1 });
    }
    return R(600, 130, 420, 280, { w: 1.4, seed: 31 }) +
      L(810, 130, 810, 410, { w: 1, seed: 32 }) + L(600, 270, 1020, 270, { w: 0.9, seed: 33 }) + rain +
      L(560, 420, 1040, 424, { w: 1.2, seed: 34 }) +
      E(700, 830, 520, 170, Math.PI * 1.08, Math.PI * 1.92, { w: 1.9, amp: 1.7, seed: 35 }) +
      HATCH([[300, 660], [1080, 650], [1060, 700], [320, 710]], { gap: 15, alpha: 0.15, seed: 36 });
  }
  function envCafeClosing() {
    return L(300, 430, 1120, 430, { w: 1.1, seed: 41 }) +
      K(S.poly([[640, 470], [1120, 452], [1120, 488], [640, 506]], true), { w: 1.6, seed: 42 }) +
      E(660, 540, 44, 12, { w: 1.2, seed: 43 }) + L(660, 552, 656, 690, { w: 1.4, seed: 44 }) +
      E(790, 536, 44, 12, { w: 1.2, seed: 45 }) + L(790, 548, 788, 686, { w: 1.4, seed: 46 }) +
      E(920, 532, 44, 12, { w: 1.2, seed: 47 }) + L(920, 544, 922, 682, { w: 1.4, seed: 48 }) +
      HATCH([[300, 660], [1100, 646], [1100, 700], [300, 706]], { gap: 16, alpha: 0.13, seed: 49 });
  }
  function envStationPlatform() {
    return L(300, 470, 1120, 386, { w: 1.6, seed: 51 }) + L(300, 512, 1120, 424, { w: 1.2, seed: 52 }) +
      E(700, 760, 520, 300, Math.PI * 1.1, Math.PI * 1.9, { w: 1.3, seed: 53 }) +
      E(700, 800, 490, 300, Math.PI * 1.12, Math.PI * 1.88, { w: 1.1, seed: 54 }) +
      E(700, 60, 420, 120, Math.PI * 0.08, Math.PI * 0.92, { w: 1.4, seed: 55 }) +
      L(420, 150, 420, 470, { w: 1.5, seed: 56 }) + L(940, 150, 940, 410, { w: 1.5, seed: 57 });
  }
  function envStationExit() {
    var st = '', i;
    for (i = 0; i < 5; i++) {
      st += K(S.poly([[320 + i * 40, 690 - i * 26], [320 + i * 40, 664 - i * 26], [760 + i * 34, 664 - i * 26]], false), { w: 1.2, seed: 70 + i });
    }
    return st + R(700, 170, 250, 64, { w: 1.3, seed: 61 }) + L(724, 196, 926, 196, { w: 0.9, seed: 62 }) +
      L(500, 640, 500, 200, { w: 1.4, seed: 63 }) + E(560, 640, 460, 40, Math.PI * 1.04, Math.PI * 1.96, { w: 1.2, seed: 64 });
  }
  function envRoomNight() {
    return R(760, 140, 300, 240, { w: 1.3, seed: 71 }) + L(910, 140, 910, 380, { w: 0.9, seed: 72 }) +
      E(880, 210, 30, 30, { w: 1.3, seed: 73 }) +
      L(300, 430, 1120, 430, { w: 1.1, seed: 74 }) +
      E(680, 820, 500, 150, Math.PI * 1.1, Math.PI * 1.9, { w: 1.9, amp: 1.7, seed: 75 }) +
      HATCH([[300, 660], [1060, 648], [1040, 700], [320, 712]], { gap: 15, alpha: 0.14, seed: 76 });
  }
  function envRoomEmpty() {
    return R(340, 150, 260, 220, { w: 1.3, seed: 81 }) + L(470, 150, 470, 370, { w: 0.9, seed: 82 }) +
      L(300, 430, 1120, 430, { w: 1.1, seed: 83 }) +
      L(300, 470, 1120, 470, { w: 0.7, seed: 84, passes: 1 }) +
      L(300, 700, 1120, 700, { w: 1.2, seed: 85 }) +
      HATCH([[320, 520], [1100, 512], [1100, 690], [320, 696]], { gap: 18, alpha: 0.1, seed: 86 });
  }
  function envStreetCross() {
    var cb = '', i;
    for (i = 0; i < 5; i++) {
      var y = 500 + i * 42, half = 96 + i * 44;
      cb += L(640 - half, y, 640 + half, y, { w: 1.1, seed: 90 + i, passes: 1 });
    }
    return POLY([[300, 440], [300, 170], [430, 178], [430, 440]], false, { w: 1.3, seed: 91 }) +
      POLY([[880, 440], [880, 190], [1060, 202], [1060, 440]], false, { w: 1.3, seed: 92 }) +
      L(300, 440, 1120, 440, { w: 1.2, seed: 93 }) +
      E(700, 780, 520, 340, Math.PI * 1.15, Math.PI * 1.85, { w: 1.5, seed: 94 }) + cb;
  }
  function envStreetRain() {
    var rain = '', i;
    for (i = 0; i < 22; i++) {
      var x = 320 + (i * 97) % 780, y = 130 + (i * 61) % 320;
      rain += L(x, y, x - 10, y + 34, { w: 0.9, amp: 0.8, seed: 120 + i, passes: 1, alpha: 0.7 });
    }
    return rain + L(300, 440, 1120, 440, { w: 1.1, seed: 95 }) +
      E(700, 720, 500, 200, Math.PI * 1.08, Math.PI * 1.92, { w: 1.3, seed: 96 }) +
      E(520, 620, 90, 18, { w: 1, seed: 97 }) + E(880, 660, 110, 20, { w: 1, seed: 98 }) +
      HATCH([[320, 640], [1100, 620], [1100, 700], [320, 706]], { gap: 15, alpha: 0.12, seed: 99 });
  }
  function envRooftopNight() {
    var sky = [[300, 400], [360, 400], [360, 320], [430, 318], [430, 352], [500, 350], [500, 288],
      [572, 286], [572, 340], [648, 338], [648, 300], [724, 298], [724, 356], [806, 354],
      [806, 306], [880, 304], [880, 344], [960, 342], [960, 292], [1040, 290], [1040, 400], [1120, 400]];
    var stars = '', i;
    for (i = 0; i < 12; i++) {
      var x = 340 + (i * 137) % 760, y = 90 + (i * 53) % 200;
      stars += L(x, y, x + 2, y - 6, { w: 1, amp: 0.5, seed: 130 + i, passes: 1 });
    }
    return stars + POLY(sky, false, { w: 1.3, seed: 101 }) + L(300, 620, 1120, 588, { w: 1.1, seed: 102 });
  }
  function envRooftopDusk() {
    var sky = [[300, 420], [380, 420], [380, 350], [470, 348], [470, 300], [560, 298], [560, 360], [660, 358],
      [660, 320], [760, 318], [760, 370], [860, 368], [860, 330], [960, 328], [960, 420], [1120, 420]];
    return POLY(sky, false, { w: 1.3, seed: 111 }) + E(560, 200, 44, 44, { w: 1.3, seed: 112 }) +
      L(300, 420, 1120, 420, { w: 1.2, seed: 113 }) + L(320, 500, 1100, 480, { w: 1, seed: 114 });
  }
  function envCorridor() {
    var lights = '', i;
    for (i = 0; i < 4; i++) {
      lights += R(380 + i * 160, 150 - i * 6, 90, 16, { w: 1.1, seed: 140 + i });
    }
    return R(320, 120, 780, 300, { w: 1.2, seed: 121 }) + L(320, 420, 1120, 420, { w: 1.1, seed: 122 }) +
      K(S.poly([[320, 420], [260, 700]], false), { w: 1.2, seed: 123 }) +
      K(S.poly([[1100, 420], [1140, 700]], false), { w: 1.2, seed: 124 }) +
      lights + HATCH([[300, 640], [1120, 620], [1120, 700], [300, 706]], { gap: 16, alpha: 0.12, seed: 125 });
  }
  function envShelves() {
    var b = '', i;
    for (i = 0; i < 14; i++) {
      var x = 340 + (i * 53) % 700;
      b += K(S.poly([[x, 470], [x + 26, 468], [x + 26, 520], [x, 522]], true), { w: 1.1, seed: 150 + i, passes: 1 });
    }
    return L(300, 300, 1100, 300, { w: 1.3, seed: 131 }) + L(300, 380, 1100, 380, { w: 1.1, seed: 132 }) +
      L(300, 460, 1100, 460, { w: 1.2, seed: 133 }) + L(300, 520, 1100, 520, { w: 1.2, seed: 134 }) +
      L(300, 300, 300, 700, { w: 1.3, seed: 135 }) + L(1100, 300, 1100, 700, { w: 1.3, seed: 136 }) + b;
  }
  function envDesk() {
    return E(680, 800, 500, 150, Math.PI * 1.1, Math.PI * 1.88, { w: 1.9, amp: 1.7, seed: 141 }) +
      E(680, 772, 462, 132, Math.PI * 1.12, Math.PI * 1.88, { w: 1, seed: 142 }) +
      R(340, 160, 200, 150, { w: 1.2, seed: 143 }) + L(440, 160, 440, 310, { w: 0.8, seed: 144 }) +
      HATCH([[300, 650], [1060, 640], [1040, 700], [320, 710]], { gap: 16, alpha: 0.13, seed: 145 });
  }
  function envCampusSteps() {
    var st = '', i;
    for (i = 0; i < 6; i++) {
      st += K(S.poly([[300, 700 - i * 34], [300, 676 - i * 34], [1100, 676 - i * 34], [1100, 700 - i * 34]], true), { w: 1, seed: 160 + i, passes: 1 });
    }
    return R(380, 130, 620, 210, { w: 1.2, seed: 151 }) + st +
      L(560, 130, 560, 340, { w: 0.8, seed: 152 }) + L(820, 130, 820, 340, { w: 0.8, seed: 153 });
  }
  function envBedside() {
    return L(300, 470, 1120, 470, { w: 1.2, seed: 161 }) +
      R(320, 470, 420, 200, { w: 1.4, seed: 162 }) + L(320, 510, 740, 510, { w: 1, seed: 163 }) +
      R(780, 420, 200, 60, { w: 1.3, seed: 164 }) + L(790, 480, 782, 620, { w: 1.4, seed: 165 }) +
      L(970, 480, 978, 618, { w: 1.4, seed: 166 }) +
      R(860, 150, 220, 180, { w: 1.2, seed: 167 });
  }
  function envDoorway() {
    return R(600, 120, 300, 400, { w: 1.6, seed: 171 }) + E(860, 330, 8, 8, { w: 1.4, seed: 172 }) +
      L(300, 520, 1120, 520, { w: 1.2, seed: 173 }) +
      HATCH([[320, 560], [1100, 548], [1100, 700], [320, 706]], { gap: 17, alpha: 0.11, seed: 174 });
  }
  function envBusStop() {
    return L(300, 440, 1120, 440, { w: 1.1, seed: 181 }) +
      K(S.poly([[640, 440], [640, 210], [980, 210], [980, 440]], false), { w: 1.3, seed: 182 }) +
      L(640, 250, 980, 250, { w: 0.9, seed: 183 }) +
      L(700, 440, 700, 250, { w: 0.8, seed: 184, passes: 1 }) +
      HATCH([[320, 620], [1100, 600], [1100, 700], [320, 700]], { gap: 16, alpha: 0.1, seed: 185 });
  }
  function envWindowNight() {
    return R(640, 120, 400, 300, { w: 1.4, seed: 191 }) + L(840, 120, 840, 420, { w: 1, seed: 192 }) +
      L(640, 270, 1040, 270, { w: 0.9, seed: 193 }) + E(760, 190, 26, 26, { w: 1.2, seed: 194 }) +
      L(300, 520, 1120, 520, { w: 1.2, seed: 195 }) +
      HATCH([[320, 560], [1100, 548], [1100, 700], [320, 706]], { gap: 18, alpha: 0.1, seed: 196 });
  }
  function envBridge() {
    return L(300, 460, 1120, 460, { w: 1.2, seed: 201 }) +
      E(700, 620, 460, 90, Math.PI * 1.05, Math.PI * 1.95, { w: 1.4, seed: 202 }) +
      L(340, 460, 340, 300, { w: 1.4, seed: 203 }) + L(1060, 460, 1060, 300, { w: 1.4, seed: 204 }) +
      E(700, 300, 360, 40, Math.PI * 1.02, Math.PI * 1.98, { w: 1.2, seed: 205 });
  }

  /* ================= 30 幕配置 ================= */
  // [环境, [icon, icon, icon], [spot x3]]
  var SCENES = {
    m01: [envParkLake, ['bench', 'lamp', 'tree'], [[336, 448, 214, 150], [566, 306, 148, 148], [716, 330, 96, 152]]],
    m02: [envCafeWindow, ['cup', 'note', 'chair'], [[440, 496, 116, 116], [584, 492, 112, 104], [700, 428, 128, 168]]],
    m03: [envStationPlatform, ['clock', 'bench', 'door'], [[440, 310, 96, 96], [556, 446, 204, 124], [800, 278, 96, 160]]],
    m04: [envRoomNight, ['phone', 'lamp', 'window'], [[420, 420, 104, 150], [600, 380, 110, 150], [742, 300, 120, 130]]],
    m05: [envParkSnow, ['bench', 'tree', 'lamp'], [[336, 450, 214, 150], [566, 306, 148, 148], [730, 330, 92, 152]]],
    m06: [envShelves, ['book', 'shelf', 'chair'], [[400, 420, 130, 120], [580, 376, 140, 140], [746, 404, 120, 150]]],
    m07: [envCafeClosing, ['chair', 'cup', 'door'], [[400, 440, 130, 150], [580, 470, 110, 110], [730, 380, 120, 160]]],
    m08: [envRooftopNight, ['railing', 'moon', 'tree'], [[330, 442, 200, 104], [592, 250, 110, 110], [716, 356, 130, 130]]],
    m09: [envStreetCross, ['light', 'umbrella', 'sign'], [[560, 190, 96, 128], [380, 462, 150, 150], [700, 400, 110, 110]]],
    m10: [envDesk, ['cake', 'candle', 'photo'], [[420, 440, 130, 120], [580, 420, 110, 130], [720, 400, 120, 130]]],
    m11: [envDesk, ['lamp', 'note', 'phone'], [[540, 386, 120, 150], [700, 420, 110, 100], [396, 450, 100, 130]]],
    m12: [envCorridor, ['bench', 'door', 'clock'], [[360, 456, 200, 120], [600, 330, 110, 160], [760, 250, 96, 96]]],
    m13: [envStationExit, ['sign', 'bench', 'stairs'], [[620, 250, 120, 100], [380, 452, 200, 124], [800, 380, 130, 130]]],
    m14: [envParkSpring, ['bench', 'flower', 'tree'], [[336, 448, 214, 150], [586, 330, 120, 150], [716, 356, 120, 130]]],
    m15: [envStreetRain, ['umbrella', 'window', 'cup'], [[380, 448, 150, 150], [572, 320, 130, 130], [720, 440, 100, 100]]],
    m16: [envRoomNight, ['chair', 'cup', 'door'], [[420, 430, 130, 150], [600, 470, 110, 110], [742, 386, 120, 160]]],
    m17: [envWindowNight, ['phone', 'note', 'lamp'], [[420, 430, 100, 140], [560, 440, 104, 96], [700, 400, 110, 140]]],
    m18: [envDesk, ['envelope', 'pen', 'letter'], [[400, 448, 130, 110], [560, 430, 100, 130], [690, 440, 130, 110]]],
    m19: [envCampusSteps, ['camera', 'hat', 'photo'], [[440, 400, 130, 120], [600, 390, 120, 120], [740, 400, 120, 120]]],
    m20: [envRooftopDusk, ['railing', 'chair', 'moon'], [[330, 440, 200, 104], [600, 440, 130, 150], [742, 260, 104, 104]]],
    m21: [envDoorway, ['box', 'umbrella', 'bag'], [[400, 460, 140, 130], [580, 430, 140, 150], [740, 460, 120, 130]]],
    m22: [envRoomEmpty, ['key', 'window', 'box'], [[400, 450, 120, 130], [560, 380, 130, 130], [710, 440, 130, 130]]],
    m23: [envDoorway, ['key', 'envelope', 'bag'], [[420, 450, 120, 130], [590, 440, 130, 120], [740, 450, 120, 130]]],
    m24: [envBedside, ['phone', 'lamp', 'clock'], [[400, 420, 100, 140], [560, 400, 110, 140], [720, 400, 100, 100]]],
    m25: [envStationPlatform, ['ticket', 'clock', 'door'], [[420, 470, 130, 110], [566, 300, 96, 96], [800, 280, 96, 160]]],
    m26: [envCafeClosing, ['chair', 'cup', 'table'], [[400, 440, 130, 150], [580, 470, 110, 110], [730, 430, 140, 120]]],
    m27: [envShelves, ['book', 'shelf', 'letter'], [[400, 420, 130, 120], [580, 376, 140, 140], [746, 420, 130, 110]]],
    m28: [envDesk, ['envelope', 'letter', 'key'], [[400, 448, 130, 110], [570, 440, 130, 110], [710, 440, 110, 120]]],
    m29: [envParkSpring, ['photo', 'tree', 'bench'], [[400, 420, 130, 130], [560, 320, 140, 140], [700, 440, 200, 140]]],
    m30: [envParkAutumn, ['bench', 'tree', 'lamp'], [[336, 448, 214, 150], [586, 300, 150, 150], [730, 330, 92, 152]]]
  };

  // 每套环境对应的前景透视线条类型
  var ENV_FG = new Map([
    [envParkLake, 'ground'], [envParkSnow, 'ground'], [envParkSpring, 'ground'], [envParkAutumn, 'ground'],
    [envCafeWindow, 'cafe'], [envCafeClosing, 'cafe'],
    [envStationPlatform, 'platform'], [envStationExit, 'platform'],
    [envRooftopNight, 'roof'], [envRooftopDusk, 'roof'],
    [envRoomNight, 'room'], [envRoomEmpty, 'room'], [envBedside, 'room'], [envWindowNight, 'room'],
    [envCorridor, 'room'], [envShelves, 'room'], [envDesk, 'room'], [envDoorway, 'room'],
    [envCampusSteps, 'ground'], [envBridge, 'ground'], [envBusStop, 'street'],
    [envStreetCross, 'street'], [envStreetRain, 'street']
  ]);

  function softSrc(src) {
    if (!src) return '';
    return src.replace(/\.jpg(\?.*)?$/, '-soft.png');
  }

  var PORTRAIT = { x: 58, y: 2, w: 42, h: 96, focus: [50, 8] };

  Object.keys(SCENES).forEach(function (id) {
    var spec = SCENES[id];
    var old = A[id];
    if (!old) return;
    var env = spec[0](), icons = spec[1];
    var fgTypeTmp = ENV_FG.get(spec[0]);
    var planeY = { cafe: 648, ground: 648, platform: 650, room: 636, roof: 628, street: 652 }[fgTypeTmp] || 640;
    var rawSpots = spec[2].slice();
    var maxBottom = 0;
    rawSpots.forEach(function (s) { maxBottom = Math.max(maxBottom, s[1] + s[3] * 0.86); });
    var dySpots = planeY - maxBottom;
    var FLAT = { note: 1, phone: 1, letter: 1, envelope: 1, photo: 1, ticket: 1 };
    var spots = rawSpots.map(function (s, i) {
      var ox = 0, oy = 0, k = 1;
      if (FLAT[icons[i]]) { k = 1.34; ox = -s[2] * (k - 1) / 2; oy = -s[3] * (k - 1); }
      return [+((s[0] + ox) / W * 100).toFixed(2), +((s[1] + dySpots + oy) / H * 100).toFixed(2),
        +(s[2] * k / W * 100).toFixed(2), +(s[3] * k / H * 100).toFixed(2)];
    });
    var fgType = ENV_FG.get(spec[0]);
    var FG = root.FAREWELL_FG || {};
    A[id] = {
      bg: env,
      fg: FG[fgType] ? FG[fgType]() : '',
      portrait: {
        src: 'assets/portrait-' + id + '-soft.png',
        spot: [PORTRAIT.x, PORTRAIT.y, PORTRAIT.w, PORTRAIT.h],
        focus: PORTRAIT.focus
      },
      options: [0, 1, 2].map(function (i) {
        return { spot: spots[i], art: ICON[icons[i]] || '' };
      })
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

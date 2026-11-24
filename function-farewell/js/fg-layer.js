/* 函数式告别 · 前景透视线条层（浅色）
 *
 * 目的：在人物像前面叠一层"透视桌面/地面"，桌面上有花、手机、便签等装饰。
 * 装饰用浅色细线（w 0.7~0.9, 透明度 0.5），三个选项物件保持深色粗线，
 * 让"环境"和"可选项"在视觉上分层。
 */
(function (root) {
  'use strict';
  var S = root.SKETCH;
  if (!S) return;

  function K(pts, o) { return S.ink(pts, o); }
  function L(x0, y0, x1, y1, o) { return S.ink(S.line(x0, y0, x1, y1), o); }
  function E(cx, cy, rx, ry, a0, a1, o) {
    if (a0 && typeof a0 === 'object') { o = a0; a0 = 0; a1 = Math.PI * 2; }
    return S.ink(S.ellipse(cx, cy, rx, ry, a0, a1), o || {});
  }
  function POLY(pts, closed, o) { return S.ink(S.poly(pts, closed), o); }

  var LIGHT = { w: 0.85, alpha: 0.5, amp: 1.1 };
  var LIGHT2 = { w: 0.7, alpha: 0.4, amp: 0.9 };

  // 透视桌面的横线：越靠后越密
  function perspectiveRows(y0, y1, cx, n) {
    var out = '', i, t, y, half;
    for (i = 0; i < n; i++) {
      t = i / (n - 1);
      y = y0 + (y1 - y0) * t * t;             // 二次分布 → 近处稀疏、远处密集
      half = 120 + 460 * t;
      out += L(cx - half, y, cx + half, y, { w: LIGHT2.w, alpha: LIGHT2.alpha, amp: 0.8, seed: 300 + i, passes: 1 });
    }
    return out;
  }

  // 桌面/地面透视线束（指向消失点）
  function perspectiveRays(vx, vy, pts, o) {
    var out = '', i;
    for (i = 0; i < pts.length; i++) {
      out += L(pts[i][0], pts[i][1], vx, vy, o || { w: 0.75, alpha: 0.4, amp: 0.9, seed: 320 + i, passes: 1 });
    }
    return out;
  }

  /* 咖啡桌：桌面 + 桌沿 + 花、手机、便签、杯垫 */
  function fgCafe() {
    var b = '';
    var vx = 620, vy = 430;
    // 桌沿（前景大弧）
    b += E(700, 780, 560, 150, Math.PI * 1.06, Math.PI * 1.94, { w: 1.1, alpha: 0.7, amp: 1.6, seed: 331 });
    b += E(700, 760, 520, 132, Math.PI * 1.08, Math.PI * 1.92, { w: 0.8, alpha: 0.45, amp: 1.2, seed: 332 });
    // 桌面透视横线 + 射线
    b += perspectiveRows(560, 700, 700, 6);
    b += perspectiveRays(vx, vy, [[300, 700], [420, 700], [980, 700], [1090, 700]], { w: 0.7, alpha: 0.32, amp: 0.9, seed: 333, passes: 1 });
    // 装饰：小花瓶
    b += E(392, 590, 16, 6, { w: 0.9, alpha: 0.55, amp: 1, seed: 334 });
    b += L(392, 590, 388, 556, { w: 0.9, alpha: 0.55, amp: 1, seed: 335 });
    b += E(378, 546, 12, 9, { w: 0.8, alpha: 0.5, amp: 1, seed: 336 });
    b += E(404, 540, 10, 8, { w: 0.8, alpha: 0.5, amp: 1, seed: 337 });
    b += E(392, 528, 8, 7, { w: 0.8, alpha: 0.45, amp: 1, seed: 338 });
    // 装饰：手机（平放，透视）
    b += POLY([[792, 596], [868, 588], [874, 620], [798, 628]], true, { w: 0.95, alpha: 0.6, amp: 1.1, seed: 339 });
    b += L(806, 602, 864, 596, { w: 0.7, alpha: 0.45, amp: 0.9, seed: 340, passes: 1 });
    // 装饰：杯垫 + 糖罐
    b += E(530, 640, 34, 10, { w: 0.85, alpha: 0.5, amp: 1, seed: 341 });
    b += E(950, 610, 22, 8, { w: 0.85, alpha: 0.5, amp: 1, seed: 342 });
    b += L(950, 610, 950, 588, { w: 0.8, alpha: 0.5, amp: 1, seed: 343 });
    // 装饰：插着吸管的杯影（浅）
    b += E(680, 600, 26, 9, { w: 0.8, alpha: 0.42, amp: 1, seed: 344 });
    b += L(686, 600, 692, 566, { w: 0.7, alpha: 0.4, amp: 0.9, seed: 345, passes: 1 });
    return b;
  }

  /* 室外地面：草地/路径透视 + 落叶、小石头 */
  function fgGround() {
    var b = '';
    b += E(700, 820, 560, 170, Math.PI * 1.1, Math.PI * 1.9, { w: 1.05, alpha: 0.65, amp: 1.6, seed: 351 });
    b += perspectiveRows(580, 700, 700, 5);
    b += perspectiveRays(600, 430, [[300, 700], [420, 700], [1000, 700], [1100, 700]], { w: 0.7, alpha: 0.3, amp: 0.9, seed: 352, passes: 1 });
    // 落叶
    b += POLY([[404, 646], [426, 640], [432, 660], [408, 666]], true, { w: 0.8, alpha: 0.5, amp: 1, seed: 353 });
    b += POLY([[520, 690], [542, 684], [548, 702], [524, 708]], true, { w: 0.8, alpha: 0.45, amp: 1, seed: 354 });
    // 小石头
    b += E(900, 668, 14, 6, { w: 0.8, alpha: 0.5, amp: 1, seed: 355 });
    b += E(946, 690, 9, 4, { w: 0.75, alpha: 0.45, amp: 1, seed: 356, passes: 1 });
    // 长椅/栏杆的浅线提示
    b += L(300, 620, 1100, 600, { w: 0.8, alpha: 0.35, amp: 1.1, seed: 357 });
    return b;
  }

  /* 站台地面：站台边缘透视 + 行李箱、纸杯 */
  function fgPlatform() {
    var b = '';
    b += E(700, 830, 560, 150, Math.PI * 1.08, Math.PI * 1.92, { w: 1.05, alpha: 0.65, amp: 1.6, seed: 361 });
    b += perspectiveRows(560, 700, 700, 5);
    b += perspectiveRays(660, 430, [[300, 700], [440, 700], [980, 700], [1100, 700]], { w: 0.7, alpha: 0.3, amp: 0.9, seed: 362, passes: 1 });
    // 行李箱（浅色）
    b += POLY([[392, 596], [470, 590], [476, 660], [398, 666]], true, { w: 0.95, alpha: 0.55, amp: 1.1, seed: 363 });
    b += L(410, 590, 410, 580, { w: 0.8, alpha: 0.5, amp: 0.9, seed: 364, passes: 1 });
    // 纸杯
    b += E(872, 636, 18, 6, { w: 0.85, alpha: 0.5, amp: 1, seed: 365 });
    b += POLY([[856, 636], [860, 668], [884, 668], [888, 636]], false, { w: 0.85, alpha: 0.5, amp: 1, seed: 366 });
    // 地面划线
    b += L(320, 620, 1080, 588, { w: 0.8, alpha: 0.35, amp: 1.1, seed: 367 });
    return b;
  }

  /* 天台地面：水泥地透视线 + 水渍、烟灰缸 */
  function fgRoof() {
    var b = '';
    b += E(700, 830, 560, 150, Math.PI * 1.1, Math.PI * 1.9, { w: 1.05, alpha: 0.6, amp: 1.6, seed: 371 });
    b += perspectiveRows(570, 700, 700, 5);
    b += perspectiveRays(640, 430, [[300, 700], [430, 700], [1000, 700], [1100, 700]], { w: 0.7, alpha: 0.3, amp: 0.9, seed: 372, passes: 1 });
    // 水渍
    b += E(520, 660, 46, 12, { w: 0.8, alpha: 0.4, amp: 1, seed: 373 });
    b += E(912, 640, 30, 9, { w: 0.8, alpha: 0.4, amp: 1, seed: 374 });
    // 烟灰缸 + 瓶
    b += E(806, 636, 20, 7, { w: 0.85, alpha: 0.5, amp: 1, seed: 375 });
    b += L(806, 636, 806, 610, { w: 0.8, alpha: 0.45, amp: 1, seed: 376, passes: 1 });
    return b;
  }

  /* 房间地面/桌面：木地板透视线 + 便签、笔筒 */
  function fgRoom() {
    var b = '';
    b += E(680, 820, 540, 150, Math.PI * 1.1, Math.PI * 1.9, { w: 1.05, alpha: 0.62, amp: 1.6, seed: 381 });
    b += perspectiveRows(560, 700, 690, 6);
    b += perspectiveRays(600, 430, [[300, 700], [430, 700], [980, 700], [1100, 700]], { w: 0.7, alpha: 0.3, amp: 0.9, seed: 382, passes: 1 });
    // 笔筒
    b += POLY([[392, 600], [430, 596], [434, 654], [396, 658]], true, { w: 0.95, alpha: 0.55, amp: 1.1, seed: 383 });
    b += L(404, 596, 400, 570, { w: 0.8, alpha: 0.5, amp: 0.9, seed: 384, passes: 1 });
    b += L(418, 596, 424, 572, { w: 0.8, alpha: 0.5, amp: 0.9, seed: 385, passes: 1 });
    // 便签两张
    b += POLY([[860, 596], [920, 590], [924, 626], [864, 632]], true, { w: 0.85, alpha: 0.5, amp: 1, seed: 386 });
    b += POLY([[880, 640], [936, 634], [940, 664], [884, 670]], true, { w: 0.8, alpha: 0.45, amp: 1, seed: 387 });
    return b;
  }

  /* 街面：雨地反光 + 水洼、报纸 */
  function fgStreet() {
    var b = '';
    b += E(700, 830, 560, 160, Math.PI * 1.1, Math.PI * 1.9, { w: 1.05, alpha: 0.6, amp: 1.6, seed: 391 });
    b += perspectiveRows(570, 700, 700, 5);
    b += perspectiveRays(640, 440, [[300, 700], [420, 700], [980, 700], [1100, 700]], { w: 0.7, alpha: 0.3, amp: 0.9, seed: 392, passes: 1 });
    // 水洼
    b += E(470, 660, 60, 14, { w: 0.9, alpha: 0.5, amp: 1.2, seed: 393 });
    b += E(470, 660, 40, 8, { w: 0.75, alpha: 0.4, amp: 1, seed: 394, passes: 1 });
    b += E(930, 646, 44, 11, { w: 0.85, alpha: 0.45, amp: 1, seed: 395 });
    // 报纸
    b += POLY([[708, 610], [784, 602], [790, 632], [714, 640]], true, { w: 0.85, alpha: 0.5, amp: 1, seed: 396 });
    b += L(722, 618, 776, 612, { w: 0.7, alpha: 0.4, amp: 0.9, seed: 397, passes: 1 });
    return b;
  }

  root.FAREWELL_FG = {
    cafe: fgCafe,
    ground: fgGround,
    platform: fgPlatform,
    roof: fgRoof,
    room: fgRoom,
    street: fgStreet
  };
})(typeof window !== 'undefined' ? window : globalThis);

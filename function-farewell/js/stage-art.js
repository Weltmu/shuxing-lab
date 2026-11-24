/* 函数式告别 · 手绘线稿场景（纯代码）
 * 用 SKETCH.ink 的双频抖动笔触画场景与物件，替代死板的多边形。
 * 背景 1200×720；物件图标 200×200。
 */
(function (root) {
  'use strict';
  var A = root.FAREWELL_ART, S = root.SKETCH;
  if (!A || !S) return;

  var W = 1200, H = 720;
  function K(pts, o) { return S.ink(pts, o); }
  function L(x0, y0, x1, y1) { return S.line(x0, y0, x1, y1); }
  function R(x, y, w, h) { return S.rect(x, y, w, h); }
  function E(cx, cy, rx, ry, a0, a1) { return S.ellipse(cx, cy, rx, ry, a0, a1); }

  /* ---------------- 咖啡馆 ---------------- */
  function stageCafe() {
    var bg = '';
    // 墙线
    bg += K(L(300, 430, 1120, 430), { w: 1.1, amp: 1.1, seed: 11 });
    // 窗
    bg += K(R(600, 130, 420, 280), { w: 1.4, seed: 12 });
    bg += K(L(810, 130, 810, 410), { w: 1, seed: 13 });
    bg += K(L(600, 270, 1020, 270), { w: 0.9, seed: 14 });
    // 窗外的雨
    for (var i = 0; i < 9; i++) {
      var x = 630 + i * 44, y = 160 + (i % 3) * 34;
      bg += K(L(x, y, x - 12, y + 42), { w: 0.8, amp: 0.8, seed: 20 + i, passes: 1 });
    }
    // 窗台
    bg += K(L(580, 420, 1040, 424), { w: 1.2, seed: 15 });
    // 桌面：前景大弧 + 后沿
    bg += K(E(700, 830, 520, 170, Math.PI * 1.08, Math.PI * 1.92), { w: 1.9, amp: 1.8, seed: 16 });
    bg += K(E(700, 800, 480, 150, Math.PI * 1.1, Math.PI * 1.9), { w: 1, amp: 1.2, seed: 17 });
    // 桌面排线阴影
    bg += S.hatch(S.poly([[300, 660], [1080, 650], [1060, 700], [320, 710]], true), { gap: 15, alpha: 0.16, seed: 18 });
    // 杯子（杯身 + 杯口 + 把手 + 碟）
    bg += K(E(520, 548, 42, 13), { w: 1.4, seed: 21 });
    bg += K(S.poly([[478, 548], [486, 606], [554, 606], [562, 548]], false), { w: 1.6, seed: 22 });
    bg += K(E(562, 574, 20, 16, -1.2, 1.6), { w: 1.3, seed: 23 });
    bg += K(E(520, 616, 74, 15), { w: 1.1, seed: 24 });
    bg += S.hatch(E(520, 626, 66, 12), { gap: 8, alpha: 0.22, seed: 25 });
    // 便签（带折角）
    bg += K(S.poly([[640, 540], [742, 532], [748, 604], [646, 612]], true), { w: 1.3, seed: 26 });
    bg += K(S.poly([[706, 536], [712, 556], [740, 553]], false), { w: 0.9, seed: 27 });
    bg += K(L(660, 566, 726, 560), { w: 0.7, seed: 28, passes: 1 });
    bg += K(L(662, 586, 730, 580), { w: 0.7, seed: 29, passes: 1 });
    var spots = [[440, 496, 116, 116], [582, 492, 112, 104], [694, 430, 128, 168]];
    return { bg: bg, spots: spots };
  }

  /* ---------------- 公园 ---------------- */
  function stagePark() {
    var bg = '';
    // 地平线 + 湖
    bg += K(L(300, 400, 1120, 400), { w: 1.2, seed: 41 });
    bg += K(L(330, 430, 1090, 430), { w: 0.9, seed: 42 });
    bg += K(L(360, 456, 1060, 456), { w: 0.7, seed: 43, passes: 1 });
    // 远山
    bg += K(S.poly([[300, 400], [420, 330], [540, 400]], false), { w: 1.1, seed: 44 });
    bg += K(S.poly([[520, 400], [660, 342], [800, 400]], false), { w: 1.1, seed: 45 });
    // 岸线
    bg += K(E(700, 500, 470, 46, Math.PI * 1.05, Math.PI * 1.95), { w: 1.3, seed: 46 });
    // 草地排线
    bg += S.hatch(S.poly([[320, 620], [1100, 596], [1100, 700], [320, 700]], true), { gap: 13, alpha: 0.13, seed: 47 });
    var spots = [[336, 452, 214, 150], [560, 296, 150, 150], [722, 320, 96, 156]];
    return { bg: bg, spots: spots };
  }

  /* ---------------- 站台 ---------------- */
  function stageStation() {
    var bg = '';
    // 站台边缘（两条线收敛）
    bg += K(L(300, 470, 1120, 386), { w: 1.6, seed: 71 });
    bg += K(L(300, 512, 1120, 424), { w: 1.2, seed: 72 });
    // 铁轨
    bg += K(E(700, 760, 520, 300, Math.PI * 1.1, Math.PI * 1.9), { w: 1.3, seed: 73 });
    bg += K(E(700, 800, 490, 300, Math.PI * 1.12, Math.PI * 1.88), { w: 1.1, seed: 74 });
    for (var i = 0; i < 6; i++) {
      var x = 380 + i * 118, y = 690 - i * 34;
      bg += K(L(x, y, x + 96, y - 16), { w: 1, seed: 80 + i, passes: 1 });
    }
    // 顶棚
    bg += K(E(700, 60, 420, 120, Math.PI * 0.08, Math.PI * 0.92), { w: 1.4, seed: 75 });
    bg += K(E(700, 96, 400, 116, Math.PI * 0.08, Math.PI * 0.92), { w: 1, seed: 76 });
    bg += K(L(420, 150, 420, 470), { w: 1.5, seed: 77 });
    bg += K(L(940, 150, 940, 410), { w: 1.5, seed: 78 });
    // 站牌
    bg += K(R(620, 240, 250, 70), { w: 1.3, seed: 91 });
    bg += K(L(640, 264, 850, 264), { w: 0.9, seed: 92, passes: 1 });
    bg += K(L(640, 288, 790, 288), { w: 0.9, seed: 93, passes: 1 });
    bg += S.hatch(S.poly([[300, 640], [1100, 600], [1100, 660], [300, 700]], true), { gap: 14, alpha: 0.12, seed: 100 });
    var spots = [[440, 312, 96, 96], [556, 446, 204, 124], [800, 280, 96, 160]];
    return { bg: bg, spots: spots };
  }

  /* ---------------- 天台 ---------------- */
  function stageRooftop() {
    var bg = '';
    bg += K(L(300, 400, 1120, 400), { w: 1.2, seed: 111 });
    // 天际线
    var sky = [[300, 400], [360, 400], [360, 320], [430, 318], [430, 352], [500, 350], [500, 288],
      [572, 286], [572, 340], [648, 338], [648, 300], [724, 298], [724, 356], [806, 354],
      [806, 306], [880, 304], [880, 344], [960, 342], [960, 292], [1040, 290], [1040, 400], [1120, 400]];
    bg += K(S.poly(sky, false), { w: 1.3, seed: 112 });
    // 地面
    bg += K(L(300, 620, 1120, 588), { w: 1.1, seed: 117 });
    bg += S.hatch(S.poly([[320, 640], [1100, 606], [1100, 690], [320, 700]], true), { gap: 16, alpha: 0.12, seed: 118 });
    // 躺椅
    bg += K(S.poly([[760, 560], [900, 552], [900, 584], [760, 592]], true), { w: 1.4, seed: 119 });
    bg += K(L(770, 592, 764, 640), { w: 1.3, seed: 121 });
    bg += K(L(892, 584, 898, 632), { w: 1.3, seed: 122 });
    var spots = [[330, 448, 200, 104], [590, 492, 152, 124], [716, 168, 96, 96]];
    return { bg: bg, spots: spots };
  }

  /* ---------------- 房间 ---------------- */
  function stageRoom() {
    var bg = '';
    bg += K(L(300, 430, 1120, 430), { w: 1.1, seed: 131 });
    bg += K(R(760, 140, 300, 240), { w: 1.3, seed: 132 });
    bg += K(L(910, 140, 910, 380), { w: 0.9, seed: 133 });
    bg += K(L(760, 262, 1060, 262), { w: 0.8, seed: 134 });
    // 桌面前景弧
    bg += K(E(680, 820, 500, 150, Math.PI * 1.1, Math.PI * 1.9), { w: 1.9, amp: 1.7, seed: 135 });
    bg += K(E(680, 792, 462, 132, Math.PI * 1.12, Math.PI * 1.88), { w: 1, seed: 136 });
    bg += S.hatch(S.poly([[300, 660], [1060, 648], [1040, 700], [320, 712]], true), { gap: 15, alpha: 0.14, seed: 137 });
    // 书堆
    bg += K(R(420, 552, 130, 20), { w: 1.2, seed: 141 });
    bg += K(R(430, 528, 112, 22), { w: 1.1, seed: 142 });
    // 墙上便签
    bg += K(R(370, 220, 120, 96), { w: 1.2, seed: 143 });
    bg += K(L(388, 250, 472, 250), { w: 0.7, seed: 144, passes: 1 });
    bg += K(L(388, 274, 460, 274), { w: 0.7, seed: 145, passes: 1 });
    var spots = [[634, 360, 120, 150], [396, 456, 104, 94], [516, 474, 96, 88]];
    return { bg: bg, spots: spots };
  }

  /* ---------------- 街道 ---------------- */
  function stageStreet() {
    var bg = '';
    // 楼体
    bg += K(S.poly([[300, 440], [300, 170], [430, 178], [430, 440]], false), { w: 1.3, seed: 151 });
    bg += K(S.poly([[880, 440], [880, 190], [1060, 202], [1060, 440]], false), { w: 1.3, seed: 152 });
    bg += K(R(930, 240, 80, 60), { w: 1, seed: 153 });
    bg += K(L(300, 440, 1120, 440), { w: 1.2, seed: 154 });
    // 路面
    bg += K(E(700, 780, 520, 340, Math.PI * 1.15, Math.PI * 1.85), { w: 1.5, seed: 155 });
    bg += K(E(700, 820, 500, 340, Math.PI * 1.18, Math.PI * 1.82), { w: 1.1, seed: 156 });
    // 斑马线
    for (var i = 0; i < 5; i++) {
      var y = 500 + i * 42, half = 96 + i * 44;
      bg += K(L(640 - half, y, 640 + half, y), { w: 1.1, seed: 160 + i, passes: 1 });
    }
    bg += S.hatch(S.poly([[330, 640], [1080, 620], [1080, 700], [330, 706]], true), { gap: 17, alpha: 0.12, seed: 163 });
    var spots = [[556, 168, 100, 132], [368, 464, 156, 152], [640, 516, 100, 92]];
    return { bg: bg, spots: spots };
  }

  var STAGES = { cafe: stageCafe, park: stagePark, station: stageStation, rooftop: stageRooftop, room: stageRoom, street: stageStreet };

  /* ---------------- 物件图标（200×200）---------------- */
  function ic(body) { return body; }
  var ICON = {};
  ICON.cup = ic(
    K(E(100, 88, 44, 14), { w: 2.2, seed: 201 }) +
    K(S.poly([[56, 88], [64, 148], [136, 148], [144, 88]], false), { w: 2.4, seed: 202 }) +
    K(E(146, 112, 20, 16, -1.3, 1.5), { w: 2.1, seed: 203 }) +
    K(E(100, 158, 62, 13), { w: 2, seed: 204 }) +
    S.hatch(E(100, 164, 56, 10), { gap: 9, alpha: 0.22, seed: 205 })
  );
  ICON.note = ic(
    K(S.poly([[50, 46], [146, 40], [150, 150], [54, 156]], true), { w: 2.3, seed: 211 }) +
    K(S.poly([[118, 41], [124, 70], [148, 68]], false), { w: 1.7, seed: 212 }) +
    K(L(70, 84, 130, 80), { w: 1.5, seed: 213 }) +
    K(L(70, 106, 130, 102), { w: 1.5, seed: 214 }) +
    K(L(70, 128, 116, 124), { w: 1.5, seed: 215 })
  );
  ICON.chair = ic(
    K(S.poly([[62, 36], [138, 30], [146, 148], [70, 154]], true), { w: 2.3, seed: 221 }) +
    K(L(78, 92, 132, 88), { w: 1.6, seed: 222 }) +
    K(L(74, 154, 68, 186), { w: 2.2, seed: 223 }) +
    K(L(142, 148, 148, 180), { w: 2.2, seed: 224 })
  );
  ICON.bench = ic(
    K(S.poly([[34, 106], [166, 100], [166, 126], [34, 132]], true), { w: 2.3, seed: 231 }) +
    K(S.poly([[40, 76], [166, 70], [166, 100], [40, 106]], true), { w: 2, seed: 232 }) +
    K(L(38, 132, 32, 184), { w: 2.3, seed: 233 }) +
    K(L(164, 126, 170, 178), { w: 2.3, seed: 234 })
  );
  ICON.lamp = ic(
    K(L(96, 184, 100, 66), { w: 2.5, amp: 1.3, seed: 241 }) +
    K(E(120, 58, 26, 10, Math.PI, Math.PI * 2), { w: 2.1, seed: 242 }) +
    K(L(94, 58, 88, 74), { w: 1.8, seed: 243 }) +
    K(L(146, 58, 152, 74), { w: 1.8, seed: 244 }) +
    K(L(88, 74, 152, 74), { w: 1.8, seed: 245 }) +
    K(L(80, 184, 120, 184), { w: 2.1, seed: 246 })
  );
  ICON.tree = ic(
    K(L(100, 186, 98, 108), { w: 2.5, amp: 1.4, seed: 251 }) +
    K(E(100, 78, 52, 44), { w: 2.2, seed: 252 }) +
    K(E(78, 56, 30, 22), { w: 1.6, seed: 253 }) +
    K(E(126, 52, 26, 20), { w: 1.6, seed: 254 }) +
    S.hatch(E(100, 78, 46, 38), { gap: 10, alpha: 0.14, seed: 255 })
  );
  ICON.clock = ic(
    K(E(100, 100, 56, 56), { w: 2.4, seed: 261 }) +
    K(L(100, 100, 100, 62), { w: 2.2, seed: 262 }) +
    K(L(100, 100, 134, 112), { w: 2.2, seed: 263 }) +
    K(E(100, 100, 8, 8), { w: 1.4, seed: 264 })
  );
  ICON.door = ic(
    K(R(56, 34, 88, 148), { w: 2.4, seed: 271 }) +
    K(E(126, 110, 6, 6), { w: 1.8, seed: 272 }) +
    K(R(70, 48, 60, 48), { w: 1.4, seed: 273 })
  );
  ICON.key = ic(
    K(E(70, 84, 24, 24), { w: 2.3, seed: 281 }) +
    K(L(88, 102, 142, 156), { w: 2.3, seed: 282 }) +
    K(L(120, 134, 134, 120), { w: 2, seed: 283 }) +
    K(L(134, 148, 148, 134), { w: 2, seed: 284 })
  );
  ICON.umbrella = ic(
    K(E(100, 84, 66, 40, Math.PI, Math.PI * 2), { w: 2.4, seed: 291 }) +
    K(S.poly([[34, 84], [50, 108], [66, 84], [82, 108], [100, 84], [118, 108], [134, 84], [150, 108], [166, 84]], false), { w: 1.8, seed: 292 }) +
    K(L(100, 84, 100, 168), { w: 2.3, seed: 293 }) +
    K(E(84, 168, 16, 10, Math.PI, Math.PI * 2), { w: 2.1, seed: 294 })
  );
  ICON.light = ic(
    K(L(100, 190, 100, 96), { w: 2.5, seed: 301 }) +
    K(R(72, 24, 56, 76), { w: 2.3, seed: 302 }) +
    K(E(100, 44, 11, 11), { w: 1.8, seed: 303 }) +
    K(E(100, 62, 11, 11), { w: 1.8, seed: 304 }) +
    K(E(100, 80, 11, 11), { w: 1.8, seed: 305 })
  );
  ICON.moon = ic(
    K(E(104, 96, 58, 58), { w: 2.4, seed: 311 }) +
    S.hatch(E(104, 96, 50, 50), { gap: 11, alpha: 0.16, seed: 312 })
  );
  ICON.railing = ic(
    K(L(24, 70, 176, 70), { w: 2.4, seed: 321 }) +
    K(L(24, 120, 176, 120), { w: 2.1, seed: 322 }) +
    K(L(46, 70, 46, 120), { w: 2, seed: 323 }) +
    K(L(100, 70, 100, 120), { w: 2, seed: 324 }) +
    K(L(154, 70, 154, 120), { w: 2, seed: 325 })
  );
  ICON.book = ic(
    K(S.poly([[40, 70], [100, 56], [160, 70], [160, 140], [100, 126], [40, 140]], true), { w: 2.3, seed: 331 }) +
    K(L(100, 56, 100, 126), { w: 1.8, seed: 332 }) +
    K(L(56, 84, 92, 76), { w: 1.2, seed: 333 }) +
    K(L(56, 104, 92, 96), { w: 1.2, seed: 334 })
  );

  var ICONS = {
    cafe: ['cup', 'note', 'chair'],
    park: ['bench', 'lamp', 'tree'],
    station: ['clock', 'bench', 'door'],
    rooftop: ['railing', 'chair', 'moon'],
    room: ['lamp', 'note', 'key'],
    street: ['light', 'umbrella', 'cup']
  };

  var MAP = {
    m01: 'park', m02: 'cafe', m03: 'station', m04: 'room', m05: 'park',
    m06: 'park', m07: 'cafe', m08: 'rooftop', m09: 'street', m10: 'cafe',
    m11: 'room', m12: 'street', m13: 'station', m14: 'park', m15: 'street',
    m16: 'cafe', m17: 'room', m18: 'room', m19: 'street', m20: 'rooftop',
    m21: 'street', m22: 'room', m23: 'room', m24: 'room', m25: 'station',
    m26: 'cafe', m27: 'park', m28: 'room', m29: 'room', m30: 'park'
  };

  var PORTRAIT = { x: 66, y: 1, w: 29, h: 92, focus: [50, 16] };

  Object.keys(MAP).forEach(function (id) {
    var old = A[id];
    if (!old) return;
    var type = MAP[id];
    var stage = STAGES[type]();
    var spots = stage.spots.map(function (s) {
      return [+(s[0] / W * 100).toFixed(2), +(s[1] / H * 100).toFixed(2), +(s[2] / W * 100).toFixed(2), +(s[3] / H * 100).toFixed(2)];
    });
    A[id] = {
      bg: stage.bg,
      portrait: {
        src: (old.portrait && old.portrait.src) || '',
        spot: [PORTRAIT.x, PORTRAIT.y, PORTRAIT.w, PORTRAIT.h],
        focus: PORTRAIT.focus
      },
      options: [0, 1, 2].map(function (i) {
        var name = ICONS[type][i];
        return { spot: spots[i], art: ICON[name] || '' };
      })
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* 函数告别式 · 隐藏亲密度分支（按《90 幕分支》文档实现）
 *
 * - 每选 1 个选项：亲密度 += clamp(t+h+a, -2, +2)；总分限制在 ±12；界面不显示
 * - 4 个分叉点：m07（±4）、G1/G2/G3（±6）→ 暖 / 中 / 冷 变体，演完回主干
 * - 9 段 galgame：3 组 × 3 变体，选项带表情 + 去向，可跳过一幕
 * - 5 个结局：同行 / 断开 / 错过 / 够不到 / 平行（按文档顺序判定）
 */
(function (root) {
  'use strict';
  var S = root.STORY90, D = root.FAREWELL_DATA, Engine = root.FarewellEngine;
  if (!S || !D || !Engine) return;
  var F30 = root.FAREWELL_30 || {};
  var shapeOf = F30.shapeOf || function () { return { pts: [], view: null }; };

  var TH = S.thresholds || { m07: 4, gal: 6, affinityMin: -12, affinityMax: 12, deltaMin: -2, deltaMax: 2 };
  var LETTER = { warm: 'A', mid: 'C', cold: 'B' }; // 文档：G1A 暖 / G1B 冷 / G1C 中
  var SUFFIX = { warm: 'A', mid: 'C', cold: 'B' };

  /* ---------------- 亲密度状态 ---------------- */
  var A = root.AFFINITY = {
    score: 0,
    max: 0,
    min: 0,
    forward: [],        // 每个分叉点实际加载的变体：'warm' | 'mid' | 'cold'
    lastOptionId: '',
    reset: function () {
      this.score = 0; this.max = 0; this.min = 0; this.forward = []; this.lastOptionId = '';
    },
    deltaOf: function (opt) {
      var s = opt && opt.signal;
      if (!s) return 0;
      var t = s.t || 0, h = s.h || 0, a = s.a || 0;
      return Math.max(TH.deltaMin, Math.min(TH.deltaMax, t + h + a));
    },
    onChoice: function (opt) {
      var d = this.deltaOf(opt);
      this.score = Math.max(TH.affinityMin, Math.min(TH.affinityMax, this.score + d));
      this.max = Math.max(this.max, this.score);
      this.min = Math.min(this.min, this.score);
      this.lastOptionId = (opt && opt.id) || '';
      return d;
    },
    variantFor: function (which) {
      var s = this.score;
      if (which === 'm07') {
        if (s >= TH.m07) return 'warm';
        if (s <= -TH.m07) return 'cold';
        return 'mid';
      }
      if (s >= TH.gal) return 'warm';
      if (s <= -TH.gal) return 'cold';
      return 'mid';
    },
    noteVariant: function (v) { this.forward.push(v); },
    flipped: function () {
      for (var i = 1; i < this.forward.length; i++) {
        var a = this.forward[i - 1], b = this.forward[i];
        if ((a === 'warm' && b === 'cold') || (a === 'cold' && b === 'warm')) return true;
      }
      return false;
    },
    endingKey: function () {
      var s = this.score, max = this.max, min = this.min;
      if (s >= 8) return 'A';                                   // 同行
      if (s <= -8) return 'B';                                  // 断开
      if (s >= -7 && s <= 7 && (this.flipped() || (max >= 4 && s <= 0))) return 'D'; // 错过
      if (s >= 4 && s <= 7) return 'C';                         // 够不到
      if (s >= -3 && s <= 3 && max < 4 && min > -4) return 'E'; // 平行（全程没超过 ±4）
      return 'C';                                               // 兜底
    }
  };

  /* ---------------- 场景装配 ---------------- */
  function actLabelOf(i) {
    if (i < 8) return '第一幕 · 秋';
    if (i < 16) return '第二幕 · 冬与春';
    if (i < 24) return '第三幕 · 夏';
    return '尾声 · 第二年';
  }

  function signalObj(arr) {
    arr = arr || [0, 0, 0];
    return { t: arr[0] || 0, h: arr[1] || 0, a: arr[2] || 0 };
  }

  function echoMapOf(raw) {
    var map = {};
    (raw.echoes || []).forEach(function (e) {
      if (e && e.prevId) map[e.prevId] = e.text;
    });
    return map;
  }

  function buildScene(raw, slot) {
    return {
      id: raw.id,
      slot: slot,
      when: raw.meta || '',
      title: raw.title,
      text: (raw.body || []).slice(),
      question: raw.question || '',
      echoes: [],
      echoMap: echoMapOf(raw),
      actLabel: actLabelOf(slot - 1),
      options: (raw.options || []).map(function (o) {
        var sig = signalObj(o.signal);
        return {
          id: o.id,
          label: o.label,
          text: o.text,
          fn: o.fn,
          op: '+',
          weight: sig.t > 0 ? 1 : 0,
          key: false,
          signal: sig,
          next: null,
          bridge: o.bridge || '',
          skip: false
        };
      })
    };
  }

  var mainScenes = S.scenes.map(function (raw, i) { return buildScene(raw, i + 1); });
  var m07 = mainScenes[6];

  // m07 两个额外变体（暖版就是主干 m07）
  var variantScenes = {};
  ['mid', 'cold'].forEach(function (key) {
    var raw = S.m07variants[key];
    if (!raw) return;
    var sc = buildScene(raw, 7);
    sc.id = 'm07-' + key;
    sc.slot = 7;
    sc.text = (raw.body || []).slice();
    sc.echoMap = echoMapOf(raw);
    sc.actLabel = '第一幕 · 秋';
    variantScenes[key] = sc;
  });

  var sceneById = {};
  mainScenes.forEach(function (sc) { sceneById[sc.id] = sc; });
  Object.keys(variantScenes).forEach(function (k) { sceneById['m07-' + k] = variantScenes[k]; });

  /* ---------------- 节拍：30 幕 + 3 段 galgame + 间章/聊天 ---------------- */
  var beats = [];
  function pushScene(id, extra) {
    var b = { type: 'scene', slot: sceneById[id] ? sceneById[id].slot : null, default: id, id: id };
    if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; });
    beats.push(b);
  }
  function pushInter(id) { beats.push({ type: 'interlude', id: id }); }
  function pushChat(id) { beats.push({ type: 'chat', id: id }); }
  function pushGal(group, after) { beats.push({ type: 'galgame', group: group, after: after, id: group }); }

  var PLAN = [
    ['m01'], ['m02'], ['inter', 'n1'], ['m03'], ['m04'], ['m05'], ['m06'],
    ['m07branch'], ['m08'], ['m09'], ['m10'], ['gal', 'G1'],
    ['m11'], ['m12'], ['chat', 'c4'], ['inter', 'n3'], ['m13'], ['inter', 'n2'],
    ['m14'], ['m15'], ['m16'], ['m17'], ['gal', 'G2'], ['chat', 'c2'],
    ['m18'], ['m19'], ['m20'], ['m21'], ['m22'], ['m23'], ['m24'],
    ['m25'], ['gal', 'G3'], ['chat', 'c3'], ['m26'], ['chat', 'c5'],
    ['m27'], ['m28'], ['m29'], ['inter', 'n4'], ['inter', 'n5'],
    ['m30'], ['inter', 'n6']
  ];
  PLAN.forEach(function (step) {
    if (step[0] === 'inter') pushInter(step[1]);
    else if (step[0] === 'chat') pushChat(step[1]);
    else if (step[0] === 'm07branch') pushScene('m07', { branch: 'm07' });
    else if (step[0] === 'gal') pushGal(step[1], step[1] === 'G1' ? 'm10' : (step[1] === 'G2' ? 'm17' : 'm25'));
    else pushScene(step[0]);
  });


  /* 间章/聊天按新时间线重排后，统一 actLabel（按所在位置） */
  function reflowActLabels() {
    var slot = 1;
    beats.forEach(function (b) {
      if (b.type === 'scene') {
        var sc = sceneById[b.default === 'm07' ? 'm07' : b.default];
        if (sc) slot = sc.slot;
        return;
      }
      var label = slot <= 8 ? '第一幕 · 初秋' : (slot <= 16 ? '第二幕 · 隆冬' : (slot <= 24 ? '第三幕 · 夏' : '尾声 · 第二年'));
      var list = b.type === 'chat' ? (D.chats || []) : (D.interludes || []);
      list.forEach(function (x) { if (x.id === b.id) x.actLabel = label; });
    });
  }
  reflowActLabels();


  /* 聊天回复明确“不影响走向”：清掉旧版 next（否则 resolveBeatScene 会回落到默认幕） */
  (function stripChatNext() {
    (D.chats || []).forEach(function (c) {
      (c.replies || []).forEach(function (r) { r.next = null; });
      if (c.reply) c.reply.next = null;
    });
  })();

  /* ---------------- 结局 ---------------- */
  var SHAPE_OF = { A: 'heart', B: 'heart-half', C: 'asymptote', D: 'pause', E: 'two-lines' };
  var endings = {};
  var endingsOrder = [];
  (S.endings || []).forEach(function (e) {
    endings[e.code] = {
      id: e.code,
      order: e.code,
      title: e.title,
      en: e.code,
      lead: e.lead,
      text: e.text,
      principle: e.principle,
      shapeName: e.shapeName,
      shape: SHAPE_OF[e.code] || 'heart',
      good: e.code === 'A'
    };
    endingsOrder.push(e.code);
  });

  /* ---------------- 覆盖 DATA ---------------- */
  D.scenes = mainScenes;
  D.sceneById = sceneById;
  D.slots = mainScenes.map(function (sc) { return [sc.id]; });
  D.slotCount = mainScenes.length;
  D.beats = beats;
  D.endings = endings;
  D.endingsOrder = endingsOrder;
  D.echoFallback = S.fallbackEcho || '那天之后，你们有几天没说话。';
  D.galgame = S.galgame;
  D.m07Variants = variantScenes;

  /* ---------------- galgame 变体选择 ---------------- */
  D.galgameUnitFor = function (group) {
    var v = A.variantFor('gal');
    var unit = S.galgame[group + SUFFIX[v]] || S.galgame[group + 'A'];
    if (!unit) return null;
    return {
      id: group,
      variant: v,
      title: unit.title,
      meta: unit.meta,
      echo: unit.echo,
      dialogue: unit.dialogue || [],
      portraitFrom: group === 'G1' ? 'm10' : (group === 'G2' ? 'm17' : 'm25'),
      options: (function () {
        var counts = {};
        (unit.options || []).forEach(function (o) { counts[o.next] = (counts[o.next] || 0) + 1; });
        var normal = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
        return (unit.options || []).map(function (o) {
          var sig = signalObj(o.signal);
          return {
            id: o.id,
            label: o.label,
            expr: o.expr,
            signal: sig,
            delta: o.delta,
            next: o.next,
            skip: o.next !== normal
          };
        });
      })()
    };
  };
  D.m07SceneFor = function () {
    var v = A.variantFor('m07');
    return { variant: v, scene: v === 'warm' ? m07 : (variantScenes[v] || m07) };
  };

  /* ---------------- 判定覆盖 ---------------- */
  Engine.classify = function () {
    var key = A.endingKey();
    var ending = endings[key] || endings.A;
    var shape = shapeOf(ending.shape);
    return {
      kind: key,
      ending: ending,
      pts: shape.pts,
      view: shape.view,
      sums: { t: A.score, h: 0, a: 0 },
      note: '',
      tags: []
    };
  };


  /* ---------------- 素材别名 & 选项位修正 ---------------- */
  (function fixArt() {
    var ART = root.FAREWELL_ART;
    if (!ART) return;
    // m07 两个变体复用 m07 的场景与肖像
    if (ART.m07) {
      ['mid', 'cold'].forEach(function (k) {
        var id = 'm07-' + k;
        if (ART[id]) return;
        ART[id] = { bg: ART.m07.bg, fg: ART.m07.fg, portrait: ART.m07.portrait,
          options: ART.m07.options.map(function (o) { return { spot: o.spot.slice(), art: o.art }; }) };
      });
    }
    // 选项位：整组平移/缩放，保证 (1) 不进人物像区域 (2) 三个物件互不重叠
    var BAND_L = 35.5, BAND_R = 56.5;
    Object.keys(ART).forEach(function (id) {
      var art = ART[id];
      if (!art || !art.options || art.options.length < 2) return;
      var spots = art.options.map(function (o) { return o.spot; });
      var minX = Math.min.apply(null, spots.map(function (s) { return s[0]; }));
      var maxR = Math.max.apply(null, spots.map(function (s) { return s[0] + s[2]; }));
      var width = Math.max(1, maxR - minX);
      var band = BAND_R - BAND_L;
      var scaleX = width > band ? band / width : 1;
      var span = width * scaleX;
      var startX = Math.min(Math.max(minX, BAND_L), BAND_R - span);
      // 垂直：整体收进 12~94
      var minY = Math.min.apply(null, spots.map(function (s) { return s[1]; }));
      var maxB = Math.max.apply(null, spots.map(function (s) { return s[1] + s[3]; }));
      var startY = Math.min(Math.max(minY, 8), 96 - (maxB - minY));
      spots.forEach(function (sp) {
        sp[0] = startX + (sp[0] - minX) * scaleX;
        sp[2] = sp[2] * scaleX;
        sp[1] = startY + (sp[1] - minY);
      });
      // 迭代分离：两两重叠就错开
      function overlap(a, b) {
        var ox = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
        var oy = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
        return (ox > 1 && oy > 1) ? { x: ox, y: oy } : null;
      }
      for (var pass = 0; pass < 6; pass++) {
        var moved = false;
        for (var i = 0; i < spots.length; i++) {
          for (var j = i + 1; j < spots.length; j++) {
            var ov = overlap(spots[i], spots[j]);
            if (!ov) continue;
            moved = true;
            var s2 = spots[j];
            var leftRoom = s2[0] - BAND_L;
            if (leftRoom > ov.x + 2) { s2[0] -= ov.x + 2; }
            else { s2[1] = Math.min(94 - s2[3], s2[1] + ov.y + 2); }
          }
        }
        if (!moved) break;
      }
      // 最终再夹一遍，确保不出人物像区域
      spots.forEach(function (sp) {
        if (sp[0] + sp[2] > BAND_R) sp[0] = Math.max(BAND_L, BAND_R - sp[2]);
      });
    });

    // 选项图标改成「动作线稿」：按该幕选项的动作映射，不再用场景道具
    var ICONS = root.ACTION_ICONS, pick = root.actionIconFor;
    if (ICONS && pick) {
      Object.keys(ART).forEach(function (id) {
        var art = ART[id], sc = (D.sceneById && D.sceneById[id]) || variantScenes[id.replace('m07-', 'm07-')] || null;
        if (!art || !art.options) return;
        art.options.forEach(function (o, i) {
          var raw = null;
          if (sc && sc.options && sc.options[i]) raw = sc.options[i];
          else if (ART[id] && id.indexOf('m07-') === 0 && m07.options[i]) raw = m07.options[i];
          if (!raw) return;
          var key = pick(raw.label, raw.text);
          if (ICONS[key]) o.art = ICONS[key];
        });
      });
    }
  })();
  root.FAREWELL_AFFINITY = A;
})(typeof window !== 'undefined' ? window : globalThis);

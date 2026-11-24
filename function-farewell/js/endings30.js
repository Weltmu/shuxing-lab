/* 函数式告别 · 30 个结局（分档组合）
 *
 * 累计三个量：T 温度、H 坦诚、A 主动（每幕 -1/0/+1，共 30 幕）
 *   T 分 5 档、H 分 3 档、A 分 2 档 → 5 × 3 × 2 = 30 个结局
 * 结局正文 = 温度段 + 坦诚段 + 主动段，标题由档位组合查表。
 */
(function (root) {
  'use strict';

  // 温度 5 档（最冷 → 最暖）
  var bodies = [
    '你们把该说的都省掉了。最后一次见面是在某个路口，点了个头，各走各的。后来你偶尔想起那半年，想的不是她，而是自己当时为什么一句话都没说。',
    '没有谁先提分开。消息从每天变成每周，从每周变成节日，最后连节日也省了。你们之间那条线，是被时间一点点磨薄的，不是被谁剪断的。',
    '你们一直保持着一种刚好的距离：不远到失联，不近到坦白。见面还是会笑，聊的还是那些安全的话题，只是谁都没有把它说破。',
    '你们差一点就说了。差一点的那个下午，什么都没发生，之后也再没有那样的下午。回头看，每个岔路口你们都走得不算错，只是从来没有同时往同一个方向走。',
    '十二幕、三十次选择，你都一次次朝她走过去。你们吵过、沉默过、错过车，也一起淋过雨。多年以后你还记得那个九月的傍晚，她在长椅上朝旁边挪了挪。'
  ];

  // 坦诚 3 档（绕开 → 说开）
  var honesty = [
    '那些真正想说的话，你到最后也没说出口。它们留在草稿箱里、留在没寄出的信里、留在红灯下的二十秒里。',
    '你说了其中的一部分，留了另一部分。她大概也知道你留着，只是没有追问，你们在这件事上很有默契。',
    '你最终把话说全了，包括那些显得矫情的地方。说完之后无论结果如何，都不算白走一趟。'
  ];

  // 主动 2 档（被动 / 主动）
  var agency = [
    '后来你常常想，如果那天你先迈出那一步，故事会不会不一样。',
    '后来你明白，先开口这件事本身就是一种回答——你至少没有让她一个人等。'
  ];

  // 30 个标题：T档 × H档 × A档
  var titles = [
    ['两不相欠', '说清楚的那天', '一个人的长椅'],
    ['慢慢淡掉', '迟到的信', '隔着六个小时'],
    ['平行', '差一点点', '还在路上'],
    ['没有说出口', '留了灯', '还是她'],
    ['一路顺风', '同一张长椅', '同行'],
    ['先开口的人', '冬天以前', '照常'],
    ['雨里那把伞', '空座位', '寄出去的书'],
    ['九十秒', '除夕', '天台的月亮'],
    ['沉默的三天', '第二年的花', '全部说完'],
    ['旧书摊', '一整年', '那一年的光']
  ];

  var en = ['SETTLED', 'CLEARED', 'ONE BENCH', 'FADE', 'LATE LETTER', 'SIX HOURS',
    'PARALLEL', 'ALMOST', 'ON THE WAY', 'UNSAID', 'LIGHT LEFT ON', 'STILL HER',
    'SAFE TRIP', 'SAME BENCH', 'TOGETHER', 'FIRST TO SPEAK', 'BEFORE WINTER', 'AS USUAL',
    'IN THE RAIN', 'EMPTY SEAT', 'THE BOOK', 'NINETY SECONDS', 'NEW YEAR', 'MOON',
    'THREE DAYS', 'SPRING', 'ALL SAID', 'OLD BOOKS', 'A WHOLE YEAR', 'THE LIGHT'];

  var shapes = ['scissors-line', 'straight-line', 'empty-bench',
    'fading-spiral', 'folded-letter', 'two-dots',
    'two-lines', 'asymptote', 'road',
    'blank-page', 'lamp', 'heart-half',
    'paper-plane', 'heart-open', 'heart',
    'key', 'snowflake', 'circle',
    'umbrella', 'two-cups', 'folded-page',
    'traffic-light', 'firework', 'moon',
    'pause', 'flower', 'open-book',
    'book-stack', 'calendar', 'light-year'];

  var flatTitles = [].concat.apply([], titles);
  var SHAPE_NAMES = {"heart": "完整的心", "heart-half": "半颗心", "heart-open": "分开的两半", "scissors-line": "两道平行的划痕", "straight-line": "一条直线", "empty-bench": "空着的长椅", "fading-spiral": "慢慢散开的螺线", "folded-letter": "折起來的信", "two-dots": "隔开的两点", "two-lines": "两条平行线", "asymptote": "始终差一点的曲线", "road": "一条路", "blank-page": "一张白纸", "lamp": "留着的灯", "paper-plane": "纸飞机", "key": "一把钥匙", "snowflake": "一朵雪花", "circle": "一个圆", "umbrella": "一把伞", "two-cups": "两只杯子", "folded-page": "折角的一页", "traffic-light": "红灯", "firework": "烟花", "moon": "月亮", "pause": "一个停顿", "flower": "一朵花", "open-book": "摊开的书", "book-stack": "一摞书", "calendar": "一年日历", "light-year": "一圈光"};
  var list = [];
  for (var t = 0; t < 5; t++) {
    for (var h = 0; h < 3; h++) {
      for (var a = 0; a < 2; a++) {
        var idx = t * 6 + h * 2 + a;
        list.push({
          id: 'e' + (idx < 9 ? '0' : '') + (idx + 1),
          index: idx,
          tb: t,
          hb: h,
          ab: a,
          title: flatTitles[idx],
          en: en[idx],
          shape: shapes[idx],
          shapeName: SHAPE_NAMES[shapes[idx]] || '',
          text: bodies[t] + honesty[h] + agency[a],
          principle: [
            '有些关系不是断的，是从来没有真正接上过。',
            '大多数关系不是结束，是渐渐不再继续。',
            '平行不相交，也是一种稳定。',
            '没说出口的话，也会留下痕迹。',
            '完整的心不是一次做对的，是每一次都没有少留一点。'
          ][t]
        });
      }
    }
  }


  // 好结局放在最优档：T 最高 + 坦诚 + 主动
  (function () {
    var a = list[14];  // e15 原为 同行 / 心
    var b = list[29];  // e30 原为 那一年的光
    ['title', 'en', 'shape', 'shapeName', 'text', 'principle'].forEach(function (k) {
      var t = a[k]; a[k] = b[k]; b[k] = t;
    });
  })();

  var byId = {};
  list.forEach(function (e) { byId[e.id] = e; });

  function bucketOf(value, table) {
    for (var i = 0; i < table.length; i++) if (value <= table[i]) return i;
    return table.length;
  }

  root.FAREWELL_ENDINGS30 = {
    list: list,
    byId: byId,
    count: list.length,
    // 30 幕信号 → 结局
    pick: function (sumT, sumH, sumA, total) {
      var t = bucketOf(sumT, [-6, -2, 2, 6]);          // 5 档
      var h = bucketOf(sumH, [-5, 1]);                   // 3 档
      var a = sumA >= 0 ? 1 : 0;
      var idx = t * 6 + h * 2 + a;
      return list[idx];
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

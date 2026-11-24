/* 内容测试（30 幕长流程版）：node tests/content-test.js */
'use strict';

require('../js/data.js');
require('../js/engine.js');
require('../js/story30.js');
require('../js/endings30.js');
require('../js/data30.js');

var DATA = globalThis.FAREWELL_DATA;
var Engine = globalThis.FarewellEngine;
var STORY = globalThis.FAREWELL_STORY30;
var END = globalThis.FAREWELL_ENDINGS30;

var failures = 0;
function assert(cond, label, detail) {
  if (cond) console.log('  ok   ' + label);
  else { failures += 1; console.error('  FAIL ' + label + (detail ? ' — ' + detail : '')); }
}
function cn(str) { var m = String(str).match(/[\u4e00-\u9fff]/g); return m ? m.length : 0; }

console.log('\n[1] 故事结构');
assert(STORY.scenes.length === 30, '30 幕', String(STORY.scenes.length));
assert(DATA.scenes.length === 30 && DATA.slots.length === 30, '装配后 30 场景 / 30 槽位');
assert(DATA.beats.length >= 30, '节拍包含 30 幕', String(DATA.beats.length));
var optCount = 0;
var minLen = 1e9;
var maxLen = 0;
STORY.scenes.forEach(function (sc, i) {
  assert(sc.slot === i + 1, sc.id + ' 槽位有序');
  assert(sc.options.length === 3, sc.id + ' 三个选项');
  optCount += sc.options.length;
  var len = cn(sc.text.join(''));
  minLen = Math.min(minLen, len);
  maxLen = Math.max(maxLen, len);
  if (len < 120) failures += 1;
  assert(!!sc.title && !!sc.when && !!sc.question, sc.id + ' 标题/时间/问题齐全');
  sc.options.forEach(function (o) {
    assert(!!DATA.functions[o.fn], o.id + ' 有效函数', o.fn);
    assert(o.signal && [-1, 0, 1].indexOf(o.signal.t) !== -1 && [-1, 0, 1].indexOf(o.signal.h) !== -1 &&
      [-1, 0, 1].indexOf(o.signal.a) !== -1, o.id + ' 信号合法');
    assert(!!o.label && !!o.text, o.id + ' 有标签与说明');
  });
});
assert(optCount === 90, '共 90 个选项', String(optCount));
console.log('  正文字数 min/max:', minLen, maxLen);

console.log('\n[2] 回响与分支');
var order = {};
STORY.scenes.forEach(function (sc) { sc.options.forEach(function (o) { order[o.id] = sc.slot; }); });
var echoes = 0;
var badRef = 0;
STORY.scenes.forEach(function (sc) {
  (sc.echoes || []).forEach(function (e) {
    echoes += 1;
    var c = e.if && e.if.choice;
    if (c && (order[c] === undefined || order[c] >= sc.slot)) badRef += 1;
    if (!e.text) badRef += 1;
  });
});
assert(badRef === 0, '回响只引用更早的选择', String(badRef));
assert(echoes >= 50, '回响条目充足', String(echoes));
DATA.beats.forEach(function (b, i) {
  if (b.type !== 'scene') return;
  var sc = DATA.sceneById[b.id];
  assert(!!sc, '节拍场景存在', b.id);
});

console.log('\n[3] 30 个结局');
assert(DATA.endingsOrder.length === 30, '30 个结局', String(DATA.endingsOrder.length));
assert(END.list.length === 30, '结局表 30 条');
var titles = {};
DATA.endingsOrder.forEach(function (id) {
  var e = DATA.endings[id];
  assert(!!e && !!e.title && !!e.en && !!e.shape, id + ' 完整');
  assert(!titles[e.title], id + ' 标题不重复');
  titles[e.title] = true;
  assert(cn(e.text) >= 100, id + ' 正文够长', String(cn(e.text)));
  assert(!!e.principle, id + ' 有一句道理');
});
assert(DATA.endings.e30 && DATA.endings.e30.good === true && DATA.endings.e30.title === '同行', '好结局是最优档的同行', DATA.endings.e30 && DATA.endings.e30.title);

console.log('\n[4] 判定：累计信号 → 结局');
function pathOf(pick) {
  var out = [];
  for (var i = 0; i < DATA.scenes.length; i++) out.push(pick(DATA.scenes[i]));
  return out;
}
var warm = pathOf(function (sc) { return sc.options.reduce(function (a, o) { return o.signal.t > a.signal.t ? o : a; }, sc.options[0]); });
var cold = pathOf(function (sc) { return sc.options.reduce(function (a, o) { return o.signal.t < a.signal.t ? o : a; }, sc.options[0]); });
var rWarm = Engine.classify(warm);
var rCold = Engine.classify(cold);
assert(rWarm.kind !== rCold.kind, '全暖与全冷落到不同结局', rWarm.kind + ' vs ' + rCold.kind);
assert(!!DATA.endings[rWarm.kind] && !!DATA.endings[rCold.kind], '判定结果都是合法结局');
assert(rWarm.pts.length > 100 && rWarm.view && rWarm.view.x1 > rWarm.view.x0, '结局形状有采样点与视野');

var seen = {};
var seed = 20261123;
function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
var SAMPLES = 6000;
for (var k = 0; k < SAMPLES; k++) {
  var p = pathOf(function (sc) { return sc.options[Math.floor(rnd() * 3)]; });
  var r = Engine.classify(p);
  if (!DATA.endings[r.kind]) { failures += 1; console.error('  FAIL 非法结局 ' + r.kind); break; }
  seen[r.kind] = true;
}
var reachable = Object.keys(seen).length;
assert(reachable >= 15, '抽样可达结局数 ≥ 15', String(reachable));

console.log('\n[5] 形状模板');
var shapeIds = {};
END.list.forEach(function (e) { shapeIds[e.shape] = true; });
assert(Object.keys(shapeIds).length >= 20, '至少 20 种不同形状', String(Object.keys(shapeIds).length));
var badShape = 0;
Object.keys(shapeIds).forEach(function (sid) {
  try {
    var s = DATA.endingsOrder.length && globalThis.FAREWELL_30.shapeOf(sid);
    if (!s || !s.pts.length) badShape += 1;
  } catch (err) { badShape += 1; }
});
assert(badShape === 0, '每个形状都能生成点位', String(badShape));

console.log('\n[6] 剧情衔接（bridge）');
var noBridge = 0;
DATA.scenes.forEach(function (sc) {
  sc.options.forEach(function (o) {
    if (sc.slot < DATA.slotCount && !o.bridge) noBridge += 1;
  });
});
assert(noBridge === 0, '除最后一幕外每个选项都有过渡句', String(noBridge));

if (failures) {
  console.error('\nFAILED: ' + failures);
  process.exit(1);
}
console.log('\nPASS: 30 幕内容与判定检查全部通过');

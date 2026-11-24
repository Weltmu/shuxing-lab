/* 隐藏亲密度分支 · 纯逻辑测试（Node 环境，不依赖浏览器）
 * 跑：node tests/affinity-test.js
 */
'use strict';
const fs = require('fs');
const vm = require('vm');

const ctx = { console };
ctx.window = ctx;
ctx.globalThis = ctx;
ctx.localStorage = { getItem() { return null; }, setItem() {} };
vm.createContext(ctx);

const FILES = [
  'js/data.js', 'js/engine.js',
  'js/sketch.js', 'js/scene-art.js', 'js/scene30.js',
  'js/story30.js', 'js/endings30.js',
  'js/data30.js', 'js/action-icons.js', 'js/story90.js', 'js/affinity90.js'
];
FILES.forEach((f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }));

const D = ctx.FAREWELL_DATA;
const A = ctx.FAREWELL_AFFINITY;
const E = ctx.FarewellEngine;

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass += 1; }
  else { fail += 1; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); }
}

/* ---------------- 1. 结构 ---------------- */
ok(D.scenes.length === 30, '30 幕主干', D.scenes.length);
ok(Object.keys(D.m07Variants).length === 2, 'm07 两个变体');
ok(Object.keys(D.galgame).length === 9, 'galgame 9 段', Object.keys(D.galgame).length);
ok(Object.keys(D.endings).length === 5, '5 个结局', Object.keys(D.endings));
ok(Object.keys(D.endings).every((k) => !!D.endings[k].lead), '每个结局都有 lead');
ok((D.beats || []).length >= 43, '节拍数量', D.beats.length);

const sceneBeats = D.beats.filter((b) => b.type === 'scene');
const galBeats = D.beats.filter((b) => b.type === 'galgame');
ok(sceneBeats.length === 30, '30 个场景节拍', sceneBeats.length);
ok(galBeats.length === 3, '3 个 galgame 节拍', galBeats.length);
ok(!!sceneBeats.find((b) => b.branch === 'm07'), 'm07 标记为分叉点');

/* 一局最多 33 个单元：30 幕 + 3 段 galgame */
ok(sceneBeats.length + galBeats.length === 33, '一次游玩 33 个单元');

/* ---------------- 2. 亲密度 ---------------- */
A.reset();
ok(A.score === 0, '起始分数 0');
const plus3 = { signal: { t: 1, h: 1, a: 1 } };
const minus3 = { signal: { t: -1, h: -1, a: -1 } };
ok(A.deltaOf(plus3) === 2, 't+h+a=3 限幅到 +2', A.deltaOf(plus3));
ok(A.deltaOf(minus3) === -2, 't+h+a=-3 限幅到 -2', A.deltaOf(minus3));
ok(A.deltaOf({ signal: { t: 1, h: 0, a: 0 } }) === 1, 't+h+a=1 → +1');

A.reset();
for (let i = 0; i < 20; i++) A.onChoice(plus3);
ok(A.score === 12, '总分上限 +12', A.score);
A.reset();
for (let i = 0; i < 20; i++) A.onChoice(minus3);
ok(A.score === -12, '总分下限 -12', A.score);

/* ---------------- 3. 分叉阈值 ---------------- */
function variantAt(score, which) {
  A.reset();
  A.score = score;
  return A.variantFor(which);
}
ok(variantAt(4, 'm07') === 'warm', 'm07 S=+4 取暖版');
ok(variantAt(3, 'm07') === 'mid', 'm07 S=+3 取中版');
ok(variantAt(-3, 'm07') === 'mid', 'm07 S=-3 取中版');
ok(variantAt(-4, 'm07') === 'cold', 'm07 S=-4 取冷版');
ok(variantAt(6, 'gal') === 'warm', 'G S=+6 取暖版');
ok(variantAt(5, 'gal') === 'mid', 'G S=+5 取中版');
ok(variantAt(-6, 'gal') === 'cold', 'G S=-6 取冷版');

/* galgame 单元：同一分叉点不同分数加载不同变体 */
A.reset(); A.score = 6;
const gWarm = D.galgameUnitFor('G1');
A.reset(); A.score = 0;
const gMid = D.galgameUnitFor('G1');
A.reset(); A.score = -6;
const gCold = D.galgameUnitFor('G1');
ok(gWarm.title !== gMid.title && gMid.title !== gCold.title && gWarm.title !== gCold.title,
  'G1 三档变体标题不同', [gWarm.title, gMid.title, gCold.title]);
ok(gWarm.options.length === 3 && gMid.options.length === 3 && gCold.options.length === 3, 'galgame 每段 3 个选项');
ok(gWarm.dialogue.length >= 3, 'galgame 至少 3 句对话', gWarm.dialogue.length);
const skipOpts = gWarm.options.filter((o) => o.skip);
ok(skipOpts.length === 1, 'galgame 恰好一条跳过一幕', skipOpts.length);

/* m07 场景选择 */
A.reset(); A.score = 5;
ok(D.m07SceneFor().scene.id === 'm07', 'S=+5 加载主干 m07（暖版）');
A.reset(); A.score = 0;
const midScene = D.m07SceneFor();
ok(midScene.scene.id === 'm07-mid', 'S=0 加载 m07 中版', midScene.scene.id);
A.reset(); A.score = -5;
ok(D.m07SceneFor().scene.id === 'm07-cold', 'S=-5 加载 m07 冷版');

/* ---------------- 4. 结局判定 ---------------- */
function endingFor(score, forward, max, min) {
  A.reset();
  A.score = score;
  A.forward = forward || [];
  A.max = max === undefined ? Math.max(0, score) : max;
  A.min = min === undefined ? Math.min(0, score) : min;
  return A.endingKey();
}
ok(endingFor(10, ['warm', 'warm', 'warm', 'warm'], 10) === 'A', '同行：S>=+8');
ok(endingFor(-10, ['cold', 'cold', 'cold', 'cold'], 0, -10) === 'B', '断开：S<=-8');
ok(endingFor(2, ['warm', 'warm', 'cold', 'cold'], 6, 2) === 'D', '错过：变体翻转');
ok(endingFor(0, ['warm', 'warm', 'warm', 'warm'], 6, 0) === 'D', '错过：曾经 +4 又跌回 0');
ok(endingFor(5, ['mid', 'mid', 'mid', 'mid'], 5) === 'C', '够不到：+4..+7');
ok(endingFor(2, ['mid', 'mid', 'mid', 'mid'], 2, 0) === 'E', '平行：-3..+3 且从未超 ±4');
ok(endingFor(-2, ['mid', 'mid', 'mid', 'mid'], 1, -2) === 'E', '平行：负分小范围');

/* ---------------- 5. 回响 ---------------- */
let echoProblems = [];
D.scenes.forEach((sc) => {
  if (sc.id === 'm01') return;
  const n = Object.keys(sc.echoMap || {}).length;
  if (sc.id === 'm11' || sc.id === 'm18' || sc.id === 'm26') {
    if (n !== 9) echoProblems.push(sc.id + ':' + n);
  } else if (n !== 3) {
    echoProblems.push(sc.id + ':' + n);
  }
});
ok(echoProblems.length === 0, '回响条数（普通 3 / galgame 后 9）', echoProblems);

/* 回响必须按上一幕选项 key 取 */
const m02 = D.sceneById.m02;
const m01 = D.sceneById.m01;
ok(m01.options.every((o) => !!m02.echoMap[o.id]), 'm02 回响覆盖 m01 的三个选项');

/* ---------------- 6. 函数覆盖 15 个 ---------------- */
const fns = new Set();
D.scenes.forEach((sc) => sc.options.forEach((o) => fns.add(o.fn)));
Object.keys(D.galgame).forEach((g) => {});
const used = Array.from(fns).filter(Boolean).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
const missing = [];
for (let i = 1; i <= 15; i++) if (!fns.has('f' + i)) missing.push('f' + i);
ok(missing.length === 0, '15 个函数全部出现', missing);

/* ---------------- 7. 过期文案 ---------------- */
const textBlob = [
  D.scenes.map((s) => [s.title, s.text.join(''), s.question].join('')).join(''),
  Object.keys(D.endings).map((k) => D.endings[k].text + D.endings[k].lead).join('')
].join('');
const stale = ['八个', '八次', '十二幕', '十二次', '十二个'].filter((w) => {
  let idx = textBlob.indexOf(w);
  while (idx >= 0) {
    // 「七八次」是正常 prose，不算过期设计数字
    if (!(w === '八次' && textBlob.slice(Math.max(0, idx - 1), idx) === '七')) return true;
    idx = textBlob.indexOf(w, idx + 1);
  }
  return false;
});
ok(stale.length === 0, '无过期数字（八个/八次/十二…）', stale);


/* ---------------- 8. 动作图标（不是场景道具） ---------------- */
const ICONS = ctx.ACTION_ICONS;
const pickIcon = ctx.actionIconFor;
ok(!!ICONS && Object.keys(ICONS).length >= 18, '动作图标库存在', ICONS ? Object.keys(ICONS).length : 0);
const ART = ctx.FAREWELL_ART;
let iconMiss = [], iconWrong = [];
D.scenes.forEach((sc) => {
  const art = ART[sc.id];
  if (!art || !art.options) { iconMiss.push(sc.id); return; }
  sc.options.forEach((o, i) => {
    const a = art.options[i] && art.options[i].art;
    if (!a) { iconMiss.push(sc.id + ':' + i); return; }
    const want = ICONS[pickIcon(o.label, o.text)];
    if (want && a !== want) iconWrong.push(sc.id + ':' + i);
  });
});
ok(iconMiss.length === 0, '每一幕三个选项都有图标', iconMiss.slice(0, 6));
ok(iconWrong.length === 0, '选项图标是动作线稿（非场景道具）', iconWrong.slice(0, 6));
// m01 三个动作应分别为 坐下 / 走开 / 等待
ok(ART.m01.options[0].art === ICONS.sit && ART.m01.options[1].art === ICONS['walk-away'],
  'm01 图标映射正确（坐下/走开）');

/* ---------------- 9. bridge 过渡句 ---------------- */
const badBridge = [];
D.scenes.slice(0, 29).forEach((sc) => {
  sc.options.forEach((o) => {
    const b = o.bridge || '';
    if (b.length < 8 || b.length > 26) badBridge.push(sc.id + ':' + b);
    if (b && o.text && b.indexOf(o.text) >= 0) badBridge.push(sc.id + ' 复读选项');
  });
});
ok(badBridge.length === 0, '每个选项都有 8~26 字的过渡句且不复读选项', badBridge.slice(0, 5));

/* ---------------- 10. 时间线重排 ---------------- */
const chatBeats = D.beats.filter((b) => b.type === 'chat');
const interBeats = D.beats.filter((b) => b.type === 'interlude');
ok(D.beats.length === 43, '节拍总数 43（30+3+6+4）', D.beats.length);
ok(chatBeats.length === 4 && !chatBeats.some((b) => b.id === 'c1'), '聊天 4 段且 c1 已合并进 m04');
ok(interBeats.length === 6, '间章 6 段', interBeats.length);
const noAct = [];
(D.chats || []).concat(D.interludes || []).forEach((x) => {
  if (!x.actLabel) noAct.push(x.id);
});
ok(noAct.length === 0, '聊天/间章 actLabel 均已重排', noAct);
const order = D.beats.map((b) => b.id);
ok(order.indexOf('c4') < order.indexOf('n3') && order.indexOf('n3') < order.indexOf('m13'),
  '二月聊天/隆冬间章在 m13 之前');
ok(order.indexOf('c3') > order.indexOf('m25'), '离别后聊天在 m25 之后');
ok(order[order.length - 1] === 'n6', '尾声间章收在最后');

/* ---------------- 汇总 ---------------- */
console.log('\n亲和度/分支测试：' + pass + ' 通过，' + fail + ' 失败');
if (fail > 0) process.exit(1);

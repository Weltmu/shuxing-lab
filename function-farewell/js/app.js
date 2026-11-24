/* 函数告别式 — 开场、八问与结局
 * 单 Canvas 开场变形、单 #scene 转场、顶栏内联状态、单曲线背景。
 * 结局先完成 F(x) 绘图，再逐字显示正文与原理；题目、选项、
 * 函数映射、F(x) 求和和结局判定逻辑保持不变。
 */
(function () {
  'use strict';

  var DATA = window.FAREWELL_DATA;
  var Engine = window.FarewellEngine;
  var Plot = window.FarewellPlot;
  if (!DATA || !Engine) return;

  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (err) { /* ignore */ }

  var coarse = false;
  try {
    coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  } catch (err) { /* ignore */ }

  var CANVAS_FILTER = false;
  try {
    var probeCtx = document.createElement('canvas').getContext('2d');
    probeCtx.filter = 'blur(1px)';
    CANVAS_FILTER = probeCtx.filter === 'blur(1px)';
  } catch (err) { /* ignore */ }

  var SAMPLES = 240;
  var INTRO_R = 90;
  var COMPRESS_DUR = 700;
  var MORPH_DUR = 950;
  var MORPH_HOLD = 90;
  var ENTRY_DUR = 600;
  var SCENE_OUT = 250;
  var SCENE_IN = 300;
  var OPT_STAGGER = 60;
  var OPT_IN = 300;
  var BG_LOCK = 1000; // 旧线 350ms + 新线 600ms，再留一点余量
  var TYPE_BASE_MS = 28;
  var TYPE_SOFT_PAUSE = 62;
  var TYPE_LONG_PAUSE = 132;
  var BULGE_MAX = 26;
  var BULGE_RANGE = 320;
  var BULGE_SIGMA = 0.85;
  var TOUCH_BULGE_MS = 900;
  var HINT_TYPE_MS = 80;
  var HINT_PAUSE_MS = 240;
  var HINT_HOLD_MS = 2400;
  var HINT_ERASE_MS = 40;
  var HINT_PHRASES = [
    '轻触这团未干的墨',
    '靠近些，看它如何回应',
    '所有的曲线，都从这一点出发',
    '有些告别，以函数的形式抵达',
    '你与它的距离，也是它的形状',
    '三十次选择之后，墨会给出形状',
    '墨迹未干，结局未定',
    '点一下，让故事开始求和'
  ];
  var SIGN_ITEMS = ['函数告别式', '恋爱 · 人生 · 感悟'];
  var SIGN_IN_MS = 650;
  var SIGN_HOLD_MS = 2400;
  var SIGN_OUT_SPREAD = 360;
  var SIGN_OUT_DUR = 580;
  var SIGN_GAP_MS = 240;

  var state = {
    phase: 'idle',
    introActive: false,
    opening: null,
    variant: null,
    sourceOpening: null,
    sourceVariant: null,
    source: [],
    target: [],
    targetHalf: 0,
    morphStart: 0,
    morphDone: false,
    morphStage: '',
    curveStart: 0,
    morphHold: 0,
    lineStartHalf: 0,
    lineSource: [],
    compressFinal: null,
    funcs: [],
    selections: [],
    sceneIndex: 0,
    beatIndex: 0,
    currentScene: null,
    nextSceneId: null,
    pendingBridge: '',
    visited: [],
    picked: [],
    flags: {},
    busy: false,
    isTransitioning: false,
    isAnimating: false,
    ending: null,
    result: null,
    plot: null,
    plotObserver: null,
    plotSeenAt: 0,
    plotDrawnAt: 0,
    narrativeStartedAt: 0,
    principleShownAt: 0,
    collapseTriggered: false,
    cardReady: false,
    railCount: 0,
    atmos: null
  };

  var els = {};
  var timers = {};
  var intro = {
    raf: 0,
    ctx: null,
    W: 0,
    H: 0,
    dpr: 1,
    R: INTRO_R,
    entryStart: 0,
    offsetX: 0,
    offsetY: 0,
    breath: 1,
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    smoothX: 0,
    smoothY: 0,
    bulge: 0,
    bulgeAngle: 0,
    bx: 0,
    by: 0,
    bvx: 0,
    bvy: 0,
    touchX: 0,
    touchY: 0,
    touchAt: 0,
    lastNow: 0,
    off: null,
    offCtx: null,
    offSize: 0,
    circle: []
  };

  var hint = { idx: 0, typed: 0, mode: 'type', started: false };
  var sign = { idx: 0, mode: 'in', started: false };
  var copyInk = { raf: 0, drops: [], startedAt: 0, total: 0, W: 0, H: 0, played: false, sampled: false, peak: 0, peakDrops: 0, baseW: 0, baseH: 0, padX: 0, padY: 0, dpr: 1, sampleIdx: 0 };

  function $(id) { return document.getElementById(id); }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function clearTimer(name) {
    if (timers[name]) {
      clearTimeout(timers[name]);
      clearInterval(timers[name]);
      timers[name] = 0;
    }
  }

  function clearAllTimers() {
    Object.keys(timers).forEach(function (name) {
      if (timers[name]) {
        clearTimeout(timers[name]);
        clearInterval(timers[name]);
        timers[name] = 0;
      }
    });
  }

  function cubicBezier(x1, y1, x2, y2) {
    function A(a, b) { return 1 - 3 * b + 3 * a; }
    function B(a, b) { return 3 * b - 6 * a; }
    function C(a) { return 3 * a; }
    function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }
    function solve(x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-6) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      t = clamp(t, 0, 1);
      var lo = 0;
      var hi = 1;
      for (var j = 0; j < 20 && Math.abs(calc(t, x1, x2) - x) > 1e-5; j++) {
        if (calc(t, x1, x2) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return calc(solve(x), y1, y2);
    };
  }

  var easeMorph = cubicBezier(0.16, 1.2, 0.3, 1);
  var easeEntry = cubicBezier(0.34, 1.56, 0.64, 1);

  function easeInCubic(t) { return t * t * t; }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function easeOutBack(t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // 蓄力 → 压扁拉伸 → 弹性回弹成线
  function compressProfile(p) {
    var sx;
    var sy;
    var fade;
    var boost;
    if (p < 0.14) {
      var a = p / 0.14;
      sx = 1 - 0.05 * a;
      sy = 1 + 0.05 * a;
      fade = 1;
      boost = a;
    } else if (p < 0.62) {
      var c = (p - 0.14) / 0.48;
      var e = easeInCubic(c);
      sx = 0.95 + 0.24 * easeOutCubic(c);
      // 只压到约 15px 厚的窄条，避免出现极扁椭圆的最后一帧。
      sy = 1.05 - (1.05 - 0.085) * e;
      fade = 1 - clamp((c - 0.2) / 0.55, 0, 1);
      boost = 1 - c;
    } else {
      var s = (p - 0.62) / 0.38;
      var b = easeOutBack(s);
      sx = 1.19 + (1 - 1.19) * b;
      sy = 0.085 - 0.025 * b;
      fade = 0;
      boost = 0;
    }
    return { sx: sx, sy: sy, fade: fade, boost: boost };
  }

  function plainTex(tex) {
    return String(tex)
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
      .replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, '阶跃')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\left|\\right/g, '')
      .replace(/\\ln/g, 'ln ')
      .replace(/\\sin/g, 'sin ')
      .replace(/\\cos/g, 'cos ')
      .replace(/\\tan/g, 'tan ')
      .replace(/\\ge/g, '≥')
      .replace(/\\,/g, ' ')
      .replace(/[{}]/g, '')
      .replace(/\\/g, '');
  }

  function texEl(tex, display, className) {
    var span = document.createElement('span');
    if (className) span.className = className;
    if (window.katex && window.katex.render) {
      try {
        window.katex.render(tex, span, {
          throwOnError: false,
          displayMode: !!display,
          strict: 'ignore'
        });
        return span;
      } catch (err) { /* fall through */ }
    }
    span.textContent = plainTex(tex);
    return span;
  }

  /* ---------------- 锁与单场景转场 ---------------- */

  function isLocked() {
    return state.isTransitioning || state.isAnimating;
  }

  function updateLock() {
    state.busy = isLocked();
    if (els.options) {
      els.options.classList.toggle('is-locked', isLocked());
      els.options.setAttribute('aria-busy', isLocked() ? 'true' : 'false');
      Array.prototype.forEach.call(els.options.children, function (b) {
        b.disabled = isLocked();
      });
    }
  }

  function lockAnim(ms) {
    state.isAnimating = true;
    clearTimer('anim');
    timers.anim = setTimeout(function () {
      state.isAnimating = false;
      updateLock();
    }, reduced ? 0 : ms);
    updateLock();
  }

  function unlockAnim() {
    clearTimer('anim');
    state.isAnimating = false;
    updateLock();
  }

  function cacheScene() {
    els.intro = $('screen-intro');
    els.game = $('screen-game');
    els.endingScreen = $('screen-ending');
    els.introCanvas = $('intro-canvas');
    els.seedBtn = $('seed-btn');
    els.introHint = $('intro-hint');
    els.hintType = $('hint-type');
    els.hintGhost = $('hint-ghost');
    els.introSign = $('intro-sign');
    els.signText = $('sign-text');
    els.introCopy = $('intro-copy');
    els.openingEn = $('opening-en');
    els.openingTitle = $('opening-title');
    els.openingShape = $('opening-shape');
    els.openingCopy = $('opening-copy');
    els.copyInk = $('copy-ink');
    els.btnEnter = $('btn-enter');
    els.btnReroll = $('btn-reroll');
    els.act = $('act-label');
    els.step = $('scene-step');
    els.progressFill = $('progress-fill');
    els.formulaRail = $('formula-rail');
    els.formulaScroll = $('formula-scroll');
    els.railStatus = $('rail-status');
    els.sceneWrap = $('scene-wrap');
    els.sceneKicker = $('scene-kicker');
    els.sceneTitle = $('scene-title');
    els.sceneText = $('scene-text');
    els.options = $('options');
    els.funcCount = $('func-count');
    els.endingIndex = $('ending-index');
    els.endingName = $('ending-name');
    els.endingShape = $('ending-shape');
    els.endingText = $('ending-text');
    els.endingTextMeasure = $('ending-text-measure');
    els.endingTextAccessible = $('ending-text-accessible');
    els.endingType = $('ending-type');
    els.endingCaret = $('ending-caret');
    els.axisX = $('axis-x');
    els.axisY = $('axis-y');
    els.axisNote = $('axis-note');
    els.formula = $('formula');
    els.formulaNote = $('formula-note');
    els.plot = $('ending-canvas');
    els.plotReset = $('plot-reset');
    els.plotExpand = $('plot-expand');
    els.plotCollapsedNote = $('plot-collapsed-note');
    els.plotWrap = els.plot ? els.plot.parentElement : null;
    els.choiceList = $('choice-list');
    els.principleSection = $('principle-section');
    els.principleLead = $('principle-lead');
    els.principle = $('principle');
    els.principleMeasure = $('principle-measure');
    els.principleType = $('principle-type');
    els.principleCaret = $('principle-caret');
    els.principleAccessible = $('principle-accessible');
    els.cardSection = $('card-section');
    els.shareCard = $('share-card');
    els.btnDownload = $('btn-download');
    els.btnRestart = $('btn-restart');
    els.btnRestartTop = $('btn-restart-top');
  }

  // 所有屏幕切换都走这里：旧场景 250ms 淡出 -> removeChild -> append 新场景 -> 300ms 淡入。
  function transitionTo(builder, opts) {
    opts = opts || {};
    if (state.isTransitioning) return;
    state.isTransitioning = true;
    updateLock();

    var old = els.scene ? els.scene.firstElementChild : null;

    function appendNew() {
      var previous = old;
      if (previous && previous.parentNode) {
        previous.classList.add('is-fading-out');
        setTimeout(function () {
          if (previous && previous.parentNode) previous.parentNode.removeChild(previous);
        }, 420);
      }
      old = null;
      var node = builder();
      node.classList.add('scene-node', 'is-entering');
      if (state.zoomReturning) {
        var wrap = node.querySelector('.scene-wrap') || node;
        wrap.classList.add('is-zooming-in');
        state.zoomReturning = false;
      }
      node.style.opacity = '0';
      els.scene.appendChild(node);
      Array.prototype.slice.call(els.scene.querySelectorAll('.scene-node')).forEach(function (n) {
        if (n === node) return;
        n.style.transition = 'opacity .6s cubic-bezier(.4, 0, .2, 1)';
        n.style.opacity = '0';
        n.classList.add('is-fading-out');
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, reduced ? 0 : 620);
      });
      if (window.SFX) window.SFX.play('enter');
      if (window.requestAnimationFrame) {
        requestAnimationFrame(function () {
          node.style.transition = 'opacity ' + (reduced ? '0s' : '.7s cubic-bezier(.35, 0, .2, 1)');
          node.style.opacity = '1';
        });
      } else {
        node.style.opacity = '1';
      }
      cacheScene();
      updateLock();
      if (opts.onAppend) opts.onAppend(node);

      var optionCount = node.querySelectorAll('.option').length;
      var inDelay = Math.max(SCENE_IN, optionCount ? (optionCount - 1) * OPT_STAGGER + OPT_IN : 0);
      clearTimer('transition');
      timers.transition = setTimeout(function () {
        state.isTransitioning = false;
        node.classList.remove('is-entering');
        updateLock();
        Array.prototype.forEach.call(document.querySelectorAll('#options .option'), function (b) {
          b.disabled = false;
        });
        if (opts.onReady) opts.onReady(node);
      }, reduced ? 0 : inDelay);
    }

    if (old) {
      old.classList.remove('is-entering');
      old.classList.add('is-leaving');
      if (opts.onLeave) opts.onLeave(old);
      clearTimer('transitionOld');
      timers.transitionOld = setTimeout(appendNew, reduced ? 0 : SCENE_OUT);
    } else {
      appendNew();
    }
  }

  /* ---------------- 开场 Canvas ---------------- */

  function makeCirclePoints() {
    var pts = [];
    for (var i = 0; i < SAMPLES; i++) {
      var th = Math.PI + (i / SAMPLES) * Math.PI * 2;
      pts.push({
        x: intro.W / 2 + Math.cos(th) * intro.R,
        y: intro.H / 2 + Math.sin(th) * intro.R,
        ok: true
      });
    }
    return pts;
  }

  function halfWidthOf(pts) {
    var half = 0;
    for (var i = 0; i < pts.length; i++) {
      if (pts[i].ok) half = Math.max(half, Math.abs(pts[i].x - intro.W / 2));
    }
    return half || intro.W / 2;
  }

  function measureIntro() {
    if (!els.introCanvas) return;
    var w = Math.max(1, window.innerWidth);
    var h = Math.max(1, window.innerHeight);
    intro.W = w;
    intro.H = h;
    intro.dpr = Math.min(window.devicePixelRatio || 1, 2);
    intro.R = INTRO_R;
    var size = intro.R * 2 + 56;
    document.documentElement.style.setProperty('--seed-size', size + 'px');
    document.documentElement.style.setProperty('--seed-half', (size / 2) + 'px');

    intro.ctx = els.introCanvas.getContext('2d');
    els.introCanvas.width = Math.round(w * intro.dpr);
    els.introCanvas.height = Math.round(h * intro.dpr);
    intro.ctx.setTransform(intro.dpr, 0, 0, intro.dpr, 0, 0);
    // 墨点在小离屏画布上做柔边/投影，避免整屏 blur 拖慢帧率。
    intro.offSize = Math.ceil(2 * (INTRO_R + BULGE_MAX) + 120);
    if (!intro.off) intro.off = document.createElement('canvas');
    intro.off.width = Math.round(intro.offSize * intro.dpr);
    intro.off.height = Math.round(intro.offSize * intro.dpr);
    intro.offCtx = intro.off.getContext('2d');
    intro.circle = makeCirclePoints();

    if (state.phase === 'morph' || state.phase === 'opened') {
      state.source = state.sourceOpening
        ? buildTargetPoints(state.sourceOpening, state.sourceVariant)
        : intro.circle.slice();
      if (state.opening) {
        state.target = buildTargetPoints(state.opening, state.variant);
        state.targetHalf = halfWidthOf(state.target);
      }
    }
    drawIntro(performance.now());
  }

  function buildTargetPoints(opening, variant) {
    if (!opening) return [];
    var W = intro.W;
    var H = intro.H;
    var mobile = W < 720;
    var shapeW = mobile ? W * 0.72 : Math.min(W * 0.58, 700);
    var shapeH = mobile ? Math.min(H * 0.2, 168) : Math.min(H * 0.3, 280);
    var cy = H * (mobile ? 0.455 : 0.45);
    var dir = variant && variant.dir ? variant.dir : 1;
    var phase = variant && Number.isFinite(variant.phase) ? variant.phase : 0;
    var pts = [];
    var i;
    var t;
    var nx;
    var ny;
    var ok;

    function push(x, y, valid) {
      pts.push({
        x: W / 2 + x * shapeW,
        y: cy + y * shapeH,
        ok: valid !== false
      });
    }

    switch (opening.key) {
      case 'line':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = t - 0.5;
          ny = dir * nx * 0.17;
          push(nx, ny);
        }
        break;
      case 'wave':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = t - 0.5;
          ny = 0.34 * Math.sin(nx * Math.PI * 2 * 1.15 * dir + phase);
          push(nx, ny);
        }
        break;
      case 'tan':
        for (i = 0; i < SAMPLES; i++) {
          t = -1.75 + (3.5 * i) / (SAMPLES - 1);
          nx = dir * t * 0.145;
          ny = -Math.tan(t) * 0.16;
          ok = Number.isFinite(ny) && Math.abs(ny) <= 0.5 && Math.abs(Math.cos(t)) > 0.03;
          push(nx, ny, ok);
        }
        break;
      case 'decay':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = -0.48 + 0.96 * t;
          ny = -0.36 + 0.78 * (1 - Math.exp(-t * 3.2));
          push(nx, ny);
        }
        break;
      case 'down':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = t - 0.5 + dir * 0.02;
          ny = -0.34 + 2.55 * nx * nx;
          push(nx, ny);
        }
        break;
      case 'log':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = -0.46 + 0.92 * t;
          ny = 0.38 - 0.8 * Math.log(1 + 9 * t) / Math.LN10;
          push(nx, ny);
        }
        break;
      case 'jump':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = -0.48 + 0.96 * t;
          if (nx < -0.035) { ny = 0.22; ok = true; }
          else if (nx > 0.035) { ny = -0.22; ok = true; }
          else { ny = 0; ok = false; }
          push(nx, ny, ok);
        }
        break;
      case 'up':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = t - 0.5 + dir * 0.02;
          ny = 0.34 - 2.55 * nx * nx;
          push(nx, ny);
        }
        break;
      case 'sqrt':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = -0.35 + 0.85 * t;
          ny = 0.38 - 0.78 * Math.sqrt(t);
          push(nx, ny);
        }
        break;
      case 'abs':
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          nx = t - 0.5;
          ny = 0.28 - 1.16 * Math.abs(nx + dir * 0.015);
          push(nx + dir * 0.045, ny);
        }
        break;
      default:
        for (i = 0; i < SAMPLES; i++) {
          t = i / (SAMPLES - 1);
          push(t - 0.5, 0);
        }
    }
    return pts;
  }

  function updateIntroMotion(now) {
    var cx = intro.W / 2;
    var cy = intro.H / 2;
    var dt = intro.lastNow ? clamp(now - intro.lastNow, 0, 100) : 16.7;
    intro.lastNow = now;
    var kPointer = 1 - Math.pow(1 - 0.18, dt / 16.7);
    var kOffset = 1 - Math.pow(1 - 0.12, dt / 16.7);
    var tx = 0;
    var ty = 0;
    var targetBulge = 0;
    var targetAngle = intro.bulgeAngle;
    if (!reduced) {
      var px = null;
      var py = null;
      var strength = 1;
      if (!coarse && intro.pointerActive) {
        px = intro.pointerX;
        py = intro.pointerY;
      } else if (coarse && intro.touchAt && now - intro.touchAt < TOUCH_BULGE_MS) {
        px = intro.touchX;
        py = intro.touchY;
        strength = 1 - (now - intro.touchAt) / TOUCH_BULGE_MS;
      }
      if (px !== null) {
        intro.smoothX += (px - intro.smoothX) * kPointer;
        intro.smoothY += (py - intro.smoothY) * kPointer;
        var dx = intro.smoothX - cx;
        var dy = intro.smoothY - cy;
        var dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
          targetAngle = Math.atan2(dy, dx);
          var gap = Math.max(0, dist - intro.R);
          var prox = Math.pow(clamp(1 - gap / BULGE_RANGE, 0, 1), 1.35) * strength;
          targetBulge = BULGE_MAX * prox;
          var mag = Math.min(4, dist * 0.02) * prox;
          tx = (dx / dist) * mag;
          ty = (dy / dist) * mag;
        }
      }
    }
    // 二阶临界阻尼：快速移动时凸起方向和幅度都带惯性，不会瞬变。
    var targetX = targetBulge > 0 ? Math.cos(targetAngle) * targetBulge : 0;
    var targetY = targetBulge > 0 ? Math.sin(targetAngle) * targetBulge : 0;
    var omega = 6.5;
    var dtS = Math.min(dt, 50) / 1000;
    intro.bvx += (omega * omega * (targetX - intro.bx) - 2 * omega * intro.bvx) * dtS;
    intro.bvy += (omega * omega * (targetY - intro.by) - 2 * omega * intro.bvy) * dtS;
    intro.bx += intro.bvx * dtS;
    intro.by += intro.bvy * dtS;
    var magB = Math.hypot(intro.bx, intro.by);
    if (magB > BULGE_MAX) {
      intro.bx *= BULGE_MAX / magB;
      intro.by *= BULGE_MAX / magB;
      intro.bvx *= 0.72;
      intro.bvy *= 0.72;
      magB = BULGE_MAX;
    }
    intro.bulge = magB > 0.02 ? magB : 0;
    if (intro.bulge) intro.bulgeAngle = Math.atan2(intro.by, intro.bx);
    intro.offsetX += (tx - intro.offsetX) * kOffset;
    intro.offsetY += (ty - intro.offsetY) * kOffset;
    intro.breath = (!reduced && coarse)
      ? 1 + 0.02 * Math.sin((now % 3000) / 3000 * Math.PI * 2)
      : 1;
  }

  function idleRadii(entry) {
    var R = intro.R * entry;
    var radii = [];
    for (var i = 0; i < SAMPLES; i++) {
      var th = Math.PI + (i / SAMPLES) * Math.PI * 2;
      var w = 0;
      if (intro.bulge > 0.01) {
        var d = Math.acos(clamp(Math.cos(th - intro.bulgeAngle), -1, 1));
        w = Math.exp(-(d * d) / (2 * BULGE_SIGMA * BULGE_SIGMA));
      }
      radii.push(R + intro.bulge * w * entry);
    }
    return radii;
  }

  function currentCirclePoints() {
    var t = reduced ? 1 : clamp((performance.now() - intro.entryStart) / ENTRY_DUR, 0, 1);
    var radii = idleRadii(reduced ? 1 : easeEntry(t));
    var pts = [];
    for (var i = 0; i < SAMPLES; i++) {
      var th = Math.PI + (i / SAMPLES) * Math.PI * 2;
      pts.push({
        x: intro.W / 2 + Math.cos(th) * radii[i],
        y: intro.H / 2 + Math.sin(th) * radii[i],
        ok: true
      });
    }
    return pts;
  }

  function applyIntroTransform(ctx) {
    ctx.translate(intro.offsetX, intro.offsetY);
    if (intro.breath !== 1) {
      ctx.translate(intro.W / 2, intro.H / 2);
      ctx.scale(intro.breath, intro.breath);
      ctx.translate(-intro.W / 2, -intro.H / 2);
    }
  }

  function drawIdle(now) {
    var ctx = intro.ctx;
    if (!ctx) return;
    var t = reduced ? 1 : clamp((now - intro.entryStart) / ENTRY_DUR, 0, 1);
    var entry = reduced ? 1 : easeEntry(t);
    var R = intro.R * entry;
    if (R < 0.4) return;

    var radii = idleRadii(entry);
    var alpha = reduced ? 1 : clamp(t * 4, 0, 1);
    var oc = intro.offCtx;
    var S = intro.offSize;
    var half = S / 2;
    oc.setTransform(intro.dpr, 0, 0, intro.dpr, 0, 0);
    oc.clearRect(0, 0, S, S);
    oc.fillStyle = '#000';
    if (CANVAS_FILTER) {
      // 外层淡墨晕：让边缘像墨在纸上洇开，而不是硬边剪影。
      oc.globalAlpha = 0.14;
      oc.filter = 'blur(7px)';
      traceIdlePath(oc, radii, half, half);
      oc.fill();
      oc.filter = 'blur(2px)';
    }
    oc.globalAlpha = 1;
    oc.shadowColor = 'rgba(0,0,0,0.28)';
    oc.shadowBlur = 26;
    oc.shadowOffsetY = 14;
    traceIdlePath(oc, radii, half, half);
    oc.fill();
    oc.shadowColor = 'transparent';
    oc.shadowBlur = 0;
    oc.shadowOffsetY = 0;
    oc.filter = 'none';

    ctx.clearRect(0, 0, intro.W, intro.H);
    ctx.save();
    applyIntroTransform(ctx);
    ctx.globalAlpha = alpha;
    ctx.drawImage(intro.off, 0, 0, intro.off.width, intro.off.height,
      intro.W / 2 - half, intro.H / 2 - half, S, S);
    ctx.restore();
  }

  function traceIdlePath(ctx, radii, cx, cy) {
    ctx.beginPath();
    for (var i = 0; i < SAMPLES; i++) {
      var th = Math.PI + (i / SAMPLES) * Math.PI * 2;
      var px = cx + Math.cos(th) * radii[i];
      var py = cy + Math.sin(th) * radii[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawCompress(rawProgress) {
    var ctx = intro.ctx;
    if (!ctx || !state.source.length) return;
    var raw = clamp(rawProgress, 0, 1);
    var pr = compressProfile(raw);
    var fade = pr.fade;
    // 在椭圆变得极薄之前交叉淡化成真正的 3px 直线。
    var lf = clamp((raw - 0.58) / 0.17, 0, 1);
    lf = lf * lf * (3 - 2 * lf);
    var fillAlpha = 1 - lf;
    var oc = intro.offCtx;
    var S = intro.offSize;
    var half = S / 2;
    var cx = intro.W / 2;
    var cy = intro.H / 2;
    oc.setTransform(intro.dpr, 0, 0, intro.dpr, 0, 0);
    oc.clearRect(0, 0, S, S);
    oc.fillStyle = '#000';

    function trace() {
      oc.beginPath();
      for (var i = 0; i < state.source.length; i++) {
        var s = state.source[i];
        if (!s || !s.ok) { oc.moveTo(0, 0); continue; }
        var oy = half + (s.y - cy) * pr.sy;
        var ox = half + (s.x - cx) * pr.sx;
        if (i === 0) oc.moveTo(ox, oy);
        else oc.lineTo(ox, oy);
      }
      oc.closePath();
    }

    if (CANVAS_FILTER) {
      // 柔边与墨晕随压缩同步淡出。
      oc.globalAlpha = 0.14 * fade * fillAlpha;
      oc.filter = 'blur(7px)';
      trace();
      oc.fill();
      oc.filter = 'blur(' + (2 * fade).toFixed(2) + 'px)';
    }
    oc.globalAlpha = fillAlpha;
    oc.shadowColor = 'rgba(0,0,0,' + ((0.28 + 0.06 * pr.boost) * fade).toFixed(3) + ')';
    oc.shadowBlur = 26 * fade + 8 * pr.boost * fade;
    oc.shadowOffsetY = 14 * fade;
    trace();
    oc.fill();
    oc.shadowColor = 'transparent';
    oc.shadowBlur = 0;
    oc.shadowOffsetY = 0;
    oc.filter = 'none';

    ctx.clearRect(0, 0, intro.W, intro.H);
    ctx.save();
    applyIntroTransform(ctx);
    if (fillAlpha > 0.001) {
      ctx.drawImage(intro.off, 0, 0, intro.off.width, intro.off.height,
        intro.W / 2 - half, intro.H / 2 - half, S, S);
    }
    if (lf > 0.001) {
      var maxHalf = 0;
      for (var k = 0; k < state.source.length; k++) {
        maxHalf = Math.max(maxHalf, Math.abs(state.source[k].x - cx));
      }
      var lineHalf = maxHalf * pr.sx;
      ctx.globalAlpha = lf;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - lineHalf, cy);
      ctx.lineTo(cx + lineHalf, cy);
      ctx.stroke();
    }
    ctx.restore();

    if (raw >= 0.999 && !state.compressFinal) {
      try {
        var cw = els.introCanvas.width;
        var ch = els.introCanvas.height;
        var px = ctx.getImageData(0, 0, cw, ch).data;
        var minX = cw;
        var maxX = -1;
        var minY = ch;
        var maxY = -1;
        for (var yy = 0; yy < ch; yy++) {
          for (var xx = 0; xx < cw; xx++) {
            if (px[(yy * cw + xx) * 4 + 3] > 12) {
              if (xx < minX) minX = xx;
              if (xx > maxX) maxX = xx;
              if (yy < minY) minY = yy;
              if (yy > maxY) maxY = yy;
            }
          }
        }
        state.compressFinal = maxX >= 0 ? {
          w: (maxX - minX + 1) / intro.dpr,
          h: (maxY - minY + 1) / intro.dpr
        } : { w: 0, h: 0 };
      } catch (err) {
        state.compressFinal = null;
      }
    }
  }

  function drawMorph(rawProgress) {
    var ctx = intro.ctx;
    if (!ctx || !state.target.length || !state.source.length) return;
    var e = easeMorph(clamp(rawProgress, 0, 1));
    var startHalf = state.lineStartHalf || 0;
    var half = startHalf + (state.targetHalf - startHalf) * e;

    ctx.clearRect(0, 0, intro.W, intro.H);
    ctx.save();
    applyIntroTransform(ctx);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3; // 全程固定 3px，无填充
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    var open = false;
    for (var i = 0; i < SAMPLES; i++) {
      var s = state.source[i];
      var t = state.target[i];
      if (!s || !t) { open = false; continue; }
      var x = s.x + (t.x - s.x) * e;
      var y = s.y + (t.y - s.y) * e;
      // 从中点向两侧揭示；渐近线/间断处断开，不画竖线。
      var visible = s.ok && t.ok && Math.abs(x - intro.W / 2) <= half + 0.5;
      if (!visible) { open = false; continue; }
      if (!open) { ctx.moveTo(x, y); open = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawIntro(now) {
    if (!state.introActive || !els.introCanvas) return;
    updateIntroMotion(now);
    if (state.phase === 'idle') {
      drawIdle(now);
      return;
    }
    if (state.phase === 'morph') {
      if (state.morphStage === 'compress') {
        var cp = clamp((now - state.morphStart) / COMPRESS_DUR, 0, 1);
        drawCompress(cp);
        if (cp >= 1) {
          state.morphStage = 'curve';
          state.curveStart = now;
          state.source = state.lineSource;
          drawMorph(0);
        }
        return;
      }
      var t = clamp((now - state.curveStart - (state.morphHold || 0)) / MORPH_DUR, 0, 1);
      drawMorph(t);
      if (t >= 1 && !state.morphDone) {
        state.morphDone = true;
        state.phase = 'opened';
        drawMorph(1);
        showOpeningCopy();
        unlockAnim();
        stopIntroLoop();
      }
      return;
    }
    if (state.phase === 'opened') {
      drawMorph(1);
    }
  }

  function startIntroLoop() {
    if (reduced) {
      drawIntro(performance.now());
      return;
    }
    if (intro.raf) return;
    intro.raf = requestAnimationFrame(introTick);
  }

  function introTick(now) {
    intro.raf = 0;
    if (!state.introActive) return;
    drawIntro(now);
    intro.raf = requestAnimationFrame(introTick);
  }

  function stopIntroLoop() {
    if (intro.raf) cancelAnimationFrame(intro.raf);
    intro.raf = 0;
  }

  /* ---------------- 开场提示语 ---------------- */

  function stopHint() {
    clearTimer('hint');
    hint.started = false;
  }

  function startHint() {
    stopHint();
    hint.idx = 0;
    hint.typed = 0;
    hint.mode = 'type';
    hint.started = true;
    if (!els.hintType) return;
    els.hintType.textContent = '';
    syncHintGhost();
    if (reduced) {
      renderHintFull();
      hint.mode = 'hold';
      scheduleHint(HINT_HOLD_MS);
      return;
    }
    scheduleHint(420);
  }

  function scheduleHint(ms) {
    clearTimer('hint');
    timers.hint = setTimeout(hintStep, ms);
  }

  function renderHintFull() {
    if (!els.hintType) return;
    els.hintType.textContent = HINT_PHRASES[hint.idx];
    hint.typed = Array.from(HINT_PHRASES[hint.idx]).length;
    syncHintGhost();
  }

  function syncHintGhost() {
    if (els.hintGhost && els.hintType) els.hintGhost.textContent = els.hintType.textContent;
  }

  function hintStep() {
    if (!hint.started || !state.introActive || state.phase !== 'idle' || !els.hintType) return;
    var chars = Array.from(HINT_PHRASES[hint.idx]);
    if (hint.mode === 'type') {
      if (hint.typed < chars.length) {
        var ch = chars[hint.typed];
        var span = document.createElement('span');
        span.className = 'hint-ch';
        span.textContent = ch;
        els.hintType.appendChild(span);
        hint.typed += 1;
        syncHintGhost();
        scheduleHint(/[，。、；：？！]/.test(ch) ? HINT_PAUSE_MS : HINT_TYPE_MS);
      } else {
        hint.mode = 'hold';
        scheduleHint(HINT_HOLD_MS);
      }
    } else if (hint.mode === 'hold') {
      if (reduced) {
        hint.idx = (hint.idx + 1) % HINT_PHRASES.length;
        renderHintFull();
        scheduleHint(HINT_HOLD_MS);
      } else {
        hint.mode = 'erase';
        scheduleHint(HINT_ERASE_MS);
      }
    } else if (hint.typed > 0) {
      if (els.hintType.lastChild) els.hintType.removeChild(els.hintType.lastChild);
      hint.typed -= 1;
      syncHintGhost();
      scheduleHint(HINT_ERASE_MS);
    } else {
      hint.idx = (hint.idx + 1) % HINT_PHRASES.length;
      hint.mode = 'type';
      scheduleHint(360);
    }
  }

  function hintDebug() {
    return {
      phrases: HINT_PHRASES.slice(),
      idx: hint.idx,
      typed: hint.typed,
      total: Array.from(HINT_PHRASES[hint.idx]).length,
      mode: hint.mode,
      started: hint.started,
      reduced: reduced
    };
  }

  /* ---------------- 开场签名行 ---------------- */

  function stopSignature() {
    clearTimer('sign');
    sign.started = false;
  }

  function startSignature() {
    stopSignature();
    sign.idx = 0;
    sign.started = true;
    if (!els.signText) return;
    if (reduced) {
      els.signText.textContent = SIGN_ITEMS[0];
      els.signText.style.opacity = '1';
      els.signText.style.filter = 'none';
      els.signText.style.transform = 'none';
      sign.mode = 'hold';
      scheduleSign(SIGN_IN_MS + SIGN_HOLD_MS + 800);
      return;
    }
    els.signText.textContent = '';
    els.signText.style.opacity = '0';
    sign.mode = 'wait';
    scheduleSign(760);
  }

  function scheduleSign(ms) {
    clearTimer('sign');
    timers.sign = setTimeout(signStep, ms);
  }

  function signShow() {
    if (!els.signText) return;
    var text = SIGN_ITEMS[sign.idx];
    els.signText.textContent = '';
    els.signText.style.transition = 'none';
    els.signText.style.opacity = '0';
    els.signText.style.filter = 'blur(2px)';
    els.signText.style.transform = 'translateY(3px)';
    Array.from(text).forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'sign-ch';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      els.signText.appendChild(span);
    });
    void els.signText.offsetWidth;
    els.signText.style.transition = '';
    els.signText.style.opacity = '1';
    els.signText.style.filter = 'none';
    els.signText.style.transform = 'none';
    sign.mode = 'in';
    scheduleSign(SIGN_IN_MS + SIGN_HOLD_MS);
  }

  function signStep() {
    if (!sign.started || !state.introActive || state.phase !== 'idle' || !els.signText) return;
    if (reduced) {
      sign.idx = (sign.idx + 1) % SIGN_ITEMS.length;
      els.signText.textContent = SIGN_ITEMS[sign.idx];
      scheduleSign(SIGN_IN_MS + SIGN_HOLD_MS + 800);
      return;
    }
    if (sign.mode === 'wait') {
      signShow();
      return;
    }
    if (sign.mode === 'in') {
      sign.mode = 'out';
      var chars = els.signText.querySelectorAll('.sign-ch');
      for (var i = 0; i < chars.length; i++) {
        chars[i].style.transitionDelay = Math.round(Math.random() * SIGN_OUT_SPREAD) + 'ms';
        chars[i].style.opacity = '0';
        chars[i].style.filter = 'blur(1.6px)';
        chars[i].style.transform = 'translateY(-3px)';
      }
      scheduleSign(SIGN_OUT_SPREAD + SIGN_OUT_DUR + SIGN_GAP_MS);
      return;
    }
    sign.idx = (sign.idx + 1) % SIGN_ITEMS.length;
    signShow();
  }

  function signatureDebug() {
    var chars = els.signText
      ? Array.prototype.slice.call(els.signText.querySelectorAll('.sign-ch'))
      : [];
    var opacities = chars.map(function (c) { return Number(window.getComputedStyle(c).opacity); });
    var delays = chars.map(function (c) { return c.style.transitionDelay || '0ms'; });
    return {
      items: SIGN_ITEMS.slice(),
      idx: sign.idx,
      mode: sign.mode,
      text: els.signText ? els.signText.textContent.replace(/\u00A0/g, ' ') : '',
      opacities: opacities,
      delays: delays,
      reduced: reduced,
      started: sign.started
    };
  }

  function fnListOf(opening) {
    if (!opening) return [];
    return opening.fns ? opening.fns.slice() : [opening.fn];
  }

  function pickOpening(excludeId) {
    var pool = DATA.openings.filter(function (o) { return o.id !== excludeId; });
    if (!pool.length) pool = DATA.openings.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function makeVariant() {
    return {
      dir: Math.random() < 0.5 ? -1 : 1,
      phase: Math.random() * Math.PI * 2
    };
  }

  function beginMorph(opening, variant, fromCurve) {
    state.sourceOpening = fromCurve ? state.opening : null;
    state.sourceVariant = fromCurve ? state.variant : null;
    state.source = fromCurve && state.opening
      ? buildTargetPoints(state.opening, state.variant)
      : currentCirclePoints();
    stopHint();
    stopSignature();
    state.opening = opening;
    state.variant = variant;
    state.target = buildTargetPoints(opening, variant);
    state.targetHalf = halfWidthOf(state.target);
    state.phase = 'morph';
    state.morphStart = performance.now();
    state.morphDone = false;
    state.curveStart = 0;
    state.lineStartHalf = 0;
    state.lineSource = [];
    state.compressFinal = null;
    if (!fromCurve) {
      state.lineSource = state.source.map(function (p) {
        return { x: p.x, y: intro.H / 2, ok: true };
      }).sort(function (a, b) { return a.x - b.x; });
      state.lineStartHalf = halfWidthOf(state.lineSource);
      state.morphStage = 'compress';
      state.morphHold = MORPH_HOLD;
      lockAnim(COMPRESS_DUR + MORPH_HOLD + MORPH_DUR);
    } else {
      state.morphStage = 'curve';
      state.curveStart = state.morphStart;
      state.morphHold = 0;
      lockAnim(MORPH_DUR);
    }
    hideOpeningCopy();
    if (els.intro) els.intro.classList.add('has-opening');
    if (els.seedBtn) els.seedBtn.setAttribute('aria-label', '再点一次，切换开局');
    if (state.atmos) {
      state.atmos.dimIntro(false);
      state.atmos.highlight(fnListOf(opening));
    }

    if (reduced) {
      state.phase = 'opened';
      state.morphDone = true;
      drawMorph(1);
      showOpeningCopy();
      unlockAnim();
    } else {
      startIntroLoop();
    }
  }

  function stopCopyInk() {
    if (copyInk.raf) cancelAnimationFrame(copyInk.raf);
    copyInk.raf = 0;
    copyInk.drops = [];
    if (els.copyInk && els.copyInk.getContext) {
      var c = els.copyInk.getContext('2d');
      c.clearRect(0, 0, els.copyInk.width, els.copyInk.height);
    }
  }

  // 墨滴：三团湿墨 + 飞溅小点；贴图预烘焙，逐帧只做合成。
  function bakeStainSprite(R, seed, dpr) {
    var blur = 1.4;
    var extent = R * 1.6 + blur * 4;
    var halfW = Math.ceil(extent + 6);
    var halfH = Math.ceil(extent + 6);
    var cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(halfW * 2 * dpr));
    cv.height = Math.max(2, Math.round(halfH * 2 * dpr));
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cx = halfW;
    var cy = halfH;
    var grad = c.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.25);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.97)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = grad;
    function buildPath(scale) {
      c.beginPath();
      function addCircle(x, y, r) {
        c.moveTo(x + r, y);
        c.arc(x, y, r, 0, Math.PI * 2, false);
      }
      for (var i = 0; i < 9; i++) {
        addCircle(cx + (Math.random() - 0.5) * R * 0.9, cy + (Math.random() - 0.5) * R * 0.7, R * (0.34 + Math.random() * 0.2) * scale);
      }
      for (var j = 0; j < 20; j++) {
        var ang = (j / 20) * Math.PI * 2 + Math.random() * 0.12;
        var dist = R * (0.78 + Math.random() * 0.22) * scale;
        addCircle(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist * 0.92, R * (0.16 + Math.random() * 0.15) * scale);
      }
      for (var k = 0; k < 5; k++) {
        var ta = Math.random() * Math.PI * 2;
        var td = R * (1.02 + Math.random() * 0.1) * scale;
        addCircle(cx + Math.cos(ta) * td, cy + Math.sin(ta) * td * 0.9, R * (0.06 + Math.random() * 0.05) * scale);
      }
    }
    c.save();
    c.globalAlpha = 0.09;
    if (CANVAS_FILTER) c.filter = 'blur(5px)';
    buildPath(1.06);
    c.fill();
    c.restore();
    c.save();
    if (CANVAS_FILTER) c.filter = 'blur(' + blur + 'px)';
    buildPath(1);
    c.fill();
    c.restore();
    return { cv: cv, halfW: halfW, halfH: halfH };
  }

  function bakeDotSprite(r, seed, dpr) {
    var halfW = Math.ceil(r * 1.6 + 6);
    var halfH = Math.ceil(r * 2 + 8);
    var cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(halfW * 2 * dpr));
    cv.height = Math.max(2, Math.round(halfH * 2 * dpr));
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.translate(halfW, halfH * 0.6);
    var grad = c.createRadialGradient(0, r * 0.2, r * 0.1, 0, 0, r * 1.6);
    grad.addColorStop(0, 'rgba(0,0,0,0.92)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = grad;
    if (CANVAS_FILTER) c.filter = 'blur(0.3px)';
    c.beginPath();
    c.moveTo(0, -r * 1.5);
    c.bezierCurveTo(r * 0.8, -r * 0.3, r * 0.9, r * 0.5, 0, r * 0.8);
    c.bezierCurveTo(-r * 0.9, r * 0.5, -r * 0.8, -r * 0.3, 0, -r * 1.5);
    c.closePath();
    c.fill();
    return { cv: cv, halfW: halfW, halfH: halfH };
  }

  function bakeFallSprite(r, dpr) {
    var halfW = Math.ceil(r * 1.4 + 6);
    var halfH = Math.ceil(r * 2 + 8);
    var cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(halfW * 2 * dpr));
    cv.height = Math.max(2, Math.round(halfH * 2 * dpr));
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.translate(halfW, halfH * 0.62);
    var grad = c.createRadialGradient(0, r * 0.35, r * 0.15, 0, 0, r * 1.5);
    grad.addColorStop(0, 'rgba(0,0,0,0.92)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = grad;
    if (CANVAS_FILTER) c.filter = 'blur(0.3px)';
    c.beginPath();
    c.moveTo(0, -r * 1.7);
    c.bezierCurveTo(r * 0.9, -r * 0.5, r * 0.9, r * 0.6, 0, r * 0.85);
    c.bezierCurveTo(-r * 0.9, r * 0.6, -r * 0.9, -r * 0.5, 0, -r * 1.7);
    c.closePath();
    c.fill();
    return { cv: cv, halfW: halfW, halfH: halfH };
  }

  function smooth01(t) { return t * t * (3 - 2 * t); }

  // 覆盖率取多次采样的最大值，避免单帧抖动；三次都在墨团全部长开、开始收敛之前。
  var INK_SAMPLE_AT = [1000, 1150, 1300];

  function inkTick(now) {
    copyInk.raf = 0;
    if (!els.copyInk) return;
    var elapsed = now - copyInk.startedAt;
    var ctx = els.copyInk.getContext('2d');
    ctx.clearRect(0, 0, copyInk.W, copyInk.H);
    if (elapsed > copyInk.total) {
      stopCopyInk();
      return;
    }
    for (var i = 0; i < copyInk.drops.length; i++) {
      var u = copyInk.drops[i];
      var t = (elapsed - u.start) / u.dur;
      if (t < 0 || t > 1) continue;
      var conv = t > 0.55 ? smooth01(clamp((t - 0.55) / 0.4, 0, 1)) : 0;
      var grow = t < 0.2 ? easeOutCubic(clamp((t - 0.08) / 0.12, 0, 1)) : 1;
      var poolScale = (0.22 + 0.78 * grow) * (1 - 0.72 * conv) * (1 + 0.012 * Math.sin(t * 9 + u.seed));
      var poolAlpha = (1 - conv) * Math.min(1, t * 8);
      if (t > 0.06 && poolAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = poolAlpha;
        ctx.translate(u.x, u.y);
        ctx.rotate(conv * 0.10 * Math.sin(u.seed * 2));
        ctx.scale(poolScale, poolScale);
        ctx.drawImage(u.sprite.cv, -u.sprite.halfW, -u.sprite.halfH, u.sprite.halfW * 2, u.sprite.halfH * 2);
        ctx.restore();
      }
      if (t < 0.16) {
        var fp = clamp(t / 0.14, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.22 * (1 - fp);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(u.x, u.y - 70 * (1 - fp) * (1 - fp) - 26);
        ctx.lineTo(u.x, u.y - 70 * (1 - fp) * (1 - fp) - 8);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.95 * (1 - fp * 0.4);
        ctx.translate(u.x, u.y - 70 * (1 - fp) * (1 - fp));
        var fs = 0.7 + 0.3 * fp;
        ctx.scale(fs, fs);
        ctx.drawImage(u.fall.cv, -u.fall.halfW, -u.fall.halfH, u.fall.halfW * 2, u.fall.halfH * 2);
        ctx.restore();
      }
      var sp = t < 0.24 ? easeOutCubic(clamp((t - 0.1) / 0.14, 0, 1)) : 1;
      for (var j = 0; j < u.sats.length; j++) {
        var sat = u.sats[j];
        var dist = sat.dist * sp * (1 - conv);
        var sAlpha = (1 - conv) * Math.min(1, (t - 0.08) * 12);
        if (sAlpha <= 0.01) continue;
        var sScale = (0.5 + 0.5 * sp) * (1 - 0.35 * conv);
        var px = u.x + Math.cos(sat.angle) * dist;
        var py = u.y + Math.sin(sat.angle) * dist * 0.7;
        if (sp < 1 && sp > 0.05) {
          ctx.save();
          ctx.globalAlpha = sAlpha * 0.22;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(u.x + Math.cos(sat.angle) * sat.dist * 0.55, u.y + Math.sin(sat.angle) * sat.dist * 0.55 * 0.7);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = sAlpha;
        ctx.translate(px, py);
        ctx.rotate(sat.angle - Math.PI / 2);
        ctx.scale(sScale, sScale);
        ctx.drawImage(sat.sprite.cv, -sat.sprite.halfW, -sat.sprite.halfH, sat.sprite.halfW * 2, sat.sprite.halfH * 2);
        ctx.restore();
      }
    }
    if (copyInk.sampleIdx < INK_SAMPLE_AT.length && elapsed >= INK_SAMPLE_AT[copyInk.sampleIdx]) {
      copyInk.sampleIdx++;
      var x0 = Math.max(0, Math.floor(copyInk.padX * copyInk.dpr));
      var y0 = Math.max(0, Math.floor(copyInk.padY * copyInk.dpr));
      var x1 = Math.min(els.copyInk.width, Math.ceil((copyInk.padX + copyInk.baseW) * copyInk.dpr));
      var y1 = Math.min(els.copyInk.height, Math.ceil((copyInk.padY + copyInk.baseH) * copyInk.dpr));
      var iw = Math.max(1, x1 - x0);
      var ih = Math.max(1, y1 - y0);
      var px = ctx.getImageData(x0, y0, iw, ih).data;
      var n = 0;
      for (var b = 3; b < px.length; b += 4) if (px[b] > 128) n++;
      copyInk.peak = Math.max(copyInk.peak, n / (iw * ih));
      if (copyInk.sampleIdx >= INK_SAMPLE_AT.length) copyInk.sampled = true;
    }
    copyInk.raf = requestAnimationFrame(inkTick);
  }

  function playCopyInk() {
    stopCopyInk();
    if (reduced || !els.copyInk) return;
    var startEl = els.introCopy.querySelector('.eyebrow');
    var endEl = els.openingCopy;
    if (!startEl || !endEl) return;
    var top = startEl.offsetTop - 8;
    var bottom = endEl.offsetTop + endEl.offsetHeight + 8;
    var baseW = els.introCopy.clientWidth;
    var baseH = Math.max(40, bottom - top);
    // 网格铺陈：把文字区切成 2 行若干列，每格落一团大墨并做抖动。
    // 随机散点无法保证覆盖面积；团少而大，才能在连成一片的同时保持有机轮廓。
    var cols = clamp(Math.round((baseW / Math.max(1, baseH)) * 0.85), 2, 4);
    var rows = 2;
    var cellW = baseW / cols;
    var cellH = baseH / rows;
    var gridR = clamp(Math.sqrt(cellW * cellW + cellH * cellH) * 0.55, 80, 240);
    var padX = Math.ceil(gridR * 1.08 * 1.62 + 18);
    var padY = Math.ceil(gridR * 1.08 * 1.62 + 18);
    var w = baseW + padX * 2;
    var h = baseH + padY * 2;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    els.copyInk.style.left = -padX + 'px';
    els.copyInk.style.top = (top - padY) + 'px';
    els.copyInk.style.width = w + 'px';
    els.copyInk.style.height = h + 'px';
    els.copyInk.width = Math.round(w * dpr);
    els.copyInk.height = Math.round(h * dpr);
    var ctx = els.copyInk.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    copyInk.drops = [];
    copyInk.W = w;
    copyInk.H = h;
    copyInk.baseW = baseW;
    copyInk.baseH = baseH;
    copyInk.padX = padX;
    copyInk.padY = padY;
    copyInk.dpr = dpr;
    copyInk.total = 0;
    var elements = 0;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var R = gridR * (0.9 + Math.random() * 0.2);
        var x = padX + cellW * (col + 0.5 + (Math.random() - 0.5) * 0.3);
        var y = padY + cellH * (row + 0.5 + (Math.random() - 0.5) * 0.3);
        var seed = Math.random() * Math.PI * 2;
        var unit = {
          x: x,
          y: y,
          seed: seed,
          start: Math.random() * 420,
          dur: 2500 + Math.random() * 240,
          sprite: bakeStainSprite(R, seed, dpr),
          fall: bakeFallSprite(R * 0.22, dpr),
          sats: []
        };
        var satCount = 5 + Math.floor(Math.random() * 3);
        for (var j = 0; j < satCount; j++) {
          unit.sats.push({
            angle: Math.random() * Math.PI * 2,
            dist: R * (1.25 + Math.random() * 0.6),
            sprite: bakeDotSprite(2.5 + Math.random() * 3.5, Math.random() * Math.PI * 2, dpr)
          });
        }
        elements += 1 + unit.sats.length;
        copyInk.total = Math.max(copyInk.total, unit.start + unit.dur);
        copyInk.drops.push(unit);
      }
    }
    copyInk.total += 220;
    copyInk.startedAt = performance.now();
    copyInk.played = true;
    copyInk.sampled = false;
    copyInk.sampleIdx = 0;
    copyInk.peak = 0;
    copyInk.peakDrops = elements;
    copyInk.raf = requestAnimationFrame(inkTick);
  }

  function copyInkDebug() {
    return { played: copyInk.played, sampled: copyInk.sampled, peak: copyInk.peak, peakDrops: copyInk.peakDrops, drops: copyInk.drops.length };
  }

  function triggerCopyReveal() {
    if (!els.introCopy) return;
    clearTimer('reveal');
    els.introCopy.classList.remove('is-revealing');
    void els.introCopy.offsetWidth;
    if (reduced) return;
    els.introCopy.classList.add('is-revealing');
    timers.reveal = setTimeout(function () {
      if (els.introCopy) els.introCopy.classList.remove('is-revealing');
    }, 2600);
  }

  function showOpeningCopy() {
    if (!state.opening || !els.openingTitle) return;
    els.openingEn.textContent = state.opening.en;
    els.openingTitle.textContent = state.opening.title;
    els.openingShape.textContent = state.opening.shape;
    els.openingCopy.textContent = state.opening.copy;
    els.introCopy.classList.remove('is-morphing');
    els.introCopy.classList.add('is-visible');
    triggerCopyReveal();
    if (state.atmos) state.atmos.dimIntro(true);
  }

  function hideOpeningCopy() {
    if (!els.introCopy) return;
    stopCopyInk();
    clearTimer('reveal');
    els.introCopy.classList.remove('is-revealing');
    if (els.introCopy.classList.contains('is-visible')) {
      els.introCopy.classList.add('is-morphing');
    } else {
      els.introCopy.classList.remove('is-visible');
    }
  }

  function rollOpening(forcedId) {
    if (!state.introActive || isLocked()) return;
    if (state.phase === 'morph') return;

    var opening = null;
    if (forcedId) {
      opening = DATA.openings.filter(function (o) { return o.id === forcedId; })[0] || null;
    }
    if (!opening) {
      opening = pickOpening(state.opening ? state.opening.id : null);
    }
    var variant = makeVariant();
    var fromCurve = state.phase === 'opened' && !!state.opening;
    beginMorph(opening, variant, fromCurve);
  }

  function startGame() {
    if (isLocked() || !state.opening || !state.introActive) return;
    stopCopyInk();
    state.funcs = [];
    state.selections = [];
    state.sceneIndex = 0;
    state.beatIndex = 0;
    state.currentScene = null;
    state.nextSceneId = null;
    state.pendingBridge = '';
    state.visited = [];
    state.picked = [];
    state.flags = {};
    state.railCount = 0;
    if (state.atmos) {
      state.atmos.setEnding(false);
      state.atmos.reset();
    }
    transitionTo(buildPrologueScene, {
      onLeave: function () {
        stopIntroLoop();
        state.introActive = false;
      },
      onAppend: function () {
        renderRailCurrent();
        updateProgress();
        focusTitle();
      }
    });
  }

  function focusTitle() {
    var title = els.sceneTitle || els.endingName ||
      document.querySelector('.interlude-title') ||
      document.querySelector('.chat-phone');
    if (!title) return;
    title.setAttribute('tabindex', '-1');
    try { title.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  function recordFlags(list) {
    (list || []).forEach(function (flag) { if (flag) state.flags[flag] = true; });
  }

  function takeBridge() {
    var text = state.pendingBridge || '';
    state.pendingBridge = '';
    return text;
  }

  function condTrue(cond) {
    if (!cond) return true;
    if (cond.flag) return !!state.flags[cond.flag];
    if (cond.notFlag) return !state.flags[cond.notFlag];
    if (cond.visited) return state.visited.indexOf(cond.visited) !== -1;
    if (cond.notVisited) return state.visited.indexOf(cond.notVisited) === -1;
    if (cond.choice) return state.picked.indexOf(cond.choice) !== -1;
    if (cond.any) return cond.any.some(condTrue);
    if (cond.all) return cond.all.every(condTrue);
    return true;
  }

  function resolveBlocks(blocks) {
    var out = [];
    (blocks || []).forEach(function (block) {
      if (typeof block === 'string') {
        out.push({ text: block, memory: false });
      } else if (block && block.text && condTrue(block.if)) {
        out.push({ text: block.text, memory: true });
      }
    });
    return out;
  }

  /* ---------------- 场景构建 ---------------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function samplePathPoints(d, count) {
    var host = document.createElementNS(SVG_NS, 'svg');
    host.setAttribute('width', '0');
    host.setAttribute('height', '0');
    host.style.position = 'absolute';
    host.style.left = '-9999px';
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    host.appendChild(p);
    document.body.appendChild(host);
    var pts = [];
    try {
      var total = p.getTotalLength();
      for (var i = 0; i < count; i++) {
        var pt = p.getPointAtLength(total * i / count);
        pts.push({ x: pt.x, y: pt.y });
      }
    } finally {
      host.remove();
    }
    return pts;
  }

  function normalizeLoop(pts) {
    var area = 0;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    if (area < 0) pts = pts.slice().reverse();
    var idx = 0;
    for (var j = 1; j < pts.length; j++) if (pts[j].x > pts[idx].x) idx = j;
    return pts.slice(idx).concat(pts.slice(0, idx));
  }

  function linePts(x1, y1, x2, y2, n) {
    var a = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      a.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
    return a;
  }

  function circlePts(n) {
    var a = [];
    for (var i = 0; i < n; i++) {
      var th = (i / n) * Math.PI * 2;
      a.push({ x: 12 + 10 * Math.cos(th), y: 12 + 10 * Math.sin(th) });
    }
    return a;
  }

  function initIconDeform(sec) {
    var TARGETS = {
      'btn-enter': 'M5 3 H19 A2 2 0 0 1 21 5 V19 A2 2 0 0 1 19 21 H5 A2 2 0 0 1 3 19 V5 A2 2 0 0 1 5 3 Z',
      'btn-reroll': 'M18 6 L6 18 M6 6 L18 18'
    };
    Array.prototype.forEach.call(sec.querySelectorAll('.icon-btn'), function (btn) {
      var path = btn.querySelector('path');
      if (!path) return;
      var baseD = path.getAttribute('d');
      var targetD = TARGETS[btn.id];
      if (!targetD) return;
      if (reduced) {
        btn.addEventListener('pointerenter', function () { path.setAttribute('d', targetD); });
        btn.addEventListener('pointerleave', function () { path.setAttribute('d', baseD); });
        return;
      }
      var baseSubs;
      var goalSubs;
      if (btn.id === 'btn-enter') {
        baseSubs = [{ pts: normalizeLoop(circlePts(96)), closed: true }];
        goalSubs = [{ pts: normalizeLoop(samplePathPoints(targetD, 96)), closed: true }];
      } else {
        var tri = normalizeLoop(samplePathPoints(baseD, 96));
        baseSubs = [
          { pts: tri.slice(0, 48), closed: false },
          { pts: tri.slice(48), closed: false }
        ];
        goalSubs = [
          { pts: linePts(6, 6, 18, 18, 48), closed: false },
          { pts: linePts(18, 6, 6, 18, 48), closed: false }
        ];
      }
      var p = 0;
      var v = 0;
      var target = 0;
      var raf = 0;
      var last = 0;

      function render(t) {
        var d = '';
        for (var s = 0; s < baseSubs.length; s++) {
          var b = baseSubs[s].pts;
          var g = goalSubs[s].pts;
          d += 'M';
          for (var i = 0; i < b.length; i++) {
            var x = b[i].x + (g[i].x - b[i].x) * t;
            var y = b[i].y + (g[i].y - b[i].y) * t;
            d += (i ? 'L' : '') + x.toFixed(2) + ' ' + y.toFixed(2);
          }
          if (baseSubs[s].closed) d += 'Z';
        }
        path.setAttribute('d', d);
      }

      function frame(now) {
        raf = 0;
        var dt = last ? Math.min(now - last, 50) / 1000 : 0.016;
        last = now;
        var w = 14;
        v += (w * w * (target - p) - 2 * w * v) * dt;
        p += v * dt;
        if (p < 0) { p = 0; v = 0; }
        if (p > 1) { p = 1; v = 0; }
        render(p);
        if ((target === 1 && p > 0.995) || (target === 0 && p < 0.005)) {
          p = target;
          path.setAttribute('d', target ? targetD : baseD);
          last = 0;
          return;
        }
        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (!raf) raf = requestAnimationFrame(frame);
      }

      btn.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        target = 1;
        start();
      });
      btn.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        target = 1;
        start();
      });
      btn.addEventListener('pointerleave', function () {
        target = 0;
        start();
      });
    });
  }

  function buildIntroScene() {
    var sec = document.createElement('section');
    sec.id = 'screen-intro';
    sec.className = 'screen screen-intro';
    sec.innerHTML = [
      '<div class="intro-stage" aria-hidden="true"></div>',
      '<canvas id="intro-canvas" class="intro-canvas" aria-hidden="true"></canvas>',
      '<button id="seed-btn" class="seed-btn" type="button" aria-label="轻触黑点，随机得到一种开始">',
      '  <span class="sr-only">轻触黑点，随机得到一种开始</span>',
      '</button>',
      '<div id="intro-hint" class="intro-hint" aria-hidden="true">',
      '  <p class="hint-line"><span id="hint-ghost" class="hint-ghost"></span><span id="hint-type" class="hint-type"></span></p>',
      '  <p id="intro-sign" class="intro-sign"><span id="sign-text" class="sign-text"></span></p>',
      '</div>',
      '<div id="intro-copy" class="intro-copy" aria-live="polite">',
      '  <p class="eyebrow"><span id="opening-en">OPENING</span> · 一种开始</p>',
      '  <h1 id="opening-title" class="opening-title"></h1>',
      '  <p id="opening-shape" class="opening-shape"></p>',
      '  <p id="opening-copy" class="opening-copy"></p>',
      '  <canvas id="copy-ink" class="copy-ink" aria-hidden="true"></canvas>',
      '  <div class="opening-actions">',
      '    <button id="btn-enter" class="icon-btn" type="button" aria-label="进入序章" title="进入序章">',
      '      <svg viewBox="0 0 24 24" data-icon="circle" aria-hidden="true" focusable="false"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0Z"/></svg>',
      '    </button>',
      '    <button id="btn-reroll" class="icon-btn" type="button" aria-label="切换开局" title="切换">',
      '      <svg viewBox="0 0 24 24" data-icon="triangle" aria-hidden="true" focusable="false"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>',
      '    </button>',
      '  </div>',
      '  <p class="opening-note">开局只决定这一页的形状，不计入 F(x)。</p>',
      '</div>',
      '<footer class="intro-foot">',
      '  <span>三十次选择，一条曲线</span>',
      '  <span>A FUNCTIONAL FAREWELL</span>',
      '</footer>'
    ].join('\n');

sec.querySelector('#seed-btn').addEventListener('click', function () {
      if (window.SFX) window.SFX.play('seed');
      if (!isLocked() && (state.phase === 'idle' || state.phase === 'opened')) rollOpening();
    });
    sec.querySelector('#btn-reroll').addEventListener('click', function () {
      if (window.SFX) window.SFX.play('triangle');
      if (!isLocked() && state.phase === 'opened') rollOpening();
    });
    sec.querySelector('#btn-enter').addEventListener('click', function () { if (window.SFX) window.SFX.play('circle'); startGame(); });
    initIconDeform(sec);
    return sec;
  }

  function gameHeaderInner(actLabel, step) {
    return [
      '<header class="game-header">',
      '  <div class="gh-row">',
      '    <span class="wordmark">函数告别式</span>',
      '    <span id="act-label" class="gh-act">' + actLabel + '</span>',
      '    <span id="scene-step" class="gh-step">' + step + '</span>',
      '  </div>',
      '  <div class="progress" aria-hidden="true"><span id="progress-fill"></span></div>',
      '  <div class="formula-rail" id="formula-rail" aria-label="当前累积函数">',
      '    <div class="rail-scroll" id="formula-scroll" aria-live="polite"></div>',
      '    <span id="rail-status" class="rail-status" aria-live="polite"></span>',
      '  </div>',
      '</header>'
    ].join('\n');
  }

  function gameFooterInner() {
    return [
      '<footer class="game-foot">',
      '  <span>没有好感度，也没有正确答案</span>',
      '  <span id="func-count">' + state.funcs.length + ' / ' + DATA.slotCount + '</span>',
      '</footer>'
    ].join('\n');
  }

  function buildChatScene(chat) {
    if (!chat) return buildGameScene(DATA.sceneById.s1);
    var sec = document.createElement('section');
    sec.id = 'screen-game';
    sec.className = 'screen screen-game screen-chat';
    sec.innerHTML = [
      gameHeaderInner(chat.actLabel, '消息'),
      '<div class="game-main chat-main">',
      '  <p id="chat-context" class="chat-context" hidden></p>',
      '  <div class="chat-phone" tabindex="-1">',
      '    <div class="chat-notch" aria-hidden="true"></div>',
      '    <div class="chat-topbar">',
      '      <span class="chat-time">' + chat.time + '</span>',
      '      <span class="chat-contact">' + chat.contact + '</span>',
      '      <span class="chat-time" aria-hidden="true">··</span>',
      '    </div>',
      '    <p class="chat-day">' + (chat.day || '') + '</p>',
      '    <div id="chat-log" class="chat-log" role="log" aria-live="polite"></div>',
      '    <div id="chat-replies" class="chat-replies" role="group" aria-label="回复"></div>',
      '    <button id="chat-continue" class="btn btn-solid chat-continue" type="button" hidden>继续</button>',
      '  </div>',
      '</div>',
      gameFooterInner()
    ].join('\n');
    var log = sec.querySelector('#chat-log');
    var repliesEl = sec.querySelector('#chat-replies');
    var cont = sec.querySelector('#chat-continue');
    var context = sec.querySelector('#chat-context');
    var bridge = takeBridge();
    if (bridge) {
      context.textContent = bridge;
      context.hidden = false;
    }
    cont.addEventListener('click', function () { goNextBeat(); });
    if (window.SFX) window.SFX.play('phone');
    playChat(chat, log, repliesEl, cont);
    return sec;
  }

  function playChat(chat, log, repliesEl, cont) {
    // 聊天先要接住上一场发生的事：命中的记忆消息插在第一条之后
    var opening = (chat.messages || []).slice();
    var echoLines = (chat.echoes || []).filter(function (e) { return condTrue(e.if); })
      .map(function (e) { return e.text; });
    if (echoLines.length && opening.length) {
      opening = [opening[0]].concat(echoLines).concat(opening.slice(1));
    }
    var rounds = [{ messages: opening, replies: chat.replies }];
    if (chat.second) rounds.push(chat.second);
    var roundIndex = 0;
    var msgIndex = 0;
    var afterQueue = [];

    function bubble(text, mine) {
      if (!mine && window.SFX) window.SFX.play('notify');
      var b = document.createElement('div');
      b.className = 'chat-bubble' + (mine ? ' mine' : '');
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      if (mine || reduced) {
        b.textContent = text;
        return;
      }
      var chars = Array.from(text);
      var i = 0;
      function step() {
        if (!b.isConnected) return;
        if (i >= chars.length) return;
        b.textContent += chars[i++];
        log.scrollTop = log.scrollHeight;
        timers.chat = setTimeout(step, 40);
      }
      step();
    }

    function typing(done) {
      if (reduced) { done(); return; }
      var t = document.createElement('div');
      t.className = 'chat-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
      timers.chat = setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
        done();
      }, 620);
    }

    function applyReply(reply) {
      recordFlags(reply.flags);
      if (reply.next) state.nextSceneId = reply.next;
      state.pendingBridge = reply.bridge || ('你说：“' + reply.text + '”。');
    }

    function showReplies(replies) {
      repliesEl.innerHTML = '';
      repliesEl.classList.remove('is-done');
      replies.forEach(function (reply) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-reply';
        b.textContent = reply.text;
        b.addEventListener('click', function () {
          if (repliesEl.classList.contains('is-done')) return;
          repliesEl.classList.add('is-done');
          Array.prototype.forEach.call(repliesEl.children, function (x) { x.disabled = true; });
          if (window.SFX) window.SFX.play('send');
          applyReply(reply);
          bubble(reply.text, true);
          afterQueue = (reply.after || []).slice();
          msgIndex = 0;
          roundIndex += 1;
          timers.chat = setTimeout(step, reduced ? 0 : 450);
        });
        repliesEl.appendChild(b);
      });
    }

    function step() {
      if (!log.isConnected) return;
      if (afterQueue.length) {
        var t = afterQueue.shift();
        typing(function () {
          bubble(t, false);
          timers.chat = setTimeout(step, reduced ? 0 : 440);
        });
        return;
      }
      var rd = rounds[roundIndex];
      if (!rd) {
        cont.hidden = false;
        return;
      }
      if (msgIndex < rd.messages.length) {
        var text = rd.messages[msgIndex++];
        typing(function () {
          bubble(text, false);
          timers.chat = setTimeout(step, reduced ? 0 : 480);
        });
        return;
      }
      showReplies(rd.replies);
    }

    if (reduced) {
      var first = rounds[0];
      var last = rounds[rounds.length - 1];
      first.messages.forEach(function (m) { bubble(m, false); });
      bubble(first.replies[0].text, true);
      applyReply(first.replies[0]);
      (first.replies[0].after || []).forEach(function (a) { bubble(a, false); });
      if (last !== first) {
        last.messages.forEach(function (m) { bubble(m, false); });
        bubble(last.replies[0].text, true);
        applyReply(last.replies[0]);
        (last.replies[0].after || []).forEach(function (a) { bubble(a, false); });
      }
      cont.hidden = false;
      return;
    }
    timers.chat = setTimeout(step, 520);
  }

  // 序章：第一题之前交代"她是谁、你们怎么认识的"。只出现一次，不计分，不写 state.funcs。
  function buildPrologueScene() {
    var pro = DATA.prologue;
    if (!pro) return buildBeat(0);
    var art = (window.FAREWELL_ART && window.FAREWELL_ART[pro.art]) || { bg: '' };
    var sec = document.createElement('section');
    sec.id = 'screen-game';
    sec.className = 'screen screen-game screen-interlude screen-prologue';
    sec.innerHTML = [
      gameHeaderInner(pro.actLabel, '序章'),
      '<div class="game-main interlude-main">',
      '  <div class="interlude-card">',
      '    <div class="interlude-art" aria-hidden="true">',
      '      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="scene-bg">' + art.bg + '</g></svg>',
      '    </div>',
      '    <div class="interlude-copy">',
      '      <p class="eyebrow">' + pro.kicker + '</p>',
      '      <h1 id="prologue-title" class="interlude-title">' + pro.title + '</h1>',
      '      <div class="interlude-text">',
      pro.text.map(function (p, i) {
        return '<p style="animation-delay:' + (0.15 + i * 0.18) + 's">' + p + '</p>';
      }).join(''),
      '      </div>',
      '      <button id="btn-continue" class="btn btn-solid" type="button">继续</button>',
      '    </div>',
      '  </div>',
      '</div>',
      gameFooterInner()
    ].join('\n');
    sec.querySelector('#btn-continue').addEventListener('click', function () { beginFirstBeat(); });
    return sec;
  }

  // 序章之后进入第一个节拍（s1）；不能复用 goNextBeat，否则会从 beat 0 直接跳到 beat 1。
  function beginFirstBeat() {
    if (isLocked()) return;
    transitionTo(function () { return buildBeat(0); }, {
      onAppend: function () {
        renderRailCurrent();
        updateProgress();
        window.scrollTo(0, 0);
        focusTitle();
      }
    });
  }

  function buildInterludeScene(inter) {
    if (!inter) return buildBeat(0);
    var art = (window.FAREWELL_ART && window.FAREWELL_ART[inter.art]) || { bg: '' };
    var bridge = takeBridge();
    var blocks = [];
    if (bridge) blocks.push({ text: bridge, memory: true });
    blocks = blocks.concat(resolveBlocks(inter.text));
    blocks = blocks.concat(resolveBlocks(inter.echoes));
    var textHtml = blocks.map(function (p, i) {
      return '<p class="' + (p.memory ? 'memory' : '') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's">' + p.text + '</p>';
    }).join('');
    var sec = document.createElement('section');
    sec.id = 'screen-game';
    sec.className = 'screen screen-game screen-interlude';
    sec.innerHTML = [
      gameHeaderInner(inter.actLabel, '间章'),
      '<div class="game-main interlude-main">',
      '  <div class="interlude-card">',
      '    <div class="interlude-art" aria-hidden="true">',
      '      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="scene-bg">' + art.bg + '</g></svg>',
      '    </div>',
      '    <div class="interlude-copy">',
      '      <p class="eyebrow">' + inter.kicker + '</p>',
      '      <h1 id="interlude-title" class="interlude-title">' + inter.title + '</h1>',
      '      <div class="interlude-text">',
      textHtml,
      '      </div>',
      '      <button id="btn-continue" class="btn btn-solid" type="button">继续</button>',
      '    </div>',
      '  </div>',
      '</div>',
      gameFooterInner()
    ].join('\n');
          if (window.SFX) window.SFX.play('page');
sec.querySelector('#btn-continue').addEventListener('click', function () { goNextBeat(); });
    return sec;
  }

  function buildGameScene(scene) {
    scene = scene || DATA.sceneById.s1;
    if (!scene) return buildBeat(0);
    var slot = scene.slot || 1;
    state.currentScene = scene;
    state.sceneIndex = slot - 1;
    if (state.visited.indexOf(scene.id) === -1) state.visited.push(scene.id);
    var sec = document.createElement('section');
    sec.id = 'screen-game';
    sec.className = 'screen screen-game';
    var art = (window.FAREWELL_ART && window.FAREWELL_ART[scene.id]) || { bg: '', options: [] };
    var fgMarkup = art.fg
      ? '<div id="scene-fg" class="scene-fg" aria-hidden="true"><svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax meet"><g class="scene-fg-lines">' + art.fg + '</g></svg></div>'
      : '';
    var portraitMarkup = '';
    if (art.portrait && art.portrait.spot) {
      var pp = art.portrait;
      var pf = pp.focus || [50, 24];
      portraitMarkup = '<img id="scene-portrait" class="scene-portrait" src="' + pp.src + '" alt="" aria-hidden="true" decoding="async" style="--ptx:' + pp.spot[0] + '%;--pty:' + pp.spot[1] + '%;--ptw:' + pp.spot[2] + '%;--pth:' + pp.spot[3] + '%;--pfo:' + pf[0] + '% ' + pf[1] + '%;">';
    }
    sec.innerHTML = [
      '<header class="game-header">',
      '  <div class="gh-row">',
      '    <span class="wordmark">函数告别式</span>',
      '    <span id="act-label" class="gh-act"></span>',
      '    <span id="scene-step" class="gh-step"></span>',
      '  </div>',
      '  <div class="progress" aria-hidden="true"><span id="progress-fill"></span></div>',
      '  <div class="formula-rail" id="formula-rail" aria-label="当前累积函数">',
      '    <div class="rail-scroll" id="formula-scroll" aria-live="polite"></div>',
      '    <span id="rail-status" class="rail-status" aria-live="polite"></span>',
      '  </div>',
      '</header>',
      '<div class="game-main">',
      '  <article id="scene-wrap" class="scene-wrap scene-stage" data-scene="' + scene.id + '">',
      '    <div id="scene-art" class="scene-art" aria-hidden="true">',
      '      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="scene-bg">' + art.bg + '</g></svg>',
      '    </div>',
      '    ' + portraitMarkup,
      '    ' + fgMarkup,
      '    <div class="scene-copy">',
      '      <p id="scene-kicker" class="eyebrow"></p>',
      '      <h1 id="scene-title" class="scene-title"></h1>',
      '      <div id="scene-text" class="scene-text"></div>',
      '      <p class="scene-question">',
      '        <span id="scene-question-full" class="sr-only"></span>',
      '        <span id="scene-question-type" aria-hidden="true"></span><span class="scene-caret" aria-hidden="true"></span>',
      '      </p>',
      '      <p class="scene-hint" aria-hidden="true">线条也是选项</p>',
      '    </div>',
      '    <div id="options" class="options art-options" role="group" aria-label="选择"></div>',
      '  </article>',
      '</div>',
      '<footer class="game-foot">',
      '  <span>没有好感度，也没有正确答案</span>',
      '  <span id="func-count">0 / ' + DATA.slotCount + '</span>',
      '</footer>'
    ].join('\n');

    sec.querySelector('#act-label').textContent = scene.actLabel;
    sec.querySelector('#scene-step').textContent = pad2(slot) + ' / ' + pad2(DATA.slotCount);
    sec.querySelector('#scene-kicker').textContent = 'SCENE ' + pad2(slot) + (scene.when ? ' · ' + scene.when : '');
    sec.querySelector('#scene-title').textContent = scene.title;
    sec.querySelector('#scene-question-full').textContent = scene.question || '';

    var textWrap = sec.querySelector('#scene-text');
    var bridge = takeBridge();
    var blocks = [];
    if (bridge) blocks.push({ text: bridge, memory: true });
    blocks = blocks.concat(resolveBlocks(scene.text));
    var echoText = '';
    if (scene.echoMap && scene.echoMap[state.lastOptionId]) echoText = scene.echoMap[state.lastOptionId];
    else if (scene.echoMap && Object.keys(scene.echoMap).length) echoText = DATA.echoFallback || '';
    else if (scene.echoes && scene.echoes.length) echoText = scene.echoes[0];
    if (echoText) blocks.push({ text: echoText, memory: true });
    blocks.forEach(function (block, i) {
      var p = document.createElement('p');
      if (block.memory) p.className = 'memory';
      p.textContent = block.text;
      p.style.animationDelay = (0.06 + i * 0.06) + 's';
      textWrap.appendChild(p);
    });

    var options = sec.querySelector('#options');
    scene.options.forEach(function (opt, i) {
      var spot = art.options && art.options[i] ? art.options[i].spot : [6 + i * 30, 58, 24, 24];
      var artMarkup = art.options && art.options[i] ? art.options[i].art : '';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option art-option';
      btn.style.setProperty('--px', spot[0] + '%');
      btn.style.setProperty('--py', spot[1] + '%');
      btn.style.setProperty('--pw', spot[2] + '%');
      btn.style.setProperty('--ph', spot[3] + '%');
      btn.style.setProperty('--d', (i * OPT_STAGGER) + 'ms');
      btn.disabled = isLocked();
      btn.setAttribute('aria-label', String.fromCharCode(65 + i) + '：' + opt.text);
      btn.addEventListener('mouseenter', function () { if (window.SFX) window.SFX.play('hover'); });
      btn.addEventListener('focus', function () { if (window.SFX) window.SFX.play('hover'); });

      var artWrap = document.createElement('span');
      artWrap.className = 'option-art';
      artWrap.setAttribute('aria-hidden', 'true');
      artWrap.innerHTML = '<svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + artMarkup + '</svg>';

      var reveal = document.createElement('span');
      reveal.className = 'option-reveal';

      var key = document.createElement('span');
      key.className = 'option-key';
      key.textContent = String.fromCharCode(65 + i);

      var label = document.createElement('span');
      label.className = 'option-label';
      label.textContent = opt.label;

      var text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = opt.text;

      reveal.appendChild(key);
      reveal.appendChild(label);
      reveal.appendChild(text);
      btn.appendChild(artWrap);
      btn.appendChild(reveal);
      btn.addEventListener('click', function () { choose(opt, btn, scene); });
      options.appendChild(btn);
    });

    typeSceneQuestion(sec, scene.question || '');
    return sec;
  }

  function typeSceneQuestion(sec, text) {
    clearTimer('question');
    var el = sec.querySelector('#scene-question-type');
    if (!el) return;
    el.textContent = '';
    var wrap = el.parentElement;
    if (wrap) wrap.classList.remove('is-done');
    if (reduced) {
      el.textContent = text;
      if (wrap) wrap.classList.add('is-done');
      return;
    }
    var chars = Array.from(text);
    var i = 0;
    function tick() {
      if (!el.isConnected) return;
      if (i >= chars.length) {
        if (wrap) wrap.classList.add('is-done');
        return;
      }
      var ch = chars[i++];
      var span = document.createElement('span');
      span.className = 'scene-ch';
      span.textContent = ch;
      el.appendChild(span);
      timers.question = setTimeout(tick, /[，。、；：？！]/.test(ch) ? 150 : 48);
    }
    timers.question = setTimeout(tick, 700);
  }

    if (window.SFX) window.SFX.play('chime');
function buildEndingScene() {
    var sec = document.createElement('section');
    sec.id = 'screen-ending';
    sec.className = 'screen screen-ending';
    sec.innerHTML = [
      '<header class="ending-top">',
      '  <span class="wordmark">函数告别式</span>',
      '  <button id="btn-restart-top" class="btn btn-text" type="button">换一个开局</button>',
      '</header>',
      '<main class="ending-main">',
      '  <section class="ending-hero">',
      '    <p class="eyebrow">ENDING <span id="ending-index">01</span> / <span id="ending-total">06</span></p>',
      '    <h1 id="ending-name" class="ending-name"></h1>',
      '    <p id="ending-shape" class="ending-shape"></p>',
      '  </section>',
      '  <section class="block plot-block">',
      '    <header class="block-head">',
      '      <span>这一次的形状</span>',
      '      <div class="plot-tools">',
      '        <span class="plot-hint">拖动平移 · 滚轮缩放 · 双击复位</span>',
      '        <button id="plot-reset" class="btn btn-mini" type="button">复位</button>',
      '        <button id="plot-expand" class="btn btn-mini" type="button" hidden>展开曲线</button>',
      '      </div>',
      '    </header>',
      '    <div class="plot-wrap">',
      '      <canvas id="ending-canvas" aria-label="结局图形：三十个选项的谐波项合成的参数曲线，可拖动查看"></canvas>',
      '      <p id="plot-collapsed-note" class="plot-collapsed-note" hidden>曲线已经收回，像一个句点。</p>',
      '    </div>',
      '    <div class="axis-reading">',
      '      <span class="axis-pair"><span class="axis-key">x</span><span id="axis-x"></span></span>',
      '      <span class="axis-divider" aria-hidden="true">·</span>',
      '      <span class="axis-pair"><span class="axis-key">y</span><span id="axis-y"></span></span>',
      '    </div>',
      '    <p id="axis-note" class="axis-note"></p>',
      '  </section>',
      '  <p id="ending-text" class="ending-text">',
      '    <span id="ending-text-measure" class="ending-text-measure" aria-hidden="true"></span>',
      '    <span class="ending-type-layer" aria-hidden="true"><span id="ending-type"></span><span id="ending-caret" class="type-caret"></span></span>',
      '    <span id="ending-text-accessible" class="sr-only"></span>',
      '  </p>',
      '  <section class="block ending-deferred">',
      '    <header class="block-head"><span>你的图形</span><span>十二项谐波的叠加</span></header>',
      '    <div id="formula" class="formula-full" aria-label="完整函数表达式"></div>',
      '    <p id="formula-note" class="formula-note" hidden></p>',
      '  </section>',
      '  <section class="block ending-deferred">',
      '    <header class="block-head"><span>三十次选择</span><span>按发生顺序</span></header>',
      '    <ol id="choice-list" class="choice-list"></ol>',
      '  </section>',
      '  <section class="block ending-deferred novel-block">',
      '    <header class="block-head"><span>这一局的小说</span><span>由你选过的一切写成</span></header>',
      '    <p class="novel-lead">这一局做过三十次选择。可以让它变成一篇只属于这一次的小说。</p>',
      '    <button id="novel-btn" class="btn btn-solid" type="button">生成属于我的小说</button>',
      '    <div id="novel-out" class="novel-out" hidden></div>',
      '    <p id="novel-status" class="novel-status" hidden></p>',
      '  </section>',
      '  <section id="principle-section" class="principle-section" aria-hidden="true">',
      '    <p class="principle-lead" id="principle-lead"></p>',
      '    <p id="principle" class="principle">',
      '      <span id="principle-measure" class="principle-measure" aria-hidden="true"></span>',
      '      <span class="principle-type-layer" aria-hidden="true"><span id="principle-type"></span><span id="principle-caret" class="type-caret"></span></span>',
      '      <span id="principle-accessible" class="sr-only"></span>',
      '    </p>',
      '  </section>',
      '  <section id="card-section" class="card-section" hidden>',
      '    <header class="block-head"><span>结局卡片</span><span>可保存 · 可截图</span></header>',
      '    <div class="card-frame"><canvas id="share-card" aria-label="黑白结局卡片"></canvas></div>',
      '    <div class="card-actions">',
      '      <button id="btn-download" class="btn btn-solid" type="button">保存卡片</button>',
      '      <button id="btn-restart" class="btn btn-outline" type="button">换一个开局</button>',
      '    </div>',
      '  </section>',
      '  <footer class="ending-foot">',
      '    <span>FUNCTION IS FATE.</span>',
      '    <span>函数告别式 · 2026</span>',
      '  </footer>',
      '</main>'
    ].join('\n');

    fillEndingScene(sec);

    sec.querySelector('#btn-restart-top').addEventListener('click', restartAll);
    sec.querySelector('#btn-restart').addEventListener('click', restartAll);
    sec.querySelector('#btn-download').addEventListener('click', downloadCard);
    sec.querySelector('#plot-reset').addEventListener('click', function () {
      if (!isLocked() && state.plot) state.plot.reset();
    });
    sec.querySelector('#plot-expand').addEventListener('click', function () {
      if (!isLocked() && state.plot) state.plot.expand();
    });
    return sec;
  }

  function fillEndingScene(sec) {
    var ending = state.ending;
    if (!ending) return;
    sec.querySelector('#ending-index').textContent = pad2(ending.order);
    var totalEl = sec.querySelector('#ending-total');
    if (totalEl) totalEl.textContent = pad2(DATA.endingsOrder.length);
    sec.querySelector('#ending-name').textContent = ending.title;
    sec.querySelector('#ending-shape').textContent = ending.shapeName || ending.shape;

    var axis = {
      x: '横向位置',
      y: '纵向位置',
      note: '这张图按结局定形：完整的心、断成两半的心，或两条始终差一点的曲线。它不参与判定，只是这一次的形状。' }
    sec.querySelector('#axis-x').textContent = axis.x;
    sec.querySelector('#axis-y').textContent = axis.y;
    sec.querySelector('#axis-note').textContent = axis.note;

    var endingText = sec.querySelector('#ending-text');
    endingText.classList.remove('is-typing', 'is-complete');
    sec.querySelector('#ending-text-measure').textContent = ending.text;
    sec.querySelector('#ending-text-accessible').textContent = ending.text;
    sec.querySelector('#ending-type').textContent = '';
    sec.querySelector('#ending-caret').classList.remove('is-hidden');

    renderEndingFormulaInto(sec.querySelector('#formula'), sec.querySelector('#formula-note'), state.funcs);
    renderChoicesInto(sec.querySelector('#choice-list'));
    setupNovel(sec);
    sec.querySelector('#principle-lead').textContent = ending.lead;
    sec.querySelector('#principle-measure').textContent = ending.principle;
    sec.querySelector('#principle-accessible').textContent = ending.principle;
    sec.querySelector('#principle-type').textContent = '';
    sec.querySelector('#principle-caret').classList.remove('is-hidden');
    var principle = sec.querySelector('#principle-section');
    principle.classList.remove('is-visible');
    principle.setAttribute('aria-hidden', 'true');
    var card = sec.querySelector('#card-section');
    card.hidden = true;
    card.classList.remove('is-visible');
    sec.querySelector('#plot-expand').hidden = true;
    sec.querySelector('#plot-collapsed-note').hidden = true;
    sec.querySelector('.plot-wrap').classList.remove('is-collapsed');
    var share = sec.querySelector('#share-card');
    share.width = 1;
    share.height = 1;
  }

  /* ---------------- 游戏 ---------------- */

  function renderRailEmpty() {
    state.railCount = 0;
    if (!els.formulaScroll) return;
    els.formulaScroll.innerHTML = '';
    var prefix = document.createElement('span');
    prefix.className = 'rail-prefix';
    prefix.textContent = 'F(x) =';
    var empty = document.createElement('span');
    empty.className = 'rail-empty';
    empty.textContent = '0';
    els.formulaScroll.appendChild(prefix);
    els.formulaScroll.appendChild(empty);
  }

  function renderRailCurrent() {
    if (!els.formulaScroll) return;
    renderRailEmpty();
    for (var i = 0; i < state.funcs.length; i++) {
      appendRail(state.funcs[i], i);
    }
  }

  function choiceOf(c) { return typeof c === 'string' ? { fn: c, op: '+' } : (c || { fn: '', op: '+' }); }

  function appendRail(fnOrChoice, index) {
    var choice = choiceOf(fnOrChoice);
    var fnId = choice.fn;
    var f = DATA.functions[fnId];
    if (!f || !els.formulaScroll) return;
    if (!state.railCount) {
      els.formulaScroll.innerHTML = '';
      var prefix = document.createElement('span');
      prefix.className = 'rail-prefix';
      prefix.textContent = 'F(x) =';
      els.formulaScroll.appendChild(prefix);
    }
    var opText = choice.op === '-' ? '−' : choice.op === '*' ? '×' : choice.op === '/' ? '÷' : '+';
    if (index > 0 || opText !== '+') {
      var op = document.createElement('span');
      op.className = 'rail-op';
      op.textContent = opText;
      els.formulaScroll.appendChild(op);
    }
    var termTex = f.termTex;
    if (choice.op === '*') termTex = '\left(1+0.1\,' + f.termTex + '\right)';
    if (choice.op === '/') termTex = '\left(1+0.1\left|' + f.termTex + '\right|\right)';
    var term = texEl(termTex, false, 'rail-term');
    els.formulaScroll.appendChild(term);
    state.railCount++;
    els.formulaScroll.scrollLeft = els.formulaScroll.scrollWidth;
  }

  function showRailStatus(fnId) {
    var f = DATA.functions[fnId];
    if (!f || !els.railStatus) return;
    els.railStatus.innerHTML = '';
    var lead = document.createElement('span');
    lead.textContent = '✓ 已加入';
    els.railStatus.appendChild(lead);
    var tex = 'f_{' + fnId.slice(1) + '}(x) = ' +
      (fnId === 'f9' ? '2\\,H(x-5.2)' : f.tex);
    els.railStatus.appendChild(texEl(tex));
    els.railStatus.classList.add('is-visible');
    clearTimer('railStatus');
    timers.railStatus = setTimeout(function () {
      if (els.railStatus) els.railStatus.classList.remove('is-visible');
    }, 1200);
  }

  function updateProgress() {
    var n = state.funcs.length;
    if (els.progressFill) els.progressFill.style.width = (n / DATA.slotCount * 100) + '%';
    if (els.funcCount) els.funcCount.textContent = n + ' / ' + DATA.slotCount;
  }

  // 转场：其它内容向外飞出并淡出 → 选中项停留 → 选中项淡出 → 下一幕淡入飞入
  function playZoom(btn, done) {
    if (window.SFX) window.SFX.play('whoosh');
    var screen = document.querySelector('.screen-game');
    if (!screen || !btn) { setTimeout(done, 160); return; }
    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = vw / 2, cy = vh / 2;

    if (reduced) {
      screen.style.transition = 'opacity .3s ease';
      screen.style.opacity = '0';
      setTimeout(function () { state.zoomReturning = true; done(); }, 300);
      return;
    }

    var others = [];
    function push(el, k) { if (el) others.push([el, k]); }
    push(screen.querySelector('.scene-copy'), 0.5);
    push(screen.querySelector('.scene-art'), 0.28);
    push(screen.querySelector('.scene-fg'), 0.42);
    push(screen.querySelector('.scene-portrait'), 0.5);
    push(screen.querySelector('.game-foot'), 0.36);
    Array.prototype.forEach.call(screen.querySelectorAll('.art-option'), function (o) {
      if (o !== btn) others.push([o, 0.58]);
    });

    others.forEach(function (pair) {
      var el = pair[0], k = pair[1];
      var r = el.getBoundingClientRect();
      var ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      var dx = ex - cx, dy = ey - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = dx / len, ny = dy / len;
      el.style.animation = 'none';
      el.style.transition = 'transform .66s cubic-bezier(.4, 0, .2, 1), opacity .56s ease';
      void el.offsetWidth; // 强制样式落盘，保证过渡真的从当前状态开始
      el.style.transform = 'translate(' + (nx * vw * k).toFixed(1) + 'px,' + (ny * vh * k).toFixed(1) + 'px) scale(.9)';
      el.style.opacity = '0';
    });

    // 选中的物件留在原处（不飞出）
    btn.classList.add('is-chosen');
    btn.style.animation = 'none';
    btn.style.zIndex = '9';
    btn.style.transition = 'transform .5s ease';
    void btn.offsetWidth;

    // 其它内容飞完 → 选中项再淡出
    setTimeout(function () {
      btn.style.transition = 'opacity .44s ease, transform .62s ease';
      btn.style.opacity = '0';
      btn.style.transform = 'scale(1.05)';
      setTimeout(function () {
        state.zoomReturning = true;
        done();
      }, 430);
    }, 700);
  }

  function choose(opt, btn, scene) {
    scene = scene || state.currentScene;
    if (isLocked() || !scene) return;
    if (window.SFX) { window.SFX.play('select'); window.SFX.play('tick', state.funcs.length); }

    var index = state.funcs.length;
    var choice = { fn: opt.fn, op: opt.op || '+', weight: opt.weight || 0, key: !!opt.key, h: opt.h || null, d: opt.d || null, signal: opt.signal || null };
    state.funcs.push(choice);
    state.picked.push(opt.id);
    state.lastOptionId = opt.id;
    if (window.FAREWELL_AFFINITY) window.FAREWELL_AFFINITY.onChoice(opt);
    if (opt.skip) state.skipNextUnit = true;
    state.nextSceneId = opt.next || null;
    state.pendingBridge = opt.bridge || '';
    recordFlags(opt.flags);
    state.selections.push({
      scene: scene.title,
      label: opt.label,
      text: opt.text,
      fn: opt.fn,
      op: opt.op || '+',
      sceneId: scene.id,
      optionId: opt.id
    });

    lockAnim(BG_LOCK);
    if (els.options) {
      els.options.classList.add('is-locked');
      Array.prototype.forEach.call(els.options.children, function (b) { b.disabled = true; });
      els.options.setAttribute('aria-busy', 'true');
    }
    if (btn) btn.classList.add('is-chosen');
    updateProgress();
    appendRail(choice, index);
    showRailStatus(opt.fn);
    if (state.atmos) state.atmos.showFunction(state.funcs.map(function (c) { return c.fn; }));

    clearTimer('sceneNext');
    if (reduced) {
      timers.sceneNext = setTimeout(function () { goNextBeat(true); }, 0);
      return;
    }
    playZoom(btn, function () { goNextBeat(true); });
  }


  var preloadedPortraits = {};
  function preloadPortrait(scene) {
    try {
      var art = window.FAREWELL_ART && window.FAREWELL_ART[scene && scene.id];
      var src = art && art.portrait && art.portrait.src;
      if (!src || preloadedPortraits[src]) return;
      preloadedPortraits[src] = true;
      var img = new Image();
      img.src = src;
    } catch (err) { /* 忽略 */ }
  }

  function goNextBeat(fromChoice) {
    if (!fromChoice && isLocked()) return;
    var step = 1;
    if (fromChoice && state.skipNextUnit) { step = 2; state.skipNextUnit = false; }
    var next = state.beatIndex + step;
    if (next >= DATA.beats.length) {
      prepareEnding();
      transitionTo(buildEndingScene, { onAppend: setupEnding });
      return;
    }
    var nextBeat = DATA.beats[next];
    if (fromChoice && nextBeat && nextBeat.type === 'scene') state.zoomReturning = true;
    transitionTo(function () { return buildBeat(next); }, {
      onAppend: function () {
        renderRailCurrent();
        updateProgress();
        window.scrollTo(0, 0);
        focusTitle();
      }
    });
  }

  function resolveBeatScene(beat) {
    if (beat.branch === 'm07' && DATA.m07SceneFor) {
      var pick = DATA.m07SceneFor();
      if (window.FAREWELL_AFFINITY) window.FAREWELL_AFFINITY.noteVariant(pick.variant);
      state.lastBranch = { point: 'm07', variant: pick.variant };
      return pick.scene;
    }
    var id = state.nextSceneId;
    var scene = id ? DATA.sceneById[id] : null;
    if (!scene || (beat.slot && scene.slot !== beat.slot)) {
      scene = DATA.sceneById[beat.default] || DATA.sceneById.s1;
    }
    state.nextSceneId = null;
    return scene;
  }


  /* ---------------- galgame 单元（间章对话 + 3 选项） ---------------- */
  /* ---------------- galgame 单元（表情立绘 + 对话 + 3 选项） ---------------- */
  var GAL_EXPR = { '平静': 'calm', '闭眼': 'blink', '疑惑': 'puzzle', '微笑': 'smile', '捂嘴笑': 'laugh', '害羞': 'shy', '生气': 'angry', '悲伤': 'sad' };
  var GAL_EXPR_LOADED = false;
  function preloadGalExpr() {
    if (GAL_EXPR_LOADED) return;
    GAL_EXPR_LOADED = true;
    Object.keys(GAL_EXPR).forEach(function (k) {
      var img = new Image();
      img.src = 'assets/gal/' + GAL_EXPR[k] + '-soft.png';
    });
  }

  function buildGalgameScene(unit) {
    if (!unit) return buildGameScene(DATA.sceneById.m01);
    preloadGalExpr();
    var sec = document.createElement('section');
    sec.id = 'screen-game';
    sec.className = 'screen screen-game screen-gal';
    var art = (window.FAREWELL_ART && window.FAREWELL_ART[unit.portraitFrom]) || {};
    var pp = art.portrait;
    var portraitMarkup = pp
      ? '<img class="scene-portrait gal-portrait" src="' + pp.src + '" alt="" aria-hidden="true" decoding="async" style="--ptx:' + pp.spot[0] + '%;--pty:' + pp.spot[1] + '%;--ptw:' + pp.spot[2] + '%;--pth:' + pp.spot[3] + '%;">'
      : '';
    sec.innerHTML = [
      gameHeaderInner('间章 · 对话', 'GALGAME'),
      '<div class="game-main gal-main">',
      '  <div class="gal-stage">',
      '    <div class="gal-panel">',
      '      <p class="gal-kicker">' + unit.title + '</p>',
      '      <div id="gal-log" class="gal-log" aria-live="polite"></div>',
      '      <div id="gal-options" class="gal-options" hidden></div>',
      '      <button id="gal-next" class="btn btn-solid" type="button">继续</button>',
      '    </div>',
      portraitMarkup,
      '    <img class="gal-expr is-show" src="assets/gal/calm-soft.png" alt="" aria-hidden="true" decoding="async">',
      '  </div>',
      '</div>',
      gameFooterInner()
    ].join('\n');

    var log = sec.querySelector('#gal-log');
    var nextBtn = sec.querySelector('#gal-next');
    var optsEl = sec.querySelector('#gal-options');
    var exprImg = sec.querySelector('.gal-expr');
    var lines = unit.dialogue || [];
    var shown = 0;
    var busy = false;      // 表情反馈期间暂停眨眼
    var blinkTimer = null;

    function setExpr(name, fade) {
      var key = GAL_EXPR[name] || 'calm';
      exprImg.src = 'assets/gal/' + key + '-soft.png';
      exprImg.classList.toggle('is-show', fade !== false);
    }

    // 眨眼：平静时每 4~6 秒一次，闭眼 120~180 毫秒（用 interval 轮询，避免链式 timeout 丢失）
    var blinkAt = Date.now() + 4000 + Math.random() * 2000;
    function startBlinkLoop() {
      blinkTimer = setInterval(function () {
        if (!sec.isConnected) { clearInterval(blinkTimer); return; }
        if (busy) return;
        if (Date.now() < blinkAt) return;
        exprImg.src = 'assets/gal/blink-soft.png';
        blinkAt = Date.now() + 4000 + Math.random() * 2000;
        setTimeout(function () {
          if (!sec.isConnected || busy) return;
          exprImg.src = 'assets/gal/calm-soft.png';
        }, 120 + Math.random() * 60);
      }, 200);
    }

    setExpr('平静', true);
    startBlinkLoop();

    function showLine(i) {
      if (i >= lines.length) return;
      var d = document.createElement('p');
      d.className = 'gal-line';
      d.innerHTML = '<span class="gal-who">' + (lines[i].who || '她') + '</span>' + lines[i].text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }

    function showOptions() {
      nextBtn.hidden = true;
      optsEl.hidden = false;
      optsEl.innerHTML = '';
      unit.options.forEach(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'gal-option';
        b.textContent = String.fromCharCode(65 + i) + '　' + o.label;
        b.addEventListener('click', function () {
          if (sec.dataset.done) return;
          sec.dataset.done = '1';
          Array.prototype.forEach.call(optsEl.children, function (x) { x.disabled = true; });
          if (window.FAREWELL_AFFINITY) window.FAREWELL_AFFINITY.onChoice(o);
          state.picked.push(o.id);
          state.lastOptionId = o.id;
          state.selections.push({ scene: unit.title, label: o.label, text: o.label, optionId: o.id });
          if (window.SFX) window.SFX.play('select');
          // 表情反馈：停留 1.6 秒，再渐隐回平静，然后进入下一幕
          busy = true;
          setExpr(o.expr || '平静', true);
          setTimeout(function () {
            exprImg.classList.remove('is-show');
            setTimeout(function () {
              if (o.skip) state.skipNextUnit = true;
              goNextBeat(true);
            }, 380);
          }, 1600);
        });
        optsEl.appendChild(b);
      });
      focusTitle();
    }

    function advance() {
      if (shown < lines.length) { showLine(shown); shown += 1; return; }
      showOptions();
    }

    nextBtn.addEventListener('click', advance);
    advance();

    sec.addEventListener('DOMNodeRemovedFromDocument', function () { if (blinkTimer) clearInterval(blinkTimer); });
    return sec;
  }

  function buildBeat(index) {
    clearTimer('chat');
    state.beatIndex = index;
    var beat = DATA.beats[index];
    if (!beat) return buildGameScene(DATA.sceneById.s1);
    if (beat.type === 'chat') {
      var chat = DATA.chats.filter(function (c) { return c.id === beat.id; })[0];
      return buildChatScene(chat);
    }
    if (beat.type === 'galgame') {
      var unit = DATA.galgameUnitFor ? DATA.galgameUnitFor(beat.group) : null;
      if (unit && window.FAREWELL_AFFINITY) window.FAREWELL_AFFINITY.noteVariant(unit.variant);
      return buildGalgameScene(unit);
    }
    if (beat.type === 'interlude') {
      var inter = DATA.interludes.filter(function (n) { return n.id === beat.id; })[0];
      return buildInterludeScene(inter);
    }
    return buildGameScene(resolveBeatScene(beat));
  }

  function choiceList(list) {
    return (list || []).map(function (c) {
      return typeof c === 'string' ? { fn: c, op: '+' } : (c || { fn: '', op: '+' });
    });
  }

  // 先把加项合成一组，再接乘子与除数，和引擎的合成方式一致。
  function groupTex(list) {
    var addTex = '';
    var mulTex = [];
    var divTex = [];
    choiceList(list).forEach(function (c) {
      var f = DATA.functions[c.fn];
      if (!f) return;
      if (c.op === '*') {
        mulTex.push('\\left(1+0.1\\,' + f.termTex + '\\right)');
      } else if (c.op === '/') {
        divTex.push('\\left(1+0.1\\left|' + f.termTex + '\\right|\\right)');
      } else if (!addTex) {
        addTex = (c.op === '-' ? '-' : '') + f.termTex;
      } else {
        addTex += (c.op === '-' ? ' - ' : ' + ') + f.termTex;
      }
    });
    var out = addTex || '1';
    if (mulTex.length) {
      out = (addTex ? '\\left(' + addTex + '\\right)' : '1') + ' \\times ' + mulTex.join(' \\times ');
    }
    if (divTex.length) out += ' \\div ' + divTex.join(' \\div ');
    return out;
  }

  function fullFormulaTex(list) {
    if (!list || !list.length) return 'F(x) = 0';
    return 'F(x) = ' + groupTex(list);
  }

  function fullFormulaResponsiveTex(list) {
    if (!(window.innerWidth <= 760)) return fullFormulaTex(list);
    var cl = choiceList(list);
    if (cl.length <= 6) return fullFormulaTex(list);
    var chunks = [];
    var cur = 'F(x) = {}';
    var count = 0;
    cl.forEach(function (c) {
      var f = DATA.functions[c.fn];
      if (!f) return;
      var piece;
      if (c.op === '*') piece = ' \\times \\left(1+0.1\\,' + f.termTex + '\\right)';
      else if (c.op === '/') piece = ' \\div \\left(1+0.1\\left|' + f.termTex + '\\right|\\right)';
      else piece = (count === 0 && !chunks.length ? '' : (c.op === '-' ? ' - ' : ' + ')) + f.termTex;
      cur += piece;
      count += 1;
      if (count >= 3) { chunks.push(cur); cur = '\\quad '; count = 0; }
    });
    if (count) chunks.push(cur);
    return '\\begin{aligned}' + chunks.join(' \\\\[0.35em] ') + '\\end{aligned}';
  }

  // 结局公式：这一局累积的函数之和，按出现次数合并，自动换行不截断
  function endingTex(list) {
    var counts = {}, order = [];
    (list || []).forEach(function (c) {
      var fn = c && c.fn;
      if (!fn || !DATA.functions[fn]) return;
      if (counts[fn] === undefined) { counts[fn] = 0; order.push(fn); }
      counts[fn] += 1;
    });
    if (!order.length) return 'F(x) = 0';
    var terms = order.map(function (fn) {
      var f = DATA.functions[fn];
      var k = counts[fn];
      return (k > 1 ? k + '\\cdot ' : '') + '\\left(' + f.termTex + '\\right)';
    });
    var per = window.innerWidth > 760 ? 3 : 1;
    var rows = [];
    var cur = 'F(x) = ';
    var used = 0;
    terms.forEach(function (t, i) {
      cur += (i === 0 ? '' : ' + ') + t;
      used += 1;
      if (used >= per && i < terms.length - 1) {
        rows.push(cur);
        cur = '\\quad ';
        used = 0;
      }
    });
    rows.push(cur);
    if (rows.length === 1) return rows[0];
    return '\\begin{aligned}' + rows.join(' \\\\[0.3em] ') + '\\end{aligned}';
  }

  function renderEndingFormulaInto(formulaEl, noteEl, list) {
    if (!formulaEl) return;
    formulaEl.innerHTML = '';
    var tex = window.katex && window.katex.render ? endingTex(list) : '';
    formulaEl.appendChild(texEl(tex, true));
    if (noteEl) {
      var no = 0;
      (list || []).forEach(function (c) { if (c && c.fn) no += 1; });
      noteEl.hidden = false;
      noteEl.textContent = '这一次一共做了 ' + no + ' 次选择，上面是它们累积出来的 F(x)。结局图形由这一局的走向决定，不由它直接画出。';
    }
  }

  function renderChoicesInto(listEl) {
    if (!listEl) return;
    listEl.innerHTML = '';
    state.selections.forEach(function (s, i) {
      var f = DATA.functions[s.fn];
      var li = document.createElement('li');
      li.className = 'choice-row';
      li.style.setProperty('--d', (0.05 + i * 0.06) + 's');

      var scene = document.createElement('span');
      scene.className = 'choice-scene';
      scene.textContent = s.scene;

      var label = document.createElement('span');
      label.className = 'choice-label';
      label.textContent = s.label;

      var fn = document.createElement('span');
      fn.className = 'choice-fn';
      fn.appendChild(texEl(f ? f.shortTex : '', false));

      li.appendChild(scene);
      li.appendChild(label);
      li.appendChild(fn);
      listEl.appendChild(li);
    });
  }

  function prepareEnding() {
    clearTimer('sceneNext');
    clearTimer('railStatus');
    clearTimer('endingType');
    clearTimer('principleType');
    clearTimer('principle');
    clearTimer('collapsePoll');
    var result = Engine.classify(state.funcs);
    var ending = DATA.endings[result.kind] || DATA.endings.log;
    state.result = result;
    state.ending = ending;
    state.plotSeenAt = 0;
    state.plotDrawnAt = 0;
    state.narrativeStartedAt = 0;
    state.principleShownAt = 0;
    state.collapseTriggered = true;
    state.cardReady = false;

    if (state.plot) {
      state.plot.destroy();
      state.plot = null;
    }
    if (state.plotObserver) {
      state.plotObserver.disconnect();
      state.plotObserver = null;
    }
    if (state.atmos) state.atmos.setEnding(true);
  }


  var NOVEL_STATE = { running: false, text: '' };

  function novelPayload() {
    var steps = (state.selections || []).map(function (s) {
      return { scene: s.scene, label: s.label, text: s.text, when: '' };
    });
    return {
      ending: state.ending ? { title: state.ending.title, text: state.ending.text } : null,
      steps: steps
    };
  }

  function novelCacheKey() {
    var ids = (state.selections || []).map(function (s) { return s.optionId || s.label; }).join('|');
    return 'farewell-novel:' + (state.ending ? state.ending.id || state.ending.title : 'x') + ':' + ids.length + ':' + ids;
  }

  var novelStartedAt = 0;
  function setNovelStatus(text) {
    var el = document.getElementById('novel-status');
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
  }

  function appendNovelText(text) {
    var out = document.getElementById('novel-out');
    if (!out) return;
    NOVEL_STATE.text += text;
    out.hidden = false;
    var p = out.lastElementChild;
    if (!p) { p = document.createElement('p'); out.appendChild(p); }
    p.textContent += text;
  }

  function startNovel(btn, out) {
    if (NOVEL_STATE.running) return;
    novelStartedAt = Date.now();
    var cacheKey = novelCacheKey();
    try {
      var cached = window.localStorage && localStorage.getItem(cacheKey);
      if (cached) {
        out.hidden = false;
        out.innerHTML = '';
        var cp = document.createElement('p');
        cp.textContent = cached;
        out.appendChild(cp);
        NOVEL_STATE.text = cached;
        btn.disabled = true;
        setNovelStatus('这一篇已经生成过，保存的就是它。');
        return;
      }
    } catch (err) { /* 忽略存储异常 */ }

    NOVEL_STATE.running = true;
    NOVEL_STATE.text = '';
    btn.disabled = true;
    out.hidden = false;
    out.innerHTML = '<p class="novel-hint">正在把这一局写下来……可以继续往下看别的，文字会长出来。</p>';
    setNovelStatus('生成中：0 字');

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12 * 60 * 1000);

    fetch('/api/novel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run: novelPayload() }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (resp) {
      if (!resp.ok || !resp.body || !resp.body.getReader) throw new Error('服务不可用');
      out.innerHTML = '';
      var reader = resp.body.getReader();
      var dec = new TextDecoder('utf-8');
      var buf = '';
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          buf += dec.decode(r.value, { stream: true });
          var idx;
          while ((idx = buf.indexOf('\n\n')) >= 0) {
            var block = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            block.split('\n').forEach(function (line) {
              if (line.indexOf('data:') !== 0) return;
              var payload = line.slice(5).trim();
              if (!payload) return;
              try {
                var ev = JSON.parse(payload);
                if (ev.type === 'thinking') {
                  setNovelStatus('正在动笔……（' + Math.round((Date.now() - novelStartedAt) / 1000) + ' 秒）');
                } else if (ev.type === 'delta' && ev.text) {
                  appendNovelText(ev.text);
                  setNovelStatus('生成中：' + ev.chars + ' 字');
                } else if (ev.type === 'done') {
                  setNovelStatus('正在写……已 ' + ev.chars + ' 字');
                } else if (ev.type === 'error') {
                  throw new Error(ev.message || '生成失败');
                }
              } catch (parseErr) { /* 忽略半包 */ }
            });
          }
          return pump();
        });
      }
      return pump();
    }).then(function () {
      NOVEL_STATE.running = false;
      btn.disabled = true;
      clearTimeout(timer);
      try { if (NOVEL_STATE.text) localStorage.setItem(cacheKey, NOVEL_STATE.text); } catch (err) { /* 忽略 */ }
    }).catch(function (err) {
      NOVEL_STATE.running = false;
      btn.disabled = false;
      clearTimeout(timer);
      var fallback = state.ending ? state.ending.text : '';
      if (!NOVEL_STATE.text && fallback) {
        out.innerHTML = '';
        var fp = document.createElement('p');
        fp.textContent = fallback;
        out.appendChild(fp);
      }
      setNovelStatus('这次没写成（' + (err && err.message ? err.message : '网络或服务异常') + '）。上面仍是这一局的结局正文，可以稍后再点一次。');
    });
  }

  function setupNovel(sec) {
    var btn = sec.querySelector('#novel-btn');
    var out = sec.querySelector('#novel-out');
    if (!btn || !out) return;
    NOVEL_STATE.running = false;
    NOVEL_STATE.text = '';
    btn.disabled = false;
    btn.addEventListener('click', function () { startNovel(btn, out); });
  }

  function setupEnding() {
    window.scrollTo(0, 0);
    focusTitle();
    if (els.endingScreen) {
      requestAnimationFrame(function () {
        if (els.endingScreen) els.endingScreen.classList.add('is-in');
      });
    }
    requestAnimationFrame(function () {
      if (!Plot || !els.plot) return;
      state.plot = Plot.mount(els.plot, state.result, {
        ids: state.funcs.slice(),
        onDrawComplete: handlePlotDrawn,
        onCollapseChange: handlePlotCollapse
      });
      watchPlot();
    });
  }

  function typeDelay(ch) {
    if ('。！？'.indexOf(ch) !== -1) return TYPE_LONG_PAUSE;
    if ('，、；：'.indexOf(ch) !== -1) return TYPE_SOFT_PAUSE;
    return TYPE_BASE_MS;
  }

  function typeCharacters(target, text, timerName, done) {
    clearTimer(timerName);
    if (!target) return;
    var chars = Array.from(String(text || ''));
    target.textContent = '';
    if (reduced || !chars.length) {
      target.textContent = String(text || '');
      if (done) done();
      return;
    }

    var index = 0;
    function step() {
      timers[timerName] = 0;
      if (!state.ending || !target.isConnected) return;
      target.textContent += chars[index];
      var ch = chars[index];
      index += 1;
      if (index >= chars.length) {
        if (done) done();
        return;
      }
      timers[timerName] = setTimeout(step, typeDelay(ch));
    }
    step();
  }

  function handlePlotDrawn() {
    if (!state.ending || state.plotDrawnAt || !els.endingScreen) return;
    state.plotDrawnAt = Date.now();
    els.endingScreen.classList.add('is-plot-drawn');
    startEndingNarrative();
  }

  function startEndingNarrative() {
    if (!state.ending || !els.endingType) return;
    state.narrativeStartedAt = Date.now();
    els.endingText.classList.add('is-typing');
    els.endingText.classList.remove('is-complete');
    if (els.endingCaret) els.endingCaret.classList.remove('is-hidden');

    typeCharacters(els.endingType, state.ending.text, 'endingType', function () {
      els.endingText.classList.add('is-complete');
      if (els.endingCaret) els.endingCaret.classList.add('is-hidden');
      clearTimer('principle');
      timers.principle = setTimeout(revealPrinciple, reduced ? 0 : 360);
    });
  }

  function watchPlot() {
    if (state.plotObserver) {
      state.plotObserver.disconnect();
      state.plotObserver = null;
    }
    if (!els.plot) return;
    if (window.IntersectionObserver) {
      state.plotObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; }) && !state.plotSeenAt) {
          state.plotSeenAt = Date.now();
          startCollapsePoll();
        }
      }, { threshold: 0.22 });
      state.plotObserver.observe(els.plot);
    } else {
      state.plotSeenAt = Date.now();
      startCollapsePoll();
    }
  }

  function revealPrinciple() {
    if (!state.ending || !els.principleSection) return;
    els.principleSection.classList.add('is-visible');
    els.principleSection.setAttribute('aria-hidden', 'false');
    if (els.principleCaret) els.principleCaret.classList.remove('is-hidden');

    typeCharacters(els.principleType, state.ending.principle, 'principleType', function () {
      if (els.principleCaret) els.principleCaret.classList.add('is-hidden');
      state.principleShownAt = Date.now();
      startCollapsePoll();
    });
  }

  function startCollapsePoll() {
    if (timers.collapsePoll) return;
    timers.collapsePoll = setInterval(checkCollapse, 450);
    checkCollapse();
  }

  function checkCollapse() {
    if (state.collapseTriggered || !state.ending) {
      clearTimer('collapsePoll');
      return;
    }
    if (!state.principleShownAt || !state.plotSeenAt) return;
    var now = Date.now();
    // 原理逐字显示完后至少留 2.8 秒给读者看一眼完整曲线，再收束成点。
    if (now - state.principleShownAt < (reduced ? 500 : 2800)) return;
    if (now - state.plotSeenAt < (reduced ? 800 : 2400)) return;
    clearTimer('collapsePoll');
    state.collapseTriggered = true;
    if (state.plot) {
      state.plot.collapse();
    } else {
      handlePlotCollapse(true);
    }
  }

  function handlePlotCollapse(collapsed) {
    if (!state.ending) return;
    if (collapsed) {
      if (els.plotWrap) els.plotWrap.classList.add('is-collapsed');
      if (els.plotCollapsedNote) els.plotCollapsedNote.hidden = false;
      if (els.plotExpand) els.plotExpand.hidden = false;
      clearTimer('cardReveal');
      timers.cardReveal = setTimeout(renderShareCard, reduced ? 80 : 520);
    } else {
      if (els.plotWrap) els.plotWrap.classList.remove('is-collapsed');
      if (els.plotCollapsedNote) els.plotCollapsedNote.hidden = true;
      if (els.plotExpand) els.plotExpand.hidden = true;
    }
  }

  function renderShareCard() {
    if (!state.ending || !state.result || state.cardReady || !Plot || !els.shareCard) return;
    var draw = function () {
      if (state.cardReady || !state.ending) return;
      Plot.renderCard(els.shareCard, {
        result: state.result,
        ending: state.ending,
        funcs: state.funcs.slice()
      });
      state.cardReady = true;
      if (els.cardSection) {
        els.cardSection.hidden = false;
        requestAnimationFrame(function () {
          if (els.cardSection) els.cardSection.classList.add('is-visible');
        });
      }
    };
    if (document.fonts && document.fonts.ready) {
      Promise.race([
        document.fonts.ready,
        new Promise(function (resolve) { setTimeout(resolve, 1400); })
      ]).then(draw).catch(draw);
    } else {
      draw();
    }
  }

  function downloadCard() {
    if (isLocked()) return;
    if (!state.cardReady) {
      renderShareCard();
      timers.download = setTimeout(downloadCard, 220);
      return;
    }
    var canvas = els.shareCard;
    if (!canvas || !canvas.width) return;
    var title = state.ending ? state.ending.title : '结局';
    var filename = ('函数告别式-' + title + '.png').replace(/[\\/:*?"<>|]/g, '-');
    var save = function (href) {
      var a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var url = URL.createObjectURL(blob);
        save(url);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      }, 'image/png');
    } else {
      try { save(canvas.toDataURL('image/png')); } catch (err) { /* ignore */ }
    }
  }

  /* ---------------- 重置 ---------------- */

  function initIntro() {
    state.introActive = true;
    stopCopyInk();
    state.phase = 'idle';
    state.opening = null;
    state.variant = null;
    state.sourceOpening = null;
    state.sourceVariant = null;
    state.source = [];
    state.target = [];
    state.targetHalf = 0;
    state.morphDone = false;
    measureIntro();
    intro.entryStart = performance.now();
    intro.offsetX = 0;
    intro.offsetY = 0;
    intro.breath = 1;
    intro.bulge = 0;
    intro.bulgeAngle = 0;
    intro.bx = 0;
    intro.by = 0;
    intro.bvx = 0;
    intro.bvy = 0;
    intro.smoothX = intro.W / 2;
    intro.smoothY = intro.H / 2;
    intro.touchAt = 0;
    intro.lastNow = 0;
    intro.pointerActive = false;
    if (els.seedBtn) els.seedBtn.setAttribute('aria-label', '轻触黑点，随机得到一种开始');
    lockAnim(ENTRY_DUR);
    startIntroLoop();
    startHint();
    startSignature();
    window.scrollTo(0, 0);
  }

  function restartAll() {
    if (isLocked()) return;
    clearAllTimers();
    if (state.plot) {
      state.plot.destroy();
      state.plot = null;
    }
    if (state.plotObserver) {
      state.plotObserver.disconnect();
      state.plotObserver = null;
    }
    if (state.atmos) {
      state.atmos.setEnding(false);
      state.atmos.reset();
    }

    state.funcs = [];
    state.selections = [];
    state.sceneIndex = 0;
    state.currentScene = null;
    state.nextSceneId = null;
    state.pendingBridge = '';
    state.visited = [];
    state.picked = [];
    state.flags = {};
    state.ending = null;
    state.result = null;
    state.cardReady = false;
    state.plotSeenAt = 0;
    state.plotDrawnAt = 0;
    state.narrativeStartedAt = 0;
    state.principleShownAt = 0;
    state.collapseTriggered = false;
    state.railCount = 0;
    state.isAnimating = false;
    state.isTransitioning = false;
    stopIntroLoop();
    state.introActive = false;

    transitionTo(buildIntroScene, { onAppend: initIntro });
  }

  /* ---------------- 绑定 ---------------- */

  function bind() {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      intro.pointerActive = true;
      intro.pointerX = e.clientX;
      intro.pointerY = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      intro.touchX = e.clientX;
      intro.touchY = e.clientY;
      intro.touchAt = performance.now();
      intro.smoothX = e.clientX;
      intro.smoothY = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      intro.pointerActive = false;
    });

    window.addEventListener('blur', function () {
      intro.pointerActive = false;
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (document.activeElement === els.seedBtn) {
        e.preventDefault();
        if (!isLocked() && (state.phase === 'idle' || state.phase === 'opened')) rollOpening();
      }
    });

    window.addEventListener('scroll', function () {
      if (els.endingScreen) {
        els.endingScreen.classList.toggle('is-scrolled', window.scrollY > 6);
      }
    }, { passive: true });

    window.addEventListener('resize', measureIntro);
  }

  function init() {
    els.scene = $('scene');
    if (window.FarewellAtmosphere) {
      state.atmos = window.FarewellAtmosphere.create($('bg-canvas'));
    }
    bind();
    transitionTo(buildIntroScene, { onAppend: initIntro });
  }

  function endingDebug() {
    var ending = state.ending;
    var narrativeLength = ending ? Array.from(ending.text).length : 0;
    var principleLength = ending ? Array.from(ending.principle).length : 0;
    var narrativeTyped = els.endingType ? Array.from(els.endingType.textContent).length : 0;
    var principleTyped = els.principleType ? Array.from(els.principleType.textContent).length : 0;
    return {
      plotDrawnAt: state.plotDrawnAt,
      narrativeStartedAt: state.narrativeStartedAt,
      principleShownAt: state.principleShownAt,
      plotDrawComplete: state.plot ? state.plot.debug().drawComplete : false,
      narrativeTyped: narrativeTyped,
      narrativeLength: narrativeLength,
      narrativeComplete: narrativeLength > 0 && narrativeTyped === narrativeLength,
      principleTyped: principleTyped,
      principleLength: principleLength,
      principleComplete: principleLength > 0 && principleTyped === principleLength,
      plotBeforeText: !!(els.plotWrap && els.endingText && (els.plotWrap.compareDocumentPosition(els.endingText) & Node.DOCUMENT_POSITION_FOLLOWING)),
      reduced: reduced
    };
  }

  function introDebug() {
    return {
      sampleCount: SAMPLES,
      lineWidth: 3,
      morphDur: MORPH_DUR,
      compressDur: COMPRESS_DUR,
      morphStage: state.morphStage,
      lineStartHalf: state.lineStartHalf,
      compressFinal: state.compressFinal,
      entryDur: ENTRY_DUR,
      radius: intro.R,
      phase: state.phase,
      active: state.introActive,
      offsetX: intro.offsetX,
      offsetY: intro.offsetY,
      breath: intro.breath,
      bulge: intro.bulge,
      bulgeMax: BULGE_MAX,
      baseRadius: intro.R,
      radii: idleRadii(1),
      coarse: coarse,
      reduced: reduced,
      targetHalf: state.targetHalf,
      sourceKind: state.sourceOpening ? 'curve' : 'circle',
      targetCount: state.target.length,
      sourceCount: state.source.length
    };
  }

  window.__farewell = {
    openGalgame: function (group) { var u = DATA.galgameUnitFor ? DATA.galgameUnitFor(group) : null; return buildGalgameScene(u); },
    state: state,
    DATA: DATA,
    Engine: Engine,
    rollOpening: rollOpening,
    startGame: startGame,
    restartAll: restartAll,
    buildTargetPoints: buildTargetPoints,
    introDebug: introDebug,
    hintDebug: hintDebug,
    signatureDebug: signatureDebug,
    copyInkDebug: copyInkDebug,
    beatDebug: function () {
      var b = DATA.beats[state.beatIndex];
      return {
        index: state.beatIndex,
        type: b ? b.type : '',
        id: b ? b.id : '',
        sceneIndex: state.sceneIndex,
        sceneId: state.currentScene ? state.currentScene.id : '',
        slot: state.currentScene ? state.currentScene.slot : 0,
        nextSceneId: state.nextSceneId,
        bridge: state.pendingBridge,
        visited: state.visited.slice(),
        picked: state.picked.slice(),
        flags: Object.keys(state.flags),
        funcs: state.funcs.length
      };
    },
    endingDebug: endingDebug,
    isLocked: isLocked
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
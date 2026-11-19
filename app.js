(function () {
  'use strict';

  /* ───────────────────────────── DOM ───────────────────────────── */

  const $ = (id) => document.getElementById(id);

  const els = {
    brand: $('brand'),
    home: $('home-screen'),
    lab: $('lab-screen'),
    start: $('start-button'),

    fnForm: $('fn-form'),
    fnInput: $('fn-input'),
    generate: $('generate-btn'),
    fnError: $('fn-error'),

    canvas: $('plot-canvas'),
    shell: $('canvas-shell'),
    empty: $('canvas-empty'),
    legend: $('canvas-legend'),
    caption: $('plot-caption'),
    scale: $('plot-scale'),
    hint: $('plot-hint'),
    coord: $('plot-coord'),
    light: $('status-light'),

    tabs: Array.from(document.querySelectorAll('.mode-tab')),
    panels: Array.from(document.querySelectorAll('.mode-panel')),

    limitA: $('limit-a'),
    limitAError: $('limit-a-error'),
    limitFx: $('limit-fx'),
    limitX: $('limit-x'),
    limitL: $('limit-L'),
    limitLeft: $('limit-left'),
    limitRight: $('limit-right'),
    limitGap: $('limit-gap'),
    limitAt: $('limit-at'),
    limitFormula: $('limit-formula'),

    derivSlope: $('deriv-slope'),
    derivX: $('deriv-x'),
    derivFx: $('deriv-fx'),
    derivTangent: $('deriv-tangent'),
    derivFormula: $('deriv-formula'),

    taylorMinus: $('taylor-minus'),
    taylorPlus: $('taylor-plus'),
    taylorBadge: $('taylor-badge'),
    taylorRange: $('taylor-range'),
    taylorFill: $('taylor-fill'),
    taylorError: $('taylor-error'),
    taylorPoly: $('taylor-poly'),
    taylorOriginal: $('taylor-original'),
    taylorSigned: $('taylor-signed'),
    taylorWarning: $('taylor-warning'),
    taylorFormula: $('taylor-formula'),

    intA: $('int-a'),
    intB: $('int-b'),
    intBoundsError: $('int-bounds-error'),
    intMinus: $('int-minus'),
    intPlus: $('int-plus'),
    intBadge: $('int-badge'),
    intRange: $('int-range'),
    intFill: $('int-fill'),
    intApprox: $('int-approx'),
    intDx: $('int-dx'),
    intNLive: $('int-n-live'),
    intExact: $('int-exact'),
    intError: $('int-error-val'),
    intFormula: $('int-formula')
  };

  const ctx = els.canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const COLORS = {
    ink: '#f1eee6',
    inkSoft: '#c9c5bc',
    muted: '#8f8c84',
    faint: '#615e58',
    blue: '#5c8cff',
    blueSoft: '#8fb0ff',
    accent: '#ff6a3d',
    accentDeep: '#ff9a7a',
    grid: 'rgba(255, 255, 255, .065)',
    gridStrong: 'rgba(255, 255, 255, .11)',
    axis: 'rgba(255, 255, 255, .26)',
    plot: '#0c0d0f',
    white: '#f2efe7'
  };

  /* ───────────────────────────── State ───────────────────────────── */

  const state = {
    generated: false,
    rawExpr: '',
    normalized: '',
    node: null,
    compiled: null,
    evalAt: null,
    mode: 'limit',
    lastProbeMode: 'limit',
    probeX: 0.8,
    dragging: false,
    view: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 },
    limit: { a: 0, result: null },
    taylor: { n: 3, series: null },
    integral: { a: 0, b: 1, n: 12, data: null },
    width: 0,
    height: 0,
    dpr: 1,
    renderRaf: 0,
    approachRaf: 0,
    approachToken: 0
  };

  const ALLOWED_FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'sqrt', 'cbrt', 'abs', 'exp', 'log', 'log10', 'log2',
    'floor', 'ceil', 'round', 'sign', 'min', 'max',
    'pow', 'nthRoot', 'hypot', 'atan2', 'mod', 'gcd', 'lcm'
  ]);

  const ALIASES = {
    ln: 'log',
    arcsin: 'asin',
    arccos: 'acos',
    arctan: 'atan',
    arsinh: 'asinh',
    arcosh: 'acosh',
    artanh: 'atanh'
  };

  const ALLOWED_SYMBOLS = new Set(['x', 'e', 'pi', 'tau', 'phi']);
  const SCALAR_SYMBOLS = new Set(['e', 'pi', 'tau', 'phi']);
  const ALLOWED_OPERATORS = new Set(['+', '-', '*', '/', '^']);
  const INVALID_MESSAGE = '换个写法试试';
  const DASH = '—';
  const MINUS = '−';

  /* ───────────────────────────── Utilities ───────────────────────────── */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function prettyMinus(value) {
    return String(value).replace(/-/g, MINUS);
  }

  function fmt(value, digits) {
    const sig = digits || 6;
    if (Number.isNaN(value)) return '无定义';
    if (!Number.isFinite(value)) return value > 0 ? '∞' : `${MINUS}∞`;
    if (Math.abs(value) < 1e-13) return '0';
    const abs = Math.abs(value);
    if (abs >= 1e7 || abs < 1e-5) {
      let text = value.toExponential(3);
      text = text.replace(/\.?0+e/, 'e').replace('e+', 'e');
      return prettyMinus(text);
    }
    return prettyMinus(String(Number(value.toPrecision(sig))));
  }

  function fmtInput(value) {
    if (!Number.isFinite(value)) return DASH;
    return prettyMinus(String(Number(value.toPrecision(7))));
  }

  function fmtAt(value) {
    if (Number.isNaN(value)) return '无定义';
    if (!Number.isFinite(value)) return value > 0 ? '∞' : `${MINUS}∞`;
    return fmt(value);
  }

  function finiteLabel(value) {
    if (Number.isNaN(value)) return '无定义';
    if (!Number.isFinite(value)) return value > 0 ? '∞' : `${MINUS}∞`;
    return fmt(value);
  }

  function toNumber(value) {
    if (typeof value === 'number') return value;
    if (value && typeof value.toNumber === 'function') {
      try {
        const number = value.toNumber();
        return typeof number === 'number' ? number : NaN;
      } catch (error) {
        return NaN;
      }
    }
    return NaN;
  }

  function quantile(sorted, q) {
    if (!sorted.length) return 0;
    const position = (sorted.length - 1) * q;
    const base = Math.floor(position);
    const rest = position - base;
    if (sorted[base + 1] === undefined) return sorted[base];
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }

  function niceStep(range, count) {
    const rough = range / Math.max(2, count);
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const fraction = rough / power;
    let multiplier = 1;
    if (fraction > 5) multiplier = 10;
    else if (fraction > 2) multiplier = 5;
    else if (fraction > 1) multiplier = 2;
    return multiplier * power;
  }

  function sampleViewValues(xMin, xMax, fn, count) {
    const values = [];
    const total = count || 520;
    for (let index = 0; index <= total; index += 1) {
      const x = xMin + ((xMax - xMin) * index) / total;
      const y = fn(x);
      if (Number.isFinite(y)) values.push(y);
    }
    return values;
  }

  /* ───────────────────────────── Input parsing ───────────────────────────── */

  function normalizeExpression(raw) {
    let source = String(raw || '').trim();
    source = source.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=/i, '');
    source = source
      .replace(/[\u2212\u2013\u2014\u2015]/g, '-')
      .replace(/[×·∙⋅]/g, '*')
      .replace(/÷/g, '/')
      .replace(/[＝]/g, '=')
      .replace(/[，]/g, ',')
      .replace(/[（【]/g, '(')
      .replace(/[）】]/g, ')')
      .replace(/[π]/g, 'pi')
      .replace(/[²]/g, '^2')
      .replace(/[³]/g, '^3')
      .replace(/[⁴]/g, '^4')
      .replace(/[⁵]/g, '^5')
      .replace(/[⁶]/g, '^6')
      .replace(/[⁻]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    source = source.replace(/\b(ln|arcsin|arccos|arctan|arsinh|arcosh|artanh)\b/g, (name) => ALIASES[name] || name);
    source = source.replace(
      /(^|[^A-Za-z_])(arcsinh|arccosh|arctanh|arcsin|arccos|arctan|arsinh|arcosh|artanh|asinh|acosh|atanh|asin|acos|atan|sinh|cosh|tanh|sin|cos|tan|sqrt|exp|ln|log)\s*x\b/gi,
      (match, lead, name) => {
        const key = name.toLowerCase();
        return `${lead}${ALIASES[key] || key}(x)`;
      }
    );
    return insertImplicitMultiplication(source);
  }

  function insertImplicitMultiplication(source) {
    const tokens = source.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+|\s+|./g);
    if (!tokens) return '';
    let result = '';

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      result += token;
      if (/^\s+$/.test(token)) continue;

      let nextIndex = index + 1;
      while (tokens[nextIndex] && /^\s+$/.test(tokens[nextIndex])) nextIndex += 1;
      const next = tokens[nextIndex];
      if (!next) continue;

      const tokenIsValue = /^[A-Za-z_][A-Za-z0-9_]*$/.test(token) ||
        /^\d/.test(token) || /^\.\d/.test(token) || token === ')';
      const nextIsValue = /^[A-Za-z_]/.test(next) || /^\d/.test(next) || /^\.\d/.test(next) || next === '(';
      if (!tokenIsValue || !nextIsValue) continue;

      const functionCall = next === '(' &&
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(token) &&
        ALLOWED_FUNCTIONS.has(token);
      if (!functionCall) result += '*';
    }

    return result;
  }

  function validateExpressionNode(node, options) {
    if (!node || typeof node !== 'object') throw new Error('invalid');
    const type = node.type;

    if (type === 'ConstantNode') {
      if (typeof node.value !== 'number' || !Number.isFinite(node.value)) throw new Error('invalid constant');
      return;
    }

    if (type === 'SymbolNode') {
      const allowed = options.allowX ? ALLOWED_SYMBOLS : SCALAR_SYMBOLS;
      if (!allowed.has(node.name)) throw new Error('unknown symbol');
      return;
    }

    if (type === 'ParenthesisNode') {
      validateExpressionNode(node.content, options);
      return;
    }

    if (type === 'OperatorNode') {
      if (!ALLOWED_OPERATORS.has(node.op)) throw new Error('unknown operator');
      const args = node.args || [];
      for (let index = 0; index < args.length; index += 1) {
        validateExpressionNode(args[index], options);
      }
      return;
    }

    if (type === 'FunctionNode') {
      const name = node.fn && node.fn.name;
      if (!name || !ALLOWED_FUNCTIONS.has(name)) throw new Error('unknown function');
      if (!window.math || typeof window.math[name] !== 'function') throw new Error('unknown function');
      const args = node.args || [];
      for (let index = 0; index < args.length; index += 1) {
        validateExpressionNode(args[index], options);
      }
      return;
    }

    throw new Error('unsupported expression');
  }

  function makeEvaluator(compiled) {
    return function evaluateAt(x) {
      try {
        return toNumber(compiled.evaluate({ x: x }));
      } catch (error) {
        return NaN;
      }
    };
  }

  function hasFiniteSample(evaluate) {
    const points = [];
    for (let index = 0; index <= 200; index += 1) points.push(-50 + index * 0.5);
    for (let index = 0; index <= 80; index += 1) points.push(-400 + index * 10);
    points.push(0, 1e-4, -1e-4, 1e-7, -1e-7, 1000, -1000);
    let count = 0;
    for (let index = 0; index < points.length; index += 1) {
      if (Number.isFinite(evaluate(points[index]))) {
        count += 1;
        if (count >= 3) return true;
      }
    }
    return false;
  }

  function buildFunction(raw) {
    if (!window.math) throw new Error('mathjs missing');
    const normalized = normalizeExpression(raw);
    if (!normalized || /[=;{}]/.test(normalized)) throw new Error('invalid');
    const node = window.math.parse(normalized);
    validateExpressionNode(node, { allowX: true });
    const compiled = node.compile();
    const evaluate = makeEvaluator(compiled);
    if (!hasFiniteSample(evaluate)) throw new Error('unplottable');
    return { normalized: normalized, node: node, compiled: compiled, evaluate: evaluate };
  }

  function parseScalar(raw) {
    if (!window.math) return null;
    const normalized = normalizeExpression(raw);
    if (!normalized || /[=;{}]/.test(normalized)) return null;
    try {
      const node = window.math.parse(normalized);
      validateExpressionNode(node, { allowX: false });
      const value = toNumber(node.compile().evaluate({}));
      if (!Number.isFinite(value) || Math.abs(value) > 1e7) return null;
      return value;
    } catch (error) {
      return null;
    }
  }

  /* ───────────────────────────── Display animation ───────────────────────────── */

  function cancelNumberAnimation(element) {
    if (element._numberRaf) {
      cancelAnimationFrame(element._numberRaf);
      element._numberRaf = 0;
    }
  }

  function swapText(element, text, isAlert) {
    cancelNumberAnimation(element);
    element._numberValue = null;
    element.classList.toggle('is-undefined', Boolean(isAlert));
    element.classList.toggle('is-empty', text === DASH);
    if (element.textContent === text) return;
    element.textContent = text;
    if (reduceMotion.matches) return;
    element.classList.remove('readout-swap');
    void element.offsetWidth;
    element.classList.add('readout-swap');
  }

  function setNumber(element, value, options) {
    const opts = options || {};
    const format = opts.format || fmt;
    const duration = opts.duration === undefined ? 280 : opts.duration;

    if (!Number.isFinite(value)) {
      swapText(element, finiteLabel(value), Number.isNaN(value));
      return;
    }

    cancelNumberAnimation(element);
    element.classList.remove('is-undefined', 'is-empty');

    if (reduceMotion.matches || duration <= 0) {
      element.textContent = format(value);
      element._numberValue = value;
      return;
    }

    const from = Number.isFinite(element._numberValue) ? element._numberValue : value;
    if (Math.abs(from - value) < 1e-13) {
      element.textContent = format(value);
      element._numberValue = value;
      return;
    }

    const started = performance.now();
    const step = (now) => {
      const progress = clamp((now - started) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (value - from) * eased;
      element.textContent = format(current);
      element._numberValue = current;
      if (progress < 1) {
        element._numberRaf = requestAnimationFrame(step);
      } else {
        element._numberRaf = 0;
        element._numberValue = value;
        element.textContent = format(value);
      }
    };
    element._numberRaf = requestAnimationFrame(step);
  }

  function setReadout(element, text, animate) {
    if (animate === false) {
      cancelNumberAnimation(element);
      element._numberValue = null;
      element.classList.toggle('is-empty', text === DASH);
      element.textContent = text;
      return;
    }
    swapText(element, text, false);
  }

  function setFormula(element, html) {
    if (element._formulaHtml === html) return;
    element._formulaHtml = html;
    element.innerHTML = html;
    if (reduceMotion.matches) return;
    element.classList.remove('is-swapping');
    void element.offsetWidth;
    element.classList.add('is-swapping');
  }

  function refreshPressGlow(element, event) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    element.style.setProperty('--gx', `${x}%`);
    element.style.setProperty('--gy', `${y}%`);
  }

  function bindGlassGlow() {
    const interactive = document.querySelectorAll('.glass-press, .fn-field, .mini-field, .mode-switch');
    interactive.forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        refreshPressGlow(element, event);
      });
      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--gx', '20%');
        element.style.setProperty('--gy', '0%');
      });
    });
  }

  /* ───────────────────────────── Canvas setup ───────────────────────────── */

  function resizeCanvas() {
    const rect = els.shell.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = dpr;
    els.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    els.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderPlot();
  }

  function scheduleRender() {
    if (state.renderRaf) return;
    state.renderRaf = requestAnimationFrame(() => {
      state.renderRaf = 0;
      renderPlot();
    });
  }

  function plotRect() {
    const small = state.width < 520;
    const left = small ? 38 : 52;
    const right = small ? 14 : 20;
    const top = 24;
    const bottom = small ? 30 : 36;
    return {
      x: left,
      y: top,
      w: Math.max(20, state.width - left - right),
      h: Math.max(20, state.height - top - bottom)
    };
  }

  function mapX(x, rect) {
    const view = state.view;
    return rect.x + ((x - view.xMin) / (view.xMax - view.xMin)) * rect.w;
  }

  function mapY(y, rect) {
    const view = state.view;
    return rect.y + ((view.yMax - y) / (view.yMax - view.yMin)) * rect.h;
  }

  function pixelToX(px, rect) {
    const view = state.view;
    return view.xMin + ((px - rect.x) / rect.w) * (view.xMax - view.xMin);
  }

  /* ───────────────────────────── View range ───────────────────────────── */

  function computeView() {
    if (!state.generated) {
      state.view = { xMin: -5, xMax: 5, yMin: -3.4, yMax: 3.4 };
      return;
    }

    let xMin = -5;
    let xMax = 5;

    if (state.mode === 'limit') {
      xMin = state.limit.a - 3;
      xMax = state.limit.a + 3;
    } else if (state.mode === 'taylor') {
      xMin = -4;
      xMax = 4;
    } else if (state.mode === 'integral') {
      const span = state.integral.b - state.integral.a;
      const margin = Math.max(0.35, span * 0.16);
      xMin = state.integral.a - margin;
      xMax = state.integral.b + margin;
    }

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax - xMin < 1e-9) {
      xMin = -5;
      xMax = 5;
    }

    const values = sampleViewValues(xMin, xMax, state.evalAt, 640);
    let yMin = -1;
    let yMax = 1;

    if (values.length) {
      values.sort((a, b) => a - b);
      let low = quantile(values, 0.02);
      let high = quantile(values, 0.98);
      if (!Number.isFinite(low) || !Number.isFinite(high)) {
        low = values[0];
        high = values[values.length - 1];
      }
      if (low > 0) low = 0;
      if (high < 0) high = 0;
      if (high - low < 1e-7) {
        const center = (high + low) / 2;
        low = center - 1;
        high = center + 1;
      }
      const pad = (high - low) * 0.16;
      yMin = low - pad;
      yMax = high + pad;
    }

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax - yMin < 1e-9) {
      yMin = -3.4;
      yMax = 3.4;
    }

    state.view = { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
  }

  function tickText(value, step) {
    if (Math.abs(value) < Math.abs(step) * 1e-7) return '0';
    const abs = Math.abs(value);
    if (abs >= 1e6 || abs < 1e-4) {
      return prettyMinus(value.toExponential(1).replace(/\.?0+e/, 'e').replace('e+', 'e'));
    }
    const decimals = clamp(-Math.floor(Math.log10(step)), 0, 4);
    let text = value.toFixed(decimals);
    if (text.indexOf('.') >= 0) text = text.replace(/\.?0+$/, '');
    return prettyMinus(text);
  }

  function drawGrid(rect) {
    const view = state.view;
    const small = state.width < 520;
    const xStep = niceStep(view.xMax - view.xMin, small ? 4 : 7);
    const yStep = niceStep(view.yMax - view.yMin, small ? 4 : 6);
    const axisY = view.yMin <= 0 && view.yMax >= 0 ? mapY(0, rect) : rect.y + rect.h;
    const axisX = view.xMin <= 0 && view.xMax >= 0 ? mapX(0, rect) : rect.x;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.grid;
    ctx.beginPath();

    let xCount = 0;
    let firstX = Math.ceil(view.xMin / xStep) * xStep;
    for (let value = firstX; value <= view.xMax + xStep * 1e-6 && xCount < 40; value += xStep) {
      const px = Math.round(mapX(value, rect)) + 0.5;
      ctx.moveTo(px, rect.y);
      ctx.lineTo(px, rect.y + rect.h);
      xCount += 1;
    }

    let yCount = 0;
    let firstY = Math.ceil(view.yMin / yStep) * yStep;
    for (let value = firstY; value <= view.yMax + yStep * 1e-6 && yCount < 40; value += yStep) {
      const py = Math.round(mapY(value, rect)) + 0.5;
      ctx.moveTo(rect.x, py);
      ctx.lineTo(rect.x + rect.w, py);
      yCount += 1;
    }

    ctx.stroke();

    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (view.yMin <= 0 && view.yMax >= 0) {
      const py = Math.round(mapY(0, rect)) + 0.5;
      ctx.moveTo(rect.x, py);
      ctx.lineTo(rect.x + rect.w, py);
    }
    if (view.xMin <= 0 && view.xMax >= 0) {
      const px = Math.round(mapX(0, rect)) + 0.5;
      ctx.moveTo(px, rect.y);
      ctx.lineTo(px, rect.y + rect.h);
    }
    ctx.stroke();

    ctx.fillStyle = COLORS.muted;
    ctx.font = `${small ? 7.5 : 8.5}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace'}`;
    ctx.textBaseline = 'middle';

    xCount = 0;
    for (let value = firstX; value <= view.xMax + xStep * 1e-6 && xCount < 40; value += xStep) {
      if (Math.abs(value) > xStep * 1e-6) {
        const px = mapX(value, rect);
        const labelY = clamp(axisY + 12, rect.y + 8, rect.y + rect.h - 6);
        ctx.textAlign = 'center';
        ctx.fillText(tickText(value, xStep), px, labelY);
      }
      xCount += 1;
    }

    ctx.textAlign = 'right';
    yCount = 0;
    for (let value = firstY; value <= view.yMax + yStep * 1e-6 && yCount < 40; value += yStep) {
      if (Math.abs(value) > yStep * 1e-6) {
        const py = mapY(value, rect);
        let labelX = rect.x + rect.w - 4;
        if (view.xMin <= 0 && view.xMax >= 0) {
          const zeroX = mapX(0, rect);
          labelX = zeroX > rect.x + 42 ? zeroX - 6 : zeroX + 6;
          ctx.textAlign = zeroX > rect.x + 42 ? 'right' : 'left';
        }
        ctx.fillText(tickText(value, yStep), labelX, py);
      }
      yCount += 1;
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.faint;
    ctx.font = `${small ? 7 : 8}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace'}`;
    ctx.fillText('x', rect.x + rect.w - 8, axisY - 11);
    ctx.fillText('y', axisX + 7, rect.y + 10);

    ctx.restore();
  }

  /* ───────────────────────────── Curves ───────────────────────────── */

  function buildSegments(fn, xMin, xMax, yMin, yMax, count) {
    const segments = [];
    let current = [];
    let previous = null;
    const total = count || 900;
    const ySpan = yMax - yMin;

    const flush = () => {
      if (current.length > 1) segments.push(current);
      current = [];
      previous = null;
    };

    for (let index = 0; index <= total; index += 1) {
      const x = xMin + ((xMax - xMin) * index) / total;
      const y = fn(x);

      if (!Number.isFinite(y) || Math.abs(y) > 1e12) {
        flush();
        continue;
      }

      if (previous) {
        const signJump = previous.y * y < 0 &&
          Math.min(Math.abs(previous.y), Math.abs(y)) > ySpan * 0.5;
        const jump = Math.abs(y - previous.y) > ySpan * 9;
        if (signJump || jump) flush();
      }

      current.push({ x: x, y: y });
      previous = { x: x, y: y };
    }

    flush();
    return segments;
  }

  function traceSegment(segment, rect) {
    const top = rect.y - 600;
    const bottom = rect.y + rect.h + 600;
    ctx.beginPath();
    for (let index = 0; index < segment.length; index += 1) {
      const point = segment[index];
      const px = mapX(point.x, rect);
      const py = clamp(mapY(point.y, rect), top, bottom);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function drawCurve(fn, rect, color, width, dashed) {
    if (!fn) return;
    const segments = buildSegments(
      fn,
      state.view.xMin,
      state.view.xMax,
      state.view.yMin,
      state.view.yMax,
      Math.max(420, Math.min(1100, Math.round(rect.w * 1.25)))
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (dashed) {
      ctx.setLineDash([7, 4]);
      ctx.lineDashOffset = 0;
    }
    for (let index = 0; index < segments.length; index += 1) {
      traceSegment(segments[index], rect);
    }
    ctx.restore();
  }

  function insidePlot(px, py, rect, margin) {
    const pad = margin === undefined ? 0 : margin;
    return px >= rect.x - pad && px <= rect.x + rect.w + pad &&
      py >= rect.y - pad && py <= rect.y + rect.h + pad;
  }

  function drawDot(px, py, options) {
    const opts = options || {};
    const radius = opts.radius || 6.5;
    const fill = opts.fill || COLORS.accent;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 106, 61, .45)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.white;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, radius + 4.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 106, 61, .26)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawHollowDot(px, py) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.plot;
    ctx.fill();
    ctx.setLineDash([2.5, 2.5]);
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  function drawTag(text, px, py, rect) {
    ctx.save();
    ctx.font = `9px ${getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace'}`;
    const width = ctx.measureText(text).width + 12;
    const height = 19;
    let left = px + 13;
    let top = py - height - 11;
    if (left + width > rect.x + rect.w - 4) left = px - width - 13;
    if (top < rect.y + 4) top = py + 12;
    left = clamp(left, rect.x + 4, rect.x + rect.w - width - 4);
    top = clamp(top, rect.y + 4, rect.y + rect.h - height - 4);

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(left, top, width, height, 5);
    else ctx.rect(left, top, width, height);
    ctx.fillStyle = 'rgba(15, 16, 19, .92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(122, 162, 255, .24)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = COLORS.inkSoft;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + 6, top + height / 2 + 0.4);
    ctx.restore();
  }

  function drawDashedVertical(px, rect, color, dash) {
    if (px < rect.x || px > rect.x + rect.w) return;
    ctx.save();
    ctx.setLineDash(dash || [4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, rect.y);
    ctx.lineTo(px, rect.y + rect.h);
    ctx.stroke();
    ctx.restore();
  }

  /* ───────────────────────────── Numerics ───────────────────────────── */

  function evaluateSide(a, direction) {
    const scale = Math.max(1, Math.abs(a) * 1e-4);
    const bases = [0.1, 0.03, 0.01, 0.003, 0.001, 3e-4, 1e-4, 3e-5, 1e-5];
    const values = [];

    for (let index = 0; index < bases.length; index += 1) {
      const h = bases[index] * scale;
      const y = state.evalAt(a + direction * h);
      values.push({ h: h, y: y, finite: Number.isFinite(y) });
    }

    const tail = values.slice(-5);
    const finiteTail = tail.filter((entry) => entry.finite);
    if (!finiteTail.length) return { type: 'none', side: direction < 0 ? 'left' : 'right' };

    const last = tail[tail.length - 1];
    const lastFinite = finiteTail[finiteTail.length - 1];

    if (!last.finite) {
      if (last.y === Infinity || last.y === -Infinity) {
        return { type: 'infinite', sign: last.y > 0 ? 1 : -1, side: direction < 0 ? 'left' : 'right' };
      }
      return { type: 'none', side: direction < 0 ? 'left' : 'right' };
    }

    if (finiteTail.length >= 4) {
      const recent = finiteTail.slice(-4);
      const d1 = recent[1].y - recent[0].y;
      const d2 = recent[2].y - recent[1].y;
      const d3 = recent[3].y - recent[2].y;
      const sameSign = d1 * d2 > 0 && d2 * d3 > 0;
      const growing = Math.abs(d3) > Math.abs(d2) * 1.12 && Math.abs(d2) > Math.abs(d1) * 1.12;
      const persistent = Math.abs(d3) > Math.abs(d1) * 0.88 &&
        Math.abs(d3) > Math.max(1, Math.abs(lastFinite.y)) * 0.045;
      if (sameSign && (growing || persistent)) {
        return { type: 'infinite', sign: lastFinite.y > 0 ? 1 : -1, side: direction < 0 ? 'left' : 'right' };
      }
      if (Math.abs(lastFinite.y) > 1e8) {
        return { type: 'infinite', sign: lastFinite.y > 0 ? 1 : -1, side: direction < 0 ? 'left' : 'right' };
      }
      const min = Math.min.apply(null, recent.map((entry) => entry.y));
      const max = Math.max.apply(null, recent.map((entry) => entry.y));
      const spread = max - min;
      if (spread > Math.max(1, Math.abs(lastFinite.y)) * 0.65) {
        return { type: 'none', side: direction < 0 ? 'left' : 'right' };
      }
    }

    return { type: 'finite', value: lastFinite.y, side: direction < 0 ? 'left' : 'right' };
  }

  function estimateLimit(a) {
    const left = evaluateSide(a, -1);
    const right = evaluateSide(a, 1);
    const atValue = state.evalAt(a);

    if (left.type === 'finite' && right.type === 'finite') {
      const scale = Math.max(1, Math.abs(left.value), Math.abs(right.value));
      const gap = Math.abs(left.value - right.value);
      const previousGap = Math.abs(state.evalAt(a - 1e-4) - state.evalAt(a + 1e-4));
      const converging = Number.isFinite(previousGap) && gap <= previousGap * 0.6 + 1e-10;
      if (gap <= 5e-4 * scale || converging) {
        return {
          type: 'finite',
          value: Number.isFinite(atValue) ? atValue : (left.value + right.value) / 2,
          side: 'both'
        };
      }
      return { type: 'none', side: 'both' };
    }

    if (left.type === 'infinite' && right.type === 'infinite') {
      if (left.sign === right.sign) return { type: 'infinite', sign: left.sign, side: 'both' };
      return { type: 'none', side: 'both' };
    }

    if (left.type === 'none' && right.type === 'finite') {
      return {
        type: 'finite',
        value: Number.isFinite(atValue) ? atValue : right.value,
        side: 'right'
      };
    }
    if (right.type === 'none' && left.type === 'finite') {
      return {
        type: 'finite',
        value: Number.isFinite(atValue) ? atValue : left.value,
        side: 'left'
      };
    }
    if (left.type === 'none' && right.type === 'infinite') {
      return { type: 'infinite', sign: right.sign, side: 'right' };
    }
    if (right.type === 'none' && left.type === 'infinite') {
      return { type: 'infinite', sign: left.sign, side: 'left' };
    }

    return { type: 'none', side: 'both' };
  }

  function limitLabel(result) {
    if (!result) return DASH;
    if (result.type === 'none') return '不存在';
    if (result.type === 'infinite') {
      const infinity = result.sign > 0 ? '∞' : `${MINUS}∞`;
      return result.side === 'both' ? infinity : `${infinity} · ${result.side === 'right' ? '右侧' : '左侧'}`;
    }
    if (result.type === 'finite') {
      return result.side === 'both' ? fmt(result.value) : `${fmt(result.value)} · ${result.side === 'right' ? '右侧' : '左侧'}`;
    }
    return DASH;
  }

  function derivativeAt(x) {
    if (!state.evalAt) return NaN;
    const center = state.evalAt(x);
    if (!Number.isFinite(center)) return NaN;
    const scale = Math.max(1, Math.abs(x));
    const h1 = 1e-4 * scale;
    const h2 = h1 / 2;
    const fPlus1 = state.evalAt(x + h1);
    const fMinus1 = state.evalAt(x - h1);
    const fPlus2 = state.evalAt(x + h2);
    const fMinus2 = state.evalAt(x - h2);
    if (!Number.isFinite(fPlus1) || !Number.isFinite(fMinus1) ||
        !Number.isFinite(fPlus2) || !Number.isFinite(fMinus2)) {
      return NaN;
    }
    const d1 = (fPlus1 - fMinus1) / (2 * h1);
    const d2 = (fPlus2 - fMinus2) / (2 * h2);
    const result = (4 * d2 - d1) / 3;
    return Number.isFinite(result) ? result : NaN;
  }

  function tangentEquation(x, y, slope) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(slope)) return DASH;
    const intercept = y - slope * x;
    if (Math.abs(slope) < 5e-10) return `y = ${fmt(intercept, 5)}`;
    let slopeText;
    if (Math.abs(slope - 1) < 5e-10) slopeText = 'x';
    else if (Math.abs(slope + 1) < 5e-10) slopeText = `${MINUS}x`;
    else slopeText = `${fmt(slope, 5)}x`;
    if (Math.abs(intercept) < 5e-10) return `y = ${slopeText}`;
    const join = intercept > 0 ? ' + ' : ` ${MINUS} `;
    return `y = ${slopeText}${join}${fmt(Math.abs(intercept), 5)}`;
  }

  function solveLinearSystem(matrix, target) {
    const size = target.length;
    const a = matrix.map((row, index) => row.concat([target[index]]));

    for (let col = 0; col < size; col += 1) {
      let pivot = col;
      for (let row = col + 1; row < size; row += 1) {
        if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
      }
      if (Math.abs(a[pivot][col]) < 1e-14) return null;
      if (pivot !== col) {
        const temp = a[pivot];
        a[pivot] = a[col];
        a[col] = temp;
      }
      const divisor = a[col][col];
      for (let j = col; j <= size; j += 1) a[col][j] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === col) continue;
        const factor = a[row][col];
        if (!factor) continue;
        for (let j = col; j <= size; j += 1) a[row][j] -= factor * a[col][j];
      }
    }

    return a.map((row) => row[size]);
  }

  function numericDerivative(fn, x0, order) {
    if (order === 0) return fn(x0);
    const radius = Math.max(2, Math.ceil((order + 1) / 2) + 1);
    const size = radius * 2 + 1;
    const h = 0.06 * Math.max(1, Math.abs(x0));
    const offsets = [];
    const values = [];
    for (let index = 0; index < size; index += 1) {
      const offset = index - radius;
      offsets.push(offset);
      const value = fn(x0 + offset * h);
      if (!Number.isFinite(value)) return NaN;
      values.push(value);
    }

    const matrix = [];
    let factorial = 1;
    for (let index = 2; index <= order; index += 1) factorial *= index;
    for (let power = 0; power < size; power += 1) {
      const row = [];
      for (let index = 0; index < size; index += 1) {
        row.push(Math.pow(offsets[index], power));
      }
      matrix.push(row);
    }
    const target = new Array(size).fill(0);
    target[order] = factorial;
    const weights = solveLinearSystem(matrix, target);
    if (!weights) return NaN;

    let sum = 0;
    for (let index = 0; index < size; index += 1) sum += weights[index] * values[index];
    const result = sum / Math.pow(h, order);
    return Number.isFinite(result) ? result : NaN;
  }

  const SUPERSCRIPT = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
  const SUBSCRIPT = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆' };

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    return x || 1;
  }

  function fractionApprox(value) {
    const abs = Math.abs(value);
    if (!Number.isFinite(abs) || abs === 0 || abs > 1e5) return null;
    for (let denominator = 2; denominator <= 720; denominator += 1) {
      const numerator = Math.round(abs * denominator);
      if (Math.abs(abs - numerator / denominator) < 1e-9 * Math.max(1, abs)) {
        const divisor = gcd(numerator, denominator);
        return { numerator: numerator / divisor, denominator: denominator / divisor };
      }
    }
    return null;
  }

  function termBody(coefficient, power, significant) {
    const abs = Math.abs(coefficient);
    if (abs < 1e-12) return '';
    const powerText = power === 0 ? '' : (power === 1 ? 'x' : `x${SUPERSCRIPT[power] || `^${power}`}`);
    const fraction = fractionApprox(abs);

    if (power === 0) {
      if (fraction) return fraction.denominator === 1 ? `${fraction.numerator}` : `${fraction.numerator}/${fraction.denominator}`;
      return fmt(abs, significant || 4);
    }

    if (fraction) {
      if (fraction.numerator === 1) {
        return fraction.denominator === 1 ? powerText : `${powerText}/${fraction.denominator}`;
      }
      return fraction.denominator === 1
        ? `${fraction.numerator}${powerText}`
        : `${fraction.numerator}${powerText}/${fraction.denominator}`;
    }

    const magnitude = fmt(abs, significant || 4);
    if (magnitude === '1' && power > 0) return powerText;
    return `${magnitude}${powerText}`;
  }

  function polynomialString(coefficients, n) {
    const terms = [];
    for (let power = 0; power <= n; power += 1) {
      const coefficient = coefficients[power];
      if (!Number.isFinite(coefficient)) return '';
      if (Math.abs(coefficient) < 1e-6) continue;
      const body = termBody(coefficient, power, 4);
      if (body) terms.push({ body: body, negative: coefficient < 0 });
    }

    if (!terms.length) return '0';
    let text = terms[0].negative ? `${MINUS}${terms[0].body}` : terms[0].body;
    for (let index = 1; index < terms.length; index += 1) {
      text += terms[index].negative ? ` ${MINUS} ${terms[index].body}` : ` + ${terms[index].body}`;
    }
    return text;
  }

  function makePolynomial(coefficients, n) {
    for (let index = 0; index <= n; index += 1) {
      if (!Number.isFinite(coefficients[index])) return null;
    }
    return function polynomial(x) {
      let result = 0;
      for (let power = n; power >= 0; power -= 1) result = result * x + coefficients[power];
      return result;
    };
  }

  function computeTaylorSeries(evaluate, maxOrder) {
    const coefficients = [];
    const polynomials = [];
    const strings = [];
    let factorial = 1;
    let extended = false;

    let centerValue = evaluate(0);
    if (!Number.isFinite(centerValue)) {
      const h0 = 0.01;
      const pair = (h) => {
        const left = evaluate(-h);
        const right = evaluate(h);
        if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
        return { left: left, right: right, mean: (left + right) / 2 };
      };
      const samples = [pair(h0), pair(h0 / 3), pair(h0 / 9)];
      const usable = samples.every(Boolean) &&
        Math.abs(samples[2].left - samples[2].right) <= 1e-4 * Math.max(1, Math.abs(samples[2].mean));
      if (usable) {
        centerValue = 0.0015625 * samples[0].mean - 0.140625 * samples[1].mean + 1.1390625 * samples[2].mean;
      } else {
        const limit = estimateLimit(0);
        if (limit.type === 'finite') centerValue = limit.value;
      }
      if (Number.isFinite(centerValue)) extended = true;
    }

    const sample = extended
      ? (x) => (x === 0 ? centerValue : evaluate(x))
      : evaluate;

    for (let order = 0; order <= maxOrder; order += 1) {
      let derivativeValue;
      if (order === 0) derivativeValue = centerValue;
      else derivativeValue = numericDerivative(sample, 0, order);
      coefficients.push(Number.isFinite(derivativeValue) ? derivativeValue / factorial : NaN);
      factorial *= (order + 1);
    }

    let maxValid = -1;
    for (let order = 0; order <= maxOrder; order += 1) {
      if (!Number.isFinite(coefficients[order])) break;
      maxValid = order;
      polynomials[order] = makePolynomial(coefficients, order);
      strings[order] = polynomialString(coefficients, order);
    }

    return {
      coefficients: coefficients,
      polys: polynomials,
      strings: strings,
      maxValid: maxValid,
      usedNumeric: false,
      extended: extended
    };
  }

  function gaussIntegral(fn, a, b) {
    if (!(b > a)) return NaN;
    const nodes = [-0.906179845938664, -0.5384693101056831, 0, 0.5384693101056831, 0.906179845938664];
    const weights = [0.2369268850561891, 0.4786286704993665, 0.5688888888888889, 0.4786286704993665, 0.2369268850561891];
    const panels = 512;
    const width = (b - a) / panels;
    let total = 0;

    for (let panel = 0; panel < panels; panel += 1) {
      const left = a + panel * width;
      const middle = left + width / 2;
      const half = width / 2;
      for (let index = 0; index < nodes.length; index += 1) {
        const value = fn(middle + half * nodes[index]);
        if (!Number.isFinite(value)) return NaN;
        total += weights[index] * value * half;
      }
    }
    return Number.isFinite(total) ? total : NaN;
  }

  function computeIntegral(a, b, n) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || !(b > a) || n < 1) return null;
    const dx = (b - a) / n;
    const rectangles = [];
    let sum = 0;
    let allFinite = true;

    for (let index = 0; index < n; index += 1) {
      const x0 = a + index * dx;
      const x1 = x0 + dx;
      const middle = (x0 + x1) / 2;
      const y = state.evalAt(middle);
      if (!Number.isFinite(y)) allFinite = false;
      else sum += y * dx;
      rectangles.push({ x0: x0, x1: x1, middle: middle, y: y });
    }

    const exact = gaussIntegral(state.evalAt, a, b);

    return {
      a: a,
      b: b,
      n: n,
      dx: dx,
      rectangles: rectangles,
      approx: allFinite ? sum : NaN,
      exact: exact,
      error: allFinite && Number.isFinite(exact) ? Math.abs(sum - exact) : NaN
    };
  }

  /* ───────────────────────────── Overlays ───────────────────────────── */

  function drawLimitOverlay(rect) {
    const a = state.limit.a;
    const result = state.limit.result || { type: 'none' };
    const ax = mapX(a, rect);

    drawDashedVertical(ax, rect, 'rgba(255, 106, 61, .42)', [4, 4]);
    if (insidePlot(ax, rect.y + rect.h, rect)) {
      ctx.save();
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.arc(ax, rect.y + rect.h - 3, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (result.type === 'finite') {
      const ly = mapY(result.value, rect);
      if (ly > rect.y && ly < rect.y + rect.h) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 106, 61, .34)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rect.x, ly);
        ctx.lineTo(rect.x + rect.w, ly);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.font = `8.5px ${getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace'}`;
        ctx.fillStyle = 'rgba(255, 154, 122, .82)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`L ${MINUS} ${fmt(result.value, 4)}`, rect.x + rect.w - 8, ly - 4);
        ctx.restore();
      }
    }

    const value = state.evalAt(state.probeX);
    const px = mapX(state.probeX, rect);
    const py = mapY(value, rect);

    if (Number.isFinite(value) && insidePlot(px, py, rect, 10)) {
      drawDot(px, py);
      drawTag(`x = ${fmt(state.probeX, 4)}`, px, py, rect);
    } else if (insidePlot(px, rect.y + rect.h / 2, rect)) {
      const axisPosition = state.view.yMin <= 0 && state.view.yMax >= 0
        ? mapY(0, rect)
        : clamp(py, rect.y + 12, rect.y + rect.h - 12);
      drawHollowDot(px, axisPosition);
      drawTag('无定义', px, axisPosition, rect);
    }

    if (a >= state.view.xMin && a <= state.view.xMax) {
      ctx.save();
      ctx.font = `8px ${getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace'}`;
      ctx.fillStyle = 'rgba(255, 154, 122, .74)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('a', ax, rect.y + 6);
      ctx.restore();
    }
  }

  function drawDerivativeOverlay(rect) {
    const x = state.probeX;
    const y = state.evalAt(x);
    const slope = derivativeAt(x);

    if (Number.isFinite(y) && Number.isFinite(slope)) {
      const startY = y + slope * (state.view.xMin - x);
      const endY = y + slope * (state.view.xMax - x);

      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 106, 61, .85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rect.x, clamp(mapY(startY, rect), rect.y - 900, rect.y + rect.h + 900));
      ctx.lineTo(rect.x + rect.w, clamp(mapY(endY, rect), rect.y - 900, rect.y + rect.h + 900));
      ctx.stroke();

      const px = mapX(x, rect);
      const py = mapY(y, rect);
      const runPixels = Math.min(42, rect.w * 0.1);
      const run = (runPixels / rect.w) * (state.view.xMax - state.view.xMin);
      const riseY = y + slope * run;
      const px2 = mapX(x + run, rect);
      const py2 = mapY(riseY, rect);
      if (Number.isFinite(py2)) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255, 106, 61, .5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px2, py);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      }
      ctx.restore();

      drawDot(px, py);
      drawTag(`x = ${fmt(x, 4)}`, px, py, rect);
    } else {
      const px = mapX(x, rect);
      const axisPosition = state.view.yMin <= 0 && state.view.yMax >= 0
        ? mapY(0, rect)
        : rect.y + rect.h / 2;
      if (insidePlot(px, axisPosition, rect, 10)) {
        drawHollowDot(px, axisPosition);
        drawTag('无定义', px, axisPosition, rect);
      }
    }
  }

  function drawTaylorOverlay(rect) {
    const series = state.taylor.series;
    if (!series || series.maxValid < 0) return;
    const n = state.taylor.n;
    if (series.maxValid < n) return;

    const original = state.evalAt(1);
    const polynomial = series.polys[n] ? series.polys[n](1) : NaN;
    if (!Number.isFinite(original) || !Number.isFinite(polynomial)) return;

    const px = mapX(1, rect);
    if (px < rect.x || px > rect.x + rect.w) return;

    const y1 = mapY(original, rect);
    const y2 = mapY(polynomial, rect);
    drawDashedVertical(px, rect, 'rgba(255, 106, 61, .2)', [2, 4]);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 106, 61, .9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, y1);
    ctx.lineTo(px, y2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 106, 61, .55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 4, y1);
    ctx.lineTo(px + 4, y1);
    ctx.moveTo(px - 4, y2);
    ctx.lineTo(px + 4, y2);
    ctx.stroke();
    ctx.restore();

    if (insidePlot(px, y1, rect, 8)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, y1, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.blue;
      ctx.fill();
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    if (insidePlot(px, y2, rect, 8)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, y2, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawIntegralOverlay(rect) {
    const data = state.integral.data;
    if (!data) return;
    const baseline = mapY(0, rect);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    for (let index = 0; index < data.rectangles.length; index += 1) {
      const item = data.rectangles[index];
      if (!Number.isFinite(item.y)) continue;
      const left = mapX(item.x0, rect);
      const right = mapX(item.x1, rect);
      const top = mapY(item.y, rect);
      const width = Math.max(0.6, right - left);
      const height = baseline - top;

      ctx.fillStyle = 'rgba(255, 106, 61, .14)';
      ctx.fillRect(left, Math.min(top, baseline), width, Math.abs(height));
      if (width > 1.6) {
        ctx.strokeStyle = 'rgba(255, 106, 61, .5)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(left + 0.4, Math.min(top, baseline) + 0.4, Math.max(0.2, width - 0.8), Math.abs(height));
        ctx.strokeStyle = 'rgba(255, 106, 61, .85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.stroke();
      }
    }
    ctx.restore();

    drawDashedVertical(mapX(state.integral.a, rect), rect, 'rgba(255, 106, 61, .3)', [3, 4]);
    drawDashedVertical(mapX(state.integral.b, rect), rect, 'rgba(255, 106, 61, .3)', [3, 4]);
  }

  /* ───────────────────────────── Render ───────────────────────────── */

  function drawLegendItem(text, kind) {
    let swatchClass = 'legend-swatch';
    if (kind === 'accent') swatchClass += ' is-accent';
    if (kind === 'dashed') swatchClass += ' is-accent is-dashed';
    return `<span class="legend-item"><span class="${swatchClass}"></span>${escapeHtml(text)}</span>`;
  }

  function updateLegend() {
    if (!state.generated) {
      els.legend.innerHTML = '';
      return;
    }
    const items = [];
    items.push(drawLegendItem('f(x)', 'blue'));
    if (state.mode === 'limit') {
      items.push(drawLegendItem('探针', 'accent'));
      items.push(drawLegendItem('a 与极限', 'dashed'));
    } else if (state.mode === 'derivative') {
      items.push(drawLegendItem('切线', 'accent'));
    } else if (state.mode === 'taylor') {
      items.push(drawLegendItem(`P${SUBSCRIPT[state.taylor.n] || ''}(x)`, 'dashed'));
    } else if (state.mode === 'integral') {
      items.push(drawLegendItem('中点矩形', 'accent'));
    }
    els.legend.innerHTML = items.join('');
  }

  function renderPlot() {
    if (!state.width || !state.height) return;
    const rect = plotRect();
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = COLORS.plot;
    ctx.fillRect(0, 0, state.width, state.height);
    drawGrid(rect);

    if (!state.generated || !state.evalAt) return;

    if (state.mode === 'integral') drawIntegralOverlay(rect);

    if (state.mode === 'taylor') {
      const series = state.taylor.series;
      const n = state.taylor.n;
      if (series && series.maxValid >= n && series.polys[n]) {
        drawCurve(series.polys[n], rect, COLORS.accent, 1.9, true);
      }
    }

    drawCurve(state.evalAt, rect, COLORS.blue, 2.1, false);

    if (state.mode === 'limit') drawLimitOverlay(rect);
    else if (state.mode === 'derivative') drawDerivativeOverlay(rect);
    else if (state.mode === 'taylor') drawTaylorOverlay(rect);
  }

  /* ───────────────────────────── Formulas ───────────────────────────── */

  function limitFormulaHtml() {
    const result = state.generated ? state.limit.result : null;
    const value = result ? limitLabel(result) : DASH;
    return `<div class="formula-main"><span class="lim"><span class="lim-word">lim</span><span class="lim-under">x → ${escapeHtml(fmt(state.limit.a, 4))}</span></span><span>f(x) =</span><strong>${escapeHtml(value)}</strong></div><p class="formula-note">左右两侧靠近同一个数，双侧极限才存在。</p>`;
  }

  function derivativeFormulaHtml() {
    return `<div class="formula-main"><span>f′(x) =</span><span class="lim"><span class="lim-word">lim</span><span class="lim-under">h → 0</span></span><span class="frac"><span>f(x + h) ${MINUS} f(x)</span><span>h</span></span></div><p class="formula-note">差商在 h → 0 时的极限，就是切线的瞬时斜率。</p>`;
  }

  function taylorFormulaHtml() {
    const n = state.taylor.n;
    const series = state.generated ? state.taylor.series : null;
    const available = series && series.maxValid >= n;
    let note = '';
    if (!state.generated) {
      note = '<p class="formula-note">生成图像后，中心固定在 x = 0。</p>';
    } else if (!available) {
      note = '<p class="formula-note">该函数在 x = 0 处无法展开到这一阶。</p>';
    } else {
      note = `<p class="formula-poly">P${SUBSCRIPT[n]}(x) = ${escapeHtml(series.strings[n])}</p>`;
    }
    return `<div class="formula-main"><span>P${SUBSCRIPT[n]}(x) =</span><span>Σ</span><span class="frac"><span>f⁽ᵏ⁾(0)</span><span>k!</span></span><span>xᵏ</span><span class="muted">，k = 0 … ${n}</span></div>${note}`;
  }

  function integralFormulaHtml() {
    const a = state.integral.a;
    const b = state.integral.b;
    const n = state.integral.n;
    const dx = b > a ? (b - a) / n : NaN;
    return `<div class="formula-main"><span>∫<sub>a</sub><sup>b</sup> f(x) dx ≈</span><span>Σ</span><span>f(xᵢ*) Δx</span></div><p class="formula-note">Δx = (${escapeHtml(fmt(a, 4))} → ${escapeHtml(fmt(b, 4))}) / ${n} = ${escapeHtml(Number.isFinite(dx) ? fmt(dx) : DASH)}，取每个小区间的中点。</p>`;
  }

  function updateFormulas() {
    setFormula(els.limitFormula, limitFormulaHtml());
    setFormula(els.derivFormula, derivativeFormulaHtml());
    setFormula(els.taylorFormula, taylorFormulaHtml());
    setFormula(els.intFormula, integralFormulaHtml());
  }

  /* ───────────────────────────── Readouts ───────────────────────────── */

  function readoutDuration() {
    return state.dragging || state.approaching ? 70 : 320;
  }

  function updateLimitReadout() {
    const duration = readoutDuration();
    if (!state.generated) {
      setReadout(els.limitFx, DASH, false);
      setReadout(els.limitX, DASH, false);
      setReadout(els.limitL, DASH, false);
      setReadout(els.limitGap, DASH, false);
      setReadout(els.limitAt, DASH, false);
      return;
    }

    const x = state.probeX;
    const value = state.evalAt(x);
    const result = state.limit.result;
    const atValue = state.evalAt(state.limit.a);

    setNumber(els.limitX, x, { format: (number) => fmt(number, 4), duration: duration });

    if (Number.isFinite(value)) {
      setNumber(els.limitFx, value, { duration: duration });
    } else {
      swapText(els.limitFx, '无定义', true);
    }

    if (result && result.type === 'finite' && result.side === 'both') {
      setNumber(els.limitL, result.value, { duration: duration });
    } else {
      swapText(els.limitL, result ? limitLabel(result) : DASH, false);
    }

    if (Number.isFinite(value) && result && result.type === 'finite') {
      setNumber(els.limitGap, Math.abs(value - result.value), { duration: duration });
    } else {
      setReadout(els.limitGap, DASH, false);
    }

    if (Number.isFinite(atValue)) {
      setNumber(els.limitAt, atValue, { duration: duration });
    } else {
      swapText(els.limitAt, '无定义', false);
    }
  }

  function updateDerivativeReadout() {
    const duration = readoutDuration();
    if (!state.generated) {
      setReadout(els.derivSlope, DASH, false);
      setReadout(els.derivX, DASH, false);
      setReadout(els.derivFx, DASH, false);
      setReadout(els.derivTangent, DASH, false);
      return;
    }

    const x = state.probeX;
    const value = state.evalAt(x);
    const slope = derivativeAt(x);

    setNumber(els.derivX, x, { format: (number) => fmt(number, 4), duration: duration });

    if (Number.isFinite(value)) setNumber(els.derivFx, value, { duration: duration });
    else swapText(els.derivFx, '无定义', false);

    if (Number.isFinite(slope)) {
      setNumber(els.derivSlope, slope, { duration: duration });
      setReadout(els.derivTangent, tangentEquation(x, value, slope), true);
    } else {
      swapText(els.derivSlope, '无定义', true);
      setReadout(els.derivTangent, DASH, false);
    }
  }

  function updateTaylorReadout() {
    const duration = readoutDuration();
    const n = state.taylor.n;
    const series = state.generated ? state.taylor.series : null;
    const available = Boolean(series && series.maxValid >= n);
    const original = state.generated ? state.evalAt(1) : NaN;
    const polynomial = available ? series.polys[n](1) : NaN;

    setNumber(els.taylorBadge, n, { format: (number) => String(Math.round(number)), duration: 220 });
    syncSliderFill(els.taylorFill, n, 0, 6);

    if (Number.isFinite(original)) {
      setNumber(els.taylorOriginal, original, { duration: duration });
    } else {
      swapText(els.taylorOriginal, state.generated ? '无定义' : DASH, false);
    }

    if (Number.isFinite(polynomial)) {
      setNumber(els.taylorPoly, polynomial, { duration: duration });
    } else {
      setReadout(els.taylorPoly, DASH, false);
    }

    if (Number.isFinite(original) && Number.isFinite(polynomial)) {
      const difference = polynomial - original;
      const stable = Math.abs(difference) < 1e-8 * Math.max(1, Math.abs(original)) ? 0 : difference;
      setNumber(els.taylorError, Math.abs(stable), { duration: duration });
      setNumber(els.taylorSigned, stable, { duration: duration });
    } else {
      setReadout(els.taylorError, state.generated ? '无定义' : DASH, false);
      setReadout(els.taylorSigned, DASH, false);
    }

    let warning = '';
    if (state.generated) {
      if (!series || series.maxValid < n) {
        warning = '这个函数在 x = 0 处不够光滑或没有定义，无法构造到当前阶数，请降低 n 或换一个函数。';
      } else if (series.extended) {
        warning = 'f 在 x = 0 处无定义，展开使用其连续延拓（极限值）作为常数项。';
      } else if (series.usedNumeric) {
        warning = '部分高阶系数由数值差分近似得到，结果仅供参考。';
      }
    }
    els.taylorWarning.hidden = !warning;
    els.taylorWarning.textContent = warning;
  }

  function updateIntegralReadout() {
    const duration = readoutDuration();
    const data = state.integral.data;
    const n = state.integral.n;

    setNumber(els.intBadge, n, { format: (number) => String(Math.round(number)), duration: 220 });
    setNumber(els.intNLive, n, { format: (number) => String(Math.round(number)), duration: duration });
    syncSliderFill(els.intFill, n, 1, 50);

    if (!state.generated || !data) {
      setReadout(els.intApprox, DASH, false);
      setReadout(els.intDx, DASH, false);
      setReadout(els.intExact, DASH, false);
      setReadout(els.intError, DASH, false);
      return;
    }

    if (Number.isFinite(data.approx)) {
      setNumber(els.intApprox, data.approx, { duration: duration });
    } else {
      swapText(els.intApprox, '无法计算', true);
    }

    setNumber(els.intDx, data.dx, { duration: duration });

    if (Number.isFinite(data.exact)) {
      setNumber(els.intExact, data.exact, { duration: duration });
    } else {
      swapText(els.intExact, '无法计算', false);
    }

    if (Number.isFinite(data.error)) {
      setNumber(els.intError, data.error, { duration: duration });
    } else {
      setReadout(els.intError, DASH, false);
    }
  }

  function updateActiveReadout() {
    if (state.mode === 'limit') updateLimitReadout();
    else if (state.mode === 'derivative') updateDerivativeReadout();
    else if (state.mode === 'taylor') updateTaylorReadout();
    else if (state.mode === 'integral') updateIntegralReadout();
  }

  function syncSliderFill(element, value, min, max) {
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    element.style.width = `${clamp(percent, 0, 100)}%`;
  }

  function syncControls() {
    els.taylorRange.value = String(state.taylor.n);
    els.intRange.value = String(state.integral.n);
    syncSliderFill(els.taylorFill, state.taylor.n, 0, 6);
    syncSliderFill(els.intFill, state.integral.n, 1, 50);
    if (!els.taylorBadge._numberRaf) els.taylorBadge.textContent = String(state.taylor.n);
    if (!els.intBadge._numberRaf) els.intBadge.textContent = String(state.integral.n);
  }

  /* ───────────────────────────── Plot chrome ───────────────────────────── */

  function updatePlotChrome() {
    if (state.generated) {
      els.caption.textContent = `f(x) = ${state.rawExpr}`;
      els.light.classList.add('is-live');
      els.empty.classList.add('is-hidden');
    } else {
      els.caption.textContent = '等待输入函数';
      els.light.classList.remove('is-live');
      els.empty.classList.remove('is-hidden');
    }

    const view = state.view;
    els.scale.textContent = `x ∈ [${fmt(view.xMin, 4)}, ${fmt(view.xMax, 4)}]`;

    if (!state.generated) {
      els.hint.textContent = '输入表达式，停顿后自动绘制';
    } else if (state.mode === 'limit') {
      els.hint.textContent = '拖动橙红色探针，或让它从某一侧逼近 a';
    } else if (state.mode === 'derivative') {
      els.hint.textContent = '拖动切点，观察切线如何跟随曲线';
    } else if (state.mode === 'taylor') {
      els.hint.textContent = '调整阶数，比较橙色多项式与蓝色原函数';
    } else {
      els.hint.textContent = '橙色矩形为中点采样，增加个数观察面积收敛';
    }

    const draggable = state.generated && (state.mode === 'limit' || state.mode === 'derivative');
    els.shell.classList.toggle('is-draggable', draggable);
    els.coord.textContent = `CANVAS / 2D · ${state.mode.toUpperCase()}`;
    els.canvas.setAttribute(
      'aria-label',
      draggable
        ? '函数图像。可拖动橙红色探针，或使用左右方向键移动。'
        : '函数图像。'
    );
  }

  function refreshCaches() {
    if (!state.generated) return;
    state.limit.result = estimateLimit(state.limit.a);
    if (!state.taylor.series) {
      state.taylor.series = computeTaylorSeries(state.evalAt, 6);
    }
    state.integral.data = computeIntegral(state.integral.a, state.integral.b, state.integral.n);
  }

  function refreshInterface() {
    syncControls();
    updateFormulas();
    updateActiveReadout();
    updateLegend();
    updatePlotChrome();
    scheduleRender();
  }

  function setTabState(mode) {
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    els.panels.forEach((panel) => {
      const active = panel.dataset.panel === mode;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  function setMode(mode) {
    if (!['limit', 'derivative', 'taylor', 'integral'].includes(mode) || mode === state.mode) return;
    cancelApproach();
    const previous = state.mode;
    state.mode = mode;
    state.lastProbeMode = previous;

    if (state.generated) {
      if (mode === 'limit') {
        state.probeX = state.limit.a + 0.9;
      } else if (mode === 'derivative') {
        if (Math.abs(state.probeX) > 4.6) state.probeX = 1;
      }
    }

    setTabState(mode);
    computeView();
    refreshCaches();
    refreshInterface();
  }

  /* ───────────────────────────── Function generation ───────────────────────────── */

  function showFunctionError(message) {
    els.fnError.textContent = message;
    els.fnError.classList.add('is-visible');
    els.fnInput.setAttribute('aria-invalid', 'true');
    els.fnForm.classList.remove('is-invalid');
    void els.fnForm.offsetWidth;
    els.fnForm.classList.add('is-invalid');
  }

  function clearFunctionError() {
    els.fnError.textContent = '';
    els.fnError.classList.remove('is-visible');
    els.fnInput.removeAttribute('aria-invalid');
    els.fnForm.classList.remove('is-invalid');
  }

  function pickFiniteProbe() {
    const candidates = [1, 0.8, 0.5, 1.5, 2, 0, -1, -2, 3, -3];
    for (let index = 0; index < candidates.length; index += 1) {
      if (Number.isFinite(state.evalAt(candidates[index]))) return candidates[index];
    }
    return 0;
  }

  function readTargetsFromFields() {
    const target = parseScalar(els.limitA.value);
    if (target !== null) state.limit.a = target;

    const boundA = parseScalar(els.intA.value);
    const boundB = parseScalar(els.intB.value);
    if (boundA !== null && boundB !== null && boundB > boundA && boundB - boundA <= 1e7) {
      state.integral.a = boundA;
      state.integral.b = boundB;
    }
  }

  function generateFromInput(options) {
    const opts = options || {};
    const silent = Boolean(opts.silent);
    const keepFocus = Boolean(opts.keepFocus);
    const raw = els.fnInput.value.trim();
    if (!raw) {
      if (!silent) showFunctionError('先输入一个函数，比如 sin(x)/x');
      return false;
    }
    if (!window.math) {
      if (!silent) showFunctionError('math.js 未加载，请检查网络后刷新');
      return false;
    }

    let built;
    try {
      built = buildFunction(raw);
    } catch (error) {
      if (!silent) showFunctionError(INVALID_MESSAGE);
      return false;
    }

    if (state.generated && built.normalized === state.normalized) {
      state.rawExpr = raw.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=/i, '').trim() || raw;
      clearFunctionError();
      updatePlotChrome();
      return true;
    }

    cancelApproach();
    clearFunctionError();
    state.generated = true;
    state.rawExpr = raw.replace(/^\s*(?:f\s*\(\s*x\s*\)|y)\s*=/i, '').trim() || raw;
    state.normalized = built.normalized;
    state.node = built.node;
    state.compiled = built.compiled;
    state.evalAt = built.evaluate;

    readTargetsFromFields();

    state.limit.result = null;
    state.taylor.series = null;
    state.integral.data = null;

    if (state.mode === 'limit') state.probeX = state.limit.a + 0.9;
    else state.probeX = pickFiniteProbe();

    setTabState(state.mode);
    computeView();
    refreshCaches();
    refreshInterface();
    updateApproachButtons();
    updateFormulaTargetErrors();
    if (!keepFocus) els.fnInput.blur();
    return true;
  }

  function updateFormulaTargetErrors() {
    const target = parseScalar(els.limitA.value);
    els.limitAError.textContent = target === null ? 'a 需要一个实数' : '';
    const boundA = parseScalar(els.intA.value);
    const boundB = parseScalar(els.intB.value);
    if (boundA === null || boundB === null) {
      els.intBoundsError.textContent = 'a 和 b 都需要是实数';
    } else if (boundB <= boundA) {
      els.intBoundsError.textContent = '请让 a < b';
    } else {
      els.intBoundsError.textContent = '';
    }
  }

  /* ───────────────────────────── Target inputs ───────────────────────────── */

  let limitInputTimer = 0;
  let integralInputTimer = 0;

  function applyLimitTarget(showErrors) {
    const value = parseScalar(els.limitA.value);
    if (value === null) {
      if (showErrors) els.limitAError.textContent = 'a 需要一个实数';
      return false;
    }

    els.limitAError.textContent = '';
    if (value === state.limit.a && state.generated) return true;
    state.limit.a = value;

    if (state.generated) {
      state.limit.result = estimateLimit(value);
      if (state.mode === 'limit') {
        state.probeX = value + 0.9;
        computeView();
        refreshCaches();
        refreshInterface();
      } else {
        updateFormulas();
      }
    } else {
      updateFormulas();
    }
    return true;
  }

  function applyIntegralBounds(showErrors) {
    const a = parseScalar(els.intA.value);
    const b = parseScalar(els.intB.value);

    if (a === null || b === null) {
      if (showErrors) els.intBoundsError.textContent = 'a 和 b 都需要是实数';
      return false;
    }
    if (b <= a) {
      if (showErrors) els.intBoundsError.textContent = '请让 a < b';
      return false;
    }
    if (b - a > 1e7) {
      if (showErrors) els.intBoundsError.textContent = '区间太大，请缩小范围';
      return false;
    }

    els.intBoundsError.textContent = '';
    state.integral.a = a;
    state.integral.b = b;
    state.integral.data = state.generated
      ? computeIntegral(state.integral.a, state.integral.b, state.integral.n)
      : null;

    if (state.generated && state.mode === 'integral') {
      computeView();
      refreshInterface();
    } else {
      updateFormulas();
    }
    return true;
  }

  function scheduleLimitApply() {
    clearTimeout(limitInputTimer);
    limitInputTimer = window.setTimeout(() => applyLimitTarget(false), 420);
  }

  function scheduleIntegralApply() {
    clearTimeout(integralInputTimer);
    integralInputTimer = window.setTimeout(() => applyIntegralBounds(false), 420);
  }

  /* ───────────────────────────── Slider controls ───────────────────────────── */

  function setTaylorOrder(next) {
    const n = clamp(Math.round(next), 0, 6);
    state.taylor.n = n;
    els.taylorRange.value = String(n);
    syncSliderFill(els.taylorFill, n, 0, 6);
    updateTaylorReadout();
    updateFormulas();
    updateLegend();
    scheduleRender();
  }

  function setIntegralCount(next) {
    const n = clamp(Math.round(next), 1, 50);
    state.integral.n = n;
    els.intRange.value = String(n);
    syncSliderFill(els.intFill, n, 1, 50);

    if (state.generated) {
      state.integral.data = computeIntegral(state.integral.a, state.integral.b, n);
    }

    updateIntegralReadout();
    updateFormulas();
    updateLegend();
    scheduleRender();
  }

  /* ───────────────────────────── Probe / touch ───────────────────────────── */

  function setProbeFromClientX(clientX) {
    const bounds = els.canvas.getBoundingClientRect();
    const rect = plotRect();
    const localX = clientX - bounds.left;
    const span = state.view.xMax - state.view.xMin;
    let x = pixelToX(localX, rect);
    x = clamp(x, state.view.xMin + span * 0.012, state.view.xMax - span * 0.012);

    if (state.mode === 'limit') {
      if (Math.abs(x - state.limit.a) <= span * 0.0075) x = state.limit.a;
    } else if (state.mode === 'derivative') {
      x = clamp(x, -4.94, 4.94);
    }

    state.probeX = x;
    updateActiveReadout();
    scheduleRender();
  }

  function endDrag(event) {
    if (!state.dragging) return;
    if (event && state.activePointer !== undefined && event.pointerId !== state.activePointer) return;
    state.dragging = false;
    state.activePointer = undefined;
    els.canvas.classList.remove('is-dragging');
    if (event && typeof els.canvas.releasePointerCapture === 'function') {
      try {
        if (els.canvas.hasPointerCapture(event.pointerId)) els.canvas.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* pointer capture may already be released */
      }
    }
    updateActiveReadout();
    scheduleRender();
  }

  function bindProbeInteraction() {
    els.canvas.addEventListener('pointerdown', (event) => {
      if (!state.generated || (state.mode !== 'limit' && state.mode !== 'derivative')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      cancelApproach();
      state.dragging = true;
      state.activePointer = event.pointerId;
      els.canvas.classList.add('is-dragging');
      if (typeof els.canvas.setPointerCapture === 'function') {
        try {
          els.canvas.setPointerCapture(event.pointerId);
        } catch (error) {
          /* capture is a progressive enhancement */
        }
      }
      els.canvas.focus({ preventScroll: true });
      setProbeFromClientX(event.clientX);
    });

    els.canvas.addEventListener('pointermove', (event) => {
      if (!state.dragging || event.pointerId !== state.activePointer) return;
      event.preventDefault();
      setProbeFromClientX(event.clientX);
    });

    els.canvas.addEventListener('pointerup', endDrag);
    els.canvas.addEventListener('pointercancel', endDrag);
    els.canvas.addEventListener('lostpointercapture', () => {
      if (state.dragging) endDrag();
    });

    els.canvas.addEventListener('keydown', (event) => {
      if (!state.generated || (state.mode !== 'limit' && state.mode !== 'derivative')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      cancelApproach();
      const span = state.view.xMax - state.view.xMin;
      const step = span * (event.shiftKey ? 0.04 : 0.006);
      let next = state.probeX + (event.key === 'ArrowRight' ? step : -step);
      next = clamp(next, state.view.xMin + span * 0.012, state.view.xMax - span * 0.012);
      if (state.mode === 'limit' && Math.abs(next - state.limit.a) <= span * 0.0075) {
        next = state.limit.a;
      }
      state.probeX = next;
      updateActiveReadout();
      scheduleRender();
    });
  }

  /* ───────────────────────────── Limit approach ───────────────────────────── */

  function cancelApproach() {
    state.approachToken += 1;
    state.approaching = false;
    if (state.approachRaf) {
      cancelAnimationFrame(state.approachRaf);
      state.approachRaf = 0;
    }
  }

  function approachLimit(direction) {
    if (!state.generated) return;
    cancelApproach();
    const token = state.approachToken;
    const a = state.limit.a;
    const span = state.view.xMax - state.view.xMin;
    const distance = Math.max(0.65, Math.min(1.8, span * 0.19));
    state.probeX = a + direction * distance;
    state.approaching = true;

    if (reduceMotion.matches) {
      state.probeX = a;
      state.approaching = false;
      updateActiveReadout();
      scheduleRender();
      return;
    }

    const started = performance.now();
    const duration = 1050;
    const step = (now) => {
      if (token !== state.approachToken) return;
      const progress = clamp((now - started) / duration, 0, 1);
      const remaining = Math.pow(1 - progress, 2.55);
      state.probeX = progress >= 1 ? a : a + direction * distance * remaining;
      updateActiveReadout();
      scheduleRender();
      if (progress < 1) {
        state.approachRaf = requestAnimationFrame(step);
      } else {
        state.approachRaf = 0;
        state.probeX = a;
        state.approaching = false;
        updateActiveReadout();
        scheduleRender();
      }
    };
    state.approachRaf = requestAnimationFrame(step);
  }

  function updateApproachButtons() {
    els.limitLeft.disabled = !state.generated;
    els.limitRight.disabled = !state.generated;
  }

  /* ───────────────────────────── Screens ───────────────────────────── */

  function transitionScreen(update) {
    if (typeof document.startViewTransition === 'function' && !reduceMotion.matches) {
      try {
        const transition = document.startViewTransition(update);
        if (transition && transition.finished && transition.finished.catch) transition.finished.catch(() => {});
        return;
      } catch (error) {
        /* fall through to the plain switch */
      }
    }
    update();
  }

  function openLab() {
    if (!els.home.hidden && !els.lab.hidden) return;
    transitionScreen(() => {
      els.home.hidden = true;
      els.home.classList.remove('is-active');
      els.lab.hidden = false;
      els.lab.classList.add('is-active');
    });
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      resizeCanvas();
      if (window.innerWidth > 760 && !state.generated) {
        window.setTimeout(() => els.fnInput.focus({ preventScroll: true }), 420);
      }
    });
  }

  function openHome() {
    if (els.home.hidden === false) return;
    cancelApproach();
    transitionScreen(() => {
      els.lab.hidden = true;
      els.lab.classList.remove('is-active');
      els.home.hidden = false;
      els.home.classList.add('is-active');
    });
    window.scrollTo(0, 0);
  }

  /* ───────────────────────────── Events ───────────────────────────── */

  function bindPressFeedback() {
    document.querySelectorAll('.glass-press').forEach((button) => {
      const press = () => {
        if (button.disabled) return;
        button.classList.add('is-pressed');
      };
      const release = () => button.classList.remove('is-pressed');
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('blur', release);
      button.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') press();
      });
      button.addEventListener('keyup', release);
    });
  }

  function bindTabs() {
    els.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setMode(tab.dataset.mode));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextTab = els.tabs[(index + direction + els.tabs.length) % els.tabs.length];
        setMode(nextTab.dataset.mode);
        nextTab.focus();
      });
    });
  }

  let autoGenerateTimer = 0;

  function scheduleAutoGenerate() {
    clearTimeout(autoGenerateTimer);
    autoGenerateTimer = window.setTimeout(() => {
      if (!els.fnInput.value.trim()) return;
      generateFromInput({ silent: true, keepFocus: true });
    }, 420);
  }

  function bindEvents() {
    els.start.addEventListener('click', openLab);
    els.brand.addEventListener('click', () => {
      if (!els.home.hidden) return;
      openHome();
    });

    els.fnForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearTimeout(autoGenerateTimer);
      generateFromInput();
    });
    els.fnInput.addEventListener('input', () => {
      clearFunctionError();
      scheduleAutoGenerate();
    });

    els.limitLeft.addEventListener('click', () => approachLimit(-1));
    els.limitRight.addEventListener('click', () => approachLimit(1));

    els.limitA.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      clearTimeout(limitInputTimer);
      applyLimitTarget(true);
    });
    els.limitA.addEventListener('input', () => {
      els.limitAError.textContent = '';
      scheduleLimitApply();
    });
    els.limitA.addEventListener('blur', () => {
      clearTimeout(limitInputTimer);
      applyLimitTarget(true);
    });

    els.intA.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      clearTimeout(integralInputTimer);
      applyIntegralBounds(true);
    });
    els.intB.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      clearTimeout(integralInputTimer);
      applyIntegralBounds(true);
    });
    [els.intA, els.intB].forEach((input) => {
      input.addEventListener('input', () => {
        els.intBoundsError.textContent = '';
        scheduleIntegralApply();
      });
      input.addEventListener('blur', () => {
        clearTimeout(integralInputTimer);
        applyIntegralBounds(true);
      });
    });

    els.taylorRange.addEventListener('input', () => setTaylorOrder(Number(els.taylorRange.value)));
    els.taylorMinus.addEventListener('click', () => setTaylorOrder(state.taylor.n - 1));
    els.taylorPlus.addEventListener('click', () => setTaylorOrder(state.taylor.n + 1));

    els.intRange.addEventListener('input', () => setIntegralCount(Number(els.intRange.value)));
    els.intMinus.addEventListener('click', () => setIntegralCount(state.integral.n - 1));
    els.intPlus.addEventListener('click', () => setIntegralCount(state.integral.n + 1));

    bindTabs();
    bindProbeInteraction();
    bindPressFeedback();
    bindGlassGlow();

    let resizeTimer = 0;
    const scheduleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!els.lab.hidden) resizeCanvas();
      }, 80);
    };

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(scheduleResize);
      observer.observe(els.shell);
    } else {
      window.addEventListener('resize', scheduleResize);
    }
    window.addEventListener('orientationchange', scheduleResize);
  }

  /* ───────────────────────────── Boot ───────────────────────────── */

  function boot() {
    bindEvents();
    state.mode = 'limit';
    state.probeX = state.limit.a + 0.9;
    setTabState('limit');
    syncControls();
    state.limit.result = null;
    state.integral.data = null;
    computeView();
    refreshInterface();
    updateApproachButtons();
    requestAnimationFrame(() => {
      if (!els.lab.hidden) resizeCanvas();
    });
  }

  boot();
})();

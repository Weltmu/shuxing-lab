/* 函数式告别 · 按钮音效（干声，无混响、无延音、无背景乐）
 *
 * 设计：每个音都是 0.05~0.3 秒的短音，木/铃/纸三类质感，按下去就响、响完就停。
 * 声音配方沿用 soundtrack skill 的 FX 参数（hiss/osc + 短包络）。
 */
(function (root) {
  'use strict';
  var KEY = 'farewell-sfx';
  var enabled = true;
  try { enabled = root.localStorage.getItem(KEY) !== 'off'; } catch (e) { enabled = true; }

  var ctx = null, master = null;

  function audio() {
    if (!enabled) return null;
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      // 只串一个轻压缩，不加混响/延迟，保证"按一下响一下"
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12; comp.ratio.value = 2.5;
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp);
    }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }

  var noiseBuf = null;
  function noise() {
    var c = audio(); if (!c) return null;
    if (!noiseBuf) {
      var n = Math.floor(c.sampleRate * 0.6);
      noiseBuf = c.createBuffer(1, n, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }

  function tone(f, peak, attack, decay, type, f2, glide) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + 0.004;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || decay));
    env(g, t, attack == null ? 0.003 : attack, peak, decay);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + (attack || 0.003) + decay + 0.02);
  }

  function hit(type, f, q, peak, attack, decay, f2, glide) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + 0.004;
    var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise();
    fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + (glide || decay));
    fl.Q.value = q;
    env(g, t, attack == null ? 0.001 : attack, peak, decay);
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start(t); s.stop(t + (attack || 0.001) + decay + 0.02);
  }

  var SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(name) {
    var m = /^([A-G]#?)(-?\d)$/.exec(name);
    if (!m) return 440;
    var n = SEMI[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  // 铃：极短，两个泛音
  function bell(name, peak, dur) {
    var f = hz(name);
    tone(f, peak, 0.002, dur || 0.22, 'sine');
    tone(f * 2.01, peak * 0.35, 0.002, (dur || 0.22) * 0.5, 'sine');
  }
  // 木：带噪短击
  function wood(freq, peak) {
    hit('bandpass', freq, 2.5, peak, 0.001, 0.045);
    tone(freq * 0.35, peak * 0.5, 0.002, 0.06, 'triangle');
  }

  var SOUNDS = {
    // 开场大黑圈：一声闷木，短
    seed: function () { wood(220, 0.22); tone(hz('A2'), 0.12, 0.004, 0.28, 'sine'); },
    // 圆形（进入）
    circle: function () { hit('highpass', 3200, 0.7, 0.10, 0.001, 0.014); bell('C6', 0.05, 0.18); },
    // 三角（换开局）
    triangle: function () { hit('bandpass', 2200, 1.2, 0.09, 0.001, 0.02); bell('B5', 0.045, 0.16); },
    // 悬停：一声极轻的点
    hover: function () { hit('highpass', 3600, 0.7, 0.045, 0.001, 0.01); },
    // 选中：木 + 短铃
    select: function () { wood(1400, 0.14); bell('A5', 0.045, 0.18); },
    // 函数累积：短铃，按次数上行
    tick: function (n) {
      var scale = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      bell(scale[(n || 0) % scale.length], 0.035, 0.16);
    },
    // 飞出：0.22 秒的高→低扫
    whoosh: function () { hit('bandpass', 3200, 1.1, 0.16, 0.02, 0.20, 500, 0.20); },
    // 入画：0.22 秒的低→高扫
    enter: function () { hit('bandpass', 500, 1.1, 0.13, 0.02, 0.20, 3200, 0.20); },
    // 翻页
    page: function () { hit('bandpass', 1400, 2, 0.09, 0.008, 0.09); },
    // 气泡
    bubble: function () { tone(620, 0.10, 0.002, 0.06, 'sine', 900, 0.05); },
    // 手机：来消息（两声短提示，像消息中心的叮咚）
    notify: function () {
      tone(1318, 0.10, 0.002, 0.10, 'sine');
      setTimeout(function () { tone(1760, 0.085, 0.002, 0.12, 'sine'); }, 95);
    },
    // 手机：发出消息（一声很轻的短滑）
    send: function () { tone(760, 0.07, 0.002, 0.06, 'sine', 1120, 0.05); },
    // 手机：进入对话（一声低频短振）
    phone: function () { tone(120, 0.12, 0.004, 0.10, 'sine', 96, 0.10); hit('bandpass', 900, 1.5, 0.05, 0.001, 0.05); },
    // 结局：三声短铃，干脆收住
    chime: function () {
      ['A4', 'C5', 'E5'].forEach(function (nm, i) {
        setTimeout(function () { bell(nm, 0.05, 0.26); }, i * 120);
      });
    }
  };

  var lastAt = 0;
  function play(name, arg) {
    if (!enabled) return;
    var fn = SOUNDS[name];
    if (!fn) return;
    var now = Date.now();
    if (now - lastAt < 35) return;
    lastAt = now;
    try { fn(arg); } catch (e) {}
  }

  function setEnabled(on) {
    enabled = !!on;
    try { root.localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {}
    document.documentElement.setAttribute('data-sfx', enabled ? 'on' : 'off');
    var btn = document.getElementById('sfx-toggle');
    if (btn) {
      btn.textContent = enabled ? '♪' : '♪̸';
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      btn.setAttribute('aria-label', enabled ? '关闭音效' : '打开音效');
    }
  }

  function mountToggle() {
    if (document.getElementById('sfx-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'sfx-toggle';
    btn.type = 'button';
    btn.className = 'sfx-toggle';
    btn.textContent = enabled ? '♪' : '♪̸';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? '关闭音效' : '打开音效');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOn = enabled;
      setEnabled(!wasOn);
      if (!wasOn) play('tick', 3);
    });
    document.body.appendChild(btn);
    document.documentElement.setAttribute('data-sfx', enabled ? 'on' : 'off');
  }

  document.addEventListener('pointerdown', function () { audio(); }, { once: true, capture: true });

  root.SFX = {
    play: play,
    setScene: function () {},        // 不再有背景配乐
    stopScore: function () {},
    setEnabled: setEnabled,
    isEnabled: function () { return enabled; },
    _ctx: function () { return ctx; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountToggle);
  else mountToggle();
})(typeof window !== 'undefined' ? window : globalThis);

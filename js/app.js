/* app.js — CUCK FLY.
   Three brains, two bodies, one chair. Nothing here is a script: the panel
   reads the same state the renderer does, and every line in the feed is
   produced by a trade arriving at a sense. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  var X = {
    libido: 0.18,
    thrust: 0,            /* phase */
    rate: 1.0,            /* thrusts per second */
    mode: 'RESTING',
    kickT: 0,             /* seconds left kicked off */
    strokes: 0,
    /* the cuck */
    c: {
      arousal: 0.22, humil: 0.3, jeal: 0.34, hope: 0.08, cope: 0.55,
      tears: 0, freeze: 0.2, notes: 0.3, stand: 0.1,
      bpm: 96, chair: 0, look: 0, turns: 0, halfStand: 0
    },
    spikes: 0, lived: 0, syn: 0, blackouts: 0,
    dop: 0, sweet: 0, bitter: 0, vib: 0,
    viewers: 180 + Math.floor(Math.random() * 90)
  };

  var HER_BARS = [
    ['feed (proboscis)', 'feed'], ['walk forward', 'fwd'], ['turn left', 'left'],
    ['turn right', 'right'], ['walk backward', 'back'], ['escape (giant fiber)', 'esc'],
    ['groom', 'groom'], ['freeze', 'freeze'], ['reward (dopamine)', 'dop']
  ];
  var CUCK_BARS = [
    ['humiliation', 'humil'], ['arousal', 'arousal'], ['jealousy (pC1 echo)', 'jeal'],
    ['hope', 'hope'], ['cope', 'cope'], ['freeze (DNp09)', 'freeze'],
    ['tears (lacrimal)', 'tears'], ['note-taking (MB)', 'notes'],
    ['stand up &rarr; nothing', 'stand']
  ];
  var HER = { feed: 0, fwd: 0, left: 0, right: 0, back: 0, esc: 0, groom: 0, freeze: 0, dop: 0 };

  /* ------------------------------------------------------------------ */
  /* brains                                                              */
  /* ------------------------------------------------------------------ */
  var small = window.innerWidth < 860;
  var N = small ? 1800 : 5200;
  var brains = [
    new BrainViz.Brain(N, 0),      /* she */
    new BrainViz.Brain(N, 0),      /* he  */
    new BrainViz.Brain(N, 1)       /* the cuck — same wiring, green input map */
  ];

  var cam = { yaw: 0.5, pitch: 0.12, zoom: 1 };
  var cv = $('c'), ctx = cv.getContext('2d', { alpha: false });
  var bcv = $('corpoCv'), bctx = bcv.getContext('2d');

  function resize() {
    [[cv, ctx], [bcv, bctx]].forEach(function (p) {
      var el = p[0], c = p[1], r = el.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  window.addEventListener('resize', resize);

  /* drag to rotate */
  var drag = null, userCam = false, autoT = 0;
  $('brain').addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch };
    userCam = true;
    $('brain').classList.add('drag');
    $('brain').setPointerCapture(e.pointerId);
  });
  $('brain').addEventListener('pointermove', function (e) {
    if (!drag) return;
    cam.yaw = drag.yaw + (e.clientX - drag.x) * 0.006;
    cam.pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.005, -1.1, 1.1);
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    $('brain').addEventListener(ev, function () { drag = null; $('brain').classList.remove('drag'); });
  });

  /* ------------------------------------------------------------------ */
  /* the market, and the map from a trade to a sense                     */
  /* ------------------------------------------------------------------ */
  var feed = [], mkt;

  function two(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) { return two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()); }
  function money(v) {
    return v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(2);
  }

  function onTrade(t) {
    var big = t.usd > 400, mid = t.usd > 90;
    var her, cuck;

    if (t.kind === 'buy') {
      X.libido = clamp(X.libido + (big ? 0.42 : mid ? 0.2 : 0.08), 0, 1);
      X.sweet = 1; X.dop = clamp(X.dop + (big ? 0.9 : 0.35), 0, 1);
      HER.feed = Math.max(HER.feed, big ? 1 : 0.7);
      X.c.arousal = clamp(X.c.arousal + (big ? 0.3 : 0.13), 0, 1);
      X.c.humil = clamp(X.c.humil + (big ? 0.26 : 0.1), 0, 1);
      X.c.jeal = clamp(X.c.jeal + (big ? 0.22 : 0.09), 0, 1);
      X.c.hope = clamp(X.c.hope - 0.1, 0, 1);
      her = 'she moans, he pounds harder' + (big ? ' &middot; new holder &rarr; dopamine in all three' : '');
      cuck = big
        ? 'his dopamine hit is the biggest of the three &middot; humiliation ' + pc(X.c.humil)
        : 'he feels the vibration at full strength &middot; arousal ' + pc(X.c.arousal);
    } else {
      X.libido = clamp(X.libido - (big ? 0.5 : mid ? 0.16 : 0.06), 0, 1);
      X.bitter = 1;
      HER.freeze = Math.max(HER.freeze, 0.6);
      X.c.hope = clamp(X.c.hope + (big ? 0.55 : 0.14), 0, 1);
      X.c.cope = clamp(X.c.cope - 0.06, 0.05, 1);
      if (big && X.mode !== 'KICKED') kick();
      her = big ? 'DNp13 fires &rarr; <b>she kicks him off</b>' : 'bitter taste, he slows down';
      cuck = big
        ? '<b>he half-stands</b> &middot; hope 1.00 &middot; the command reaches no body'
        : 'a slower pace reads as an opening &middot; hope ' + pc(X.c.hope);
    }

    push('<span class="q">' + stamp(t.at) + '</span> ' +
      (t.kind === 'buy' ? 'BUY' : 'SELL') + ' <b>' + money(t.usd) + '</b> by ' + t.who +
      ' <span class="r">&rarr; ' + her + '</span>', t.kind);
    push('<span class="q">' + stamp(t.at) + '</span> <span class="c">the cuck</span> ' +
      '<span class="r">' + cuck + '</span>', 'cuck');
  }

  function pc(v) { return Math.round(v * 100) + '%'; }

  function push(html, cls) {
    feed.unshift({ html: html, cls: cls });
    if (feed.length > 16) feed.pop();
    var box = $('mCards'), out = '';
    for (var i = 0; i < feed.length; i++) out += '<div class="card ' + feed[i].cls + '">' + feed[i].html + '</div>';
    box.innerHTML = out;
  }

  function kick() {
    X.mode = 'KICKED';
    X.kickT = 4 + Math.random() * 3;
    X.c.hope = 1;
    X.c.halfStand = 1;
    X.c.stand = 1;
    HER.back = 1; HER.esc = 0.8;
  }

  function onStats(s) {
    var chg = s.chg;
    $('mResumo').innerHTML =
      'price <b>$' + s.price.toFixed(8) + '</b> &middot; ' +
      '<span class="' + (chg >= 0 ? 'up' : 'down') + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(1) + '%</span>' +
      ' &middot; volume <b>' + money(s.vol) + '</b> &middot; <b>' + s.trades + '</b> trades' +
      '<br><span class="r">' + (s.live ? 'live tape' : 'simulated tape until launch') +
      ' &middot; every one of them lands in three brains</span>';
  }

  /* ------------------------------------------------------------------ */
  /* panel                                                               */
  /* ------------------------------------------------------------------ */
  function buildBars(host, defs) {
    var out = '';
    for (var i = 0; i < defs.length; i++) {
      out += '<div class="bar"><span>' + defs[i][0] + '</span><i><b id="' + host + '_' + defs[i][1] +
        '"></b></i><em id="' + host + '_' + defs[i][1] + '_v">0 Hz</em></div>';
    }
    $(host === 'h' ? 'bars' : 'cuckBars').innerHTML = out;
  }
  buildBars('h', HER_BARS);
  buildBars('c', CUCK_BARS);

  function setBar(id, v, hz) {
    var b = $(id); if (!b) return;
    b.style.width = clamp(v, 0, 1) * 100 + '%';
    $(id + '_v').textContent = Math.round(hz) + ' Hz';
  }

  var legend = '';
  for (var li = 0; li < BrainViz.REGIONS.length; li++) {
    var R = BrainViz.REGIONS[li];
    legend += '<div><s style="background:rgb(' + R[8][0] + ',' + R[8][1] + ',' + R[8][2] + ')"></s>' +
      '<span>' + R[0] + '</span><em>' + Math.round(138639 * R[7] / 1.0) + '</em></div>';
  }
  $('legend').innerHTML = legend;

  function hhmmss(t) {
    var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = Math.floor(t % 60);
    return (h ? h + 'h ' : '') + (h || m ? m + 'm ' : '') + s + 's';
  }

  /* ------------------------------------------------------------------ */
  /* the body scene                                                      */
  /* ------------------------------------------------------------------ */
  var parts = [];
  function spark(x, y, kind) { parts.push({ x: x, y: y, vx: (Math.random() - .5) * 14, vy: -8 - Math.random() * 20, l: 1, k: kind }); }

  function drawScene(dt) {
    var r = bcv.parentElement.getBoundingClientRect(), W = r.width, H = r.height;
    bctx.fillStyle = '#000';
    bctx.fillRect(0, 0, W, H);

    /* floor glow under the couple */
    var fg = bctx.createRadialGradient(W * 0.36, H * 0.82, 4, W * 0.36, H * 0.82, W * 0.32);
    fg.addColorStop(0, 'rgba(255,90,160,' + (0.05 + X.libido * 0.13) + ')');
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.fillStyle = fg; bctx.fillRect(0, 0, W, H);
    /* cold glow around the chair */
    var cg = bctx.createRadialGradient(W * 0.82, H * 0.7, 4, W * 0.82, H * 0.7, W * 0.2);
    cg.addColorStop(0, 'rgba(80,255,190,.07)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.fillStyle = cg; bctx.fillRect(0, 0, W, H);

    var s = Math.min(H * 0.25, W * 0.09);      /* fly scale */
    var gx = W * 0.34, gy = H * 0.70;

    /* ---------- her ---------- */
    var breathe = Math.sin(X.thrust * 2) * 0.02 * X.libido;
    FlyArt.shadow(bctx, gx - s * 0.1, gy + s * 0.52, s * 1.15, s * 0.2, 0.5);
    FlyArt.drawFly(bctx, {
      x: gx, y: gy + breathe * s, s: s, phase: X.thrust * 0.6,
      tilt: 0.02 + breathe, proboscis: HER.feed, headTilt: -0.05 - HER.feed * 0.1
    });

    /* ---------- him, on her back ---------- */
    if (X.mode === 'KICKED') {
      var k = 1 - clamp(X.kickT / 5, 0, 1);
      FlyArt.drawFly(bctx, {
        x: gx - s * (1.5 - k * 0.55), y: gy + s * (0.16 - Math.abs(Math.sin(k * 5)) * 0.3),
        s: s * 0.92, phase: X.thrust * 3, tilt: -0.55 + k * 0.5,
        wingBeat: performance.now() / 22
      });
    } else {
      var push = Math.max(0, Math.sin(X.thrust)) * (0.3 + X.libido * 0.7);
      FlyArt.drawFly(bctx, {
        x: gx - s * (0.05 - push * 0.16), y: gy - s * (0.58 - push * 0.07),
        s: s * 0.9, phase: X.thrust * 0.9, tilt: 0.17 - push * 0.12,
        legLift: 0.55,
        wingBeat: X.libido > 0.55 ? performance.now() / 30 : 0
      });
    }

    /* ---------- the chair, and the cuck in it ---------- */
    var cx = W * 0.78, cy = H * 0.74, cs = s * 1.32;
    FlyArt.shadow(bctx, cx, cy + cs * 0.8, cs * 1.3, cs * 0.22, 0.55);
    FlyArt.drawChair(bctx, cx, cy, cs, 'rgba(125,255,196,' + (0.12 + X.c.arousal * 0.3) + ')');
    var trem = (Math.random() - 0.5) * X.c.humil * 1.5;
    var rise = X.c.halfStand * cs * 0.34;
    FlyArt.drawFly(bctx, {
      x: cx + cs * 0.10 + trem, y: cy - cs * 0.34 - rise, s: s * 0.86,
      phase: X.lived * 1.6, seated: 1 - X.c.halfStand * 0.6,
      tilt: 0.30 - X.c.halfStand * 0.26,
      headTilt: -0.2 - X.c.jeal * 0.12,
      tint: 0.6, flip: true
    });

    /* his eyeline: a thin beam to the couple, brighter the more he watches */
    bctx.save();
    bctx.globalCompositeOperation = 'lighter';
    var beam = bctx.createLinearGradient(cx - cs * 0.5, cy - cs * 0.55, gx + s * 0.5, gy - s * 0.4);
    var ba = (0.02 + X.c.arousal * 0.05) * (1 - X.c.tears * 0.6);
    beam.addColorStop(0, 'rgba(125,255,196,' + ba + ')');
    beam.addColorStop(1, 'rgba(125,255,196,0)');
    bctx.strokeStyle = beam; bctx.lineWidth = 1.2;
    bctx.beginPath();
    bctx.moveTo(cx - cs * 0.5, cy - cs * 0.62);
    bctx.lineTo(gx + s * 0.55, gy - s * 0.45);
    bctx.stroke();
    bctx.restore();

    /* ---------- particles ---------- */
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.l -= dt * 0.7; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 42 * dt;
      if (p.l <= 0) { parts.splice(i, 1); continue; }
      bctx.globalAlpha = clamp(p.l, 0, 1);
      if (p.k === 'sweat') { bctx.fillStyle = '#9fd8ff'; bctx.beginPath(); bctx.ellipse(p.x, p.y, 1.6, 2.6, 0, 0, 6.283); bctx.fill(); }
      else if (p.k === 'tear') { bctx.fillStyle = '#7dffc4'; bctx.beginPath(); bctx.ellipse(p.x, p.y, 1.5, 3, 0, 0, 6.283); bctx.fill(); }
      else FlyArt.pixelHeart(bctx, p.x, p.y, Math.max(1, s * 0.055), '#ff4f9a', true);
      bctx.globalAlpha = 1;
    }

    /* ---------- hud text ---------- */
    var hud = $('sexoHud');
    if (X.mode === 'KICKED') {
      hud.innerHTML = 'KICKED OFF<small>DNp13 rejection &middot; he climbs back on in ' + X.kickT.toFixed(1) + 's</small>';
    } else {
      hud.innerHTML = (X.libido > 0.12 ? 'FUCKING &middot; ' + X.rate.toFixed(1) + ' thrusts/s' : 'RESTING') +
        '<small>libido ' + pc(X.libido) + ' &middot; buys make him pound harder &middot; a big sell gets him kicked off</small>';
    }
    $('cuckHud').innerHTML = (X.c.halfStand > 0.2 ? 'HALF&#8209;STANDING' : 'IN THE CHAIR') +
      '<small>cope ' + pc(X.c.cope) + ' &middot; his turn: never</small>';
    $('corpoModo').textContent = X.mode === 'KICKED' ? 'REJECTION' : X.libido > 0.5 ? 'HIGH LIBIDO' : 'STEADY';
    $('corpoModo').className = X.mode === 'KICKED' ? 'kick' : '';
    $('corpoInfo').textContent = 'real time · ' + Math.round(30 + X.libido * 30) + ' steps/s · ' +
      X.strokes.toLocaleString() + ' strokes watched';
  }

  /* ------------------------------------------------------------------ */
  /* the loop                                                            */
  /* ------------------------------------------------------------------ */
  var last = performance.now(), acc = 0;

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    X.lived += dt;
    if (mkt) mkt.step(dt);

    /* --- couple dynamics --- */
    X.libido = clamp(X.libido - dt * 0.012, 0, 1);
    X.rate = 0.6 + X.libido * 5.4;
    if (X.mode === 'KICKED') {
      X.kickT -= dt;
      if (X.kickT <= 0) {
        X.mode = 'FUCKING';
        X.c.hope = 0;
        X.c.tears = 1;
        X.c.cope = clamp(X.c.cope - 0.12, 0.05, 1);
        push('<span class="q">' + stamp(new Date()) + '</span> <span class="c">the cuck</span> ' +
          '<span class="r">she re-mounts &middot; hope 1.00 &rarr; 0.00 &middot; logged as <b>denial</b></span>', 'cuck');
        for (var t = 0; t < 6; t++) spark(bcv.parentElement.getBoundingClientRect().width * 0.82,
          bcv.parentElement.getBoundingClientRect().height * 0.55, 'tear');
      }
    } else {
      var prev = X.thrust;
      X.thrust += dt * X.rate * 6.2832;
      if (Math.floor(X.thrust / 6.2832) > Math.floor(prev / 6.2832)) {
        X.strokes++;
        X.vib = 1;
        X.c.humil = clamp(X.c.humil + 0.012, 0, 1);
        if (X.strokes % 4 === 0) { X.dop = 1; X.c.arousal = clamp(X.c.arousal + 0.05, 0, 1); }
        if (X.libido > 0.3) {
          var rr = bcv.parentElement.getBoundingClientRect();
          for (var h = 0; h < 1 + Math.round(X.libido * 2); h++)
            spark(rr.width * 0.36 + (Math.random() - .5) * 60, rr.height * 0.45, 'heart');
          if (Math.random() < X.c.humil * 0.5) spark(rr.width * 0.8, rr.height * 0.5, 'sweat');
        }
      }
      X.mode = X.libido > 0.12 ? 'FUCKING' : 'RESTING';
    }

    /* --- the cuck --- */
    var c = X.c;
    c.chair += dt;                       /* the only counter that always rises */
    c.arousal = clamp(c.arousal + (X.libido * 0.9 - c.arousal) * dt * 0.7, 0, 1);
    c.humil = clamp(c.humil + (X.libido * 0.8 + 0.15 - c.humil) * dt * 0.5, 0, 1);
    c.jeal = clamp(c.jeal + (X.libido - c.jeal) * dt * 0.4, 0, 1);
    c.hope = clamp(c.hope - dt * 0.05, 0, 1);
    c.cope = clamp(c.cope + (0.62 - c.cope) * dt * 0.08, 0.05, 1);
    c.tears = clamp(c.tears - dt * 0.35, 0, 1);
    c.freeze = clamp(0.15 + c.humil * 0.5 + (X.mode === 'KICKED' ? 0.3 : 0), 0, 1);
    c.notes = clamp(0.2 + X.libido * 0.6, 0, 1);
    c.stand = clamp(c.stand * (1 - dt * 1.4) + c.hope * 0.5, 0, 1);
    c.halfStand = clamp(c.halfStand - dt * 0.6, 0, 1);
    c.bpm = lerp(c.bpm, 92 + c.arousal * 96 + c.humil * 34, dt * 1.5);
    if (c.tears > 0.5 && Math.random() < dt * 6) {
      var rq = bcv.parentElement.getBoundingClientRect();
      spark(rq.width * 0.82, rq.height * 0.52, 'tear');
    }
    /* he looks away when it gets to be too much, and then he looks back */
    if (Math.random() < dt * c.humil * 0.045) { c.look++; }

    /* --- her descending drives --- */
    HER.feed = clamp(HER.feed - dt * 0.8, 0, 1);
    HER.freeze = clamp(HER.freeze - dt * 0.5, 0, 1) * 0.6 + (X.mode === 'KICKED' ? 0.4 : 0);
    HER.fwd = clamp(X.libido * 0.8 + Math.sin(X.lived * 0.3) * 0.1, 0, 1);
    HER.left = clamp(0.2 + Math.sin(X.lived * 0.21) * 0.2, 0, 1);
    HER.right = clamp(0.2 + Math.cos(X.lived * 0.17) * 0.2, 0, 1);
    HER.back = clamp(HER.back - dt * 0.6, 0, 1);
    HER.esc = clamp(HER.esc - dt * 0.9, 0, 1);
    HER.groom = clamp(0.25 - X.libido * 0.2, 0, 1);
    HER.dop = clamp(X.dop, 0, 1);
    X.dop = clamp(X.dop - dt * 0.7, 0, 1);
    X.vib = clamp(X.vib - dt * 4, 0, 1);
    X.sweet = clamp(X.sweet - dt * 0.6, 0, 1);
    X.bitter = clamp(X.bitter - dt * 0.6, 0, 1);

    /* --- brains: region focus vectors --- */
    /* 0 optL 1 optR 2 central 3 mbL 4 mbR 5 cx 6 alL 7 alR 8 sez */
    var lv = 0.22 + X.libido * 0.75;
    var herF = [0.35, 0.35, 0.55 + X.libido * 0.4, 0.4, 0.4, 0.45 + X.vib * 0.4, 0.3 + X.sweet * 0.6, 0.3 + X.sweet * 0.6, 0.5 + HER.feed * 0.5];
    var hisF = [0.3, 0.3, 0.6 + X.libido * 0.35, 0.35, 0.35, 0.5 + X.vib * 0.5, 0.3, 0.3, 0.35 + X.sweet * 0.4];
    /* the cuck: optic lobes and mushroom bodies carry almost everything */
    var cuckF = [0.85 + c.arousal * 0.15, 0.85 + c.arousal * 0.15, 0.4 + c.jeal * 0.4,
      0.7 + c.notes * 0.3, 0.7 + c.notes * 0.3, 0.3 + X.vib * 0.5,
      0.15, 0.15, 0.2 + c.tears * 0.7];

    var fired = 0;
    fired += brains[0].step(dt, lv, herF);
    fired += brains[1].step(dt, lv * (X.mode === 'KICKED' ? 0.5 : 1), hisF);
    fired += brains[2].step(dt, 0.3 + c.arousal * 0.5 + c.humil * 0.3, cuckF);
    X.spikes = lerp(X.spikes, fired / Math.max(dt, 1e-3) * (138639 / N), 0.08);
    X.syn += Math.round(fired * dt * 40);

    /* rare blackout: no fatigue in the model, so a runaway is possible */
    if (Math.random() < dt * 0.0016 * (1 + c.arousal)) {
      X.blackouts++;
      var who = Math.random() < 0.55 ? 2 : Math.floor(Math.random() * 2);
      brains[who].pts.lit.fill(0);
      push('<span class="q">' + stamp(new Date()) + '</span> <span class="r">' +
        (who === 2 ? '<span class="c">the cuck</span> runs away and blacks out' :
          (who ? 'his' : 'her') + ' brain runs away and blacks out') +
        ' &middot; restarted &middot; counted</span>', who === 2 ? 'cuck' : '');
    }

    /* --- draw --- */
    if (!drag && !userCam) {
      autoT += dt;
      cam.yaw = 0.34 * Math.sin(autoT * 0.15);
      cam.pitch = 0.1 + 0.07 * Math.sin(autoT * 0.11);
    }
    var r = cv.parentElement.getBoundingClientRect(), W = r.width, H = r.height;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var scale = Math.min(W / 3.15, H * 1.7);
    brains[0].draw(ctx, cam, W * 0.18, H * 0.44, scale, 1);
    brains[1].draw(ctx, cam, W * 0.5, H * 0.44, scale, 1);
    brains[2].draw(ctx, cam, W * 0.82, H * 0.44, scale, 0.95);

    drawScene(dt);

    /* --- panel, four times a second --- */
    acc += dt;
    if (acc > 0.25) {
      acc = 0;
      $('sSpikes').textContent = Math.round(X.spikes).toLocaleString();
      $('sLived').textContent = hhmmss(X.lived);
      $('sSyn').textContent = X.syn.toLocaleString();
      $('sSeiz').textContent = X.blackouts;
      $('cBpm').textContent = Math.round(c.bpm);
      $('cChair').textContent = hhmmss(c.chair);
      $('cLook').textContent = c.look;
      $('cTurns').textContent = c.turns;

      for (var i = 0; i < HER_BARS.length; i++) {
        var kk = HER_BARS[i][1], v = HER[kk] || 0;
        setBar('h_' + kk, v, v * 120);
      }
      for (var j = 0; j < CUCK_BARS.length; j++) {
        var ck = CUCK_BARS[j][1], cvv = c[ck] || 0;
        setBar('c_' + ck, cvv, cvv * 120);
        if (ck === 'stand') {
          var el = $('c_stand'); if (el) el.className = cvv > 0.55 ? 'hot' : '';
        }
      }

      $('hstate').textContent = X.mode === 'KICKED' ? 'REJECTION' : X.libido > 0.5 ? 'TURNED ON' : 'IDLING';
      $('hstate').className = X.libido > 0.5 ? 'active' : '';
      $('hstate2').innerHTML = 'she feels: ' + [
        X.sweet > 0.3 ? 'sweet' : null, X.vib > 0.1 ? 'vibration' : null,
        X.libido > 0.4 ? 'she pushes back' : 'she waits',
        'pC1 ' + Math.round((0.3 + X.libido * 0.7) * 120) + ' Hz'
      ].filter(Boolean).join(' &middot; ');
      $('hstate3').innerHTML = 'the cuck feels: ' + [
        'watching', c.arousal > 0.4 ? 'arousal' : null, c.humil > 0.5 ? 'humiliation' : null,
        c.hope > 0.4 ? '<b>hope</b>' : null, c.tears > 0.3 ? 'tears' : null,
        'stand-up command ' + Math.round(c.stand * 120) + ' Hz &rarr; no body'
      ].filter(Boolean).join(' &middot; ');

      $('viewersTop').textContent = X.viewers + ' watching · 1 of them in a chair';
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  $('btnAbout').onclick = function () { $('sobre').classList.add('on'); };
  $('btnClose').onclick = function () { $('sobre').classList.remove('on'); };
  $('btnCinema').onclick = function () { $('app').classList.toggle('cinema'); setTimeout(resize, 60); };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $('sobre').classList.remove('on');
    if (e.key === 'c' || e.key === 'C') { $('app').classList.toggle('cinema'); setTimeout(resize, 60); }
  });
  $('ca').onclick = function () {
    var t = $('caTxt').textContent;
    if (!/^0x/.test(t)) return;
    navigator.clipboard.writeText(t);
    $('ca').classList.add('copiado');
    setTimeout(function () { $('ca').classList.remove('copiado'); }, 1200);
  };

  var cfg = window.CUCKFLY_CFG || {};
  if (cfg.ca) $('caTxt').textContent = cfg.ca.slice(0, 6) + '…' + cfg.ca.slice(-4);
  if (cfg.x) {
    $('xLink').href = cfg.x;
    var fx = $('footX');
    if (fx) {
      fx.href = cfg.x;
      fx.textContent = '@' + cfg.x.replace(/\/+$/, '').split('/').pop();
    }
  }
  $('feedMode').textContent = cfg.pool ? 'live via GeckoTerminal' : 'simulated until launch';
  $('liveTop').className = 'live on';
  $('liveTxt').textContent = 'LIVE';

  setInterval(function () {
    X.viewers = Math.max(40, X.viewers + Math.round((Math.random() - 0.48) * 7));
  }, 4000);

  mkt = new Market(onTrade, onStats);
  mkt.start();
  onStats({ price: mkt.price, chg: 0, vol: 0, trades: 0, live: mkt.live });

  /* dev hook: lets a headless/hidden tab step the loop by hand */
  window.CF = { X: X, brains: brains, frame: frame, market: function () { return mkt; } };

  resize();
  requestAnimationFrame(frame);
})();

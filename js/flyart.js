/* flyart.js — canvas drawing for the fly bodies and the chair.
   One renderer, used by the live site and by the banner generator. */
(function (root) {
  'use strict';

  var TAU = 6.2831853;
  function lerp(a, b, t) { return a + (b - a) * t; }

  var EYE_RED = { hi: '#ff8d78', mid: '#c8322f', lo: '#4e1210' };
  var EYE_GREEN = { hi: '#a8ffdd', mid: '#3ec48f', lo: '#0b3a2b' };

  /* ---- one leg: femur / tibia / tarsus ---- */
  function leg(ctx, x, y, s, a1, a2, a3, w, col) {
    var l1 = 0.36 * s, l2 = 0.36 * s, l3 = 0.24 * s;
    var x1 = x + Math.cos(a1) * l1, y1 = y + Math.sin(a1) * l1;
    var x2 = x1 + Math.cos(a2) * l2, y2 = y1 + Math.sin(a2) * l2;
    var x3 = x2 + Math.cos(a3) * l3, y3 = y2 + Math.sin(a3) * l3;
    ctx.strokeStyle = col;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = w * 1.3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.lineWidth = w * 0.7;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    ctx.lineWidth = Math.max(0.5, w * 0.38);
    for (var i = 1; i <= 2; i++) {
      var t = i / 3, bx = lerp(x2, x3, t), by = lerp(y2, y3, t);
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a3 - 2.2) * s * 0.05, by + Math.sin(a3 - 2.2) * s * 0.05);
      ctx.stroke();
    }
  }

  function wing(ctx, x, y, s, ang, len, alpha, blur) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    var g = ctx.createLinearGradient(0, -0.2 * s, len * s * 0.8, 0.12 * s);
    g.addColorStop(0, 'rgba(206,212,222,' + (0.9 * alpha) + ')');
    g.addColorStop(0.5, 'rgba(146,154,168,' + (0.82 * alpha) + ')');
    g.addColorStop(1, 'rgba(92,100,116,' + (0.7 * alpha) + ')');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * s * 0.35, -0.26 * s, len * s * 0.86, -0.22 * s, len * s, -0.02 * s);
    ctx.bezierCurveTo(len * s * 0.84, 0.14 * s, len * s * 0.34, 0.17 * s, 0, 0.04 * s);
    ctx.closePath();
    if (blur) { ctx.shadowColor = 'rgba(200,214,240,.45)'; ctx.shadowBlur = 7; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(58,64,78,' + (0.75 * alpha) + ')';
    ctx.lineWidth = Math.max(0.6, s * 0.012);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,100,118,' + (0.5 * alpha) + ')';
    ctx.lineWidth = Math.max(0.5, s * 0.009);
    for (var v = 0; v < 3; v++) {
      ctx.beginPath();
      ctx.moveTo(len * s * 0.06, -0.004 * s + v * 0.026 * s);
      ctx.quadraticCurveTo(len * s * 0.5, (-0.15 + v * 0.11) * s, len * s * 0.94, (-0.03 + v * 0.04) * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- a whole fly, side view, facing right unless flip ---- */
  function drawFly(ctx, o) {
    var s = o.s, ph = o.phase || 0, flip = o.flip ? -1 : 1;
    var tint = o.tint || 0;
    var alpha = o.alpha == null ? 1 : o.alpha;
    var eye = o.eye || (tint > 0.3 ? EYE_GREEN : EYE_RED);
    var seated = o.seated || 0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(o.x, o.y);
    ctx.rotate(o.tilt || 0);
    ctx.scale(flip, 1);

    var hue = 24 + tint * 100;
    var dark = 'hsl(' + hue + ',' + (24 - tint * 4) + '%,' + (7 + tint * 3) + '%)';
    var mid = 'hsl(' + (hue + 2) + ',' + (25 - tint * 4) + '%,' + (14 + tint * 5) + '%)';
    var lite = 'hsl(' + (hue + 6) + ',' + (24 - tint * 3) + '%,' + (26 + tint * 7) + '%)';
    var legc = 'hsl(' + hue + ',22%,' + (14 + tint * 5) + '%)';

    /* ---------- far legs ---------- */
    ctx.globalAlpha = alpha * 0.5;
    if (seated) {
      leg(ctx, -0.24 * s, 0.26 * s, s, 1.15, 0.35, 0.1, s * 0.05, legc);
      leg(ctx, 0.04 * s, 0.30 * s, s, 0.85, 0.15, -0.1, s * 0.05, legc);
      leg(ctx, 0.34 * s, 0.16 * s, s, -0.55, -0.15, 0.25, s * 0.05, legc);
    } else {
      leg(ctx, -0.26 * s, 0.26 * s, s, 2.35 + Math.sin(ph) * 0.16, 1.35, 1.25, s * 0.05, legc);
      leg(ctx, 0.04 * s, 0.30 * s, s, 1.85 + Math.sin(ph + 2.1) * 0.16, 1.3, 1.2, s * 0.05, legc);
      leg(ctx, 0.32 * s, 0.26 * s, s, 1.15 + Math.sin(ph + 4.2) * 0.18, 1.35, 1.25, s * 0.05, legc);
    }
    ctx.globalAlpha = alpha;

    /* ---------- wings ---------- */
    var wb = o.wingBeat || 0;
    wing(ctx, -0.12 * s, -0.26 * s, s, -0.26 + Math.sin(wb) * 0.14, 1.5, 0.75, wb !== 0);
    wing(ctx, -0.08 * s, -0.22 * s, s, -0.02 + Math.sin(wb + 0.7) * 0.18, 1.38, 1, wb !== 0);

    /* ---------- abdomen ---------- */
    var ag = ctx.createLinearGradient(-0.85 * s, -0.26 * s, -0.2 * s, 0.3 * s);
    ag.addColorStop(0, dark); ag.addColorStop(0.45, mid); ag.addColorStop(1, dark);
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(-0.06 * s, -0.26 * s);
    ctx.bezierCurveTo(-0.48 * s, -0.36 * s, -0.86 * s, -0.22 * s, -0.88 * s, 0.02 * s);
    ctx.bezierCurveTo(-0.89 * s, 0.26 * s, -0.46 * s, 0.36 * s, -0.06 * s, 0.24 * s);
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.globalAlpha = alpha * 0.5;
    for (var b = 0; b < 4; b++) {
      ctx.fillStyle = b % 2 ? 'rgba(0,0,0,.55)' : 'hsla(' + (hue + 8) + ',30%,38%,.32)';
      ctx.fillRect((-0.9 + b * 0.21) * s, -0.45 * s, 0.11 * s, s);
    }
    ctx.restore();
    ctx.globalAlpha = alpha;
    var sh = ctx.createRadialGradient(-0.44 * s, -0.18 * s, 0.02 * s, -0.44 * s, -0.18 * s, 0.36 * s);
    sh.addColorStop(0, 'hsla(' + (hue + 10) + ',26%,48%,.38)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.ellipse(-0.44 * s, -0.15 * s, 0.36 * s, 0.17 * s, -0.15, 0, TAU); ctx.fill();

    /* light patches on the cuticle, like the specular marks on the render */
    ctx.globalAlpha = alpha * 0.34;
    ctx.fillStyle = 'hsl(' + (hue + 12) + ',14%,' + (58 + tint * 8) + '%)';
    var spots = [[-0.33, 0.09, 0.035, 0.019], [-0.63, -0.04, 0.026, 0.015], [-0.16, 0.17, 0.022, 0.013]];
    for (var sp = 0; sp < spots.length; sp++) {
      ctx.beginPath();
      ctx.ellipse(spots[sp][0] * s, spots[sp][1] * s, spots[sp][2] * s, spots[sp][3] * s, -0.3, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;

    /* ---------- thorax ---------- */
    var tg = ctx.createLinearGradient(-0.1 * s, -0.36 * s, 0.36 * s, 0.26 * s);
    tg.addColorStop(0, lite); tg.addColorStop(0.5, mid); tg.addColorStop(1, dark);
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(0.08 * s, -0.02 * s, 0.38 * s, 0.30 * s, -0.1, 0, TAU); ctx.fill();
    ctx.globalAlpha = alpha * 0.34;
    ctx.fillStyle = 'hsl(' + (hue + 12) + ',14%,' + (62 + tint * 6) + '%)';
    ctx.beginPath(); ctx.ellipse(0.15 * s, -0.15 * s, 0.045 * s, 0.024 * s, -0.35, 0, TAU); ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(10,8,6,.85)';
    ctx.lineWidth = Math.max(0.6, s * 0.016);
    for (var i = 0; i < 6; i++) {
      var bx = (-0.16 + i * 0.085) * s, by = (-0.23 - Math.abs(i - 2.5) * 0.01) * s;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 0.045 * s, by - 0.12 * s); ctx.stroke();
    }

    /* ---------- head ---------- */
    ctx.save();
    ctx.translate(0.44 * s, -0.07 * s);
    ctx.rotate(o.headTilt || 0);
    ctx.fillStyle = mid;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.24 * s, 0.22 * s, 0, 0, TAU); ctx.fill();
    var eg = ctx.createRadialGradient(0.07 * s, -0.07 * s, 0.01 * s, 0.05 * s, 0, 0.21 * s);
    eg.addColorStop(0, eye.hi); eg.addColorStop(0.42, eye.mid); eg.addColorStop(1, eye.lo);
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(0.06 * s, -0.02 * s, 0.17 * s, 0.19 * s, 0.1, 0, TAU); ctx.fill();
    ctx.globalAlpha = alpha * 0.16;
    ctx.strokeStyle = '#150505'; ctx.lineWidth = Math.max(0.4, s * 0.007);
    for (var k = -3; k <= 3; k++) {
      ctx.beginPath(); ctx.moveTo(0.06 * s + k * 0.045 * s, -0.19 * s); ctx.lineTo(0.06 * s + k * 0.045 * s, 0.16 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.12 * s, -0.02 * s + k * 0.045 * s); ctx.lineTo(0.23 * s, -0.02 * s + k * 0.045 * s); ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.ellipse(0.12 * s, -0.1 * s, 0.04 * s, 0.026 * s, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0.01 * s, 0.19 * s + (o.proboscis || 0) * 0.09 * s, 0.08 * s,
      0.07 * s + (o.proboscis || 0) * 0.08 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = Math.max(0.7, s * 0.02);
    ctx.beginPath(); ctx.moveTo(0.09 * s, 0.1 * s); ctx.lineTo(0.2 * s, 0.17 * s); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,30,24,.75)'; ctx.lineWidth = Math.max(0.4, s * 0.009);
    ctx.beginPath(); ctx.moveTo(0.2 * s, 0.17 * s); ctx.lineTo(0.36 * s, 0.13 * s); ctx.stroke();
    ctx.restore();

    /* ---------- near legs ---------- */
    var lift = o.legLift || 0;
    if (seated) {
      /* hind legs on the seat, mid legs hanging, forelegs up on the armrest */
      leg(ctx, -0.22 * s, 0.24 * s, s, 1.05, 0.3, 0.05, s * 0.055, legc);
      leg(ctx, 0.06 * s, 0.28 * s, s, 0.9, 0.25 + Math.sin(ph) * 0.12, -0.05, s * 0.055, legc);
      leg(ctx, 0.32 * s, 0.14 * s, s, -0.62 + Math.sin(ph * 0.5) * 0.06, -0.1, 0.3, s * 0.055, legc);
    } else {
      leg(ctx, -0.22 * s, 0.24 * s, s, 2.3 + Math.sin(ph + 3.1) * 0.2 - lift * 0.4, 1.3, 1.2, s * 0.055, legc);
      leg(ctx, 0.06 * s, 0.28 * s, s, 1.78 + Math.sin(ph + 5.2) * 0.2 - lift * 0.5, 1.25, 1.18, s * 0.055, legc);
      leg(ctx, 0.3 * s, 0.24 * s, s, 1.1 + Math.sin(ph + 1.0) * 0.22 - lift * 0.6, 1.3, 1.2, s * 0.055, legc);
    }

    ctx.restore();
  }

  /* ---- the chair. it is drawn at the correct scale. ---- */
  function drawChair(ctx, x, y, s, glow) {
    ctx.save();
    ctx.translate(x, y);

    /* back */
    var g = ctx.createLinearGradient(0, -1.5 * s, 0, 0.2 * s);
    g.addColorStop(0, '#241820'); g.addColorStop(1, '#100b12');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-0.66 * s, 0.12 * s);
    ctx.lineTo(-0.66 * s, -1.16 * s);
    ctx.quadraticCurveTo(-0.66 * s, -1.46 * s, -0.34 * s, -1.46 * s);
    ctx.lineTo(0.42 * s, -1.46 * s);
    ctx.quadraticCurveTo(0.74 * s, -1.46 * s, 0.74 * s, -1.16 * s);
    ctx.lineTo(0.74 * s, 0.12 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      ctx.beginPath(); ctx.arc((-0.32 + c * 0.36) * s, (-1.18 + r * 0.36) * s, 0.032 * s, 0, TAU); ctx.fill();
    }

    /* seat */
    var sg = ctx.createLinearGradient(0, -0.1 * s, 0, 0.44 * s);
    sg.addColorStop(0, '#302029'); sg.addColorStop(1, '#150f18');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-0.84 * s, 0.04 * s);
    ctx.quadraticCurveTo(0.03 * s, -0.14 * s, 0.92 * s, 0.04 * s);
    ctx.lineTo(0.92 * s, 0.36 * s);
    ctx.quadraticCurveTo(0.03 * s, 0.52 * s, -0.84 * s, 0.36 * s);
    ctx.closePath(); ctx.fill();

    /* arms */
    ctx.fillStyle = '#1d141b';
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(-0.98 * s, -0.6 * s, 0.24 * s, 0.72 * s, 0.09 * s); ctx.fill();
      ctx.beginPath(); ctx.roundRect(0.8 * s, -0.6 * s, 0.24 * s, 0.72 * s, 0.09 * s); ctx.fill();
    } else {
      ctx.fillRect(-0.98 * s, -0.6 * s, 0.24 * s, 0.72 * s);
      ctx.fillRect(0.8 * s, -0.6 * s, 0.24 * s, 0.72 * s);
    }

    /* feet */
    ctx.fillStyle = '#120e14';
    ctx.fillRect(-0.7 * s, 0.38 * s, 0.12 * s, 0.4 * s);
    ctx.fillRect(0.6 * s, 0.38 * s, 0.12 * s, 0.4 * s);

    ctx.restore();
  }

  /* an 8-bit heart, drawn as blocks — the same shape their hearts use */
  var HEART = [
    '.XX.XX.',
    'XXXXXXX',
    'XXXXXXX',
    '.XXXXX.',
    '..XXX..',
    '...X...'
  ];
  function pixelHeart(ctx, x, y, px, col, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = col; ctx.shadowBlur = px * 2.2; }
    ctx.fillStyle = col;
    for (var r = 0; r < HEART.length; r++) {
      for (var c = 0; c < HEART[r].length; c++) {
        if (HEART[r][c] !== 'X') continue;
        ctx.fillRect(Math.round(x + (c - 3.5) * px), Math.round(y + (r - 3) * px),
          Math.ceil(px), Math.ceil(px));
      }
    }
    ctx.restore();
  }

  function shadow(ctx, x, y, w, h, a) {
    var g = ctx.createRadialGradient(x, y, 1, x, y, w);
    g.addColorStop(0, 'rgba(0,0,0,' + (a || 0.55) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, h / w); ctx.translate(-x, -y);
    ctx.beginPath(); ctx.arc(x, y, w, 0, TAU); ctx.fill();
    ctx.restore();
  }

  root.FlyArt = {
    drawFly: drawFly, drawChair: drawChair, wing: wing, leg: leg, shadow: shadow,
    pixelHeart: pixelHeart,
    EYE_RED: EYE_RED, EYE_GREEN: EYE_GREEN
  };
})(typeof window !== 'undefined' ? window : this);

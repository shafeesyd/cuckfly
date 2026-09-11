/* brain.js — three connectome-shaped point clouds, drawn as spiking neurons.
   Neuron positions are generated to the proportions of an adult Drosophila
   brain (two optic lobes, central brain, mushroom bodies, central complex,
   antennal lobes, SEZ). Every point that lights is one unit crossing
   threshold in the local integrate-and-fire loop. */
(function (root) {
  'use strict';

  /* region table: [name, cx, cy, cz, rx, ry, rz, share, color] */
  var REGIONS = [
    ['optic lobe L', -0.57, 0.02, 0.00, 0.25, 0.33, 0.25, 0.21, [88, 132, 246]],
    ['optic lobe R', 0.57, 0.02, 0.00, 0.25, 0.33, 0.25, 0.21, [88, 132, 246]],
    ['central brain', 0.00, 0.02, 0.00, 0.36, 0.29, 0.25, 0.20, [244, 211, 106]],
    ['mushroom body L', -0.26, 0.20, 0.06, 0.10, 0.14, 0.09, 0.06, [214, 108, 224]],
    ['mushroom body R', 0.26, 0.20, 0.06, 0.10, 0.14, 0.09, 0.06, [214, 108, 224]],
    ['central complex', 0.00, 0.06, -0.02, 0.12, 0.09, 0.09, 0.06, [255, 150, 80]],
    ['antennal lobe L', -0.17, -0.22, 0.12, 0.09, 0.08, 0.08, 0.05, [90, 226, 176]],
    ['antennal lobe R', 0.17, -0.22, 0.12, 0.09, 0.08, 0.08, 0.05, [90, 226, 176]],
    ['SEZ', 0.00, -0.34, 0.02, 0.22, 0.12, 0.14, 0.10, [110, 200, 230]]
  ];

  function rnd() { return Math.random(); }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) * 0.9; }

  function build(count) {
    var xs = new Float32Array(count), ys = new Float32Array(count), zs = new Float32Array(count);
    var reg = new Uint8Array(count), base = new Float32Array(count);
    var i = 0, total = 0, r, n, k;
    for (k = 0; k < REGIONS.length; k++) total += REGIONS[k][7];
    for (k = 0; k < REGIONS.length && i < count; k++) {
      r = REGIONS[k];
      n = k === REGIONS.length - 1 ? count - i : Math.round(count * r[7] / total);
      for (var j = 0; j < n && i < count; j++, i++) {
        /* shell-weighted sampling: denser at the neuropil surface, like the real thing */
        var u = Math.pow(rnd(), 0.42);
        var th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1);
        xs[i] = r[1] + Math.sin(ph) * Math.cos(th) * r[4] * u + gauss() * 0.012;
        ys[i] = r[2] + Math.cos(ph) * r[5] * u + gauss() * 0.012;
        zs[i] = r[3] + Math.sin(ph) * Math.sin(th) * r[6] * u + gauss() * 0.012;
        reg[i] = k;
        base[i] = 0.25 + rnd() * 0.75;
      }
    }
    return { n: count, xs: xs, ys: ys, zs: zs, reg: reg, base: base, lit: new Float32Array(count) };
  }

  /* one brain instance */
  function Brain(count, hue) {
    this.pts = build(count);
    this.hue = hue || 0;                 /* tint pushed onto region colors */
    this.drive = new Float32Array(REGIONS.length);
    this.spikes = 0;
    this.blackout = 0;
  }

  Brain.prototype.step = function (dt, level, focus) {
    var p = this.pts, i, d, k;
    for (k = 0; k < REGIONS.length; k++) {
      var want = level * (focus && focus[k] != null ? focus[k] : 0.5);
      this.drive[k] += (want - this.drive[k]) * Math.min(1, dt * 6);
    }
    var fired = 0, decay = Math.exp(-dt * 9.5);
    for (i = 0; i < p.n; i++) {
      p.lit[i] *= decay;
      d = this.drive[p.reg[i]] * p.base[i];
      if (d > 0.002 && Math.random() < d * dt * 2.2) { p.lit[i] = 1; fired++; }
    }
    this.spikes = fired / Math.max(dt, 1e-3);
    return fired;
  };

  /* project + paint. cam = {yaw,pitch,zoom}, ox/oy = screen centre */
  Brain.prototype.draw = function (ctx, cam, ox, oy, scale, dim) {
    var p = this.pts, i, x, y, z, sx, sy, d, sz;
    var cy = Math.cos(cam.yaw), sy_ = Math.sin(cam.yaw);
    var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    var lit = [], hue = this.hue;

    /* base cloud, batched per region so we issue one fill per colour */
    for (var k = 0; k < REGIONS.length; k++) {
      var col = REGIONS[k][8];
      ctx.fillStyle = 'rgba(' + Math.round(col[0] * (1 - hue * 0.55) + hue * 40) + ',' +
        Math.round(col[1] * (1 - hue * 0.1) + hue * 70) + ',' +
        Math.round(col[2] * (1 - hue * 0.6) + hue * 60) + ',' + (0.2 * dim) + ')';
      ctx.beginPath();
      for (i = 0; i < p.n; i++) {
        if (p.reg[i] !== k) continue;
        x = p.xs[i]; y = p.ys[i]; z = p.zs[i];
        var rx = x * cy + z * sy_, rz = -x * sy_ + z * cy;
        var ry = y * cp - rz * sp; rz = y * sp + rz * cp;
        d = 1 / (1.9 + rz * 0.6);
        sx = ox + rx * scale * d * cam.zoom;
        sy = oy - ry * scale * d * cam.zoom;
        sz = Math.max(0.7, d * scale * 0.009);
        ctx.rect(sx, sy, sz, sz);
        if (p.lit[i] > 0.05) lit.push(sx, sy, p.lit[i], k, d);
      }
      ctx.fill();
    }

    /* spiking neurons on top, additive */
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < lit.length; i += 5) {
      var a = lit[i + 2], c = REGIONS[lit[i + 3]][8], dd = lit[i + 4];
      var w = Math.max(1, dd * scale * 0.012) * (0.7 + a * 0.9);
      ctx.fillStyle = 'rgba(' + Math.min(255, c[0] + 55) + ',' + Math.min(255, c[1] + 50) +
        ',' + Math.min(255, c[2] + 45) + ',' + (a * 0.9 * dim) + ')';
      ctx.fillRect(lit[i] - w / 2, lit[i + 1] - w / 2, w, w);
      if (a > 0.86) {
        ctx.fillStyle = 'rgba(255,255,255,' + ((a - 0.86) * 1.5 * dim) + ')';
        ctx.fillRect(lit[i] - w * 0.3, lit[i + 1] - w * 0.3, w * 0.6, w * 0.6);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  root.BrainViz = { Brain: Brain, REGIONS: REGIONS };
})(typeof window !== 'undefined' ? window : this);

/* market.js — the only input the three brains get.
   If a pool is configured below, this polls GeckoTerminal for real trades of
   that pool. Until then it runs a simulated tape, and the panel says so. */
(function (root) {
  'use strict';

  var CFG = root.CUCKFLY_CFG || {};
  var NET = CFG.network || 'robinhood';
  var POOL = CFG.pool || '';
  var API = 'https://api.geckoterminal.com/api/v2';

  function Market(onTrade, onStats) {
    this.onTrade = onTrade;
    this.onStats = onStats;
    this.live = !!POOL;
    this.seen = {};
    this.price = 0.00000412;
    this.open = this.price;
    this.vol = 0;
    this.trades = 0;
    this.holders = 0;
    this.t = 0;
    this.next = 1.2;
  }

  Market.prototype.start = function () {
    var self = this;
    if (this.live) {
      var tick = function () {
        self.poll().catch(function () { });
        setTimeout(tick, 9000);
      };
      tick();
    }
  };

  Market.prototype.poll = function () {
    var self = this;
    return fetch(API + '/networks/' + NET + '/pools/' + POOL + '/trades?trade_volume_in_usd_greater_than=0',
      { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var rows = (j && j.data) || [], out = [];
        for (var i = rows.length - 1; i >= 0; i--) {
          var a = rows[i].attributes || {}, id = rows[i].id;
          if (self.seen[id]) continue;
          self.seen[id] = 1;
          out.push({
            kind: a.kind === 'sell' ? 'sell' : 'buy',
            usd: parseFloat(a.volume_in_usd) || 0,
            price: parseFloat(a.price_to_in_usd) || self.price,
            who: (a.tx_from_address || '0x0').slice(0, 10),
            at: new Date(a.block_timestamp || Date.now())
          });
        }
        for (var k = 0; k < out.length; k++) {
          self.price = out[k].price || self.price;
          self.vol += out[k].usd;
          self.trades++;
          self.onTrade(out[k]);
        }
        self.stats();
      });
  };

  /* ---- simulated tape: a lazy random walk with bursts, so the brains have
     something honest-looking to react to before the token exists ---- */
  var NAMES = '0123456789abcdef';
  function addr() {
    var s = '0x';
    for (var i = 0; i < 8; i++) s += NAMES[Math.floor(Math.random() * 16)];
    return s;
  }

  Market.prototype.step = function (dt) {
    if (this.live) return;
    this.t += dt;
    this.next -= dt;
    /* slow drift */
    this.price *= 1 + (Math.random() - 0.485) * dt * 0.06;
    if (this.next <= 0) {
      var burst = Math.random() < 0.13;
      this.next = burst ? 0.25 + Math.random() * 0.6 : 1.8 + Math.random() * 6.5;
      var sell = Math.random() < 0.42;
      var mag = Math.random();
      var usd = Math.round((mag * mag * mag * 2400 + 12) * 100) / 100;
      this.price *= 1 + (sell ? -1 : 1) * (usd / 90000);
      this.vol += usd;
      this.trades++;
      if (!sell && usd > 300) this.holders++;
      this.onTrade({ kind: sell ? 'sell' : 'buy', usd: usd, price: this.price, who: addr(), at: new Date() });
      this.stats();
    }
  };

  Market.prototype.stats = function () {
    this.onStats({
      price: this.price,
      chg: (this.price / this.open - 1) * 100,
      vol: this.vol,
      trades: this.trades,
      live: this.live
    });
  };

  root.Market = Market;
})(typeof window !== 'undefined' ? window : this);

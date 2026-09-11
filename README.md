# CUCK FLY

**Three whole fly brains, live. Two of them are fucking. The third one is in the chair.**

A companion piece to [SEX FLY](https://www.sexfly.tech/): same room, same senses, same
dopamine, one more brain — wired to feel everything the couple does and given no body to
use. He sits in the chair. His descending neurons fire into nothing. His turn never comes,
and the counter that would record it is never written to.

Live at **[cuckfly.netlify.app](https://cuckfly.netlify.app/)**.

`cuckfly.tech` is already configured as the site's custom domain on Netlify — it goes live
as soon as the domain's DNS points at Netlify (`A 75.2.60.5`, or the Netlify name servers).
When it does, swap the four social URLs at the top of `index.html` from `cuckfly.netlify.app`
to `cuckfly.tech`; they are marked with a comment.

---

## What the site does

- **Three connectome-shaped point clouds** (hers, his, the cuck's) drawn on one canvas at
  60 fps, front-facing with a slow sway, drag to rotate. Every flash is one unit crossing
  threshold in a leaky integrate-and-fire loop; region colours follow the real neuropils
  (optic lobes, central brain, mushroom bodies, central complex, antennal lobes, SEZ).
- **The body scene**: the couple, and the chair, drawn at the correct relative scale. The
  cuck trembles with humiliation, half-stands when hope hits 1.0, and sits back down.
- **The panel** reads the same state the renderer does — her descending drives, his vitals,
  the cuck's nine channels (humiliation, arousal, jealousy, hope, cope, freeze, tears,
  note-taking, and the stand-up command that reaches no body), plus a feed where every
  trade produces one line for the couple and one for the cuck.

## Repository

```
index.html          the whole page
config.js           contract address, pool, X link — edit this at launch
css/style.css
js/flyart.js        fly + chair renderer, shared with the graphics generator
js/brain.js         neuron cloud: generation, spiking, projection
js/market.js        GeckoTerminal reader, with a simulated tape until launch
js/app.js           state, the trade→sense map, the loop, the panel
ARTICLE.txt         the long-form piece, plain text (edit this one)
ARTICLE-X.txt       the same piece with Unicode bold, rules and bullets — paste this
tools/banner.html   regenerates static/banner.png, og.png and pfp.png
static/             banner (1500×500), og card (1200×630), profile picture (400×400)
netlify.toml
```

No build step, no dependencies, no bundler. It is static files.

## Going live with the token

Edit `config.js` and redeploy:

```js
window.CUCKFLY_CFG = {
  ca:   '0x…',        // shown in the top bar, click to copy
  pool: '0x…',        // GeckoTerminal pool address — set it and the feed goes live
  network: 'robinhood',
  x: 'https://x.com/yourhandle'
};
```

With `pool` empty the market section runs a simulated tape and says so, in the panel and in
the About page. With `pool` set, `js/market.js` polls GeckoTerminal every nine seconds and
every real trade lands in three brains.

## The article

`ARTICLE.txt` is the source. `ARTICLE-X.txt` is what you paste: X posts have no bold button,
so headings, the market-event keys and the key lines are converted to Unicode Mathematical
Sans-Serif Bold, which survives a paste into X, Telegram, Discord and Notion. Rebuild it
after any edit:

```bash
python3 tools/build-x-article.py
```

Two things to know about that trick: screen readers announce those glyphs character by
character or skip them, and X's search does not index them as the plain words. At ~14,000
characters the piece fits a single long post on X Premium; without Premium it needs to be a
thread.

## Regenerating the graphics

Serve the repo and open `tools/banner.html` — it draws the banner, the OG card and the
profile picture from the same renderer the site uses. It also renders two crop previews that
are not exported to `static/`: the avatar inside the circle X crops it to, and the header
with X's trim and the avatar overlay drawn on top, so the safe area can be checked rather
than guessed at. To write them to disk, run any local
endpoint that accepts a POSTed data URL on `127.0.0.1:8898`, or right-click each canvas and
save it.

## Local development

```bash
python3 -m http.server 8899
```

Then open <http://localhost:8899/>. `window.CF` exposes `{ X, brains, frame }` for poking at
the state from the console.

Deploying:

```bash
netlify deploy --prod --dir .
```

## Credits

Connectome shape and region layout after FlyWire (Dorkenwald et al., Schlegel et al.,
*Nature* 2024). Model after Shiu et al., *Nature* 2024. Bodies after NeuroMechFly v2
(Lobato-Rios et al., Wang-Chen et al., EPFL). Brain and body rendering is canvas 2D, in the
browser.

CUCK FLY is a parody companion to SEX FLY and is not affiliated with it.

// ── Focus — marketing site v4 (clean rebuild) ────────────────
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initMagnetic } from './cursor.js';
import { runPreloader } from './preloader.js';
import { initGrid } from './grid.js';
import { initHeroGradient } from './heroGradient.js';
import { initJourney } from './journey.js';
import { initNotifications, initNumbersGrid } from './notifications.js';
import { initStoryboard } from './storyboard.js';
import { initContact } from './contact.js';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

// 22 identity stages (aligned with CLAUDE.md / SelfMetricsService)
const STAGES = [
  { n:  1, name: 'The Restless' },     { n:  2, name: 'The Curious' },
  { n:  3, name: 'The Apprentice' },   { n:  4, name: 'The Practitioner' },
  { n:  5, name: 'The Devoted' },      { n:  6, name: 'The Steadfast' },
  { n:  7, name: 'The Anchored' },     { n:  8, name: 'The Grounded' },
  { n:  9, name: 'The Intentional' },  { n: 10, name: 'The Unshaken' },
  { n: 11, name: 'The Aligned' },      { n: 12, name: 'The Embodied' },
  { n: 13, name: 'The Keeper' },       { n: 14, name: 'The Sentinel' },
  { n: 15, name: 'The Warden' },       { n: 16, name: 'The Architect' },
  { n: 17, name: 'The Deepened' },     { n: 18, name: 'The Radiant' },
  { n: 19, name: 'The Sovereign' },    { n: 20, name: 'The Ascendant' },
  { n: 21, name: 'The Eternal' },      { n: 22, name: 'The Luminous' },
];

const PARAMS = new URLSearchParams(location.search);
const QA = PARAMS.has('qa');
// ?native=1 — bypass Lenis and scroll natively (compositor-driven). The
// definitive A/B for scroll feel: with Lenis, every scrolled frame is produced
// by JavaScript on the main thread, so ANY long frame stalls the page itself;
// native scroll can never be blocked by script. All ScrollTriggers work
// unchanged either way (they read the real scroll position).
const NATIVE = PARAMS.has('native');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// shared state between setupModeInteractions and setupModesMosaic
let _hoverCat = null;
let _mosaicCards = [];

// ─── entry ──────────────────────────────────────────────────
async function init() {
  if (!QA) await runPreloader();
  else document.getElementById('preloader')?.classList.add('is-done');

  // Lenis smooth scroll — driven from the GSAP ticker so the scroll write and
  // the tweens share one clock. Skipped for reduced-motion AND for ?native=1
  // (see NATIVE above) — every consumer already handles lenis === null.
  //
  // NOTE: deliberately NOT wired as lenis.on('scroll', ScrollTrigger.update).
  // Lenis here runs in native-scroll mode, so every scroll it animates emits a
  // real window scroll event — which ScrollTrigger's own built-in listener
  // already handles. Adding the explicit hook made every ScrollTrigger update
  // pass run ~2× per frame (measured in a trace: the internal update fn showed
  // ~1.9 calls/frame), doubling every scrubbed callback and style write on the
  // scroll path, sitewide.
  if (!reduced && !NATIVE) {
    // lerp 0.09 -> 0.12: a lower lerp means the displayed scroll position
    // takes longer to converge on the real target, so any main-thread frame
    // that runs long (style recalc, paint, GC) leaves more catch-up distance
    // for Lenis to visibly correct over the following frames — that
    // correction IS the jitter. A slightly higher lerp shortens that window
    // without giving up the smoothing glide entirely.
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initMagnetic();
  setupAnchors();
  setupKickerRings();
  setupShimmerGating();
  setupFlowDemo();
  setupReveals();
  setupScrollHeadlines();
  setupSlider();
  setupCostReveal();
  setupProblemReveal();
  setupModes();
  setupModeInteractions();
  setupModesMosaic();
  setupMosaicVelocity();
  setupTilt();
  setupHeroDevices();
  navAndProgress();
  setupNavLinks();
  setupMobileNav();
  initContact(lenis);

  initHeroGradient(document.getElementById('hero-aura'));
  initGrid(document.getElementById('hero-grid'));
  initStoryboard(document.getElementById('overview'), gsap, lenis, ScrollTrigger);
  initJourney(document.getElementById('journeyDeck'), STAGES, gsap, ScrollTrigger, lenis);
  initNotifications(document.getElementById('problem'));
  initNumbersGrid(document.getElementById('numbers'));

  revealHero();
  setupHeroAtmosphere();
  setupMeetFocusHandoff();
  setupMeetFocusSheet();
  setupMeetFocusBaseline();
  setupPairHandshake();
  setupPaperDim();
  ScrollTrigger.refresh();
  // Webfonts (font-display: swap) can still be in flight here — a late swap
  // reflows text and staggers every cached trigger boundary sitewide. Re-measure
  // once they settle so nothing jitters into place mid-scroll.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// ─── flow demo iframe — deferred one-shot load ──────────────
// The embedded "Live flow" demo (focus-flow.html) is a self-playing generated
// bundle (a design-tool export, not hand-maintained — its internals aren't
// something to patch) with its own animation loop.
//
// Earlier this observer also UNLOADED the iframe (src='about:blank') when it
// scrolled out of range, to reclaim the loop's cost — but a trace showed the
// real price of that: the bundle is ~650KB and re-parses/compiles (~100ms hard
// freeze) EVERY time it re-enters, so scrolling up and down past #block
// thrashed it (four 100ms hitches in one pass). Unloading it traded a small
// steady cost for repeated freezes — a bad deal for anyone who scrolls around.
//
// So: load it exactly ONCE, the first time it nears the viewport (keeps the
// heavy parse off the initial page load) — and from then on FREEZE it instead
// of unloading. The iframe is same-origin, so we wrap its window's
// requestAnimationFrame: while frozen, callbacks queue instead of scheduling
// (the demo's rAF-driven loop stops dead, and with it the React renders it
// feeds); on re-entry the queued callbacks flush through the real rAF and the
// loop resumes exactly where it left off. No reload, no re-parse, no freeze.
function setupFlowDemo() {
  const iframe = document.querySelector('.focus-flow-frame');
  const src = iframe?.dataset.src;
  if (!iframe || !src) return;

  let frozen = false, queue = [], resume = null;
  iframe.addEventListener('load', () => {
    const w = iframe.contentWindow;
    if (!w || w.__ffPatched) return;
    w.__ffPatched = true;
    const real = w.requestAnimationFrame.bind(w);
    w.requestAnimationFrame = (cb) => {
      if (frozen) { queue.push(cb); return -1; }
      return real(cb);
    };
    resume = () => {
      const q = queue; queue = [];
      q.forEach((cb) => real(cb));
    };
  });

  let loaded = false;
  const load = () => { if (!loaded) { loaded = true; iframe.src = src; } };

  // Load during genuine idle time, disconnected from scroll entirely — a real
  // trace showed this bundle's first parse/compile costing ~100ms of main-
  // thread time, and #block sits immediately after Inside Focus, so the old
  // "load within 150px of the viewport" trigger fired that ~100ms freeze
  // WHILE the user was actively mid-scroll through that exact transition
  // (the reported jitter there). requestIdleCallback explicitly only runs
  // once the browser has spare time and yields to any real work/input, so
  // this pays the cost while the visitor is just reading the hero — by the
  // time they scroll anywhere near #block, it's already done. The timeout
  // is a safety net for a tab that's never truly idle (e.g. the WebGL/canvas
  // loops keep the thread lightly busy); Safari has no requestIdleCallback,
  // so it gets a fixed delay instead.
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 6000 });
  else setTimeout(load, 2500);

  // Safety net for a very fast scroller who reaches #block before the idle
  // callback above has fired — same proximity-based load as before, now just
  // a fallback rather than the primary trigger. Freeze/resume (unaffected)
  // still gates the iframe's own rAF loop while it's off-screen either way.
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      load();
      if (frozen) { frozen = false; if (resume) resume(); }
    } else if (loaded) {
      frozen = true;
    }
  }, { rootMargin: '150px 0px' });
  io.observe(iframe);
}

// ─── shimmer gating — pause the af-shimmer lime sheen off-screen ──
// The overview and journey headlines carry a clipped-gradient "lime" word that
// loops forever via CSS animation (af-shimmer). A gradient clipped to text
// can't be composited — every tick repaints those glyphs — so an infinite
// loop with no gate keeps costing frames even scrolled far away. Same fix as
// the turn-bob idle phone: toggle a class while the section is anywhere near
// the viewport and let CSS pause the animation outside that window.
function setupShimmerGating() {
  if (reduced) return;
  ['overview', 'journey'].forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: 'top bottom', end: 'bottom top',
      toggleClass: { targets: section, className: 'is-in-view' },
    });
  });
}

// ─── hero atmosphere — dissolve grid + glow as the hero scrolls away ──
// Scrubs --hero-atmo 1→0 across the hero's scroll so the grid + glow fade
// and drift up, melting into the next section instead of clipping at the seam.
function setupHeroAtmosphere() {
  const hero = document.getElementById('hero');
  if (!hero || reduced) return;
  gsap.fromTo(hero,
    { '--hero-atmo': 1 },
    {
      '--hero-atmo': 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    }
  );
}

// ─── cost → Meet Focus cover/stack handoff ──────────────────
// The cost section pins (see the #numbers sticky media query in style.css)
// while the Meet Focus intro rises up over it as the reveal. Here we scrub the
// cost content receding — a slight sink + fade — so it reads as the cost
// section sinking back beneath Meet Focus rather than a flat scroll-away. The
// scrub range is the cost section's own scroll height, which is exactly how
// far Meet Focus travels to fully cover it (height-agnostic). Gated to the
// same desktop threshold as the CSS stick; touch / reduced-motion skip it.
function setupMeetFocusHandoff() {
  const numbers = document.getElementById('numbers');
  if (!numbers || reduced) return;
  if (!matchMedia('(min-width: 861px) and (hover: hover)').matches) return;
  const wrap = numbers.querySelector('.numbers__wrap');
  if (!wrap) return;
  gsap.to(wrap, {
    scale: 0.94,
    opacity: 0,
    yPercent: -3,
    transformOrigin: '50% 42%',
    ease: 'none',
    scrollTrigger: { trigger: numbers, start: 'top top', end: 'bottom top', scrub: true },
  });
}

// ─── Meet Focus — the iOS-sheet presentation ────────────────
// The cream section rises like an iOS sheet over the receding cost section:
// --dock (0→1 across the rise) relaxes the sheet's top corners flat and fades
// the phone's halo in; the phone itself travels with mass — arriving a beat
// behind the sheet on a flattening perspective — and the screen blooms once as
// everything docks. Runs on touch too (the corner/perspective read works as a
// plain scroll reveal without the cover); reduced-motion gets the resting state.
function setupMeetFocusSheet() {
  const turn = document.getElementById('turn');
  if (!turn) return;

  // nav flips to its paper variant while the cream sheet is under it. 'center
  // center' is the exit dim's midpoint (the section pins full-screen, so its
  // centre reaching the viewport centre is ~50% through the runway), so the
  // chrome flips back to dark exactly as the surface crosses from light to dark.
  ScrollTrigger.create({
    trigger: turn, start: 'top 66px', end: 'center center',
    toggleClass: { targets: '#nav', className: 'nav--paper' },
  });

  // Gate the phone image's continuous idle bob (CSS animation, see turn-bob) to
  // only run while the section is anywhere near the viewport — an infinite
  // animation has no reason to keep the compositor ticking while scrolled away.
  ScrollTrigger.create({
    trigger: turn, start: 'top bottom', end: 'bottom top',
    toggleClass: { targets: turn, className: 'is-in-view' },
  });

  if (reduced) return; // CSS default --dock:1 renders the docked state

  turn.style.setProperty('--dock', '0');
  let lastDock = '';
  const setDock = (self) => {
    const v = self.progress.toFixed(3);
    if (v === lastDock) return;
    lastDock = v;
    turn.style.setProperty('--dock', v);
  };
  ScrollTrigger.create({
    trigger: turn, start: 'top bottom', end: 'top top', scrub: true,
    onUpdate: setDock, onRefresh: setDock,
  });

  const media = turn.querySelector('.turn__media');
  if (media) {
    gsap.fromTo(media,
      { yPercent: 12, rotateX: 14, scale: 0.95 },
      {
        yPercent: 0, rotateX: 0, scale: 1, ease: 'none',
        transformPerspective: 1400, transformOrigin: '50% 100%',
        scrollTrigger: { trigger: turn, start: 'top bottom', end: 'top top', scrub: true },
      });
  }

  const bloom = turn.querySelector('.turn__bloom');
  if (bloom) {
    ScrollTrigger.create({
      trigger: turn, start: 'top 12%', once: true,
      onEnter: () => gsap.timeline()
        .to(bloom, { opacity: 0.5, duration: 0.45, ease: 'power2.out' })
        .to(bloom, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }),
    });
  }
}

// ─── Meet Focus baseline — staged statement + subtext reveal ────────
// The bottom pairing rises in two beats as the section scrolls up into its
// lock: the heavy claim line first, the quiet note after. One scrub across the
// entry window (top bottom → top top, the same runway the phone rises on) is
// split into two overlapping sub-progresses — left over 0–0.55, right over
// 0.45–1.0 — each eased out and written to --lp / --rp on .turn__baseline. Both
// finish before 'top top' (the lock), so the staging is complete before the
// brightness-dim runway begins and never fights the paper→dark crossfade.
//
// Perf: the two vars only drive opacity + translateY on the .turn__clip inners
// (composited), and each value is quantised and skipped when unchanged, so a
// scrubbed frame invalidates at most the one or two blocks mid-transition —
// same discipline as setDock / the word-fill headlines.
function setupMeetFocusBaseline() {
  const base = document.querySelector('.turn__baseline');
  if (!base || reduced) return; // CSS default --lp/--rp = 1 renders the shown state

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const sub = (p, lo, hi) => easeOut(Math.min(1, Math.max(0, (p - lo) / (hi - lo))));

  base.style.setProperty('--lp', '0');
  base.style.setProperty('--rp', '0');

  let lastL = '', lastR = '';
  const apply = (self) => {
    const p = self.progress;
    const l = sub(p, 0, 0.55).toFixed(2);
    const r = sub(p, 0.45, 1).toFixed(2);
    if (l !== lastL) { lastL = l; base.style.setProperty('--lp', l); }
    if (r !== lastR) { lastR = r; base.style.setProperty('--rp', r); }
  };

  ScrollTrigger.create({
    trigger: document.getElementById('turn'),
    start: 'top bottom', end: 'top top', scrub: true,
    onUpdate: apply, onRefresh: apply,
  });
}

// ─── blocking section — the handshake ─────────────────────────
// One narrative beat, played once as #block settles into view: the iPhone
// mockup (the same block, on the phone) rises at the browser's lower-left
// corner, the keyline breathes once, and the Paired chip settles onto the
// chrome. Cause → effect; the pairing explains itself.
//
// CSS holds the SETTLED state (reduced-motion / no-JS renders the finished
// scene); this sets the hidden initial states only when it will animate —
// the same pattern as --dock / --lp. Everything tweened is transform /
// opacity (composited), and the trigger is once:true so nothing lives on the
// scroll path afterwards.
function setupPairHandshake() {
  const block = document.getElementById('block');
  if (!block || reduced) return;

  const phone  = block.querySelector('.pair-phone');
  const chip   = block.querySelector('.pair-chip');
  const flash  = block.querySelector('.block__flash');
  if (!phone) return;

  gsap.set(phone, { y: 22, autoAlpha: 0 });
  gsap.set(chip,  { scale: .95, autoAlpha: 0 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: block, start: 'top 55%', once: true },
  });
  tl.to(phone, { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out' });
  if (flash) {
    tl.to(flash, { opacity: 1, duration: .18, ease: 'power2.out' }, 0.45);
    tl.to(flash, { opacity: 0, duration: .7, ease: 'power2.inOut' }, 0.65);
  }
  tl.to(chip, { scale: 1, autoAlpha: 1, duration: .22, ease: 'power3.out' }, 0.55);
}

// ─── paper → Inside Focus: the locked brightness dim ────────
// The exit is not a boundary — the paper itself dims, like screen brightness
// turning down. On desktop the stage pins full-screen (CSS sticky) and the
// section's extra height is a scroll runway; this timeline scrubs across that
// runway with a settle hold at each end: content sits fully visible before the
// dim starts, and reaches full dark before the lock releases.
//
// Performance shape: the surface dim is the .turn__veil element's OPACITY — a
// solid #141414 layer over the paper (and its dot/grain textures) but under
// the content. Opacity is compositor-only, so the full-screen crossfade costs
// zero repaint. The previous approach tweened --from/--to, which re-shaded the
// whole viewport gradient on every scrubbed frame — the biggest single paint
// cost at this boundary. Only the ink triplet (text) and --paper-accent still
// tween as vars, because text colour has to actually repaint — but those are
// small glyph areas, not the screen. Dark meets dark at the end — no seam.
function setupPaperDim() {
  const turn = document.getElementById('turn');
  if (!turn || reduced) return;
  const veil = turn.querySelector('.turn__veil');
  // --paper-ink/--paper-accent inherit down to their consumers (kicker, ring,
  // headline, body copy) — a real trace showed each write forcing a 20ms+
  // style recalc, because the vars were set on #turn and inheritance made the
  // browser reconsider EVERY descendant, including .turn__baseline (a sibling
  // subtree that never reads them). @property + inherits:false was tried and
  // rejected: it breaks the very cascade this code depends on (verified live —
  // descendants freeze at the initial value instead of tracking the scrub).
  // Writing to .turn__inner instead keeps the cascade working but excludes
  // .turn__baseline from the inheritance check — smaller blast radius, same
  // visual result.
  const inkTarget = turn.querySelector('.turn__inner') || turn;

  const locked = matchMedia('(min-width: 861px) and (hover: hover)').matches;
  // locked: scrub across the pin runway (top top → bottom bottom of the tall
  // region). free (touch): scrub as the section leaves, no lock.
  const trigger = locked
    ? { trigger: turn, start: 'top top', end: 'bottom bottom', scrub: 0.5 }
    : { trigger: turn, start: 'top top', end: 'bottom top', scrub: 0.5 };

  const tl = gsap.timeline({ scrollTrigger: trigger });
  tl.to({}, { duration: locked ? 0.12 : 0.04 });   // settle — fully visible first
  tl.to(inkTarget, {
    '--paper-ink': '235, 238, 242',
    '--paper-accent': '#BFFF47',
    // stepped, not continuous: every write invalidates style for the subtree
    // reading it and forces a glyph repaint. A smooth tween does that on every
    // scrubbed frame; 14 discrete steps is imperceptible for a colour ramp but
    // cuts the repaint count by an order of magnitude. The veil's opacity fade
    // (below) stays perfectly smooth — opacity is compositor-only, no such cost.
    ease: 'steps(14)', duration: locked ? 0.76 : 0.92,
  });
  if (veil) tl.to(veil, { opacity: 1, ease: 'none', duration: locked ? 0.76 : 0.92 }, '<');
  if (locked) tl.to({}, { duration: 0.12 });        // hold full-dark before release
}

// ─── anchor scroll — Lenis when available, fallback otherwise ──
function setupAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 });
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Move keyboard focus to the target (a no-op on non-focusable targets,
      // since .focus() only does anything on elements with tabindex or that
      // are natively focusable) — otherwise clicking the skip-link scrolls
      // the page but leaves focus behind, defeating its purpose.
      el.focus({ preventScroll: true });
    });
  });
}

// ─── problem statement — pinned word-by-word colour fill ────────────
// The original reveal, unchanged: every word starts dim and fills to full
// colour as the user scrolls (lime words fade via their own colour so the
// gradient shows through). On desktop the section pins so the scroll drives
// the fill in place, releasing once every word has landed. Touch / small
// screens run the same fill without locking scroll.
function setupProblemReveal() {
  const section = document.getElementById('problem');
  if (!section) return;
  const els = section.querySelectorAll('.problem__line');
  if (!els.length) return;

  // Collect every word from all lines as one continuous sequence. The paint
  // target (the .lime child, if any) is resolved ONCE — the fill used to run
  // a querySelector per word per scrolled frame — and each word remembers its
  // last painted alpha (quantised) so unchanged words cost nothing: per frame
  // only the 2–3 words actually mid-transition invalidate style/paint.
  const allWords = [];
  els.forEach((el) => splitWords(el).forEach((w) => {
    const lime = w.querySelector('.lime');
    const target = lime || w;
    // Colour is set ONCE, fixed — the fill below drives opacity, not colour
    // alpha. Same fade against a flat background, but opacity is
    // compositor-only (no glyph repaint per word per scrubbed frame).
    target.style.color = `rgb(${lime ? '191,255,71' : '230,235,241'})`;
    allWords.push({ el: target, last: -1 });
  }));

  const paint = (w, alpha) => {
    const q = Math.round(alpha * 100);
    if (q === w.last) return;
    w.last = q;
    w.el.style.opacity = q / 100;
  };

  // Each word lights up in sequence, tied to scroll progress (0–1).
  const fill = (p) => {
    allWords.forEach((w, i) => {
      // word 0 must start at p=0 (no negative head-start) so it returns to dim
      // when scrolled back to the top; ~1.2-word overlap keeps the sweep smooth
      const lo = i / allWords.length;
      const hi = (i + 1.2) / allWords.length;
      const t  = Math.max(0, Math.min(1, (p - lo) / (hi - lo)));
      const a  = 1 - Math.pow(1 - t, 3); // cubic ease-out so each fill feels snappy
      paint(w, 0.18 + a * 0.82);
    });
  };

  // Start everything dim.
  allWords.forEach((w) => paint(w, 0.18));

  // --hold is consumed ONLY by the ring inside .problem__kicker, but it used
  // to be written to the SECTION root — which invalidated style for the whole
  // #problem subtree (including the entire notification noise field, ~100+
  // elements) on every step of the pinned hold. Writing it on the kicker
  // scopes each invalidation to a handful of elements.
  const kicker = section.querySelector('.problem__kicker') || section;

  // Skip animation for reduced motion — full colour, hold ring complete.
  if (reduced) {
    allWords.forEach((w) => paint(w, 1));
    kicker.style.setProperty('--hold', 1);
    return;
  }

  // Kicker fades in as the section approaches.
  gsap.fromTo('.problem__kicker',
    { opacity: 0 },
    { opacity: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 55%', scrub: 0.8 } }
  );

  const canHold = matchMedia('(min-width: 861px) and (hover: hover)').matches;

  // Mobile / touch: word fill as the section scrolls through, no hold.
  let lastHold = '';
  const setHold = (p) => {
    const v = p.toFixed(2);
    if (v === lastHold) return;
    lastHold = v;
    kicker.style.setProperty('--hold', v);
  };
  if (!canHold) {
    ScrollTrigger.create({
      trigger: section, start: 'top 78%', end: 'top 12%', scrub: 1,
      onUpdate: (self) => {
        fill(self.progress);
        setHold(self.progress);
      },
    });
    return;
  }

  // Desktop: the section holds in place via native CSS position:sticky
  // (no JS pin, so no lock/release jitter). Scroll through the tall region
  // drives the fill, completing by 80% so the finished lines hold a beat
  // before the sticky child releases on its own.
  section.classList.add('problem--scroll');
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = Math.min(1, self.progress / 0.8);
      fill(p);
      // hold-progress cue: the kicker's ring fills as the manifesto fills,
      // telegraphing how long the pin lasts (see .problem__holdring)
      setHold(p);
    },
  });
}

// (life-in-days grid removed — the cost section now renders a 12-month strip,
//  driven by the slider in setupSlider below.)

// ─── kicker hold-progress rings ─────────────────────────────
// Every kicker's pulsing dot becomes a ring that fills as the eyebrow rises
// into reading position — the same cue the problem section uses for its pin,
// applied sitewide. The problem kicker (.problem__kicker) already carries its
// ring in markup and is driven by its pin scrub in setupProblemReveal, so it's
// intentionally excluded from this generic .kicker pass.
function setupKickerRings() {
  const RING =
    '<svg class="kicker__ring" viewBox="0 0 20 20" aria-hidden="true">' +
    '<circle class="kicker__ring-track" cx="10" cy="10" r="8"/>' +
    '<circle class="kicker__ring-fill" cx="10" cy="10" r="8"/></svg>';
  document.querySelectorAll('.kicker').forEach((kicker) => {
    kicker.insertAdjacentHTML('afterbegin', RING);
    // --hold is set on the kicker itself and inherits down to the ring, so each
    // ring tracks its own eyebrow with no cross-section interference.
    if (reduced) { kicker.style.setProperty('--hold', 1); return; }
    let last = '';
    ScrollTrigger.create({
      trigger: kicker,
      start: 'top bottom',   // eyebrow enters from the bottom edge
      end: 'top 35%',        // ring completes as it settles into reading position
      scrub: true,
      onUpdate: (self) => {
        // quantised + deduped — 8 rings scrubbing at once must not add 8 style
        // invalidations per scroll frame when their values haven't moved
        const v = self.progress.toFixed(2);
        if (v === last) return;
        last = v;
        kicker.style.setProperty('--hold', v);
      },
    });
  });
}

// ─── reveal-on-enter system ─────────────────────────────────
function setupReveals() {
  document.querySelectorAll('.reveal, .r-up, .reveal-children, .r-clip').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') });
  });
}

// ─── scroll-reveal headlines (Inspira-style per-word opacity) ───
function setupScrollHeadlines() {
  document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
    // Fill colour is white-ink by default; light sections override via
    // data-sr-ink="r,g,b" (e.g. the cream Meet Focus sheet fills in dark ink).
    const ink = el.dataset.srInk || '230,235,241';
    // Resolve each word's paint target once (a querySelector per word per
    // scrolled frame is DOM-query churn), and remember the last quantised
    // value so unchanged words are skipped — per frame, only the 2–3 words
    // actually mid-transition invalidate style/paint. Six of these headlines
    // can be live near section boundaries at once; this is what keeps their
    // combined cost negligible.
    // Paint target's colour is set ONCE (not tweened) and the fill drives
    // opacity instead of colour alpha — visually identical for solid text
    // against a flat background, but opacity is compositor-only (no glyph
    // repaint), where colour forces a style recalc + repaint every word every
    // scrubbed frame. Same discipline as the lime words already used.
    const words = splitWords(el).map((w) => {
      const lime = w.querySelector('.lime');
      const target = lime || w;
      if (!lime) target.style.color = `rgb(${ink})`;
      return { el: target, isLime: !!lime, last: -1 };
    });
    if (reduced) { words.forEach((w) => { w.el.style.opacity = '1'; }); return; }

    // Optional: drive this element's fill off another element's scroll position
    // (data-sr-trigger) so two headlines reveal in sync — e.g. the cost-section
    // title and the "Focus gives N days back" line light up together.
    const trig = (el.dataset.srTrigger && document.querySelector(el.dataset.srTrigger)) || el;
    ScrollTrigger.create({
      trigger: trig,
      start: el.dataset.srStart || 'top 90%',
      end:   el.dataset.srEnd   || 'top 12%',
      scrub: 0.35,
      onUpdate: (self) => {
        const p = self.progress;
        words.forEach((w, i) => {
          const wordStart = (i - 0.4) / words.length;
          const wordEnd   = (i + 0.9) / words.length;
          const t = Math.max(0, Math.min(1, (p - wordStart) / (wordEnd - wordStart)));
          const eased = 1 - Math.pow(1 - t, 2);
          const q = Math.round((0.15 + eased * 0.85) * 100);
          if (q === w.last) return;
          w.last = q;
          // Opacity for both cases — a clipped-gradient sheen (lime) or a
          // fixed-colour word (ink, set once above) fade identically via alpha,
          // but opacity is compositor-only where colour forces a repaint.
          w.el.style.opacity = q / 100;
        });
      },
    });
  });
}

// Wraps each word (and inline spans like .lime) in a <span class="word">
function splitWords(el) {
  const out  = [];
  const frag = document.createDocumentFragment();

  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((tok) => {
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else if (tok.length) {
          const s = document.createElement('span');
          s.className = 'word';
          s.textContent = tok;
          frag.appendChild(s);
          out.push(s);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
      // Wrap inline elements (e.g. <span class="lime">) as a single word unit
      const s = document.createElement('span');
      s.className = 'word';
      s.appendChild(node.cloneNode(true));
      frag.appendChild(s);
      out.push(s);
    } else {
      frag.appendChild(node.cloneNode(true)); // <br>
    }
  });

  el.textContent = '';
  el.appendChild(frag);
  return out;
}

// ─── interactive numbers slider ─────────────────────────────
// Rolling number — tweens an element's integer text from its current value to
// `to`, so derived costs count rather than snap. Reuses one proxy per element
// and overwrites in-flight tweens so rapid slider drags stay responsive.
function rollNum(el, to, dur = 0.5, delay = 0) {
  if (!el) return;
  if (reduced) { el.textContent = to; return; }
  const o = el._roll || (el._roll = { v: parseFloat(el.textContent) || 0 });
  // Only the ROUNDED value is ever displayed — many consecutive tween ticks
  // (near the ease-out tail especially) land on the same integer. Skip the
  // textContent write (a layout-invalidating op) when it hasn't changed.
  let last = Math.round(o.v);
  gsap.to(o, {
    v: to, duration: dur, delay, ease: 'power2.out', overwrite: true,
    onUpdate: () => {
      const r = Math.round(o.v);
      if (r === last) return;
      last = r;
      el.textContent = r;
    },
  });
}

function setupSlider() {
  const slider    = document.getElementById('screenSlider');
  if (!slider) return;
  const elScreen  = document.querySelector('[data-screen]');
  const elLost    = document.querySelector('[data-days-lost]');
  const boxes     = [...document.querySelectorAll('.numbers__month')];
  const mlabels   = [...document.querySelectorAll('.numbers__mlabel')];
  const elDinners = document.querySelector('[data-dinners]');
  const elGym     = document.querySelector('[data-gym]');
  const elDeep    = document.querySelector('[data-deep]');
  const yearEl    = document.querySelector('[data-year]');
  const liveEl    = document.querySelector('[data-slider-live]');
  let liveTimer   = 0;

  // Static per-box index drives the left-to-right cascade stagger (CSS --i).
  boxes.forEach((box, i) => box.style.setProperty('--i', i));

  const fmtH = (h) => {
    const v = Math.round(h * 2) / 2;
    return v % 1 === 0 ? String(v | 0) : v.toFixed(1);
  };

  function renderAt(h, announce, animate) {
    const pct = ((h - +slider.min) / (+slider.max - +slider.min)) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
    // Hours is the direct input — update instantly. Never animate direct
    // manipulation; the derived consequences below are what ripple.
    if (elScreen) elScreen.textContent = fmtH(h);

    const lost   = Math.round((h * 365) / 24);
    const DPM    = 365 / 12; // ~30.4 days per month-box
    const months = Math.round(lost / DPM);

    // The year, by the month: each box fills with the time the screen takes.
    // Re-aiming --fill lets the CSS width transition + --i stagger cascade the
    // change left-to-right instead of snapping every box at once.
    boxes.forEach((box, i) => {
      const frac = Math.max(0, Math.min(1, (lost - i * DPM) / DPM));
      box.style.setProperty('--fill', frac.toFixed(4));
    });
    mlabels.forEach((l, i) => l.classList.toggle('is-on', i < months));

    // The three moments always sum to `lost` (deep work takes the remainder).
    const dinners = Math.round(lost * 0.45);
    const gym     = Math.round(lost * 0.30);
    const deep    = Math.max(0, lost - dinners - gym);
    if (animate) {
      // Cause → effect: the headline cost rolls first, the moments ripple after.
      rollNum(elLost, lost, 0.4);
      rollNum(elDinners, dinners, 0.5, 0.08);
      rollNum(elGym, gym, 0.5, 0.12);
      rollNum(elDeep, deep, 0.5, 0.16);
    } else {
      if (elLost) elLost.textContent = lost;
      if (elDinners) elDinners.textContent = dinners;
      if (elGym) elGym.textContent = gym;
      if (elDeep) elDeep.textContent = deep;
    }

    const summary = `At ${fmtH(h)} hours a day, about ${lost} days a year — roughly ${months} ${months === 1 ? 'month' : 'months'} — go to the screen.`;
    yearEl?.setAttribute('aria-label', summary);

    // Announce the derived total to screen readers on user-driven changes only
    // (not the initial render) — debounced so a screen reader narrates only the
    // value the slider settles on, not every intermediate drag step.
    if (liveEl && announce) {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => { liveEl.textContent = summary; }, 500);
    }
  }

  slider.addEventListener('input', () => renderAt(parseFloat(slider.value), true, true));
  renderAt(7, false, false);
}

// ─── cost section: burn reveal + count-up ───────────────────
// Two scroll beats layered on the cost section. The headline day-count rolls up
// from zero as the claim lands, then the year strip unveils left-to-right like a
// fuse as it scrolls into view (--reveal scrubbed 0→1, gated by clip-path in
// CSS). Both are desktop/motion niceties — the strip defaults to fully shown, so
// reduced-motion and no-JS renders are complete and correct.
function setupCostReveal() {
  if (reduced) return;
  const section = document.getElementById('numbers');
  if (!section) return;
  const header = section.querySelector('.numbers__header');
  const months = section.querySelector('.numbers__months');
  const elLost = section.querySelector('[data-days-lost]');

  if (header && elLost) {
    const target = parseInt(elLost.textContent, 10) || 0;
    elLost.textContent = '0';
    elLost._roll = { v: 0 };
    ScrollTrigger.create({
      trigger: header, start: 'top 75%', once: true,
      onEnter: () => rollNum(elLost, target, 1.1),
    });
  }

  if (months) {
    months.style.setProperty('--reveal', '0');
    // Quantise + skip no-change writes: each setProperty invalidates style for
    // the subtree, so redundant writes are pure recalc churn on the scroll path.
    let lastReveal = '';
    const set = (self) => {
      const v = self.progress.toFixed(3);
      if (v === lastReveal) return;
      lastReveal = v;
      months.style.setProperty('--reveal', v);
    };
    // The burn edge travels via translateX(--reveal × --months-w); measure the
    // strip once per refresh so the transform never needs a %-of-parent layout.
    const measure = () => months.style.setProperty('--months-w', months.offsetWidth + 'px');
    measure();
    // Anchored to #numbers itself (not .numbers__months) with end:'top top' —
    // the exact frame where #numbers' own CSS sticky lock engages. #numbers
    // freezes every child's viewport position once locked, so any scrub whose
    // end boundary doesn't line up with that lock point risks completing
    // mid-lock: frozen at whatever progress it had, right as the (separate)
    // cost→Meet Focus handoff scrub kicks in — reads as a stutter/snap on
    // entry. Sharing the lock's own reference frame guarantees the burn always
    // finishes exactly as the section arrives, on any viewport height.
    ScrollTrigger.create({
      trigger: section, start: 'top 85%', end: 'top top', scrub: true,
      onUpdate: set,
      onRefresh: (self) => { measure(); set(self); },
    });
  }
}

// ─── modes: scroll-staggered description reveal ─────────────
function setupModes() {
  document.querySelectorAll('[data-mode]').forEach((el) => {
    if (reduced) return;
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: .8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });
}

// ─── modes: mosaic category lighting on hover ───────────
function setupModeInteractions() {
  if (reduced || !matchMedia('(hover: hover)').matches) return;

  const CAT_KEYS = ['p', 'w', 'b', 'l']; // Productivity, Wellbeing, Body, Life
  const mgs = document.querySelectorAll('.modes__mg');

  document.querySelectorAll('[data-mode]').forEach((el, idx) => {
    el.addEventListener('mouseenter', () => {
      const cat = CAT_KEYS[idx] || '';
      mgs.forEach(mg => { mg.dataset.active = cat; });
      _hoverCat = cat;
      _mosaicCards.forEach(card => {
        if (card.dataset.cat === cat) {
          gsap.to(card, { opacity: 0.65, duration: 0.4, overwrite: true });
        }
      });
    });

    el.addEventListener('mouseleave', () => {
      mgs.forEach(mg => { delete mg.dataset.active; });
      const prevCat = _hoverCat;
      _hoverCat = null;
      _mosaicCards.forEach(card => {
        if (card.dataset.cat === prevCat) {
          gsap.to(card, { opacity: parseFloat(card.dataset.baseOpacity || 0), duration: 0.4, overwrite: true });
        }
      });
    });
  });
}

// ─── modes mosaic — scroll-scrubbed ambient background ───────
function setupModesMosaic() {
  const topCards = Array.from(document.querySelectorAll('.modes__mosaic--top .mc'));
  const btmCards = Array.from(document.querySelectorAll('.modes__mosaic:not(.modes__mosaic--top) .mc'));
  const allCards = [...topCards, ...btmCards];
  if (!allCards.length) return;

  _mosaicCards = allCards;

  if (reduced) {
    gsap.set(allCards, { opacity: 0.13, y: 0 });
    allCards.forEach(c => { c.dataset.baseOpacity = '0.13'; });
    return;
  }

  // Precompute per-card constants ONCE (isTop direction + reveal offset) instead
  // of an O(n) topCards.includes() per card per frame, and cache the last value
  // written so settled cards are skipped.
  //
  // Stagger geometry matters for scroll cost: with offsets spread over 0.6 and
  // each card fading across a 0.4-wide window, ~2/3 of all 62 tiles were
  // mid-transition at once — ~40 style writes per scrubbed frame, which a trace
  // showed as this zone's recalc storm (1.08ms avg / 5ms p95 per flush).
  // Spreading offsets over 0.78 with a 0.22-wide window keeps the exact same
  // left-to-right sweep across the same scroll distance, but only ~17 tiles
  // move concurrently — each card's own fade is a touch quicker, the wave is
  // unchanged, and per-frame writes drop by more than half.
  const topSet = new Set(topCards);
  const meta = allCards.map((card, i) => ({
    card,
    dir: topSet.has(card) ? -14 : 14,
    offset: (i / allCards.length) * 0.78,
    last: -1,
  }));

  ScrollTrigger.create({
    trigger: '.modes',
    start: 'top 55%',
    end: 'bottom 35%',
    scrub: 1.5,
    onUpdate(self) {
      if (_hoverCat) return; // let hover animation own opacity
      const p = self.progress;
      for (const m of meta) {
        const t = Math.max(0, Math.min(1, (p - m.offset) / 0.22));
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        if (Math.abs(eased - m.last) < 0.004) continue; // settled — skip the write
        m.last = eased;
        const base = eased * 0.16;
        m.card.dataset.baseOpacity = base.toFixed(4);
        gsap.set(m.card, { opacity: base, y: (1 - eased) * m.dir });
      }
    },
  });
}

// ─── scroll-velocity lean — the mosaic strips tilt with scroll speed ──
// One well-tuned physical detail: the two poster grids skew a degree or so in
// the direction of fast scrolling and spring back when it settles, so the
// mosaic reads as having weight. quickTo smooths the writes; a debounced
// settle-call returns to 0 since onUpdate stops firing when scrolling stops.
// Transform-only on two elements, and only while the modes section is on
// screen — the trigger's own range gates the work.
function setupMosaicVelocity() {
  if (reduced || !matchMedia('(min-width: 861px) and (hover: hover)').matches) return;
  const strips = gsap.utils.toArray('.modes__mg');
  if (!strips.length) return;
  const setters = strips.map((s) => gsap.quickTo(s, 'skewY', { duration: 0.5, ease: 'power3.out' }));
  let settle = null;
  ScrollTrigger.create({
    trigger: '#modes',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      // Softened from ±1.2° / vel÷450: the skew flips sign with scroll
      // direction, so a firm ±1.2° made the strips visibly rock when scrolling
      // up and down — reading as jitter rather than "weight". ±0.5° with a less
      // sensitive divisor keeps the subtle lean on fast flicks but stays near
      // flat during ordinary scrubbing.
      const lean = gsap.utils.clamp(-0.5, 0.5, self.getVelocity() / -900);
      setters.forEach((set) => set(lean));
      if (settle) settle.kill();
      settle = gsap.delayedCall(0.1, () => setters.forEach((set) => set(0)));
    },
  });
}

// ─── generic 3D tilt for [data-tilt] cards (availability) ───
function setupTilt() {
  if (reduced || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.getcard[data-tilt]').forEach((el) => {
    // Lerp toward the cursor-derived target on a single rAF instead of writing
    // the transform straight from the pointer — gives the tilt momentum (no
    // artificial snap) and batches the write off the event. transform-only, so
    // the card never reflows and returns to its exact resting box on leave.
    let tRX = 0, tRY = 0, tTY = 0, rRX = 0, rRY = 0, rTY = 0;
    let raf = null, inside = false;
    const LERP = 0.14;
    const loop = () => {
      rRX += (tRX - rRX) * LERP;
      rRY += (tRY - rRY) * LERP;
      rTY += (tTY - rTY) * LERP;
      const settled = Math.abs(tRX - rRX) < 0.03 && Math.abs(tRY - rRY) < 0.03 && Math.abs(tTY - rTY) < 0.05;
      if (settled && !inside) { el.style.transform = ''; raf = null; return; }
      el.style.transform = `perspective(700px) rotateY(${rRY.toFixed(2)}deg) rotateX(${rRX.toFixed(2)}deg) translateY(${rTY.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tRY = (px - .5) * 12; tRX = (.5 - py) * 12; tTY = -4;
      inside = true;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    el.addEventListener('mouseleave', () => {
      inside = false; tRX = 0; tRY = 0; tTY = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
}

// ─── hero device cluster — layered phones: idle float + parallax scroll-exit ──
// As the hero scrolls away the phones lift up and fade, the nearer (front) phone
// travelling further than the back so they separate with depth, plus a gentle peel
// rotation. Scroll position feeds a single `exitProgress` scalar that the rAF loop
// folds into the transform it already writes — so the rAF stays the sole writer of
// each phone's transform (no GSAP-vs-rAF fight) and the cluster dissolves in sync
// with the hero grid/glow (see heroAtmosphere).
function setupHeroDevices() {
  const wrap = document.querySelector('.hero__devices');
  if (!wrap) return;
  const front = wrap.querySelector('.hero__phone--front');
  const back = wrap.querySelector('.hero__phone--back');
  if (!front || !back) return;
  const EXIT_DIST = 240; // px the nearest phone lifts across the hero's scroll
  const phones = [
    { el: front, base: -3, depth: 1.0,  amp: 9,  spd: 0.7,  ph: 0,   peel: -5, driftX: -22 },
    { el: back,  base: 6,  depth: 0.55, amp: 13, spd: 0.55, ph: 1.6, peel:  7, driftX:  30 },
  ];

  if (reduced) {
    gsap.set(wrap, { autoAlpha: 1 });
    phones.forEach((p) => { p.el.style.transform = `translate(-50%,-50%) rotate(${p.base}deg)`; });
    // Opacity-only exit (no motion) so reduced-motion users still see them leave.
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.to(wrap, { autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
    return;
  }

  gsap.fromTo(wrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power2.out', delay: 0.35 });

  let exitProgress = 0; // 0 at hero top → 1 as the hero scrolls fully past
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (self) => { exitProgress = self.progress; },
    });
  }
  const smooth01 = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

  const t0 = performance.now();
  let running = false, rafId = 0;
  function frame(now) {
    const t = (now - t0) / 1000;
    const intro = Math.max(0, 1 - (now - t0) / 900);
    const introY = intro * intro * 70;
    const e = exitProgress;
    const fade = smooth01(e / 0.85); // fully gone by ~85% of the hero scroll
    const op = (1 - fade).toFixed(3);
    for (const p of phones) {
      const f = Math.sin(t * p.spd + p.ph) * p.amp;
      const exitY = -e * EXIT_DIST * p.depth;
      const x = e * p.driftX;
      const rot = p.base + e * p.peel;
      // Sub-pixel precision (0.01px) — the idle bob drifts only ~0.1px/frame,
      // so ANY coarser rounding makes it visibly step/stutter instead of
      // gliding. This is only two elements; writing their transform every frame
      // costs nothing worth quantising away (an earlier 0.5px "optimisation"
      // here was the source of the hero phones' jitter).
      const y = (f + introY + exitY).toFixed(2);
      p.el.style.transform =
        `translate(-50%,-50%) translate(${x.toFixed(2)}px, ${y}px) rotate(${rot.toFixed(2)}deg)`;
      if (op !== p.lastOp) { p.lastOp = op; p.el.style.opacity = op; }
    }
    if (running) rafId = requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; rafId = requestAnimationFrame(frame); } };
  const stop = () => { running = false; if (rafId) cancelAnimationFrame(rafId); };
  new IntersectionObserver(([e]) => { e.isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(document.getElementById('hero'));
  start();
}

// ─── hero entrance — horizontal-cut word reveal ──────────────
function revealHero() {
  const lines = document.querySelectorAll('.h-line');
  if (!lines.length) return;
  const words = [];
  lines.forEach((line) => { splitWords(line).forEach((w) => words.push(w)); });
  // merge standalone punctuation (e.g. the trailing ".") into the preceding
  // word so it rises as one unit instead of cascading on its own
  for (let i = words.length - 1; i > 0; i--) {
    if (/^[.,!?;:'"’”)]+$/.test(words[i].textContent.trim())) {
      const prev = words[i - 1];
      while (words[i].firstChild) prev.appendChild(words[i].firstChild);
      words[i].remove();
      words.splice(i, 1);
    }
  }
  if (reduced || !words.length) return;
  gsap.fromTo(words,
    { x: -12, skewX: 3, opacity: 0 },
    { x: 0, skewX: 0, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.07, delay: 0.1 }
  );
}

// ─── nav link active state ──────────────────────────────────
function setupNavLinks() {
  const links = document.querySelectorAll('.nav__link');
  if (!links.length) return;
  const sections = ['problem', 'overview', 'modes'].map(id => document.getElementById(id));
  const setActive = (id) => {
    links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
  };
  sections.forEach(sec => {
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter:     () => setActive(sec.id),
      onEnterBack: () => setActive(sec.id),
      onLeave:     () => setActive(null),
      onLeaveBack: () => setActive(null),
    });
  });
}

// ─── nav + progress hairline ────────────────────────────────
function navAndProgress() {
  const nav = document.getElementById('nav');
  const fill = document.querySelector('[data-prog]');
  let lastY = 0, lastSX = -1;

  // scrollHeight forces a synchronous layout if anything on the page is
  // layout-dirty — reading it on every scroll frame turns any other layout
  // write that same tick into a forced reflow. Measure once, and only
  // re-measure on resize / ScrollTrigger refresh (page height actually changed).
  let maxScroll = 0;
  const measure = () => { maxScroll = document.documentElement.scrollHeight - window.innerHeight; };
  measure();
  let mrt;
  window.addEventListener('resize', () => { clearTimeout(mrt); mrt = setTimeout(measure, 150); });
  ScrollTrigger.addEventListener('refresh', measure);

  ScrollTrigger.create({
    start: 1, end: 99999,
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('scrolled', y > 40);
      if (y < 80) {
        nav.classList.remove('nav--hidden');
      } else if (y > lastY) {
        nav.classList.add('nav--hidden');
      } else {
        nav.classList.remove('nav--hidden');
      }
      lastY = y;
      if (fill) {
        // quantised to ~0.1% steps and deduped — sub-pixel on a hairline, so
        // identical frames skip the transform write entirely
        const sx = maxScroll > 0 ? Math.round((y / maxScroll) * 1000) / 1000 : 0;
        if (sx !== lastSX) { lastSX = sx; gsap.set(fill, { scaleX: sx }); }
      }
    },
  });
}

// ─── mobile nav ─────────────────────────────────────────────
function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (!toggle || !mobile) return;
  const close = () => {
    mobile.classList.remove('open'); toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false'); mobile.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    mobile.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  // Guard against the menu getting stuck open if the viewport crosses back
  // above the mobile breakpoint while it's open (e.g. rotating a foldable) —
  // the toggle disappears at that width, so there'd be no way to close it.
  window.addEventListener('resize', () => {
    if (innerWidth > 680) close();
  });
}

init();

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

const QA = new URLSearchParams(location.search).has('qa');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// shared state between setupModeInteractions and setupModesMosaic
let _hoverCat = null;
let _mosaicCards = [];

// ─── entry ──────────────────────────────────────────────────
async function init() {
  if (!QA) await runPreloader();
  else document.getElementById('preloader')?.classList.add('is-done');

  // Lenis smooth scroll — wired to GSAP ticker so ScrollTrigger stays in sync
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initMagnetic();
  setupAnchors();
  setupReveals();
  setupScrollHeadlines();
  setupReckoning();
  setupProblemReveal();
  setupModes();
  setupModeInteractions();
  setupModesMosaic();
  setupTilt();
  setupHeroDevices();
  navAndProgress();
  setupNavLinks();
  setupMobileNav();
  wireStoreBtns();

  initHeroGradient(document.getElementById('hero-aura'));
  initGrid(document.getElementById('hero-grid'));
  initStoryboard(document.getElementById('overview'), gsap, lenis, ScrollTrigger);
  initJourney(document.getElementById('journeyDeck'), STAGES, gsap, ScrollTrigger, lenis);
  initNotifications(document.getElementById('problem'));
  initNumbersGrid(document.getElementById('numbers'));

  revealHero();
  setupHeroAtmosphere();
  ScrollTrigger.refresh();
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

  // Collect every word from all lines as one continuous sequence.
  const allWords = [];
  els.forEach((el) => allWords.push(...splitWords(el)));

  const paint = (w, alpha) => {
    if (w.querySelector('.lime')) {
      w.querySelector('.lime').style.color = `rgba(191,255,71,${alpha})`;
    } else {
      w.style.color = `rgba(230,235,241,${alpha})`;
    }
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

  // Skip animation for reduced motion — just show full colour.
  if (reduced) { allWords.forEach((w) => paint(w, 1)); return; }

  // Kicker fades in as the section approaches.
  gsap.fromTo('.problem__kicker',
    { opacity: 0 },
    { opacity: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 55%', scrub: 0.8 } }
  );

  const canHold = matchMedia('(min-width: 861px) and (hover: hover)').matches;

  // Mobile / touch: word fill as the section scrolls through, no hold.
  if (!canHold) {
    ScrollTrigger.create({
      trigger: section, start: 'top 78%', end: 'top 12%', scrub: 1,
      onUpdate: (self) => fill(self.progress),
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
    onUpdate: (self) => fill(Math.min(1, self.progress / 0.8)),
  });
}

// ─── reveal-on-enter system ─────────────────────────────────
function setupReveals() {
  document.querySelectorAll('.reveal, .r-up, .reveal-children').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') });
  });
}

// ─── scroll-reveal headlines (Inspira-style per-word opacity) ───
function setupScrollHeadlines() {
  document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
    const words = splitWords(el);
    if (reduced) { words.forEach((w) => { w.style.color = 'rgba(230,235,241,1)'; const lime = w.querySelector('.lime'); if (lime) lime.style.opacity = '1'; }); return; }

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
          const a = 0.15 + eased * 0.85;
          const lime = w.querySelector('.lime');
          if (lime) {
            // Drive opacity (not colour) so a clipped-gradient sheen — e.g. the
            // journey headline's lime words — survives the reveal; for solid lime
            // words this looks identical to fading the colour alpha.
            lime.style.opacity = a;
          } else {
            w.style.color = `rgba(230,235,241,${a})`;
          }
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

// ─── the reckoning (numbers section) ────────────────────────
// A choice, not a slider: tapping an hours option recomputes a personal
// verdict (days lost), drains the year-bar, and lights the reclaimed slice.
// Same math the old calculator used — reframed as a reveal, not a control.
function setupReckoning() {
  const root = document.getElementById('numbers');
  if (!root) return;
  const chips = [...root.querySelectorAll('.rk__chip')];
  if (!chips.length) return;

  const numEl     = root.querySelector('[data-days-lost]');
  const backEl    = root.querySelector('[data-days-reclaim]');
  const hoursEl   = root.querySelector('[data-hours-month]');
  const spent     = root.querySelector('[data-rk-spent]');
  const reclaimEl = root.querySelector('[data-rk-reclaim]');
  const barEl     = root.querySelector('[data-rk-bar]');
  const momEl     = root.querySelector('[data-rk-moments]');
  const underline = root.querySelector('.rk__underline');

  const lostOf = (h) => Math.round((h * 365) / 24);
  const backOf = (l) => Math.round(l * 0.33);

  // Slide the lime underline under the active choice
  function place(chip) {
    if (!underline || !chip) return;
    underline.style.width = `${chip.offsetWidth}px`;
    underline.style.transform = `translateX(${chip.offsetLeft}px)`;
  }

  // Each verdict number counts up/down with a brief blur so the swap reads as
  // one morph rather than a flicker (design-eng: blur masks the transition).
  // The days + hours stats share a line, so they roll in lock-step.
  function makeRoller(el) {
    let raf = 0, shown = 0;
    return {
      set(v) { el.textContent = v; shown = v; },
      roll(to) {
        if (reduced) { el.textContent = to; shown = to; return; }
        el.classList.add('is-rolling');
        const from = shown, t0 = performance.now(), dur = 460;
        cancelAnimationFrame(raf);
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(from + (to - from) * e);
          if (k < 1) { raf = requestAnimationFrame(step); }
          else { el.textContent = to; shown = to; el.classList.remove('is-rolling'); }
        };
        raf = requestAnimationFrame(step);
      },
    };
  }
  const daysRoll  = makeRoller(numEl);
  const hoursRoll = hoursEl ? makeRoller(hoursEl) : null;

  function apply(h, chip, animate) {
    const lost = lostOf(h), back = backOf(lost);
    const hours = Math.round((h * 365) / 12);
    if (animate) { daysRoll.roll(lost); hoursRoll?.roll(hours); }
    else         { daysRoll.set(lost);  hoursRoll?.set(hours);  }
    if (backEl) backEl.textContent = back;
    if (momEl) momEl.innerHTML =
      `Enough for <span class="lime">${Math.round(back / 2)}</span> family dinners, ` +
      `<span class="lime">${Math.round(back / 4)}</span> gym sessions, or ` +
      `<span class="lime">${Math.round(back / 3)}</span> days of deep work.`;
    const spentPct = (lost / 365) * 100;
    const recPct   = (back / 365) * 100;
    const recLeft  = ((lost - back) / 365) * 100;
    if (spent)     spent.style.width = `${spentPct}%`;
    if (reclaimEl) { reclaimEl.style.left = `${recLeft}%`; reclaimEl.style.width = `${recPct}%`; reclaimEl.style.opacity = '1'; }
    barEl?.setAttribute('aria-label',
      `At ${h} hours a day, ${lost} days a year go to the screen; Focus gives back ${back}.`);
    place(chip);
  }

  function select(chip, animate) {
    chips.forEach((c) => c.setAttribute('aria-checked', 'false'));
    chip.setAttribute('aria-checked', 'true');
    apply(parseFloat(chip.dataset.h), chip, animate);
  }

  chips.forEach((c, i) => {
    c.addEventListener('click', () => select(c, true));
    c.addEventListener('keydown', (e) => {
      const d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1
              : (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = chips[(i + d + chips.length) % chips.length];
      n.focus();
      select(n, true);
    });
  });

  const active = chips.find((c) => c.getAttribute('aria-checked') === 'true') || chips[0];
  const hActive = parseFloat(active.dataset.h);

  // Resting state immediately so values are never stale (QA / reduced-motion).
  apply(hActive, active, false);
  requestAnimationFrame(() => place(active));
  if (document.fonts?.ready) document.fonts.ready.then(() => place(active));
  window.addEventListener('resize', () => {
    place(chips.find((c) => c.getAttribute('aria-checked') === 'true') || active);
  });

  // Count-up flourish once when the section enters view (start the bar empty).
  if (!reduced) {
    const fill = () => apply(hActive, active, true);
    daysRoll.set(0); hoursRoll?.set(0);
    if (spent) spent.style.width = '0%';
    if (reclaimEl) reclaimEl.style.opacity = '0';
    if (root.getBoundingClientRect().top < innerHeight * 0.7) {
      fill();
    } else {
      ScrollTrigger.create({ trigger: '#numbers', start: 'top 70%', once: true, onEnter: fill });
    }
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
  // written so settled cards are skipped — the scrub only writes the handful of
  // cards mid-transition each frame, not all ~30.
  const topSet = new Set(topCards);
  const meta = allCards.map((card, i) => ({
    card,
    dir: topSet.has(card) ? -14 : 14,
    offset: (i / allCards.length) * 0.6,
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
        const t = Math.max(0, Math.min(1, (p - m.offset) / 0.4));
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
    for (const p of phones) {
      const f = Math.sin(t * p.spd + p.ph) * p.amp;
      const exitY = -e * EXIT_DIST * p.depth;
      const x = e * p.driftX;
      const rot = p.base + e * p.peel;
      p.el.style.transform =
        `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${(f + introY + exitY).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
      p.el.style.opacity = (1 - fade).toFixed(3);
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
  let lastY = 0;
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
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        gsap.set(fill, { scaleX: maxScroll > 0 ? y / maxScroll : 0 });
      }
    },
  });
}

// ─── mobile nav ─────────────────────────────────────────────
function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (!toggle || !mobile) return;
  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    mobile.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    mobile.classList.remove('open'); toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false'); mobile.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }));
}

// ─── "coming soon" toast ────────────────────────────────────
function wireStoreBtns() {
  document.querySelectorAll('#storeBtn, #navCta, .nav__mobile-cta').forEach((btn) => {
    btn?.addEventListener('click', (e) => { e.preventDefault(); showToast('Coming soon to the App Store 🚀'); });
  });
}
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '32px', left: '50%', transform: 'translate(-50%, 12px)',
    background: '#BFFF47', color: '#0b0f07', padding: '12px 28px', borderRadius: '50px',
    fontSize: '13px', fontWeight: '700', letterSpacing: '.04em', zIndex: '99999', opacity: '0',
    transition: 'opacity .3s, transform .3s', whiteSpace: 'nowrap',
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translate(-50%, 0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%, 8px)'; setTimeout(() => t.remove(), 350); }, 2500);
}

init();

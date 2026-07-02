// ── Feature showcase — hover-driven ambient field ────────────
const N_BASE = 1600;   // desktop particle budget; scaled down per-device at init
const S = 300;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Cheap trig — a 256-entry sine LUT. The field samples sin/cos for every drawn
// particle every frame (idle jitter); table lookups keep that off the math unit
// so the hot loop stays light on low-end CPUs. The
// amplitudes are sub-pixel, so the 256-step quantisation is invisible. Bitwise
// AND wraps negative indices correctly (-1 & 255 === 255).
const TRIG_N = 256, TRIG_K = TRIG_N / 6.283185307;
const SIN = new Float32Array(TRIG_N);
for (let i = 0; i < TRIG_N; i++) SIN[i] = Math.sin((i / TRIG_N) * 6.283185307);
const fsin = (a) => SIN[((a * TRIG_K) | 0) & (TRIG_N - 1)];
const fcos = (a) => SIN[(((a * TRIG_K) | 0) + (TRIG_N >> 2)) & (TRIG_N - 1)];

// Default (rest) state — shown when nothing is hovered
const DEFAULT = {
  title: 'Everything you need to take your <span class="lime">attention</span> back.',
  line:  'Hover any tool to see how it keeps you focused.',
  col:   [191, 255, 71],   // brand lime — the rest ring + wash
};

// Perceptual luminance. Accent colours (blue/green/flame) are far less luminous
// than the lime rest state, so at a fixed alpha they glow dimmer. We divide the
// lime luminance by each colour's to lift its alpha back to the same brightness.
const LUM = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const LIME_LUM = LUM(DEFAULT.col[0], DEFAULT.col[1], DEFAULT.col[2]);

const FEATURES = [
  { draw: drawBan,      col: [90, 200, 250],  title: '<span class="lime">Blocking</span>',                 line: 'A wall around the apps and sites that hijack your focus.' },
  { draw: drawShield,   col: [255, 214, 10],  title: '<span class="lime">Always-on</span>',                line: 'It holds the line even when willpower clocks out for the day.' },
  { draw: drawCalendar, col: [191, 255, 71],  title: '<span class="lime">Scheduled blocks</span>',         line: 'Recurring blocks that begin on their own, every single day.' },
  { draw: drawLock,     col: [94, 157, 255],  title: '<span class="lime">App limits</span>',               line: 'Hard daily caps on the apps that quietly take the most.' },
  { draw: drawTarget,   col: [48, 209, 88],   title: '<span class="lime">Focus sessions</span>',           line: 'Custom rules for each session — your focus, on your terms.' },
  { draw: drawBubble,   col: [167, 139, 250], title: '<span class="lime">CBT resistance</span>',           line: 'Research-backed prompts that defuse the impulse in the moment.' },
  { draw: drawInsight,  col: [52, 195, 224],  title: '<span class="lime">Smart insights</span>',           line: 'See when you focus best, and exactly what breaks it.' },
  { draw: drawArrowUp,  col: [255, 159, 10],  title: '<span class="lime">Momentum</span>',                 line: 'Every kept session pushes you a little further forward.' },
  { draw: drawBars,     col: [139, 232, 95],  title: '<span class="lime">Weekly reports</span>',           line: 'Seven days of focus in one clear picture, every Sunday.' },
  { draw: drawFlame,    col: [255, 96, 38],   title: '<span class="lime">Streaks &amp; shields</span>',    line: 'Streaks, shields and stats that stack up over time.' },
  { draw: drawFlag,     col: [129, 140, 248], title: '<span class="lime">Identity journey</span>',         line: 'Grow through stages as your focus compounds week over week.' },
  { draw: drawTrophy,   col: [255, 214, 10],  title: '<span class="lime">Leaderboard</span>',              line: 'Climb the ranks alongside friends who show up too.' },
  { draw: drawWidget,   col: [100, 210, 255], title: '<span class="lime">Widgets &amp; Live Activity</span>', line: 'Live on your home and lock screen, always one look away.' },
  { draw: drawCloud,    col: [125, 211, 252], title: '<span class="lime">Cloud sync</span>',               line: 'Your setup and progress follow you across every device.' },
  { draw: drawGlobe,    col: [110, 231, 183], title: '<span class="lime">Browser pairing</span>',          line: 'Pair your browser so the web plays by your rules too.' },
];

export function initStoryboard(section, gsap, lenis, ScrollTrigger) {
  if (!section) return;
  const stage    = section.querySelector('.af__stage');
  const canvas   = section.querySelector('.af__canvas');
  if (!stage || !canvas) return;
  const ctx      = canvas.getContext('2d');
  const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const icons    = [...section.querySelectorAll('.af__icon')];
  const svgs     = icons.map((el) => el.querySelector('svg'));
  // rebuilt app fragments that flank the copy for select features (data-for = icon index)
  const exhibits = [...section.querySelectorAll('.af__exhibit')];

  // Big numerals count up when their exhibit materialises — same grammar as the
  // cost section's rolling numbers. Only pure integers roll ("47", "312"); mixed
  // formats ("8h 24m", "3 / 3", "#7") stay static. Targets are read once from
  // the markup, so the cards remain the single source of truth for their data.
  const rollers = [];
  exhibits.forEach((ex) => {
    ex.querySelectorAll('.afx-big-num, .afx-ao__num').forEach((el) => {
      const tn = el.firstChild;
      if (!tn || tn.nodeType !== 3) return;
      const m = tn.textContent.match(/^(\s*)(\d+)(\s*)$/);
      if (!m) return;
      rollers.push({ idx: +ex.dataset.for, tn, pre: m[1], val: +m[2], post: m[3], o: { v: +m[2] } });
    });
  });
  function rollExhibits(idx) {
    if (reduced) return;
    rollers.forEach((r) => {
      if (r.idx !== idx) return;
      gsap.killTweensOf(r.o);
      r.o.v = 0;
      gsap.to(r.o, {
        v: r.val, duration: 0.8, delay: 0.2, ease: 'power2.out',
        onUpdate: () => { r.tn.textContent = r.pre + Math.round(r.o.v) + r.post; },
      });
    });
  }

  function showExhibits(idx) {
    let any = false;
    exhibits.forEach((el) => {
      const on = +el.dataset.for === idx;
      el.classList.toggle('is-shown', on);
      if (on) any = true;
    });
    section.classList.toggle('is-exhibiting', any);
    if (any) rollExhibits(idx);
  }
  const titleEl  = section.querySelector('.af__title');
  const lineEl   = section.querySelector('.af__line');
  const row      = section.querySelector('.af__row');
  // kicker reveal is owned by the global .r-up system (setupReveals), like every
  // other section's kicker — storyboard no longer touches it.
  const n        = FEATURES.length;
  const DEF_TITLE = DEFAULT.title;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Particle budget scales to the device so low-end phones stay smooth while
  // desktops stay rich; a runtime FPS guard (in the loop) tunes it further.
  const N = (function () {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const cores  = navigator.hardwareConcurrency || 4;
    const mem    = navigator.deviceMemory || 4;
    const small  = Math.min(innerWidth, innerHeight) < 760;
    let f = 1;
    if (coarse || small)        f = 0.58;          // phones & small tablets
    if (cores <= 4)             f = Math.min(f, 0.72);
    if (cores <= 2 || mem <= 2) f = Math.min(f, 0.42);
    if (reduced)                f = Math.min(f, 0.5);
    return Math.max(360, Math.round(N_BASE * f));
  })();

  // per-feature particle target buffers
  const T = FEATURES.map((f) => {
    const pts = sample(f.draw);
    const a = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { const p = pts[i % pts.length]; a[i*2] = p[0]; a[i*2+1] = p[1]; }
    return a;
  });

  // rest-state particle formation — a complete lime ring (echoes the app's
  // focus ring), rotating almost imperceptibly while at rest (see draw()) so
  // the idle field breathes rather than sitting dead still.
  const restPts = sample((c) => {
    c.lineWidth = 20; c.beginPath();
    c.arc(150, 150, 94, 0, Math.PI * 2);
    c.stroke();
  });
  const restT = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const p = restPts[i % restPts.length]; restT[i*2] = p[0]; restT[i*2+1] = p[1]; }
  let restRot = 0;

  // per-particle depth — gives the glyph volume (size / brightness / parallax vary)
  const pSize = new Float32Array(N), pAlpha = new Float32Array(N), pPlx = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const z = 0.35 + Math.random() * 0.65;       // 0.35 far … 1 near
    pSize[i]  = 0.55 + z * 0.9;
    pAlpha[i] = 0.42 + z * 0.58;
    pPlx[i]   = 0.4  + z * 0.9;
  }

  const morph = Float32Array.from(restT);
  const rnd   = new Float32Array(N);

  // morph character — per-particle arrival rate (glyphs SWEEP into shape
  // instead of arriving as one uniform mass) plus a curved detour on ~18% of
  // particles: a perpendicular drift proportional to the remaining delta, so
  // the curl self-extinguishes exactly as each particle lands.
  const pK  = new Float32Array(N);
  const pSw = new Float32Array(N);

  // particles begin scattered, then assemble into the rest orb on entry
  const curS = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    rnd[i] = Math.random();
    pK[i]  = 0.062 + rnd[i] * 0.05;
    pSw[i] = rnd[i] > 0.82 ? (rnd[i] > 0.91 ? 0.022 : -0.022) : 0;
    const a = Math.random() * 6.2832, r = 200 + Math.random() * 200;
    curS[i*2] = Math.cos(a) * r; curS[i*2+1] = Math.sin(a) * r;
  }
  if (reduced) curS.set(restT);

  // ── sizing ──
  const dpr = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5);
  let w = 0, h = 0, bx = 0, by = 0, scale = 1;
  let secRect = null, rowRect = null, rectDirty = false;   // cached rects for parallax (no per-move reflow)
  let lastScrollAt = -1e9;                                  // last Lenis scroll time — gates per-frame gradient rebuilds
  const chipC = icons.map(() => ({ x: 0, y: 0 }));   // chip centres, row-local
  function measureChips() {
    if (!row) return;
    const rr0 = row.getBoundingClientRect();
    icons.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      chipC[i].x = r.left - rr0.left + r.width / 2;
      chipC[i].y = r.top  - rr0.top  + r.height / 2;
    });
  }
  function resize() {
    w = stage.clientWidth || 1; h = stage.clientHeight || 1;
    // Cap the backing store to a pixel budget. The field is a soft, defocused
    // bloom, so rendering it at a lower internal resolution and letting CSS
    // upscale it is visually identical — but it bounds the per-frame fill cost
    // (clearRect + the wash blit are pixel-bound) on 4K / 5K / ultrawide
    // displays, which is the main source of scroll jank on high-res screens.
    const MAXPIX = 3.0e6;
    let rdpr = dpr;
    if (w * h * dpr * dpr > MAXPIX) rdpr = Math.sqrt(MAXPIX / (w * h));
    canvas.width = Math.round(w * rdpr); canvas.height = Math.round(h * rdpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(rdpr, 0, 0, rdpr, 0, 0);
    bx = w / 2;
    by = h * 0.50; // sits in the gap between the (raised) copy and the icons
    scale = clamp(Math.min(w, h) / 640, 0.55, 1.7);
    secRect = section.getBoundingClientRect();
    rowRect = row ? row.getBoundingClientRect() : null;
    measureChips();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  else addEventListener('resize', resize);
  // Mark the cached rect stale on scroll; it's refreshed at most once per frame
  // inside the rAF loop, so the mousemove handler never reads layout itself.
  addEventListener('scroll', () => { rectDirty = true; }, { passive: true });

  // ── pointer: field parallax (spring) + dock cursor (row-local) ──
  let tpx = 0, tpy = 0, px = 0, py = 0, vx = 0, vy = 0;
  // cursor lens — pointer position in canvas coords (canvas is inset:0 in the
  // section, so section-local CSS px == canvas px). Parked far offscreen when
  // the pointer leaves so the lens costs nothing.
  let lpx = -1e5, lpy = -1e5;
  section.addEventListener('mousemove', (e) => {
    // read the CACHED rect — never getBoundingClientRect here, which would force
    // a synchronous layout on every move and stutter scrolling
    if (!secRect) return;
    tpx = ((e.clientX - secRect.left) / secRect.width) * 2 - 1;
    tpy = ((e.clientY - secRect.top) / secRect.height) * 2 - 1;
    lpx = e.clientX - secRect.left;
    lpy = e.clientY - secRect.top;
  }, { passive: true });
  section.addEventListener('mouseleave', () => { lpx = -1e5; lpy = -1e5; }, { passive: true });

  let rlx = -9999, rly = -9999, inRow = false;
  if (row && finePointer) {
    row.addEventListener('mousemove', (e) => {
      if (!rowRect) return;
      rlx = e.clientX - rowRect.left; rly = e.clientY - rowRect.top; inRow = true;
    }, { passive: true });
    row.addEventListener('mouseleave', () => { inRow = false; });
  }

  // ── chip transforms — spring lift + dock-style proximity magnification ──
  const chipLift = new Float32Array(n);
  const chipMag  = new Float32Array(n).fill(1);
  function applyChipTransforms(instant) {
    // skip the per-frame writes entirely when nothing is hovered/active/pressed
    // and the chips are already at rest
    if (!instant && active === -1 && !inRow) {
      let moving = false;
      for (let i = 0; i < n; i++) { if (chipPress[i] || Math.abs(chipLift[i]) > 0.02 || Math.abs(chipMag[i] - 1) > 0.002) { moving = true; break; } }
      if (!moving) return;
    }
    for (let i = 0; i < n; i++) {
      const isAct = icons[i].classList.contains('is-active');
      const liftT = isAct ? -10 : 0;
      let magT = isAct ? 1.08 : 1;
      if (finePointer && inRow) {
        const dx = rlx - chipC[i].x, dy = rly - chipC[i].y;
        magT += 0.10 * Math.exp(-(dx*dx + dy*dy) / (74 * 74));
      }
      if (chipPress[i]) magT *= 0.92;   // press dip, eased by the same spring
      if (instant) { chipLift[i] = liftT; chipMag[i] = magT; }
      else { chipLift[i] += (liftT - chipLift[i]) * 0.32; chipMag[i] += (magT - chipMag[i]) * 0.32; }
      icons[i].style.transform = `translateY(${chipLift[i].toFixed(2)}px) scale(${chipMag[i].toFixed(3)})`;
    }
  }

  // ── copy morph (fade / slide) ──
  const curC = DEFAULT.col.slice();
  const tgtC = DEFAULT.col.slice();
  let morphing = false;
  function morphCopy(newTitle, newLine, dir) {
    if (reduced) { titleEl.innerHTML = newTitle; lineEl.textContent = newLine; return; }
    if (morphing) { gsap.killTweensOf([titleEl, lineEl]); morphing = false; }
    morphing = true;
    // Opacity + transform only — both GPU-composited, so no per-frame
    // rasterisation. Animating filter:blur() here re-rasterised the big headline
    // every frame and was the section's main hover hitch.
    gsap.to([titleEl, lineEl], {
      autoAlpha: 0, y: dir * -12,
      duration: 0.2, ease: 'power2.in', stagger: 0.03,
      onComplete() {
        titleEl.innerHTML = newTitle;
        lineEl.textContent = newLine;
        gsap.fromTo([titleEl, lineEl],
          { autoAlpha: 0, y: dir * 16 },
          { autoAlpha: 1, y: 0,
            duration: 0.46, ease: 'power3.out', stagger: 0.05,
            onComplete() { morphing = false; } });
      },
    });
  }

  // ── active / default ──
  let active = -1, leaveTimer = null;
  function setActive(idx) {
    clearTimeout(leaveTimer);
    if (!entered) interruptEntrance();
    idx = clamp(idx, 0, n - 1);
    if (idx === active) return;
    active = idx;
    const f = FEATURES[idx];
    tgtC[0] = f.col[0]; tgtC[1] = f.col[1]; tgtC[2] = f.col[2];
    // one colour voice: the headline's accent word follows the feature colour
    // via --fx (see .af.is-exhibiting .af__title .lime)
    section.style.setProperty('--fx', `rgb(${f.col[0]},${f.col[1]},${f.col[2]})`);
    morph.set(T[idx]);
    icons.forEach((el, k) => {
      el.classList.toggle('is-active', k === idx);
      el.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      el.tabIndex = k === idx ? 0 : -1;      // roving tabindex — one tab stop for the whole row
    });
    showExhibits(idx);
    morphCopy(f.title, f.line, 1);
    if (reduced) applyChipTransforms(true);
  }
  function setDefault() {
    if (active === -1) return;
    active = -1;
    tgtC[0] = DEFAULT.col[0]; tgtC[1] = DEFAULT.col[1]; tgtC[2] = DEFAULT.col[2];
    morph.set(restT);
    icons.forEach((el, k) => {
      el.classList.remove('is-active');
      el.setAttribute('aria-selected', 'false');
      el.tabIndex = k === 0 ? 0 : -1;
    });
    showExhibits(-1);
    morphCopy(DEFAULT.title, DEFAULT.line, -1);
    if (reduced) applyChipTransforms(true);
  }
  // press physics — the pressed chip dips through the dock's spring system
  // (inline transforms own these elements, so CSS :active can't reach them)
  const chipPress = new Uint8Array(n);
  icons.forEach((el, k) => {
    el.addEventListener('mouseenter', () => setActive(k));
    el.addEventListener('focus',      () => setActive(k));
    el.addEventListener('click',      () => setActive(k));
    el.addEventListener('pointerdown',   () => { chipPress[k] = 1; });
    el.addEventListener('pointerup',     () => { chipPress[k] = 0; });
    el.addEventListener('pointerleave',  () => { chipPress[k] = 0; });
    el.addEventListener('pointercancel', () => { chipPress[k] = 0; });
    el.tabIndex = k === 0 ? 0 : -1;
  });
  if (row) row.addEventListener('mouseleave', () => { leaveTimer = setTimeout(setDefault, 240); });
  // arrow-key roving — real tablist behaviour (focus handler drives setActive)
  if (row) row.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
    e.preventDefault();
    let next = active === -1 ? 0 : active;
    if (key === 'ArrowRight')     next = (next + 1) % n;
    else if (key === 'ArrowLeft') next = (next - 1 + n) % n;
    else if (key === 'Home')      next = 0;
    else                          next = n - 1;
    icons[next].focus();
  });

  // ── particle sprite ──
  const sp = document.createElement('canvas'); sp.width = sp.height = 8;
  const spc = sp.getContext('2d');
  let spriteKey = -1;
  function buildSprite(c) {
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (key === spriteKey) return;        // only rebuild when the colour changes
    spriteKey = key;
    const k = Math.min(1.7, LIME_LUM / Math.max(1, LUM(c[0], c[1], c[2])));   // brightness compensation
    spc.clearRect(0, 0, 8, 8);
    // base alpha runs lower than it looks because the field composites additively
    // ('lighter') — overlapping particles sum, so a modest per-sprite alpha blooms
    // in dense areas (the rest ring) while still lifting sparse hover glyphs.
    const g = spc.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0,   `rgba(${c[0]},${c[1]},${c[2]},${(.55 * k).toFixed(3)})`);
    g.addColorStop(0.4, `rgba(${c[0]},${c[1]},${c[2]},${(.13 * k).toFixed(3)})`);
    g.addColorStop(1,   `rgba(${c[0]},${c[1]},${c[2]},0)`);
    spc.fillStyle = g; spc.fillRect(0, 0, 8, 8);
  }

  // ── ambient wash, baked once per colour ──
  // The soft radial glow behind the particles. Re-creating a full-canvas
  // gradient every frame churns memory and shades millions of pixels; instead we
  // bake it into a small offscreen buffer (only when the colour changes) and blit
  // it each frame — a soft gradient upscales with no visible artefacts.
  const WASH = 512;
  const washCv = document.createElement('canvas'); washCv.width = washCv.height = WASH;
  const washc = washCv.getContext('2d');
  let washKey = -1;
  function buildWash(c) {
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (key === washKey) return;
    washKey = key;
    const k = Math.min(1.7, LIME_LUM / Math.max(1, LUM(c[0], c[1], c[2])));   // brightness compensation
    washc.clearRect(0, 0, WASH, WASH);
    const g = washc.createRadialGradient(WASH / 2, WASH / 2, 0, WASH / 2, WASH / 2, WASH / 2);
    // Smooth, near-Gaussian falloff. A 3-stop ramp left visible contour rings on
    // high-DPI / 4K screens (8-bit banding over the dark background); the extra
    // stops dissolve the steps. Peak alpha kept low (~.11) so any residual 8-bit
    // step is below the perceptual threshold — the static grain layer dithers the
    // rest. Reads as a soft, premium pool rather than a banded wash.
    g.addColorStop(0,    `rgba(${c[0]},${c[1]},${c[2]},${(.110 * k).toFixed(3)})`);
    g.addColorStop(0.16, `rgba(${c[0]},${c[1]},${c[2]},${(.078 * k).toFixed(3)})`);
    g.addColorStop(0.34, `rgba(${c[0]},${c[1]},${c[2]},${(.043 * k).toFixed(3)})`);
    g.addColorStop(0.54, `rgba(${c[0]},${c[1]},${c[2]},${(.019 * k).toFixed(3)})`);
    g.addColorStop(0.74, `rgba(${c[0]},${c[1]},${c[2]},${(.006 * k).toFixed(3)})`);
    g.addColorStop(0.88, `rgba(${c[0]},${c[1]},${c[2]},${(.002 * k).toFixed(3)})`);
    g.addColorStop(1,    `rgba(${c[0]},${c[1]},${c[2]},0)`);
    washc.fillStyle = g; washc.fillRect(0, 0, WASH, WASH);
  }

  // particles actually drawn this frame — the FPS guard trims this on slow devices
  let drawN = N;

  function draw() {
    for (let k = 0; k < 3; k++) curC[k] += (tgtC[k] - curC[k]) * 0.06;
    // spring parallax — slight trailing momentum
    vx = (vx + (tpx - px) * 0.05) * 0.78; px += vx;
    vy = (vy + (tpy - py) * 0.05) * 0.78; py += vy;
    const cr = curC[0] | 0, cg = curC[1] | 0, cb = curC[2] | 0;
    const cx = bx + px * 26, cy = by + py * 18;

    ctx.clearRect(0, 0, w, h);
    // Glow radius — kept tight so the bloom stays a contained pool behind the
    // content rather than washing across the whole section.
    const R = Math.min(w, h) * 0.42;
    // Rebuilding the wash (a 512² multi-stop radial fill) and the sprite is only
    // needed when the glow COLOUR changes — which only happens while curC eases
    // toward a hovered feature's colour. Two guards keep that off the scroll path:
    //  • quantise the colour to steps of 8 so a transition rebuilds a handful of
    //    times instead of every frame — invisible on a soft, low-alpha bloom;
    //  • never rebuild while actively scrolling — the last frame's wash is reused,
    //    so a hover-then-scroll can't land a 260k-pixel gradient fill mid-scroll
    //    (the exact cause of the post-hover scroll jitter). The hue catches up the
    //    instant scroll settles.
    const qc = [cr & ~7, cg & ~7, cb & ~7];
    // Skip the rebuild while actively scrolling — but NEVER skip the first build
    // (washKey === -1), or the field renders blank while you scroll into the
    // section and the ring only pops in once scrolling stops.
    if (washKey === -1 || performance.now() - lastScrollAt >= 90) { buildWash(qc); buildSprite(qc); }
    ctx.drawImage(washCv, cx - R, cy - R, R * 2, R * 2);

    // At rest the brand arc rotates almost imperceptibly (~1 rev / 90s): the
    // morph targets themselves turn, and the particles chase them — so the
    // rotation shares the exact easing character of every other formation
    // change, and hovering mid-turn hands off seamlessly.
    if (active === -1) {
      restRot += 0.00035;
      const cR = Math.cos(restRot), sR = Math.sin(restRot);
      for (let i = 0; i < N; i++) {
        const x = i*2, y = i*2+1;
        morph[x] = restT[x] * cR - restT[y] * sR;
        morph[y] = restT[x] * sR + restT[y] * cR;
      }
    }

    // Direct morph with character: each particle eases toward the glyph at its
    // own rate (pK — shapes sweep into place rather than arriving as one mass),
    // and ~18% take a curved detour (pSw — perpendicular drift proportional to
    // the remaining delta, self-extinguishing on landing).
    ctx.globalCompositeOperation = 'lighter';   // additive — overlaps bloom into glow
    const tm = performance.now() * 0.001, baseDot = 3.2 * scale;
    const LENS_R2 = 95 * 95, lensOn = finePointer && lpx > -1e4;
    for (let i = 0; i < drawN; i++) {
      const x = i*2, y = i*2+1;
      const mdx = morph[x] - curS[x], mdy = morph[y] - curS[y];
      const k = pK[i], sw = pSw[i];
      curS[x] += mdx * k + mdy * sw;
      curS[y] += mdy * k - mdx * sw;
      const dxj = fsin(tm + rnd[i] * 6.28) * 1.3, dyj = fcos(tm + rnd[i] * 5) * 1.3;
      const ex = px * 16 * (pPlx[i] - 0.9), ey = py * 12 * (pPlx[i] - 0.9); // depth parallax

      let sx = cx + (curS[x] + dxj) * scale + ex;
      let sy = cy + (curS[y] + dyj) * scale + ey;
      // cursor lens — the field yields around the pointer and closes behind it.
      // Draw-space only (curS untouched), so the glyph's true shape is never
      // disturbed and the lens costs one distance check per particle.
      if (lensOn) {
        const ldx = sx - lpx, ldy = sy - lpy;
        const d2 = ldx * ldx + ldy * ldy;
        if (d2 < LENS_R2) {
          const f = 1 - d2 / LENS_R2;
          const s = (f * f * 22) / (Math.sqrt(d2) + 8);
          sx += ldx * s;
          sy += ldy * s;
        }
      }
      const dot = baseDot * pSize[i];
      ctx.globalAlpha = pAlpha[i];
      ctx.drawImage(sp, sx - dot / 2, sy - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── entrance choreography (runs once on first scroll-in) ──
  let entered = false, entranceTL = null, headlineST = null;
  function splitTitleWords(el) {
    const out = [], frag = document.createDocumentFragment();
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
          else if (tok.length) {
            const s = document.createElement('span'); s.className = 'word'; s.textContent = tok;
            frag.appendChild(s); out.push(s);
          }
        });
      } else {
        const s = document.createElement('span'); s.className = 'word';
        s.appendChild(node.cloneNode(true)); frag.appendChild(s); out.push(s);
      }
    });
    el.textContent = ''; el.appendChild(frag);
    return out;
  }
  function restoreTitle() {
    titleEl.innerHTML = DEF_TITLE;
    gsap.set(titleEl, { clearProps: 'opacity,visibility,transform,filter' });
  }
  function interruptEntrance() {
    if (entered) return;
    entered = true;
    if (entranceTL) entranceTL.kill();
    if (headlineST) { headlineST.kill(); headlineST = null; }
    restoreTitle();
    gsap.set(lineEl,   { autoAlpha: 1, y: 0 });
    gsap.set(icons,    { autoAlpha: 1 });
    gsap.set(svgs,     { y: 0 });
  }
  function runEntrance() {
    // Line + icon row cascade in on enter. The headline is handled separately by
    // setupHeadlineReveal (scroll-scrubbed). Kicker is the global .r-up system.
    gsap.set(lineEl, { autoAlpha: 0, y: 14 });
    entranceTL = gsap.timeline();
    entranceTL
      .to(lineEl, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0)
      .to(icons,  { autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.035 }, 0.05)
      .to(svgs,   { y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.035 }, 0.05);
  }
  // Headline lights up word-by-word, scroll-scrubbed — same feel as the
  // Problem/Habits headlines. Opacity-based (works with the lime shimmer word);
  // handed off to the hover-morph on first interaction.
  function setupHeadlineReveal() {
    if (!ScrollTrigger) { gsap.set(titleEl, { autoAlpha: 1 }); return; }
    const words = splitTitleWords(titleEl);
    gsap.set(titleEl, { autoAlpha: 1 });
    words.forEach((wd) => { wd.style.opacity = '0.15'; });
    // remember each word's last quantised opacity — unchanged words skip the
    // style write, so a scrolled frame only invalidates the 2–3 words that are
    // actually mid-transition (same discipline as the main.js headline fills)
    const lastQ = new Int16Array(words.length).fill(-1);
    headlineST = ScrollTrigger.create({
      trigger: titleEl, start: 'top 85%', end: 'top 30%', scrub: 0.4,
      onUpdate(self) {
        if (entered) return;            // after first hover, the morph owns the headline
        const p = self.progress, L = words.length;
        for (let i = 0; i < L; i++) {
          const lo = (i - 0.5) / L, hi = (i + 1.2) / L;
          const t = Math.max(0, Math.min(1, (p - lo) / (hi - lo)));
          const q = Math.round((0.15 + (1 - Math.pow(1 - t, 3)) * 0.85) * 100);
          if (q === lastQ[i]) continue;
          lastQ[i] = q;
          words[i].style.opacity = q / 100;
        }
      },
    });
  }

  // ── boot ──
  if (reduced) {
    curS.set(restT);
    draw();
    applyChipTransforms(true);
    return;
  }
  // pre-hide entrance elements so nothing flashes before the section scrolls in
  // (title is owned by the scroll-scrubbed headline reveal, set up below)
  gsap.set(lineEl,   { autoAlpha: 0 });
  gsap.set(icons,    { autoAlpha: 0 });
  gsap.set(svgs,     { y: 16 });
  setupHeadlineReveal();

  // While Lenis is actively scrolling, halve the field's frame rate so it yields
  // the main thread to smooth scrolling (the ambient field isn't scrutinised mid-scroll).
  // We also suppress pointer interaction on the icon row for the duration: when the
  // page scrolls under a stationary cursor, icons sliding past would otherwise fire
  // mouseenter → setActive (full particle + copy + exhibit morph), thrashing the
  // main thread and stuttering the scroll. .af--scrolling disables pointer-events on
  // the row (CSS), so no accidental hover; it's lifted ~150ms after scroll settles,
  // and a deliberate mouse move onto an icon then activates it as normal.
  let scrollSettle = null;
  if (lenis && lenis.on) lenis.on('scroll', () => {
    lastScrollAt = performance.now();
    if (!finePointer) return;             // touch: no hover to suppress, keep taps live
    section.classList.add('af--scrolling');
    clearTimeout(scrollSettle);
    scrollSettle = setTimeout(() => section.classList.remove('af--scrolling'), 150);
  });

  let running = false, raf = 0, fired = false, tick = 0, lastT = 0, emaDt = 16.7;
  function loop() {
    if (!running) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    tick++;
    // refresh the cached parallax rect at most once per frame, only after a scroll
    if (rectDirty) { secRect = section.getBoundingClientRect(); if (row) rowRect = row.getBoundingClientRect(); rectDirty = false; }
    // frame-time guard: track a smoothed dt and trim/grow the drawn particle
    // count so the field holds ~60fps on whatever device it lands on.
    const now = performance.now();
    const dt = lastT ? now - lastT : 16.7;
    lastT = now;
    if (dt < 100) emaDt += (dt - emaDt) * 0.08;          // ignore post-pause spikes
    if ((tick & 31) === 0) {
      if (emaDt > 22 && drawN > N * 0.45)      drawN = Math.max((N * 0.45) | 0, drawN - ((N * 0.12) | 0));
      else if (emaDt < 18 && drawN < N)        drawN = Math.min(N, drawN + ((N * 0.05) | 0));
    }
    const scrolling = now - lastScrollAt < 90;
    if (scrolling && (tick & 1)) return;
    draw();
    // Dock magnification is frozen mid-scroll (the row ignores the pointer), so
    // skip the 15 per-icon transform writes while actively scrolling — they resume
    // and ease the instant scroll settles.
    if (!scrolling) applyChipTransforms(false);
  }
  const io = new IntersectionObserver((entries) => {
    running = entries[0].isIntersecting;
    if (running) lastT = 0;                 // don't let the gap skew the dt average
    if (running && !raf) raf = requestAnimationFrame(loop);
    if (running && !fired) { fired = true; measureChips(); runEntrance(); }
  }, { threshold: 0.1 });
  io.observe(section);
  // returning to the tab leaves a long gap; reset the dt clock so the guard
  // doesn't misread it as one slow frame.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastT = 0; }, { passive: true });
}

// ── pixel-sample an icon drawing into S-space points ──
function sample(draw) {
  const o = document.createElement('canvas'); o.width = o.height = S;
  const c = o.getContext('2d');
  c.fillStyle = '#fff'; c.strokeStyle = '#fff';
  draw(c);
  const d = c.getImageData(0, 0, S, S).data, pts = [];
  for (let y = 0; y < S; y += 3) for (let x = 0; x < S; x += 3) {
    if (d[(y * S + x) * 4 + 3] > 140) pts.push([x - 150, y - 150]);
  }
  for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = pts[i]; pts[i] = pts[j]; pts[j] = t; }
  return pts;
}
function rr(c, x, y, bw, bh, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + bw, y, x + bw, y + bh, r);
  c.arcTo(x + bw, y + bh, x, y + bh, r);
  c.arcTo(x, y + bh, x, y, r);
  c.arcTo(x, y, x + bw, y, r);
  c.closePath();
}

function drawShield(c) {
  c.beginPath();
  c.moveTo(150, 42); c.lineTo(246, 80); c.lineTo(246, 150);
  c.quadraticCurveTo(246, 226, 150, 262);
  c.quadraticCurveTo(54, 226, 54, 150);
  c.lineTo(54, 80); c.closePath(); c.fill();
}
function drawLock(c) {
  rr(c, 84, 128, 132, 122, 20); c.fill();          // body
  c.lineWidth = 26; c.beginPath();                  // shackle
  c.arc(150, 126, 44, Math.PI, 2 * Math.PI); c.stroke();
}
function drawCalendar(c) {
  c.lineWidth = 14; rr(c, 58, 72, 184, 168, 18); c.stroke();
  c.fillRect(58, 80, 184, 30);
  c.fillRect(98, 52, 16, 32); c.fillRect(186, 52, 16, 32);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) c.fillRect(86 + k * 52, 148 + r * 38, 26, 18);
}
function drawFlame(c) {                       // streaks — fire
  // outer flame: bulging body, leaning pointed tip, a curling lick on the right
  c.beginPath();
  c.moveTo(150, 262);
  c.bezierCurveTo(98, 248, 80, 190, 116, 148);   // left flank up
  c.bezierCurveTo(138, 120, 122, 92, 152, 46);   // shoulder to the leaning tip
  c.bezierCurveTo(172, 84, 198, 108, 192, 152);  // tip down the right
  c.bezierCurveTo(214, 146, 216, 188, 196, 216); // right lick curling out
  c.bezierCurveTo(186, 242, 174, 252, 150, 262); // back to the base
  c.closePath(); c.fill();

  // punch out a hot inner core so the particles read as fire, not a blob
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.moveTo(150, 244);
  c.bezierCurveTo(128, 234, 122, 200, 144, 172);
  c.bezierCurveTo(150, 162, 152, 152, 156, 142);
  c.bezierCurveTo(178, 172, 180, 212, 150, 244);
  c.closePath(); c.fill();
  c.restore();
}
function drawInsight(c) {
  c.lineWidth = 14; c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(64, 210); c.lineTo(118, 168); c.lineTo(158, 188); c.lineTo(212, 108); c.lineTo(242, 86);
  c.stroke();
  c.beginPath(); c.arc(242, 86, 13, 0, 6.3); c.fill();   // insight node
  c.fillRect(54, 236, 196, 9);                            // baseline
}
function drawBars(c) {
  const hh = [58, 100, 78, 140, 110, 168, 92];
  for (let i = 0; i < 7; i++) { rr(c, 60 + i * 27, 240 - hh[i], 18, hh[i], 6); c.fill(); }
  c.fillRect(52, 244, 200, 9);
}
function drawBan(c) {                        // blocking — prohibition ring
  c.lineWidth = 24;
  c.beginPath(); c.arc(150, 150, 92, 0, 6.3); c.stroke();
  c.beginPath(); c.moveTo(86, 86); c.lineTo(214, 214); c.stroke();
}
function drawTarget(c) {                      // focus sessions — bullseye
  c.lineWidth = 22;
  c.beginPath(); c.arc(150, 150, 94, 0, 6.3); c.stroke();
  c.beginPath(); c.arc(150, 150, 52, 0, 6.3); c.stroke();
  c.beginPath(); c.arc(150, 150, 16, 0, 6.3); c.fill();
}
function drawBubble(c) {                      // CBT — thought bubble
  rr(c, 56, 60, 188, 132, 46); c.fill();
  c.beginPath(); c.arc(98, 214, 17, 0, 6.3); c.fill();
  c.beginPath(); c.arc(70, 240, 9, 0, 6.3); c.fill();
}
function drawArrowUp(c) {                     // momentum — up arrow
  c.beginPath();
  c.moveTo(150, 40); c.lineTo(234, 152); c.lineTo(188, 152);
  c.lineTo(188, 252); c.lineTo(112, 252); c.lineTo(112, 152);
  c.lineTo(66, 152); c.closePath(); c.fill();
}
function drawFlag(c) {                        // identity journey — flag
  c.fillRect(62, 44, 16, 216);
  c.beginPath();
  c.moveTo(78, 52); c.lineTo(222, 52); c.lineTo(190, 92);
  c.lineTo(222, 132); c.lineTo(78, 132); c.closePath(); c.fill();
}
function drawTrophy(c) {                      // leaderboard — cup
  c.beginPath();
  c.moveTo(98, 54); c.lineTo(202, 54); c.lineTo(202, 96);
  c.quadraticCurveTo(202, 152, 150, 152);
  c.quadraticCurveTo(98, 152, 98, 96); c.closePath(); c.fill();
  c.lineWidth = 14;
  c.beginPath(); c.arc(98, 84, 22, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
  c.beginPath(); c.arc(202, 84, 22, Math.PI * 1.5, Math.PI * 0.5); c.stroke();
  c.fillRect(140, 152, 20, 50);
  rr(c, 108, 202, 84, 20, 6); c.fill();
}
function drawWidget(c) {                      // widgets — 2x2 tiles
  const s = 78, g = 18, x0 = 66, y0 = 66;
  rr(c, x0, y0, s, s, 16); c.fill();
  rr(c, x0 + s + g, y0, s, s, 16); c.fill();
  rr(c, x0, y0 + s + g, s, s, 16); c.fill();
  rr(c, x0 + s + g, y0 + s + g, s, s, 16); c.fill();
}
function drawCloud(c) {                       // cloud sync
  c.beginPath(); c.arc(110, 162, 44, 0, 6.3); c.fill();
  c.beginPath(); c.arc(158, 140, 56, 0, 6.3); c.fill();
  c.beginPath(); c.arc(202, 166, 40, 0, 6.3); c.fill();
  rr(c, 108, 160, 96, 48, 24); c.fill();
}
function drawGlobe(c) {                       // browser pairing
  c.lineWidth = 16;
  c.beginPath(); c.arc(150, 150, 96, 0, 6.3); c.stroke();
  c.beginPath(); c.moveTo(56, 150); c.lineTo(244, 150); c.stroke();
  c.lineWidth = 14;
  c.beginPath(); c.ellipse(150, 150, 46, 96, 0, 0, 6.3); c.stroke();
}

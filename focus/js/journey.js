// Identity card strip — scroll-bound reveal (first 10) + auto-reveal rest
import { renderSigil } from './sigil.js';

// Per-stage palettes: edge color + 3-stop body gradient
const PALETTES = [
  { edge: '#64D2FF', body: ['#B8DCE6','#D1E3CF','#DFE8C5'] }, // 0
  { edge: '#57F1FF', body: ['#ADDCD6','#D0E2E8','#DDE7C2'] }, // 1
  { edge: '#8FFFDB', body: ['#BDDDBF','#DEE2AB','#B7DCD8'] }, // 2
  { edge: '#BFFF47', body: ['#D2E29A','#B2D9D0','#E1E5B6'] }, // 3
  { edge: '#56E06F', body: ['#B2DDB3','#D5DFA8','#B7D9CA'] }, // 4
  { edge: '#FFD166', body: ['#EAD3A2','#C5DDCC','#E1E1BE'] }, // 5
  { edge: '#FF9F0A', body: ['#E7C79F','#DADDB0','#B2D8CB'] }, // 6
  { edge: '#FF6B8A', body: ['#E5B8C2','#E9D4B0','#C0DED7'] }, // 7
  { edge: '#D86BFF', body: ['#D1BFE0','#BFD8E4','#E7DCAE'] }, // 8
  { edge: '#8C8DFF', body: ['#BFC0E1','#D1D9E6','#DECBE3'] }, // 9
  { edge: '#5AC8FA', body: ['#B4D9E6','#CBE4D8','#E5DCAE'] }, // 10
  { edge: '#F4F8EC', body: ['#E1E2D8','#CEE3D6','#BEDDE4'] }, // 11
  { edge: '#E8F4EC', body: ['#D4E8D8','#C8E4DC','#B8DEDA'] }, // 12
  { edge: '#4FACFE', body: ['#9BC8E1','#C0D9E8','#D8E5CD'] }, // 13
  { edge: '#7C6DFF', body: ['#B8BEDF','#C5CFE8','#D8D1E5'] }, // 14
  { edge: '#C77DFF', body: ['#D8BFE8','#E0D0E8','#D0C5E0'] }, // 15
  { edge: '#2EC17A', body: ['#A8D9BE','#C5DFC9','#D5E8BD'] }, // 16
  { edge: '#FF4B6E', body: ['#E8B8C0','#DFD0BE','#D0DCB8'] }, // 17
  { edge: '#FF9E74', body: ['#E8D0C0','#EFD5B0','#D0E0D8'] }, // 18
  { edge: '#C8D6E8', body: ['#D8E0E8','#E0E4E8','#E4E0D8'] }, // 19
  { edge: '#FFD700', body: ['#EFE0A0','#DFE0B0','#C8DFCF'] }, // 20
  { edge: '#9AB0C8', body: ['#C8D0D8','#D0D8E0','#D8D0E0'] }, // 21
  { edge: '#F8FBFF', body: ['#EEF0F8','#F0EEF8','#F0F4E8'] }, // 22
];

// Motivational quotes per stage — back face of flipped card, indexed by stage.n - 1
const QUOTES = [
  'Every great journey begins with a single restless moment of choosing to begin.',
  'Curiosity is discipline in disguise. You follow what pulls you.',
  'The work teaches you more than any teacher can.',
  'Ritual is what separates intention from identity.',
  'Devotion isn\'t motivation. It\'s what you do when motivation is gone.',
  'The world rewards consistency more than talent.',
  'When the noise rises, the anchored go deeper.',
  'Depth isn\'t found in more hours. It\'s found in fewer distractions.',
  'Every hour spent is a vote for who you\'re becoming.',
  'Adversity doesn\'t interrupt the practice. It is the practice.',
  'When your actions match your values, focus becomes effortless.',
  'You don\'t find focus anymore. You bring it.',
  'What you protect determines what you become.',
  'Standing watch over your attention is the highest form of self-respect.',
  'The boundary you hold today shapes the person you meet tomorrow.',
  'You don\'t find the life you want. You build it, hour by hour.',
  'Where others skim the surface, you know the weight of going under.',
  'Mastery doesn\'t announce itself. It simply shows in everything you do.',
  'You stopped asking for permission to be who you already are.',
  'Rising is not about leaving what matters. It\'s about becoming worthy of it.',
  'A streak is just a word. This is a way of being.',
  'The light you carry didn\'t come from trying to shine. It came from never stopping.',
];

// Short statements per stage — indexed by stage.n - 1 (stages 1–22)
const STATEMENTS = [
  'Moving before knowing where.',
  'Pulling threads to see what unravels.',
  'Learning to sit with the work.',
  'Routine becomes ritual.',
  'Showing up when no one watches.',
  'Unmoved by the noise outside.',
  'Rooted even when the wind picks up.',
  'Depth over distance, always.',
  'Every hour chosen, not spent.',
  'Adversity lands differently now.',
  'What you do matches who you are.',
  'Focus is no longer practice. It\'s posture.',
  'You hold what others let slip.',
  'Standing watch so others can rest.',
  'The boundary holds because you do.',
  'You don\'t find focus. You build it.',
  'Where others skim, you go under.',
  'The work shows. So do you.',
  'Mastery is just discipline, compounded.',
  'Rising without leaving what matters.',
  'Not a streak. A way of being.',
  'The light doesn\'t draw attention. It is.',
];

function hexRGB(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

// ── Build one identity card ───────────────────────────────
function buildCard(stage) {
  const pal = PALETTES[stage.n] ?? PALETTES[1];
  const [er, eg, eb] = hexRGB(pal.edge);
  const rgba = (a) => `rgba(${er},${eg},${eb},${a})`;

  const card = document.createElement('div');
  card.className = 'icard';
  card.style.cssText = [
    `--crystal: linear-gradient(135deg,rgba(255,255,255,.86),rgba(255,255,255,.42) 30%,${rgba(.36)} 55%,${rgba(.12)} 75%,rgba(0,0,0,.07))`,
    `--body: linear-gradient(135deg,${pal.body[0]},${pal.body[1]},${pal.body[2]})`,
    `--bloom-a: ${rgba(.20)}`,
    `--bloom-b: ${rgba(.06)}`,
    `--bloom-r: radial-gradient(circle,${rgba(.34)} 0%,transparent 70%)`,
    `--rim: ${rgba(.55)}`,
  ].join(';');

  const face = document.createElement('div');
  face.className = 'icard__face';

  const glare   = document.createElement('div'); glare.className   = 'icard__glare';
  const shimmer = document.createElement('div'); shimmer.className = 'icard__shimmer';

  const med   = document.createElement('div'); med.className   = 'icard__medallion';
  const bloom = document.createElement('div'); bloom.className = 'icard__bloom';
  const disc  = document.createElement('div'); disc.className  = 'icard__disc';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icard__sigil');
  svg.setAttribute('viewBox', '0 0 320 320');
  renderSigil(svg, stage.n, { tint: '#BFFF47', stroke: 1.8 });

  disc.appendChild(svg);
  med.append(bloom, disc);

  const name = document.createElement('div');
  name.className = 'icard__name';
  name.textContent = stage.name;

  const stmt = document.createElement('div');
  stmt.className = 'icard__stmt';
  stmt.textContent = STATEMENTS[stage.n - 1] ?? '';

  const no = document.createElement('div');
  no.className = 'icard__no';
  const ln1 = document.createElement('span'); ln1.className = 'icard__no-line';
  const ln2 = document.createElement('span'); ln2.className = 'icard__no-line';
  no.append(ln1, `STAGE ${String(stage.n).padStart(2,'0')} / 22`, ln2);

  face.prepend(glare, shimmer);
  face.append(med, name, stmt, no);

  // Proximity border glow — conic gradient arc that sweeps toward the cursor
  const edge = document.createElement('div');
  edge.className = 'icard__edge';

  // Back face — motivational quote revealed on flip
  const back = document.createElement('div');
  back.className = 'icard__back';

  const backNo = document.createElement('div');
  backNo.className = 'icard__back-no';
  backNo.textContent = `STAGE ${String(stage.n).padStart(2, '0')}`;

  const backQuote = document.createElement('p');
  backQuote.className = 'icard__back-quote';
  backQuote.textContent = QUOTES[stage.n - 1] ?? '';

  const backName = document.createElement('div');
  backName.className = 'icard__back-name';
  backName.textContent = stage.name;

  back.append(backNo, backQuote, backName);

  // body = flip layer: the ENTIRE card (crystal rim + face + back + edge) rotates
  // together so the stack stays coherent during the flip.
  const body = document.createElement('div');
  body.className = 'icard__body';
  body.appendChild(face);
  body.appendChild(back);
  body.appendChild(edge);

  // tilt = thin JS-controlled layer between the icard shell and body.
  // Keeps tilt transforms separate from the CSS flip transition on body.
  const tilt = document.createElement('div');
  tilt.className = 'icard__tilt';
  tilt.appendChild(body);
  card.appendChild(tilt);

  return { card, tilt, body, face, glare, shimmer };
}

// ── Tilt + lime glow on hover ─────────────────────────────
// Tilt is applied to the icard__tilt wrapper so it stays separate from the CSS
// flip transition on icard__body — both live on different elements.
function attachHover(card, tilt, face, glare, shimmer, reduced) {
  if (reduced || !matchMedia('(hover: hover)').matches) return;
  let rX = 0, rY = 0, tX = 0, tY = 0, raf = null, inside = false;
  const MAX = 18, LERP = 0.10;

  function loop() {
    rX += (tX - rX) * LERP;
    rY += (tY - rY) * LERP;
    tilt.style.transform = `perspective(500px) rotateX(${rX.toFixed(3)}deg) rotateY(${rY.toFixed(3)}deg)`;
    const done = Math.abs(tX - rX) < 0.04 && Math.abs(tY - rY) < 0.04;
    if (done) { raf = null; if (!inside) tilt.style.transform = ''; }
    else       { raf = requestAnimationFrame(loop); }
  }

  face.addEventListener('mouseenter', () => {
    if (card.classList.contains('is-flipped')) return;
    inside = true;
    card.classList.add('is-hovered');
    glare.style.opacity   = '1';
    shimmer.style.opacity = '1';
  });
  face.addEventListener('mousemove', (e) => {
    if (card.classList.contains('is-flipped')) return;
    const r = face.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top)  / r.height;
    tX = (0.5 - py) * MAX;
    tY = (px - 0.5) * MAX;
    face.style.setProperty('--mx', `${px * 100}%`);
    face.style.setProperty('--my', `${py * 100}%`);
    if (!raf) raf = requestAnimationFrame(loop);
  });
  face.addEventListener('mouseleave', () => {
    inside = false;
    card.classList.remove('is-hovered');
    tX = 0; tY = 0;
    glare.style.opacity   = '0';
    shimmer.style.opacity = '0';
    if (!raf) raf = requestAnimationFrame(loop);
  });

  // Back face — tilt only, no hover effects
  const back = card.querySelector('.icard__back');
  if (back && !reduced) {
    back.addEventListener('mouseenter', () => { inside = true; });
    back.addEventListener('mousemove', (e) => {
      const r  = back.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top)  / r.height;
      tX = (0.5 - py) * MAX;
      tY = (px - 0.5) * MAX;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    back.addEventListener('mouseleave', () => {
      inside = false;
      tX = 0; tY = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  // Flip on click — always reset hover/tilt state for a clean transition both ways
  let flipping = false;
  card.addEventListener('click', () => {
    if (flipping) return;
    flipping = true;
    card.classList.toggle('is-flipped');
    inside = false;
    card.classList.remove('is-hovered');
    tX = 0; tY = 0;
    glare.style.opacity   = '0';
    shimmer.style.opacity = '0';
    if (!raf) raf = requestAnimationFrame(loop);
    setTimeout(() => { flipping = false; }, 750);
  });
}

// ── Main export ───────────────────────────────────────────
export function initJourney(root, stages, gsap, ScrollTrigger) {
  if (!root) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Build strip DOM ──────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'journey__strip-wrap';

  const strip = document.createElement('div');
  strip.className = 'journey__strip';
  wrap.appendChild(strip);

  const cardEls = [];

  stages.forEach((stage) => {
    const item = document.createElement('div');
    item.className = 'journey__strip-item';
    const { card, tilt, body, face, glare, shimmer } = buildCard(stage);
    item.appendChild(card);
    strip.appendChild(item);
    cardEls.push({ item, card, tilt, body, face, glare, shimmer });
  });

  root.appendChild(wrap);

  // ── 2. Scroll progress rail ──────────────────────────────
  // Premium horizontal-scroll affordance (replaces the old "drag to explore"
  // pill + arrows). A slim track with a lime thumb: the thumb's width is the
  // fraction of the strip on screen and its position is how far you've travelled,
  // so it reads as a refined scrollbar that says "these cards move sideways"
  // without any pill or arrows. Driven by updateRail() below.
  const rail = document.createElement('div');
  rail.className = 'journey__rail';
  rail.setAttribute('aria-hidden', 'true');

  const railThumb = document.createElement('span');
  railThumb.className = 'journey__rail-thumb';
  rail.appendChild(railThumb);

  const pin  = root.closest('.journey__pin') ?? root.parentElement;
  const foot = pin?.querySelector('.journey__foot');
  pin?.appendChild(rail);

  // ── 3. Layout + animation (after first paint) ────────────
  requestAnimationFrame(() => {
    // How many cards scroll drives; rest auto-reveal on pin release
    const BOUND_COUNT = 10;
    // Scroll distance for the pin (× viewport height)
    const PIN_MULT    = 1.2;

    // ── Scale cards to fit vertical space ───────────────
    const header  = pin?.querySelector('.journey__header-grid');
    const headerH = header ? header.getBoundingClientRect().height : 200;

    let stripScale = Math.min(0.75, Math.max(0.34,
      (window.innerHeight - headerH - 48) * 0.66 / 321));
    strip.style.setProperty('--strip-scale', stripScale.toFixed(4));

    cardEls.forEach(({ card, tilt, face, glare, shimmer }) =>
      attachHover(card, tilt, face, glare, shimmer, reduced));


    // ── Compute how far to slide during scrub ────────────
    // Just enough to bring the BOUND_COUNT-th card fully on screen.
    // Uses offsetLeft (relative to strip — strip has position:relative in CSS).
    let boundSlideX = 0;
    const computeBoundSlide = () => {
      if (cardEls.length < BOUND_COUNT) { boundSlideX = 0; return; }
      const sc        = parseFloat(strip.style.getPropertyValue('--strip-scale')) || stripScale;
      const cardW     = Math.round(260 * sc);
      const lastItem  = cardEls[BOUND_COUNT - 1].item;
      const lastRight = lastItem.offsetLeft + cardW;
      boundSlideX = -Math.max(0, lastRight - wrap.clientWidth + 40);
    };
    computeBoundSlide();

    // ── Full-strip max drag extent ───────────────────────
    let maxX = 0;
    const computeMax = () => {
      maxX = -Math.max(0, strip.scrollWidth - wrap.clientWidth);
    };
    computeMax();

    // ── Drag + inertia state ────────────────────────────
    let dragX = 0, vel = 0, startX = 0, lastMX = 0;
    let dragging = false, draf = null;
    let dragEnabled = !!reduced; // only true immediately for reduced-motion

    const applyX = (x) => {
      dragX = Math.max(maxX, Math.min(0, x));
      strip.style.transform = `translateX(${dragX}px)`;
      updateRail();
    };

    const coast = () => {
      cancelAnimationFrame(draf);
      const tick = () => {
        vel   *= 0.93;
        dragX  = Math.max(maxX, Math.min(0, dragX + vel));
        strip.style.transform = `translateX(${dragX}px)`;
        updateRail();
        rectsDirty = true; // cards coasting — glow centers stale
        if (dragX <= maxX || dragX >= 0) vel = 0;
        draf = Math.abs(vel) > 0.2 ? requestAnimationFrame(tick) : null;
      };
      draf = requestAnimationFrame(tick);
    };

    // ── Rail lifecycle ───────────────────────────────────
    // Map the strip's current x onto the thumb: width = the visible fraction of
    // the strip, left = how far through the travel you are (0 at the first card,
    // 1 at the last). Called on every drag/inertia frame and on resize.
    let railVisible = false;
    const updateRail = () => {
      if (maxX >= 0) { railThumb.style.left = '0%'; railThumb.style.width = '100%'; return; }
      const cur     = parseFloat(gsap.getProperty(strip, 'x')) || 0;
      const p       = Math.max(0, Math.min(1, cur / maxX));            // 0 at start → 1 at end
      const visible = Math.max(0.14, Math.min(1, wrap.clientWidth / strip.scrollWidth));
      railThumb.style.width = (visible * 100).toFixed(2) + '%';
      railThumb.style.left  = (p * (1 - visible) * 100).toFixed(2) + '%';
    };

    const showRail = () => {
      updateRail();
      if (railVisible || reduced) return;
      railVisible = true;
      gsap.to(rail, { opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.25 });
    };

    const hideRail = () => {
      if (!railVisible) return;
      railVisible = false;
      gsap.to(rail, { opacity: 0, duration: 0.3, ease: 'power1.in' });
    };

    // ── Pointer / wheel events ───────────────────────────
    wrap.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !dragEnabled) return;
      dragging = true;
      startX   = e.clientX - dragX;
      lastMX   = e.clientX;
      vel = 0;
      cancelAnimationFrame(draf);
      strip.style.transition    = 'none';
      strip.style.pointerEvents = 'none';
      wrap.classList.add('is-dragging');
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      vel    = e.clientX - lastMX;
      lastMX = e.clientX;
      applyX(e.clientX - startX);
      rectsDirty = true; // cards moved — glow centers stale
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('is-dragging');
      strip.style.pointerEvents = '';
      coast();
    };
    wrap.addEventListener('pointerup',     endDrag);
    wrap.addEventListener('pointercancel', endDrag);

    // Trackpad / horizontal wheel — only after pin releases
    wrap.addEventListener('wheel', (e) => {
      if (!dragEnabled) return;
      const dx = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : 0;
      if (Math.abs(dx) < 1) return;
      e.preventDefault();
      cancelAnimationFrame(draf);
      vel = -dx * 0.5;
      applyX(dragX - dx);
      coast();
      rectsDirty = true; // cards moved — glow centers stale
    }, { passive: false });

    // ── Proximity border glow ────────────────────────────────
    // Conic-gradient arc on each card border sweeps toward the cursor.
    //
    // Performance rules (the earlier version was janky because it broke these):
    //  • pointermove does ZERO layout reads — it uses cached card centers.
    //  • Card centers recompute only when cards actually move
    //    (scroll / drag / resize), flagged via rectsDirty.
    //  • Only ACTIVE cards (cursor within proximity) get per-frame writes;
    //    the other ~20 cards are untouched.
    const GLOW_PROXIMITY = 220; // px — activation radius from card center
    const GLOW_PROX_SQ   = GLOW_PROXIMITY * GLOW_PROXIMITY;
    const GLOW_LERP      = 0.14; // angle smoothing — lower = more lag

    const glowStates = cardEls.map(() => ({ angle: 0, target: 0, active: false }));
    let glowRaf    = null;
    let centers    = [];     // cached { cx, cy } per card
    let rectsDirty = true;

    const recomputeCenters = () => {
      centers = cardEls.map(({ card }) => {
        const r = card.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
      rectsDirty = false;
    };

    // Animate only active cards toward their target angle
    const glowTick = () => {
      let running = false;
      for (let i = 0; i < cardEls.length; i++) {
        const s = glowStates[i];
        if (!s.active) continue;
        let diff = s.target - s.angle;
        if (diff >  180) diff -= 360;
        if (diff < -180) diff += 360;
        if (Math.abs(diff) < 0.3) continue;
        s.angle += diff * GLOW_LERP;
        s.angle  = ((s.angle % 360) + 360) % 360;
        cardEls[i].card.style.setProperty('--glow-a', s.angle.toFixed(1) + 'deg');
        running = true;
      }
      glowRaf = running ? requestAnimationFrame(glowTick) : null;
    };

    let pmx = -9999, pmy = -9999, movePending = false;

    const processGlow = () => {
      movePending = false;
      if (rectsDirty) recomputeCenters(); // at most one layout pass per settle
      let needTick = false;
      for (let i = 0; i < cardEls.length; i++) {
        const s = glowStates[i];
        const c = centers[i];
        const dx = pmx - c.cx, dy = pmy - c.cy;
        const isFlipped = cardEls[i].card.classList.contains('is-flipped');
        const near = !isFlipped && (dx * dx + dy * dy) < GLOW_PROX_SQ;
        if (near !== s.active) {
          s.active = near;
          cardEls[i].card.style.setProperty('--glow-active', near ? '1' : '0');
        }
        if (near) {
          // atan2 + 90° so 0deg points at the top of the card (12 o'clock)
          s.target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          needTick = true;
        }
      }
      if (needTick && !glowRaf) glowRaf = requestAnimationFrame(glowTick);
    };

    // Only run the glow while the journey section is on screen — no point
    // looping 22 cards on pointermove while the user is up in the hero.
    let glowEnabled = false;
    if (!reduced && pin) {
      new IntersectionObserver((entries) => {
        glowEnabled = entries[0].isIntersecting;
        if (glowEnabled) rectsDirty = true; // positions changed while off-screen
      }, { rootMargin: '100px' }).observe(pin);

      document.addEventListener('pointermove', (e) => {
        if (!glowEnabled) return;
        pmx = e.clientX; pmy = e.clientY;
        if (!movePending) { movePending = true; requestAnimationFrame(processGlow); }
      }, { passive: true });
      // Cached centers go stale whenever the cards shift on screen
      window.addEventListener('scroll', () => { if (glowEnabled) rectsDirty = true; }, { passive: true });
    }

    // ── Reduced-motion path ──────────────────────────────
    if (reduced) {
      cardEls.forEach(({ item }) => { item.style.opacity = '1'; item.style.transform = 'none'; });
      if (foot) foot.style.opacity = '1';
      // Dragging is enabled immediately for reduced-motion, so show the rail
      // statically (no fade) as the scroll affordance.
      gsap.set(rail, { opacity: 1 });
      updateRail();
      return;
    }

    // ── Animated path ────────────────────────────────────
    const boundCards = cardEls.slice(0, BOUND_COUNT);
    const freeCards  = cardEls.slice(BOUND_COUNT);

    // All cards start hidden
    gsap.set(cardEls.map(c => c.item), { opacity: 0, x: 64 });
    if (foot) gsap.set(foot, { opacity: 0 });

    const CARD_DUR    = 0.18;
    const CARD_LAG    = 0.055;
    const SLIDE_START = 4 * CARD_LAG; // slide begins as card 5 appears

    const tl = gsap.timeline();

    // Footer fades with the very first card
    if (foot) tl.to(foot, { opacity: 1, duration: 0.60, ease: 'power1.out' }, 0);

    // Scroll-driven stagger for bound cards only
    boundCards.forEach((c, i) => {
      tl.to(c.item, { x: 0, opacity: 1, duration: CARD_DUR, ease: 'power2.out' }, i * CARD_LAG);
    });

    // Slide strip just enough to land the 10th card on-screen.
    // Function-based so it re-evaluates correctly after resize invalidation.
    tl.to(strip, { x: () => boundSlideX, duration: 1.0, ease: 'none' }, SLIDE_START);

    // ── Auto-reveal free cards on pin release ────────────
    let didAutoReveal = false;
    const autoRevealFree = () => {
      if (didAutoReveal || freeCards.length === 0) return;
      didAutoReveal = true;
      // Quiet background stagger — cards bloom in without fanfare
      gsap.to(freeCards.map(c => c.item), {
        opacity: 1,
        x:       0,
        duration: 0.45,
        stagger:  0.028,
        ease:     'power2.out',
        delay:    0.15,
      });
    };

    // ── ScrollTrigger pin ─────────────────────────────────
    ScrollTrigger.create({
      trigger:             pin,
      start:               'top top',
      end:                 () => `+=${window.innerHeight * PIN_MULT}`,
      // Low scrub: Lenis already smooths the scroll, so a high scrub stacks a
      // second ease on top — the strip keeps drifting after you stop, which reads
      // as jitter. 0.4 tracks scroll tightly while staying smooth.
      scrub:               0.4,
      pin:                 true,
      animation:           tl,
      // anticipatePin fights Lenis (it shifts the pin a frame early against a
      // smoothed scroll position) and stutters at the lock boundary. Off is steadier.
      invalidateOnRefresh: true,

      onLeave() {
        // Pin released scrolling down — hand control to drag
        dragEnabled = true;
        dragX = parseFloat(gsap.getProperty(strip, 'x')) || boundSlideX;
        autoRevealFree();
        showRail();
      },

      onEnterBack() {
        // User scrolled back up into the pin — GSAP scrub resumes
        dragEnabled = false;
        cancelAnimationFrame(draf);
        draf = null;
        vel  = 0;
        hideRail(); // scrub owns the motion again while pinned
      },
    });

    // ── Resize: recompute scale + layout values ───────────
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newH     = window.innerHeight - (header?.getBoundingClientRect().height ?? 200) - 48;
        stripScale     = Math.min(0.75, Math.max(0.34, newH * 0.66 / 321));
        strip.style.setProperty('--strip-scale', stripScale.toFixed(4));
        // Wait one frame for CSS cascade to flush before measuring offsetLeft
        requestAnimationFrame(() => {
          computeBoundSlide();
          computeMax();
          updateRail();      // thumb size/position depend on maxX + strip width
          rectsDirty = true; // glow centers stale after relayout
          ScrollTrigger.refresh();
        });
      }, 100);
    });
  });

  return { wrap };
}

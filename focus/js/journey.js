// Identity card strip — pinned horizontal scrub + premium draggable scrubber
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
export function initJourney(root, stages, gsap, ScrollTrigger, lenis) {
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

  const pin  = root.closest('.journey__pin') ?? root.parentElement;
  const foot = pin?.querySelector('.journey__foot');

  // ── 2. Premium scrubber — progress readout + draggable handle ──
  // Replaces the old passive rail. The whole strip pans on vertical scroll
  // (pinned scrub); this bar reflects that progress AND lets you grab the handle
  // to scrub directly. The handle seeks the *page scroll* (not the strip
  // transform), so ScrollTrigger stays the single source of truth and nothing
  // fights over the strip's x.
  const scrubber = document.createElement('div');
  scrubber.className = 'journey__scrubber';
  scrubber.innerHTML =
    '<div class="journey__scrub-meta">' +
      '<span class="journey__scrub-count">01 / ' + stages.length + '</span>' +
      '<span class="journey__scrub-name">' + stages[0].name + '</span>' +
    '</div>' +
    '<div class="journey__scrub-track" role="slider" tabindex="0" ' +
         'aria-label="Identity journey progress" aria-valuemin="1" ' +
         'aria-valuemax="' + stages.length + '" aria-valuenow="1">' +
      '<span class="journey__scrub-fill"></span>' +
      '<span class="journey__scrub-handle"></span>' +
    '</div>';
  if (foot) pin.insertBefore(scrubber, foot); else pin?.appendChild(scrubber);

  const track   = scrubber.querySelector('.journey__scrub-track');
  const countEl = scrubber.querySelector('.journey__scrub-count');
  const nameEl  = scrubber.querySelector('.journey__scrub-name');

  // Paint the bar + readout for a 0–1 progress value.
  const setScrub = (p) => {
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    scrubber.style.setProperty('--p', p.toFixed(4));
    const idx = Math.round(p * (stages.length - 1));
    countEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + stages.length;
    nameEl.textContent  = stages[idx].name;
    track.setAttribute('aria-valuenow', String(idx + 1));
  };
  setScrub(0);

  // Wire pointer-drag + keyboard onto the track. seek(p) decides what a 0–1
  // position *does* (drive page scroll, or scrollLeft in the reduced fallback).
  // Returns a getter so callers can tell when the user is actively scrubbing —
  // used to stop the scroll-driven update from fighting the drag.
  const bindScrub = (seek) => {
    let active = false;
    const pAt = (x) => {
      const r = track.getBoundingClientRect();
      return r.width ? Math.max(0, Math.min(1, (x - r.left) / r.width)) : 0;
    };
    const move = (e) => { if (!active) return; const p = pAt(e.clientX); setScrub(p); seek(p); };
    track.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      active = true;
      track.classList.add('is-grabbing');
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
      move(e);
    });
    track.addEventListener('pointermove', move);
    const up = (e) => {
      if (!active) return;
      active = false;
      track.classList.remove('is-grabbing');
      try { track.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    track.addEventListener('keydown', (e) => {
      const step = 1 / (stages.length - 1);
      let p = parseFloat(scrubber.style.getPropertyValue('--p')) || 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') p += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') p -= step;
      else if (e.key === 'Home') p = 0;
      else if (e.key === 'End') p = 1;
      else return;
      e.preventDefault();
      p = Math.max(0, Math.min(1, p));
      setScrub(p); seek(p);
    });
    return () => active;
  };

  // ── 3. Layout + behaviour (after first paint) ──────────────
  requestAnimationFrame(() => {
    const header  = pin?.querySelector('.journey__header-grid');
    const headerH = header ? header.getBoundingClientRect().height : 200;

    // Scale cards so the strip + header + scrubber fit one viewport height.
    const computeScale = () => {
      const avail = window.innerHeight - headerH - (scrubber.offsetHeight || 64) - 40;
      return Math.min(0.78, Math.max(0.34, avail * 0.7 / 321));
    };
    let stripScale = computeScale();
    strip.style.setProperty('--strip-scale', stripScale.toFixed(4));

    cardEls.forEach(({ card, tilt, face, glare, shimmer }) =>
      attachHover(card, tilt, face, glare, shimmer, reduced));

    // Full horizontal travel: from x=0 to the last card aligned at the right edge.
    let maxX = 0;
    const computeMax = () => { maxX = -Math.max(0, strip.scrollWidth - wrap.clientWidth); };
    computeMax();

    // ── Proximity border glow ────────────────────────────────
    // Conic-gradient arc on each card border sweeps toward the cursor.
    //  • pointermove does ZERO layout reads — it uses cached card centers.
    //  • Centers recompute only when cards move (scroll / drag / resize).
    //  • Only ACTIVE cards (cursor within proximity) get per-frame writes.
    const GLOW_PROXIMITY = 220;
    const GLOW_PROX_SQ   = GLOW_PROXIMITY * GLOW_PROXIMITY;
    const GLOW_LERP      = 0.14;
    const glowStates = cardEls.map(() => ({ angle: 0, target: 0, active: false }));
    let glowRaf = null, centers = [], rectsDirty = true;

    const recomputeCenters = () => {
      centers = cardEls.map(({ card }) => {
        const r = card.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
      rectsDirty = false;
    };
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
      if (rectsDirty) recomputeCenters();
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
        if (near) { s.target = Math.atan2(dy, dx) * 180 / Math.PI + 90; needTick = true; }
      }
      if (needTick && !glowRaf) glowRaf = requestAnimationFrame(glowTick);
    };
    let glowEnabled = false;
    if (!reduced && pin) {
      new IntersectionObserver((entries) => {
        glowEnabled = entries[0].isIntersecting;
        if (glowEnabled) rectsDirty = true;
      }, { rootMargin: '100px' }).observe(pin);
      document.addEventListener('pointermove', (e) => {
        if (!glowEnabled) return;
        pmx = e.clientX; pmy = e.clientY;
        if (!movePending) { movePending = true; requestAnimationFrame(processGlow); }
      }, { passive: true });
      window.addEventListener('scroll', () => { if (glowEnabled) rectsDirty = true; }, { passive: true });
    }

    // ── Reduced-motion / no-GSAP: native horizontal scroll + live bar ──
    if (reduced || !ScrollTrigger) {
      wrap.classList.add('is-native');
      cardEls.forEach(({ item }) => { item.style.opacity = '1'; });
      gsap.set(scrubber, { opacity: 1 });
      if (foot) foot.style.opacity = '1';
      const nativeMax = () => Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const dragging = bindScrub((p) => { wrap.scrollLeft = p * nativeMax(); });
      wrap.addEventListener('scroll', () => {
        if (dragging()) return;
        const m = nativeMax();
        setScrub(m ? wrap.scrollLeft / m : 0);
      }, { passive: true });
      return;
    }

    // ── Animated path: self-playing entrance, then free scroll ──
    // No pin, no scroll-linked pan — the section is one ordinary viewport that
    // never competes for the wheel. When it rises into view the cards deal in
    // and the strip glides on its own to stage 06/22, teasing the rest off to
    // the right. From there a downward scroll just carries on to the next
    // section; the scrubber is how you wander through all 22 if you want to.
    gsap.set(cardEls.map(c => c.item), { opacity: 0, xPercent: 16 });
    if (foot) gsap.set(foot, { opacity: 0 });
    gsap.set(scrubber, { opacity: 0 });

    // One 0–1 progress owns the strip x, the readout, and the glow-cache flag.
    let curP = 0;
    const applyP = (p) => {
      curP = p;
      gsap.set(strip, { x: p * maxX });
      setScrub(p);
      rectsDirty = true;
    };

    // Entrance settles at this stage (index 5 → "06 / 22").
    const restIndex = Math.min(5, stages.length - 1);
    const restP = restIndex / (stages.length - 1);

    const enter = { p: 0 };
    const enterTl = gsap.timeline({ paused: true });
    enterTl.to([scrubber, foot].filter(Boolean),
      { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
    enterTl.to(cardEls.map(c => c.item),
      { opacity: 1, xPercent: 0, duration: 0.6, stagger: 0.03, ease: 'power2.out' }, 0);
    enterTl.to(enter,
      { p: restP, duration: 1.7, ease: 'power2.inOut', onUpdate: () => applyP(enter.p) }, 0.35);

    // Play it once, when the section rises into view.
    ScrollTrigger.create({
      trigger: pin, start: 'top 68%', once: true,
      onEnter: () => enterTl.play(),
    });

    // The scrubber owns the strip outright now: dragging (or arrow keys) cancels
    // the entrance glide and pans directly — no page-scroll seeking, no lock.
    bindScrub((p) => { enterTl.pause(); applyP(p); });

    // Horizontal scroll over the cards row pans it directly. A trackpad sideways
    // swipe reports deltaX; a mouse wheel with Shift held reports deltaY — both
    // move the strip 1:1 with content pixels. Vertical intent is left untouched
    // so it flows to Lenis and keeps scrolling the page. stopPropagation keeps
    // Lenis from drifting the page during a sideways gesture.
    wrap.addEventListener('wheel', (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const dx = horizontal ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!dx) return;                       // vertical intent → let the page scroll
      e.preventDefault();
      e.stopPropagation();
      enterTl.pause();
      const unit = e.deltaMode === 1 ? 16 : 1;         // line-mode wheels → px-ish
      applyP(Math.min(1, Math.max(0, curP + (dx * unit) / Math.abs(maxX || 1))));
    }, { passive: false });

    // ── Resize: recompute scale + travel + pin, then refresh ──
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        stripScale = computeScale();
        strip.style.setProperty('--strip-scale', stripScale.toFixed(4));
        requestAnimationFrame(() => {
          computeMax();
          applyP(curP);          // keep the strip at the same stage post-resize
          ScrollTrigger.refresh();
        });
      }, 120);
    });
  });

  return { wrap };
}

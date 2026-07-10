// Interactive grid pattern with proximity glow + mouse-trail comet.
// Faint square grid; cells near the pointer wash with a soft lime halo; cells
// the pointer crosses light up as glowing rounded tiles that shimmer from lime
// (fresh) toward cyan (aging) and shrink away — a continuous comet tail, gap-
// filled even on fast flicks.
export function initGrid(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CELL = 56;
  let w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  let mx = -9999, my = -9999, raf = null, lastActive = 0;
  let lastCi = null, lastCj = null;
  let visible = true;   // set by IntersectionObserver — gates the loop off-screen

  const roundable = typeof ctx.roundRect === 'function';
  const LIME = [191, 255, 71];   // --lime
  const CYAN = [90, 200, 250];   // --cyan

  // Trail: Map<"ci,cj", { ci, cj, life, born, fading, lastTouched }>
  const trail = new Map();

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    trail.clear();
    lastCi = lastCj = null;
    render();              // redraw the static grid after the canvas clears
  }

  function touch(ci, cj) {
    const key = `${ci},${cj}`;
    const cell = trail.get(key);
    const now = performance.now();
    if (cell) {
      cell.life = 1; cell.fading = false; cell.lastTouched = now;
    } else {
      trail.set(key, { ci, cj, life: 1, born: now, fading: false, lastTouched: now });
    }
  }

  // Don't light the grid under the nav strip — the comet trail was firing right
  // under the cursor as the user reached for the nav links, fighting their hover
  // state. Clear + bail when the pointer is in the top NAV_SAFE band.
  const NAV_SAFE = 74;

  function onMove(e) {
    if (!visible) return;   // hero scrolled away — don't track or wake the loop
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    if (my < NAV_SAFE) { onLeave(); return; }
    const ci = Math.floor(mx / CELL), cj = Math.floor(my / CELL);
    if (lastCi === null) { lastCi = ci; lastCj = cj; }

    // Walk every cell between the last sample and this one so a fast flick
    // leaves a continuous streak instead of a dotted line.
    const di = ci - lastCi, dj = cj - lastCj;
    const steps = Math.max(Math.abs(di), Math.abs(dj));
    if (steps === 0) {
      touch(ci, cj);
    } else {
      for (let s = 1; s <= steps; s++) {
        touch(lastCi + Math.round((di * s) / steps), lastCj + Math.round((dj * s) / steps));
      }
    }
    lastCi = ci; lastCj = cj;
    wake();
  }
  function onLeave() { mx = my = -9999; lastCi = lastCj = null; wake(); }

  const R = 150;            // proximity glow radius
  const FADE_DELAY = 120;   // ms a crossed cell holds before fading
  const DECAY = 0.03;       // life lost per frame once fading (~0.55s tail)

  function tile(x, y, size, r) {
    ctx.beginPath();
    if (roundable) ctx.roundRect(x, y, size, size, r);
    else ctx.rect(x, y, size, size);
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    const cols = Math.ceil(w / CELL) + 1;
    const rows = Math.ceil(h / CELL) + 1;
    const now = performance.now();

    // base grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) { const x = i * CELL; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let j = 0; j <= rows; j++) { const y = j * CELL; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // soft proximity halo near the pointer
    if (mx > -9000) {
      const ci = Math.floor(mx / CELL), cj = Math.floor(my / CELL);
      const span = Math.ceil(R / CELL);
      for (let i = ci - span; i <= ci + span; i++) {
        for (let j = cj - span; j <= cj + span; j++) {
          const cx = i * CELL + CELL / 2, cy = j * CELL + CELL / 2;
          const d = Math.hypot(cx - mx, cy - my);
          if (d > R) continue;
          const a = (1 - d / R) ** 1.5 * 0.18;
          ctx.fillStyle = `rgba(191,255,71,${a})`;
          ctx.fillRect(i * CELL + 1, j * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // comet trail — glowing rounded tiles that shimmer lime→cyan and shrink away
    for (const [key, cell] of trail) {
      if (!cell.fading && now - cell.lastTouched > FADE_DELAY) cell.fading = true;
      if (cell.fading) {
        cell.life -= DECAY;
        if (cell.life <= 0) { trail.delete(key); continue; }
      }

      const life = cell.life;
      const eased = life * life;                       // weight brightness to fresh cells
      const birth = Math.min(1, (now - cell.born) / 90); // gentle fade-in, no hard snap
      const k = eased * birth;

      // colour drifts lime → part-way toward cyan as the cell ages
      const t = (1 - life) * 0.7;
      const r = Math.round(LIME[0] + (CYAN[0] - LIME[0]) * t);
      const g = Math.round(LIME[1] + (CYAN[1] - LIME[1]) * t);
      const b = Math.round(LIME[2] + (CYAN[2] - LIME[2]) * t);

      const inset = 1 + (1 - life) * 5;                // shrinks as it dies
      const size = CELL - inset * 2;
      if (size <= 0) continue;
      const x = cell.ci * CELL + inset, y = cell.cj * CELL + inset;

      // soft inner fill
      tile(x, y, size, Math.min(6, size / 3));
      ctx.fillStyle = `rgba(${r},${g},${b},${(k * 0.14).toFixed(3)})`;
      ctx.fill();

      // glowing outline
      ctx.save();
      ctx.shadowColor = `rgba(${r},${g},${b},${k.toFixed(3)})`;
      ctx.shadowBlur = 9 * life;
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = `rgba(${r},${g},${b},${(k * 0.8).toFixed(3)})`;
      tile(x, y, size, Math.min(6, size / 3));
      ctx.stroke();
      ctx.restore();
    }
  }

  // Animate only while there's something live (an active trail or recent pointer
  // movement). Otherwise idle — the last frame (the static grid) stays on screen,
  // so an untouched page (e.g. any phone) costs nothing after the first paint.
  function loop() {
    render();
    if (trail.size || performance.now() - lastActive < 500) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
  function wake() {
    lastActive = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  resize();                       // sizes + paints the static grid once
  addEventListener('resize', resize, { passive: true });
  if (!reduced) {
    addEventListener('mousemove', onMove, { passive: true });
    addEventListener('mouseleave', onLeave, { passive: true });
  }

  // Gate everything on the hero being in view — mirrors heroGradient.js /
  // storyboard.js. Once the hero scrolls past, a stray mousemove down the page
  // can't wake a full grid repaint loop. Re-paints the static grid on re-entry.
  let io = null;
  if (!reduced && typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) { onLeave(); if (raf) { cancelAnimationFrame(raf); raf = null; } }
    }, { rootMargin: '0px' });
    io.observe(canvas);
  }

  return {
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      removeEventListener('resize', resize);
      removeEventListener('mousemove', onMove);
      removeEventListener('mouseleave', onLeave);
    },
  };
}

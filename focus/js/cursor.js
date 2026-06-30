// Custom lime cursor — dot + trailing ring with contextual labels.
export function initCursor() {
  if (matchMedia('(hover: none)').matches) return;

  const dot   = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  const label = trail?.querySelector('.cursor-label');
  if (!dot || !trail) return;

  let cx = -200, cy = -200;   // dot  (snaps)
  let tx = -200, ty = -200;   // trail (lerps)
  let raf;

  document.addEventListener('mousemove', (e) => { cx = e.clientX; cy = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', () => { cx = cy = tx = ty = -200; });

  const HOVER_SEL = 'a:not(.store-btn), button, [data-tilt], input, label, [role="button"], .mode, .chan, [data-scrub-track]';

  function onOver(e) {
    const el = e.target.closest(HOVER_SEL);
    if (!el) return;
    const labelText = el.getAttribute('data-cursor');
    if (labelText !== null && labelText !== '') {
      label.textContent = labelText;
      trail.classList.add('has-label');
    } else {
      dot.classList.add('is-hover');
      trail.classList.add('is-hover');
    }
  }
  function onOut(e) {
    const el = e.target.closest(HOVER_SEL);
    if (!el) return;
    dot.classList.remove('is-hover');
    trail.classList.remove('is-hover', 'has-label');
  }

  document.addEventListener('mouseover', onOver, { passive: true });
  document.addEventListener('mouseout',  onOut,  { passive: true });

  function loop() {
    if (document.hidden) { raf = null; return; }
    raf = requestAnimationFrame(loop);
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    tx += (cx - tx) * 0.16;
    ty += (cy - ty) * 0.16;
    trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
  }
  raf = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !raf) raf = requestAnimationFrame(loop);
  });

  return () => cancelAnimationFrame(raf);
}

// Magnetic pull — elements with .magnetic translate toward the cursor.
export function initMagnetic() {
  if (matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = parseFloat(el.dataset.magnet || '0.3');
    // Lerp toward the cursor target on a single rAF rather than snapping the
    // transform straight from the pointer — adds momentum and batches the write.
    // translate-only, so the element's resting position is unchanged.
    let tx = 0, ty = 0, rx = 0, ry = 0, raf = null, inside = false;
    const LERP = 0.2;
    const loop = () => {
      rx += (tx - rx) * LERP;
      ry += (ty - ry) * LERP;
      const settled = Math.abs(tx - rx) < 0.05 && Math.abs(ty - ry) < 0.05;
      if (settled && !inside) { el.style.transform = ''; raf = null; return; }
      el.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width  / 2)) * strength;
      ty = (e.clientY - (r.top  + r.height / 2)) * strength;
      inside = true;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    el.addEventListener('mouseleave', () => { inside = false; tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  });
}

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

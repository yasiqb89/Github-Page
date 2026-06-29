// App-accurate identity sigils — a faithful port of FocusApp IdentitySigilView.
// Each stage is a sacred-geometry composition of stroked "rings" + filled "dots"
// in lime. Coordinates mirror the Swift source (fractions of a base size).

const TAU = Math.PI * 2;
const BASE = 100;          // 1.0 size unit == 100 viewBox units
const C = BASE * 1.6;      // viewBox centre (frame is size*3.2)
const VB = BASE * 3.2;     // viewBox extent

const ring = (x, y, r) => ({ t: 'ring', x, y, r });
const dot  = (x, y, r) => ({ t: 'dot',  x, y, r });
const polar = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

// Returns the list of primitives for a given stage (0–22), in size-unit space.
export function sigilSpec(stage) {
  switch (stage) {
    case 0:  return [dot(0, 0, 0.25)];
    case 1:  return [dot(0, 0, 0.17), ring(0, 0, 1.0)];
    case 2:  return [ring(-0.25, 0, 0.75), ring(0.25, 0, 0.75)];
    case 3:  return [
      ...polar(3, (i) => { const a = i * TAU / 3; return ring(0.35 * Math.cos(a), 0.35 * Math.sin(a), 0.7); }),
      dot(0, 0, 0.15),
    ];
    case 4:  return [
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.4 * Math.cos(a), 0.4 * Math.sin(a), 0.65); }),
      dot(0, 0, 0.2),
    ];
    case 5:  return [
      ring(0, 0, 0.9),
      ...polar(3, (i) => { const a = i * TAU / 3 - Math.PI / 2; return ring(0.4 * Math.cos(a), 0.4 * Math.sin(a), 0.55); }),
      dot(0, 0, 0.15),
    ];
    case 6:  return [
      ...polar(4, (i) => { const a = i * Math.PI / 2; return ring(0.4 * Math.cos(a), 0.4 * Math.sin(a), 0.65); }),
      dot(0, 0, 0.15),
    ];
    case 7:  return [
      ring(0, 0, 0.45),
      ...polar(4, (i) => { const a = i * Math.PI / 2; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.55); }),
      dot(0, 0, 0.15),
    ];
    case 8:  return [
      ...polar(5, (i) => { const a = i * TAU / 5 - Math.PI / 2; return ring(0.42 * Math.cos(a), 0.42 * Math.sin(a), 0.6); }),
      dot(0, 0, 0.18),
    ];
    case 9:  return [
      ring(0, 0, 0.38),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.48 * Math.cos(a), 0.48 * Math.sin(a), 0.5); }),
      dot(0, 0, 0.18),
    ];
    case 10: return [
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.52 * Math.cos(a), 0.52 * Math.sin(a), 0.52); }),
      ...polar(6, (i) => { const a = i * Math.PI / 3 + Math.PI / 6; return ring(0.32 * Math.cos(a), 0.32 * Math.sin(a), 0.32); }),
      dot(0, 0, 0.18),
    ];
    case 11: return [
      ring(0, 0, 0.65),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.65); }),
      dot(0, 0, 0.22),
    ];
    case 12: return [
      ring(0, 0, 0.88), ring(0, 0, 0.38),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.55); }),
      dot(0, 0, 0.2),
    ];
    case 13: return [
      ring(0, 0, 0.95),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.42); }),
      ...polar(6, (i) => { const a = i * Math.PI / 3 + Math.PI / 6; return dot(0.72 * Math.cos(a), 0.72 * Math.sin(a), 0.1); }),
      dot(0, 0, 0.18),
    ];
    case 14: return [
      ...polar(7, (i) => { const a = i * TAU / 7 - Math.PI / 2; return ring(0.46 * Math.cos(a), 0.46 * Math.sin(a), 0.55); }),
      dot(0, 0, 0.18),
    ];
    case 15: return [
      ...polar(8, (i) => { const a = i * Math.PI / 4; return ring(0.48 * Math.cos(a), 0.48 * Math.sin(a), 0.5); }),
      dot(0, 0, 0.18),
    ];
    case 16: return [ring(0, 0, 0.95), ring(0, 0, 0.62), ring(0, 0, 0.3), dot(0, 0, 0.16)];
    case 17: return [
      ring(0, 0, 0.92), ring(0, 0, 0.36),
      ...polar(8, (i) => { const a = i * Math.PI / 4; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.42); }),
      dot(0, 0, 0.16),
    ];
    case 18: return [
      ring(0, 0, 0.95),
      ...polar(12, (i) => { const a = i * Math.PI / 6; return dot(0.7 * Math.cos(a), 0.7 * Math.sin(a), 0.09); }),
      ring(0, 0, 0.34), dot(0, 0, 0.16),
    ];
    case 19: return [
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.55 * Math.cos(a), 0.55 * Math.sin(a), 0.5); }),
      ...polar(6, (i) => { const a = i * Math.PI / 3 + Math.PI / 6; return ring(0.4 * Math.cos(a), 0.4 * Math.sin(a), 0.38); }),
      ring(0, 0, 0.2), dot(0, 0, 0.13),
    ];
    case 20: return [
      ring(0, 0, 0.95),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.52 * Math.cos(a), 0.52 * Math.sin(a), 0.5); }),
      ...polar(6, (i) => { const a = i * Math.PI / 3 + Math.PI / 6; return dot(0.92 * Math.cos(a), 0.92 * Math.sin(a), 0.09); }),
      dot(0, 0, 0.18),
    ];
    case 21: return [
      ring(0, 0, 0.96),
      ...polar(8, (i) => { const a = i * Math.PI / 4; return ring(0.52 * Math.cos(a), 0.52 * Math.sin(a), 0.44); }),
      ...polar(8, (i) => { const a = i * Math.PI / 4 + Math.PI / 8; return dot(0.78 * Math.cos(a), 0.78 * Math.sin(a), 0.08); }),
      ring(0, 0, 0.3), dot(0, 0, 0.16),
    ];
    default: return [ // 22 — The Luminous, full mandala
      ring(0, 0, 1.0),
      ...polar(12, (i) => { const a = i * Math.PI / 6; return dot(0.86 * Math.cos(a), 0.86 * Math.sin(a), 0.08); }),
      ...polar(6, (i) => { const a = i * Math.PI / 3; return ring(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0.5); }),
      ring(0, 0, 0.34), dot(0, 0, 0.2),
    ];
  }
}

// Renders the inner SVG markup (the <circle> elements) for a stage.
// The caller supplies the <svg viewBox="0 0 320 320">. Lime, thin strokes.
export function sigilMarkup(stage, { tint = '#BFFF47', stroke = 1.7 } = {}) {
  return sigilSpec(stage).map((p) => {
    const cx = (C + p.x * BASE).toFixed(2);
    const cy = (C + p.y * BASE).toFixed(2);
    const r  = (p.r * BASE).toFixed(2);
    if (p.t === 'dot') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tint}"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tint}" stroke-width="${stroke}" stroke-linecap="round"/>`;
  }).join('');
}

export const SIGIL_VIEWBOX = `0 0 ${VB} ${VB}`;

// Robust DOM renderer — builds real SVG nodes (innerHTML on an <svg> root is
// unreliable across engines). Clears and repopulates the given <svg>.
const SVGNS = 'http://www.w3.org/2000/svg';
export function renderSigil(svg, stage, { tint = '#BFFF47', stroke = 1.7 } = {}) {
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  for (const p of sigilSpec(stage)) {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', (C + p.x * BASE).toFixed(2));
    c.setAttribute('cy', (C + p.y * BASE).toFixed(2));
    c.setAttribute('r', (p.r * BASE).toFixed(2));
    if (p.t === 'dot') {
      c.setAttribute('fill', tint);
    } else {
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', tint);
      c.setAttribute('stroke-width', String(stroke));
      c.setAttribute('stroke-linecap', 'round');
    }
    svg.appendChild(c);
  }
}

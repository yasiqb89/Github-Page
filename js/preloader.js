// Preloader — "Kinetic Wordmark".
//
// Full-bleed black. The site's thesis snaps through in oversized Satoshi on a
// tight rhythm — ATTENTION. → TIME. → Focus — each word replacing the last.
// The brand word then dissolves in place as the backdrop fades and the hero
// rises behind it; the live nav logo cross-fades in at the same time.
import gsap from 'gsap';
export function runPreloader() {
  const pre  = document.getElementById('preloader');
  const bg   = pre && pre.querySelector('.kw__bg');
  const word = pre && pre.querySelector('.kw__word');
  const logo = document.querySelector('.nav__logo');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!pre || !word) {
    if (pre) pre.classList.add('is-done');
    return new Promise((r) => setTimeout(r, 40));
  }
  if (reduced) {
    pre.classList.add('is-done');
    return new Promise((r) => setTimeout(r, 60));
  }

  // hide the live logo until the flying word lands on it
  if (logo) gsap.set(logo, { opacity: 0 });

  return new Promise((resolve) => {
    const THESIS = ['ATTENTION.', 'TIME.'];
    const tl = gsap.timeline();

    // ── thesis words snap through ──
    THESIS.forEach((w) => {
      tl.call(() => { word.textContent = w; word.classList.remove('is-brand'); });
      tl.fromTo(word, { opacity: 0, scale: 1.08, filter: 'blur(7px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.28, ease: 'power3.out' });
      tl.to(word, { opacity: 0, scale: 0.96, filter: 'blur(5px)',
        duration: 0.20, ease: 'power2.in' }, '+=0.14');
    });

    // ── brand word lands, gradient-filled ──
    tl.call(() => { word.textContent = 'Focus'; word.classList.add('is-brand'); });
    tl.fromTo(word, { opacity: 0, scale: 1.08, filter: 'blur(7px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.32, ease: 'power3.out' });
    tl.to({}, { duration: 0.20 });                 // hold

    // ── dissolve: fade the wordmark out in place, reveal the live nav logo ──
    tl.add(() => {
      resolve();                                   // hero starts rising behind
      gsap.to(bg, { opacity: 0, duration: 0.7, ease: 'power2.out' });
      if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.12 });
      gsap.to(word, {
        opacity: 0, duration: 0.45, ease: 'power2.in',
        onComplete: () => {
          pre.classList.add('is-done');
          setTimeout(() => { pre.style.display = 'none'; }, 720);
        },
      });
    });
  });
}

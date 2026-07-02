// Ambient noise layer — problem section.
//
//   Layer 2 — iMessage clusters (animated typing → message → loop)
//   Layer 3 — iOS notification banners (real icons, depth system)
//
// The layer is a narrative actor, not wallpaper: its intensity is keyed to the
// manifesto's word-fill beats. One lone ping while "not weak" fills, the swarm
// bursts in on "environment is loud", peaks through "engineered to win", and
// dies to silence as "the problem was never you." lands — the first wordless
// demo of what Focus does.
//
// (The numbers section's old app-icon ghost grid was removed in favour of a
//  static CSS glow; initNumbersGrid is now a no-op.)
//
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// ─── iMessage clusters ───────────────────────────────────────────────────────
// Text is centred: x≈15–82%, y≈36–64%. Safe zones: top (y<28%),
// bottom (y>68%), far-right edge (x>74%, partly clipped).
const MESSAGE_CLUSTERS = [
  {
    x: '34%', y: '7%',   // top strip — centre, above text
    messages: [
      { text: 'did u see that reel',  sent: false },
      { text: 'lol yeah 😭',          sent: true  },
    ],
  },
  {
    x: '5%', y: '76%',   // bottom-left
    messages: [
      { text: "can't focus rn",           sent: true  },
      { text: 'same tbh',                 sent: false },
      { text: 'checking insta again lol', sent: true  },
    ],
  },
  {
    x: '72%', y: '80%',  // bottom strip — right side
    messages: [
      { text: 'been on here an hour 😭', sent: false },
      { text: 'omg same',               sent: true  },
    ],
  },
];

const MAX_CLUSTER = 0.18;

// ─── Notification banners ────────────────────────────────────────────────────
const APPS = [
  { name: 'Instagram',  color: '#c13584', slug: 'instagram' },
  { name: 'TikTok',     color: '#161616', slug: 'tiktok',   border: true },
  { name: 'YouTube',    color: '#ff0000', slug: 'youtube' },
  { name: 'Reddit',     color: '#ff4500', slug: 'reddit' },
  { name: 'Snapchat',   color: '#ffcc00', slug: 'snapchat', dark: true },
  { name: 'WhatsApp',   color: '#25d366', slug: 'whatsapp' },
  { name: 'X',          color: '#000000', slug: 'x',        border: true },
  { name: 'Twitch',     color: '#9146ff', slug: 'twitch' },
  { name: 'Discord',    color: '#5865f2', slug: 'discord' },
  { name: 'Facebook',   color: '#1877f2', slug: 'facebook' },
];

const PREVIEWS = [
  ['@alex and 2 others liked your photo', 'now'],
  ['New video from @someone_you_follow',   '1m' ],
  ['Trending · 23k views this hour',       '2m' ],
  ['Hot in r/worldnews',                   '3m' ],
  ['You have a new snap — open it',        'now'],
  ['12 unread messages in Family',         '4m' ],
  ['47 new notifications',                 '6m' ],
  ['A channel you follow is live',         '8m' ],
  ['156 unread in #general',               '9m' ],
  ['Jamie reacted to your post',           '11m'],
];

// Text is centred: x≈0–100%, y≈30–70% (measured at 1280×900).
// Safe zones: top strip (y < 26%), bottom strip (y > 72%).
// No far-right-edge zone — at wide viewports 260px banners at x>73% don't
// get clipped and fall into the text band. All slots must be in top/bottom.
const SLOTS = [
  // ── Top strip (y < 26%) ──────────────────────────────────────────────
  { x: '2%',  y: '4%',  depth: 0.28 },  // very dim, far corner
  { x: '20%', y: '7%',  depth: 0.92 },  // bright
  { x: '52%', y: '3%',  depth: 1.00 },  // max brightness
  { x: '8%',  y: '13%', depth: 0.45 },  // dim
  { x: '42%', y: '15%', depth: 0.78 },  // mid-bright
  { x: '68%', y: '14%', depth: 0.35 },  // dim, right-top
  { x: '70%', y: '8%',  depth: 0.86 },  // bright, right-top
  // ── Bottom strip (y > 72%) ───────────────────────────────────────────
  { x: '4%',  y: '74%', depth: 0.94 },  // bright, left
  { x: '18%', y: '78%', depth: 0.28 },  // very dim
  { x: '42%', y: '72%', depth: 1.00 },  // max, centre-bottom
  { x: '58%', y: '80%', depth: 0.60 },  // mid, right-bottom
  { x: '66%', y: '73%', depth: 0.90 },  // bright, right-bottom
  { x: '72%', y: '86%', depth: 0.50 },  // mid, far right-bottom
  { x: '4%',  y: '90%', depth: 0.40 },  // dim, far bottom-left
  { x: '35%', y: '91%', depth: 0.82 },  // bright, bottom-centre
];

// Narrative beats in section-hold progress. The word-fill completes at 80% of
// the hold (main.js), so the manifesto's line boundaries land at .20 / .36 /
// .60 / .80. Silence triggers at .78 — just as "you." finishes filling.
const BEAT_LOUD    = 0.20; // "Your environment is loud."   → the swarm arrives
const BEAT_PEAK    = 0.36; // "Every ping is engineered…"   → peak aggression
const BEAT_SILENCE = 0.78; // "The problem was never you."  → the noise dies

const beatFor = (p) => (p < BEAT_LOUD ? 0 : p < BEAT_PEAK ? 1 : p < BEAT_SILENCE ? 2 : 3);

// ─── Problem section entry point ─────────────────────────────────────────────
export function initNotifications(section) {
  if (!section) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = section.querySelector('.problem__noise');
  if (!container) return;

  gsap.set(container, { opacity: 0 });
  const field = createNoiseField(container, section);

  // Desktop holds the section via .problem--scroll → beats scrub off the lock.
  // Without the hold (mobile/touch) there is no beat timeline: reveal a steady
  // mid-intensity field on entry instead.
  const hasHold = section.classList.contains('problem--scroll');

  ScrollTrigger.create({
    trigger: section,
    start: hasHold ? 'top top'       : 'top 65%',
    end:   hasHold ? 'bottom bottom' : 'bottom 35%',
    onEnter:      () => field.show(hasHold ? undefined : 1),
    onEnterBack:  () => field.show(hasHold ? undefined : 1),
    onLeave:      () => field.hide(),
    onLeaveBack:  () => field.hide(),
    onUpdate:     hasHold ? (self) => field.setProgress(self.progress) : undefined,
  });
}

// ─── Numbers section entry point ─────────────────────────────────────────────
// The ambient app-icon ghost grid was removed — the cost section now relies on a
// static on-brand glow (.numbers::before) for depth instead. Kept as a no-op so
// the call site in main.js stays stable.
export function initNumbersGrid() {}

// ─── The noise field ─────────────────────────────────────────────────────────
// Owns every moving part of the layer: the banner swarm, the patient-zero ping,
// the iMessage clusters, pointer repulsion and depth parallax. Driven by beats.
function createNoiseField(container, section) {
  const canHover = matchMedia('(min-width: 861px) and (hover: hover)').matches;

  // Clusters live in their own layer so silence can mute them wholesale
  // without fighting the self-looping cluster timelines (which reset their
  // own element opacity every cycle).
  const clusterLayer = document.createElement('div');
  clusterLayer.className = 'notif-clusters';
  container.appendChild(clusterLayer);
  const playClusters = buildMessageClusters(clusterLayer);
  let clustersStarted = false;

  const live = new Set();       // { el, depth, p0, bx, by, rx, ry, slot }
  const usedSlots = new Set();
  let appIdx = 0, previewIdx = 0;
  let loop = null, burstTimers = [];
  let beat = -1;                // -1 = layer hidden; forces re-apply on show
  let progress = 0;
  let boost = 0;                // opacity lift as the beats build (0 → 0.3)
  let zero = null;              // the patient-zero record, when on stage
  let visible = false;

  // ── pointer repulsion + depth parallax (one rAF, ~15 elements) ──
  let mx = -1e4, my = -1e4, raf = null;
  if (canHover) {
    section.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    section.addEventListener('mouseleave', () => { mx = -1e4; my = -1e4; });
  }

  function tick() {
    live.forEach((rec) => {
      // parallax: banners drift upward through the hold, far ones slower —
      // the flat collage becomes a volume
      const par = -Math.max(0, progress - rec.p0) * 90 * rec.depth;
      let tx = 0, ty = 0;
      if (rec.bx) {
        // repulsion: the noise recoils from the pointer, near banners more
        const dx = rec.bx - mx;
        const dy = rec.by + par - my;
        const d  = Math.hypot(dx, dy);
        const R  = 190;
        if (d < R && d > 0.001) {
          const f = (1 - d / R) * (0.35 + 0.65 * rec.depth) * 26;
          tx = (dx / d) * f;
          ty = (dy / d) * f;
        }
      }
      rec.rx += (tx - rec.rx) * 0.12;
      rec.ry += (ty - rec.ry) * 0.12;
      // CSS `translate` composes with gsap's `transform` — entry/exit tweens
      // and the drift never fight over the same property
      rec.el.style.translate = `${rec.rx.toFixed(2)}px ${(rec.ry + par).toFixed(2)}px`;
    });
    raf = requestAnimationFrame(tick);
  }

  // ── banner construction ──
  function buildBanner(app, text, time) {
    const borderStyle = app.border ? 'outline:1px solid rgba(255,255,255,0.2);' : '';
    const el = document.createElement('div');
    el.className = 'notif-banner';
    el.innerHTML = `
      <div class="notif-icon" style="background:${app.color};${borderStyle}">
        <img src="https://cdn.simpleicons.org/${app.slug}/ffffff"
             width="18" height="18" alt="" aria-hidden="true"
             onerror="this.style.display='none'" />
      </div>
      <div class="notif-body">
        <span class="notif-app">${app.name}</span>
        <span class="notif-text">${text}</span>
      </div>
      <span class="notif-time">${time}</span>
    `;
    return el;
  }

  function removeBanner(rec) {
    rec.el.remove();
    live.delete(rec);
    if (rec.slot !== null) usedSlots.delete(rec.slot);
    if (zero === rec) zero = null;
  }

  function measure(rec) {
    const r = rec.el.getBoundingClientRect();
    rec.bx = r.left + r.width / 2;
    rec.by = r.top + r.height / 2;
  }

  function freeSlot() {
    const free = [];
    SLOTS.forEach((_, i) => { if (!usedSlots.has(i)) free.push(i); });
    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  // ── the swarm ──
  function spawn() {
    const idx = freeSlot();
    if (idx === null) return;
    usedSlots.add(idx);

    const { x, y, depth } = SLOTS[idx];
    const app          = APPS[appIdx % APPS.length];
    const [text, time] = PREVIEWS[previewIdx % PREVIEWS.length];
    appIdx++; previewIdx++;

    const el = buildBanner(app, text, time);
    el.style.left = x;
    el.style.top  = y;
    const scale = 0.76 + depth * 0.24;             // 0.76 (far) → 1.00 (near)
    const blur  = depth < 0.55 ? (0.55 - depth) * 3.5 : 0;
    if (blur > 0) el.style.filter = `blur(${blur.toFixed(2)}px)`;
    // near banners occasionally arrive as a grouped stack — a second card
    // peeking beneath, the way iOS collapses repeat offenders
    if (depth > 0.72 && Math.random() < 0.3) el.classList.add('is-stacked');
    container.appendChild(el);

    const rec = { el, depth, p0: progress, bx: 0, by: 0, rx: 0, ry: 0, slot: idx };
    live.add(rec);

    const targetOpacity = (0.07 + depth * 0.21) * (1 + boost);
    // spring in with slight overshoot, dwell, then swipe-dismiss upward —
    // matching the physics people feel from the real thing 200× a day
    gsap.set(el, { scale, transformOrigin: 'top left', y: -14, opacity: 0 });
    gsap.to(el, {
      y: 0, opacity: targetOpacity,
      duration: 0.55, ease: 'back.out(2.2)',
      onComplete() {
        measure(rec);
        gsap.to(el, {
          y: -16, opacity: 0,
          delay: 3.5, duration: 0.3, ease: 'power2.in',
          onComplete: () => removeBanner(rec),
        });
      },
    });
  }

  function drip(ms) {
    if (loop) clearInterval(loop);
    loop = setInterval(spawn, ms);
  }

  function stopDrip() {
    if (loop) { clearInterval(loop); loop = null; }
    burstTimers.forEach(clearTimeout);
    burstTimers = [];
  }

  // Every live banner swipe-dismisses upward in a fast stagger — the noise
  // dying is the section's payoff, so it exits like a deliberate act.
  function sweep() {
    let i = 0;
    live.forEach((rec) => {
      gsap.killTweensOf(rec.el);
      gsap.to(rec.el, {
        y: -18, opacity: 0,
        duration: 0.3, delay: i * 0.05, ease: 'power2.in',
        onComplete: () => removeBanner(rec),
      });
      i++;
    });
  }

  // ── patient zero — one lone ping before the swarm ──
  function spawnZero() {
    if (zero) return;
    const el = buildBanner(APPS[0], PREVIEWS[0][0], 'now');
    el.classList.add('notif-banner--zero');
    container.appendChild(el);
    const rec = { el, depth: 1, p0: progress, bx: 0, by: 0, rx: 0, ry: 0, slot: null };
    zero = rec;
    live.add(rec);
    gsap.set(el, { y: -18, opacity: 0, scale: 1, transformOrigin: 'top center' });
    gsap.to(el, {
      y: 0, opacity: 0.95,
      delay: 0.35, duration: 0.6, ease: 'back.out(1.9)',
      onComplete: () => measure(rec),
    });
  }

  function dismissZero() {
    if (!zero) return;
    const rec = zero;
    zero = null;
    gsap.killTweensOf(rec.el);
    gsap.to(rec.el, {
      y: -18, opacity: 0,
      duration: 0.32, ease: 'power2.in',
      onComplete: () => removeBanner(rec),
    });
  }

  // ── beats ──
  //   0  "not weak"            near-silence; one lone ping
  //   1  "environment is loud" the swarm bursts in, steady drip
  //   2  "engineered to win"   peak: fast drip, brighter banners
  //   3  "never you."          silence — everything sweeps away
  function setBeat(b) {
    if (b === beat) return;
    const prev = beat;
    beat = b;

    if (b === 0) {
      stopDrip();
      if (prev > 0) sweep();
      boost = 0;
      spawnZero();
      gsap.to(clusterLayer, { opacity: 0, duration: 0.4 });
    } else if (b === 1 || b === 2) {
      dismissZero();
      boost = b === 1 ? 0.12 : 0.3;
      if (!clustersStarted) {
        clustersStarted = true;
        playClusters.forEach((play, i) => play(i * 1.1));
      }
      gsap.to(clusterLayer, { opacity: 1, duration: 0.5 });
      stopDrip();
      // burst-populate when arriving at an empty stage (fresh entry, or
      // scrolling back up out of the silence)
      if (live.size < 3) {
        for (let i = 0; i < 7; i++) burstTimers.push(setTimeout(spawn, i * 150));
      }
      drip(b === 1 ? 1050 : 460);
    } else {
      stopDrip();
      dismissZero();
      sweep();
      gsap.to(clusterLayer, { opacity: 0, duration: 0.7, ease: 'power2.inOut' });
    }
  }

  return {
    show(forceBeat) {
      visible = true;
      gsap.killTweensOf(container);
      gsap.to(container, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      setBeat(forceBeat ?? beatFor(progress));
      if (!raf) raf = requestAnimationFrame(tick);
    },
    hide() {
      visible = false;
      beat = -1; // force the beat to re-apply (and its drip to restart) on return
      stopDrip();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      gsap.killTweensOf(container);
      gsap.to(container, { opacity: 0, duration: 0.4, ease: 'power2.out' });
    },
    setProgress(p) {
      progress = p;
      if (visible) setBeat(beatFor(p));
    },
  };
}

// ─── Layer 2: Animated iMessage clusters ─────────────────────────────────────
function buildMessageClusters(container) {
  const starts = [];
  MESSAGE_CLUSTERS.forEach(({ x, y, messages }) => {
    const cluster = document.createElement('div');
    cluster.className  = 'notif-messages';
    cluster.style.left = x;
    cluster.style.top  = y;
    cluster.setAttribute('aria-hidden', 'true');

    const typing = document.createElement('div');
    typing.className = 'notif-typing is-recv';
    typing.innerHTML = '<span></span><span></span><span></span>';
    // Hidden from the instant it exists in the DOM — animateCluster() only sets
    // this to 0 on its first *play*, which is held until the loud beat. Without
    // this, .notif-bubble has no CSS opacity of its own (defaults to fully
    // visible) and .notif-messages sits at a dim-but-nonzero 0.18, so the raw
    // text flashes through as soon as the container fades in at beat 0 — before
    // the deliberately-delayed patient-zero ping even appears.
    gsap.set(typing, { opacity: 0 });
    cluster.appendChild(typing);

    messages.forEach(({ text, sent }) => {
      const b = document.createElement('div');
      b.className   = `notif-bubble ${sent ? 'is-sent' : 'is-recv'}`;
      b.textContent = text;
      gsap.set(b, { opacity: 0 });
      cluster.appendChild(b);
    });

    container.appendChild(cluster);
    // Held until the loud beat — caller starts each with a small stagger.
    starts.push((delay) => animateCluster(cluster, delay));
  });
  return starts;
}

function animateCluster(cluster, startDelay) {
  const bubbles = [...cluster.querySelectorAll('.notif-bubble')];
  const typing  = cluster.querySelector('.notif-typing');

  gsap.set(cluster, { opacity: MAX_CLUSTER });
  gsap.set(bubbles, { opacity: 0, y: 6 });
  gsap.set(typing,  { opacity: 0 });

  const tl = gsap.timeline({ delay: startDelay });

  bubbles.forEach((b) => {
    const isSent   = b.classList.contains('is-sent');
    const holdTime = 0.7 + Math.random() * 0.45;

    tl
      .call(() => { typing.className = `notif-typing ${isSent ? 'is-sent' : 'is-recv'}`; })
      .fromTo(typing,
        { opacity: 0, y: 4 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      )
      .to(typing, { opacity: 0, duration: 0.18 }, `+=${holdTime}`)
      .fromTo(b,
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
      )
      .to({}, { duration: 0.38 });
  });

  tl
    .to(cluster, { opacity: 0, delay: 2.5, duration: 0.75, ease: 'power2.inOut' })
    .call(() => {
      gsap.set(bubbles, { opacity: 0, y: 6 });
      gsap.set(typing,  { opacity: 0 });
      animateCluster(cluster, 1.0);
    });
}

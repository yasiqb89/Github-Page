// Ambient noise layer — problem section.
//
//   Layer 2 — iMessage clusters (animated typing → message → loop)
//   Layer 3 — iOS notification banners (real icons, depth system)
//   Layer 4 — Mini phone mockup with scrolling video feed
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
  { name: 'LinkedIn',   color: '#0a66c2', slug: 'linkedin' },
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
  ['Someone viewed your profile',          '8m' ],
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


// ─── Problem section entry point ─────────────────────────────────────────────
export function initNotifications(section) {
  if (!section) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = section.querySelector('.problem__noise');
  if (!container) return;

  // Build the ambient layer up-front, but hold playback until the section
  // locks (its sticky child reaches the top of the viewport) so the noise
  // reveals as a deliberate beat instead of pre-playing on the way in.
  gsap.set(container, { opacity: 0 });
  const playClusters = buildMessageClusters(container);
  const banners = startBannerLoop(container);

  // Desktop holds the section via .problem--scroll → trigger on the lock.
  // Without the hold (mobile/touch) fall back to revealing on entry.
  const hasHold = section.classList.contains('problem--scroll');
  let revealed = false;

  // Show the noise layer + run the banner drip. First time also kicks off the
  // looping iMessage clusters (they self-loop thereafter, hidden when the layer
  // fades out).
  const show = () => {
    banners.start();
    gsap.to(container, { opacity: 1, duration: revealed ? 0.45 : 0.7, ease: 'power2.out' });
    if (revealed) return;
    revealed = true;
    playClusters.forEach((play, i) => play(i * 1.1));
  };

  // Leaving the section (either direction): stop spawning AND fade the whole
  // layer out, so no banners/clusters linger over the hero or numbers section.
  const hide = () => {
    banners.stop();
    gsap.to(container, { opacity: 0, duration: 0.4, ease: 'power2.out' });
  };

  ScrollTrigger.create({
    trigger: section,
    start: hasHold ? 'top top'       : 'top 65%',
    end:   hasHold ? 'bottom bottom' : 'bottom 35%',
    onEnter:      show,
    onEnterBack:  show,
    onLeave:      hide,
    onLeaveBack:  hide,
    onUpdate:     hasHold ? (self) => { if (revealed) banners.setRate(self.progress); } : undefined,
  });
}

// ─── Numbers section entry point ─────────────────────────────────────────────
// The ambient app-icon ghost grid was removed — the cost section now relies on a
// static on-brand glow (.numbers::before) for depth instead. Kept as a no-op so
// the call site in main.js stays stable.
export function initNumbersGrid() {}

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
    cluster.appendChild(typing);

    messages.forEach(({ text, sent }) => {
      const b = document.createElement('div');
      b.className   = `notif-bubble ${sent ? 'is-sent' : 'is-recv'}`;
      b.textContent = text;
      cluster.appendChild(b);
    });

    container.appendChild(cluster);
    // Held until the section locks — caller starts each with a small stagger.
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

// ─── Layer 3: Notification banners with depth ──────────────────────────────────
function startBannerLoop(container) {
  const usedSlots = new Set();
  let appIdx = 0, previewIdx = 0, loop = null;
  let burstTimers = [];   // pending burst spawns, so stop() can cancel them too
  let intensityBoost = 0; // 0 at lock → 0.3 at section end (scrubbed by progress)

  function freeSlot() {
    const free = [];
    SLOTS.forEach((_, i) => { if (!usedSlots.has(i)) free.push(i); });
    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  function spawn() {
    const idx = freeSlot();
    if (idx === null) return;
    usedSlots.add(idx);

    const { x, y, depth } = SLOTS[idx];
    const app          = APPS[appIdx % APPS.length];
    const [text, time] = PREVIEWS[previewIdx % PREVIEWS.length];
    appIdx++; previewIdx++;

    // Depth-derived visual properties — wider range for more visible contrast.
    // intensityBoost scrubs up as the section progresses (0 → 0.3), so banners
    // grow slightly more opaque as the problem beats build.
    const targetOpacity = (0.07 + depth * 0.21) * (1 + intensityBoost); // 0.13→0.28 → up to 0.17→0.36
    const scale         = 0.76 + depth * 0.24;           // 0.76 (far) → 1.00 (near)
    const blur          = depth < 0.55 ? (0.55 - depth) * 3.5 : 0;

    const borderStyle = app.border ? 'outline:1px solid rgba(255,255,255,0.2);' : '';

    const el = document.createElement('div');
    el.className         = 'notif-banner';
    el.style.left        = x;
    el.style.top         = y;
    el.style.transform   = `scale(${scale.toFixed(3)})`;
    el.style.transformOrigin = 'top left';
    if (blur > 0) el.style.filter = `blur(${blur.toFixed(2)}px)`;

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
    container.appendChild(el);

    gsap.fromTo(el, { opacity: 0, y: -8 }, {
      opacity: targetOpacity, y: 0,
      duration: 0.42, ease: 'power3.out',   // faster entry, stronger snap
      onComplete() {
        gsap.to(el, {
          opacity: 0, y: -7,
          delay: 3.5, duration: 0.32, ease: 'power2.out', // exit snaps away faster
          onComplete() { el.remove(); usedSlots.delete(idx); },
        });
      },
    });
  }

  return {
    start() {
      if (loop) return;
      // Burst-populate so the scene feels alive the instant the section locks
      // (160ms stagger), then keep a steady drip. Track the burst timers so
      // stop() can cancel any that haven't fired yet (otherwise they keep
      // spawning after the section leaves — visible when scrolling back up).
      burstTimers = [];
      for (let i = 0; i < 7; i++) burstTimers.push(setTimeout(spawn, i * 160));
      loop = setInterval(spawn, 1100);
    },
    stop() {
      if (loop) { clearInterval(loop); loop = null; }
      burstTimers.forEach(clearTimeout);
      burstTimers = [];
    },
    // Scrub intensity as the user holds through the section (progress 0→1).
    // Spawn interval shrinks 1100ms → 480ms; banners also grow slightly more opaque.
    setRate(t) {
      intensityBoost = t * 0.30;
      if (!loop) return;
      clearInterval(loop);
      loop = setInterval(spawn, Math.round(1100 - t * 620));
    },
  };
}

# Focus — Marketing Site

A premium, product-led one-page site for the Focus iOS app. Clean dark aesthetic,
refined motion, and real app UI rendered in device frames. Brand-locked to the app's
design system (lime `#BFFF47`, Moonwalker void, Satoshi typeface).

## Run

Zero build step — static site using CDN ES modules (importmap). Serve the folder:

```bash
cd web
python3 -m http.server 4124
# open http://localhost:4124
```

(Modules require http(s), not `file://`.)

## Stack

- **GSAP + ScrollTrigger** — scroll-reveal choreography, counters, animated bars/ring/chart.
- **Lenis** — smooth inertia scroll.
- **CSS + SVG** — device frames and all five app screens (session ring, habits grid,
  identity sigil, dimensions radar, weekly chart). No images, no 3D engine.
- All deps loaded from CDN via the importmap in `index.html`.

## Structure

```
web/
├── index.html        # markup + importmap (CDN deps)
├── css/style.css     # design system, device frames, all app screens, reveal states
└── js/
    ├── main.js       # orchestrator: Lenis + ScrollTrigger reveals, tilt, counters, bars
    ├── cursor.js     # custom lime cursor + magnetic buttons
    └── preloader.js  # lime arc draw + wordmark, then reveal
```

## Sections (the scroll story)

1. **Hero** — "Turn your hours into who you become." + live Session screen (ring + shield).
2. **Stat strip** — 31 modes · 22 stages · 5 dimensions · 100% private.
3. **The Session** — how it keeps you on track: shield, rules-with-a-valve, hold-to-end.
4. **Habits** — "A mode for every kind of hour." Habits screen + per-mode rules.
5. **The Journey** — "You don't chase streaks. You become someone." Identity sigil + a
   single elegant rail (The Restless → The Luminous). Deliberately NOT a list of all 22
   stage names.
6. **Dimensions** — "Five dimensions of focus." Radar + animated bars.
7. **Momentum** — "Watch the line go up." Weekly chart, streak/reclaimed pills, recap.
8. **Close** — "Begin your journey." Placeholder App Store CTA + footer.

## Motion / micro-interactions

Scroll-reveal (fade + rise, clipped hero lines), device tilt on hover, count-up numbers,
animated progress bars / session ring / weekly chart / radar, magnetic CTAs, custom cursor,
nav blur-on-scroll + auto-hide. All gated by `prefers-reduced-motion`.

## Notes

- **App Store CTA is a placeholder.** Wire the real URL in `index.html` (`#storeBtn`) and
  remove the toast in `js/main.js` (`wireStoreBtn`) when live.
- Identity stage names + dimension labels mirror the app (`SelfMetricsService`).
- Atmosphere is intentionally restrained: subtle CSS glow blobs + grain only.
```

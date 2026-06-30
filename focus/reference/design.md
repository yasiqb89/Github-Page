# Focus — Design Guide

Focus is a native iOS productivity app for reclaiming deep focus time. The product feels calm, intentional, disciplined, and premium without becoming decorative, noisy, or marketing-like.

This document is the **authoritative design reference** for all agents, designers, and web builders working on anything aligned with this product. It covers brand identity, visual tokens, component anatomy, screen architecture, motion principles, and copy voice.

For raw Swift token implementations see `FocusApp/DesignSystem.swift`. For architecture see `CLAUDE.md`. For a web-ready token table and CSS equivalents see `docs/DESIGN_SYSTEM.md`. For the marketing website spec see `docs/WEBSITE_BRIEF.md`.

---

## 1. Product Feel

Focus should feel like:

- A quiet command center for deep work
- Calm, minimal, high-contrast, and tactile
- Serious but not cold
- Reflective after a session, decisive before one
- Native to iOS, using Apple platform conventions

Avoid:

- Marketing-style pages or explanatory feature copy
- Decorative gradients beyond the background and approved accents
- Excessive cards, borders, shadows, blur, or glass
- Noisy gamification
- Motion that slows repeated workflows
- One-off styling that does not use the design system

---

## 2. Brand Identity

**Name:** Focus  
**Tagline:** Reclaim your attention.  
**Bundle ID:** `com.yassir.focus`  
**Category:** Productivity / Self-improvement

**Brand personality:** Discipline without harshness. The app is a quiet companion that helps the user make intentional choices about their attention, not a coach shouting at them to be better.

**Signature element:** The focus ring. The ring is the visual anchor of the entire product — it appears on Home, on the Lock Screen, in the widget, and on the marketing site. In the iOS app, the ring is `FocusOnboardingRingVisual` — a full circle track with a lime progress arc that fills as a session runs. The **270° open-arc motif** (gap at bottom) is the design language expressed in the dock icon (`FocusRingArcDockIcon`) and the marketing site's WebGL particle ring. When the arc seals to a full circle, it signals session completion and identity growth.

---

## 3. Color System

### 3.1 App Background — Moonwalker Gradient

The root background is a two-stop linear gradient applied full-screen:

| Stop | Hex | Position |
|---|---|---|
| Top | `#152331` | 0% |
| Bottom | `#000000` | ~130% (extends beyond viewport bottom) |

Direction: top to bottom. The gradient intentionally extends past the viewport — dark blue at the top transitions to pure black near the center, with the bottom of the screen fully black. This creates a deep, space-like depth.

**Never** use a flat black or white background on screens. All NavigationStacks use `.background(Color.clear)` so the gradient shows through.

### 3.2 Brand Accents — Fixed Values

These colors never change between light and dark mode.

| Token | Hex | Usage |
|---|---|---|
| `focusAccent` | `#BFFF47` | Primary lime green — CTAs, active ring, progress, all "go" states |
| `focusAccentDim` | `#BFFF47` @ 10% opacity | Subtle accent backgrounds, chip fills |
| `focusAccentGlow` | `#BFFF47` @ 25% opacity | Ring glow, bloom shadows |
| `focusPink` | `#FF6B8A` | Activity/energy metric, distraction state (ring scatter) |
| `focusCyan` | `#5AC8FA` | Work tag, gradient counterpart to lime, Midnight theme accent |

**Lime (`#BFFF47`) is THE brand color.** It appears on the ring, every CTA button, every active/selected state, every progress indicator. It is intentionally "electric" — not a safe, muted lime.

**Gradient foreground** (used on large numbers and identity moments):
```
Linear gradient: #BFFF47 → #5AC8FA, left to right
```

### 3.3 Dark Surface Palette — Fixed Values

These are for dark-surface overlays, cards on the Moonwalker background, and the Liquid Glass component.

| Token | Hex | Usage |
|---|---|---|
| `focusInk` | `#1D2115` | Dark olive card base — Liquid Glass fill base |
| `focusInkSoft` | `#1A1F14` | Slightly deeper card fill |
| `focusElevated` | `#323629` | Raised chip/icon surface |
| `focusTextSecondary` | `#C2CAAF` | Warm sage secondary text on dark surfaces |
| `focusTextPrimaryWarm` | `#F4F8EC` | Warm off-white primary text on dark surfaces |
| `focusOnAccent` | `#233600` | Dark forest green — text ON a lime button |
| `focusProArc` | `#4B6F12` | Deep brand green for Pro ring marks |

### 3.4 Adaptive Text — System Semantic (iOS)

These adapt to dark/light mode via iOS system semantics:

| Token | iOS System | Dark approx. | Light approx. |
|---|---|---|---|
| `focusText` | `.label` | `#FFFFFF` | `#000000` |
| `focusText2` | `.secondaryLabel` | `#EBEBF5` @ 60% | `#3C3C43` @ 60% |
| `focusMuted` | `.tertiaryLabel` | `#EBEBF5` @ 30% | `#3C3C43` @ 30% |

On the Moonwalker background (the app's dark canvas), text is always near-white. The adaptive tokens work because the background itself forces effective dark mode.

### 3.5 Status Colors — Fixed Values

| Token | Hex | Usage |
|---|---|---|
| `focusDanger` | `#FF453A` | High priority, errors, destructive, danger ring |
| `focusWarning` | `#FF9F0A` | Medium priority, warnings, paused ring tint |
| `focusSuccess` | `#30D158` | Success states |
| `focusDone` | `#32D74B` | Task done checkmark (slightly brighter/purer than success) |

### 3.6 Tag Colors

| Tag | Background | Foreground |
|---|---|---|
| Work | `#5AC8FA` @ 15% | `#5AC8FA` |
| Personal | `#32D74B` @ 12% | `#32D74B` |
| Health | `#FFD60A` @ 15% | `#FFD60A` |
| Study | `#FF9F0A` @ 12% | `#FF9F0A` |

### 3.7 Adaptive Surfaces — System Semantic (iOS)

| Token | iOS System | Dark approx. | Light approx. |
|---|---|---|---|
| `focusBG` | `.systemBackground` | `#000000` | `#FFFFFF` |
| `focusSurface1` | `.secondarySystemBackground` | `#1C1C1E` | `#F2F2F7` |
| `focusSurface2` | `.tertiarySystemBackground` | `#2C2C2E` | `#FFFFFF` |
| `focusSurface3` | `.systemFill` | `rgba(120,120,128,0.36)` | `rgba(120,120,128,0.20)` |

---

## 4. Typography

### 4.1 Typeface

**Satoshi** — custom font, bundled as TTF files in the app.

| File | Weight | Name |
|---|---|---|
| `Satoshi-Light.ttf` | 300 | Light |
| `Satoshi-Regular.ttf` | 400 | Regular |
| `Satoshi-Medium.ttf` | 500 | Medium |
| `Satoshi-Bold.ttf` | 700 | Bold |
| `Satoshi-Black.ttf` | 900 | Black |

**Web source:** Satoshi is available for free at [fontshare.com/fonts/satoshi](https://www.fontshare.com/fonts/satoshi). Use the CDN import or download the TTF files directly.

No other typefaces. Do not use Space Grotesk, DM Sans, Inter, or system rounded. The personality is in Satoshi's specific character — it reads as a premium sans-serif with geometric warmth.

### 4.2 Type Scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Giant number | 72–96pt | Bold/Black | Timer countdown, major stat |
| Display hero | 48–60pt | Bold | Stage name, section title |
| Display | 28–36pt | Bold | Card headers, identity names |
| Heading 1 | 22–24pt | Bold | Section headers |
| Heading 2 | 17–20pt | Medium/Bold | Card titles, modal headers |
| Heading 3 | 15–16pt | Medium | Row labels, subsection heads |
| Body | 14–15pt | Regular | Body copy, descriptions |
| Dense body | 12–13pt | Regular/Medium | Metadata, compact rows |
| Label | 11pt | Bold | Section chips (uppercase, 1.0 kerning) |
| Micro | 9–10pt | Regular | Timestamps, fine print |

### 4.3 Type Behavior

- **Section labels** (`SectionLabel`): 11pt Bold, uppercased, tertiaryLabel color, 1.0 letter-spacing. Example: `WEEKLY`, `QUICK ACCESS`
- **Gradient numbers**: Large stats and identity moments use the lime→cyan gradient mask (linear gradient from `#BFFF47` to `#5AC8FA`, left to right) applied to the text
- **Timer readout**: Monospace digits for the countdown, Satoshi Bold/Black at 72–96pt
- **Avoid long explanations** in the UI — copy is short, direct, direct imperative or label-only

---

## 5. Spacing & Radius

### 5.1 Radius Tokens

| Token | Value | Use |
|---|---|---|
| `r1` | 10px | Chips, small interactive elements, inline badges |
| `r2` | 16px | Default card — `focusCard()` modifier |
| `r3` | 22px | Large panels, mode detail sheets |
| `r4` | 32px | Floating sheets, pill shapes, bottom sheets |

Use `.continuous` curve style (equivalent to CSS `border-radius` with squircle interpolation — iOS uses superellipse, not circle arcs). In web, `border-radius` with matching values gives the closest approximation; CSS `border-radius: 16px` on a square reads nearly identical to `RoundedRectangle(cornerRadius: 16, style: .continuous)`.

### 5.2 Spacing Rhythm

The app doesn't use a strict 4pt grid but follows these conventions:
- Horizontal content padding: 20–24pt
- Card inner padding: 16pt
- Section vertical gap: 20–24pt
- Compact row padding: 12–14pt vertical, 16pt horizontal
- Inter-item gap in grids: 12pt

---

## 6. Surfaces & Cards

### 6.1 Standard Card — `focusCard()`

- Fill: `focusSurface1` (iOS `.secondarySystemBackground`, dark ≈ `#1C1C1E`)
- Corner radius: `r2` (16px), continuous curve
- **No border stroke** — never add a `.stroke` overlay to a standard card
- No drop shadow on standard cards
- For dark backgrounds, cards appear as slightly lighter surfaces lifting off the near-black canvas

### 6.2 Liquid Glass — `FocusLiquidGlassBackground`

Used for interactive rows, edit fields, chip backgrounds, and active states.

| Property | Value |
|---|---|
| Fill | `#1D2115` @ 40% opacity |
| Border | white @ 10% opacity, 0.5px |
| Border (active) | `#BFFF47` @ 50% opacity, 0.5px |
| Glow shadow (active) | `#BFFF47` @ 30%, 15px blur radius |
| Corner radius | 20px, continuous |

The Liquid Glass surface reads as a dark olive-tinted frosted glass panel. It is the interactive counterpart to the flat card — used when the element is a control or has an active state.

### 6.3 Toast / Banner — `FocusToastBanner`

- Fill: `#0D1810` @ 92% + ultra-thin material blur
- Border: white @ 10%, 0.75px
- Shape: capsule
- Drop shadow: black @ 32%, 16px blur, 8px Y offset
- Text: `#F4F8EC` @ 90%, Satoshi Medium 12.5pt
- Action text: `#BFFF47`, Satoshi Black 12pt

---

## 7. The Ring — Signature Element

The ring is the most important visual element in the app. It appears on:
- Home screen (progress ring, full circle, lime arc on dark track)
- Active session (same ring, arc progresses as timer counts down)
- Paused session (same ring, orange tint)
- Onboarding welcome (ring animates to 78% progress, then breathes)
- Dock icon (270° arc motif — `FocusRingArcDockIcon`)
- Lock Screen Live Activity (compact arc)
- Home screen widget
- Marketing site (particle ring, 270° open arc, transforms across scroll)

### 7.1 Ring Component — iOS (`FocusOnboardingRingVisual`)

The iOS ring is **`FocusOnboardingRingVisual`** (`RingView.swift`) — a **full circle (360°)** track with a lime progress arc. All states (idle, active, paused, ambient) use the same component with different parameters.

| Property | Value |
|---|---|
| Track | Full circle, `#1D2115` (focusInk), lineWidth 12 |
| Arc | `Circle().trim(from: 0, to: progress)`, AngularGradient, rounded caps |
| Glow blob | Outer blur circle, breathes with `isBreathing` |
| Inner disc | Radial gradient `#0C0F06 → #1D2115`, thin white stroke border |
| Idle breathing | Scale + glow shadow pulse, 3.4s easeInOut loop |
| Paused | Pass orange `accentColor` (e.g. `focusWarning`) |
| Ambient / timer-only | `isMonochrome: true` + `FocusSessionMonochromePalette` values |

Key parameters:
```swift
FocusOnboardingRingVisual(
    size: CGFloat,             // diameter (replaces old "diameter")
    progress: Double,          // 0.0–1.0
    isBreathing: Bool,
    accentColor: Color = .focusAccent,
    accentGradientColors: [Color]? = nil,
    glowColor: Color? = nil,
    innerScale: CGFloat = 1.0,   // press-dip
    isMonochrome: Bool = false
)
```

**Onboarding wrapper:** `FocusOnboardingRing(size:)` — animates progress 0→0.78 on appear (spring), then starts breathing. Used only on the onboarding welcome step.

### 7.2 The 270° Open-Arc Motif

The **270° open arc** is the design language and visual identity — not the iOS ring geometry. It appears as:
- The dock icon (`FocusRingArcDockIcon` — `Circle().trim(from: 0, to: 0.78)`)
- The marketing website WebGL particle ring (hero and CTA states)
- The onboarding ring at its natural resting state (78% filled ≈ looks like an open arc)

This motif communicates "a session in progress, not yet complete" — the gap at the bottom is the opening for intent to flow in.

### 7.3 Ring States (Home Quick Flow Phase)

The ring morphs through these states during a session:

| Phase | Visual state |
|---|---|
| Idle (home) | Dark track, no progress arc, breathing pulse (scale 1.0→1.022, 3.4s easeInOut loop) |
| Session active | Lime arc fills as timer counts down, breathing disabled |
| Paused | Orange tint (`focusWarning`), frozen progress |
| Ambient / timer-only | Monochrome palette, platinum arc |
| Complete | Full circle lime arc, bloom pulse |

**Breathing animation (idle):**
- Scale: 1.000 → 1.022 → 1.000 (3.4s ease-in-out, repeating)
- Outer glow blob + track shadow pulse (same rhythm)

### 7.4 Ring for Web / Marketing

For web use, the ring particle system (`js/ring.js`) uses ~3,800 GPU particles with WebGL + Three.js + UnrealBloom. The color is always `#BFFF47` with bloom on the dark background. The ring tells the product story through these states:

| Scroll position | Ring state |
|---|---|
| Hero | Open arc (270°), breathing |
| Distraction section | Fractures outward to pink (`#FF6B8A`) particle cloud |
| Focus section (pinned) | Gathers and seals to full circle, lime bloom peaks |
| Journey section | Ascends, brightens, morphs with identity growth |
| CTA | Returns to breathing open arc |

---

## 8. Session Themes

Full-screen Habits sessions support 6 background photo themes. The image is layered beneath a dark gradient vignette at 50% opacity.

| Theme | Image | Accent color | Mood tags | Access |
|---|---|---|---|---|
| Midnight | `session-background-blue` | `#5AC8FA` | Deep Work, Minimal, Focus | Free |
| Blue Charm | `session-background-bluecharm` | `#87B7FF` | Atmospheric, Calm, Flow | Pro |
| Quiet Bench | `session-background-bench` | `#D2B06E` | Scenic, Reset, Outdoor | Pro |
| Blue Mount | `session-background-bluemount` | `#7DADE8` | Scenic, Night, Still | Pro |
| Ice Mountains | `session-background-icemountains` | `#9EC7FF` | Alpine, Cool, Quiet | Pro |
| Night Ocean | `session-background-ocean` | `#6AC7D8` | Ocean, Open, Calm | Pro |

Image layering:
1. `FocusBackground()` Moonwalker gradient (base)
2. Photo at 50% opacity, `scaledToFill`, clipped
3. Blurred version of photo at ~42% opacity (ambient glow)
4. Dark vignette gradient (50% black top & bottom, clear center)
5. Slight black overlay (8%)

The theme accent color tints controls for that session (ring, buttons, labels when not lime-default).

---

## 9. Components

### 9.1 Buttons

**Primary CTA — `AccentButton`:**
- Background: linear gradient, lime `#BFFF47` → slightly shifted lime
- Text: `#233600` (dark forest on lime), Satoshi Bold 16pt
- Shape: capsule (fully rounded)
- Height: 52pt
- Haptic: `.medium` on tap

**Ghost button — `GhostButton`:**
- Background: `focusSurface1` (secondary system background)
- Border: separator color stroke
- Text: white/label color
- Shape: capsule

**Danger button — `DangerButton`:**
- Background: `#FF453A` @ 12% opacity
- Text: `#FF453A`
- Shape: capsule

**Hold-to-end button — `HoldToEndButton`:**
- Requires 600ms continuous press to fire
- Animated fill progress during hold
- Used to end focus sessions intentionally

**Icon button — `IconButton`:**
- Circular, `focusSurface1` background
- 44pt minimum tap target

### 9.2 Ring View

All iOS session and Home ring rendering uses **`FocusOnboardingRingVisual`** — one component for all states. See Section 7.1 for full API.

| State | How it's expressed |
|---|---|
| Idle | `isBreathing: true`, no progress arc visible (track only) |
| Active | `isBreathing: false`, lime `accentColor`, progress fills |
| Paused | `accentColor: .focusWarning` (orange) |
| Ambient / timer-only | `isMonochrome: true` + `FocusSessionMonochromePalette` |

`RingView` and `PausedRingView` are defined in `RingView.swift` but unused by active screens — do not use for new UI.

### 9.3 Progress Bar

Horizontal, lime accent fill on `focusSurface3` track. Used for task progress (0–100%) and dimension scores.

### 9.4 Tag Chip

Capsule chip with tag background fill and foreground label:
- Work: cyan `#5AC8FA`
- Personal: green `#32D74B`
- Health: yellow `#FFD60A`
- Study: orange `#FF9F0A`

### 9.5 Pro Lock Badge

- Lock icon (`lock.fill`) on a dark surface
- Pro-gated views use `.proGated()` modifier which overlays a blur + lock badge
- Tapping routes to the contextual paywall for that feature

### 9.6 Section Label

```
WEEKLY
```
11pt Satoshi Bold, uppercased, tertiaryLabel color, 1.0 letter-spacing. Used as section headers throughout.

### 9.7 `GradualSpacing`

Animated letter-spacing reveal — used for identity stage names and hero text moments. Characters expand from 0 to target kerning over ~400ms.

---

## 10. Icons

SF Symbols only. No third-party icon packages.

**Tab bar icons** use **custom shapes** from `DockIcons.swift` (`DockIconView(tab:color:)`), not SF Symbols:

| Tab | Component | Visual |
|---|---|---|
| `.home` | `FocusRingArcDockIcon` (Shape, stroked) | Ring arc trimmed to 0.78 — the 270° open-arc motif |
| `.tasks` | `Image(systemName: "square.stack")` | SF Symbol — stacked layers |
| `.selfTab` | `RestlessSigilDockIcon` (View) | Outer ring + centre dot — Stage 1 sigil |
| `.overview` | `StatsDockIcon` (Shape, filled) | Three rounded bars at varying heights |
| `.settings` | `ProfileDockIcon` (Shape, stroked) | Head ellipse + shoulder arc |

> Do **not** substitute SF Symbols for tab icons. Always use `DockIconView(tab:color:)`.

Common **non-tab** SF Symbol mappings:

| UI element | SF Symbol |
|---|---|
| Streak | `flame.fill` |
| Timer | `timer` |
| Done state | `checkmark.circle.fill` |
| Add | `plus` |
| Lock | `lock.fill` |
| Shield | `shield.fill` |
| Calendar/Schedule | `calendar.badge.clock` |
| Back | `chevron.left` |
| Premium/Pro | `crown.fill` |
| Momentum up | `arrow.up.right` |
| Momentum down | `arrow.down.right` |

On the web, SVG equivalents should match the visual character of the custom dock shapes — especially the open-arc ring for the Home tab icon.

Icon sizes: 14–24pt, weight `.semibold` or `.medium`.

---

## 11. Motion & Animation

### 11.1 Principles

Motion should be subtle and purposeful. It signals state changes, not decoration.

**Use motion for:**
- Home entrance sequencing (fade in over ~0.6s)
- Ring progress and state transitions
- Snap deck section changes
- Sheet presentation
- Selection feedback (quick scale pop)
- Session completion moments (ring seal + bloom)
- Identity sigil breathing / rotation (very slow, 8–12s)
- Score count-up after session commit

**Avoid:**
- Constant decorative animation
- Excessively springy spring parameters
- Layout jumps on state change
- Animations that delay common actions
- `withAnimation(.repeatForever)` in async contexts (use value-based `.animation(_:value:)`)

### 11.2 Spring Parameters

| Use case | Response | Damping |
|---|---|---|
| Snap deck scroll | 0.35 | 0.78 |
| Sheet / modal | 0.40 | 0.85 |
| Button press scale | 0.22 | 0.90 |
| Swipe action reveal | 0.28 | 0.82 |
| Swipe action commit | 0.24 | 0.78 |

### 11.3 Easing

| Pattern | Easing | Duration |
|---|---|---|
| Ring breathing | easeInOut | 3.5s, repeating |
| Session background reveal | easeInOut | 5.0s (slow cinematic) |
| Session background transition | easeInOut | 0.42s |
| Monochrome toggle | easeInOut | 0.36s |
| Score count-up (24 ticks) | quadratic ease per tick | 1.6s total |
| Identity sigil rotation | linear / very slow | 8–14s per revolution |

### 11.4 Haptics

| Event | Haptic |
|---|---|
| Session start | `.medium` impact |
| Session complete / commit | `.heavy` impact |
| Score count-up tick | `.selection` (each tick) |
| Swipe reveal threshold | `.selection` |
| Swipe commit threshold | `.medium` |
| Tab/deck section change | `.selection` |
| Shield earned | `.notification(.success)` |
| Streak protection alert | `.notification(.warning)` |

---

## 12. App Structure

The app has five tabs in a custom ZStack-based navigation (not SwiftUI `TabView`):

| Tab | Label | Icon (`DockIconView`) | Hosts |
|---|---|---|---|
| `.home` | "Home" | `FocusRingArcDockIcon` (ring arc) | `HomeView` |
| `.tasks` | "Habits" | `square.stack` SF Symbol | `HabitsView` (31 modes) |
| `.selfTab` | "Self" | `RestlessSigilDockIcon` (sigil ring + dot) | `SelfView` (Identity / Dimensions / Reflections) |
| `.overview` | "Overview" | `StatsDockIcon` (3 bars) | `OverviewView` (hub → Stats or Reports) |
| `.settings` | "Profile" | `ProfileDockIcon` (head + shoulders) | `SettingsView` |

The bottom nav is always visible for tab navigation. No center play button. Each tab has its own NavigationStack.

**Onboarding gate:** Non-onboarded users see `OnboardingView` (7 steps) before the tab bar. After onboarding, non-Pro users see `PrimaryPaywallView` full-screen before entering the app.

---

## 13. Home Screen

### 13.1 Structure

```
┌─────────────────────────────┐
│  Date + Greeting            │ ← Fade in on load
│  Animated intent copy       │ ← HomeIntentCopy
│                             │
│     ┌───────────────┐       │
│     │FocusOnboarding│       │ ← Full circle ring, lime arc
│     │  RingVisual   │       │   (FocusOnboardingRingVisual)
│     └───────────────┘       │
│                             │
│  ┌─────────────────────┐   │
│  │  Snap Deck           │   │ ← 3 sections, custom snap
│  │  ┌─────────────────┐│   │
│  │  │ Momentum        ││   │ ← Section 0
│  │  │─────────────────││   │
│  │  │ Quick Access    ││   │ ← Section 1
│  │  │─────────────────││   │
│  │  │ Scheduled       ││   │ ← Section 2
│  │  └─────────────────┘│   │
│  └─────────────────────┘   │
│                             │
│ [Home] [Habits] [Self] [Ov] [Profile] │ ← Custom bottom nav
└─────────────────────────────┘
```

### 13.2 Snap Deck Sections

| Index | Code name | UI label | Content |
|---|---|---|---|
| 0 | `.momentum` | "Momentum" | `FocusOnboardingRingVisual` (Quick Flow ring), today's stats, identity row, streak, last session |
| 1 | `.blockModes` | "Quick Access" | Favourited Habits modes + starter recommendations |
| 2 | `.scheduled` | "Scheduled" | Scheduled block windows |

Snap dots on the right edge indicate current section.

**Momentum section** shows: identity row (links to Self), today's stats pill row, weekly reclaimed time, next scheduled block, streak.

**Quick Access section** shows: cards from the Habits catalog. Favourited modes first, then starter recommendations (`deep`, `quick`, `wind`). Empty state: "Add modes from Habits". Cards show Pro lock badge when locked and user is not Pro.

**Scheduled section** shows: upcoming time-based app blocking windows. First block is free; additional blocks require Pro.

### 13.3 Home Ring — Quick Flow

The ring is a single "Quick Flow" start (no mode picker). Tapping it starts an immediate session. During a session, it morphs to an active state inline without leaving the Home screen.

The ring must remain visually stable — no layout jumps. Size and position fixed at all times.

---

## 14. Habits Tab (31 Modes)

### 14.1 Structure

Full curated mode library. 31 modes across 4 categories.

**Categories:**
1. Productivity (8 modes)
2. Wellbeing (7 modes)
3. Body (8 modes)
4. Life (8 modes)

Each mode card shows: name, duration, bypass/break policy indicators, Pro lock badge if locked.

**Free modes (3):** Quick Focus (15m), Mindful (20m), Gym (75m)  
**Pro modes (28):** All others

### 14.2 Mode Table

| ID | Name | Duration | Bypass | Break | Free | Category |
|---|---|---|---|---|---|---|
| `quick` | Quick Focus | 15m | 1 | — | ✓ | Productivity |
| `flow` | Flow | 45m | 1 | 5m | | Productivity |
| `deep` | Deep Work | 90m | none | 20m | | Productivity |
| `study` | Study | 60m | 1 | 10m | | Productivity |
| `work-sprint` | Work Sprint | 50m | 1 | 5m | | Productivity |
| `admin-hour` | Admin Hour | 30m | 2 | — | | Productivity |
| `creative-flow` | Creative Flow | 75m | 1 | 15m | | Productivity |
| `no-scroll` | No Scroll | 30m | none | — | | Productivity |
| `mindful` | Mindful | 20m | 1 | — | ✓ | Wellbeing |
| `breathe` | Breathe First | 5m | none | — | | Wellbeing |
| `reset` | Reset | 15m | none | — | | Wellbeing |
| `recovery` | Recovery | 45m | 1 | 5m | | Wellbeing |
| `wind` | Wind Down | 60m | 1 | 10m | | Wellbeing |
| `sleep-gate` | Sleep Gate | 480m | emergency | 150m | | Wellbeing |
| `quiet-mind` | Quiet Mind | 30m | 1 | — | | Wellbeing |
| `gym` | Gym | 75m | 1 | 15m | ✓ | Body |
| `move` | Move | 20m | none | — | | Body |
| `walk` | Walk | 30m | 1 | — | | Body |
| `stretch` | Stretch | 10m | none | — | | Body |
| `run` | Run | 45m | 1 | 5m | | Body |
| `training` | Training | 90m | emergency | 20m | | Body |
| `recovery-walk` | Recovery Walk | 25m | 1 | — | | Body |
| `outdoor-time` | Outdoor Time | 60m | 1 | 10m | | Body |
| `family` | Family | 90m | emergency | 20m | | Life |
| `dinner` | Dinner | 45m | none | 5m | | Life |
| `morning-start` | Morning Start | 30m | 1 | — | | Life |
| `commute-calm` | Commute Calm | 30m | 1 | — | | Life |
| `date-night` | Date Night | 120m | emergency | 30m | | Life |
| `offline-evening` | Offline Evening | 120m | 1 | 30m | | Life |
| `weekend-reset` | Weekend Reset | 180m | 1 | 50m | | Life |
| `parent-time` | Parent Time | 60m | emergency | 10m | | Life |

---

## 15. Active Session Screens

All sessions run **inline inside `HomeView`** via the `HomeQuickSessionPhase` state machine — there is no separate fullScreenCover session view. Both Quick Flow taps and Habits-launched sessions use the same ring and chrome.

| Surface | Location | Ring | Entry |
|---|---|---|---|
| All sessions | Inline in `HomeView.homeHeroSticky()` | `FocusOnboardingRingVisual` — full circle, lime arc | Home ring tap; Habits tab; Quick Access cards |

The ring transitions: idle (dark track, breathing) → active (lime arc fills) → paused (orange) → ambient (monochrome).

**Shared session subcomponents** (defined in `SessionComponents.swift`):
- `FocusSessionHeader` — mode title + paused state + hold-to-end button
- `FocusSessionTimerReadout` — countdown digits (Satoshi Bold/Black 72–96pt) + subtitle
- `FocusSessionControls` — break / pause / shield buttons
- `FocusSessionRulesStatusText` — current rules mode chip
- `FocusSessionBlockersRow` — shield status + blocked app icon strip

---

## 16. Self Screen

Three tabs: Identity, Dimensions, Reflections.

**Identity:** The user's stage in a 23-stage journey (Stage 0 "The First Step" → Stage 22 "The Luminous"). The stage is determined by: reclaimed minutes, session count, streak, and dimension floors. The animated sigil hero represents the current stage. All 23 stages are always browsable.

**Sigil geometry:** Each stage has a unique geometric composition built from concentric circles, dots, and geometric lines (sacred geometry aesthetic). These are SVG/Canvas-renderable. See `SelfView.swift` and `js/sigil.js` in the marketing site for the web port.

**Returning state:** When the user's last session was 2–6 days ago, the stage name becomes "The Returning" and the sigil gets a dashed outer ring.

**Dimensions (5):**
| Dimension | Color | Description |
|---|---|---|
| Awareness | lime `#BFFF47` | Completion follow-through rate |
| Action | cyan `#5AC8FA` | Sessions started |
| Resilience | pink `#FF6B8A` | Active days + comeback |
| Depth | warm `#D2B06E` | Average session length |
| Alignment | done `#32D74B` | Active days spread |

---

## 17. Overview & Stats

**Overview** is the review hub. Two cards lead to Stats ("The numbers") and Reports ("The story").

**Stats shows:**
- Weekly bar chart (lime accent bars, today highlighted)
- Metric pills (streak `flame.fill`, reclaimed time, today, sessions)
- Momentum chip (↑ Accelerating / ↓ Slipping / → Steady) — from 7-day linear regression
- 6 insight cards (peak hour, best day, best mode, bypass pattern, sweet spot, consistency)
- Game Center leaderboard (rank 1–3: gold/silver/bronze badges)

**Weekly Recap** — 5-page horizontal swipe report:
1. Summary (total time, days, vs last week)
2. Your edge (best day, peak window, before-noon %)
3. Momentum (streak, shields, consistency)
4. Reflection (behavioral pattern narrative)
5. Intention (next-week plan)

---

## 18. Settings / Profile Screen

Accordion layout — one section open at a time.

**Focus group:**
- Session Rules (3-way: Default / Strict (Pro) / Timer Only)
- Per-app daily limits (Pro) — `AppUsageLimitsView`
- App Blocker → `AppBlockerSections`

**Preferences group:**
- Notifications (4 toggles)
- Theme — session background picker
- Age, widget, live activity

**Account group:**
- Game Center
- Apple Sign In / Sign Out
- Profile avatar (initials), display name, email

**Subscription panel:**
- Free user: feature pillar checklist + "SEE PLANS" CTA
- Pro user: current plan, renewal date, manage/restore

---

## 19. Paywall

### 19.1 Primary Paywall — `PrimaryPaywallView`

Full-screen. Used in onboarding and from "Go Pro" Settings CTA.

- Trial-eligible: "Your first week is free" + `PaywallTrialTimeline` (Day 1 → Day 30 cascade)
- Returning users: loss-frame count-up hero + timeline benefits
- Annual plan pre-selected
- Plans: Monthly ($9.99/mo) and Annual ($59.99/yr, "SAVE 50%", 7-day free trial)

### 19.2 Contextual Paywall — `ContextualPaywallSheet`

70% height sheet. Appears when a Pro-gated feature is tapped.

Shows the feature's specific value proposition (e.g. "Custom blocking is Pro"), then the `ProBenefits` pillar panel:

| # | Icon | Text |
|---|---|---|
| 1 | `lock.shield.fill` | Strict blocking & App locks |
| 2 | `square.grid.2x2.fill` | All modes & habits |
| 3 | `calendar` | Unlimited schedules & limits |
| 4 | `circle.circle` | Growth nudges and Deep patterns |
| 5 | `chart.bar.xaxis` | Full stats, insights & Weekly reports |
| 6 | `photo.fill` | Session themes & backgrounds |

Annual CTA button: lime `#BFFF47`, dark text `#233600`.

---

## 20. Onboarding (7 Steps)

| Step | Name | Key Visual |
|---|---|---|
| 0 | Welcome | Launch ring animation (open arc, breathing) |
| 1 | Phone Time | Slider with tint lerp (lime → orange above 7h); Canvas particle field of app glyphs |
| 2 | Name | Name input with time-of-day greeting preview |
| 3 | Goals | Habit goal grid + suggested category chips |
| 4 | Projection | `TimeProjectionChart` animated in `YearlyProjectionCard` |
| 5 | Blocking | `ShieldDemoMockup` — looping phone animation with app icons desaturating |
| 6 | Finale | `IdentityJourneyShowcase` sigil draw + 3 personalized plan rows + glowing CTA |

The ring appears on step 0 as the first visual the user sees. It matches the Home ring exactly — same open arc, same lime color, same breathing animation.

---

## 21. Copy Voice

Copy is short, direct, and calm. Write for someone who values their time and is about to use this tool to protect it.

**Use:**
- "Start Focus"
- "Commit Session"
- "Blocked"
- "Clean session"
- "Reclaimed today"
- "Protect this session"
- "Schedule block"
- "Blocking now"
- "Set Blockers"
- "Reclaim my time"
- "Begin my journey"

**Avoid:**
- Motivational fluff ("You've got this!", "Amazing work!")
- Long explanations
- Generic productivity slogans
- Feature explanations in the UI
- Claims about protection when blockers aren't configured
- Exclamation marks in general UI copy

**Numbers style:**
- Use compact format: `25m`, `1h 30m`, `847 pts`
- Always show reclaimed time as **reclaimed minutes**, not "focus time"
- Streak shown as a number + `flame.fill` icon, no explanatory text

---

## 22. Accessibility

- Dynamic Type where practical
- Sufficient contrast (lime on dark exceeds WCAG AA at most sizes)
- VoiceOver labels on all icon-only controls (min 44pt tap target)
- Reduce Motion: switch scripted sequences to shorter fades
- Clear selected / disabled states beyond color alone
- Text must not overflow pills or compact rows — use `lineLimit` + `minimumScaleFactor`

---

## 23. What Is NOT Part of the Design

These were removed — do not reintroduce:

- `focusPurple` (`#7B6FFF`) — removed; use `focusCyan`
- Ring reel / multi-mode Home picker — removed 2026-06-14
- `TasksView.swift` — deleted; Habits tab hosts `HabitsView`
- `FocusSelectView` — removed; sessions configure on Home / Habits directly
- Border strokes on standard `focusCard()` — never add
- `PhosphorSwift` / `PhIcon` — removed; SF Symbols only
- `BarChartView.swift` — removed; use `FocusBarChart` (Swift Charts)
- Space Grotesk / DM Sans / system rounded fonts — use Satoshi only
- Hardcoded `.black` / `.white` backgrounds — use `FocusBackground()` + clear NavigationStack backgrounds
- `todayScore` / `totalScore` on `FocusStats` — legacy stubs, not in active use
- "Targets" deck section — removed
- "Routines" section in App Blocker — removed
- **`ScoreRingView`** — never existed; the Home/session ring is `FocusOnboardingRingVisual`
- **`RingView` / `PausedRingView`** as active session ring — defined but unused; all ring rendering uses `FocusOnboardingRingVisual`
- **`FocusSessionProgressRing`** — never existed
- **Tab icons as SF Symbols** (`house.fill`, `checklist`, `circle.circle`, etc.) — tab icons are custom shapes in `DockIcons.swift`
- **`HomeDockIcon` / `TasksDockIcon` / `SelfDockIcon`** — wrong names; correct names are `FocusRingArcDockIcon`, `square.stack` (SF Symbol), `RestlessSigilDockIcon`
- **`EditFieldLabel`** — never existed in the codebase
- **Full-screen Habits session as `.fullScreenCover`** — all sessions run inline in `HomeView` via `HomeQuickSessionPhase`

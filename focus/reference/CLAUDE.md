# Focus — iOS App (AI Agent Reference)

> This file is the single source of truth for any AI agent working on this codebase.
> Do NOT rely on plan files, old README content, or any other `.md` file for design decisions.

---

## Project Overview

**Focus** is a native SwiftUI productivity app for iOS 17+. Core features: session-based focus timers, task management, ScreenTime-powered app blocking (a 31-mode Habits library + a single Home "Quick Flow" ring), identity/self progression system, momentum analytics, and a Game Center leaderboard.

| Key | Value |
|---|---|
| Bundle ID | `com.yassir.focus` |
| Scheme | `FocusApp` |
| Min deployment | iOS 17 |
| Architecture | MVVM + SwiftData + `@Observable` |
| Dependencies | Apple-native frameworks + **supabase-swift** (SPM) for cloud sync |

---

## Xcode Targets

| Target | Purpose |
|---|---|
| `FocusApp` | Main app |
| `FocusWidget` | Home screen widget + Lock Screen Live Activity |
| `FocusDeviceActivityMonitor` | DeviceActivity extension — intercepts app usage during block sessions |
| `FocusShieldAction` | Shield action extension — handles "bypass" button on the block shield UI |
| `FocusShieldConfiguration` | Shield configuration extension — customises the block shield appearance |

App Group shared container: `group.com.yassir.focus.app`

---

## Design System

### Typography

**Satoshi** (custom font, bundled TTF) — weights: Light, Regular, Medium, Bold, Black.

```swift
FocusFont.display(size, weight:)       // Satoshi Bold by default
FocusFont.displayW(size, weight:)      // Satoshi, explicit weight
FocusFont.body(size)                   // Satoshi Regular
FocusFont.bodyMedium(size)             // Satoshi Medium
```

### App Background

Moonwalker gradient: `#152331 → black` (top to bottom), applied via `FocusBackground()` in `RootView`.

```swift
struct FocusBackground: View   // calls .ignoresSafeArea() internally
```

All `NavigationStack` backgrounds must be `.background(Color.clear)` so the gradient shows through.

### Radius Tokens (`DesignSystem.swift`)

```swift
Radius.r1 = 10   // chips, small interactive elements
Radius.r2 = 16   // default card (focusCard modifier)
Radius.r3 = 22   // large panels
Radius.r4 = 32   // floating sheets, pill shapes
```

### Session Themes (`DesignSystem.swift`)

`FocusSessionTheme` is a **Pro feature** — background photo overlay applied to the full-screen Habits session view. The default theme (`midnight`) is free for all users. `vm.effectiveSessionTheme` returns `.defaultTheme` for free users regardless of stored preference.

```swift
enum FocusSessionTheme: String, CaseIterable, Identifiable, Codable, Equatable {
    case midnight      // "Midnight" — deep blue focus gradient (default, free)
    case blueCharm     // "Blue Charm" — soft blue atmospheric glow (Pro)
    case quietBench    // "Quiet Bench" — still outdoor reset (Pro)
    case blueMount     // "Blue Mount" — moonlit mountain water (Pro)
    case iceMountains  // "Ice Mountains" — cold alpine stillness (Pro)
    case nightOcean    // "Night Ocean" — open water night calm (Pro)

    static let defaultTheme: FocusSessionTheme = .midnight
    static let imageOpacity: Double = 0.50
}
```

- Theme picker lives in **Settings → Theme** accordion section (`SettingsView`)
- Gated via `.proGated(isPro:feature:.themes)` → opens `ContextualPaywallSheet(.themes)`
- Per-session override: `ActiveSession.sessionTheme` can pin a theme for one session

### Color Tokens (`DesignSystem.swift`)

#### Backgrounds — semantic/adaptive (auto dark/light mode)
| Token | Value |
|---|---|
| `Color.focusBG` | `Color(.systemBackground)` |
| `Color.focusSurface1` | `Color(.secondarySystemBackground)` |
| `Color.focusSurface2` | `Color(.tertiarySystemBackground)` |
| `Color.focusSurface3` | `Color(.systemFill)` |

#### Brand Accents — fixed hex
| Token | Hex | Use |
|---|---|---|
| `Color.focusAccent` | `#BFFF47` | Primary lime green — CTAs, active states, ring |
| `Color.focusAccentDim` | `#BFFF47` @ 10% | Subtle accent backgrounds |
| `Color.focusAccentGlow` | `#BFFF47` @ 25% | Ring glow shadows |
| `Color.focusPink` | `#FF6B8A` | Activity/energy metric |
| `Color.focusCyan` | `#5AC8FA` | Work tag, secondary gradient stop |

#### Dark-surface palette — fixed hex (onboarding, modals, session UI)
| Token | Hex | Use |
|---|---|---|
| `Color.focusInk` | `#1D2115` | Dark olive card base — `FocusLiquidGlassBackground` fill, modal backgrounds |
| `Color.focusInkSoft` | `#1A1F14` | Slightly deeper card fill — sheet presentation backgrounds |
| `Color.focusElevated` | `#323629` | Raised chip / icon surface |
| `Color.focusTextSecondary` | `#C2CAAF` | Warm sage secondary text — onboarding body copy |
| `Color.focusTextPrimaryWarm` | `#F4F8EC` | Warm off-white primary text — onboarding headlines |
| `Color.focusOnAccent` | `#233600` | Text rendered on lime accent (`AccentButton` label) |
| `Color.focusProArc` | `#4B6F12` | Deep brand green for Pro ring marks (`PaywallRingMark`) |

#### Text — semantic/adaptive
| Token | Value |
|---|---|
| `Color.focusText` | `Color(.label)` |
| `Color.focusText2` | `Color(.secondaryLabel)` |
| `Color.focusMuted` | `Color(.tertiaryLabel)` |

#### Status — fixed hex, iOS dark-mode calibrated
| Token | Hex | Use |
|---|---|---|
| `Color.focusDanger` | `#FF453A` | High priority, errors, danger |
| `Color.focusWarning` | `#FF9F0A` | Medium priority, warnings, Study tag |
| `Color.focusSuccess` | `#30D158` | Success states |
| `Color.focusDone` | `#32D74B` | Done task checkmark |

#### Monochrome session palette — `FocusSessionMonochromePalette` (`DesignSystem.swift`)

Used when `timerVM.isAmbient == true` (Timer-only / ambient session mode). Applied in `HomeView.homeRingVisual()` and all `isMonochrome:` parameters on shared session subcomponents.

```swift
enum FocusSessionMonochromePalette {
    static let platinum      // #E6E9EE — primary arc / accent colour
    static let silver        // #B9C0C9 — glow colour
    static let graphite      // #101216 — deepest background
    static let graphiteSoft  // #181B20 — track colour
    static let primaryText   // #F4F6F8
    static let secondaryText // #AEB5BE
    static let tertiaryText  // #737B85
    static let warning       // #D0B982 — paused arc tint
    static let danger        // #C98C8C
    static let controlSurface // #15181D @ 66% — button backgrounds
    static let arcColors: [Color]  // 4-stop shimmer gradient for active arc
}
```

#### Tag Colors
```swift
TagStyle.work      // focusCyan  (#5AC8FA)
TagStyle.personal  // focusDone  (#32D74B)
TagStyle.health    // yellow     (#FFD60A)
TagStyle.study     // focusWarning (#FF9F0A)
TagStyle.forTag("work")   // helper — returns TagStyle from a raw String
```

```swift
Color.priorityColor("high")    // focusDanger
Color.priorityColor("medium")  // focusWarning
Color.priorityColor("low")     // focusSuccess
```

### Card Styles

```swift
.focusCard()
// secondarySystemBackground fill + RoundedRectangle(cornerRadius: 16, style: .continuous)
// NO border stroke.
```

**Liquid Glass Background** — used for interactive/edit fields and chip backgrounds:
```swift
FocusLiquidGlassBackground(isActive: Bool = false, showActiveStroke: Bool = true)
// fill: focusInk (#1D2115) at 40% opacity — RoundedRectangle(cornerRadius: 20)
// border: white at 0.1 opacity (always)
// when isActive: focusAccent glow shadow + optional accent stroke
```

**Session Scenic Background** — animated full-bleed background for active sessions:
```swift
FocusSessionScenicBackground(imageName: String, isMonochrome: Bool = false)
// Stacks: FocusBackground() base + photo layer + blur halo + gradient scrim + black veil
// Photo fades in over 5 seconds via smoothstep easing (revealProgress 0→1)
// isMonochrome: desaturates photo, adds high-contrast overlays (used when timerVM.isAmbient)
// imageName helper: FocusSessionScenicBackground.imageName(mode:homeRingMode:blockProfileID:)
```

### Gradient Foreground

```swift
Text("847").gradientForeground()
// LinearGradient: focusAccent → focusCyan, leading → trailing, as mask overlay

Text("pts").gradientForeground([.focusAccent, Color(hex: "#7BFF7B")])
// Custom color array variant
```

### Helper Views

```swift
SectionLabel("WEEKLY")
// Uppercase 11pt bold, tertiaryLabel, 1.0 kerning
```

### Icons

**SF Symbols only** for all general UI. No third-party icon packages.

```swift
Image(systemName: "flame.fill").font(.system(size: 14, weight: .semibold))
```

**Tab bar icons** use **custom `DockIconView`** shapes — NOT SF Symbols (`DockIcons.swift`):

| Tab | `DockIconView` renders | Description |
|---|---|---|
| `.home` | `FocusRingArcDockIcon` (Shape) | Ring arc trimmed to 0.78, -90° rotation, rounded caps — mirrors the app's focus ring |
| `.tasks` | `Image(systemName: "square.stack")` | SF Symbol — stacked layers |
| `.selfTab` | `RestlessSigilDockIcon` (View) | Outer ring + centre dot — Stage 1 sigil proportions |
| `.overview` | `StatsDockIcon` (Shape, filled) | Three rounded bars at varying heights |
| `.settings` | `ProfileDockIcon` (Shape, stroked) | Head ellipse + shoulder arc |

> ⚠️ Do **not** substitute SF Symbols for tab icons. `DockIconView(tab:color:)` is the only correct call site.

Common SF Symbol mappings for **non-tab UI**:
| UI element | SF Symbol |
|---|---|
| Focus (session play) button | `play.fill` |
| Streak | `flame.fill` |
| Timer | `timer` |
| Done state | `checkmark.circle.fill` |
| Add | `plus` |
| Lock | `lock.fill` |
| Shield | `shield.fill` |

### Charts

Use native Swift Charts via the `FocusBarChart` component — never canvas-drawn custom charts.

```swift
FocusBarChart(data: [Int], labels: [String], highlightIndex: Int?)
```

---

## File Structure

```
FocusApp/
├── FocusApp.swift                    # @main entry, ModelContainer setup
├── DesignSystem.swift                # All design tokens (colors, fonts, radii, cards, helpers)
├── FeatureFlags.swift                # Build-time flags (appLimitsEnforcement)
├── Models/
│   ├── FocusTask.swift               # SwiftData model — tasks
│   ├── FocusSessionRecord.swift      # SwiftData model — session history
│   ├── ScheduledBlock.swift          # Codable/UserDefaults — scheduled block windows
│   ├── WeeklyReport.swift            # Codable value type for weekly recap data + sample
│   ├── FocusActivityAttributes.swift # ActivityKit attributes for Live Activity
│   ├── FocusActivityShared.swift     # App Group keys for Live Activity handoff
│   └── FocusShieldSessionState.swift # App Group state for ScreenTime shield sessions
├── ViewModels/
│   ├── AppViewModel.swift            # @Observable root ViewModel
│   └── TimerViewModel.swift          # Countdown timer state machine
├── Intents/
│   └── EndFocusSessionIntent.swift   # LiveActivityIntent — ends session from Lock Screen button
├── Services/
│   ├── AchievementEngine.swift       # Badge unlock logic (5 achievements)
│   ├── CBTMetricsService.swift       # Cognitive-behavioral pattern analysis helpers
│   ├── GameCenterService.swift       # GKLeaderboard submission
│   ├── HapticService.swift           # UIImpactFeedbackGenerator wrapper
│   ├── InsightEngine.swift           # Analytics insights (6 types)
│   ├── LiveActivityService.swift     # ActivityKit Lock Screen Live Activity
│   ├── NotificationService.swift     # Local push notifications
│   ├── ScreenTimeService.swift       # FamilyControls / ManagedSettings + per-app limits
│   ├── SelfMetricsService.swift      # Identity stage + dimension scoring
│   ├── SubscriptionManager.swift     # StoreKit 2 — products, entitlement, purchase, trial
│   ├── WeeklyReportBuilder.swift     # Builds WeeklyReport values from session history
│   └── Supabase/
│       ├── SupabaseClientProvider.swift  # Supabase client singleton (no-op when credentials absent)
│       ├── SupabaseConfig.swift          # URL/anon-key constants (gitignored / injected at build time)
│       ├── SupabaseAuthService.swift     # Apple-ID → Supabase session exchange; auth state observer
│       ├── SupabaseSync.swift            # App-facing facade; `SupabaseSync.shared` is the only entry point
│       ├── SyncEngine.swift              # Offline-first push/pull for SwiftData models (tasks + sessions)
│       ├── SyncModels.swift              # Codable DTOs: ProfileDTO, TaskDTO, FocusSessionDTO (snake_case keys)
│       ├── SyncRepositories.swift        # Supabase table-level upsert/fetch helpers
│       ├── SyncTombstoneStore.swift      # UserDefaults-backed pending soft-delete queue
│       └── AppleSignInNonceProvider.swift # SHA-256 nonce for Apple Sign In → Supabase flow
├── Views/
│   ├── RootView.swift                # Onboarding gate + custom bottom nav + session orchestration
│   ├── Home/
│   │   ├── HomeView.swift            # Snap deck (Momentum/Quick Access/Scheduled), Quick Flow ring
│   │   ├── HomeSnapDeck.swift        # SnapDeckSection container + QuickAccess deck cards
│   │   ├── HomeFirstRunHints.swift   # First-install coaching overlays (ring tap + deck peek)
│   │   ├── HomeIntentCopy.swift      # Animated intent copy above the ring
│   │   └── BlockModeDetailSheet.swift # Quick Access mode detail/preview sheet
│   ├── Tasks/
│   │   └── HabitsView.swift          # 31-mode Habits catalog (per-mode bypass/break), freeModeIDs gating  (NOTE: legacy `TasksView.swift` was deleted — the `.tasks` tab hosts HabitsView, not a task list)
│   ├── Focus/
│   │   ├── SessionComponents.swift   # Shared session UI subcomponents (renamed from FocusSessionView.swift)
│   │   ├── SessionEndView.swift      # Post-session results + commit; also hosts ResistanceCheckpointOverlay, SessionBreathingOverlay, SessionBreakRecoveryOverlay, IdentityCheckpointContext/Copy
│   │   ├── ScheduleSessionSheet.swift / ScheduledBlockSheet.swift  # scheduling sheets
│   │   └── MindfulOverlayView.swift  # Bypass/distraction mindful check overlay
│   ├── Self/SelfView.swift           # Identity journey, dimension bars, sigils
│   ├── Overview/OverviewView.swift   # Hub: landing → StatsView or WeeklyRecapFlowView
│   ├── WeeklyRecap/
│   │   ├── WeeklyRecapListView.swift # Report list (Pro/free sample gating)
│   │   └── WeeklyRecapView.swift     # 5-page paged recap (WeeklyRecapFlowView wrapper + WeeklyRecapView)
│   ├── Stats/StatsView.swift         # Insights, weekly chart, leaderboard (embedded in OverviewView)
│   ├── Settings/
│   │   ├── SettingsView.swift        # Accordion settings (Focus, Preferences, Account)
│   │   ├── AppUsageLimitsView.swift  # Per-app daily caps UI (system picker + limit cards)
│   │   └── AgeSettingsPicker.swift   # ProfileAgeView + AgeHorizontalPicker
│   ├── Paywall/
│   │   ├── ContextualPaywallSheet.swift  # ProBenefits enum + ContextualPaywallSheet (70% sheet)
│   │   ├── PrimaryPaywallView.swift      # Full-screen paywall + PaywallTrialTimeline + PaywallRingMark
│   │   ├── SubscriptionSettingsPanel.swift # Settings upsell panel + pro management panel
│   │   ├── TrialNudgeViews.swift          # TrialBannerView (dismissible in-trial end warning)
│   │   └── WinBackSheet.swift             # WinBackSheet + PaywallCTAButton + PaywallLegalFooter
│   ├── Blocker/BlocklistView.swift   # App Blocker SHARED COMPONENTS only (no `BlocklistView` root — deleted; it was unreachable). `AppBlockerSections` = the body (Shield Hero → Always-On 24/7 card → Coverage Meter), rendered ONLY by Profile → App Blocker pill → `ProfileLockView` (in SettingsView). `AlwaysOnBlockingCard` = the Pro 24/7 toggle. NO "Targets" section, NO "Routines" section, NO per-mode rows (all removed). Per-mode blocker config lives on each mode's `HabitsModeSheet` in HabitsView (user picks "Match Default" or sets a custom blocklist there; Pro-locked modes gate the config behind the paywall)
│   ├── Onboarding/
│   │   ├── OnboardingView.swift          # 7-step onboarding flow
│   │   ├── OnboardingBlockingScreen.swift # Blocking setup step with ShieldDemoMockup
│   │   ├── AppleSignInOnboardingScreen.swift # Sign-in prompt inside onboarding
│   │   └── SignInRepromptSheet.swift         # Post-onboarding sign-in reprompt sheet
│   ├── WidgetPreview/WidgetPreviewView.swift
│   └── Components/
│       ├── AccentButton.swift        # All button variants
│       ├── AppIcon.swift             # AppIconTile (brand gradient tiles for social apps)
│       ├── DockIcons.swift           # DockIconView + per-tab custom Shape icons
│       ├── FocusBarChart.swift       # Swift Charts bar chart wrapper
│       ├── GradualSpacing.swift      # Animated letter-spacing helper
│       ├── ProLockBadge.swift        # ProLockBadge, ProLockedButton, .proGated modifier
│       ├── ProgressBar.swift         # Horizontal progress bar
│       ├── RingView.swift            # RingView, PausedRingView, ScoreRingView
│       └── TagChip.swift             # Tag label chip

FocusWidget/
├── FocusWidget.swift                 # Home screen widget
├── FocusLiveActivity.swift           # Lock Screen Live Activity definition
└── FocusWidgetBundle.swift

FocusDeviceActivityMonitor/
└── DeviceActivityMonitorExtension.swift   # Shields apps on threshold events; handles per-app limits + scheduled blocks

FocusShieldAction/
└── ShieldActionExtension.swift

FocusShieldConfiguration/            # Shield UI customisation extension
```

---

## Data Models

### `FocusTask` (SwiftData)

```swift
var id: UUID
var name: String
var tag: String           // "work" | "personal" | "health" | "study"
var priority: String      // "low" | "medium" | "high"
var status: String        // "todo" | "inprogress" | "done"
var progress: Int         // 0–100, auto-calculated from time spent
var deadline: String?     // freeform date string
var createdAt: Date
var targetMinutes: Int    // user's focus goal; default 25
var totalMinutesSpent: Int // accumulated across all sessions
var completedAt: Date?    // set when status → "done"
var syncedAt: Date?       // nil = not yet pushed to Supabase
```

### `FocusSessionRecord` (SwiftData)

```swift
var id: UUID
var taskID: UUID?
var taskName: String?
var duration: Int                  // planned minutes
var elapsed: Int                   // actual seconds elapsed
var mode: String                   // "focus" | "flow" | "deep" | home ring mode id
var homeRingMode: String?
var distractions: Int              // number of bypass taps
var reclaimedMinutes: Int          // credited focus minutes
var startedAt: Date?
var committedAt: Date?             // when user tapped Done on SessionEndView
var completionRatio: Double
var intentionCompleted: Bool
var completedAt: Date
var completionKindRaw: String      // SessionCompletionKind.sealed.rawValue by default
var quitReasonRaw: String?         // QuitReason rawValue when earlyExit
var resistanceContinueCount: Int   // how many times user chose "stay" at checkpoint
// CBT micro-reflection fields (all nil when no checkpoint triggered)
var cbtCheckpointReasonRaw: String?
var cbtUrgeIntensity: Int?
var cbtResetOptionRaw: String?
var cbtResetOutcomeRaw: String?
var cbtCheckpointElapsedSeconds: Int?
var syncedAt: Date?                // nil = not yet pushed to Supabase

// Computed helpers
var completionKind: SessionCompletionKind
var quitReason: QuitReason?
var cbtReflection: CBTMicroReflection?  // reconstructed from raw fields
```

**Enums defined in `FocusSessionRecord.swift`:**

```swift
enum SessionCompletionKind: String, Codable, CaseIterable {
    case sealed    // normal — user held the end button or timer expired
    case earlyExit // user ended before target was reached
}

enum QuitReason: String, Codable, CaseIterable, Identifiable {
    case boredom, tiredness, taskUnclear, tooBig, stress,
         phoneHabit, realInterruption, intentionalStop, skipped
}

enum CBTResetOption: String, Codable, CaseIterable, Identifiable {
    case none, takeBreak, breathe, twoMoreMinutes
    static let actionOptions: [CBTResetOption] = [.takeBreak, .breathe, .twoMoreMinutes]
}

enum CBTCheckpointOutcome: String, Codable, CaseIterable {
    case stayed, exited
}

struct CBTMicroReflection: Equatable {
    var reason: QuitReason
    var urgeIntensity: Int
    var resetOption: CBTResetOption
    var outcome: CBTCheckpointOutcome
    var checkpointElapsedSeconds: Int
}

enum SessionRecoveryPhase: String, Codable {
    case active, breathing
    case recoveryBreak = "break"
}

struct SessionRecoveryState: Codable, Equatable {
    var actionRaw: String     // CBTResetOption rawValue
    var reasonRaw: String     // QuitReason rawValue
    var urgeIntensity: Int
    var startedAt: Date
    var targetElapsedSeconds: Int?
    var phaseRaw: String      // SessionRecoveryPhase rawValue
}
```

### `FocusStats` (Codable, UserDefaults)

```swift
var totalReclaimedMinutes: Int
var todayReclaimedMinutes: Int
var yesterdayReclaimedMinutes: Int
var streak: Int
var todayMinutes: Int
var todaySessions: Int
var totalSessions: Int
var weeklyMinutes: [Int]           // 7 elements, index 0 = Monday
var lastSessionDate: Date?
var lastReclaimedDate: Date?       // date of last credited reclaim (for streak math)
var shieldCount: Int               // 0–3; burns to protect streak on missed days
var rollingDailyReclaimedMinutes: [Int]  // newest first, max 7 entries
```

> There are **no** `todayScore` or `totalScore` fields — those are legacy decode-only stubs. All scoring is reclaimed-minutes based.

### `ActiveSession` (Codable, UserDefaults)

```swift
var taskID: String?            // UUID string or "free" (not UUID? — handles free-mode sentinel)
var taskName: String?
var duration: Int              // planned minutes
var mode: String
var homeRingMode: String?
var blockProfileID: String?    // which ScreenTime profile to activate
var sessionTheme: String?      // FocusSessionTheme rawValue; nil = use vm.effectiveSessionTheme
var recordID: String?          // UUID string
var difficulty: FocusDifficulty
var sessionRulesMode: SessionRulesMode
// Bypass state
var bypassMode: FocusBypassMode
var bypassLimit: Int
var normalBypassesUsed: Int
var emergencyBypassUsed: Bool
var allowedBypassUsed: Bool
// Break state
var isOnBreak: Bool
var breakStartedAt: Date?
var breaksTaken: Int
var breakLimit: Int
var breakDurationMinutes: Int
var totalBreakSeconds: Int
var breakPreviousIsPaused: Bool?
// Checkpoint / recovery
var checkpointKindRaw: String?         // "resistance" when checkpoint is active
var checkpointPreviousIsPaused: Bool?
var recoveryState: SessionRecoveryState?
var recoverySummary: SessionRecoverySummary
// Timing
var startTime: Date
var savedAt: Date?             // timestamp when app was backgrounded
var restoredElapsed: Int?
var isPaused: Bool
var bypasses: Int              // alias for distractions count

// Computed helpers
var bypassPolicy: FocusBypassPolicy
var breakPolicy: FocusBreakPolicy
var hasRestorableResistanceCheckpoint: Bool
var displaySessionTitle: String
var sessionRulesStatusText: String
```

`SessionRecoverySummary` tracks recovery action counts for the session-end summary:
```swift
struct SessionRecoverySummary: Codable, Equatable {
    var takeBreakCount: Int = 0
    var breatheCount: Int = 0
    var twoMoreMinutesCount: Int = 0
    var latestCompletionAt: Date?
}
```

### `AccountProfile` (Codable, UserDefaults)

```swift
var appleUserID: String
var displayName: String
var email: String?
var createdAt: Date
var initials: String          // derived from displayName
```

### `ScheduledBlock` (Codable, UserDefaults via `AppViewModel.scheduledBlocks`)

```swift
var id: UUID
var scheduledTime: Date
var duration: Int             // planned minutes
var mode: String
var homeRingMode: String?
var taskID: UUID?
var taskName: String?
var blockProfileID: String?

// Computed
var endTime: Date
var label: String             // taskName ?? modeLabel(homeRingMode ?? mode)
```

> Replaces the old `BlockScheduleEntry` SwiftData model (removed). Persisted as JSON in UserDefaults.

### `WeeklyReport` (Codable value type, built by `WeeklyReportBuilder`)

```swift
let weekStartID: String       // e.g. "2024-11-18"
let week: Int                 // ISO week number
let range: String             // e.g. "Nov 18 - 24"
let isLatest: Bool
let isSample: Bool            // true for the static preview report
let weekData: [Day]           // 7 days M–Su
let totalMins: Int
let sessions: Int
let consistencyDays: Int
let bestDayIdx: Int?
let peakWindow: PeakWindow?   // e.g. start:"9:00" end:"10:30"
let streak: Int
let stage: String?            // identity stage name at week end
let reflection: String        // narrative copy
let dims: [Dimension]         // up to 3 highlighted dimensions
let intention: Intention      // next-week plan (count, minutes, when, lines, why)
```

A static `WeeklyReport.sampleReport` is used when the user is free or has no sessions.

---

## AppViewModel

```swift
@Observable @MainActor final class AppViewModel
```

**Key persisted properties:**

| Property | Type | Default |
|---|---|---|
| `focusDifficulty` | `String` | `"medium"` |
| `sessionRulesMode` | `String` | `"default"` |
| `sessionTheme` | `String` | `FocusSessionTheme.defaultTheme.rawValue` |
| `blockedApps` | `Set<String>` | instagram, tiktok, youtube, reddit, snapchat |
| `appLimits` | `[String: Int]` | instagram:30, tiktok:20, youtube:45, twitter:15, reddit:20, netflix:60 |
| `lockedApps` | `Set<String>` | tiktok |
| `notifFlags` | `[Bool]` (4 items) | all true |
| `habitGoals` | `Set<String>` | empty |
| `favouriteHabitIDs` | `Set<String>` | empty |
| `dismissedStarterRecommendationIDs` | `Set<String>` | empty |
| `dailyPhoneHours` | `Double` | 5.5 |
| `onboardingAge` | `Int` | 26 |
| `userName` | `String` | `""` |
| `hasCompletedOnboarding` | `Bool` | false |
| `isPro` | `Bool` | false |
| `maskLiveActivityTaskName` | `Bool` | false (mirrored to App Group) |
| `stats` | `FocusStats` | zeros |
| `activeSession` | `ActiveSession?` | nil |
| `pendingSessionClaim` | `PendingSessionClaim?` | nil (UserDefaults) |
| `accountProfile` | `AccountProfile?` | nil |
| `scheduledBlocks` | `[ScheduledBlock]` | empty |
| `lastSeenReportWeekStartID` | `String?` | nil |

**Transient navigation / session state:**
```swift
var showSession     = false
var showSessionEnd  = false
var sessionResult: SessionResult?
var shieldJustEarned: Bool = false
var pendingHabitSession: PendingHabitSession? = nil  // queued Habits-tab session start
var quickAccessHabitsHintRequested = false
var wantsOnboardingReset = false
var isFirstArrivalSession = false
```

`PendingSessionClaim` — written to UserDefaults when a session expires in background; `RootView` picks it up on next foreground to complete the commit:
```swift
struct PendingSessionClaim: Codable, Equatable {
    var session: ActiveSession
    var elapsed: Int
    var distractions: Int
    var reclaimedMinutes: Int
    var completedAt: Date
}
```

`PendingHabitSession` — in-memory queue for launching a full-screen Habits session:
```swift
struct PendingHabitSession: Equatable {
    let modeID: String
    let modeName: String
    let duration: Int
    let sessionMode: String
    let blockProfileID: String?
    let bypassPolicy: FocusBypassPolicy
    let breakPolicy: FocusBreakPolicy
}
```

**Key methods:**

```swift
// Writes session to stats, handles streak, earns shields, submits to Game Center
func endSession(elapsed: Int, distractions: Int, task: FocusTask?, session: ActiveSession) -> SessionResult

func markTaskDone(_ task: FocusTask)
func moveTaskBackToTodo(_ task: FocusTask)
func completeOnboarding()

// Clears activeSession, Live Activity, ScreenTime blocking, App Group state
func clearTransientSessionState(stopExternalEffects: Bool = true)

// Returns in-progress session to restore after relaunch, nil if expired
func restoredSession(now: Date) -> ActiveSession?

// Returns a session that finished while app was backgrounded
func expiredSessionForCompletion(now: Date) -> ActiveSession?

func handleAppleSignIn(_ result: Result<ASAuthorization, Error>)
func signOut()
```

**Shield mechanics:**
- Earned when session ≥ 45 min AND 0 distractions (`shieldCount` max 3)
- On missed day (daysSince > 1): burns 1 shield to preserve streak, else resets streak to 1

**MomentumDirection** — from 7-day linear regression on `rollingDailyReclaimedMinutes`:
```swift
enum MomentumDirection { case accelerating, slipping, steady }
// slope > 4 → .accelerating | slope < -4 → .slipping | else → .steady
```

---

## Navigation — RootView

Custom bottom navigation (`BottomNav` + `NavItem`/`DockIconView`) — **NOT a SwiftUI `TabView`**. Uses a `ZStack` of `NavigationStack`s toggled by opacity + `allowsHitTesting`. **No center play button** (removed); each tab switches `selectedTab`.

```swift
enum Tab: Int { case home, tasks, selfTab, overview, settings }
```

| Tab | Nav label | Hosts |
|---|---|---|
| `.home` | "Home" | `HomeView` |
| `.tasks` | **"Habits"** | `HabitsView` |
| `.selfTab` | "Self" | `SelfView` |
| `.overview` | "Overview" | `OverviewView` |
| `.settings` | **"Profile"** | `SettingsView` |

> ⚠️ Stale-doc traps fixed here: there is **no `.stats` tab** (it's `.overview` → `OverviewView`), **no center play button**, and **no `FocusSelectView`** (the file was removed). The `.tasks` tab is labeled **"Habits"** and hosts `HabitsView`. Icons come from `DockIconView(tab:)`.

Onboarding gate: if `!vm.hasCompletedOnboarding`, `OnboardingView` is full-screen instead of the tab bar. After onboarding, `PrimaryPaywallView` is shown for non-Pro users before entering the main tabs.

**`WeeklyReportNotifPill`** — floating pill that appears at the top of the screen (above the Momentum deck) when a new weekly report is available and unseen (`hasNewWeeklyReport`). Tapping it navigates to `OverviewView` → Reports. Defined as a private struct in `RootView.swift`.

---

## Home Screen (`HomeView`)

### HomeSnapDeck (`SnapDeckSection`)

A 3-section vertical snap deck (custom scroll snapping, not `ScrollView` paging):

| Order | Enum case | UI label | Contents |
|---|---|---|---|
| 0 | `.momentum` | "Momentum" | `ScoreRingView`, today's stats, the **Quick Flow** ring |
| 1 | `.blockModes` | **"Quick Access"** | Favourited Habits modes + starter recommendations |
| 2 | `.scheduled` | "Scheduled" | Scheduled block windows |

> ⚠️ The enum case is still named `.blockModes` for historical reasons but the section is **"Quick Access"**. There is **no** `.targets` section (legacy).

### The Home ring = a single "Quick Flow"

There is **one** ring quick-start ("Quick Flow") — **not** a multi-mode picker. `selectedMode: HomeRingMode` (default `.focus`) still backs the quick-flow session's underlying config + restore, but the old 6-mode reel (`RingModeReelPicker` + `RingModeRow`/`SwipeCueView`) was **deleted** (2026-06-14) — don't reintroduce it as a live feature.

### Quick Access deck (favourites + starters)

The "Quick Access" deck (`quickAccessCards`) is built from the **Habits catalog**, not a separate list:
- **Favourites** — `HabitModeData.all` filtered by `vm.favouriteHabitIDs`, mapped via `.quickAccessBlockMode` (`source: .favorite`).
- **Starter recommendations** — `["deep", "quick", "wind"]`, shown until favourited or dismissed (`source: .starterRecommendation`).
- Empty state subtitle: "Add modes from Habits".
- Each card preserves its Habits mode's `isLocked` / `bypassPolicy` / `breakPolicy`, so Pro gating flows through (`card.mode.isLocked && !isPro` → paywall).

> `HomeView.blockModes` (5 hardcoded `BlockMode`s) is **NOT** the rendered deck — it's only a fallback/lookup supplement in `allKnownBlockModes` (`HabitModeData.all.map(\.quickAccessBlockMode) + Self.blockModes`) used to resolve a mode by id (e.g. on restore). Don't treat it as a user-facing surface.

### HomeQuickSessionPhase

State machine for Quick Flow ring → quick session flow:
```swift
private enum HomeQuickSessionPhase {
    case home, previewingSession, collapsingToSession, quickSession, restoringHome
}
```

> ⚠️ **Two real mode surfaces (don't conflate):** (1) the single **Quick Flow** ring on Home, and (2) the **Habits catalog** (`HabitsView`, 31 modes — below), whose favourited entries also appear in the Home "Quick Access" deck. `HomeRingMode` (enum) and `HomeView.blockModes` (5) still exist in code but are **not** user-facing pickers.

### ScreenTime Grant Access → Auto-Open Picker

When the user taps an action requiring ScreenTime authorization:
1. If not yet authorized: native iOS `FamilyControls` permission popup shows
2. After the user grants access: `FamilyActivityPicker` opens **immediately** — no second tap required
3. `onGrantAccess` resolves the correct `profileID` and sets `showPreviewBlockPicker = true` after `requestAuthorizationIfNeeded()` returns `true`

---

## Habits Modes (`HabitsView`)

The Habits tab is the **full curated mode library** — `HabitModeData.all`, **31 modes** across 4 categories. **Each mode carries its own `bypassPolicy` and `breakPolicy`** (defined inline in `HabitModeData.all`) that **must be respected** when the mode is launched — they are passed through to `ActiveSession` and govern that session's bypass/break. Also surfaced from the Home ring as the "quick flow" quick-start.

Per-mode policy types: **Bypass** = `none` / `allowed(N)` (N normal bypasses) / `emergency` (single emergency-only bypass). **Break** = `none` / `oneBreak(minutes)`.

> ⚠️ **Per-mode policies are authoritative under Default rules.** When `sessionRulesMode == .default`, each mode's own bypass/break applies. **Timer-only** drops shielding entirely. **Strict** strips normal/allowed bypasses but **preserves a mode's `emergency` bypass** and always keeps breaks (`ActiveSession.init`).

**Free modes** (`HabitsView.freeModeIDs`): `quick` (Quick Focus), `mindful`, `gym` — plus the always-free Home **Quick Flow** ring. **All other 28 modes are Pro** (`isLocked = !freeModeIDs.contains(id)`).

### Productivity
| ID | Name | Duration | Bypass | Break | Free |
|---|---|---|---|---|---|
| `quick` | Quick Focus | 15m | 1 | — | ✅ |
| `flow` | Flow | 45m | 1 | 5m | 🔒 |
| `deep` | Deep Work | 90m | none | 20m | 🔒 |
| `study` | Study | 60m | 1 | 10m | 🔒 |
| `work-sprint` | Work Sprint | 50m | 1 | 5m | 🔒 |
| `admin-hour` | Admin Hour | 30m | 2 | — | 🔒 |
| `creative-flow` | Creative Flow | 75m | 1 | 15m | 🔒 |
| `no-scroll` | No Scroll | 30m | none | — | 🔒 |

### Wellbeing
| ID | Name | Duration | Bypass | Break | Free |
|---|---|---|---|---|---|
| `mindful` | Mindful | 20m | 1 | — | ✅ |
| `breathe` | Breathe First | 5m | none | — | 🔒 |
| `reset` | Reset | 15m | none | — | 🔒 |
| `recovery` | Recovery | 45m | 1 | 5m | 🔒 |
| `wind` | Wind Down | 60m | 1 | 10m | 🔒 |
| `sleep-gate` | Sleep Gate | 480m | emergency | 150m | 🔒 |
| `quiet-mind` | Quiet Mind | 30m | 1 | — | 🔒 |

### Body
| ID | Name | Duration | Bypass | Break | Free |
|---|---|---|---|---|---|
| `gym` | Gym | 75m | 1 | 15m | ✅ |
| `move` | Move | 20m | none | — | 🔒 |
| `walk` | Walk | 30m | 1 | — | 🔒 |
| `stretch` | Stretch | 10m | none | — | 🔒 |
| `run` | Run | 45m | 1 | 5m | 🔒 |
| `training` | Training | 90m | emergency | 20m | 🔒 |
| `recovery-walk` | Recovery Walk | 25m | 1 | — | 🔒 |
| `outdoor-time` | Outdoor Time | 60m | 1 | 10m | 🔒 |

### Life
| ID | Name | Duration | Bypass | Break | Free |
|---|---|---|---|---|---|
| `family` | Family | 90m | emergency | 20m | 🔒 |
| `dinner` | Dinner | 45m | none | 5m | 🔒 |
| `morning-start` | Morning Start | 30m | 1 | — | 🔒 |
| `commute-calm` | Commute Calm | 30m | 1 | — | 🔒 |
| `date-night` | Date Night | 120m | emergency | 30m | 🔒 |
| `offline-evening` | Offline Evening | 120m | 1 | 30m | 🔒 |
| `weekend-reset` | Weekend Reset | 180m | 1 | 50m | 🔒 |
| `parent-time` | Parent Time | 60m | emergency | 10m | 🔒 |

> Adding/removing a mode: edit `HabitModeData.all`, set free/Pro via `freeModeIDs`, and keep this table in sync.

---

## Focus Session Flow

### 1. Configure — on Home / Habits (no `FocusSelectView`)

There is **no separate `FocusSelectView`** (removed). A session is configured + launched from one of:
- **Home "Quick Flow" ring** — tap the ring to start a quick session.
- **Home "Quick Access" deck** — a favourited/starter mode card.
- **Habits tab** — any of the 31 modes (duration, bypass, break come from the chosen `HabitModeData`).

- **Home ring tap** → `HomeView.runHomeQuickSessionStart()` — inline session.
- **Quick Access deck cards + Habits tab** → sets `vm.pendingHabitSession` → `HomeView.startDirectFromHabit(_:)` picks it up via `onChange` and calls `beginHomeQuickSession()` — also runs **inline inside HomeView**, not in a separate fullScreenCover.

Per-mode `bypassPolicy`/`breakPolicy` are passed through on all paths; global `sessionRulesMode`/`focusDifficulty` apply (see Settings → Session Rules).

### 2. Active — one inline surface, shared subcomponents

> ⚠️ **All sessions run inside HomeView's `homeHeroSticky()` — there is no separate fullScreenCover session surface.** Both Quick Flow taps and Habits-tab launches land in the same inline `HomeQuickSessionPhase` state machine. Always edit the shared subcomponents — not the outer HomeView chrome.

| Surface | Where | Ring | Entry points |
|---|---|---|---|
| **All sessions** | Inline inside `HomeView.homeHeroSticky()` | `FocusOnboardingRingVisual` — full circle (360°) | Home ring tap; Quick Access deck; Habits tab (via `pendingHabitSession`) |

The ring changes colour and glow per state: idle = lime `focusAccent`; paused = `focusWarning` orange; ambient/timer-only = `FocusSessionMonochromePalette`.

**Shared subcomponents** (defined in `SessionComponents.swift`):
- `FocusSessionHeader` — title + paused state + hold-to-end
- `FocusSessionTimerReadout` — countdown digits + subtitle
- `FocusSessionControls` — break / pause / shield buttons
- `FocusSessionRulesStatusText` — rules mode chip
- `FocusSessionBlockersRow` — shield status + app icon strip
- `BlockerIconStrip` — compact icon row of blocked apps
- `SessionRecoverySummaryView` — recovery action tally
- `FocusSessionControlButton` / `FocusSessionPrimaryButton` — styled button primitives

**Home-only chrome** (inside `HomeView`):
- `HomeQuickSessionChrome` — assembles the above shared subcomponents below the ring; also contains `HomeQuickBreakButton` and the recovery chip
- `homeHeroSticky()` — hosts the header, `FocusOnboardingRingVisual`, timer readout, and `HomeQuickSessionChrome`; driven by `quickPhase: HomeQuickSessionPhase` + `quickTimerVM: TimerViewModel`

**Rule for agents:** if you change session UI (controls, header, timer, status), edit the shared subcomponents in `SessionComponents.swift`. Do **not** duplicate logic into `HomeQuickSessionChrome` or `homeHeroSticky`.

`TimerViewModel` owns countdown state (remaining seconds, isPaused, distractions). The Home quick session uses its own `quickTimerVM` instance; Habits sessions use a separate `TimerViewModel` instance. Both are the same type.

- Bypass taps → `distractions++` → opens `MindfulOverlayView` (5-second mindful check before bypass)
- End via `HoldToEndButton` (600 ms hold) or timer expiry → pre-compute `SessionResult`, navigate to `SessionEndView`

### 3. Resistance Checkpoint (early-exit flow)

When the user tries to end early, `ResistanceCheckpointOverlay` intercepts (defined in `SessionEndView.swift`):
1. Asks the user to name a `QuitReason` (9 options)
2. Rates urge intensity (1–5)
3. Offers a `CBTResetOption`: **Take a break** (15 sec), **Calm breath** (breathing exercise), or **2 more minutes** (brief return)
4. If they choose a reset: `SessionBreathingOverlay` or `SessionBreakRecoveryOverlay` plays, then returns to session
5. If they exit anyway: `quitReason` + `CBTMicroReflection` saved to `FocusSessionRecord`

`SessionRecoveryState` on `ActiveSession` persists the in-progress recovery action across lifecycle events. `SessionRecoverySummary` accumulates counts for the session-end evidence strip.

### 4. Two-Phase Commit — `SessionEndView`

- **Phase 1**: `SessionResult` computed and shown, stats NOT yet written. `IdentityCheckpointContext` + `IdentityCheckpointCopy` generate contextual identity feedback copy.
- **Phase 2**: User taps Done → `commitPendingSession()` → `vm.endSession()` → `FocusSessionRecord` written to SwiftData → `impact(.heavy)` haptic → score ring count-up animation

### Score Count-Up Animation

Timer-based (not `withAnimation`) for haptic sync:
- Each tick: `displayedScore` advances by quadratic-eased step + `HapticService.shared.selection()`
- Max 24 ticks over 1.6 s
- Silent on `.onAppear` (no animation at app launch); animated only after session commit via `onChange`

---

## Self Screen (`SelfView`)

### Tab Structure

`SelfView` has **3 tabs** (`SelfSectionTab` enum, `activeTab: SelfSectionTab = .identity`):

| Tab | Raw value | Free / Pro | Content |
|---|---|---|---|
| `.identity` | "Identity" | **Free** | Full stage journey — `IdentityTabView`. All 23 stages browsable via sigil strip + stage card deck (`identityReviewUnlockAll = true`). |
| `.dimensions` | "Dimensions" | Scores free; coaching Pro | `DimensionsTabView` — radar + 5 dimension bars are free. The **coaching nudge** (weakest dimension card) is blurred + Pro-gated (`.proGated(isPro: isPro, feature: .identity)`). |
| `.reflections` | "Reflections" | Headline free; patterns Pro | `ReflectionsTabView` — "this week" headline is free (the retention hook). Deeper pattern sections (by session length + time of day) are blurred + Pro-gated (`.proGated(isPro: isPro, feature: .identity)`). |

> **The identity journey itself is the free hook.** Every user can see all stages, sigils, and dimension scores at any time. What's Pro is the *analysis layer*: "here's what to improve and how" (coaching nudge) + "the story behind how you focus" (deep weekly patterns in Reflections).

### Sigil Strip Auto-Scroll

The sigil strip (`ScrollViewReader`) auto-scrolls to follow card selection:
```swift
proxy.scrollTo(stageNumber, anchor: .center)  // on initial appearance
proxy.scrollTo(newStage, anchor: .center)      // onChange(of: selectedReviewStageNumber)
```
`selectedReviewStageNumber` is owned by `IdentityTabView`; `IdentityCardReviewDeck` drives it via `onChange(of: id)` as the user swipes cards.

### `SelfSummary`

Rich value type computed by `SelfMetricsService` and passed to all three tab views:

```swift
struct SelfSummary {
    let actualStage: IdentityStage
    let displayStageName: String        // "The Returning" when isReturning
    let displayStatement: String
    let isReturning: Bool
    let progressToNext: Double
    let totalReclaimedMinutes: Int
    let totalSessions: Int
    let currentStreak: Int
    let nextStage: IdentityStage?
    let blockedByDimensions: Bool
    let blockingFloor: Int?
    let weakestDimension: SelfDimensionScore?
    let dimensions: [SelfDimensionScore]
    let startedSessions28Days: Int
    let completedSessions28Days: Int
    let activeDays14: Int
    let activeDays7: Int
    let lastCompletedAt: Date?
    let weeklyBypassReturns: Int
    let weeklyBypassTotal: Int
    let bypassTimeBuckets: [SelfTimeBucket]

    var displayStageNumber: Int { actualStage.number }
}
```

Use `SelfMetricsService.empty` as a zero/placeholder value.

### Identity Stages

**23 stages (number `0`–`22`)** defined in `SelfMetricsService.stages` — stage `0` ("The First Step") is the origin/everyone-starts-here stage, so the user-facing journey is **22 stages** (`SelfView` labels them "Stage NN / 22" via `stages.count - 1`). A stage unlocks only when **all** of its gates are met: `minimumReclaimedMinutes` **and** `minimumSessions` **and** (`dimensionFloor`, if set — every dimension must be ≥ floor) **and** (`minimumStreak`, if set). All stages are **always browsable** in the UI regardless of lock state (`identityReviewUnlockAll = true`).

> ⚠️ **Never hardcode the stage count in copy** (paywall, onboarding, etc.). Derive it from `SelfMetricsService.stages.count` (or `- 1` for the post-origin journey count) so UI never drifts when stages are added. The stage list grows over time — it was 12, is now 23.

| # | Name | Min. Reclaimed | Min. Sessions | Dim. Floor | Min. Streak |
|---|---|---|---|---|---|
| 0 | The First Step | 0 | 0 | — | — |
| 1 | The Restless | 5 min | 1 | — | 1 |
| 2 | The Curious | 45 min | 2 | ≥ 5 | 1 |
| 3 | The Apprentice | 180 min | 5 | ≥ 10 | 2 |
| 4 | The Practitioner | 600 min | 12 | ≥ 18 | 3 |
| 5 | The Devoted | 1,000 min | 25 | ≥ 25 | 4 |
| 6 | The Steadfast | 1,200 min | 45 | ≥ 32 | 5 |
| 7 | The Anchored | 1,500 min | 70 | ≥ 40 | 6 |
| 8 | The Grounded | 1,750 min | 100 | ≥ 48 | 7 |
| 9 | The Intentional | 2,000 min | 135 | ≥ 55 | 8 |
| 10 | The Unshaken | 2,500 min | 180 | ≥ 62 | 9 |
| 11 | The Aligned | 2,750 min | 250 | ≥ 68 | 10 |
| 12 | The Embodied | 3,000 min | 350 | ≥ 75 | 12 |
| 13 | The Keeper | 3,500 min | 425 | ≥ 78 | 14 |
| 14 | The Sentinel | 4,000 min | 500 | ≥ 80 | 16 |
| 15 | The Warden | 5,000 min | 580 | ≥ 82 | 18 |
| 16 | The Architect | 6,100 min | 660 | ≥ 85 | 20 |
| 17 | The Deepened | 7,200 min | 750 | ≥ 88 | 22 |
| 18 | The Radiant | 8,500 min | 830 | ≥ 90 | 24 |
| 19 | The Sovereign | 10,000 min | 910 | ≥ 92 | 26 |
| 20 | The Ascendant | 12,000 min | 960 | ≥ 93 | 28 |
| 21 | The Eternal | 15,000 min | 985 | ≥ 94 | 30 |
| 22 | The Luminous | 20,000 min | 1,000 | ≥ 95 | 35 |

### Dimension Scores (5)

All scores 0–100, computed by `SelfMetricsService.dimensionScores()`:

| Dimension | Measures | Window |
|---|---|---|
| Awareness | Completion follow-through rate | Last 28 days |
| Action | Sessions started (20 = 100) | Last 28 days |
| Resilience | Active days ÷ 14, +8 for comeback gap ≥ 3 days | Last 14 days |
| Depth | Avg session length (60 min = 100) | Last 10 completed |
| Alignment | Active days spread (5 days = 100) | Last 7 days |

### Returning State

`isReturning = true` when last completed session was **2–6 days ago**:
- `displayStageName` → `"The Returning"`
- `displayStatement` → `"Comes back, again and again."`
- `displayStageNumber` → `actualStage.number` (real progress, never hardcoded)
- `IdentitySigilView` shows a **dashed outer ring** on all stages

### `IdentitySigilView`

Animated geometric sigil per stage. Returning indicator is universal — not stage-specific:

```swift
if isReturning {
    Circle()
        .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round,
                                          dash: [lineWidth * 2.5, lineWidth * 2.5]))
        .frame(width: size * 2.9, height: size * 2.9)
}
```

---

## Overview Screen (`OverviewView`)

The `.overview` tab hosts `OverviewView`, which is a **hub** with three in-place routes (`OverviewRoute`):

| Route | View | Description |
|---|---|---|
| `.landing` | `OverviewView` (inline) | Two landing cards ("The numbers" → Stats, "The story" → Reports) + metric pills + weekly sparkline |
| `.stats` | `StatsView` | Full stats (chart, insights, leaderboard) — navigated via the "The numbers" card |
| `.reports` | `WeeklyRecapFlowView` | Report list → individual recap — navigated via "The story" card |

Routes use slide transitions. Returning to the tab resets to `.landing` (`onChange(of: isActive)`). Reports card shows paywall for free users (opens `PrimaryPaywallView` as full-screen cover).

**Weekly Recap** — `Views/WeeklyRecap/`:
- `WeeklyRecapListView` — scrollable list of past reports; free users see the sample report locked
- `WeeklyRecapFlowView` — container: list → detail transition
- `WeeklyRecapView` — 5-page `TabView` (`.page` style): Summary, Your edge, Momentum, Reflection, Intention
- Sample report (`WeeklyReport.sampleReport`) used when free or no sessions exist; labeled clearly

---

## Stats Screen (`StatsView`)

Embedded inside `OverviewView` (route `.stats`), not a standalone tab.

- **Weekly bar chart** — `FocusBarChart` (Swift Charts), highlights today
- **Metric pills** (`StatsMetricPill`) — streak, total reclaimed, today, sessions count
- **Momentum chip** (`MomentumChip`) — ↑ Accelerating / ↓ Slipping / → Steady
- **Insight slots** — 6 `InsightBranch` types rendered as glass-panel cards:

| Branch | Description |
|---|---|
| `peakHour` | Most productive hour of day |
| `bestDay` | Most consistent day of week |
| `bestMode` | Focus mode yielding most reclaimed time |
| `bypassPattern` | When/how often blocks are bypassed |
| `sweetSpot` | Optimal session length |
| `consistency` | Rolling consistency score |

- **Leaderboard** — `GameCenterService`, ID: `focus_total_reclaimed_minutes`, gold/silver/bronze rank badges

---

## Settings Screen (`SettingsView`)

Accordion-style, one section open at a time via `@State private var openSection: String?`.

**Focus group:**
- `Session Rules` — **3-way** `SessionRulesMode`: **Default** (shield + card bypass rules, free) · **Strict** (shield with **no casual bypass** for the session — emergency valve preserved, **Pro**) · **Timer only** (no shielding, free). Selecting Strict as a free user opens the `.commitment` paywall. Maps to `FocusDifficulty` (default→medium, strict→hard, timerOnly→easy).
- `limits` — per-app daily caps — **Pro** (`.appLimits`). **Enforcement is ON (`FeatureFlags.appLimitsEnforcement = true`).** `AppUsageLimitsView` (premium: system picker → per-app `AppUsageLimit` = token + minutes + `isEnabled` toggle + Active/Paused/Reached status), enforced by `ScreenTimeService.syncAppLimits()` (one daily `DeviceActivityEvent` per **enabled** app; event index stays aligned with the full array) + the monitor extension (shields an app on threshold, resets at midnight). No live usage % (would need a `DeviceActivityReport` extension); "Reached today" is read from the app-group `focus_app_limits_shielded` set. **Requires a physical device** — Screen Time threshold events do not fire in the simulator. The legacy non-enforcing `ProfileLimitsView` is no longer shown.
- `lock` — App Blocker. In-session shielding is free; **Always-On (24/7) blocking is Pro** (`.appLock`), enforced in the toggle + torn down on downgrade in `RootView`.

> **Pro gating for Strict is at the data layer, not the UI.** `AppViewModel.sessionRulesModeValue` clamps `.strict`→`.default` and `focusDifficultyMode` clamps `.hard`→`.medium` when `!isPro`, so **every** session-start path (Home quick, block modes, restore) is gated in one place. `ActiveSession.init` strips normal/allowed bypasses to `.none` when rules are `.strict` (preserving any `emergency` valve) — the single chokepoint guaranteeing "no casual bypass" regardless of caller.

**Preferences group:**
- `notifications` — 4 toggles: Focus reminders, Block alerts, Progress updates (9pm), Streak protection
- `theme` — **Session Themes** accordion — horizontal scroll picker for `FocusSessionTheme`; free users see `.midnight` + a lock on all others; Pro gate opens `ContextualPaywallSheet(.themes)`
- Widget preview → navigates to `WidgetPreviewView`
- Live Activity / mask task name toggle
- Age — `ProfileAgeView` + `AgeHorizontalPicker`

**Account group:**
- Game Center row
- Apple Sign In (`ASAuthorizationAppleIDButton`) / Sign Out (backed by `SupabaseSync.shared.signOut()` in addition to local sign-out)
- Profile hero: initials avatar, display name, email

Footer: `"Focus v1.0  ·  Built for deep work"` (Satoshi Regular 11pt, tertiaryLabel)

---

## Monetization (Paywall & Pro)

Freemium + **StoreKit 2** auto-renewable subscription. Entitlement is the source of truth — `isPro` is **never free-written**; it is computed off `Transaction.currentEntitlements` and mirrored to UserDefaults + the App Group for widgets/extensions.

### Plans (`PlanID` in `SubscriptionManager.swift`)

| Plan | Product ID | Price | Notes |
|---|---|---|---|
| Monthly | `com.yassir.focus.monthly` | $9.99/mo | Anchor |
| Annual | `com.yassir.focus.annual` | $59.99/yr (~$5/mo) | **Default-selected, 7-day free trial**, "SAVE 50%" |

> ⚠️ **No Lifetime plan exists** in the shipped implementation (despite earlier planning). Only Monthly + Annual. All price/savings copy is derived from **live StoreKit values** (`displayPrice`, `effectiveMonthlyPrice`, `annualSavingsPercent`) — never hardcode a USD literal except the bundled `staticPrice` fallback. Trial copy only shows when `isEligibleForTrial` (returning subscribers see "SUBSCRIBE NOW").

### `SubscriptionManager` (`@Observable @MainActor`, Services/)

Owns products, entitlement check, purchase, restore, trial eligibility, win-back/trial-banner persistence, and the trial-ending local notification (fires 1 day before charge).

Key state:
- `isPro`, `currentPlan: PlanID?`, `isEligibleForTrial: Bool`
- `isInTrial: Bool`, `renewalDate: Date?` — used by `TrialBannerView`
- `winBackShown: Bool`, `trialBannerDismissed: Bool` — persistence flags

Key personalization helpers:
- `reclaimableDays(dailyHours:)` / `reclaimableDaysPerMonth(dailyHours:)` — days/year (month) from 70% of phone time
- `reclaimableHoursPerMonth(dailyHours:)` — used by `PaywallTrialTimeline` Day 30 node

### `ProBenefits` — shared pillar bundle

Defined in `ContextualPaywallSheet.swift`. Single source of truth for what Pro unlocks on compact in-app paywall surfaces: contextual sheets and the Settings subscription panel. The full-screen onboarding/primary paywall keeps its own timeline copy.

```swift
enum ProBenefits {
    static let pillars: [(icon: String, text: String)] = [
        ("lock.shield.fill",     "Strict blocking & App locks"),
        ("square.grid.2x2.fill", "All modes & habits"),
        ("calendar",             "Unlimited schedules & limits"),
        ("circle.circle",        "Growth nudges and Deep patterns"),
        ("chart.bar.xaxis",      "Full stats, insights & Weekly reports"),
        ("photo.fill",           "Session themes & backgrounds"),
    ]
}
```

Order is deliberate: commitment (the moat) → breadth → limits → coaching/patterns → stats → themes. **Do not add per-feature copy to individual compact sheet/settings paywall surfaces** — render `ProBenefits.pillars` there. Do not reuse this list for the full-screen onboarding/primary paywall timeline.

### Paywall surfaces (`Views/Paywall/`)

| Surface | File | Role |
|---|---|---|
| Primary paywall | `PrimaryPaywallView.swift` | Full-screen, personalized. Trial-eligible users see "Your first week is free" + `PaywallTrialTimeline` (Day 1→30 cascade); returning users see the loss-frame count-up hero + timeline benefits. Annual pre-selected. Used in onboarding, Settings "Go Pro", and contextual "See all plans". This screen keeps its own compact timeline copy and must not automatically mirror `ProBenefits.pillars`. |
| Contextual sheet | `ContextualPaywallSheet.swift` | 70%-height moment-of-desire upsell, parameterized by `PaywallFeature`. Feature hero + description (contextual hook) + `ProBenefits` panel + annual CTA. |
| Win-back | `WinBackSheet.swift` | Shown once on "Maybe Later" dismissal of the primary paywall (trial-eligible only). **Honest reframe of the free trial — NOT a fake discount / no false scarcity.** |
| Trial banner | `TrialNudgeViews.swift` | `TrialBannerView` — dismissible in-app lime banner shown in the final day of trial (`isInTrial && daysLeft ≤ 1 && !trialBannerDismissed`). |
| Settings panel | `SubscriptionSettingsPanel.swift` | Free: upsell card with `ProBenefits` (checkmark style) + "SEE PLANS" CTA. Pro: plan identity row, renewal date, manage/restore. |
| Lock affordances | `Components/ProLockBadge.swift` | `ProLockBadge`, `ProLockedButton`, and the `.proGated(isPro:feature:onTapLocked:)` modifier that overlays a lock + routes taps to a contextual sheet. |

### `PaywallFeature` (the Pro-gated features)

One case per gated capability — `focusModes`, `deepWork`, `commitment` (Strict rules), `appLock` (always-on blocking), `weeklyRecap`, `customSchedule`, `appLimits`, `fullInsights`, `identity`, `themes` (session backgrounds), `proOverview`. Each carries `title` / `description` / `icon` / `tint` / `bullets`.

`.identity` — title: **"Growth coaching is Pro"**; description derives the live stage count from `SelfMetricsService.stages.count - 1` and explains that the identity journey and dimension scores are free, while Pro unlocks coaching, deep weekly patterns, and the story behind how the user focuses. **Never frame this as locking stages** (stages are always free).

**Where gates fire:** Home "Quick Access" deck cards (favourited/starter Habits modes) → `.deepWork` / `.focusModes` / `.proOverview`; `HabitsView` mode cards → `.deepWork` / `.focusModes` / `.customSchedule`; Settings Session Rules Strict → `.commitment`; Always-On 24/7 blocking (`AlwaysOnBlockingCard`, both App Blocker entry points) → `.appLock`; Settings per-app limits → `.appLimits`; insights → `.fullInsights`; `SelfView` coaching nudge (Dimensions tab) + pattern/time-of-day sections (Reflections tab) → `.identity`; weekly recap → `.weeklyRecap`. Mode gating flows from each mode's `isLocked` (= `!freeModeIDs.contains(id)`). **Scheduled blocks: 1 free, then `.customSchedule`** — creation gated by `vm.canAddScheduledBlock` (Home + Habits entries); enforcement clamped in `applyScheduledBlockSync` (`isPro ? all : prefix(freeScheduledBlockLimit=1)`) so a free/downgraded user never runs more than 1 regardless of how many are stored.

> **Free vs Pro reframe:** the headline Pro value is **commitment** (Strict no-bypass sessions + 24/7 App Lock), then **breadth of modes** (28 of 31 Habits modes are Pro — see "## Habits Modes"), then unlimited schedules (1 free) + per-app limits, then **growth coaching + deep patterns** (the Self analysis layer — coaching nudge + Reflections tab), then full stats/insights/Reports. The identity journey itself (all 23 stages, sigils, dimension scores) is **free for everyone**. `PrimaryPaywallView` benefits lead with the commitment pillar and **rank coaching/patterns above Stats/Reports** (product decision: the Self analysis layer is the higher-value Pro draw). Free habit modes: `quick`, `mindful`, `gym`; the Home Quick Flow ring is free; the Home "Quick Access" deck shows favourited/starter modes whose locked state mirrors their Habits gating.

> **Strict vs per-mode bypass (decided):** Strict strips **normal/allowed** bypasses but **preserves a mode's `emergency` bypass** — the safety valve on long/life modes (Sleep Gate, Training, Family, Date Night, Parent Time) is never removed (`ActiveSession.init`). Per-mode **breaks are always preserved** in every rules mode. Covered by `ProGatingTests.testStrictPreservesEmergencyBypass` + `testStrictOverridesAnAllowedCallerPolicy`.

> `SubscriptionManager.privacyURL` → `https://yasiqb89.github.io/Github-Page/focus/privacy-policy/` (live). `termsURL` → Apple standard EULA. Both linked from every purchase surface.

---

## Key Components

### Ring Views (`RingView.swift`)

**`FocusOnboardingRingVisual`** — the app's primary ring, used on the Home screen (idle + all active sessions) and re-used inside onboarding. Full circle (360°). All state variations (idle, active, paused, ambient) pass different parameters — there is no separate paused or score ring type.

```swift
FocusOnboardingRingVisual(
    size: CGFloat,
    progress: Double,               // 0.0–1.0
    isBreathing: Bool,              // idle breathing pulse
    accentColor: Color = .focusAccent,
    accentGradientColors: [Color]? = nil,  // overrides solid accentColor for arc
    glowColor: Color? = nil,
    trackShadowColor: Color? = nil,
    innerScale: CGFloat = 1.0,      // press-dip on the inner disc only
    innerDiscOpacity: Double = 1.0, // reveal background through disc (Quick Access ambient)
    isMonochrome: Bool = false      // Timer-only / ambient mode; use FocusSessionMonochromePalette
)
// Track: dark olive (#1D2115), lineWidth 12
// Arc: AngularGradient, rotated -90°, rounded caps
// Outer glow blob + track shadow animate with isBreathing (easeInOut 3.4s)
// Inner disc: radial gradient, small white stroke border, drop shadow
```

**`FocusOnboardingRing`** — animated wrapper used in onboarding's welcome step only:
```swift
FocusOnboardingRing(size: CGFloat)
// Animates progress 0 → 0.78 on appear (spring response 0.95), then enables breathing pulse
```

**`RingView` / `PausedRingView`** — defined in `RingView.swift` but **not used** by any active screen. Legacy / unused. Do not use for new UI — use `FocusOnboardingRingVisual` instead.

### Button Variants (`AccentButton.swift`)

```swift
AccentButton(title:, action:)        // Lime gradient fill, capsule, medium haptic
GhostButton(title:, action:)         // tertiarySystemBackground + separator stroke
DangerButton(title:, action:)        // focusDanger at 12% opacity bg
HoldToEndButton(label:, action:)     // 600 ms hold-to-fire, animated fill progress
IconButton<I: View>(action:, icon:)  // Circular, secondary background
FocusToggle(isOn:)                   // SwiftUI Toggle with focusAccent tint
```

### `InProgressTaskSwipeActions`

Custom swipe-reveal component on in-progress task rows:
- Reveal threshold: **44pt** — shows action icons
- Commit threshold: **154pt** — fires action
- Haptics: `.selection` on reveal, `.notification` on commit

### `FocusLiquidGlassBackground`

```swift
FocusLiquidGlassBackground(isActive: Bool = false, showActiveStroke: Bool = true)
// Fill: Color(hex: "#1D2115") at 40% opacity
// Border: white at 0.1 opacity (always)
// Active: focusAccent glow shadow + optional accent stroke
```

### `FocusTimeFormatter`

```swift
FocusTimeFormatter.compact(_ minutes: Int) -> String
// 0 → "0m"  |  25 → "25m"  |  120 → "2h"  |  90 → "1h 30m"
```

### `FocusToastBanner`

Pill-shaped toast notification (`DesignSystem.swift`). Dark capsule + ultra-thin material, optional action button.

```swift
FocusToastBanner(message: String, actionTitle: String? = nil, action: (() -> Void)? = nil)
// Background: dark olive #0D1810 @ 92% + ultraThinMaterial capsule + white 0.1 stroke
// Message: focusTextPrimaryWarm @ 90%, 12.5pt medium
// Action label: focusAccent, 12pt heavy
```

### `BlockerActionPillStyle`

View modifier for blocker action buttons — orange-to-red gradient capsule with black label.
```swift
someView.blockerActionPillStyle()
// Gradient: #FFB347 → #FF6B00 (leading → trailing), Capsule shape, black foreground
```

### `AppIconTile`

Brand gradient tiles for social apps (instagram/tiktok/youtube/twitter/reddit/netflix) used in blocker and settings views.

### `GradualSpacing`

Animated letter-spacing transition helper for UI text reveals.

---

## ScreenTime Service

Fully implemented via `FamilyControls` + `ManagedSettings` + `DeviceActivity`.

**Profiles** — a selection is stored per `profileID` (`selectionKeyPrefix + id`), so any mode id can carry its own app selection. Named profiles in `ScreenTimeService`:
- `defaultProfileID = "default"` — base/task quick sessions; also the "Match Default" target for per-mode "Use Default" option
- `blockModeProfiles` = the 5 dedicated block-mode profiles (mindful/gym/family/study/deepwork) — referenced by mode IDs to load their stored selections

> ⚠️ **`workModeProfileIDs` / `routineProfiles` / `routineProfileIDs` were removed.** Profile selections now persist for **any** mode ID via a generalized scan of all keys prefixed with `selectionKeyPrefix` — all 31 Habit modes support custom blocklists without a hardcoded allow-list.
> ⚠️ **No `ring_*` profiles** (`ring_focus`/`ring_gym`/… were removed with the ring reel). A habit mode's `blockProfileID` is its own `id` for every mode **except Deep Work** (id `deep` → profile `deepwork`).
> ⚠️ **Per-mode blocker config UI lives on `HabitsModeSheet`** (not the App Blocker screen). Each mode sheet has a `HabitsProtectionRow` where the user picks "Match Default" (uses `defaultProfileID` selection) or sets a custom blocklist. **Free users on Pro-locked modes** see a "Custom blockers are Pro" state with a locked pill — tapping routes to the `.deepWork` or `.focusModes` paywall. Free users on free modes (quick/mindful/gym) can configure normally.

```swift
ScreenTimeService.shared

func requestAuthorizationIfNeeded() async -> Bool
func startFocusBlocking(profileID: String)
func stopFocusBlocking()
func selection(for profileID: String) -> FamilyActivitySelection

var isAuthorized: Bool
var isAlwaysBlockingEnabled: Bool
var totalSelectionCount: Int

static let defaultProfileID = "default"
```

---

## Services

### `HapticService`

```swift
HapticService.shared
.impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle)  // .light/.medium/.heavy/.soft/.rigid
.selection()
.notification(_ type: UINotificationFeedbackGenerator.FeedbackType)  // .success/.warning/.error
```

### `NotificationService`

Schedules 4 notification types (controlled via `vm.notifFlags[0..3]`):
0. Daily focus reminder
1. Block schedule start alert
2. Daily progress report (9pm)
3. Streak protection alert (before streak breaks)

### `LiveActivityService`

Starts/updates/ends an `ActivityKit` Lock Screen Live Activity showing: task name (maskable), tag, mode, target minutes, remaining seconds, paused state.

Shared App Group keys (`FocusActivityShared`): `currentActivityIDKey`, `currentActivityStartTimestampKey`, `currentActivityTotalSecondsKey`, `endRequestedAtKey`, `distractionsKey`.

### `AchievementEngine`

5 unlock-once badges:

| ID | Icon | Condition |
|---|---|---|
| `streak_12` | `flame.fill` | streak ≥ 12 |
| `focus_10h` | `bolt.fill` | totalReclaimedMinutes ≥ 600 |
| `night_owl` | `moon.fill` | session completed after 10pm |
| `sessions_50` | `target` | totalSessions ≥ 50 |
| `top_rank` | `trophy.fill` | Game Center rank ≤ 10 |

### `InsightEngine`

Generates one `FocusInsight` per `InsightBranch`. Each has: branch, title, headline, subtitle, accentColor, SF Symbol. 6 branches: `peakHour`, `bestDay`, `bestMode`, `bypassPattern`, `sweetSpot`, `consistency`.

### `GameCenterService`

```swift
GameCenterService.shared
func submitReclaimedMinutes(_ minutes: Int)
// Leaderboard ID: "focus_total_reclaimed_minutes"
```

### `SupabaseSync` (`Services/Supabase/`)

**Offline-first cloud sync.** All 7 Supabase files are accessed only through `SupabaseSync.shared`; callers never touch the client, engine, or repos directly. Degrades gracefully with no credentials or signed-out state.

```swift
SupabaseSync.shared

// Bootstrapped once at launch in FocusApp.swift
func bootstrap(context: ModelContext) async

// Called from handleAppleSignIn / signOut
func signInWithApple(idToken: String, rawNonce: String) async
func signOut() async

// Manual sync trigger (also runs automatically after sign-in)
func syncNow() async

var status: SyncStatus  // .unavailable | .signedOut | .idle | .syncing | .error(String)
var isSignedIn: Bool
var currentUserID: UUID?
var remoteIsPro: Bool?  // server-side entitlement signal (iOS keeps StoreKit authoritative)
```

**Sync scope:**
- **SwiftData models** (`SyncEngine`) — tasks (upsert + soft-delete tombstones) + sessions (push-new-only, immutable history)
- **UserDefaults snapshots** (`SupabaseSync.syncAppState`) — `ProfileUpsertDTO` (displayName, email, appleUserID)

**v1 conflict policy:** sessions are immutable history (push-new + pull-missing, no conflicts). Tasks use push-local idempotent upsert + pull-missing; field-level LWW is a documented follow-up. Soft deletes flow through `SyncTombstoneStore` (UserDefaults-backed pending queue).

**`FocusAppDelegate`** (`FocusApp.swift`) — `UIApplicationDelegate` that blocks third-party keyboard extensions (`shouldAllowExtensionPointIdentifier != .keyboard`).

### App Intents (`Intents/`)

`EndFocusSessionIntent: LiveActivityIntent` — the "End" button on the Lock Screen Live Activity. Writes `endRequestedAtKey` to the App Group and dismisses the activity; the main app reconciles the session into stats on next foreground (same Date-math path as background restoration). Declared in `Intents/EndFocusSessionIntent.swift`.

---

## Widget (`FocusWidget`)

Home screen widget displaying today's reclaimed minutes, session count, streak. Reads from App Group `group.com.yassir.focus.app`. `FocusLiveActivity` provides compact/expanded/minimal Lock Screen Live Activity presentations.

---

## Onboarding (`OnboardingView`)

7-step flow driven by `enum OnboardingStep: Int, CaseIterable { welcome, phoneTime, name, goals, projection, blocking, finale }`, full-screen gated by `vm.hasCompletedOnboarding`.

- **welcome** — launch ring animation (do not modify)
- **phoneTime** — daily hours slider; tint lerps `focusAccent → focusWarning` above 7 h (`phoneTimeTint(for:)`), reactive caption, medium-impact detents at endpoints; `PhoneTimeAmbientField` behind the content (warm radial wash past 7 h + drifting app-glyph Canvas particle field that thickens with hours; static under Reduce Motion)
- **name** — name only (age moved to Settings → Preferences → Age, `ProfileAgeView` + `AgeHorizontalPicker` in `Views/Settings/AgeSettingsPicker.swift`); time-of-day greeting preview
- **goals** — habit goal grid + live suggested-category chips
- **projection** — personalized (user name woven into reclaim line), animated `TimeProjectionChart` inside `YearlyProjectionCard`, CTA "Reclaim my time"
- **blocking** — dedicated screen (`Views/Onboarding/OnboardingBlockingScreen.swift`) with `ShieldDemoMockup`: a looping mini phone where `AppIconTile`s desaturate as the shield engages (locks on once configured; pinned under Reduce Motion); `didConfigureBlocking` only set when the FamilyActivitySelection is non-empty; `BlockingWarningOverlay` if continuing unconfigured
- **finale** — "your plan is ready" reveal: `IdentityJourneyShowcase` draws, then 3 personalized plan rows cascade in (goals, shielded categories, reclaimable days), then a glowing "Begin my journey" CTA → `vm.setSessionRulesMode(.default)` + `onComplete()`. Session-rules choice no longer in onboarding (Settings only). No hold-to-commit orb — rejected; `BreathingFocusOrb` was deleted.

Cross-cutting: persist-as-you-go (`persist(leaving:)` + on skip), `SkipConfirmationOverlay` gates Skip (Skip hidden before `.goals`), direction-aware push/pop transitions (`isMovingForward`), Reduce Motion bypasses on all scripted sequences. Shared full-width footer: `OnboardingBottomCTA`.

After onboarding completes, `RootView` may show `SignInRepromptSheet` (one-time Apple Sign In prompt for users who skipped sign-in during onboarding).

---

## What Was Removed — Never Use

- ❌ **Space Grotesk / DM Sans / system rounded fonts** — use `FocusFont.*` (Satoshi only)
- ❌ **PhosphorSwift / PhIcon.swift** — removed; use SF Symbols (`Image(systemName:)`)
- ❌ **BarChartView.swift** — deleted; use `FocusBarChart` (Swift Charts)
- ❌ **Border strokes on standard cards** — `focusCard()` has no `.overlay(stroke)`
- ❌ **`focusPurple` / `#7B6FFF`** — removed; use `focusCyan` (#5AC8FA) as gradient counterpart
- ❌ **Hardcoded `.black` / `.white` backgrounds** — use `FocusBackground()` + `.background(Color.clear)` on NavigationStacks
- ❌ **`withAnimation(.repeatForever)` inside `async` blocks** — unreliable; use value-based `.animation(_:value:)` pattern
- ❌ **`todayScore` / `totalScore` on `FocusStats`** — legacy decode-only stubs; not in active use
- ❌ **`displayStageNumber` returning `4` for returning users** — fixed; always `actualStage.number`
- ❌ **Stage-4-specific dashed ring in `IdentitySigilView`** — replaced with universal returning indicator
- ❌ **`SwiftUI.TabView` for navigation** — app uses custom ZStack-based nav in `RootView`
- ❌ **`BlockScheduleEntry` (SwiftData model)** — removed; scheduled blocks are now `ScheduledBlock` (Codable, UserDefaults)
- ❌ **`BlockScheduleView.swift`** — removed; scheduled block management lives in `HomeView` (Scheduled deck section) and `HabitsView`
- ❌ **`SubscriptionPaywallView.swift`** — stub only (empty file with comment); paywall is `PrimaryPaywallView.swift`
- ❌ **`FirstWeekOnboardingScreen`** — removed; post-onboarding flow goes straight to the tab bar (with optional `SignInRepromptSheet`)
- ❌ **`ProfileLimitsView` (legacy non-enforcing sliders)** — superseded by `AppUsageLimitsView`; `FeatureFlags.appLimitsEnforcement` is now `true`
- ❌ **`FocusSessionView.swift`** — renamed to `SessionComponents.swift`; all shared session subcomponents live there now. Do not recreate `FocusSessionView` — it no longer exists.
- ❌ **`showFocusSelect` / `showSession` on `AppViewModel`** — removed; Habits sessions use `pendingHabitSession`; `showSession = true` is no longer a valid session-launch path
- ❌ **`RingModeReelPicker` / `RingModeRow` / `SwipeCueView`** — deleted with the 6-mode ring reel (2026-06-14); do not reintroduce
- ❌ **`FocusSelectView`** — file removed; sessions configure on Home / Habits directly
- ❌ **`TasksView.swift`** — deleted; `.tasks` tab hosts `HabitsView`; `TasksView` was never instantiated
- ❌ **`BlocklistView` root struct** — deleted (was unreachable); `BlocklistView.swift` now holds shared components only (`AppBlockerSections`, `AlwaysOnBlockingCard`, etc.)
- ❌ **`BlocklistProfileSectionView` / `BlocklistProfileRowView` / `BlocklistMiniTokenStack` / `BlocklistTokenBreakdown`** — deleted; per-mode blocker config moved to `HabitsModeSheet` (`HabitsProtectionRow`)
- ❌ **`workModeProfileIDs` / `routineProfileIDs` / `routineProfiles` statics in `ScreenTimeService`** — removed; profile persistence is now generalized (scans all `selectionKeyPrefix` keys dynamically)
- ❌ **Blocker "Routines" section and "Targets" section** — removed as stale; Quick Access is the mode surface, not a separate Routines list
- ❌ **Per-mode blockers on the App Blocker screen** — moved to each mode's `HabitsModeSheet`; App Blocker screen now shows Shield Hero, 24/7 toggle, and Coverage only
- ❌ **Any HTML/CSS prototype files** — the `project/` directory contains legacy prototypes unrelated to the Swift app
- ❌ **`ScoreRingView`** — never existed in shipping code; the Home ring is `FocusOnboardingRingVisual` (full circle 360°, NOT an open arc)
- ❌ **Open-arc / 270° ring on the Home screen** — the ring is always a full circle; there is no gap at the bottom
- ❌ **`RingView` / `PausedRingView` for active session UI** — still defined in `RingView.swift` but unused by any active screen; all session/home ring rendering uses `FocusOnboardingRingVisual`
- ❌ **`FocusSessionProgressRing`** — never existed; sessions use `FocusOnboardingRingVisual`
- ❌ **`EditFieldLabel`** — never existed in the codebase; do not reference or create it
- ❌ **`FocusFullScreenSessionView` as a separate fullScreenCover** — does not exist; all sessions run inline inside `HomeView.homeHeroSticky()` via the `HomeQuickSessionPhase` state machine
- ❌ **Tab bar icons as SF Symbols** (`house.fill`, `checklist`, `circle.circle`, `chart.bar.fill`, `gearshape.fill`) — tab icons are custom shapes in `DockIcons.swift`, not SF Symbols

---

## Build

```bash
xcodebuild -scheme FocusApp -destination 'generic/platform=iOS Simulator' build
```

Scheme: `FocusApp`. Project managed with `xcodegen` (`project.yml`). Uses one SPM dependency: `supabase-swift` (declared in `project.yml` under `packages.Supabase`). Regenerate Xcode project with:

```bash
xcodegen generate
```

# Changelog

All notable changes to Focus Pocus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0] - 2026-11-12

### Added
- **Optional break reminder** (Settings → Breaks, off by default): when it's on, pressing PAUSE asks whether you'd like to be reminded to get back to work after a number of minutes you choose. Yes starts the timer; No just pauses. Pressing PLAY or STOP cancels the reminder. The minutes you pick are remembered for next time.

### Changed
- Blocklist nudges show the site in capitals without quotes, e.g. "Distracted by YOUTUBE?"

## [1.3] - 2026-11-12

### Added
- **Sound warning**: a banner in the main window when your computer is muted or below 15% volume, with an Unmute / Turn up button
- **Turn my sound on for alerts** (Settings, off by default): unmutes and raises the volume to 60% for an alert, then restores your previous sound when you press "Got it"
- The taskbar button flashes on every alert
- Choose where your data lives (defaults to `Documents/FocusPocus/`); real logs are no longer kept in the repo
- `logs-sample/`: a made-up dataset for demos and testing

### Changed
- Blocklist nudges now come after 15 seconds on a blocked site, instead of 1 minute
- Alert volume now climbs from 30% to 100%. Before, it stayed at 30% and only the number of beeps went up.
- README rewritten; old v1.2 notes moved to `dev-tools/notes/`

### Removed
- Scroll detection (listed in 1.0) is officially dropped. It only saw scrolling inside the app window, and catching it everywhere would need a system-wide keyboard and mouse hook. Add scroll-heavy sites (reddit, instagram, tiktok…) to the distraction blocklist instead.

## [1.2] - 2026-01-08

### Added
- **Self-Assessment Rating System**: Rate your efficiency (0-100%) after each session
  - Interactive slider with synchronized number input
  - Submit rating popup appears when clicking STOP button
  - Ratings saved with session data in log files
- **Dynamic Emoji Feedback**: Emojis change based on your rating
  - 11 different emojis from 😢 (0%) to 🔥 (100%)
  - Emoji updates live as you move the slider
- **Personalized Messages**: Context-aware feedback based on your rating
  - High ratings (≥70%): 5 encouraging messages (randomized)
  - Low ratings (<70%): 8 motivational scolding messages (randomized)
  - Messages update dynamically with slider movement
- **Last Session Display**: Shows previous session's ratings on app startup
  - Displays both self-assessed efficiency and focus efficiency
  - Located between control buttons and statistics section
  - Percentage numbers highlighted in yellow (#FFD700)
  - Message: "Last session, you had X% self-assessed efficiency and Y% focus efficiency. Let's do even better!"
- **Enhanced Statistics Tracking**: Self-Assessed Efficiency added as 7th metric
  - Shows average of all rated sessions
  - Displays "N/A" when no rated sessions exist
  - Available in Daily, Weekly, and Monthly statistics views
- **Dev Mode**: Safe testing environment without affecting production data
  - Separate `logs-dev/` folder for development data
  - Red window title: "Focus Pocus (DEV VERSION)"
  - Auto-generates fake session data for testing
  - DevTools opens automatically
  - Run with `npm run dev` or `dev-tools\QUICK_TEST.bat`
  - All dev-related files organized in `dev-tools/` folder
- **Stop During Pause**: Stop button now available during pause state
  - No need to resume before stopping a session
  - Improved user experience for ending sessions

### Changed
- Window height increased from 520px to 560px for better layout
- Efficiency modal has fixed size (400px width, 420px min-height) to prevent dynamic resizing
- Efficiency message container uses fixed height (72px) instead of min-height
- Last session display positioned between control buttons and statistics section
- Statistics window now shows 7 items instead of 6
- Stop button behavior: now triggers efficiency rating popup instead of immediately ending session
- Button state logic: STOP button remains enabled during pause state

### Fixed
- **CRITICAL BUG**: Efficiency ratings not being saved to log files
  - `saveSessionLog()` function was missing `efficiencyRating` field in logs.push()
  - Sessions before this fix don't have rating data (shows "N/A" correctly)
  - All new sessions now save ratings properly
- Dev mode detection on Windows using `run-dev.js` script
  - Previous `set` command in npm script didn't persist environment variables
  - Now uses `process.env.DEV_MODE` set directly in Node.js
- Modal size jumping when slider moves
  - Changed from dynamic min-height to fixed height
  - Prevents visual jumps during interaction
- Self-assessed efficiency showing 0% instead of "N/A"
  - Now correctly shows "N/A" when no rated sessions exist
  - Uses null instead of 0 to distinguish "no data" from "rated as 0%"

### Technical Details
- **Session Log Structure**: Added `efficiencyRating` field (0-100)
  ```json
  {
    "timestamp": "2026-01-08T...",
    "focusTime": 1200000,
    "procrastinationCount": 0,
    "pauseCount": 0,
    "pauseTime": 0,
    "efficiencyRating": 85
  }
  ```
- **Dev Mode Implementation**:
  - Uses `run-dev.js` launcher script to set environment variables
  - Global `DEV_MODE` flag accessible in both main and renderer processes
  - Separate log directory prevents data contamination
  - Fake data generator creates realistic multi-day session history
- **Statistics Calculation**:
  - Self-assessed efficiency = Average of all sessions with `efficiencyRating` field
  - Returns null (displays "N/A") when no rated sessions exist
  - Backward compatible with sessions from v1.0 and v1.1
- **Efficiency Rating UI**:
  - 10 emoji levels mapped to rating ranges (0-10, 11-20, ..., 91-100)
  - Message pools: 5 high-encouragement, 8 low-scolding messages
  - Real-time synchronization between slider and number input
  - Input validation: clamped to 0-100 range

### File Structure Updates
```
Focus-Pocus/
├── dev-tools/                    # NEW: Development files
│   ├── DEV_MODE_GUIDE.md         # Dev mode documentation
│   ├── QUICK_TEST.bat            # Quick dev mode launcher
│   ├── CHECK_LOGS.bat            # Log inspection tool
│   ├── TROUBLESHOOTING.md        # Dev mode troubleshooting
│   └── FIXES_SUMMARY.md          # Bug fix documentation
├── logs/                         # Production session data
├── logs-dev/                     # NEW: Dev mode session data (auto-generated)
├── run-dev.js                    # NEW: Dev mode launcher script
├── CRITICAL_BUG_FIXED.md         # Critical bug documentation
├── WHY_NA_IN_STATS.md            # N/A behavior explanation
├── TEST_PRODUCTION.bat           # Production testing script
└── [existing files...]
```

### Backward Compatibility
- Sessions from v1.0 and v1.1 work seamlessly with v1.2
- Old sessions without `efficiencyRating` field display correctly
- Statistics show "N/A" for self-assessed efficiency until first rated session created
- No migration or data conversion required

### Known Issues
- Previous sessions (before v1.2) don't have efficiency ratings
  - This is expected behavior, not a bug
  - Create a new session and rate it to see the feature in action
- Self-assessed efficiency shows "N/A" until you create your first rated session in v1.2

## [1.1] - 2026-01-03

### Added
- **Statistics Logging System**: Automatic session logging to JSON files in `logs/` folder
- **Three Statistics Views**:
  - Daily Statistics (lime green button) - Shows cumulative stats for today
  - Weekly Statistics (cyan button) - Shows Monday-Sunday cumulative stats
  - Monthly Statistics (periwinkle button) - Shows current month cumulative stats
- **Cumulative Statistics**: Track multiple sessions with aggregated data
  - Total sessions count
  - Total focus time across all sessions
  - Average focus time per session
  - Total procrastination alerts
  - Total pause time and count
  - Focus efficiency percentage
- **Enhanced Statistics Modal**: Larger, taller modal (420x480px) for better visibility
- **Session Data Persistence**: All sessions saved to daily JSON log files

### Changed
- Replaced single stats button with three color-coded statistics buttons
- Statistics modal now shows 6 metrics instead of 3
- Modal title dynamically changes based on statistics view
- Increased modal height to display all stats without scrolling

### Technical Details
- Log files stored in: `logs/YYYY-MM-DD.json`
- Each session records: timestamp, focus time, procrastination count, pause count, pause time
- Weekly stats calculated from Monday 00:00 to current time
- Monthly stats calculated from 1st of month to current time
- Focus efficiency = (Total Focus Time / Total Time) * 100%

## [1.0] - 2026-01-03

### Added
- **Custom Inactivity Threshold**: Input box to set custom inactivity detection time (default: 10 minutes)
- **Separate Play/Pause Controls**: Distinct Play and Pause buttons with individual states
- **Activity Detection System**:
  - Inactivity detection (customizable threshold)
  - Mouse wheel scrolling detection (10+ minutes)
  - YouTube watching detection (alerts every 10 minutes)
- **Timer & Statistics**:
  - Real-time timer display (HH:MM:SS format)
  - Session statistics tracking
  - Total focus time calculation
  - Procrastination alerts counter
  - Pause duration and count tracking
- **UI Features**:
  - Always-on-top draggable window
  - Black background with pastel blue accents
  - IBM Plex Sans font (16px)
  - Custom button states with glow effects:
    - START: White → Pastel blue glow when active
    - PAUSE: White → Orange when pressed
    - PLAY: White → Light blue when active
    - STOP: Bright red
  - Version number display (bottom of interface)
  - Window controls (minimize, close)
- **Alert System**:
  - Modal alerts for inactivity, scrolling, and YouTube
  - 10-minute interval between repeated alerts
- **Statistics Modal**: Detailed session statistics with:
  - Total focus time
  - Number of procrastination events
  - Pause count and duration

### Technical Details
- Built with Electron framework
- Node.js based desktop application
- Activity detection using system events
- Window title monitoring for YouTube detection
- Cross-platform compatibility (Windows, macOS, Linux)

### Button State Logic
- **Initial**: Only START button enabled
- **Running**: START active (blue glow), PAUSE enabled, STOP enabled
- **Paused**: PAUSE active (orange), only PLAY enabled, other buttons disabled
- **Resumed**: PLAY active (light blue), returns to running state after 1 second

### File Structure
```
Focus Pocus/
├── package.json          # Project dependencies and scripts
├── main.js              # Electron main process
├── index.html           # Application UI structure
├── styles.css           # Custom styling and themes
├── renderer.js          # Application logic and state management
├── README.md            # Installation and usage guide
└── CHANGELOG.md         # Version history (this file)
```

### Known Limitations
- YouTube detection requires `active-win` package (may not work on all systems)
- Activity detection only works when the app window has focus or system events are accessible
- Scroll detection tracks any mouse wheel activity in the app window

---

## Future Versions

Future updates will be documented here with version numbers and changes.

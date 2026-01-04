# Changelog

All notable changes to Focus Pocus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

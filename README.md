# Focus Pocus

**Version 1.2** - A customized productivity timer application that helps you stay focused by detecting inactivity, excessive scrolling, and YouTube distractions.

## ✨ What's New in v1.2

- 🎯 **Self-Assessment Rating**: Rate your efficiency (0-100%) after each session with an interactive slider
- 😊 **Dynamic Emoji Feedback**: Emojis change based on your rating (😢 at 0% → 🔥 at 100%)
- 💬 **Personalized Messages**: Get encouraging messages for high ratings or motivational scoldings for low ones
- 📊 **Enhanced Statistics**: Track your self-assessed efficiency alongside focus metrics
- 💛 **Last Session Display**: See your previous session's ratings (in yellow!) to motivate improvement
- ⏸️ **Stop During Pause**: No need to resume before stopping a session
- 🧪 **Dev Mode**: Test features safely without affecting your real productivity data

## Features

### Core Features
- **Always-On-Top Window**: Stays visible above all other windows, draggable anywhere on your screen
- **Customizable Inactivity Detection**: Set your own threshold (default: 10 minutes) for inactivity alerts
- **Scroll Detection**: Warns you if you've been scrolling for more than 10 minutes
- **YouTube/Manga Detection**: Alerts you every 10 minutes when distracted (requires `active-win` package)
- **Separate Pause/Play Controls**: Distinct pause and play buttons with visual feedback
- **Modern Dark UI**: Black background with pastel blue accents, IBM Plex Sans font

### Statistics & Tracking
- **Total Focus Time**: Active working time (excluding pauses)
- **Focus Efficiency**: Calculated based on active work vs. procrastination time
- **Self-Assessed Efficiency**: Your own rating of how productive you were (NEW!)
- **Procrastination Alerts**: Number of inactivity/distraction alerts triggered
- **Pause Tracking**: Duration and count of breaks taken
- **Daily/Weekly/Monthly Stats**: View aggregated productivity metrics

## Installation

1. **Install Node.js** (if not already installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version

2. **Navigate to the project folder**:
   ```bash
   cd "C:\Users\user\Documents\Focus Pocus"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the App

### Production Mode (Your Real Data)
```bash
npm start
```

**Or** double-click: `Start Focus Pocus.bat`

### Dev Mode (Testing with Fake Data)
```bash
npm run dev
```

**Or** double-click: `dev-tools\QUICK_TEST.bat`

**Dev mode features:**
- Uses separate `logs-dev/` folder (won't affect your real data)
- Red title: "Focus Pocus (DEV VERSION)"
- Auto-generates fake session data
- Opens DevTools for debugging

## How to Use

### Setting Your Inactivity Threshold
- Adjust the "Inactivity Threshold" input box (default: 10 minutes) before starting
- This determines how long you can be inactive before receiving an alert

### Controls
1. **START**: Begin tracking your focus time (button glows pastel blue when active)
2. **PAUSE**: Take a break (button turns orange, STOP remains available - NEW!)
3. **PLAY**: Resume working after a pause (button glows light blue, then returns to normal)
4. **STOP**: End your session and rate your efficiency (bright red button)
5. **Daily/Weekly/Monthly**: View aggregated statistics

### New Workflow - Efficiency Rating
When you click **STOP**, you'll see a popup to rate your efficiency:
1. Use the **slider** (0-100%) or type a number
2. Watch the **emoji change** as you adjust the rating
3. Read the **personalized message** (encouraging or motivational)
4. Click **Submit Rating** to save

Your rating is saved with the session and appears in:
- **Last Session Display**: Shows above Statistics buttons (with yellow percentages!)
- **Stats Window**: 7th item - "Self-Assessed Efficiency"

### Button Behavior
- When **START** is pressed: Timer begins, START glows blue, PAUSE and STOP become available
- When **PAUSE** is pressed: Timer pauses, button turns orange, PLAY and STOP available (improved!)
- When **PLAY** is pressed: Timer resumes, button glows blue briefly, PAUSE and STOP become available
- When **STOP** is pressed: Efficiency rating popup appears, rate your session (NEW!)

## Alerts

The app will alert you when:
- You've been inactive (no typing/clicking) for your set threshold (default: 10 minutes)
- You've been scrolling continuously for over 10 minutes
- You're watching YouTube for over 10 minutes

Alerts repeat every 10 minutes until you resume activity. Each alert counts as a "procrastination event" in your statistics.

## Window Controls

- **Drag**: Click and drag the title bar to move the window
- **Minimize**: Click the minus button to minimize
- **Close**: Click the X button to close the app

## Statistics Tracked

### Per Session
- **Focus Time**: Active working time (excluding pauses)
- **Procrastination Count**: Number of alerts triggered
- **Pause Time & Count**: Duration and frequency of breaks
- **Self-Assessed Efficiency**: Your rating (0-100%) - NEW!

### Aggregated Stats (Daily/Weekly/Monthly)
- **Total Sessions**: Number of completed sessions
- **Total Focus Time**: Sum of all active work time
- **Average Focus Time**: Mean session length
- **Total Procrastination Alerts**: All distraction alerts
- **Total Pause Time**: All break time
- **Focus Efficiency**: Calculated metric (focus time / productive time)
- **Self-Assessed Efficiency**: Average of your ratings - NEW!
  - Shows "N/A" if no sessions have been rated yet

## Troubleshooting

### YouTube/Manga Detection Not Working
If distraction detection doesn't work, the `active-win` package may need additional setup on Windows. The app will still function with inactivity and scroll detection.

### Stats Show "N/A" for Self-Assessed Efficiency
This is normal if:
- You haven't created any sessions yet, OR
- Your sessions were created before v1.2 (they don't have ratings)

**Solution:** Create a new session, stop it, and rate your efficiency. The stat will update!

### Ratings Not Saving
**Fixed in latest version!** If you're using an older version, update to the latest code.

The bug was in `saveSessionLog()` - it wasn't saving the `efficiencyRating` field. This has been fixed.

### More Help
- **Production Mode Guide**: See `PRODUCTION_MODE.md`
- **Dev Mode Guide**: See `dev-tools/DEV_MODE_GUIDE.md`
- **Detailed Troubleshooting**: See `dev-tools/TROUBLESHOOTING.md`

## Building an Executable

To create a standalone .exe file:

```bash
npm run build
```

The executable will be in the `dist` folder.

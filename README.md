# Focus Pocus

A customized productivity timer application that helps you stay focused by detecting inactivity, excessive scrolling, and YouTube distractions.

## Features

- **Always-On-Top Window**: Stays visible above all other windows, draggable anywhere on your screen
- **Customizable Inactivity Detection**: Set your own threshold (default: 10 minutes) for inactivity alerts
- **Scroll Detection**: Warns you if you've been scrolling for more than 10 minutes
- **YouTube Detection**: Alerts you every 10 minutes when watching YouTube (requires `active-win` package)
- **Separate Pause/Play Controls**: Distinct pause and play buttons with visual feedback
- **Statistics**: Track total focus time, procrastination alerts, and pause duration
- **Modern Dark UI**: Black background with pastel blue accents, IBM Plex Sans font, bold button text

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

```bash
npm start
```

## How to Use

### Setting Your Inactivity Threshold
- Adjust the "Inactivity Threshold" input box (default: 10 minutes) before starting
- This determines how long you can be inactive before receiving an alert

### Controls
1. **START**: Begin tracking your focus time (button glows pastel blue when active)
2. **PAUSE**: Take a break (button turns orange, disables all controls except PLAY)
3. **PLAY**: Resume working after a pause (button glows light blue, then returns to normal)
4. **STOP**: End your session and view final statistics (bright red button)
5. **Statistics**: Click the chart icon anytime to view your current session stats

### Button Behavior
- When **START** is pressed: Timer begins, START glows blue, PAUSE and STOP become available
- When **PAUSE** is pressed: Timer pauses, button turns orange, only PLAY is available
- When **PLAY** is pressed: Timer resumes, button glows blue briefly, PAUSE and STOP become available
- When **STOP** is pressed: Session ends, shows statistics, all controls reset

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

- **Total Focus Time**: Active working time (excluding pauses)
- **Procrastination Alerts**: Number of alerts triggered
- **Pause Time**: How long you've been paused and number of pauses

## Troubleshooting

If YouTube detection doesn't work, the `active-win` package may need additional setup on Windows. The app will still function with inactivity and scroll detection.

## Building an Executable

To create a standalone .exe file:

```bash
npm run build
```

The executable will be in the `dist` folder.

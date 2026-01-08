# Focus Pocus - Dev Mode Guide

## How to Run Dev Mode

**Dev Mode** allows you to test all features without affecting your real session data!

### Starting Dev Mode

```bash
npm run dev
```

### What Dev Mode Does

1. **Separate Data Storage**
   - Uses `logs-dev/` folder instead of `logs/`
   - Your real data stays completely untouched

2. **Visual Indication**
   - Title changes to "Focus Pocus (DEV VERSION)" in red text
   - Easy to tell which mode you're in

3. **Fake Data Generation**
   - Automatically generates realistic fake session data on first run
   - Creates sessions for:
     - Today (5 sessions)
     - Yesterday (4 sessions)
     - 5 days ago (3 sessions)
     - 10 days ago (2 sessions)
     - 20 days ago (3 sessions)
   - Each session has randomized:
     - Focus time (10-60 minutes)
     - Procrastination alerts (0-4)
     - Pause count (0-2)
     - Efficiency ratings (0-100%)

4. **Full Testing Capability**
   - Test the efficiency rating popup
   - View Daily/Weekly/Monthly stats with fake data
   - See "last session" display with both efficiency ratings
   - All buttons and features work normally

### Running Production Mode

```bash
npm start
```

This runs the app normally with your real data in the `logs/` folder.

## Testing the New Features

1. **Start Dev Mode**: `npm run dev`
2. **View Last Session**: Look above the timer - you'll see the last session's ratings
3. **Start a Session**: Click START button
4. **Stop & Rate**: Click STOP to see the efficiency rating popup
   - Move the slider to see emojis change
   - Try different ratings to see different messages
   - Submit your rating
5. **View Stats**: Click Daily/Weekly/Monthly to see aggregated stats including self-assessed efficiency

## Resetting Dev Data

To generate fresh fake data:
1. Delete the `logs-dev/` folder
2. Run `npm run dev` again
3. New fake data will be generated automatically

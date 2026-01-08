# Troubleshooting Dev Mode Issues

## Quick Test (Run This First!)

Double-click `QUICK_TEST.bat` - this will:
1. Delete old dev data
2. Run dev mode
3. Show you what to look for

## What Should Happen

When you run `npm run dev`, **DevTools should open automatically** showing the Console tab.

### In the Console, you MUST see these logs:

```
Starting Focus Pocus in DEV MODE...
DEV_MODE environment variable set to: true
[Main] DEV_MODE: true
[Main] process.env.DEV_MODE: true
[Focus Pocus] DEV_MODE: true
[Focus Pocus] Environment DEV_MODE: true
[DEV MODE] Dev mode is ACTIVE
[DEV MODE] Trying to update title, element found: true
[DEV MODE] Title updated to red
[DEV MODE] Checking for existing data in: C:\...\logs-dev
[DEV MODE] Found 0 JSON files
[DEV MODE] No data found, generating fake data...
[DEV MODE] Generated fake session data for multiple days
```

### In the App Window, you should see:

1. ✅ **Red Title**: "Focus Pocus (DEV VERSION)" in red color at the top
2. ✅ **Last Session Line**: Below the countdown timer, text saying "Last session, you had X% self-assessed efficiency and Y% focus efficiency. Let's do even better!"
3. ✅ **Stats Work**: Click Daily/Weekly/Monthly - should show "Self-Assessed Efficiency: XX%" as the 7th stat

## If DevTools DOESN'T Open

This means DEV_MODE is NOT being detected. Try:

1. Close the app completely
2. Run `QUICK_TEST.bat` again
3. If DevTools still doesn't open, share what you see in the terminal window

## If You See "Focus Pocus" (NOT in red)

This means the title is not being updated. Check the Console for:
- `[DEV MODE] Dev mode is ACTIVE` - if you don't see this, DEV_MODE is not detecting
- `[DEV MODE] WARNING: .app-title element not found!` - if you see this, there's a DOM issue

## If You See Just a Line (No Text)

The "line" is the separator. The last session text should appear BELOW it. Check:

1. Run `CHECK_LOGS.bat` to verify fake data was created
2. Look in Console for:
   ```
   [Last Session] Attempting to update display...
   [Last Session] Retrieved: {...}
   [Last Session] Display shown
   ```
3. If you see `[Last Session] No data or no efficiency rating`, the fake data doesn't have ratings

## If Self-Assessed Efficiency Shows 0%

1. Create a real session:
   - Click START
   - Wait 10 seconds
   - Click STOP
   - Rate your efficiency (move the slider)
   - Click Submit Rating
2. Open Daily stats
3. Check if the 7th stat now shows your rating

## Manual Check Commands

### Check if logs-dev was created:
```bash
dir logs-dev
```
Should show 5 .json files with dates

### Check contents of a log file:
```bash
type logs-dev\2026-01-07.json
```
Should show JSON with `efficiencyRating` field

### Force regenerate fake data:
```bash
rmdir /s /q logs-dev
npm run dev
```

## What to Share if Still Broken

1. **Screenshot** of the app window
2. **Full console log** from DevTools (copy ALL text from Console tab)
3. **Terminal output** from running `npm run dev`
4. **Output** from running `CHECK_LOGS.bat`

## Emergency: Test Without Dev Mode

If dev mode is completely broken, you can test the features in production mode:

1. Run `npm start` (normal mode)
2. Click START, wait, click STOP
3. Rate your efficiency
4. Check if it saves and displays correctly

This will use your real `logs/` folder, so be careful!

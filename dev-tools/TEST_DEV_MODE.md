# Testing Dev Mode

## Step 1: Clean Start
Delete the `logs-dev` folder if it exists:
```bash
rmdir /s /q logs-dev
```

## Step 2: Run Dev Mode
```bash
npm run dev
```

## Step 3: Check Console Output
Look for these log messages in the console:
- `[Main] DEV_MODE: true`
- `[Focus Pocus] DEV_MODE: true`
- `[DEV MODE] Generated fake session data for multiple days`
- `[Last Session] Attempting to update display...`
- `[Last Session] Retrieved: {timestamp: ..., efficiencyRating: ...}`

## Step 4: Visual Checks

### Window Title (Issue #1)
- [ ] Title should say "Focus Pocus (DEV VERSION)" in RED text

### Last Session Display (Issue #2)
- [ ] Should see text below the countdown timer
- [ ] Should say "Last session, you had X% self-assessed efficiency and Y% focus efficiency. Let's do even better!"
- [ ] Numbers should match the fake data

### Stats Window (Issue #3)
- [ ] Click "Daily" button
- [ ] Stats window should open
- [ ] Should see 7 stats including "Self-Assessed Efficiency" at the bottom
- [ ] Value should show a percentage (not 0%)

## Step 5: Test Creating a Session
1. Click START button
2. Wait a few seconds
3. Click STOP button
4. Rate your efficiency (try moving the slider)
5. Click "Submit Rating"
6. Check if:
   - [ ] Last session display updates with your new rating
   - [ ] Daily stats show your new session
   - [ ] Self-assessed efficiency includes your rating

## Debug Info
If issues persist, open the Developer Console (Ctrl+Shift+I) and share:
- All console logs starting with `[Focus Pocus]`, `[DEV MODE]`, `[Last Session]`
- Any errors in red

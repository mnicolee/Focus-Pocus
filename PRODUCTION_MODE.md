# Production Mode - Your Real App

## What's the Same in Both Modes ✅

All the new v1.2 features work in **BOTH** dev and production mode:

### Core Features (Universal)
- ✅ **Efficiency Rating Popup** - Rate yourself 0-100% after each session
- ✅ **Dynamic Emojis** - Change based on your rating (😢 → 🔥)
- ✅ **Encouraging/Scolding Messages** - Randomized feedback
- ✅ **Last Session Display** - Shows between buttons and stats with **yellow percentages**
- ✅ **Self-Assessed Efficiency** - Appears as 7th stat in Daily/Weekly/Monthly
- ✅ **Stop During Pause** - No need to resume first
- ✅ **All UI Improvements** - Layout, colors, spacing

### What's Different?

| Feature | Production Mode | Dev Mode |
|---------|----------------|----------|
| **Data Storage** | `logs/` folder | `logs-dev/` folder |
| **Title Color** | Normal (white) | RED with "(DEV VERSION)" |
| **Fake Data** | No - you create real sessions | Yes - auto-generated |
| **DevTools** | Closed by default | Opens automatically |
| **Your Real Stats** | ✅ YES | ❌ NO |

## Running Production Mode

```bash
npm start
```

Or double-click: **`Start Focus Pocus.bat`**

## Testing the Features in Production

### 1. Test Efficiency Rating
1. Run `npm start`
2. Click **START**
3. Wait 10-20 seconds
4. Click **STOP**
5. ✅ **Efficiency modal appears**
6. Move slider, watch emoji change
7. Submit your rating

### 2. Test Last Session Display
1. After completing step 1, restart the app
2. ✅ **Text appears between buttons and Statistics**
3. ✅ **Percentages are yellow**
4. Shows your actual rating from the last session

### 3. Test Stats Display
1. Click **Daily** button
2. ✅ **Stats window shows 7 items**
3. ✅ **7th item: "Self-Assessed Efficiency: XX%"**
4. Shows your actual rating average

### 4. Test Stop During Pause
1. Click START
2. Click PAUSE
3. ✅ **STOP button is clickable** (not grayed out)
4. Click STOP
5. Rate your efficiency

## Your Real Data Location

**Production data:** `C:\Users\user\Documents\GitHub\Focus-Pocus\logs\`

Files look like:
```
logs/
├── 2026-01-07.json  ← Today's sessions
├── 2026-01-06.json  ← Yesterday
└── ...
```

Each file contains:
```json
[
  {
    "timestamp": "2026-01-07T14:30:00.000Z",
    "focusTime": 1200000,
    "procrastinationCount": 0,
    "pauseCount": 1,
    "pauseTime": 60000,
    "efficiencyRating": 85  ← Your self-rating
  }
]
```

## Comparison Chart

### Dev Mode - For Testing
```bash
npm run dev
```
- Uses fake data
- Safe to test features
- Red title warns you
- DevTools open

### Production Mode - For Real Work
```bash
npm start
```
- Uses your real sessions
- Your actual productivity data
- Normal appearance
- No DevTools clutter

## Important Notes

⚠️ **Both modes use the SAME code** for features!

When you run `npm start`:
- All v1.2 features are active
- Efficiency rating popup works
- Last session display shows YOUR data
- Stats include YOUR self-assessed ratings
- Uses `logs/` folder for YOUR real data

The only difference is DEV_MODE changes where data is stored and shows visual indicators (red title, DevTools).

## Verify Everything Works

Run this test in production mode:

1. **Close all instances** of Focus Pocus
2. Run `npm start` (production mode)
3. Verify:
   - [ ] Title is normal (not red)
   - [ ] Window is correct size
   - [ ] Last session display in right place (if you have data)
   - [ ] Percentages are yellow
4. Create a session:
   - [ ] START → wait → STOP
   - [ ] Efficiency popup appears
   - [ ] Slider works, emoji changes
   - [ ] Submit saves
5. Restart app:
   - [ ] Last session display shows your rating
6. Check stats:
   - [ ] Daily stats show your self-assessed efficiency

## Need to Reset Your Real Data?

**WARNING:** Only do this if you want to delete your actual productivity history!

```bash
rmdir /s /q logs
```

Then `npm start` will create fresh logs.

## Switching Between Modes

You can safely switch between modes without conflicts:

```bash
npm start    # Use real data
npm run dev  # Use test data
npm start    # Back to real data
```

Your real data in `logs/` is never touched by dev mode!

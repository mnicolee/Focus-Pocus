# Dev Tools Folder

This folder contains development and testing utilities for Focus Pocus.

## Quick Start

**To test dev mode:**
```bash
QUICK_TEST.bat
```

## Files in This Folder

### Testing Scripts
- **QUICK_TEST.bat** - Automated test script (deletes old data, runs dev mode)
- **CHECK_LOGS.bat** - Verify that fake dev data was created

### Documentation
- **DEV_MODE_GUIDE.md** - How to use dev mode
- **TEST_DEV_MODE.md** - Manual testing checklist
- **FIXES_SUMMARY.md** - Summary of all bug fixes in v1.2

## Running Dev Mode

From the **root folder** (not this folder), run:
```bash
npm run dev
```

Or use the quick test script:
```bash
dev-tools\QUICK_TEST.bat
```

## Dev Mode Features

- Uses separate `logs-dev/` folder (won't affect your real data)
- Title turns RED: "Focus Pocus (DEV VERSION)"
- Auto-generates fake session data
- Opens DevTools automatically for debugging

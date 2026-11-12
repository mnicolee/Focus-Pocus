<p align="center"><img src="docs/logo.png" width="120" alt="Focus Pocus logo"></p>

<h1 align="center">Focus Pocus</h1>

<p align="center">A small focus timer that floats above your other windows and calls you back when you drift off.</p>

---

## What it does

- ⏱️ **Notices when you stop.** No keyboard or mouse input for 10 minutes (you can change this) sets off an alert.
- 📺 **Knows your rabbit holes.** Add sites or apps like `youtube` or `netflix` to your blocklist. Spend 15 seconds on one and you get a nudge.
- 🔊 **Gets louder if you ignore it.** The alert beeps every 5 seconds until you press **Got it**, louder each time.
- 🔇 **Warns you when you're muted.** If your computer is muted or very quiet, a banner tells you, with a one-click fix. You can also let it unmute for alerts.
- ⏸️ **Counts breaks honestly.** Pause and resume as often as you like. Breaks are timed separately. If you want, turn on a break reminder in ⚙️ Settings and it will ask, each time you pause, whether to nudge you back after a number of minutes. It's off by default.
- 🔥 **Asks how it went.** When you stop, rate the session from 😢 to 🔥.
- 📊 **Shows you the trend.** Daily, weekly and monthly stats, with your rating next to the measured efficiency.

## How your data is kept

**Your sessions never leave your computer.** Nothing is uploaded.

| Where | What |
|---|---|
| `Documents/FocusPocus/logs/` | Your sessions, one file per day (you can move this folder in ⚙️ Settings) |
| `Documents/FocusPocus/blacklist.json` | Your blocklist |
| `logs-sample/` in this repo | **Made-up** sessions for demos and testing |

Each session records when it ended, the focus time, the break count and total break time, the number of alerts and your rating:

```json
{
  "timestamp": "2026-01-10T10:57:31.000Z",
  "focusTime": 12511849,
  "procrastinationCount": 1,
  "pauseCount": 2,
  "pauseTime": 1974996,
  "efficiencyRating": 84
}
```

Times are in milliseconds. A session is filed under the day it **ended**, so one that runs past midnight is filed under the next day.

## Stats

Click **Daily**, **Weekly** or **Monthly** in the main window. Here's the weekly view, filled with the sample data:

<img src="docs/stats-weekly-sample.png" width="360" alt="Weekly statistics window showing sessions, focus time, alerts, pauses and efficiency">

**Measured efficiency** counts each alert as 10 lost minutes: focus time ÷ (focus time + alerts × 10 min).

## Run it

You'll need [Node.js](https://nodejs.org/) (the LTS version).

```bash
git clone https://github.com/mnicolee/Focus-Pocus.git
cd Focus-Pocus
npm install
npm start
```

On Windows you can also double-click **`Start Focus Pocus.bat`**.

To build a standalone `.exe` in `dist/`, run `npm run build`.

### Dev mode

```bash
npm run dev
```

Dev mode uses a separate `logs-dev/` folder filled with fake sessions, so it never touches your real data. More in [`dev-tools/`](dev-tools/README.md).

To reshuffle the sample dataset, run `node dev-tools/make-sample-data.js`.

## Troubleshooting

- **No sound on alerts?** Check the orange banner in the main window. Your computer may be muted. Turn on ⚙️ Settings → **Turn my sound on for alerts** to let Focus Pocus unmute for you. The taskbar button also flashes on every alert.
- **Blocklist not catching a site?** Focus Pocus matches the words in the window title. Use the name as it appears in the browser tab (e.g. `youtube`, not `youtu.be`).
- **Stats show N/A for your rating?** You haven't rated a session in that period yet.

More help: [`dev-tools/TROUBLESHOOTING.md`](dev-tools/TROUBLESHOOTING.md). Older notes from v1.2 are in [`dev-tools/notes/`](dev-tools/notes/).

## Project layout

```
main.js            Electron main process (window, idle time, system sound)
renderer.js        The app: timer, alerts, stats, settings
system-audio.js    Reads/sets Windows volume and mute for the sound warning
index.html         Main window       stats.html  Stats window
logs-sample/       Made-up sessions (safe to share)
dev-tools/         Dev mode helpers, sample-data generator, old notes
docs/              Images used in this README
```

MIT licence. See [CHANGELOG.md](CHANGELOG.md) for what changed.

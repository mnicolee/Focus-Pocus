// Generate a randomised SAMPLE dataset for troubleshooting and demos.
//
// Focus Pocus never uses this in normal operation: your real sessions live in
// Documents/FocusPocus. This folder is only a reference dataset, e.g. for
// regenerating the portfolio dashboard when no real logs are present, or for
// exercising the UI without touching real data.
//
// Re-run any time to reshuffle:  node dev-tools/make-sample-data.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'logs-sample');
fs.mkdirSync(OUT, { recursive: true });

// Clear previous sample logs (leave README and anything non-JSON alone)
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT, f));
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = arr => arr[randInt(0, arr.length - 1)];

const start = new Date(2026, 0, 6); // 6 Jan 2026
let total = 0;

for (let d = 0; d < 64 && total < 32; d++) {
  if (Math.random() < 0.48) continue; // roughly every other day has a session

  const day = new Date(start.getTime());
  day.setDate(start.getDate() + d);
  const dateStr = [
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0')
  ].join('-');

  const sessions = [];
  const n = Math.random() < 0.3 ? 2 : 1; // occasionally two sessions in a day
  for (let s = 0; s < n; s++) {
    const ts = new Date(
      day.getFullYear(), day.getMonth(), day.getDate(),
      randInt(9, 22), randInt(0, 59), randInt(0, 59)
    );
    const procrastinationCount = pick([0, 0, 0, 1, 1, 2, 3, 4]);
    const pauseCount = pick([0, 0, 1, 1, 2, 3]);
    const session = {
      timestamp: ts.toISOString(),
      focusTime: Math.round(rand(0.5 * HOUR, 8 * HOUR)),
      procrastinationCount,
      pauseCount,
      pauseTime: pauseCount ? Math.round(rand(1 * MIN, pauseCount * 22 * MIN)) : 0
    };
    if (Math.random() < 0.85) {
      session.efficiencyRating = randInt(60, 98); // most sessions get a self-rating
    }
    sessions.push(session);
    total++;
  }

  fs.writeFileSync(path.join(OUT, `${dateStr}.json`), JSON.stringify(sessions, null, 2));
}

console.log(`Wrote ${total} sample sessions to ${OUT}`);

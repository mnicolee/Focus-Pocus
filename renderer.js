const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Check if we're in dev mode - check both argv and environment
const DEV_MODE = process.argv.includes('--dev-mode') || process.env.DEV_MODE === 'true';
console.log('[Focus Pocus] DEV_MODE:', DEV_MODE);
console.log('[Focus Pocus] Environment DEV_MODE:', process.env.DEV_MODE);

// State management
let state = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pauseStartTime: null,
  totalPauseTime: 0,
  totalFocusTime: 0,
  elapsedTime: 0,
  pauseCount: 0,
  procrastinationCount: 0,
  lastInactivityAlert: null,
  consecutiveInactivityAlerts: 0, // Track how many times inactivity alert has been ignored
  lastDistractionAlert: null,
  distractionDetectedAt: null, // When a blocked site/app was first seen this stretch
  lastDistractionMatch: null,  // Which blocklist term matched
  inactivityThreshold: 10 * 60 * 1000, // Default 10 minutes
  blocklist: [] // User-defined distraction keywords (lowercased)
};

// Alert repeat interval storage
let alertRepeatInterval = null;
let currentAlertType = null;
let currentBeepCount = 1;
let alertRepeatIndex = 0;        // how many times the current alert has repeated unanswered
let audioBeforeLoudMode = null;  // system sound state to restore after a loud-mode alert
let audiblePending = Promise.resolve(); // loud-mode unmute in progress

// Constants
const ALERT_INTERVAL = 10 * 60 * 1000; // 10 minutes
const DISTRACTION_DELAY = 15 * 1000; // 15 seconds on a blocked site/app before nudging
const CHECK_INTERVAL = 1000; // Check every second

// Efficiency rating emojis (0-100 in steps of 10)
const EFFICIENCY_EMOJIS = {
  0: '😢', 10: '😔', 20: '😟', 30: '😕', 40: '😐',
  50: '😶', 60: '🙂', 70: '😊', 80: '😄', 90: '🤩', 100: '🔥'
};

// Efficiency rating messages
const EFFICIENCY_MESSAGES = {
  high: [  // >= 70%
    "Excellent work! You're on fire! 🔥",
    "Amazing focus! Keep up the great work!",
    "Outstanding productivity! You're crushing it!",
    "Fantastic session! You're a productivity champion!",
    "Superb efficiency! This is what success looks like!"
  ],
  low: [  // < 70%
    "Come on, you can do way better than this!",
    "What are you doing, man? Focus up!",
    "Really? Is this the best you've got?",
    "This is unacceptable. Time to get serious!",
    "Seriously? You need to step it up!",
    "You're better than this. Prove it next time!",
    "That's disappointing. Let's see some real effort!",
    "This won't cut it. Push harder next time!"
  ]
};

// DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const statusText = document.getElementById('statusText');
const alertCountdown = document.getElementById('alertCountdown');
const startBtn = document.getElementById('startBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const dailyStatsBtn = document.getElementById('dailyStatsBtn');
const weeklyStatsBtn = document.getElementById('weeklyStatsBtn');
const monthlyStatsBtn = document.getElementById('monthlyStatsBtn');
const killAllBtn = document.getElementById('killAllBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');
const statsModal = document.getElementById('statsModal');
const statsModalTitle = document.getElementById('statsModalTitle');
const closeModal = document.getElementById('closeModal');
const alertModal = document.getElementById('alertModal');
const dismissAlert = document.getElementById('dismissAlert');
const alertText = document.getElementById('alertText');
const killAllModal = document.getElementById('killAllModal');
const killYesBtn = document.getElementById('killYesBtn');
const killNoBtn = document.getElementById('killNoBtn');
const sessionSelectModal = document.getElementById('sessionSelectModal');
const sessionSelectBody = document.getElementById('sessionSelectBody');
const closeSessionSelect = document.getElementById('closeSessionSelect');
const sessionCancelBtn = document.getElementById('sessionCancelBtn');
const sessionContinueBtn = document.getElementById('sessionContinueBtn');
const inactivityThresholdInput = document.getElementById('inactivityThreshold');
const efficiencyModal = document.getElementById('efficiencyModal');
const efficiencySlider = document.getElementById('efficiencySlider');
const efficiencyInput = document.getElementById('efficiencyInput');
const efficiencyEmoji = document.getElementById('efficiencyEmoji');
const efficiencyMessage = document.getElementById('efficiencyMessage');
const efficiencySubmitBtn = document.getElementById('efficiencySubmitBtn');
const lastSessionDisplay = document.getElementById('lastSessionDisplay');
const lastSessionSelfRating = document.getElementById('lastSessionSelfRating');
const lastSessionFocusRating = document.getElementById('lastSessionFocusRating');
const settingsBtn = document.getElementById('settingsBtn');
const blocklistModal = document.getElementById('blocklistModal');
const closeBlocklist = document.getElementById('closeBlocklist');
const blocklistInput = document.getElementById('blocklistInput');
const blocklistAddBtn = document.getElementById('blocklistAddBtn');
const blocklistItems = document.getElementById('blocklistItems');
const blocklistEmpty = document.getElementById('blocklistEmpty');
const dataFolderInput = document.getElementById('dataFolderInput');
const dataFolderBrowse = document.getElementById('dataFolderBrowse');
const settingsSaveBtn = document.getElementById('settingsSaveBtn');
const settingsCancelBtn = document.getElementById('settingsCancelBtn');
const soundWarning = document.getElementById('soundWarning');
const soundWarningText = document.getElementById('soundWarningText');
const soundFixBtn = document.getElementById('soundFixBtn');
const loudModeInput = document.getElementById('loudModeInput');

// ---- Where Focus Pocus keeps its data (offline, in the user's Documents by default) ----
// A tiny pointer file in the app's per-user config spot remembers which folder the user
// chose; the logs and blocklist themselves live in that folder.
const appPaths = ipcRenderer.sendSync('get-app-paths'); // { documents, userData }
const pointerFile = path.join(appPaths.userData, 'focus-pocus-config.json');

// Legacy locations (from before the data folder was configurable) - used once to migrate
const legacyLogsDir = path.join(__dirname, 'logs');
const legacyBlocklistFile = path.join(__dirname, 'user_data', 'blacklist.json');

function readConfig() {
  try {
    if (fs.existsSync(pointerFile)) {
      const cfg = JSON.parse(fs.readFileSync(pointerFile, 'utf8'));
      if (cfg && typeof cfg === 'object') return cfg;
    }
  } catch (e) {
    console.error('[Config] Failed to read pointer:', e);
  }
  return {};
}

function writeConfig() {
  try {
    fs.writeFileSync(pointerFile, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('[Config] Failed to write pointer:', e);
  }
}

let config = readConfig();
let dataDir = config.dataDir || path.join(appPaths.documents, 'FocusPocus');

// Dev mode keeps its test data local so it never touches the real Documents folder.
let logsDir = DEV_MODE ? path.join(__dirname, 'logs-dev') : path.join(dataDir, 'logs');
let blocklistFile = DEV_MODE
  ? path.join(__dirname, 'user_data', 'blacklist.json')
  : path.join(dataDir, 'blacklist.json');

function ensureDataDirs() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  } catch (e) {
    console.error('[Config] Failed to create data folders:', e);
  }
}

// Copy logs + blocklist from one place to another without overwriting newer files.
function copyDataInto(fromLogsDir, fromBlocklistFile, toLogsDir, toBlocklistFile) {
  try {
    if (fs.existsSync(fromLogsDir) && path.resolve(fromLogsDir) !== path.resolve(toLogsDir)) {
      if (!fs.existsSync(toLogsDir)) fs.mkdirSync(toLogsDir, { recursive: true });
      for (const f of fs.readdirSync(fromLogsDir)) {
        if (!f.endsWith('.json')) continue;
        const dest = path.join(toLogsDir, f);
        if (!fs.existsSync(dest)) fs.copyFileSync(path.join(fromLogsDir, f), dest);
      }
    }
    if (fs.existsSync(fromBlocklistFile) && !fs.existsSync(toBlocklistFile)
        && path.resolve(fromBlocklistFile) !== path.resolve(toBlocklistFile)) {
      fs.copyFileSync(fromBlocklistFile, toBlocklistFile);
    }
  } catch (e) {
    console.error('[Config] Failed to copy data:', e);
  }
}

ensureDataDirs();

// First run after this update: bring the old app-folder logs/blocklist into the new data
// folder (copy, so the originals stay put as a backup), then remember we've done it.
if (!DEV_MODE && !config.migrated) {
  copyDataInto(legacyLogsDir, legacyBlocklistFile, logsDir, blocklistFile);
  config.dataDir = dataDir;
  config.migrated = true;
  writeConfig();
}

// Update title if in dev mode - use DOMContentLoaded to ensure elements exist
if (DEV_MODE) {
  console.log('[DEV MODE] Dev mode is ACTIVE');

  // Function to update title
  function updateDevTitle() {
    const appTitle = document.querySelector('.app-title');
    console.log('[DEV MODE] Trying to update title, element found:', !!appTitle);
    if (appTitle) {
      appTitle.textContent = 'Focus Pocus (DEV VERSION)';
      appTitle.style.color = '#ff6b6b';
      console.log('[DEV MODE] Title updated to red');
    } else {
      console.log('[DEV MODE] WARNING: .app-title element not found!');
    }
  }

  // Try to update immediately
  updateDevTitle();

  // Also try after DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDevTitle);
  }
}

// Generate fake data for dev mode
function generateFakeDevData() {
  const today = new Date();

  // Helper function to create sessions for a given date
  function createSessionsForDate(date, sessionCount) {
    const sessions = [];
    for (let i = 0; i < sessionCount; i++) {
      const focusTime = Math.floor(Math.random() * (3600000 - 600000) + 600000); // 10-60 mins
      const procrastinationCount = Math.floor(Math.random() * 5); // 0-4 alerts
      const pauseCount = Math.floor(Math.random() * 3); // 0-2 pauses
      const pauseTime = pauseCount * Math.floor(Math.random() * 300000); // up to 5 mins per pause
      const efficiencyRating = Math.floor(Math.random() * 101); // 0-100%

      const sessionTime = new Date(date);
      sessionTime.setHours(9 + i * 2); // Spread throughout the day

      sessions.push({
        timestamp: sessionTime.toISOString(),
        focusTime: focusTime,
        procrastinationCount: procrastinationCount,
        pauseCount: pauseCount,
        pauseTime: pauseTime,
        efficiencyRating: efficiencyRating
      });
    }
    return sessions;
  }

  // Helper function to save sessions to a log file
  function saveSessions(date, sessions) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const logFile = path.join(logsDir, `${dateStr}.json`);
    fs.writeFileSync(logFile, JSON.stringify(sessions, null, 2));
  }

  // Generate today's data (5 sessions)
  saveSessions(today, createSessionsForDate(today, 5));

  // Generate yesterday's data (4 sessions)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  saveSessions(yesterday, createSessionsForDate(yesterday, 4));

  // Generate data for 5 days ago (3 sessions)
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  saveSessions(fiveDaysAgo, createSessionsForDate(fiveDaysAgo, 3));

  // Generate data for 10 days ago (2 sessions)
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  saveSessions(tenDaysAgo, createSessionsForDate(tenDaysAgo, 2));

  // Generate data for 20 days ago (3 sessions)
  const twentyDaysAgo = new Date(today);
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
  saveSessions(twentyDaysAgo, createSessionsForDate(twentyDaysAgo, 3));

  console.log('[DEV MODE] Generated fake session data for multiple days');
}

// Generate fake data on first run in dev mode
if (DEV_MODE) {
  console.log('[DEV MODE] Checking for existing data in:', logsDir);
  const files = fs.readdirSync(logsDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  console.log('[DEV MODE] Found', jsonFiles.length, 'JSON files');

  if (jsonFiles.length === 0) {
    console.log('[DEV MODE] No data found, generating fake data...');
    generateFakeDevData();
  } else {
    console.log('[DEV MODE] Using existing data:', jsonFiles);
  }
}

// Track selected sessions for deletion
let selectedSessionIndices = [];

// Timer interval
let timerInterval = null;
let activityCheckInterval = null;

// Update inactivity threshold when input changes
inactivityThresholdInput.addEventListener('change', (e) => {
  const minutes = parseInt(e.target.value);
  if (minutes > 0 && minutes <= 60) {
    state.inactivityThreshold = minutes * 60 * 1000;
  } else {
    // Reset to default if invalid
    e.target.value = 10;
    state.inactivityThreshold = 10 * 60 * 1000;
  }
});

// ---------- Settings: distraction blocklist + data folder ----------
// Edits are staged in working copies and only written to disk when Save is hit.
let workingBlocklist = [];
let workingDataDir = '';

// Turn user input into a matchable keyword: a site or app name as it would
// appear in a window title. Accepts a plain word or a pasted URL/domain.
function toKeyword(raw) {
  let s = (raw || '').trim().toLowerCase();
  if (!s) return '';
  // Strip protocol, leading www., and any path/query
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.split('/')[0].split('?')[0];
  // If it looks like a domain (a.b.c), keep the main label: youtube.com -> youtube
  if (s.includes('.')) {
    const parts = s.split('.').filter(Boolean);
    if (parts.length >= 2) {
      s = parts[parts.length - 2];
    }
  }
  return s.trim();
}

function loadBlocklist() {
  try {
    if (fs.existsSync(blocklistFile)) {
      const data = JSON.parse(fs.readFileSync(blocklistFile, 'utf8'));
      if (data && Array.isArray(data.keywords)) {
        state.blocklist = data.keywords.map(k => String(k).toLowerCase().trim()).filter(Boolean);
        return;
      }
    }
  } catch (e) {
    console.error('[Blocklist] Failed to load:', e);
  }
  // First run (or unreadable): seed with a sensible default and save it
  state.blocklist = ['youtube'];
  saveBlocklist();
}

function saveBlocklist() {
  try {
    fs.writeFileSync(blocklistFile, JSON.stringify({ keywords: state.blocklist }, null, 2));
  } catch (e) {
    console.error('[Blocklist] Failed to save:', e);
  }
}

// Render the STAGED blocklist (not yet saved) inside the settings panel
function renderBlocklist() {
  blocklistItems.innerHTML = '';
  blocklistEmpty.style.display = workingBlocklist.length ? 'none' : 'block';

  workingBlocklist.forEach(term => {
    const chip = document.createElement('div');
    chip.className = 'blocklist-chip';

    const label = document.createElement('span');
    label.textContent = term;
    chip.appendChild(label);

    const remove = document.createElement('button');
    remove.className = 'blocklist-chip-remove';
    remove.setAttribute('aria-label', `Remove ${term}`);
    remove.innerHTML = '<i class="fas fa-times"></i>';
    remove.addEventListener('click', () => removeWorkingTerm(term));
    chip.appendChild(remove);

    blocklistItems.appendChild(chip);
  });
}

function addWorkingTerm(raw) {
  const term = toKeyword(raw);
  if (term && !workingBlocklist.includes(term)) {
    workingBlocklist.push(term);
    renderBlocklist();
  }
  blocklistInput.value = '';
  blocklistInput.focus();
}

function removeWorkingTerm(term) {
  workingBlocklist = workingBlocklist.filter(t => t !== term);
  renderBlocklist();
}

// Open the settings panel: stage the current values into working copies
function openSettings() {
  workingBlocklist = state.blocklist.slice();
  workingDataDir = dataDir;
  dataFolderInput.value = dataDir;
  loudModeInput.checked = !!config.loudMode;
  renderBlocklist();
  blocklistModal.classList.add('show');
  blocklistInput.focus();
}

// Close without saving: staged edits are simply discarded (nothing was written)
function closeSettings() {
  blocklistModal.classList.remove('show');
}

// Commit staged changes to disk
function saveSettings() {
  // Data folder (dev mode always keeps its data local, so leave it alone there)
  const chosen = (dataFolderInput.value || '').trim();
  const newDir = chosen || workingDataDir;
  if (!DEV_MODE && path.resolve(newDir) !== path.resolve(dataDir)) {
    const oldLogsDir = logsDir;
    const oldBlocklistFile = blocklistFile;
    dataDir = newDir;
    logsDir = path.join(dataDir, 'logs');
    blocklistFile = path.join(dataDir, 'blacklist.json');
    ensureDataDirs();
    // Carry existing logs + blocklist into the new home (copy, non-destructive)
    copyDataInto(oldLogsDir, oldBlocklistFile, logsDir, blocklistFile);
    config.dataDir = dataDir;
    config.migrated = true;
    writeConfig();
  }

  // Alert sound
  if (!!config.loudMode !== loudModeInput.checked) {
    config.loudMode = loudModeInput.checked;
    writeConfig();
  }

  // Blocklist
  state.blocklist = workingBlocklist.slice();
  saveBlocklist();

  blocklistModal.classList.remove('show');
  updateLastSessionDisplay(); // reflect any change in log location
}

// Wiring
settingsBtn.addEventListener('click', openSettings);
closeBlocklist.addEventListener('click', closeSettings);
settingsCancelBtn.addEventListener('click', closeSettings);
settingsSaveBtn.addEventListener('click', saveSettings);

blocklistModal.addEventListener('click', (e) => {
  if (e.target === blocklistModal) {
    closeSettings();
  }
});

blocklistAddBtn.addEventListener('click', () => addWorkingTerm(blocklistInput.value));

blocklistInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addWorkingTerm(blocklistInput.value);
  }
});

// Browse for a data folder (native picker); only staged until Save
dataFolderBrowse.addEventListener('click', async () => {
  const picked = await ipcRenderer.invoke('choose-folder', dataFolderInput.value || dataDir);
  if (picked) {
    workingDataDir = picked;
    dataFolderInput.value = picked;
  }
});

// Load the saved blocklist at startup
loadBlocklist();

// Format time helper
function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr}${ampm}`;
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

// Update alert countdown display
async function updateAlertCountdown() {
  if (!state.isRunning || state.isPaused) {
    alertCountdown.textContent = 'Time to Alert: --:--';
    return;
  }

  // Use system-wide idle time
  const systemIdleSeconds = await ipcRenderer.invoke('get-idle-time');
  const systemIdleMs = systemIdleSeconds * 1000;
  const timeUntilAlert = state.inactivityThreshold - systemIdleMs;

  // About 5 seconds before an inactivity alert, make sure it will be heard
  if (timeUntilAlert > 0 && timeUntilAlert <= PRE_ALERT_CHECK_MS) {
    if (!preAlertChecked.inactivity) { preAlertChecked.inactivity = true; checkSound(); }
  } else if (timeUntilAlert > PRE_ALERT_CHECK_MS) {
    preAlertChecked.inactivity = false;
  }

  if (timeUntilAlert <= 0) {
    alertCountdown.textContent = 'Time to Alert: 00:00';
  } else {
    const minutes = Math.floor(timeUntilAlert / (1000 * 60));
    const seconds = Math.floor((timeUntilAlert / 1000) % 60);
    alertCountdown.textContent = `Time to Alert: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

// Update timer display
function updateTimer() {
  if (state.isPaused) {
    return;
  }

  const now = Date.now();
  state.elapsedTime = now - state.startTime - state.totalPauseTime;
  timerDisplay.textContent = formatTime(state.elapsedTime);
  updateAlertCountdown();
}

// Note: Activity tracking now uses system-wide idle detection via powerMonitor.getSystemIdleTime()
// No need for document-level event listeners

// Check for inactivity and procrastination sites
async function checkActivity() {
  if (!state.isRunning || state.isPaused) {
    return;
  }

  const now = Date.now();

  // Check for inactivity using system-wide idle detection
  const systemIdleSeconds = await ipcRenderer.invoke('get-idle-time');
  const systemIdleMs = systemIdleSeconds * 1000;

  if (systemIdleMs > state.inactivityThreshold) {
    if (!state.lastInactivityAlert || (now - state.lastInactivityAlert) > ALERT_INTERVAL) {
      // Increment consecutive inactivity alerts counter
      state.consecutiveInactivityAlerts++;
      const beepCount = 3 * state.consecutiveInactivityAlerts;

      showAlert('You\'ve been inactive for a while. Time to focus!', 'inactivity', beepCount);
      state.lastInactivityAlert = now;
      state.procrastinationCount++;
    }
  } else {
    // User is active, reset the consecutive inactivity counter
    if (state.consecutiveInactivityAlerts > 0) {
      state.consecutiveInactivityAlerts = 0;
    }
  }

  // Check the active window against the user's distraction blocklist (15-second delay)
  try {
    const activeWindow = await ipcRenderer.invoke('get-active-window');
    // What active-win can see on Windows: the window title + the owning app's
    // name. We match the user's keywords against both (case-insensitive), so a
    // blocklist entry can catch a browser tab ("... - YouTube") or a desktop app.
    const haystack = activeWindow
      ? `${activeWindow.title || ''} ${(activeWindow.owner && activeWindow.owner.name) || ''}`.toLowerCase()
      : '';
    const match = haystack ? state.blocklist.find(term => term && haystack.includes(term)) : null;

    if (match) {
      // A blocked site/app is in front
      if (!state.distractionDetectedAt) {
        // First time we've seen a distraction this stretch
        state.distractionDetectedAt = now;
        state.lastDistractionMatch = match;
      } else {
        const distractionDuration = now - state.distractionDetectedAt;

        // About 5 seconds before the nudge, make sure it will be heard
        if (distractionDuration >= DISTRACTION_DELAY - PRE_ALERT_CHECK_MS && !preAlertChecked.distraction) {
          preAlertChecked.distraction = true;
          checkSound();
        }

        if (distractionDuration >= DISTRACTION_DELAY) {
          // On a blocked site/app for 1+ minute, nudge if due
          if (!state.lastDistractionAlert || (now - state.lastDistractionAlert) > ALERT_INTERVAL) {
            showAlert(`Distracted by "${match}"? Time to get back to work!`, 'youtube');
            state.lastDistractionAlert = now;
            state.procrastinationCount++;
          }
        }
      }
    } else {
      // Nothing blocked in front, reset the timer
      state.distractionDetectedAt = null;
      state.lastDistractionMatch = null;
      preAlertChecked.distraction = false;
    }
  } catch (error) {
    // Active-window detection not available, silently continue
    state.distractionDetectedAt = null;
    state.lastDistractionMatch = null;
  }
}

// Play audio beep with different sounds for different alert types
// Volume climbs from 30% to 100%: +15% each time an alert repeats unanswered,
// +20% for each inactivity alert in a row you've ignored.
function alertGain() {
  const ignoredInARow = Math.max(0, (state.consecutiveInactivityAlerts || 1) - 1);
  return Math.min(1, 0.3 + 0.15 * alertRepeatIndex + 0.2 * ignoredInARow);
}

function playBeep(type, beepCount = 1) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(alertGain(), audioContext.currentTime);
  // Free the audio device once the beeps are done
  setTimeout(() => audioContext.close().catch(() => {}), beepCount * 250 + 1000);

  if (type === 'inactivity') {
    // Multiple beeps (starts at 3, escalates each time ignored)
    for (let i = 0; i < beepCount; i++) {
      const oscillator = audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      const startTime = audioContext.currentTime + (i * 0.25);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    }
  } else if (type === 'youtube' || type === 'manga') {
    // Single beep for both YouTube and manga, 800Hz
    const oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }
}

// Show alert
function showAlert(message, type = 'inactivity', beepCount = 1) {
  // Clear any existing repeat interval
  if (alertRepeatInterval) {
    clearInterval(alertRepeatInterval);
  }

  // Store current alert info for repeating
  currentAlertType = type;
  currentBeepCount = beepCount;

  // Show the alert modal
  alertText.textContent = message;
  alertModal.classList.add('show');

  // Play the first beep (after making sure it can be heard, if loud mode is on)
  alertRepeatIndex = 0;
  audiblePending = ensureAudible();
  audiblePending.finally(() => playBeep(type, beepCount));

  // Request window to come to front (also flashes the taskbar button)
  ipcRenderer.send('restore-and-focus-window');

  // Repeat every 5 seconds until dismissed, a little louder each time
  alertRepeatInterval = setInterval(() => {
    alertRepeatIndex++;
    playBeep(currentAlertType, currentBeepCount);
  }, 5000);
}

// ---------- System sound: warn when alerts would be silent ----------
const QUIET_VOLUME = 0.15;   // below this we treat alerts as "probably not heard"
const LOUD_MODE_VOLUME = 0.6;

async function getSystemAudio() {
  try { return await ipcRenderer.invoke('audio-get'); } catch (e) { console.error('[Sound] audio-get failed', e); return null; }
}

function isSilent(audio) {
  return !!audio && (audio.muted || audio.volume < QUIET_VOLUME);
}

function showSoundState(audio) {
  if (!audio) {           // unknown (not Windows, or the check failed): stay quiet
    soundWarning.hidden = true;
    return;
  }
  if (isSilent(audio)) {
    soundWarningText.textContent = audio.muted
      ? 'Your sound is muted, so alerts will be silent.'
      : `Your volume is at ${Math.round(audio.volume * 100)}%, so alerts may be hard to hear.`;
    soundFixBtn.textContent = audio.muted ? 'Unmute' : 'Turn up';
    soundWarning.hidden = false;
  } else {
    soundWarning.hidden = true;
  }
}

// Sound is checked only when the app opens and about 5 seconds before an
// alert goes off (see updateAlertCountdown and checkActivity).
async function checkSound() {
  showSoundState(await getSystemAudio());
}
const PRE_ALERT_CHECK_MS = 5000;
let preAlertChecked = { inactivity: false, distraction: false };

soundFixBtn.addEventListener('click', async () => {
  soundWarning.hidden = true; // respond instantly; the call below takes about a second
  const wasLow = soundFixBtn.textContent === 'Turn up';
  const after = await ipcRenderer.invoke('audio-set', { muted: false, volume: wasLow ? 0.5 : undefined });
  showSoundState(after);
});

// Loud mode: if the computer is muted or very quiet when an alert fires,
// unmute and turn it up, remembering the old state to restore on "Got it".
async function ensureAudible() {
  if (!config.loudMode || audioBeforeLoudMode) return;
  const audio = await getSystemAudio();
  if (!isSilent(audio)) return;
  audioBeforeLoudMode = audio;
  await ipcRenderer.invoke('audio-set', {
    muted: false,
    volume: Math.max(audio.volume, LOUD_MODE_VOLUME)
  });
}

async function restoreAudioAfterAlert() {
  await audiblePending.catch(() => {}); // a fast "Got it" waits for the unmute to finish first
  if (!audioBeforeLoudMode) return;
  const before = audioBeforeLoudMode;
  audioBeforeLoudMode = null;
  await ipcRenderer.invoke('audio-set', { volume: before.volume, muted: before.muted });
}

// Check once when the app opens
checkSound();

// While the warning is up, re-check when you come back to the window (hover or
// click), so it clears soon after you unmute from Windows. No background polling.
let lastSoundRecheck = 0;
function recheckSoundIfWarning() {
  if (soundWarning.hidden || Date.now() - lastSoundRecheck < 3000) return;
  lastSoundRecheck = Date.now();
  checkSound();
}
document.addEventListener('mouseenter', recheckSoundIfWarning);
document.addEventListener('mousemove', recheckSoundIfWarning);
window.addEventListener('focus', recheckSoundIfWarning);

// Load and display sessions for selection
function loadSessionSelectionModal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
  const logFile = path.join(logsDir, `${dateStr}.json`);

  if (!fs.existsSync(logFile)) {
    return [];
  }

  const data = fs.readFileSync(logFile, 'utf8');
  const sessions = JSON.parse(data);

  // Clear previous content
  sessionSelectBody.innerHTML = '';
  selectedSessionIndices = [];

  // Create session items
  sessions.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'session-checkbox';
    checkbox.id = `session-${index}`;
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!selectedSessionIndices.includes(index)) {
          selectedSessionIndices.push(index);
        }
      } else {
        selectedSessionIndices = selectedSessionIndices.filter(i => i !== index);
      }
    });

    const sessionInfo = document.createElement('div');
    sessionInfo.className = 'session-info';

    const startTime = formatTimestamp(session.timestamp);
    const endDate = new Date(session.timestamp);
    const sessionNumber = index + 1;

    const label = document.createElement('div');
    label.className = 'session-label';
    label.textContent = `Session ${sessionNumber}: ${startTime}`;

    const details = document.createElement('div');
    details.className = 'session-details';
    details.textContent = `Focus Time: ${formatDuration(session.focusTime)} | Procrastination: ${session.procrastinationCount} alerts | Pause Time: ${formatDuration(session.pauseTime)} (${session.pauseCount} pauses)`;

    sessionInfo.appendChild(label);
    sessionInfo.appendChild(details);

    sessionDiv.appendChild(checkbox);
    sessionDiv.appendChild(sessionInfo);

    // Allow clicking on the whole item to toggle checkbox
    sessionDiv.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    sessionSelectBody.appendChild(sessionDiv);
  });

  return sessions;
}

// Save session log
function saveSessionLog(sessionData) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
  const logFile = path.join(logsDir, `${dateStr}.json`);

  let logs = [];
  if (fs.existsSync(logFile)) {
    const data = fs.readFileSync(logFile, 'utf8');
    logs = JSON.parse(data);
  }

  logs.push({
    timestamp: now.toISOString(),
    focusTime: sessionData.focusTime,
    procrastinationCount: sessionData.procrastinationCount,
    pauseCount: sessionData.pauseCount,
    pauseTime: sessionData.pauseTime,
    efficiencyRating: sessionData.efficiencyRating
  });

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

// Get Monday of the week for a given date
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Get date range for statistics
function getDateRange(type) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (type === 'daily') {
    return { start: today, end: now };
  } else if (type === 'weekly') {
    const monday = getMonday(now);
    monday.setHours(0, 0, 0, 0);
    return { start: monday, end: now };
  } else if (type === 'monthly') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: firstDay, end: now };
  }
}

// Read logs for date range
function readLogsForRange(start, end) {
  const sessions = [];
  const current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
    const logFile = path.join(logsDir, `${dateStr}.json`);

    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, 'utf8');
      const logs = JSON.parse(data);
      sessions.push(...logs);
    }

    current.setDate(current.getDate() + 1);
  }

  return sessions;
}

// Get most recent session from all logs
function getMostRecentSession() {
  console.log('[Get Most Recent] Reading from logsDir:', logsDir);

  if (!fs.existsSync(logsDir)) {
    console.log('[Get Most Recent] Logs directory does not exist');
    return null;
  }

  const files = fs.readdirSync(logsDir);
  console.log('[Get Most Recent] Files found:', files);

  const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
  console.log('[Get Most Recent] JSON files (sorted):', jsonFiles);

  for (const file of jsonFiles) {
    const logFile = path.join(logsDir, file);
    const data = fs.readFileSync(logFile, 'utf8');
    const sessions = JSON.parse(data);
    console.log('[Get Most Recent] Sessions in', file, ':', sessions.length);

    if (sessions.length > 0) {
      const mostRecent = sessions[sessions.length - 1];
      console.log('[Get Most Recent] Found most recent session:', mostRecent);
      return mostRecent;
    }
  }

  console.log('[Get Most Recent] No sessions found');
  return null;
}

// Update last session display
function updateLastSessionDisplay() {
  console.log('[Last Session] Attempting to update display...');
  const lastSession = getMostRecentSession();
  console.log('[Last Session] Retrieved:', lastSession);

  if (lastSession && lastSession.efficiencyRating !== undefined) {
    // Calculate focus efficiency for the last session
    const totalProcrastTime = lastSession.procrastinationCount * ALERT_INTERVAL;
    const productiveTime = lastSession.focusTime + totalProcrastTime;
    const focusEfficiency = productiveTime > 0
      ? Math.round((lastSession.focusTime / productiveTime) * 100)
      : 0;

    console.log('[Last Session] Self Rating:', lastSession.efficiencyRating);
    console.log('[Last Session] Focus Efficiency:', focusEfficiency);

    lastSessionSelfRating.textContent = lastSession.efficiencyRating;
    lastSessionFocusRating.textContent = focusEfficiency;
    lastSessionDisplay.style.display = 'block';
    console.log('[Last Session] Display shown');
  } else {
    lastSessionDisplay.style.display = 'none';
    console.log('[Last Session] No data or no efficiency rating, display hidden');
  }
}

// Calculate cumulative statistics
function calculateCumulativeStats(sessions) {
  if (sessions.length === 0) {
    return {
      sessionCount: 0,
      totalFocusTime: 0,
      averageFocusTime: 0,
      totalProcrastination: 0,
      totalPauseTime: 0,
      totalPauseCount: 0,
      efficiency: 0,
      averageSelfAssessedEfficiency: null  // null when no data
    };
  }

  const totalFocusTime = sessions.reduce((sum, s) => sum + s.focusTime, 0);
  const totalPauseTime = sessions.reduce((sum, s) => sum + s.pauseTime, 0);
  const totalProcrastination = sessions.reduce((sum, s) => sum + s.procrastinationCount, 0);
  const totalPauseCount = sessions.reduce((sum, s) => sum + s.pauseCount, 0);
  const totalProcrastTime = totalProcrastination * ALERT_INTERVAL;
  const productiveTime = totalFocusTime + totalProcrastTime;
  const efficiency = productiveTime > 0 ? Math.round((totalFocusTime / productiveTime) * 100) : 0;

  // Calculate average self-assessed efficiency rating
  const sessionsWithRating = sessions.filter(s => s.efficiencyRating !== undefined);
  const averageSelfAssessedEfficiency = sessionsWithRating.length > 0
    ? Math.round(sessionsWithRating.reduce((sum, s) => sum + s.efficiencyRating, 0) / sessionsWithRating.length)
    : null;  // null means no data available

  return {
    sessionCount: sessions.length,
    totalFocusTime,
    averageFocusTime: Math.round(totalFocusTime / sessions.length),
    totalProcrastination,
    totalPauseTime,
    totalPauseCount,
    efficiency,
    averageSelfAssessedEfficiency
  };
}

// Update button states
function updateButtonStates(buttonState) {
  // Remove all active classes
  startBtn.classList.remove('active');
  playBtn.classList.remove('active');
  pauseBtn.classList.remove('active');

  switch (buttonState) {
    case 'initial':
      // Initial state - only start enabled
      startBtn.disabled = false;
      playBtn.disabled = true;
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      inactivityThresholdInput.disabled = false;
      break;

    case 'running':
      // Start button pressed - start glowing blue, pause enabled
      startBtn.classList.add('active');
      startBtn.disabled = true;
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      inactivityThresholdInput.disabled = true;
      break;

    case 'paused':
      // Pause button pressed - pause turns orange, only play enabled
      pauseBtn.classList.add('active');
      startBtn.disabled = true;
      playBtn.disabled = false;
      pauseBtn.disabled = true;
      stopBtn.disabled = false;
      break;

    case 'resumed':
      // Play button pressed - play turns blue, pause back to white
      playBtn.classList.add('active');
      startBtn.disabled = true;
      playBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      break;
  }
}

// Start button
startBtn.addEventListener('click', () => {
  state.isRunning = true;
  state.isPaused = false;
  state.startTime = Date.now();
  state.totalPauseTime = 0;
  state.pauseCount = 0;
  state.procrastinationCount = 0;
  state.lastInactivityAlert = null;
  state.consecutiveInactivityAlerts = 0;
  state.lastDistractionAlert = null;
  state.distractionDetectedAt = null;
  state.lastDistractionMatch = null;

  // Disable kill-all button when starting new session
  killAllBtn.disabled = true;


  statusText.textContent = 'Working...';
  updateButtonStates('running');

  timerInterval = setInterval(updateTimer, 100);
  activityCheckInterval = setInterval(checkActivity, CHECK_INTERVAL);
});

// Pause button
pauseBtn.addEventListener('click', () => {
  state.isPaused = true;
  state.pauseStartTime = Date.now();
  state.pauseCount++;
  statusText.textContent = 'Paused';
  updateAlertCountdown();
  updateButtonStates('paused');
});

// Play button
playBtn.addEventListener('click', () => {
  // Resume from pause
  state.isPaused = false;
  const pauseDuration = Date.now() - state.pauseStartTime;
  state.totalPauseTime += pauseDuration;
  statusText.textContent = 'Working...';
  updateButtonStates('resumed');

  // After a short delay, transition back to running state
  setTimeout(() => {
    if (!state.isPaused && state.isRunning) {
      updateButtonStates('running');
    }
  }, 1000);
});

// Efficiency rating helper functions
function getEfficiencyEmoji(rating) {
  const roundedRating = Math.round(rating / 10) * 10;
  return EFFICIENCY_EMOJIS[roundedRating] || '😐';
}

function getEfficiencyMessage(rating) {
  const messages = rating >= 70 ? EFFICIENCY_MESSAGES.high : EFFICIENCY_MESSAGES.low;
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateEfficiencyDisplay(rating) {
  efficiencyEmoji.textContent = getEfficiencyEmoji(rating);
  efficiencyMessage.textContent = getEfficiencyMessage(rating);
}

function showEfficiencyModal() {
  efficiencySlider.value = 50;
  efficiencyInput.value = 50;
  updateEfficiencyDisplay(50);
  efficiencyModal.classList.add('show');
}

// Sync slider and input
efficiencySlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  efficiencyInput.value = value;
  updateEfficiencyDisplay(value);
});

efficiencyInput.addEventListener('input', (e) => {
  let value = parseInt(e.target.value);
  if (isNaN(value)) value = 0;
  value = Math.max(0, Math.min(100, value));  // Clamp to 0-100
  e.target.value = value;
  efficiencySlider.value = value;
  updateEfficiencyDisplay(value);
});

// Stop button - now shows efficiency rating modal
stopBtn.addEventListener('click', () => {
  state.stopInitiatedAt = Date.now();
  showEfficiencyModal();
});

// Handle efficiency rating submission
efficiencySubmitBtn.addEventListener('click', () => {
  const efficiencyRating = parseInt(efficiencyInput.value);
  efficiencyModal.classList.remove('show');
  completeStopSession(efficiencyRating);
});

// Complete stop session with efficiency rating
function completeStopSession(efficiencyRating) {
  clearInterval(timerInterval);
  clearInterval(activityCheckInterval);

  const now = state.stopInitiatedAt || Date.now();

  // Calculate final stats
  if (state.isPaused) {
    const pauseDuration = now - state.pauseStartTime;
    state.totalPauseTime += pauseDuration;
  }

  // Recalculate final focus time with current timestamp for accuracy
  state.totalFocusTime = now - state.startTime - state.totalPauseTime;

  // Save session to log WITH efficiency rating
  saveSessionLog({
    focusTime: state.totalFocusTime,
    procrastinationCount: state.procrastinationCount,
    pauseCount: state.pauseCount,
    pauseTime: state.totalPauseTime,
    efficiencyRating: efficiencyRating
  });

  // Enable kill-all button
  killAllBtn.disabled = false;

  // Reset
  state.isRunning = false;
  state.isPaused = false;
  state.stopInitiatedAt = null;
  statusText.textContent = 'Ready to start';
  timerDisplay.textContent = '00:00:00';
  updateAlertCountdown();
  updateButtonStates('initial');

  // Update last session display
  updateLastSessionDisplay();
}

// Statistics buttons
dailyStatsBtn.addEventListener('click', () => {
  showCumulativeStats('daily');
});

weeklyStatsBtn.addEventListener('click', () => {
  showCumulativeStats('weekly');
});

monthlyStatsBtn.addEventListener('click', () => {
  showCumulativeStats('monthly');
});

// Show current session statistics (after stop)
function showCurrentSessionStats() {
  const procrastTime = state.procrastinationCount * ALERT_INTERVAL;
  const productiveTime = state.totalFocusTime + procrastTime;
  const efficiency = productiveTime > 0 ? Math.round((state.totalFocusTime / productiveTime) * 100) : 0;

  const statsData = {
    title: 'Session Statistics',
    label1: 'Session Type',
    value1: 'Single Session',
    label2: 'Total Focus Time',
    value2: formatDuration(state.totalFocusTime),
    label3: 'Productive Time',
    value3: formatDuration(state.totalFocusTime),
    label4: 'Procrastination Alerts',
    value4: `${state.procrastinationCount} alerts (${formatDuration(procrastTime)})`,
    label5: 'Pause Time',
    value5: `${state.pauseCount} pauses (${formatDuration(state.totalPauseTime)})`,
    label6: 'Focus Efficiency',
    value6: `${efficiency}%`
  };

  ipcRenderer.send('show-stats-window', statsData);
}

// Show cumulative statistics (daily/weekly/monthly)
function showCumulativeStats(type) {
  const range = getDateRange(type);
  const sessions = readLogsForRange(range.start, range.end);
  const stats = calculateCumulativeStats(sessions);

  const titles = {
    daily: 'Daily Statistics (Today)',
    weekly: 'Weekly Statistics (Mon-Sun)',
    monthly: 'Monthly Statistics (This Month)'
  };

  const statsData = {
    title: titles[type],
    label1: 'Total Sessions',
    value1: stats.sessionCount.toString(),
    label2: 'Total Focus Time',
    value2: formatDuration(stats.totalFocusTime),
    label3: 'Average Focus Time',
    value3: formatDuration(stats.averageFocusTime),
    label4: 'Total Procrastination Alerts',
    value4: `${stats.totalProcrastination} alerts`,
    label5: 'Total Pause Time',
    value5: `${stats.totalPauseCount} pauses (${formatDuration(stats.totalPauseTime)})`,
    label6: 'Focus Efficiency',
    value6: `${stats.efficiency}%`,
    label7: 'Self-Assessed Efficiency',
    value7: stats.averageSelfAssessedEfficiency !== null ? `${stats.averageSelfAssessedEfficiency}%` : 'N/A'
  };

  ipcRenderer.send('show-stats-window', statsData);
}

// Close modal
closeModal.addEventListener('click', () => {
  statsModal.classList.remove('show');
});

// Dismiss alert
dismissAlert.addEventListener('click', () => {
  alertModal.classList.remove('show');
  ipcRenderer.send('stop-flash');
  alertRepeatIndex = 0;
  restoreAudioAfterAlert();

  // Stop the repeating beep
  if (alertRepeatInterval) {
    clearInterval(alertRepeatInterval);
    alertRepeatInterval = null;
  }
});

// Window controls
minimizeBtn.addEventListener('click', () => {
  ipcRenderer.send('minimize-window');
});

closeBtn.addEventListener('click', () => {
  ipcRenderer.send('close-window');
});

// Close modal when clicking outside
statsModal.addEventListener('click', (e) => {
  if (e.target === statsModal) {
    statsModal.classList.remove('show');
  }
});

// Kill-all Daily button
killAllBtn.addEventListener('click', () => {
  const sessions = loadSessionSelectionModal();

  if (sessions.length === 0) {
    // No sessions to delete
    return;
  } else if (sessions.length === 1) {
    // Only one session, select it automatically and show confirmation
    selectedSessionIndices = [0];
    killAllModal.classList.add('show');
  } else {
    // Multiple sessions, show selection modal
    sessionSelectModal.classList.add('show');
  }
});

// Session selection modal - Close
closeSessionSelect.addEventListener('click', () => {
  sessionSelectModal.classList.remove('show');
});

// Session selection modal - Cancel
sessionCancelBtn.addEventListener('click', () => {
  sessionSelectModal.classList.remove('show');
});

// Session selection modal - Continue
sessionContinueBtn.addEventListener('click', () => {
  if (selectedSessionIndices.length === 0) {
    // No sessions selected, do nothing
    return;
  }

  // Close selection modal and show confirmation modal
  sessionSelectModal.classList.remove('show');

  // Update warning text based on selection
  const warningText = document.querySelector('#killAllModal .alert-text');
  if (selectedSessionIndices.length === 1) {
    warningText.textContent = 'Warning! You are about to delete 1 session! Are you sure?';
  } else {
    warningText.textContent = `Warning! You are about to delete ${selectedSessionIndices.length} sessions! Are you sure?`;
  }

  killAllModal.classList.add('show');
});

// Kill-all confirmation - No
killNoBtn.addEventListener('click', () => {
  killAllModal.classList.remove('show');
  // Reset warning text
  const warningText = document.querySelector('#killAllModal .alert-text');
  warningText.textContent = 'Warning! You are about to wipe out today\'s stats! Are you sure?';
});

// Kill-all confirmation - Yes
killYesBtn.addEventListener('click', () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
  const logFile = path.join(logsDir, `${dateStr}.json`);

  if (fs.existsSync(logFile)) {
    const data = fs.readFileSync(logFile, 'utf8');
    const sessions = JSON.parse(data);

    // Filter out selected sessions (keep the ones NOT selected)
    const remainingSessions = sessions.filter((_, index) => !selectedSessionIndices.includes(index));

    if (remainingSessions.length === 0) {
      // All sessions deleted, remove the file
      fs.unlinkSync(logFile);
    } else {
      // Save remaining sessions back to file
      fs.writeFileSync(logFile, JSON.stringify(remainingSessions, null, 2));
    }
  }

  // Save count before clearing
  const deletedCount = selectedSessionIndices.length;

  // Close modal
  killAllModal.classList.remove('show');

  // Reset warning text
  const warningText = document.querySelector('#killAllModal .alert-text');
  warningText.textContent = 'Warning! You are about to wipe out today\'s stats! Are you sure?';

  // Clear selected indices
  selectedSessionIndices = [];

  // Disable kill-all button again
  killAllBtn.disabled = true;

  // Show success message
  statusText.textContent = deletedCount === 1 ? 'Session deleted!' : `${deletedCount} sessions deleted!`;
  setTimeout(() => {
    statusText.textContent = 'Ready to start';
  }, 2000);
});

// Initialize button states
updateButtonStates('initial');

// Initialize last session display on startup
updateLastSessionDisplay();

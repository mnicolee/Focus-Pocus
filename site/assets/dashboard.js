// Focus Pocus dashboard: renders sessions from the sample dataset, or from
// log files the viewer picks. Picked files are read with FileReader in the
// browser; nothing is sent anywhere.
(function () {
  'use strict';

  const ALERT_MS = 10 * 60 * 1000; // same as ALERT_INTERVAL in renderer.js
  const HOUR = 3600 * 1000;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  let sessions = [];
  let group = 'day';

  // ---------- data ----------
  function clean(list) {
    return list
      .filter(s => s && s.timestamp && typeof s.focusTime === 'number')
      .map(s => {
        const t = new Date(s.timestamp);
        const alerts = s.procrastinationCount || 0;
        const denom = s.focusTime + alerts * ALERT_MS;
        return {
          t,
          focus: s.focusTime,
          alerts,
          pauses: s.pauseCount || 0,
          pauseTime: s.pauseTime || 0,
          rating: typeof s.efficiencyRating === 'number' ? s.efficiencyRating : null,
          measured: denom > 0 ? Math.round((s.focusTime / denom) * 100) : null
        };
      })
      .filter(s => !isNaN(s.t))
      .sort((a, b) => a.t - b.t);
  }

  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function weekStart(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
    return x;
  }
  const fmtDay = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  function fmtDur(ms) {
    const m = Math.round(ms / 60000);
    const h = Math.floor(m / 60);
    return h ? `${h}h ${pad(m % 60)}m` : `${m}m`;
  }

  function buckets() {
    if (!sessions.length) return [];
    const map = new Map();
    const first = group === 'day'
      ? new Date(sessions[0].t.getFullYear(), sessions[0].t.getMonth(), sessions[0].t.getDate())
      : weekStart(sessions[0].t);
    const lastS = sessions[sessions.length - 1].t;
    const last = group === 'day' ? new Date(lastS.getFullYear(), lastS.getMonth(), lastS.getDate()) : weekStart(lastS);
    // include empty days/weeks so gaps are visible
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + (group === 'day' ? 1 : 7))) {
      map.set(dayKey(d), { start: new Date(d), focus: 0, alerts: 0, pauseTime: 0, n: 0 });
    }
    for (const s of sessions) {
      const k = dayKey(group === 'day' ? s.t : weekStart(s.t));
      const b = map.get(k);
      if (!b) continue;
      b.focus += s.focus; b.alerts += s.alerts; b.pauseTime += s.pauseTime; b.n++;
    }
    return [...map.values()];
  }

  // ---------- svg helpers ----------
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceMax(v, step) { return Math.max(step, Math.ceil(v / step) * step); }
  function tip(container) {
    let t = container.querySelector('.tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; container.appendChild(t); }
    return t;
  }
  function placeTip(container, t, svg, x, y, html) {
    const r = svg.getBoundingClientRect();
    const scale = r.width / svg.viewBox.baseVal.width;
    t.innerHTML = html;
    let px = x * scale;
    const w = t.offsetWidth / 2;
    px = Math.min(Math.max(px, w), r.width - w);
    t.style.left = px + 'px';
    t.style.top = (y * scale) + 'px';
    t.classList.add('show');
  }

  // ---------- bar chart ----------
  function drawBars() {
    const box = $('barChart');
    box.innerHTML = '';
    $('barTitle').textContent = group === 'day' ? 'Focus time per day' : 'Focus time per week';
    const data = buckets();
    if (!data.length) { box.textContent = 'No sessions.'; return; }

    const W = Math.max(300, box.clientWidth), H = W < 600 ? 200 : 260, L = 40, R = 8, T = 12, B = 28;
    const peak = Math.max(...data.map(d => d.focus)) / HOUR;
    const step = peak <= 8 ? 2 : peak <= 20 ? 5 : peak <= 50 ? 10 : 20;
    const maxH = niceMax(peak, step);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Bar chart of focus hours per ${group}` }, box);
    const y = h => T + (H - T - B) * (1 - h / maxH);

    for (let h = 0; h <= maxH; h += step) {
      el('line', { x1: L, x2: W - R, y1: y(h), y2: y(h), class: h ? 'gridline' : 'axis' }, svg);
      el('text', { x: L - 8, y: y(h) + 4, 'text-anchor': 'end' }, svg).textContent = `${h}h`;
    }

    const slot = (W - L - R) / data.length;
    const bw = Math.max(2, Math.min(28, slot - 2)); // 2px gap between bars
    const labelEvery = Math.ceil(data.length / Math.max(3, Math.floor(W / 90)));
    const bars = [];
    data.forEach((d, i) => {
      const cx = L + slot * i + slot / 2;
      const hrs = d.focus / HOUR;
      if (hrs > 0) {
        const top = y(hrs), base = y(0), r = Math.min(4, bw / 2, base - top);
        // rounded top, square base
        const x0 = cx - bw / 2, x1 = cx + bw / 2;
        bars[i] = el('path', {
          class: 'bar', fill: 'var(--s1)',
          d: `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x1 - r}Q${x1},${top} ${x1},${top + r}V${base}Z`
        }, svg);
      }
      if (i % labelEvery === 0) {
        el('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }, svg).textContent = fmtDay(d.start);
      }
    });

    const t = tip(box);
    data.forEach((d, i) => {
      const hit = el('rect', { class: 'hit', x: L + slot * i, y: T, width: slot, height: H - T - B }, svg);
      hit.addEventListener('pointerenter', () => {
        box.classList.add('hovering');
        bars.forEach(b => b && b.classList.remove('on'));
        if (bars[i]) bars[i].classList.add('on');
        const label = group === 'day' ? fmtDay(d.start) : `Week of ${fmtDay(d.start)}`;
        const body = d.n
          ? `<b>${fmtDur(d.focus)}</b> focus · ${d.n} session${d.n > 1 ? 's' : ''}<br>${d.alerts} alert${d.alerts === 1 ? '' : 's'} · ${fmtDur(d.pauseTime)} paused`
          : 'No sessions';
        placeTip(box, t, svg, L + slot * i + slot / 2, y(d.focus / HOUR), `${label}<br>${body}`);
      });
    });
    svg.addEventListener('pointerleave', () => { box.classList.remove('hovering'); t.classList.remove('show'); });
  }

  // ---------- line chart ----------
  function drawLines() {
    const box = $('lineChart');
    box.innerHTML = '';
    const data = sessions;
    if (!data.length) { box.textContent = 'No sessions.'; return; }

    const W = Math.max(300, box.clientWidth), H = W < 600 ? 200 : 240, L = 40, R = W < 600 ? 12 : 80, T = 12, B = 28;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart comparing your rating with measured efficiency for each session' }, box);
    const y = v => T + (H - T - B) * (1 - v / 100);
    const x = i => data.length === 1 ? (L + W - R) / 2 : L + (W - L - R) * i / (data.length - 1);

    for (let v = 0; v <= 100; v += 25) {
      el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v ? 'gridline' : 'axis' }, svg);
      el('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = `${v}%`;
    }
    const labelEvery = Math.ceil(data.length / Math.max(3, Math.floor(W / 90)));
    data.forEach((s, i) => {
      if (i % labelEvery === 0) el('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, svg).textContent = fmtDay(s.t);
    });

    const series = [
      { key: 'measured', color: 'var(--s1)', name: 'Measured' },
      { key: 'rating', color: 'var(--s2)', name: 'Your rating' }
    ];
    const lastPts = [];
    for (const ser of series) {
      // break the line where a value is missing
      let d = '', pen = false, last = null;
      data.forEach((s, i) => {
        const v = s[ser.key];
        if (v == null) { pen = false; return; }
        d += `${pen ? 'L' : 'M'}${x(i)},${y(v)}`; pen = true; last = [i, v];
      });
      el('path', { d, fill: 'none', stroke: ser.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      if (last) lastPts.push({ ser, i: last[0], v: last[1] });
    }
    // direct labels at line ends, nudged apart if they collide
    if (W < 600) lastPts.length = 0;
    lastPts.sort((a, b) => y(a.v) - y(b.v));
    let prevY = -Infinity;
    for (const p of lastPts) {
      const ly = Math.max(y(p.v) + 4, prevY + 14);
      prevY = ly;
      el('text', { x: x(p.i) + 8, y: ly, style: 'fill:var(--ink);font-weight:600' }, svg).textContent = p.ser.name;
    }

    // hover: crosshair + markers
    const cross = el('line', { y1: T, y2: H - B, stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    const dots = series.map(ser => el('circle', { r: 5, fill: ser.color, stroke: 'var(--panel)', 'stroke-width': 2, opacity: 0 }, svg));
    const t = tip(box);
    const hit = el('rect', { class: 'hit', x: L - 10, y: T, width: W - L - R + 20, height: H - T - B }, svg);
    hit.addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect();
      const sx = (e.clientX - r.left) * (W / r.width);
      const i = data.length === 1 ? 0 : Math.max(0, Math.min(data.length - 1, Math.round((sx - L) / ((W - L - R) / (data.length - 1)))));
      const s = data[i];
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
      series.forEach((ser, k) => {
        const v = s[ser.key];
        dots[k].setAttribute('opacity', v == null ? 0 : 1);
        if (v != null) { dots[k].setAttribute('cx', x(i)); dots[k].setAttribute('cy', y(v)); }
      });
      const top = Math.min(...series.map(ser => s[ser.key] == null ? 100 : s[ser.key]));
      placeTip(box, t, svg, x(i), y(Math.max(top, s.measured ?? 0, s.rating ?? 0)),
        `${fmtDay(s.t)}, ${s.t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}<br>` +
        `Your rating: <b>${s.rating == null ? 'not rated' : s.rating + '%'}</b><br>Measured: <b>${s.measured}%</b> · ${fmtDur(s.focus)}`);
    });
    hit.addEventListener('pointerleave', () => {
      cross.setAttribute('opacity', 0); dots.forEach(d => d.setAttribute('opacity', 0)); t.classList.remove('show');
    });
  }

  // ---------- tiles + table ----------
  function drawTiles() {
    const total = sessions.reduce((a, s) => a + s.focus, 0);
    const alerts = sessions.reduce((a, s) => a + s.alerts, 0);
    const rated = sessions.filter(s => s.rating != null);
    const avgRating = rated.length ? Math.round(rated.reduce((a, s) => a + s.rating, 0) / rated.length) : null;
    const measured = total + alerts * ALERT_MS > 0 ? Math.round(total / (total + alerts * ALERT_MS) * 100) : null;
    const days = new Set(sessions.map(s => dayKey(s.t))).size;
    const tiles = [
      ['Total focus', fmtDur(total), `${sessions.length} sessions on ${days} days`],
      ['Average session', sessions.length ? fmtDur(total / sessions.length) : '–', `${alerts} alerts in total`],
      ['Measured efficiency', measured == null ? '–' : measured + '%', 'focus ÷ (focus + alert time)'],
      ['Your average rating', avgRating == null ? '–' : avgRating + '%', `${rated.length} of ${sessions.length} sessions rated`]
    ];
    $('tiles').innerHTML = tiles.map(([l, v, s]) =>
      `<div class="tile"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');
  }

  function drawTable() {
    const rows = sessions.slice().reverse().map(s =>
      `<tr><td>${dayKey(s.t)} ${pad(s.t.getHours())}:${pad(s.t.getMinutes())}</td><td>${fmtDur(s.focus)}</td><td>${s.alerts}</td><td>${s.pauses}</td><td>${fmtDur(s.pauseTime)}</td><td>${s.measured}%</td><td>${s.rating == null ? '–' : s.rating + '%'}</td></tr>`);
    $('table').innerHTML = '<thead><tr><th>Started</th><th>Focus</th><th>Alerts</th><th>Pauses</th><th>Paused</th><th>Measured</th><th>Your rating</th></tr></thead><tbody>' + rows.join('') + '</tbody>';
  }

  function render() { drawTiles(); drawBars(); drawLines(); drawTable(); }

  function setData(list, mine) {
    sessions = clean(list);
    $('source').classList.toggle('mine', mine);
    $('sourceLabel').textContent = mine ? `Your logs · ${sessions.length} sessions (only in this tab)` : 'Sample data';
    $('backToSample').hidden = !mine;
    render();
  }

  // ---------- loading the viewer's own files ----------
  async function loadFiles(files) {
    const err = $('err');
    err.hidden = true;
    const logs = [...files].filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name));
    if (!logs.length) {
      err.textContent = 'No Focus Pocus log files found. They are named like 2026-01-15.json and live in Documents/FocusPocus/logs.';
      err.hidden = false;
      return;
    }
    const all = [];
    let bad = 0;
    for (const f of logs) {
      try {
        const v = JSON.parse(await f.text());
        if (Array.isArray(v)) all.push(...v); else bad++;
      } catch { bad++; }
    }
    setData(all, true);
    if (bad) { err.textContent = `Skipped ${bad} file${bad > 1 ? 's' : ''} that could not be read.`; err.hidden = false; }
  }

  $('pick').addEventListener('change', e => loadFiles(e.target.files));
  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); loadFiles(e.dataTransfer.files); });
  $('backToSample').addEventListener('click', () => { $('err').hidden = true; setData(window.FP_SAMPLE || [], false); });

  document.querySelectorAll('[data-group]').forEach(b => b.addEventListener('click', () => {
    group = b.dataset.group;
    document.querySelectorAll('[data-group]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    drawBars();
  }));

  let lastW = 0, raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const w = $('barChart').clientWidth;
      if (w !== lastW) { lastW = w; drawBars(); drawLines(); }
    });
  });

  setData(window.FP_SAMPLE || [], false);
  lastW = $('barChart').clientWidth;
})();

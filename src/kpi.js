// KPI definitions, derived values and early-warning rules.
import { buildWeek, addDays, weekOfDate, weekStartDate, todayStr, parseDate } from "./program.js";

export const DEFAULT_CSS = 113; // 1:53/100m from the 18:53 1000 m TT (pre-break, stale)

// ── Test / KPI definitions ───────────────────────────────────
// better: "up" | "down" ; fmt: "time" for mm:ss
export const TEST_DEFS = {
  ftp: { label: "FTP", unit: "W", better: "up", group: "Bike", target: "220–230 W by Apr 2027 · 240–250 W by Oct 2027" },
  wkg: { label: "W/kg", unit: "W/kg", better: "up", group: "Bike", derived: true, target: "≈2.6–2.7 at 85 kg by Sabie" },
  decoupling: { label: "Aerobic decoupling", unit: "%", better: "down", group: "Bike", target: "< 5% on a 60-min steady Z2 block" },
  css: { label: "CSS", unit: "/100m", better: "down", fmt: "time", group: "Swim", target: "Below 1:53 again by Feb" },
  strokes25: { label: "Strokes per 25 m at CSS", unit: "", better: "down", group: "Swim", target: "Fewer at the same pace" },
  pushups: { label: "Max push-ups", unit: "reps", better: "up", group: "Strength", target: "Up each test" },
  ringpullups: { label: "Ring pull-ups", unit: "reps", better: "up", group: "Strength", target: "5+ by Feb, 8+ by winter" },
  goblet20: { label: "20 kg goblet squat (3 s down)", unit: "reps", better: "up", group: "Strength", target: "20+ means move on" },
  press20: { label: "20 kg press (weaker side)", unit: "reps", better: "up", group: "Strength", target: "8+ per side" },
  swings5: { label: "20 kg swings in 5 min", unit: "reps", better: "up", group: "Strength", target: "100+" },
  e1rm_squat: { label: "Back squat e1RM", unit: "kg", better: "up", group: "Gym", target: "Set after week 32" },
  e1rm_trapbar: { label: "Trap-bar deadlift e1RM", unit: "kg", better: "up", group: "Gym", target: "Set after week 32" },
  e1rm_bench: { label: "Bench press e1RM", unit: "kg", better: "up", group: "Gym", target: "Set after week 32" },
  pullup: { label: "Pull-up max reps", unit: "reps", better: "up", group: "Gym", target: "10+" },
  ktw: { label: "Knee-to-wall (worse side)", unit: "cm", better: "up", group: "Mobility", target: "≥ 10 cm" },
  ktwgap: { label: "Knee-to-wall side gap", unit: "cm", better: "down", group: "Mobility", target: "< 2 cm" },
  aslr: { label: "Straight-leg raise score", unit: "/3", better: "up", group: "Mobility", target: "3" },
  overhead: { label: "Overhead reach score", unit: "/3", better: "up", group: "Mobility", target: "3" },
  squathold: { label: "Deep squat hold", unit: "s", better: "up", group: "Mobility", target: "60 s" },
  weight: { label: "Weight (7-day avg)", unit: "kg", better: "down", group: "Body", derived: true, target: "< 85 kg by Dec, then hold" },
  waist: { label: "Waist at navel", unit: "cm", better: "down", group: "Body", target: "Down while lifts hold" },
  ferritin: { label: "Ferritin", unit: "ng/mL", better: "down", group: "Body", target: "30–400" },
  alt: { label: "ALT", unit: "IU/L", better: "down", group: "Body", target: "< 50" },
  rhr: { label: "Resting HR (7-day avg)", unit: "bpm", better: "down", group: "Body", derived: true, target: "Trending down" },
};
export const TEST_GROUPS = ["Bike", "Swim", "Strength", "Gym", "Mobility", "Body"];

// Which inputs each test session records
export const TEST_FORMS = {
  ftp: [{ key: "ftp", label: "FTP from Zwift (W)" }],
  css: [{ key: "_t400", label: "400 m time (m:ss)", time: true }, { key: "_t200", label: "200 m time (m:ss)", time: true }, { key: "strokes25", label: "Strokes per 25 m at CSS pace (optional)" }],
  strength: [
    { key: "pushups", label: "Max push-ups" }, { key: "ringpullups", label: "Ring pull-ups" },
    { key: "goblet20", label: "20 kg goblet squat reps" }, { key: "press20", label: "20 kg press, weaker side" }, { key: "swings5", label: "Swings in 5 min" },
  ],
  gym: [
    { key: "_squat", label: "Back squat (kg × reps)", wr: true }, { key: "_trapbar", label: "Trap-bar DL (kg × reps)", wr: true },
    { key: "_bench", label: "Bench (kg × reps)", wr: true }, { key: "pullup", label: "Pull-up max reps" },
  ],
  mobility: [
    { key: "_ktwl", label: "Knee-to-wall left (cm)" }, { key: "_ktwr", label: "Knee-to-wall right (cm)" },
    { key: "aslr", label: "Straight-leg raise score (1–3)" }, { key: "overhead", label: "Overhead reach score (1–3)" }, { key: "squathold", label: "Deep squat hold (s)" },
  ],
  body: [
    { key: "waist", label: "Waist at navel (cm)" }, { key: "decoupling", label: "Aerobic decoupling (%)" },
    { key: "ferritin", label: "Ferritin (ng/mL)" }, { key: "alt", label: "ALT (IU/L)" },
  ],
};

export function parseTime(s) {
  if (!s) return null;
  const p = String(s).trim().split(":");
  if (p.length === 2) return Number(p[0]) * 60 + Number(p[1]);
  const n = Number(s); return isNaN(n) ? null : n;
}
export const e1rm = (w, r) => (w && r ? Math.round(w * (1 + r / 30) * 10) / 10 : null);

// Turn a test form's raw inputs into stored test results
export function resultsFromForm(kind, raw) {
  const out = {};
  const num = k => (raw[k] === "" || raw[k] == null ? null : Number(raw[k]));
  if (kind === "css") {
    const t4 = parseTime(raw._t400), t2 = parseTime(raw._t200);
    if (t4 && t2 && t4 > t2) out.css = Math.round(((t4 - t2) / 2) * 10) / 10;
    if (num("strokes25")) out.strokes25 = num("strokes25");
  } else if (kind === "gym") {
    ["squat", "trapbar", "bench"].forEach(l => {
      const m = String(raw["_" + l] || "").match(/([\d.]+)\s*[x×*]\s*(\d+)/i);
      if (m) out["e1rm_" + l] = e1rm(Number(m[1]), Number(m[2]));
    });
    if (num("pullup") != null) out.pullup = num("pullup");
  } else if (kind === "mobility") {
    const l = num("_ktwl"), r = num("_ktwr");
    if (l != null && r != null) { out.ktw = Math.min(l, r); out.ktwgap = Math.abs(l - r); }
    ["aslr", "overhead", "squathold"].forEach(k => { if (num(k) != null) out[k] = num(k); });
  } else {
    (TEST_FORMS[kind] || []).forEach(f => { if (!f.key.startsWith("_") && num(f.key) != null) out[f.key] = num(f.key); });
  }
  return out;
}

// ── Series & current values ─────────────────────────────────
export function series(v2, key) {
  if (key === "weight") return weeklyDailyAvg(v2, "weight");
  if (key === "rhr") return weeklyDailyAvg(v2, "rhr");
  if (key === "wkg") {
    const f = series(v2, "ftp");
    return f.map(p => { const wt = weightOn(v2, p.date); return wt ? { date: p.date, value: Math.round((p.value / wt) * 100) / 100 } : null; }).filter(Boolean);
  }
  return (v2.tests || []).filter(t => t.key === key).sort((a, b) => a.date.localeCompare(b.date)).map(t => ({ date: t.date, value: t.value }));
}
function weeklyDailyAvg(v2, field) {
  const byWeek = {};
  Object.entries(v2.daily || {}).forEach(([d, e]) => {
    if (e && e[field] != null && e[field] !== "") { const w = weekOfDate(d); (byWeek[w] = byWeek[w] || []).push(Number(e[field])); }
  });
  return Object.keys(byWeek).map(Number).sort((a, b) => a - b).map(w => ({ date: weekStartDate(w), value: Math.round(avg(byWeek[w]) * 10) / 10 }));
}
export function weightOn(v2, date) {
  const vals = [];
  for (let i = 0; i < 7; i++) { const e = (v2.daily || {})[addDays(date, -i)]; if (e && e.weight) vals.push(Number(e.weight)); }
  return vals.length ? avg(vals) : (v2.settings?.weight || 87);
}
export function latest(v2, key) { const s = series(v2, key); return s.length ? s[s.length - 1].value : null; }
// Only tests from this plan count: a pre-break FTP would overstate every zone.
export function currentFtp(v2) { return latest(v2, "ftp"); }
export function currentCss(v2) { return latest(v2, "css") || DEFAULT_CSS; }
export function cssIsStale(v2) { return !latest(v2, "css"); }

// ── Weekly process KPIs ─────────────────────────────────────
const ENDURANCE = ["bike", "swim", "race"];
export function weekSummary(v2, w, ctx) {
  const plan = buildWeek(w, ctx);
  const logs = v2.logs || {};
  const required = plan.filter(s => !s.optional);
  let done = 0, plannedMin = 0, doneMin = 0, load = 0, endMin = 0, hardMin = 0;
  required.forEach(s => { plannedMin += s.minutes || 0; });
  plan.forEach(s => {
    const l = logs[s.id];
    if (l && l.status === "done") {
      if (!s.optional) done++;
      const m = Number(l.min) || s.minutes || 0;
      doneMin += m; load += m * (Number(l.rpe) || s.rpe || 5);
      if (ENDURANCE.includes(s.type) || (s.type === "test" && ["ftp", "css"].includes(s.test))) {
        endMin += m; hardMin += Math.min(m, s.hardMin || 0);
      }
    }
  });
  const ws = weekStartDate(w);
  const days = Array.from({ length: 7 }, (_, i) => (v2.daily || {})[addDays(ws, i)]).filter(Boolean);
  const pick = f => days.map(d => d[f]).filter(x => x != null && x !== "").map(Number);
  return {
    week: w, planned: required.length, done, completion: required.length ? done / required.length : 0,
    plannedMin, doneMin, load: Math.round(load), easyShare: endMin ? 1 - hardMin / endMin : null,
    mobilityDays: days.filter(d => d.mobility).length, proteinDays: days.filter(d => d.protein).length,
    sleep: pick("sleep").length ? avg(pick("sleep")) : null, ready: pick("ready").length ? avg(pick("ready")) : null,
    rhr: pick("rhr").length ? avg(pick("rhr")) : null, checkins: days.length,
  };
}
export function rampPct(v2, w, ctx) {
  const cur = weekSummary(v2, w, ctx).load;
  const prev = [1, 2, 3].map(i => w - i).filter(x => x >= 1).map(x => weekSummary(v2, x, ctx).load).filter(x => x > 0);
  if (!prev.length || !cur) return null;
  return cur / avg(prev) - 1;
}

// ── Early warnings ──────────────────────────────────────────
export function warnings(v2, ctx, legacy) {
  const out = [];
  const today = todayStr();
  const daily = v2.daily || {};
  // 1 · Resting HR up ≥5 bpm for 3 days vs a 14-day baseline
  const base = []; for (let i = 4; i <= 17; i++) { const e = daily[addDays(today, -i)]; if (e?.rhr) base.push(Number(e.rhr)); }
  if (base.length >= 5) {
    const b = median(base);
    const last3 = [0, 1, 2].map(i => daily[addDays(today, -i)]?.rhr).map(Number);
    if (last3.every(x => x && x >= b + 5)) out.push({ level: "red", text: `Resting HR is ${Math.round(avg(last3) - b)} bpm above your baseline for 3 days. Likely fatigue or illness: make today easy or rest.` });
  }
  // 2 · Readiness ≤2 two days running
  const r0 = daily[today]?.ready, r1 = daily[addDays(today, -1)]?.ready;
  if (r0 && r1 && r0 <= 2 && r1 <= 2) out.push({ level: "amber", text: "Readiness low two days running. Swap today's hard session for an easy one or rest." });
  // 3 · Same pain area in the last two logs (sessions or check-ins)
  const painEvents = [];
  Object.entries(daily).forEach(([d, e]) => { if (e?.pain?.length) painEvents.push({ date: d, areas: e.pain }); });
  Object.values(v2.logs || {}).forEach(l => { if (l?.pain?.length) painEvents.push({ date: l.date, areas: l.pain }); });
  painEvents.sort((a, b) => b.date.localeCompare(a.date));
  const recent = painEvents.filter(p => (parseDate(today) - parseDate(p.date)) / 86400000 <= 10);
  if (recent.length >= 2) {
    const common = recent[0].areas.filter(a => recent[1].areas.includes(a));
    if (common.length) out.push({ level: "red", text: `${common.join(", ")} pain logged twice in a row. Stop progressing exercises that load it; if it persists a week, get it checked.` });
  }
  // 4 · Lifts going backwards two sessions running
  const liftHist = {};
  Object.values(v2.logs || {}).filter(l => l?.lifts && l.status === "done").sort((a, b) => a.date.localeCompare(b.date)).forEach(l => {
    Object.entries(l.lifts).forEach(([ex, v]) => {
      const sc = v.w ? e1rm(Number(v.w), Number(v.r)) : Number(v.r);
      if (sc) (liftHist[ex] = liftHist[ex] || []).push(sc);
    });
  });
  const dropping = Object.entries(liftHist).filter(([, h]) => h.length >= 3 && h[h.length - 1] < h[h.length - 2] && h[h.length - 2] < h[h.length - 3]).map(([ex]) => ex);
  if (dropping.length) out.push({ level: "amber", text: `Lifts going backwards two sessions running (${dropping.length}). Eat ~150 kcal more and check your sleep.`, lifts: dropping });
  // 5 · Load ramp on the last complete week
  const cw = weekOfDate(today);
  if (cw > 1) {
    const r = rampPct(v2, cw - 1, ctx);
    if (r != null && r > 0.2) out.push({ level: "amber", text: `Last week's load was ${Math.round(r * 100)}% above your 3-week average. Hold this week at plan, don't add extra.` });
  }
  // 6 · Blood test window
  const bt = v2.settings?.bloodTest;
  if (bt) {
    const dd = (parseDate(bt) - parseDate(today)) / 86400000;
    if (dd >= 0 && dd <= 5) out.push({ level: "red", text: `Blood test in ${dd} day${dd === 1 ? "" : "s"}: no lifting or hard intervals until after the draw. Easy Z2 only.` });
  }
  // 7 · Missing baselines
  if (!currentFtp(v2, legacy) && cw >= 4) out.push({ level: "info", text: "No FTP recorded yet. Do the Zwift ramp test so bike zones show watts." });
  if (cssIsStale(v2) && cw >= 4) out.push({ level: "info", text: "Swim zones still use your old 1:53 CSS. Do the CSS test." });
  return out;
}

function avg(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function median(a) { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

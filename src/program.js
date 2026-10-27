// ─────────────────────────────────────────────────────────────
// Tri Trainer · Season plan Nov 2026 – Nov 2027
// Restart → Summer base → Sabie build → Recover → Gym ramp →
// Winter strength → W2W build. Calendar weeks start on Mondays.
// Everything here is pure data/generators: no React.
// ─────────────────────────────────────────────────────────────

export const PLAN_START = "2026-11-02"; // Monday, week 1
export const TOTAL_WEEKS = 53;

// ── Dates ────────────────────────────────────────────────────
export function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
export function fmtDate(d) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return fmtDate(d); }
export function todayStr() { return fmtDate(new Date()); }
export function weekStartDate(w) { return addDays(PLAN_START, (w - 1) * 7); }
export function weekOfDate(s) {
  const diff = Math.round((parseDate(s) - parseDate(PLAN_START)) / 86400000);
  return Math.floor(diff / 7) + 1;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(s) { const d = parseDate(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Zones ────────────────────────────────────────────────────
export function secToMMSS(s) {
  if (s == null || isNaN(s)) return "–";
  const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
}
export function swimZones(css) {
  return [
    { key: "Z1", label: "Z1 Easy", pace: `${secToMMSS(css + 12)}+`, color: "#888" },
    { key: "Z2", label: "Z2 Aerobic", pace: `${secToMMSS(css + 6)}–${secToMMSS(css + 12)}`, color: "#00D4FF" },
    { key: "Z3", label: "Z3 Threshold", pace: `${secToMMSS(css - 2)}–${secToMMSS(css + 3)}`, color: "#00FF9D" },
    { key: "Z4", label: "Z4 Speed", pace: `≤${secToMMSS(css - 4)}`, color: "#FF6B35" },
  ];
}
export const BIKE_ZONES = [
  { key: "Z1", label: "Z1 Recovery", lo: 0, hi: 55 },
  { key: "Z2", label: "Z2 Endurance", lo: 56, hi: 75 },
  { key: "Z3", label: "Z3 Tempo", lo: 76, hi: 87 },
  { key: "SS", label: "Sweet spot", lo: 88, hi: 94 },
  { key: "Z4", label: "Z4 Threshold", lo: 95, hi: 105 },
  { key: "Z5", label: "Z5 VO2max", lo: 106, hi: 120 },
  { key: "Z6", label: "Z6 Anaerobic", lo: 121, hi: 150 },
];
function pw(lo, hi, ftp) {
  return ftp ? `${lo}–${hi}% · ${Math.round(lo * ftp / 100)}–${Math.round(hi * ftp / 100)} W` : `${lo}–${hi}% FTP`;
}

// ── Phases ───────────────────────────────────────────────────
export const PHASES = [
  {
    id: "restart", name: "Restart", from: 1, to: 8, season: "Summer", color: "#A78BFA",
    goal: "Rebuild the habit and the aerobic base without getting hurt.",
    template: "Strength 2 · Bike 2 · Swim 2 · ~5–6 h",
    why: "Bike and swim stay almost all easy for 4 weeks: aerobic fitness comes back fast, tendons and shoulders more slowly. Workouts A & B carry on unchanged. FTP and CSS get retested in week 3 so every zone after that is your own.",
  },
  {
    id: "summer", name: "Summer Base", from: 9, to: 16, season: "Summer", color: "#00D4FF",
    goal: "Build the engine: sweet spot and threshold on the bike, CSS work in the pool, strength held with harder kettlebell variations.",
    template: "Strength 2 · Bike 2 (+1 optional) · Swim 2 · ~6–7 h",
    why: "About 80% of bike and swim time stays easy, with one quality ride a week. The long ride moves outdoors onto the MTB so skills develop alongside fitness.",
  },
  {
    id: "sabie", name: "Sabie Build", from: 17, to: 26, season: "Summer", color: "#FBBF24",
    goal: "Get race-ready for Sabie Lite (29 Apr–1 May): 3-hour MTB rides, back-to-back weekends, climbing and surge intervals, then a 2-week taper.",
    template: "Strength 2 (maintenance) · Bike 3 · Swim 1 · ~7–8 h",
    why: "A stage race is decided by how you ride on day 2 and 3, so back-to-back weekends are the key session. Strength drops to maintenance: 2 short sessions hold it. The taper cuts volume ~40–60% but keeps short efforts at race intensity.",
  },
  {
    id: "recover", name: "Recover", from: 27, to: 28, season: "Autumn", color: "#888",
    goal: "Two easy weeks after Sabie. Ride for fun, swim, move.",
    template: "4 easy sessions · ~3–4 h",
    why: "A short planned break after the first stage race lets the body absorb the block and resets motivation before winter.",
  },
  {
    id: "gymramp", name: "Gym Ramp", from: 29, to: 32, season: "Winter", color: "#FF6B35",
    goal: "Learn (or relearn) the barbell lifts at moderate loads before the strength block.",
    template: "Strength 3 · Bike 2 · Swim 1 · ~6 h",
    why: "After years away from barbells, technique comes first. Loads stay 2–3 reps short of failure. Week 32 sets your starting e1RMs.",
  },
  {
    id: "winter", name: "Winter Strength", from: 33, to: 42, season: "Winter", color: "#FF6B35",
    goal: "Get strong: 3 gym sessions a week in 4-week waves, while bike and swim hold fitness.",
    template: "Strength 3 · Bike 2 · Swim 1 (+1 optional) · ~6–7 h",
    why: "Endurance is maintained with 2 rides a week as long as one keeps its intensity. Heavy lifting on separate days from the bike intervals avoids most of the interference effect.",
  },
  {
    id: "w2w", name: "W2W Build", from: 43, to: 53, season: "Spring", color: "#00FF9D",
    goal: "Build for Wines2Whales (~200 km, ~4,500 m in 3 days): long climbs, back-to-back days, the Heritage Day rehearsal, then a taper.",
    template: "Strength 2 (maintenance) · Bike 3–4 · Swim 1 · ~7–8 h, 8–9 h in Oct",
    why: "W2W is about twice the load of Sabie Lite, so this block is longer and peaks higher: three weeks at 8–9 h. Strength stays at 2 heavy, short sessions so you don't lose the winter gains.",
  },
];
export function phaseOf(w) { return PHASES.find(p => w >= p.from && w <= p.to) || null; }

// Week types: build · deload · test · taper · race · recover · reduced
const WEEK_TYPES = {
  4: "deload", 8: "deload", 12: "deload", 16: "test", 20: "deload", 24: "reduced", 25: "taper", 26: "race",
  27: "recover", 28: "recover", 32: "test", 36: "deload", 40: "test", 46: "deload", 47: "rehearsal", 48: "recover",
  52: "taper", 53: "race",
};
export function weekType(w) { if (w === 3) return "test"; return WEEK_TYPES[w] || "build"; }
export const WEEK_TYPE_META = {
  build: { label: "Build", color: "#00D4FF" },
  deload: { label: "Deload", color: "#A78BFA" },
  test: { label: "Test week", color: "#FBBF24" },
  reduced: { label: "Reduced", color: "#A78BFA" },
  taper: { label: "Taper", color: "#A78BFA" },
  race: { label: "Race week", color: "#FF4D6D" },
  recover: { label: "Recover", color: "#888" },
  rehearsal: { label: "Rehearsal", color: "#FF4D6D" },
};

export const MILESTONES = [
  { week: 3, text: "FTP ramp test and CSS test: all zones update" },
  { week: 4, text: "Strength rep tests (baseline)" },
  { week: 16, text: "Retest everything" },
  { week: 19, text: "Checkpoint: 3-hour outdoor MTB ride" },
  { week: 23, text: "Checkpoint: back-to-back weekend, Sabie simulation" },
  { week: 26, text: "Sabie Xperience Lite · 29 Apr–1 May" },
  { week: 32, text: "Starting e1RMs for the gym lifts" },
  { week: 40, text: "Retest everything" },
  { week: 47, text: "DIY stage race rehearsal · 24–26 Sep" },
  { week: 53, text: "Wines2Whales (confirm edition dates)" },
];

// ── Exercise library (strength) ─────────────────────────────
// key → name, default load, cue, next step. `ex` keys are used for logging.
const EX = {
  goblet: { name: "Goblet squat", load: "20 kg", cue: "3 s down, sit between your heels", next: "3 s down + 2 s pause, then rear-foot-elevated split squat 20 kg" },
  kbrdl: { name: "KB Romanian deadlift", load: "20 kg", cue: "Push the hips back, flat back, stop at hamstring tension", next: "Single-leg RDL 16 kg, then 20 kg" },
  pushup: { name: "Push-up", load: "BW", cue: "Body in one line, elbows ~45°", next: "Ring push-up, then feet-elevated ring push-up" },
  ringrow: { name: "Ring row", load: "BW", cue: "Pull rings to lower chest, squeeze shoulder blades", next: "Walk feet forward, then feet up on a chair" },
  farmer: { name: "Farmer's carry", load: "16 + 20 kg", cue: "Tall, short steps, swap hands each set", next: "60 m, then both bells in one hand" },
  plank: { name: "Plank", load: "BW", cue: "Glutes squeezed, brace, stop when hips sag", next: "60 s, then lift one foot 5 s at a time" },
  swing: { name: "KB swing", load: "20 kg", cue: "Hinge, hike, snap the hips. Arms are ropes", next: "10 × 15 EMOM, then one-arm swings" },
  revlunge: { name: "Reverse lunge", load: "16 kg", cue: "Front shin vertical, push through front heel", next: "Hold both bells (16 + 20 kg)" },
  kbrow: { name: "One-arm KB row", load: "20 kg", cue: "Pull to the hip, elbow close", next: "2 s pause at the top, then +2 reps" },
  hkpress: { name: "Half-kneeling press", load: "16 kg", cue: "Squeeze the down-leg glute, don't lean back", next: "20 kg, then +2 reps" },
  bridge: { name: "KB glute bridge", load: "20 kg", cue: "Drive through heels, 1 s squeeze", next: "Single-leg bridge BW, then 16 kg" },
  deadbug: { name: "Dead bug", load: "BW", cue: "Low back pressed down, slow", next: "Hold a light bell, then 3 s each way" },
  // summer progressions
  rfess: { name: "Rear-foot-elevated split squat", load: "20 kg", cue: "Back foot laces-down on a bench, drop straight down", next: "Add a 2 s pause, then hold 16 + 20 kg" },
  slrdl: { name: "Single-leg RDL", load: "20 kg", cue: "Bell in opposite hand, hips level", next: "3 s lowering, then +2 reps" },
  ringpush: { name: "Feet-elevated ring push-up", load: "BW", cue: "Rings turned out at the top", next: "Slow 3 s lowering, then ring dips" },
  ringpull: { name: "Ring pull-up (or feet-up ring row)", load: "BW", cue: "Full hang to chest-to-rings", next: "Add reps, then a weighted vest or bell between feet" },
  jump: { name: "Box jump or broad jump", load: "BW", cue: "Max intent, stick the landing, full rest", next: "Hold the 16 kg (broad jump only)" },
  suitcase: { name: "Suitcase carry", load: "20 kg", cue: "One bell, don't lean", next: "60 m per side" },
  sideplank: { name: "Side plank", load: "BW", cue: "Hips high, straight line", next: "Top-leg raise" },
  swing1: { name: "One-arm swing", load: "20 kg", cue: "Alternate arms each set, EMOM", next: "Hand-to-hand switches" },
  tgu: { name: "Turkish get-up", load: "16 kg", cue: "Eyes on the bell, slow and smooth", next: "20 kg" },
  hkpress20: { name: "Half-kneeling press", load: "20 kg", cue: "Ribs down, bicep by the ear", next: "Standing press, then +2 reps" },
  kbrowpause: { name: "One-arm KB row, 2 s pause", load: "20 kg", cue: "Pause at the hip", next: "Rings: archer row" },
  slbridge: { name: "Single-leg glute bridge", load: "16 kg", cue: "Hips level", next: "Shoulders on a bench (hip thrust)" },
  copenhagen: { name: "Copenhagen plank (short lever)", load: "BW", cue: "Knee on the bench, hips up", next: "Long lever (foot on bench)" },
  deadbugkb: { name: "Dead bug holding a bell", load: "8–16 kg", cue: "Back flat on the floor", next: "3 s each way" },
  // gym
  squat: { name: "Back squat", load: "Barbell", cue: "Brace, hips and knees together, depth you own", next: "+2.5–5 kg when all sets hit target reps at the RIR" },
  bench: { name: "Bench press", load: "Barbell", cue: "Shoulder blades pinned, touch low chest", next: "+2.5 kg when all sets hit target" },
  dbrow: { name: "Chest-supported DB row", load: "DB", cue: "Pull elbows to hips", next: "+2 kg" },
  bss: { name: "Bulgarian split squat", load: "DB", cue: "Vertical torso, front heel down", next: "+2 kg per hand" },
  pallof: { name: "Pallof press", load: "Cable/band", cue: "Resist the twist, 2 s hold", next: "Half-kneeling" },
  trapbar: { name: "Trap-bar deadlift", load: "Barbell", cue: "Push the floor away, chest up", next: "+5 kg when all sets hit target" },
  pullup: { name: "Pull-up (weighted when 3×8)", load: "BW+", cue: "Full hang, chest to bar", next: "+2.5 kg on a belt" },
  ohp: { name: "Standing overhead press", load: "Barbell", cue: "Glutes tight, head through at the top", next: "+2.5 kg" },
  dbslrdl: { name: "Single-leg RDL", load: "DB", cue: "Hips level", next: "+2 kg" },
  heavycarry: { name: "Heavy farmer's carry", load: "DB/trap bar", cue: "Tall and tight", next: "+5 kg" },
  boxjump: { name: "Box jump", load: "BW", cue: "Max height you can land softly, step down", next: "Higher box" },
  hipthrust: { name: "Barbell hip thrust", load: "Barbell", cue: "Chin tucked, full lockout", next: "+5 kg" },
  inclinedb: { name: "Incline DB press", load: "DB", cue: "30° bench, control the bottom", next: "+2 kg" },
  pulldown: { name: "Lat pulldown or chin-up", load: "Cable", cue: "Elbows to ribs", next: "+2.5 kg" },
  stepup: { name: "Step-up (knee height)", load: "DB", cue: "Drive through the top foot only", next: "+2 kg" },
};

function lift(key, sets, reps, rest, extra = {}) {
  const e = EX[key];
  return { ex: key, name: e.name, load: extra.load || e.load, sets, reps, rest, cue: e.cue, next: e.next, ...extra };
}
const div = label => ({ divider: true, name: label });

const KB_WARMUP = { name: "Warm-up · 6–8 min", detail: "2 min marching or jumping jacks · 10 BW squats · 10 hip hinges · 10 arm circles each way · 5 inchworms · 10 light swings + 5 goblet squats (16 kg)" };
const GYM_WARMUP = { name: "Warm-up · 8–10 min", detail: "5 min easy bike or row · 10 BW squats · 10 hip hinges · band pull-aparts × 15 · then 2–4 ramp-up sets on the first lift" };

// ── Strength generators ─────────────────────────────────────
function kbA(sets) {
  return [KB_WARMUP, div("Main"),
    lift("goblet", sets, "8–12", "90 s"), lift("kbrdl", sets, "10–12", "90 s"),
    lift("pushup", sets, "6–15", "90 s"), lift("ringrow", sets, "8–12", "90 s"),
    lift("farmer", sets, "40 m", "60 s"), lift("plank", sets, "30–45 s", "60 s")];
}
function kbB(sets) {
  return [KB_WARMUP, div("Main"),
    lift("swing", sets + 2, "15", "60 s"), lift("revlunge", sets, "8 / leg", "90 s"),
    lift("kbrow", sets, "10 / arm", "60 s"), lift("hkpress", sets, "6–10 / arm", "90 s"),
    lift("bridge", sets, "15", "60 s"), lift("deadbug", sets, "8 / side", "60 s")];
}
function kbAplus(sets) {
  return [KB_WARMUP, div("Power"), lift("jump", 3, "3", "90 s"), div("Main"),
    lift("rfess", sets, "6–10 / leg", "2 min"), lift("slrdl", sets, "6–10 / leg", "90 s"),
    lift("ringpush", sets, "6–12", "2 min"), lift("ringpull", sets + 1, "3–8", "2 min"),
    lift("suitcase", sets, "30 m / side", "60 s"), lift("sideplank", 2, "30–45 s / side", "45 s")];
}
function kbBplus(sets) {
  return [KB_WARMUP, div("Main"),
    lift("swing1", sets * 2, "10 (EMOM)", "rest of minute"), lift("tgu", sets, "2 / side", "as needed"),
    lift("hkpress20", sets, "5–8 / arm", "90 s"), lift("kbrowpause", sets, "8–12 / arm", "60 s"),
    lift("slbridge", sets, "10 / leg", "60 s"), lift("copenhagen", 2, "20 s / side", "45 s"),
    lift("deadbugkb", sets, "8 / side", "60 s")];
}
function gymA(sets, reps, rir) {
  return [GYM_WARMUP, div(`Main · ${rir}`),
    lift("squat", sets, reps, "2–3 min"), lift("bench", sets, reps, "2–3 min"),
    div("Accessories"), lift("dbrow", 3, "8–10", "90 s"), lift("bss", 2, "8 / leg", "90 s"), lift("pallof", 2, "10 / side", "60 s")];
}
function gymB(sets, reps, rir) {
  return [GYM_WARMUP, div(`Main · ${rir}`),
    lift("trapbar", sets, reps, "2–3 min"), lift("pullup", sets, reps === "8" ? "5–8" : reps, "2 min"), lift("ohp", sets - 1, reps, "2 min"),
    div("Accessories"), lift("dbslrdl", 2, "8 / leg", "90 s"), lift("heavycarry", 3, "30 m", "90 s")];
}
function gymC(sets) {
  return [GYM_WARMUP, div("Power"), lift("boxjump", 4, "3", "90 s"), div("Main · 2 RIR"),
    lift("hipthrust", sets, "8", "2 min"), lift("inclinedb", sets, "8–10", "90 s"), lift("pulldown", sets, "8–10", "90 s"),
    lift("stepup", 3, "8 / leg", "90 s"), lift("tgu", 2, "2 / side", "as needed"), lift("copenhagen", 2, "20 s / side", "45 s")];
}

function strengthSession(slot, title, blocks, minutes, rpe, extra = {}) {
  return { slot, type: "strength", title, blocks, minutes, rpe, hardMin: 0, ...extra };
}

// ── Bike generators ─────────────────────────────────────────
function z2Ride(slot, minutes, ftp, extra = {}) {
  const main = minutes - 15;
  return {
    slot, type: "bike", title: extra.title || `Endurance · ${fmtMin(minutes)}`, minutes, rpe: extra.rpe || 3, hardMin: 0,
    zwift: extra.zwift || "Free ride or a flat route in Zwift. ERG off.",
    blocks: [
      { name: "Warm-up", detail: `10 min building from Z1 to Z2` },
      { name: "Endurance", detail: `${main} min steady Z2 · ${pw(56, 75, ftp)} · 85–95 rpm` },
      ...(extra.addBlocks || []),
      { name: "Cool-down", detail: "5 min easy" },
    ],
    notes: extra.notes || ["Conversational effort: you could talk in full sentences."],
    ...(extra.optional ? { optional: true } : {}),
  };
}
function intervals(slot, title, set, ftp, { minutes, hardMin, rpe = 7, notes = [] }) {
  return {
    slot, type: "bike", title, minutes, hardMin, rpe,
    zwift: "Build this as a custom workout in Zwift (or pick the closest one) and ride it in ERG mode.",
    blocks: [
      { name: "Warm-up", detail: `12 min building Z1 → Z2, then 3 × 30 s at ~110% · ${ftp ? Math.round(1.1 * ftp) + " W" : ""} with 1 min easy` },
      ...set(ftp),
      { name: "Cool-down", detail: "8–10 min easy Z1" },
    ],
    notes,
  };
}
const SS = (n, len) => ftp => [{ name: `Sweet spot ${n} × ${len} min`, detail: `${pw(88, 94, ftp)} · ${len >= 12 ? 5 : 4} min easy between · 85–95 rpm` }];
const THR = (n, len) => ftp => [{ name: `Threshold ${n} × ${len} min`, detail: `${pw(95, 100, ftp)} · ${Math.round(len / 2)} min easy between` }];
const VO2 = (n, len) => ftp => [{ name: `VO2max ${n} × ${len} min`, detail: `${pw(110, 118, ftp)} · ${len} min easy between · high cadence 95–105 rpm` }];
const OU = (n) => ftp => [{ name: `Over-unders ${n} × 9 min`, detail: `Each 9 min = 3 × (2 min at ${pw(92, 95, ftp)} + 1 min at ${pw(105, 108, ftp)}) · 5 min easy between blocks` }];
const SURGE = (n) => ftp => [{ name: `30/30s · ${n} sets × 10 reps`, detail: `30 s at ~130% (${ftp ? Math.round(1.3 * ftp) + " W" : "130% FTP"}) / 30 s at 50% · 5 min easy between sets. Trains the punchy MTB climbs` }];
const TORQUE = (n, len) => ftp => [{ name: `Climbing torque ${n} × ${len} min`, detail: `${pw(88, 95, ftp)} at 60–70 rpm, seated, quiet upper body · 4 min easy between` }];
const OPENERS = (n, len) => ftp => [{ name: `Openers ${n} × ${len} min`, detail: `${pw(105, 110, ftp)} · 3 min easy between. Should feel snappy, not hard` }];

function longRide(slot, minutes, ftp, { mtb = false, b2b = false, rpe = 4, title, notes = [] } = {}) {
  const fuel = minutes >= 90 ? ["Fuel from the first hour: 40–60 g carbs per hour (60–90 g from 2.5 h). Practise race food."] : [];
  return {
    slot, type: "bike", title: title || `${b2b ? "Back-to-back" : "Long ride"} · ${fmtMin(minutes)}${mtb ? " · MTB" : ""}`,
    minutes, rpe, hardMin: 0,
    zwift: mtb ? "Outdoors on the MTB if you can (trail park). Zwift long route if not." : "Zwift long route or outdoors.",
    blocks: [
      { name: "Ride", detail: `${fmtMin(minutes)} mostly Z2 · ${pw(56, 75, ftp)}. Climbs can go to Z3, never above.` },
      ...(mtb ? [{ name: "Skills", detail: "Pick one per ride: braking before corners · looking through the turn · descending on the pedals · technical climbs in the right gear · drops and rock gardens" }] : []),
    ],
    notes: [...fuel, ...(b2b ? ["Day 2 of a back-to-back: the point is riding on tired legs. Keep it Z2."] : []), ...notes],
  };
}
function fmtMin(m) { if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h}h${String(r).padStart(2, "0")}` : `${h} h`; }

// ── Swim generators ─────────────────────────────────────────
const STROKES = [
  { key: "back", name: "Backstroke", drills: ["Kick on back, no board · 2 × 25", "3-stroke / 6-kick · 2 × 25"], cues: ["Ears in, eyes to the ceiling", "Rotate hips to the pulling side", "Exit thumb first, enter pinky first"] },
  { key: "breast", name: "Breaststroke", drills: ["2-kick / 1-pull · 4 × 25"], cues: ["Pull → breathe → kick → glide", "Pull stays inside the shoulders", "Ease into the kick: knees still adapting"] },
  { key: "fly", name: "Butterfly", drills: ["Dolphin kick on front, arms by sides · 2 × 25", "Dolphin kick on back · 2 × 25", "Single-arm fly · 4 × 25"], cues: ["Two kicks per arm cycle", "Breathe late and low", "Wave starts from the chest", "Shoulders hurt? Back to drills"] },
];
const FLY_FULL = [null, "Full fly 4 × 25 · 30–45 s rest", "Full fly 6 × 25 + 2 × 50 broken (25 + 10 s + 25) · 45 s rest", "Full fly 4 × 50 · 60 s rest"];
const IM_BLOCK = [null, "2 × 100 IM easy (25 each) · 30 s rest", "4 × 100 IM steady · 30 s rest", "200 IM steady + 4 × 50 (fly/back/breast/free) Z3 · 30 s rest"];

function swimTech(slot, w, { main, flyLvl = 0, minutes = 50, rpe = 4, hardMin = 0, extraBlocks = [], dist }) {
  const stroke = STROKES[(w - 1) % 3];
  const flyNote = stroke.key === "fly" ? (FLY_FULL[flyLvl] ? [{ name: "Butterfly full stroke", detail: FLY_FULL[flyLvl] }] : [{ name: "Butterfly", detail: "Drills only this phase. Full stroke comes later." }]) : [];
  return {
    slot, type: "swim", title: `Technique · Freestyle + ${stroke.name}`, minutes, rpe, hardMin, stroke: stroke.name, cues: stroke.cues,
    blocks: [
      { name: "Warm-up", detail: "200 m Z1 mixed strokes · 15 s rest" },
      { name: "Freestyle drills 4 × 50", detail: "Catch-up / fingertip drag / 6-1-6 / swim · 15 s rest" },
      div(stroke.name),
      ...stroke.drills.map(d => ({ name: d.split(" · ")[0], detail: `${d.split(" · ")[1]} · 15 s rest` })),
      ...flyNote,
      div("Main"),
      ...main,
      ...extraBlocks,
      { name: "Cool-down", detail: "100–200 m Z1" },
    ],
    dist,
  };
}
function swimAerobic(slot, { imLvl = 0, main, minutes = 50, rpe = 4, hardMin = 0, title, dist }) {
  return {
    slot, type: "swim", title: title || `Aerobic${imLvl ? " + IM" : ""}`, minutes, rpe, hardMin,
    blocks: [
      { name: "Warm-up", detail: "300 m Z1 (200 free, 100 back) · then 4 × 50 build · 15 s rest" },
      { name: "Pull buoy 4 × 100", detail: "Z2 · 20 s rest" },
      ...main,
      ...(IM_BLOCK[imLvl] ? [div("IM"), { name: "IM block", detail: IM_BLOCK[imLvl] }] : []),
      { name: "Kick 4 × 50", detail: "Easy, any stroke, fins allowed · 15 s rest" },
      { name: "Cool-down", detail: "200 m Z1" },
    ],
    dist,
  };
}
const PYR = { name: "Pyramid 50-100-150-200-150-100-50", detail: "Z2, even pace · 15 s rest" };
const HALF_PYR = { name: "Pyramid 50-100-150-100-50", detail: "Z2, even pace · 15 s rest" };
const z2x = n => ({ name: `${n} × 100 free`, detail: "Z2 · 20 s rest" });
const z3x = n => ({ name: `${n} × 100 free`, detail: "Z3 threshold · 15 s rest. Hold the same split on every rep" });
const z4x = n => ({ name: `${n} × 50 free`, detail: "Z4 fast · 30 s rest. Long, strong strokes" });

// ── Tests ───────────────────────────────────────────────────
function ftpTest(slot) {
  return {
    slot, type: "test", test: "ftp", title: "FTP Ramp Test (Zwift)", minutes: 30, rpe: 9, hardMin: 6,
    zwift: "Zwift → Workouts → FTP Tests → Ramp Test. ERG on.",
    blocks: [
      { name: "How", detail: "Ride the ramp until you can't hold the target. Zwift sets FTP at 75% of your best 1-minute power." },
      { name: "Before", detail: "Rested legs: no hard session the day before. Fan on, bottle ready." },
      { name: "Record", detail: "Enter the FTP Zwift gives you. All bike zones in the app update." },
    ],
  };
}
function cssTest(slot) {
  return {
    slot, type: "test", test: "css", title: "CSS Test (400 + 200)", minutes: 45, rpe: 8, hardMin: 10,
    blocks: [
      { name: "Warm-up", detail: "400 m easy + 4 × 50 build · 15 s rest" },
      { name: "400 m time trial", detail: "Even pace, as fast as you can hold. Push off, no dive." },
      { name: "Recover", detail: "200 m very easy + 3–5 min rest" },
      { name: "200 m time trial", detail: "All out, even pace" },
      { name: "Cool-down", detail: "200 m easy" },
      { name: "Record", detail: "Enter both times: CSS = (T400 − T200) ÷ 2 per 100 m. Swim zones update." },
    ],
  };
}
function kbTestSession(slot) {
  return {
    slot, type: "test", test: "strength", title: "Strength rep tests", minutes: 35, rpe: 7, hardMin: 0,
    blocks: [
      KB_WARMUP,
      { name: "Max strict push-ups", detail: "Chest to a fist from the floor, no sagging. One set." },
      { name: "Max ring pull-ups", detail: "Full hang to chest-to-rings. If 0, max feet-on-chair ring rows." },
      { name: "20 kg goblet squat, 3 s down", detail: "Reps to 1 left in the tank, form intact" },
      { name: "20 kg one-arm press", detail: "Max reps each side, half-kneeling. Record the weaker side" },
      { name: "20 kg two-hand swings in 5 min", detail: "Rest as you need inside the 5 min. Count good reps only" },
      { name: "Rest", detail: "3 min between tests" },
    ],
  };
}
function gymTestSession(slot) {
  return {
    slot, type: "test", test: "gym", title: "Gym e1RM tests", minutes: 60, rpe: 8, hardMin: 0,
    blocks: [
      GYM_WARMUP,
      { name: "Back squat", detail: "Work up to a heavy set of 3–5 with 1 rep left in the tank" },
      { name: "Trap-bar deadlift", detail: "Same: heavy 3–5, 1 in the tank" },
      { name: "Bench press", detail: "Heavy 3–5, 1 in the tank" },
      { name: "Pull-up", detail: "Max strict reps (or +kg for 3–5)" },
      { name: "Record", detail: "Enter weight and reps: the app estimates your 1RM (Epley). No true max attempts." },
    ],
  };
}
function mobilityTest(slot) {
  return {
    slot, type: "test", test: "mobility", title: "Mobility tests", minutes: 15, rpe: 2, hardMin: 0,
    blocks: [
      { name: "Knee-to-wall (ankle)", detail: "Lunge facing a wall, heel down, knee touches wall. Slide the foot back until you can't. Measure toe-to-wall in cm, each side. Target ≥ 10 cm, < 2 cm side gap." },
      { name: "Active straight-leg raise", detail: "On your back, raise one straight leg. 3 = ankle passes mid-thigh of the other leg · 2 = between mid-thigh and knee · 1 = below the knee. Score the worse side." },
      { name: "Overhead wall reach", detail: "Back, head and heels to a wall, low back flat. Raise straight arms. 3 = thumbs touch the wall · 2 = within a hand's width · 1 = further." },
      { name: "Deep squat hold", detail: "Feet shoulder-width, heels down. Seconds you can hold, max 60." },
    ],
  };
}

// Mobility routine: daily 10 min, ticked in the daily check-in
export const MOBILITY_ROUTINE = [
  { name: "Cat–cow", detail: "8 slow reps" },
  { name: "Thoracic open book", detail: "6 per side, exhale as you rotate" },
  { name: "90/90 hip switches", detail: "6 per side" },
  { name: "Couch stretch", detail: "45 s per side, glute squeezed (hip flexors tight from the bike and desk)" },
  { name: "Knee-to-wall ankle rocks", detail: "10 per side" },
  { name: "Wall slides", detail: "10, low back flat" },
  { name: "Hamstring floss (lying, strap)", detail: "10 per side" },
  { name: "Deep squat hold", detail: "60 s, hold a door frame or the 16 kg as counterweight" },
];

// ── The weekly generator ────────────────────────────────────
// ctx: { ftp, gym (bool) }
export function buildWeek(w, ctx = {}) {
  const ftp = ctx.ftp || null;
  const gym = ctx.gym !== false;
  const t = weekType(w);
  let s = [];

  // ── Phase 1 · Restart (W1–8) ──
  if (w <= 8) {
    const sets = t === "deload" ? 2 : 3;
    const progress = w >= 6 ? " · harder variations allowed" : "";
    s.push(strengthSession("Mon", `Workout A${progress}`, kbA(sets), 40, 6));
    const tue = {
      1: z2Ride("Tue", 45, ftp),
      2: z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Cadence drills", detail: "4 × 30 s at 110+ rpm, easy power, inside the Z2 block" }] }),
      3: ftpTest("Tue"),
      4: z2Ride("Tue", 45, ftp),
      5: intervals("Tue", "Sweet spot 3 × 8", SS(3, 8), ftp, { minutes: 60, hardMin: 24, rpe: 6 }),
      6: intervals("Tue", "Sweet spot 3 × 10", SS(3, 10), ftp, { minutes: 65, hardMin: 30, rpe: 6 }),
      7: intervals("Tue", "Sweet spot 3 × 12", SS(3, 12), ftp, { minutes: 70, hardMin: 36, rpe: 7 }),
      8: z2Ride("Tue", 45, ftp, { addBlocks: [{ name: "Openers", detail: `3 × 1 min at ${pw(105, 110, ftp)} in the last 15 min` }] }),
    }[w];
    s.push(tue);
    const fly = w >= 5 ? 1 : 0;
    const techMain = w <= 2 ? [z2x(4)] : w === 4 || w === 8 ? [z2x(4)] : w <= 5 ? [z2x(6)] : [z2x(4), z3x(4)];
    s.push(swimTech("Wed", w, { main: techMain, flyLvl: fly, minutes: w <= 2 ? 40 : 50, hardMin: w >= 6 && t !== "deload" ? 8 : 0 }));
    if (w === 4) s.push(kbTestSession("Thu"));
    else s.push(strengthSession("Thu", `Workout B${progress}`, kbB(sets), 40, 6));
    if (w === 3) s.push(cssTest("Fri"));
    else {
      const im = w >= 6 ? 1 : 0;
      const main = w <= 2 ? [HALF_PYR] : t === "deload" ? [HALF_PYR] : w <= 5 ? [PYR] : [PYR, z2x(4)];
      s.push(swimAerobic("Fri", { imLvl: t === "deload" ? 0 : im, main, minutes: w <= 2 ? 40 : 50 }));
    }
    const sat = { 1: 60, 2: 75, 3: 75, 4: 60, 5: 90, 6: 100, 7: 120, 8: 75 }[w];
    s.push(longRide("Sat", sat, ftp, { mtb: w === 7, title: w <= 4 ? `Endurance · ${fmtMin(sat)}` : undefined, notes: w === 7 ? ["First outdoor MTB ride of the plan if you can get to a trail park."] : [] }));
    if (w === 1 || w === 8) s.push(mobilityTest("Sun"));
  }

  // ── Phase 2 · Summer Base (W9–16) ──
  else if (w <= 16) {
    const deload = t === "deload" || t === "test";
    const sets = deload ? 2 : 3;
    s.push(strengthSession("Mon", "Strength A+ (summer)", kbAplus(sets), 40, 7));
    const tue = {
      9: intervals("Tue", "Sweet spot 3 × 12", SS(3, 12), ftp, { minutes: 70, hardMin: 36, rpe: 6 }),
      10: intervals("Tue", "Threshold 3 × 10", THR(3, 10), ftp, { minutes: 70, hardMin: 30, rpe: 7 }),
      11: intervals("Tue", "Sweet spot 2 × 20", SS(2, 20), ftp, { minutes: 75, hardMin: 40, rpe: 7 }),
      12: z2Ride("Tue", 45, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}, 2 min easy between` }] }),
      13: intervals("Tue", "Threshold 2 × 15", THR(2, 15), ftp, { minutes: 70, hardMin: 30, rpe: 7 }),
      14: intervals("Tue", "VO2max 5 × 3", VO2(5, 3), ftp, { minutes: 65, hardMin: 15, rpe: 8 }),
      15: intervals("Tue", "Over-unders 3 × 9", OU(3), ftp, { minutes: 75, hardMin: 27, rpe: 8 }),
      16: ftpTest("Tue"),
    }[w];
    s.push(tue);
    const fly = w >= 13 ? 3 : 2;
    const im = w >= 13 ? 3 : 2;
    s.push(swimTech("Wed", w, { main: deload ? [z2x(6)] : [z3x(w >= 13 ? 10 : 8)], flyLvl: fly, minutes: 55, hardMin: deload ? 0 : 15, rpe: deload ? 4 : 6 }));
    if (w === 16) s.push(kbTestSession("Thu"));
    else s.push(strengthSession("Thu", "Strength B+ (summer)", kbBplus(sets), 40, 7));
    if (w === 16) s.push(cssTest("Fri"));
    else s.push(swimAerobic("Fri", { imLvl: deload ? 1 : im, main: deload ? [HALF_PYR] : [PYR, z4x(w >= 13 ? 8 : 6)], minutes: 55, hardMin: deload ? 0 : 4, rpe: 5 }));
    const sat = { 9: 120, 10: 135, 11: 150, 12: 90, 13: 150, 14: 165, 15: 180, 16: 120 }[w];
    s.push(longRide("Sat", sat, ftp, { mtb: true }));
    s.push(z2Ride("Sun", 60, ftp, { title: "Easy spin · 60 min (optional)", optional: true, rpe: 2, notes: ["Optional. Skip it if sleep has been poor."] }));
    if (w === 16) s.push(mobilityTest("Sun"));
  }

  // ── Phase 3 · Sabie Build (W17–26) ──
  else if (w <= 26) {
    if (w === 26) {
      s.push(intervals("Mon", "Openers 3 × 1 (Zwift)", OPENERS(3, 1), ftp, { minutes: 40, hardMin: 3, rpe: 4, notes: ["Last ride before the drive up on Tuesday."] }));
      s.push({ slot: "Wed", type: "bike", title: "Bike check spin · 30 min (Sabie)", minutes: 30, rpe: 2, hardMin: 0, blocks: [{ name: "Ride", detail: "30 min easy on the MTB after registration. Check gears, brakes, tyre pressure." }] });
      ["Thu", "Fri", "Sat"].forEach((d, i) => s.push({
        slot: d, type: "race", title: `Sabie Lite · Stage ${i + 1}`, minutes: [150, 180, 120][i], rpe: 7, hardMin: [40, 50, 30][i],
        blocks: [
          { name: "Pacing", detail: i === 1 ? "Hardest stage: ride the first hour in Z2 and save matches for the second half." : "Start controlled, Z2–Z3 on climbs, enjoy the singletrack." },
          { name: "Fuel", detail: "60–90 g carbs per hour, 500–750 ml fluid per hour. Recovery meal with protein within an hour." },
          { name: "After", detail: "Legs up, wash and check the bike, early night." },
        ],
      }));
    } else {
      const reduced = t === "deload" || t === "reduced";
      const sets = w >= 23 || reduced ? 2 : 3;
      if (w === 25) {
        s.push(strengthSession("Mon", "Strength A+ (taper, light)", kbAplus(2).filter(b => !b.ex || ["jump", "rfess", "ringpush", "ringpull"].includes(b.ex)), 30, 5));
      } else {
        s.push(strengthSession("Mon", "Strength A+ (maintenance)", kbAplus(sets), 35, 7));
      }
      const tue = {
        17: intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 }),
        18: intervals("Tue", "Threshold 2 × 20", THR(2, 20), ftp, { minutes: 80, hardMin: 40, rpe: 7 }),
        19: intervals("Tue", "30/30s · 3 sets", SURGE(3), ftp, { minutes: 70, hardMin: 15, rpe: 8 }),
        20: z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}` }] }),
        21: intervals("Tue", "Climbing torque 5 × 6", TORQUE(5, 6), ftp, { minutes: 75, hardMin: 30, rpe: 7 }),
        22: intervals("Tue", "VO2max 6 × 4", VO2(6, 4), ftp, { minutes: 75, hardMin: 24, rpe: 8 }),
        23: intervals("Tue", "Over-unders 3 × 9", OU(3), ftp, { minutes: 75, hardMin: 27, rpe: 8 }),
        24: intervals("Tue", "Threshold 2 × 15", THR(2, 15), ftp, { minutes: 70, hardMin: 30, rpe: 7 }),
        25: intervals("Tue", "Taper: race-pace 4 × 2", OPENERS(4, 2), ftp, { minutes: 45, hardMin: 8, rpe: 5, notes: ["Volume is down; intensity stays. You should feel fresher every day this week."] }),
      }[w];
      s.push(tue);
      const fly = 2, im = 2;
      s.push(swimAerobic("Wed", { imLvl: reduced || w === 25 ? 1 : im, title: w === 25 ? "Easy swim · 30 min" : "Swim · technique + aerobic", main: w === 25 ? [z2x(4)] : [{ name: "Drill set 4 × 50", detail: `${["back", "breast", "fly"][(w - 1) % 3]} focus · 15 s rest${fly ? " (fly: full stroke 4 × 25 allowed)" : ""}` }, z3x(reduced ? 4 : 8)], minutes: w === 25 ? 30 : 50, hardMin: reduced || w === 25 ? 0 : 12, rpe: 5 }));
      if (w !== 25) s.push(strengthSession("Thu", "Strength B+ (maintenance)", kbBplus(sets), 35, 7));
      const b2b = [19, 21, 23].includes(w);
      if (!b2b && w !== 25) s.push(z2Ride("Fri", w === 20 || w === 24 ? 45 : 60, ftp, { title: `MTB skills or Z2 · ${w === 20 || w === 24 ? 45 : 60} min`, notes: ["Outdoors on the MTB if daylight allows: skills loop at a trail park. Otherwise Zwift Z2."] }));
      if (w === 25) s.push(z2Ride("Thu", 45, ftp, { addBlocks: [{ name: "Openers", detail: `3 × 1 min at ${pw(105, 110, ftp)}` }] }));
      const sat = { 17: 180, 18: 180, 19: 180, 20: 120, 21: 180, 22: 210, 23: 165, 24: 150, 25: 90 }[w];
      s.push(longRide("Sat", sat, ftp, { mtb: true, notes: w === 19 ? ["Checkpoint: 3 h outdoors on the MTB, comfortable."] : w === 23 ? ["Sabie simulation: race bike setup, race food, race kit."] : [] }));
      if (b2b) s.push(longRide("Sun", w === 23 ? 120 : 90, ftp, { mtb: true, b2b: true }));
      if (w === 24) s.push(mobilityTest("Sun"));
    }
  }

  // ── Phase 4 · Recover (W27–28) ──
  else if (w <= 28) {
    s.push(swimAerobic("Tue", { imLvl: 1, main: [{ name: "Any stroke", detail: "Swim what you feel like, easy" }], minutes: 35, rpe: 3, title: "Easy swim · 35 min" }));
    s.push(strengthSession("Wed", "Light full body (KB)", kbA(2), 30, 4));
    s.push(z2Ride("Thu", 45, ftp, { title: "Easy spin · 45 min", rpe: 2 }));
    s.push(longRide("Sat", 90, ftp, { mtb: true, title: "Fun MTB ride · ~90 min", rpe: 3, notes: ["No targets. Ride somewhere you enjoy."] }));
  }

  // ── Phase 5 · Gym Ramp (W29–32) ──
  else if (w <= 32) {
    if (w === 32) {
      s.push(gym ? gymTestSession("Mon") : kbTestSession("Mon"));
      s.push(ftpTest("Tue"));
      s.push(gym ? strengthSession("Wed", "Gym B (deload)", gymB(2, "5", "RIR 3–4"), 45, 5) : strengthSession("Wed", "Strength B+ (deload)", kbBplus(2), 35, 5));
      s.push(cssTest("Thu"));
      s.push(z2Ride("Sat", 90, ftp));
      s.push(mobilityTest("Sun"));
    } else {
      const reps = w === 31 ? "6" : "8"; const rir = w === 31 ? "RIR 2–3" : "RIR 3";
      if (gym) {
        s.push(strengthSession("Mon", "Gym A · squat + push", gymA(3, reps, rir), 55, 6, { note: "Technique block: film your top set." }));
        s.push(strengthSession("Wed", "Gym B · hinge + pull", gymB(3, reps, rir), 55, 6));
        s.push(strengthSession("Fri", "Gym C · power + volume", gymC(3), 50, 6));
      } else {
        s.push(strengthSession("Mon", "Strength A+", kbAplus(3), 40, 7));
        s.push(strengthSession("Wed", "Strength B+", kbBplus(3), 40, 7));
        s.push(strengthSession("Fri", "Workout A (volume)", kbA(3), 40, 6));
      }
      s.push({
        29: z2Ride("Tue", 60, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}` }] }),
        30: intervals("Tue", "Sweet spot 3 × 10", SS(3, 10), ftp, { minutes: 65, hardMin: 30, rpe: 6 }),
        31: intervals("Tue", "Threshold 2 × 12", THR(2, 12), ftp, { minutes: 65, hardMin: 24, rpe: 7 }),
      }[w]);
      s.push(swimTech("Thu", w, { main: [z2x(4), z3x(4)], flyLvl: 2, minutes: 50, hardMin: 8 }));
      s.push(z2Ride("Sat", w === 29 ? 90 : 120, ftp, { title: `Long Z2 · ${w === 29 ? "90 min" : "2 h"}` }));
    }
  }

  // ── Phase 6 · Winter Strength (W33–42) ──
  else if (w <= 42) {
    const cyc = (w - 33) % 4; // 0,1,2 build, 3 deload (36, 40)
    const isTest = w === 40;
    const scheme = [["4", "6", "RIR 2"], ["4", "5", "RIR 2"], ["5", "4", "RIR 1–2"], ["2", "5", "RIR 4"]][w >= 41 ? (w === 41 ? 1 : 2) : cyc];
    const sets = Number(scheme[0]);
    if (isTest) {
      s.push(gym ? gymTestSession("Mon") : kbTestSession("Mon"));
      s.push(ftpTest("Tue"));
      s.push(gym ? strengthSession("Wed", "Gym B (deload)", gymB(2, "5", "RIR 4"), 45, 5) : strengthSession("Wed", "Strength B+ (deload)", kbBplus(2), 35, 5));
      s.push(cssTest("Thu"));
      s.push(z2Ride("Sat", 120, ftp, { title: "Long Z2 · 2 h", addBlocks: ftp ? [] : [], notes: ["Decoupling check: hold 65–70% FTP steady for the middle 60 min. Record decoupling from Zwift/intervals.icu/Strava."] }));
      s.push(mobilityTest("Sun"));
    } else {
      if (gym) {
        s.push(strengthSession("Mon", `Gym A · ${scheme[0]} × ${scheme[1]}`, gymA(sets, scheme[1], scheme[2]), 60, cyc === 3 ? 5 : 8));
        s.push(strengthSession("Wed", `Gym B · ${scheme[0]} × ${scheme[1]}`, gymB(sets, scheme[1], scheme[2]), 60, cyc === 3 ? 5 : 8));
        s.push(strengthSession("Fri", "Gym C · power + volume", gymC(cyc === 3 ? 2 : 3), 50, cyc === 3 ? 5 : 7));
      } else {
        s.push(strengthSession("Mon", "Strength A+", kbAplus(cyc === 3 ? 2 : 3), 40, 7));
        s.push(strengthSession("Wed", "Strength B+", kbBplus(cyc === 3 ? 2 : 3), 40, 7));
        s.push(strengthSession("Fri", "Workout A (volume)", kbA(cyc === 3 ? 2 : 3), 40, 6));
      }
      const tue = cyc === 3
        ? z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}` }] })
        : (w % 2 === 0 ? intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 })
          : intervals("Tue", `Threshold 2 × ${w >= 37 ? 20 : 15}`, THR(2, w >= 37 ? 20 : 15), ftp, { minutes: w >= 37 ? 80 : 70, hardMin: w >= 37 ? 40 : 30, rpe: 7 }));
      s.push(tue);
      s.push(swimTech("Thu", w, { main: [z3x(cyc === 3 ? 4 : 8)], flyLvl: 3, minutes: 50, hardMin: cyc === 3 ? 6 : 14, rpe: 5, extraBlocks: [{ name: "IM", detail: IM_BLOCK[cyc === 3 ? 1 : 3] }] }));
      const sat = w >= 41 ? 150 : cyc === 3 ? 90 : 120;
      s.push(z2Ride("Sat", sat, ftp, { title: `Long Z2 · ${fmtMin(sat)}`, notes: w >= 41 ? ["W2W base starts here. Outdoors on the MTB when the weather allows."] : ["Zwift is fine in winter."] }));
      s.push(swimAerobic("Sun", { imLvl: 2, main: [PYR], minutes: 45, rpe: 3, title: "Aerobic swim (optional)", optional: true }));
      s[s.length - 1].optional = true;
    }
  }

  // ── Phase 7 · W2W Build (W43–53) ──
  else if (w <= 53) {
    if (w === 53) {
      s.push(intervals("Mon", "Openers 3 × 1", OPENERS(3, 1), ftp, { minutes: 40, hardMin: 3, rpe: 4 }));
      s.push(z2Ride("Tue", 30, ftp, { title: "Travel-day spin · 30 min (optional)", rpe: 2, optional: true }));
      ["Stage 1", "Stage 2", "Stage 3"].forEach((st, i) => s.push({
        slot: ["Thu", "Fri", "Sat"][i], type: "race", title: `Wines2Whales · ${st}`, minutes: [270, 300, 240][i], rpe: 7, hardMin: [60, 70, 50][i],
        blocks: [
          { name: "Dates", detail: "Placeholder days. Set your edition's real dates in Settings once entries confirm." },
          { name: "Pacing", detail: "Ride as a pair at the weaker rider's Z2–Z3. Walk the steep hike-a-bike pinches, don't burn matches." },
          { name: "Fuel", detail: "60–90 g carbs per hour from the start. Recovery meal + protein within an hour of finishing." },
        ],
      }));
    } else if (w === 47) {
      s.push(gym ? strengthSession("Mon", "Gym A (light) · 2 × 4", gymA(2, "4", "RIR 3"), 45, 5) : strengthSession("Mon", "Strength A+ (light)", kbAplus(2), 35, 5));
      s.push(intervals("Tue", "Openers 3 × 2", OPENERS(3, 2), ftp, { minutes: 45, hardMin: 6, rpe: 5 }));
      s.push(swimAerobic("Wed", { imLvl: 1, main: [z2x(6)], minutes: 40, rpe: 3, title: "Easy swim · 40 min" }));
      ["Fri", "Sat", "Sun"].forEach((d, i) => s.push({
        slot: d, type: "race", title: `DIY stage race · Stage ${i + 1}`, minutes: [210, 270, 180][i], rpe: 7, hardMin: [30, 45, 30][i],
        blocks: [
          { name: "Format", detail: ["Local trail-park day, moderate distance", "Queen stage: longest day, most climbing", "Shorter, punchy, technical on tired legs"][i] },
          { name: "Rehearse", detail: "Race bikes, tyres, food and kit exactly as for W2W. Wash and check the bike each evening." },
        ],
      }));
    } else {
      const deload = t === "deload" || t === "recover" || t === "taper";
      const strengthSets = deload ? 2 : 3;
      if (gym) {
        s.push(strengthSession("Mon", `Gym A · maintenance ${strengthSets} × 4`, gymA(strengthSets, "4", deload ? "RIR 3–4" : "RIR 2").filter(b => b.ex !== "pallof"), 45, 7));
        if (w !== 52) s.push(strengthSession("Thu", `Gym B · maintenance ${strengthSets} × 4`, gymB(strengthSets, "4", deload ? "RIR 3–4" : "RIR 2"), 45, 7));
      } else {
        s.push(strengthSession("Mon", "Strength A+ (maintenance)", kbAplus(strengthSets), 35, 7));
        if (w !== 52) s.push(strengthSession("Thu", "Strength B+ (maintenance)", kbBplus(strengthSets), 35, 7));
      }
      const tue = {
        43: intervals("Tue", "Threshold 3 × 12", THR(3, 12), ftp, { minutes: 80, hardMin: 36, rpe: 7 }),
        44: intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 }),
        45: intervals("Tue", "Climbing torque 5 × 8", TORQUE(5, 8), ftp, { minutes: 85, hardMin: 40, rpe: 7 }),
        46: ftpTest("Tue"),
        48: z2Ride("Tue", 45, ftp, { title: "Recovery spin · 45 min", rpe: 2 }),
        49: intervals("Tue", "Over-unders 3 × 9", OU(3), ftp, { minutes: 75, hardMin: 27, rpe: 8 }),
        50: intervals("Tue", "VO2max 6 × 4", VO2(6, 4), ftp, { minutes: 75, hardMin: 24, rpe: 8 }),
        51: intervals("Tue", "Threshold 2 × 20", THR(2, 20), ftp, { minutes: 80, hardMin: 40, rpe: 7 }),
        52: intervals("Tue", "Taper: race-pace 4 × 2", OPENERS(4, 2), ftp, { minutes: 45, hardMin: 8, rpe: 5 }),
      }[w];
      s.push(tue);
      const peak = [49, 50, 51].includes(w);
      s.push(swimAerobic("Wed", { imLvl: 2, main: [z3x(deload ? 4 : 6)], minutes: deload ? 40 : 45, rpe: 4, title: peak ? "Swim (optional in peak weeks)" : "Swim · aerobic + IM", hardMin: deload ? 0 : 9 }));
      if (peak) s[s.length - 1].optional = true;
      const b2b = [44, 49, 51].includes(w);
      if (!b2b) { const fm = deload || w === 45 ? 45 : 60; s.push(z2Ride("Fri", fm, ftp, { title: `MTB skills or Z2 · ${fm} min` })); }
      const sat = { 43: 180, 44: 180, 45: 210, 46: 120, 48: 90, 49: 210, 50: 240, 51: 210, 52: 120 }[w];
      s.push(longRide("Sat", sat, ftp, { mtb: true, notes: w === 50 ? ["Longest ride of the plan: W2W queen-stage time on the bike."] : [] }));
      if (b2b) s.push(longRide("Sun", w === 51 ? 150 : w === 44 ? 90 : 120, ftp, { mtb: true, b2b: true }));
      if (w === 46) s.push(mobilityTest("Sun"));
    }
  }

  // ── After the plan: rolling maintenance (summer base pattern) ──
  else {
    s = buildWeek(9 + ((w - 54) % 8), ctx).map(x => ({ ...x }));
  }

  // ids + day order
  s = s.filter(Boolean).sort((a, b) => DAYS.indexOf(a.slot) - DAYS.indexOf(b.slot));
  s.forEach((x, i) => { x.id = `w${w}-${i}`; x.week = w; });
  return s;
}

export const TYPE_META = {
  strength: { label: "Strength", emoji: "💪", color: "#FF6B35" },
  bike: { label: "Bike", emoji: "🚴", color: "#00D4FF" },
  swim: { label: "Swim", emoji: "🏊", color: "#00FF9D" },
  test: { label: "Test", emoji: "🎯", color: "#FBBF24" },
  race: { label: "Race", emoji: "🏁", color: "#FF4D6D" },
  mobility: { label: "Mobility", emoji: "🧘", color: "#A78BFA" },
};

export const RESEARCH_NOTES = [
  { title: "Intensity mostly easy", text: "Endurance athletes improve most with roughly 80% of training at low intensity and 20% hard (Seiler 2010; Stöggl & Sperlich 2014). The app tracks your easy share each week." },
  { title: "Strength and endurance mix well", text: "An updated meta-analysis found concurrent training does not blunt maximal strength or muscle growth; explosive strength suffers most when both are in the same session (Schumann et al. 2022). Cycling interferes less than running (Wilson et al. 2012). Heavy lifts and bike intervals sit on different days." },
  { title: "Lifting makes you a better cyclist", text: "Heavy strength training improves cycling economy and late-race power in trained cyclists (Rønnestad & Mujika 2014). That's why strength never stops in summer." },
  { title: "Maintenance is cheap", text: "Strength holds on 1–2 sessions a week if the load stays heavy; endurance holds with ~2 sessions a week if intensity is kept (Spiering et al. 2021). That makes the summer/winter emphasis work." },
  { title: "Mobility through full range", text: "Strength training through full range of motion improves flexibility about as much as stretching (Afonso et al. 2021). Add ~10 min of targeted mobility on most days." },
  { title: "Taper", text: "Cutting volume ~40–60% over 1–2 weeks while keeping intensity gives the best race-day performance (Bosquet et al. 2007)." },
  { title: "Load and progression", text: "Session effort (1–10) × minutes is a validated way to track training load (Foster et al. 2001). Avoid big week-to-week jumps; the app flags a week >20% above your recent average." },
];

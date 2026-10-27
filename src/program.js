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
    id: "restart", name: "Restart", from: 1, to: 4, season: "Summer", color: "#A78BFA",
    goal: "Rebuild the habit and set baselines before the December holiday.",
    template: "Strength 2 (A & B) · Bike 2 · Swim 2 · ~5 h",
    why: "Bike and swim stay easy: aerobic fitness comes back fast, tendons and shoulders more slowly. Workouts A & B carry on unchanged. Week 3 FTP and CSS tests and the week 4 strength tests give you numbers to compare against in January.",
  },
  {
    id: "holiday", name: "Holiday", from: 5, to: 9, season: "Summer", color: "#38BDF8",
    goal: "A month away with no bike, pool or weights: easy running and bodyweight circuits keep most of your fitness.",
    template: "Run 3 · Bodyweight 2 (+1 optional) · ~3 h",
    why: "Runs start as run-walk and grow about 10% a week, because new runners get hurt from fast increases in distance (Nielsen et al. 2014). Bodyweight circuits hold strength for a month. Expect to lose some cycling power (roughly 5–10% of FTP); most of it returns within a few weeks.",
  },
  {
    id: "summer", name: "Summer Base", from: 10, to: 16, season: "Summer", color: "#00D4FF",
    goal: "Second restart, then build: gym from January, sweet spot and threshold on the bike, CSS work in the pool.",
    template: "Gym 2 · Bike 2 (+1 optional) · Swim 2 · ~6–7 h",
    why: "Week 10 is easy riding and swimming plus gym technique; week 11 retests FTP and CSS because November's numbers are out of date. Four weeks of barbell technique at moderate loads, then heavy from week 14: strength only keeps improving if the load stays heavy. From February the long ride carries two sweet-spot blocks. Once your weekly average weight is under 85 kg, move to maintenance calories before training load climbs.",
  },
  {
    id: "sabie", name: "Sabie Build", from: 17, to: 26, season: "Summer", color: "#FBBF24",
    goal: "Race-ready for Sabie Lite (29 Apr–1 May): 3-hour MTB rides, back-to-back weekends, climbing and surge intervals, then a 2-week taper.",
    template: "Gym 2 (maintenance) · Bike 3 · Swim 2 · ~7.5–9 h (above your 6–7 h)",
    why: "A stage race is decided by how you ride on days 2 and 3, so back-to-back weekends are the key sessions. Strength drops to two shorter heavy sessions, which hold it. A short easy swim on Monday flushes the legs after the weekend. The taper cuts volume about 40–60% and keeps short race-pace efforts (Bosquet et al. 2007).",
  },
  {
    id: "recover", name: "Recover", from: 27, to: 28, season: "Autumn", color: "#888",
    goal: "Two easy weeks after Sabie. Ride for fun, swim, move.",
    template: "4 easy sessions · ~3–4 h",
    why: "A short planned break after the first stage race lets the body absorb the block and resets motivation before winter.",
  },
  {
    id: "winter", name: "Winter Strength", from: 29, to: 42, season: "Winter", color: "#FF6B35",
    goal: "Get strong: 3 gym sessions a week in 4-week waves, while the long ride grows to 3 hours so you start the W2W build with a base.",
    template: "Gym 3 · Bike 2 · Swim 2 · ~7–8.5 h (above your 6–7 h)",
    why: "You arrive already lifting heavy, so winter builds on summer instead of starting over. Monday's swim becomes a short quality session (4 × 100 at CSS or 8 × 50 fast), giving two quality swims a week. Endurance holds on 2 rides a week while one keeps its intensity; the Saturday ride grows from 2 to 3 hours by August. Heavy legs and bike intervals sit on different days. Late-winter weeks with a 3-hour ride run about 8 hours.",
  },
  {
    id: "w2w", name: "W2W Build", from: 43, to: 53, season: "Spring", color: "#00FF9D",
    goal: "Wines2Whales (~200 km, ~4,500 m in 3 days): long climbs, a 4h45 ride, back-to-backs of 3 + 2.5 h, the Heritage Day rehearsal, then a taper.",
    template: "Gym 2 (maintenance) · Bike 3–4 · Swim 2 · ~8 h, 9–10 h in Oct",
    why: "Stage-race readiness comes from long rides close to stage duration and from riding on tired legs, so October peaks at 9–10 hours for three weeks. Strength stays at 2 short heavy sessions so the winter gains hold.",
  },
];
export function phaseOf(w) { return PHASES.find(p => w >= p.from && w <= p.to) || null; }

// Week types
const WEEK_TYPES = {
  3: "test", 5: "holiday", 6: "holiday", 7: "holiday", 8: "holiday", 9: "holiday", 10: "return", 11: "test",
  16: "test", 20: "deload", 24: "reduced", 25: "taper", 26: "race", 27: "recover", 28: "recover",
  32: "deload", 36: "deload", 40: "test", 46: "deload", 47: "rehearsal", 48: "recover", 52: "taper", 53: "race",
};
export function weekType(w) { return WEEK_TYPES[w] || "build"; }
export const WEEK_TYPE_META = {
  build: { label: "Build", color: "#00D4FF" },
  deload: { label: "Deload", color: "#A78BFA" },
  test: { label: "Test week", color: "#FBBF24" },
  reduced: { label: "Reduced", color: "#A78BFA" },
  taper: { label: "Taper", color: "#A78BFA" },
  race: { label: "Race week", color: "#FF4D6D" },
  recover: { label: "Recover", color: "#888" },
  rehearsal: { label: "Rehearsal", color: "#FF4D6D" },
  holiday: { label: "Holiday", color: "#38BDF8" },
  return: { label: "Back", color: "#A78BFA" },
};

export const MILESTONES = [
  { week: 1, text: "Mobility baseline (Saturday, before the ride)" },
  { week: 3, text: "FTP ramp test and CSS test" },
  { week: 4, text: "Strength rep tests (baseline)" },
  { week: 5, text: "Holiday: running and bodyweight only" },
  { week: 10, text: "Back home: gym starts, easy bike and swim" },
  { week: 11, text: "FTP and CSS retest: zones reset" },
  { week: 14, text: "Heavy lifting starts" },
  { week: 16, text: "First gym e1RMs and mobility retest" },
  { week: 19, text: "Checkpoint: 3-hour outdoor MTB ride" },
  { week: 20, text: "FTP retest" },
  { week: 23, text: "Checkpoint: back-to-back weekend, Sabie simulation" },
  { week: 26, text: "Sabie Xperience Lite · 29 Apr–1 May" },
  { week: 39, text: "Checkpoint: 3-hour winter ride" },
  { week: 40, text: "Retest everything" },
  { week: 46, text: "FTP retest and mobility" },
  { week: 47, text: "DIY stage race rehearsal · 24–26 Sep" },
  { week: 50, text: "Longest ride of the plan: 4h45" },
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
  // bodyweight (holiday)
  bwbss: { name: "Bulgarian split squat (back foot on a chair)", load: "BW", cue: "Drop straight down, front heel planted", next: "3 s lowering, then a loaded backpack" },
  bwslb: { name: "Single-leg glute bridge", load: "BW", cue: "Hips level, 1 s squeeze", next: "Shoulders on a couch" },
  pike: { name: "Pike push-up", load: "BW", cue: "Hips high, head goes between the hands", next: "Feet on a chair" },
  bwlunge: { name: "Reverse lunge", load: "BW", cue: "Front shin vertical", next: "3 s lowering, then a backpack" },
  ytw: { name: "Prone Y-T-W raise", load: "BW", cue: "Lying face down, thumbs up, squeeze shoulder blades", next: "2 s hold at the top" },
  jumpsq: { name: "Squat jump", load: "BW", cue: "Land softly, full reset between reps", next: "Higher intent" },
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

const KB_WARMUP = { name: "Warm-up · 6–8 min", detail: "2 min marching or jumping jacks · 10 BW squats · 10 hip hinges · 10 arm circles each way · 5 inchworms · 10 light swings + 5 goblet squats (16 kg) · band external rotations 2 × 15 per arm, elbow at your side (shoulder health for swimming)" };
const GYM_WARMUP = { name: "Warm-up · 8–10 min", detail: "5 min easy bike or row · 10 BW squats · 10 hip hinges · band pull-aparts × 15 · band or cable external rotations 2 × 15 per arm · then 2–4 ramp-up sets on the first lift" };

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

// Holiday: bodyweight circuits (no equipment)
function bwA(rounds) {
  return [{ name: "Warm-up · 5 min", detail: "Marching or easy jog on the spot · 10 BW squats · 10 hip hinges · 10 arm circles · 5 inchworms" },
    div(`Circuit · ${rounds} rounds · 45 s between moves, 2 min between rounds`),
    lift("pushup", rounds, "8–15 (stop 2 short)", "45 s"), lift("bwbss", rounds, "10 / leg", "45 s"),
    lift("bwslb", rounds, "12 / leg", "45 s"), lift("plank", rounds, "45 s", "2 min")];
}
function bwB(rounds) {
  return [{ name: "Warm-up · 5 min", detail: "Marching or easy jog on the spot · 10 BW squats · 10 hip hinges · 10 arm circles · 5 inchworms" },
    div(`Circuit · ${rounds} rounds · 45 s between moves, 2 min between rounds`),
    lift("pike", rounds, "6–10", "45 s"), lift("bwlunge", rounds, "10 / leg", "45 s"),
    lift("ytw", rounds, "8 each letter", "45 s"), lift("sideplank", rounds, "30 s / side", "45 s"), lift("jumpsq", rounds, "5", "2 min")];
}
function run(slot, minutes, detail, title) {
  return {
    slot, type: "run", title: title || `Easy run · ${minutes} min`, minutes, rpe: 3, hardMin: 0,
    blocks: [
      { name: "Warm-up", detail: "5 min brisk walk" },
      { name: "Run", detail },
      { name: "Cool-down", detail: "5 min walk, then calf and hip-flexor stretch" },
    ],
    notes: ["Flat and conversational: if you can't talk in sentences, walk.", "Knee or Achilles complaining? Stop, walk home, and log the pain."],
  };
}
// Gym 2×/week (summer, Sabie, W2W): Monday heavy, Thursday power + single-leg
function gymHeavy(sets, reps, rir) {
  return [GYM_WARMUP, div(`Main · ${rir}`),
    lift("squat", sets, reps, "2–3 min"), lift("bench", sets, reps, "2–3 min"),
    lift("trapbar", Math.max(2, sets - 1), reps, "2–3 min"), lift("pullup", sets, reps, "2 min"),
    div("Core"), lift("pallof", 2, "10 / side", "60 s")];
}
function gymPower(sets) {
  return [GYM_WARMUP, div("Power"), lift("boxjump", 4, "3", "90 s"), div(`Single-leg + upper · ${sets} sets · RIR 2`),
    lift("bss", sets, "6–8 / leg", "90 s"), lift("dbslrdl", sets, "8 / leg", "90 s"),
    lift("ohp", sets, "6–8", "2 min"), lift("dbrow", sets, "8–10", "90 s"),
    lift("copenhagen", 2, "20 s / side", "45 s"), lift("heavycarry", 2, "30 m", "90 s")];
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

function longRide(slot, minutes, ftp, { mtb = false, b2b = false, ss = false, rpe = 4, title, notes = [] } = {}) {
  const fuel = minutes > 90 ? ["Fuel 60–90 g carbs per hour from the first hour. Practise race food."] : [];
  return {
    slot, type: "bike", title: title || `${b2b ? "Back-to-back" : "Long ride"} · ${fmtMin(minutes)}${mtb ? " · MTB" : ""}`,
    minutes, rpe: ss ? 5 : rpe, hardMin: ss ? 40 : 0,
    zwift: mtb ? "Outdoors on the MTB if you can (trail park). Zwift long route if not." : "Zwift long route or outdoors.",
    blocks: [
      { name: "Ride", detail: `${fmtMin(minutes)} mostly Z2 · ${pw(56, 75, ftp)}. Climbs can go to Z3, never above.` },
      ...(ss ? [{ name: "Sweet spot 2 × 20 min", detail: `In the middle hour, ideally on long climbs: ${pw(88, 94, ftp)} · 10 min easy between` }] : []),
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
  // Every technique swim touches all three strokes: short, frequent practice beats one stroke every third week.
  const backDrill = ["Kick on back, no board", "3-stroke / 6-kick"][w % 2];
  const flyDrill = ["Dolphin kick on front, arms by sides", "Dolphin kick on back", "Single-arm fly", "Body dolphin, no arms"][w % 4];
  return {
    slot, type: "swim", title: "Technique · all strokes", minutes, rpe, hardMin, stroke: "All strokes",
    cues: ["Back: ears in, rotate hips to the pulling side", "Breast: pull → breathe → kick → glide; ease into the kick", "Fly: two kicks per arm cycle, breathe late and low", "Fly: shoulders hurt? Back to drills"],
    blocks: [
      { name: "Warm-up", detail: "200 m Z1 mixed strokes · 15 s rest" },
      { name: "Freestyle drills 4 × 50", detail: "Catch-up / fingertip drag / 6-1-6 / swim · 15 s rest" },
      div("Strokes"),
      { name: `Backstroke · ${backDrill}`, detail: "2 × 25 drill + 2 × 25 swim · 15 s rest" },
      { name: "Breaststroke · 2-kick / 1-pull", detail: "2 × 25 drill + 2 × 25 swim · 15 s rest" },
      { name: `Butterfly · ${flyDrill}`, detail: "2 × 25 drill · 15 s rest" },
      ...(FLY_FULL[flyLvl] ? [{ name: "Butterfly full stroke", detail: FLY_FULL[flyLvl] }] : [{ name: "Butterfly full stroke", detail: "Not yet: drills only this phase" }]),
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
function mondaySwim(optional = false) {
  return {
    slot: "Mon", type: "swim", title: `Easy recovery swim · 30 min${optional ? " (optional)" : ""}`, minutes: 30, rpe: 2, hardMin: 0,
    ...(optional ? { optional: true } : {}),
    blocks: [
      { name: "Warm-up", detail: "200 m Z1 mixed strokes" },
      { name: "6 × 100", detail: "Z1–Z2, alternate free and back · 20 s rest" },
      { name: "Kick 4 × 25", detail: "Easy, any stroke" },
      { name: "Cool-down", detail: "100 m Z1" },
    ],
    notes: ["Flushes the legs after the weekend. Swim later in the day than the gym session, or straight after it."],
  };
}

// Winter Monday swim: short but with real intensity (the only extra quality swim of the week)
function mondayQuality(w) {
  const css = w % 2 === 1;
  return {
    slot: "Mon", type: "swim", title: css ? "Quality swim · 4 × 100 at CSS" : "Quality swim · 8 × 50 fast", minutes: 30, rpe: 6, hardMin: css ? 8 : 6,
    blocks: [
      { name: "Warm-up", detail: "300 m Z1 mixed + 4 × 25 build · 15 s rest" },
      css ? { name: "4 × 100 free", detail: "Z3 at CSS pace · 15 s rest. Same split every rep" } : { name: "8 × 50 free", detail: "Z4 fast · 30 s rest. Long strokes, no thrashing" },
      { name: "Easy 100", detail: "Z1 backstroke" },
      { name: "Cool-down", detail: "100 m Z1" },
    ],
    notes: ["Swim after the gym session, or later in the day. Upper body only gets a light load from the lifting."],
  };
}
const FILM_WEEKS = [3, 11, 16, 20, 40, 46];

export function buildWeek(w, ctx = {}) {
  const ftp = ctx.ftp || null;
  const gym = ctx.gym !== false;
  const t = weekType(w);
  let s = [];

  // ── Restart (W1–4): home kettlebells, easy bike and swim, baselines ──
  if (w <= 4) {
    s.push(strengthSession("Mon", "Workout A", kbA(3), 40, 6, w === 4 ? { note: "Last full week before the holiday." } : {}));
    s.push({
      1: z2Ride("Tue", 45, ftp),
      2: z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Cadence drills", detail: "4 × 30 s at 110+ rpm, easy power, inside the Z2 block" }] }),
      3: ftpTest("Tue"),
      4: z2Ride("Tue", 60, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)} in the last 15 min` }] }),
    }[w]);
    s.push(swimTech("Wed", w, { main: [w <= 2 ? z2x(4) : z2x(6)], flyLvl: 0, minutes: w <= 2 ? 40 : 50 }));
    s.push(w === 4 ? kbTestSession("Thu") : strengthSession("Thu", "Workout B", kbB(3), 40, 6));
    s.push(w === 3 ? cssTest("Fri") : swimAerobic("Fri", { main: [w <= 2 ? HALF_PYR : PYR], minutes: w <= 2 ? 40 : 50 }));
    if (w === 1) s.push(mobilityTest("Sat"));
    const sat = { 1: 60, 2: 75, 3: 75, 4: 90 }[w];
    s.push(longRide("Sat", sat, ftp, { title: `Endurance · ${fmtMin(sat)}` }));
  }

  // ── Holiday (W5–9): running + bodyweight only ──
  else if (w <= 9) {
    const R = {
      5: [[20, "2 min run / 1 min walk × 6, then walk 2 min"], [20, "2 min run / 1 min walk × 6, then walk 2 min"], [20, "3 min run / 1 min walk × 5"]],
      6: [[25, "4 min run / 1 min walk × 5"], [25, "4 min run / 1 min walk × 5"], [25, "5 min run / 1 min walk × 4"]],
      7: [[30, "5 min run / 1 min walk × 5"], [30, "5 min run / 1 min walk × 5"], [25, "25 min continuous, very easy"]],
      8: [[30, "30 min continuous, easy"], [30, "30 min continuous, easy"], [35, "35 min continuous, easy"]],
      9: [[30, "30 min continuous, easy"], [30, "30 min continuous, easy"], [40, "40 min continuous, easy"]],
    }[w];
    const rounds = w === 5 ? 2 : 3;
    s.push(run("Mon", R[0][0], R[0][1], `Run-walk · ${R[0][0]} min`));
    s.push(strengthSession("Tue", "Bodyweight circuit A", bwA(rounds), 30, 6));
    s.push(run("Wed", R[1][0], R[1][1], `Run-walk · ${R[1][0]} min`));
    s.push(strengthSession("Thu", "Bodyweight circuit B", bwB(rounds), 30, 6));
    s.push({ ...strengthSession("Fri", "Bodyweight circuit A (optional)", bwA(2), 25, 5), optional: true });
    s.push(run("Sat", R[2][0], R[2][1], `Longest run · ${R[2][0]} min`));
  }

  // ── Summer Base (W10–16): second restart, gym ramp → heavy ──
  else if (w <= 16) {
    const H = { 10: [2, "8", "RIR 3 · technique"], 11: [3, "8", "RIR 3"], 12: [3, "6", "RIR 2–3"], 13: [3, "6", "RIR 2"], 14: [4, "6", "RIR 1–2"], 15: [4, "5", "RIR 1–2"] }[w];
    if (w === 16) s.push(gym ? gymTestSession("Mon") : kbTestSession("Mon"));
    else if (gym) s.push(strengthSession("Mon", w <= 13 ? `Gym · heavy day (technique ramp ${w - 9}/4)` : `Gym · heavy day ${H[0]} × ${H[1]}`, gymHeavy(H[0], H[1], H[2]), 55, w <= 13 ? 6 : 8, w === 10 ? { note: "First gym week: film your squat and deadlift sets. Loads stay easy." } : {}));
    else s.push(strengthSession("Mon", "Strength A+", kbAplus(w <= 11 ? 2 : 3), 40, 7));
    s.push({
      10: z2Ride("Tue", 50, ftp, { title: "Easy ride · 50 min (first ride back)" }),
      11: ftpTest("Tue"),
      12: intervals("Tue", "Sweet spot 3 × 10", SS(3, 10), ftp, { minutes: 65, hardMin: 30, rpe: 6 }),
      13: intervals("Tue", "Sweet spot 3 × 12", SS(3, 12), ftp, { minutes: 70, hardMin: 36, rpe: 6 }),
      14: intervals("Tue", "Threshold 3 × 10", THR(3, 10), ftp, { minutes: 70, hardMin: 30, rpe: 7 }),
      15: intervals("Tue", "VO2max 5 × 3", VO2(5, 3), ftp, { minutes: 65, hardMin: 15, rpe: 8 }),
      16: z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}` }] }),
    }[w]);
    const fly = { 10: 0, 11: 1, 12: 1, 13: 2, 14: 2, 15: 2, 16: 1 }[w];
    const techMain = { 10: [z2x(4)], 11: [z2x(6)], 12: [z3x(6)], 13: [z3x(8)], 14: [z3x(8)], 15: [z3x(10)], 16: [z2x(6)] }[w];
    s.push(swimTech("Wed", w, { main: techMain, flyLvl: fly, minutes: w === 10 ? 40 : 50, hardMin: w >= 12 && w <= 15 ? 14 : 0, rpe: w >= 12 && w <= 15 ? 6 : 4, extraBlocks: w === 10 ? [{ name: "Note", detail: "First swim back after a month off: technique only, no hard efforts" }] : [] }));
    s.push(gym && w !== 16 ? strengthSession("Thu", "Gym · power + single-leg", gymPower(w <= 11 ? 2 : 3), 50, 6) : strengthSession("Thu", w === 16 ? (gym ? "Gym · power (deload)" : "Strength B+ (deload)") : "Strength B+", gym && w === 16 ? gymPower(2) : kbBplus(w === 16 || w <= 11 ? 2 : 3), 45, 5));
    if (w === 11) s.push(cssTest("Fri"));
    else s.push(swimAerobic("Fri", {
      imLvl: { 10: 0, 12: 1, 13: 1, 14: 2, 15: 2, 16: 1 }[w], minutes: w === 10 ? 40 : 50,
      main: { 10: [HALF_PYR], 12: [PYR, z4x(6)], 13: [PYR, z4x(6)], 14: [PYR, z4x(8)], 15: [PYR, z4x(8)], 16: [HALF_PYR] }[w],
      hardMin: w >= 12 && w <= 15 ? 4 : 0, rpe: 5,
    }));
    if (w === 16) s.push(mobilityTest("Sat"));
    const sat = { 10: 75, 11: 90, 12: 120, 13: 135, 14: 135, 15: 150, 16: 120 }[w];
    s.push(longRide("Sat", sat, ftp, { mtb: w >= 11, ss: w === 14 || w === 15, title: w === 10 ? "Endurance · 1h15 (easy)" : undefined }));
    if (w >= 12 && w <= 15) s.push(z2Ride("Sun", 60, ftp, { title: "Easy spin · 60 min (optional)", optional: true, rpe: 2, notes: ["Optional. Skip it if sleep has been poor."] }));
  }

  // ── Sabie Build (W17–26) ──
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
      if (w === 25) s.push(gym ? strengthSession("Mon", "Gym · light 2 × 3 (taper)", gymHeavy(2, "3", "RIR 3–4"), 40, 5) : strengthSession("Mon", "Strength A+ (taper, light)", kbAplus(2), 30, 5));
      else s.push(gym ? strengthSession("Mon", `Gym · heavy maintenance ${sets} × 5`, gymHeavy(sets, "5", reduced ? "RIR 3" : "RIR 2"), 40, reduced ? 6 : 8) : strengthSession("Mon", "Strength A+ (maintenance)", kbAplus(sets), 35, 7));
      s.push(mondaySwim());
      s.push({
        17: intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 }),
        18: intervals("Tue", "Threshold 2 × 20", THR(2, 20), ftp, { minutes: 80, hardMin: 40, rpe: 7 }),
        19: intervals("Tue", "30/30s · 3 sets", SURGE(3), ftp, { minutes: 70, hardMin: 15, rpe: 8 }),
        20: ftpTest("Tue"),
        21: intervals("Tue", "Climbing torque 5 × 6", TORQUE(5, 6), ftp, { minutes: 75, hardMin: 30, rpe: 7 }),
        22: intervals("Tue", "VO2max 6 × 4", VO2(6, 4), ftp, { minutes: 75, hardMin: 24, rpe: 8 }),
        23: intervals("Tue", "Over-unders 3 × 9", OU(3), ftp, { minutes: 75, hardMin: 27, rpe: 8 }),
        24: intervals("Tue", "Threshold 2 × 15", THR(2, 15), ftp, { minutes: 70, hardMin: 30, rpe: 7 }),
        25: intervals("Tue", "Taper: race-pace 4 × 2", OPENERS(4, 2), ftp, { minutes: 45, hardMin: 8, rpe: 5, notes: ["Volume is down; intensity stays. You should feel fresher every day this week."] }),
      }[w]);
      s.push(swimAerobic("Wed", {
        imLvl: reduced || w === 25 ? 1 : 2, title: w === 25 ? "Easy swim · 30 min" : "Swim · technique + aerobic",
        main: w === 25 ? [z2x(4)] : [{ name: "Stroke drills 6 × 25", detail: "2 back, 2 breast, 2 fly drill · 15 s rest. Then full fly 4 × 25 · 30–45 s rest" }, z3x(reduced ? 4 : 8)],
        minutes: w === 25 ? 30 : 50, hardMin: reduced || w === 25 ? 0 : 12, rpe: 5,
      }));
      if (w !== 25) s.push(gym ? strengthSession("Thu", "Gym · power + single-leg", gymPower(sets), 45, 6) : strengthSession("Thu", "Strength B+ (maintenance)", kbBplus(sets), 35, 7));
      const b2b = [19, 21, 23].includes(w);
      if (!b2b && w !== 25) s.push(z2Ride("Fri", 45, ftp, { title: "MTB skills or Z2 · 45 min", notes: ["Outdoors on the MTB if daylight allows: skills loop at a trail park. Otherwise Zwift Z2."] }));
      if (w === 25) s.push(z2Ride("Thu", 45, ftp, { addBlocks: [{ name: "Openers", detail: `3 × 1 min at ${pw(105, 110, ftp)}` }] }));
      if (w === 24) s.push(mobilityTest("Sat"));
      const sat = { 17: 180, 18: 180, 19: 180, 20: 120, 21: 180, 22: 210, 23: 165, 24: 150, 25: 90 }[w];
      s.push(longRide("Sat", sat, ftp, { mtb: true, ss: [17, 18, 22].includes(w), notes: w === 19 ? ["Checkpoint: 3 h outdoors on the MTB, comfortable."] : w === 23 ? ["Sabie simulation: race bike setup, race food, race kit."] : [] }));
      if (b2b) s.push(longRide("Sun", w === 23 ? 120 : 90, ftp, { mtb: true, b2b: true }));
    }
  }

  // ── Recover (W27–28) ──
  else if (w <= 28) {
    s.push(swimAerobic("Tue", { imLvl: 1, main: [{ name: "Any stroke", detail: "Swim what you feel like, easy" }], minutes: 35, rpe: 3, title: "Easy swim · 35 min" }));
    s.push(gym ? strengthSession("Wed", "Gym · light full body 2 × 8", gymHeavy(2, "8", "RIR 4"), 40, 4) : strengthSession("Wed", "Light full body (KB)", kbA(2), 30, 4));
    s.push(z2Ride("Thu", 45, ftp, { title: "Easy spin · 45 min", rpe: 2 }));
    s.push(longRide("Sat", 90, ftp, { mtb: true, title: "Fun MTB ride · ~90 min", rpe: 3, notes: ["No targets. Ride somewhere you enjoy."] }));
  }

  // ── Winter Strength (W29–42) ──
  else if (w <= 42) {
    const SCHEME = { 29: [3, "6", "RIR 3"], 30: [4, "6", "RIR 2"], 31: [4, "5", "RIR 2"], 32: [2, "5", "RIR 4"], 33: [4, "6", "RIR 2"], 34: [4, "5", "RIR 2"], 35: [5, "4", "RIR 1–2"], 36: [2, "5", "RIR 4"], 37: [4, "6", "RIR 2"], 38: [4, "5", "RIR 2"], 39: [5, "4", "RIR 1–2"], 41: [4, "5", "RIR 2"], 42: [5, "4", "RIR 1–2"] };
    const deload = t === "deload";
    s.push(deload || w === 40 ? mondaySwim() : mondayQuality(w));
    if (w === 40) {
      s.push(gym ? gymTestSession("Mon") : kbTestSession("Mon"));
      s.push(ftpTest("Tue"));
      s.push(gym ? strengthSession("Wed", "Gym B (deload)", gymB(2, "5", "RIR 4"), 45, 5) : strengthSession("Wed", "Strength B+ (deload)", kbBplus(2), 35, 5));
      s.push(cssTest("Thu"));
      s.push(mobilityTest("Sat"));
      s.push(z2Ride("Sat", 120, ftp, { title: "Long Z2 · 2 h", notes: ["Decoupling check: hold 65–70% FTP steady for the middle 60 min, then record decoupling from Zwift, intervals.icu or Strava."] }));
    } else {
      const [sets, reps, rir] = SCHEME[w];
      if (gym) {
        s.push(strengthSession("Mon", `Gym A · ${sets} × ${reps}`, gymA(sets, reps, rir), 55, deload ? 5 : 8));
        s.push(strengthSession("Wed", `Gym B · ${sets} × ${reps}`, gymB(sets, reps, rir), 55, deload ? 5 : 8));
        s.push(strengthSession("Fri", "Gym C · power + volume", gymC(deload ? 2 : 3), 45, deload ? 5 : 7));
      } else {
        s.push(strengthSession("Mon", "Strength A+", kbAplus(deload ? 2 : 3), 40, 7));
        s.push(strengthSession("Wed", "Strength B+", kbBplus(deload ? 2 : 3), 40, 7));
        s.push(strengthSession("Fri", "Workout A (volume)", kbA(deload ? 2 : 3), 40, 6));
      }
      s.push(deload
        ? z2Ride("Tue", 50, ftp, { addBlocks: [{ name: "Openers", detail: `4 × 1 min at ${pw(105, 110, ftp)}` }] })
        : (w % 2 === 0 ? intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 })
          : intervals("Tue", `Threshold 2 × ${w >= 37 ? 20 : 15}`, THR(2, w >= 37 ? 20 : 15), ftp, { minutes: w >= 37 ? 80 : 70, hardMin: w >= 37 ? 40 : 30, rpe: 7 })));
      s.push(swimTech("Thu", w, { main: [z3x(deload ? 4 : 8)], flyLvl: 3, minutes: 50, hardMin: deload ? 6 : 14, rpe: 5, extraBlocks: [{ name: "IM", detail: IM_BLOCK[deload ? 1 : 3] }] }));
      const sat = { 29: 120, 30: 120, 31: 135, 32: 90, 33: 135, 34: 150, 35: 150, 36: 105, 37: 165, 38: 165, 39: 180, 41: 180, 42: 180 }[w];
      s.push(z2Ride("Sat", sat, ftp, { title: `Long Z2 · ${fmtMin(sat)}`, notes: sat >= 150 ? ["Fuel 60–90 g carbs per hour. Outdoors on the MTB when the weather allows; Zwift is fine otherwise.", ...(w === 39 ? ["Checkpoint: 3 hours steady."] : [])] : ["Zwift is fine in winter."] }));
    }
  }

  // ── W2W Build (W43–53) ──
  else if (w <= 53) {
    if (w === 53) {
      s.push(intervals("Mon", "Openers 3 × 1", OPENERS(3, 1), ftp, { minutes: 40, hardMin: 3, rpe: 4 }));
      s.push(z2Ride("Tue", 30, ftp, { title: "Travel-day spin · 30 min (optional)", rpe: 2, optional: true }));
      ["Stage 1", "Stage 2", "Stage 3"].forEach((st, i) => s.push({
        slot: ["Thu", "Fri", "Sat"][i], type: "race", title: `Wines2Whales · ${st}`, minutes: [270, 300, 240][i], rpe: 7, hardMin: [60, 70, 50][i],
        blocks: [
          { name: "Dates", detail: "Placeholder days until your edition's dates are confirmed." },
          { name: "Pacing", detail: "Ride as a pair at the weaker rider's Z2–Z3. Walk the steep hike-a-bike pinches, don't burn matches." },
          { name: "Fuel", detail: "60–90 g carbs per hour from the start. Recovery meal + protein within an hour of finishing." },
        ],
      }));
    } else if (w === 47) {
      s.push(gym ? strengthSession("Mon", "Gym · light 2 × 4", gymHeavy(2, "4", "RIR 3"), 40, 5) : strengthSession("Mon", "Strength A+ (light)", kbAplus(2), 35, 5));
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
      const sets = deload ? 2 : 3;
      const peak = [49, 50, 51].includes(w);
      s.push(gym ? strengthSession("Mon", `Gym · heavy maintenance ${sets} × 4`, gymHeavy(sets, "4", deload ? "RIR 3–4" : "RIR 2"), 45, deload ? 6 : 8) : strengthSession("Mon", "Strength A+ (maintenance)", kbAplus(sets), 35, 7));
      s.push(mondaySwim(peak));
      s.push({
        43: intervals("Tue", "Threshold 3 × 12", THR(3, 12), ftp, { minutes: 80, hardMin: 36, rpe: 7 }),
        44: intervals("Tue", "VO2max 5 × 4", VO2(5, 4), ftp, { minutes: 70, hardMin: 20, rpe: 8 }),
        45: intervals("Tue", "Climbing torque 5 × 8", TORQUE(5, 8), ftp, { minutes: 85, hardMin: 40, rpe: 7 }),
        46: ftpTest("Tue"),
        48: z2Ride("Tue", 45, ftp, { title: "Recovery spin · 45 min", rpe: 2 }),
        49: intervals("Tue", "Over-unders 3 × 9", OU(3), ftp, { minutes: 75, hardMin: 27, rpe: 8 }),
        50: intervals("Tue", "VO2max 6 × 4", VO2(6, 4), ftp, { minutes: 75, hardMin: 24, rpe: 8 }),
        51: intervals("Tue", "Threshold 2 × 20", THR(2, 20), ftp, { minutes: 80, hardMin: 40, rpe: 7 }),
        52: intervals("Tue", "Taper: race-pace 4 × 2", OPENERS(4, 2), ftp, { minutes: 45, hardMin: 8, rpe: 5 }),
      }[w]);
      s.push(swimAerobic("Wed", { imLvl: 2, main: [z3x(deload ? 4 : 6)], minutes: deload ? 40 : 45, rpe: 4, title: "Swim · aerobic + IM", hardMin: deload ? 0 : 9 }));
      if (w !== 52) s.push(gym ? strengthSession("Thu", "Gym · power + single-leg", gymPower(sets), 45, 6) : strengthSession("Thu", "Strength B+ (maintenance)", kbBplus(sets), 35, 7));
      const b2b = [44, 49, 51].includes(w);
      if (!b2b) { const fm = deload || w === 45 ? 45 : 60; s.push(z2Ride("Fri", fm, ftp, { title: `MTB skills or Z2 · ${fm} min` })); }
      if (w === 46) s.push(mobilityTest("Sat"));
      const sat = { 43: 180, 44: 180, 45: 210, 46: 120, 48: 90, 49: 180, 50: 285, 51: 180, 52: 120 }[w];
      s.push(longRide("Sat", sat, ftp, { mtb: true, notes: w === 50 ? ["Longest ride of the plan: W2W queen-stage time on the bike. Fuel 60–90 g carbs per hour from the first hour."] : [] }));
      if (b2b) s.push(longRide("Sun", w === 44 ? 90 : 150, ftp, { mtb: true, b2b: true }));
    }
  }

  // ── After the plan: rolling maintenance (summer-base build weeks) ──
  else {
    s = buildWeek([14, 15, 14, 16][(w - 54) % 4], ctx).map(x => ({ ...x }));
  }

  if (FILM_WEEKS.includes(w)) {
    const sw = s.find(x => x && x.test === "css") || s.find(x => x && x.type === "swim");
    if (sw) sw.notes = [...(sw.notes || []), "Test week: film 2 × 25 free and 25 of each stroke, side-on and head-on. Compare with last time: head position, hip height, catch."];
  }
  if (w === 10 || w === 11) {
    const sw = s.find(x => x && x.type === "swim");
    if (sw) sw.notes = [...(sw.notes || []), "Book one or two coached technique sessions this month if you can: for adult swimmers, feedback beats extra metres."];
  }
  const SAME_DAY = ["test", "strength", "swim", "bike", "run", "race"]; // lift before the easy swim; tests before the ride
  s = s.filter(Boolean).sort((a, b) => DAYS.indexOf(a.slot) - DAYS.indexOf(b.slot) || SAME_DAY.indexOf(a.type) - SAME_DAY.indexOf(b.type));
  s.forEach((x, i) => { x.id = `w${w}-${i}`; x.week = w; });
  return s;
}

export const TYPE_META = {
  strength: { label: "Strength", emoji: "💪", color: "#FF6B35" },
  bike: { label: "Bike", emoji: "🚴", color: "#00D4FF" },
  swim: { label: "Swim", emoji: "🏊", color: "#00FF9D" },
  run: { label: "Run", emoji: "🏃", color: "#38BDF8" },
  test: { label: "Test", emoji: "🎯", color: "#FBBF24" },
  race: { label: "Race", emoji: "🏁", color: "#FF4D6D" },
  mobility: { label: "Mobility", emoji: "🧘", color: "#A78BFA" },
};

export const RESEARCH_NOTES = [
  { title: "Mostly easy, but not dogmatic", text: "Endurance athletes do well with roughly 80% of training easy and 20% hard (Seiler 2010; Stöggl & Sperlich 2014). That evidence comes mostly from athletes training 10+ hours a week. At 6–9 hours, sweet spot and threshold are time-efficient, so the target here is 75–80% easy and the long rides from February carry two sweet-spot blocks." },
  { title: "Strength and endurance mix well", text: "An updated meta-analysis found concurrent training does not blunt maximal strength or muscle growth; explosive strength suffers most when both are in the same session (Schumann et al. 2022). Cycling interferes less than running (Wilson et al. 2012). Heavy legs and bike intervals sit on different days." },
  { title: "Lifting makes you a better cyclist", text: "Heavy strength training improves cycling economy and late-race power in trained cyclists (Rønnestad & Mujika 2014). That's why a heavy Monday stays in all year." },
  { title: "Keep the load heavy", text: "Strength holds on 1–2 sessions a week if intensity stays high; endurance holds on ~2 sessions a week if one keeps its intensity (Spiering et al. 2021). Gym access from January means strength keeps building through summer, not only in winter." },
  { title: "Fuel the work", text: "Training hard on too little food (low energy availability) blunts adaptation and raises injury and illness risk (IOC consensus on REDs, Mountjoy et al. 2023). Move to maintenance calories once your weekly average is under 85 kg, and take 60–90 g carbs an hour on rides over 90 minutes." },
  { title: "Sleep rule", text: "Sleep loss impairs endurance performance, strength and recovery (Fullagar et al. 2015). Under 6 hours of sleep or readiness 2 or lower: today's hard session becomes easy, or rest." },
  { title: "Mobility: useful, not magic", text: "Full-range strength training improves range of motion about as much as stretching (Afonso et al. 2021). Evidence that mobility routines prevent injury is weak, so the 10-minute routine is a 3-days-a-week extra, not a core session." },
  { title: "Holiday running", text: "Novice runners who increase weekly distance by more than about 30% get more distance-related injuries (Nielsen et al. 2014), so the holiday runs grow about 10% a week. A month off the bike costs some VO2max and power (Mujika & Padilla 2000); running keeps much of the general aerobic fitness." },
  { title: "Swimming", text: "CSS from a 400 + 200 test tracks threshold pace well (Wakayoshi et al. 1992), so all swim zones come from it. Every technique swim touches all three strokes, because short, frequent practice beats occasional blocks for skill learning. Band external rotations protect the shoulder as butterfly comes in, and filming your stroke each test week gives the feedback extra metres can't." },
  { title: "Taper", text: "Cutting volume ~40–60% over 1–2 weeks while keeping intensity gives the best race-day performance (Bosquet et al. 2007)." },
  { title: "Load and progression", text: "Session effort (1–10) × minutes is a validated way to track training load (Foster et al. 2001). Avoid big week-to-week jumps; the app flags a week more than 20% above your recent average." },
];

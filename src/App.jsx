import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://lsnqafebaimgdjskiqbo.supabase.co";
const SUPABASE_KEY = "sb_publishable_IwLZUcY--VQcy1qA_iQgtg_Rq938y_C";

async function dbLoad() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tri_trainer?id=eq.singleton&select=data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const rows = await r.json();
    if (rows && rows[0] && rows[0].data && Object.keys(rows[0].data).length > 0) return rows[0].data;
  } catch {}
  return null;
}

async function dbSave(data) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/tri_trainer`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: "singleton", data, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

const TOTAL_DAYS = 72;
const CYCLE = 6;
function weekOf(day) { return Math.ceil(day / CYCLE); }
function cyclePos(day) { return ((day - 1) % CYCLE) + 1; }

const STROKE_ROTATION = ["back", "fly", "breast", "fly"];
function strokeForSwimTech(day) {
  const techSessionIndex = Math.ceil(day / CYCLE) - 1;
  return STROKE_ROTATION[techSessionIndex % 4];
}

const STROKE_META = {
  back:  { name: "Backstroke",   emoji: "🔵", color: "#38BDF8" },
  breast:{ name: "Breaststroke", emoji: "🟢", color: "#34D399" },
  fly:   { name: "Butterfly",    emoji: "🟡", color: "#FBBF24" },
};

const STROKE_DRILLS = {
  back: {
    drills: [
      { name: "Kick on back — no board", sets: "2 ×", reps: "25m · 15s rest" },
      { name: "3-stroke / 6-kick", sets: "2 ×", reps: "25m · 15s rest" },
      { name: "Full backstroke — technical", sets: "6 ×", reps: "50m · 20s rest" },
    ],
    cues: ["Ears in water, eyes to ceiling", "Hips rotate to pulling side", "Exit thumb-first, enter pinky-first", "Kick from hip — loose ankles"],
  },
  breast: {
    drills: [
      { name: "2-kick / 1-pull drill", sets: "4 ×", reps: "25m · 15s rest" },
      { name: "Full breaststroke — rhythm focus", sets: "6 ×", reps: "50m · 20s rest" },
    ],
    cues: ["Pull → breathe → kick → GLIDE", "Keep pull inside shoulders", "Heels to backside, then whip", "Glide until you feel deceleration"],
  },
  fly: {
    drills: [
      { name: "Dolphin kick on front (arms by sides)", sets: "4 ×", reps: "25m · 15s rest" },
      { name: "Dolphin kick on back", sets: "4 ×", reps: "25m · 15s rest" },
      { name: "Single-arm butterfly", sets: "4 ×", reps: "25m each · 15s rest" },
      { name: "Body dolphin (no arms)", sets: "4 ×", reps: "25m · 15s rest" },
    ],
    cues: ["Two kicks per arm cycle", "Breathe late and low — chin skims water", "Wave starts from chest, not hips", "Stop if shoulders hurt — back to drills"],
  },
};

function getFlyStatus(week) {
  if (week <= 2) return "Drills only — no full stroke yet";
  if (week <= 4) return "4 × 25m full fly — 30s rest each";
  if (week <= 8) return "6 × 25m + 2 × 50m broken fly";
  return "4 × 50m full stroke — quality focus";
}

const PACE = {
  z1: "2:10+/100m", z2: "2:00–2:05/100m", z3: "1:58–2:05/100m",
};

function buildSession(day) {
  const pos = cyclePos(day);
  const week = weekOf(day);

  if (pos === 1) return {
    type: "strength", emoji: "💪", label: "Strength", color: "#FF6B35", bg: "#1a0f08",
    title: "Push / Pull / Core",
    exercises: [
      { name: "── WARM-UP ──", divider: true, sets: "⏱", reps: "5–7 MIN" },
      { name: "Skipping", sets: "2 ×", reps: "60 sec easy" },
      { name: "Arm circles + shoulder rolls", sets: "1 ×", reps: "30 sec each direction" },
      { name: "Scapular ring hang", sets: "1 ×", reps: "20–30 sec" },
      { name: "Bodyweight push-up", sets: "1 ×", reps: "10 reps — slow, full range" },
      { name: "── MAIN SESSION ──", divider: true, sets: "💪", reps: "PUSH / PULL / CORE" },
      { name: "Ring Push-Up (feet elevated)", sets: "4", reps: "10–12 · 60–90s rest" },
      { name: "Ring Row", sets: "4", reps: "10–12 · 60–90s rest" },
      { name: "KB Press single arm · 16kg", sets: "3", reps: "8 each · 90s rest" },
      { name: "KB Bent-Over Row · 20kg", sets: "3", reps: "10 each · 90s rest" },
      { name: "Ring Body Saw", sets: "3", reps: "30 sec · 60s rest" },
      { name: "KB Windmill · 16kg", sets: "3", reps: "6 each · 60–90s rest" },
      { name: "Skipping — double unders", sets: "3", reps: "30 sec · 90s between rounds" },
    ],
  };

  if (pos === 2) return {
    type: "cycling", emoji: "🚴", label: "Cycling", color: "#00D4FF", bg: "#00111a",
    title: "Zone 2 Endurance (Zwift)",
    exercises: [
      { name: "Warm-up easy spin", sets: "1", reps: "10 min" },
      { name: "Zone 2 steady — RPE 5–6", sets: "1", reps: "50–60 min · continuous" },
      { name: "Cool-down", sets: "1", reps: "5 min" },
    ],
  };

  if (pos === 3) {
    const stroke = strokeForSwimTech(day);
    const meta = STROKE_META[stroke];
    const drills = STROKE_DRILLS[stroke];
    const flyStatus = getFlyStatus(week);
    const isFly = stroke === "fly";
    const showFullFly = isFly && week >= 3;
    const fullFlySet = week <= 4
      ? [{ name: "Full butterfly", sets: "4 ×", reps: "25m · 30–45s rest" }]
      : week <= 8
      ? [{ name: "Full butterfly", sets: "6 ×", reps: "25m + 2 × 50m broken · 30–45s rest" }]
      : [{ name: "Full butterfly", sets: "4 ×", reps: "50m · full rest between" }];
    return {
      type: "swimming", emoji: "🏊", label: "Swimming", color: "#00FF9D", bg: "#00150a",
      title: `Technique — Freestyle + ${meta.name}`,
      strokeFocus: meta.name, strokeEmoji: meta.emoji,
      flyStatus: isFly ? flyStatus : null,
      exercises: [
        { name: "Warm-up freestyle", sets: "4 ×", reps: `50m · Z1 ${PACE.z1} · 15s rest` },
        { name: "Catch-up / fingertip drag (alt.)", sets: "4 ×", reps: "25m · easy · 15s rest" },
        { name: "Pull buoy freestyle", sets: "4 ×", reps: `50m · Z2 ${PACE.z2} · 20s rest` },
        { name: "── STROKE FOCUS ──", divider: true, sets: meta.emoji, reps: meta.name.toUpperCase() },
        ...drills.drills,
        ...(isFly && !showFullFly ? [{ name: "Full stroke: next session — drills only today", sets: "—", reps: "" }] : []),
        ...(showFullFly ? fullFlySet : []),
        { name: "Main set freestyle", sets: "4 ×", reps: `100m · Z3 ${PACE.z3} · 20s rest` },
        { name: "Cool-down", sets: "1 ×", reps: `100–200m · Z1 ${PACE.z1}` },
      ],
      strokeCues: drills.cues,
    };
  }

  if (pos === 4) return {
    type: "strength", emoji: "💪", label: "Strength", color: "#FF6B35", bg: "#1a0f08",
    title: "Lower Body + Conditioning",
    exercises: [
      { name: "── WARM-UP ──", divider: true, sets: "⏱", reps: "5–7 MIN" },
      { name: "Skipping", sets: "2 ×", reps: "60 sec easy" },
      { name: "Hip circles (each leg)", sets: "1 ×", reps: "10 each direction" },
      { name: "Bodyweight squat", sets: "1 ×", reps: "15 reps — slow, full depth" },
      { name: "KB Romanian Deadlift (light)", sets: "1 ×", reps: "10 reps · 16kg — primer set" },
      { name: "── MAIN SESSION ──", divider: true, sets: "💪", reps: "LOWER BODY + CONDITIONING" },
      { name: "KB Goblet Squat · 20kg", sets: "4", reps: "12 · 90s rest" },
      { name: "KB Romanian Deadlift · 20kg", sets: "4", reps: "10 · 90s rest" },
      { name: "KB Single-Leg Deadlift · 16kg", sets: "3", reps: "8 each · 90s rest" },
      { name: "KB Swing two-hand · 20kg", sets: "4", reps: "20 · 60–90s rest" },
      { name: "KB Bulgarian Split Squat · 16kg", sets: "3", reps: "8 each · 90s rest" },
      { name: "KB Turkish Get-Up · 16kg", sets: "3", reps: "3 each · rest as needed" },
      { name: "Finisher: 20 swings + 30s skip + 10 rows", sets: "3 rounds", reps: "90s between rounds" },
    ],
  };

  if (pos === 5) {
    const isVO2 = week % 2 === 0;
    return {
      type: "cycling", emoji: "🚴", label: "Cycling", color: "#00D4FF", bg: "#00111a",
      title: isVO2 ? "VO2 Max Intervals (Zwift)" : "Threshold Intervals (Zwift)",
      exercises: [
        { name: "Warm-up", sets: "1", reps: "10 min Zone 1–2" },
        isVO2
          ? { name: "VO2 Max intervals", sets: "8 ×", reps: "2 min Zone 5 · 2 min rest" }
          : { name: "Threshold intervals", sets: "5 ×", reps: "5 min Zone 4 · 3 min rest" },
        { name: "Cool-down", sets: "1", reps: "5 min Zone 1" },
      ],
    };
  }

  if (pos === 6) {
    const hasIM = week >= 5;
    const imReps = week >= 9 ? "3 rounds" : "2 rounds";
    return {
      type: "swimming", emoji: "🏊", label: "Swimming", color: "#00FF9D", bg: "#00150a",
      title: `Endurance${hasIM ? " + IM Block" : ""}`,
      exercises: [
        { name: "Warm-up freestyle", sets: "1 ×", reps: `200m · Z1 ${PACE.z1}` },
        { name: "Pyramid", sets: "1 ×", reps: `50/100/150/200/150/100/50m · Z2 ${PACE.z2} · 20s rest` },
        { name: "Main set freestyle", sets: hasIM ? "6 ×" : "8 ×", reps: `100m · Z3 ${PACE.z3} · 20s rest` },
        ...(hasIM ? [
          { name: "── IM BLOCK ──", divider: true, sets: "🔁", reps: imReps },
          { name: "25m Butterfly", sets: "", reps: `easy · Z1 ${PACE.z1}` },
          { name: "25m Backstroke", sets: "", reps: `easy · Z1 ${PACE.z1}` },
          { name: "25m Breaststroke", sets: "", reps: `easy · Z1 ${PACE.z1}` },
          { name: "25m Freestyle", sets: "", reps: "45s rest between rounds" },
        ] : []),
        { name: "Cool-down", sets: "1 ×", reps: `100m · Z1 ${PACE.z1}` },
      ],
    };
  }
}

const TYPE_COLORS = { cycling: "#00D4FF", swimming: "#00FF9D", strength: "#FF6B35" };
const CYCLE_LABELS = ["Strength", "Cycling", "Swim Tech", "Strength", "Cycling", "Swim Endurance"];
const CYCLE_EMOJIS = ["💪", "🚴", "🏊", "💪", "🚴", "🏊"];
const DEFAULT = { logs: {}, benchmarks: { ftp: [], swim100: [] }, currentDay: 1 };

export default function App() {
  const [store, setStore] = useState(DEFAULT);
  const [syncStatus, setSyncStatus] = useState("loading");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const remote = await dbLoad();
      if (remote) {
        setStore(remote);
      } else {
        try {
          const local = JSON.parse(localStorage.getItem("tri_v3") || "null");
          if (local) {
            setStore(local);
            await dbSave(local);
          }
        } catch {}
      }
      setSyncStatus("synced");
    })();
  }, []);

  function save(fn) {
    setStore(prev => {
      const next = fn({ ...prev, logs: { ...prev.logs } });
      try { localStorage.setItem("tri_v3", JSON.stringify(next)); } catch {}
      setSyncStatus("saving");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await dbSave(next);
        setSyncStatus("synced");
      }, 1000);
      return next;
    });
  }

  const [tab, setTab] = useState("today");
  const [showLog, setShowLog] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const [benchType, setBenchType] = useState(null);

  const { currentDay, logs, benchmarks } = store;
  const session = buildSession(currentDay);
  const currentWeek = weekOf(currentDay);
  const currentPos = cyclePos(currentDay);
  const todayLogged = logs[currentDay];

  function logSession(data) {
    save(s => {
      s.logs[currentDay] = { ...data, day: currentDay, pos: cyclePos(currentDay), week: weekOf(currentDay) };
      if (currentDay < TOTAL_DAYS) s.currentDay = currentDay + 1;
      return s;
    });
    setShowLog(false);
    setShowCues(false);
  }

  function skipSession() {
    save(s => {
      s.logs[currentDay] = { skipped: true, day: currentDay, pos: cyclePos(currentDay), week: weekOf(currentDay) };
      if (currentDay < TOTAL_DAYS) s.currentDay = currentDay + 1;
      return s;
    });
  }

  function goToDay(d) {
    save(s => { s.currentDay = Math.max(1, Math.min(TOTAL_DAYS, d)); return s; });
    setShowCues(false);
  }

  function addBench(type, val) {
    save(s => {
      s.benchmarks[type] = [...s.benchmarks[type], { value: parseFloat(val), day: currentDay, week: currentWeek }];
      return s;
    });
    setBenchType(null);
  }

  const allLogs = Object.values(logs);
  const doneLogs = allLogs.filter(l => !l.skipped);
  const streak = (() => {
    let s = 0, d = currentDay - 1;
    while (d >= 1) { const l = logs[d]; if (!l || l.skipped) break; s++; d--; }
    return s;
  })();
  const progressPct = Math.round((doneLogs.length / TOTAL_DAYS) * 100);
  const stripStart = Math.max(1, currentDay - 2);
  const stripDays = Array.from({ length: 6 }, (_, i) => stripStart + i).filter(d => d <= TOTAL_DAYS);

  if (syncStatus === "loading") return (
    <div style={{ fontFamily: "'Barlow Condensed','Impact',sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 40 }}>🏊</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>LOADING...</div>
      <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#666" }}>Syncing your training data</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Barlow Condensed','Impact',sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff", maxWidth: 430, margin: "0 auto" }} className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{display:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.3s ease both}
        button{cursor:pointer;-webkit-tap-highlight-color:transparent}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pulsing{animation:pulse 1.5s ease infinite}
        @media(min-width:768px){
          .app-root{max-width:900px !important}
          .header-inner{padding:52px 40px 20px !important}
          .scroll-area{padding:0 40px 110px !important; max-height:calc(100vh - 220px) !important}
          .today-grid{display:grid !important; grid-template-columns:1fr 1fr; gap:20px; align-items:start}
          .today-right{display:flex; flex-direction:column; gap:12px}
          .plan-grid{display:grid; grid-template-columns:1fr 1fr; gap:12px}
          .stats-grid{display:grid; grid-template-columns:1fr 1fr; gap:20px}
          .bottom-nav{max-width:900px !important}
          .ex-name{font-size:15px !important}
          .ex-reps{font-size:14px !important}
          .session-title{font-size:30px !important}
          .pace-grid{grid-template-columns:repeat(4,1fr) !important}
        }
      `}</style>

      <div style={{ padding: "52px 20px 16px", background: "linear-gradient(180deg,#111 0%,#0a0a0a 100%)" }} className="header-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase" }}>Week {currentWeek} of 12</div>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>
              {tab === "today" ? `DAY ${currentDay}` : tab === "schedule" ? "SCHEDULE" : "PROGRESS"}
            </div>
            {tab === "today" && <div style={{ fontSize: 13, color: "#888", fontFamily: "Barlow,sans-serif", marginTop: 2 }}>Day {currentPos} of 6 in cycle · {session.label}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#FF6B35" }}>{streak}</div>
            <div style={{ fontSize: 11, color: "#888", fontFamily: "Barlow,sans-serif" }}>day streak</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
              <div className={syncStatus === "saving" ? "pulsing" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: syncStatus === "synced" ? "#00FF9D" : syncStatus === "saving" ? "#FBBF24" : "#FF4444" }} />
              <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 10, color: "#555" }}>{syncStatus === "synced" ? "synced" : syncStatus === "saving" ? "saving..." : "offline"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, marginTop: 20 }}>
          {stripDays.map(d => {
            const log = logs[d]; const done = log && !log.skipped; const skipped = log?.skipped;
            const isCurrent = d === currentDay; const s = buildSession(d); const col = TYPE_COLORS[s.type] || "#888";
            return (
              <button key={d} onClick={() => goToDay(d)} style={{ flex: 1, background: "none", border: "none", padding: 0 }}>
                <div style={{ fontSize: 9, color: isCurrent ? "#fff" : "#777", fontFamily: "Barlow,sans-serif", marginBottom: 4, letterSpacing: 1, textAlign: "center" }}>D{d}</div>
                <div style={{ height: 38, borderRadius: 8, background: done ? col : skipped ? "#1e1e1e" : isCurrent ? col + "33" : "#181818", border: isCurrent ? `2px solid ${col}` : "2px solid transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <span style={{ fontSize: 13 }}>{done ? "✓" : skipped ? "–" : s.emoji}</span>
                  {isCurrent && <div style={{ width: 4, height: 4, borderRadius: "50%", background: col }} />}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Barlow,sans-serif", fontSize: 11, color: "#777", marginBottom: 5 }}>
            <span>{doneLogs.length} sessions done</span><span>{progressPct}% complete</span>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: 4, height: 4 }}>
            <div style={{ background: "linear-gradient(90deg,#FF6B35,#00D4FF,#00FF9D)", width: `${progressPct}%`, height: "100%", borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 110px", overflowY: "auto", maxHeight: "calc(100vh - 210px)" }} className="scroll-area">
        {tab === "today" && (
          <div className="fu">
            <div className="today-grid">
            <div>
            <div style={{ marginTop: 20, borderRadius: 16, overflow: "hidden", background: session.bg, border: `1px solid ${session.color}22` }}>
              <div style={{ background: `linear-gradient(135deg,${session.color}22 0%,transparent 60%)`, padding: "20px 20px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 44, lineHeight: 1 }}>{session.emoji}</div>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: session.color, marginTop: 8, fontFamily: "Barlow,sans-serif", textTransform: "uppercase" }}>{session.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>{session.title}</div>
                    {session.strokeFocus && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ffffff0a", borderRadius: 8, padding: "5px 10px" }}>
                          <span>{session.strokeEmoji}</span>
                          <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#e0e0e0" }}>Stroke: <b style={{ color: "#fff" }}>{session.strokeFocus}</b></span>
                        </div>
                        {session.flyStatus && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FBBF2415", borderRadius: 8, padding: "4px 10px" }}>
                            <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#FBBF24" }}>🦋 {session.flyStatus}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {todayLogged && !todayLogged.skipped && <div style={{ background: session.color, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#000", flexShrink: 0 }}>DONE ✓</div>}
                  {todayLogged?.skipped && <div style={{ background: "#2a2a2a", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#aaa", flexShrink: 0 }}>SKIPPED</div>}
                </div>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                {session.exercises.map((ex, i) => {
                  if (ex.divider) return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 6px" }}>
                      <div style={{ height: 1, flex: 1, background: "#ffffff0a" }} />
                      <span style={{ fontSize: 11, letterSpacing: 2, color: session.color, fontFamily: "Barlow,sans-serif" }}>{ex.sets} {ex.reps}</span>
                      <div style={{ height: 1, flex: 1, background: "#ffffff0a" }} />
                    </div>
                  );
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < session.exercises.length - 1 ? "1px solid #ffffff08" : "none" }}>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 14, color: "#e0e0e0" }}>{ex.name}</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, marginLeft: 10, flexShrink: 0 }}>
                        {ex.sets && <span style={{ color: session.color, fontWeight: 700 }}>{ex.sets}</span>}
                        {ex.reps && <span style={{ color: "#aaa" }}> {ex.reps}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            </div>{/* end left col */}
            <div className="today-right">
            {session.strokeCues && (
              <button onClick={() => setShowCues(p => !p)} style={{ width: "100%", marginTop: 8, padding: "12px 16px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: showCues ? "10px 10px 0 0" : 10, color: "#aaa", fontSize: 14, fontFamily: "Barlow,sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🎯 {session.strokeFocus} key cues</span>
                <span style={{ fontSize: 10 }}>{showCues ? "▲" : "▼"}</span>
              </button>
            )}
            {showCues && session.strokeCues && (
              <div style={{ background: "#111", borderRadius: "0 0 10px 10px", padding: "12px 16px", border: "1px solid #2a2a2a", borderTop: "none", marginBottom: 8 }}>
                {session.strokeCues.map((c, i) => (
                  <div key={i} style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#c8c8c8", padding: "5px 0", borderBottom: i < session.strokeCues.length - 1 ? "1px solid #1e1e1e" : "none" }}>· {c}</div>
                ))}
              </div>
            )}

            {session.type === "swimming" && (
              <div style={{ marginTop: 8, background: "#001a0e", borderRadius: 12, padding: "12px 16px", border: "1px solid #00FF9D18" }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#00FF9D", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 10 }}>Your Pace Zones · CSS 1:53–1:54</div>
                <div className="pace-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[{ label: "Z1 Easy", pace: "2:10+", color: "#888" }, { label: "Z2 Steady", pace: "2:00–2:05", color: "#00D4FF" }, { label: "Z3 Threshold", pace: "1:58–2:05", color: "#00FF9D" }, { label: "Z4 Speed", pace: "55–57s/50m", color: "#FF6B35" }].map(({ label, pace, color }) => (
                    <div key={label} style={{ background: "#0a0a0a", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#666", fontFamily: "Barlow,sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 2, fontFamily: "Barlow Condensed,sans-serif" }}>{pace}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!todayLogged && (
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setShowLog(true)} style={{ flex: 1, padding: "16px", background: session.color, border: "none", borderRadius: 12, fontSize: 17, fontWeight: 900, color: "#000", letterSpacing: 1, fontFamily: "Barlow Condensed,sans-serif" }}>LOG SESSION</button>
                <button onClick={() => logSession({ feel: 3, quick: true })} style={{ padding: "16px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#c8c8c8", fontFamily: "Barlow Condensed,sans-serif" }}>QUICK ✓</button>
                <button onClick={skipSession} style={{ padding: "16px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#888", fontFamily: "Barlow Condensed,sans-serif" }}>SKIP</button>
              </div>
            )}

            {todayLogged && !todayLogged.skipped && (
              <div style={{ marginTop: 12, background: "#161616", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 8 }}>Logged</div>
                {todayLogged.duration && <LRow label="Duration" value={todayLogged.duration + " min"} col={session.color} />}
                {todayLogged.distance && <LRow label="Distance" value={todayLogged.distance + " m"} col={session.color} />}
                {todayLogged.power && <LRow label="Avg Power" value={todayLogged.power + " W"} col={session.color} />}
                {todayLogged.feel && <LRow label="Feel" value={"⭐".repeat(todayLogged.feel)} col={session.color} />}
                {todayLogged.notes && <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#aaa", marginTop: 6, fontStyle: "italic" }}>"{todayLogged.notes}"</div>}
              </div>
            )}

            </div>{/* end right col */}
            </div>{/* end today-grid */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, padding: "14px 16px", background: "#161616", borderRadius: 12 }}>
              <button onClick={() => goToDay(currentDay - 1)} disabled={currentDay <= 1} style={{ width: 36, height: 36, borderRadius: 8, background: "#222", border: "1px solid #333", color: currentDay <= 1 ? "#333" : "#fff", fontSize: 18 }}>←</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Day {currentDay} <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>/ {TOTAL_DAYS}</span></div>
                <div style={{ fontSize: 11, color: "#888", fontFamily: "Barlow,sans-serif" }}>Week {currentWeek} · Cycle day {currentPos}/6</div>
              </div>
              <button onClick={() => goToDay(currentDay + 1)} disabled={currentDay >= TOTAL_DAYS} style={{ width: 36, height: 36, borderRadius: 8, background: "#222", border: "1px solid #333", color: currentDay >= TOTAL_DAYS ? "#333" : "#fff", fontSize: 18 }}>→</button>
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div className="fu">
            <div style={{ marginTop: 16, marginBottom: 20, fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#888", lineHeight: 1.5 }}>The 6-day cycle repeats for 12 weeks. Rest whenever you need — just pick up from where you left off.</div>
            <div style={{ background: "#161616", borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 12 }}>The 6-Day Cycle</div>
              {CYCLE_LABELS.map((label, i) => {
                const pos = i + 1; const isCurrent = pos === currentPos;
                const typeColor = pos === 1 || pos === 4 ? "#FF6B35" : pos === 2 || pos === 5 ? "#00D4FF" : "#00FF9D";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 5 ? "1px solid #1e1e1e" : "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: isCurrent ? typeColor + "33" : "#1e1e1e", border: isCurrent ? `1.5px solid ${typeColor}` : "1.5px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{CYCLE_EMOJIS[i]}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isCurrent ? "#fff" : "#c8c8c8" }}>Day {pos}</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: isCurrent ? typeColor : "#888", marginLeft: 8 }}>{label}</span>
                    </div>
                    {isCurrent && <span style={{ background: typeColor, color: "#000", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 6px" }}>YOU ARE HERE</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 12 }}>12-Week Overview</div>
            <div className="plan-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const week = i + 1;
              const techDay = (week - 1) * 6 + 3;
              const stroke = strokeForSwimTech(techDay);
              const meta = STROKE_META[stroke];
              const isCurrent = week === currentWeek;
              const isPast = week < currentWeek;
              const isVO2 = week % 2 === 0;
              const hasIM = week >= 5;
              return (
                <div key={week} style={{ marginBottom: 10, borderRadius: 12, border: isCurrent ? "1px solid #ffffff22" : "1px solid #1e1e1e", background: isCurrent ? "#1a1a1a" : "#141414", opacity: isPast ? 0.45 : 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1e1e1e" }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: isCurrent ? "#fff" : "#888", letterSpacing: 1 }}>WEEK {week}</span>
                    {isCurrent && <span style={{ background: "#fff", color: "#000", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 8px" }}>YOU ARE HERE</span>}
                    {isPast && <span style={{ fontSize: 11, color: "#555", fontFamily: "Barlow,sans-serif" }}>complete</span>}
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>💪</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#FF6B35", minWidth: 70 }}>Strength</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#aaa" }}>Push/Pull/Core · Lower Body</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🚴</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#00D4FF", minWidth: 70 }}>Cycling</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#aaa" }}>Zone 2 · {isVO2 ? "VO2 Max intervals" : "Threshold intervals"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🏊</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#00FF9D", minWidth: 70 }}>Swimming</span>
                      <span style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#aaa" }}>{meta.emoji} {meta.name}{stroke === "fly" ? (week <= 2 ? " drills" : " full") : ""} · {hasIM ? "Endurance + IM" : "Endurance"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>{/* end plan-grid */}
          </div>
        )}

        {tab === "progress" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
              <SCard label="Days Done" value={doneLogs.length} color="#00FF9D" />
              <SCard label="Streak" value={`${streak}d`} color="#FF6B35" />
              <SCard label="Skipped" value={allLogs.filter(l => l.skipped).length} color="#888" />
              <SCard label="Progress" value={`${progressPct}%`} color="#00D4FF" />
            </div>
            <div className="stats-grid" style={{ marginTop: 20 }}>
            <div>
              <SLabel>Volume by discipline</SLabel>
              {[{ type: "cycling", label: "Cycling 🚴", positions: [2, 5] }, { type: "swimming", label: "Swimming 🏊", positions: [3, 6] }, { type: "strength", label: "Strength 💪", positions: [1, 4] }].map(({ type, label, positions }) => {
                const done = doneLogs.filter(l => positions.includes(l.pos)).length; const max = 24;
                return (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Barlow,sans-serif", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#c8c8c8" }}>{label}</span><span style={{ color: TYPE_COLORS[type] }}>{done} / {max}</span>
                    </div>
                    <div style={{ background: "#1e1e1e", borderRadius: 4, height: 5 }}>
                      <div style={{ background: TYPE_COLORS[type], width: `${(done / max) * 100}%`, height: "100%", borderRadius: 4, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>{/* end stats left col */}
            <div>{/* stats right col */}
            <div style={{ marginTop: 0 }}>
              <SLabel>Stroke technique sessions</SLabel>
              <div style={{ background: "#161616", borderRadius: 12, padding: 14 }}>
                {[{ key: "back", label: "Backstroke", emoji: "🔵" }, { key: "breast", label: "Breaststroke", emoji: "🟢" }, { key: "fly", label: "Butterfly", emoji: "🟡" }].map(({ key, label, emoji }) => {
                  const meta = STROKE_META[key]; const total = key === "fly" ? 6 : 3;
                  const done = doneLogs.filter(l => l.pos === 3 && strokeForSwimTech((l.week - 1) * 6 + 3) === key).length;
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: key !== "fly" ? "1px solid #1e1e1e" : "none" }}>
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#c8c8c8" }}>{label}</div>
                        <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 11, color: "#777" }}>{done} sessions logged</div>
                      </div>
                      <div style={{ background: meta.color + "22", borderRadius: 8, padding: "4px 10px", fontFamily: "Barlow,sans-serif", fontSize: 13, color: meta.color, fontWeight: 700 }}>{done}/{total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SLabel>FTP History (Watts)</SLabel>
                <button onClick={() => setBenchType("ftp")} style={{ background: "#00D4FF22", border: "1px solid #00D4FF44", color: "#00D4FF", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontFamily: "Barlow Condensed,sans-serif", letterSpacing: 1 }}>+ ADD</button>
              </div>
              <MiniChart data={benchmarks.ftp} color="#00D4FF" unit="W" />
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SLabel>100m Swim Split (sec)</SLabel>
                <button onClick={() => setBenchType("swim100")} style={{ background: "#00FF9D22", border: "1px solid #00FF9D44", color: "#00FF9D", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontFamily: "Barlow Condensed,sans-serif", letterSpacing: 1 }}>+ ADD</button>
              </div>
              <MiniChart data={benchmarks.swim100} color="#00FF9D" unit="s" lowerIsBetter />
            </div>
            </div>{/* end stats right col */}
            </div>{/* end stats-grid */}
            <div style={{ marginTop: 20 }}>
              <SLabel>Recent sessions</SLabel>
              {allLogs.length === 0 && <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 14, color: "#555", textAlign: "center", padding: "24px 0" }}>No sessions logged yet. Let's go! 💪</div>}
              {allLogs.slice(-6).reverse().map((log, i) => {
                const s = buildSession(log.day || 1);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: 22 }}>{s.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: log.skipped ? "#777" : "#e0e0e0" }}>{log.skipped ? "Skipped" : s.title}</div>
                      <div style={{ fontSize: 11, color: "#777", fontFamily: "Barlow,sans-serif" }}>Day {log.day} · Week {log.week}</div>
                    </div>
                    {!log.skipped && log.feel && <div style={{ color: TYPE_COLORS[s.type], fontSize: 13 }}>{"⭐".repeat(log.feel)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#111111ee", backdropFilter: "blur(20px)", borderTop: "1px solid #ffffff0a", display: "flex", padding: "10px 0 24px" }}>
        {[
          { id: "today", label: "TODAY", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { id: "schedule", label: "PLAN", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { id: "progress", label: "STATS", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
        ].map(({ id, label, d }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: tab === id ? "#fff" : "#555" }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
            <span style={{ fontSize: 10, letterSpacing: 2, fontFamily: "Barlow Condensed,sans-serif", fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>

      {showLog && <LogModal session={session} onClose={() => setShowLog(false)} onSave={logSession} />}
      {benchType && <BenchModal type={benchType} color={benchType === "ftp" ? "#00D4FF" : "#00FF9D"} label={benchType === "ftp" ? "FTP (Watts)" : "100m Split (sec)"} onClose={() => setBenchType(null)} onSave={v => addBench(benchType, v)} />}
    </div>
  );
}

function LRow({ label, value, col }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: "Barlow,sans-serif" }}>
      <span style={{ color: "#888", fontSize: 13 }}>{label}</span>
      <span style={{ color: col, fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
function SCard({ label, value, color }) {
  return (
    <div style={{ background: "#161616", borderRadius: 12, padding: "16px 14px", border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
function SLabel({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: 3, color: "#888", fontFamily: "Barlow,sans-serif", textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}
function MiniChart({ data, color, unit, lowerIsBetter }) {
  if (!data || data.length === 0) return (
    <div style={{ background: "#161616", borderRadius: 12, padding: "20px", textAlign: "center", fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#555" }}>No data yet — add your first benchmark!</div>
  );
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const W = 340, H = 80, pad = 10;
  const pts = data.map((d, i) => ({ x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2), y: H - pad - ((d.value - min) / range) * (H - pad * 2) }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const latest = vals[vals.length - 1], delta = vals.length > 1 ? latest - vals[0] : null;
  const improved = delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
  return (
    <div style={{ background: "#161616", borderRadius: 12, padding: 16, border: `1px solid ${color}11` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div><span style={{ fontSize: 32, fontWeight: 900, color }}>{latest}</span><span style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#888", marginLeft: 4 }}>{unit}</span></div>
        {delta !== null && <div style={{ background: improved ? "#00FF9D22" : "#FF444422", borderRadius: 8, padding: "4px 10px", color: improved ? "#00FF9D" : "#FF4444", fontSize: 13, fontWeight: 700 }}>{improved ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}{unit}</div>}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs><linearGradient id={`g${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`} fill={`url(#g${color.replace("#", "")})`} />
        <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Barlow,sans-serif", fontSize: 10, color: "#777", marginTop: 4 }}>
        {data.map((d, i) => <span key={i}>D{d.day}</span>)}
      </div>
    </div>
  );
}
function LogModal({ session, onClose, onSave }) {
  const [feel, setFeel] = useState(3);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [power, setPower] = useState("");
  const [notes, setNotes] = useState("");
  const inp = { width: "100%", background: "#222", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 16, fontFamily: "Barlow,sans-serif", outline: "none", marginBottom: 10 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "#141414", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", border: "1px solid #ffffff0a" }} className="fu">
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>LOG SESSION</div>
        <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#888", marginBottom: 20 }}>{session.title}</div>
        {(session.type === "cycling" || session.type === "strength") && <input placeholder="Duration (minutes)" value={duration} onChange={e => setDuration(e.target.value)} type="number" style={inp} />}
        {session.type === "cycling" && <input placeholder="Avg power (watts)" value={power} onChange={e => setPower(e.target.value)} type="number" style={inp} />}
        {session.type === "swimming" && <input placeholder="Total distance (metres)" value={distance} onChange={e => setDistance(e.target.value)} type="number" style={inp} />}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 12, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>How did it feel?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setFeel(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: feel >= n ? session.color : "#222", color: feel >= n ? "#000" : "#888", fontSize: 18, transition: "all 0.1s" }}>★</button>)}
          </div>
        </div>
        <textarea placeholder="Notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize: "none", marginBottom: 16, fontSize: 14 }} />
        <button onClick={() => onSave({ feel, duration, distance, power, notes })} style={{ width: "100%", padding: "16px", background: session.color, border: "none", borderRadius: 12, fontSize: 20, fontWeight: 900, color: "#000", letterSpacing: 1, fontFamily: "Barlow Condensed,sans-serif" }}>SAVE SESSION ✓</button>
      </div>
    </div>
  );
}
function BenchModal({ type, color, label, onClose, onSave }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "#141414", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px" }} className="fu">
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>ADD BENCHMARK</div>
        <div style={{ fontFamily: "Barlow,sans-serif", fontSize: 13, color: "#888", marginBottom: 20 }}>{label}</div>
        <input autoFocus type="number" placeholder="Enter value..." value={val} onChange={e => setVal(e.target.value)} style={{ width: "100%", background: "#222", border: `1px solid ${color}44`, borderRadius: 10, padding: "14px", color: "#fff", fontSize: 24, fontFamily: "Barlow Condensed,sans-serif", fontWeight: 700, outline: "none", marginBottom: 16 }} />
        <button onClick={() => val && onSave(val)} style={{ width: "100%", padding: "16px", background: color, border: "none", borderRadius: 12, fontSize: 20, fontWeight: 900, color: "#000", letterSpacing: 1, fontFamily: "Barlow Condensed,sans-serif" }}>SAVE</button>
      </div>
    </div>
  );
}

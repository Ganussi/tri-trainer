import { useState, useEffect, useRef, useMemo } from "react";
import {
  buildWeek, PHASES, phaseOf, weekType, WEEK_TYPE_META, TYPE_META, MILESTONES, RESEARCH_NOTES, MOBILITY_ROUTINE,
  BIKE_ZONES, swimZones, secToMMSS, weekStartDate, weekOfDate, addDays, todayStr, shortDate, DAYS, TOTAL_WEEKS, PLAN_START,
} from "./program.js";
import {
  TEST_DEFS, TEST_GROUPS, TEST_FORMS, resultsFromForm, series, latest, currentFtp, currentCss, cssIsStale,
  weekSummary, rampPct, warnings, e1rm,
} from "./kpi.js";

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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tri_trainer`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id: "singleton", data, updated_at: new Date().toISOString() }),
    });
    return r.ok;
  } catch { return false; }
}

// The season plan lives under `v2`; the old 72-day fields (logs, currentDay, benchmarks) are kept untouched.
const V2_DEFAULT = { logs: {}, daily: {}, tests: [], settings: { gym: true, hr: false, bloodTest: "", weight: 87 } };
const LOCAL_KEY = "tri_v3";
const FONT = "Barlow,sans-serif";
const COND = "'Barlow Condensed','Impact',sans-serif";
const PAIN_AREAS = ["Knee", "Lower back", "Shoulder", "Hip", "Calf/Achilles", "Other"];
const RPE_LABELS = { 1: "Very easy", 2: "Easy", 3: "Moderate", 4: "Somewhat hard", 5: "Hard", 6: "Hard+", 7: "Very hard", 8: "Very hard+", 9: "Near max", 10: "Max" };

export default function App() {
  const [store, setStore] = useState({});
  const [syncStatus, setSyncStatus] = useState("loading");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const remote = await dbLoad();
      let data = remote;
      if (!data) { try { data = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch {} }
      setStore(data || {});
      setSyncStatus(remote ? "synced" : "offline");
    })();
  }, []);

  const v2 = useMemo(() => ({ ...V2_DEFAULT, ...(store.v2 || {}), settings: { ...V2_DEFAULT.settings, ...(store.v2?.settings || {}) } }), [store]);

  function updateV2(fn) {
    setStore(prev => {
      const cur = JSON.parse(JSON.stringify({ ...V2_DEFAULT, ...(prev.v2 || {}) }));
      const next = { ...prev, v2: fn(cur) || cur };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
      setSyncStatus("saving");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => { const ok = await dbSave(next); setSyncStatus(ok ? "synced" : "offline"); }, 1000);
      return next;
    });
  }

  const legacy = store.benchmarks;
  const ftp = currentFtp(v2, legacy);
  const css = currentCss(v2);
  const ctx = { ftp, gym: v2.settings.gym };
  const today = todayStr();
  const todayWeek = Math.min(Math.max(weekOfDate(today), 1), TOTAL_WEEKS + 8);

  const [tab, setTab] = useState("today");
  const [viewWeek, setViewWeek] = useState(todayWeek);
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null); // {kind:'log'|'test'|'settings'|'checkin', ...}

  const week = useMemo(() => buildWeek(viewWeek, ctx), [viewWeek, ftp, v2.settings.gym]);
  const phase = phaseOf(viewWeek);
  const wType = weekType(viewWeek);
  const preStart = today < PLAN_START;

  const defaultSel = useMemo(() => {
    const dow = (new Date().getDay() + 6) % 7;
    const open = week.filter(s => !v2.logs[s.id]);
    if (viewWeek !== todayWeek || todayStr() < PLAN_START) return (open[0] || week[0])?.id;
    return (open.find(s => DAYS.indexOf(s.slot) >= dow) || open[0] || week[week.length - 1])?.id;
  }, [week, v2.logs, viewWeek, todayWeek]);
  const sel = week.find(s => s.id === selId) || week.find(s => s.id === defaultSel);

  const warns = useMemo(() => warnings(v2, ctx, legacy), [v2, ftp]);

  function logDate(s) {
    const d = weekStartDate(s.week);
    const planned = addDays(d, DAYS.indexOf(s.slot));
    return s.week === todayWeek ? today : planned;
  }
  function saveLog(s, data) { updateV2(v => { v.logs[s.id] = { ...data, date: data.date || logDate(s), week: s.week, type: s.type }; }); setModal(null); }
  function quickDone(s) { saveLog(s, { status: "done", min: s.minutes, rpe: s.rpe, quick: true }); }
  function skip(s) { saveLog(s, { status: "skipped" }); }
  function undo(s) { updateV2(v => { delete v.logs[s.id]; }); }
  function saveTests(kind, date, results) {
    updateV2(v => { Object.entries(results).forEach(([key, value]) => v.tests.push({ id: `${key}-${Date.now()}`, date, key, value, kind })); });
  }
  function saveDaily(date, entry) { updateV2(v => { v.daily[date] = { ...(v.daily[date] || {}), ...entry }; }); }

  if (syncStatus === "loading") return (
    <div style={{ fontFamily: COND, background: "#0a0a0a", minHeight: "100vh", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 40 }}>🚴</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  const weekDone = week.filter(s => !s.optional && v2.logs[s.id]?.status === "done").length;
  const weekReq = week.filter(s => !s.optional).length;
  const checkinToday = v2.daily[today];

  return (
    <div style={{ fontFamily: COND, background: "#0a0a0a", minHeight: "100vh", color: "#fff", maxWidth: 430, margin: "0 auto" }} className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{display:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.3s ease both}
        button{cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit}
        input,textarea,select{font-family:Barlow,sans-serif}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pulsing{animation:pulse 1.5s ease infinite}
        .two-col{display:block}
        @media(min-width:768px){
          .app-root{max-width:900px !important}
          .header-inner{padding:40px 40px 16px !important}
          .scroll-area{padding:0 40px 110px !important}
          .two-col{display:grid !important; grid-template-columns:1fr 1fr; gap:20px; align-items:start}
          .bottom-nav{max-width:900px !important}
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 20px 14px", background: "linear-gradient(180deg,#111 0%,#0a0a0a 100%)" }} className="header-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#888", fontFamily: FONT, textTransform: "uppercase" }}>
              {tab === "today" ? `Week ${viewWeek} of ${TOTAL_WEEKS} · ${shortDate(weekStartDate(viewWeek))}–${shortDate(addDays(weekStartDate(viewWeek), 6))}` : tab === "plan" ? "Nov 2026 – Nov 2027" : "Key performance indicators"}
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05 }}>
              {tab === "today" ? (phase ? phase.name.toUpperCase() : "MAINTENANCE") : tab === "plan" ? "SEASON PLAN" : "KPIs"}
            </div>
            {tab === "today" && (
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <Badge color={WEEK_TYPE_META[wType].color}>{WEEK_TYPE_META[wType].label}</Badge>
                <Badge color="#888">{weekDone}/{weekReq} done</Badge>
                {phase && <Badge color={phase.color}>{phase.season}</Badge>}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <button onClick={() => setModal({ kind: "settings" })} aria-label="Settings" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, width: 38, height: 38, color: "#aaa", fontSize: 18 }}>⚙</button>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
              <div className={syncStatus === "saving" ? "pulsing" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: syncStatus === "synced" ? "#00FF9D" : syncStatus === "saving" ? "#FBBF24" : "#FF4444" }} />
              <span style={{ fontFamily: FONT, fontSize: 10, color: "#555" }}>{syncStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 110px" }} className="scroll-area">
        {tab === "today" && (
          <div className="fu">
            {preStart && viewWeek === 1 && <Note color="#A78BFA">The season plan starts Monday 2 November. Keep doing Workouts A & B until then; you can browse and pre-read week 1 here.</Note>}
            {warns.map((w, i) => <Note key={i} color={w.level === "red" ? "#FF4D6D" : w.level === "amber" ? "#FBBF24" : "#00D4FF"}>{w.text}</Note>)}

            {viewWeek === todayWeek && !preStart && (
              <button onClick={() => setModal({ kind: "checkin" })} style={{ width: "100%", marginTop: 12, padding: "12px 14px", background: checkinToday ? "#121212" : "#1a1530", border: `1px solid ${checkinToday ? "#222" : "#A78BFA55"}`, borderRadius: 12, color: "#ddd", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT, fontSize: 14 }}>
                <span>{checkinToday ? `✓ Check-in · readiness ${checkinToday.ready || "–"}/5${checkinToday.sleep ? ` · ${checkinToday.sleep} h sleep` : ""}${checkinToday.mobility ? " · mobility ✓" : ""}` : "☀️ Daily check-in · 10 seconds"}</span>
                <span style={{ color: "#888" }}>{checkinToday ? "edit" : "›"}</span>
              </button>
            )}

            {/* Week strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <NavBtn disabled={viewWeek <= 1} onClick={() => { setViewWeek(viewWeek - 1); setSelId(null); }}>←</NavBtn>
              <div style={{ flex: 1, display: "flex", gap: 4, minWidth: 0 }}>
                {week.map(s => {
                  const l = v2.logs[s.id]; const m = TYPE_META[s.type]; const isSel = sel && s.id === sel.id;
                  return (
                    <button key={s.id} onClick={() => setSelId(s.id)} style={{ flex: "1 1 0", minWidth: 0, background: "none", border: "none", padding: 0 }}>
                      <div style={{ fontSize: 9, color: isSel ? "#fff" : "#777", fontFamily: FONT, marginBottom: 3, letterSpacing: 1, textAlign: "center" }}>{s.slot.toUpperCase()}</div>
                      <div style={{ height: 40, borderRadius: 8, background: l?.status === "done" ? m.color : l?.status === "skipped" ? "#1e1e1e" : isSel ? m.color + "33" : "#181818", border: isSel ? `2px solid ${m.color}` : s.optional ? "2px dashed #333" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                        {l?.status === "done" ? "✓" : l?.status === "skipped" ? "–" : m.emoji}
                      </div>
                    </button>
                  );
                })}
              </div>
              <NavBtn disabled={viewWeek >= TOTAL_WEEKS + 8} onClick={() => { setViewWeek(viewWeek + 1); setSelId(null); }}>→</NavBtn>
            </div>
            {viewWeek !== todayWeek && <button onClick={() => { setViewWeek(todayWeek); setSelId(null); }} style={{ marginTop: 8, background: "none", border: "none", color: "#00D4FF", fontFamily: FONT, fontSize: 13 }}>↺ Back to this week</button>}

            {sel && (
              <div className="two-col">
                <div><SessionCard s={sel} log={v2.logs[sel.id]} /></div>
                <div>
                  <SessionActions s={sel} log={v2.logs[sel.id]}
                    onLog={() => setModal({ kind: "log", s: sel })} onQuick={() => quickDone(sel)} onSkip={() => skip(sel)} onUndo={() => undo(sel)}
                    onTest={() => setModal({ kind: "test", testKind: sel.test, s: sel })} />
                  {(sel.type === "bike" || sel.test === "ftp") && <BikeZones ftp={ftp} />}
                  {(sel.type === "swim" || sel.test === "css") && <SwimZonesCard css={css} stale={cssIsStale(v2)} />}
                  {sel.type === "run" && <Note color="#38BDF8">Run easy enough to talk in full sentences. Walk breaks are part of the plan, not a failure.</Note>}
                  {sel.cues && <Collapse title={`🎯 ${sel.stroke} cues`}>{sel.cues.map((c, i) => <Line key={i}>· {c}</Line>)}</Collapse>}
                  <Collapse title="🧘 Mobility 10 (3+ days a week)">
                    {MOBILITY_ROUTINE.map((m, i) => <Row key={i} name={m.name} right={m.detail} />)}
                    <div style={{ fontFamily: FONT, fontSize: 12, color: "#777", marginTop: 8 }}>After a ride or swim, or in the evening. Tick it in the daily check-in.</div>
                  </Collapse>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "plan" && <PlanTab todayWeek={todayWeek} ctx={ctx} logs={v2.logs} onOpenWeek={w => { setViewWeek(w); setSelId(null); setTab("today"); }} />}

        {tab === "kpi" && <KpiTab v2={v2} ctx={ctx} todayWeek={todayWeek} ftp={ftp} css={css} onRecord={k => setModal({ kind: "test", testKind: k })} />}
      </div>

      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#111111ee", backdropFilter: "blur(20px)", borderTop: "1px solid #ffffff0a", display: "flex", padding: "10px 0 24px", zIndex: 50 }}>
        {[
          { id: "today", label: "TODAY", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { id: "plan", label: "PLAN", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { id: "kpi", label: "KPIs", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
        ].map(({ id, label, d }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: tab === id ? "#fff" : "#555" }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
            <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>

      {modal?.kind === "log" && <LogModal s={modal.s} v2={v2} existing={v2.logs[modal.s.id]} hr={v2.settings.hr} onClose={() => setModal(null)} onSave={d => saveLog(modal.s, d)} />}
      {modal?.kind === "test" && <TestModal kind={modal.testKind} onClose={() => setModal(null)} onSave={(date, results) => {
        saveTests(modal.testKind || "body", date, results);
        if (modal.s) saveLog(modal.s, { status: "done", min: modal.s.minutes, rpe: modal.s.rpe, date }); else setModal(null);
      }} />}
      {modal?.kind === "checkin" && <CheckinModal entry={v2.daily[today] || {}} hr={v2.settings.hr} onClose={() => setModal(null)} onSave={e => { saveDaily(today, e); setModal(null); }} />}
      {modal?.kind === "settings" && <SettingsModal settings={v2.settings} ftp={ftp} css={css} onClose={() => setModal(null)} onSave={st => { updateV2(v => { v.settings = { ...v.settings, ...st }; }); setModal(null); }} />}
    </div>
  );
}

// ── Today components ────────────────────────────────────────
function SessionCard({ s, log }) {
  const m = TYPE_META[s.type];
  return (
    <div style={{ marginTop: 14, borderRadius: 16, overflow: "hidden", background: "#111", border: `1px solid ${m.color}22` }}>
      <div style={{ background: `linear-gradient(135deg,${m.color}22 0%,transparent 60%)`, padding: "18px 18px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: m.color, fontFamily: FONT, textTransform: "uppercase" }}>{m.emoji} {m.label} · {s.slot}{s.optional ? " · optional" : ""}</div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{s.title}</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", marginTop: 4 }}>~{s.minutes} min · planned effort {s.rpe}/10{s.hardMin ? ` · ${s.hardMin} min hard` : ""}</div>
          </div>
          {log?.status === "done" && <div style={{ background: m.color, borderRadius: 20, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#000", flexShrink: 0 }}>DONE ✓</div>}
          {log?.status === "skipped" && <div style={{ background: "#2a2a2a", borderRadius: 20, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#aaa", flexShrink: 0 }}>SKIPPED</div>}
        </div>
        {s.zwift && <div style={{ fontFamily: FONT, fontSize: 12, color: "#9fd", marginTop: 8, background: "#00D4FF10", borderRadius: 8, padding: "6px 10px" }}>Zwift: {s.zwift}</div>}
        {s.note && <div style={{ fontFamily: FONT, fontSize: 12, color: "#ccc", marginTop: 6 }}>{s.note}</div>}
      </div>
      <div style={{ padding: "0 18px 16px" }}>
        {s.blocks.map((b, i) => {
          if (b.divider) return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0 4px" }}>
              <div style={{ height: 1, flex: 1, background: "#ffffff10" }} />
              <span style={{ fontSize: 11, letterSpacing: 2, color: m.color, fontFamily: FONT, textTransform: "uppercase" }}>{b.name}</span>
              <div style={{ height: 1, flex: 1, background: "#ffffff10" }} />
            </div>
          );
          if (b.ex) return <LiftRow key={i} b={b} color={m.color} last={log?.lifts?.[b.ex]} />;
          return (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #ffffff08" }}>
              <div style={{ fontFamily: FONT, fontSize: 14, color: "#e8e8e8", fontWeight: 600 }}>{b.name}</div>
              {b.detail && <div style={{ fontFamily: FONT, fontSize: 13, color: "#aaa", marginTop: 2, lineHeight: 1.4 }}>{b.detail}</div>}
            </div>
          );
        })}
        {s.notes?.length > 0 && <div style={{ marginTop: 10 }}>{s.notes.map((n, i) => <div key={i} style={{ fontFamily: FONT, fontSize: 12, color: "#bbb", lineHeight: 1.4, marginTop: 4 }}>💡 {n}</div>)}</div>}
        {log?.status === "done" && !log.quick && (
          <div style={{ marginTop: 12, background: "#181818", borderRadius: 10, padding: 12, fontFamily: FONT, fontSize: 13, color: "#ccc" }}>
            Logged: {log.min || "–"} min · effort {log.rpe || "–"}/10{log.power ? ` · ${log.power} W` : ""}{log.hr ? ` · ${log.hr} bpm` : ""}{log.dist ? ` · ${log.dist} m` : ""}
            {log.pain?.length > 0 && <div style={{ color: "#FF8FA3", marginTop: 4 }}>Pain: {log.pain.join(", ")}</div>}
            {log.notes && <div style={{ fontStyle: "italic", color: "#999", marginTop: 4 }}>"{log.notes}"</div>}
          </div>
        )}
      </div>
    </div>
  );
}
function LiftRow({ b, color, last }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #ffffff08" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", padding: "9px 0", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", color: "#e8e8e8" }}>
        <span style={{ fontFamily: FONT, fontSize: 14 }}>{b.name} <span style={{ color: "#777", fontSize: 12 }}>{b.load}</span></span>
        <span style={{ fontFamily: FONT, fontSize: 13, flexShrink: 0, marginLeft: 8 }}><b style={{ color }}>{b.sets} ×</b> <span style={{ color: "#aaa" }}>{b.reps} · {b.rest}</span></span>
      </button>
      {open && (
        <div style={{ fontFamily: FONT, fontSize: 12, color: "#aaa", paddingBottom: 9, lineHeight: 1.45 }}>
          <div>Cue: {b.cue}</div>
          <div>Next step: {b.next}</div>
          {last && <div style={{ color }}>Last logged top set: {last.w ? `${last.w} kg × ` : ""}{last.r} reps</div>}
        </div>
      )}
    </div>
  );
}
function SessionActions({ s, log, onLog, onQuick, onSkip, onUndo, onTest }) {
  const m = TYPE_META[s.type];
  if (log) return (
    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <button onClick={onLog} style={btn("#1e1e1e", "#ccc")}>EDIT LOG</button>
      <button onClick={onUndo} style={btn("#1e1e1e", "#888")}>UNDO</button>
    </div>
  );
  if (s.type === "test") return (
    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <button onClick={onTest} style={{ ...btn(m.color, "#000"), flex: 1, fontSize: 17 }}>RECORD RESULTS</button>
      <button onClick={onSkip} style={btn("#1e1e1e", "#888")}>SKIP</button>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <button onClick={onLog} style={{ ...btn(m.color, "#000"), flex: 1, fontSize: 17 }}>LOG SESSION</button>
      <button onClick={onQuick} style={btn("#1e1e1e", "#ccc")}>QUICK ✓</button>
      <button onClick={onSkip} style={btn("#1e1e1e", "#888")}>SKIP</button>
    </div>
  );
}
function BikeZones({ ftp }) {
  return (
    <div style={{ marginTop: 12, background: "#00111a", borderRadius: 12, padding: "12px 14px", border: "1px solid #00D4FF22" }}>
      <SLabel color="#00D4FF">Bike zones · {ftp ? `FTP ${ftp} W` : "set FTP after the ramp test"}</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {BIKE_ZONES.map(z => (
          <div key={z.key} style={{ background: "#0a0a0a", borderRadius: 8, padding: "6px 9px" }}>
            <div style={{ fontSize: 10, color: "#777", fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>{z.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4FF" }}>{ftp ? `${Math.round(z.lo * ftp / 100)}–${Math.round(z.hi * ftp / 100)} W` : `${z.lo}–${z.hi}%`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SwimZonesCard({ css, stale }) {
  return (
    <div style={{ marginTop: 12, background: "#001a0e", borderRadius: 12, padding: "12px 14px", border: "1px solid #00FF9D18" }}>
      <SLabel color="#00FF9D">Swim zones · CSS {secToMMSS(css)}/100m{stale ? " (old test)" : ""}</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {swimZones(css).map(z => (
          <div key={z.key} style={{ background: "#0a0a0a", borderRadius: 8, padding: "6px 9px" }}>
            <div style={{ fontSize: 10, color: "#777", fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>{z.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: z.color }}>{z.pace}</div>
          </div>
        ))}
      </div>
      {stale && <div style={{ fontFamily: FONT, fontSize: 11, color: "#888", marginTop: 8 }}>Based on your pre-break 1000 m TT. Expect to swim slower than these until the week 3 CSS test resets them.</div>}
    </div>
  );
}

// ── Plan tab ────────────────────────────────────────────────
function PlanTab({ todayWeek, ctx, logs, onOpenWeek }) {
  const [open, setOpen] = useState(() => phaseOf(todayWeek)?.id || "restart");
  return (
    <div className="fu" style={{ marginTop: 14 }}>
      <div style={{ fontFamily: FONT, fontSize: 13, color: "#999", lineHeight: 1.5 }}>Calendar weeks, Monday to Sunday. Do the week's sessions in any order. Missed sessions are skipped, not shifted. Tap a week to open it.</div>
      {/* Timeline bar */}
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", margin: "14px 0 4px" }}>
        {PHASES.map(p => <div key={p.id} title={p.name} style={{ flex: p.to - p.from + 1, background: p.color, opacity: todayWeek > p.to ? 0.35 : 1 }} />)}
      </div>
      <div style={{ position: "relative", height: 14 }}>
        <div style={{ position: "absolute", left: `${Math.min(100, ((todayWeek - 0.5) / TOTAL_WEEKS) * 100)}%`, transform: "translateX(-50%)", fontSize: 10, color: "#fff" }}>▲</div>
      </div>

      {PHASES.map(p => {
        const isOpen = open === p.id; const current = todayWeek >= p.from && todayWeek <= p.to;
        return (
          <div key={p.id} style={{ marginTop: 10, background: "#131313", borderRadius: 14, border: current ? `1px solid ${p.color}66` : "1px solid #1e1e1e", overflow: "hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : p.id)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", textAlign: "left", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: p.color }}>{p.name.toUpperCase()}</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#888" }}>W{p.from}–{p.to} · {shortDate(weekStartDate(p.from))}–{shortDate(addDays(weekStartDate(p.to), 6))}</span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#ccc", marginTop: 4, lineHeight: 1.4 }}>{p.goal}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", marginTop: 4 }}>{p.template}</div>
            </button>
            {isOpen && (
              <div style={{ padding: "0 16px 14px" }}>
                <div style={{ fontFamily: FONT, fontSize: 12, color: "#aaa", lineHeight: 1.5, background: "#0d0d0d", borderRadius: 10, padding: 10, marginBottom: 8 }}>Why: {p.why}</div>
                {Array.from({ length: p.to - p.from + 1 }, (_, i) => p.from + i).map(w => {
                  const wk = buildWeek(w, ctx); const t = weekType(w); const tm = WEEK_TYPE_META[t];
                  const done = wk.filter(s => logs[s.id]?.status === "done").length;
                  const ms = MILESTONES.filter(m => m.week === w);
                  return (
                    <button key={w} onClick={() => onOpenWeek(w)} style={{ width: "100%", textAlign: "left", background: w === todayWeek ? "#1c1c1c" : "transparent", border: "none", borderTop: "1px solid #1e1e1e", padding: "9px 4px", color: "#ddd", opacity: w < todayWeek ? 0.55 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>W{w} <span style={{ fontFamily: FONT, fontSize: 11, color: "#777", fontWeight: 400 }}>{shortDate(weekStartDate(w))}</span></span>
                        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {done > 0 && <span style={{ fontFamily: FONT, fontSize: 11, color: "#888" }}>{done}/{wk.length}</span>}
                          <Badge color={tm.color}>{tm.label}</Badge>
                        </span>
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 12, color: "#999", marginTop: 3, lineHeight: 1.4 }}>
                        {wk.map(s => `${TYPE_META[s.type].emoji} ${s.title}${s.optional ? " (opt)" : ""}`).join(" · ")}
                      </div>
                      {ms.map((m, i) => <div key={i} style={{ fontFamily: FONT, fontSize: 12, color: "#FBBF24", marginTop: 3 }}>★ {m.text}</div>)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 22 }}><SLabel>The research behind it</SLabel></div>
      {RESEARCH_NOTES.map((n, i) => (
        <div key={i} style={{ background: "#131313", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{n.title}</div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: "#aaa", lineHeight: 1.5, marginTop: 3 }}>{n.text}</div>
        </div>
      ))}
      <div style={{ fontFamily: FONT, fontSize: 11, color: "#666", marginTop: 6 }}>Check references yourself; AI can get citation details wrong.</div>
    </div>
  );
}

// ── KPI tab ─────────────────────────────────────────────────
function KpiTab({ v2, ctx, todayWeek, ftp, css, onRecord }) {
  const w = Math.max(1, todayWeek);
  const cur = weekSummary(v2, w, ctx);
  const ramp = rampPct(v2, w, ctx);
  const hist = Array.from({ length: 8 }, (_, i) => w - 7 + i).filter(x => x >= 1).map(x => weekSummary(v2, x, ctx));
  const pctTxt = x => (x == null ? "–" : `${Math.round(x * 100)}%`);
  const good = (ok, warn) => (ok ? "#00FF9D" : warn ? "#FBBF24" : "#FF4D6D");
  // Judge the current week against what is due so far, not the whole week
  const isCur = w === weekOfDate(todayStr());
  const elapsed = isCur ? ((new Date().getDay() + 6) % 7) + 1 : 7;
  const due = isCur ? buildWeek(w, ctx).filter(s => !s.optional && DAYS.indexOf(s.slot) < elapsed - 1).length : cur.planned;
  const compDue = due ? Math.min(1, cur.done / due) : 1;
  const perDay = n => n / elapsed;
  return (
    <div className="fu" style={{ marginTop: 14 }}>
      <SLabel>This week · W{w}</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <KCard label="Sessions done" value={`${cur.done}/${cur.planned}`} sub={isCur ? `${due} due before today · target ≥ 80%` : "Target ≥ 80%"} color={due === 0 ? "#888" : good(compDue >= 0.8, compDue >= 0.6)} />
        <KCard label="Hours" value={`${(cur.doneMin / 60).toFixed(1)} / ${(cur.plannedMin / 60).toFixed(1)}`} sub="done / planned" color="#00D4FF" />
        <KCard label="Load (effort × min)" value={cur.load} sub={ramp == null ? "vs 3-wk avg: –" : `${ramp >= 0 ? "+" : ""}${Math.round(ramp * 100)}% vs 3-wk avg`} color={ramp == null ? "#888" : good(ramp <= 0.2, ramp <= 0.3)} />
        <KCard label="Easy share (endurance)" value={pctTxt(cur.easyShare)} sub="Target 75–80%" color={cur.easyShare == null ? "#888" : good(cur.easyShare >= 0.72, cur.easyShare >= 0.65)} />
        <KCard label="Mobility days" value={`${cur.mobilityDays}/7`} sub="Target 3+ a week" color={good(perDay(cur.mobilityDays) >= 3 / 7, perDay(cur.mobilityDays) >= 1 / 7)} />
        <KCard label="Protein target days" value={`${cur.proteinDays}/7`} sub="160 g · target 5+" color={good(perDay(cur.proteinDays) >= 5 / 7, perDay(cur.proteinDays) >= 3 / 7)} />
        <KCard label="Sleep avg" value={cur.sleep ? `${cur.sleep.toFixed(1)} h` : "–"} sub="Target 7+" color={cur.sleep == null ? "#888" : good(cur.sleep >= 7, cur.sleep >= 6)} />
        <KCard label="Readiness avg" value={cur.ready ? `${cur.ready.toFixed(1)}/5` : "–"} sub={cur.rhr ? `RHR ${Math.round(cur.rhr)} bpm` : "from check-ins"} color={cur.ready == null ? "#888" : good(cur.ready >= 3.5, cur.ready >= 2.5)} />
      </div>

      <div style={{ marginTop: 20 }}><SLabel>Last 8 weeks</SLabel></div>
      <div style={{ background: "#131313", borderRadius: 12, padding: 14 }}>
        <Bars label="Completion" data={hist.map(h => ({ w: h.week, v: h.completion }))} max={1} color="#00FF9D" fmt={v => `${Math.round(v * 100)}%`} target={0.8} />
        <Bars label="Load" data={hist.map(h => ({ w: h.week, v: h.load }))} color="#FF6B35" fmt={v => v} />
        <Bars label="Hours" data={hist.map(h => ({ w: h.week, v: h.doneMin / 60 }))} color="#00D4FF" fmt={v => v.toFixed(1)} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
        <SLabel>Results</SLabel>
        <select onChange={e => { if (e.target.value) { onRecord(e.target.value); e.target.value = ""; } }} defaultValue="" style={{ background: "#FBBF2422", color: "#FBBF24", border: "1px solid #FBBF2455", borderRadius: 8, padding: "6px 8px", fontSize: 13 }}>
          <option value="" disabled>+ Record</option>
          <option value="ftp">FTP</option><option value="css">CSS test</option><option value="strength">Strength rep tests</option>
          <option value="gym">Gym e1RM tests</option><option value="mobility">Mobility tests</option><option value="body">Waist / blood / decoupling</option>
        </select>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12, color: "#777", marginBottom: 8 }}>Weight and resting HR come from the daily check-in.</div>
      <div className="two-col">
        {TEST_GROUPS.map(g => (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#ccc", letterSpacing: 1, margin: "6px 0" }}>{g.toUpperCase()}</div>
            {Object.entries(TEST_DEFS).filter(([, d]) => d.group === g).map(([k, d]) => <KpiRow key={k} k={k} d={d} data={series(v2, k)} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
function KpiRow({ k, d, data }) {
  const fmt = v => (d.fmt === "time" ? secToMMSS(v) : Number.isInteger(v) ? v : v.toFixed(1));
  const lastV = data.length ? data[data.length - 1].value : null;
  const first = data.length > 1 ? data[0].value : null;
  const delta = first != null ? lastV - first : null;
  const improved = delta != null && (d.better === "up" ? delta > 0 : delta < 0);
  return (
    <div style={{ background: "#131313", borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#ddd" }}>{d.label}</div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: "#777" }}>Target: {d.target}</div>
      </div>
      <Spark data={data.map(p => p.value)} color={improved ? "#00FF9D" : "#888"} />
      <div style={{ textAlign: "right", minWidth: 64 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: lastV == null ? "#444" : "#fff" }}>{lastV == null ? "–" : fmt(lastV)}<span style={{ fontFamily: FONT, fontSize: 11, color: "#777", fontWeight: 400 }}> {lastV == null ? "" : d.unit}</span></div>
        {delta != null && delta !== 0 && <div style={{ fontFamily: FONT, fontSize: 11, color: improved ? "#00FF9D" : "#FF4D6D" }}>{delta > 0 ? "▲" : "▼"} {d.fmt === "time" ? `${Math.abs(delta).toFixed(1)} s` : Math.abs(delta).toFixed(1)}</div>}
      </div>
    </div>
  );
}
function Spark({ data, color }) {
  if (data.length < 2) return <div style={{ width: 56 }} />;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 56},${18 - ((v - min) / r) * 16}`).join(" ");
  return <svg width="56" height="20" viewBox="0 0 56 20"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Bars({ label, data, max, color, fmt, target }) {
  const m = max || Math.max(1, ...data.map(d => d.v));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: FONT, fontSize: 12, color: "#999", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 54, position: "relative" }}>
        {target != null && <div style={{ position: "absolute", left: 0, right: 0, bottom: (target / m) * 40 + 14, borderTop: "1px dashed #444" }} />}
        {data.map(d => (
          <div key={d.w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            <div style={{ fontFamily: FONT, fontSize: 9, color: "#888" }}>{d.v ? fmt(d.v) : ""}</div>
            <div style={{ width: "100%", height: Math.max(2, (d.v / m) * 40), background: d.v ? color : "#222", borderRadius: 3 }} />
            <div style={{ fontFamily: FONT, fontSize: 9, color: "#666", marginTop: 2 }}>W{d.w}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function KCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#131313", borderRadius: 12, padding: "12px 12px", border: `1px solid ${color}33` }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#888", fontFamily: FONT, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      <div style={{ fontFamily: FONT, fontSize: 11, color: "#777", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────
function Sheet({ title, sub, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#141414", borderRadius: "20px 20px 0 0", padding: "22px 20px 36px", border: "1px solid #ffffff0a", maxHeight: "88vh", overflowY: "auto" }} className="fu">
        <div style={{ fontSize: 22, fontWeight: 900 }}>{title}</div>
        {sub && <div style={{ fontFamily: FONT, fontSize: 13, color: "#888", marginTop: 2, marginBottom: 14 }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}
const inp = { width: "100%", background: "#222", border: "1px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 16, outline: "none", marginBottom: 10 };

function LogModal({ s, v2, existing, hr, onClose, onSave }) {
  const m = TYPE_META[s.type];
  const lifts = s.blocks.filter(b => b.ex);
  const lastLift = ex => {
    const ls = Object.values(v2.logs).filter(l => l?.lifts?.[ex]).sort((a, b) => b.date.localeCompare(a.date));
    return ls[0]?.lifts[ex];
  };
  const [min, setMin] = useState(existing?.min ?? s.minutes);
  const [rpe, setRpe] = useState(existing?.rpe ?? s.rpe);
  const [power, setPower] = useState(existing?.power ?? "");
  const [hrv, setHr] = useState(existing?.hr ?? "");
  const [dist, setDist] = useState(existing?.dist ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pain, setPain] = useState(existing?.pain ?? []);
  const [lv, setLv] = useState(() => Object.fromEntries(lifts.map(b => [b.ex, existing?.lifts?.[b.ex] || lastLift(b.ex) || { w: "", r: "" }])));
  return (
    <Sheet title="LOG SESSION" sub={s.title} onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Minutes"><input type="number" inputMode="numeric" value={min} onChange={e => setMin(e.target.value)} style={inp} /></Field>
        {(s.type === "bike" || s.type === "race") && <Field label="Avg power (W)"><input type="number" inputMode="numeric" value={power} onChange={e => setPower(e.target.value)} style={inp} /></Field>}
        {s.type === "swim" && <Field label="Distance (m)"><input type="number" inputMode="numeric" value={dist} onChange={e => setDist(e.target.value)} style={inp} /></Field>}
        {hr && s.type !== "strength" && <Field label="Avg HR"><input type="number" inputMode="numeric" value={hrv} onChange={e => setHr(e.target.value)} style={inp} /></Field>}
      </div>
      <SLabel>Effort 1–10 · {RPE_LABELS[rpe]}</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 4, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <button key={n} onClick={() => setRpe(n)} style={{ padding: "9px 0", borderRadius: 6, border: "none", background: rpe === n ? m.color : "#222", color: rpe === n ? "#000" : "#999", fontSize: 15, fontWeight: 700 }}>{n}</button>)}
      </div>
      {lifts.length > 0 && (
        <>
          <SLabel>Top set per exercise (kg × reps)</SLabel>
          {lifts.map(b => (
            <div key={b.ex} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: "#ccc", minWidth: 0 }}>{b.name}</div>
              <input placeholder="kg" type="number" inputMode="decimal" value={lv[b.ex].w} onChange={e => setLv({ ...lv, [b.ex]: { ...lv[b.ex], w: e.target.value } })} style={{ ...inp, width: 64, marginBottom: 0, padding: "8px" }} />
              <input placeholder={/ s\b/.test(b.reps) ? "sec" : / m\b/.test(b.reps) ? "m" : "reps"} type="number" inputMode="numeric" value={lv[b.ex].r} onChange={e => setLv({ ...lv, [b.ex]: { ...lv[b.ex], r: e.target.value } })} style={{ ...inp, width: 64, marginBottom: 0, padding: "8px" }} />
            </div>
          ))}
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#666", marginBottom: 12 }}>Prefilled from last time. Leave kg empty for bodyweight.</div>
        </>
      )}
      <SLabel>Any pain? (not muscle burn)</SLabel>
      <Chips options={PAIN_AREAS} value={pain} onChange={setPain} color="#FF4D6D" />
      <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize: "none", fontSize: 14, marginTop: 10 }} />
      <button onClick={() => onSave({
        status: "done", min: Number(min) || s.minutes, rpe, power, hr: hrv, dist, notes, pain, date: existing?.date,
        lifts: Object.fromEntries(Object.entries(lv).filter(([, v]) => v.r !== "" && v.r != null)),
      })} style={{ ...btn(m.color, "#000"), width: "100%", fontSize: 19 }}>SAVE ✓</button>
    </Sheet>
  );
}

function TestModal({ kind, onClose, onSave }) {
  const fields = TEST_FORMS[kind] || TEST_FORMS.body;
  const [raw, setRaw] = useState({});
  const [date, setDate] = useState(todayStr());
  const preview = resultsFromForm(kind || "body", raw);
  const titles = { ftp: "FTP", css: "CSS TEST", strength: "STRENGTH TESTS", gym: "GYM e1RM TESTS", mobility: "MOBILITY TESTS", body: "MEASUREMENTS" };
  return (
    <Sheet title={`RECORD · ${titles[kind] || "MEASUREMENTS"}`} sub="Leave anything you didn't test empty." onClose={onClose}>
      <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></Field>
      {fields.map(f => (
        <Field key={f.key} label={f.label}>
          <input value={raw[f.key] || ""} inputMode={f.time || f.wr ? "text" : "decimal"} placeholder={f.time ? "6:52" : f.wr ? "80 x 5" : ""} onChange={e => setRaw({ ...raw, [f.key]: e.target.value })} style={inp} />
        </Field>
      ))}
      {Object.keys(preview).length > 0 && (
        <div style={{ background: "#1c1c1c", borderRadius: 10, padding: 10, marginBottom: 12, fontFamily: FONT, fontSize: 13, color: "#ddd" }}>
          {Object.entries(preview).map(([k, v]) => <div key={k}>{TEST_DEFS[k]?.label}: <b>{TEST_DEFS[k]?.fmt === "time" ? secToMMSS(v) : v}</b> {TEST_DEFS[k]?.unit}</div>)}
        </div>
      )}
      <button disabled={!Object.keys(preview).length} onClick={() => onSave(date, preview)} style={{ ...btn("#FBBF24", "#000"), width: "100%", fontSize: 19, opacity: Object.keys(preview).length ? 1 : 0.4 }}>SAVE RESULTS</button>
    </Sheet>
  );
}

function CheckinModal({ entry, hr, onClose, onSave }) {
  const [ready, setReady] = useState(entry.ready || 3);
  const [sleep, setSleep] = useState(entry.sleep ?? "");
  const [rhr, setRhr] = useState(entry.rhr ?? "");
  const [weight, setWeight] = useState(entry.weight ?? "");
  const [protein, setProtein] = useState(!!entry.protein);
  const [mobility, setMobility] = useState(!!entry.mobility);
  const [pain, setPain] = useState(entry.pain || []);
  return (
    <Sheet title="DAILY CHECK-IN" sub="Morning: readiness, sleep, HR, weight. Evening: tick protein and mobility." onClose={onClose}>
      <SLabel>Readiness</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setReady(n)} style={{ padding: "10px 0", borderRadius: 8, border: "none", background: ready === n ? "#A78BFA" : "#222", color: ready === n ? "#000" : "#999", fontSize: 16, fontWeight: 700 }}>{n}</button>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 11, color: "#666", marginBottom: 12 }}><span>wrecked</span><span>ready to go</span></div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Sleep (h)"><input type="number" inputMode="decimal" value={sleep} onChange={e => setSleep(e.target.value)} style={inp} /></Field>
        <Field label="Weight (kg)"><input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} style={inp} /></Field>
        {hr && <Field label="Resting HR"><input type="number" inputMode="numeric" value={rhr} onChange={e => setRhr(e.target.value)} style={inp} /></Field>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Toggle on={protein} onClick={() => setProtein(!protein)}>Protein 160 g</Toggle>
        <Toggle on={mobility} onClick={() => setMobility(!mobility)}>Mobility 10</Toggle>
      </div>
      <SLabel>Pain today?</SLabel>
      <Chips options={PAIN_AREAS} value={pain} onChange={setPain} color="#FF4D6D" />
      <button onClick={() => onSave({ ready, sleep: sleep === "" ? null : Number(sleep), rhr: rhr === "" ? null : Number(rhr), weight: weight === "" ? null : Number(weight), protein, mobility, pain })} style={{ ...btn("#A78BFA", "#000"), width: "100%", fontSize: 19, marginTop: 14 }}>SAVE</button>
    </Sheet>
  );
}

function SettingsModal({ settings, ftp, css, onClose, onSave }) {
  const [gym, setGym] = useState(settings.gym);
  const [hr, setHr] = useState(settings.hr);
  const [bloodTest, setBloodTest] = useState(settings.bloodTest || "");
  return (
    <Sheet title="SETTINGS" sub={`Current FTP ${ftp ? ftp + " W" : "not set"} · CSS ${secToMMSS(css)}/100m (from tests)`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <Toggle on={gym} onClick={() => setGym(!gym)} wide>Gym access from January 2027</Toggle>
        <Toggle on={hr} onClick={() => setHr(!hr)} wide>I have a heart rate strap or watch</Toggle>
      </div>
      <Field label="Next blood test date (no lifting or intervals 5 days before)"><input type="date" value={bloodTest} onChange={e => setBloodTest(e.target.value)} style={inp} /></Field>
      <div style={{ fontFamily: FONT, fontSize: 12, color: "#777", lineHeight: 1.5, marginBottom: 14 }}>Without gym access, the gym sessions switch to the harder kettlebell sessions; you'll hit a ceiling at 20 kg.</div>
      <button onClick={() => onSave({ gym, hr, bloodTest })} style={{ ...btn("#fff", "#000"), width: "100%", fontSize: 19 }}>SAVE</button>
    </Sheet>
  );
}

// ── Small UI pieces ────────────────────────────────────────
function btn(bg, fg) { return { padding: "14px 14px", background: bg, border: bg === "#1e1e1e" ? "1px solid #333" : "none", borderRadius: 12, fontSize: 14, fontWeight: 800, color: fg, letterSpacing: 1 }; }
function Badge({ color, children }) { return <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontFamily: FONT, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>; }
function Note({ color, children }) { return <div style={{ marginTop: 10, background: color + "14", border: `1px solid ${color}44`, borderRadius: 10, padding: "10px 12px", fontFamily: FONT, fontSize: 13, color: "#e8e8e8", lineHeight: 1.45 }}>{children}</div>; }
function NavBtn({ disabled, onClick, children }) { return <button disabled={disabled} onClick={onClick} style={{ width: 34, height: 54, borderRadius: 8, background: "#1a1a1a", border: "1px solid #2a2a2a", color: disabled ? "#333" : "#fff", fontSize: 16, flexShrink: 0, alignSelf: "flex-end" }}>{children}</button>; }
function SLabel({ children, color = "#888" }) { return <div style={{ fontSize: 11, letterSpacing: 2.5, color, fontFamily: FONT, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>; }
function Field({ label, children }) { return <label style={{ display: "block", flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT, fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>{children}</label>; }
function Line({ children }) { return <div style={{ fontFamily: FONT, fontSize: 13, color: "#c8c8c8", padding: "4px 0" }}>{children}</div>; }
function Row({ name, right }) {
  return (
    <div style={{ padding: "7px 0", borderBottom: "1px solid #1e1e1e" }}>
      <div style={{ fontFamily: FONT, fontSize: 13, color: "#e0e0e0", fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: FONT, fontSize: 12, color: "#999" }}>{right}</div>
    </div>
  );
}
function Collapse({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "12px 14px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: open ? "10px 10px 0 0" : 10, color: "#bbb", fontSize: 14, fontFamily: FONT, display: "flex", justifyContent: "space-between" }}>
        <span>{title}</span><span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ background: "#111", borderRadius: "0 0 10px 10px", padding: "8px 14px 12px", border: "1px solid #2a2a2a", borderTop: "none" }}>{children}</div>}
    </div>
  );
}
function Chips({ options, value, onChange, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => {
        const on = value.includes(o);
        return <button key={o} onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])} style={{ padding: "7px 11px", borderRadius: 18, border: `1px solid ${on ? color : "#333"}`, background: on ? color + "22" : "#1a1a1a", color: on ? color : "#999", fontFamily: FONT, fontSize: 13 }}>{o}</button>;
      })}
    </div>
  );
}
function Toggle({ on, onClick, children, wide }) {
  return <button onClick={onClick} style={{ flex: wide ? undefined : 1, width: wide ? "100%" : undefined, textAlign: "left", padding: "11px 12px", borderRadius: 10, border: `1px solid ${on ? "#00FF9D" : "#333"}`, background: on ? "#00FF9D18" : "#1a1a1a", color: on ? "#00FF9D" : "#999", fontFamily: FONT, fontSize: 14 }}>{on ? "✓ " : "○ "}{children}</button>;
}

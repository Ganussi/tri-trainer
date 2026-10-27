import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dumbbell, Bike, Waves, Footprints, Timer, Flag, Settings, House, CalendarDays, ChartColumn,
  ChevronRight, ChevronLeft, ChevronDown, Check, TriangleAlert, Info, Sun, X, Plus, Activity, Video, Lightbulb,
} from "lucide-react";
import {
  buildWeek, PHASES, phaseOf, weekType, WEEK_TYPE_META, MILESTONES, RESEARCH_NOTES, MOBILITY_ROUTINE,
  BIKE_ZONES, swimZones, secToMMSS, weekStartDate, weekOfDate, addDays, todayStr, shortDate, DAYS, TOTAL_WEEKS, PLAN_START,
} from "./program.js";
import {
  TEST_DEFS, TEST_GROUPS, TEST_FORMS, resultsFromForm, series, currentFtp, currentCss, cssIsStale,
  weekSummary, rampPct, warnings,
} from "./kpi.js";

const SUPABASE_URL = "https://lsnqafebaimgdjskiqbo.supabase.co";
const SUPABASE_KEY = "sb_publishable_IwLZUcY--VQcy1qA_iQgtg_Rq938y_C";

// Returns the stored data, {} when the row is empty, or undefined when Supabase can't be reached
// (offline, or the project is paused).
async function dbLoad() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tri_trainer?id=eq.singleton&select=data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return undefined;
    const rows = await r.json();
    if (!Array.isArray(rows)) return undefined;
    return rows[0]?.data || {};
  } catch { return undefined; }
}
// Merge two copies of the store so nothing logged on either side is lost.
function mergeStores(remote = {}, local = {}) {
  const r = remote.v2 || {}, l = local.v2 || {};
  const daily = { ...(r.daily || {}) };
  Object.entries(l.daily || {}).forEach(([d, e]) => { daily[d] = { ...(daily[d] || {}), ...e }; });
  const tests = [...(r.tests || [])];
  (l.tests || []).forEach(t => { if (!tests.some(x => x.id === t.id)) tests.push(t); });
  return {
    ...remote, ...local,
    logs: remote.logs || local.logs, currentDay: remote.currentDay ?? local.currentDay, benchmarks: remote.benchmarks || local.benchmarks,
    v2: { ...r, ...l, logs: { ...(r.logs || {}), ...(l.logs || {}) }, daily, tests, settings: { ...(r.settings || {}), ...(l.settings || {}) } },
  };
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
const PAIN_AREAS = ["Knee", "Lower back", "Shoulder", "Hip", "Calf/Achilles", "Other"];
const RPE_LABELS = { 1: "Very easy", 2: "Easy", 3: "Moderate", 4: "Somewhat hard", 5: "Hard", 6: "Hard", 7: "Very hard", 8: "Very hard", 9: "Near max", 10: "Max" };
const DAY_NAMES = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

// Discipline look: line icon + colour token (defined in CSS for light and dark)
const KIND = {
  strength: { label: "Strength", Icon: Dumbbell, c: "var(--strength)" },
  bike: { label: "Bike", Icon: Bike, c: "var(--bike)" },
  swim: { label: "Swim", Icon: Waves, c: "var(--swim)" },
  run: { label: "Run", Icon: Footprints, c: "var(--run)" },
  test: { label: "Test", Icon: Timer, c: "var(--test)" },
  race: { label: "Race", Icon: Flag, c: "var(--race)" },
  mobility: { label: "Mobility", Icon: Activity, c: "var(--mob)" },
};

const CSS = `
:root{
  --bg:#F2F2F7; --card:#FFFFFF; --fill:rgba(118,118,128,.12); --fill2:rgba(118,118,128,.20);
  --sep:rgba(60,60,67,.18); --label:#000000; --label2:#55555B; --label3:#6E6E73;
  --tint:#0062CC; --tint-fill:#0066D6; --on-tint:#FFFFFF;
  --strength:#C2410C; --bike:#0062CC; --swim:#0B7A4B; --run:#4F46C8; --test:#8B3FC2; --race:#C8102E; --mob:#0B6E7E;
  --good:#1E7F3C; --warn:#A35400; --bad:#C8102E;
  --bar:rgba(249,249,249,.88); --overlay:rgba(0,0,0,.35); color-scheme:light;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#000000; --card:#1C1C1E; --fill:rgba(118,118,128,.24); --fill2:rgba(118,118,128,.36);
    --sep:rgba(84,84,88,.65); --label:#FFFFFF; --label2:#AEAEB2; --label3:#98989F;
    --tint:#0A84FF; --tint-fill:#0A84FF; --on-tint:#FFFFFF;
    --strength:#FF9F0A; --bike:#409CFF; --swim:#30D158; --run:#8E8CFF; --test:#C77DFF; --race:#FF6961; --mob:#64D2FF;
    --good:#30D158; --warn:#FFB340; --bad:#FF6961;
    --bar:rgba(22,22,24,.88); --overlay:rgba(0,0,0,.6); color-scheme:dark;
  }
}
html{font-size:106.25%;-webkit-text-size-adjust:100%}
@supports (font: -apple-system-body){html{font:-apple-system-body}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--label);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.35;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:inherit}
input,textarea,select{font:inherit;color:var(--label)}
:focus-visible{outline:2px solid var(--tint);outline-offset:2px;border-radius:8px}
.num{font-variant-numeric:tabular-nums}
.app{max-width:720px;margin:0 auto;padding:0 16px calc(96px + env(safe-area-inset-bottom))}
.hdr{padding:calc(env(safe-area-inset-top) + 20px) 4px 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.large{font-size:2rem;line-height:1.2;font-weight:700;letter-spacing:-.02em}
.t2{font-size:1.294rem;line-height:1.25;font-weight:700;letter-spacing:-.01em}
.t3{font-size:1.176rem;line-height:1.25;font-weight:600}
.hl{font-size:1rem;font-weight:600}
.body{font-size:1rem}
.callout{font-size:.941rem}
.sub{font-size:.882rem;line-height:1.35}
.foot{font-size:.765rem;line-height:1.35}
.cap{font-size:.706rem;line-height:1.3}
.l2{color:var(--label2)} .l3{color:var(--label3)}
.sect{margin:24px 4px 8px;display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.card{background:var(--card);border-radius:14px;overflow:hidden}
.row{display:flex;align-items:center;gap:12px;min-height:48px;padding:11px 16px;position:relative;width:100%}
.row + .row::before,.rowsep::before{content:"";position:absolute;top:0;left:16px;right:0;height:1px;background:var(--sep);transform:scaleY(.6)}
.row.ind + .row.ind::before{left:60px}
.grow{flex:1;min-width:0}
.chev{color:var(--label3);flex-shrink:0}
.iconchip{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.btn{min-height:50px;border-radius:12px;padding:0 16px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.btn-primary{background:var(--tint-fill);color:var(--on-tint)}
.btn-fill{background:var(--fill);color:var(--tint)}
.btn-plain{color:var(--tint);min-height:44px;padding:0 8px}
.iconbtn{width:44px;height:44px;border-radius:22px;background:var(--fill);display:flex;align-items:center;justify-content:center;color:var(--tint);flex-shrink:0}
.pill{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 9px;font-size:.765rem;font-weight:600;white-space:nowrap}
.strip{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:2px}
.strip::-webkit-scrollbar{display:none}
.day{flex:1 1 0;min-width:42px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 0;border-radius:12px}
.day.sel{background:var(--card);box-shadow:0 0 0 2px var(--tint)}
.dot{width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center}
.tabbar{position:fixed;left:0;right:0;bottom:0;background:var(--bar);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-top:.5px solid var(--sep);display:flex;justify-content:center;padding-bottom:env(safe-area-inset-bottom);z-index:40}
.tabbar-in{display:flex;width:100%;max-width:720px}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0 6px;min-height:50px;color:var(--label3);font-size:.647rem;font-weight:500}
.tab.on{color:var(--tint)}
.overlay{position:fixed;inset:0;background:var(--overlay);z-index:60;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s ease}
.sheet{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;background:var(--bg);border-radius:14px 14px 0 0;padding:8px 16px calc(24px + env(safe-area-inset-bottom));animation:up .28s cubic-bezier(.2,.8,.2,1)}
.grabber{width:36px;height:5px;border-radius:3px;background:var(--fill2);margin:0 auto 8px}
.field{display:block;width:100%;min-height:48px;padding:12px 14px;border:0;border-radius:10px;background:var(--card);font-size:1rem;outline:none}
.label{font-size:.882rem;color:var(--label2);margin:16px 4px 6px;display:block}
.seg{display:grid;gap:6px}
.segbtn{min-height:44px;border-radius:10px;background:var(--card);font-weight:600;text-align:center}
.segbtn.on{background:var(--tint-fill);color:var(--on-tint)}
.chip{min-height:44px;padding:0 14px;border-radius:22px;background:var(--card);font-size:.941rem;text-align:center}
.chip.on{background:var(--bad);color:#fff}
.switch{width:51px;height:31px;border-radius:16px;background:var(--fill2);position:relative;flex-shrink:0;transition:background .2s}
.switch::after{content:"";position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:14px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:transform .2s}
.switch.on{background:#34C759}.switch.on::after{transform:translateX(20px)}
.bar-track{height:8px;border-radius:4px;overflow:hidden;display:flex;background:var(--fill)}
.kgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tile{background:var(--card);border-radius:14px;padding:14px 16px}
.big{font-size:1.765rem;font-weight:700;letter-spacing:-.01em;line-height:1.15}
@media(min-width:768px){.kgrid4{grid-template-columns:repeat(4,1fr)}}
@keyframes up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
`;

export default function App() {
  const [store, setStore] = useState({});
  const [syncStatus, setSyncStatus] = useState("loading");
  const saveTimer = useRef(null);
  const remoteOk = useRef(false); // never write to Supabase until we've read it, so a paused/offline start can't wipe it

  useEffect(() => {
    (async () => {
      let local = null;
      try { local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch {}
      const remote = await dbLoad();
      if (remote === undefined) { setStore(local || {}); setSyncStatus("offline"); return; }
      remoteOk.current = true;
      const merged = local ? mergeStores(remote, local) : remote;
      setStore(merged);
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(merged)); } catch {}
      if (JSON.stringify(merged) !== JSON.stringify(remote)) { const ok = await dbSave(merged); setSyncStatus(ok ? "synced" : "offline"); }
      else setSyncStatus("synced");
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
      saveTimer.current = setTimeout(async () => {
        let payload = next;
        if (!remoteOk.current) {
          const remote = await dbLoad();
          if (remote === undefined) { setSyncStatus("offline"); return; }
          remoteOk.current = true;
          payload = mergeStores(remote, next);
          setStore(payload);
          try { localStorage.setItem(LOCAL_KEY, JSON.stringify(payload)); } catch {}
        }
        const ok = await dbSave(payload); setSyncStatus(ok ? "synced" : "offline");
      }, 1000);
      return next;
    });
  }

  const ftp = currentFtp(v2);
  const css = currentCss(v2);
  const ctx = { ftp, gym: v2.settings.gym };
  const today = todayStr();
  const todayWeek = Math.min(Math.max(weekOfDate(today), 1), TOTAL_WEEKS + 8);
  const preStart = today < PLAN_START;

  const [tab, setTab] = useState("today");
  const [viewWeek, setViewWeek] = useState(todayWeek);
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null);

  const week = useMemo(() => buildWeek(viewWeek, ctx), [viewWeek, ftp, v2.settings.gym]);
  const phase = phaseOf(viewWeek);
  const wType = weekType(viewWeek);

  const defaultSel = useMemo(() => {
    const dow = (new Date().getDay() + 6) % 7;
    const open = week.filter(s => !v2.logs[s.id]);
    if (viewWeek !== todayWeek || preStart) return (open[0] || week[0])?.id;
    return (open.find(s => DAYS.indexOf(s.slot) >= dow) || open[0] || week[week.length - 1])?.id;
  }, [week, v2.logs, viewWeek, todayWeek, preStart]);
  const sel = week.find(s => s.id === selId) || week.find(s => s.id === defaultSel);
  const warns = useMemo(() => warnings(v2, ctx), [v2, ftp]);

  function logDate(s) {
    const planned = addDays(weekStartDate(s.week), DAYS.indexOf(s.slot));
    return s.week === todayWeek ? today : planned;
  }
  function saveLog(s, data) { updateV2(v => { v.logs[s.id] = { ...data, date: data.date || logDate(s), week: s.week, type: s.type }; }); setModal(null); }
  const quickDone = s => saveLog(s, { status: "done", min: s.minutes, rpe: s.rpe, quick: true });
  const skip = s => saveLog(s, { status: "skipped" });
  const undo = s => updateV2(v => { delete v.logs[s.id]; });
  function saveTests(kind, date, results) {
    updateV2(v => { Object.entries(results).forEach(([key, value]) => v.tests.push({ id: `${key}-${Date.now()}`, date, key, value, kind })); });
  }
  const saveDaily = (date, entry) => updateV2(v => { v.daily[date] = { ...(v.daily[date] || {}), ...entry }; });

  if (syncStatus === "loading") return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div className="iconchip" style={{ width: 56, height: 56, borderRadius: 14, background: "var(--fill)", color: "var(--tint)" }}><Bike size={28} /></div>
        <div className="sub l2">Loading your plan…</div>
      </div>
    </>
  );

  const weekReq = week.filter(s => !s.optional);
  const weekDone = weekReq.filter(s => v2.logs[s.id]?.status === "done").length;
  const checkin = v2.daily[today];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {tab === "today" && (
          <>
            <header className="hdr">
              <div style={{ minWidth: 0 }}>
                <div className="sub l2">{phase ? phase.name : "Maintenance"} · Week {viewWeek} of {TOTAL_WEEKS}</div>
                <h1 className="large">{viewWeek === todayWeek && !preStart ? "Today" : viewWeek === todayWeek + 1 || (preStart && viewWeek === 1) ? "Next week" : `Week ${viewWeek}`}</h1>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <WeekPill t={wType} />
                  <span className="foot l2 num">{weekDone} of {weekReq.length} done</span>
                  <SyncDot status={syncStatus} />
                </div>
              </div>
              <button className="iconbtn" aria-label="Settings" onClick={() => setModal({ kind: "settings" })}><Settings size={22} /></button>
            </header>

            {preStart && viewWeek === 1 && (
              <Banner kind="info">The plan starts Monday 2 November. Keep doing Workouts A & B until then.</Banner>
            )}
            {warns.length > 0 && <Alerts warns={warns} />}

            {viewWeek === todayWeek && !preStart && (
              <div className="card" style={{ marginTop: 12 }}>
                <button className="row ind" onClick={() => setModal({ kind: "checkin" })}>
                  <div className="iconchip" style={{ background: "var(--fill)", color: "var(--warn)" }}><Sun size={18} /></div>
                  <div className="grow">
                    <div className="body">Daily check-in</div>
                    <div className="sub l2">{checkin ? checkinSummary(checkin) : "Readiness, sleep and weight · 10 seconds"}</div>
                  </div>
                  {checkin ? <Check size={20} color="var(--good)" /> : <ChevronRight size={20} className="chev" />}
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <button className="iconbtn" style={{ background: "transparent" }} aria-label="Previous week" disabled={viewWeek <= 1} onClick={() => { setViewWeek(viewWeek - 1); setSelId(null); }}><ChevronLeft size={24} color={viewWeek <= 1 ? "var(--fill2)" : undefined} /></button>
              <div style={{ textAlign: "center" }}>
                <div className="hl num">Week {viewWeek} · {shortDate(weekStartDate(viewWeek))} – {shortDate(addDays(weekStartDate(viewWeek), 6))}</div>
                {viewWeek !== todayWeek && <button className="sub" style={{ color: "var(--tint)", minHeight: 32 }} onClick={() => { setViewWeek(todayWeek); setSelId(null); }}>Back to this week</button>}
              </div>
              <button className="iconbtn" style={{ background: "transparent" }} aria-label="Next week" disabled={viewWeek >= TOTAL_WEEKS + 8} onClick={() => { setViewWeek(viewWeek + 1); setSelId(null); }}><ChevronRight size={24} /></button>
            </div>
            <div className="strip" style={{ marginTop: 6 }} role="tablist" aria-label="Sessions this week">
              {week.map(s => {
                const l = v2.logs[s.id]; const k = KIND[s.type]; const isSel = sel && s.id === sel.id;
                const done = l?.status === "done", skipped = l?.status === "skipped";
                return (
                  <button key={s.id} role="tab" aria-selected={isSel} aria-label={`${DAY_NAMES[s.slot]} ${s.title}${done ? ", done" : skipped ? ", skipped" : ""}`} className={`day${isSel ? " sel" : ""}`} onClick={() => setSelId(s.id)}>
                    <span className="cap l2" style={{ fontWeight: 600 }}>{s.slot}</span>
                    <span className="dot" style={{ background: done ? k.c : "var(--fill)", color: done ? "var(--card)" : skipped ? "var(--label3)" : k.c, outline: s.optional && !done ? "1.5px dashed var(--fill2)" : "none" }}>
                      {done ? <Check size={18} strokeWidth={3} /> : skipped ? <X size={16} /> : <k.Icon size={18} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {sel && (
              <>
                <SessionCard s={sel} log={v2.logs[sel.id]}
                  onLog={() => setModal({ kind: "log", s: sel })} onQuick={() => quickDone(sel)} onSkip={() => skip(sel)} onUndo={() => undo(sel)}
                  onTest={() => setModal({ kind: "test", testKind: sel.test, s: sel })} />
                {(sel.type === "bike" || sel.test === "ftp") && <Disclosure title="Bike zones" sub={ftp ? `FTP ${ftp} W` : "Set after the ramp test"}><BikeZones ftp={ftp} /></Disclosure>}
                {(sel.type === "swim" || sel.test === "css") && <Disclosure title="Swim zones" sub={`CSS ${secToMMSS(css)}/100 m${cssIsStale(v2) ? " · old test" : ""}`}><SwimZonesList css={css} stale={cssIsStale(v2)} /></Disclosure>}
                {sel.cues && <Disclosure title="Stroke cues">{sel.cues.map((c, i) => <div key={i} className="row"><span className="body">{c}</span></div>)}</Disclosure>}
                {sel.type === "run" && <Banner kind="info">Run easy enough to talk in full sentences. Walk breaks are part of the plan.</Banner>}
              </>
            )}
            <Disclosure title="Mobility routine" sub="10 minutes · 3 or more days a week">
              {MOBILITY_ROUTINE.map((m, i) => <div key={i} className="row"><div className="grow"><div className="body">{m.name}</div><div className="sub l2">{m.detail}</div></div></div>)}
            </Disclosure>
          </>
        )}

        {tab === "plan" && <PlanTab todayWeek={todayWeek} ctx={ctx} logs={v2.logs} onOpenWeek={w => { setViewWeek(w); setSelId(null); setTab("today"); window.scrollTo(0, 0); }} />}
        {tab === "kpi" && <KpiTab v2={v2} ctx={ctx} todayWeek={todayWeek} onRecord={() => setModal({ kind: "pickTest" })} />}
      </div>

      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-in">
          {[["today", "Today", House], ["plan", "Plan", CalendarDays], ["kpi", "Progress", ChartColumn]].map(([id, label, Icon]) => (
            <button key={id} className={`tab${tab === id ? " on" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
              <Icon size={24} strokeWidth={tab === id ? 2.2 : 1.8} />{label}
            </button>
          ))}
        </div>
      </nav>

      {modal?.kind === "log" && <LogSheet s={modal.s} v2={v2} existing={v2.logs[modal.s.id]} hr={v2.settings.hr} onClose={() => setModal(null)} onSave={d => saveLog(modal.s, d)} />}
      {modal?.kind === "pickTest" && <PickTestSheet onClose={() => setModal(null)} onPick={k => setModal({ kind: "test", testKind: k })} />}
      {modal?.kind === "test" && <TestSheet kind={modal.testKind} onClose={() => setModal(null)} onSave={(date, results) => {
        saveTests(modal.testKind || "body", date, results);
        if (modal.s) saveLog(modal.s, { status: "done", min: modal.s.minutes, rpe: modal.s.rpe, date }); else setModal(null);
      }} />}
      {modal?.kind === "checkin" && <CheckinSheet entry={v2.daily[today] || {}} hr={v2.settings.hr} onClose={() => setModal(null)} onSave={e => { saveDaily(today, e); setModal(null); }} />}
      {modal?.kind === "settings" && <SettingsSheet settings={v2.settings} ftp={ftp} css={css} syncStatus={syncStatus} onClose={() => setModal(null)} onSave={st => { updateV2(v => { v.settings = { ...v.settings, ...st }; }); setModal(null); }} />}
    </>
  );
}

function checkinSummary(c) {
  const bits = [];
  if (c.ready) bits.push(`Readiness ${c.ready}/5`);
  if (c.sleep) bits.push(`${c.sleep} h sleep`);
  if (c.weight) bits.push(`${c.weight} kg`);
  if (c.mobility) bits.push("mobility done");
  return bits.join(" · ") || "Saved";
}

// ── Small building blocks ───────────────────────────────────
function WeekPill({ t }) {
  const m = WEEK_TYPE_META[t];
  const tone = { build: "var(--tint)", test: "var(--test)", race: "var(--race)", rehearsal: "var(--race)", holiday: "var(--run)" }[t] || "var(--label2)";
  return <span className="pill" style={{ background: "var(--fill)", color: tone }}>{m.label}</span>;
}
function SyncDot({ status }) {
  const c = status === "synced" ? "var(--good)" : status === "saving" ? "var(--warn)" : "var(--bad)";
  const txt = status === "synced" ? "Synced" : status === "saving" ? "Saving…" : "Offline";
  return <span className="foot l2" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 4, background: c }} />{txt}</span>;
}
function Banner({ kind = "info", children }) {
  const c = kind === "red" ? "var(--bad)" : kind === "amber" ? "var(--warn)" : "var(--tint)";
  const Icon = kind === "info" ? Info : TriangleAlert;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <Icon size={20} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
        <div className="callout grow">{children}</div>
      </div>
    </div>
  );
}
function Alerts({ warns }) {
  const [open, setOpen] = useState(false);
  const order = { red: 0, amber: 1, info: 2 };
  const sorted = [...warns].sort((a, b) => order[a.level] - order[b.level]);
  const shown = open ? sorted : sorted.slice(0, 1);
  return (
    <div className="card" style={{ marginTop: 12 }}>
      {shown.map((w, i) => {
        const c = w.level === "red" ? "var(--bad)" : w.level === "amber" ? "var(--warn)" : "var(--tint)";
        const Icon = w.level === "info" ? Info : TriangleAlert;
        return (
          <div key={i} className="row" style={{ alignItems: "flex-start" }}>
            <Icon size={20} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="callout grow">{w.text}</div>
          </div>
        );
      })}
      {sorted.length > 1 && (
        <button className="row" onClick={() => setOpen(!open)}>
          <span className="sub" style={{ color: "var(--tint)" }}>{open ? "Show less" : `${sorted.length - 1} more alert${sorted.length > 2 ? "s" : ""}`}</span>
        </button>
      )}
    </div>
  );
}
function Disclosure({ title, sub, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <button className="row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div className="grow"><div className="body">{title}</div>{sub && <div className="sub l2">{sub}</div>}</div>
        <ChevronDown size={20} className="chev" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && <div className="rowsep" style={{ position: "relative" }}>{children}</div>}
    </div>
  );
}

// ── Session card ────────────────────────────────────────────
function SessionCard({ s, log, onLog, onQuick, onSkip, onUndo, onTest }) {
  const k = KIND[s.type];
  const done = log?.status === "done", skipped = log?.status === "skipped";
  return (
    <section className="card" style={{ marginTop: 12 }} aria-label="Session">
      <div style={{ padding: "16px 16px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="iconchip" style={{ background: "var(--fill)", color: k.c }}><k.Icon size={18} /></div>
          <span className="sub" style={{ color: k.c, fontWeight: 600 }}>{k.label} · {DAY_NAMES[s.slot]}{s.optional ? " · optional" : ""}</span>
          {done && <span className="pill" style={{ marginLeft: "auto", background: "var(--fill)", color: "var(--good)" }}><Check size={14} strokeWidth={3} />Done</span>}
          {skipped && <span className="pill" style={{ marginLeft: "auto", background: "var(--fill)", color: "var(--label2)" }}>Skipped</span>}
        </div>
        <h2 className="t2" style={{ marginTop: 10 }}>{s.title}</h2>
        <div className="sub l2 num" style={{ marginTop: 4 }}>{s.minutes} min · effort {s.rpe}/10{s.hardMin ? ` · ${s.hardMin} min hard` : ""}</div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {log ? (
            <>
              <button className="btn btn-fill" style={{ flex: 1 }} onClick={onLog}>Edit log</button>
              <button className="btn btn-fill" onClick={onUndo}>Undo</button>
            </>
          ) : s.type === "test" ? (
            <>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onTest}>Record results</button>
              <button className="btn btn-fill" onClick={onSkip}>Skip</button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onLog}>Log session</button>
              <button className="btn btn-fill" aria-label="Mark done as planned" onClick={onQuick}><Check size={18} strokeWidth={2.5} />Done</button>
              <button className="btn btn-fill" onClick={onSkip}>Skip</button>
            </>
          )}
        </div>
        {done && !log.quick && (
          <div className="sub l2 num" style={{ marginTop: 10 }}>
            Logged {log.min || "–"} min · effort {log.rpe || "–"}/10{log.power ? ` · ${log.power} W` : ""}{log.hr ? ` · ${log.hr} bpm` : ""}{log.dist ? ` · ${log.dist} m` : ""}
            {log.pain?.length > 0 && <span style={{ color: "var(--bad)" }}> · Pain: {log.pain.join(", ")}</span>}
          </div>
        )}
      </div>

      {s.zwift && (
        <div className="row" style={{ alignItems: "flex-start", marginTop: 8 }}>
          <Bike size={18} color="var(--bike)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="sub l2 grow">{s.zwift}</div>
        </div>
      )}
      {s.note && <div className="row"><div className="sub l2">{s.note}</div></div>}

      <div style={{ marginTop: 4 }}>
        {s.blocks.map((b, i) => {
          if (b.divider) return <div key={i} className="foot" style={{ padding: "16px 16px 6px", color: k.c, fontWeight: 600 }}>{b.name}</div>;
          if (b.ex) return <LiftRow key={i} b={b} last={log?.lifts?.[b.ex]} />;
          return (
            <div key={i} className="row" style={{ alignItems: "flex-start" }}>
              <div className="grow"><div className="body">{b.name}</div>{b.detail && <div className="sub l2" style={{ marginTop: 2 }}>{b.detail}</div>}</div>
            </div>
          );
        })}
      </div>
      {s.notes?.length > 0 && (
        <div style={{ padding: "6px 0 8px" }}>
          {s.notes.map((n, i) => {
            const Icon = /film/i.test(n) ? Video : Lightbulb;
            return (
              <div key={i} className="row" style={{ alignItems: "flex-start", minHeight: 0, paddingTop: 8, paddingBottom: 8 }}>
                <Icon size={18} color="var(--label3)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="sub l2 grow">{n}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
function LiftRow({ b, last }) {
  const [open, setOpen] = useState(false);
  return (
    <button className="row" style={{ alignItems: "flex-start" }} aria-expanded={open} onClick={() => setOpen(!open)}>
      <div className="grow">
        <div className="body">{b.name}</div>
        <div className="sub l2" style={{ marginTop: 2 }}>{b.load !== "BW" ? `${b.load} · ` : ""}{b.rest} rest</div>
        {open && (
          <div className="sub l2" style={{ marginTop: 8, display: "grid", gap: 4 }}>
            <div><span style={{ color: "var(--label)" }}>Cue:</span> {b.cue}</div>
            <div><span style={{ color: "var(--label)" }}>Next step:</span> {b.next}</div>
            {last && <div><span style={{ color: "var(--label)" }}>Last time:</span> {last.w ? `${last.w} kg × ` : ""}{last.r}</div>}
          </div>
        )}
      </div>
      <div className="hl num" style={{ flexShrink: 0, textAlign: "right" }}>{b.sets} × {b.reps}</div>
    </button>
  );
}
function BikeZones({ ftp }) {
  return BIKE_ZONES.map(z => (
    <div key={z.key} className="row">
      <div className="grow body">{z.label}</div>
      <div className="body num l2">{ftp ? `${Math.round(z.lo * ftp / 100)}–${Math.round(z.hi * ftp / 100)} W` : `${z.lo}–${z.hi}%`}</div>
    </div>
  ));
}
function SwimZonesList({ css, stale }) {
  return (
    <>
      {swimZones(css).map(z => (
        <div key={z.key} className="row">
          <div className="grow body">{z.label}</div>
          <div className="body num l2">{z.pace}<span className="foot"> /100 m</span></div>
        </div>
      ))}
      {stale && <div className="row"><div className="sub l2">From your pre-break 1000 m test. Expect to be slower until the CSS test resets these.</div></div>}
    </>
  );
}

// ── Plan tab ────────────────────────────────────────────────
function PlanTab({ todayWeek, ctx, logs, onOpenWeek }) {
  const [open, setOpen] = useState(() => phaseOf(todayWeek)?.id || "restart");
  const pct = Math.min(100, Math.max(0, ((todayWeek - 0.5) / TOTAL_WEEKS) * 100));
  return (
    <>
      <header className="hdr"><div><div className="sub l2">Nov 2026 – Nov 2027</div><h1 className="large">Plan</h1></div></header>
      <p className="callout l2" style={{ margin: "0 4px" }}>Weeks run Monday to Sunday. Do the sessions in any order; missed sessions are skipped, not moved. Tap a week to open it.</p>

      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div className="bar-track" aria-hidden="true">
          {PHASES.map(p => <div key={p.id} style={{ flex: p.to - p.from + 1, background: p.color, opacity: todayWeek > p.to ? 0.35 : 0.9 }} />)}
        </div>
        <div style={{ position: "relative", height: 18 }}>
          <div className="cap" style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)", top: 4, fontWeight: 600 }}>▲ now</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 8 }}>
          {PHASES.map(p => <span key={p.id} className="foot l2" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: p.color }} />{p.name}</span>)}
        </div>
      </div>

      {PHASES.map(p => {
        const isOpen = open === p.id; const current = todayWeek >= p.from && todayWeek <= p.to;
        return (
          <section key={p.id} className="card" style={{ marginTop: 12, boxShadow: current ? "inset 0 0 0 2px var(--tint)" : "none" }}>
            <button className="row" aria-expanded={isOpen} style={{ alignItems: "flex-start", padding: "14px 16px" }} onClick={() => setOpen(isOpen ? null : p.id)}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: p.color, marginTop: 7, flexShrink: 0 }} />
              <div className="grow">
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span className="t3">{p.name}</span>{current && <span className="pill" style={{ background: "var(--fill)", color: "var(--tint)" }}>Now</span>}
                </div>
                <div className="sub l2 num">Weeks {p.from}–{p.to} · {shortDate(weekStartDate(p.from))} – {shortDate(addDays(weekStartDate(p.to), 6))}</div>
                <div className="callout" style={{ marginTop: 6 }}>{p.goal}</div>
                <div className="sub l2" style={{ marginTop: 4 }}>{p.template}</div>
              </div>
              <ChevronDown size={20} className="chev" style={{ marginTop: 4, transform: isOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {isOpen && (
              <>
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <Lightbulb size={18} color="var(--label3)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div className="sub l2 grow">{p.why}</div>
                </div>
                {Array.from({ length: p.to - p.from + 1 }, (_, i) => p.from + i).map(w => {
                  const wk = buildWeek(w, ctx); const done = wk.filter(s => logs[s.id]?.status === "done").length;
                  const ms = MILESTONES.filter(m => m.week === w);
                  return (
                    <button key={w} className="row" style={{ alignItems: "flex-start", opacity: w < todayWeek ? 0.6 : 1, background: w === todayWeek ? "var(--fill)" : "transparent" }} onClick={() => onOpenWeek(w)}>
                      <div className="grow">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className="hl num">Week {w}</span><span className="sub l2 num">{shortDate(weekStartDate(w))}</span><WeekPill t={weekType(w)} />
                          {done > 0 && <span className="foot l2 num">{done}/{wk.length} done</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {wk.map(s => { const k = KIND[s.type]; return <span key={s.id} title={s.title} style={{ color: k.c, opacity: s.optional ? 0.5 : 1, display: "inline-flex" }}><k.Icon size={16} /></span>; })}
                        </div>
                        {ms.map((m, i) => <div key={i} className="sub" style={{ color: "var(--test)", marginTop: 6 }}>★ {m.text}</div>)}
                      </div>
                      <ChevronRight size={18} className="chev" style={{ marginTop: 2 }} />
                    </button>
                  );
                })}
              </>
            )}
          </section>
        );
      })}

      <div className="sect"><h2 className="t3">Why this plan</h2></div>
      <div className="card">
        {RESEARCH_NOTES.map((n, i) => <ResearchRow key={i} n={n} />)}
      </div>
      <p className="foot l3" style={{ margin: "8px 4px 0" }}>Check references yourself; AI can get citation details wrong.</p>
    </>
  );
}
function ResearchRow({ n }) {
  const [open, setOpen] = useState(false);
  return (
    <button className="row" aria-expanded={open} style={{ alignItems: "flex-start" }} onClick={() => setOpen(!open)}>
      <div className="grow"><div className="body">{n.title}</div>{open && <div className="sub l2" style={{ marginTop: 4 }}>{n.text}</div>}</div>
      <ChevronDown size={18} className="chev" style={{ marginTop: 2, transform: open ? "rotate(180deg)" : "none" }} />
    </button>
  );
}

// ── Progress tab ────────────────────────────────────────────
function KpiTab({ v2, ctx, todayWeek, onRecord }) {
  const w = Math.max(1, todayWeek);
  const cur = weekSummary(v2, w, ctx);
  const ramp = rampPct(v2, w, ctx);
  const hist = Array.from({ length: 8 }, (_, i) => w - 7 + i).filter(x => x >= 1).map(x => weekSummary(v2, x, ctx));
  const isCur = w === weekOfDate(todayStr());
  const elapsed = isCur ? ((new Date().getDay() + 6) % 7) + 1 : 7;
  const due = isCur ? buildWeek(w, ctx).filter(s => !s.optional && DAYS.indexOf(s.slot) < elapsed - 1).length : cur.planned;
  const compDue = due ? Math.min(1, cur.done / due) : 1;
  const perDay = n => n / elapsed;
  const tone = (ok, warn) => (ok ? "var(--good)" : warn ? "var(--warn)" : "var(--bad)");

  const tested = Object.entries(TEST_DEFS).map(([k, d]) => ({ k, d, data: series(v2, k) }));
  const empty = tested.filter(t => !t.data.length);

  return (
    <>
      <header className="hdr"><div><div className="sub l2 num">Week {w}</div><h1 className="large">Progress</h1></div>
        <button className="iconbtn" aria-label="Record results" onClick={onRecord}><Plus size={22} /></button>
      </header>

      <div className="sect" style={{ marginTop: 8 }}><h2 className="t3">This week</h2></div>
      <div className="kgrid kgrid4">
        <Tile label="Sessions" value={`${cur.done}/${cur.planned}`} sub={isCur ? `${due} due so far · aim 80%+` : "Aim 80%+"} color={due === 0 ? "var(--label3)" : tone(compDue >= 0.8, compDue >= 0.6)} />
        <Tile label="Hours" value={(cur.doneMin / 60).toFixed(1)} sub={`of ${(cur.plannedMin / 60).toFixed(1)} planned`} color="var(--tint)" />
        <Tile label="Load" value={cur.load} sub={ramp == null ? "effort × minutes" : `${ramp >= 0 ? "+" : ""}${Math.round(ramp * 100)}% vs 3-week avg`} color={ramp == null ? "var(--label3)" : tone(ramp <= 0.2, ramp <= 0.3)} />
        <Tile label="Easy share" value={cur.easyShare == null ? "–" : `${Math.round(cur.easyShare * 100)}%`} sub="Aim 75–80%" color={cur.easyShare == null ? "var(--label3)" : tone(cur.easyShare >= 0.72, cur.easyShare >= 0.65)} />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <StatRow label="Mobility days" value={`${cur.mobilityDays} of 7`} sub="Aim 3+" color={tone(perDay(cur.mobilityDays) >= 3 / 7, perDay(cur.mobilityDays) >= 1 / 7)} />
        <StatRow label="Protein target days" value={`${cur.proteinDays} of 7`} sub="160 g · aim 5+" color={tone(perDay(cur.proteinDays) >= 5 / 7, perDay(cur.proteinDays) >= 3 / 7)} />
        <StatRow label="Sleep" value={cur.sleep ? `${cur.sleep.toFixed(1)} h` : "–"} sub="Aim 7+ h" color={cur.sleep == null ? "var(--label3)" : tone(cur.sleep >= 7, cur.sleep >= 6)} />
        <StatRow label="Readiness" value={cur.ready ? `${cur.ready.toFixed(1)}/5` : "–"} sub={cur.rhr ? `Resting HR ${Math.round(cur.rhr)} bpm` : "From check-ins"} color={cur.ready == null ? "var(--label3)" : tone(cur.ready >= 3.5, cur.ready >= 2.5)} />
      </div>

      <div className="sect"><h2 className="t3">Last 8 weeks</h2></div>
      <div className="card" style={{ padding: "14px 16px" }}>
        <Bars label="Sessions completed" data={hist.map(h => ({ w: h.week, v: h.completion }))} max={1} fmt={v => `${Math.round(v * 100)}%`} target={0.8} />
        <Bars label="Training load" data={hist.map(h => ({ w: h.week, v: h.load }))} fmt={v => v} />
        <Bars label="Hours" data={hist.map(h => ({ w: h.week, v: h.doneMin / 60 }))} fmt={v => v.toFixed(1)} last />
      </div>

      <div className="sect"><h2 className="t3">Results</h2><button className="btn-plain sub" onClick={onRecord}>Record</button></div>
      {TEST_GROUPS.map(g => {
        const rows = tested.filter(t => t.d.group === g && t.data.length);
        if (!rows.length) return null;
        return (
          <div key={g} style={{ marginBottom: 12 }}>
            <div className="foot l2" style={{ margin: "0 16px 6px", fontWeight: 600 }}>{g}</div>
            <div className="card">{rows.map(t => <KpiRow key={t.k} d={t.d} data={t.data} />)}</div>
          </div>
        );
      })}
      {empty.length > 0 && (
        <div className="card">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <Info size={18} color="var(--label3)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="sub l2 grow">Not tested yet: {empty.map(t => t.d.label).join(", ")}. They appear here after your first test week.</div>
          </div>
        </div>
      )}
    </>
  );
}
function Tile({ label, value, sub, color }) {
  return (
    <div className="tile">
      <div className="sub l2" style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />{label}</div>
      <div className="big num" style={{ marginTop: 6 }}>{value}</div>
      <div className="foot l2" style={{ marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function StatRow({ label, value, sub, color }) {
  return (
    <div className="row">
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
      <div className="grow"><div className="body">{label}</div><div className="sub l2">{sub}</div></div>
      <div className="hl num">{value}</div>
    </div>
  );
}
function KpiRow({ d, data }) {
  const fmt = v => (d.fmt === "time" ? secToMMSS(v) : Number.isInteger(v) ? v : v.toFixed(1));
  const lastV = data[data.length - 1].value;
  const delta = data.length > 1 ? lastV - data[0].value : null;
  const improved = delta != null && (d.better === "up" ? delta > 0 : delta < 0);
  return (
    <div className="row">
      <div className="grow"><div className="body">{d.label}</div><div className="sub l2">Target: {d.target}</div></div>
      <Spark data={data.map(p => p.value)} color={improved ? "var(--good)" : "var(--label3)"} />
      <div style={{ textAlign: "right", minWidth: 72 }}>
        <div className="hl num">{fmt(lastV)}<span className="foot l2" style={{ fontWeight: 400 }}> {d.unit}</span></div>
        {delta != null && delta !== 0 && <div className="foot num" style={{ color: improved ? "var(--good)" : "var(--bad)" }}>{delta > 0 ? "▲" : "▼"} {d.fmt === "time" ? `${Math.abs(delta).toFixed(1)} s` : Math.abs(delta).toFixed(1)}</div>}
      </div>
    </div>
  );
}
function Spark({ data, color }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 52 + 2},${20 - ((v - min) / r) * 16}`).join(" ");
  return <svg width="56" height="24" viewBox="0 0 56 24" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Bars({ label, data, max, fmt, target, last }) {
  const m = max || Math.max(1, ...data.map(d => d.v));
  return (
    <div style={{ marginBottom: last ? 0 : 18 }}>
      <div className="sub l2" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 76, position: "relative" }}>
        {target != null && <div style={{ position: "absolute", left: 0, right: 0, bottom: (target / m) * 50 + 18, borderTop: "1px dashed var(--fill2)" }} />}
        {data.map(d => (
          <div key={d.w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            <div className="cap l2 num">{d.v ? fmt(d.v) : ""}</div>
            <div style={{ width: "100%", maxWidth: 36, height: Math.max(3, (d.v / m) * 50), background: d.v ? "var(--tint)" : "var(--fill)", borderRadius: 4, marginTop: 2 }} />
            <div className="cap l3 num" style={{ marginTop: 4 }}>W{d.w}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sheets ─────────────────────────────────────────────────
function Sheet({ title, sub, onClose, children }) {
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="grabber" />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ paddingTop: 6 }}><h2 className="t3">{title}</h2>{sub && <div className="sub l2" style={{ marginTop: 2 }}>{sub}</div>}</div>
          <button className="iconbtn" aria-label="Close" onClick={onClose} style={{ color: "var(--label2)" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }) { return <label style={{ display: "block", flex: 1, minWidth: 0 }}><span className="label">{label}</span>{children}</label>; }
function Seg({ n, value, onChange, labels }) {
  return (
    <div className="seg" style={{ gridTemplateColumns: `repeat(${Math.min(n, 5)},1fr)` }}>
      {Array.from({ length: n }, (_, i) => i + 1).map(v => (
        <button key={v} className={`segbtn num${value === v ? " on" : ""}`} aria-pressed={value === v} onClick={() => onChange(v)}>{labels ? labels[v - 1] : v}</button>
      ))}
    </div>
  );
}
function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => { const on = value.includes(o); return <button key={o} className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}>{o}</button>; })}
    </div>
  );
}
function SwitchRow({ on, onClick, label, sub }) {
  return (
    <button className="row" role="switch" aria-checked={on} onClick={onClick}>
      <div className="grow"><div className="body">{label}</div>{sub && <div className="sub l2">{sub}</div>}</div>
      <span className={`switch${on ? " on" : ""}`} />
    </button>
  );
}

function LogSheet({ s, v2, existing, hr, onClose, onSave }) {
  const lifts = s.blocks.filter(b => b.ex);
  const lastLift = ex => Object.values(v2.logs).filter(l => l?.lifts?.[ex]).sort((a, b) => b.date.localeCompare(a.date))[0]?.lifts[ex];
  const [min, setMin] = useState(existing?.min ?? s.minutes);
  const [rpe, setRpe] = useState(existing?.rpe ?? s.rpe);
  const [power, setPower] = useState(existing?.power ?? "");
  const [hrv, setHr] = useState(existing?.hr ?? "");
  const [dist, setDist] = useState(existing?.dist ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pain, setPain] = useState(existing?.pain ?? []);
  const [lv, setLv] = useState(() => Object.fromEntries(lifts.map(b => [b.ex, existing?.lifts?.[b.ex] || lastLift(b.ex) || { w: "", r: "" }])));
  return (
    <Sheet title="Log session" sub={s.title} onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Minutes"><input className="field num" type="number" inputMode="numeric" value={min} onChange={e => setMin(e.target.value)} /></Field>
        {(s.type === "bike" || s.type === "race") && <Field label="Avg power (W)"><input className="field num" type="number" inputMode="numeric" value={power} onChange={e => setPower(e.target.value)} /></Field>}
        {s.type === "swim" && <Field label="Distance (m)"><input className="field num" type="number" inputMode="numeric" value={dist} onChange={e => setDist(e.target.value)} /></Field>}
        {hr && s.type !== "strength" && <Field label="Avg HR"><input className="field num" type="number" inputMode="numeric" value={hrv} onChange={e => setHr(e.target.value)} /></Field>}
      </div>
      <span className="label">Effort: <b style={{ color: "var(--label)" }}>{rpe}/10 · {RPE_LABELS[rpe]}</b></span>
      <Seg n={10} value={rpe} onChange={setRpe} />
      {lifts.length > 0 && (
        <>
          <span className="label">Top set per exercise</span>
          <div className="card">
            {lifts.map(b => {
              const unit = / s\b/.test(b.reps) ? "sec" : / m\b/.test(b.reps) ? "m" : "reps";
              return (
                <div key={b.ex} className="row">
                  <div className="grow body" style={{ minWidth: 0 }}>{b.name}</div>
                  <input aria-label={`${b.name} kg`} placeholder="kg" className="field num" style={{ width: 72, minHeight: 44, padding: "8px 10px", background: "var(--fill)" }} type="number" inputMode="decimal" value={lv[b.ex].w} onChange={e => setLv({ ...lv, [b.ex]: { ...lv[b.ex], w: e.target.value } })} />
                  <input aria-label={`${b.name} ${unit}`} placeholder={unit} className="field num" style={{ width: 72, minHeight: 44, padding: "8px 10px", background: "var(--fill)" }} type="number" inputMode="numeric" value={lv[b.ex].r} onChange={e => setLv({ ...lv, [b.ex]: { ...lv[b.ex], r: e.target.value } })} />
                </div>
              );
            })}
          </div>
          <div className="foot l2" style={{ margin: "6px 4px 0" }}>Prefilled from last time. Leave kg empty for bodyweight.</div>
        </>
      )}
      <span className="label">Any pain? (not muscle burn)</span>
      <Chips options={PAIN_AREAS} value={pain} onChange={setPain} />
      <span className="label">Notes</span>
      <textarea className="field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} placeholder="Optional" />
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => onSave({
        status: "done", min: Number(min) || s.minutes, rpe, power, hr: hrv, dist, notes, pain, date: existing?.date,
        lifts: Object.fromEntries(Object.entries(lv).filter(([, v]) => v.r !== "" && v.r != null)),
      })}>Save</button>
    </Sheet>
  );
}

function PickTestSheet({ onClose, onPick }) {
  const opts = [["ftp", "FTP", "From the Zwift ramp test", Bike], ["css", "CSS test", "400 m and 200 m times", Waves], ["strength", "Strength rep tests", "Kettlebell and bodyweight", Dumbbell], ["gym", "Gym e1RM tests", "Heavy set of 3–5", Dumbbell], ["mobility", "Mobility tests", "Ankle, hamstring, overhead, squat", Activity], ["body", "Body and blood", "Waist, ferritin, ALT, decoupling", Timer]];
  return (
    <Sheet title="Record results" onClose={onClose}>
      <div className="card" style={{ marginTop: 12 }}>
        {opts.map(([k, l, s, Icon]) => (
          <button key={k} className="row ind" onClick={() => onPick(k)}>
            <div className="iconchip" style={{ background: "var(--fill)", color: "var(--tint)" }}><Icon size={18} /></div>
            <div className="grow"><div className="body">{l}</div><div className="sub l2">{s}</div></div>
            <ChevronRight size={18} className="chev" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function TestSheet({ kind, onClose, onSave }) {
  const k = kind || "body";
  const fields = TEST_FORMS[k] || TEST_FORMS.body;
  const [raw, setRaw] = useState({});
  const [date, setDate] = useState(todayStr());
  const preview = resultsFromForm(k, raw);
  const titles = { ftp: "FTP", css: "CSS test", strength: "Strength tests", gym: "Gym e1RM tests", mobility: "Mobility tests", body: "Measurements" };
  const has = Object.keys(preview).length > 0;
  return (
    <Sheet title={titles[k]} sub="Leave anything you didn't test empty." onClose={onClose}>
      <Field label="Date"><input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      {fields.map(f => (
        <Field key={f.key} label={f.label}>
          <input className="field num" value={raw[f.key] || ""} inputMode={f.time || f.wr ? "text" : "decimal"} placeholder={f.time ? "e.g. 6:52" : f.wr ? "e.g. 80 x 5" : ""} onChange={e => setRaw({ ...raw, [f.key]: e.target.value })} />
        </Field>
      ))}
      {has && (
        <div className="card" style={{ marginTop: 16 }}>
          {Object.entries(preview).map(([key, v]) => (
            <div key={key} className="row"><div className="grow body">{TEST_DEFS[key]?.label}</div><div className="hl num">{TEST_DEFS[key]?.fmt === "time" ? secToMMSS(v) : v} <span className="foot l2" style={{ fontWeight: 400 }}>{TEST_DEFS[key]?.unit}</span></div></div>
          ))}
        </div>
      )}
      <button className="btn btn-primary" disabled={!has} style={{ width: "100%", marginTop: 20, opacity: has ? 1 : 0.4 }} onClick={() => onSave(date, preview)}>Save results</button>
    </Sheet>
  );
}

function CheckinSheet({ entry, hr, onClose, onSave }) {
  const [ready, setReady] = useState(entry.ready || 3);
  const [sleep, setSleep] = useState(entry.sleep ?? "");
  const [rhr, setRhr] = useState(entry.rhr ?? "");
  const [weight, setWeight] = useState(entry.weight ?? "");
  const [protein, setProtein] = useState(!!entry.protein);
  const [mobility, setMobility] = useState(!!entry.mobility);
  const [pain, setPain] = useState(entry.pain || []);
  return (
    <Sheet title="Daily check-in" sub="Morning: readiness, sleep, weight. Evening: tick protein and mobility." onClose={onClose}>
      <span className="label">How ready do you feel? <b style={{ color: "var(--label)" }}>{ready}/5</b></span>
      <Seg n={5} value={ready} onChange={setReady} />
      <div className="foot l2" style={{ display: "flex", justifyContent: "space-between", margin: "6px 4px 0" }}><span>1 · wrecked</span><span>5 · ready to go</span></div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Sleep (hours)"><input className="field num" type="number" inputMode="decimal" value={sleep} onChange={e => setSleep(e.target.value)} /></Field>
        <Field label="Weight (kg)"><input className="field num" type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /></Field>
        {hr && <Field label="Resting HR"><input className="field num" type="number" inputMode="numeric" value={rhr} onChange={e => setRhr(e.target.value)} /></Field>}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <SwitchRow on={protein} onClick={() => setProtein(!protein)} label="Hit 160 g protein" />
        <SwitchRow on={mobility} onClick={() => setMobility(!mobility)} label="Did the mobility routine" />
      </div>
      <span className="label">Any pain today?</span>
      <Chips options={PAIN_AREAS} value={pain} onChange={setPain} />
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => onSave({ ready, sleep: sleep === "" ? null : Number(sleep), rhr: rhr === "" ? null : Number(rhr), weight: weight === "" ? null : Number(weight), protein, mobility, pain })}>Save</button>
    </Sheet>
  );
}

function SettingsSheet({ settings, ftp, css, syncStatus, onClose, onSave }) {
  const [gym, setGym] = useState(settings.gym);
  const [hr, setHr] = useState(settings.hr);
  const [bloodTest, setBloodTest] = useState(settings.bloodTest || "");
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row"><div className="grow body">FTP</div><div className="body l2 num">{ftp ? `${ftp} W` : "Not tested yet"}</div></div>
        <div className="row"><div className="grow body">CSS</div><div className="body l2 num">{secToMMSS(css)} /100 m</div></div>
        <div className="row"><div className="grow body">Sync</div><SyncDot status={syncStatus} /></div>
      </div>
      <div className="foot l2" style={{ margin: "6px 16px 0" }}>FTP and CSS update from your test results.</div>
      <div className="card" style={{ marginTop: 16 }}>
        <SwitchRow on={gym} onClick={() => setGym(!gym)} label="Gym access" sub="From January 2027. Off = kettlebell versions" />
        <SwitchRow on={hr} onClick={() => setHr(!hr)} label="Heart rate strap or watch" sub="Adds heart rate fields" />
      </div>
      <Field label="Next blood test (no lifting or intervals 5 days before)"><input className="field" type="date" value={bloodTest} onChange={e => setBloodTest(e.target.value)} /></Field>
      <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => onSave({ gym, hr, bloodTest })}>Save</button>
    </Sheet>
  );
}

import { useState, useEffect, useRef } from "react";
import { supabase, isSyncConfigured, STATE_TABLE } from "./supabaseClient";

// ═══════════════════════════════════════════════════════════════════════════════
// Time to Live — a contemplative "life in weeks" companion
// Three surfaces: Weeks (contemplate) · Reflect (gratitude) · Intentions (direction)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Theme (black tuxedo) ─────────────────────────────────────────────────────
const T = {
  bg: "#0A0A0C",
  bgAlt: "#141418",
  card: "rgba(255,255,255,0.045)",
  cardBorder: "rgba(255,255,255,0.09)",
  text: "#F4F4F6",
  muted: "#A6A6AE",
  dim: "#61616B",
  accent: "#C9A24B",
  accentLight: "#E4C878",
  crimson: "#C0424A",
  gradient: "linear-gradient(135deg, #FFFFFF, #D6D6DC)",
  gradientSoft: "linear-gradient(160deg, #0C0C0F 0%, #100F13 45%, #08080A 100%)",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.12)",
};

const SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif";
const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';

const card = { background: T.card, borderRadius: 16, border: `1px solid ${T.cardBorder}` };
const btn = { background: T.gradient, color: "#0A0A0C", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: SANS };
const btnOutline = { background: "rgba(255,255,255,0.05)", color: T.text, borderRadius: 12, border: `1px solid ${T.cardBorder}`, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS };
const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${T.inputBorder}`, background: T.inputBg, color: T.text, fontSize: 15, boxSizing: "border-box", outline: "none", fontFamily: SANS };
const label = { fontSize: 10.5, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: SANS };

// ─── Small helpers ────────────────────────────────────────────────────────────
function readJSON(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
function relAgo(ts) {
  if (!ts) return "";
  const d = (Date.now() - ts) / 86400000;
  if (d < 1) return "today";
  if (d < 7) return `${Math.floor(d)}d ago`;
  if (d < 30) return `${Math.max(1, Math.floor(d / 7))}w ago`;
  if (d < 365) return `${Math.max(1, Math.floor(d / 30))}mo ago`;
  return `${Math.max(1, Math.floor(d / 365))}y ago`;
}
// Highlight reel: nearest reflection to ~a week / month / year ago, plus the first entry.
function buildReel(reflections) {
  if (!reflections || !reflections.length) return [];
  const now = Date.now(), DAY = 86400000;
  const markers = [
    { key: "year", label: "A year ago", days: 365 },
    { key: "month", label: "A month ago", days: 30 },
    { key: "week", label: "A week ago", days: 7 },
  ];
  const used = new Set();
  const cards = [];
  for (const m of markers) {
    const target = now - m.days * DAY;
    let best = null, bestDiff = Infinity;
    for (const r of reflections) {
      if (used.has(r.id)) continue;
      const t = new Date(r.date).getTime();
      if ((now - t) / DAY < m.days * 0.5) continue; // too recent to count for this marker
      const diff = Math.abs(t - target);
      if (diff < bestDiff) { bestDiff = diff; best = r; }
    }
    if (best) { used.add(best.id); cards.push({ ...best, marker: m.label, rank: m.days }); }
  }
  const oldest = [...reflections].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (oldest && !used.has(oldest.id)) cards.push({ ...oldest, marker: "Your first entry", rank: Infinity });
  return cards.sort((a, b) => a.rank - b.rank);
}

const REFLECT_PROMPTS = [
  "What are you grateful for today?",
  "What mattered most this week?",
  "What do you want to remember about this moment?",
  "Who are you thankful for right now?",
  "What felt meaningful today?",
  "What made today feel well-lived?",
  "What small thing brought you joy?",
];
const CLOSING_QUOTE = "Life is to be lived.";

// ─── Brand + line icons ───────────────────────────────────────────────────────
function HourMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3H17M7 21H17M8 3.5C8 8 12 10 12 12C12 14 8 16 8 20.5M16 3.5C16 8 12 10 12 12C12 14 16 16 16 20.5" />
      <path d="M9.5 18.5C10 16.5 14 16.5 14.5 18.5" stroke="#E4C878" opacity="0.9" />
    </svg>
  );
}
function BrandTitle({ size = 22 }) {
  return (
    <span style={{ fontFamily: SERIF, fontSize: size, fontWeight: 500, letterSpacing: "0.4px", color: T.text }}>
      Time to <span style={{ color: T.accentLight }}>Live</span>
    </span>
  );
}
const strokeIcon = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
function IconWeeks({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...strokeIcon}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>);
}
function IconReflect({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...strokeIcon}>
    <path d="M5 21C5 12.5 11.5 5.5 20 4.5C20 13 13.5 20 5 21Z" /><path d="M6 20C10 16 13.5 12.5 17 9" />
  </svg>);
}
function IconIntentions({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...strokeIcon}>
    <circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5L10.8 10.8L8.5 15.5L13.2 13.2Z" />
  </svg>);
}
function IconSettings({ size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...strokeIcon}>
    <line x1="4" y1="8" x2="20" y2="8" /><circle cx="9" cy="8" r="2.3" fill={T.bg} />
    <line x1="4" y1="16" x2="20" y2="16" /><circle cx="15" cy="16" r="2.3" fill={T.bg} />
  </svg>);
}

// ─── Ambience: grain + vignette + motion ──────────────────────────────────────
function Ambience() {
  const noise = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  return <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 3, opacity: 0.03, backgroundImage: `url("${noise}")` }} />;
}
function GlobalStyles() {
  const css = `
:root { color-scheme: dark; }
@keyframes ttlFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.ttl-fade { animation: ttlFade 0.6s ease both; }
.ttl-topbar, .ttl-bottomnav { display: none; }
@media (max-width: 768px) {
  .ttl-sidebar { display: none !important; }
  .ttl-topbar { display: flex !important; }
  .ttl-bottomnav { display: flex !important; }
  .ttl-page > div { padding: 18px 18px calc(96px + env(safe-area-inset-bottom)) !important; max-width: 100% !important; margin: 0 !important; }
}
@media (prefers-reduced-motion: reduce) { .ttl-fade { animation: none; } }
textarea, input { font-family: ${SANS}; }
::placeholder { color: ${T.dim}; }
`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── Life in Weeks grid (SVG) ─────────────────────────────────────────────────
function weeksSVG(targetAge, livedWeeks) {
  const COLS = 52, cell = 8, gap = 2, pitch = cell + gap;
  const rows = Math.max(1, targetAge);
  const w = COLS * pitch - gap, h = rows * pitch - gap;
  let r = "";
  for (let y = 0; y < rows; y++) {
    for (let c = 0; c < COLS; c++) {
      const idx = y * COLS + c, x = c * pitch, yy = y * pitch;
      if (idx < livedWeeks) r += `<rect x="${x}" y="${yy}" width="${cell}" height="${cell}" rx="1.6" fill="#E8E8EC" fill-opacity="0.9"/>`;
      else r += `<rect x="${x}" y="${yy}" width="${cell}" height="${cell}" rx="1.6" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="0.9"/>`;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
}

function WeeksPage({ config }) {
  const targetAge = config.targetAge || 90;
  const currentAge = config.currentAge || 0;
  const totalWeeks = Math.round(targetAge * 52);
  const livedWeeks = Math.min(totalWeeks, Math.round(currentAge * 52));
  const remaining = Math.max(0, totalWeeks - livedWeeks);
  const who = config.name ? `${config.name}'s` : "Your";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="ttl-fade" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: "20px 20px 10px", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: 14, flexShrink: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 500, color: T.text, letterSpacing: "2px", textTransform: "uppercase" }}>
          {who} Life in Weeks
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: T.muted, marginTop: 6, letterSpacing: "0.3px" }}>{today}</div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: T.dim, marginTop: 8, letterSpacing: "0.4px" }}>
          <span style={{ color: T.text, fontWeight: 600 }}>{livedWeeks.toLocaleString()}</span> weeks lived
          <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>
          <span style={{ color: T.accentLight, fontWeight: 600 }}>{remaining.toLocaleString()}</span> ahead
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        dangerouslySetInnerHTML={{ __html: weeksSVG(targetAge, livedWeeks) }} />
    </div>
  );
}

// ─── Reflect (gratitude practice) ─────────────────────────────────────────────
function ReflectPage({ reflections, setReflections }) {
  const prompt = REFLECT_PROMPTS[dayOfYear() % REFLECT_PROMPTS.length];
  const [text, setText] = useState("");
  const reel = buildReel(reflections);

  const save = () => {
    if (!text.trim()) return;
    setReflections([{ id: Date.now().toString(), date: new Date().toISOString(), prompt, text: text.trim() }, ...reflections]);
    setText("");
  };

  return (
    <div className="ttl-fade" style={{ padding: "18px 20px 40px", maxWidth: 620, margin: "0 auto" }}>
      <div style={label}>Today's reflection</div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 25, color: T.text, margin: "8px 0 14px", lineHeight: 1.25 }}>{prompt}</h1>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Take a quiet moment…"
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontSize: 16 }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={save} style={{ ...btn, padding: "10px 26px", opacity: text.trim() ? 1 : 0.5 }}>Save</button>
      </div>

      {reel.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ ...label, color: T.dim, marginBottom: 12 }}>Looking back</div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, margin: "0 -20px", padding: "0 20px 6px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
            {reel.map((r) => (
              <div key={r.id} style={{ ...card, padding: 15, minWidth: 220, maxWidth: 220, flexShrink: 0, scrollSnapAlign: "start" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: SANS }}>{r.marker}</div>
                <div style={{ fontSize: 10.5, color: T.dim, fontFamily: SANS, margin: "5px 0 8px" }}>{fmtDate(r.date)}</div>
                <div style={{ fontFamily: SERIF, fontSize: 15.5, color: T.text, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reflections.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ ...label, color: T.dim, marginBottom: 12 }}>All reflections</div>
          {reflections.map((r) => (
            <div key={r.id} style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.dim, fontFamily: SANS, marginBottom: 6, letterSpacing: "0.3px" }}>{fmtDate(r.date)}{r.prompt ? ` · ${r.prompt}` : ""}</div>
              <div style={{ fontFamily: SERIF, fontSize: 17, color: T.text, lineHeight: 1.55 }}>{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Intentions (direction) ───────────────────────────────────────────────────
function IntentionsPage({ intentions, setIntentions }) {
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);

  const submit = () => {
    if (!text.trim()) return;
    if (editId) { setIntentions(intentions.map((i) => (i.id === editId ? { ...i, text: text.trim() } : i))); setEditId(null); }
    else setIntentions([...intentions, { id: Date.now().toString(), text: text.trim(), createdAt: Date.now() }]);
    setText("");
  };
  const edit = (i) => { setEditId(i.id); setText(i.text); };
  const remove = (id) => { setIntentions(intentions.filter((i) => i.id !== id)); if (editId === id) { setEditId(null); setText(""); } };

  return (
    <div className="ttl-fade" style={{ padding: "18px 20px 40px", maxWidth: 620, margin: "0 auto" }}>
      <div style={label}>Legacy</div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 25, color: T.text, margin: "8px 0 6px" }}>What will you leave behind?</h1>
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: T.muted, margin: "0 0 18px", lineHeight: 1.6 }}>
        The things you want to live for — and be remembered by.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Raise children who are kind and brave" style={inputStyle} />
        <button onClick={submit} style={{ ...btn, padding: "0 20px", flexShrink: 0, opacity: text.trim() ? 1 : 0.5 }}>{editId ? "Update" : "Add"}</button>
      </div>

      {intentions.length === 0 ? (
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 17, color: T.dim, textAlign: "center", marginTop: 30 }}>
          Nothing yet. Name what you'll leave.
        </p>
      ) : (
        intentions.map((i) => (
          <div key={i.id} style={{ ...card, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 18, color: T.text, lineHeight: 1.4 }}>{i.text}</div>
              {i.createdAt && <div style={{ fontFamily: SANS, fontSize: 10.5, color: T.dim, marginTop: 3, letterSpacing: "0.3px" }}>Set {relAgo(i.createdAt)}</div>}
            </div>
            <button onClick={() => edit(i)} title="Edit" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13, padding: 4 }}>{"\u270E"}</button>
            <button onClick={() => remove(i.id)} title="Remove" style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 14, padding: 4 }}>{"\u2715"}</button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPage({ config, setConfig, session, syncStatus, onOpenAuth, onSignOut, onReset }) {
  const [name, setName] = useState(config.name || "");
  const [currentAge, setCurrentAge] = useState(config.currentAge);
  const [targetAge, setTargetAge] = useState(config.targetAge);

  return (
    <div className="ttl-fade" style={{ padding: "26px 24px 40px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 27, color: T.text, margin: "0 0 20px" }}>Settings</h1>

      <div style={{ ...card, padding: 24 }}>
        <div style={label}>Your name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ ...inputStyle, marginTop: 6, marginBottom: 20 }} />

        <div style={label}>Current age</div>
        <input type="range" min={1} max={100} value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: T.accent }} />
        <div style={{ textAlign: "center", marginBottom: 18, fontFamily: SERIF, fontSize: 18, color: T.accentLight }}>{currentAge}</div>

        <div style={label}>A life of</div>
        <input type="range" min={currentAge + 1} max={120} value={targetAge} onChange={(e) => setTargetAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: T.accent }} />
        <div style={{ textAlign: "center", marginBottom: 22, fontFamily: SERIF, fontSize: 18, color: T.accentLight }}>{targetAge} years</div>

        <button onClick={() => setConfig({ ...config, name: name.trim(), currentAge, targetAge })} style={{ ...btn, width: "100%", padding: 13 }}>Save</button>
      </div>

      <div style={{ ...card, padding: 20, marginTop: 16 }}>
        <div style={label}>Account &amp; Sync</div>
        {!isSyncConfigured ? (
          <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 0", lineHeight: 1.6, fontFamily: SANS }}>
            Saved on this device. Add your Supabase keys (see SUPABASE_SETUP.md) and redeploy to sync across devices.
          </p>
        ) : session ? (<>
          <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 4px", fontFamily: SANS }}>Signed in as <strong style={{ color: T.text }}>{session.user.email}</strong></p>
          <p style={{ fontSize: 12, color: T.dim, margin: "0 0 14px", fontFamily: SANS }}>{syncStatus === "saving" ? "Saving…" : syncStatus === "offline" ? "Offline — syncs when reconnected." : syncStatus === "error" ? "Sync error." : "Synced across your devices."}</p>
          <button onClick={onSignOut} style={{ ...btnOutline, width: "100%", padding: 11 }}>Sign out</button>
        </>) : (<>
          <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 14px", lineHeight: 1.6, fontFamily: SANS }}>Sign in to keep your reflections and intentions across your devices.</p>
          <button onClick={onOpenAuth} style={{ ...btn, width: "100%", padding: 11 }}>Sign in or create account</button>
        </>)}
      </div>

      <div style={{ ...card, padding: 20, marginTop: 16, borderColor: "rgba(192,66,74,0.25)" }}>
        <div style={{ ...label, color: T.crimson }}>Start over</div>
        <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 14px", lineHeight: 1.5, fontFamily: SANS }}>Clears your profile, reflections, and intentions.</p>
        <button onClick={() => { if (window.confirm("Start over? This clears your saved data and can't be undone.")) onReset(); }}
          style={{ ...btnOutline, width: "100%", padding: 12, color: T.crimson, borderColor: "rgba(192,66,74,0.35)" }}>Reset all data</button>
      </div>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "weeks", label: "Weeks", Icon: IconWeeks },
  { id: "reflect", label: "Reflect", Icon: IconReflect },
  { id: "intentions", label: "Legacy", Icon: IconIntentions },
];

function Sidebar({ page, setPage, session, syncStatus, onAccount }) {
  return (
    <div className="ttl-sidebar" style={{ width: 220, minHeight: "100vh", background: "rgba(10,10,12,0.6)", borderRight: `1px solid ${T.cardBorder}`, display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0, position: "relative", zIndex: 4 }}>
      <div style={{ padding: "8px 20px 22px", display: "flex", alignItems: "center", gap: 9 }}>
        <HourMark size={24} /><BrandTitle size={20} />
      </div>
      <div style={{ flex: 1, padding: "6px 12px" }}>
        {NAV.map(({ id, label: lbl, Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", marginBottom: 3,
              border: "none", cursor: "pointer", borderRadius: 10, fontFamily: SANS,
              background: active ? "rgba(201,162,75,0.12)" : "transparent",
              color: active ? T.text : T.muted, fontSize: 14, fontWeight: active ? 600 : 500, textAlign: "left",
            }}>
              <span style={{ color: active ? T.accentLight : T.muted, display: "flex" }}><Icon size={19} /></span>{lbl}
            </button>
          );
        })}
      </div>
      <div style={{ borderTop: `1px solid ${T.cardBorder}`, padding: "12px 16px 4px" }}>
        <div style={{ marginBottom: 8 }}><SyncBadge session={session} syncStatus={syncStatus} onClick={onAccount} /></div>
        <button onClick={() => setPage("settings")} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 2px", border: "none", cursor: "pointer", background: "transparent", color: page === "settings" ? T.text : T.muted, fontSize: 14, fontWeight: 500, textAlign: "left", fontFamily: SANS }}>
          <span style={{ display: "flex" }}><IconSettings size={19} /></span> Settings
        </button>
      </div>
    </div>
  );
}

function MobileTopBar({ session, syncStatus, onAccount, setPage }) {
  return (
    <div className="ttl-topbar" style={{ position: "sticky", top: 0, zIndex: 40, alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "rgba(10,10,12,0.9)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><HourMark size={22} /><BrandTitle size={18} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SyncBadge session={session} syncStatus={syncStatus} onClick={onAccount} compact />
        <button onClick={() => setPage("settings")} title="Settings" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex", padding: 2 }}><IconSettings size={20} /></button>
      </div>
    </div>
  );
}

function BottomNav({ page, setPage }) {
  return (
    <div className="ttl-bottomnav" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: "rgba(10,10,12,0.96)", backdropFilter: "blur(12px)", borderTop: `1px solid ${T.cardBorder}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {NAV.map(({ id, label: lbl, Icon }) => {
        const active = page === id;
        return (
          <button key={id} onClick={() => setPage(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "10px 0 6px", color: active ? T.accentLight : T.dim, fontFamily: SANS }}>
            <Icon size={21} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>{lbl}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Cloud sync ───────────────────────────────────────────────────────────────
async function cloudLoad(uid) {
  if (!supabase) return { ok: false };
  const { data, error } = await supabase.from(STATE_TABLE).select("data").eq("user_id", uid).maybeSingle();
  if (error) return { ok: false, error };
  return { ok: true, data: data?.data ?? null };
}
async function cloudSave(uid, data) {
  if (!supabase) return { ok: false };
  const { error } = await supabase.from(STATE_TABLE).upsert({ user_id: uid, data, updated_at: new Date().toISOString() });
  return { ok: !error, error };
}

function SyncBadge({ session, syncStatus, onClick, compact }) {
  const text = !isSyncConfigured ? "Local only" : !session ? "Sign in to sync"
    : syncStatus === "saving" ? "Saving…" : syncStatus === "offline" ? "Offline" : syncStatus === "error" ? "Sync error" : "Synced";
  const good = session && (syncStatus === "synced" || syncStatus === "idle");
  const warn = session && (syncStatus === "offline" || syncStatus === "error");
  const color = good ? "#8CC7A1" : warn ? T.accentLight : T.muted;
  return (
    <button onClick={onClick} title="Account & sync" style={{ display: "flex", alignItems: "center", gap: 6, padding: compact ? "5px 10px" : "7px 12px", borderRadius: 20, border: `1px solid ${T.cardBorder}`, background: "rgba(255,255,255,0.04)", color, fontSize: compact ? 11 : 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: SANS }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />{text}
    </button>
  );
}

const linkBtn = { background: "none", border: "none", color: T.accentLight, cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, fontFamily: SANS };

function AuthModal({ session, syncStatus, onSignOut, recovery, onClose }) {
  const [mode, setMode] = useState(recovery ? "reset" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => { setBusy(true); setErr(null); setMsg(null); try { await fn(); } catch (e) { setErr(e?.message || String(e)); } finally { setBusy(false); } };
  const signIn = () => run(async () => { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; onClose(); });
  const signUp = () => run(async () => { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password }); if (error) throw error; if (data.session) onClose(); else setMsg("Almost there — check your email for a confirmation link, then sign in."); });
  const forgot = () => run(async () => { const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin }); if (error) throw error; setMsg("Reset email sent. Open the link on this device to set a new password."); });
  const resetPw = () => run(async () => { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setMsg("Password updated — you're signed in."); setTimeout(onClose, 1000); });

  const wrap = (children) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }} onClick={onClose}>
      <div style={{ ...card, background: T.bgAlt, padding: 26, width: 400, maxWidth: "92vw", border: "1px solid rgba(201,162,75,0.25)" }} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );

  if (!isSyncConfigured) return wrap(<>
    <h3 style={{ fontFamily: SERIF, fontWeight: 500, margin: "0 0 8px", color: T.text, fontSize: 22 }}>Sync isn't set up yet</h3>
    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 18px", fontFamily: SANS }}>Your data is saved on this device. Add your Supabase keys (see SUPABASE_SETUP.md), then redeploy to sync.</p>
    <button onClick={onClose} style={{ ...btn, width: "100%", padding: 12 }}>Got it</button>
  </>);

  if (session) return wrap(<>
    <h3 style={{ fontFamily: SERIF, fontWeight: 500, margin: "0 0 4px", color: T.text, fontSize: 22 }}>Your account</h3>
    <p style={{ fontSize: 13, color: T.muted, margin: "0 0 4px", fontFamily: SANS }}>{session.user.email}</p>
    <p style={{ fontSize: 12, color: T.dim, margin: "0 0 20px", fontFamily: SANS }}>{syncStatus === "saving" ? "Saving…" : syncStatus === "offline" ? "Offline — will sync when reconnected" : syncStatus === "error" ? "Sync error" : "Synced across your devices"}</p>
    <button onClick={() => { onSignOut(); onClose(); }} style={{ ...btnOutline, width: "100%", padding: 12, marginBottom: 10 }}>Sign out</button>
    <button onClick={onClose} style={{ ...btn, width: "100%", padding: 12 }}>Close</button>
  </>);

  const titles = { signin: "Sign in", signup: "Create account", forgot: "Reset password", reset: "Set a new password" };
  return wrap(<>
    <h3 style={{ fontFamily: SERIF, fontWeight: 500, margin: "0 0 4px", color: T.text, fontSize: 22 }}>{titles[mode]}</h3>
    <p style={{ fontSize: 12, color: T.dim, margin: "0 0 18px", fontFamily: SANS }}>Keep your reflections across every device.</p>
    {mode !== "reset" && (<>
      <div style={label}>Email</div>
      <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }} />
    </>)}
    {mode !== "forgot" && (<>
      <div style={label}>{mode === "reset" ? "New password" : "Password"}</div>
      <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }} />
    </>)}
    {err && <div style={{ fontSize: 12, color: "#F0868B", marginBottom: 12, fontFamily: SANS }}>{err}</div>}
    {msg && <div style={{ fontSize: 12, color: "#8CC7A1", marginBottom: 12, lineHeight: 1.5, fontFamily: SANS }}>{msg}</div>}
    {mode === "signin" && <button onClick={signIn} disabled={busy} style={{ ...btn, width: "100%", padding: 12, opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Sign in"}</button>}
    {mode === "signup" && <button onClick={signUp} disabled={busy} style={{ ...btn, width: "100%", padding: 12, opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Create account"}</button>}
    {mode === "forgot" && <button onClick={forgot} disabled={busy} style={{ ...btn, width: "100%", padding: 12, opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Send reset email"}</button>}
    {mode === "reset" && <button onClick={resetPw} disabled={busy} style={{ ...btn, width: "100%", padding: 12, opacity: busy ? 0.6 : 1 }}>{busy ? "…" : "Update password"}</button>}
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12 }}>
      {mode === "signin" && <>
        <button onClick={() => { setMode("signup"); setErr(null); setMsg(null); }} style={linkBtn}>Create account</button>
        <button onClick={() => { setMode("forgot"); setErr(null); setMsg(null); }} style={linkBtn}>Forgot password?</button>
      </>}
      {(mode === "signup" || mode === "forgot") && <button onClick={() => { setMode("signin"); setErr(null); setMsg(null); }} style={linkBtn}>← Back to sign in</button>}
      {mode !== "reset" && <button onClick={onClose} style={{ ...linkBtn, marginLeft: "auto" }}>Close</button>}
    </div>
  </>);
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete, onOpenAuth, session }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currentAge, setCurrentAge] = useState(30);
  const [targetAge, setTargetAge] = useState(90);

  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: `radial-gradient(130% 100% at 50% -10%, rgba(255,255,255,0.035), transparent 55%), ${T.gradientSoft}` }}>
        <HourMark size={56} />
        <div style={{ marginTop: 18 }}><BrandTitle size={38} /></div>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", color: T.accentLight, fontSize: 18, marginTop: 12 }}>{CLOSING_QUOTE}</p>
        <p style={{ fontFamily: SANS, color: T.muted, fontSize: 14, marginTop: 4, maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>See your life in weeks. Reflect. Live on purpose.</p>
        <button onClick={() => setStep(1)} style={{ ...btn, marginTop: 30, padding: "13px 44px", fontSize: 15 }}>Begin</button>
        {isSyncConfigured && !session && (
          <button onClick={onOpenAuth} style={{ ...linkBtn, marginTop: 18 }}>Already have an account? Sign in</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: `radial-gradient(130% 100% at 50% -10%, rgba(255,255,255,0.035), transparent 55%), ${T.gradientSoft}` }}>
      <h2 style={{ fontFamily: SERIF, fontWeight: 500, color: T.text, fontSize: 26, marginBottom: 4 }}>A little about you</h2>
      <p style={{ fontFamily: SANS, color: T.muted, fontSize: 13, marginBottom: 26 }}>This shapes your life in weeks.</p>
      <div style={{ ...card, background: T.bgAlt, padding: 28, width: 360, maxWidth: "90vw" }}>
        <div style={label}>Your name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ ...inputStyle, marginTop: 6, marginBottom: 20 }} />
        <div style={label}>Current age</div>
        <input type="range" min={1} max={100} value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: T.accent }} />
        <div style={{ textAlign: "center", marginBottom: 16, fontFamily: SERIF, fontSize: 18, color: T.accentLight }}>{currentAge}</div>
        <div style={label}>A life of</div>
        <input type="range" min={currentAge + 1} max={120} value={targetAge} onChange={(e) => setTargetAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: T.accent }} />
        <div style={{ textAlign: "center", marginBottom: 22, fontFamily: SERIF, fontSize: 18, color: T.accentLight }}>{targetAge} years</div>
        <button onClick={() => onComplete({ name: name.trim(), currentAge, targetAge })} style={{ ...btn, width: "100%", padding: 13 }}>See my weeks</button>
      </div>
    </div>
  );
}

// ─── Persistence + app root ───────────────────────────────────────────────────
const STORAGE_KEY = "timetolive.v1";
function loadStored() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }

export default function TimeToLive() {
  const [config, setConfig] = useState(() => loadStored().config ?? null);
  const [page, setPage] = useState("weeks");
  const [reflections, setReflections] = useState(() => loadStored().reflections ?? []);
  const [intentions, setIntentions] = useState(() => loadStored().intentions ?? []);

  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [syncStatus, setSyncStatus] = useState(isSyncConfigured ? "idle" : "local");

  const stateRef = useRef({ config, reflections, intentions });
  stateRef.current = { config, reflections, intentions };
  const syncReadyRef = useRef(false);
  const saveTimer = useRef(null);

  const applyState = (s) => {
    setConfig(s?.config ?? null);
    setReflections(s?.reflections ?? []);
    setIntentions(s?.intentions ?? []);
  };

  const handleSignedIn = async (sess) => {
    setSession(sess);
    syncReadyRef.current = false;
    const uid = sess.user.id;
    const cached = readJSON(`timetolive.user.${uid}`);
    if (cached?.config) applyState(cached);
    setSyncStatus("saving");
    const res = await cloudLoad(uid);
    if (!res.ok) { setSyncStatus("offline"); syncReadyRef.current = true; return; }
    if (res.data?.config) {
      applyState(res.data);
      try { localStorage.setItem(`timetolive.user.${uid}`, JSON.stringify(res.data)); } catch {}
    } else {
      const local = stateRef.current;
      if (local?.config) {
        await cloudSave(uid, local);
        try { localStorage.setItem(`timetolive.user.${uid}`, JSON.stringify(local)); } catch {}
      }
    }
    setSyncStatus("synced");
    syncReadyRef.current = true;
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) handleSignedIn(data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); setAuthOpen(true); }
      if (sess) handleSignedIn(sess);
      else { syncReadyRef.current = false; setSession(null); applyState(readJSON(STORAGE_KEY) || {}); setSyncStatus(isSyncConfigured ? "idle" : "local"); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, reflections, intentions })); } catch {}
  }, [config, reflections, intentions, session]);

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;
    const data = { config, reflections, intentions };
    try { localStorage.setItem(`timetolive.user.${uid}`, JSON.stringify(data)); } catch {}
    if (!syncReadyRef.current) return;
    setSyncStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => { const res = await cloudSave(uid, data); setSyncStatus(res.ok ? "synced" : "offline"); }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [config, reflections, intentions, session]);

  useEffect(() => {
    const onOnline = () => { if (session && syncReadyRef.current) cloudSave(session.user.id, stateRef.current).then(r => setSyncStatus(r.ok ? "synced" : "offline")); };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [session]);

  const signOut = async () => { if (supabase) await supabase.auth.signOut(); };
  const openAccount = () => { setRecovery(false); setAuthOpen(true); };
  const handleOnboard = (cfg) => { setConfig(cfg); setPage("weeks"); };
  const resetAll = () => {
    try { localStorage.removeItem(STORAGE_KEY); if (session) localStorage.removeItem(`timetolive.user.${session.user.id}`); } catch {}
    if (session) cloudSave(session.user.id, { config: null, reflections: [], intentions: [] });
    setReflections([]); setIntentions([]); setConfig(null); setPage("weeks");
  };

  const authModalEl = authOpen ? (
    <AuthModal session={session} syncStatus={syncStatus} onSignOut={signOut} recovery={recovery} onClose={() => { setAuthOpen(false); setRecovery(false); }} />
  ) : null;

  if (!config) return (<><GlobalStyles />{authModalEl}<Onboarding onComplete={handleOnboard} onOpenAuth={openAccount} session={session} /></>);

  const renderPage = () => {
    switch (page) {
      case "weeks": return <WeeksPage config={config} />;
      case "reflect": return <ReflectPage reflections={reflections} setReflections={setReflections} />;
      case "intentions": return <IntentionsPage intentions={intentions} setIntentions={setIntentions} />;
      case "settings": return <SettingsPage config={config} setConfig={setConfig} session={session} syncStatus={syncStatus} onOpenAuth={openAccount} onSignOut={signOut} onReset={resetAll} />;
      default: return <WeeksPage config={config} />;
    }
  };

  return (
    <div style={{ fontFamily: SANS, minHeight: "100vh", background: `radial-gradient(130% 100% at 50% -10%, rgba(255,255,255,0.035), transparent 55%), ${T.gradientSoft}`, display: "flex", position: "relative" }}>
      <GlobalStyles />
      <Ambience />
      {authModalEl}
      <Sidebar page={page} setPage={setPage} session={session} syncStatus={syncStatus} onAccount={openAccount} />
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
        <MobileTopBar session={session} syncStatus={syncStatus} onAccount={openAccount} setPage={setPage} />
        <div className="ttl-page" style={{ flex: 1 }}>{renderPage()}</div>
      </div>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

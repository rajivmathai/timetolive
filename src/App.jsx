import { useState, useMemo, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// TimeToLive — Life Planning Timeline
// Full dark contemplative theme, life balance scoring, near-term planner,
// retrospective prompts, retroactive events, emotional onboarding, AI life coach
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  bg: "#13111C",
  bgAlt: "#1A1726",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.07)",
  cardHover: "rgba(255,255,255,0.07)",
  text: "#E8E0F0",
  muted: "#9B8FBB",
  dim: "#5E5480",
  accent: "#7C3AED",
  accentLight: "#A78BFA",
  pink: "#EC4899",
  orange: "#F59E0B",
  gradient: "linear-gradient(135deg, #7C3AED, #EC4899)",
  gradientSoft: "linear-gradient(160deg, #13111C 0%, #1E1535 40%, #1A1726 100%)",
  inputBg: "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.1)",
};

const card = {
  background: T.card, borderRadius: 16,
  border: `1px solid ${T.cardBorder}`,
  backdropFilter: "blur(12px)",
};

const btn = {
  background: T.gradient, color: "#FFF", border: "none", borderRadius: 12,
  padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer",
};

const btnOutline = {
  background: "rgba(255,255,255,0.06)", color: T.text, borderRadius: 12,
  border: `1px solid ${T.cardBorder}`, padding: "10px 20px",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1px solid ${T.inputBorder}`, background: T.inputBg,
  color: T.text, fontSize: 14, boxSizing: "border-box", outline: "none",
  fontFamily: "inherit",
};

// ─── Categories (audited for contrast on dark bg) ────────────────────────────

const CATEGORIES = [
  { key: "career", label: "Career", color: "#3B82F6" },
  { key: "family", label: "Family", color: "#22C55E" },
  { key: "health", label: "Health", color: "#EF4444" },
  { key: "travel", label: "Travel", color: "#F59E0B" },
  { key: "education", label: "Education", color: "#A78BFA" },
  { key: "relationships", label: "Relationships", color: "#EC4899" },
  { key: "finance", label: "Finance", color: "#06B6D4" },
  { key: "hobbies", label: "Hobbies", color: "#F97316" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const MONTH_COLS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Life event presets for retroactive import ───────────────────────────────

const LIFE_PRESETS = [
  { title: "Born", category: "family", icon: "\u{1F476}" },
  { title: "Started school", category: "education", icon: "\u{1F393}" },
  { title: "Graduated", category: "education", icon: "\u{1F4DC}" },
  { title: "First job", category: "career", icon: "\u{1F4BC}" },
  { title: "Got married", category: "relationships", icon: "\u{1F48D}" },
  { title: "Had a child", category: "family", icon: "\u{1F476}" },
  { title: "Moved cities", category: "travel", icon: "\u{1F3E0}" },
  { title: "Career change", category: "career", icon: "\u{1F504}" },
  { title: "Major trip", category: "travel", icon: "\u2708\uFE0F" },
  { title: "Health milestone", category: "health", icon: "\u{1F3CB}" },
  { title: "Started a business", category: "career", icon: "\u{1F680}" },
  { title: "Bought a home", category: "finance", icon: "\u{1F3E1}" },
];

// ─── Coach prompts ───────────────────────────────────────────────────────────

const COACH_PROMPTS = [
  "What does a meaningful week look like for you right now?",
  "Help me plan my next quarter with intention",
  "I want to spend more time with family — suggest a plan",
  "What life events should I be thinking about for my age?",
  "I feel stuck in my career. Help me think through next steps",
  "Create a reflection about what I'm grateful for",
  "Review my life balance and suggest adjustments",
];

const RETROSPECTIVE_PROMPTS = [
  { trigger: "quarterly", text: "It's been 3 months. Which category got the most attention? Which got neglected?" },
  { trigger: "imbalance", text: (cat) => `Your ${cat} category hasn't had an event in over 6 months. Is that intentional?` },
  { trigger: "milestone", text: "You're approaching a new decade. What do you want it to look like?" },
];

// ─── SVG Hourglass & Brand ───────────────────────────────────────────────────

function HourglassIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B59B6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="snd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect x="14" y="4" width="36" height="5" rx="2.5" fill="url(#hg)" />
      <rect x="14" y="55" width="36" height="5" rx="2.5" fill="url(#hg)" />
      <path d="M18 9C18 9,18 26,32 32C46 26,46 9,46 9" stroke="url(#hg)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M18 55C18 55,18 38,32 32C46 38,46 55,46 55" stroke="url(#hg)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M22 12C22 12,22 22,32 27C42 22,42 12,42 12Z" fill="url(#snd)" opacity="0.3" />
      <path d="M24 52C24 52,24 42,32 37C40 42,40 52,40 52Z" fill="url(#snd)" opacity="0.6" />
      <line x1="32" y1="28" x2="32" y2="36" stroke="#F59E0B" strokeWidth="1.5" opacity="0.7" />
      <circle cx="10" cy="20" r="2.5" fill="#22C55E" opacity="0.8" />
      <circle cx="8" cy="32" r="2" fill="#3B82F6" opacity="0.8" />
      <circle cx="10" cy="44" r="2.5" fill="#A78BFA" opacity="0.8" />
      <circle cx="54" cy="18" r="2" fill="#EC4899" opacity="0.8" />
      <circle cx="56" cy="30" r="2.5" fill="#F59E0B" opacity="0.8" />
      <circle cx="54" cy="42" r="2" fill="#22C55E" opacity="0.8" />
    </svg>
  );
}

function BrandTitle({ size = 20 }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.3px" }}>
      <span style={{ background: "linear-gradient(135deg, #EC4899, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TimeTo</span>
      <span style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Live</span>
    </span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, currentAge, targetAge, monthsRemaining }) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "\u{1F3E0}" },
    { id: "planner", label: "This Month", icon: "\u{1F4CB}" },
    { id: "timeline", label: "Timeline", icon: "\u{1F4C5}" },
    { id: "balance", label: "Life Balance", icon: "\u{1F3AF}" },
    { id: "reflections", label: "Reflections", icon: "\u{1F4D6}" },
    { id: "milestones", label: "Milestones", icon: "\u{1F4C8}" },
    { id: "coach", label: "Life Coach", icon: "\u{1F9ED}" },
  ];

  return (
    <div style={{
      width: 210, minHeight: "100vh", background: "rgba(19,17,28,0.8)",
      borderRight: `1px solid ${T.cardBorder}`, display: "flex",
      flexDirection: "column", padding: "16px 0", flexShrink: 0,
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ padding: "8px 16px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <HourglassIcon size={26} />
        <BrandTitle size={17} />
      </div>

      <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${T.cardBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "rgba(124,58,237,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: T.accentLight,
          }}>RG</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Age {currentAge}</div>
            <div style={{ fontSize: 10, color: T.dim }}>Target: {targetAge}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.muted }}>
          <span style={{ fontWeight: 700, color: T.accentLight }}>{monthsRemaining}</span> months remaining
        </div>
      </div>

      <div style={{ flex: 1, padding: "8px 0" }}>
        {nav.map((item) => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 18px", border: "none", cursor: "pointer",
              background: active ? "rgba(124,58,237,0.15)" : "transparent",
              borderLeft: active ? "3px solid #7C3AED" : "3px solid transparent",
              color: active ? T.text : T.muted, fontSize: 13,
              fontWeight: active ? 600 : 500, textAlign: "left",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${T.cardBorder}`, padding: "8px 0" }}>
        <button onClick={() => setPage("settings")} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 18px", border: "none", cursor: "pointer",
          background: page === "settings" ? "rgba(124,58,237,0.15)" : "transparent",
          borderLeft: page === "settings" ? "3px solid #7C3AED" : "3px solid transparent",
          color: T.muted, fontSize: 13, fontWeight: 500, textAlign: "left",
        }}>
          <span style={{ fontSize: 15 }}>{"\u2699\uFE0F"}</span> Settings
        </button>
      </div>
    </div>
  );
}

// ─── Category Legend ──────────────────────────────────────────────────────────

function CategoryLegend() {
  return (
    <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 20px", flexWrap: "wrap" }}>
      {CATEGORIES.map((c) => (
        <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.muted, fontWeight: 500 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} />{c.label}
        </div>
      ))}
    </div>
  );
}

// ─── Dot Grid ────────────────────────────────────────────────────────────────

function DotGrid({ birthYear, events, onDotClick, startYear, endYear, compact }) {
  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth();
  const rows = [];

  for (let yr = startYear; yr <= endYear; yr++) {
    const age = yr - birthYear;
    const dots = [];
    for (let m = 0; m < 12; m++) {
      const key = `${yr}-${m}`;
      const isPast = yr < cy || (yr === cy && m < cm);
      const isCurrent = yr === cy && m === cm;
      const ev = events[key];
      const dotColor = ev ? CAT_MAP[ev.category]?.color || "#888" : null;

      dots.push(
        <div key={key} onClick={() => onDotClick?.(yr, m)}
          style={{
            width: compact ? 18 : 26, height: compact ? 18 : 26, borderRadius: "50%",
            background: isCurrent ? "linear-gradient(135deg, #F59E0B, #F97316)"
              : dotColor ? dotColor
              : isPast ? "rgba(124,58,237,0.2)"
              : "rgba(255,255,255,0.08)",
            cursor: onDotClick ? "pointer" : "default",
            transition: "transform 0.15s",
            boxShadow: isCurrent ? "0 0 10px rgba(245,158,11,0.4)" : dotColor ? `0 0 6px ${dotColor}44` : "none",
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.3)"; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        />
      );
    }
    rows.push(
      <div key={yr} style={{ display: "flex", alignItems: "center", gap: compact ? 4 : 8, marginBottom: compact ? 3 : 5 }}>
        <div style={{ width: 58, textAlign: "right", paddingRight: 6, flexShrink: 0 }}>
          <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: T.text }}>{yr}</span>
          <span style={{ fontSize: 9, color: T.dim, marginLeft: 3 }}>{age}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: compact ? 4 : 8, flex: 1 }}>
          {dots}
        </div>
      </div>
    );
  }
  return <div>{rows}</div>;
}

// ─── Event Modal ─────────────────────────────────────────────────────────────

function EventModal({ year, month, event, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(event?.title || "");
  const [category, setCategory] = useState(event?.category || "career");
  const [notes, setNotes] = useState(event?.notes || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ ...card, background: T.bgAlt, padding: 28, width: 420, maxWidth: "90vw", border: `1px solid rgba(124,58,237,0.2)` }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", color: T.text, fontSize: 20 }}>{MONTH_FULL[month]} {year}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>{event ? "Edit this event" : "Add an event to your timeline"}</p>

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Event Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trip to Japan" style={{ ...inputStyle, marginTop: 6, marginBottom: 16 }} />

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Category</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: category === c.key ? c.color : "rgba(255,255,255,0.05)",
              color: category === c.key ? "#FFF" : T.muted,
              border: category === c.key ? "none" : `1px solid ${T.cardBorder}`,
            }}>{c.label}</button>
          ))}
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Details..."
          style={{ ...inputStyle, marginTop: 6, marginBottom: 20, resize: "vertical" }} />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {event && <button onClick={() => { onDelete(); onClose(); }} style={{ ...btnOutline, color: "#EF4444", borderColor: "rgba(239,68,68,0.3)" }}>Delete</button>}
          <button onClick={onClose} style={btnOutline}>Cancel</button>
          <button onClick={() => { if (title.trim()) { onSave({ title, category, notes }); onClose(); } }} style={btn}>{event ? "Update" : "Add Event"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function DashboardPage({ config, events, setEvents, setPage }) {
  const [modal, setModal] = useState(null);
  const now = new Date();
  const cy = now.getFullYear();
  const birthYear = cy - config.currentAge;
  const monthsRem = (config.targetAge - config.currentAge) * 12 - now.getMonth();
  const yearsRem = config.targetAge - config.currentAge;
  const evCount = Object.keys(events).length;
  const dashEnd = Math.min(cy + 2, birthYear + config.targetAge);
  const moreYears = (birthYear + config.targetAge) - dashEnd;

  // Life balance nudge
  const catCounts = {};
  CATEGORIES.forEach(c => catCounts[c.key] = 0);
  Object.values(events).forEach(ev => { if (ev && catCounts[ev.category] !== undefined) catCounts[ev.category]++; });
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  const neglected = total > 3 ? CATEGORIES.filter(c => catCounts[c.key] === 0).map(c => c.label) : [];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
        <HourglassIcon size={30} /><BrandTitle size={20} />
      </div>
      <h1 style={{ textAlign: "center", color: T.text, fontSize: 30, fontWeight: 300, margin: "16px 0 24px", fontStyle: "italic" }}>Your Life Timeline</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 24 }}>
        {[{ v: config.currentAge, l: "Current Age" }, { v: config.targetAge, l: "Target Age" }, { v: monthsRem, l: "Months Left" }, { v: yearsRem, l: "Years Left" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 700, background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <CategoryLegend />

      {evCount === 0 && (
        <div style={{ ...card, background: "rgba(124,58,237,0.06)", textAlign: "center", padding: 24, margin: "20px auto", maxWidth: 480 }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>{"\u2728"}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Your timeline is waiting</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Click any dot to add an event — a trip, a job change, a big decision.</div>
        </div>
      )}

      {neglected.length > 0 && (
        <div style={{ ...card, background: "rgba(236,72,153,0.06)", padding: "14px 20px", margin: "16px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>{"\u{1F4A1}"}</span>
          <div style={{ fontSize: 13, color: T.muted }}>
            <span style={{ color: T.pink, fontWeight: 600 }}>Life balance nudge:</span> You haven't planned any {neglected.slice(0, 3).join(", ")} events yet. Tap a dot to start.
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 64 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 8, flex: 1 }}>
            {MONTH_COLS.map((m, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: T.dim }}>{m}</div>)}
          </div>
        </div>
        <DotGrid birthYear={birthYear} events={events} onDotClick={(yr, m) => setModal({ year: yr, month: m })} startYear={cy} endYear={dashEnd} />
      </div>

      {moreYears > 0 && (
        <div style={{ textAlign: "center", margin: "12px 0", fontSize: 12, color: T.dim }}>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            {["#22C55E","#F59E0B","#EC4899"].map((c,i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />)}
            <span style={{ marginLeft: 4 }}>{moreYears} more years to explore</span>
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 10 }}>
        <button onClick={() => setPage("timeline")} style={btnOutline}>View Full Timeline</button>
        <button onClick={() => setPage("balance")} style={btnOutline}>{"\u{1F3AF}"} Life Balance</button>
        <button onClick={() => setPage("planner")} style={btnOutline}>{"\u{1F4CB}"} Plan This Month</button>
      </div>

      {modal && <EventModal year={modal.year} month={modal.month} event={events[`${modal.year}-${modal.month}`]}
        onSave={(ev) => setEvents(p => ({ ...p, [`${modal.year}-${modal.month}`]: ev }))}
        onDelete={() => setEvents(p => { const n = { ...p }; delete n[`${modal.year}-${modal.month}`]; return n; })}
        onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── Near-Term Planner (This Month) ──────────────────────────────────────────

function PlannerPage({ config, events, setEvents }) {
  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth();
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();
  const firstDow = new Date(cy, cm, 1).getDay();
  const [selectedDay, setSelectedDay] = useState(null);
  const [activity, setActivity] = useState("");
  const [actCat, setActCat] = useState("career");

  // Day-level data stored as events with day key
  const dayKey = (d) => `day-${cy}-${cm}-${d}`;
  const dayActivities = (d) => {
    const k = dayKey(d);
    return events[k]?.activities || [];
  };

  const addActivity = (d) => {
    if (!activity.trim()) return;
    const k = dayKey(d);
    const existing = events[k]?.activities || [];
    setEvents(p => ({ ...p, [k]: { ...p[k], activities: [...existing, { text: activity, category: actCat, done: false }] } }));
    setActivity("");
  };

  const toggleDone = (d, idx) => {
    const k = dayKey(d);
    const acts = [...(events[k]?.activities || [])];
    acts[idx] = { ...acts[idx], done: !acts[idx].done };
    setEvents(p => ({ ...p, [k]: { ...p[k], activities: acts } }));
  };

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate();
    const isSel = d === selectedDay;
    const acts = dayActivities(d);
    const cats = [...new Set(acts.map(a => a.category))];
    cells.push(
      <div key={d} onClick={() => setSelectedDay(isSel ? null : d)} style={{
        aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", borderRadius: 12, cursor: "pointer",
        background: isSel ? "rgba(124,58,237,0.2)" : isToday ? T.gradient : "rgba(255,255,255,0.03)",
        border: isSel ? "2px solid #7C3AED" : "2px solid transparent",
        color: isToday ? "#FFF" : T.muted, fontSize: 14, fontWeight: isToday ? 700 : 500,
        transition: "all 0.15s", gap: 2,
      }}>
        <span>{d}</span>
        <div style={{ display: "flex", gap: 2, height: 4 }}>
          {cats.slice(0, 4).map(c => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: CAT_MAP[c]?.color }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900 }}>
      <h1 style={{ color: T.text, fontSize: 26, fontWeight: 300, fontStyle: "italic", margin: "0 0 4px" }}>
        {MONTH_FULL[cm]} {cy}
      </h1>
      <p style={{ color: T.muted, fontSize: 13, margin: "0 0 20px" }}>Plan your days with intention. Tap a day to add activities.</p>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Calendar */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAY_NAMES.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.dim, padding: 4 }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>{cells}</div>
        </div>

        {/* Day detail */}
        <div style={{ width: 320, flexShrink: 0 }}>
          {selectedDay ? (
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                {DAY_NAMES[new Date(cy, cm, selectedDay).getDay()]}, {MONTH_FULL[cm]} {selectedDay}
              </div>

              {/* Activities list */}
              {dayActivities(selectedDay).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {dayActivities(selectedDay).map((a, i) => (
                    <div key={i} onClick={() => toggleDone(selectedDay, i)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                      borderBottom: `1px solid ${T.cardBorder}`, cursor: "pointer",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_MAP[a.category]?.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: a.done ? T.dim : T.text, textDecoration: a.done ? "line-through" : "none", flex: 1 }}>{a.text}</span>
                      <span style={{ fontSize: 11, color: T.dim }}>{a.done ? "\u2713" : ""}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add activity */}
              <input value={activity} onChange={(e) => setActivity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addActivity(selectedDay)}
                placeholder="Add an activity..." style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setActCat(c.key)} style={{
                    padding: "3px 10px", borderRadius: 16, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    background: actCat === c.key ? c.color : "rgba(255,255,255,0.05)",
                    color: actCat === c.key ? "#FFF" : T.dim, border: "none",
                  }}>{c.label}</button>
                ))}
              </div>
              <button onClick={() => addActivity(selectedDay)} style={{ ...btn, width: "100%", padding: 10, fontSize: 13 }}>Add</button>
            </div>
          ) : (
            <div style={{ ...card, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>{"\u{1F4CB}"}</div>
              <div style={{ fontSize: 14, color: T.dim }}>Select a day to plan activities</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Full Timeline ───────────────────────────────────────────────────────────

function TimelinePage({ config, events, setEvents, setPage }) {
  const [modal, setModal] = useState(null);
  const now = new Date();
  const birthYear = now.getFullYear() - config.currentAge;
  const endYear = birthYear + config.targetAge;
  const totalMonths = config.targetAge * 12;
  const evCount = Object.keys(events).filter(k => !k.startsWith("day-")).length;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: 0 }}>{"\u2190"} Back</button>
          <h1 style={{ color: T.text, fontSize: 26, fontWeight: 300, margin: "4px 0 0", fontStyle: "italic" }}>Complete Timeline</h1>
          <div style={{ fontSize: 12, color: T.dim }}>Birth to age {config.targetAge} &middot; {totalMonths} months</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.muted }}>
          <span>{evCount} events</span><span>{totalMonths > 0 ? Math.round((evCount / totalMonths) * 100) : 0}% planned</span>
        </div>
      </div>
      <CategoryLegend />
      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 6, paddingLeft: 64 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4, flex: 1 }}>
            {MONTH_COLS.map((m, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.dim }}>{m}</div>)}
          </div>
        </div>
        <div style={{ maxHeight: "68vh", overflowY: "auto" }}>
          <DotGrid birthYear={birthYear} events={events} onDotClick={(yr, m) => setModal({ year: yr, month: m })} startYear={birthYear} endYear={endYear} compact />
        </div>
      </div>
      {modal && <EventModal year={modal.year} month={modal.month} event={events[`${modal.year}-${modal.month}`]}
        onSave={(ev) => setEvents(p => ({ ...p, [`${modal.year}-${modal.month}`]: ev }))}
        onDelete={() => setEvents(p => { const n = { ...p }; delete n[`${modal.year}-${modal.month}`]; return n; })}
        onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── Life Balance Scoring ────────────────────────────────────────────────────

function BalancePage({ events, config }) {
  const catCounts = {};
  CATEGORIES.forEach(c => catCounts[c.key] = 0);
  // Count timeline events
  Object.entries(events).forEach(([k, ev]) => {
    if (!k.startsWith("day-") && ev && catCounts[ev.category] !== undefined) catCounts[ev.category]++;
  });
  // Count daily activities
  Object.entries(events).forEach(([k, ev]) => {
    if (k.startsWith("day-") && ev?.activities) {
      ev.activities.forEach(a => { if (catCounts[a.category] !== undefined) catCounts[a.category]++; });
    }
  });

  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  const ideal = total > 0 ? 100 / CATEGORIES.length : 0;

  // Balance score: 100 = perfectly balanced, 0 = all in one category
  const balanceScore = total > 0
    ? Math.round(100 - CATEGORIES.reduce((sum, c) => {
        const pct = (catCounts[c.key] / total) * 100;
        return sum + Math.abs(pct - ideal);
      }, 0) / 2)
    : 0;

  const neglected = total >= 3 ? CATEGORIES.filter(c => catCounts[c.key] === 0) : [];
  const dominant = total >= 3 ? CATEGORIES.reduce((a, b) => catCounts[a.key] > catCounts[b.key] ? a : b) : null;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: T.text, fontSize: 28, fontWeight: 300, fontStyle: "italic", margin: "0 0 4px" }}>Life Balance</h1>
      <p style={{ color: T.muted, fontSize: 13, margin: "0 0 24px" }}>How you're distributing your time across what matters</p>

      {/* Score */}
      <div style={{ ...card, padding: 28, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 56, fontWeight: 800, background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {total > 0 ? balanceScore : "—"}
        </div>
        <div style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
          {total > 0 ? (balanceScore >= 70 ? "Well balanced! Keep it up." : balanceScore >= 40 ? "Some areas need attention." : "Heavily skewed — consider diversifying.") : "Start adding events to see your score"}
        </div>
      </div>

      {/* Category bars */}
      <div style={{ ...card, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Category Breakdown</div>
        {CATEGORIES.map(c => {
          const count = catCounts[c.key];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={c.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{c.label}</span>
                <span style={{ fontSize: 12, color: T.muted }}>{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: c.color, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Nudges */}
      {(neglected.length > 0 || dominant) && (
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Insights & Nudges</div>
          {neglected.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.cardBorder}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
              <span style={{ fontSize: 13, color: T.muted }}><span style={{ color: T.text, fontWeight: 600 }}>{c.label}</span> has no events yet. Consider adding something here.</span>
            </div>
          ))}
          {dominant && catCounts[dominant.key] > total * 0.4 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <span style={{ fontSize: 15 }}>{"\u26A0\uFE0F"}</span>
              <span style={{ fontSize: 13, color: T.muted }}><span style={{ color: dominant.color, fontWeight: 600 }}>{dominant.label}</span> dominates your timeline at {((catCounts[dominant.key] / total) * 100).toFixed(0)}%. Is that intentional?</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reflections ─────────────────────────────────────────────────────────────

function ReflectionsPage({ reflections, setReflections, events }) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("grateful");

  // Generate retrospective prompt
  const catCounts = {};
  CATEGORIES.forEach(c => catCounts[c.key] = 0);
  Object.values(events).forEach(ev => { if (ev?.category && catCounts[ev.category] !== undefined) catCounts[ev.category]++; });
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  const emptyCategories = total >= 3 ? CATEGORIES.filter(c => catCounts[c.key] === 0) : [];
  const retroPrompt = emptyCategories.length > 0
    ? RETROSPECTIVE_PROMPTS[1].text(emptyCategories[0].label)
    : RETROSPECTIVE_PROMPTS[0].text;

  const addReflection = () => {
    if (!text.trim()) return;
    setReflections(p => [{ id: Date.now(), text, mood, date: new Date().toLocaleDateString() }, ...p]);
    setText(""); setShowForm(false);
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: T.text, fontSize: 28, fontWeight: 300, fontStyle: "italic", margin: "0 0 4px" }}>Life Reflections</h1>
      <p style={{ color: T.muted, fontSize: 13, margin: "0 0 24px" }}>Capture your thoughts, insights, and moments of growth.</p>

      {/* Retrospective prompt */}
      <div style={{ ...card, background: "rgba(124,58,237,0.06)", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
        onClick={() => { setText(retroPrompt); setShowForm(true); }}>
        <span style={{ fontSize: 20 }}>{"\u{1F4AD}"}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Reflection Prompt</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{retroPrompt}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button onClick={() => setShowForm(!showForm)} style={btnOutline}>+ Add Reflection</button>
      </div>

      {showForm && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="What's on your mind?"
            style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["grateful","reflective","motivated","peaceful","challenged"].map(m => (
              <button key={m} onClick={() => setMood(m)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
                background: mood === m ? "#7C3AED" : "rgba(255,255,255,0.05)",
                color: mood === m ? "#FFF" : T.muted, border: "none", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={addReflection} style={btn}>Save Reflection</button>
          </div>
        </div>
      )}

      {reflections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.dim }}>
          <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>{"\u{1F4D6}"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.muted }}>No reflections yet</div>
          <div style={{ fontSize: 13 }}>Start capturing your thoughts about your life journey.</div>
        </div>
      ) : reflections.map(r => (
        <div key={r.id} style={{ ...card, padding: 18, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ padding: "3px 10px", borderRadius: 16, fontSize: 10, fontWeight: 600, background: "rgba(124,58,237,0.15)", color: T.accentLight, textTransform: "capitalize" }}>{r.mood}</span>
            <span style={{ fontSize: 11, color: T.dim }}>{r.date}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{r.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Milestones ──────────────────────────────────────────────────────────────

function MilestonesPage({ milestones, setMilestones }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);

  const add = () => {
    if (!title.trim() || !date) return;
    setMilestones(p => [...p, { id: Date.now(), title, date, recurring }]);
    setTitle(""); setDate(""); setRecurring(false); setShowForm(false);
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: T.text, fontSize: 28, fontWeight: 300, fontStyle: "italic", margin: "0 0 4px" }}>Life Milestones</h1>
      <p style={{ color: T.muted, fontSize: 13, margin: "0 0 24px" }}>Track important dates and recurring events that matter to you</p>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button onClick={() => setShowForm(!showForm)} style={btnOutline}>+ Add Milestone</button>
      </div>

      {showForm && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mum's birthday" style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }} />
          <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted, marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} /> Recurring annually
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={add} style={btn}>Save Milestone</button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.dim }}>
          <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>{"\u{1F4C5}"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.muted }}>No milestones yet</div>
          <div style={{ fontSize: 13 }}>Add your first milestone to start tracking important dates</div>
        </div>
      ) : milestones.map(m => (
        <div key={m.id} style={{ ...card, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.title}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{m.date}{m.recurring && " \u{1F501} Recurring"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Life Coach (formerly Mochi) ─────────────────────────────────────────────

function CoachPage({ config, events }) {
  const [messages, setMessages] = useState([
    { from: "coach", text: "I'm your Life Coach — here to help you think intentionally about the time ahead. I know your timeline, your events, and your balance. Ask me anything about planning your life, and I'll help you make it count.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  // Generate context-aware responses
  const catCounts = {};
  CATEGORIES.forEach(c => catCounts[c.key] = 0);
  Object.values(events).forEach(ev => { if (ev?.category && catCounts[ev.category] !== undefined) catCounts[ev.category]++; });
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);
  const yearsLeft = config.targetAge - config.currentAge;

  const getResponse = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes("balance") || lower.includes("review")) {
      const top = CATEGORIES.reduce((a, b) => catCounts[a.key] > catCounts[b.key] ? a : b);
      const empty = CATEGORIES.filter(c => catCounts[c.key] === 0);
      if (total === 0) return "Your timeline is empty — that's actually a beautiful blank canvas. Start with what matters most to you right now. What's one area of life you'd like to focus on this month?";
      return `Looking at your timeline: ${top.label} leads with ${catCounts[top.key]} events. ${empty.length > 0 ? `${empty.map(c => c.label).join(", ")} ${empty.length === 1 ? "has" : "have"} nothing planned yet. ` : ""}You have ${yearsLeft} years ahead — that's ${yearsLeft * 12} months of possibility. What area feels most neglected?`;
    }
    if (lower.includes("plan") || lower.includes("quarter") || lower.includes("month")) {
      return `For this quarter, I'd suggest picking 2-3 categories to focus on. With ${yearsLeft} years remaining, every quarter counts. What are the 3 things that would make this month feel meaningful to you?`;
    }
    if (lower.includes("family") || lower.includes("relationship")) {
      return `Family time is irreplaceable. Consider scheduling regular rituals — weekly dinners, monthly outings, annual traditions. Small consistent investments compound over ${yearsLeft} years into thousands of shared moments. Want me to help you plan some?`;
    }
    if (lower.includes("career") || lower.includes("work") || lower.includes("stuck")) {
      return `Career reflection is powerful. At ${config.currentAge}, you likely have ${Math.max(0, 65 - config.currentAge)} working years left. That's a lot of time to pivot, grow, or double down. What would your ideal work life look like 5 years from now?`;
    }
    return `That's a thoughtful question. With ${yearsLeft} years and ${yearsLeft * 12} months ahead of you, every decision shapes the life you're building. Let me think about this in the context of your timeline — what specifically would you like to explore?`;
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(p => [...p, userMsg]);
    const response = getResponse(input);
    setInput("");
    setTimeout(() => {
      setMessages(p => [...p, { from: "coach", text: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 800);
  };

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1050 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 28 }}>{"\u{1F9ED}"}</div>
        <h1 style={{ color: T.text, fontSize: 26, fontWeight: 300, fontStyle: "italic", margin: "4px 0" }}>Life Coach</h1>
        <p style={{ color: T.muted, fontSize: 13 }}>Your AI companion for intentional living. Knows your timeline, events, and balance.</p>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column", minHeight: 420 }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.cardBorder}`, fontWeight: 600, color: T.text, fontSize: 14 }}>{"\u{1F4AC}"} Chat</div>
          <div ref={chatRef} style={{ flex: 1, padding: 18, overflowY: "auto", maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                  background: msg.from === "user" ? T.gradient : "rgba(255,255,255,0.05)",
                  color: msg.from === "user" ? "#FFF" : T.muted, fontSize: 13, lineHeight: 1.5,
                }}>
                  {msg.from === "coach" && <span style={{ marginRight: 4 }}>{"\u{1F9ED}"}</span>}
                  {msg.text}
                  <div style={{ fontSize: 10, color: msg.from === "user" ? "rgba(255,255,255,0.5)" : T.dim, marginTop: 3 }}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.cardBorder}`, display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your life plan..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={send} style={{ ...btn, padding: "10px 14px", borderRadius: 10, fontSize: 16 }}>{"\u27A4"}</button>
          </div>
        </div>

        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Conversation Starters</div>
            {COACH_PROMPTS.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                display: "block", width: "100%", textAlign: "left", background: "none",
                border: "none", padding: "7px 0", fontSize: 12, color: T.accentLight,
                cursor: "pointer", borderBottom: i < COACH_PROMPTS.length - 1 ? `1px solid ${T.cardBorder}` : "none", lineHeight: 1.4,
              }}>{s}</button>
            ))}
          </div>

          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.pink, marginBottom: 10 }}>Your Context</div>
            {[{ l: "Age", v: config.currentAge }, { l: "Target", v: config.targetAge }, { l: "Years Left", v: yearsLeft }, { l: "Events", v: total }].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ fontSize: 12, color: T.dim }}>{item.l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accentLight }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsPage({ config, setConfig, setPage }) {
  const [currentAge, setCurrentAge] = useState(config.currentAge);
  const [targetAge, setTargetAge] = useState(config.targetAge);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 560, margin: "0 auto" }}>
      <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>{"\u2190"} Back</button>
      <div style={{ ...card, padding: 28 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 300, fontStyle: "italic", margin: "0 0 24px" }}>Profile Settings</h2>
        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Current Age</label>
        <input type="range" min={1} max={100} value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: "#7C3AED" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: T.dim }}>1</span>
          <span style={{ background: "rgba(124,58,237,0.15)", color: T.accentLight, padding: "3px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>{currentAge} years old</span>
          <span style={{ fontSize: 11, color: T.dim }}>100</span>
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Target Age</label>
        <input type="range" min={currentAge + 1} max={120} value={targetAge} onChange={(e) => setTargetAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: "#7C3AED" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: T.dim }}>{currentAge + 1}</span>
          <span style={{ background: "rgba(124,58,237,0.15)", color: T.accentLight, padding: "3px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>{targetAge} years old</span>
          <span style={{ fontSize: 11, color: T.dim }}>120</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", textAlign: "center", fontSize: 13, color: T.muted, marginBottom: 20 }}>
          Timeline: <strong style={{ color: T.text }}>{(targetAge - currentAge) * 12} months</strong> remaining
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Country</label>
        <select style={{ ...inputStyle, marginTop: 6, marginBottom: 16 }}>
          <option value="">Select your country</option>
          {["Australia","New Zealand","United States","United Kingdom","Canada","India","Singapore","Japan","Germany","France","Italy","Spain","Brazil","Mexico","South Africa","South Korea","China","Indonesia","Philippines","Thailand","Malaysia","UAE","Ireland","Netherlands","Sweden","Norway","Denmark","Finland","Switzerland"].map(c => <option key={c}>{c}</option>)}
        </select>

        <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Gender</label>
        <select style={{ ...inputStyle, marginTop: 6, marginBottom: 24 }}>
          <option value="">Select your gender</option>
          <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
        </select>

        <button onClick={() => setConfig({ ...config, currentAge, targetAge })} style={{ ...btn, width: "100%", padding: 13 }}>Update Profile</button>
      </div>
    </div>
  );
}

// ─── Onboarding (with emotional hook + retroactive events) ───────────────────

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [currentAge, setCurrentAge] = useState(30);
  const [targetAge, setTargetAge] = useState(90);
  const [importEvents, setImportEvents] = useState({});
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [presetYear, setPresetYear] = useState("");

  const birthYear = new Date().getFullYear() - currentAge;
  const totalMonths = targetAge * 12;
  const livedMonths = currentAge * 12;
  const pctLived = ((livedMonths / totalMonths) * 100).toFixed(1);

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: T.gradientSoft }}>
        <HourglassIcon size={72} />
        <div style={{ marginTop: 14 }}><BrandTitle size={36} /></div>
        <p style={{ color: T.muted, fontSize: 15, marginTop: 10, maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
          See your life in months. Plan with purpose. Make every moment count.
        </p>
        <button onClick={() => setStep(1)} style={{ ...btn, marginTop: 28, padding: "13px 44px", fontSize: 15 }}>Get Started</button>
      </div>
    );
  }

  // Step 1: Age setup
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: T.gradientSoft }}>
        <HourglassIcon size={48} />
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 300, fontStyle: "italic", marginTop: 12 }}>About You</h2>
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 28 }}>We'll use this to build your life timeline.</p>
        <div style={{ ...card, background: T.bgAlt, padding: 28, width: 360, maxWidth: "90vw" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Current Age</label>
          <input type="range" min={1} max={100} value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: "#7C3AED" }} />
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ background: "rgba(124,58,237,0.15)", color: T.accentLight, padding: "3px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>{currentAge} years old</span>
          </div>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.accentLight, textTransform: "uppercase", letterSpacing: 1 }}>Target Age</label>
          <input type="range" min={currentAge + 1} max={120} value={targetAge} onChange={(e) => setTargetAge(parseInt(e.target.value))} style={{ width: "100%", marginTop: 8, accentColor: "#7C3AED" }} />
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ background: "rgba(124,58,237,0.15)", color: T.accentLight, padding: "3px 14px", borderRadius: 16, fontSize: 13, fontWeight: 700 }}>{targetAge} years old</span>
          </div>
          <button onClick={() => setStep(2)} style={{ ...btn, width: "100%", padding: 13 }}>See My Timeline</button>
        </div>
      </div>
    );
  }

  // Step 2: Emotional hook — the full dot grid
  if (step === 2) {
    const endYear = birthYear + targetAge;
    const tempEvents = {};
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", background: T.gradientSoft }}>
        <h2 style={{ color: T.text, fontSize: 24, fontWeight: 300, fontStyle: "italic", margin: "0 0 6px" }}>This is your life</h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 4 }}>
          Each dot is one month. <span style={{ color: T.accentLight, fontWeight: 600 }}>{pctLived}%</span> is already behind you.
        </p>
        <p style={{ color: T.dim, fontSize: 12, marginBottom: 20 }}>
          {livedMonths} months lived &middot; {totalMonths - livedMonths} months remaining
        </p>
        <div style={{ width: "100%", maxWidth: 900, overflowX: "auto", overflowY: "auto", maxHeight: "55vh", marginBottom: 20 }}>
          <DotGrid birthYear={birthYear} events={tempEvents} startYear={birthYear} endYear={endYear} compact />
        </div>
        <p style={{ color: T.muted, fontSize: 13, textAlign: "center", maxWidth: 400, lineHeight: 1.6, marginBottom: 20 }}>
          The filled dots are months you've already lived. The rest is what you have left. Let's make every one count.
        </p>
        <button onClick={() => setStep(3)} style={{ ...btn, padding: "13px 44px", fontSize: 15 }}>Fill In My Story</button>
        <button onClick={() => onComplete({ currentAge, targetAge }, importEvents)} style={{ background: "none", border: "none", color: T.dim, fontSize: 13, cursor: "pointer", marginTop: 10 }}>Skip for now</button>
      </div>
    );
  }

  // Step 3: Retroactive life events
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", background: T.gradientSoft }}>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 300, fontStyle: "italic", margin: "0 0 6px" }}>Add your life story</h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 24, textAlign: "center", maxWidth: 400 }}>
        Tap events below to place them on your timeline. This makes your past come alive.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500, marginBottom: 20 }}>
        {LIFE_PRESETS.map((preset, i) => {
          const isAdded = Object.values(importEvents).some(e => e.title === preset.title);
          return (
            <button key={i} onClick={() => {
              if (!isAdded) { setSelectedPreset(preset); setPresetYear(""); }
            }} style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              background: isAdded ? CAT_MAP[preset.category]?.color : "rgba(255,255,255,0.05)",
              color: isAdded ? "#FFF" : T.muted,
              border: isAdded ? "none" : `1px solid ${T.cardBorder}`,
              display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
            }}>
              <span>{preset.icon}</span>{preset.title}
            </button>
          );
        })}
      </div>

      {selectedPreset && (
        <div style={{ ...card, background: T.bgAlt, padding: 20, width: 320, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>{selectedPreset.icon} {selectedPreset.title}</div>
          <label style={{ fontSize: 11, color: T.muted }}>What year?</label>
          <input type="number" value={presetYear} onChange={(e) => setPresetYear(e.target.value)}
            placeholder={`e.g. ${birthYear + 20}`} min={birthYear} max={new Date().getFullYear()}
            style={{ ...inputStyle, marginTop: 4, marginBottom: 12 }} />
          <button onClick={() => {
            if (presetYear) {
              const yr = parseInt(presetYear);
              const key = `${yr}-6`;
              setImportEvents(p => ({ ...p, [key]: { title: selectedPreset.title, category: selectedPreset.category, notes: "" } }));
              setSelectedPreset(null);
            }
          }} style={{ ...btn, width: "100%", padding: 10, fontSize: 13 }}>Add to Timeline</button>
        </div>
      )}

      {Object.keys(importEvents).length > 0 && (
        <div style={{ fontSize: 13, color: T.accentLight, marginBottom: 12 }}>
          {Object.keys(importEvents).length} events added to your story
        </div>
      )}

      <button onClick={() => onComplete({ currentAge, targetAge }, importEvents)} style={{ ...btn, padding: "13px 44px", fontSize: 15, marginTop: 8 }}>
        Enter My Timeline
      </button>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function TimeToLive() {
  const [config, setConfig] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [events, setEvents] = useState({});
  const [reflections, setReflections] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const handleOnboard = (cfg, importedEvents) => {
    setConfig(cfg);
    if (importedEvents) setEvents(importedEvents);
    setPage("dashboard");
  };

  if (!config) return <Onboarding onComplete={handleOnboard} />;

  const monthsRem = (config.targetAge - config.currentAge) * 12 - new Date().getMonth();

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage config={config} events={events} setEvents={setEvents} setPage={setPage} />;
      case "planner": return <PlannerPage config={config} events={events} setEvents={setEvents} />;
      case "timeline": return <TimelinePage config={config} events={events} setEvents={setEvents} setPage={setPage} />;
      case "balance": return <BalancePage events={events} config={config} />;
      case "reflections": return <ReflectionsPage reflections={reflections} setReflections={setReflections} events={events} />;
      case "milestones": return <MilestonesPage milestones={milestones} setMilestones={setMilestones} />;
      case "coach": return <CoachPage config={config} events={events} />;
      case "settings": return <SettingsPage config={config} setConfig={setConfig} setPage={setPage} />;
      default: return null;
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      minHeight: "100vh", background: T.gradientSoft, display: "flex",
    }}>
      <Sidebar page={page} setPage={setPage} currentAge={config.currentAge} targetAge={config.targetAge} monthsRemaining={monthsRem} />
      <div style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>{renderPage()}</div>
    </div>
  );
}

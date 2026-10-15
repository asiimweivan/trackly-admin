import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search, Download, ChevronDown, ChevronRight, X } from "lucide-react";
import client from "../api/client";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

// ── Categories: every log action is sorted into one of these ──────────────
type CatKey = "subscriptions" | "users" | "businesses" | "team" | "notifications" | "agents" | "support" | "other";

const CATEGORIES: { key: CatKey; label: string; color: string; match: RegExp }[] = [
  { key: "subscriptions", label: "Subscriptions", color: "#059669", match: /subscription|plan|billing|payment/ },
  { key: "users",         label: "Users",         color: "#3B82F6", match: /^user|login|password/ },
  { key: "businesses",    label: "Businesses",    color: "#D97706", match: /business|verif/ },
  { key: "team",          label: "Admin team",    color: "#8B5CF6", match: /staff|role|admin_/ },
  { key: "notifications", label: "Notifications", color: "#0EA5E9", match: /notification|announcement|banner/ },
  { key: "agents",        label: "Agents",        color: "#EC4899", match: /agent|payout|commission/ },
  { key: "support",       label: "Support",       color: "#14B8A6", match: /ticket|support/ },
  { key: "other",         label: "Other",         color: "#6B7280", match: /.*/ },
];
const CAT_BY_KEY: Record<string, typeof CATEGORIES[number]> = {};
CATEGORIES.forEach(c => { CAT_BY_KEY[c.key] = c; });

const categoryOf = (action: string): CatKey => {
  const a = (action || "").toLowerCase();
  for (const c of CATEGORIES) if (c.key !== "other" && c.match.test(a)) return c.key;
  return "other";
};

// risky actions get a red tone and count as "Sensitive"
const SENSITIVE = /cancel|suspend|unverif|delete|remove|void|reject|role_changed|created/;
const isSensitive = (action: string) => SENSITIVE.test((action || "").toLowerCase());

type RangeKey = "today" | "7d" | "30d" | "all";
type GroupKey = "none" | "category" | "admin" | "day";
type SortKey = "newest" | "oldest";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" }, { key: "7d", label: "7 days" }, { key: "30d", label: "30 days" }, { key: "all", label: "All" },
];
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "none", label: "Flat list" }, { key: "category", label: "By category" }, { key: "admin", label: "By admin" }, { key: "day", label: "By day" },
];

// server stores LocalDateTime without a zone (UTC on Render): show it in the viewer's local time
const toDate = (s?: string): Date | null => {
  if (!s) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z");
  return isNaN(d.getTime()) ? null : d;
};
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const timeLabel = (d: Date | null) => (d ? pad(d.getHours()) + ":" + pad(d.getMinutes()) : "");
const dayLabel = (key: string) => {
  const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (key === dayKey(today)) return "Today";
  if (key === dayKey(y)) return "Yesterday";
  const [yy, mm, dd] = key.split("-").map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
};

const PREF_KEY = "trackly_audit_view_v1";
interface Prefs { range: RangeKey; group: GroupKey; sort: SortKey; cats: CatKey[]; admin: string; }
const DEFAULT_PREFS: Prefs = { range: "30d", group: "category", sort: "newest", cats: [], admin: "all" };
const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
};

interface Row { id: string; raw: any; date: Date | null; cat: CatKey; admin: string; action: string; sensitive: boolean; }

const csvCell = (v: any) => '"' + String(v ?? "").replace(/"/g, '""') + '"';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    client.get("/admin/audit-logs")
      .then((r: any) => { setLogs(Array.isArray(r.data) ? r.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Admin id -> real name, so the log reads "Trackly Admin" and not just a phone number.
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    client.get("/admin/users")
      .then((r: any) => {
        const m: Record<string, string> = {};
        (Array.isArray(r.data) ? r.data : []).forEach((u: any) => { if (u && u.id && u.fullName) m[u.id] = u.fullName; });
        setNames(m);
      })
      .catch(() => { /* names are optional */ });
  }, []);

  const setPref = (patch: Partial<Prefs>) => {
    setPrefs(p => {
      const next = { ...p, ...patch };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const rows: Row[] = useMemo(() => logs.map(l => ({
    id: l.id,
    raw: l,
    date: toDate(l.createdAt),
    cat: categoryOf(l.action),
    admin: (l.adminId && names[l.adminId]) ? names[l.adminId] : (l.adminPhone || (l.adminId ? String(l.adminId).substring(0, 8) : "system")),
    action: l.action || "",
    sensitive: isSensitive(l.action),
  })), [logs, names]);

  // range + search + admin (category counts are computed on this set, before the category filter)
  const base = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const from = prefs.range === "today" ? startToday
      : prefs.range === "7d" ? startToday - 6 * 86400000
      : prefs.range === "30d" ? startToday - 29 * 86400000 : 0;
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (from && (!r.date || r.date.getTime() < from)) return false;
      if (prefs.admin !== "all" && r.admin !== prefs.admin) return false;
      if (q) {
        const hay = (r.action + " " + r.admin + " " + (r.raw.details || "") + " " + (r.raw.targetType || "") + " " + (r.raw.targetId || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, prefs.range, prefs.admin, search]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    base.forEach(r => { m[r.cat] = (m[r.cat] || 0) + 1; });
    return m;
  }, [base]);

  const filtered = useMemo(() => {
    const list = prefs.cats.length ? base.filter(r => prefs.cats.includes(r.cat)) : base.slice();
    list.sort((a, b) => {
      const d = (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
      return prefs.sort === "newest" ? -d : d;
    });
    return list;
  }, [base, prefs.cats, prefs.sort]);

  const admins = useMemo(() => Array.from(new Set(rows.map(r => r.admin))).sort(), [rows]);

  const groups = useMemo(() => {
    if (prefs.group === "none") return [{ key: "all", label: "All actions", color: NAVY, rows: filtered }];
    const map = new Map<string, Row[]>();
    filtered.forEach(r => {
      const k = prefs.group === "category" ? r.cat : prefs.group === "admin" ? r.admin : (r.date ? dayKey(r.date) : "unknown");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    });
    const out = Array.from(map.entries()).map(([k, rs]) => ({
      key: k,
      label: prefs.group === "category" ? CAT_BY_KEY[k].label : prefs.group === "day" ? (k === "unknown" ? "Unknown date" : dayLabel(k)) : k,
      color: prefs.group === "category" ? CAT_BY_KEY[k].color : TEAL,
      rows: rs,
    }));
    if (prefs.group === "category") out.sort((a, b) => CATEGORIES.findIndex(c => c.key === a.key) - CATEGORIES.findIndex(c => c.key === b.key));
    else if (prefs.group === "admin") out.sort((a, b) => b.rows.length - a.rows.length);
    else out.sort((a, b) => (prefs.sort === "newest" ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key)));
    return out;
  }, [filtered, prefs.group, prefs.sort]);

  const todayKey = dayKey(new Date());
  const stats = [
    { label: "Actions shown", value: filtered.length, color: NAVY },
    { label: "Today", value: rows.filter(r => r.date && dayKey(r.date) === todayKey).length, color: TEAL },
    { label: "Sensitive", value: filtered.filter(r => r.sensitive).length, color: "#EF4444" },
    { label: "Admins active", value: new Set(filtered.map(r => r.admin)).size, color: "#8B5CF6" },
  ];

  const toggleCat = (k: CatKey) =>
    setPref({ cats: prefs.cats.includes(k) ? prefs.cats.filter(c => c !== k) : [...prefs.cats, k] });

  const exportCsv = () => {
    const head = ["Time", "Admin", "Category", "Action", "Target type", "Target id", "Details"];
    const lines = [head.map(csvCell).join(",")].concat(filtered.map(r => [
      r.date ? r.date.toLocaleString() : "", r.admin, CAT_BY_KEY[r.cat].label, r.action,
      r.raw.targetType || "", r.raw.targetId || "", r.raw.details || "",
    ].map(csvCell).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trackly-audit-logs-" + todayKey + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const customised = prefs.cats.length > 0 || prefs.admin !== "all" || search.trim() !== "" || prefs.range !== DEFAULT_PREFS.range || prefs.group !== DEFAULT_PREFS.group || prefs.sort !== DEFAULT_PREFS.sort;
  const reset = () => { setSearch(""); setPref({ ...DEFAULT_PREFS }); };

  const seg = (active: boolean): React.CSSProperties => ({
    padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", borderRadius: 8,
    background: active ? NAVY : "transparent", color: active ? "#fff" : "#6B7280",
  });
  const segWrap: React.CSSProperties = { display: "inline-flex", background: "#F3F4F6", borderRadius: 10, padding: 3, gap: 2 };
  const label: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: GRAY, letterSpacing: 0.6, marginBottom: 5 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} color={NAVY} /> Audit Logs
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Every admin action, sorted the way you want it. Your view is remembered.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color={GRAY} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action, admin, details..."
              style={{ padding: "10px 16px 10px 38px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, width: 280, outline: "none" }} />
          </div>
          <button onClick={exportCsv} disabled={filtered.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 12, cursor: filtered.length ? "pointer" : "default", opacity: filtered.length ? 1 : 0.5 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {stats.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: "3px solid " + c.color }}>
            <div style={{ fontSize: 11, color: GRAY, fontWeight: 700 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color, marginTop: 2 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Customise bar */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={label}>TIME RANGE</div>
            <div style={segWrap}>{RANGES.map(r => <button key={r.key} style={seg(prefs.range === r.key)} onClick={() => setPref({ range: r.key })}>{r.label}</button>)}</div>
          </div>
          <div>
            <div style={label}>GROUP BY</div>
            <div style={segWrap}>{GROUPS.map(g => <button key={g.key} style={seg(prefs.group === g.key)} onClick={() => setPref({ group: g.key })}>{g.label}</button>)}</div>
          </div>
          <div>
            <div style={label}>ORDER</div>
            <div style={segWrap}>
              <button style={seg(prefs.sort === "newest")} onClick={() => setPref({ sort: "newest" })}>Newest first</button>
              <button style={seg(prefs.sort === "oldest")} onClick={() => setPref({ sort: "oldest" })}>Oldest first</button>
            </div>
          </div>
          <div>
            <div style={label}>ADMIN</div>
            <select value={prefs.admin} onChange={e => setPref({ admin: e.target.value })}
              style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 12, fontWeight: 700, color: NAVY, outline: "none", background: "#fff" }}>
              <option value="all">All admins</option>
              {admins.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {customised && (
            <button onClick={reset}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              <X size={13} /> Reset view
            </button>
          )}
        </div>

        {/* Category chips */}
        <div style={{ marginTop: 16 }}>
          <div style={label}>CATEGORIES {prefs.cats.length > 0 && <span style={{ color: TEAL }}>({prefs.cats.length} selected)</span>}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setPref({ cats: [] })}
              style={{ border: "1.5px solid " + (prefs.cats.length === 0 ? NAVY : "#E5E7EB"), background: prefs.cats.length === 0 ? NAVY : "#fff", color: prefs.cats.length === 0 ? "#fff" : "#6B7280", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              All <span style={{ opacity: 0.7 }}>{base.length}</span>
            </button>
            {CATEGORIES.map(c => {
              const on = prefs.cats.includes(c.key);
              const n = catCounts[c.key] || 0;
              return (
                <button key={c.key} onClick={() => toggleCat(c.key)} disabled={n === 0 && !on}
                  style={{ display: "flex", alignItems: "center", gap: 7, border: "1.5px solid " + (on ? c.color : "#E5E7EB"), background: on ? c.color + "18" : "#fff", color: on ? c.color : "#4B5563", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 800, cursor: n === 0 && !on ? "default" : "pointer", opacity: n === 0 && !on ? 0.4 : 1 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: c.color }} />
                  {c.label} <span style={{ opacity: 0.6 }}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>Loading audit logs...</p> :
        filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", color: GRAY, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            {logs.length === 0 ? "No audit logs yet. Actions will appear here." : "Nothing matches this view. Try a wider time range or reset the view."}
          </div>
        ) : groups.map(g => {
          const isCollapsed = !!collapsed[g.key];
          return (
            <div key={g.key} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14, overflow: "hidden" }}>
              {prefs.group !== "none" && (
                <div onClick={() => setCollapsed(c => ({ ...c, [g.key]: !c[g.key] }))}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", cursor: "pointer", borderBottom: isCollapsed ? "none" : "1px solid #F3F4F6", background: g.color + "0D" }}>
                  {isCollapsed ? <ChevronRight size={16} color={g.color} /> : <ChevronDown size={16} color={g.color} />}
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: g.color }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{g.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: g.color, background: g.color + "1F", padding: "2px 9px", borderRadius: 12 }}>{g.rows.length}</span>
                </div>
              )}
              {!isCollapsed && g.rows.map((r, i) => {
                const cat = CAT_BY_KEY[r.cat];
                const tone = r.sensitive ? "#EF4444" : cat.color;
                const expanded = open === r.id;
                return (
                  <div key={r.id} style={{ borderTop: i === 0 && prefs.group !== "none" ? "none" : "1px solid #F3F4F6" }}>
                    <div onClick={() => setOpen(expanded ? null : r.id)}
                      style={{ display: "grid", gridTemplateColumns: "130px 150px 210px 1fr 24px", gap: 12, alignItems: "center", padding: "12px 20px", cursor: "pointer", background: expanded ? "#F9FAFB" : "#fff" }}>
                      <div style={{ fontSize: 11, color: GRAY, lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 800, color: "#374151" }}>{timeLabel(r.date)}</div>
                        {r.date ? dayKey(r.date) : ""}
                      </div>
                      <div style={{ fontSize: 12, color: NAVY, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.admin}</div>
                      <div>
                        <span style={{ background: tone + "1F", color: tone, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                          {r.action.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4B5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {prefs.group !== "category" && <span style={{ color: cat.color, fontWeight: 800, marginRight: 8 }}>{cat.label}</span>}
                        {r.raw.details}
                      </div>
                      {expanded ? <ChevronDown size={15} color={GRAY} /> : <ChevronRight size={15} color={GRAY} />}
                    </div>
                    {expanded && (
                      <div style={{ padding: "4px 20px 16px 20px", background: "#F9FAFB", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, fontSize: 12 }}>
                        <div><div style={label}>FULL TIME</div><div style={{ color: "#374151" }}>{r.date ? r.date.toLocaleString() : "-"}</div></div>
                        <div><div style={label}>TARGET</div><div style={{ color: "#374151", wordBreak: "break-all" }}>{r.raw.targetType} {r.raw.targetId}</div></div>
                        <div><div style={label}>ADMIN ID</div><div style={{ color: "#374151", wordBreak: "break-all" }}>{r.raw.adminId}</div></div>
                        <div style={{ gridColumn: "1 / -1" }}><div style={label}>DETAILS</div><div style={{ color: "#374151", lineHeight: 1.5 }}>{r.raw.details || "-"}</div></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
}
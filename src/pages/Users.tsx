import React, { useEffect, useMemo, useState } from "react";
import { Users as UsersIcon, Search, CheckCircle2, XCircle, RotateCcw, Trash2, Store, Briefcase, ShieldCheck, UserCog, Clock } from "lucide-react";
import { adminApi } from "../api/admin";
import { effectivePlan } from "../utils/plans";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF"; const RED = "#EF4444";

type Cat = "owners" | "agents" | "staff" | "admins";
type Tab = "all" | Cat | "deleted";

const CATS: Record<Cat, { label: string; icon: any; color: string }> = {
  owners: { label: "Business owners", icon: Store,       color: TEAL },
  agents: { label: "Agents",          icon: Briefcase,   color: GOLD },
  staff:  { label: "Staff & other",   icon: UserCog,     color: "#6366F1" },
  admins: { label: "Admins",          icon: ShieldCheck, color: NAVY },
};

const PLANS: Record<string, { label: string; color: string }> = {
  ubuntu:     { label: "Ubuntu",     color: "#64748B" },
  ibanze:     { label: "Ibanze",     color: TEAL },
  iterambere: { label: "Iterambere", color: NAVY },
  inkunga:    { label: "Agaciro",    color: GOLD },
};

const catOf = (role?: string): Cat => {
  const r = (role || "").toUpperCase();
  if (r.includes("ADMIN")) return "admins";
  if (r.includes("AGENT")) return "agents";
  if (r === "BUSINESS_OWNER") return "owners";
  return "staff";
};

const roleLabel = (role?: string) => {
  const t = (role || "").toLowerCase().replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const initials = (name?: string) =>
  (name || "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

const day = (iso?: string) => (iso ? iso.split("T")[0] : "");

function Avatar({ name, color }: { name?: string; color: string }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: 19, background: color + "1A", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function Pill({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return <span style={{ background: bg, color: fg, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{text}</span>;
}

const th: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "14px 16px", verticalAlign: "middle" };

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [deleted, setDeleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [busy, setBusy] = useState("");

  const load = async () => {
    const [u, d] = await Promise.all([
      adminApi.getUsers().then(r => r.data).catch(() => []),
      adminApi.getDeletedAccounts().then(r => r.data).catch(() => []),
    ]);
    setUsers(u); setDeleted(d); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (userId: string, active: boolean) => {
    try {
      await adminApi.toggleUserStatus(userId, !active);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !active } : u));
    } catch { alert("Failed to update user status."); }
  };

  const recover = async (a: any) => {
    if (!window.confirm(`Recover ${a.fullName}'s account? They will be able to sign in again and will get an email.`)) return;
    setBusy(a.userId);
    try { await adminApi.recoverAccount(a.userId); await load(); }
    catch { alert("Could not recover this account."); }
    setBusy("");
  };

  const erase = async (a: any) => {
    if (!window.confirm(`Erase ${a.fullName}'s account and ALL business data permanently? This cannot be undone.`)) return;
    setBusy(a.userId);
    try { await adminApi.purgeAccount(a.userId); await load(); }
    catch { alert("Could not erase this account (Super admin only)."); }
    setBusy("");
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length, owners: 0, agents: 0, staff: 0, admins: 0, deleted: deleted.length };
    users.forEach(u => { c[catOf(u.role)]++; });
    return c;
  }, [users, deleted]);

  const q = search.trim().toLowerCase();

  const shownUsers = useMemo(() => users
    .filter(u => tab === "all" || catOf(u.role) === tab)
    .filter(u => plan === "all" || catOf(u.role) !== "owners" || effectivePlan(u.planKey, u.subscriptionStatus) === plan)
    .filter(u => !q || [u.fullName, u.phone, u.email, u.businessName, u.role].some((v: any) => (v || "").toLowerCase().includes(q)))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
  [users, tab, plan, q]);

  const shownDeleted = useMemo(() => deleted
    .filter(a => !q || [a.fullName, a.phone, a.email, a.businessName].some((v: any) => (v || "").toLowerCase().includes(q)))
    .sort((a, b) => Number(b.recoveryRequested) - Number(a.recoveryRequested)),
  [deleted, q]);

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: "all", label: "All", color: NAVY },
    ...(Object.keys(CATS) as Cat[]).map(k => ({ key: k as Tab, label: CATS[k].label, color: CATS[k].color })),
    { key: "deleted", label: "Deleted accounts", color: RED },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <UsersIcon size={24} color={NAVY} /> Users
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>{users.length} registered users{deleted.length ? ` · ${deleted.length} deleted` : ""}</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color={GRAY} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email, business..."
            style={{ padding: "10px 16px 10px 38px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, width: 300, outline: "none" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        {tabs.map(t => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${on ? t.color : "#E5E7EB"}`, background: on ? t.color : "#fff", color: on ? "#fff" : "#4B5563" }}>
              {t.label}
              <span style={{ background: on ? "rgba(255,255,255,0.25)" : t.color + "18", color: on ? "#fff" : t.color, borderRadius: 10, padding: "1px 8px", fontSize: 11 }}>{counts[t.key]}</span>
            </button>
          );
        })}
        {(tab === "all" || tab === "owners") && (
          <select value={plan} onChange={e => setPlan(e.target.value)}
            style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#4B5563", background: "#fff" }}>
            <option value="all">All plans</option>
            {Object.keys(PLANS).map(k => <option key={k} value={k}>{PLANS[k].label}</option>)}
          </select>
        )}
      </div>

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : tab === "deleted" ? (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#FFFBEB", color: "#92400E", fontSize: 12, borderBottom: "1px solid #FDE68A" }}>
            Deleted accounts are hidden everywhere and cannot sign in. They are erased automatically after 30 days. Recover one when the owner asks.
          </div>
          {shownDeleted.length === 0 ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No deleted accounts.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#F9FAFB" }}>
                  {["Account", "Business", "Deleted on", "Time left", "Recovery", "Actions"].map(h => <th key={h} style={th}>{h.toUpperCase()}</th>)}
                </tr></thead>
                <tbody>
                  {shownDeleted.map((a: any) => (
                    <tr key={a.userId} style={{ borderTop: "1px solid #F3F4F6", background: a.recoveryRequested ? "#FFFBEB" : "#fff" }}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={a.fullName} color={RED} />
                          <div>
                            <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{a.fullName}</div>
                            <div style={{ fontSize: 11, color: "#6B7280" }}>{a.phone}{a.email ? ` · ${a.email}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, fontSize: 12, color: NAVY, fontWeight: 600 }}>{a.businessName || "—"}</td>
                      <td style={{ ...td, fontSize: 12, color: "#6B7280" }}>{day(a.deletedAt)}</td>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: a.daysLeft <= 3 ? RED : "#4B5563" }}>
                          <Clock size={13} /> {a.daysLeft} day{a.daysLeft === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td style={td}>
                        {a.recoveryRequested
                          ? <Pill text={`Requested ${day(a.recoveryRequestedAt)}`} bg="#FEF3C7" fg="#B45309" />
                          : <span style={{ color: GRAY, fontSize: 12 }}>—</span>}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button disabled={busy === a.userId} onClick={() => recover(a)}
                            style={{ display: "flex", alignItems: "center", gap: 6, background: "#ECFDF5", color: "#059669", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            <RotateCcw size={13} /> Recover
                          </button>
                          <button disabled={busy === a.userId} onClick={() => erase(a)}
                            style={{ display: "flex", alignItems: "center", gap: 6, background: "#FEF2F2", color: RED, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            <Trash2 size={13} /> Erase now
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {shownUsers.length === 0 ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No users match.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#F9FAFB" }}>
                  {["User", "Role", "Business & plan", "Status", "Joined", "Last login", "Actions"].map(h => <th key={h} style={th}>{h.toUpperCase()}</th>)}
                </tr></thead>
                <tbody>
                  {shownUsers.map((u: any) => {
                    const cat = catOf(u.role);
                    const cm = CATS[cat];
                    const ep = u.businessName ? effectivePlan(u.planKey, u.subscriptionStatus) : null;
                    const pm = ep ? PLANS[ep] : null;
                    return (
                      <tr key={u.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar name={u.fullName} color={cm.color} />
                            <div>
                              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{u.fullName}</div>
                              <div style={{ fontSize: 11, color: "#6B7280" }}>{u.phone}</div>
                              {u.email && <div style={{ fontSize: 11, color: GRAY }}>{u.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={td}><Pill text={roleLabel(u.role)} bg={cm.color + "18"} fg={cm.color} /></td>
                        <td style={td}>
                          {u.businessName ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {u.businessVerified ? <CheckCircle2 size={16} color="#1D9BF0" /> : <XCircle size={16} color="#D1D5DB" />}
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{u.businessName}</div>
                                {pm && <span style={{ fontSize: 10, fontWeight: 800, color: pm.color }}>{pm.label}</span>}
                              </div>
                            </div>
                          ) : <span style={{ color: GRAY, fontSize: 12 }}>—</span>}
                        </td>
                        <td style={td}><Pill text={u.isActive ? "Active" : "Suspended"} bg={u.isActive ? "#ECFDF5" : "#FEF2F2"} fg={u.isActive ? "#059669" : RED} /></td>
                        <td style={{ ...td, fontSize: 11, color: GRAY }}>{day(u.createdAt) || "—"}</td>
                        <td style={{ ...td, fontSize: 11, color: GRAY }}>{day(u.lastLoginAt) || "Never"}</td>
                        <td style={td}>
                          <button onClick={() => toggle(u.id, u.isActive)}
                            style={{ background: u.isActive ? "#FEF2F2" : "#ECFDF5", color: u.isActive ? RED : "#059669", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

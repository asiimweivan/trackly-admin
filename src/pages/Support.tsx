import React, { useEffect, useState } from "react";
import { Headphones, Plus, Mail, Smartphone, Send, Search } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF"; const RED = "#EF4444";

const EMPTY_MANUAL = { businessId: "", contactName: "", contactPhone: "", contactEmail: "", subject: "", message: "", priority: "medium" };

const PRIORITY_RANK: any = { high: 0, medium: 1, low: 2 };

function timeAgo(iso: string) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return iso.split("T")[0];
}

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [replyStatus, setReplyStatus] = useState<"open" | "in_progress" | "resolved">("resolved");
  const [logModal, setLogModal] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.getTickets(filter === "all" ? undefined : filter),
      adminApi.getTicketStats(),
    ]).then(([tRes, sRes]) => {
      setTickets(tRes.data);
      setStats(sRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      await adminApi.respondToTicket(id, { status: "resolved" });
      setMsg("Ticket marked resolved.");
      load();
    } catch { setMsg("Failed to resolve ticket."); }
    finally { setBusyId(null); }
  };

  const sendResponse = async () => {
    if (!detail || !response.trim()) return;
    setBusyId(detail.id);
    try {
      await adminApi.respondToTicket(detail.id, { status: replyStatus, adminResponse: response.trim() });
      setMsg("Response sent to the customer by email" + (detail.source === "app" ? " and push notification." : "."));
      setDetail(null);
      setResponse("");
      load();
    } catch { setMsg("Failed to send response."); }
    finally { setBusyId(null); }
  };

  const logManualTicket = async () => {
    if (!manual.contactName || !manual.subject || !manual.message) return;
    setSaving(true);
    try {
      await adminApi.createManualTicket(manual);
      setMsg("Email ticket logged successfully.");
      setLogModal(false);
      setManual(EMPTY_MANUAL);
      load();
    } catch { setMsg("Failed to log ticket."); }
    finally { setSaving(false); }
  };

  const filtered = tickets
    .filter(t => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (t.businessName || "").toLowerCase().includes(q)
        || (t.contactName || "").toLowerCase().includes(q)
        || (t.subject || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Headphones size={22} color={NAVY} /> Support
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Tickets submitted from the app, plus anything logged from contact.ivanexo@gmail.com</p>
        </div>
        <button onClick={() => setLogModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1.5px solid ${NAVY}`, color: NAVY, borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          <Mail size={14} /> Log Email Ticket
        </button>
      </div>

      {msg && <div style={{ background: msg.includes("Failed") ? "#FEF2F2" : "#ECFDF5", color: msg.includes("Failed") ? RED : "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 700, fontSize: 13 }}>{msg}</div>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Open", value: stats.open, color: RED },
            { label: "In Progress", value: stats.inProgress, color: "#D97706" },
            { label: "Resolved", value: stats.resolved, color: TEAL },
            { label: "Total", value: stats.total, color: NAVY },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 11, color: GRAY, fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "open", "in_progress", "resolved"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid", borderColor: filter === f ? TEAL : "#E5E7EB", background: filter === f ? TEAL : "#fff", color: filter === f ? "#fff" : "#6B7280", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", width: 260 }}>
          <Search size={15} color={GRAY} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business or subject..."
            style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Source", "Business / Contact", "Subject", "Priority", "Status", "Received", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px" }}>
                    {t.source === "email" ? <Mail size={15} color={GRAY} /> : <Smartphone size={15} color={TEAL} />}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => { setDetail(t); setResponse(""); setReplyStatus("resolved"); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{t.businessName || t.contactName || "Unknown"}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{t.contactPhone || t.contactEmail || ""}</div>
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#374151", maxWidth: 240 }}>{t.subject}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: t.priority === "high" ? "#FEF2F2" : t.priority === "medium" ? "#FFF7ED" : "#F0FDF4", color: t.priority === "high" ? RED : t.priority === "medium" ? "#D97706" : "#059669", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: t.status === "open" ? "#FEF2F2" : t.status === "in_progress" ? "#FFF7ED" : "#ECFDF5", color: t.status === "open" ? RED : t.status === "in_progress" ? "#D97706" : "#059669", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {t.status === "in_progress" ? "IN PROGRESS" : t.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: GRAY }} title={t.createdAt?.split("T")[0]}>{timeAgo(t.createdAt)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {t.status !== "resolved" && (
                      <button onClick={() => resolve(t.id)} disabled={busyId === t.id} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === t.id ? 0.6 : 1 }}>
                        Quick Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No tickets match this view.</p>}
        </div>
      )}

      {/* Ticket detail / respond modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: NAVY }}>{detail.subject}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: GRAY }}>{detail.businessName || detail.contactName} &middot; {detail.contactPhone || detail.contactEmail}</p>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: GRAY }}>&times;</button>
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 16 }}>{detail.message}</div>
            {detail.adminResponse && (
              <div style={{ background: "#F0FDF9", borderRadius: 10, padding: 14, fontSize: 13, color: "#065F46", lineHeight: 1.6, marginBottom: 16 }}>
                <strong>Previous response:</strong> {detail.adminResponse}
              </div>
            )}
            {detail.status !== "resolved" || true ? (
              <>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>RESPONSE (emailed to the customer)</label>
                <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} placeholder="Type your response..."
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }} />

                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>SET STATUS TO</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {(["open", "in_progress", "resolved"] as const).map(st => (
                    <button key={st} onClick={() => setReplyStatus(st)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1.5px solid", borderColor: replyStatus === st ? TEAL : "#E5E7EB", background: replyStatus === st ? TEAL : "#fff", color: replyStatus === st ? "#fff" : "#6B7280", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      {st === "in_progress" ? "In Progress" : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>

                <button onClick={sendResponse} disabled={busyId === detail.id || !response.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", opacity: (busyId === detail.id || !response.trim()) ? 0.6 : 1 }}>
                  <Send size={15} /> {busyId === detail.id ? "Sending..." : "Send Response"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Log email ticket modal */}
      {logModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setLogModal(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 460 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: NAVY }}>Log Email Ticket</h2>
            <p style={{ margin: "0 0 18px", fontSize: 12, color: GRAY }}>For anything received at contact.ivanexo@gmail.com</p>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>CONTACT NAME</label>
            <input value={manual.contactName} onChange={e => setManual({ ...manual, contactName: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: "border-box" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>PHONE</label>
                <input value={manual.contactPhone} onChange={e => setManual({ ...manual, contactPhone: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>EMAIL</label>
                <input value={manual.contactEmail} onChange={e => setManual({ ...manual, contactEmail: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>SUBJECT</label>
            <input value={manual.subject} onChange={e => setManual({ ...manual, subject: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: "border-box" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>MESSAGE</label>
            <textarea value={manual.message} onChange={e => setManual({ ...manual, message: e.target.value })} rows={3}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: "border-box", resize: "vertical" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>PRIORITY</label>
            <select value={manual.priority} onChange={e => setManual({ ...manual, priority: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 18, outline: "none" }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={logManualTicket} disabled={saving || !manual.contactName || !manual.subject || !manual.message}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", opacity: (saving || !manual.contactName || !manual.subject || !manual.message) ? 0.6 : 1 }}>
                <Plus size={15} /> {saving ? "Logging..." : "Log Ticket"}
              </button>
              <button onClick={() => { setLogModal(false); setManual(EMPTY_MANUAL); }} style={{ flex: 1, padding: 12, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A";
const RED = "#EF4444"; const GRAY = "#9CA3AF";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending_review: { bg: "#FFFBEB", fg: "#D97706" },
  approved:       { bg: "#ECFDF5", fg: "#059669" },
  rejected:       { bg: "#FEF2F2", fg: "#EF4444" },
  suspended:      { bg: "#F3F4F6", fg: "#6B7280" },
};

const PAYOUT_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  calculated: { bg: "#FFFBEB", fg: "#D97706", label: "To pay" },
  paid:       { bg: "#ECFDF5", fg: "#059669", label: "Paid" },
  voided:     { bg: "#F3F4F6", fg: "#6B7280", label: "Voided" },
};

const TABS = [
  { key: "",              label: "All" },
  { key: "pending_review",label: "Pending" },
  { key: "approved",      label: "Approved" },
  { key: "rejected",      label: "Rejected" },
  { key: "suspended",     label: "Suspended" },
];

const errMsg = (e: any, fallback: string): string =>
  (e && e.response && e.response.data && e.response.data.message) || fallback;

// The last n closed months as "YYYY-MM", newest first
function lastClosedMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    d.setMonth(d.getMonth() - 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default function Agents() {
  const [view, setView]       = useState<"applications" | "payouts">("applications");

  // Applications
  const [data, setData]       = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("pending_review");
  const [detail, setDetail]   = useState<any>(null);
  const [rejecting, setRejecting] = useState<any>(null);
  const [reason, setReason]   = useState("");

  // Payouts
  const months = lastClosedMonths(6);
  const [payouts, setPayouts]       = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [period, setPeriod]         = useState(months[0]);
  const [payTarget, setPayTarget]   = useState<any>(null);
  const [momoRef, setMomoRef]       = useState("");
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");

  const [busyId, setBusyId]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.getAllAgents(tab || undefined),
      adminApi.getAgentStats(),
    ]).then(([agentsRes, statsRes]) => {
      setData(agentsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const loadPayouts = () => {
    setPayLoading(true);
    adminApi.getPayouts()
      .then(res => setPayouts(res.data))
      .catch((e: any) => setMsg(errMsg(e, "Could not load payouts.")))
      .finally(() => setPayLoading(false));
  };

  useEffect(() => { if (view === "applications") load(); }, [tab, view]);
  useEffect(() => { if (view === "payouts") loadPayouts(); }, [view]);

  const approve = async (agentId: string) => {
    setBusyId(agentId);
    try {
      await adminApi.reviewAgent(agentId, "approved");
      setMsg("Agent approved successfully.");
      load();
    } catch (e: any) { setMsg(errMsg(e, "Failed to approve agent.")); }
    finally { setBusyId(null); }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await adminApi.reviewAgent(rejecting.id, "rejected", reason.trim() || undefined);
      setMsg("Agent application rejected.");
      setRejecting(null);
      setReason("");
      load();
    } catch (e: any) { setMsg(errMsg(e, "Failed to reject agent.")); }
    finally { setBusyId(null); }
  };

  const suspend = async (agentId: string) => {
    if (!window.confirm("Suspend this agent? They will lose access to the agent dashboard.")) return;
    setBusyId(agentId);
    try {
      await adminApi.reviewAgent(agentId, "suspended");
      setMsg("Agent suspended.");
      load();
    } catch (e: any) { setMsg(errMsg(e, "Failed to suspend agent.")); }
    finally { setBusyId(null); }
  };

  const calculate = async () => {
    if (!window.confirm(`Calculate payouts for ${period}? Balances under 1,000 RWF carry forward to the next month.`)) return;
    setBusyId("calc");
    try {
      const res = await adminApi.calculatePayouts(period);
      setMsg(typeof res.data === "string" ? res.data : "Payouts calculated.");
      loadPayouts();
    } catch (e: any) { setMsg(errMsg(e, "Could not calculate payouts.")); }
    finally { setBusyId(null); }
  };

  const confirmPaid = async () => {
    if (!payTarget) return;
    if (momoRef.trim().length < 4) { setMsg("Enter the MoMo transaction reference (at least 4 characters)."); return; }
    setBusyId(payTarget.id);
    try {
      await adminApi.markPayoutPaid(payTarget.id, momoRef.trim());
      setMsg("Payout marked as paid.");
      setPayTarget(null);
      setMomoRef("");
      loadPayouts();
    } catch (e: any) { setMsg(errMsg(e, "Could not mark payout as paid.")); }
    finally { setBusyId(null); }
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    if (voidReason.trim().length < 3) { setMsg("Give a reason for voiding this payout."); return; }
    setBusyId(voidTarget.id);
    try {
      await adminApi.voidPayout(voidTarget.id, voidReason.trim());
      setMsg("Payout voided. Its commissions are available for the next calculation.");
      setVoidTarget(null);
      setVoidReason("");
      loadPayouts();
    } catch (e: any) { setMsg(errMsg(e, "Could not void payout.")); }
    finally { setBusyId(null); }
  };

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  const statusLabel = (status: string) => ({
    pending_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
  }[status] ?? status);

  const toPay = payouts.filter(p => p.status === "calculated");
  const toPayTotal = toPay.reduce((s, p) => s + (p.totalRwf || 0), 0);
  const paidTotal = payouts.filter(p => p.status === "paid").reduce((s, p) => s + (p.totalRwf || 0), 0);

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px", borderRadius: 22, fontSize: 13, fontWeight: 800, cursor: "pointer",
    border: active ? "none" : "1px solid #E5E7EB",
    background: active ? NAVY : "#fff",
    color: active ? "#fff" : "#6B7280",
  });

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0 }}>Agents</h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Review applications, manage agents and pay commissions</p>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ background: NAVY, color: "#fff", padding: "12px 18px", borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* View switch */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <button onClick={() => setView("applications")} style={pill(view === "applications")}>Applications</button>
        <button onClick={() => setView("payouts")} style={pill(view === "payouts")}>
          Payouts{toPay.length > 0 ? ` (${toPay.length} to pay)` : ""}
        </button>
      </div>

      {/* ============================ APPLICATIONS ============================ */}
      {view === "applications" && (
        <>
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total Agents", value: stats.totalAgents, color: NAVY },
                { label: "Pending Review", value: stats.pendingReview, color: GOLD },
                { label: "Approved", value: stats.approved, color: TEAL },
                { label: "Suspended", value: stats.suspended, color: RED },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${c.color}` }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: GRAY, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: tab === t.key ? "none" : "1px solid #E5E7EB",
                  background: tab === t.key ? NAVY : "#fff",
                  color: tab === t.key ? "#fff" : "#6B7280",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> :
           data.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: GRAY, fontSize: 16 }}>No agents in this category.</p>
            </div>
           ) : (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Agent", "Phone", "Location", "Status", "Active Subs", "Total Paid", "Applied", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((a, i) => {
                    const sc = STATUS_COLORS[a.status] ?? { bg: "#F3F4F6", fg: "#6B7280" };
                    return (
                      <tr key={a.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <button onClick={() => setDetail(a)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
                            {a.photoUrl ? (<img src={a.photoUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "1px solid #E5E7EB" }} />) : (<div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EEF1F8", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{(a.fullName || "?").charAt(0).toUpperCase()}</div>)}
                            <div>
                            <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{a.fullName}</div>
                            <div style={{ fontSize: 11, color: GRAY }}>{a.agentCode || "No code yet"}</div>
                          </div>
                          </button>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{a.phone}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{[a.district, a.province].filter(Boolean).join(", ") || "-"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: sc.bg, color: sc.fg, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            {statusLabel(a.status)}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: TEAL }}>{a.activeSubscribers ?? 0}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>{(a.totalEarnedRwf ?? 0).toLocaleString()} RWF</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: GRAY }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {a.status === "pending_review" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => approve(a.id)}
                                disabled={busyId === a.id}
                                style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === a.id ? 0.6 : 1 }}
                              >Approve</button>
                              <button
                                onClick={() => { setRejecting(a); setReason(""); }}
                                disabled={busyId === a.id}
                                style={{ background: "#fff", color: RED, border: `1px solid ${RED}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === a.id ? 0.6 : 1 }}
                              >Reject</button>
                            </div>
                          )}
                          {a.status === "approved" && (
                            <button
                              onClick={() => suspend(a.id)}
                              disabled={busyId === a.id}
                              style={{ background: "#fff", color: GRAY, border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === a.id ? 0.6 : 1 }}
                            >Suspend</button>
                          )}
                          {a.status === "suspended" && (
                            <button
                              onClick={() => approve(a.id)}
                              disabled={busyId === a.id}
                              style={{ background: "#fff", color: TEAL, border: `1px solid ${TEAL}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === a.id ? 0.6 : 1 }}
                            >Reinstate</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
           )}
        </>
      )}

      {/* ============================== PAYOUTS ============================== */}
      {view === "payouts" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "To pay now", value: `${toPayTotal.toLocaleString()} RWF`, color: GOLD },
              { label: "Payouts waiting", value: toPay.length, color: NAVY },
              { label: "Paid so far", value: `${paidTotal.toLocaleString()} RWF`, color: TEAL },
            ].map((c, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${c.color}` }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 12, color: GRAY, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Calculate */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Calculate payouts</div>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 14, lineHeight: 1.5 }}>
              Only closed months can be paid. Each agent gets one payout covering all their unpaid commission up to that month.
              Balances under 1,000 RWF carry forward. Pay each agent by MoMo first, then enter the MoMo reference below.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, fontWeight: 600, color: NAVY, background: "#fff" }}
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                onClick={calculate}
                disabled={busyId === "calc"}
                style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: busyId === "calc" ? 0.6 : 1 }}
              >
                {busyId === "calc" ? "Calculating..." : `Calculate for ${period}`}
              </button>
            </div>
          </div>

          {payLoading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> :
           payouts.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: GRAY, fontSize: 16 }}>No payouts yet.</p>
            </div>
           ) : (
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Agent", "Month", "Amount", "Send to (MoMo)", "Status", "Paid", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, i) => {
                    const pc = PAYOUT_COLORS[p.status] ?? { bg: "#F3F4F6", fg: "#6B7280", label: p.status };
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{p.agentName}</div>
                          {p.agentStatus === "suspended" && (
                            <div style={{ fontSize: 11, color: RED, fontWeight: 700 }}>Suspended agent</div>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 600 }}>{p.period}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 800, color: NAVY }}>{(p.totalRwf ?? 0).toLocaleString()} RWF</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>
                          <div style={{ fontWeight: 700 }}>{p.momoNumber || "-"}</div>
                          <div style={{ textTransform: "uppercase", fontSize: 10 }}>{p.momoProvider}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: pc.bg, color: pc.fg, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pc.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: GRAY }}>
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                          {p.momoRef && <div style={{ fontSize: 10 }}>ref {p.momoRef}</div>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {p.status === "calculated" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => { setPayTarget(p); setMomoRef(""); }}
                                disabled={busyId === p.id}
                                style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === p.id ? 0.6 : 1 }}
                              >Mark paid</button>
                              <button
                                onClick={() => { setVoidTarget(p); setVoidReason(""); }}
                                disabled={busyId === p.id}
                                style={{ background: "#fff", color: RED, border: `1px solid ${RED}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === p.id ? 0.6 : 1 }}
                              >Void</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
           )}
        </>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setDetail(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: NAVY }}>{detail.fullName}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: GRAY }}>{detail.agentCode || "No agent code assigned yet"}</p>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: GRAY }}>&times;</button>
            </div>
            {detail.photoUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, padding: 12, background: "#F9FAFB", borderRadius: 12 }}>
                <a href={detail.photoUrl} target="_blank" rel="noreferrer" title="Open full size">
                  <img src={detail.photoUrl} alt={detail.fullName} style={{ width: 96, height: 120, objectFit: "cover", borderRadius: 10, border: "2px solid " + GOLD, background: "#fff", display: "block" }} />
                </a>
                <div style={{ fontSize: 12, color: GRAY, lineHeight: 1.6 }}>
                  <div style={{ color: NAVY, fontWeight: 800, fontSize: 13 }}>Passport photo</div>
                  Check: white background, face clear, no hat or glasses glare.
                  <div><a href={detail.photoUrl} target="_blank" rel="noreferrer" style={{ color: TEAL, fontWeight: 700 }}>Open full size</a></div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 18, padding: 12, background: "#FFFBEB", color: "#D97706", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                No passport photo on this application (submitted before photos were required).
              </div>
            )}
            {[
              ["Phone", detail.phone],
              ["Email", detail.email || "Not provided"],
              ["National ID", detail.nationalId || "Not provided"],
              ["Location", [detail.cell, detail.sector, detail.district, detail.province].filter(Boolean).join(", ") || "-"],
              ["Contact Range", detail.contactRange || "-"],
              ["MoMo Number", detail.momoNumber || "-"],
              ["MoMo Provider", detail.momoProvider || "-"],
              ["Active Subscribers", detail.activeSubscribers ?? 0],
              ["Total Paid Out", `${(detail.totalEarnedRwf ?? 0).toLocaleString()} RWF`],
              ["Applied", detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "-"],
              ["Approved At", detail.approvedAt ? new Date(detail.approvedAt).toLocaleString() : "-"],
              ["Rejected Reason", detail.rejectedReason || "-"],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                <span style={{ color: GRAY, fontWeight: 600 }}>{label}</span>
                <span style={{ color: NAVY, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
            {detail.motivation && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: GRAY, fontWeight: 700, marginBottom: 6 }}>MOTIVATION</div>
                <div style={{ fontSize: 13, color: "#374151", background: "#F9FAFB", borderRadius: 10, padding: 12, lineHeight: 1.5 }}>{detail.motivation}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setRejecting(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: NAVY }}>Reject Application</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: GRAY }}>Rejecting {rejecting.fullName}'s agent application. This reason will be visible to them.</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={4}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setRejecting(null)} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmReject} disabled={busyId === rejecting.id} style={{ background: RED, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: busyId === rejecting.id ? 0.6 : 1 }}>
                {busyId === rejecting.id ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark paid modal */}
      {payTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setPayTarget(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: NAVY }}>Mark payout as paid</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: GRAY, lineHeight: 1.5 }}>
              Send <b style={{ color: NAVY }}>{(payTarget.totalRwf ?? 0).toLocaleString()} RWF</b> to{" "}
              <b style={{ color: NAVY }}>{payTarget.momoNumber}</b> ({String(payTarget.momoProvider || "").toUpperCase()}) for {payTarget.agentName},{" "}
              month {payTarget.period}. Do the MoMo transfer first, then enter its transaction reference.
            </p>
            <input
              value={momoRef}
              onChange={e => setMomoRef(e.target.value)}
              placeholder="MoMo transaction reference"
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setPayTarget(null)} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmPaid} disabled={busyId === payTarget.id} style={{ background: TEAL, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: busyId === payTarget.id ? 0.6 : 1 }}>
                {busyId === payTarget.id ? "Saving..." : "Confirm paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void modal */}
      {voidTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setVoidTarget(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: NAVY }}>Void payout</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: GRAY, lineHeight: 1.5 }}>
              Voiding {voidTarget.agentName}'s payout for {voidTarget.period} ({(voidTarget.totalRwf ?? 0).toLocaleString()} RWF) releases its commissions so they can be calculated again.
              This is recorded in the audit log.
            </p>
            <textarea
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              placeholder="Reason (required)"
              rows={3}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setVoidTarget(null)} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmVoid} disabled={busyId === voidTarget.id} style={{ background: RED, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: busyId === voidTarget.id ? 0.6 : 1 }}>
                {busyId === voidTarget.id ? "Voiding..." : "Void payout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
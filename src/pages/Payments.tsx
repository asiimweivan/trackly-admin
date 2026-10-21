import React, { useEffect, useMemo, useState } from "react";
import { planLabel } from "../utils/plans";
import { Wallet, ReceiptText, Building2, Gift } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

const SOURCE: Record<string, { label: string; bg: string; fg: string }> = {
  online:   { label: "Mobile money",  bg: "#ECFDF5", fg: "#059669" },
  manual:   { label: "Manual (ref)",  bg: "#FEF3C7", fg: "#B45309" },
  backfill: { label: "Backfilled",    bg: "#EFF6FF", fg: NAVY },
};

const th: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 13 };
const box: React.CSSProperties = { background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 24 };

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getPayments().then(r => r.data).catch(() => []),
      adminApi.getSubscriptions().then(r => r.data).catch(() => []),
    ]).then(([p, s]) => { setPayments(p); setSubscriptions(s); setLoading(false); });
  }, []);

  const { thisMonth, allTime, payingIds } = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    let m = 0, a = 0; const ids = new Set<string>();
    payments.forEach(p => {
      a += p.amountRwf || 0; ids.add(p.businessId);
      if (new Date(p.paidAt) >= start) m += p.amountRwf || 0;
    });
    return { thisMonth: m, allTime: a, payingIds: ids };
  }, [payments]);

  const granted = useMemo(() => subscriptions.filter(s =>
    s.planKey && s.planKey !== "none" && s.planKey !== "ubuntu" &&
    (s.status === "active" || s.status === "trialing") && !payingIds.has(s.businessId)), [subscriptions, payingIds]);

  const cards = [
    { label: "Revenue this month", value: `${thisMonth.toLocaleString()} RWF`, icon: <Wallet size={22} color={TEAL} />, color: TEAL },
    { label: "Revenue all time", value: `${allTime.toLocaleString()} RWF`, icon: <ReceiptText size={22} color={NAVY} />, color: NAVY },
    { label: "Paying businesses", value: payingIds.size, icon: <Building2 size={22} color={GOLD} />, color: GOLD },
    { label: "Plans without payment", value: granted.length, icon: <Gift size={22} color="#8B5CF6" />, color: "#8B5CF6" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Wallet size={22} color={NAVY} /> Payments
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Only money that was really confirmed. Plans an admin granted are never counted as revenue.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: GRAY, fontWeight: 700, marginTop: 10 }}>{c.label.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={box}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>Confirmed payments</h3>
          <span style={{ fontSize: 12, color: GRAY }}>{payments.length} payment{payments.length === 1 ? "" : "s"}</span>
        </div>
        {loading ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>Loading...</p> : payments.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No confirmed payments yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#F9FAFB" }}>
                {["Date", "Business", "Plan", "Billing", "Amount", "Source", "Reference"].map(h => <th key={h} style={th}>{h.toUpperCase()}</th>)}
              </tr></thead>
              <tbody>
                {payments.map(p => {
                  const src = SOURCE[p.source] || { label: p.source, bg: "#F3F4F6", fg: "#4B5563" };
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td style={{ ...td, color: "#6B7280", fontSize: 12 }}>{(p.paidAt || "").replace("T", " ").slice(0, 16)}</td>
                      <td style={{ ...td, fontWeight: 700, color: NAVY }}>{p.businessName}</td>
                      <td style={td}><span style={{ background: "#EFF6FF", color: NAVY, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{planLabel(p.planKey).toUpperCase()}</span></td>
                      <td style={{ ...td, color: "#6B7280", fontSize: 12 }}>{p.billingCycle}</td>
                      <td style={{ ...td, fontWeight: 800, color: TEAL }}>{(p.amountRwf || 0).toLocaleString()} RWF</td>
                      <td style={td}><span style={{ background: src.bg, color: src.fg, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{src.label}</span></td>
                      <td style={{ ...td, color: GRAY, fontSize: 11 }}>{p.reference || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={box}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>Paid plans with no payment</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: GRAY }}>Granted by an admin or on a trial. These are not counted as revenue.</p>
        </div>
        {granted.length === 0 ? <p style={{ textAlign: "center", padding: 30, color: GRAY }}>None.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#F9FAFB" }}>
              {["Business", "Plan", "Status", "Period end"].map(h => <th key={h} style={th}>{h.toUpperCase()}</th>)}
            </tr></thead>
            <tbody>
              {granted.map(s => (
                <tr key={s.businessId} style={{ borderTop: "1px solid #F3F4F6" }}>
                  <td style={{ ...td, fontWeight: 700, color: NAVY }}>{s.businessName}</td>
                  <td style={td}><span style={{ background: "#F5F3FF", color: "#7C3AED", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{planLabel(s.planKey).toUpperCase()}</span></td>
                  <td style={{ ...td, color: "#6B7280", fontSize: 12 }}>{s.status}</td>
                  <td style={{ ...td, color: GRAY, fontSize: 11 }}>{s.currentPeriodEnd?.split("T")[0] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

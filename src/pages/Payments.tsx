import React, { useEffect, useState } from "react";
import { Wallet, CheckCircle2, Hourglass } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

export default function Payments() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSubscriptions().then(r => { setSubscriptions(r.data); setLoading(false); });
  }, []);

  const paid = subscriptions.filter(s => s.planKey !== "none");
  const totalRevenue = paid.filter(s => s.status === "active").reduce((sum, s) => sum + (s.priceRwf || 0), 0);
  const activeCount = paid.filter(s => s.status === "active").length;
  const trialCount = paid.filter(s => s.status === "trialing").length;

  const cards = [
    { label: "Total MRR", value: `${totalRevenue.toLocaleString()} RWF`, icon: <Wallet size={22} color={TEAL} />, color: TEAL },
    { label: "Active Paying", value: activeCount, icon: <CheckCircle2 size={22} color={NAVY} />, color: NAVY },
    { label: "On Trial", value: trialCount, icon: <Hourglass size={22} color={GOLD} />, color: GOLD },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Wallet size={22} color={NAVY} /> Payments
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Subscription payment overview and reconciliation</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: GRAY, fontWeight: 700, marginTop: 10 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>Subscription Payment Records</h3>
          <span style={{ fontSize: 12, color: GRAY }}>{paid.length} paid records</span>
        </div>
        {loading ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>Loading...</p> : paid.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No paid subscriptions yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Business", "Plan", "Amount", "Status", "Billing", "Period End"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paid.map((s, i) => (
                <tr key={s.businessId} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: NAVY, fontSize: 13 }}>{s.businessName}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#EFF6FF", color: NAVY, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.planKey?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: TEAL, fontSize: 13 }}>{s.priceRwf?.toLocaleString()} RWF</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: s.status === "active" ? "#ECFDF5" : s.status === "trialing" ? "#FFF7ED" : "#FEF2F2", color: s.status === "active" ? "#059669" : s.status === "trialing" ? "#D97706" : "#EF4444", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{s.billingCycle}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: GRAY }}>{s.currentPeriodEnd?.split("T")[0] || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

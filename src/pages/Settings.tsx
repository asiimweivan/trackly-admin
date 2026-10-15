import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Shield, CheckCircle2, Clock, Save } from "lucide-react";
import { adminApi } from "../api/admin";
import { planLabel } from "../utils/plans";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

const PLAN_COLORS: any = { ibanze: TEAL, iterambere: NAVY, inkunga: GOLD };

export default function Settings() {
  const [plans, setPlans]   = useState<any[]>([]);
  const [edits, setEdits]   = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getPlans().then(r => {
      setPlans(r.data);
      const e: Record<string, any> = {};
      r.data.forEach((p: any) => {
        e[p.key] = {
          originalPriceMonthly: p.originalPriceMonthly,
          priceMonthly: p.priceMonthly,
          originalPriceYearly: p.originalPriceYearly,
          priceYearly: p.priceYearly,
          savingYearly: p.savingYearly,
          discountLabel: p.discountLabel || "",
          commissionPercent: p.commissionPercent,
          isActive: true,
        };
      });
      setEdits(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const setField = (key: string, field: string, value: any) => {
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const savePlan = async (key: string, planName: string) => {
    setSavingKey(key);
    try {
      const e = edits[key];
      await adminApi.updatePlan(key, {
        originalPriceMonthly: Number(e.originalPriceMonthly),
        priceMonthly: Number(e.priceMonthly),
        originalPriceYearly: Number(e.originalPriceYearly),
        priceYearly: Number(e.priceYearly),
        savingYearly: Number(e.savingYearly),
        discountLabel: e.discountLabel || "",
        commissionPercent: Number(e.commissionPercent),
        isActive: true,
      });
      setMsg(`${planName} plan updated successfully.`);
      load();
    } catch { setMsg(`Failed to update ${planName} plan.`); }
    finally { setSavingKey(null); }
  };

  const securityItems = [
    { label: "JWT Authentication", status: "Active", ok: true },
    { label: "ADMIN Role Required", status: "Enforced", ok: true },
    { label: "HTTPS", status: "Active (via Render)", ok: true },
    { label: "Audit Logging", status: "Active", ok: true },
  ];

  if (loading) return <p style={{ textAlign: "center", color: GRAY, padding: 60 }}>Loading settings...</p>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <SettingsIcon size={22} color={NAVY} /> Platform Settings
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Manage plan prices, discounts and agent commission rates -- changes apply instantly, platform-wide</p>
      </div>

      {msg && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: msg.includes("Failed") ? "#FEF2F2" : "#ECFDF5", color: msg.includes("Failed") ? "#EF4444" : "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 700, fontSize: 13 }}>
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 }}>
        {plans.map(p => {
          const e = edits[p.key] || {};
          const color = PLAN_COLORS[p.key] || NAVY;
          return (
            <div key={p.key} style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: `4px solid ${color}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: NAVY, margin: "0 0 4px" }}>{planLabel(p.key)}</h3>
              <p style={{ fontSize: 11, color: GRAY, margin: "0 0 18px" }}>Plan key: {p.key}</p>

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>MONTHLY PRICE (RWF)</label>
              <input type="number" value={e.priceMonthly ?? 0} onChange={ev => setField(p.key, "priceMonthly", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>ORIGINAL MONTHLY (for discount display)</label>
              <input type="number" value={e.originalPriceMonthly ?? 0} onChange={ev => setField(p.key, "originalPriceMonthly", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>YEARLY PRICE (RWF)</label>
              <input type="number" value={e.priceYearly ?? 0} onChange={ev => setField(p.key, "priceYearly", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>ORIGINAL YEARLY (for discount display)</label>
              <input type="number" value={e.originalPriceYearly ?? 0} onChange={ev => setField(p.key, "originalPriceYearly", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>YEARLY SAVINGS (RWF)</label>
              <input type="number" value={e.savingYearly ?? 0} onChange={ev => setField(p.key, "savingYearly", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>DISCOUNT LABEL (optional, e.g. "Launch Offer")</label>
              <input type="text" value={e.discountLabel ?? ""} onChange={ev => setField(p.key, "discountLabel", ev.target.value)} placeholder="Leave blank for no discount badge"
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>AGENT COMMISSION (%)</label>
              <input type="number" step="0.1" value={e.commissionPercent ?? 0} onChange={ev => setField(p.key, "commissionPercent", ev.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, marginBottom: 18, outline: "none", boxSizing: "border-box" }} />
              <p style={{ fontSize: 11, color: GRAY, margin: "-12px 0 16px" }}>Percentage of monthly price paid to the referring agent, capped at the client's first 6 months.</p>

              <button onClick={() => savePlan(p.key, planLabel(p.key))} disabled={savingKey === p.key}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, background: color, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: savingKey === p.key ? 0.6 : 1 }}>
                <Save size={15} /> {savingKey === p.key ? "Saving..." : `Save ${planLabel(p.key)}`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={18} color={NAVY} /> Security
        </h3>
        {securityItems.map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 13, color: "#374151" }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.ok ? "#059669" : "#D97706", display: "flex", alignItems: "center", gap: 5 }}>
              {s.ok ? <CheckCircle2 size={13} /> : <Clock size={13} />} {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

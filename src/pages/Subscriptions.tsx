import React, { useEffect, useState } from "react";
import { planLabel, effectivePlan } from "../utils/plans";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

export default function Subscriptions() {
  const [data, setData]     = useState<any[]>([]);
  const [plans, setPlans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState<any>(null);
  const [form, setForm]     = useState({ planKey: "ibanze", billingCycle: "monthly" });
  const [msg, setMsg]       = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.getSubscriptions(), adminApi.getPlans()])
      .then(([subsRes, plansRes]) => {
        setData(subsRes.data);
        setPlans(plansRes.data);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const openEdit = (s: any) => {
    setModal(s);
    setForm({ planKey: s.planKey !== "none" ? s.planKey : "ibanze", billingCycle: s.billingCycle || "monthly" });
  };

  const activate = async () => {
    setSaving(true);
    try {
      // MOVE_TO_UBUNTU: Ubuntu is the free plan, so moving there ends the paid subscription
      if (form.planKey === "ubuntu") {
        if (modal.planKey !== "none" && modal.status !== "cancelled") await adminApi.cancelSubscription(modal.businessId);
        setMsg(`${modal.businessName} moved to the free Ubuntu plan.`);
      } else {
        await adminApi.activateSubscription({ businessId: modal.businessId, planKey: form.planKey, billingCycle: form.billingCycle });
        setMsg(`Subscription updated for ${modal.businessName}.`);
      }
      setModal(null);
      load();
    } catch { setMsg("Failed to update subscription."); }
    finally { setSaving(false); }
  };

  const cancel = async (businessId: string, businessName: string) => {
    if (!window.confirm(`Move ${businessName} to the free Ubuntu plan? Their paid plan ends now.`)) return;
    try {
      await adminApi.cancelSubscription(businessId);
      setMsg(`${businessName} moved to the free Ubuntu plan.`);
      load();
    } catch { setMsg("Failed to cancel subscription."); }
  };

  const planPrice = (key: string, cycle: string) => {
    const p = plans.find(pl => pl.key === key);
    if (!p) return 0;
    return cycle === "yearly" ? p.priceYearly : p.priceMonthly;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0 }}>Subscriptions</h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>{data.length} businesses total</p>
      </div>

      {msg && <div style={{ background: NAVY, color: "#fff", padding: "12px 18px", borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Business", "Phone", "Plan", "Status", "Billing", "Price", "Period End", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((s, i) => {
                const hasPlan = effectivePlan(s.planKey, s.status) !== "ubuntu";
                return (
                  <tr key={s.businessId} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: NAVY, fontSize: 13 }}>{s.businessName}</td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{s.ownerPhone}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: hasPlan ? "#EFF6FF" : "#F3F4F6", color: hasPlan ? NAVY : GRAY, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {hasPlan ? planLabel(s.planKey).toUpperCase() : "UBUNTU (FREE)"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        background: s.status === "active" ? "#ECFDF5" : s.status === "trialing" ? "#FFF7ED" : s.status === "none" ? "#F3F4F6" : "#FEF2F2",
                        color: s.status === "active" ? "#059669" : s.status === "trialing" ? "#D97706" : s.status === "none" ? GRAY : "#EF4444",
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700
                      }}>
                        {hasPlan ? s.status : "-"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#374151" }}>{hasPlan ? s.billingCycle : "-"}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>{hasPlan ? `${s.priceRwf?.toLocaleString()} RWF` : "-"}</td>
                    <td style={{ padding: "14px 16px", fontSize: 11, color: GRAY }}>{hasPlan && s.currentPeriodEnd ? s.currentPeriodEnd.split("T")[0] : "-"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(s)} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          {hasPlan ? "Change Plan" : "Set Plan"}
                        </button>
                        {hasPlan && (
                          <button onClick={() => cancel(s.businessId, s.businessName)} style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Move to Ubuntu</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: "0 0 8px" }}>{modal.planKey === "none" ? "Set Plan" : "Change Plan"}</h2>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 24px" }}>{modal.businessName}</p>

            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>PLAN</label>
            <select value={form.planKey} onChange={e => setForm({ ...form, planKey: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, outline: "none" }}>
              {!plans.some((p: any) => p.key === "ubuntu") && <option value="ubuntu">Ubuntu (Free) - move to the free plan</option>}
              {plans.map(p => (
                <option key={p.key} value={p.key}>
                  {planLabel(p.key)} - {p.priceMonthly.toLocaleString()} RWF/mo
                </option>
              ))}
            </select>

            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>BILLING CYCLE</label>
            <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 8, outline: "none" }}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <p style={{ fontSize: 12, color: GRAY, margin: "0 0 24px" }}>
              Price: {planPrice(form.planKey, form.billingCycle).toLocaleString()} RWF / {form.billingCycle === "yearly" ? "year" : "month"}
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={activate} disabled={saving} style={{ flex: 1, padding: 14, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Activate"}
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 14, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

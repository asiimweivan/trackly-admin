import React, { useEffect, useState } from "react";
import { planLabel } from "../utils/plans";
import { Store, Search, BadgeCheck, Info } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";
const BLUE = "#1D9BF0";

const PLAN_COLORS: any = { ibanze: TEAL, iterambere: NAVY, inkunga: GOLD, none: GRAY };

export default function Businesses() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getBusinesses().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const toggleVerified = async (b: any) => {
    if (!b.isVerified && !b.eligibleForVerification) {
      setMsg(`Cannot verify ${b.name}: ${b.verificationBlockers}`);
      return;
    }
    setBusyId(b.id);
    try {
      await adminApi.verifyBusiness(b.id, !b.isVerified);
      setMsg(`${b.name} ${!b.isVerified ? "verified" : "unverified"} successfully.`);
      load();
    } catch { setMsg(`Failed to update verification for ${b.name}.`); }
    finally { setBusyId(null); }
  };

  const filtered = data.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerPhone.includes(search) ||
    b.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Store size={24} color={NAVY} /> Businesses
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>{data.length} registered businesses</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color={GRAY} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, owner or phone..."
            style={{ padding: "10px 16px 10px 38px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, width: 300, outline: "none" }} />
        </div>
      </div>

      {msg && <div style={{ background: msg.includes("Cannot") || msg.includes("Failed") ? "#FEF2F2" : "#ECFDF5", color: msg.includes("Cannot") || msg.includes("Failed") ? "#EF4444" : "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 700, fontSize: 13 }}>{msg}</div>}

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Business", "Owner", "Location", "Plan", "Status", "Days Left", "Revenue", "Sales", "Verified", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{b.name}</div>
                      {b.isVerified && <BadgeCheck size={15} color={BLUE} />}
                    </div>
                    <div style={{ fontSize: 11, color: GRAY }}>{b.category}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "#374151" }}>{b.ownerName}</div>
                    <div style={{ fontSize: 11, color: GRAY }}>{b.ownerPhone}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{b.district}, {b.province}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: PLAN_COLORS[b.planKey] + "20", color: PLAN_COLORS[b.planKey], padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {planLabel(b.planKey).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: b.subscriptionStatus === "active" ? "#ECFDF5" : b.subscriptionStatus === "none" ? "#F3F4F6" : "#FEF2F2", color: b.subscriptionStatus === "active" ? "#059669" : b.subscriptionStatus === "none" ? GRAY : "#EF4444", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {b.subscriptionStatus}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: b.daysRemaining <= 3 && b.daysRemaining > 0 ? "#EF4444" : "#374151", fontWeight: b.daysRemaining <= 3 && b.daysRemaining > 0 ? 700 : 400 }}>
                    {b.planKey !== "none" ? `${b.daysRemaining}d` : "-"}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>{b.totalRevenue?.toLocaleString()} RWF</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{b.totalSales}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => toggleVerified(b)}
                      disabled={busyId === b.id}
                      title={!b.isVerified && !b.eligibleForVerification ? b.verificationBlockers : ""}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: b.isVerified ? "#EFF6FF" : (b.eligibleForVerification ? "#ECFDF5" : "#F3F4F6"),
                        color: b.isVerified ? BLUE : (b.eligibleForVerification ? "#059669" : GRAY),
                        border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700,
                        cursor: busyId === b.id ? "default" : "pointer", opacity: busyId === b.id ? 0.6 : 1,
                      }}>
                      {b.isVerified ? <BadgeCheck size={13} /> : (b.eligibleForVerification ? <BadgeCheck size={13} /> : <Info size={13} />)}
                      {b.isVerified ? "Verified" : (b.eligibleForVerification ? "Verify" : "Not eligible")}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: GRAY }}>{b.createdAt?.split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No businesses found.</p>}
        </div>
      )}
    </div>
  );
}

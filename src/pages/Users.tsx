import React, { useEffect, useState } from "react";
import { Users as UsersIcon, Search, CheckCircle2, XCircle } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

export default function Users() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = async (userId: string, active: boolean) => {
    try {
      await adminApi.toggleUserStatus(userId, !active);
      setData(prev => prev.map(u => u.id === userId ? { ...u, isActive: !active } : u));
    } catch { alert("Failed to update user status."); }
  };

  const filtered = data.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    u.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <UsersIcon size={24} color={NAVY} /> Users
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>{data.length} registered users</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color={GRAY} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            style={{ padding: "10px 16px 10px 38px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, width: 280, outline: "none" }} />
        </div>
      </div>

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Name", "Phone", "Role", "Status", "Verified", "Last Login", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: NAVY, fontSize: 13 }}>{u.fullName}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{u.phone}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: u.role === "ADMIN" ? "#FEF3C7" : u.role === "BUSINESS_OWNER" ? "#EFF6FF" : "#F0FDF4", color: u.role === "ADMIN" ? "#D97706" : u.role === "BUSINESS_OWNER" ? NAVY : "#059669", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: u.isActive ? "#ECFDF5" : "#FEF2F2", color: u.isActive ? "#059669" : "#EF4444", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }} title={u.isVerified ? "Phone verified" : "Phone not verified"}>
                    {u.businessName ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {u.businessVerified ? <CheckCircle2 size={16} color="#1D9BF0" /> : <XCircle size={16} color="#EF4444" />}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{u.businessName}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: u.businessVerified ? "#059669" : GRAY }}>{u.businessVerified ? "Verified business" : "Not verified"}</div>
                        </div>
                      </div>
                    ) : <span style={{ color: GRAY, fontSize: 12 }}>&mdash;</span>}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: GRAY }}>{u.lastLoginAt?.split("T")[0] || "Never"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => toggle(u.id, u.isActive)}
                      style={{ background: u.isActive ? "#FEF2F2" : "#ECFDF5", color: u.isActive ? "#EF4444" : "#059669", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      {u.isActive ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

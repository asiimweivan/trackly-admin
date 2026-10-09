import React, { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import client from "../api/client";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

const ACTION_COLORS: any = {
  "subscription_activated": "#059669",
  "subscription_cancelled": "#EF4444",
  "user_suspended": "#EF4444",
  "user_activated": "#059669",
  "notification_sent": "#3B82F6",
  "plan_changed": "#D97706",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    client.get("/admin/audit-logs")
      .then(r => { setLogs(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.adminPhone || "").includes(search) ||
    (l.details || "").toLowerCase().includes(search.toLowerCase())
  );

  const cards = [
    { label: "Total Actions", value: logs.length, color: NAVY },
    { label: "Today", value: logs.filter(l => l.createdAt?.startsWith(new Date().toISOString().split("T")[0])).length, color: TEAL },
    { label: "Admin Users", value: Array.from(new Set(logs.map(l => l.adminId))).length, color: "#8B5CF6" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={22} color={NAVY} /> Audit Logs
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>All admin actions recorded for security</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color={GRAY} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
            style={{ padding: "10px 16px 10px 38px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, width: 260, outline: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 11, color: GRAY, fontWeight: 700 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>Action History</h3>
          <span style={{ fontSize: 12, color: GRAY }}>{filtered.length} records</span>
        </div>
        {loading ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>Loading audit logs...</p> :
          filtered.length === 0 ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No audit logs yet. Actions will appear here.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Time", "Admin", "Action", "Target", "Details"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: GRAY, whiteSpace: "nowrap" }}>
                      {l.createdAt?.replace("T", " ").split(".")[0]}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: NAVY, fontWeight: 600 }}>{l.adminPhone || l.adminId?.substring(0, 8)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: (ACTION_COLORS[l.action] || "#6B7280") + "20", color: ACTION_COLORS[l.action] || "#6B7280", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {(l.action || "").replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#6B7280" }}>{l.targetType} {l.targetId?.substring(0, 8)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", maxWidth: 300 }}>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Bell, FileText, Lightbulb, CheckCircle2, XCircle, Send } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

const TEMPLATES = [
  { title: "Welcome to Trackly!", body: "Thank you for joining Trackly. Start recording your sales today!" },
  { title: "Subscription Expiring", body: "Your Trackly subscription expires soon. Renew now to keep your business running." },
  { title: "New Feature Available", body: "Trackly just got better! Check out our new features in the app." },
  { title: "Special Offer", body: "Upgrade to Iterambere this month and get 2 months free!" },
];

export default function Notifications() {
  const [form, setForm] = useState({ title: "", body: "", targetType: "all", targetValue: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getBusinesses().then(r => setBusinesses(r.data)).catch(() => {});
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      await adminApi.sendNotification(form);
      setMsg("success");
      setForm({ title: "", body: "", targetType: "all", targetValue: "" });
    } catch { setMsg("error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={24} color={NAVY} /> Push Notifications
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Send push notifications to businesses</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px" }}>Send Notification</h2>
          <form onSubmit={send}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>TITLE</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />

            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>MESSAGE</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Notification message..." rows={4}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none", resize: "vertical" }} />

            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>TARGET</label>
            <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value, targetValue: "" })}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, outline: "none" }}>
              <option value="all">All Users</option>
              <option value="plan">By Plan</option>
              <option value="business">Specific Business</option>
            </select>

            {form.targetType === "plan" && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>PLAN</label>
                <select value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, outline: "none" }}>
                  <option value="">-- Select Plan --</option>
                  <option value="ibanze">Ibanze</option>
                  <option value="iterambere">Iterambere</option>
                  <option value="inkunga">Agaciro</option>
                </select>
              </>
            )}

            {form.targetType === "business" && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>BUSINESS</label>
                <select value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, outline: "none" }}>
                  <option value="">-- Select Business --</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.ownerPhone}</option>
                  ))}
                </select>
              </>
            )}

            {msg === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#ECFDF5", color: "#059669", fontWeight: 700, fontSize: 13 }}>
                <CheckCircle2 size={16} /> Notification sent successfully!
              </div>
            )}
            {msg === "error" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#FEF2F2", color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
                <XCircle size={16} /> Failed to send notification.
              </div>
            )}

            <button type="submit" disabled={loading || !form.title || !form.body}
              style={{ width: "100%", padding: 14, background: loading || !form.title || !form.body ? GRAY : NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Send size={16} /> {loading ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color={NAVY} /> Templates
          </h2>
          {TEMPLATES.map((t, i) => (
            <div key={i} onClick={() => setForm({ ...form, title: t.title, body: t.body })}
              style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{t.body}</div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: "#F0FDF9", borderRadius: 10, border: "1px solid #A7F3D0", display: "flex", gap: 10 }}>
            <Lightbulb size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#059669", fontWeight: 700 }}>Tip</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#065F46" }}>Click a template to auto-fill the form. Then select your target and send!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

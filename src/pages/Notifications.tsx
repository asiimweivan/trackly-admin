import React, { useState, useEffect } from "react";
import { Bell, FileText, Lightbulb, CheckCircle2, XCircle, Send, Mail, AlertTriangle } from "lucide-react";
import { adminApi } from "../api/admin";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

type Channel = "push" | "email" | "both";

// Push messages appear in the phone's notification tray, so keep payment and plan wording for e-mail.
const TEMPLATES: { title: string; body: string; channel: Channel }[] = [
  { title: "Welcome to Trackly!", body: "Thank you for joining Trackly. Start recording your sales today!", channel: "push" },
  { title: "Subscription Expiring", body: "Your Trackly subscription expires soon. Renew now to keep your business running.", channel: "email" },
  { title: "New Feature Available", body: "Trackly just got better! Check out our new features in the app.", channel: "push" },
  { title: "Special Offer", body: "Upgrade to Iterambere this month and get 2 months free!", channel: "email" },
];

const PAYMENT_WORDS = /(pay|plan|upgrade|renew|subscri|price|rwf|momo|airtel|iterambere|agaciro|ibanze|inkunga)/i;

const CHANNELS: { value: Channel; label: string; hint: string }[] = [
  { value: "push", label: "Push notification only", hint: "Shows in the phone's notification tray." },
  { value: "email", label: "E-mail only", hint: "Sent to owners who gave an e-mail address (up to 250 per send)." },
  { value: "both", label: "Push and e-mail", hint: "Both. Keep the wording free of payment and plan words." },
];

export default function Notifications() {
  const [form, setForm] = useState<{ title: string; body: string; targetType: string; targetValue: string; channel: Channel }>(
    { title: "", body: "", targetType: "all", targetValue: "", channel: "push" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errText, setErrText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getBusinesses().then(r => setBusinesses(r.data)).catch(() => {});
  }, []);

  const needsTarget = (form.targetType === "plan" || form.targetType === "business") && !form.targetValue;
  const pushWarn = form.channel !== "email" && PAYMENT_WORDS.test(form.title + " " + form.body);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(""); setErrText(""); setResult(null);
    try {
      const res: any = await adminApi.sendNotification(form);
      setResult(res && res.data ? res.data : {});
      setMsg("success");
      setForm({ title: "", body: "", targetType: "all", targetValue: "", channel: form.channel });
    } catch (err: any) {
      const status = err && err.response ? err.response.status : 0;
      const serverMsg = err && err.response && err.response.data ? (err.response.data.message || err.response.data.error) : "";
      setErrText(status === 401 || status === 403
        ? "Your admin session has expired. Log out and log in again, then send."
        : (serverMsg || "Failed to send."));
      setMsg("error");
    }
    finally { setLoading(false); }
  };

  const doneLine = () => {
    if (!result) return "Sent successfully!";
    const parts: string[] = [];
    if (form.channel !== "email" || result.channel === "push" || result.channel === "both") {
      if (result.channel !== "email") parts.push("Push sent to " + (result.pushSent ?? 0) + " user(s)");
    }
    if (result.channel === "email" || result.channel === "both") {
      let t = "E-mail queued for " + (result.emailQueued ?? 0);
      if (result.noEmailAddress) t += " (" + result.noEmailAddress + " have no e-mail address)";
      if (result.skippedOverDailyLimit) t += " (" + result.skippedOverDailyLimit + " not sent: 250 per send)";
      parts.push(t);
    }
    return parts.length ? parts.join(". ") + "." : "Sent successfully!";
  };

  const label = { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 } as const;
  const field = { width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" } as const;
  const chInfo = CHANNELS.find(c => c.value === form.channel);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={24} color={NAVY} /> Messages
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Send push notifications or e-mails to businesses</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px" }}>Send Message</h2>
          <form onSubmit={send}>
            <label style={label}>TITLE</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title (e-mail subject)"
              style={field} />

            <label style={label}>MESSAGE</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Message..." rows={4}
              style={{ ...field, resize: "vertical" }} />

            <label style={label}>SEND AS</label>
            <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as Channel })}
              style={{ ...field, marginBottom: 6 }}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div style={{ fontSize: 12, color: GRAY, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={12} /> {chInfo ? chInfo.hint : ""}
            </div>

            <label style={label}>TARGET</label>
            <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value, targetValue: "" })}
              style={field}>
              <option value="all">All Users</option>
              <option value="plan">By Plan</option>
              <option value="business">Specific Business</option>
            </select>

            {form.targetType === "plan" && (
              <>
                <label style={label}>PLAN</label>
                <select value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} style={field}>
                  <option value="">-- Select Plan --</option>
                  <option value="ibanze">Ibanze</option>
                  <option value="iterambere">Iterambere</option>
                  <option value="inkunga">Agaciro</option>
                </select>
              </>
            )}

            {form.targetType === "business" && (
              <>
                <label style={label}>BUSINESS</label>
                <select value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} style={field}>
                  <option value="">-- Select Business --</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.ownerPhone}</option>
                  ))}
                </select>
              </>
            )}

            {pushWarn && (
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#FFFBEB", color: "#92400E", fontWeight: 600, fontSize: 12, lineHeight: 1.5 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>This message mentions plans or payment. Push messages show inside the app, so send this one by <b>E-mail only</b>, or rephrase it.</span>
              </div>
            )}

            {msg === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#ECFDF5", color: "#059669", fontWeight: 700, fontSize: 13 }}>
                <CheckCircle2 size={16} /> {doneLine()}
              </div>
            )}
            {msg === "error" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#FEF2F2", color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
                <XCircle size={16} /> {errText || "Failed to send."}
              </div>
            )}

            <button type="submit" disabled={loading || !form.title || !form.body || needsTarget}
              style={{ width: "100%", padding: 14, background: loading || !form.title || !form.body || needsTarget ? GRAY : NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Send size={16} /> {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color={NAVY} /> Templates
          </h2>
          {TEMPLATES.map((t, i) => (
            <div key={i} onClick={() => setForm({ ...form, title: t.title, body: t.body, channel: t.channel })}
              style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{t.title}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.channel === "email" ? "#92400E" : TEAL }}>{t.channel === "email" ? "E-mail" : "Push"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{t.body}</div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: "#F0FDF9", borderRadius: 10, border: "1px solid #A7F3D0", display: "flex", gap: 10 }}>
            <Lightbulb size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "#059669", fontWeight: 700 }}>Tip</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#065F46" }}>Click a template to fill the form and pick the right channel. Messages about plans or payment go by e-mail; push messages stay neutral.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { planLabel } from "../utils/plans";
import { Megaphone, Image as ImageIcon, Plus } from "lucide-react";
import client from "../api/client";
import BannerDisplaySettings from "../components/BannerDisplaySettings";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

const ICONS = ["megaphone-outline","rocket-outline","gift-outline","star-outline","alert-circle-outline","document-text-outline","sparkles-outline","trophy-outline","pricetag-outline","notifications-outline"];
const COLORS = ["#1B2A5A","#1DAA8A","#D4860A","#7C3AED","#EF4444","#3B82F6","#059669","#F59E0B"];
const PLANS = ["all","ibanze","iterambere","inkunga"];

const EMPTY = { title:"", subtitle:"", body:"", ctaLabel:"", ctaAction:"dashboard", bgColor:"#1B2A5A", textColor:"#FFFFFF", icon:"megaphone-outline", imageUrl:"", targetPlan:"all", priority:5, startsAt:"", endsAt:"" };

export default function Announcements() {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState<any>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState("");

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'trackly_announcements');
      const res = await fetch('https://api.cloudinary.com/v1_1/bfpfnyh5/image/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Cloudinary upload failed');
      const data = await res.json();
      setForm((prev: any) => ({ ...prev, imageUrl: data.secure_url }));
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const load = () => {
    client.get("/announcements/all").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const save = async () => {
    if (!form.title && !form.imageUrl) return;
    setSaving(true);
    try {
      await client.post("/announcements", form);
      setMsg("Announcement created successfully!");
      setModal(false);
      setForm(EMPTY);
      load();
    } catch { setMsg("Failed to create announcement."); }
    finally { setSaving(false); }
  };

  const toggle = async (id: string) => {
    await client.patch(`/announcements/${id}/toggle`);
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    await client.delete(`/announcements/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Megaphone size={22} color={NAVY} /> Announcements
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Manage news and promotions shown in the app</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {msg && <div style={{ background: "#ECFDF5", color: "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 700 }}>{msg}</div>}

      <BannerDisplaySettings slides={data.filter(a => a.isActive)} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 24 }}>
        {data.filter(a => a.isActive).slice(0, 4).map(a => (
          <div key={a.id} style={{ background: a.bgColor, borderRadius: 14, padding: 20, color: a.textColor || "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{a.targetPlan?.toUpperCase()} &middot; Priority {a.priority}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{a.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{a.subtitle}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.ctaLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: NAVY }}>All Announcements</h3>
          <span style={{ fontSize: 12, color: GRAY }}>{data.length} total</span>
        </div>
        {loading ? <p style={{ textAlign: "center", padding: 40, color: GRAY }}>Loading...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Title", "Target", "Priority", "Status", "CTA", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((a, i) => (
                <tr key={a.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: a.bgColor, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Megaphone size={16} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: GRAY }}>{a.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: "#EFF6FF", color: NAVY, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.targetPlan?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: NAVY }}>{a.priority}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: a.isActive ? "#ECFDF5" : "#F3F4F6", color: a.isActive ? "#059669" : GRAY, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{a.ctaLabel} &rarr; {a.ctaAction}</td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: 6 }}>
                    <button onClick={() => toggle(a.id)} style={{ background: a.isActive ? "#FEF2F2" : "#ECFDF5", color: a.isActive ? "#EF4444" : "#059669", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      {a.isActive ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => remove(a.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <Megaphone size={20} color={NAVY} /> New Announcement
            </h2>

            {[
              { label: "TITLE *", key: "title", placeholder: "e.g. Special Offer This Month!" },
              { label: "SUBTITLE", key: "subtitle", placeholder: "e.g. Save 20% on Iterambere plan" },
              { label: "BODY", key: "body", placeholder: "Full announcement text..." },
              { label: "CTA BUTTON LABEL", key: "ctaLabel", placeholder: "e.g. Upgrade Now" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                {f.key === "body" ? (
                  <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} rows={3}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", resize: "vertical" }} />
                ) : (
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                )}
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>BANNER IMAGE (optional)</label>
              <div style={{ border: "2px dashed #E5E7EB", borderRadius: 10, padding: 16, textAlign: "center", background: "#F9FAFB" }}>
                {form.imageUrl ? (
                  <div>
                    <img src={form.imageUrl} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                    <button onClick={() => setForm({ ...form, imageUrl: "" })} style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon size={28} color={GRAY} style={{ marginBottom: 8 }} />
                    <div>
                      <label style={{ background: NAVY, color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        {uploading ? "Uploading..." : "Upload Banner Image"}
                        <input type="file" accept="image/*" onChange={uploadImage} style={{ display: "none" }} disabled={uploading} />
                      </label>
                    </div>
                    <p style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>PNG, JPG up to 10MB - Recommended: 800x300px</p>
                    <div style={{ margin: "8px 0", color: GRAY, fontSize: 11 }}>or paste URL</div>
                    <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..."
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>CTA ACTION</label>
                <select value={form.ctaAction} onChange={e => setForm({ ...form, ctaAction: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }}>
                  {["dashboard", "subscription", "invoice-history", "stock-alerts", "reports", "inventory", "employees", "notifications"].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>TARGET PLAN</label>
                <select value={form.targetPlan} onChange={e => setForm({ ...form, targetPlan: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }}>
                  {PLANS.map(p => <option key={p} value={p}>{p === "all" ? "ALL" : planLabel(p).toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>BG COLOR</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm({ ...form, bgColor: c })}
                      style={{ width: 24, height: 24, background: c, borderRadius: 6, cursor: "pointer", border: form.bgColor === c ? "2px solid #000" : "2px solid transparent" }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>ICON</label>
                <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12, outline: "none" }}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>PRIORITY</label>
                <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            <div style={{ background: form.bgColor, borderRadius: 12, padding: 16, marginBottom: 20, color: form.textColor, ...(form.imageUrl ? { backgroundImage: `url(${form.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{form.title || "Your title here"}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{form.subtitle || "Your subtitle here"}</div>
              {form.ctaLabel && <div style={{ marginTop: 8, background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{form.ctaLabel}</div>}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={save} disabled={saving || (!form.title && !form.imageUrl)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                <Megaphone size={16} /> {saving ? "Saving..." : "Publish Announcement"}
              </button>
              <button onClick={() => { setModal(false); setForm(EMPTY); }}
                style={{ flex: 1, padding: 14, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

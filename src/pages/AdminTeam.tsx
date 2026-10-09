import React, { useEffect, useState } from "react";
import { ShieldCheck, Plus, Crown, Shield, Headphones } from "lucide-react";
import { adminApi } from "../api/admin";
import { useAuth } from "../context/AuthContext";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF";

const ROLE_META: any = {
  SUPER_ADMIN:   { label: "Super Admin",   color: GOLD, icon: Crown,      desc: "Full access to everything, including managing other staff" },
  ADMIN:         { label: "Admin",         color: NAVY, icon: Shield,     desc: "Full operational access -- cannot manage staff or pricing" },
  SUPPORT_ADMIN: { label: "Support Admin", color: TEAL, icon: Headphones, desc: "Support, Users and Businesses (view only), Notifications" },
};

const EMPTY_FORM = { fullName: "", phone: "", email: "", password: "", role: "SUPPORT_ADMIN" };

export default function AdminTeam() {
  const { isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getAllStaff().then(r => { setStaff(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const create = async () => {
    if (!form.fullName || !form.phone || !form.password) return;
    setSaving(true);
    try {
      await adminApi.createStaff(form);
      setMsg(`${form.fullName} added as ${ROLE_META[form.role].label}.`);
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) { setMsg(e?.response?.data?.message || "Failed to create staff account."); }
    finally { setSaving(false); }
  };

  const changeRole = async (userId: string, name: string, newRole: string) => {
    setBusyId(userId);
    try {
      await adminApi.updateStaffRole(userId, newRole);
      setMsg(`${name}'s role changed to ${ROLE_META[newRole].label}.`);
      load();
    } catch { setMsg(`Failed to update ${name}'s role.`); }
    finally { setBusyId(null); }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <ShieldCheck size={40} color={GRAY} style={{ marginBottom: 16 }} />
        <p style={{ color: GRAY, fontSize: 15 }}>Only Super Admins can manage the admin team.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={24} color={NAVY} /> Admin Team
          </h1>
          <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Manage admin and support staff accounts and their access levels</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: NAVY, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {msg && <div style={{ background: msg.includes("Failed") ? "#FEF2F2" : "#ECFDF5", color: msg.includes("Failed") ? "#EF4444" : "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 700, fontSize: 13 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {Object.entries(ROLE_META).map(([key, meta]: any) => {
          const Icon = meta.icon;
          return (
            <div key={key} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${meta.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon size={16} color={meta.color} />
                <span style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{meta.label}</span>
              </div>
              <p style={{ fontSize: 11, color: GRAY, margin: 0, lineHeight: 1.5 }}>{meta.desc}</p>
            </div>
          );
        })}
      </div>

      {loading ? <p style={{ textAlign: "center", color: GRAY }}>Loading...</p> : (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Name", "Phone", "Email", "Role", "Joined", "Change Role"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => {
                const meta = ROLE_META[s.role] ?? { label: s.role, color: GRAY, icon: Shield };
                const Icon = meta.icon;
                return (
                  <tr key={s.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: NAVY, fontSize: 13 }}>{s.fullName}</td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{s.phone}</td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>{s.email || "-"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: meta.color + "18", color: meta.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        <Icon size={12} /> {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 11, color: GRAY }}>{s.createdAt?.split("T")[0]}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={s.role}
                        disabled={busyId === s.id}
                        onChange={e => changeRole(s.id, s.fullName, e.target.value)}
                        style={{ padding: "6px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 12, outline: "none" }}>
                        {Object.entries(ROLE_META).map(([key, meta]: any) => (
                          <option key={key} value={key}>{meta.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {staff.length === 0 && <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No admin staff yet -- you're the only one.</p>}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModal(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: "0 0 20px" }}>Add Staff Member</h2>

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>FULL NAME</label>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Jane Uwase"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>PHONE (+250...)</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+250788123456"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>EMAIL</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@ivanexo.rw"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>TEMPORARY PASSWORD</label>
            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />

            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>ROLE</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 20, outline: "none" }}>
              {Object.entries(ROLE_META).map(([key, meta]: any) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={create} disabled={saving || !form.fullName || !form.phone || !form.password}
                style={{ flex: 1, padding: 14, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", opacity: (saving || !form.fullName || !form.phone || !form.password) ? 0.6 : 1 }}>
                {saving ? "Creating..." : "Create Account"}
              </button>
              <button onClick={() => { setModal(false); setForm(EMPTY_FORM); }}
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

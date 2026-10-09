import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, TrendingUp, Store, CreditCard, Users, Handshake,
  Wallet, Settings as SettingsIcon, ClipboardList, Bell, Megaphone, Headphones,
  ChevronLeft, ChevronRight, LogOut, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// roles: which tiers can see this item. Omit for "all admin tiers".
const NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { path: "/", label: "Dashboard", icon: BarChart3, roles: ["ADMIN", "SUPER_ADMIN"] },
      { path: "/analytics", label: "Analytics", icon: TrendingUp, roles: ["ADMIN", "SUPER_ADMIN"] },
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { path: "/businesses", label: "Businesses", icon: Store },
      { path: "/subscriptions", label: "Subscriptions", icon: CreditCard, roles: ["ADMIN", "SUPER_ADMIN"] },
      { path: "/users", label: "Users", icon: Users },
      { path: "/agents", label: "Agents", icon: Handshake, roles: ["ADMIN", "SUPER_ADMIN"] },
    ]
  },
  {
    title: "FINANCE",
    items: [
      { path: "/payments", label: "Payments", icon: Wallet, roles: ["ADMIN", "SUPER_ADMIN"] },
      { path: "/settings", label: "Settings", icon: SettingsIcon, roles: ["SUPER_ADMIN"] },
      { path: "/audit-logs", label: "Audit Logs", icon: ClipboardList, roles: ["ADMIN", "SUPER_ADMIN"] },
    ]
  },
  {
    title: "ENGAGE",
    items: [
      { path: "/notifications", label: "Notifications", icon: Bell },
      { path: "/announcements", label: "Announcements", icon: Megaphone, roles: ["ADMIN", "SUPER_ADMIN"] },
      { path: "/support", label: "Support", icon: Headphones },
    ]
  },
  {
    title: "TEAM",
    items: [
      { path: "/admin-team", label: "Admin Team", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
    ]
  },
];

const NAVY = "#1B2A5A";
const TEAL = "#1DAA8A";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const visibleSections = NAV_SECTIONS
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(role || "")),
    }))
    .filter(section => section.items.length > 0);

  const currentItem = visibleSections.flatMap(s => s.items).find(i => i.path === pathname);
  const CurrentIcon = currentItem?.icon ?? BarChart3;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F2F8", fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: collapsed ? 64 : 240, background: NAVY, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, transition: "width 0.2s", zIndex: 100, overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "20px 12px" : "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 72 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: TEAL, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", position: "relative", flexShrink: 0 }}>
                T
                <div style={{ width: 7, height: 7, background: "#F59E0B", borderRadius: "50%", position: "absolute", top: 3, right: 3 }} />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>TRACK<span style={{ color: "#D4860A" }}>LY</span></div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 2 }}>{role === "SUPER_ADMIN" ? "SUPER ADMIN" : role === "SUPPORT_ADMIN" ? "SUPPORT ADMIN" : "ADMIN"}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 36, height: 36, background: TEAL, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", position: "relative" }}>
              T
              <div style={{ width: 7, height: 7, background: "#F59E0B", borderRadius: "50%", position: "absolute", top: 3, right: 3 }} />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {visibleSections.map(section => (
            <div key={section.title} style={{ marginBottom: 8 }}>
              {!collapsed && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "8px 8px 4px" }}>{section.title}</div>}
              {section.items.map(item => {
                const active = pathname === item.path;
                const Icon = item.icon;
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : ""}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                      padding: collapsed ? "10px 0" : "10px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      background: active ? "rgba(29,170,138,0.18)" : "transparent",
                      color: active ? TEAL : "rgba(255,255,255,0.6)",
                      fontWeight: active ? 700 : 500, fontSize: 13, marginBottom: 2,
                      borderLeft: active ? `3px solid ${TEAL}` : "3px solid transparent",
                      transition: "all 0.15s",
                    }}>
                    <Icon size={16} />
                    {!collapsed && item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { logout(); navigate("/login"); }}
            title={collapsed ? "Sign Out" : ""}
            style={{ width: "100%", padding: collapsed ? "10px 0" : "10px 12px", background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8 }}>
            <LogOut size={16} /> {!collapsed && "Sign Out"}
          </button>
          {!collapsed && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, textAlign: "center", marginTop: 10, letterSpacing: 1 }}>IVANEXO LTD &copy; 2026</p>}
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: collapsed ? 64 : 240, flex: 1, transition: "margin-left 0.2s" }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9CA3AF" }}>
            <CurrentIcon size={15} color={NAVY} />
            <span style={{ color: NAVY, fontWeight: 700 }}>{currentItem?.label || "Dashboard"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, background: "#10B981", borderRadius: "50%", boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }} />
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>System Online</span>
            <div style={{ width: 32, height: 32, background: NAVY, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>A</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

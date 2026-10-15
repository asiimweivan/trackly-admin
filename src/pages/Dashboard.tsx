import React, { useEffect, useState } from "react";
import { Store, CreditCard, Users, Wallet, BarChart3, Zap, Bell, Handshake } from "lucide-react";
import { adminApi } from "../api/admin";

const TEAL = "#1DAA8A";
const NAVY = "#1B2A5A";
const GOLD = "#D4860A";
const PURPLE = "#8B5CF6";
const GRAY = "#9CA3AF";

interface Stats {
  totalBusinesses: number;
  activeSubscriptions: number;
  totalUsers: number;
  totalAgents: number;
  newBusinessesToday: number;
  newBusinessesThisMonth: number;
  totalRevenueThisMonth: number;
  totalRevenueAllTime: number;
  ibanzePlanCount: number;
  iteramberePlanCount: number;
  inkungaPlanCount: number;
  trialCount: number;
  expiredCount: number;
}

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: GRAY, fontWeight: 700, letterSpacing: 0.5 }}>{label}</p>
          <p style={{ margin: "8px 0 4px", fontSize: 28, fontWeight: 900, color: NAVY }}>{value}</p>
          {sub && <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{sub}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlanBar({ label, count, total, color }: any) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{label}</span>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{count} businesses</span>
      </div>
      <div style={{ background: "#F3F4F6", borderRadius: 8, height: 10 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 8, height: 10, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(res => { setStats(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: GRAY, fontSize: 16 }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ textAlign: "center", padding: 60, color: "#EF4444" }}>Failed to load stats.</div>;

  const totalPlans = stats.ibanzePlanCount + stats.iteramberePlanCount + stats.inkungaPlanCount;

  const quickActions = [
    { label: "View All Businesses", desc: "See all registered businesses", icon: <Store size={20} color={TEAL} />, color: TEAL, path: "/businesses" },
    { label: "Manage Subscriptions", desc: "Activate, change or cancel plans", icon: <CreditCard size={20} color={NAVY} />, color: NAVY, path: "/subscriptions" },
    { label: "Send Notification", desc: "Push notification to all users", icon: <Bell size={20} color={GOLD} />, color: GOLD, path: "/notifications" },
    { label: "View Agents", desc: "Monitor agent performance", icon: <Handshake size={20} color={PURPLE} />, color: PURPLE, path: "/agents" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: NAVY, margin: 0 }}>Dashboard</h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 14 }}>Welcome back, Super Admin &middot; Trackly Platform Overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
        <StatCard icon={<Store size={22} color={TEAL} />} label="TOTAL BUSINESSES" value={stats.totalBusinesses} sub={`+${stats.newBusinessesToday} today`} color={TEAL} />
        <StatCard icon={<CreditCard size={22} color={NAVY} />} label="ACTIVE SUBSCRIPTIONS" value={stats.activeSubscriptions} sub={`${stats.trialCount} on trial`} color={NAVY} />
        <StatCard icon={<Users size={22} color={GOLD} />} label="TOTAL USERS" value={stats.totalUsers} sub={`${stats.totalAgents} agents`} color={GOLD} />
        <StatCard icon={<Wallet size={22} color={PURPLE} />} label="REVENUE THIS MONTH" value={`${stats.totalRevenueThisMonth.toLocaleString()} RWF`} sub={`Active plans: ${stats.totalRevenueAllTime.toLocaleString()} RWF / month`} color={PURPLE} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} color={NAVY} /> Subscription Plans
          </h2>
          <PlanBar label="Ibanze (2,000 RWF/mo)" count={stats.ibanzePlanCount} total={totalPlans} color={TEAL} />
          <PlanBar label="Iterambere (6,000 RWF/mo)" count={stats.iteramberePlanCount} total={totalPlans} color={NAVY} />
          <PlanBar label="Agaciro (10,000 RWF/mo)" count={stats.inkungaPlanCount} total={totalPlans} color={GOLD} />
          <div style={{ marginTop: 20, padding: 16, background: "#F9FAFB", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Expired / Past Due</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{stats.expiredCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>New this month</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{stats.newBusinessesThisMonth}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} color={NAVY} /> Quick Actions
          </h2>
          {quickActions.map(a => (
            <a key={a.path} href={a.path} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, marginBottom: 8, background: "#F9FAFB", textDecoration: "none", border: "1px solid #E5E7EB" }}>
              <div style={{ width: 40, height: 40, background: a.color + "18", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{a.label}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{a.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

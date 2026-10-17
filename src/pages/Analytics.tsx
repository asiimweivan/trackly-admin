import React, { useEffect, useState } from "react";
import { TrendingUp, Wallet, Calendar, Store, TrendingDown } from "lucide-react";
import { adminApi } from "../api/admin";
import { effectivePlan } from "../utils/plans";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GOLD = "#D4860A"; const GRAY = "#9CA3AF"; const RED = "#EF4444";

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getDashboard().then(r => setStats(r.data));
    adminApi.getBusinesses().then(r => setBusinesses(r.data));
  }, []);

  const effCount = (k: string) => businesses.filter((b: any) => effectivePlan(b.planKey, b.subscriptionStatus) === k).length;
  const planData = stats ? [
    { name: "Ubuntu (Free)", value: effCount("ubuntu"), color: "#94A3B8" },
    { name: "Ibanze", value: effCount("ibanze"), color: TEAL },
    { name: "Iterambere", value: effCount("iterambere"), color: NAVY },
    { name: "Agaciro", value: effCount("inkunga"), color: GOLD },
  ] : [];

  const totalSubs = stats ? (stats.activeSubscriptions + stats.trialCount + stats.expiredCount) : 0;
  const statusData = stats ? [
    { name: "Active", value: stats.activeSubscriptions - stats.trialCount, color: "#059669" },
    { name: "Trialing", value: stats.trialCount, color: GOLD },
    { name: "Expired", value: stats.expiredCount, color: RED },
  ] : [];

  const churnRate = totalSubs > 0 && stats ? ((stats.expiredCount / totalSubs) * 100).toFixed(1) : "0.0";
  const paidBusinesses = businesses.filter((b: any) => effectivePlan(b.planKey, b.subscriptionStatus) !== "ubuntu").length;
  const conversionRate = businesses.length > 0 ? ((paidBusinesses / businesses.length) * 100).toFixed(1) : "0.0";
  const avgRevenuePerBusiness = businesses.length > 0 && stats
    ? Math.round((stats.totalRevenueAllTime || 0) / businesses.length)
    : 0;

  // Top 10 businesses by revenue -- actually sorted, not just first-10-in-API-order
  const topBusinesses = [...businesses]
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 10)
    .map(b => ({
      name: b.name.length > 12 ? b.name.substring(0, 12) + "..." : b.name,
      sales: b.totalSales,
      revenueK: Math.round((b.totalRevenue || 0) / 1000),
    }));

  const cards = [
    { label: "MRR", value: `${(stats?.totalRevenueAllTime || 0).toLocaleString()} RWF`, icon: <Wallet size={20} color={TEAL} />, color: TEAL },
    { label: "ARR (projected)", value: `${((stats?.totalRevenueAllTime || 0) * 12).toLocaleString()} RWF`, icon: <Calendar size={20} color={NAVY} />, color: NAVY },
    { label: "Avg MRR / Business", value: `${avgRevenuePerBusiness.toLocaleString()} RWF`, icon: <Store size={20} color={GOLD} />, color: GOLD },
    { label: "Churn Rate", value: `${churnRate}%`, icon: <TrendingDown size={20} color={RED} />, color: RED },
    { label: "Free to Paid", value: `${conversionRate}%`, icon: <TrendingUp size={20} color={TEAL} />, color: "#059669" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: NAVY, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <TrendingUp size={22} color={NAVY} /> Analytics
        </h1>
        <p style={{ color: GRAY, margin: "4px 0 0", fontSize: 13 }}>Platform performance overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: `3px solid ${c.color}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontSize: 11, color: GRAY, fontWeight: 700, letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: NAVY, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: "0 0 4px" }}>Plan Distribution</h3>
          <p style={{ fontSize: 11, color: GRAY, margin: "0 0 16px" }}>Businesses by subscription tier</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {planData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: "0 0 4px" }}>Subscription Health</h3>
          <p style={{ fontSize: 11, color: GRAY, margin: "0 0 16px" }}>Active vs trialing vs expired</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: "0 0 4px" }}>Top 10 Businesses by Revenue</h3>
        <p style={{ fontSize: 11, color: GRAY, margin: "0 0 20px" }}>Sales count (left axis) vs lifetime revenue in thousands RWF (right axis)</p>
        {topBusinesses.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: GRAY }}>No business activity yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topBusinesses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: "Sales", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: "K RWF", angle: 90, position: "insideRight", fontSize: 11 }} />
              <Tooltip formatter={(v: any, name: any) => name === "revenueK" ? [`${v}K RWF`, "Revenue"] : [v, "Sales"]} />
              <Legend formatter={(v) => v === "sales" ? "Sales Count" : "Revenue (K RWF)"} />
              <Bar yAxisId="left" dataKey="sales" fill={TEAL} name="sales" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenueK" fill={NAVY} name="revenueK" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

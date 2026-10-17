// Single source of truth for plan names shown in the admin panel.
// The internal key "inkunga" is kept (database + API); it is DISPLAYED as "Agaciro".
// "ubuntu" is the permanent free plan: it is never stored as a subscription, it is what a business
// has whenever it has no active paid subscription.
export const PLAN_LABELS: Record<string, string> = {
  ubuntu: "Ubuntu",
  ibanze: "Ibanze",
  iterambere: "Iterambere",
  inkunga: "Agaciro",
  none: "Ubuntu",
};

export const PLAN_PRICES_RWF: Record<string, number> = {
  ubuntu: 0,
  ibanze: 3000,
  iterambere: 6000,
  inkunga: 10000,
};

export const PLAN_COLORS: Record<string, string> = {
  ubuntu: "#94A3B8",
  ibanze: "#1DAA8A",
  iterambere: "#1B2A5A",
  inkunga: "#D4860A",
};

/** The plan a business really has right now (same rule as the app and the backend). */
export function effectivePlan(planKey?: string | null, status?: string | null): string {
  const k = String(planKey || "").toLowerCase();
  const s = String(status || "").toLowerCase();
  return k && k !== "none" && ["active", "trialing", "past_due"].includes(s) ? k : "ubuntu";
}

export function planLabel(key?: string | null): string {
  if (!key) return "-";
  const k = String(key).toLowerCase();
  return PLAN_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
}

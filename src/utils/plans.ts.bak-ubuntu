// Single source of truth for plan names shown in the admin panel.
// The internal key "inkunga" is kept (database + API); it is DISPLAYED as "Agaciro".
export const PLAN_LABELS: Record<string, string> = {
  ibanze: "Ibanze",
  iterambere: "Iterambere",
  inkunga: "Agaciro",
  none: "No plan",
};

export const PLAN_PRICES_RWF: Record<string, number> = {
  ibanze: 2000,
  iterambere: 6000,
  inkunga: 10000,
};

export function planLabel(key?: string | null): string {
  if (!key) return "-";
  const k = String(key).toLowerCase();
  return PLAN_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
}

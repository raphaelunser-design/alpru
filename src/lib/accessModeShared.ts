export type AlpivoAccessMode = "public" | "private";

export const ACCESS_MODE_SETTING_KEY = "alpivo_access_mode";
export const ACCESS_COOKIE = "alpivo_beta_access";
export const ACCESS_QUERY = "access";

export function normalizeAccessMode(value: unknown): AlpivoAccessMode | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "public" || normalized === "private") return normalized;
  return null;
}

export function getEnvAccessMode(): AlpivoAccessMode {
  const configured = normalizeAccessMode(process.env.ALPIVO_ACCESS_MODE);
  if (configured) return configured;

  // Legacy behavior: an old ALPIVO_ACCESS_TOKEN means the private gate should stay active.
  if (process.env.ALPIVO_ACCESS_TOKEN.trim()) return "private";

  // Local development should not lock itself accidentally; production should fail closed.
  return process.env.NODE_ENV === "production" ? "private" : "public";
}

export function getAccessPassword() {
  return process.env.ALPIVO_ACCESS_PASSWORD.trim() || process.env.ALPIVO_ACCESS_TOKEN.trim() || "";
}

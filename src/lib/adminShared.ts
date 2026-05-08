export const OWNER_ADMIN_EMAIL = "raphaelunser@gmail.com";

export function normalizeEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase();
}

export function isOwnerAdminEmail(email: string | null | undefined) {
  return normalizeEmail(email) === OWNER_ADMIN_EMAIL;
}

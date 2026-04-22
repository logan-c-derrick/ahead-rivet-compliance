export type AppRole = "admin" | "compliance_manager" | "viewer";

export const PERMISSION_DENIED_MESSAGE = "You do not have permission to perform this action.";

export function normalizeRole(role: string | null | undefined): AppRole {
  const value = (role ?? "").trim().toLowerCase();
  if (value === "admin") return "admin";
  if (value === "viewer") return "viewer";
  if (value === "compliance_manager") return "compliance_manager";
  // Backward compatibility for existing orgs that still use "user".
  if (value === "user") return "compliance_manager";
  return "viewer";
}

export function canManageSensitiveActions(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "compliance_manager";
}

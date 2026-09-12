import { getChatGPTUser, requireChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/lib/database";

export type AdminRole = "owner" | "manager" | "catalog" | "orders" | "inventory" | "marketing" | "finance" | "auditor";
export type AdminPermission = "dashboard.view" | "orders.manage" | "catalog.manage" | "inventory.manage" | "marketing.manage" | "settings.manage" | "reports.view" | "audit.view" | "team.manage" | "security.manage" | "backups.manage";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "dashboard.view","orders.manage","catalog.manage","inventory.manage","marketing.manage","settings.manage","reports.view","audit.view","team.manage","security.manage","backups.manage",
];

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: ALL_ADMIN_PERMISSIONS,
  manager: ALL_ADMIN_PERMISSIONS.filter((p) => !["team.manage","security.manage","backups.manage"].includes(p)),
  catalog: ["dashboard.view","catalog.manage","inventory.manage","marketing.manage"],
  orders: ["dashboard.view","orders.manage"],
  inventory: ["dashboard.view","inventory.manage","catalog.manage"],
  marketing: ["dashboard.view","marketing.manage"],
  finance: ["dashboard.view","reports.view"],
  auditor: ["dashboard.view","reports.view","audit.view"],
};
const VALID_ROLES = new Set<AdminRole>(Object.keys(ROLE_PERMISSIONS) as AdminRole[]);

function parsePermissions(value: unknown): AdminPermission[] {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.filter((p): p is AdminPermission => ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)) : [];
  } catch { return []; }
}

export function permissionsFor(role: AdminRole, custom: AdminPermission[] = []) {
  if (role === "owner") return ALL_ADMIN_PERMISSIONS;
  return Array.from(new Set([...ROLE_PERMISSIONS[role], ...custom]));
}

export async function adminIsConfigured() {
  try {
    const row = await database().prepare("SELECT COUNT(*) AS total FROM staff WHERE active=1 AND password_hash<>''").first<{ total: number }>();
    return Number(row?.total || 0) > 0;
  } catch { return false; }
}

export async function resolveAdmin(email: string) {
  const normalized = email.trim().toLowerCase();
  try {
    const row = await database()
      .prepare("SELECT role,permissions_json FROM staff WHERE lower(email)=? AND active=1 LIMIT 1")
      .bind(normalized)
      .first<{ role: string; permissions_json: string }>();
    if (row && VALID_ROLES.has(row.role as AdminRole)) {
      const role = row.role as AdminRole;
      return { allowed: true, role, permissions: permissionsFor(role, parsePermissions(row.permissions_json)) };
    }
  } catch {}
  return { allowed: false, role: null as AdminRole | null, permissions: [] as AdminPermission[] };
}

export function can(role: AdminRole, area: "catalog"|"orders"|"settings"|"staff"|AdminPermission, permissions: AdminPermission[] = []) {
  const permission: AdminPermission = area === "catalog" ? "catalog.manage" : area === "orders" ? "orders.manage" : area === "settings" ? "settings.manage" : area === "staff" ? "team.manage" : area;
  return permissionsFor(role, permissions).includes(permission);
}

export async function requireAdminPage() {
  const user = await requireChatGPTUser("/admin");
  const access = await resolveAdmin(user.email);
  return { user, ...access, configured: await adminIsConfigured() };
}

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return { ok: false as const, status: 401, error: "Faça login para continuar" };
  const access = await resolveAdmin(user.email);
  if (!access.allowed || !access.role) return { ok: false as const, status: 403, error: "Usuário sem permissão administrativa" };
  return { ok: true as const, user, role: access.role, permissions: access.permissions };
}

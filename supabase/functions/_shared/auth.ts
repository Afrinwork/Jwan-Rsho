import { createClient } from "jsr:@supabase/supabase-js@2";

export type CallerRole = "super_admin" | "admin" | "driver";

export type CallerProfile = {
  id: string;
  role: CallerRole;
  managerId: string | null;
  isActive: boolean;
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function requireCallerProfile(req: Request): Promise<CallerProfile> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "unauthenticated");
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  const admin = getAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData?.user) throw new HttpError(401, "unauthenticated");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, manager_id, is_active")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile) throw new HttpError(401, "unauthenticated");

  return {
    id: profile.id,
    role: profile.role as CallerRole,
    managerId: profile.manager_id,
    isActive: profile.is_active,
  };
}

export async function requireAdminOrSuperAdmin(req: Request): Promise<CallerProfile> {
  const caller = await requireCallerProfile(req);
  if (caller.role !== "admin" && caller.role !== "super_admin") {
    throw new HttpError(403, "permission-denied");
  }
  return caller;
}

export async function requireSuperAdmin(req: Request): Promise<CallerProfile> {
  const caller = await requireCallerProfile(req);
  if (caller.role !== "super_admin") {
    throw new HttpError(403, "permission-denied");
  }
  return caller;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  console.error(error);
  return jsonResponse({ error: "internal" }, 500);
}

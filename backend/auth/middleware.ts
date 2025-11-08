import { APIError, Header } from "encore.dev/api";
import { getSession } from "./session";
import { authDB } from "./db";
import type { AuthData } from "./types";

export async function requireAuth(authHeader?: string): Promise<AuthData> {
  if (!authHeader) {
    throw APIError.unauthenticated("Missing authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw APIError.unauthenticated("Missing token");
  }

  const session = await getSession(token);
  if (!session) {
    throw APIError.unauthenticated("Invalid or expired session");
  }

  const userDetails = await authDB.queryRow<{
    group_id: number | null;
  }>`
    SELECT ug.group_id
    FROM users u
    LEFT JOIN user_groups ug ON u.id = ug.user_id
    WHERE u.id = ${session.userId}
  `;

  return {
    userID: String(session.userId),
    username: session.username,
    role: session.role as "admin" | "viewer",
    groupId: userDetails?.group_id || undefined,
  };
}

export async function requireAdmin(authHeader?: string): Promise<AuthData> {
  const authData = await requireAuth(authHeader);
  
  if (authData.role !== "admin") {
    throw APIError.permissionDenied("Admin access required");
  }
  
  return authData;
}
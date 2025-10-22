import { APIError, Header } from "encore.dev/api";
import { getSession } from "./session";
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

  return {
    userID: String(session.userId),
    username: session.username,
    role: session.role as "admin" | "viewer",
  };
}

export async function requireAdmin(authHeader?: string): Promise<AuthData> {
  const authData = await requireAuth(authHeader);
  
  if (authData.role !== "admin") {
    throw APIError.permissionDenied("Admin access required");
  }
  
  return authData;
}
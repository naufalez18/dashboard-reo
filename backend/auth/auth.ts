import { Header, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getSession } from "./session";
import type { AuthData } from "./types";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.authorization?.replace("Bearer ", "");
  console.log("Auth handler called with token:", token ? "present" : "missing");
  
  if (!token) {
    throw APIError.unauthenticated("missing token");
  }

  try {
    const session = getSession(token);
    console.log("Session lookup result:", session ? "found" : "not found");
    
    if (!session) {
      throw APIError.unauthenticated("invalid or expired session");
    }
    
    const authData = {
      userID: String(session.userId),
      username: session.username,
      role: session.role as "admin" | "viewer",
    };
    console.log("Returning auth data:", authData);
    
    return authData;
  } catch (err) {
    console.error("Auth handler error:", err);
    throw APIError.unauthenticated("invalid session", err as Error);
  }
});

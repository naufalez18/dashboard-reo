import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getSession } from "./session";
import type { AuthData } from "./types";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.authorization?.replace("Bearer ", "");
  if (!token) {
    throw APIError.unauthenticated("missing token");
  }

  try {
    const session = getSession(token);
    if (!session) {
      throw APIError.unauthenticated("invalid or expired session");
    }
    return {
      userID: String(session.userId),
      username: session.username,
      role: session.role as "admin" | "viewer",
    };
  } catch (err) {
    throw APIError.unauthenticated("invalid session", err as Error);
  }
});

export const gw = new Gateway({ authHandler: auth });

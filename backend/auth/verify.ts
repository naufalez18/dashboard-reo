import { api, APIError } from "encore.dev/api";
import { getSession } from "./session";
import type { User } from "./types";

interface VerifyTokenRequest {
  token: string;
}

interface VerifyTokenResponse {
  user: User;
}

export const verifyToken = api<VerifyTokenRequest, VerifyTokenResponse>(
  { expose: true, method: "POST", path: "/auth/verify" },
  async (req) => {
    try {
      const session = getSession(req.token);
      
      if (!session) {
        throw APIError.unauthenticated("Invalid or expired session");
      }

      return {
        user: {
          id: session.userId,
          username: session.username,
          role: session.role as "admin" | "viewer",
        },
      };
    } catch (error) {
      console.error("Session verification failed:", error);
      throw APIError.unauthenticated("Invalid or expired session");
    }
  }
);
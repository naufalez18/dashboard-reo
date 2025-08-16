import { api, APIError } from "encore.dev/api";
import { verifyJWT } from "./jwt";
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
      const decoded = verifyJWT(req.token);

      return {
        user: {
          id: decoded.sub,
          username: decoded.username,
          role: decoded.role,
        },
      };
    } catch (error) {
      console.error("Token verification failed:", error);
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);

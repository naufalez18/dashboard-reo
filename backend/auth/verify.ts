import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import * as jwt from "jsonwebtoken";
import type { User } from "./types";

const jwtSecret = secret("JWTSecret");

interface VerifyTokenRequest {
  token: string;
}

interface VerifyTokenResponse {
  user: User;
}

// Verifies a JWT token and returns user information.
export const verifyToken = api<VerifyTokenRequest, VerifyTokenResponse>(
  { expose: true, method: "POST", path: "/auth/verify" },
  async (req) => {
    try {
      const decoded = jwt.verify(req.token, jwtSecret()) as any;
      
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

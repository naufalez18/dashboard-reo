import { api, APIError } from "encore.dev/api";
import type { User } from "./types";

// Simple JWT verification without external dependencies
function verifySimpleJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }
    
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

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
      const decoded = verifySimpleJWT(req.token);
      
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

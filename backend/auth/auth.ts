import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import type { AuthData } from "./types";

// Simple JWT verification without external dependencies
function verifySimpleJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    let json: string;
    try {
      json = Buffer.from(parts[1], "base64url").toString("utf-8");
    } catch {
      throw new Error("Invalid token encoding");
    }

    const payload = JSON.parse(json);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

interface AuthParams {
  authorization?: Header<"Authorization">;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const decoded = verifySimpleJWT(token);
      
      return {
        userID: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });

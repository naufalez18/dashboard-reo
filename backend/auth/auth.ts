import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import * as jwt from "jsonwebtoken";
import type { AuthData } from "./types";

const jwtSecret = secret("JWTSecret");

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
      const decoded = jwt.verify(token, jwtSecret()) as any;
      
      return {
        userID: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });

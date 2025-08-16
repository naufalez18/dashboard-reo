import { api, APIError } from "encore.dev/api";
import type { LoginRequest, LoginResponse, User } from "./types";

// Simple JWT implementation without external dependencies
function createSimpleJWT(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Simple signature using a hardcoded secret for demo purposes
  const signature = Buffer.from(
    `${encodedHeader}.${encodedPayload}.demo-secret`,
  ).toString("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Hardcoded users for demo purposes
const users: Record<string, { password: string; role: "admin" | "viewer" }> = {
  naufalez: { password: "Nopal1206!", role: "admin" },
  reodept: { password: "reo123", role: "viewer" },
};

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const { username, password } = req;

    // Debug logging to help identify the issue
    console.log("Login attempt:", { username, passwordLength: password?.length });
    console.log("Available users:", Object.keys(users));

    // Validate input
    if (!username || !password) {
      throw APIError.invalidArgument("Username and password are required");
    }

    // Check if user exists and password matches
    const user = users[username.trim()];
    if (!user) {
      console.log("User not found:", username);
      throw APIError.unauthenticated("Invalid username or password");
    }

    if (user.password !== password.trim()) {
      console.log("Password mismatch for user:", username);
      throw APIError.unauthenticated("Invalid username or password");
    }

    console.log("Login successful for user:", username);

    // Create user object
    const userObj: User = {
      id: username,
      username,
      role: user.role,
    };

    // Generate simple JWT token
    const token = createSimpleJWT({
      sub: username,
      username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });

    return {
      token,
      user: userObj,
    };
  }
);

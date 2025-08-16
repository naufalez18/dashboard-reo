import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { authDB } from "./db";
import { createJWT } from "./jwt";
import type { LoginRequest, LoginResponse, User } from "./types";

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const { username, password } = req;

    if (!username || !password) {
      throw APIError.invalidArgument("Username and password are required");
    }

    const row = await authDB.queryRow<{
      id: number;
      username: string;
      password_hash: string;
      role: "admin" | "viewer";
    }>`SELECT id, username, password_hash, role FROM users WHERE username = ${
      username.trim()
    }`;

    if (!row) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    const match = await bcrypt.compare(password.trim(), row.password_hash);
    if (!match) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    const user: User = {
      id: row.id,
      username: row.username,
      role: row.role,
    };

    const token = createJWT({
      sub: row.id,
      username: row.username,
      role: row.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });

    return { token, user };
  }
);

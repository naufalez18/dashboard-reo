import { api, APIError } from "encore.dev/api";
import { getSession } from "./session";
import { authDB } from "./db";
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
    console.log(`Verify token called with token: ${req.token.substring(0, 8)}...`);
    
    try {
      const session = await getSession(req.token);
      
      if (!session) {
        console.log("Session verification failed: session not found or expired");
        throw APIError.unauthenticated("Invalid or expired session");
      }

      console.log(`Session verification successful for user: ${session.username}`);
      
      const userDetails = await authDB.queryRow<{
        group_id: number | null;
        group_name: string | null;
      }>`
        SELECT ug.group_id, dg.name as group_name
        FROM users u
        LEFT JOIN user_groups ug ON u.id = ug.user_id
        LEFT JOIN dashboard_groups dg ON ug.group_id = dg.id
        WHERE u.id = ${session.userId}
      `;
      
      return {
        user: {
          id: session.userId,
          username: session.username,
          role: session.role as "admin" | "viewer",
          groupId: userDetails?.group_id || undefined,
          groupName: userDetails?.group_name || undefined,
        },
      };
    } catch (error) {
      console.error("Session verification failed with error:", error);
      throw APIError.unauthenticated("Invalid or expired session");
    }
  }
);
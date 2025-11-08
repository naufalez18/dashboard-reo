import { api, APIError } from "encore.dev/api";
import { removeSession } from "./session";

interface LogoutRequest {
  token: string;
}

export const logout = api<LogoutRequest, void>(
  { expose: true, auth: false, method: "POST", path: "/auth/logout" },
  async (req) => {
    console.log(`Logout called for token: ${req.token.substring(0, 8)}...`);
    
    try {
      await removeSession(req.token);
      console.log("Session invalidated successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      // Don't throw error, logout should succeed even if session doesn't exist
    }
  }
);
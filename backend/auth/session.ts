import crypto from "crypto";
import { authDB } from "./db";

export async function createSession(userId: number, username: string, role: string): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
  
  await authDB.exec`
    INSERT INTO sessions (id, user_id, username, role, expires_at)
    VALUES (${sessionId}, ${userId}, ${username}, ${role}, ${expiresAt})
  `;
  
  console.log(`Created session ${sessionId} for user ${username} (${userId}), expires at ${expiresAt}`);
  
  return sessionId;
}

export async function getSession(sessionId: string) {
  console.log(`Looking up session: ${sessionId}`);
  
  const session = await authDB.queryRow<{
    user_id: number;
    username: string;
    role: string;
    expires_at: Date;
  }>`
    SELECT user_id, username, role, expires_at
    FROM sessions 
    WHERE id = ${sessionId} AND expires_at > NOW()
  `;
  
  if (!session) {
    console.log(`Session ${sessionId} not found or expired`);
    // Clean up expired session if it exists
    await authDB.exec`DELETE FROM sessions WHERE id = ${sessionId}`;
    return null;
  }
  
  console.log(`Session ${sessionId} is valid for user ${session.username} (${session.user_id})`);
  return {
    userId: session.user_id,
    username: session.username,
    role: session.role,
    expiresAt: session.expires_at.getTime()
  };
}

export async function removeSession(sessionId: string) {
  await authDB.exec`DELETE FROM sessions WHERE id = ${sessionId}`;
  console.log(`Removed session ${sessionId}`);
}

export async function cleanExpiredSessions() {
  try {
    await authDB.exec`DELETE FROM sessions WHERE expires_at <= NOW()`;
    console.log("Cleaned expired sessions");
  } catch (error) {
    console.error("Error cleaning expired sessions:", error);
  }
}

// Clean up expired sessions every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);
import crypto from "crypto";

// Simple in-memory session store
const sessions = new Map<string, { userId: number; username: string; role: string; expiresAt: number }>();

export function createSession(userId: number, username: string, role: string): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(sessionId, {
    userId,
    username,
    role,
    expiresAt
  });
  
  return sessionId;
}

export function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

export function removeSession(sessionId: string) {
  sessions.delete(sessionId);
}

export function cleanExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

// Clean up expired sessions every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);
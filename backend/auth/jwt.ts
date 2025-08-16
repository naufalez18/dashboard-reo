import crypto from "crypto";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET not set");
}
const SECRET_KEY: string = SECRET;

export function createJWT(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string): any {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const [encodedHeader, encodedPayload, signature] = parts;

  let json: string;
  try {
    json = Buffer.from(encodedPayload, "base64url").toString("utf-8");
  } catch {
    throw new Error("Invalid token encoding");
  }

  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(json);

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  if (!payload.role || !["admin", "viewer"].includes(payload.role)) {
    throw new Error("Invalid role claim");
  }

  return payload;
}

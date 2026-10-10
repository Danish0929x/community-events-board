import { SignJWT, jwtVerify } from "jose";
import { ROLES, TOKEN_TTL_SECONDS, type Role } from "./constants";

// Kept free of Node-only imports so it can also run inside proxy.ts.

export type TokenPayload = { sub: string; email: string; role: Role };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters (see .env.example)");
  }
  return new TextEncoder().encode(value);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const role = payload.role as Role;
    if (!payload.sub || typeof payload.email !== "string" || !ROLES.includes(role)) return null;
    return { sub: payload.sub, email: payload.email, role };
  } catch {
    return null; // expired, tampered or malformed
  }
}

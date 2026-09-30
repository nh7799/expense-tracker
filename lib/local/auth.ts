import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { LOCAL_USER_COOKIE } from "./constants";
import { readDb, writeDb } from "./db";

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString("hex");
}

function packHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashPassword(password, salt)}`;
}

function verifyPassword(password: string, packed: string): boolean {
  const [salt, hash] = packed.split(":");
  if (!salt || !hash) return false;
  try {
    return timingSafeEqual(Buffer.from(hashPassword(password, salt), "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function newId(): string {
  return crypto.randomUUID();
}

export async function localSignUp(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const db = await readDb();
  if (db.users.some((u) => u.email === normalised)) return { ok: false, error: "An account with this email already exists." };
  const user = { id: newId(), email: normalised, passwordHash: packHash(password) };
  db.users.push(user);
  await writeDb(db);
  await setLocalSession(user.id);
  return { ok: true };
}

export async function localSignIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalised = email.trim().toLowerCase();
  const db = await readDb();
  const user = db.users.find((u) => u.email === normalised);
  if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false, error: "Invalid email or password." };
  await setLocalSession(user.id);
  return { ok: true };
}

export async function setLocalSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(LOCAL_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearLocalSession(): Promise<void> {
  const store = await cookies();
  store.delete(LOCAL_USER_COOKIE);
}

export async function getLocalUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(LOCAL_USER_COOKIE)?.value ?? null;
}

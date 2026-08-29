import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { User, UserRole, UserWithPassword } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'takehome-15-field-service-dispatch-secret-key-2026-prod'
);

const COOKIE_NAME = 'dispatch_session';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      created_at: '',
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function getUserByEmail(email: string): UserWithPassword | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as UserWithPassword | undefined;
  return user || null;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id) as User | undefined;
  return user || null;
}

export function listTechnicians(): User[] {
  const db = getDb();
  return db.prepare("SELECT id, email, name, role, created_at FROM users WHERE role = 'TECHNICIAN' ORDER BY name ASC").all() as User[];
}

export function listUsers(): User[] {
  const db = getDb();
  return db.prepare("SELECT id, email, name, role, created_at FROM users ORDER BY name ASC").all() as User[];
}

export { COOKIE_NAME };

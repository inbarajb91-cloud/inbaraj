import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]\$/;

function isBcryptHash(value: string): boolean {
  return BCRYPT_PREFIX.test(value);
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const filler = Buffer.alloc(bufA.length);
    timingSafeEqual(bufA, filler);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function verifyAdminPassword(provided: string | null): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD;
  if (!stored || !provided) return false;

  if (isBcryptHash(stored)) {
    try {
      return await bcrypt.compare(provided, stored);
    } catch {
      return false;
    }
  }

  return timingSafeStringEqual(provided, stored);
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const header = request.headers.get('x-admin-password');
  const ok = await verifyAdminPassword(header);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

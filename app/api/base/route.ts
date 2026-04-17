import { NextRequest, NextResponse } from 'next/server';
import { loadBase } from '@/lib/resume';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { name: 'base', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  const base = loadBase();
  return NextResponse.json(base);
}

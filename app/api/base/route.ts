import { NextRequest, NextResponse } from 'next/server';
import { loadBase } from '@/lib/resume';

export async function GET(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const base = loadBase();
  return NextResponse.json(base);
}

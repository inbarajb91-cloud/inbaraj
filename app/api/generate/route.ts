import { NextRequest, NextResponse } from 'next/server';
import { loadBase } from '@/lib/resume';
import { tailorResume } from '@/lib/ai';
import { generateSlug } from '@/lib/slug';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobDescription, companyName } = body;

    if (!jobDescription || !companyName) {
      return NextResponse.json(
        { error: 'jobDescription and companyName are required' },
        { status: 400 }
      );
    }

    const base = loadBase();
    const overrides = await tailorResume(base, jobDescription);

    const date = new Date().toISOString().slice(0, 10);
    const slug = generateSlug(companyName, date);

    return NextResponse.json({
      slug,
      companyName,
      date,
      overrides,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { loadBase } from '@/lib/resume';
import { tailorResumeWithValidation } from '@/lib/ai';
import { loadGroundTruth } from '@/lib/ground-truth';
import { generateSlug } from '@/lib/slug';
import { logGeneration } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobDescription, companyName, roleLabel } = body;

    if (!jobDescription || !companyName) {
      return NextResponse.json(
        { error: 'jobDescription and companyName are required' },
        { status: 400 }
      );
    }

    const base = loadBase();
    const groundTruth = loadGroundTruth();
    const slug = generateSlug(companyName, roleLabel);

    const startTime = Date.now();
    const { overrides, validation, retryCount } = await tailorResumeWithValidation(
      base,
      jobDescription,
      groundTruth
    );
    const generationTimeMs = Date.now() - startTime;

    const date = new Date().toISOString().slice(0, 10);

    logGeneration({
      timestamp: new Date().toISOString(),
      slug,
      company: companyName,
      generationTimeMs,
      validationResult: validation,
      retryCount,
    });

    return NextResponse.json({
      slug,
      companyName,
      date,
      overrides,
      validation,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

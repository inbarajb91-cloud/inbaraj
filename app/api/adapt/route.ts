import { NextRequest, NextResponse } from 'next/server';
import { loadBase, loadProfile, mergeResume } from '@/lib/resume';
import { loadGroundTruth } from '@/lib/ground-truth';
import { generateSlug } from '@/lib/slug';
import { logGeneration } from '@/lib/logger';
import { adaptResumeWithValidation } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');

  if (!adminPassword || authHeader !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sourceSlug, companyName, roleLabel, instruction } = body;

    if (!companyName || !instruction) {
      return NextResponse.json(
        { error: 'companyName and instruction are required' },
        { status: 400 }
      );
    }

    const base = loadBase();
    const groundTruth = loadGroundTruth();
    const slug = generateSlug(companyName, roleLabel);

    // Build the source resume: base merged with profile overrides (if any)
    let sourceResume = base;
    if (sourceSlug) {
      const profile = await loadProfile(sourceSlug);
      if (profile) {
        sourceResume = mergeResume(base, profile);
      }
    }

    const startTime = Date.now();
    const { overrides, validation, retryCount } = await adaptResumeWithValidation(
      sourceResume,
      instruction,
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
    console.error('Adapt error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Adaptation failed' },
      { status: 500 }
    );
  }
}

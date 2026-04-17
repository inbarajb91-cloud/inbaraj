import { NextRequest, NextResponse } from 'next/server';
import { getFileContent, commitFile } from '@/lib/github';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;
const MAX_OVERRIDES_BYTES = 200_000;

async function updateGroundTruth(overrides: Record<string, unknown>): Promise<void> {
  try {
    const gtContent = await getFileContent('data/ground-truth.json');
    if (!gtContent) return;

    const gt = JSON.parse(gtContent);
    let changed = false;

    const addUnique = (arr: string[], items: string[]) => {
      for (const item of items) {
        if (item && !arr.includes(item)) {
          arr.push(item);
          changed = true;
        }
      }
    };

    const experience = overrides.experience as Array<{
      bullets?: string[];
      highlights?: Array<{ text?: string }>;
    }> | undefined;
    if (Array.isArray(experience)) {
      for (const exp of experience) {
        if (exp.bullets) addUnique(gt.bullets || [], exp.bullets);
        if (exp.highlights) {
          addUnique(gt.highlights || [], exp.highlights.map(h => h.text).filter(Boolean) as string[]);
        }
      }
    }

    const skills = overrides.skills as Array<{ items?: string[] }> | undefined;
    if (Array.isArray(skills)) {
      for (const group of skills) {
        if (group.items) addUnique(gt.skills || [], group.items);
      }
    }

    const customSections = overrides.customSections as Array<{ items?: string[] }> | undefined;
    if (Array.isArray(customSections)) {
      for (const section of customSections) {
        if (section.items) addUnique(gt.bullets || [], section.items);
      }
    }

    if (changed) {
      await commitFile(
        'data/ground-truth.json',
        JSON.stringify(gt, null, 2),
        'Update ground truth from manual edits'
      );
    }
  } catch (err) {
    console.error('Ground truth update failed:', err);
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
      targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

function validateSlug(slug: string): NextResponse | null {
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(request, { name: 'profile-read', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  const { slug } = await params;
  const invalid = validateSlug(slug);
  if (invalid) return invalid;

  try {
    const content = await getFileContent(`data/profiles/${slug}.json`);
    if (!content) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(request, { name: 'profile-write', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  const { slug } = await params;
  const invalid = validateSlug(slug);
  if (invalid) return invalid;

  try {
    const content = await getFileContent(`data/profiles/${slug}.json`);
    if (!content) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const existingProfile = JSON.parse(content) as Record<string, unknown>;
    const body = await request.json();
    const { overrides } = body;

    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return NextResponse.json({ error: 'overrides object is required' }, { status: 400 });
    }
    if (JSON.stringify(overrides).length > MAX_OVERRIDES_BYTES) {
      return NextResponse.json({ error: 'overrides too large' }, { status: 413 });
    }

    const updatedProfile = deepMerge(existingProfile, overrides);

    const company = (existingProfile.meta as Record<string, unknown>)?.company || slug;
    await commitFile(
      `data/profiles/${slug}.json`,
      JSON.stringify(updatedProfile, null, 2),
      `Update profile: ${company}`
    );

    await updateGroundTruth(overrides);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = rateLimit(request, { name: 'profile-delete', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  const { slug } = await params;
  const invalid = validateSlug(slug);
  if (invalid) return invalid;

  try {
    const registryContent = await getFileContent('data/profiles/registry.json');
    const registry = registryContent ? JSON.parse(registryContent) : {};
    const company = registry[slug]?.company || slug;
    delete registry[slug];
    await commitFile(
      'data/profiles/registry.json',
      JSON.stringify(registry, null, 2),
      `Remove profile: ${company}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}

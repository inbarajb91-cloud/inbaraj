import { NextRequest, NextResponse } from 'next/server';
import { commitFile, getFileContent, getRegistryFromGitHub } from '@/lib/github';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;
const MAX_NAME_CHARS = 200;
const MAX_OVERRIDES_BYTES = 200_000;

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { name: 'profiles-read', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  const registry = await getRegistryFromGitHub();
  const profiles: Record<string, unknown> = {};

  for (const slug of Object.keys(registry)) {
    try {
      const content = await getFileContent(`data/profiles/${slug}.json`);
      profiles[slug] = {
        ...registry[slug],
        data: content ? JSON.parse(content) : null,
      };
    } catch {
      profiles[slug] = { ...registry[slug], data: null };
    }
  }

  return NextResponse.json({ registry, profiles });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { name: 'profiles-write', limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const unauthorized = await requireAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { slug, companyName, date, overrides } = body;

    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    if (typeof companyName !== 'string' || companyName.length === 0 || companyName.length > MAX_NAME_CHARS) {
      return NextResponse.json({ error: 'Invalid companyName' }, { status: 400 });
    }
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return NextResponse.json({ error: 'overrides object is required' }, { status: 400 });
    }
    const serialized = JSON.stringify(overrides);
    if (serialized.length > MAX_OVERRIDES_BYTES) {
      return NextResponse.json({ error: 'overrides too large' }, { status: 413 });
    }
    if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const profileData = {
      meta: {
        company: companyName,
        created: date || new Date().toISOString().slice(0, 10),
        active: true,
      },
      ...overrides,
    };

    await commitFile(
      `data/profiles/${slug}.json`,
      JSON.stringify(profileData, null, 2),
      `Add profile: ${companyName}`
    );

    const registryContent = await getFileContent('data/profiles/registry.json');
    const registry = registryContent ? JSON.parse(registryContent) : {};
    registry[slug] = {
      company: companyName,
      created: profileData.meta.created,
      active: true,
    };
    await commitFile(
      'data/profiles/registry.json',
      JSON.stringify(registry, null, 2),
      `Update registry: add ${companyName}`
    );

    return NextResponse.json({ success: true, slug, url: `/r/${slug}` });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Publish failed' },
      { status: 500 }
    );
  }
}

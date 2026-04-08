import { NextRequest, NextResponse } from 'next/server';
import { commitFile, getFileContent, getRegistryFromGitHub } from '@/lib/github';

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');
  return !!adminPassword && authHeader === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read registry from GitHub at runtime (not from build-time static import)
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
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, companyName, date, overrides } = body;

    if (!slug || !companyName || !overrides) {
      return NextResponse.json(
        { error: 'slug, companyName, and overrides are required' },
        { status: 400 }
      );
    }

    const profileData = {
      meta: {
        company: companyName,
        created: date || new Date().toISOString().slice(0, 10),
        active: true,
      },
      ...overrides,
    };

    // Commit profile JSON to GitHub
    await commitFile(
      `data/profiles/${slug}.json`,
      JSON.stringify(profileData, null, 2),
      `Add profile: ${companyName}`
    );

    // Update registry
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

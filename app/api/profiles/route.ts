import { NextRequest, NextResponse } from 'next/server';
import { loadRegistry } from '@/lib/resume';
import fs from 'fs/promises';
import path from 'path';

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');
  return !!adminPassword && authHeader === adminPassword;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const registry = loadRegistry();
  const profiles: Record<string, unknown> = {};

  for (const slug of Object.keys(registry)) {
    try {
      const filePath = path.join(process.cwd(), 'data', 'profiles', `${slug}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      profiles[slug] = {
        ...registry[slug],
        data: JSON.parse(content),
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

    const profilesDir = path.join(process.cwd(), 'data', 'profiles');
    const profilePath = path.join(profilesDir, `${slug}.json`);
    await fs.writeFile(profilePath, JSON.stringify(profileData, null, 2));

    const registryPath = path.join(profilesDir, 'registry.json');
    const registryContent = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);
    registry[slug] = {
      company: companyName,
      created: profileData.meta.created,
      active: true,
    };
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    return NextResponse.json({ success: true, slug, url: `/r/${slug}` });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function checkAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get('x-admin-password');
  return !!adminPassword && authHeader === adminPassword;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const filePath = path.join(process.cwd(), 'data', 'profiles', `${slug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const profilesDir = path.join(process.cwd(), 'data', 'profiles');

    // Remove profile file
    const filePath = path.join(profilesDir, `${slug}.json`);
    await fs.unlink(filePath).catch(() => {});

    // Update registry
    const registryPath = path.join(profilesDir, 'registry.json');
    const registryContent = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);
    delete registry[slug];
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}

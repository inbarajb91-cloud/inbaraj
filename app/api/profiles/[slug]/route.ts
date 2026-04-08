import { NextRequest, NextResponse } from 'next/server';
import { getFileContent, commitFile } from '@/lib/github';

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
    const content = await getFileContent(`data/profiles/${slug}.json`);
    if (!content) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
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
    // Update registry to remove the profile
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

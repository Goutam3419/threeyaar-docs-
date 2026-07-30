import { NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/lib/firebase/admin';
import { runFullDiagnostic } from '@/lib/integration/testing/testCenter';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await verifyRequestAuth(request); // any signed-in user can diagnose their own workspace's connections
    const body = await request.json().catch(() => ({}));
    const { provider, workspaceId } = body as { provider?: string; workspaceId?: string };
    if (!provider || !workspaceId) {
      return NextResponse.json({ error: 'provider and workspaceId are required' }, { status: 400 });
    }
    const report = await runFullDiagnostic(provider, workspaceId);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unknown_error' }, { status: 401 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dismissAlert } from '@/lib/jobs';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can dismiss running-late alerts.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { jobId, windowFingerprint } = body;

    if (!jobId || !windowFingerprint) {
      return NextResponse.json({ error: 'jobId and windowFingerprint are required.' }, { status: 400 });
    }

    dismissAlert(Number(jobId), String(windowFingerprint), user);
    return NextResponse.json({ success: true, message: 'Alert dismissed.' });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to dismiss alert.' },
      { status: 400 }
    );
  }
}

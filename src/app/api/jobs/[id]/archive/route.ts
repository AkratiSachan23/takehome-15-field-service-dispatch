import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { setJobArchived } from '@/lib/jobs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can archive or restore jobs.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const jobId = Number(id);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const isArchived = Boolean(body.isArchived);
    const job = setJobArchived(jobId, isArchived, user);

    return NextResponse.json({ job });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to change archive status.' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateJobStatus } from '@/lib/jobs';
import { JobStatus } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const jobId = Number(id);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const status = body.status as JobStatus;
    const completionNote = body.completionNote as string | undefined;

    if (!status) {
      return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    const updatedJob = updateJobStatus(jobId, status, user, { completionNote });
    return NextResponse.json({ job: updatedJob });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update status.' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getJobById, updateJob } from '@/lib/jobs';

export async function GET(
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

  const job = getJobById(jobId, user);
  if (!job) {
    return NextResponse.json({ error: 'Job not found or access denied.' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can edit jobs.' },
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
    const updated = updateJob(
      jobId,
      {
        customer_name: body.customer_name,
        site_address: body.site_address,
        description: body.description,
        priority: body.priority,
        scheduled_date: body.scheduled_date,
        start_time: body.start_time,
        estimated_duration: body.estimated_duration !== undefined ? Number(body.estimated_duration) : undefined,
      },
      user
    );

    return NextResponse.json({ job: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update job.' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listJobs, createJob } from '@/lib/jobs';
import { JobFilterParams } from '@/lib/types';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params: JobFilterParams = {
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as JobFilterParams['status']) || undefined,
    technicianId: searchParams.get('technicianId') ? Number(searchParams.get('technicianId')) : undefined,
    scheduledDate: searchParams.get('scheduledDate') || undefined,
    includeArchived: searchParams.get('includeArchived') === 'true',
    sortBy: (searchParams.get('sortBy') as JobFilterParams['sortBy']) || undefined,
    sortOrder: (searchParams.get('sortOrder') as JobFilterParams['sortOrder']) || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 10,
  };

  const result = listJobs(params, user);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can create jobs.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const job = createJob(
      {
        customer_name: body.customer_name,
        site_address: body.site_address,
        description: body.description,
        priority: body.priority,
        scheduled_date: body.scheduled_date,
        start_time: body.start_time,
        estimated_duration: Number(body.estimated_duration),
      },
      user
    );

    return NextResponse.json({ job }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create job.' },
      { status: 400 }
    );
  }
}

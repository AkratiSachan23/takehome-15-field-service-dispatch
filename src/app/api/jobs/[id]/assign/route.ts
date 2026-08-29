import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { assignTechnicianToJob, unassignTechnicianFromJob } from '@/lib/jobs';

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
      { error: 'Forbidden: Only dispatchers can assign technicians.' },
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
    const technicianId = Number(body.technicianId);
    if (!technicianId || isNaN(technicianId)) {
      return NextResponse.json({ error: 'Valid technician ID is required.' }, { status: 400 });
    }

    const updatedJob = assignTechnicianToJob(jobId, technicianId, user);
    return NextResponse.json({ job: updatedJob });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to assign technician.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can remove technician assignments.' },
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
    const technicianId = Number(body.technicianId);
    if (!technicianId || isNaN(technicianId)) {
      return NextResponse.json({ error: 'Valid technician ID is required.' }, { status: 400 });
    }

    const updatedJob = unassignTechnicianFromJob(jobId, technicianId, user);
    return NextResponse.json({ job: updatedJob });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to unassign technician.' },
      { status: 400 }
    );
  }
}

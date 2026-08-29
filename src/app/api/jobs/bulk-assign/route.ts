import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { bulkAssignJobs } from '@/lib/jobs';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can perform bulk assignments.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { jobIds, technicianId } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'Array of job IDs is required.' }, { status: 400 });
    }

    if (!technicianId || isNaN(Number(technicianId))) {
      return NextResponse.json({ error: 'Valid technician ID is required.' }, { status: 400 });
    }

    const result = bulkAssignJobs(jobIds.map(Number), Number(technicianId), user);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bulk assignment failed.' },
      { status: 400 }
    );
  }
}

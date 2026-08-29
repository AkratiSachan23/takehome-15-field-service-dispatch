import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addPartUsed } from '@/lib/jobs';

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
    const partName = body.part_name as string;
    const quantity = Number(body.quantity);

    if (!partName || !quantity) {
      return NextResponse.json({ error: 'Part name and quantity are required.' }, { status: 400 });
    }

    const part = addPartUsed(jobId, partName, quantity, user);
    return NextResponse.json({ part }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record part used.' },
      { status: 400 }
    );
  }
}

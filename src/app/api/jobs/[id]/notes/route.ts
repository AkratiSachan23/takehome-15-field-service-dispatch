import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addJobNote } from '@/lib/jobs';

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
    const note = body.note as string;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note text cannot be empty.' }, { status: 400 });
    }

    const createdNote = addJobNote(jobId, note, user);
    return NextResponse.json({ note: createdNote }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add note.' },
      { status: 400 }
    );
  }
}

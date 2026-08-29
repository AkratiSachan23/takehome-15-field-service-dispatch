import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateDispatchSheetCsv } from '@/lib/jobs';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'DISPATCHER') {
    return NextResponse.json(
      { error: 'Forbidden: Only dispatchers can export dispatch sheets.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const csvContent = generateDispatchSheetCsv(date, user);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="dispatch-sheet-${date}.csv"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed.' },
      { status: 400 }
    );
  }
}

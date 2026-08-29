import { NextResponse } from 'next/server';
import { getCurrentUser, listTechnicians } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const technicians = listTechnicians();
  return NextResponse.json({ technicians });
}

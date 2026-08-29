import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRunningLateAlerts } from '@/lib/jobs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = getRunningLateAlerts(user);
  return NextResponse.json({ alerts, count: alerts.length });
}

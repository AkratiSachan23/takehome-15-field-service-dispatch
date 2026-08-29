export interface TimeWindow {
  start: Date;
  end: Date;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  endTimeFormatted: string;
}

/**
 * Parses scheduled date, start time, and duration into start/end dates.
 */
export function calculateTimeWindow(
  scheduledDate: string,
  startTime: string,
  durationMinutes: number
): TimeWindow {
  const [year, month, day] = scheduledDate.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const endHours = String(end.getHours()).padStart(2, '0');
  const endMins = String(end.getMinutes()).padStart(2, '0');
  const endTimeFormatted = `${endHours}:${endMins}`;

  return {
    start,
    end,
    scheduledDate,
    startTime,
    durationMinutes,
    endTimeFormatted,
  };
}

/**
 * Checks if two time windows [startA, endA) and [startB, endB) overlap.
 * Touching boundaries (e.g. A ends at 10:00, B starts at 10:00) do NOT overlap.
 */
export function doWindowsOverlap(windowA: TimeWindow, windowB: TimeWindow): boolean {
  return windowA.start.getTime() < windowB.end.getTime() && windowA.end.getTime() > windowB.start.getTime();
}

/**
 * Returns the unique window fingerprint used for tracking dismissed alerts.
 */
export function getWindowFingerprint(
  scheduledDate: string,
  startTime: string,
  durationMinutes: number
): string {
  return `${scheduledDate}_${startTime}_${durationMinutes}`;
}

/**
 * Checks if a job is currently running late.
 * Rule: A job still short of Completed once its scheduled window has passed counts as running late.
 */
export function isJobRunningLate(
  status: string,
  scheduledDate: string,
  startTime: string,
  durationMinutes: number,
  now: Date = new Date()
): boolean {
  if (status === 'COMPLETED') {
    return false;
  }
  const window = calculateTimeWindow(scheduledDate, startTime, durationMinutes);
  return now.getTime() > window.end.getTime();
}

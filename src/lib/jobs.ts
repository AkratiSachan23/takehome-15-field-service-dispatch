import { getDb } from './db';
import { calculateTimeWindow, doWindowsOverlap, getWindowFingerprint, isJobRunningLate, TimeWindow } from './scheduling';
import { 
  Job, 
  JobFilterParams, 
  PaginatedJobsResponse, 
  User, 
  JobStatus, 
  PartUsed, 
  JobTimelineEvent, 
  JobNote, 
  BulkAssignResponse, 
  BulkAssignItemResult, 
  DashboardStats, 
  AlertJob 
} from './types';

// Helper to log an immutable timeline event
export function logTimelineEvent(
  jobId: number,
  eventType: JobTimelineEvent['event_type'],
  actorId: number,
  details: Record<string, unknown>
): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO job_timeline (job_id, event_type, actor_id, details, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(jobId, eventType, actorId, JSON.stringify(details));
}

// Get full details of a single job
export function getJobById(jobId: number, user?: User): Job | null {
  const db = getDb();
  const job = db.prepare(`
    SELECT j.*, u.name as created_by_name
    FROM jobs j
    LEFT JOIN users u ON j.created_by = u.id
    WHERE j.id = ?
  `).get(jobId) as Job | undefined;

  if (!job) return null;

  // Authorization check: Technicians can ONLY see jobs assigned to them
  if (user && user.role === 'TECHNICIAN') {
    const isAssigned = db.prepare(`
      SELECT 1 FROM job_assignments WHERE job_id = ? AND user_id = ?
    `).get(jobId, user.id);

    if (!isAssigned) {
      return null;
    }
  }

  // Assigned Technicians
  const assignedTechnicians = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.created_at
    FROM job_assignments ja
    JOIN users u ON ja.user_id = u.id
    WHERE ja.job_id = ?
    ORDER BY u.name ASC
  `).all(jobId) as User[];

  // Parts Used
  const partsUsed = db.prepare(`
    SELECT p.*, u.name as recorded_by_name
    FROM parts_used p
    JOIN users u ON p.recorded_by = u.id
    WHERE p.job_id = ?
    ORDER BY p.recorded_at ASC
  `).all(jobId) as PartUsed[];

  // Timeline
  const timeline = db.prepare(`
    SELECT t.*, u.name as actor_name, u.role as actor_role
    FROM job_timeline t
    JOIN users u ON t.actor_id = u.id
    WHERE t.job_id = ?
    ORDER BY t.created_at ASC, t.id ASC
  `).all(jobId) as JobTimelineEvent[];

  // Notes
  const notes = db.prepare(`
    SELECT n.*, u.name as author_name
    FROM job_notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.job_id = ?
    ORDER BY n.created_at ASC
  `).all(jobId) as JobNote[];

  const timeWindow = calculateTimeWindow(job.scheduled_date, job.start_time, job.estimated_duration);
  const isLate = isJobRunningLate(job.status, job.scheduled_date, job.start_time, job.estimated_duration);

  return {
    ...job,
    assigned_technicians: assignedTechnicians,
    parts_used: partsUsed,
    timeline,
    notes,
    end_time: timeWindow.endTimeFormatted,
    is_running_late: isLate,
  };
}

// Find schedule conflicts for a technician
export function findTechnicianConflicts(
  technicianId: number,
  scheduledDate: string,
  startTime: string,
  durationMinutes: number,
  excludeJobId?: number
): { hasConflict: boolean; conflictingJob?: Job; message?: string } {
  const db = getDb();
  const targetWindow = calculateTimeWindow(scheduledDate, startTime, durationMinutes);

  // Find all active (non-completed) jobs assigned to this technician
  let query = `
    SELECT j.*, u.name as created_by_name
    FROM jobs j
    JOIN job_assignments ja ON j.id = ja.job_id
    LEFT JOIN users u ON j.created_by = u.id
    WHERE ja.user_id = ? 
      AND j.status != 'COMPLETED'
      AND j.is_archived = 0
  `;
  const params: unknown[] = [technicianId];

  if (excludeJobId) {
    query += ` AND j.id != ?`;
    params.push(excludeJobId);
  }

  const assignedJobs = db.prepare(query).all(...params) as Job[];

  for (const job of assignedJobs) {
    const jobWindow = calculateTimeWindow(job.scheduled_date, job.start_time, job.estimated_duration);
    if (doWindowsOverlap(targetWindow, jobWindow)) {
      const tech = db.prepare('SELECT name FROM users WHERE id = ?').get(technicianId) as { name: string } | undefined;
      const techName = tech ? tech.name : `Technician #${technicianId}`;
      return {
        hasConflict: true,
        conflictingJob: job,
        message: `${techName} is already assigned to Job #${job.id} (${job.customer_name}) scheduled on ${job.scheduled_date} from ${job.start_time} to ${jobWindow.endTimeFormatted}.`,
      };
    }
  }

  return { hasConflict: false };
}

// Create a new job
export function createJob(
  data: {
    customer_name: string;
    site_address: string;
    description: string;
    priority: Job['priority'];
    scheduled_date: string;
    start_time: string;
    estimated_duration: number;
  },
  user: User
): Job {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can create jobs.');
  }

  if (!data.customer_name?.trim()) throw new Error('Customer name is required.');
  if (!data.site_address?.trim()) throw new Error('Site address is required.');
  if (!data.description?.trim()) throw new Error('Description is required.');
  if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority)) {
    throw new Error('Invalid priority level.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.scheduled_date)) {
    throw new Error('Scheduled date must be in YYYY-MM-DD format.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.start_time)) {
    throw new Error('Start time must be in HH:MM format.');
  }
  if (typeof data.estimated_duration !== 'number' || data.estimated_duration <= 0) {
    throw new Error('Estimated duration must be a positive number of minutes.');
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO jobs (
      customer_name, site_address, description, priority, 
      scheduled_date, start_time, estimated_duration, 
      status, is_archived, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNASSIGNED', 0, ?, datetime('now'), datetime('now'))
  `);

  const result = insert.run(
    data.customer_name.trim(),
    data.site_address.trim(),
    data.description.trim(),
    data.priority,
    data.scheduled_date,
    data.start_time,
    data.estimated_duration,
    user.id
  );

  const jobId = Number(result.lastInsertRowid);

  logTimelineEvent(jobId, 'CREATED', user.id, {
    customer_name: data.customer_name,
    site_address: data.site_address,
    priority: data.priority,
    scheduled_date: data.scheduled_date,
    start_time: data.start_time,
    estimated_duration: data.estimated_duration,
  });

  return getJobById(jobId)!;
}

// Edit job details
export function updateJob(
  jobId: number,
  data: {
    customer_name?: string;
    site_address?: string;
    description?: string;
    priority?: Job['priority'];
    scheduled_date?: string;
    start_time?: string;
    estimated_duration?: number;
  },
  user: User
): Job {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can edit jobs.');
  }

  const currentJob = getJobById(jobId);
  if (!currentJob) throw new Error('Job not found.');

  const customer_name = data.customer_name !== undefined ? data.customer_name.trim() : currentJob.customer_name;
  const site_address = data.site_address !== undefined ? data.site_address.trim() : currentJob.site_address;
  const description = data.description !== undefined ? data.description.trim() : currentJob.description;
  const priority = data.priority !== undefined ? data.priority : currentJob.priority;
  const scheduled_date = data.scheduled_date !== undefined ? data.scheduled_date : currentJob.scheduled_date;
  const start_time = data.start_time !== undefined ? data.start_time : currentJob.start_time;
  const estimated_duration = data.estimated_duration !== undefined ? data.estimated_duration : currentJob.estimated_duration;

  if (!customer_name) throw new Error('Customer name is required.');
  if (!site_address) throw new Error('Site address is required.');
  if (!description) throw new Error('Description is required.');
  if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) throw new Error('Invalid priority level.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduled_date)) throw new Error('Scheduled date must be YYYY-MM-DD.');
  if (!/^\d{2}:\d{2}$/.test(start_time)) throw new Error('Start time must be HH:MM.');
  if (typeof estimated_duration !== 'number' || estimated_duration <= 0) throw new Error('Estimated duration must be positive.');

  // If the schedule window changed and there are assigned technicians, verify no conflict
  const scheduleChanged = 
    scheduled_date !== currentJob.scheduled_date ||
    start_time !== currentJob.start_time ||
    estimated_duration !== currentJob.estimated_duration;

  if (scheduleChanged && currentJob.assigned_technicians && currentJob.assigned_technicians.length > 0) {
    for (const tech of currentJob.assigned_technicians) {
      const conflict = findTechnicianConflicts(tech.id, scheduled_date, start_time, estimated_duration, jobId);
      if (conflict.hasConflict) {
        throw new Error(`Cannot reschedule: ${conflict.message}`);
      }
    }
  }

  const db = getDb();
  db.prepare(`
    UPDATE jobs
    SET customer_name = ?, site_address = ?, description = ?, priority = ?,
        scheduled_date = ?, start_time = ?, estimated_duration = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    customer_name,
    site_address,
    description,
    priority,
    scheduled_date,
    start_time,
    estimated_duration,
    jobId
  );

  const changes: Record<string, unknown> = {};
  if (customer_name !== currentJob.customer_name) changes.customer_name = { old: currentJob.customer_name, new: customer_name };
  if (site_address !== currentJob.site_address) changes.site_address = { old: currentJob.site_address, new: site_address };
  if (description !== currentJob.description) changes.description = { old: currentJob.description, new: description };
  if (priority !== currentJob.priority) changes.priority = { old: currentJob.priority, new: priority };
  if (scheduleChanged) {
    changes.schedule = {
      old: `${currentJob.scheduled_date} ${currentJob.start_time} (${currentJob.estimated_duration}m)`,
      new: `${scheduled_date} ${start_time} (${estimated_duration}m)`,
    };
  }

  logTimelineEvent(jobId, 'EDITED', user.id, changes);

  return getJobById(jobId)!;
}

// Archive or restore a job
export function setJobArchived(jobId: number, isArchived: boolean, user: User): Job {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can archive or restore jobs.');
  }

  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');

  const db = getDb();
  db.prepare(`
    UPDATE jobs SET is_archived = ?, updated_at = datetime('now') WHERE id = ?
  `).run(isArchived ? 1 : 0, jobId);

  logTimelineEvent(jobId, isArchived ? 'ARCHIVED' : 'RESTORED', user.id, {
    action: isArchived ? 'archived' : 'restored',
  });

  return getJobById(jobId)!;
}

// Assign a technician to a job
export function assignTechnicianToJob(jobId: number, technicianId: number, user: User): Job {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can assign technicians.');
  }

  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');
  if (job.status === 'COMPLETED') throw new Error('Cannot assign technician to a completed job.');

  const db = getDb();
  const tech = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'TECHNICIAN'").get(technicianId) as User | undefined;
  if (!tech) throw new Error('Technician not found or user is not a technician.');

  // Check if already assigned
  const existing = db.prepare('SELECT 1 FROM job_assignments WHERE job_id = ? AND user_id = ?').get(jobId, technicianId);
  if (existing) {
    return job; // already assigned
  }

  // Conflict check across all other active assigned jobs for this technician
  const conflict = findTechnicianConflicts(technicianId, job.scheduled_date, job.start_time, job.estimated_duration, jobId);
  if (conflict.hasConflict) {
    throw new Error(`Assignment refused: ${conflict.message}`);
  }

  // Execute assignment in a transaction
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO job_assignments (job_id, user_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(jobId, technicianId, user.id);

    let newStatus = job.status;
    if (job.status === 'UNASSIGNED') {
      newStatus = 'ASSIGNED';
      db.prepare(`
        UPDATE jobs SET status = 'ASSIGNED', updated_at = datetime('now') WHERE id = ?
      `).run(jobId);
    }

    logTimelineEvent(jobId, 'ASSIGNED', user.id, {
      technician_id: technicianId,
      technician_name: tech.name,
      old_status: job.status,
      new_status: newStatus,
    });
  });

  transaction();
  return getJobById(jobId)!;
}

// Unassign a technician from a job
export function unassignTechnicianFromJob(jobId: number, technicianId: number, user: User): Job {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can remove technician assignments.');
  }

  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');

  const db = getDb();
  const tech = db.prepare('SELECT name FROM users WHERE id = ?').get(technicianId) as { name: string } | undefined;
  const techName = tech ? tech.name : `Technician #${technicianId}`;

  const transaction = db.transaction(() => {
    db.prepare(`
      DELETE FROM job_assignments WHERE job_id = ? AND user_id = ?
    `).run(jobId, technicianId);

    // Check remaining assignments
    const remaining = db.prepare(`
      SELECT COUNT(*) as count FROM job_assignments WHERE job_id = ?
    `).get(jobId) as { count: number };

    let newStatus = job.status;
    if (remaining.count === 0 && job.status === 'ASSIGNED') {
      newStatus = 'UNASSIGNED';
      db.prepare(`
        UPDATE jobs SET status = 'UNASSIGNED', updated_at = datetime('now') WHERE id = ?
      `).run(jobId);
    }

    logTimelineEvent(jobId, 'UNASSIGNED', user.id, {
      technician_id: technicianId,
      technician_name: techName,
      remaining_technicians: remaining.count,
      old_status: job.status,
      new_status: newStatus,
    });
  });

  transaction();
  return getJobById(jobId)!;
}

// Bulk assign jobs to a technician
export function bulkAssignJobs(
  jobIds: number[],
  technicianId: number,
  user: User
): BulkAssignResponse {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can perform bulk assignments.');
  }

  const db = getDb();
  const tech = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'TECHNICIAN'").get(technicianId) as User | undefined;
  if (!tech) throw new Error('Technician not found or user is not a technician.');

  const results: BulkAssignItemResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // We process jobs sequentially to ensure we detect conflicts within the batch itself
  for (const jobId of jobIds) {
    const job = getJobById(jobId);
    if (!job) {
      failureCount++;
      results.push({ jobId, customerName: 'Unknown', success: false, error: 'Job not found.' });
      continue;
    }

    if (job.status === 'COMPLETED') {
      failureCount++;
      results.push({ jobId, customerName: job.customer_name, success: false, error: 'Job is already completed.' });
      continue;
    }

    // Check conflict against existing technician schedule (which updates with every success in this loop)
    const conflict = findTechnicianConflicts(technicianId, job.scheduled_date, job.start_time, job.estimated_duration, jobId);
    if (conflict.hasConflict) {
      failureCount++;
      results.push({
        jobId,
        customerName: job.customer_name,
        success: false,
        error: `Schedule conflict: ${conflict.message}`,
      });
      continue;
    }

    try {
      assignTechnicianToJob(jobId, technicianId, user);
      successCount++;
      results.push({
        jobId,
        customerName: job.customer_name,
        success: true,
      });
    } catch (err: unknown) {
      failureCount++;
      results.push({
        jobId,
        customerName: job.customer_name,
        success: false,
        error: err instanceof Error ? err.message : 'Assignment failed.',
      });
    }
  }

  return {
    totalRequested: jobIds.length,
    successCount,
    failureCount,
    results,
  };
}

// Update Job Status
export function updateJobStatus(
  jobId: number,
  newStatus: JobStatus,
  user: User,
  completionData?: { completionNote?: string }
): Job {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');

  // Role & Authorization Check
  if (user.role === 'TECHNICIAN') {
    // Technician can only update jobs assigned to them
    const isAssigned = (job.assigned_technicians || []).some(t => t.id === user.id);
    if (!isAssigned) {
      throw new Error('Forbidden: You can only update jobs assigned to you.');
    }
  }

  const currentStatus = job.status;

  if (currentStatus === newStatus) {
    return job; // No-op
  }

  // Validate state transitions
  // Rule: Unassigned -> Assigned -> En Route -> On Site -> Completed
  if (currentStatus === 'UNASSIGNED') {
    if (newStatus === 'ASSIGNED') {
      // Allowed if assigned
      if (!job.assigned_technicians || job.assigned_technicians.length === 0) {
        throw new Error('Cannot transition to Assigned without assigning a technician.');
      }
    } else {
      throw new Error(`Illegal status transition from ${currentStatus} to ${newStatus}. Assign a technician first.`);
    }
  } else if (currentStatus === 'ASSIGNED') {
    if (newStatus !== 'EN_ROUTE') {
      throw new Error(`Illegal status transition from ${currentStatus} to ${newStatus}. Job must proceed to 'En Route' next.`);
    }
  } else if (currentStatus === 'EN_ROUTE') {
    if (newStatus !== 'ON_SITE') {
      throw new Error(`Illegal status transition from ${currentStatus} to ${newStatus}. Job must proceed to 'On Site' next.`);
    }
  } else if (currentStatus === 'ON_SITE') {
    if (newStatus !== 'COMPLETED') {
      throw new Error(`Illegal status transition from ${currentStatus} to ${newStatus}. Job can only transition to 'Completed'.`);
    }

    // Completing requires completion note and at least one part used
    const note = completionData?.completionNote?.trim();
    if (!note) {
      throw new Error('Completing a job requires a completion note describing the work done.');
    }

    const db = getDb();
    const partsCount = db.prepare('SELECT COUNT(*) as count FROM parts_used WHERE job_id = ?').get(jobId) as { count: number };
    if (partsCount.count < 1) {
      throw new Error('Completing a job requires at least one part used to be recorded.');
    }

    // Execute completion
    db.prepare(`
      UPDATE jobs 
      SET status = 'COMPLETED', completion_note = ?, completed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(note, jobId);

    logTimelineEvent(jobId, 'COMPLETED', user.id, {
      old_status: currentStatus,
      new_status: 'COMPLETED',
      completion_note: note,
      parts_recorded_count: partsCount.count,
    });

    return getJobById(jobId)!;
  } else if (currentStatus === 'COMPLETED') {
    throw new Error('Job is already completed and its status cannot be changed.');
  }

  // Generic status update for other valid transitions
  const db = getDb();
  db.prepare(`
    UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newStatus, jobId);

  logTimelineEvent(jobId, 'STATUS_CHANGE', user.id, {
    old_status: currentStatus,
    new_status: newStatus,
  });

  return getJobById(jobId)!;
}

// Add Part Used
export function addPartUsed(
  jobId: number,
  partName: string,
  quantity: number,
  user: User
): PartUsed {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');

  if (job.status === 'COMPLETED') {
    throw new Error('Cannot add parts to a completed job.');
  }

  if (user.role === 'TECHNICIAN') {
    const isAssigned = (job.assigned_technicians || []).some(t => t.id === user.id);
    if (!isAssigned) {
      throw new Error('Forbidden: You can only record parts for jobs assigned to you.');
    }
  }

  if (!partName?.trim()) throw new Error('Part name is required.');
  if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error('Part quantity must be a positive integer.');
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO parts_used (job_id, part_name, quantity, recorded_by, recorded_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const result = insert.run(jobId, partName.trim(), quantity, user.id);
  const partId = Number(result.lastInsertRowid);

  logTimelineEvent(jobId, 'PART_ADDED', user.id, {
    part_id: partId,
    part_name: partName.trim(),
    quantity,
  });

  return db.prepare(`
    SELECT p.*, u.name as recorded_by_name
    FROM parts_used p
    JOIN users u ON p.recorded_by = u.id
    WHERE p.id = ?
  `).get(partId) as PartUsed;
}

// Add Note
export function addJobNote(jobId: number, note: string, user: User): JobNote {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found.');

  if (user.role === 'TECHNICIAN') {
    const isAssigned = (job.assigned_technicians || []).some(t => t.id === user.id);
    if (!isAssigned) {
      throw new Error('Forbidden: You can only add notes to jobs assigned to you.');
    }
  }

  if (!note?.trim()) throw new Error('Note text cannot be empty.');

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO job_notes (job_id, author_id, note, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  const result = insert.run(jobId, user.id, note.trim());
  const noteId = Number(result.lastInsertRowid);

  logTimelineEvent(jobId, 'NOTE_ADDED', user.id, {
    note_id: noteId,
    preview: note.trim().slice(0, 100),
  });

  return db.prepare(`
    SELECT n.*, u.name as author_name
    FROM job_notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `).get(noteId) as JobNote;
}

// Server-side filtering, searching, sorting, and pagination
export function listJobs(params: JobFilterParams, user?: User): PaginatedJobsResponse {
  const db = getDb();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const sqlParams: unknown[] = [];

  // Archived filter
  if (params.includeArchived) {
    // Show both archived and non-archived or only archived? Usually includeArchived = 1 means show archived, otherwise show active
    conditions.push('j.is_archived = 1');
  } else {
    conditions.push('j.is_archived = 0');
  }

  // Role check: Technician can ONLY see their assigned jobs
  if (user && user.role === 'TECHNICIAN') {
    conditions.push('EXISTS (SELECT 1 FROM job_assignments ja WHERE ja.job_id = j.id AND ja.user_id = ?)');
    sqlParams.push(user.id);
  } else if (params.technicianId) {
    conditions.push('EXISTS (SELECT 1 FROM job_assignments ja WHERE ja.job_id = j.id AND ja.user_id = ?)');
    sqlParams.push(params.technicianId);
  }

  // Status filter
  if (params.status && params.status !== 'ALL') {
    conditions.push('j.status = ?');
    sqlParams.push(params.status);
  }

  // Scheduled date filter
  if (params.scheduledDate) {
    conditions.push('j.scheduled_date = ?');
    sqlParams.push(params.scheduledDate);
  }

  // Search filter over customer name and site address
  if (params.search && params.search.trim()) {
    conditions.push('(j.customer_name LIKE ? OR j.site_address LIKE ?)');
    const searchTerm = `%${params.search.trim()}%`;
    sqlParams.push(searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let orderBy = 'j.scheduled_date ASC, j.start_time ASC';
  const sortOrder = params.sortOrder === 'desc' ? 'DESC' : 'ASC';

  if (params.sortBy === 'priority') {
    // Custom order for priority
    orderBy = `CASE j.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 END ${sortOrder}`;
  } else if (params.sortBy === 'status') {
    orderBy = `j.status ${sortOrder}`;
  } else if (params.sortBy === 'created_at') {
    orderBy = `j.created_at ${sortOrder}`;
  } else if (params.sortBy === 'scheduled_date') {
    orderBy = `j.scheduled_date ${sortOrder}, j.start_time ${sortOrder}`;
  }

  // Total count
  const countRow = db.prepare(`
    SELECT COUNT(*) as total
    FROM jobs j
    ${whereClause}
  `).get(...sqlParams) as { total: number };

  const total = countRow ? countRow.total : 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Query paginated jobs
  const jobsQuery = `
    SELECT j.*, u.name as created_by_name
    FROM jobs j
    LEFT JOIN users u ON j.created_by = u.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const rawJobs = db.prepare(jobsQuery).all(...sqlParams, pageSize, offset) as Job[];

  // Attach technicians and computed fields
  const jobs: Job[] = rawJobs.map(job => {
    const assignedTechnicians = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.created_at
      FROM job_assignments ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_id = ?
      ORDER BY u.name ASC
    `).all(job.id) as User[];

    const timeWindow = calculateTimeWindow(job.scheduled_date, job.start_time, job.estimated_duration);
    const isLate = isJobRunningLate(job.status, job.scheduled_date, job.start_time, job.estimated_duration);

    return {
      ...job,
      assigned_technicians: assignedTechnicians,
      end_time: timeWindow.endTimeFormatted,
      is_running_late: isLate,
    };
  });

  return {
    jobs,
    total,
    page,
    pageSize,
    totalPages,
  };
}

// Running Late Alerts
export function getRunningLateAlerts(user: User): AlertJob[] {
  // Only dispatchers manage late alerts, but technicians can see late state
  const db = getDb();
  const now = new Date();

  // Find all active uncompleted jobs
  const jobs = db.prepare(`
    SELECT j.*, u.name as created_by_name
    FROM jobs j
    LEFT JOIN users u ON j.created_by = u.id
    WHERE j.is_archived = 0 AND j.status != 'COMPLETED'
  `).all() as Job[];

  const alerts: AlertJob[] = [];

  for (const job of jobs) {
    if (isJobRunningLate(job.status, job.scheduled_date, job.start_time, job.estimated_duration, now)) {
      const fingerprint = getWindowFingerprint(job.scheduled_date, job.start_time, job.estimated_duration);
      
      // Check if dismissed for this exact window
      const dismissed = db.prepare(`
        SELECT 1 FROM dismissed_alerts WHERE job_id = ? AND window_fingerprint = ?
      `).get(job.id, fingerprint);

      if (!dismissed) {
        const window = calculateTimeWindow(job.scheduled_date, job.start_time, job.estimated_duration);
        const delayMs = now.getTime() - window.end.getTime();
        const delayMinutes = Math.floor(delayMs / 60000);

        const assignedTechnicians = db.prepare(`
          SELECT u.id, u.email, u.name, u.role, u.created_at
          FROM job_assignments ja
          JOIN users u ON ja.user_id = u.id
          WHERE ja.job_id = ?
        `).all(job.id) as User[];

        alerts.push({
          ...job,
          assigned_technicians: assignedTechnicians,
          window_fingerprint: fingerprint,
          scheduled_end_iso: window.end.toISOString(),
          delay_minutes: delayMinutes,
          end_time: window.endTimeFormatted,
          is_running_late: true,
        });
      }
    }
  }

  // Sort by highest delay first
  alerts.sort((a, b) => b.delay_minutes - a.delay_minutes);

  return alerts;
}

// Dismiss Alert
export function dismissAlert(jobId: number, windowFingerprint: string, user: User): void {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can dismiss alerts.');
  }

  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO dismissed_alerts (job_id, window_fingerprint, dismissed_by, dismissed_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(jobId, windowFingerprint, user.id);
}

// Dashboard statistics
export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Jobs scheduled today (active)
  const scheduledTodayRow = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE scheduled_date = ? AND is_archived = 0
  `).get(today) as { count: number };

  // Jobs completed today
  const completedTodayRow = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE status = 'COMPLETED' AND date(completed_at) = date('now')
  `).get() as { count: number };

  // Unassigned jobs
  const unassignedRow = db.prepare(`
    SELECT COUNT(*) as count FROM jobs WHERE status = 'UNASSIGNED' AND is_archived = 0
  `).get() as { count: number };

  // Running late jobs
  const lateAlerts = getRunningLateAlerts({ id: 0, email: '', name: '', role: 'DISPATCHER', created_at: '' });

  // Status breakdown
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM jobs 
    WHERE is_archived = 0 
    GROUP BY status
  `).all() as Array<{ status: JobStatus; count: number }>;

  const statusBreakdown: DashboardStats['statusBreakdown'] = {
    UNASSIGNED: 0,
    ASSIGNED: 0,
    EN_ROUTE: 0,
    ON_SITE: 0,
    COMPLETED: 0,
  };

  for (const row of statusRows) {
    if (statusBreakdown[row.status] !== undefined) {
      statusBreakdown[row.status] = row.count;
    }
  }

  // Technician breakdown
  const technicians = db.prepare("SELECT id, name FROM users WHERE role = 'TECHNICIAN' ORDER BY name ASC").all() as Array<{ id: number; name: string }>;

  const technicianBreakdown = technicians.map(tech => {
    const assignedCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM job_assignments ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ? AND j.is_archived = 0
    `).get(tech.id) as { count: number };

    const activeCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM job_assignments ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ? AND j.is_archived = 0 AND j.status IN ('ASSIGNED', 'EN_ROUTE', 'ON_SITE')
    `).get(tech.id) as { count: number };

    const completedCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM job_assignments ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ? AND j.is_archived = 0 AND j.status = 'COMPLETED'
    `).get(tech.id) as { count: number };

    return {
      id: tech.id,
      name: tech.name,
      assignedCount: assignedCountRow.count,
      activeCount: activeCountRow.count,
      completedCount: completedCountRow.count,
    };
  });

  // Completion history 14 days
  const completionHistory14Days: Array<{ date: string; completedCount: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const countRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE status = 'COMPLETED' AND date(completed_at) = ?
    `).get(dateStr) as { count: number };

    completionHistory14Days.push({
      date: dateStr,
      completedCount: countRow.count,
    });
  }

  return {
    jobsScheduledToday: scheduledTodayRow.count,
    jobsCompletedToday: completedTodayRow.count,
    jobsRunningLate: lateAlerts.length,
    unassignedJobs: unassignedRow.count,
    statusBreakdown,
    technicianBreakdown,
    completionHistory14Days,
  };
}

// Generate CSV Dispatch Sheet
export function generateDispatchSheetCsv(scheduledDate: string, user: User): string {
  if (user.role !== 'DISPATCHER') {
    throw new Error('Unauthorized: Only dispatchers can export dispatch sheets.');
  }

  const db = getDb();
  const jobs = db.prepare(`
    SELECT j.*
    FROM jobs j
    WHERE j.scheduled_date = ? AND j.is_archived = 0
    ORDER BY j.start_time ASC, j.id ASC
  `).all(scheduledDate) as Job[];

  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const headers = [
    'Job ID',
    'Customer Name',
    'Site Address',
    'Assigned Technicians',
    'Scheduled Window',
    'Duration (Minutes)',
    'Priority',
    'Status',
    'Description',
    'Parts Count'
  ];

  const rows = [headers.join(',')];

  for (const job of jobs) {
    const techRows = db.prepare(`
      SELECT u.name
      FROM job_assignments ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_id = ?
      ORDER BY u.name ASC
    `).all(job.id) as Array<{ name: string }>;

    const techs = techRows.map(t => t.name).join('; ') || 'Unassigned';
    const timeWindow = calculateTimeWindow(job.scheduled_date, job.start_time, job.estimated_duration);
    const windowFormatted = `${job.start_time} - ${timeWindow.endTimeFormatted}`;

    const partsRow = db.prepare(`
      SELECT COUNT(*) as count FROM parts_used WHERE job_id = ?
    `).get(job.id) as { count: number };

    rows.push([
      escapeCsv(job.id),
      escapeCsv(job.customer_name),
      escapeCsv(job.site_address),
      escapeCsv(techs),
      escapeCsv(windowFormatted),
      escapeCsv(job.estimated_duration),
      escapeCsv(job.priority),
      escapeCsv(job.status),
      escapeCsv(job.description),
      escapeCsv(partsRow.count),
    ].join(','));
  }

  return rows.join('\r\n');
}

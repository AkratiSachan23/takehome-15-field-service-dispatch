import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from '../src/lib/db';
import { 
  createJob, 
  updateJob, 
  setJobArchived, 
  assignTechnicianToJob, 
  unassignTechnicianFromJob, 
  bulkAssignJobs, 
  updateJobStatus, 
  addPartUsed, 
  addJobNote, 
  listJobs, 
  getJobById, 
  getRunningLateAlerts, 
  dismissAlert, 
  generateDispatchSheetCsv 
} from '../src/lib/jobs';
import { calculateTimeWindow, doWindowsOverlap, isJobRunningLate } from '../src/lib/scheduling';
import { User } from '../src/lib/types';
import bcrypt from 'bcryptjs';

// Setup in-memory test database for clean isolation
let testDb: Database.Database;

const mockDispatcher: User = {
  id: 1,
  email: 'dispatcher@example.com',
  name: 'Sarah Dispatcher',
  role: 'DISPATCHER',
  created_at: new Date().toISOString(),
};

const mockTechnician1: User = {
  id: 2,
  email: 'alex@example.com',
  name: 'Alex Rivera',
  role: 'TECHNICIAN',
  created_at: new Date().toISOString(),
};

const mockTechnician2: User = {
  id: 3,
  email: 'jordan@example.com',
  name: 'Jordan Lee',
  role: 'TECHNICIAN',
  created_at: new Date().toISOString(),
};

describe('Field Service Dispatch System', () => {
  beforeEach(async () => {
    process.env.DATABASE_PATH = ':memory:';
    // We re-import getDb or use SQLite directly
    const dbModule = await import('../src/lib/db');
    dbModule.closeDb();
    testDb = dbModule.getDb();

    // Insert mock users
    const hash = await bcrypt.hash('password123', 4);
    testDb.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES 
        (1, 'dispatcher@example.com', ?, 'Sarah Dispatcher', 'DISPATCHER'),
        (2, 'alex@example.com', ?, 'Alex Rivera', 'TECHNICIAN'),
        (3, 'jordan@example.com', ?, 'Jordan Lee', 'TECHNICIAN')
    `).run(hash, hash, hash);
  });

  afterEach(async () => {
    const dbModule = await import('../src/lib/db');
    dbModule.closeDb();
  });

  describe('1. Accounts & Role Enforcement (Server-side)', () => {
    it('allows dispatchers to create jobs and denies technicians', () => {
      // Dispatcher can create
      const job = createJob(
        {
          customer_name: 'Acme Corp',
          site_address: '123 Main St',
          description: 'Fix AC unit',
          priority: 'HIGH',
          scheduled_date: '2026-09-01',
          start_time: '09:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );
      expect(job.id).toBeDefined();
      expect(job.status).toBe('UNASSIGNED');

      // Technician cannot create
      expect(() => {
        createJob(
          {
            customer_name: 'Beta LLC',
            site_address: '456 Elm St',
            description: 'Fix sink',
            priority: 'LOW',
            scheduled_date: '2026-09-01',
            start_time: '10:00',
            estimated_duration: 30,
          },
          mockTechnician1
        );
      }).toThrow(/Unauthorized/);
    });

    it('technicians cannot archive jobs or assign technicians', () => {
      const job = createJob(
        {
          customer_name: 'Alpha Clinic',
          site_address: '789 Oak Ave',
          description: 'Pipe inspection',
          priority: 'MEDIUM',
          scheduled_date: '2026-09-01',
          start_time: '11:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      // Technician cannot archive
      expect(() => setJobArchived(job.id, true, mockTechnician1)).toThrow(/Unauthorized/);

      // Technician cannot assign
      expect(() => assignTechnicianToJob(job.id, mockTechnician1.id, mockTechnician1)).toThrow(/Unauthorized/);
    });

    it('technicians can only see and act on jobs assigned to them', () => {
      const job1 = createJob(
        {
          customer_name: 'Job for Tech 1',
          site_address: '101 Pine St',
          description: 'Heater check',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '08:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      const job2 = createJob(
        {
          customer_name: 'Job for Tech 2',
          site_address: '202 Maple St',
          description: 'Boiler tune',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '14:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      assignTechnicianToJob(job1.id, mockTechnician1.id, mockDispatcher);
      assignTechnicianToJob(job2.id, mockTechnician2.id, mockDispatcher);

      // Tech 1 querying their jobs sees only job1
      const tech1List = listJobs({}, mockTechnician1);
      expect(tech1List.jobs.length).toBe(1);
      expect(tech1List.jobs[0].id).toBe(job1.id);

      // Tech 1 cannot fetch job2 detail
      const job2Detail = getJobById(job2.id, mockTechnician1);
      expect(job2Detail).toBeNull();

      // Tech 1 cannot update status on job2
      expect(() => updateJobStatus(job2.id, 'EN_ROUTE', mockTechnician1)).toThrow(/Forbidden/);
    });
  });

  describe('2. Scheduling & Double-Booking / Conflict Prevention', () => {
    it('correctly calculates time windows and overlapping intervals', () => {
      const w1 = calculateTimeWindow('2026-09-01', '09:00', 60); // 09:00 - 10:00
      const w2 = calculateTimeWindow('2026-09-01', '09:30', 60); // 09:30 - 10:30 (overlaps w1)
      const w3 = calculateTimeWindow('2026-09-01', '10:00', 60); // 10:00 - 11:00 (touching boundary: no overlap)
      const w4 = calculateTimeWindow('2026-09-02', '09:00', 60); // different date: no overlap

      expect(doWindowsOverlap(w1, w2)).toBe(true);
      expect(doWindowsOverlap(w1, w3)).toBe(false);
      expect(doWindowsOverlap(w1, w4)).toBe(false);
    });

    it('refuses technician assignment if scheduled window overlaps an existing job', () => {
      const job1 = createJob(
        {
          customer_name: 'Morning Job',
          site_address: '100 Beach St',
          description: 'AC Service',
          priority: 'MEDIUM',
          scheduled_date: '2026-09-01',
          start_time: '09:00',
          estimated_duration: 90, // 09:00 to 10:30
        },
        mockDispatcher
      );

      const job2 = createJob(
        {
          customer_name: 'Overlapping Job',
          site_address: '200 Mountain Rd',
          description: 'Duct Cleaning',
          priority: 'HIGH',
          scheduled_date: '2026-09-01',
          start_time: '10:00', // 10:00 to 11:00 (overlaps job1!)
          estimated_duration: 60,
        },
        mockDispatcher
      );

      // Assign tech 1 to Job 1 (succeeds)
      assignTechnicianToJob(job1.id, mockTechnician1.id, mockDispatcher);

      // Assign tech 1 to Job 2 (must be refused by server)
      expect(() => {
        assignTechnicianToJob(job2.id, mockTechnician1.id, mockDispatcher);
      }).toThrow(/Assignment refused/);

      // Assign tech 2 to Job 2 (succeeds because tech 2 has no conflict)
      const assignedJob2 = assignTechnicianToJob(job2.id, mockTechnician2.id, mockDispatcher);
      expect(assignedJob2.status).toBe('ASSIGNED');
    });

    it('allows back-to-back jobs without overlap error', () => {
      const job1 = createJob(
        {
          customer_name: 'Slot 1',
          site_address: '100 Road A',
          description: 'Part 1',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '09:00',
          estimated_duration: 60, // 09:00 to 10:00
        },
        mockDispatcher
      );

      const job2 = createJob(
        {
          customer_name: 'Slot 2',
          site_address: '200 Road B',
          description: 'Part 2',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '10:00', // starts exactly when job1 finishes
          estimated_duration: 60,
        },
        mockDispatcher
      );

      assignTechnicianToJob(job1.id, mockTechnician1.id, mockDispatcher);
      const assigned2 = assignTechnicianToJob(job2.id, mockTechnician1.id, mockDispatcher);
      expect(assigned2.assigned_technicians?.some(t => t.id === mockTechnician1.id)).toBe(true);
    });

    it('rescheduling an assigned job checks conflict for assigned technicians', () => {
      const job1 = createJob(
        {
          customer_name: 'Job A',
          site_address: '100 A',
          description: 'Desc A',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '09:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      const job2 = createJob(
        {
          customer_name: 'Job B',
          site_address: '200 B',
          description: 'Desc B',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '14:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      assignTechnicianToJob(job1.id, mockTechnician1.id, mockDispatcher);
      assignTechnicianToJob(job2.id, mockTechnician1.id, mockDispatcher);

      // Try to reschedule Job 2 to overlap with Job 1 (09:30)
      expect(() => {
        updateJob(job2.id, { start_time: '09:30' }, mockDispatcher);
      }).toThrow(/Cannot reschedule/);
    });
  });

  describe('3. Job Lifecycle & Completion Prerequisites', () => {
    it('enforces exact sequence Unassigned -> Assigned -> En Route -> On Site -> Completed', () => {
      const job = createJob(
        {
          customer_name: 'Lifecycle Test',
          site_address: '333 Circle',
          description: 'Inspection',
          priority: 'MEDIUM',
          scheduled_date: '2026-09-01',
          start_time: '09:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      // Direct jump from Unassigned to On Site rejected
      expect(() => updateJobStatus(job.id, 'ON_SITE', mockDispatcher)).toThrow(/Illegal status transition/);

      // Assign technician moves to Assigned
      assignTechnicianToJob(job.id, mockTechnician1.id, mockDispatcher);
      let current = getJobById(job.id)!;
      expect(current.status).toBe('ASSIGNED');

      // Assigned to On Site directly rejected (must be En Route first)
      expect(() => updateJobStatus(job.id, 'ON_SITE', mockTechnician1)).toThrow(/Illegal status transition/);

      // Move to En Route
      updateJobStatus(job.id, 'EN_ROUTE', mockTechnician1);
      current = getJobById(job.id)!;
      expect(current.status).toBe('EN_ROUTE');

      // Move to On Site
      updateJobStatus(job.id, 'ON_SITE', mockTechnician1);
      current = getJobById(job.id)!;
      expect(current.status).toBe('ON_SITE');

      // Trying to complete without note or parts rejected
      expect(() => updateJobStatus(job.id, 'COMPLETED', mockTechnician1)).toThrow(/requires a completion note/);
      expect(() => updateJobStatus(job.id, 'COMPLETED', mockTechnician1, { completionNote: 'Fixed it' })).toThrow(/requires at least one part used/);

      // Add a part used
      addPartUsed(job.id, 'Capacitor 45uF', 1, mockTechnician1);

      // Complete with note and parts
      const completed = updateJobStatus(job.id, 'COMPLETED', mockTechnician1, { completionNote: 'Replaced faulty capacitor and tested compressor.' });
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completion_note).toBe('Replaced faulty capacitor and tested compressor.');
      expect(completed.completed_at).toBeDefined();

      // Completed job cannot have parts added or status modified
      expect(() => addPartUsed(job.id, 'Filter', 1, mockTechnician1)).toThrow(/Cannot add parts to a completed job/);
      expect(() => updateJobStatus(job.id, 'ON_SITE', mockDispatcher)).toThrow(/Job is already completed/);
    });

    it('unassigning all technicians from an Assigned job reverts status to Unassigned', () => {
      const job = createJob(
        {
          customer_name: 'Revert Test',
          site_address: '444 Square',
          description: 'Inspection',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '13:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      assignTechnicianToJob(job.id, mockTechnician1.id, mockDispatcher);
      expect(getJobById(job.id)!.status).toBe('ASSIGNED');

      unassignTechnicianFromJob(job.id, mockTechnician1.id, mockDispatcher);
      expect(getJobById(job.id)!.status).toBe('UNASSIGNED');
    });
  });

  describe('4. Bulk Assignment with Per-Job Error Reporting', () => {
    it('reports per-job success and refusal when some conflict', () => {
      // Create 3 unassigned jobs on the same day
      const job1 = createJob(
        {
          customer_name: 'Bulk 1 (Morning)',
          site_address: '101 Bulk Way',
          description: 'A',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '08:00',
          estimated_duration: 60, // 08:00 - 09:00
        },
        mockDispatcher
      );

      const job2 = createJob(
        {
          customer_name: 'Bulk 2 (Overlap with Bulk 1)',
          site_address: '102 Bulk Way',
          description: 'B',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '08:30', // 08:30 - 09:30 (overlaps job1)
          estimated_duration: 60,
        },
        mockDispatcher
      );

      const job3 = createJob(
        {
          customer_name: 'Bulk 3 (Afternoon)',
          site_address: '103 Bulk Way',
          description: 'C',
          priority: 'LOW',
          scheduled_date: '2026-09-01',
          start_time: '13:00', // 13:00 - 14:00 (no overlap)
          estimated_duration: 60,
        },
        mockDispatcher
      );

      const response = bulkAssignJobs([job1.id, job2.id, job3.id], mockTechnician1.id, mockDispatcher);

      expect(response.totalRequested).toBe(3);
      expect(response.successCount).toBe(2);
      expect(response.failureCount).toBe(1);

      // Job 1 succeeded
      const res1 = response.results.find(r => r.jobId === job1.id);
      expect(res1?.success).toBe(true);

      // Job 2 refused due to overlap with Job 1
      const res2 = response.results.find(r => r.jobId === job2.id);
      expect(res2?.success).toBe(false);
      expect(res2?.error).toContain('Schedule conflict');

      // Job 3 succeeded
      const res3 = response.results.find(r => r.jobId === job3.id);
      expect(res3?.success).toBe(true);
    });
  });

  describe('5. Running-Late Alerts & Dismissal Behavior', () => {
    it('detects running late jobs and handles dismissal with window-change reappearance', () => {
      // Create a job in the past
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const job = createJob(
        {
          customer_name: 'Overdue Job',
          site_address: '999 Past Way',
          description: 'Overdue service',
          priority: 'HIGH',
          scheduled_date: yesterday,
          start_time: '08:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      // Should appear in running late alerts
      let alerts = getRunningLateAlerts(mockDispatcher);
      const lateAlert = alerts.find(a => a.id === job.id);
      expect(lateAlert).toBeDefined();

      // Dismiss the alert for its current window fingerprint
      dismissAlert(job.id, lateAlert!.window_fingerprint, mockDispatcher);

      // Now it should NOT appear in alerts
      alerts = getRunningLateAlerts(mockDispatcher);
      expect(alerts.find(a => a.id === job.id)).toBeUndefined();

      // If scheduled window changes (e.g. rescheduled to yesterday 12:00)
      updateJob(job.id, { start_time: '12:00' }, mockDispatcher);

      // Because the window changed and passed again, the alert returns!
      alerts = getRunningLateAlerts(mockDispatcher);
      const returnedAlert = alerts.find(a => a.id === job.id);
      expect(returnedAlert).toBeDefined();
    });
  });

  describe('6. Immutable Audit Timeline', () => {
    it('preserves complete event history with actor details and prevents mutation', () => {
      const job = createJob(
        {
          customer_name: 'Timeline Customer',
          site_address: '777 Audit Blvd',
          description: 'Timeline audit test',
          priority: 'URGENT',
          scheduled_date: '2026-09-01',
          start_time: '10:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      assignTechnicianToJob(job.id, mockTechnician1.id, mockDispatcher);
      updateJobStatus(job.id, 'EN_ROUTE', mockTechnician1);
      updateJobStatus(job.id, 'ON_SITE', mockTechnician1);
      addPartUsed(job.id, 'Pressure Sensor', 2, mockTechnician1);
      addJobNote(job.id, 'Inspecting electrical contacts.', mockTechnician1);
      updateJobStatus(job.id, 'COMPLETED', mockTechnician1, { completionNote: 'Sensor replaced and calibrated.' });

      const fullJob = getJobById(job.id)!;
      const timelineEvents = fullJob.timeline?.map(t => t.event_type);

      expect(timelineEvents).toContain('CREATED');
      expect(timelineEvents).toContain('ASSIGNED');
      expect(timelineEvents).toContain('STATUS_CHANGE');
      expect(timelineEvents).toContain('PART_ADDED');
      expect(timelineEvents).toContain('NOTE_ADDED');
      expect(timelineEvents).toContain('COMPLETED');
    });
  });

  describe('7. Daily Dispatch Sheet CSV Export', () => {
    it('exports all jobs on a date formatted as CSV with proper headers', () => {
      createJob(
        {
          customer_name: 'CSV Customer 1',
          site_address: '100 Export Lane',
          description: 'Test Export',
          priority: 'HIGH',
          scheduled_date: '2026-09-05',
          start_time: '09:00',
          estimated_duration: 60,
        },
        mockDispatcher
      );

      const csv = generateDispatchSheetCsv('2026-09-05', mockDispatcher);
      expect(csv).toContain('Job ID,Customer Name,Site Address');
      expect(csv).toContain('"CSV Customer 1"');
      expect(csv).toContain('"09:00 - 10:00"');
    });
  });

  describe('8. Edge Cases & Validation Guards', () => {
    it('rejects invalid inputs on job creation and edit', () => {
      // Empty customer name
      expect(() => createJob({
        customer_name: '',
        site_address: '123 St',
        description: 'Test',
        priority: 'LOW',
        scheduled_date: '2026-09-01',
        start_time: '09:00',
        estimated_duration: 30,
      }, mockDispatcher)).toThrow(/Customer name is required/);

      // Negative or zero duration
      expect(() => createJob({
        customer_name: 'Valid',
        site_address: '123 St',
        description: 'Test',
        priority: 'LOW',
        scheduled_date: '2026-09-01',
        start_time: '09:00',
        estimated_duration: -10,
      }, mockDispatcher)).toThrow(/positive number of minutes/);

      // Invalid date format
      expect(() => createJob({
        customer_name: 'Valid',
        site_address: '123 St',
        description: 'Test',
        priority: 'LOW',
        scheduled_date: '09/01/2026',
        start_time: '09:00',
        estimated_duration: 30,
      }, mockDispatcher)).toThrow(/YYYY-MM-DD/);
    });

    it('rejects adding invalid parts or empty notes', () => {
      const job = createJob({
        customer_name: 'Parts Test',
        site_address: '123 St',
        description: 'Test',
        priority: 'LOW',
        scheduled_date: '2026-09-01',
        start_time: '09:00',
        estimated_duration: 30,
      }, mockDispatcher);

      assignTechnicianToJob(job.id, mockTechnician1.id, mockDispatcher);

      // Part quantity 0 or negative
      expect(() => addPartUsed(job.id, 'Filter', 0, mockTechnician1)).toThrow(/positive integer/);
      expect(() => addPartUsed(job.id, '', 2, mockTechnician1)).toThrow(/Part name is required/);

      // Empty note
      expect(() => addJobNote(job.id, '   ', mockTechnician1)).toThrow(/cannot be empty/);
    });

    it('supports assigning multiple technicians to the same job', () => {
      const job = createJob({
        customer_name: 'Big HVAC Overhaul',
        site_address: '500 Commercial Blvd',
        description: 'Multi-tech boiler replacement',
        priority: 'HIGH',
        scheduled_date: '2026-09-01',
        start_time: '14:00',
        estimated_duration: 120,
      }, mockDispatcher);

      // Assign first technician
      assignTechnicianToJob(job.id, mockTechnician1.id, mockDispatcher);
      // Assign second technician to the same job
      const updatedJob = assignTechnicianToJob(job.id, mockTechnician2.id, mockDispatcher);

      expect(updatedJob.assigned_technicians).toHaveLength(2);
      expect(updatedJob.assigned_technicians?.map(t => t.id)).toEqual(
        expect.arrayContaining([mockTechnician1.id, mockTechnician2.id])
      );

      // Now both technicians have this window booked, so neither can take another overlapping job
      const conflictingJob = createJob({
        customer_name: 'Conflict Check',
        site_address: '600 Road',
        description: 'Test',
        priority: 'LOW',
        scheduled_date: '2026-09-01',
        start_time: '15:00',
        estimated_duration: 60,
      }, mockDispatcher);

      expect(() => assignTechnicianToJob(conflictingJob.id, mockTechnician1.id, mockDispatcher)).toThrow(/Assignment refused/);
      expect(() => assignTechnicianToJob(conflictingJob.id, mockTechnician2.id, mockDispatcher)).toThrow(/Assignment refused/);
    });

    it('performs server-side search, filtering, and sorting correctly', () => {
      createJob({
        customer_name: 'Alice Springs',
        site_address: '100 Waterway',
        description: 'Plumbing leak',
        priority: 'URGENT',
        scheduled_date: '2026-09-10',
        start_time: '08:00',
        estimated_duration: 60,
      }, mockDispatcher);

      createJob({
        customer_name: 'Bob Builder',
        site_address: '200 Brick St',
        description: 'Drywall check',
        priority: 'LOW',
        scheduled_date: '2026-09-10',
        start_time: '10:00',
        estimated_duration: 60,
      }, mockDispatcher);

      // Text search
      const searchResult = listJobs({ search: 'Alice' }, mockDispatcher);
      expect(searchResult.total).toBe(1);
      expect(searchResult.jobs[0].customer_name).toBe('Alice Springs');

      // Address search
      const addressResult = listJobs({ search: 'Brick' }, mockDispatcher);
      expect(addressResult.total).toBe(1);
      expect(addressResult.jobs[0].customer_name).toBe('Bob Builder');

      // Priority sort
      const prioritySorted = listJobs({ sortBy: 'priority', sortOrder: 'asc' }, mockDispatcher);
      expect(prioritySorted.jobs[0].priority).toBe('URGENT');
    });
  });
});

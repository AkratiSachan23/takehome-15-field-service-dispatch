import bcrypt from 'bcryptjs';
import { getDb } from './db';

export async function seedDatabase(): Promise<void> {
  const db = getDb();

  // Check if users already exist
  const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (countRow.count > 0) {
    return; // already seeded
  }

  console.log('Seeding database with demo data...');

  const salt = await bcrypt.genSalt(10);
  const dispatcherHash = await bcrypt.hash('dispatch123', salt);
  const techHash = await bcrypt.hash('tech123', salt);

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-30 days'))
  `);

  const u1 = insertUser.run('dispatcher@example.com', dispatcherHash, 'Sarah Jenkins (Lead Dispatcher)', 'DISPATCHER');
  const u2 = insertUser.run('dave@example.com', dispatcherHash, 'Dave Martinez (Dispatcher)', 'DISPATCHER');
  const t1 = insertUser.run('alex@example.com', techHash, 'Alex Rivera (HVAC Tech)', 'TECHNICIAN');
  const t2 = insertUser.run('jordan@example.com', techHash, 'Jordan Lee (Plumbing Tech)', 'TECHNICIAN');
  const t3 = insertUser.run('taylor@example.com', techHash, 'Taylor Smith (Appliance Tech)', 'TECHNICIAN');
  const t4 = insertUser.run('casey@example.com', techHash, 'Casey Patel (Master Plumber)', 'TECHNICIAN');
  const t5 = insertUser.run('morgan@example.com', techHash, 'Morgan Vance (AC Specialist)', 'TECHNICIAN');

  const dispatcherId = Number(u1.lastInsertRowid);
  const alexId = Number(t1.lastInsertRowid);
  const jordanId = Number(t2.lastInsertRowid);
  const taylorId = Number(t3.lastInsertRowid);
  const caseyId = Number(t4.lastInsertRowid);

  const today = new Date().toISOString().split('T')[0];
  
  // Past dates for completion history
  const dMinus1 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dMinus2 = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
  const dMinus3 = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
  const dMinus4 = new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0];
  const dMinus5 = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      customer_name, site_address, description, priority, scheduled_date, 
      start_time, estimated_duration, status, is_archived, completion_note, 
      completed_at, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'), datetime('now', '-1 hours'))
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO job_assignments (job_id, user_id, assigned_by, assigned_at)
    VALUES (?, ?, ?, datetime('now', '-1 days'))
  `);

  const insertPart = db.prepare(`
    INSERT INTO parts_used (job_id, part_name, quantity, recorded_by, recorded_at)
    VALUES (?, ?, ?, ?, datetime('now', '-2 hours'))
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO job_timeline (job_id, event_type, actor_id, details, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-1 days'))
  `);

  const insertNote = db.prepare(`
    INSERT INTO job_notes (job_id, author_id, note, created_at)
    VALUES (?, ?, ?, datetime('now', '-3 hours'))
  `);

  // 1. Completed Job 1 (Yesterday)
  const j1 = insertJob.run(
    'Oakmont Medical Center',
    '742 Evergreen Terrace, Springfield',
    'Main HVAC rooftop compressor inspection and filter replacement.',
    'HIGH',
    dMinus1,
    '08:00',
    120,
    'COMPLETED',
    0,
    'Replaced air intake filter and recharged 3lbs R-410A refrigerant. Unit operating within normal thermal thresholds.',
    `${dMinus1} 10:15:00`,
    dispatcherId
  );
  const j1Id = Number(j1.lastInsertRowid);
  insertAssignment.run(j1Id, alexId, dispatcherId);
  insertPart.run(j1Id, 'HEPA Air Filter 24x24x2', 2, alexId);
  insertPart.run(j1Id, 'R-410A Refrigerant (lbs)', 3, alexId);
  insertTimeline.run(j1Id, 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Oakmont Medical Center' }));
  insertTimeline.run(j1Id, 'ASSIGNED', dispatcherId, JSON.stringify({ technician_name: 'Alex Rivera' }));
  insertTimeline.run(j1Id, 'STATUS_CHANGE', alexId, JSON.stringify({ old_status: 'ASSIGNED', new_status: 'EN_ROUTE' }));
  insertTimeline.run(j1Id, 'STATUS_CHANGE', alexId, JSON.stringify({ old_status: 'EN_ROUTE', new_status: 'ON_SITE' }));
  insertTimeline.run(j1Id, 'PART_ADDED', alexId, JSON.stringify({ part_name: 'HEPA Air Filter 24x24x2', quantity: 2 }));
  insertTimeline.run(j1Id, 'PART_ADDED', alexId, JSON.stringify({ part_name: 'R-410A Refrigerant (lbs)', quantity: 3 }));
  insertTimeline.run(j1Id, 'COMPLETED', alexId, JSON.stringify({ completion_note: 'Replaced air intake filter and recharged 3lbs R-410A refrigerant.' }));
  insertNote.run(j1Id, dispatcherId, 'Customer requested service report be emailed to accounts@oakmontmed.com');

  // 2. Completed Job 2 (2 days ago)
  const j2 = insertJob.run(
    'Bistro 44 Restaurant',
    '44 Harbor Drive, Waterfront',
    'Commercial kitchen grease trap backup and drainage clearing.',
    'URGENT',
    dMinus2,
    '07:00',
    90,
    'COMPLETED',
    0,
    'Cleared 35ft blockage with mechanical snake and replaced damaged PVC union.',
    `${dMinus2} 08:45:00`,
    dispatcherId
  );
  const j2Id = Number(j2.lastInsertRowid);
  insertAssignment.run(j2Id, jordanId, dispatcherId);
  insertPart.run(j2Id, '2-inch PVC Heavy Duty Trap Union', 1, jordanId);
  insertTimeline.run(j2Id, 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Bistro 44 Restaurant' }));
  insertTimeline.run(j2Id, 'ASSIGNED', dispatcherId, JSON.stringify({ technician_name: 'Jordan Lee' }));
  insertTimeline.run(j2Id, 'COMPLETED', jordanId, JSON.stringify({ completion_note: 'Cleared blockage with mechanical snake.' }));

  // 3. More past completed jobs for 14-day history
  const past3 = insertJob.run('Apex Logistics Warehouse', '100 Industrial Pkwy', 'Overhead heater thermocouple repair', 'MEDIUM', dMinus3, '09:00', 60, 'COMPLETED', 0, 'Thermocouple replaced', `${dMinus3} 10:00:00`, dispatcherId);
  insertAssignment.run(Number(past3.lastInsertRowid), alexId, dispatcherId);
  insertPart.run(Number(past3.lastInsertRowid), 'Universal Thermocouple 36in', 1, alexId);

  const past4 = insertJob.run('Highland Apartments Apt 4B', '880 Highland Ave', 'Leaking bathroom sink shutoff valve', 'LOW', dMinus4, '11:00', 45, 'COMPLETED', 0, 'Quarter-turn valve replaced', `${dMinus4} 11:45:00`, dispatcherId);
  insertAssignment.run(Number(past4.lastInsertRowid), caseyId, dispatcherId);
  insertPart.run(Number(past4.lastInsertRowid), '1/2-inch Brass Angle Stop Valve', 1, caseyId);

  const past5 = insertJob.run('Sunset Dental Clinic', '302 Sunset Blvd', 'Dental chair suction pump plumbing line leak', 'HIGH', dMinus5, '14:00', 60, 'COMPLETED', 0, 'Braided line replaced and pressure tested', `${dMinus5} 15:00:00`, dispatcherId);
  insertAssignment.run(Number(past5.lastInsertRowid), jordanId, dispatcherId);
  insertPart.run(Number(past5.lastInsertRowid), 'Braided Stainless Flex Line 3/8', 2, jordanId);

  // 4. Today: Running Late Job (08:00 AM start, 60m duration => window ended at 09:00 AM)
  const jLate = insertJob.run(
    'Metroplex Cinema - Screen 4',
    '1200 Theater Way, Downtown',
    'Emergency HVAC failure: screening room AC unit making loud grinding noise.',
    'URGENT',
    today,
    '08:00',
    60,
    'ON_SITE',
    0,
    null,
    null,
    dispatcherId
  );
  const jLateId = Number(jLate.lastInsertRowid);
  insertAssignment.run(jLateId, alexId, dispatcherId);
  insertPart.run(jLateId, 'Heavy Duty Blower Belt BX-48', 1, alexId);
  insertTimeline.run(jLateId, 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Metroplex Cinema - Screen 4' }));
  insertTimeline.run(jLateId, 'ASSIGNED', dispatcherId, JSON.stringify({ technician_name: 'Alex Rivera' }));
  insertTimeline.run(jLateId, 'STATUS_CHANGE', alexId, JSON.stringify({ old_status: 'ASSIGNED', new_status: 'EN_ROUTE' }));
  insertTimeline.run(jLateId, 'STATUS_CHANGE', alexId, JSON.stringify({ old_status: 'EN_ROUTE', new_status: 'ON_SITE' }));
  insertTimeline.run(jLateId, 'PART_ADDED', alexId, JSON.stringify({ part_name: 'Heavy Duty Blower Belt BX-48', quantity: 1 }));
  insertNote.run(jLateId, alexId, 'Blower motor shaft bearing has seized. Working on releasing bracket.');

  // 5. Today: En Route Job
  const jEnRoute = insertJob.run(
    'Riverside Elementary School',
    '500 Schoolhouse Road, North District',
    'Cafeteria walk-in cooler temperature alert (+48F instead of +38F).',
    'HIGH',
    today,
    '14:00',
    90,
    'EN_ROUTE',
    0,
    null,
    null,
    dispatcherId
  );
  const jEnRouteId = Number(jEnRoute.lastInsertRowid);
  insertAssignment.run(jEnRouteId, taylorId, dispatcherId);
  insertTimeline.run(jEnRouteId, 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Riverside Elementary School' }));
  insertTimeline.run(jEnRouteId, 'ASSIGNED', dispatcherId, JSON.stringify({ technician_name: 'Taylor Smith' }));
  insertTimeline.run(jEnRouteId, 'STATUS_CHANGE', taylorId, JSON.stringify({ old_status: 'ASSIGNED', new_status: 'EN_ROUTE' }));
  insertNote.run(jEnRouteId, dispatcherId, 'Check in with Principal Martinez upon arrival at main office.');

  // 6. Today: Assigned Job (Later afternoon)
  const jAssigned = insertJob.run(
    'Horizon Financial Tower',
    '900 Corporate Blvd, Suite 400',
    'Executive boardroom auxiliary split system not cooling.',
    'MEDIUM',
    today,
    '16:00',
    60,
    'ASSIGNED',
    0,
    null,
    null,
    dispatcherId
  );
  const jAssignedId = Number(jAssigned.lastInsertRowid);
  insertAssignment.run(jAssignedId, alexId, dispatcherId);
  insertTimeline.run(jAssignedId, 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Horizon Financial Tower' }));
  insertTimeline.run(jAssignedId, 'ASSIGNED', dispatcherId, JSON.stringify({ technician_name: 'Alex Rivera' }));

  // 7. Today: Unassigned Jobs (Ready for dispatch queue & bulk assignment testing)
  const jUnassigned1 = insertJob.run(
    'Crestview Family Dental',
    '230 Crestview Lane, Westside',
    'Water heater pilot light out and water pressure low.',
    'HIGH',
    today,
    '10:30',
    60,
    'UNASSIGNED',
    0,
    null,
    null,
    dispatcherId
  );
  insertTimeline.run(Number(jUnassigned1.lastInsertRowid), 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Crestview Family Dental' }));

  const jUnassigned2 = insertJob.run(
    'Greenfield Senior Living',
    '1450 Meadowview Way, East Wing',
    'Laundry facility commercial washer drain overflow.',
    'URGENT',
    today,
    '13:00',
    90,
    'UNASSIGNED',
    0,
    null,
    null,
    dispatcherId
  );
  insertTimeline.run(Number(jUnassigned2.lastInsertRowid), 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Greenfield Senior Living' }));

  const jUnassigned3 = insertJob.run(
    'Summit Fitness Club',
    '3300 Olympic Drive',
    'Men locker room shower fixture cartridge leaking.',
    'LOW',
    today,
    '15:30',
    45,
    'UNASSIGNED',
    0,
    null,
    null,
    dispatcherId
  );
  insertTimeline.run(Number(jUnassigned3.lastInsertRowid), 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Summit Fitness Club' }));

  // 8. Tomorrow: Unassigned Job
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const jTom = insertJob.run(
    'Blue Harbor Marina',
    '1 Dockside Way, Slip 14',
    'Dockside water pedestal backflow preventer replacement.',
    'MEDIUM',
    tomorrow,
    '09:00',
    120,
    'UNASSIGNED',
    0,
    null,
    null,
    dispatcherId
  );
  insertTimeline.run(Number(jTom.lastInsertRowid), 'CREATED', dispatcherId, JSON.stringify({ customer_name: 'Blue Harbor Marina' }));

  console.log('Database successfully seeded with demo users, jobs, parts, notes, and timeline events.');
}

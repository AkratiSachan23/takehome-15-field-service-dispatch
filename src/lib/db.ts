import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath =
    process.env.DATABASE_PATH ||
    (process.env.VERCEL ? path.join('/tmp', 'dispatch.db') : path.join(process.cwd(), 'data', 'dispatch.db'));

  // Ensure the directory exists if using a file path
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fallback for restricted environments
      }
    }
  }

  const db = new Database(dbPath);

  // Performance and integrity configurations
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('DISPATCHER', 'TECHNICIAN')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      site_address TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0),
      status TEXT NOT NULL CHECK (status IN ('UNASSIGNED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED')),
      is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
      completion_note TEXT,
      completed_at TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS parts_used (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      part_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      recorded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN (
        'CREATED', 'STATUS_CHANGE', 'ASSIGNED', 'UNASSIGNED', 
        'PART_ADDED', 'NOTE_ADDED', 'COMPLETED', 'ARCHIVED', 'RESTORED', 'EDITED'
      )),
      actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS job_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dismissed_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      window_fingerprint TEXT NOT NULL,
      dismissed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      dismissed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_id, window_fingerprint)
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_jobs_is_archived ON jobs(is_archived);
    CREATE INDEX IF NOT EXISTS idx_job_assignments_user_id ON job_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON job_assignments(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_timeline_job_id ON job_timeline(job_id);
    CREATE INDEX IF NOT EXISTS idx_parts_used_job_id ON parts_used(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON job_notes(job_id);
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_job_fp ON dismissed_alerts(job_id, window_fingerprint);
  `);
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

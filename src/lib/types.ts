export type UserRole = 'DISPATCHER' | 'TECHNICIAN';

export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type JobStatus = 'UNASSIGNED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface JobAssignment {
  id: number;
  job_id: number;
  user_id: number;
  technician_name: string;
  technician_email: string;
  assigned_by: number;
  assigned_at: string;
}

export interface PartUsed {
  id: number;
  job_id: number;
  part_name: string;
  quantity: number;
  recorded_by: number;
  recorded_by_name: string;
  recorded_at: string;
}

export interface JobTimelineEvent {
  id: number;
  job_id: number;
  event_type: 'CREATED' | 'STATUS_CHANGE' | 'ASSIGNED' | 'UNASSIGNED' | 'PART_ADDED' | 'NOTE_ADDED' | 'COMPLETED' | 'ARCHIVED' | 'RESTORED' | 'EDITED';
  actor_id: number;
  actor_name: string;
  actor_role: UserRole;
  details: string; // JSON
  created_at: string;
}

export interface JobNote {
  id: number;
  job_id: number;
  author_id: number;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Job {
  id: number;
  customer_name: string;
  site_address: string;
  description: string;
  priority: JobPriority;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24h)
  estimated_duration: number; // minutes
  status: JobStatus;
  is_archived: number; // 0 or 1
  completion_note: string | null;
  completed_at: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  assigned_technicians?: User[];
  parts_used?: PartUsed[];
  timeline?: JobTimelineEvent[];
  notes?: JobNote[];
  is_running_late?: boolean;
  end_time?: string; // computed HH:MM
}

export interface JobFilterParams {
  search?: string;
  status?: JobStatus | 'ALL';
  technicianId?: number;
  scheduledDate?: string; // YYYY-MM-DD
  includeArchived?: boolean;
  sortBy?: 'scheduled_date' | 'priority' | 'status' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BulkAssignItemResult {
  jobId: number;
  customerName: string;
  success: boolean;
  error?: string;
}

export interface BulkAssignResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: BulkAssignItemResult[];
}

export interface DashboardStats {
  jobsScheduledToday: number;
  jobsCompletedToday: number;
  jobsRunningLate: number;
  unassignedJobs: number;
  statusBreakdown: {
    UNASSIGNED: number;
    ASSIGNED: number;
    EN_ROUTE: number;
    ON_SITE: number;
    COMPLETED: number;
  };
  technicianBreakdown: Array<{
    id: number;
    name: number | string;
    assignedCount: number;
    activeCount: number;
    completedCount: number;
  }>;
  completionHistory14Days: Array<{
    date: string;
    completedCount: number;
  }>;
}

export interface AlertJob extends Job {
  window_fingerprint: string;
  scheduled_end_iso: string;
  delay_minutes: number;
}

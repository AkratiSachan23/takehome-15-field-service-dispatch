'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Job, DashboardStats, AlertJob, BulkAssignResponse, JobStatus, JobPriority } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { LoginView } from '@/components/LoginView';
import { DashboardView } from '@/components/DashboardView';
import { DispatchQueueView } from '@/components/DispatchQueueView';
import { TechnicianView } from '@/components/TechnicianView';

// Modals
import { CreateEditJobModal } from '@/components/modals/CreateEditJobModal';
import { AssignTechnicianModal } from '@/components/modals/AssignTechnicianModal';
import { BulkAssignModal } from '@/components/modals/BulkAssignModal';
import { JobDetailModal } from '@/components/modals/JobDetailModal';
import { AddPartModal } from '@/components/modals/AddPartModal';
import { CompleteJobModal } from '@/components/modals/CompleteJobModal';
import { AddNoteModal } from '@/components/modals/AddNoteModal';
import { AlertsDrawerModal } from '@/components/modals/AlertsDrawerModal';
import { ExportCsvModal } from '@/components/modals/ExportCsvModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'my-jobs'>('dashboard');

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Queue state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);

  // Queue filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [scheduledDateFilter, setScheduledDateFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'scheduled_date' | 'priority' | 'status' | 'created_at'>('scheduled_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);

  // Alerts state
  const [alerts, setAlerts] = useState<AlertJob[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Modals state
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [jobToAssign, setJobToAssign] = useState<Job | null>(null);

  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);

  const [jobDetailModalOpen, setJobDetailModalOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const [addPartModalOpen, setAddPartModalOpen] = useState(false);
  const [partJob, setPartJob] = useState<Job | null>(null);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeJob, setCompleteJob] = useState<Job | null>(null);

  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [noteJob, setNoteJob] = useState<Job | null>(null);

  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.user.role === 'TECHNICIAN') {
          setActiveTab('my-jobs');
        } else {
          setActiveTab('dashboard');
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch technicians
  const fetchTechnicians = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/technicians');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data.technicians || []);
      }
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  }, [currentUser]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!currentUser) return;
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setAlertsLoading(false);
    }
  }, [currentUser]);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'DISPATCHER') return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser]);

  // Fetch jobs for queue or technician view
  const fetchJobs = useCallback(async () => {
    if (!currentUser) return;
    setJobsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter && statusFilter !== 'ALL') query.set('status', statusFilter);
      if (technicianFilter) query.set('technicianId', technicianFilter);
      if (scheduledDateFilter) query.set('scheduledDate', scheduledDateFilter);
      if (showArchived) query.set('includeArchived', 'true');
      if (sortBy) query.set('sortBy', sortBy);
      if (sortOrder) query.set('sortOrder', sortOrder);
      query.set('page', String(currentPage));
      query.set('pageSize', String(pageSize));

      const res = await fetch(`/api/jobs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalJobs(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setJobsLoading(false);
    }
  }, [currentUser, search, statusFilter, technicianFilter, scheduledDateFilter, showArchived, sortBy, sortOrder, currentPage, pageSize]);

  // Refresh all active data
  const refreshAll = useCallback(() => {
    fetchJobs();
    fetchAlerts();
    if (currentUser?.role === 'DISPATCHER') {
      fetchDashboardStats();
    }
  }, [fetchJobs, fetchAlerts, fetchDashboardStats, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTechnicians();
      fetchAlerts();
      if (currentUser.role === 'DISPATCHER') {
        fetchDashboardStats();
      }
      fetchJobs();
    }
  }, [currentUser, fetchTechnicians, fetchAlerts, fetchDashboardStats, fetchJobs]);

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'TECHNICIAN') {
      setActiveTab('my-jobs');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
    }
  };

  // Quick user switch
  const handleQuickSwitch = async (email: string) => {
    try {
      const password = email.includes('dispatcher') || email.includes('dave') ? 'dispatch123' : 'tech123';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setSelectedJobIds([]);
        if (data.user.role === 'TECHNICIAN') {
          setActiveTab('my-jobs');
        } else {
          setActiveTab('dashboard');
        }
      }
    } catch (err) {
      console.error('Failed quick switch', err);
    }
  };

  // Create or update job
  const handleSaveJob = async (jobData: {
    customer_name: string;
    site_address: string;
    description: string;
    priority: JobPriority;
    scheduled_date: string;
    start_time: string;
    estimated_duration: number;
  }) => {
    const url = jobToEdit ? `/api/jobs/${jobToEdit.id}` : '/api/jobs';
    const method = jobToEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save job.');
    }

    refreshAll();
  };

  // Assign technician
  const handleAssignTechnician = async (jobId: number, technicianId: number) => {
    const res = await fetch(`/api/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to assign technician.');
    }

    // Update job in state
    setJobToAssign(data.job);
    refreshAll();
  };

  // Unassign technician
  const handleUnassignTechnician = async (jobId: number, technicianId: number) => {
    const res = await fetch(`/api/jobs/${jobId}/assign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to unassign technician.');
    }

    setJobToAssign(data.job);
    refreshAll();
  };

  // Bulk assign jobs
  const handleExecuteBulkAssign = async (jobIds: number[], technicianId: number): Promise<BulkAssignResponse> => {
    const res = await fetch('/api/jobs/bulk-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobIds, technicianId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Bulk assignment failed.');
    }

    refreshAll();
    return data;
  };

  // Update status (e.g. En Route, On Site)
  const handleUpdateStatus = async (jobId: number, nextStatus: JobStatus) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update job status.');
        return;
      }

      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  // Complete job
  const handleCompleteJob = async (jobId: number, completionNote: string) => {
    const res = await fetch(`/api/jobs/${jobId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', completionNote }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to complete job.');
    }

    refreshAll();
  };

  // Add Part Used
  const handleAddPart = async (jobId: number, partName: string, quantity: number) => {
    const res = await fetch(`/api/jobs/${jobId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part_name: partName, quantity }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add part.');
    }

    // Refresh detail job if open
    if (detailJob && detailJob.id === jobId) {
      handleOpenJobDetail(jobId);
    }
    refreshAll();
  };

  // Add Job Note
  const handleAddNote = async (jobId: number, note: string) => {
    const res = await fetch(`/api/jobs/${jobId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add note.');
    }

    if (detailJob && detailJob.id === jobId) {
      handleOpenJobDetail(jobId);
    }
    refreshAll();
  };

  // Toggle Archive
  const handleToggleArchive = async (job: Job) => {
    const nextArchived = !job.is_archived;
    try {
      const res = await fetch(`/api/jobs/${job.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: nextArchived }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to toggle archive status.');
        return;
      }

      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Archive toggle failed.');
    }
  };

  // Dismiss Alert
  const handleDismissAlert = async (jobId: number, windowFingerprint: string) => {
    try {
      const res = await fetch('/api/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, windowFingerprint }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to dismiss alert.');
        return;
      }

      fetchAlerts();
      if (currentUser?.role === 'DISPATCHER') {
        fetchDashboardStats();
      }
    } catch (err: unknown) {
      console.error('Failed to dismiss alert', err);
    }
  };

  // Open job details modal
  const handleOpenJobDetail = async (jobId: number) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailJob(data.job);
        setJobDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch job detail', err);
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading FieldFlow Dispatch System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lateAlertCount={alerts.length}
        onOpenAlerts={() => setAlertsDrawerOpen(true)}
        onOpenCreateJob={() => {
          setJobToEdit(null);
          setCreateEditModalOpen(true);
        }}
        onOpenExport={() => setExportModalOpen(true)}
        onQuickSwitchUser={handleQuickSwitch}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        {activeTab === 'dashboard' && currentUser.role === 'DISPATCHER' && (
          <DashboardView
            stats={stats}
            loading={statsLoading}
            onNavigateToQueue={(filter) => {
              if (filter?.status) setStatusFilter(filter.status);
              setActiveTab('queue');
            }}
            onOpenAlerts={() => setAlertsDrawerOpen(true)}
          />
        )}

        {activeTab === 'queue' && currentUser.role === 'DISPATCHER' && (
          <DispatchQueueView
            jobs={jobs}
            totalJobs={totalJobs}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            loading={jobsLoading}
            technicians={technicians}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            technicianFilter={technicianFilter}
            setTechnicianFilter={setTechnicianFilter}
            scheduledDateFilter={scheduledDateFilter}
            setScheduledDateFilter={setScheduledDateFilter}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onPageChange={setCurrentPage}
            selectedJobIds={selectedJobIds}
            setSelectedJobIds={setSelectedJobIds}
            onOpenBulkAssign={() => setBulkAssignModalOpen(true)}
            onOpenJobDetail={handleOpenJobDetail}
            onOpenAssignModal={(job) => {
              setJobToAssign(job);
              setAssignModalOpen(true);
            }}
            onOpenEditModal={(job) => {
              setJobToEdit(job);
              setCreateEditModalOpen(true);
            }}
            onToggleArchive={handleToggleArchive}
          />
        )}

        {activeTab === 'my-jobs' && currentUser.role === 'TECHNICIAN' && (
          <TechnicianView
            jobs={jobs}
            loading={jobsLoading}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateStatus}
            onOpenAddPart={(job) => {
              setPartJob(job);
              setAddPartModalOpen(true);
            }}
            onOpenCompleteModal={(job) => {
              setCompleteJob(job);
              setCompleteModalOpen(true);
            }}
            onOpenAddNote={(job) => {
              setNoteJob(job);
              setAddNoteModalOpen(true);
            }}
            onOpenJobDetail={handleOpenJobDetail}
          />
        )}
      </main>

      {/* Modals */}
      <CreateEditJobModal
        isOpen={createEditModalOpen}
        onClose={() => setCreateEditModalOpen(false)}
        jobToEdit={jobToEdit}
        onSave={handleSaveJob}
      />

      <AssignTechnicianModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setJobToAssign(null);
        }}
        job={jobToAssign}
        technicians={technicians}
        onAssign={handleAssignTechnician}
        onUnassign={handleUnassignTechnician}
      />

      <BulkAssignModal
        isOpen={bulkAssignModalOpen}
        onClose={() => setBulkAssignModalOpen(false)}
        selectedJobIds={selectedJobIds}
        technicians={technicians}
        onExecuteBulkAssign={handleExecuteBulkAssign}
        onSuccessComplete={() => {
          setSelectedJobIds([]);
        }}
      />

      <JobDetailModal
        isOpen={jobDetailModalOpen}
        onClose={() => {
          setJobDetailModalOpen(false);
          setDetailJob(null);
        }}
        job={detailJob}
        currentUser={currentUser}
        onOpenAddPart={(job) => {
          setPartJob(job);
          setAddPartModalOpen(true);
        }}
        onOpenAddNote={(job) => {
          setNoteJob(job);
          setAddNoteModalOpen(true);
        }}
      />

      <AddPartModal
        isOpen={addPartModalOpen}
        onClose={() => {
          setAddPartModalOpen(false);
          setPartJob(null);
        }}
        job={partJob}
        onAddPart={handleAddPart}
      />

      <CompleteJobModal
        isOpen={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false);
          setCompleteJob(null);
        }}
        job={completeJob}
        onCompleteJob={handleCompleteJob}
        onOpenAddPart={(job) => {
          setPartJob(job);
          setAddPartModalOpen(true);
        }}
      />

      <AddNoteModal
        isOpen={addNoteModalOpen}
        onClose={() => {
          setAddNoteModalOpen(false);
          setNoteJob(null);
        }}
        job={noteJob}
        onAddNote={handleAddNote}
      />

      <AlertsDrawerModal
        isOpen={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        alerts={alerts}
        loading={alertsLoading}
        currentUser={currentUser}
        onDismissAlert={handleDismissAlert}
        onOpenJobDetail={handleOpenJobDetail}
        onOpenEditJob={(jobId) => {
          const target = jobs.find(j => j.id === jobId);
          if (target) {
            setJobToEdit(target);
            setCreateEditModalOpen(true);
          }
        }}
      />

      <ExportCsvModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}

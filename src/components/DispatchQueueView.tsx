'use client';

import React from 'react';
import { Job, User, JobStatus, JobPriority } from '@/lib/types';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Archive, 
  RotateCcw, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Edit3
} from 'lucide-react';

interface DispatchQueueViewProps {
  jobs: Job[];
  totalJobs: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  technicians: User[];
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  technicianFilter: string;
  setTechnicianFilter: (t: string) => void;
  scheduledDateFilter: string;
  setScheduledDateFilter: (d: string) => void;
  showArchived: boolean;
  setShowArchived: (b: boolean) => void;
  sortBy: string;
  setSortBy: (s: any) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (o: 'asc' | 'desc') => void;
  onPageChange: (p: number) => void;
  selectedJobIds: number[];
  setSelectedJobIds: React.Dispatch<React.SetStateAction<number[]>>;
  onOpenBulkAssign: () => void;
  onOpenJobDetail: (jobId: number) => void;
  onOpenAssignModal: (job: Job) => void;
  onOpenEditModal: (job: Job) => void;
  onToggleArchive: (job: Job) => void;
}

export function DispatchQueueView({
  jobs,
  totalJobs,
  currentPage,
  pageSize,
  totalPages,
  loading,
  technicians,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  technicianFilter,
  setTechnicianFilter,
  scheduledDateFilter,
  setScheduledDateFilter,
  showArchived,
  setShowArchived,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onPageChange,
  selectedJobIds,
  setSelectedJobIds,
  onOpenBulkAssign,
  onOpenJobDetail,
  onOpenAssignModal,
  onOpenEditModal,
  onToggleArchive,
}: DispatchQueueViewProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const unassignedJobsOnPage = jobs.filter(j => j.status === 'UNASSIGNED' && !j.is_archived);
  const allUnassignedSelected = unassignedJobsOnPage.length > 0 && unassignedJobsOnPage.every(j => selectedJobIds.includes(j.id));

  const toggleSelectAllUnassigned = () => {
    if (allUnassignedSelected) {
      setSelectedJobIds(prev => prev.filter(id => !unassignedJobsOnPage.some(j => j.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedJobIds, ...unassignedJobsOnPage.map(j => j.id)]));
      setSelectedJobIds(newIds);
    }
  };

  const toggleSelectJob = (jobId: number) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {showArchived ? 'Archived Jobs Repository' : 'Live Dispatch Queue'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing {jobs.length} of {totalJobs} total matching jobs (Server-side paginated &amp; filtered)
          </p>
        </div>

        {/* Bulk Action Button & Archive Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!showArchived && selectedJobIds.length > 0 && (
            <button
              onClick={onOpenBulkAssign}
              className="btn btn-primary"
              style={{ animation: 'pulse-urgent 2s infinite ease-in-out' }}
            >
              <Layers size={16} />
              Bulk Assign ({selectedJobIds.length} Unassigned)
            </button>
          )}

          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setSelectedJobIds([]);
            }}
            className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Archive size={15} />
            {showArchived ? 'Back to Active Queue' : 'View Archived'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search customer, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="EN_ROUTE">En Route</option>
              <option value="ON_SITE">On Site</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="form-select"
            >
              <option value="">All Technicians</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Scheduled Date Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              value={scheduledDateFilter}
              onChange={(e) => setScheduledDateFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem' }}
            />
            {scheduledDateFilter && (
              <button
                onClick={() => setScheduledDateFilter('')}
                className="btn btn-sm btn-secondary"
                title="Clear date"
              >
                Clear
              </button>
            )}
            {!scheduledDateFilter && (
              <button
                onClick={() => setScheduledDateFilter(todayStr)}
                className="btn btn-sm btn-secondary"
              >
                Today
              </button>
            )}
          </div>

          {/* Sort By & Order */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <SlidersHorizontal size={15} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
            >
              <option value="scheduled_date">Sort by Scheduled Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
              <option value="created_at">Sort by Created Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-sm btn-secondary"
              title="Toggle sort direction"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Jobs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {!showArchived && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allUnassignedSelected}
                    onChange={toggleSelectAllUnassigned}
                    disabled={unassignedJobsOnPage.length === 0}
                    title="Select all unassigned on this page for bulk assignment"
                  />
                </th>
              )}
              <th>Customer &amp; Site</th>
              <th>Schedule Window</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Technician(s)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showArchived ? 6 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading dispatch queue...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={showArchived ? 6 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No jobs match the selected filters.
                </td>
              </tr>
            ) : (
              jobs.map(job => {
                const isSelected = selectedJobIds.includes(job.id);
                const isUnassigned = job.status === 'UNASSIGNED';

                return (
                  <tr 
                    key={job.id} 
                    style={{ 
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined,
                      borderLeft: job.is_running_late ? '3px solid #f43f5e' : undefined 
                    }}
                  >
                    {!showArchived && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectJob(job.id)}
                          disabled={!isUnassigned}
                          title={isUnassigned ? "Select for bulk assignment" : "Only unassigned jobs can be bulk-assigned"}
                        />
                      </td>
                    )}

                    {/* Customer & Address */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {job.customer_name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <MapPin size={12} color="#38bdf8" />
                        {job.site_address}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Job #{job.id} &bull; {job.description.slice(0, 60)}{job.description.length > 60 ? '...' : ''}
                      </div>
                    </td>

                    {/* Schedule Window */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                        <Calendar size={14} color="#60a5fa" />
                        {job.scheduled_date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        <Clock size={13} color="var(--text-muted)" />
                        {job.start_time} - {job.end_time} ({job.estimated_duration}m)
                      </div>
                    </td>

                    {/* Priority */}
                    <td>
                      <span className={`badge badge-${job.priority.toLowerCase()}`}>
                        {job.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        <span className={`badge badge-${job.status.toLowerCase().replace('_', '-')}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        {job.is_running_late && (
                          <span className="badge badge-late" style={{ fontSize: '0.65rem' }}>
                            <AlertCircle size={10} />
                            Running Late
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Techs */}
                    <td>
                      {job.assigned_technicians && job.assigned_technicians.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {job.assigned_technicians.map(t => (
                            <span 
                              key={t.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.2rem 0.5rem',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93c5fd',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.725rem',
                                fontWeight: 500,
                              }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* View Details */}
                        <button
                          onClick={() => onOpenJobDetail(job.id)}
                          className="btn btn-sm btn-secondary"
                          title="View complete job history, parts, and notes"
                        >
                          <Eye size={14} />
                        </button>

                        {!showArchived && (
                          <>
                            {/* Assign / Reassign Techs */}
                            {job.status !== 'COMPLETED' && (
                              <button
                                onClick={() => onOpenAssignModal(job)}
                                className="btn btn-sm btn-secondary"
                                title="Assign or remove technician"
                              >
                                <UserPlus size={14} />
                              </button>
                            )}

                            {/* Edit Job */}
                            {job.status !== 'COMPLETED' && (
                              <button
                                onClick={() => onOpenEditModal(job)}
                                className="btn btn-sm btn-secondary"
                                title="Edit job details or reschedule"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}

                            {/* Archive */}
                            <button
                              onClick={() => onToggleArchive(job)}
                              className="btn btn-sm btn-secondary"
                              title="Archive job"
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        )}

                        {showArchived && (
                          <button
                            onClick={() => onToggleArchive(job)}
                            className="btn btn-sm btn-primary"
                            title="Restore job to active queue"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.5rem 0',
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Page {currentPage} of {totalPages} ({totalJobs} total matches)
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="btn btn-sm btn-secondary"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
            {currentPage}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="btn btn-sm btn-secondary"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

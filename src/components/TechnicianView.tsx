'use client';

import React from 'react';
import { Job, User } from '@/lib/types';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  PackagePlus, 
  FileText, 
  AlertCircle,
  Eye,
  MessageSquarePlus,
  PlayCircle
} from 'lucide-react';

interface TechnicianViewProps {
  jobs: Job[];
  loading: boolean;
  currentUser: User;
  onUpdateStatus: (jobId: number, nextStatus: any) => void;
  onOpenAddPart: (job: Job) => void;
  onOpenCompleteModal: (job: Job) => void;
  onOpenAddNote: (job: Job) => void;
  onOpenJobDetail: (jobId: number) => void;
}

export function TechnicianView({
  jobs,
  loading,
  currentUser,
  onUpdateStatus,
  onOpenAddPart,
  onOpenCompleteModal,
  onOpenAddNote,
  onOpenJobDetail,
}: TechnicianViewProps) {
  const activeJobs = jobs.filter(j => j.status !== 'COMPLETED');
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Technician Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Field Service Work Queue &bull; {currentUser.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {activeJobs.length} active assigned jobs scheduled for service
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your assigned service assignments...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Assigned Jobs</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            You have no outstanding service dispatches currently assigned to your schedule.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Jobs Section */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={18} />
              Active Dispatch Assignments ({activeJobs.length})
            </h2>

            {activeJobs.length === 0 ? (
              <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                All assigned jobs for today are completed! Great work.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {activeJobs.map(job => (
                  <div 
                    key={job.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      borderLeft: job.is_running_late ? '4px solid #f43f5e' : undefined 
                    }}
                  >
                    <div>
                      {/* Priority, Late & Status Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span className={`badge badge-${job.priority.toLowerCase()}`}>
                            {job.priority}
                          </span>
                          {job.is_running_late && (
                            <span className="badge badge-late">
                              <AlertCircle size={10} />
                              Running Late
                            </span>
                          )}
                        </div>
                        <span className={`badge badge-${job.status.toLowerCase().replace('_', '-')}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Customer & Address */}
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {job.customer_name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                        <MapPin size={15} color="#38bdf8" />
                        <span>{job.site_address}</span>
                      </div>

                      {/* Work Description */}
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        lineHeight: 1.4,
                      }}>
                        {job.description}
                      </p>

                      {/* Scheduled Window */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="#60a5fa" />
                          <span>{job.scheduled_date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={14} color="var(--text-secondary)" />
                          <span>{job.start_time} - {job.end_time} ({job.estimated_duration}m)</span>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Status Action Controls */}
                    <div style={{
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}>
                      {/* Status Lifecycle Buttons */}
                      {job.status === 'ASSIGNED' && (
                        <button
                          onClick={() => onUpdateStatus(job.id, 'EN_ROUTE')}
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <Navigation size={16} />
                          Depart Office &bull; Mark En Route
                        </button>
                      )}

                      {job.status === 'EN_ROUTE' && (
                        <button
                          onClick={() => onUpdateStatus(job.id, 'ON_SITE')}
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
                        >
                          <PlayCircle size={16} />
                          Arrived At Customer Site &bull; Mark On Site
                        </button>
                      )}

                      {job.status === 'ON_SITE' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => onOpenAddPart(job)}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                          >
                            <PackagePlus size={15} color="#38bdf8" />
                            Add Part
                          </button>
                          <button
                            onClick={() => onOpenCompleteModal(job)}
                            className="btn btn-success"
                            style={{ flex: 1.5 }}
                          >
                            <CheckCircle2 size={15} />
                            Complete Job
                          </button>
                        </div>
                      )}

                      {/* Secondary Actions (Notes, Timeline) */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                        <button
                          onClick={() => onOpenAddNote(job)}
                          className="btn btn-sm btn-secondary"
                          style={{ flex: 1 }}
                        >
                          <MessageSquarePlus size={13} />
                          Add Note
                        </button>
                        <button
                          onClick={() => onOpenJobDetail(job.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ flex: 1 }}
                        >
                          <Eye size={13} />
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Jobs Section */}
          {completedJobs.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                Completed Jobs ({completedJobs.length})
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {completedJobs.map(job => (
                  <div key={job.id} className="glass-panel" style={{ padding: '1.25rem', opacity: 0.9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{job.customer_name}</h4>
                      <span className="badge badge-completed">Completed</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {job.site_address}
                    </div>

                    {job.completion_note && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#a7f3d0',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid #10b981',
                        marginBottom: '0.75rem',
                      }}>
                        <strong>Completion Record:</strong> {job.completion_note}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Finished on {job.completed_at ? job.completed_at.slice(0, 16) : job.scheduled_date}
                      </span>
                      <button
                        onClick={() => onOpenJobDetail(job.id)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Eye size={13} />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

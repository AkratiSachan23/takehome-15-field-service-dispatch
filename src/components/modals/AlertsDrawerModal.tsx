'use client';

import React from 'react';
import { AlertJob, User } from '@/lib/types';
import { X, AlertTriangle, Clock, MapPin, Users, Check, Eye, RefreshCw } from 'lucide-react';

interface AlertsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertJob[];
  loading: boolean;
  currentUser: User;
  onDismissAlert: (jobId: number, windowFingerprint: string) => Promise<void>;
  onOpenJobDetail: (jobId: number) => void;
  onOpenEditJob: (jobId: number) => void;
}

export function AlertsDrawerModal({
  isOpen,
  onClose,
  alerts,
  loading,
  currentUser,
  onDismissAlert,
  onOpenJobDetail,
  onOpenEditJob,
}: AlertsDrawerModalProps) {
  if (!isOpen) return null;

  const isDispatcher = currentUser.role === 'DISPATCHER';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Running-Late Schedule Alerts ({alerts.length})
              </h2>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                Jobs past their scheduled end window and not yet marked Completed
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}>
            <strong>Rule:</strong> Dismissing an alert removes it for its current window. If the job is later rescheduled to a new time window and that new window passes again without completion, this alert will automatically return.
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Checking running late alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Check size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                All Schedules On Track
              </h3>
              <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                There are no uncompleted jobs currently running past their scheduled time window.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
              {alerts.map((job) => (
                <div
                  key={job.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.07)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          Job #{job.id} &bull; {job.customer_name}
                        </span>
                        <span className={`badge badge-${job.status.toLowerCase().replace('_', '-')}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <MapPin size={12} color="#38bdf8" />
                        {job.site_address}
                      </div>
                    </div>

                    <span className="badge badge-late">
                      +{job.delay_minutes} min late
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} color="#fca5a5" />
                      Window: {job.scheduled_date} {job.start_time} - {job.end_time} ({job.estimated_duration}m)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={13} color="#38bdf8" />
                      Techs: {job.assigned_technicians && job.assigned_technicians.length > 0 
                        ? job.assigned_technicians.map(t => t.name).join(', ')
                        : 'None'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                    borderTop: '1px solid rgba(244, 63, 94, 0.15)',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem',
                  }}>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenJobDetail(job.id);
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      <Eye size={13} />
                      View Job Details
                    </button>

                    {isDispatcher && (
                      <button
                        onClick={() => onDismissAlert(job.id, job.window_fingerprint)}
                        className="btn btn-sm btn-secondary"
                        style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                        title="Dismiss this alert for this scheduled window"
                      >
                        <Check size={13} />
                        Dismiss Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

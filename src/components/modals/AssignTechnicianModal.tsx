'use client';

import React, { useState } from 'react';
import { Job, User } from '@/lib/types';
import { X, UserPlus, UserMinus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  technicians: User[];
  onAssign: (jobId: number, technicianId: number) => Promise<void>;
  onUnassign: (jobId: number, technicianId: number) => Promise<void>;
}

export function AssignTechnicianModal({
  isOpen,
  onClose,
  job,
  technicians,
  onAssign,
  onUnassign,
}: AssignTechnicianModalProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !job) return null;

  const assignedTechIds = (job.assigned_technicians || []).map(t => t.id);
  const availableTechs = technicians.filter(t => !assignedTechIds.includes(t.id));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;

    setError(null);
    setLoading(true);
    try {
      await onAssign(job.id, Number(selectedTechId));
      setSelectedTechId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign technician.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (technicianId: number) => {
    setError(null);
    setLoading(true);
    try {
      await onUnassign(job.id, technicianId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove technician.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Technician Assignment &bull; Job #{job.id}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {job.customer_name} &bull; {job.scheduled_date} ({job.start_time} - {job.end_time})
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong>Double-Booking Conflict Prevented:</strong>
                <p style={{ marginTop: '0.2rem' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Currently Assigned Technicians */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              Currently Assigned Technicians ({job.assigned_technicians?.length || 0})
            </label>

            {(!job.assigned_technicians || job.assigned_technicians.length === 0) ? (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}>
                No technicians currently assigned. Job status is <strong>UNASSIGNED</strong>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {job.assigned_technicians.map(tech => (
                  <div
                    key={tech.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {tech.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tech.email}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnassign(tech.id)}
                      disabled={loading}
                      className="btn btn-sm btn-danger"
                      title="Remove assignment"
                    >
                      <UserMinus size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Technician Form */}
          <form onSubmit={handleAssign} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              Assign Additional Technician
            </label>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="form-select"
                style={{ flex: 1 }}
              >
                <option value="">-- Choose technician to assign --</option>
                {availableTechs.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedTechId || loading}
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} />
              The server will verify that this technician has no overlapping schedule window.
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

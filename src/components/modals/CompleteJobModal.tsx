'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';
import { X, CheckCircle2, AlertTriangle, Package, FileText } from 'lucide-react';

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onCompleteJob: (jobId: number, completionNote: string) => Promise<void>;
  onOpenAddPart: (job: Job) => void;
}

export function CompleteJobModal({
  isOpen,
  onClose,
  job,
  onCompleteJob,
  onOpenAddPart,
}: CompleteJobModalProps) {
  const [completionNote, setCompletionNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !job) return null;

  const partsCount = job.parts_used?.length || 0;
  const hasPartsPrerequisite = partsCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNote.trim()) {
      setError('A completion note is required.');
      return;
    }
    if (!hasPartsPrerequisite) {
      setError('Completing this job requires at least one part used to be recorded.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onCompleteJob(job.id, completionNote.trim());
      setCompletionNote('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Complete Service Job #{job.id}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: '#fb7185',
                fontSize: '0.825rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Prerequisites Checklist */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Completion Requirements Checklist
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasPartsPrerequisite ? '#34d399' : '#fb7185' }}>
                    <Package size={15} />
                    Parts Used Recorded: <strong>{partsCount} part(s)</strong>
                  </span>
                  {!hasPartsPrerequisite ? (
                    <button
                      type="button"
                      onClick={() => onOpenAddPart(job)}
                      className="btn btn-sm btn-primary"
                    >
                      + Add Part Now
                    </button>
                  ) : (
                    <span className="badge badge-completed">Verified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Completion Note Textarea */}
            <div className="form-group">
              <label className="form-label">
                Detailed Completion Summary Note *
              </label>
              <textarea
                required
                rows={4}
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Describe work completed, test results, customer handover details, and any follow-up recommendations..."
                className="form-textarea"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                This record will be permanently saved to the immutable job history.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasPartsPrerequisite || !completionNote.trim()}
              className="btn btn-success"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Submitting...' : 'Mark Job as Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

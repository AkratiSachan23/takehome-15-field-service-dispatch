'use client';

import React, { useState } from 'react';
import { User, BulkAssignResponse } from '@/lib/types';
import { X, Layers, CheckCircle2, AlertCircle, Users, Check, ArrowRight } from 'lucide-react';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobIds: number[];
  technicians: User[];
  onExecuteBulkAssign: (jobIds: number[], technicianId: number) => Promise<BulkAssignResponse>;
  onSuccessComplete: () => void;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  selectedJobIds,
  technicians,
  onExecuteBulkAssign,
  onSuccessComplete,
}: BulkAssignModalProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkAssignResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await onExecuteBulkAssign(selectedJobIds, Number(selectedTechId));
      setResult(response);
      onSuccessComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk assignment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Bulk Assign Unassigned Jobs
              </h2>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                {selectedJobIds.length} unassigned jobs selected
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {!result ? (
            <form onSubmit={handleExecute} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Select a technician to assign all <strong>{selectedJobIds.length}</strong> selected jobs.
                The server will check each job independently and report exact successes and any schedule overlap conflicts.
              </p>

              <div className="form-group">
                <label className="form-label">Target Technician *</label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Choose technician for bulk dispatch --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer" style={{ margin: '1rem -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedTechId || loading}
                  className="btn btn-primary"
                >
                  <Layers size={16} />
                  {loading ? 'Processing Batch...' : `Bulk Assign ${selectedJobIds.length} Jobs`}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Summary Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={24} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                      {result.successCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully Assigned</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={24} color={result.failureCount > 0 ? '#f43f5e' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: result.failureCount > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      {result.failureCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Refused (Conflicts)</div>
                  </div>
                </div>
              </div>

              {/* Detailed Per-Job Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Per-Job Dispatch Results
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                  {result.results.map((item) => (
                    <div
                      key={item.jobId}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: item.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                        border: `1px solid ${item.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          Job #{item.jobId} &bull; {item.customerName}
                        </span>
                        <span className={`badge ${item.success ? 'badge-completed' : 'badge-urgent'}`}>
                          {item.success ? 'Assigned' : 'Refused'}
                        </span>
                      </div>

                      {!item.success && item.error && (
                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.15rem' }}>
                          {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ margin: '1rem -1.5rem -1.5rem', padding: '1rem 1.5rem' }}>
                <button onClick={onClose} className="btn btn-primary">
                  Close &amp; Refresh Queue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

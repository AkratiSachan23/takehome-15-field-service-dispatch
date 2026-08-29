'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';
import { X, MessageSquarePlus } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onAddNote: (jobId: number, note: string) => Promise<void>;
}

export function AddNoteModal({
  isOpen,
  onClose,
  job,
  onAddNote,
}: AddNoteModalProps) {
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await onAddNote(job.id, noteText.trim());
      setNoteText('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquarePlus size={20} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Add Internal Note &bull; Job #{job.id}
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
                padding: '0.65rem 0.85rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: '#fb7185',
                fontSize: '0.825rem',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Note Content *</label>
              <textarea
                required
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter field observation, gate code, dispatcher instructions..."
                className="form-textarea"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !noteText.trim()} className="btn btn-primary">
              {loading ? 'Adding...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

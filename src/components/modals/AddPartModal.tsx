'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';
import { X, PackagePlus, AlertTriangle } from 'lucide-react';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onAddPart: (jobId: number, partName: string, quantity: number) => Promise<void>;
}

export function AddPartModal({
  isOpen,
  onClose,
  job,
  onAddPart,
}: AddPartModalProps) {
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await onAddPart(job.id, partName.trim(), Number(quantity));
      setPartName('');
      setQuantity(1);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record part.');
    } finally {
      setLoading(false);
    }
  };

  const commonParts = [
    'HEPA Air Filter 24x24x2',
    'R-410A Refrigerant (lbs)',
    'Dual Run Capacitor 45/5 uF',
    '2-inch PVC Heavy Duty Trap Union',
    'Universal Thermocouple 36in',
    '1/2-inch Brass Angle Stop Valve',
    'Pressure Sensor Transducer',
    'Blower Motor V-Belt BX-48',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackagePlus size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Record Part Used &bull; Job #{job.id}
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
              <label className="form-label">Part Name / SKU *</label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. 1/2-inch Copper Elbow or Capacitor 45uF"
                className="form-input"
              />
            </div>

            {/* Quick Suggestions */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Quick Common Parts:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {commonParts.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPartName(p)}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Used *</label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !partName.trim()} className="btn btn-primary">
              {loading ? 'Recording...' : 'Add Part Used'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

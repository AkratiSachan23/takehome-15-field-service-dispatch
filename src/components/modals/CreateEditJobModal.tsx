'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobPriority } from '@/lib/types';
import { X, Calendar, Clock, MapPin, User, FileText, AlertTriangle } from 'lucide-react';

interface CreateEditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit: Job | null;
  onSave: (jobData: {
    customer_name: string;
    site_address: string;
    description: string;
    priority: JobPriority;
    scheduled_date: string;
    start_time: string;
    estimated_duration: number;
  }) => Promise<void>;
}

export function CreateEditJobModal({
  isOpen,
  onClose,
  jobToEdit,
  onSave,
}: CreateEditJobModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('MEDIUM');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (jobToEdit) {
      setCustomerName(jobToEdit.customer_name);
      setSiteAddress(jobToEdit.site_address);
      setDescription(jobToEdit.description);
      setPriority(jobToEdit.priority);
      setScheduledDate(jobToEdit.scheduled_date);
      setStartTime(jobToEdit.start_time);
      setEstimatedDuration(jobToEdit.estimated_duration);
    } else {
      setCustomerName('');
      setSiteAddress('');
      setDescription('');
      setPriority('MEDIUM');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEstimatedDuration(60);
    }
    setError(null);
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSave({
        customer_name: customerName,
        site_address: siteAddress,
        description,
        priority,
        scheduled_date: scheduledDate,
        start_time: startTime,
        estimated_duration: Number(estimatedDuration),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {jobToEdit ? `Edit Job #${jobToEdit.id}` : 'Create New Service Job'}
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">Customer / Business Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Apex Industrial Center or John Doe"
                className="form-input"
              />
            </div>

            {/* Site Address */}
            <div className="form-group">
              <label className="form-label">Site Address *</label>
              <input
                type="text"
                required
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
                className="form-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Work Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe required diagnosis, repairs, or installation work..."
                className="form-textarea"
              />
            </div>

            {/* Priority & Date Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Priority Level *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as JobPriority)}
                  className="form-select"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Start Time & Duration Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time (HH:MM 24h) *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Duration (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={15}
                  step={15}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            {jobToEdit && (
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                Note: Technician assignments are preserved. If changing scheduled window, the server will check for schedule conflicts against currently assigned technicians.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : jobToEdit ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

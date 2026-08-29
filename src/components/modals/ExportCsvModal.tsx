'use client';

import React, { useState } from 'react';
import { X, FileDown, Calendar } from 'lucide-react';

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportCsvModal({ isOpen, onClose }: ExportCsvModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = `/api/export?date=${encodeURIComponent(selectedDate)}`;
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileDown size={20} color="#3b82f6" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Export Daily Dispatch Sheet
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Download the daily dispatch sheet formatted as a standard CSV file. Includes customer names, site addresses, assigned technicians, scheduled time windows, priority, status, and parts count.
          </p>

          <div className="form-group">
            <label className="form-label">Select Scheduled Date *</label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleDownload} className="btn btn-primary">
            <FileDown size={16} />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}

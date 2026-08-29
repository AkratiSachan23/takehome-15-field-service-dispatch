'use client';

import React, { useState } from 'react';
import { Job, User } from '@/lib/types';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  History, 
  Package, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ShieldAlert
} from 'lucide-react';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  currentUser: User;
  onOpenAddPart: (job: Job) => void;
  onOpenAddNote: (job: Job) => void;
}

export function JobDetailModal({
  isOpen,
  onClose,
  job,
  currentUser,
  onOpenAddPart,
  onOpenAddNote,
}: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'parts' | 'notes'>('timeline');

  if (!isOpen || !job) return null;

  const canAddParts = job.status !== 'COMPLETED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Job #{job.id} &bull; {job.customer_name}
              </h2>
              <span className={`badge badge-${job.priority.toLowerCase()}`}>
                {job.priority}
              </span>
              <span className={`badge badge-${job.status.toLowerCase().replace('_', '-')}`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <MapPin size={13} color="#38bdf8" />
              {job.site_address}
            </div>
          </div>

          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Work Description Box */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Work Order Description
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              {job.description}
            </div>

            {job.completion_note && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.12)',
                borderLeft: '3px solid #10b981',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                  Completion Note (Recorded on Finish)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#d1fae5', marginTop: '0.2rem' }}>
                  {job.completion_note}
                </div>
              </div>
            )}
          </div>

          {/* Key Schedule & Technician Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.825rem',
          }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Scheduled Window</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} color="#60a5fa" />
                {job.scheduled_date} &bull; {job.start_time} - {job.end_time} ({job.estimated_duration}m)
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Assigned Technicians</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} color="#38bdf8" />
                {job.assigned_technicians && job.assigned_technicians.length > 0 
                  ? job.assigned_technicians.map(t => t.name).join(', ')
                  : 'None (Unassigned)'}
              </div>
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <History size={14} />
              Immutable Timeline ({job.timeline?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('parts')}
              className={`btn btn-sm ${activeTab === 'parts' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Package size={14} />
              Parts Used ({job.parts_used?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`btn btn-sm ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <MessageSquare size={14} />
              Internal Notes ({job.notes?.length || 0})
            </button>
          </div>

          {/* Sub-tab 1: Immutable Timeline (Goal 9) */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldAlert size={12} color="#38bdf8" />
                Immutable Append-Only Audit Log (Cannot be edited or deleted by anyone)
              </div>

              {(!job.timeline || job.timeline.length === 0) ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No timeline history recorded.
                </div>
              ) : (
                job.timeline.map((event) => {
                  let parsedDetails: any = {};
                  try {
                    parsedDetails = JSON.parse(event.details);
                  } catch {
                    parsedDetails = { raw: event.details };
                  }

                  return (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid #3b82f6',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {event.event_type.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {event.created_at}
                          </span>
                        </div>

                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.775rem' }}>
                          By <strong>{event.actor_name}</strong> ({event.actor_role})
                        </div>

                        {/* Event Details Preview */}
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.3rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                          {event.event_type === 'CREATED' && `Job created with priority ${parsedDetails.priority || 'MEDIUM'} for ${parsedDetails.customer_name}`}
                          {event.event_type === 'ASSIGNED' && `Assigned technician: ${parsedDetails.technician_name} (Status: ${parsedDetails.old_status} -> ${parsedDetails.new_status})`}
                          {event.event_type === 'UNASSIGNED' && `Unassigned technician: ${parsedDetails.technician_name} (${parsedDetails.remaining_technicians} remaining)`}
                          {event.event_type === 'STATUS_CHANGE' && `Status transitioned from ${parsedDetails.old_status} to ${parsedDetails.new_status}`}
                          {event.event_type === 'PART_ADDED' && `Recorded part: ${parsedDetails.part_name} (Qty: ${parsedDetails.quantity})`}
                          {event.event_type === 'NOTE_ADDED' && `Note added: "${parsedDetails.preview}"`}
                          {event.event_type === 'COMPLETED' && `Job completed. Note: "${parsedDetails.completion_note}"`}
                          {event.event_type === 'ARCHIVED' && 'Job archived from dispatch queue'}
                          {event.event_type === 'RESTORED' && 'Job restored to dispatch queue'}
                          {event.event_type === 'EDITED' && 'Job details or schedule updated'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sub-tab 2: Parts Used (Goal 3) */}
          {activeTab === 'parts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All parts recorded for this job
                </span>
                {canAddParts && (
                  <button onClick={() => onOpenAddPart(job)} className="btn btn-sm btn-primary">
                    <Plus size={14} />
                    Record Part Used
                  </button>
                )}
              </div>

              {(!job.parts_used || job.parts_used.length === 0) ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No parts recorded yet. (Completing this job requires at least one part used).
                </div>
              ) : (
                <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Part Description</th>
                        <th style={{ textAlign: 'center' }}>Quantity</th>
                        <th>Recorded By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.parts_used.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.part_name}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#38bdf8' }}>{p.quantity}</td>
                          <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{p.recorded_by_name}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.recorded_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: Internal Notes */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Field and office notes
                </span>
                <button onClick={() => onOpenAddNote(job)} className="btn btn-sm btn-secondary">
                  <Plus size={14} />
                  Add Note
                </button>
              </div>

              {(!job.notes || job.notes.length === 0) ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No notes recorded for this job yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {job.notes.map(n => (
                    <div key={n.id} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#93c5fd' }}>{n.author_name}</span>
                        <span>{n.created_at}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {n.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

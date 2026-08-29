'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { 
  Calendar, 
  CheckCircle2, 
  AlertOctagon, 
  Inbox, 
  Users, 
  Activity, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateToQueue: (filter?: { status?: string; unassigned?: boolean }) => void;
  onOpenAlerts: () => void;
}

export function DashboardView({
  stats,
  loading,
  onNavigateToQueue,
  onOpenAlerts,
}: DashboardViewProps) {
  if (loading || !stats) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading dispatch operations metrics...</p>
      </div>
    );
  }

  const maxCompleted = Math.max(...stats.completionHistory14Days.map(d => d.completedCount), 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Dispatch Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time field operations, technician workloads, and schedule health.
          </p>
        </div>
      </div>

      {/* Headline KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Jobs Scheduled Today */}
        <div 
          className="glass-panel" 
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => onNavigateToQueue()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Scheduled Today
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.25rem' }}>
                {stats.jobsScheduledToday}
              </div>
            </div>
            <div style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa'
            }}>
              <Calendar size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View today&apos;s queue <ArrowRight size={12} />
          </div>
        </div>

        {/* Jobs Completed Today */}
        <div 
          className="glass-panel" 
          style={{ padding: '1.25rem', cursor: 'pointer' }}
          onClick={() => onNavigateToQueue({ status: 'COMPLETED' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Completed Today
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                {stats.jobsCompletedToday}
              </div>
            </div>
            <div style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399'
            }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Verified with parts &amp; notes <ArrowRight size={12} />
          </div>
        </div>

        {/* Jobs Running Late */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            border: stats.jobsRunningLate > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : undefined,
            background: stats.jobsRunningLate > 0 ? 'rgba(244, 63, 94, 0.08)' : undefined,
          }}
          onClick={onOpenAlerts}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: stats.jobsRunningLate > 0 ? '#fb7185' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                Running Late
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: stats.jobsRunningLate > 0 ? '#f43f5e' : '#94a3b8', marginTop: '0.25rem' }}>
                {stats.jobsRunningLate}
              </div>
            </div>
            <div style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185'
            }}>
              <AlertOctagon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: stats.jobsRunningLate > 0 ? '#fca5a5' : 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {stats.jobsRunningLate > 0 ? 'Click to review late alerts' : 'All schedules on track'} <ArrowRight size={12} />
          </div>
        </div>

        {/* Unassigned Jobs */}
        <div 
          className="glass-panel" 
          style={{ padding: '1.25rem', cursor: 'pointer' }}
          onClick={() => onNavigateToQueue({ status: 'UNASSIGNED' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Unassigned Jobs
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                {stats.unassignedJobs}
              </div>
            </div>
            <div style={{
              padding: '0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24'
            }}>
              <Inbox size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Ready for dispatch assignment <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* 14-Day Completion Trend Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#3b82f6" />
              14-Day Completed Jobs Velocity
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Daily completed service jobs across all technicians.
            </p>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '0.65rem', paddingTop: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {stats.completionHistory14Days.map((item, idx) => {
            const heightPercent = Math.max(8, (item.completedCount / maxCompleted) * 100);
            const isToday = idx === stats.completionHistory14Days.length - 1;
            const dateLabel = item.date.slice(5); // MM-DD

            return (
              <div 
                key={item.date} 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  height: '100%', 
                  justifyContent: 'flex-end',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: item.completedCount > 0 ? '#34d399' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {item.completedCount}
                </div>
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${heightPercent}%`,
                    borderRadius: '4px 4px 0 0',
                    background: isToday 
                      ? 'linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)' 
                      : item.completedCount > 0 
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                    boxShadow: item.completedCount > 0 ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
                  }}
                  title={`${item.date}: ${item.completedCount} jobs completed`}
                />
                <div style={{ fontSize: '0.675rem', color: isToday ? '#60a5fa' : 'var(--text-muted)', marginTop: '0.4rem', fontWeight: isToday ? 700 : 400 }}>
                  {isToday ? 'Today' : dateLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Status Breakdown & Technician Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Status Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#8b5cf6" />
            Jobs Pipeline by Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { status: 'UNASSIGNED', label: 'Unassigned', count: stats.statusBreakdown.UNASSIGNED, color: '#94a3b8', badgeClass: 'badge-unassigned' },
              { status: 'ASSIGNED', label: 'Assigned', count: stats.statusBreakdown.ASSIGNED, color: '#3b82f6', badgeClass: 'badge-assigned' },
              { status: 'EN_ROUTE', label: 'En Route', count: stats.statusBreakdown.EN_ROUTE, color: '#f59e0b', badgeClass: 'badge-en-route' },
              { status: 'ON_SITE', label: 'On Site', count: stats.statusBreakdown.ON_SITE, color: '#8b5cf6', badgeClass: 'badge-on-site' },
              { status: 'COMPLETED', label: 'Completed', count: stats.statusBreakdown.COMPLETED, color: '#10b981', badgeClass: 'badge-completed' },
            ].map(item => (
              <div 
                key={item.status} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigateToQueue({ status: item.status })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className={`badge ${item.badgeClass}`}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: item.color }}>{item.count}</span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Workload Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#06b6d4" />
            Technician Workload
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th style={{ textAlign: 'center' }}>Total Assigned</th>
                  <th style={{ textAlign: 'center' }}>Active (In Field)</th>
                  <th style={{ textAlign: 'center' }}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {stats.technicianBreakdown.map(tech => (
                  <tr key={tech.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tech.name}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#60a5fa' }}>
                      {tech.assignedCount}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: tech.activeCount > 0 ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: tech.activeCount > 0 ? '#c4b5fd' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}>
                        {tech.activeCount}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#34d399' }}>
                      {tech.completedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

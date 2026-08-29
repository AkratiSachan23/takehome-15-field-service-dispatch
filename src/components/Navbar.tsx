'use client';

import React from 'react';
import { User } from '@/lib/types';
import { 
  Wrench, 
  LayoutDashboard, 
  ListOrdered, 
  AlertTriangle, 
  FileDown, 
  UserCheck, 
  LogOut, 
  PlusCircle, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'dashboard' | 'queue' | 'my-jobs';
  setActiveTab: (tab: 'dashboard' | 'queue' | 'my-jobs') => void;
  lateAlertCount: number;
  onOpenAlerts: () => void;
  onOpenCreateJob: () => void;
  onOpenExport: () => void;
  onQuickSwitchUser: (email: string) => void;
  onLogout: () => void;
}

export function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  lateAlertCount,
  onOpenAlerts,
  onOpenCreateJob,
  onOpenExport,
  onQuickSwitchUser,
  onLogout,
}: NavbarProps) {
  if (!currentUser) return null;

  const isDispatcher = currentUser.role === 'DISPATCHER';

  return (
    <header style={{
      background: 'rgba(18, 24, 36, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
              <Wrench size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                FieldFlow<span style={{ color: '#3b82f6' }}>Dispatch</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Field Service Operations Platform
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isDispatcher ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`btn btn-sm ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <ListOrdered size={16} />
                  Dispatch Queue
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('my-jobs')}
                className="btn btn-sm btn-primary"
              >
                <ClipboardList size={16} />
                My Assigned Jobs
              </button>
            )}
          </nav>
        </div>

        {/* Action Controls & User Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isDispatcher && (
            <>
              {/* Running Late Alerts Button */}
              <button
                onClick={onOpenAlerts}
                className="btn btn-sm btn-secondary"
                style={{
                  position: 'relative',
                  borderColor: lateAlertCount > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined,
                  background: lateAlertCount > 0 ? 'rgba(244, 63, 94, 0.12)' : undefined,
                  color: lateAlertCount > 0 ? '#fca5a5' : undefined,
                }}
                title="Running Late Alerts"
              >
                <AlertTriangle size={16} color={lateAlertCount > 0 ? '#fb7185' : 'currentColor'} />
                Alerts
                {lateAlertCount > 0 && (
                  <span style={{
                    background: '#f43f5e',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    marginLeft: '0.25rem',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.8)',
                  }}>
                    {lateAlertCount}
                  </span>
                )}
              </button>

              {/* Export CSV Button */}
              <button
                onClick={onOpenExport}
                className="btn btn-sm btn-secondary"
                title="Export Daily Dispatch Sheet"
              >
                <FileDown size={16} />
                Export Sheet
              </button>

              {/* Create Job Button */}
              <button
                onClick={onOpenCreateJob}
                className="btn btn-sm btn-success"
              >
                <PlusCircle size={16} />
                New Job
              </button>
            </>
          )}

          {/* Quick Account Switcher Helper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '0.4rem',
          }}>
            <Sparkles size={14} color="#38bdf8" />
            <select
              value={currentUser.email}
              onChange={(e) => onQuickSwitchUser(e.target.value)}
              className="form-select"
              style={{
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '175px',
              }}
              title="Switch demo user"
            >
              <optgroup label="Dispatchers">
                <option value="dispatcher@example.com">Sarah Jenkins (Lead Dispatcher)</option>
                <option value="dave@example.com">Dave Martinez (Dispatcher)</option>
              </optgroup>
              <optgroup label="Technicians">
                <option value="alex@example.com">Alex Rivera (HVAC Tech)</option>
                <option value="jordan@example.com">Jordan Lee (Plumber)</option>
                <option value="taylor@example.com">Taylor Smith (Appliance Tech)</option>
                <option value="casey@example.com">Casey Patel (Master Plumber)</option>
                <option value="morgan@example.com">Morgan Vance (AC Specialist)</option>
              </optgroup>
            </select>
          </div>

          {/* Current User Badge & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isDispatcher ? 'rgba(99, 102, 241, 0.18)' : 'rgba(16, 185, 129, 0.18)',
              color: isDispatcher ? '#a5b4fc' : '#6ee7b7',
              border: `1px solid ${isDispatcher ? 'rgba(99, 102, 241, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            }}>
              <UserCheck size={12} />
              {currentUser.role}
            </span>

            <button
              onClick={onLogout}
              className="btn btn-sm btn-secondary"
              title="Sign Out"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

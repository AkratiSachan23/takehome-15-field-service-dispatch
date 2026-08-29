'use client';

import React, { useState } from 'react';
import { Wrench, Shield, User, ArrowRight, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
            marginBottom: '1rem',
          }}>
            <Wrench size={26} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            FieldFlow<span style={{ color: '#3b82f6' }}>Dispatch</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Intelligent Field Service Dispatch &amp; Execution Platform
          </p>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            Quick Demo Sign In (1-Click Switch)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Dispatcher Demo */}
            <button
              type="button"
              onClick={() => handleLogin('dispatcher@example.com', 'dispatch123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Sarah Jenkins (Lead Dispatcher)
                </div>
                <div style={{ fontSize: '0.725rem', color: '#a5b4fc' }}>
                  Role: DISPATCHER &bull; Full control &amp; queue management
                </div>
              </div>
              <ArrowRight size={14} color="#a5b4fc" />
            </button>

            {/* Technician Demo 1 */}
            <button
              type="button"
              onClick={() => handleLogin('alex@example.com', 'tech123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Alex Rivera (HVAC Technician)
                </div>
                <div style={{ fontSize: '0.725rem', color: '#6ee7b7' }}>
                  Role: TECHNICIAN &bull; Assigned jobs, status lifecycle &amp; parts
                </div>
              </div>
              <ArrowRight size={14} color="#6ee7b7" />
            </button>

            {/* Technician Demo 2 */}
            <button
              type="button"
              onClick={() => handleLogin('jordan@example.com', 'tech123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Jordan Lee (Senior Plumber)
                </div>
                <div style={{ fontSize: '0.725rem', color: '#6ee7b7' }}>
                  Role: TECHNICIAN &bull; Field service execution flow
                </div>
              </div>
              <ArrowRight size={14} color="#6ee7b7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

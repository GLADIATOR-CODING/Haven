import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { KeyRound, AlertCircle, AtSign, ShieldCheck, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';

export default function JoinPage() {
  const { code: urlParam } = useParams();
  const { user, selectOrgSlug, refetchMe } = useAuth();
  const navigate = useNavigate();

  // Mode: 'member' (domain-based) or 'admin' (8-digit code)
  const isCodeLikelyAdmin = urlParam && urlParam.length >= 6 && urlParam === urlParam.toUpperCase();
  const [mode, setMode] = useState(isCodeLikelyAdmin ? 'admin' : 'member');

  const [adminCode, setAdminCode] = useState(isCodeLikelyAdmin ? urlParam : '');
  const [workspaceSlug, setWorkspaceSlug] = useState(!isCodeLikelyAdmin && urlParam ? urlParam.toLowerCase() : '');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const userEmailDomain = user?.email?.includes('@') ? user.email.split('@')[1] : null;

  const handleJoinAdmin = async (e) => {
    e.preventDefault();
    if (!adminCode.trim()) return;

    if (!user) {
      navigate(`/login?redirect=/join/${adminCode.trim().toUpperCase()}`);
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.post('/api/orgs/join', { code: adminCode.trim().toUpperCase() });
      await refetchMe();
      selectOrgSlug(res.org.slug);
      setSuccessMsg(`Joined ${res.org.name} as Administrator! Redirecting...`);
      setTimeout(() => {
        navigate(`/o/${res.org.slug}`);
      }, 900);
    } catch (err) {
      setError(err.message || 'Invalid or expired 8-digit admin access code.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMember = async (e) => {
    e.preventDefault();
    const targetSlug = workspaceSlug.trim().toLowerCase();
    if (!targetSlug) return;

    if (!user) {
      navigate(`/login?redirect=/join/${targetSlug}`);
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.post('/api/orgs/join', { slug: targetSlug });
      await refetchMe();
      selectOrgSlug(res.org.slug);
      setSuccessMsg(`Enrolled in ${res.org.name} as Member! Redirecting...`);
      setTimeout(() => {
        navigate(`/o/${res.org.slug}`);
      }, 900);
    } catch (err) {
      setError(err.message || 'Unable to join workspace. Ensure your email domain is authorized.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center mx-auto shadow-sm">
            {mode === 'admin' ? (
              <KeyRound className="w-5 h-5 text-red-500" />
            ) : (
              <Building2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Join a Haven Workspace
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Members join via authorized organization email; Admins use an 8-digit code.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('member');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'member'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <AtSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Member Join</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'admin'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-red-500" />
            <span>Admin Code</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: MEMBER JOIN BY WORKSPACE SLUG & DOMAIN */}
        {mode === 'member' && (
          <form onSubmit={handleJoinMember} className="space-y-4">
            {user && (
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">
                    Signed in as
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{user.email}</span>
                </div>
                {userEmailDomain && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    @{userEmailDomain}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Workspace URL / Identifier
              </label>
              <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xs overflow-hidden focus-within:border-[var(--border-strong)]">
                <span className="pl-3 pr-1 text-[var(--text-muted)] font-mono">/o/</span>
                <input
                  type="text"
                  required
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase())}
                  placeholder="demo-campus or your-workspace"
                  className="w-full py-2.5 pr-3 bg-transparent text-[var(--text-primary)] font-mono focus:outline-none font-medium"
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-snug">
                Your email domain must match the workspace's authorized domains (e.g.{' '}
                <span className="font-mono text-emerald-500">@bits-pilani.ac.in</span> or{' '}
                <span className="font-mono text-emerald-500">@sst.scaler.com</span>).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !workspaceSlug.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>
                {loading
                  ? 'Verifying email domain...'
                  : user
                  ? 'Join Workspace as Member'
                  : 'Sign In to Join Workspace'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Demo Workspaces */}
            <div className="pt-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] font-mono">
              DEMO SPACES:{' '}
              <button
                type="button"
                onClick={() => setWorkspaceSlug('demo-campus')}
                className="font-bold text-[var(--text-primary)] hover:underline"
              >
                demo-campus
              </button>{' '}
              /{' '}
              <button
                type="button"
                onClick={() => setWorkspaceSlug('demo-office')}
                className="font-bold text-[var(--text-primary)] hover:underline"
              >
                demo-office
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: ADMIN 8-DIGIT ACCESS CODE */}
        {mode === 'admin' && (
          <form onSubmit={handleJoinAdmin} className="space-y-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400 flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Administrator Access:</strong> Enter the confidential 8-digit access code generated during
                workspace creation to gain full Administrator control.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1 text-center font-mono">
                8-DIGIT ADMIN ACCESS CODE
              </label>
              <input
                type="text"
                required
                maxLength={12}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                placeholder="e.g. CAMPUS01"
                className="w-full text-center uppercase tracking-widest font-mono font-bold text-lg py-2.5 rounded-xl border border-red-500/30 bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !adminCode.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>
                {loading
                  ? 'Verifying admin code...'
                  : user
                  ? 'Claim Administrator Access'
                  : 'Sign in to Claim Access'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] font-mono">
              SEEDED ADMIN CODES:{' '}
              <button
                type="button"
                onClick={() => setAdminCode('CAMPUS01')}
                className="font-bold text-[var(--text-primary)] hover:underline"
              >
                CAMPUS01
              </button>{' '}
              /{' '}
              <button
                type="button"
                onClick={() => setAdminCode('OFFICE01')}
                className="font-bold text-[var(--text-primary)] hover:underline"
              >
                OFFICE01
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

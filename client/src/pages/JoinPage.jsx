import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { KeyRound, AlertCircle } from 'lucide-react';

export default function JoinPage() {
  const { code: urlCode } = useParams();
  const { user, selectOrgSlug, refetchMe } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(urlCode || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (!user) {
      navigate(`/login?redirect=/join/${code.trim().toUpperCase()}`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/orgs/join', { code: code.trim().toUpperCase() });
      await refetchMe();
      selectOrgSlug(res.org.slug);
      navigate(`/o/${res.org.slug}`);
    } catch (err) {
      setError(err.message || 'Invalid or expired invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center mx-auto">
            <KeyRound className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Join a Workspace
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Enter the access code provided by your organization.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1 text-center font-mono">
              INVITE ACCESS CODE
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CAMPUS or OFFICE"
              className="w-full text-center uppercase tracking-widest font-mono font-bold text-lg py-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-2.5 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
          >
            {loading ? 'Verifying code...' : user ? 'Join Workspace' : 'Sign in to Join'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] font-mono">
          SEEDED CODES: <span className="font-bold text-[var(--text-primary)]">CAMPUS</span> / <span className="font-bold text-[var(--text-primary)]">OFFICE</span>
        </div>
      </div>
    </div>
  );
}

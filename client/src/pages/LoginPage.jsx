import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      const res = await login({ email: demoEmail, password: 'Password123!' });
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center mx-auto">
            <Shield className="w-4 h-4 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Sign in to Haven
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Access your campus or organization lost and found workspace.
          </p>
        </div>

        {/* Demo Accounts Quick Login */}
        <div className="p-3.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between font-mono">
            <span>1-CLICK DEMO LOGIN</span>
            <span className="text-[10px] text-[var(--text-muted)]">Password: Password123!</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@haven.local')}
              className="px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium transition-colors text-left"
            >
              Admin (Campus Admin)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('mod@haven.local')}
              className="px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium transition-colors text-left"
            >
              Moderator (Desk)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('alex@haven.local')}
              className="px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium transition-colors text-left"
            >
              Member (Alex Rivera)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('sam@haven.local')}
              className="px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium transition-colors text-left"
            >
              Student (Sam Chen)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-subtle)] text-xs bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[var(--border-subtle)] text-xs bg-[var(--bg-page)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
          Don't have an account?{' '}
          <Link
            to={redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : '/signup'}
            className="font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

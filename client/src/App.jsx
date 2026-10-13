import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import JoinPage from './pages/JoinPage';
import CreateOrgPage from './pages/CreateOrgPage';
import OrgHomePage from './pages/OrgHomePage';
import ReportFoundPage from './pages/ReportFoundPage';
import {
  Shield,
  Clock,
  ArrowRight,
  X,
  Camera,
  Search,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  AsciiGhostMascot,
  FastReportIntake,
  AsciiLostScanner,
  NormalCustodyVault,
} from './components/AsciiGraphics';

/* Legal Modal for Terms of Service and Privacy Policy */
function LegalModal({ title, onClose, content }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md max-w-lg w-full p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2.5 max-h-80 overflow-y-auto">
          {content}
        </div>
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { user, memberships, currentOrgSlug } = useAuth();
  const [legalDoc, setLegalDoc] = useState(null);

  if (user && memberships.length > 0 && currentOrgSlug) {
    return <Navigate to={`/o/${currentOrgSlug}`} replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-block px-2.5 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
            LOST &amp; FOUND PLATFORM
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Lost and found software built for physical spaces.
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Universities, colleges, and workplaces lose thousands of personal items every semester.
            Haven replaces chaotic group chats with rapid photo reporting, deterministic attribute matching,
            and secure physical custody verification.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/orgs/new"
              className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
            >
              Create Workspace
            </Link>
            <Link
              to="/join"
              className="px-4 py-2 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold transition-colors"
            >
              Join with Access Code
            </Link>
          </div>
        </div>

        {/* Featured Hero Mascot Terminal */}
        <div className="lg:col-span-5">
          <AsciiGhostMascot hero />
        </div>
      </div>

      {/* Demo Workspaces Mount */}
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Explore Demo Workspaces
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Click to preview with pre-configured templates.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
            SEEDED DEMOS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-red-600 dark:text-red-400">
                UNIVERSITY BLUEPRINT
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Demo Campus University
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Configured for student cards, chargers, textbooks, and campus lecture halls.
              </p>
            </div>
            <div className="pt-4 mt-4 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">CODE: CAMPUS</span>
              <Link
                to="/join/CAMPUS"
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors shadow-sm"
              >
                Enter Campus
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-semibold text-red-600 dark:text-red-400">
                CORPORATE BLUEPRINT
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Demo Tech Park HQ
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Configured for security access badges, laptop docks, meeting rooms, and cafeteria.
              </p>
            </div>
            <div className="pt-4 mt-4 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">CODE: OFFICE</span>
              <Link
                to="/join/OFFICE"
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors shadow-sm"
              >
                Enter Office
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Core Operational Principles */}
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            How Haven Operates
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Designed for privacy, high speed, and verifiable physical custody.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between h-full">
            <FastReportIntake />
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-red-600 dark:text-red-400">01 / FAST REPORT</div>
              <div className="font-bold text-xs text-[var(--text-primary)]">Under 45 Seconds</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Finders select simple trait chips and snap a photo. EXIF location metadata is stripped automatically before upload.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between h-full">
            <AsciiLostScanner />
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-red-600 dark:text-red-400">02 / MATCHING</div>
              <div className="font-bold text-xs text-[var(--text-primary)]">Deterministic Engine</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Attributes like colors, category, occurrence window, and location zones are weighted deterministically without hallucination.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between h-full">
            <NormalCustodyVault />
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-red-600 dark:text-red-400">03 / HANDOVER</div>
              <div className="font-bold text-xs text-[var(--text-primary)]">Atomic Custody</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Claims lock atomically to prevent race conditions. Verification happens via challenge questions and a 6-digit pickup code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy and Terms of Service Modals */}
      {legalDoc === 'privacy' && (
        <LegalModal
          title="Privacy Policy"
          onClose={() => setLegalDoc(null)}
          content={
            <>
              <p>
                <strong>1. EXIF Metadata Protection:</strong> Haven automatically strips all GPS, device camera,
                and timestamp EXIF metadata from uploaded images client-side before transmission.
              </p>
              <p>
                <strong>2. Sensitive Item Masking:</strong> Sensitive assets such as student identity cards,
                keys, and wallets have private details hidden behind moderator review queues.
              </p>
              <p>
                <strong>3. Challenge Secrets:</strong> Verification criteria are stored using cryptographic HMAC
                digests rather than plain text.
              </p>
            </>
          }
        />
      )}

      {legalDoc === 'tos' && (
        <LegalModal
          title="Terms of Service"
          onClose={() => setLegalDoc(null)}
          content={
            <>
              <p>
                <strong>1. Workspace Custody:</strong> Haven provides matching software and custody logging for
                organizations. Physical storage and item handover remain under the jurisdiction of each workspace administrator.
              </p>
              <p>
                <strong>2. Verified Claims:</strong> Attempting fraudulent claims on property will result in
                immediate suspension and reporting to facility security.
              </p>
            </>
          }
        />
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <div>
          <span>Haven Platform</span>
          <span className="mx-2">·</span>
          <span>Physical custody and lost asset recovery</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLegalDoc('privacy')}
            className="hover:text-[var(--text-primary)] transition-colors underline-offset-2 hover:underline"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setLegalDoc('tos')}
            className="hover:text-[var(--text-primary)] transition-colors underline-offset-2 hover:underline"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { data: health, isLoading: healthLoading, isError: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/health'),
    retry: 2,
    refetchInterval: 30000,
  });

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col text-[var(--text-primary)] transition-colors duration-150">
        {healthLoading && (
          <div className="bg-neutral-900 text-white px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2">
            <Clock className="w-3 h-3 text-neutral-300 animate-spin" />
            <span>Connecting to backend services...</span>
          </div>
        )}

        {healthError && (
          <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-medium text-center">
            Backend server unreachable on port 5000.
          </div>
        )}

        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            <Route path="/orgs/new" element={<CreateOrgPage />} />
            <Route path="/o/:slug" element={<OrgHomePage />} />
            <Route path="/o/:slug/report/found" element={<ReportFoundPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

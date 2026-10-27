import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Lock,
  KeyRound,
  Check,
  X,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  HelpCircle,
  Send,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { NormalCustodyVault, AsciiGhostMascot } from '../components/AsciiGraphics';

const CANNED_REJECTIONS = [
  'Verification details do not match physical custody records.',
  'Secret identifier or serial number did not match.',
  'Property has already been claimed and collected by verified owner.',
  'Insufficient distinctive information provided to establish ownership.',
];

const CANNED_INFO_REQUESTS = [
  'Please provide additional details regarding any stickers, scratches, or engravings on the item.',
  'Please specify the serial number digits or passcode hint to verify ownership.',
  'Please describe the contents or accessories stored inside the item.',
];

export default function ModeratorWorkspacePage({ initialTab = null }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, memberships } = useAuth();

  // Active subtab: 'claims' | 'reports' | 'handover'
  const isHandoverRoute = location.pathname.endsWith('/handover') || initialTab === 'handover';
  const [activeTab, setActiveTab] = useState(isHandoverRoute ? 'handover' : 'claims');

  // Handover state
  const [handoverCode, setHandoverCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [handoverResult, setHandoverResult] = useState(null);
  const [handoverError, setHandoverError] = useState(null);

  // Review state
  const [processingClaimId, setProcessingClaimId] = useState(null);
  const [processingReportId, setProcessingReportId] = useState(null);
  const [modalAction, setModalAction] = useState(null); // { type: 'reject'|'request_info', claim: obj }
  const [customNote, setCustomNote] = useState('');
  const [actionError, setActionError] = useState(null);

  // 1. Fetch organization details
  const { data: orgData } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  const org = orgData?.org;
  const activeMembership = memberships.find((m) => m.orgSlug === slug);
  const isPrivileged = ['admin', 'moderator'].includes(activeMembership?.role);

  // 2. Fetch pending claims for desk review
  const {
    data: claimsData,
    isLoading: claimsLoading,
    refetch: refetchClaims,
  } = useQuery({
    queryKey: ['deskClaims', slug],
    queryFn: () => api.get(`/api/o/${slug}/claims`),
    enabled: !!isPrivileged,
    refetchInterval: 5000,
  });

  // 3. Fetch quarantined pending reports
  const {
    data: pendingReportsData,
    isLoading: reportsLoading,
    refetch: refetchPendingReports,
  } = useQuery({
    queryKey: ['pendingReports', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/found?status=pending_review`),
    enabled: !!isPrivileged,
    refetchInterval: 5000,
  });

  const claims = claimsData?.claims || [];
  const pendingReports = pendingReportsData?.reports || [];

  // Filter pending claims (submitted or needs_info)
  const pendingClaims = claims.filter((c) => ['submitted', 'needs_info'].includes(c.status));

  // Sync route
  useEffect(() => {
    if (location.pathname.endsWith('/handover')) {
      setActiveTab('handover');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!actionError) return undefined;
    const timer = window.setTimeout(() => setActionError(null), 4500);
    return () => window.clearTimeout(timer);
  }, [actionError]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'handover') {
      navigate(`/o/${slug}/moderation/handover`, { replace: true });
    } else {
      navigate(`/o/${slug}/moderation`, { replace: true });
    }
  };

  /* HANDOVER CODE SUBMISSION */
  const handleVerifyHandover = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = handoverCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) return;

    setVerifyingCode(true);
    setHandoverError(null);
    setHandoverResult(null);

    try {
      const res = await api.post(`/api/o/${slug}/claims/handover`, {
        handoverCode: cleanCode,
      });
      setHandoverResult(res);
      setHandoverCode('');
      await queryClient.invalidateQueries({ queryKey: ['deskClaims'] });
      await queryClient.invalidateQueries({ queryKey: ['deskClaimsQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['myClaims'] });
      await queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      await queryClient.invalidateQueries({ queryKey: ['foundFeedFiltered'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      setHandoverError(err.message || 'Invalid handover verification code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  /* CLAIM REVIEW ACTIONS (APPROVE, REJECT, REQUEST INFO) */
  const handleReviewClaim = async (claimId, action, decisionNote = '') => {
    setProcessingClaimId(claimId);
    setActionError(null);
    try {
      await api.patch(`/api/o/${slug}/claims/${claimId}/review`, {
        action,
        decisionNote,
      });
      setModalAction(null);
      setCustomNote('');
      await refetchClaims();
      await queryClient.invalidateQueries({ queryKey: ['deskClaims'] });
      await queryClient.invalidateQueries({ queryKey: ['deskClaimsQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['myClaims'] });
      await queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      await queryClient.invalidateQueries({ queryKey: ['foundFeedFiltered'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      setActionError(err.message || 'Failed to update claim.');
    } finally {
      setProcessingClaimId(null);
    }
  };

  /* PENDING INTAKE REPORT REVIEW (APPROVE TO FEED OR REJECT) */
  const handleReviewReport = async (reportId, action) => {
    setProcessingReportId(reportId);
    setActionError(null);
    try {
      await api.post(`/api/o/${slug}/reports/${reportId}/review`, { action });
      await refetchPendingReports();
      await queryClient.invalidateQueries({ queryKey: ['foundFeed'] });
      await queryClient.invalidateQueries({ queryKey: ['foundFeedFiltered'] });
      await queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
    } catch (err) {
      setActionError(err.message || 'Failed to review intake report.');
    } finally {
      setProcessingReportId(null);
    }
  };

  /* PERMISSION GUARD */
  if (orgData && !isPrivileged) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Custody Desk Station Restricted
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The Custody Desk moderation station and physical handover terminal are restricted to designated security desk staff, campus moderators, and workspace administrators.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/profile"
              className="py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold"
            >
              Apply for Custody Staff Role
            </Link>
            <Link
              to={`/o/${slug}`}
              className="py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Return to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8 w-full max-w-full overflow-hidden">
      {actionError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-700 shadow-sm dark:text-red-300">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="rounded p-1 hover:bg-red-500/10" aria-label="Dismiss error"><X className="h-4 w-4" /></button>
        </div>
      )}
      {/* Top Station Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/o/${slug}`}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{org?.name || 'Workspace'}</span>
            </Link>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase">
              CUSTODY DESK TERMINAL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-red-600 dark:text-red-400" />
            <span>Desk Moderation &amp; Handover</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Verify ownership challenge answers, approve quarantined property, and complete physical custody transfers.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{pendingClaims.length} Claims Queue</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>{pendingReports.length} Quarantined</span>
          </span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-[var(--border-subtle)] pb-2 overflow-x-auto min-w-0 max-w-full">
        <div className="flex items-center gap-2 text-xs font-semibold min-w-max">
          <button
            onClick={() => handleTabChange('claims')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono transition-all flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold shadow-xs'
                : 'bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Claims Review Queue ({pendingClaims.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold shadow-xs'
                : 'bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Pending Intake ({pendingReports.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('handover')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono transition-all flex items-center gap-2 ${
              activeTab === 'handover'
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Handover Desk Terminal</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CLAIMS QUEUE (Side-by-side Review Panel)             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          {pendingClaims.length === 0 ? (
            <div className="text-center py-20 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl p-8 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                Claims Review Queue Clear
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                No claims are currently awaiting moderator verification. Newly submitted claims on sensitive property will appear here with instant side-by-side verification answers.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
                <span>PRIORITY SORTED: Sensitive categories first · Oldest age first</span>
                <span>Target review speed: &lt; 20s</span>
              </div>

              {pendingClaims.map((claim) => {
                const isSensitive = claim.foundItem?.photoMasked || claim.foundItem?.isSensitive;

                return (
                  <div
                    key={claim.id}
                    className="border-2 border-[var(--border-subtle)] hover:border-neutral-400 dark:hover:border-neutral-700 bg-[var(--bg-card)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 transition-all"
                  >
                    {/* Header info bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isSensitive
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isSensitive ? 'SENSITIVE CATEGORY' : 'STANDARD CUSTODY'}
                        </span>

                        {/* Waiting Age Badge */}
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span>{claim.waitingAge || 'Waiting 1m'}</span>
                        </span>

                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {claim.foundItem?.title || `${claim.foundItem?.category} item`}
                        </span>
                      </div>

                      {/* Claimant Tag */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-[10px]">
                          {claim.claimant?.name?.[0] || 'C'}
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {claim.claimant?.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          ({claim.claimant?.email})
                        </span>
                      </div>
                    </div>

                    {/* SIDE-BY-SIDE REVIEW PANEL */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      {/* Left: Finder's Verification Details */}
                      <div className="md:col-span-5 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
                        <div className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-blue-500" />
                          <span>1. Finder's Custody Record:</span>
                        </div>

                        {claim.finderPrivateDetails?.length > 0 ? (
                          <div className="space-y-2">
                            {claim.finderPrivateDetails.map((fp, i) => (
                              <div key={i} className="text-xs space-y-0.5">
                                <span className="font-semibold text-[var(--text-primary)] block">
                                  {fp.label || fp.key}:
                                </span>
                                <span className="text-[var(--text-secondary)] font-mono text-[11px] bg-[var(--bg-card)] px-2 py-1 rounded block border border-[var(--border-subtle)]">
                                  {fp.value || '(No hint specified)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)] italic">
                            No secret verification prompts defined on category.
                          </div>
                        )}

                        <div className="text-[10px] text-[var(--text-muted)] pt-1">
                          Found at: <strong>{claim.foundItem?.location}</strong> · Category:{' '}
                          <strong>{claim.foundItem?.category}</strong>
                        </div>
                      </div>

                      {/* Middle: System Auto-Check Signals */}
                      <div className="md:col-span-2 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col justify-center items-center text-center space-y-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">
                          System Auto-Check
                        </span>

                        {claim.autoCheck && claim.autoCheck.length > 0 ? (
                          <div className="space-y-1.5 w-full">
                            {claim.autoCheck.map((ac, idx) => (
                              <div key={idx} className="w-full">
                                {ac.result === 'match' ? (
                                  <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                    <span>MATCH</span>
                                  </span>
                                ) : ac.result === 'needs_review' ? (
                                  <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>REVIEW</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center gap-1">
                                    <X className="w-3 h-3" />
                                    <span>NO MATCH</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            Auto-approved standard
                          </span>
                        )}
                      </div>

                      {/* Right: Claimant's Submitted Answers */}
                      <div className="md:col-span-5 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
                        <div className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                          <span>2. Claimant's Submitted Answers:</span>
                        </div>

                        {claim.answers && claim.answers.length > 0 ? (
                          <div className="space-y-2">
                            {claim.answers.map((ans, idx) => (
                              <div key={idx} className="text-xs space-y-0.5">
                                <span className="font-semibold text-[var(--text-primary)] block">
                                  {ans.label || ans.key}:
                                </span>
                                <span className="text-[var(--text-primary)] font-medium bg-[var(--bg-card)] px-2.5 py-1.5 rounded block border border-[var(--border-subtle)]">
                                  {ans.value || '(No answer provided)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)] italic">
                            No answers submitted.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Decision Bar */}
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-[var(--text-muted)] font-mono">
                        Claim ID: #{claim.id.slice(-8)}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Request Info Button */}
                        <button
                          type="button"
                          onClick={() => setModalAction({ type: 'request_info', claim })}
                          disabled={processingClaimId === claim.id}
                          className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Request Info</span>
                        </button>

                        {/* Reject Claim Button */}
                        <button
                          type="button"
                          onClick={() => setModalAction({ type: 'reject', claim })}
                          disabled={processingClaimId === claim.id}
                          className="px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject Claim</span>
                        </button>

                        {/* Approve Claim Button */}
                        <button
                          type="button"
                          onClick={() => handleReviewClaim(claim.id, 'approve', 'Approved by desk moderator')}
                          disabled={processingClaimId === claim.id}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{processingClaimId === claim.id ? 'Approving...' : 'Approve Claim'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: PENDING INTAKE REPORTS                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {pendingReports.length === 0 ? (
            <div className="text-center py-20 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl p-8 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                Quarantined Intake Clear
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                No sensitive items are currently quarantined awaiting intake review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReports.map((item) => (
                <div
                  key={item.id}
                  className="border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                        SENSITIVE INTAKE
                      </span>
                      <span className="text-[var(--text-muted)] font-mono text-[10px]">
                        {new Date(item.occurredFrom).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="h-32 rounded-xl bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-[var(--text-muted)] text-xs border border-amber-500/20 p-3 text-center">
                      <Lock className="w-6 h-6 mb-1 text-amber-500" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">
                        Photo &amp; sensitive traits quarantined
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                      {item.title || `${item.category} item`}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span>{item.locationZone || item.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleReviewReport(item.id, 'reject')}
                      disabled={processingReportId === item.id}
                      className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewReport(item.id, 'approve')}
                      disabled={processingReportId === item.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Approve to Feed</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: HANDOVER DESK TERMINAL                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'handover' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[var(--bg-card)] border-2 border-[var(--border-subtle)] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                PHYSICAL HANDOVER TERMINAL
              </span>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Enter Claimant Pickup Code
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Ask the claimant for their official single-use 6-digit handover code to verify ownership and complete custody release.
              </p>
            </div>

            {/* Error Display */}
            {handoverError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 shadow-xs text-left">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{handoverError}</span>
                </div>
                <button onClick={() => setHandoverError(null)} className="font-bold">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Receipt Display */}
            {handoverResult && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-left space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 stroke-[2.5]" />
                  <span>Custody Successfully Handed Over!</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-mono">Claimant:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {handoverResult.claim?.claimant?.name || 'Verified Owner'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-mono">Item:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {handoverResult.foundItem?.title || 'Found Property'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-mono">Status Transition:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Claim collected · Report handed_over
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                    <span>Audit Log ID:</span>
                    <span className="font-mono">{handoverResult.claim?.id?.slice(-12)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHandoverResult(null)}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
                >
                  Clear &amp; Ready for Next Handover
                </button>
              </div>
            )}

            {/* 6-Digit Code Input Form */}
            {!handoverResult && (
              <form onSubmit={handleVerifyHandover} className="space-y-5">
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={handoverCode}
                    onChange={(e) => setHandoverCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full py-4 text-center font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.4em] rounded-2xl border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                    Entering 5 consecutive invalid codes permanently locks the claim.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifyingCode || handoverCode.length !== 6}
                  className="w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingCode ? (
                    <span>Verifying Code &amp; Immutable Custody...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Verify &amp; Hand Over Property</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REJECT OR REQUEST INFO */}
      {modalAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                {modalAction.type === 'reject' ? (
                  <>
                    <X className="w-4 h-4 text-red-500" />
                    <span>Decline Claim on {modalAction.claim?.foundItem?.title}</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Request Information from {modalAction.claim?.claimant?.name}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setModalAction(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              {modalAction.type === 'reject'
                ? 'Select a canned reason or type a note. Declining will unlock the found item back to published so other claimants can claim it.'
                : 'Send a clarification request to the claimant. The claim status will transition to needs_info.'}
            </p>

            {/* Quick Canned Reasons Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                Quick Templates:
              </span>
              <div className="space-y-1">
                {(modalAction.type === 'reject' ? CANNED_REJECTIONS : CANNED_INFO_REQUESTS).map(
                  (cr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomNote(cr)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)]"
                    >
                      {cr}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Custom Note Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                {modalAction.type === 'reject' ? 'Rejection Reason Note' : 'Information Request Message'}
              </label>
              <textarea
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Type explanation or custom note..."
                className="w-full p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processingClaimId === modalAction.claim.id || !customNote.trim()}
                onClick={() =>
                  handleReviewClaim(
                    modalAction.claim.id,
                    modalAction.type === 'reject' ? 'reject' : 'request_info',
                    customNote.trim()
                  )
                }
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50 ${
                  modalAction.type === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {modalAction.type === 'reject' ? 'Confirm Rejection' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

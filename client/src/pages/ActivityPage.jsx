import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import MatchCard from '../components/MatchCard';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  ChevronRight,
  ArrowRight,
  X,
  Plus,
  Search,
  Building2,
  Shield,
  Layers,
  Inbox,
  Check,
  Copy,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { AsciiLostScanner, AsciiGhostMascot } from '../components/AsciiGraphics';

export default function ActivityPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'claims'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lost' | 'found'
  const [selectedReportForMatches, setSelectedReportForMatches] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: orgData } = useQuery({
    queryKey: ['orgConfig', slug],
    queryFn: () => api.get(`/api/o/${slug}`),
    retry: 1,
  });

  const { data: myData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['myReports', slug],
    queryFn: () => api.get(`/api/o/${slug}/reports/mine`),
    enabled: !!orgData,
  });

  const { data: claimsData, isLoading: claimsLoading, refetch: refetchClaims } = useQuery({
    queryKey: ['myClaims', slug],
    queryFn: () => api.get(`/api/o/${slug}/claims/mine`),
    enabled: !!orgData,
  });

  const [copiedClaimCode, setCopiedClaimCode] = useState(null);

  // Query matches for selected report
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['reportMatches', slug, selectedReportForMatches?.id],
    queryFn: () => api.get(`/api/o/${slug}/reports/${selectedReportForMatches.id}/matches`),
    enabled: !!selectedReportForMatches?.id,
  });

  const org = orgData?.org;
  const reports = myData?.reports || [];
  const matches = matchesData?.matches || [];
  const claims = claimsData?.claims || [];

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (filterType === 'lost') return r.type === 'lost';
    if (filterType === 'found') return r.type === 'found';
    return true;
  });

  const lostCount = reports.filter((r) => r.type === 'lost').length;
  const foundCount = reports.filter((r) => r.type === 'found').length;
  const activeMatchedCount = reports.filter((r) => r.status === 'matched').length;

  const handleResolveLost = async (reportId) => {
    setActionError(null);
    try {
      await api.patch(`/api/o/${slug}/reports/${reportId}/status`, { status: 'resolved' });
      await refetchReports();
      if (selectedReportForMatches?.id === reportId) {
        setSelectedReportForMatches(null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update report status.');
    }
  };

  const handleDismissMatch = async (matchId) => {
    try {
      await api.post(`/api/o/${slug}/reports/matches/${matchId}/dismiss`);
      queryClient.invalidateQueries(['reportMatches', slug, selectedReportForMatches?.id]);
    } catch (err) {
      console.error('Dismiss match failed', err);
    }
  };

  // Timeline render helper
  const renderTimeline = (report) => {
    const isFound = report.type === 'found';

    if (isFound) {
      const steps = [
        { key: 'submitted', label: 'Logged' },
        { key: 'pending_review', label: 'Review' },
        { key: 'published', label: 'Published' },
        { key: 'handed_over', label: 'Handed Over' },
      ];

      const getStepIndex = (st) => {
        if (st === 'pending_review') return 1;
        if (st === 'published' || st === 'claim_pending') return 2;
        if (st === 'handed_over') return 3;
        return 0;
      };

      const currentIndex = getStepIndex(report.status);

      return (
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {steps.map((st, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <React.Fragment key={st.key}>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    isCurrent
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {st.label}
                </div>
                {idx < steps.length - 1 && (
                  <span className="text-[var(--text-muted)] opacity-40">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // Lost report timeline
    const steps = [
      { key: 'open', label: 'Open' },
      { key: 'matched', label: 'Matched' },
      { key: 'resolved', label: 'Resolved' },
    ];

    const getLostIndex = (st) => {
      if (st === 'matched') return 1;
      if (st === 'resolved') return 2;
      return 0;
    };

    const currentIndex = getLostIndex(report.status);

    return (
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        {steps.map((st, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={st.key}>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  isCurrent
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {st.label}
              </div>
              {idx < steps.length - 1 && (
                <span className="text-[var(--text-muted)] opacity-40">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            MY ACTIVITY DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Activity &amp; Report History
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Track your open lost reports, logged found items, and correlate candidate matches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/o/${slug}/report/lost`}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-red-500" />
            <span>Report Lost</span>
          </Link>
          <Link
            to={`/o/${slug}/report/found`}
            className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs"
          >
            Log Found Item
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-600 dark:text-red-400 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs space-y-1">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Active Lost Reports
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{lostCount}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Continuously scanning workspace</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs space-y-1">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Logged Found Items
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{foundCount}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Deposited in verified custody</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs space-y-1">
          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-bold">
            Matches Correlated
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {activeMatchedCount}
          </div>
          <div className="text-[11px] text-emerald-600/90 dark:text-emerald-300">
            High-confidence radar hits
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          {/* Main Tabs: My Reports vs My Claims */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'reports'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Reports ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'claims'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Claims
            </button>
          </div>

          {/* Subfilter Chips for Reports */}
          {activeTab === 'reports' && (
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                  filterType === 'all'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('lost')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                  filterType === 'lost'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                }`}
              >
                Lost ({lostCount})
              </button>
              <button
                onClick={() => setFilterType('found')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                  filterType === 'found'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                }`}
              >
                Found ({foundCount})
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Reports List */}
        {activeTab === 'reports' ? (
          reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 skeleton-box rounded-xl" />
              ))}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const isLost = report.type === 'lost';
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] transition-all shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            isLost
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {report.type}
                        </span>

                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {report.category?.replace(/_/g, ' ')}
                        </span>

                        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.occurredFrom).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Visual Timeline Stepper */}
                      {renderTimeline(report)}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-[var(--text-primary)]">
                          {report.title || 'Reported Item'}
                        </h3>
                        {report.description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                            {report.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>{report.locationZone || report.location}</span>
                          </span>
                          {report.colors?.length > 0 && (
                            <span>Colors: {report.colors.join(', ')}</span>
                          )}
                          {report.brand && <span>Brand: {report.brand}</span>}
                        </div>
                      </div>

                      {/* Inline Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
                        {isLost && !isResolved && (
                          <>
                            <button
                              onClick={() => setSelectedReportForMatches(report)}
                              className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              <span>View Matches</span>
                            </button>

                            <button
                              onClick={() => handleResolveLost(report.id)}
                              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-emerald-500 text-xs font-semibold text-[var(--text-secondary)] hover:text-emerald-600 transition-colors"
                              title="Mark as found & resolved"
                            >
                              Mark Resolved
                            </button>
                          </>
                        )}

                        {!isLost && (
                          <Link
                            to={`/o/${slug}/feed`}
                            className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                          >
                            <span>View in Feed</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-center space-y-4 max-w-md mx-auto">
              <Inbox className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  No {filterType !== 'all' ? filterType : ''} reports found
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  You haven't logged any items in this category yet.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to={`/o/${slug}/report/lost`}
                  className="px-3 py-1.5 rounded-md bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)]"
                >
                  Report Lost
                </Link>
                <Link
                  to={`/o/${slug}/report/found`}
                  className="px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold"
                >
                  Report Found
                </Link>
              </div>
            </div>
          )
        ) : (
          /* Tab 2: My Claims */
          claimsLoading ? (
            <div className="flex items-center justify-center p-12 text-xs font-mono text-[var(--text-muted)] animate-pulse">
              FETCHING_CLAIMS_LOG...
            </div>
          ) : claims.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-center space-y-4 max-w-md mx-auto">
              <Shield className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  No Active Claims
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  When you initiate a claim on a matching item from the Feed or Match recommendations, your verification questions and 6-digit handover codes appear here.
                </p>
              </div>
              <Link
                to={`/o/${slug}/feed`}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-bold inline-block hover:opacity-90 transition-opacity"
              >
                Browse Found Feed to Claim
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const item = claim.foundItem || {};
                const isApproved = claim.status === 'approved';
                const isUnderReview = claim.status === 'submitted';
                const isNeedsInfo = claim.status === 'needs_info';
                const isCollected = claim.status === 'collected';
                const isRejected = claim.status === 'rejected';

                return (
                  <div
                    key={claim.id}
                    className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]/40 transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden shrink-0">
                          {item.photoMasked ? (
                            <div className="flex flex-col items-center justify-center text-center p-1 text-[var(--text-muted)]">
                              <EyeOff className="w-4 h-4 mb-0.5 text-amber-500" />
                              <span className="text-[9px] font-mono leading-none">MASKED</span>
                            </div>
                          ) : item.photos && item.photos[0] ? (
                            <img
                              src={item.photos[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                              {item.title || 'Found Item'}
                            </span>
                            {item.category && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                            {item.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                                {item.zone}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
                              <Clock className="w-3 h-3" />
                              Claimed {new Date(claim.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="self-start sm:self-center">
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            APPROVED
                          </span>
                        )}
                        {isUnderReview && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            UNDER_REVIEW
                          </span>
                        )}
                        {isNeedsInfo && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            INFO_REQUESTED
                          </span>
                        )}
                        {isCollected && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-neutral-500/10 text-[var(--text-muted)] border border-neutral-500/20 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            COLLECTED
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            REJECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Handover Code Card if Approved */}
                    {isApproved && claim.handoverCode && (
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Verification Handover Code</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            Present this 6-digit code at the campus reception desk to complete pickup.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-black tracking-widest text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-3.5 py-1.5 rounded-md border border-emerald-500/30">
                            {claim.handoverCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(claim.handoverCode);
                              setCopiedClaimCode(claim.id);
                              setTimeout(() => setCopiedClaimCode(null), 2000);
                            }}
                            className="p-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors"
                            title="Copy handover code"
                          >
                            {copiedClaimCode === claim.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Under Review Notice */}
                    {isUnderReview && (
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Your claim responses are locked and queued for administrator inspection. You'll receive a handover code as soon as approved.
                        </span>
                      </div>
                    )}

                    {/* Decision Note if provided */}
                    {claim.decisionNote && (
                      <p className="text-[11px] font-mono text-[var(--text-muted)] italic">
                        Note: {claim.decisionNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Matches Drawer / Modal */}
      {selectedReportForMatches && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Matches for {selectedReportForMatches.title}</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Deterministic attribute scoring against published found reports.
                </p>
              </div>
              <button
                onClick={() => setSelectedReportForMatches(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {matchesLoading ? (
              <div className="space-y-3">
                <div className="h-32 skeleton-box rounded-xl" />
                <div className="h-32 skeleton-box rounded-xl" />
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    orgSlug={slug}
                    onDismiss={handleDismissMatch}
                    showClaimButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <AsciiLostScanner />
                <div className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  No matching found items currently meet the sensitivity threshold. The radar engine
                  runs continuously on every new report.
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReportForMatches(null)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
